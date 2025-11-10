#!/usr/bin/env bun

import { checkClaudeInstalled, runClaudeWithProxy } from "./claude-runner.js";
import { parseArgs } from "./cli.js";
import { DEFAULT_PORT_RANGE } from "./config.js";
import { selectModelInteractively } from "./interactive-cli.js";
import { initLogger, getLogFilePath } from "./logger.js";
import { findAvailablePort } from "./port-manager.js";
import { createProxyServer } from "./proxy-server.js";

async function main() {
  try {
    // Parse CLI arguments
    const config = parseArgs(process.argv.slice(2));

    // Initialize logger if debug mode
    initLogger(config.debug);

    // Check if Claude Code is installed
    if (!(await checkClaudeInstalled())) {
      console.error("Error: Claude Code CLI is not installed");
      console.error("Install it from: https://claude.com/claude-code");
      process.exit(1);
    }

    // If model not specified, show interactive selector
    if (!config.model) {
      console.log(""); // Empty line for better UI
      config.model = await selectModelInteractively();
      console.log(""); // Empty line after selection
    }

    // Find available port
    const port =
      config.port || (await findAvailablePort(DEFAULT_PORT_RANGE.start, DEFAULT_PORT_RANGE.end));

    // Start proxy server
    const proxy = await createProxyServer(port, config.openrouterApiKey, config.model!);

    // Run Claude Code with proxy
    let exitCode = 0;
    try {
      exitCode = await runClaudeWithProxy(config, proxy.url);
    } finally {
      // Always cleanup proxy
      if (!config.quiet) {
        console.log("\n[claudish] Shutting down proxy server...");
      }
      await proxy.shutdown();
    }

    if (!config.quiet) {
      console.log("[claudish] Done");
    }

    // Show log file location if debug mode
    if (config.debug && !config.quiet) {
      const logFile = getLogFilePath();
      if (logFile) {
        console.log(`[claudish] Debug log saved to: ${logFile}\n`);
      }
    } else if (!config.quiet) {
      console.log("");
    }

    process.exit(exitCode);
  } catch (error) {
    console.error("[claudish] Fatal error:", error);
    process.exit(1);
  }
}

// Run main
main();
