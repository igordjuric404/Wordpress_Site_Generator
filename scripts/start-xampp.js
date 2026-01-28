#!/usr/bin/env node

/**
 * Start both MySQL and Apache for XAMPP
 */

import { execa } from 'execa';
import fs from 'fs-extra';

const MYSQL_SOCKET = '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';
const MYSQL_START = '/Applications/XAMPP/xamppfiles/bin/mysql.server';
const APACHE_START = '/Applications/XAMPP/xamppfiles/bin/apachectl';

const green = '\x1b[32m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

function log(message, color = reset) {
  console.log(`${color}${message}${reset}`);
}

async function checkMySQLRunning() {
  return await fs.pathExists(MYSQL_SOCKET);
}

async function checkApacheRunning() {
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

async function startMySQL() {
  if (await checkMySQLRunning()) {
    log('✓ MySQL is already running', green);
    return true;
  }

  log('Starting MySQL...', yellow);

  try {
    await execa(MYSQL_START, ['start'], {
      shell: false,
      stdio: 'pipe',
      reject: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (await checkMySQLRunning()) {
      log('✓ MySQL started', green);
      return true;
    }
  } catch {}

  log('⚠ Could not start MySQL automatically', yellow);
  return false;
}

async function startApache() {
  if (await checkApacheRunning()) {
    log('✓ Apache is already running', green);
    return true;
  }

  log('Starting Apache...', yellow);

  try {
    await execa(APACHE_START, ['start'], {
      shell: false,
      stdio: 'pipe',
      reject: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (await checkApacheRunning()) {
      log('✓ Apache started', green);
      return true;
    }
  } catch {}

  log('⚠ Could not start Apache automatically', yellow);
  return false;
}

async function main() {
  console.log('\nStarting XAMPP services...\n');

  const [mysqlStarted, apacheStarted] = await Promise.all([
    startMySQL(),
    startApache(),
  ]);

  if (mysqlStarted && apacheStarted) {
    log('\n✓ All services started successfully', green);
    log('You can now use the WordPress Site Generator\n', green);
    return 0;
  } else {
    log('\n⚠ Some services could not start automatically', yellow);
    log('Please open XAMPP Control Panel and start them manually:', yellow);
    log('  1. Press ⌘+Space and search for "XAMPP"', yellow);
    log('  2. Click "Start" for MySQL and Apache\n', yellow);
    return 1;
  }
}

main();
