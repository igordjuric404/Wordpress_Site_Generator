import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import type { PreflightResult } from '../../shared/types.js';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('preflight');

// Cache for preflight results (valid for 5 minutes)
let cachedResult: PreflightResult | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Auto-detect the best PHP version available in MAMP or XAMPP
 * Prefers PHP 8.2+, falls back to highest available version
 */
async function detectBestMampPhp(): Promise<string | null> {
  // Check XAMPP first (common on macOS)
  const xamppPhp = '/Applications/XAMPP/xamppfiles/bin/php';
  if (await fs.pathExists(xamppPhp)) {
    logger.info({ phpPath: xamppPhp }, 'Found XAMPP PHP');
    return xamppPhp;
  }
  
  // Check MAMP
  const mampPhpDir = '/Applications/MAMP/bin/php';
  if (!(await fs.pathExists(mampPhpDir))) {
    return null;
  }
  
  try {
    const versions = await fs.readdir(mampPhpDir);
    // Filter to valid PHP versions and sort descending (newest first)
    const phpVersions = versions
      .filter((v) => v.startsWith('php'))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    
    // Find first working PHP binary (prefer 8.2+)
    for (const version of phpVersions) {
      const phpBin = path.join(mampPhpDir, version, 'bin/php');
      if (await fs.pathExists(phpBin)) {
        return phpBin;
      }
    }
  } catch (err) {
    logger.error({ error: err }, 'Error scanning MAMP PHP versions');
  }
  
  return null;
}

async function detectPhpPath(): Promise<string | null> {
  const envPath = process.env.PHP_PATH || process.env.WP_CLI_PHP;
  if (envPath && await fs.pathExists(envPath)) {
    return envPath;
  }

  // Prefer Homebrew PHP first (since we're using Homebrew services)
  try {
    const { stdout } = await execa('which', ['php'], { shell: false, reject: false });
    const phpPath = stdout.trim();
    if (phpPath && await fs.pathExists(phpPath)) {
      // Check if it's Homebrew PHP
      if (phpPath.includes('/opt/homebrew') || phpPath.includes('/usr/local')) {
        return phpPath;
      }
    }
  } catch {
    // Ignore
  }

  // Check common Homebrew PHP locations
  const homebrewPhpPaths = [
    '/opt/homebrew/bin/php',
    '/usr/local/bin/php',
  ];
  for (const phpPath of homebrewPhpPaths) {
    if (await fs.pathExists(phpPath)) {
      return phpPath;
    }
  }

  // Fallback to XAMPP if Homebrew PHP not found
  const xamppPhp = '/Applications/XAMPP/xamppfiles/bin/php';
  if (await fs.pathExists(xamppPhp)) {
    return xamppPhp;
  }

  const mampPhp = await detectBestMampPhp();
  if (mampPhp) {
    return mampPhp;
  }

  return null;
}

async function getPhpVersion(phpPath: string): Promise<string | null> {
  try {
    const { stdout } = await execa(phpPath, ['-v'], { shell: false, reject: false });
    const match = stdout.match(/PHP\s+([\d.]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

const DEFAULT_MYSQL_SOCKETS = [
  '/tmp/mysql.sock',
  '/opt/homebrew/var/mysql/mysql.sock',
  '/usr/local/var/mysql/mysql.sock',
  '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
  '/Applications/MAMP/tmp/mysql/mysql.sock',
];

const DEFAULT_WEB_ROOTS = [
  '/opt/homebrew/var/www',
  '/usr/local/var/www',
  '/Applications/XAMPP/xamppfiles/htdocs',
  '/Applications/MAMP/htdocs',
];

async function resolveMysqlSocket(): Promise<string | null> {
  if (process.env.MYSQL_SOCKET && await fs.pathExists(process.env.MYSQL_SOCKET)) {
    return process.env.MYSQL_SOCKET;
  }

  for (const socketPath of DEFAULT_MYSQL_SOCKETS) {
    if (await fs.pathExists(socketPath)) {
      return socketPath;
    }
  }
  return null;
}

async function isPortListening(port: number): Promise<boolean> {
  try {
    const { stdout } = await execa('lsof', ['-iTCP:' + port, '-sTCP:LISTEN'], { shell: false, reject: false });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function checkApacheRunning(): Promise<boolean> {
  const urlsToCheck = [
    process.env.BASE_URL,
    'http://localhost/',
    'http://localhost:8080/',
    'http://localhost:8888/',
  ].filter(Boolean);

  for (const url of urlsToCheck) {
    try {
      const { stdout, exitCode } = await execa('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url], {
        shell: false,
        reject: false,
        timeout: 3000,
      });
      if (exitCode === 0 && stdout.trim() !== '000') {
        return true;
      }
    } catch {
      // Try next URL
    }
  }
  return false;
}

/**
 * Check if PHP version meets WordPress requirements (>= 7.4)
 */
function checkPhpVersion(version: string): boolean {
  const match = version.match(/(\d+)\.(\d+)/);
  if (!match) return false;
  
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  
  return major > 7 || (major === 7 && minor >= 4);
}

export async function runPreflightChecks(forceRefresh = false): Promise<PreflightResult> {
  // Return cached result if still valid
  if (!forceRefresh && cachedResult && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedResult;
  }
  
  const result: PreflightResult = {
    status: 'ready',
    checks: {
      wpCliInstalled: false,
      phpMeetsRequirements: false,
      mysqlConnected: false,
      mysqlSocket: false,
      apacheRunning: false,
      anthropicKeyValid: false,
      webRootValid: false,
      webRootWritable: false,
    },
    errors: [],
    warnings: [],
  };
  
  // 1. Check WP-CLI installation and auto-configure PHP
  try {
    const wpCliPath = process.env.WPCLI_PATH || 'wp';
    const { stdout } = await execa(wpCliPath, ['--version'], { shell: false });
    result.checks.wpCliInstalled = true;
    
    // Extract version from output like "WP-CLI 2.8.1"
    const versionMatch = stdout.match(/WP-CLI\s+([\d.]+)/);
    if (versionMatch) {
      result.checks.wpCliVersion = versionMatch[1];
    }
    
    const phpPath = await detectPhpPath();
    if (phpPath) {
      result.checks.phpPath = phpPath;

      const phpVersion = await getPhpVersion(phpPath);
      if (phpVersion) {
        result.checks.phpVersion = phpVersion;
        result.checks.phpMeetsRequirements = checkPhpVersion(phpVersion);
      }

      // Auto-set WP_CLI_PHP and PHP_PATH for all subsequent commands
      process.env.WP_CLI_PHP = phpPath;
      process.env.PHP_PATH = phpPath;

      logger.info({ phpPath, phpVersion: result.checks.phpVersion }, 'Auto-configured PHP for WP-CLI');
    } else {
      result.warnings.push('Could not auto-detect PHP. Install PHP via Homebrew or configure PHP_PATH in .env.');
    }
  } catch (err) {
    result.checks.wpCliInstalled = false;
    result.errors.push('WP-CLI not found. Install: brew install wp-cli');
    logger.warn('WP-CLI not installed');
  }
  
  // 2. Check MySQL socket exists
  const mysqlSocket = await resolveMysqlSocket();
  result.checks.mysqlSocket = Boolean(mysqlSocket);
  if (!result.checks.mysqlSocket) {
    result.warnings.push('MySQL socket not found. Is MySQL running?');
  }
  
  // 3. Test MySQL connection (will be done by database service)
  // For now, just check if socket exists as a proxy
  const mysqlPort = parseInt(process.env.MYSQL_PORT || '3306', 10);
  result.checks.mysqlConnected = result.checks.mysqlSocket || await isPortListening(mysqlPort);
  if (!result.checks.mysqlConnected) {
    result.errors.push('MySQL is not running. Start MySQL (Homebrew or XAMPP/MAMP).');
  }
  
  // 4. Check Apache web server status
  result.checks.apacheRunning = await checkApacheRunning();
  if (!result.checks.apacheRunning) {
    result.errors.push('Apache web server is not running. Start Apache (Homebrew or XAMPP/MAMP).');
  }
  
  // 5. Verify Anthropic API key format
  const apiKey = process.env.ANTHROPIC_API_KEY;
  result.checks.anthropicKeyValid = Boolean(apiKey && apiKey.startsWith('sk-ant-'));
  if (!result.checks.anthropicKeyValid) {
    result.warnings.push('Anthropic API key not configured. AI content generation will use placeholders.');
  }
  
  // 6. Check web root (Homebrew/XAMPP/MAMP)
  const webRoot = process.env.WEB_ROOT || DEFAULT_WEB_ROOTS.find((root) => fs.pathExistsSync(root)) || DEFAULT_WEB_ROOTS[0];
  const webRootExists = await fs.pathExists(webRoot);
  result.checks.webRootValid = webRootExists;
  
  if (webRootExists) {
    try {
      await fs.access(webRoot, fs.constants.W_OK);
      result.checks.webRootWritable = true;
    } catch {
      result.checks.webRootWritable = false;
      result.errors.push(`Web root not writable: ${webRoot}`);
    }
  } else {
    result.errors.push(`Web root not found: ${webRoot}. Update WEB_ROOT in .env (Homebrew/XAMPP/MAMP).`);
  }
  
  // Set overall status
  if (result.errors.length > 0) {
    result.status = 'error';
  } else if (result.warnings.length > 0) {
    result.status = 'warning';
  }
  
  // Cache the result
  cachedResult = result;
  cacheTimestamp = Date.now();
  
  logger.info({ status: result.status, errors: result.errors.length, warnings: result.warnings.length }, 'Preflight checks completed');
  
  return result;
}

export function clearPreflightCache(): void {
  cachedResult = null;
  cacheTimestamp = 0;
}
