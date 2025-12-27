#!/usr/bin/env node

import { render } from 'ink';
import { App, VERSION } from './ui/InkApp.js';

// ANSI escape codes for terminal control
const ENTER_ALT_SCREEN = '\x1b[?1049h';
const EXIT_ALT_SCREEN = '\x1b[?1049l';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const CLEAR_SCREEN = '\x1b[2J\x1b[H';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle --version flag
  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    process.exit(0);
  }

  // Handle --help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`claudeup v${VERSION}

TUI tool for managing Claude Code plugins, MCPs, and configuration.

Usage: claudeup [options]

Options:
  -v, --version  Show version number
  -h, --help     Show this help message
  --no-refresh   Skip auto-refresh of marketplaces on startup

Navigation:
  [1] Plugins    Manage plugin marketplaces and installed plugins
  [2] MCP        Setup and manage MCP servers
  [3] Status     Configure status line display
  [4] Env        Environment variables for MCP servers
  [5] Tools      Install and update AI coding CLI tools

Keys:
  ↑/↓ or j/k     Navigate
  Enter          Select / Toggle
  g              Toggle global/project scope (in Plugins)
  r              Refresh current screen
  ?              Show help
  q / Escape     Back / Quit
`);
    process.exit(0);
  }

  // Enter alternate screen buffer for clean TUI rendering
  process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR + CLEAR_SCREEN);

  // Cleanup function to restore terminal
  const cleanup = () => {
    process.stdout.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
  };

  // Render the Ink app
  const { waitUntilExit, clear, unmount } = render(<App />, {
    exitOnCtrlC: false, // We'll handle it ourselves
  });

  // Handle cleanup on exit signals
  const handleExit = () => {
    clear();
    unmount();
    cleanup();
    process.exit(0);
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);

  // Wait for the app to exit
  try {
    await waitUntilExit();
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error('Error starting claudeup:', error);
  process.exit(1);
});
