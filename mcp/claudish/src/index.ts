#!/usr/bin/env bun

import { checkClaudeInstalled, runClaudeWithProxy } from "./claude-runner.js";
import { parseArgs } from "./cli.js";
import { DEFAULT_PORT_RANGE } from "./config.js";
import { selectModelInteractively } from "./interactive-cli.js";
import { initLogger, getLogFilePath } from "./logger.js";
import { findAvailablePort } from "./port-manager.js";
import { createProxyServer } from "./proxy-server.js";

/**
 * Read content from stdin
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

async function main() {
  try {
    // Parse CLI arguments
    const config = parseArgs(process.argv.slice(2));

    // Initialize logger if debug mode with specified log level
    initLogger(config.debug, config.logLevel);

    // Show debug log location if enabled
    if (config.debug && !config.quiet) {
      const logFile = getLogFilePath();
      if (logFile) {
        console.log(`[claudish] Debug log: ${logFile}`);
      }
    }

    // Check if Claude Code is installed
    if (!(await checkClaudeInstalled())) {
      console.error("Error: Claude Code CLI is not installed");
      console.error("Install it from: https://claude.com/claude-code");
      process.exit(1);
    }

    // If model not specified and not in monitor mode, show interactive selector
    if (!config.monitor && !config.model) {
      console.log(""); // Empty line for better UI
      config.model = await selectModelInteractively();
      console.log(""); // Empty line after selection
    }

    // Read prompt from stdin if --stdin flag is set
    if (config.stdin) {
      const stdinInput = await readStdin();
      if (stdinInput.trim()) {
        // Prepend stdin content to claudeArgs
        config.claudeArgs = [stdinInput, ...config.claudeArgs];
      }
    }

    // Find available port
    const port =
      config.port || (await findAvailablePort(DEFAULT_PORT_RANGE.start, DEFAULT_PORT_RANGE.end));

    // Start proxy server
    const proxy = await createProxyServer(
      port,
      config.monitor ? undefined : config.openrouterApiKey!,
      config.monitor ? undefined : config.model!,
      config.monitor,
      config.anthropicApiKey
    );

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
      console.log("[claudish] Done\n");
    }

    process.exit(exitCode);
  } catch (error) {
    console.error("[claudish] Fatal error:", error);
    process.exit(1);
  }
}

// Run main
main();
