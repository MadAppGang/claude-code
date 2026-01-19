#!/usr/bin/env node

import { render } from "ink";
import React from "react";
import { spawn } from "node:child_process";
import { App, VERSION } from "./ui/InkApp.js";
import { prerunClaude } from "./prerunner/index.js";
import { checkForUpdates } from "./services/version-check.js";

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	// Detect "claudeup claude [args]" subcommand
	if (args[0] === "claude") {
		const claudeArgs = args.slice(1); // All args after "claude"
		const exitCode = await prerunClaude(claudeArgs);
		process.exit(exitCode);
		return;
	}

	// Handle "claudeup update" - self-update command
	if (args[0] === "update") {
		// Detect how claudeup was installed by checking the executable path
		const { execSync } = await import("node:child_process");
		let usesBun = false;
		try {
			const claudeupPath = execSync("which claudeup", {
				encoding: "utf-8",
			}).trim();
			usesBun =
				claudeupPath.includes(".bun") || claudeupPath.includes("bun/bin");
		} catch {
			// If which fails, default to npm
		}

		const pkgManager = usesBun ? "bun" : "npm";
		console.log(`Updating claudeup using ${pkgManager}...`);

		const proc = spawn(pkgManager, ["install", "-g", "claudeup@latest"], {
			stdio: "inherit",
			shell: false,
		});
		proc.on("exit", (code) => process.exit(code || 0));
		return;
	}

	// Handle --version flag - show version and check for updates
	if (args.includes("--version") || args.includes("-v")) {
		console.log(`claudeup v${VERSION}`);
		const result = await checkForUpdates();
		if (result.updateAvailable) {
			console.log(`\nUpdate available: v${result.latestVersion}`);
			console.log("Run: claudeup update");
		}
		process.exit(0);
	}

	// Handle --help flag
	if (args.includes("--help") || args.includes("-h")) {
		console.log(`claudeup v${VERSION}

TUI tool for managing Claude Code plugins, MCPs, and configuration.

Usage: claudeup [options]
       claudeup claude [claude-args...]  Run claude with auto-update prerunner
       claudeup update                   Update claudeup to latest version

Options:
  -v, --version  Show version and check for updates
  -h, --help     Show this help message
  --no-refresh   Skip auto-refresh of marketplaces on startup

Commands:
  claudeup claude [args...]   Check for plugin updates (cached 1h), update if needed,
                              then run 'claude' with all provided arguments.
  claudeup update             Update claudeup itself to latest version.

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
	console.error("Error starting claudeup:", error);
	process.exit(1);
});
