#!/usr/bin/env node
/**
 * Smooth mobile start for restricted Wi‑Fi (campus / client isolation).
 *
 * Priority:
 * 1. Android USB + adb reverse → localhost (most reliable)
 * 2. Tunnel (works when phone + PC can't see each other on LAN)
 * 3. LAN (only when REACT_NATIVE_PACKAGER_HOSTNAME / --lan is forced)
 *
 * Usage: npm start
 *        npm run start:lan
 *        npm run start:usb
 *        npm run start:tunnel
 */

import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const mode = process.argv[2] ?? 'auto';

function hasAdbDevice() {
  try {
    const result = spawnSync('adb', ['devices'], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
      return false;
    }
    return result.stdout
      .split(/\r?\n/)
      .slice(1)
      .some((line) => line.includes('\tdevice'));
  } catch {
    return false;
  }
}

function setupAdbReverse() {
  const reverse = spawnSync('adb', ['reverse', 'tcp:8081', 'tcp:8081'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return reverse.status === 0;
}

function startExpo(args, env = {}) {
  console.log('');
  console.log('TemariHub mobile');
  console.log(`  mode: ${args.join(' ') || 'default'}`);
  if (env.REACT_NATIVE_PACKAGER_HOSTNAME) {
    console.log(`  host: ${env.REACT_NATIVE_PACKAGER_HOSTNAME}`);
  }
  console.log('');
  console.log('Open Expo Go on your phone and scan the QR (or press a / w here).');
  console.log('');

  const child = spawn('npx', ['expo', 'start', ...args], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

function startUsb() {
  if (!hasAdbDevice()) {
    console.error('');
    console.error('No Android device over USB.');
    console.error('  1. Enable Developer options → USB debugging');
    console.error('  2. Plug in the phone and accept the trust prompt');
    console.error('  3. Run: adb devices   (should show "device")');
    console.error('  4. npm run start:usb');
    console.error('');
    console.error('Or use tunnel instead: npm run start:tunnel');
    console.error('');
    process.exit(1);
  }

  if (!setupAdbReverse()) {
    console.error('adb reverse failed. Is USB debugging authorized?');
    process.exit(1);
  }

  console.log('USB ready — port 8081 forwarded to this PC.');
  console.log('In Expo Go: enter URL  exp://127.0.0.1:8081');
  startExpo(['--localhost'], { REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1' });
}

function startTunnel() {
  console.log('Using Expo tunnel (needed on campus / isolated Wi‑Fi).');
  console.log('First connect can take 20–40s. Keep this terminal open.');
  startExpo(['--tunnel']);
}

function startLan() {
  console.log('Using LAN. Phone and PC must share Wi‑Fi with no client isolation.');
  startExpo(['--lan']);
}

function startAuto() {
  if (hasAdbDevice() && setupAdbReverse()) {
    console.log('Android USB detected — using localhost (most reliable).');
    console.log('In Expo Go: enter URL  exp://127.0.0.1:8081  (or scan QR)');
    startExpo(['--localhost'], { REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1' });
    return;
  }

  // Campus Wi‑Fi (e.g. 10.169.x) usually blocks phone→PC LAN. Tunnel is the default.
  startTunnel();
}

switch (mode) {
  case 'usb':
    startUsb();
    break;
  case 'tunnel':
    startTunnel();
    break;
  case 'lan':
    startLan();
    break;
  case 'auto':
  default:
    startAuto();
    break;
}
