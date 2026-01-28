#!/usr/bin/env node

/**
 * Kill processes running on ports 3000 and 5173
 * Useful for cleaning up before starting the app
 */

import { execa } from 'execa';

const ports = [3000, 5173];

async function killPort(port) {
  try {
    // Find process using the port
    const { stdout } = await execa('lsof', ['-ti', `:${port}`], {
      shell: false,
    });

    if (stdout.trim()) {
      const pids = stdout.trim().split('\n');
      for (const pid of pids) {
        console.log(`Killing process ${pid} on port ${port}...`);
        try {
          await execa('kill', ['-9', pid], { shell: false });
          console.log(`✓ Killed process ${pid}`);
        } catch (err) {
          console.log(`⚠ Could not kill process ${pid}: ${err.message}`);
        }
      }
      return true;
    }
    return false;
  } catch (err) {
    // Port is not in use
    return false;
  }
}

async function main() {
  console.log('Checking for processes on ports 3000 and 5173...\n');

  let killedAny = false;
  for (const port of ports) {
    const killed = await killPort(port);
    if (killed) {
      killedAny = true;
    } else {
      console.log(`✓ Port ${port} is free`);
    }
  }

  if (!killedAny) {
    console.log('\n✓ All ports are free');
  } else {
    console.log('\n✓ Cleaned up processes');
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
