import { ENV, MODEL_INFO } from "./config.js";
import { OPENROUTER_MODELS, type ClaudishConfig } from "./types.js";

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
    quiet: undefined, // Will be set based on mode (true for single-shot, false for interactive)
    jsonOutput: false, // No JSON output by default
    claudeArgs: [],
  };

  // Check for environment variable overrides
  const envModel = process.env[ENV.CLAUDISH_MODEL];
  if (envModel) {
    config.model = envModel; // Accept any model ID from env
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
    } else if (arg === "--quiet" || arg === "-q") {
      config.quiet = true;
    } else if (arg === "--verbose" || arg === "-v") {
      config.quiet = false;
    } else if (arg === "--json") {
      config.jsonOutput = true;
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

  // Get OpenRouter API key
  const apiKey = process.env[ENV.OPENROUTER_API_KEY];
  if (!apiKey) {
    console.error("Error: OPENROUTER_API_KEY environment variable is required");
    console.error("Get your API key from: https://openrouter.ai/keys");
    process.exit(1);
  }
  config.openrouterApiKey = apiKey;

  // Require ANTHROPIC_API_KEY to prevent Claude Code dialog
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("\nError: ANTHROPIC_API_KEY is not set");
    console.error("This placeholder key is required to prevent Claude Code from prompting.");
    console.error("");
    console.error("Set it now:");
    console.error("  export ANTHROPIC_API_KEY='sk-ant-api03-placeholder'");
    console.error("");
    console.error("Or add it to your shell profile (~/.zshrc or ~/.bashrc) to set permanently.");
    console.error("");
    console.error("Note: This key is NOT used for auth - claudish uses OPENROUTER_API_KEY");
    process.exit(1);
  }

  // Validate we have some arguments for claude (unless in interactive mode)
  if (!config.interactive && (!config.claudeArgs || config.claudeArgs.length === 0)) {
    console.error("Error: No arguments provided for Claude Code");
    console.error("Usage: claudish [options] <claude-args...>");
    console.error("Or use: claudish --interactive");
    console.error("Try: claudish --help");
    process.exit(1);
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
 * Print help message
 */
function printHelp(): void {
  console.log(`
claudish - Run Claude Code with OpenRouter models

USAGE:
  claudish [OPTIONS] <claude-args...>
  claudish --interactive [OPTIONS]

OPTIONS:
  -i, --interactive        Run Claude Code in interactive mode (persistent session)
  -m, --model <model>      OpenRouter model to use (shows interactive selector if not provided)
  -p, --port <port>        Proxy server port (default: random)
  -d, --debug              Enable debug logging to file (logs/claudish_*.log)
  -q, --quiet              Suppress [claudish] log messages (default in single-shot mode)
  -v, --verbose            Show [claudish] log messages (default in interactive mode)
  --json                   Output in JSON format for tool integration (implies --quiet)
  --no-auto-approve        Disable auto permission skip (prompts enabled)
  --dangerous              Pass --dangerouslyDisableSandbox to Claude Code
  --list-models            List available OpenRouter models
  -h, --help               Show this help message

MODES:
  • Single-shot mode (default): Runs one task in headless mode and exits (uses -p flag)
  • Interactive mode (--interactive): Starts persistent session, you interact with Claude directly

NOTES:
  • Permission prompts are SKIPPED by default (--dangerously-skip-permissions)
  • Use --no-auto-approve to enable permission prompts
  • If no model is specified, an interactive selector will appear
  • Use --dangerous to disable sandbox (use with extreme caution!)

ENVIRONMENT VARIABLES:
  OPENROUTER_API_KEY              Required: Your OpenRouter API key
  CLAUDISH_MODEL                  Default model to use
  CLAUDISH_PORT                   Default port for proxy
  CLAUDISH_ACTIVE_MODEL_NAME      Auto-set by claudish (read-only) - shows active model in status line

EXAMPLES:
  # Interactive mode - persistent session (recommended for development)
  claudish --interactive
  claudish -i --model x-ai/grok-code-fast-1

  # Single-shot mode - one task and exit
  claudish "implement user authentication"
  claudish --model openai/gpt-5-codex "add tests for login"

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

  for (const model of OPENROUTER_MODELS) {
    const info = MODEL_INFO[model];
    console.log(`  ${model}`);
    console.log(`    ${info.name} - ${info.description}`);
    console.log("");
  }

  console.log("Set default with: export CLAUDISH_MODEL=<model>");
  console.log("Or use: claudish --model <model> ...\n");
}
