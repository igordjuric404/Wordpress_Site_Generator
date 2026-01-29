import fs from 'fs-extra';
import path from 'path';
import { createServiceLogger } from '../utils/logger.js';
import { slugify } from '../utils/sanitize.js';

const logger = createServiceLogger('filesystem');

const DEFAULT_WEB_ROOTS = [
  '/opt/homebrew/var/www',
  '/usr/local/var/www',
  '/Applications/XAMPP/xamppfiles/htdocs',
  '/Applications/MAMP/htdocs',
];

/**
 * Get the web root directory (auto-detect if not set)
 */
export function getWebRoot(): string {
  if (process.env.WEB_ROOT) {
    return process.env.WEB_ROOT;
  }

  const detected = DEFAULT_WEB_ROOTS.find((root) => fs.pathExistsSync(root));
  return detected || DEFAULT_WEB_ROOTS[0];
}

/**
 * Get the base URL for local sites
 */
export function getBaseUrl(): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  const webRoot = getWebRoot();
  if (webRoot.includes('/Applications/MAMP/htdocs')) {
    return 'http://localhost:8888';
  }
  if (webRoot.includes('/opt/homebrew/var/www') || webRoot.includes('/usr/local/var/www')) {
    return 'http://localhost:8080';
  }
  return 'http://localhost';
}

/**
 * Check if a site directory exists
 */
export async function siteExists(siteName: string): Promise<boolean> {
  const sitePath = path.join(getWebRoot(), siteName);
  return fs.pathExists(sitePath);
}

/**
 * Find next available site directory name with incrementing suffix
 * e.g., joes-plumbing-1, joes-plumbing-2, etc.
 */
export async function getNextAvailableSiteName(businessName: string): Promise<string> {
  const baseName = slugify(businessName);
  let counter = 1;

  while (await siteExists(`${baseName}-${counter}`)) {
    counter++;
  }

  return `${baseName}-${counter}`;
}

/**
 * Create the site directory
 */
export async function createSiteDirectory(siteName: string): Promise<string> {
  const sitePath = path.join(getWebRoot(), siteName);
  await fs.ensureDir(sitePath);
  logger.info({ sitePath }, 'Site directory created');
  return sitePath;
}

/**
 * Remove a site directory
 */
export async function removeSiteDirectory(siteName: string): Promise<void> {
  const sitePath = path.join(getWebRoot(), siteName);
  
  if (await fs.pathExists(sitePath)) {
    await fs.remove(sitePath);
    logger.info({ sitePath }, 'Site directory removed');
  }
}

/**
 * Get the full URL for a site
 */
export function getSiteUrl(siteName: string): string {
  return `${getBaseUrl()}/${siteName}`;
}

/**
 * Write content to a temporary file (for WP-CLI import)
 * Returns the path to the temp file
 */
export async function writeTempContent(content: string, prefix: string = 'wp-content'): Promise<string> {
  const tempDir = path.join(process.cwd(), 'data', 'temp');
  await fs.ensureDir(tempDir);
  
  const timestamp = Date.now();
  const filename = `${prefix}-${timestamp}.html`;
  const tempPath = path.join(tempDir, filename);
  
  await fs.writeFile(tempPath, content, 'utf-8');
  logger.info({ tempPath }, 'Temp content file created');
  
  return tempPath;
}

/**
 * Remove a temporary file
 */
export async function removeTempFile(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath);
    logger.info({ filePath }, 'Temp file removed');
  } catch (err) {
    logger.warn({ filePath, error: err }, 'Failed to remove temp file');
  }
}

/**
 * Clean up all temp files older than the specified age (in milliseconds)
 */
export async function cleanupTempFiles(maxAge: number = 3600000): Promise<void> {
  const tempDir = path.join(process.cwd(), 'data', 'temp');
  
  if (!(await fs.pathExists(tempDir))) {
    return;
  }
  
  const files = await fs.readdir(tempDir);
  const now = Date.now();
  
  for (const file of files) {
    const filePath = path.join(tempDir, file);
    const stat = await fs.stat(filePath);
    
    if (now - stat.mtimeMs > maxAge) {
      await fs.remove(filePath);
      logger.info({ filePath }, 'Cleaned up old temp file');
    }
  }
}
