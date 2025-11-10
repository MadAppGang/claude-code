import type { Subprocess } from "bun";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ENV } from "./config.js";
import type { ClaudishConfig } from "./types.js";

/**
 * Create a temporary settings file with custom status line for this instance
 * This ensures each Claudish instance has its own status line without affecting
 * global Claude Code settings or other running instances
 */
function createTempSettingsFile(modelDisplay: string): string {
  const tempDir = tmpdir();
  const timestamp = Date.now();
  const tempPath = join(tempDir, `claudish-settings-${timestamp}.json`);

  // ANSI color codes for visual enhancement
  // Claude Code supports ANSI colors in status line output
  const CYAN = "\\033[96m";      // Bright cyan for directory (easy to read)
  const YELLOW = "\\033[93m";    // Bright yellow for model (highlights it's special)
  const GREEN = "\\033[92m";     // Bright green for cost (money = green)
  const MAGENTA = "\\033[95m";   // Bright magenta for context (attention-grabbing)
  const DIM = "\\033[2m";        // Dim for separator
  const RESET = "\\033[0m";      // Reset colors
  const BOLD = "\\033[1m";       // Bold text

  // Model context windows (max tokens) - using actual OpenRouter model IDs
  // Values verified via web search (Nov 2025) for accurate context tracking
  // This is our shortlist for better UX, but ANY model will work (falls back to 100k)
  const MODEL_CONTEXT: Record<string, number> = {
    "x-ai/grok-code-fast-1": 256000,              // 256k (verified: released with 256k context)
    "openai/gpt-5-codex": 400000,                 // 400k (verified: 272k input + 128k output)
    "minimax/minimax-m2": 204800,                 // 200k (verified: M2 reduced from M1's 1M to 200k)
    "z-ai/glm-4.6": 200000,                       // 200k (verified: expanded from 128k in GLM-4.5)
    "qwen/qwen3-vl-235b-a22b-instruct": 256000,   // 256k (verified: native 256k, expandable to 1M)
    "anthropic/claude-sonnet-4.5": 200000,        // 200k (verified: Claude Sonnet 4.5 standard)
  };
  // Default to 100k for unknown models (safe fallback that works with most models)
  const maxTokens = MODEL_CONTEXT[modelDisplay] || 100000;

  // Create ultra-compact status line optimized for thinking mode + cost + context tracking
  // Critical info: directory, model (actual OpenRouter ID), cost, context remaining
  // - Directory: where you are (truncated to 15 chars)
  // - Model: actual OpenRouter model ID (e.g., "x-ai/grok-code-fast-1")
  // - Cost: real-time session cost from Claude Code (total_cost_usd)
  // - Context: percentage of context window remaining
  // - Works with ANY OpenRouter model (uses fallback context size for unknown models)
  // - Reserves ~40 chars for Claude's thinking mode/context UI elements
  const settings = {
    statusLine: {
      type: "command",
      command: `JSON=$(cat) && DIR=$(basename "$(pwd)") && [ \${#DIR} -gt 15 ] && DIR="\${DIR:0:12}..." || true && COST=$(echo "$JSON" | grep -o '"total_cost_usd":[0-9.]*' | cut -d: -f2) && [ -z "$COST" ] && COST="0" || true && CTX=$(echo "scale=0; (${maxTokens} - $(echo "$JSON" | grep -o '"total_tokens":[0-9]*' | cut -d: -f2 | head -1 || echo 0)) * 100 / ${maxTokens}" | bc 2>/dev/null || echo "100") && printf "${CYAN}${BOLD}%s${RESET} ${DIM}•${RESET} ${YELLOW}%s${RESET} ${DIM}•${RESET} ${GREEN}\\$%.3f${RESET} ${DIM}•${RESET} ${MAGENTA}%s%%${RESET}\\n" "$DIR" "$CLAUDISH_ACTIVE_MODEL_NAME" "$COST" "$CTX"`,
      padding: 0,
    },
  };

  writeFileSync(tempPath, JSON.stringify(settings, null, 2), "utf-8");
  return tempPath;
}

/**
 * Run Claude Code CLI with the proxy server
 */
export async function runClaudeWithProxy(
  config: ClaudishConfig,
  proxyUrl: string
): Promise<number> {
  // Use actual OpenRouter model ID (no translation)
  // This ensures ANY model works, not just our shortlist
  const modelId = config.model || "unknown";

  // Create temporary settings file with custom status line for this instance
  const tempSettingsPath = createTempSettingsFile(modelId);

  // Build claude arguments
  const claudeArgs: string[] = [];

  // Add settings file flag first (applies to this instance only)
  claudeArgs.push("--settings", tempSettingsPath);

  // Interactive mode - no automatic arguments
  if (config.interactive) {
    // In interactive mode, add permission skip if enabled
    if (config.autoApprove) {
      claudeArgs.push("--dangerously-skip-permissions");
    }
    if (config.dangerous) {
      claudeArgs.push("--dangerouslyDisableSandbox");
    }
  } else {
    // Single-shot mode - add all arguments
    if (config.autoApprove) {
      claudeArgs.push("--dangerously-skip-permissions");
    }
    if (config.dangerous) {
      claudeArgs.push("--dangerouslyDisableSandbox");
    }
    // Add user-provided args (including prompt)
    claudeArgs.push(...config.claudeArgs);
  }

  // Environment variables for Claude Code
  const env = {
    ...process.env,
    // Point Claude Code to our local proxy
    ANTHROPIC_BASE_URL: proxyUrl,
    // Use existing ANTHROPIC_API_KEY from environment if available
    // Otherwise use a placeholder (proxy handles real auth with OPENROUTER_API_KEY)
    // Note: If prompt appears, select "Yes" - the key is not used (proxy intercepts all requests)
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "sk-ant-api03-placeholder-not-used-proxy-handles-auth-with-openrouter-key-xxxxxxxxxxxxxxxxxxxxx",
    // Set active model ID for status line (actual OpenRouter model ID)
    [ENV.CLAUDISH_ACTIVE_MODEL_NAME]: modelId,
  };

  if (config.interactive) {
    console.log(`\n[claudish] Starting Claude Code in INTERACTIVE mode`);
    console.log(`[claudish] Model: ${modelId}`);
    console.log(`[claudish] Proxy URL: ${proxyUrl}`);
    console.log(`[claudish] Status line: dir • ${modelId} • $cost • ctx% (live)`);
    console.log(`[claudish] Tracking: Real-time cost + context window usage`);
    console.log(`[claudish] Thinking mode: Optimized ultra-compact layout`);
    console.log(`[claudish] Supports: ANY OpenRouter model (not just shortlist)`);
    console.log(`[claudish] You can now interact with Claude Code directly`);
    console.log(`[claudish] Press Ctrl+C or type 'exit' to quit\n`);
  } else {
    console.log(`\n[claudish] Starting Claude Code with ${modelId}`);
    console.log(`[claudish] Proxy URL: ${proxyUrl}`);
    console.log(`[claudish] Status line: dir • ${modelId} • $cost • ctx% (live)`);
    console.log(`[claudish] Arguments: ${claudeArgs.join(" ")}\n`);
  }

  // Spawn claude CLI process
  const proc = Bun.spawn(["claude", ...claudeArgs], {
    env,
    stdout: "inherit", // Stream to parent stdout
    stderr: "inherit", // Stream to parent stderr
    stdin: "inherit", // Allow user input
  });

  // Handle process termination signals (includes cleanup)
  setupSignalHandlers(proc, tempSettingsPath);

  // Wait for claude to exit
  const exitCode = await proc.exited;

  // Clean up temporary settings file
  try {
    unlinkSync(tempSettingsPath);
  } catch (error) {
    // Ignore cleanup errors
  }

  return exitCode;
}

/**
 * Setup signal handlers to gracefully shutdown
 */
function setupSignalHandlers(proc: Subprocess, tempSettingsPath: string): void {
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];

  for (const signal of signals) {
    process.on(signal, () => {
      console.log(`\n[claudish] Received ${signal}, shutting down...`);
      proc.kill();
      // Clean up temp settings file
      try {
        unlinkSync(tempSettingsPath);
      } catch {
        // Ignore cleanup errors
      }
      process.exit(0);
    });
  }
}

/**
 * Check if Claude Code CLI is installed
 */
export async function checkClaudeInstalled(): Promise<boolean> {
  try {
    const proc = Bun.spawn(["which", "claude"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch {
    return false;
  }
}
