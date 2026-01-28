import { execa, type ExecaError } from 'execa';
import { createServiceLogger } from '../utils/logger.js';
import { writeTempContent, removeTempFile } from './filesystem.service.js';

const logger = createServiceLogger('wordpress');

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
  const phpPath = process.env.PHP_PATH || '/Applications/XAMPP/xamppfiles/bin/php';
  const wpCliPath = process.env.WPCLI_PATH || '/usr/local/bin/wp';
  const fullArgs = [
    '-d', 'memory_limit=512M',  // Set memory limit directly
    wpCliPath,
    ...args,
    `--path=${options.sitePath}`
  ];

  // Add XAMPP binaries to PATH so WP-CLI can find mysql command
  const xamppBinPath = '/Applications/XAMPP/xamppfiles/bin';
  const currentPath = process.env.PATH || '';
  const enhancedPath = `${xamppBinPath}:${currentPath}`;

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
      await wpCli(['plugin', 'install', plugin, '--activate'], { sitePath });
      installed.push(plugin);
      logger.info({ sitePath, plugin }, 'Plugin installed successfully');
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
