#!/usr/bin/env node

/**
 * Automatically start XAMPP MySQL using AppleScript (no sudo required)
 */

import { execa } from 'execa';
import fs from 'fs-extra';

const MYSQL_SOCKETS = [
  process.env.MYSQL_SOCKET,
  '/tmp/mysql.sock',
  '/opt/homebrew/var/mysql/mysql.sock',
  '/usr/local/var/mysql/mysql.sock',
  '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
  '/Applications/MAMP/tmp/mysql/mysql.sock',
].filter(Boolean);
const MYSQL_START_SCRIPT = '/Applications/XAMPP/xamppfiles/bin/mysql.server';

// Colors
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

function log(message, color = reset) {
  console.log(`${color}${message}${reset}`);
}

async function checkMySQLRunning() {
  for (const socketPath of MYSQL_SOCKETS) {
    try {
      if (await fs.pathExists(socketPath)) {
        return true;
      }
    } catch {
      // Ignore and keep checking
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

async function listBrewServices() {
  try {
    const { stdout, exitCode } = await execa('brew', ['services', 'list'], { shell: false, reject: false });
    if (exitCode !== 0) return [];

    return stdout
      .split('\n')
      .slice(1)
      .filter(Boolean)
      .map((line) => {
        const [name, status] = line.trim().split(/\s+/);
        return { name, status };
      });
  } catch {
    return [];
  }
}

function findMysqlService(services) {
  const candidates = ['mysql', 'mysql@8.4', 'mysql@8.0', 'mysql@5.7'];
  const serviceNames = new Set(services.map((service) => service.name));
  return candidates.find((candidate) => serviceNames.has(candidate)) || null;
}

async function tryStartMysqlWithBrew() {
  if (!(await canUseBrew())) return false;

  const services = await listBrewServices();
  const mysqlService = findMysqlService(services);
  if (!mysqlService) return false;

  const service = services.find((svc) => svc.name === mysqlService);
  if (service?.status !== 'started') {
    await execa('brew', ['services', 'start', mysqlService], { shell: false, reject: false });
  }

  // Wait a moment for MySQL to start and check socket
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return await checkMySQLRunning();
}

async function startMySQLWithoutSudo() {
  try {
    log('Trying to start MySQL directly...', yellow);
    
    // Try starting without sudo first
    const result = await execa(MYSQL_START_SCRIPT, ['start'], {
      shell: false,
      stdio: 'pipe',
      reject: false, // Don't throw on error
    });
    
    // Check if it succeeded (exit code 0)
    if (result.exitCode === 0) {
      // Wait a moment for MySQL to start
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      if (await checkMySQLRunning()) {
        return true;
      }
    }
    
    // Sometimes the script returns success but MySQL needs more time
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return await checkMySQLRunning();
  } catch (err) {
    return false;
  }
}

// Removed AppleScript method - it requires system permissions

async function startMySQLWithDirectCommand() {
  // Try using the mysqld_safe command directly
  const mysqldSafe = '/Applications/XAMPP/xamppfiles/bin/mysqld_safe';
  const mysqlDataDir = '/Applications/XAMPP/xamppfiles/var/mysql';
  
  try {
    if (!(await fs.pathExists(mysqldSafe))) {
      return false;
    }
    
    // Check if mysqld is already running
    try {
      const { stdout } = await execa('pgrep', ['-f', 'mysqld'], { 
        shell: false, 
        reject: false 
      });
      if (stdout.trim()) {
        // Process exists, check if socket is ready
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (await checkMySQLRunning()) {
          return true;
        }
      }
    } catch {
      // Not running, continue
    }
    
    // Try to start mysqld_safe directly using nohup to run in background
    log('Starting MySQL daemon directly...', yellow);
    
    // Use a shell command to start in background
    const startCmd = `cd /Applications/XAMPP/xamppfiles && nohup ./bin/mysqld_safe --datadir=./var/mysql --socket=./var/mysql/mysql.sock --pid-file=./var/mysql/mysql.pid --log-error=./var/mysql/error.log --user=_mysql > /dev/null 2>&1 &`;
    
    await execa('sh', ['-c', startCmd], {
      shell: false,
      stdio: 'pipe',
      reject: false,
    });
    
    // Wait for MySQL to start (check socket file)
    for (let i = 0; i < 15; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (await checkMySQLRunning()) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

async function main() {
  // Check if already running
  if (await checkMySQLRunning()) {
    log('✓ MySQL is already running', green);
    return 0;
  }

  log('Starting MySQL...', yellow);

  // Try method 0: Homebrew services
  if (await tryStartMysqlWithBrew()) {
    log('✓ MySQL started via Homebrew', green);
    return 0;
  }

  // Try method 1: Start without sudo using mysql.server
  if (await startMySQLWithoutSudo()) {
    log('✓ MySQL started successfully', green);
    return 0;
  }

  // Try method 2: Start mysqld_safe directly
  log('Trying alternative startup method...', yellow);
  if (await startMySQLWithDirectCommand()) {
    log('✓ MySQL started successfully', green);
    return 0;
  }

  // If all command-line methods failed, show instructions
  log('⚠ Could not start MySQL automatically via command line', yellow);
  log('\nMySQL requires elevated permissions. Please start it manually:', yellow);
  log('  Option 1: Open XAMPP Control Panel → Click "Start" next to MySQL', yellow);
  log('  Option 2: Run: sudo /Applications/XAMPP/xamppfiles/bin/mysql.server start', yellow);
  log('\nOnce MySQL is running, refresh the System Status panel in the UI.', yellow);
  
  return 1;
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
