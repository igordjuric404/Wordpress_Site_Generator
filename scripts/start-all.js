#!/usr/bin/env node

/**
 * WordPress Site Generator - Single Command Startup
 * Checks MySQL & Apache status, starts them if needed, then starts dev servers
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MYSQL_SOCKETS = [
  process.env.MYSQL_SOCKET,
  '/tmp/mysql.sock',
  '/opt/homebrew/var/mysql/mysql.sock',
  '/usr/local/var/mysql/mysql.sock',
  '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
  '/Applications/MAMP/tmp/mysql/mysql.sock',
].filter(Boolean);

// Colors for terminal output
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

function logHeader() {
  console.log('');
  console.log(green + '╔═══════════════════════════════════════════════════════╗' + reset);
  console.log(green + '║     WordPress Site Generator - Starting...           ║' + reset);
  console.log(green + '╚═══════════════════════════════════════════════════════╝' + reset);
  console.log('');
}

async function findMysqlSocket() {
  for (const socketPath of DEFAULT_MYSQL_SOCKETS) {
    try {
      if (await fs.pathExists(socketPath)) {
        return socketPath;
      }
    } catch {
      // Ignore and keep checking
    }
  }
  return null;
}

async function isPortListening(port) {
  try {
    const { stdout } = await execa('lsof', ['-iTCP:' + port, '-sTCP:LISTEN'], {
      shell: false,
      reject: false,
    });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function checkMySQL() {
  const socketPath = await findMysqlSocket();
  if (socketPath) return true;

  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  return await isPortListening(port);
}

async function checkApache() {
  const urlsToCheck = [
    process.env.BASE_URL,
    'http://localhost/',
    'http://localhost:8080/',
    'http://localhost:8888/',
  ].filter(Boolean);

  for (const url of urlsToCheck) {
    try {
      const { exitCode, stdout } = await execa('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url], {
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

async function canUseBrew() {
  try {
    const { exitCode } = await execa('brew', ['--version'], { shell: false, reject: false });
    return exitCode === 0;
  } catch {
    return false;
  }
}

async function isBrewPackageInstalled(packageName) {
  try {
    const { exitCode } = await execa('brew', ['list', packageName], { shell: false, reject: false });
    return exitCode === 0;
  } catch {
    return false;
  }
}

async function installBrewPackage(packageName) {
  console.log(yellow + `  Installing ${packageName} via Homebrew...` + reset);
  try {
    await execa('brew', ['install', packageName], { 
      shell: false,
      stdio: 'inherit',
    });
    console.log(green + `  ✓ ${packageName} installed successfully` + reset);
    return true;
  } catch (error) {
    console.error(red + `  ✗ Failed to install ${packageName}:` + reset, error.message);
    return false;
  }
}

async function listBrewServices() {
  try {
    const { stdout, exitCode } = await execa('brew', ['services', 'list'], { shell: false, reject: false });
    if (exitCode !== 0) return [];

    const lines = stdout.split('\n').slice(1).filter(Boolean);
    return lines.map((line) => {
      const parts = line.trim().split(/\s+/);
      return { name: parts[0], status: parts[1] || 'unknown' };
    });
  } catch {
    return [];
  }
}

function findService(services, candidates) {
  const serviceNames = new Set(services.map((service) => service.name));
  return candidates.find((candidate) => serviceNames.has(candidate)) || null;
}

async function ensureBrewServicesInstalled() {
  if (!(await canUseBrew())) {
    console.log(red + '✗ Homebrew is not installed. Please install it first:' + reset);
    console.log('  Visit: https://brew.sh');
    return { mysqlInstalled: false, apacheInstalled: false };
  }

  console.log(cyan + '🔍 Checking for MySQL and Apache...' + reset);
  
  const mysqlInstalled = await isBrewPackageInstalled('mysql') || 
                         await isBrewPackageInstalled('mysql@8.4') ||
                         await isBrewPackageInstalled('mysql@8.0') ||
                         await isBrewPackageInstalled('mysql@5.7');
  
  const apacheInstalled = await isBrewPackageInstalled('httpd');

  let mysqlToInstall = null;
  let apacheToInstall = null;

  if (!mysqlInstalled) {
    // Try to find which MySQL version is available
    try {
      const { stdout } = await execa('brew', ['search', 'mysql'], { shell: false, reject: false });
      if (stdout.includes('mysql@8.4')) {
        mysqlToInstall = 'mysql@8.4';
      } else if (stdout.includes('mysql@8.0')) {
        mysqlToInstall = 'mysql@8.0';
      } else {
        mysqlToInstall = 'mysql';
      }
    } catch {
      mysqlToInstall = 'mysql';
    }
  }

  if (!apacheInstalled) {
    apacheToInstall = 'httpd';
  }

  if (mysqlToInstall || apacheToInstall) {
    console.log(yellow + '📦 Installing missing packages...' + reset);
    
    if (mysqlToInstall) {
      const installed = await installBrewPackage(mysqlToInstall);
      if (!installed) {
        return { mysqlInstalled: false, apacheInstalled: apacheInstalled };
      }
    }
    
    if (apacheToInstall) {
      const installed = await installBrewPackage(apacheToInstall);
      if (!installed) {
        return { mysqlInstalled: mysqlInstalled || !!mysqlToInstall, apacheInstalled: false };
      }
    }
    
    // Wait a moment after installation
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { 
    mysqlInstalled: mysqlInstalled || !!mysqlToInstall, 
    apacheInstalled: apacheInstalled || !!apacheToInstall 
  };
}

async function startBrewServices() {
  if (!(await canUseBrew())) {
    return { usedBrew: false, mysqlStarted: false, apacheStarted: false };
  }

  // Ensure services are installed
  const { mysqlInstalled, apacheInstalled } = await ensureBrewServicesInstalled();
  if (!mysqlInstalled || !apacheInstalled) {
    return { usedBrew: true, mysqlStarted: false, apacheStarted: false };
  }

  const services = await listBrewServices();
  const mysqlService = findService(services, ['mysql', 'mysql@8.4', 'mysql@8.0', 'mysql@5.7']);
  const apacheService = findService(services, ['httpd']);

  if (!mysqlService || !apacheService) {
    return { usedBrew: true, mysqlStarted: false, apacheStarted: false };
  }

  const startServiceIfNeeded = async (serviceName) => {
    const service = services.find((svc) => svc.name === serviceName);
    if (service?.status === 'started') {
      console.log(green + `  ✓ ${serviceName} is already running` + reset);
      return;
    }
    console.log(yellow + `  Starting ${serviceName}...` + reset);
    await execa('brew', ['services', 'start', serviceName], { shell: false, reject: false });
    // Wait a bit for service to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  };

  await startServiceIfNeeded(mysqlService);
  await startServiceIfNeeded(apacheService);

  // Give services more time to fully start
  await new Promise(resolve => setTimeout(resolve, 2000));

  const mysqlRunning = await checkMySQL();
  const apacheRunning = await checkApache();
  return { usedBrew: true, mysqlStarted: mysqlRunning, apacheStarted: apacheRunning };
}

async function startServices() {
  console.log(yellow + '\n📦 Starting MySQL & Apache...' + reset);
  
  // Check if both are already running
  const mysqlRunning = await checkMySQL();
  const apacheRunning = await checkApache();
  
  if (mysqlRunning && apacheRunning) {
    console.log(green + '✓ MySQL and Apache are already running\n' + reset);
    return true;
  }

  // Try Homebrew first - it will install if needed
  const brewResult = await startBrewServices();
  if (brewResult.usedBrew && brewResult.mysqlStarted && brewResult.apacheStarted) {
    console.log(green + '✓ MySQL and Apache started via Homebrew\n' + reset);
    return true;
  }

  if (brewResult.usedBrew) {
    if (!brewResult.mysqlStarted) {
      console.log(red + '✗ MySQL failed to start' + reset);
    }
    if (!brewResult.apacheStarted) {
      console.log(red + '✗ Apache failed to start' + reset);
    }
    console.log(yellow + '\n⚠ Some services could not start. Please check:' + reset);
    console.log('  • MySQL: brew services list | grep mysql');
    console.log('  • Apache: brew services list | grep httpd');
    console.log('  • Logs: brew services info mysql && brew services info httpd\n');
    return false;
  }

  // If Homebrew is not available, provide instructions
  console.log(red + '✗ Homebrew is required for automatic service management' + reset);
  console.log(yellow + '\nPlease install Homebrew and try again:' + reset);
  console.log('  Visit: https://brew.sh\n');
  return false;
}

async function checkWPCLI() {
  try {
    await execa('wp', ['--version'], { shell: false });
    console.log(green + '✓ WP-CLI is installed' + reset);
    return true;
  } catch {
    console.log(yellow + '⚠ WP-CLI not found. Install with: brew install wp-cli' + reset);
    return false;
  }
}

async function killPorts() {
  console.log(cyan + '\n🔧 Checking and clearing ports...' + reset);
  const ports = [3000, 5173];
  let killedAny = false;

  for (const port of ports) {
    try {
      const { stdout } = await execa('lsof', ['-ti', `:${port}`], {
        shell: false,
        reject: false,
      });

      const pids = stdout.trim().split('\n').filter(Boolean);
      
      if (pids.length > 0) {
        console.log(yellow + `  Killing processes on port ${port}...` + reset);
        
        for (const pid of pids) {
          try {
            await execa('kill', ['-9', pid], { shell: false });
            killedAny = true;
          } catch {
            // Process may have already exited
          }
        }
      }
    } catch {
      // Port is already free
    }
  }

  if (killedAny) {
    console.log(green + '✓ Ports cleared' + reset);
    // Wait a moment for ports to fully release
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log(green + '✓ Ports are free' + reset);
  }
}

async function main() {
  logHeader();

  // 1. Kill any processes on ports 3000 and 5173
  await killPorts();

  // 2. Check and start MySQL/Apache services
  const servicesOk = await startServices();
  if (!servicesOk) {
    console.log(yellow + '⚠ MySQL/Apache services are not running. Some features may not work.\n' + reset);
  }

  // 3. Check WP-CLI
  await checkWPCLI();

  console.log('');
  console.log(cyan + 'Starting development servers...' + reset);
  console.log('');

  // Change to project root
  const projectRoot = path.resolve(__dirname, '..');
  process.chdir(projectRoot);

  // Start dev servers using npm
  try {
    await execa('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: false,
    });
  } catch (err) {
    // Exit code 130 is SIGINT (Ctrl+C), which is normal
    if (err.exitCode !== 130 && err.exitCode !== null) {
      console.log(red + '\n✗ Failed to start dev servers' + reset);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.log(red + `\n✗ Error: ${err.message}` + reset);
  process.exit(1);
});
