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
    
    // Auto-detect best PHP version from MAMP
    const mampPhpPath = await detectBestMampPhp();
    if (mampPhpPath) {
      result.checks.phpPath = mampPhpPath;
      
      // Extract PHP version from path
      const phpVersionMatch = mampPhpPath.match(/php([\d.]+)/);
      if (phpVersionMatch) {
        result.checks.phpVersion = phpVersionMatch[1];
        result.checks.phpMeetsRequirements = checkPhpVersion(phpVersionMatch[1]);
      }
      
      // Auto-set WP_CLI_PHP environment variable for all subsequent commands
      process.env.WP_CLI_PHP = mampPhpPath;
      
      logger.info({ phpPath: mampPhpPath, phpVersion: result.checks.phpVersion }, 'Auto-configured WP-CLI PHP');
    } else {
      result.warnings.push('Could not auto-detect MAMP/XAMPP PHP. Using system default.');
    }
  } catch (err) {
    result.checks.wpCliInstalled = false;
    result.errors.push('WP-CLI not found. Install: brew install wp-cli');
    logger.warn('WP-CLI not installed');
  }
  
  // 2. Check MySQL socket exists
  const mysqlSocket = process.env.MYSQL_SOCKET || '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';
  result.checks.mysqlSocket = await fs.pathExists(mysqlSocket);
  if (!result.checks.mysqlSocket) {
    result.warnings.push(`MySQL socket not found at ${mysqlSocket}. Is MySQL running?`);
  }
  
  // 3. Test MySQL connection (will be done by database service)
  // For now, just check if socket exists as a proxy
  result.checks.mysqlConnected = result.checks.mysqlSocket;
  if (!result.checks.mysqlConnected) {
    result.errors.push('MySQL is not running. Start MySQL server (XAMPP/MAMP).');
  }
  
  // 4. Check Apache web server status
  try {
    const { stdout, exitCode } = await execa('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost/'], {
      shell: false,
      reject: false,
      timeout: 3000,
    });
    result.checks.apacheRunning = exitCode === 0 && stdout.trim() !== '000';
    if (!result.checks.apacheRunning) {
      result.errors.push('Apache web server is not running. Start Apache (XAMPP/MAMP).');
    }
  } catch {
    result.checks.apacheRunning = false;
    result.errors.push('Apache web server is not running. Start Apache (XAMPP/MAMP).');
  }
  
  // 5. Verify Anthropic API key format
  const apiKey = process.env.ANTHROPIC_API_KEY;
  result.checks.anthropicKeyValid = Boolean(apiKey && apiKey.startsWith('sk-ant-'));
  if (!result.checks.anthropicKeyValid) {
    result.warnings.push('Anthropic API key not configured. AI content generation will use placeholders.');
  }
  
  // 6. Check web root (XAMPP/MAMP htdocs)
  const webRoot = process.env.WEB_ROOT || '/Applications/XAMPP/xamppfiles/htdocs';
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
    result.errors.push(`Web root not found: ${webRoot}. Install XAMPP/MAMP or update WEB_ROOT in .env`);
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
