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
async function wpCli(
  args: string[],
  options: WpCliOptions
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
    args: fullArgs
  }, 'Executing WP-CLI via PHP with memory limit');

  try {
    const result = await execa(phpPath, fullArgs, {
      cwd: options.cwd || options.sitePath,
      shell: false,
      timeout: 120000, // 2 minute timeout
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
  await wpCli(
    [
      'config',
      'create',
      `--dbname=${config.dbName}`,
      `--dbuser=${config.dbUser}`,
      `--dbpass=${config.dbPassword}`,
      `--dbhost=${config.dbHost}`,
    ],
    { sitePath }
  );
  logger.info({ sitePath, dbName: config.dbName }, 'WordPress config created');
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

/**
 * Install and activate plugins
 * Installs plugins one at a time to handle failures gracefully
 */
export async function installPlugins(sitePath: string, plugins: string[]): Promise<void> {
  if (plugins.length === 0) return;

  const installed: string[] = [];
  const failed: string[] = [];

  for (const plugin of plugins) {
    try {
      const { zipPath, version } = await ensurePluginCached(sitePath, plugin);
      await wpCli(['plugin', 'install', zipPath, '--activate', '--force'], { sitePath });
      installed.push(plugin);
      logger.info({ sitePath, plugin, version }, 'Plugin installed successfully');
    } catch (error) {
      failed.push(plugin);
      logger.warn({ sitePath, plugin, error }, 'Failed to install plugin, continuing...');
    }
  }

  if (failed.length > 0) {
    logger.warn({ sitePath, failed, installed }, 'Some plugins failed to install');
  }
  
  logger.info({ sitePath, installed, failed }, 'Plugin installation complete');
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
 * Flush rewrite rules
 */
export async function flushRewriteRules(sitePath: string): Promise<void> {
  await wpCli(['rewrite', 'flush'], { sitePath });
  logger.info({ sitePath }, 'Rewrite rules flushed');
}
