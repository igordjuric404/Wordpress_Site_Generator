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
const MYSQL_SOCKET = process.env.MYSQL_SOCKET || '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';

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

async function checkMySQL() {
  try {
    return await fs.pathExists(MYSQL_SOCKET);
  } catch {
    return false;
  }
}

async function checkApache() {
  try {
    const { exitCode } = await execa('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost/'], {
      shell: false,
      reject: false,
      timeout: 3000,
    });
    return exitCode === 0;
  } catch {
    return false;
  }
}

async function startXAMPP() {
  console.log(yellow + '\n📦 Starting MySQL & Apache...' + reset);
  
  // Check if both are already running
  const mysqlRunning = await checkMySQL();
  const apacheRunning = await checkApache();
  
  if (mysqlRunning && apacheRunning) {
    console.log(green + '✓ MySQL and Apache are already running\n' + reset);
    return true;
  }

  try {
    // Use the dedicated XAMPP starter script
    const { exitCode } = await execa('node', ['scripts/start-xampp.js'], {
      stdio: 'inherit',
      reject: false,
    });

    // Wait a bit for services to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mysqlNowRunning = await checkMySQL();
    const apacheNowRunning = await checkApache();

    if (mysqlNowRunning && apacheNowRunning) {
      console.log(green + '✓ MySQL and Apache started successfully\n' + reset);
      return true;
    }

    if (!mysqlNowRunning || !apacheNowRunning) {
      console.log(yellow + '⚠ Some services may not have started. Check XAMPP Control Panel\n' + reset);
    }
    return mysqlNowRunning; // At minimum, MySQL should be running
  } catch (error) {
    console.error(red + '✗ Failed to start XAMPP services:' + reset, error.message);
    console.log(yellow + '\nPlease start services manually:' + reset);
    console.log('  • Open XAMPP Control Panel (⌘+Space → "XAMPP")');
    console.log('  • Click "Start" next to MySQL and Apache\n');
    return false;
  }
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

  // 2. Check and start XAMPP services (MySQL & Apache)
  const servicesOk = await startXAMPP();
  if (!servicesOk) {
    console.log(yellow + '⚠ XAMPP services are not running. Some features may not work.\n' + reset);
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
