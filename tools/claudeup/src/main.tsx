#!/usr/bin/env node

import { render } from 'ink';
import { spawn } from 'node:child_process';
import { App, VERSION } from './ui/InkApp.js';
import { prerunClaude } from './prerunner/index.js';
import { checkForUpdates } from './services/version-check.js';

// ANSI escape codes for terminal control
const ENTER_ALT_SCREEN = '\x1b[?1049h';
const EXIT_ALT_SCREEN = '\x1b[?1049l';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const CLEAR_SCREEN = '\x1b[2J\x1b[H';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle "claudeup claude [args]" - prerunner mode
  if (args[0] === 'claude') {
    const claudeArgs = args.slice(1);
    const exitCode = await prerunClaude(claudeArgs);
    process.exit(exitCode);
    return;
  }

  // Handle "claudeup update" - self-update command
  if (args[0] === 'update') {
    console.log('Updating claudeup...');
    const proc = spawn('npm', ['install', '-g', 'claudeup@latest'], {
      stdio: 'inherit',
      shell: true,
    });
    proc.on('exit', (code) => process.exit(code || 0));
    return;
  }

  // Handle --version flag - show version and check for updates
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`claudeup v${VERSION}`);
    const result = await checkForUpdates();
    if (result.updateAvailable) {
      console.log(`\nUpdate available: v${result.latestVersion}`);
      console.log('Run: claudeup update');
    }
    process.exit(0);
  }

  // Handle --help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`claudeup v${VERSION}

TUI tool for managing Claude Code plugins, MCPs, and configuration.

Usage: claudeup [options]
       claudeup claude [args...]  Run claude with auto-update prerunner
       claudeup update            Update claudeup to latest version

Options:
  -v, --version  Show version and check for updates
  -h, --help     Show this help message
  --no-refresh   Skip auto-refresh of marketplaces on startup

Commands:
  claude [args...]   Check for plugin updates (1h cache), then run claude
  update             Update claudeup itself to latest version

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
