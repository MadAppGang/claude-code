import { ENV } from "./config.js";
import type { ClaudishConfig } from "./types.js";
import { loadModelInfo, getAvailableModels } from "./model-loader.js";

/**
 * Parse CLI arguments and environment variables
 */
export function parseArgs(args: string[]): ClaudishConfig {
  const config: Partial<ClaudishConfig> = {
    model: undefined, // Will prompt interactively if not provided
    autoApprove: true, // Skip permissions by default (--dangerously-skip-permissions)
    dangerous: false,
    interactive: false, // Single-shot mode by default
    debug: false, // No debug logging by default
    logLevel: "info", // Default to info level (structured logging with truncated content)
    quiet: undefined, // Will be set based on mode (true for single-shot, false for interactive)
    jsonOutput: false, // No JSON output by default
    monitor: false, // Monitor mode disabled by default
    stdin: false, // Read prompt from stdin instead of args
    claudeArgs: [],
  };

  // Check for environment variable overrides
  // Priority order: CLAUDISH_MODEL (Claudish-specific) > ANTHROPIC_MODEL (Claude Code standard)
  // CLI --model flag will override both (handled later in arg parsing)
  const claudishModel = process.env[ENV.CLAUDISH_MODEL];
  const anthropicModel = process.env[ENV.ANTHROPIC_MODEL];

  if (claudishModel) {
    config.model = claudishModel; // Claudish-specific takes priority
  } else if (anthropicModel) {
    config.model = anthropicModel; // Fall back to Claude Code standard
  }

  const envPort = process.env[ENV.CLAUDISH_PORT];
  if (envPort) {
    const port = Number.parseInt(envPort, 10);
    if (!Number.isNaN(port)) {
      config.port = port;
    }
  }

  // Parse command line arguments
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--model" || arg === "-m") {
      const modelArg = args[++i];
      if (!modelArg) {
        console.error("--model requires a value");
        printAvailableModels();
        process.exit(1);
      }
      config.model = modelArg; // Accept any model ID
    } else if (arg === "--port" || arg === "-p") {
      const portArg = args[++i];
      if (!portArg) {
        console.error("--port requires a value");
        process.exit(1);
      }
      const port = Number.parseInt(portArg, 10);
      if (Number.isNaN(port) || port < 1 || port > 65535) {
        console.error(`Invalid port: ${portArg}`);
        process.exit(1);
      }
      config.port = port;
    } else if (arg === "--no-auto-approve") {
      config.autoApprove = false;
    } else if (arg === "--dangerous") {
      config.dangerous = true;
    } else if (arg === "--interactive" || arg === "-i") {
      config.interactive = true;
    } else if (arg === "--debug" || arg === "-d") {
      config.debug = true;
    } else if (arg === "--log-level") {
      const levelArg = args[++i];
      if (!levelArg || !["debug", "info", "minimal"].includes(levelArg)) {
        console.error("--log-level requires one of: debug, info, minimal");
        process.exit(1);
      }
      config.logLevel = levelArg as "debug" | "info" | "minimal";
    } else if (arg === "--quiet" || arg === "-q") {
      config.quiet = true;
    } else if (arg === "--verbose" || arg === "-v") {
      config.quiet = false;
    } else if (arg === "--json") {
      config.jsonOutput = true;
    } else if (arg === "--monitor") {
      config.monitor = true;
    } else if (arg === "--stdin") {
      config.stdin = true;
    } else if (arg === "--cost-tracker") {
      // Enable cost tracking for this session
      config.costTracking = true;
      // In monitor mode, we'll track costs instead of proxying
      if (!config.monitor) {
        config.monitor = true; // Switch to monitor mode to track requests
      }
    } else if (arg === "--audit-costs") {
      // Special mode to just show cost analysis
      config.auditCosts = true;
    } else if (arg === "--reset-costs") {
      // Reset accumulated cost statistics
      config.resetCosts = true;
    } else if (arg === "--version") {
      printVersion();
      process.exit(0);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--list-models") {
      printAvailableModels();
      process.exit(0);
    } else {
      // All remaining args go to claude CLI
      config.claudeArgs = args.slice(i);
      break;
    }

    i++;
  }

  // Determine if this will be interactive mode BEFORE API key check
  // If no prompt provided and not explicitly interactive, default to interactive mode
  // Exception: --stdin mode reads prompt from stdin, so don't default to interactive
  if ((!config.claudeArgs || config.claudeArgs.length === 0) && !config.stdin) {
    config.interactive = true;
  }

  // Handle API keys based on mode
  if (config.monitor) {
    // Monitor mode: extracts API key from Claude Code's requests
    // No need for user to provide API key - we intercept it from Claude Code
    // IMPORTANT: Unset ANTHROPIC_API_KEY if it's a placeholder, so Claude Code uses its native auth
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.includes('placeholder')) {
      delete process.env.ANTHROPIC_API_KEY;
      if (!config.quiet) {
        console.log("[claudish] Removed placeholder API key - Claude Code will use native authentication");
      }
    }

    if (!config.quiet) {
      console.log("[claudish] Monitor mode enabled - proxying to real Anthropic API");
      console.log("[claudish] API key will be extracted from Claude Code's requests");
      console.log("[claudish] Ensure you are logged in to Claude Code (claude auth login)");
    }
  } else {
    // OpenRouter mode: requires OpenRouter API key
    const apiKey = process.env[ENV.OPENROUTER_API_KEY];
    if (!apiKey) {
      // In interactive mode, we'll prompt for it later
      // In non-interactive mode, it's required now
      if (!config.interactive) {
        console.error("Error: OPENROUTER_API_KEY environment variable is required");
        console.error("Get your API key from: https://openrouter.ai/keys");
        console.error("");
        console.error("Set it now:");
        console.error("  export OPENROUTER_API_KEY='sk-or-v1-...'");
        process.exit(1);
      }
      // Will be prompted for in interactive mode
      config.openrouterApiKey = undefined;
    } else {
      config.openrouterApiKey = apiKey;
    }

    // Note: ANTHROPIC_API_KEY is NOT required here
    // claude-runner.ts automatically sets a placeholder if not provided (see line 138)
    // This allows single-variable setup - users only need OPENROUTER_API_KEY
    config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  }

  // Set default for quiet mode if not explicitly set
  // Single-shot mode: quiet by default
  // Interactive mode: verbose by default
  // JSON output: always quiet
  if (config.quiet === undefined) {
    config.quiet = !config.interactive;
  }
  if (config.jsonOutput) {
    config.quiet = true; // JSON output mode is always quiet
  }

  return config as ClaudishConfig;
}

/**
 * Print version information
 */
function printVersion(): void {
  console.log("claudish version 1.3.1");
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
claudish - Run Claude Code with OpenRouter models

USAGE:
  claudish                                # Interactive mode (default, shows model selector)
  claudish [OPTIONS] <claude-args...>     # Single-shot mode (requires --model)

OPTIONS:
  -i, --interactive        Run in interactive mode (default when no prompt given)
  -m, --model <model>      OpenRouter model to use (required for single-shot mode)
  -p, --port <port>        Proxy server port (default: random)
  -d, --debug              Enable debug logging to file (logs/claudish_*.log)
  --log-level <level>      Log verbosity: debug (full), info (truncated), minimal (labels only)
  -q, --quiet              Suppress [claudish] log messages (default in single-shot mode)
  -v, --verbose            Show [claudish] log messages (default in interactive mode)
  --json                   Output in JSON format for tool integration (implies --quiet)
  --stdin                  Read prompt from stdin (useful for large prompts or piping)
  --monitor                Monitor mode - proxy to REAL Anthropic API and log all traffic
  --no-auto-approve        Disable auto permission skip (prompts enabled)
  --dangerous              Pass --dangerouslyDisableSandbox to Claude Code
  --cost-tracker           Enable cost tracking for API usage (NB!)
  --audit-costs            Show cost analysis report
  --reset-costs            Reset accumulated cost statistics
  --list-models            List available OpenRouter models
  --version                Show version information
  -h, --help               Show this help message

MODES:
  • Interactive mode (default): Shows model selector, starts persistent session
  • Single-shot mode: Runs one task in headless mode and exits (requires --model)

NOTES:
  • Permission prompts are SKIPPED by default (--dangerously-skip-permissions)
  • Use --no-auto-approve to enable permission prompts
  • Model selector appears ONLY in interactive mode when --model not specified
  • Use --dangerous to disable sandbox (use with extreme caution!)

ENVIRONMENT VARIABLES:
  OPENROUTER_API_KEY              Required: Your OpenRouter API key
  CLAUDISH_MODEL                  Default model to use (takes priority)
  ANTHROPIC_MODEL                 Claude Code standard: model to use (fallback if CLAUDISH_MODEL not set)
  ANTHROPIC_SMALL_FAST_MODEL      Claude Code standard: fast model (auto-set by claudish)
  CLAUDISH_PORT                   Default port for proxy
  CLAUDISH_ACTIVE_MODEL_NAME      Auto-set by claudish (read-only) - shows active model in status line

EXAMPLES:
  # Interactive mode (default) - shows model selector
  claudish
  claudish --interactive

  # Interactive mode with pre-selected model
  claudish --model x-ai/grok-code-fast-1

  # Single-shot mode - one task and exit (requires --model or CLAUDISH_MODEL env var)
  claudish --model openai/gpt-5-codex "implement user authentication"
  claudish --model x-ai/grok-code-fast-1 "add tests for login"

  # Use stdin for large prompts (e.g., git diffs, code review)
  echo "Review this code..." | claudish --stdin --model x-ai/grok-code-fast-1
  git diff | claudish --stdin --model openai/gpt-5-codex "Review these changes"

  # Monitor mode - understand how Claude Code works (requires real Anthropic API key)
  claudish --monitor --debug "analyze code structure"

  # Disable auto-approve (require manual confirmation)
  claudish --no-auto-approve "make changes to config"

  # Dangerous mode (disable sandbox - use with extreme caution)
  claudish --dangerous "refactor entire codebase"

  # Both flags (fully autonomous)
  claudish --dangerous "refactor entire codebase"

  # With custom port
  claudish --port 3000 "analyze code structure"

  # Pass flags to claude
  claudish --model x-ai/grok-code-fast-1 --verbose "debug issue"

  # JSON output for tool integration (quiet by default)
  claudish --json "list 5 prime numbers"

  # Verbose mode in single-shot (show [claudish] logs)
  claudish --verbose "analyze code structure"

AVAILABLE MODELS:
  Run: claudish --list-models

MORE INFO:
  GitHub: https://github.com/MadAppGang/claude-code
  OpenRouter: https://openrouter.ai
`);
}

/**
 * Print available models
 */
function printAvailableModels(): void {
  console.log("\nAvailable OpenRouter Models (in priority order):\n");

  const models = getAvailableModels();
  const modelInfo = loadModelInfo();

  for (const model of models) {
    const info = modelInfo[model];
    console.log(`  ${model}`);
    console.log(`    ${info.name} - ${info.description}`);
    console.log("");
  }

  console.log("Set default with: export CLAUDISH_MODEL=<model>");
  console.log("               or: export ANTHROPIC_MODEL=<model>");
  console.log("Or use: claudish --model <model> ...\n");
}
