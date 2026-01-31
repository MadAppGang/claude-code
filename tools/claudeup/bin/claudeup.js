#!/usr/bin/env bun

// Check Bun version
const bunVersion = process.versions.bun;
if (!bunVersion) {
  console.error('Error: claudeup v3.0.0+ requires Bun runtime.');
  console.error('Please install Bun: https://bun.sh');
  console.error('');
  console.error('Quick install:');
  console.error('  curl -fsSL https://bun.sh/install | bash');
  process.exit(1);
}

const [major] = bunVersion.split('.').map(Number);
if (major < 1) {
  console.error(`Error: claudeup requires Bun >=1.0.0 (current: ${bunVersion})`);
  console.error('Please upgrade Bun: bun upgrade');
  process.exit(1);
}

import('../src/main.tsx').catch((err) => {
  console.error('Failed to start claudeup:', err.message);
  process.exit(1);
});
