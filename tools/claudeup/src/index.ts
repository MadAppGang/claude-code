#!/usr/bin/env node

import { createApp, navigateTo } from './ui/app.js';

async function main(): Promise<void> {
  const app = createApp();

  // Start with plugins screen (default)
  navigateTo(app, 'plugins');
}

main().catch((error) => {
  console.error('Error starting claudeup:', error);
  process.exit(1);
});
