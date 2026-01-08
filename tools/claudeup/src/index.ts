#!/usr/bin/env node

import { render } from 'ink';
import React from 'react';
import { App, VERSION } from './ui/InkApp.js';
import { prerunClaude } from './prerunner/index.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // NEW: Detect "claudeup claude [args]" subcommand
  if (args[0] === 'claude') {
    const claudeArgs = args.slice(1); // All args after "claude"
    const exitCode = await prerunClaude(claudeArgs);
    process.exit(exitCode);
    return; // Never reached, but explicit
  }

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
       claudeup claude [claude-args...]  Run claude with auto-update prerunner

Options:
  -v, --version  Show version number
  -h, --help     Show this help message
  --no-refresh   Skip auto-refresh of marketplaces on startup

Prerunner Mode:
  claudeup claude [args...]   Check for plugin updates (cached 1h), update if needed,
                              then run 'claude' with all provided arguments.

Navigation:
  [1] Plugins    Manage plugin marketplaces and installed plugins
  [2] MCP        Setup and manage MCP servers
  [3] Status     Configure status line display
  [4] Env        Manage MCP environment variables
  [5] Tools      Install and update AI coding CLI tools

Keys:
  g              Toggle global/project scope (in Plugins)
  r              Refresh current screen
  ?              Show help
  q / Escape     Back / Quit
`);
    process.exit(0);
  }

  // Render the Ink app
  render(React.createElement(App));
}

main().catch((error) => {
  console.error('Error starting claudeup:', error);
  process.exit(1);
});
