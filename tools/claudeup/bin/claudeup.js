#!/usr/bin/env node

import('../dist/main.js').catch((err) => {
  console.error('Failed to start claudeup:', err.message);
  process.exit(1);
});
