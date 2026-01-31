import { execa, type ExecaError } from 'execa';
import path from 'path';
import fs from 'fs-extra';
import { createServiceLogger } from '../utils/logger.js';
import { writeTempContent, removeTempFile } from './filesystem.service.js';

const logger = createServiceLogger('wordpress');
const PLUGIN_CACHE_DIR = path.join(process.cwd(), 'data', 'plugin-cache');
const PLUGIN_CACHE_FILE = path.join(PLUGIN_CACHE_DIR, 'versions.json');

interface WpCliOptions {
  sitePath: string;
  cwd?: string;
}

/**
 * Execute a WP-CLI command with proper configuration
 */
/**
 * Execute WP-CLI command
 * Exported for use in other services when needed
 */
export async function wpCli(
  args: string[],
  options: WpCliOptions,
  stdin?: string
): Promise<{ stdout: string; stderr: string }> {
  // Prefer Homebrew PHP, then XAMPP, then system PHP
  let phpPath = process.env.PHP_PATH || process.env.WP_CLI_PHP;
  if (!phpPath) {
    const homebrewPhp = '/opt/homebrew/bin/php';
    const xamppPhpPath = '/Applications/XAMPP/xamppfiles/bin/php';
    if (fs.pathExistsSync(homebrewPhp)) {
      phpPath = homebrewPhp;
    } else if (fs.pathExistsSync(xamppPhpPath)) {
      phpPath = xamppPhpPath;
    } else {
      phpPath = 'php'; // Use system PHP
    }
  }
  
  const wpCliPath = process.env.WPCLI_PATH || 'wp';
  const fullArgs = [
    '-d', 'memory_limit=512M',  // Set memory limit directly
    wpCliPath,
    ...args,
    `--path=${options.sitePath}`
  ];

  // Add Homebrew binaries to PATH first, then XAMPP if available
  const homebrewBinPath = '/opt/homebrew/bin';
  const xamppBinPath = '/Applications/XAMPP/xamppfiles/bin';
  const currentPath = process.env.PATH || '';
  let enhancedPath = currentPath;
  if (fs.pathExistsSync(homebrewBinPath)) {
    enhancedPath = `${homebrewBinPath}:${enhancedPath}`;
  }
  if (fs.pathExistsSync(xamppBinPath)) {
    enhancedPath = `${xamppBinPath}:${enhancedPath}`;
  }

  logger.info({ 
    command: 'php', 
    args: fullArgs,
    hasStdin: Boolean(stdin)
  }, 'Executing WP-CLI via PHP with memory limit');

  try {
    const result = await execa(phpPath, fullArgs, {
      cwd: options.cwd || options.sitePath,
      shell: false,
      timeout: 120000, // 2 minute timeout
      input: stdin,
      env: {
        ...process.env,
        PATH: enhancedPath,
      },
    });

    return { stdout: result.stdout, stderr: result.stderr };
  } catch (err) {
    const execaErr = err as ExecaError;
    logger.error(
      {
        command: 'php',
        args: fullArgs,
        exitCode: execaErr.exitCode,
        stderr: execaErr.stderr,
      },
      'WP-CLI command failed'
    );
    throw new Error(`WP-CLI failed: ${execaErr.stderr || execaErr.message}`);
  }
}

function loadPluginCache(): Record<string, string> {
  try {
    if (!fs.existsSync(PLUGIN_CACHE_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(PLUGIN_CACHE_FILE, 'utf8');
    return JSON.parse(raw) as Record<string, string>;
  } catch (err) {
    logger.warn({ err }, 'Failed to read plugin cache file');
    return {};
  }
}

function savePluginCache(cache: Record<string, string>): void {
  try {
    fs.ensureDirSync(PLUGIN_CACHE_DIR);
    fs.writeFileSync(PLUGIN_CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    logger.warn({ err }, 'Failed to write plugin cache file');
  }
}

async function getLatestPluginVersion(sitePath: string, plugin: string): Promise<string> {
  const { stdout } = await wpCli(['plugin', 'info', plugin, '--field=version', '--skip-plugins', '--skip-themes'], {
    sitePath,
  });
  return stdout.trim();
}

async function ensurePluginCached(sitePath: string, plugin: string): Promise<{ zipPath: string; version: string }> {
  fs.ensureDirSync(PLUGIN_CACHE_DIR);
  const cache = loadPluginCache();
  const zipPath = path.join(PLUGIN_CACHE_DIR, `${plugin}.zip`);

  let latestVersion = cache[plugin];
  try {
    latestVersion = await getLatestPluginVersion(sitePath, plugin);
  } catch (err) {
    logger.warn({ plugin, err }, 'Failed to fetch latest plugin version');
  }

  const cachedVersion = cache[plugin];
  const needsDownload = !latestVersion || cachedVersion !== latestVersion || !fs.existsSync(zipPath);

  if (needsDownload) {
    try {
      const downloadArgs = ['plugin', 'download', plugin, '--force'];
      if (latestVersion) {
        downloadArgs.push(`--version=${latestVersion}`);
      }
      await wpCli(downloadArgs, { sitePath, cwd: PLUGIN_CACHE_DIR });
      if (latestVersion) {
        cache[plugin] = latestVersion;
        savePluginCache(cache);
      }
      logger.info({ plugin, version: latestVersion || 'latest' }, 'Plugin cached');
    } catch (err) {
      if (!fs.existsSync(zipPath)) {
        throw err;
      }
      logger.warn({ plugin, err }, 'Failed to update plugin cache, using existing zip');
    }
  }

  return { zipPath, version: cache[plugin] || latestVersion || 'unknown' };
}

/**
 * Download WordPress core
 */
export async function downloadWordPress(sitePath: string, locale: string = 'en_US'): Promise<void> {
  await wpCli(['core', 'download', `--locale=${locale}`], { sitePath });
  logger.info({ sitePath }, 'WordPress core downloaded');
}

/**
 * Create wp-config.php
 * Optimized to use MySQL socket instead of TCP for 10x faster database operations
 */
export async function createConfig(
  sitePath: string,
  config: {
    dbName: string;
    dbUser: string;
    dbPassword: string;
    dbHost: string;
  }
): Promise<void> {
  // Use MySQL socket path instead of localhost:3306 to avoid TCP/DNS overhead
  // This reduces each database query from ~6-30 seconds to milliseconds
  let dbHost = config.dbHost;
  const mysqlSocketPath = '/tmp/mysql.sock';
  
  if (fs.pathExistsSync(mysqlSocketPath)) {
    // Use socket instead of localhost:3306
    dbHost = `localhost:${mysqlSocketPath}`;
    logger.info({ sitePath, socketPath: mysqlSocketPath }, 'Using MySQL socket for optimal performance');
  }
  
  await wpCli(
    [
      'config',
      'create',
      `--dbname=${config.dbName}`,
      `--dbuser=${config.dbUser}`,
      `--dbpass=${config.dbPassword}`,
      `--dbhost=${dbHost}`,
    ],
    { sitePath }
  );
  
  // Add performance optimizations to wp-config.php
  const wpConfigPath = path.join(sitePath, 'wp-config.php');
  if (await fs.pathExists(wpConfigPath)) {
    let wpConfig = await fs.readFile(wpConfigPath, 'utf-8');
    
    // Find the line with "/* That's all, stop editing!" and insert before it
    const performanceConfig = `
// Performance optimizations (auto-generated)
define('WP_CACHE', true);
define('CONCATENATE_SCRIPTS', false);
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');

`;
    
    wpConfig = wpConfig.replace(
      /\/\* That's all, stop editing!/,
      performanceConfig + "/* That's all, stop editing!"
    );
    
    await fs.writeFile(wpConfigPath, wpConfig, 'utf-8');
    logger.info({ sitePath }, 'Added performance optimizations to wp-config.php');
  }
  
  logger.info({ sitePath, dbName: config.dbName }, 'WordPress config created with performance optimizations');
}

/**
 * Create the database using WP-CLI
 */
export async function createDatabase(sitePath: string): Promise<void> {
  await wpCli(['db', 'create'], { sitePath });
  logger.info({ sitePath }, 'WordPress database created via WP-CLI');
}

/**
 * Install WordPress core
 */
export async function installCore(
  sitePath: string,
  config: {
    url: string;
    title: string;
    adminUser: string;
    adminPassword: string;
    adminEmail: string;
  }
): Promise<void> {
  await wpCli(
    [
      'core',
      'install',
      `--url=${config.url}`,
      `--title=${config.title}`,
      `--admin_user=${config.adminUser}`,
      `--admin_password=${config.adminPassword}`,
      `--admin_email=${config.adminEmail}`,
      '--skip-email',
    ],
    { sitePath }
  );
  logger.info({ sitePath, url: config.url }, 'WordPress core installed');
}

/**
 * Install and activate a theme
 */
export async function installTheme(sitePath: string, theme: string): Promise<void> {
  await wpCli(['theme', 'install', theme, '--activate'], { sitePath });
  logger.info({ sitePath, theme }, 'Theme installed and activated');
}

export interface PluginInstallResult {
  installed: string[];
  failed: string[];
}

/**
 * Install a single plugin, trying cache first, then direct install as fallback
 */
async function installSinglePlugin(sitePath: string, plugin: string): Promise<boolean> {
  // Skip caching mechanism entirely - just install directly
  // The caching logic uses unsupported WP-CLI subcommands and adds unnecessary overhead
  try {
    await wpCli(['plugin', 'install', plugin, '--activate'], { sitePath });
    logger.info({ sitePath, plugin }, 'Plugin installed from WordPress.org');
    return true;
  } catch (error) {
    logger.error({ sitePath, plugin, error }, 'Plugin installation failed');
    return false;
  }
}

/**
 * Install and activate plugins
 * Installs plugins one at a time to handle failures gracefully
 * Returns arrays of installed and failed plugins for validation
 */
export async function installPlugins(sitePath: string, plugins: string[]): Promise<PluginInstallResult> {
  const result: PluginInstallResult = { installed: [], failed: [] };
  if (plugins.length === 0) return result;

  for (const plugin of plugins) {
    const success = await installSinglePlugin(sitePath, plugin);
    if (success) {
      result.installed.push(plugin);
    } else {
      result.failed.push(plugin);
    }
  }

  if (result.failed.length > 0) {
    logger.warn({ sitePath, failed: result.failed, installed: result.installed }, 'Some plugins failed to install');
  }
  
  logger.info({ sitePath, installed: result.installed, failed: result.failed }, 'Plugin installation complete');
  return result;
}

/**
 * Verify that required plugins are installed and active
 */
export async function verifyRequiredPlugins(sitePath: string, requiredPlugins: string[]): Promise<void> {
  for (const plugin of requiredPlugins) {
    try {
      await wpCli(['plugin', 'is-active', plugin], { sitePath });
      logger.info({ sitePath, plugin }, 'Required plugin verified active');
    } catch (error) {
      throw new Error(`Required plugin '${plugin}' is not active. E-commerce site generation cannot continue.`);
    }
  }
}

/**
 * Create a page with content
 * Uses file-based content for security (no shell injection)
 */
export async function createPage(
  sitePath: string,
  config: {
    title: string;
    content: string;
    status?: 'publish' | 'draft';
  }
): Promise<number> {
  // Write content to temp file to avoid shell injection
  const tempFile = await writeTempContent(config.content, 'page');

  try {
    const { stdout } = await wpCli(
      [
        'post',
        'create',
        tempFile,
        '--post_type=page',
        `--post_title=${config.title}`,
        `--post_status=${config.status || 'publish'}`,
        '--porcelain',
      ],
      { sitePath }
    );

    const pageId = parseInt(stdout.trim(), 10);
    logger.info({ sitePath, title: config.title, pageId }, 'Page created');
    return pageId;
  } finally {
    // Clean up temp file
    await removeTempFile(tempFile);
  }
}

/**
 * Create a post with content
 */
export async function createPost(
  sitePath: string,
  config: {
    title: string;
    content: string;
    status?: 'publish' | 'draft';
  }
): Promise<number> {
  const tempFile = await writeTempContent(config.content, 'post');

  try {
    const { stdout } = await wpCli(
      [
        'post',
        'create',
        tempFile,
        '--post_type=post',
        `--post_title=${config.title}`,
        `--post_status=${config.status || 'publish'}`,
        '--porcelain',
      ],
      { sitePath }
    );

    const postId = parseInt(stdout.trim(), 10);
    logger.info({ sitePath, title: config.title, postId }, 'Post created');
    return postId;
  } finally {
    await removeTempFile(tempFile);
  }
}

/**
 * Set the homepage (front page)
 */
export async function setHomepage(sitePath: string, pageId: number): Promise<void> {
  await wpCli(['option', 'update', 'show_on_front', 'page'], { sitePath });
  await wpCli(['option', 'update', 'page_on_front', pageId.toString()], { sitePath });
  logger.info({ sitePath, pageId }, 'Homepage set');
}

/**
 * Update site options
 */
export async function updateOption(sitePath: string, option: string, value: string): Promise<void> {
  await wpCli(['option', 'update', option, value], { sitePath });
  logger.info({ sitePath, option }, 'Option updated');
}

/**
 * Get WordPress version
 */
export async function getVersion(sitePath: string): Promise<string> {
  const { stdout } = await wpCli(['core', 'version'], { sitePath });
  return stdout.trim();
}

/**
 * Check if WordPress is installed
 */
export async function isInstalled(sitePath: string): Promise<boolean> {
  try {
    await wpCli(['core', 'is-installed'], { sitePath });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete all posts and pages (for cleanup)
 */
export async function deleteAllContent(sitePath: string): Promise<void> {
  try {
    // Delete all posts
    await wpCli(['post', 'delete', '$(wp post list --post_type=post --format=ids)', '--force'], { sitePath });
    // Delete all pages except front page
    await wpCli(['post', 'delete', '$(wp post list --post_type=page --format=ids)', '--force'], { sitePath });
  } catch {
    // Ignore errors if no content exists
  }
  logger.info({ sitePath }, 'All content deleted');
}

/**
 * Flush rewrite rules and ensure .htaccess exists
 */
export async function flushRewriteRules(sitePath: string): Promise<void> {
  await wpCli(['rewrite', 'flush', '--hard'], { sitePath });
  
  // For subdirectory installations (like /site-name/), we need to manually create .htaccess
  // because Apache may not have AllowOverride enabled or wp-cli can't write it
  const htaccessPath = path.join(sitePath, '.htaccess');
  const siteName = path.basename(sitePath);
  
  if (!fs.existsSync(htaccessPath)) {
    const htaccessContent = `# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /${siteName}/
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /${siteName}/index.php [L]
</IfModule>
# END WordPress
`;
    
    try {
      fs.writeFileSync(htaccessPath, htaccessContent);
      logger.info({ sitePath, htaccessPath }, '.htaccess file created manually');
    } catch (err) {
      logger.warn({ sitePath, err }, 'Failed to create .htaccess file');
    }
  }
  
  logger.info({ sitePath }, 'Rewrite rules flushed');
}

/**
 * Create a navigation menu and assign it to a location
 */
export async function createMenu(
  sitePath: string,
  menuName: string,
  location: string
): Promise<number> {
  const { stdout } = await wpCli(['menu', 'create', menuName, '--porcelain'], { sitePath });
  const menuId = parseInt(stdout.trim(), 10);
  
  // Assign menu to location
  await wpCli(['menu', 'location', 'assign', String(menuId), location], { sitePath });
  
  logger.info({ sitePath, menuName, menuId, location }, 'Menu created and assigned');
  return menuId;
}

/**
 * Add a page to a menu
 */
export async function addPageToMenu(
  sitePath: string,
  menuId: number,
  pageId: number,
  parentId?: number
): Promise<void> {
  const args = ['menu', 'item', 'add-post', String(menuId), String(pageId)];
  
  if (parentId) {
    args.push(`--parent-id=${parentId}`);
  }
  
  await wpCli(args, { sitePath });
  logger.debug({ sitePath, menuId, pageId, parentId }, 'Page added to menu');
}

/**
 * Get available menu locations for the active theme
 */
export async function getMenuLocations(sitePath: string): Promise<string[]> {
  try {
    const { stdout } = await wpCli(['menu', 'location', 'list', '--format=csv', '--fields=location'], { sitePath });
    const locations = stdout
      .split('\n')
      .slice(1) // Skip header
      .map(line => line.trim())
      .filter(Boolean);
    return locations;
  } catch (err) {
    logger.warn({ sitePath, err }, 'Failed to get menu locations, using default');
    return ['primary'];
  }
}

/**
 * Get WooCommerce page IDs (Shop, Cart, Checkout, My Account)
 */
export async function getWooCommercePageIds(sitePath: string): Promise<{
  shop?: number;
  cart?: number;
  checkout?: number;
  myAccount?: number;
}> {
  const pageIds: { shop?: number; cart?: number; checkout?: number; myAccount?: number } = {};
  
  try {
    // Get Shop page ID
    const { stdout: shopId } = await wpCli(['option', 'get', 'woocommerce_shop_page_id'], { sitePath });
    pageIds.shop = parseInt(shopId.trim(), 10);
  } catch {}
  
  try {
    // Get Cart page ID
    const { stdout: cartId } = await wpCli(['option', 'get', 'woocommerce_cart_page_id'], { sitePath });
    pageIds.cart = parseInt(cartId.trim(), 10);
  } catch {}
  
  try {
    // Get Checkout page ID
    const { stdout: checkoutId } = await wpCli(['option', 'get', 'woocommerce_checkout_page_id'], { sitePath });
    pageIds.checkout = parseInt(checkoutId.trim(), 10);
  } catch {}
  
  try {
    // Get My Account page ID
    const { stdout: accountId } = await wpCli(['option', 'get', 'woocommerce_myaccount_page_id'], { sitePath });
    pageIds.myAccount = parseInt(accountId.trim(), 10);
  } catch {}
  
  return pageIds;
}

/**
 * Add WooCommerce pages to an existing menu
 */
export async function addWooCommercePagesToMenu(sitePath: string, menuId: number): Promise<void> {
  const wcPageIds = await getWooCommercePageIds(sitePath);
  
  // Add Shop page (most important for e-commerce)
  if (wcPageIds.shop && !isNaN(wcPageIds.shop)) {
    try {
      await addPageToMenu(sitePath, menuId, wcPageIds.shop);
      logger.info({ sitePath, menuId, pageId: wcPageIds.shop }, 'Shop page added to menu');
    } catch (err) {
      logger.warn({ sitePath, menuId, err }, 'Failed to add Shop page to menu');
    }
  }
  
  // Add Cart page
  if (wcPageIds.cart && !isNaN(wcPageIds.cart)) {
    try {
      await addPageToMenu(sitePath, menuId, wcPageIds.cart);
      logger.info({ sitePath, menuId, pageId: wcPageIds.cart }, 'Cart page added to menu');
    } catch (err) {
      logger.warn({ sitePath, menuId, err }, 'Failed to add Cart page to menu');
    }
  }
  
  // Add My Account page (important for customer login)
  if (wcPageIds.myAccount && !isNaN(wcPageIds.myAccount)) {
    try {
      await addPageToMenu(sitePath, menuId, wcPageIds.myAccount);
      logger.info({ sitePath, menuId, pageId: wcPageIds.myAccount }, 'My Account page added to menu');
    } catch (err) {
      logger.warn({ sitePath, menuId, err }, 'Failed to add My Account page to menu');
    }
  }
  
  logger.info({ sitePath, menuId }, 'WooCommerce pages added to menu');
}

// ============================================================================
// WooCommerce Setup Functions
// ============================================================================

/**
 * Check if WooCommerce CLI (wc) commands are available
 */
export async function isWcCliAvailable(sitePath: string): Promise<boolean> {
  try {
    await wpCli(['wc', '--info'], { sitePath });
    return true;
  } catch {
    logger.warn({ sitePath }, 'WC-CLI not available, will use fallback methods');
    return false;
  }
}

/**
 * WooCommerce page definitions with their shortcodes
 */
const WOOCOMMERCE_PAGES = [
  { title: 'Shop', slug: 'shop', content: '', option: 'woocommerce_shop_page_id' },
  { title: 'Cart', slug: 'cart', content: '[woocommerce_cart]', option: 'woocommerce_cart_page_id' },
  { title: 'Checkout', slug: 'checkout', content: '[woocommerce_checkout]', option: 'woocommerce_checkout_page_id' },
  { title: 'My Account', slug: 'my-account', content: '[woocommerce_my_account]', option: 'woocommerce_myaccount_page_id' },
];

/**
 * Install WooCommerce pages (Shop, Cart, Checkout, My Account)
 * Uses WC-CLI if available, otherwise creates pages manually with shortcodes
 */
export async function setupWooCommercePages(sitePath: string): Promise<void> {
  const wcCliAvailable = await isWcCliAvailable(sitePath);
  
  if (wcCliAvailable) {
    // Use WC-CLI tool to install pages (creates any missing ones)
    try {
      await wpCli(['wc', 'tool', 'run', 'install_pages', '--user=admin'], { sitePath });
      logger.info({ sitePath }, 'WooCommerce pages installed via WC-CLI');
      return;
    } catch (err) {
      logger.warn({ sitePath, err }, 'WC-CLI install_pages failed, falling back to manual creation');
    }
  }
  
  // Fallback: Create pages manually with shortcodes
  for (const page of WOOCOMMERCE_PAGES) {
    try {
      // Check if page already exists
      const { stdout: existingId } = await wpCli(
        ['post', 'list', '--post_type=page', `--name=${page.slug}`, '--format=ids'],
        { sitePath }
      );
      
      if (existingId.trim()) {
        // Page exists, just ensure the option is set
        await wpCli(['option', 'update', page.option, existingId.trim()], { sitePath });
        logger.info({ sitePath, page: page.title, pageId: existingId.trim() }, 'WooCommerce page already exists');
        continue;
      }
      
      // Create the page
      const pageId = await createPage(sitePath, {
        title: page.title,
        content: page.content,
        status: 'publish',
      });
      
      // Set the WooCommerce option to point to this page
      await wpCli(['option', 'update', page.option, pageId.toString()], { sitePath });
      logger.info({ sitePath, page: page.title, pageId }, 'WooCommerce page created');
    } catch (err) {
      logger.warn({ sitePath, page: page.title, err }, 'Failed to create WooCommerce page');
    }
  }
  
  logger.info({ sitePath }, 'WooCommerce pages setup complete');
}

/**
 * Disable WooCommerce onboarding wizard and admin notices
 * This creates a cleaner admin experience on first login
 * Optimized: Only sets critical options to reduce setup time
 */
export async function disableWooCommerceOnboarding(sitePath: string): Promise<void> {
  // Reduced to only essential options to minimize WP-CLI calls
  const optionsToSet = [
    // Skip the onboarding wizard (most important)
    { option: 'woocommerce_onboarding_profile', value: 'a:1:{s:7:"skipped";b:1;}' },
    // Disable marketplace suggestions
    { option: 'woocommerce_show_marketplace_suggestions', value: 'no' },
    // Disable tracking
    { option: 'woocommerce_allow_tracking', value: 'no' },
  ];
  
  for (const { option, value } of optionsToSet) {
    try {
      await wpCli(['option', 'update', option, value], { sitePath });
    } catch (err) {
      // Some options might not exist yet, that's okay
      logger.debug({ sitePath, option, err }, 'Could not set WooCommerce option');
    }
  }
  
  logger.info({ sitePath }, 'WooCommerce onboarding disabled');
}

/**
 * Configure basic WooCommerce defaults
 * Optimized: Only sets essential options to reduce setup time
 */
export async function configureWooCommerceDefaults(sitePath: string): Promise<void> {
  // Reduced to only essential options to minimize WP-CLI calls
  const defaults = [
    // Currency (USD by default)
    { option: 'woocommerce_currency', value: 'USD' },
    // Enable guest checkout (important for usability)
    { option: 'woocommerce_enable_guest_checkout', value: 'yes' },
    // Default country (US)
    { option: 'woocommerce_default_country', value: 'US' },
  ];
  
  for (const { option, value } of defaults) {
    try {
      await wpCli(['option', 'update', option, value], { sitePath });
    } catch (err) {
      logger.debug({ sitePath, option, err }, 'Could not set WooCommerce default');
    }
  }
  
  logger.info({ sitePath }, 'WooCommerce defaults configured');
}

/**
 * Set permalinks to "Post name" structure (required for WooCommerce)
 */
export async function setPermalinks(sitePath: string): Promise<void> {
  await wpCli(['rewrite', 'structure', '/%postname%/'], { sitePath });
  await flushRewriteRules(sitePath);
  logger.info({ sitePath }, 'Permalinks set to post name structure');
}

/**
 * Complete WooCommerce setup
 * Call this after WooCommerce plugin is installed and activated
 * Optimized to reduce redundant operations
 */
export async function setupWooCommerce(sitePath: string): Promise<void> {
  logger.info({ sitePath }, 'Starting WooCommerce setup');
  
  // 1. Set permalinks (required for WooCommerce) - includes one flush
  await setPermalinks(sitePath);
  
  // 2. Install WooCommerce pages
  await setupWooCommercePages(sitePath);
  
  // 3. Configure essential settings
  await disableWooCommerceOnboarding(sitePath);
  await configureWooCommerceDefaults(sitePath);
  
  // Note: Final flush removed - already done in setPermalinks
  
  logger.info({ sitePath }, 'WooCommerce setup complete');
}

// ============================================================================
// WooCommerce Product Seeding Functions
// ============================================================================

import type { ProductTemplate, CategoryTemplate } from '../config/ecommerce/products.js';

/**
 * Create a WooCommerce product category
 * Uses WC-CLI if available, otherwise uses WP-CLI taxonomy commands
 */
export async function createProductCategory(
  sitePath: string,
  category: CategoryTemplate,
  wcCliAvailable: boolean
): Promise<number> {
  try {
    if (wcCliAvailable) {
      // Use WC-CLI
      const { stdout } = await wpCli(
        [
          'wc', 'product_cat', 'create',
          `--name=${category.name}`,
          `--slug=${category.slug}`,
          `--description=${category.description}`,
          '--user=admin',
          '--porcelain',
        ],
        { sitePath }
      );
      const categoryId = parseInt(stdout.trim(), 10);
      logger.info({ sitePath, category: category.name, categoryId }, 'Product category created via WC-CLI');
      return categoryId;
    } else {
      // Fallback: Use WP-CLI taxonomy commands
      const { stdout } = await wpCli(
        [
          'term', 'create', 'product_cat', category.name,
          `--slug=${category.slug}`,
          `--description=${category.description}`,
          '--porcelain',
        ],
        { sitePath }
      );
      const categoryId = parseInt(stdout.trim(), 10);
      logger.info({ sitePath, category: category.name, categoryId }, 'Product category created via WP-CLI');
      return categoryId;
    }
  } catch (err) {
    // Category might already exist - try to get its ID
    try {
      const { stdout } = await wpCli(
        ['term', 'list', 'product_cat', `--slug=${category.slug}`, '--field=term_id'],
        { sitePath }
      );
      const existingId = parseInt(stdout.trim(), 10);
      if (existingId) {
        logger.info({ sitePath, category: category.name, categoryId: existingId }, 'Product category already exists');
        return existingId;
      }
    } catch {
      // Ignore
    }
    logger.warn({ sitePath, category: category.name, err }, 'Failed to create product category');
    return 0;
  }
}

/**
 * Create a WooCommerce product
 * Uses WC-CLI if available, otherwise creates via WP-CLI with post meta
 */
export async function createProduct(
  sitePath: string,
  product: ProductTemplate,
  categoryId: number,
  wcCliAvailable: boolean
): Promise<number> {
  try {
    if (wcCliAvailable) {
      // Use WC-CLI for product creation
      const args = [
        'wc', 'product', 'create',
        `--name=${product.name}`,
        '--type=simple',
        '--status=publish',
        `--regular_price=${product.price}`,
        `--short_description=${product.shortDescription}`,
        `--description=${product.description}`,
        '--user=admin',
        '--porcelain',
      ];
      
      // Add category if we have a valid ID
      if (categoryId > 0) {
        args.splice(args.length - 1, 0, `--categories=[{"id":${categoryId}}]`);
      }
      
      // Add SKU if provided
      if (product.sku) {
        args.splice(args.length - 1, 0, `--sku=${product.sku}`);
      }
      
      const { stdout } = await wpCli(args, { sitePath });
      const productId = parseInt(stdout.trim(), 10);
      logger.info({ sitePath, product: product.name, productId }, 'Product created via WC-CLI');
      return productId;
    } else {
      // Fallback: Create product using WP-CLI post commands
      // Write description to temp file for content
      const tempFile = await writeTempContent(product.description, 'product');
      
      try {
        // Create the product post
        const { stdout } = await wpCli(
          [
            'post', 'create', tempFile,
            '--post_type=product',
            `--post_title=${product.name}`,
            '--post_status=publish',
            `--post_excerpt=${product.shortDescription}`,
            '--porcelain',
          ],
          { sitePath }
        );
        
        const productId = parseInt(stdout.trim(), 10);
        
        // Set required WooCommerce meta fields
        await wpCli(['post', 'meta', 'update', productId.toString(), '_regular_price', product.price], { sitePath });
        await wpCli(['post', 'meta', 'update', productId.toString(), '_price', product.price], { sitePath });
        await wpCli(['post', 'meta', 'update', productId.toString(), '_visibility', 'visible'], { sitePath });
        await wpCli(['post', 'meta', 'update', productId.toString(), '_stock_status', 'instock'], { sitePath });
        await wpCli(['post', 'meta', 'update', productId.toString(), '_virtual', 'yes'], { sitePath });
        
        if (product.sku) {
          await wpCli(['post', 'meta', 'update', productId.toString(), '_sku', product.sku], { sitePath });
        }
        
        // Add to category if we have a valid ID
        if (categoryId > 0) {
          await wpCli(['post', 'term', 'add', productId.toString(), 'product_cat', categoryId.toString()], { sitePath });
        }
        
        logger.info({ sitePath, product: product.name, productId }, 'Product created via WP-CLI fallback');
        return productId;
      } finally {
        await removeTempFile(tempFile);
      }
    }
  } catch (err) {
    logger.warn({ sitePath, product: product.name, err }, 'Failed to create product');
    return 0;
  }
}

/**
 * Seed WooCommerce store with sample products for a specific niche
 */
export async function seedProducts(
  sitePath: string,
  categories: CategoryTemplate[],
  products: ProductTemplate[]
): Promise<{ categoriesCreated: number; productsCreated: number }> {
  logger.info({ sitePath, categoryCount: categories.length, productCount: products.length }, 'Starting product seeding');
  
  const wcCliAvailable = await isWcCliAvailable(sitePath);
  const categoryMap = new Map<string, number>();
  let categoriesCreated = 0;
  let productsCreated = 0;
  
  // 1. Create all categories first
  for (const category of categories) {
    const categoryId = await createProductCategory(sitePath, category, wcCliAvailable);
    if (categoryId > 0) {
      categoryMap.set(category.name, categoryId);
      categoriesCreated++;
    }
  }
  
  // 2. Create all products
  for (const product of products) {
    const categoryId = categoryMap.get(product.category) || 0;
    const productId = await createProduct(sitePath, product, categoryId, wcCliAvailable);
    if (productId > 0) {
      productsCreated++;
    }
  }
  
  logger.info(
    { sitePath, categoriesCreated, productsCreated },
    'Product seeding complete'
  );
  
  return { categoriesCreated, productsCreated };
}
