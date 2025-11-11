# Claudish

> Run Claude Code with OpenRouter models via local proxy

**Claudish** (Claude-ish) is a CLI tool that allows you to run Claude Code with any OpenRouter model by proxying requests through a local Anthropic API-compatible server.

## Features

- ✅ **Monitor mode** - Proxy to real Anthropic API and log all traffic (for debugging)
- ✅ **Protocol compliance** - 1:1 compatibility with Claude Code communication protocol
- ✅ **Snapshot testing** - Comprehensive test suite with 13/13 passing tests
- ✅ **Headless mode** - Automatic print mode for non-interactive execution
- ✅ **Quiet mode** - Clean output by default (no log pollution)
- ✅ **JSON output** - Structured data for tool integration
- ✅ **Real-time streaming** - See Claude Code output as it happens
- ✅ **Parallel runs** - Each instance gets isolated proxy
- ✅ **Autonomous mode** - Bypass all prompts with flags
- ✅ **Context inheritance** - Runs in current directory with same `.claude` settings
- ✅ **Multiple models** - 5 prioritized OpenRouter models

## Installation

### Prerequisites

- [Bun](https://bun.sh) - JavaScript runtime
- [Claude Code](https://claude.com/claude-code) - Claude CLI must be installed
- [OpenRouter API Key](https://openrouter.ai/keys) - Free tier available

### Install Claudish

```bash
cd mcp/claudish
bun install
bun run build
bun link
```

This makes `claudish` globally available in your terminal.

## Quick Start

### 1. Set up environment

```bash
# Copy example env file
cp .env.example .env

# Add your OpenRouter API key
export OPENROUTER_API_KEY=sk-or-v1-...

# Recommended: Set placeholder to avoid Claude Code's API key prompt
export ANTHROPIC_API_KEY=sk-ant-api03-placeholder
```

### 2. Run claudish

```bash
# Basic usage (auto-approve enabled by default)
claudish "implement user authentication"

# Use specific model
claudish --model openai/gpt-5-codex "add tests"

# Fully autonomous mode (auto-approve + dangerous)
claudish --dangerous "refactor codebase"
```

## Usage

### Basic Syntax

```bash
claudish [OPTIONS] <claude-args...>
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --interactive` | Run in interactive mode (persistent session) | Single-shot mode |
| `-m, --model <model>` | OpenRouter model to use | `x-ai/grok-code-fast-1` |
| `-p, --port <port>` | Proxy server port | Random (3000-9000) |
| `-q, --quiet` | Suppress [claudish] log messages | **Quiet in single-shot** |
| `-v, --verbose` | Show [claudish] log messages | Verbose in interactive |
| `--json` | Output in JSON format (implies --quiet) | `false` |
| `-d, --debug` | Enable debug logging to file | `false` |
| `--no-auto-approve` | Disable auto-approve (require prompts) | Auto-approve **enabled** |
| `--dangerous` | Pass `--dangerouslyDisableSandbox` | `false` |
| `--list-models` | List available models | - |
| `-h, --help` | Show help message | - |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | ✅ Yes |
| `ANTHROPIC_API_KEY` | Placeholder to prevent Claude Code dialog (not used for auth) | ✅ **Required** |
| `CLAUDISH_MODEL` | Default model to use | ❌ No |
| `CLAUDISH_PORT` | Default proxy port | ❌ No |
| `CLAUDISH_ACTIVE_MODEL_NAME` | Automatically set by claudish to show active model in status line (read-only) | ❌ No |

**Important:** You MUST set `ANTHROPIC_API_KEY=sk-ant-api03-placeholder` (or any value). Without it, Claude Code will show a dialog, and if you select "No", it will bypass the proxy and use real Anthropic API. Claudish now enforces this requirement.

## Available Models

Claudish supports 5 OpenRouter models in priority order:

1. **x-ai/grok-code-fast-1** (Default)
   - Fast coding-focused model from xAI
   - Best for quick iterations

2. **openai/gpt-5-codex**
   - Advanced coding model from OpenAI
   - Best for complex implementations

3. **minimax/minimax-m2**
   - High-performance model from MiniMax
   - Good for general coding tasks

4. **zhipu-ai/glm-4.6**
   - Advanced model from Zhipu AI
   - Good for multilingual code

5. **qwen/qwen3-vl-235b-a22b-instruct**
   - Vision-language model from Alibaba
   - Best for UI/visual tasks

List models anytime with:

```bash
claudish --list-models
```

## Status Line Display

Claudish automatically shows critical information in the Claude Code status bar - **no setup required!**

**Ultra-Compact Format:** `directory • model-id • $cost • ctx%`

**Visual Design:**
- 🔵 **Directory** (bright cyan, bold) - Where you are
- 🟡 **Model ID** (bright yellow) - Actual OpenRouter model ID
- 🟢 **Cost** (bright green) - Real-time session cost from OpenRouter
- 🟣 **Context** (bright magenta) - % of context window remaining
- ⚪ **Separators** (dim) - Visual dividers

**Examples:**
- `claudish • x-ai/grok-code-fast-1 • $0.003 • 95%` - Using Grok, $0.003 spent, 95% context left
- `my-project • openai/gpt-5-codex • $0.12 • 67%` - Using GPT-5, $0.12 spent, 67% context left
- `backend • minimax/minimax-m2 • $0.05 • 82%` - Using MiniMax M2, $0.05 spent, 82% left
- `test • openrouter/auto • $0.01 • 90%` - Using any custom model, $0.01 spent, 90% left

**Critical Tracking (Live Updates):**
- 💰 **Cost tracking** - Real-time USD from Claude Code session data
- 📊 **Context monitoring** - Percentage of model's context window remaining
- ⚡ **Performance optimized** - Ultra-compact to fit with thinking mode UI

**Thinking Mode Optimized:**
- ✅ **Ultra-compact** - Directory limited to 15 chars (leaves room for everything)
- ✅ **Critical first** - Most important info (directory, model) comes first
- ✅ **Smart truncation** - Long directories shortened with "..."
- ✅ **Space reservation** - Reserves ~40 chars for Claude's thinking mode UI
- ✅ **Color-coded** - Instant visual scanning
- ✅ **No overflow** - Fits perfectly even with thinking mode enabled

**Custom Model Support:**
- ✅ **ANY OpenRouter model** - Not limited to shortlist (e.g., `openrouter/auto`, custom models)
- ✅ **Actual model IDs** - Shows exact OpenRouter model ID (no translation)
- ✅ **Context fallback** - Unknown models use 100k context window (safe default)
- ✅ **Shortlist optimized** - Our recommended models have accurate context sizes
- ✅ **Future-proof** - Works with new models added to OpenRouter

**How it works:**
- Each Claudish instance creates a temporary settings file with custom status line
- Settings use `--settings` flag (doesn't modify global Claude Code config)
- Status line uses simple bash script with ANSI colors (no external dependencies!)
- Displays actual OpenRouter model ID from `CLAUDISH_ACTIVE_MODEL_NAME` env var
- Context tracking uses model-specific sizes for our shortlist, 100k fallback for others
- Temp files are automatically cleaned up when Claudish exits
- Each instance is completely isolated - run multiple in parallel!

**Per-instance isolation:**
- ✅ Doesn't modify `~/.claude/settings.json`
- ✅ Each instance has its own config
- ✅ Safe to run multiple Claudish instances in parallel
- ✅ Standard Claude Code unaffected
- ✅ Temp files auto-cleanup on exit
- ✅ No external dependencies (bash only, no jq!)

## Examples

### Basic Usage

```bash
# Simple prompt
claudish "fix the bug in user.ts"

# Multi-word prompt
claudish "implement user authentication with JWT tokens"
```

### With Specific Model

```bash
# Use Grok for fast coding
claudish --model x-ai/grok-code-fast-1 "add error handling"

# Use GPT-5 Codex for complex tasks
claudish --model openai/gpt-5-codex "refactor entire API layer"

# Use Qwen for UI tasks
claudish --model qwen/qwen3-vl-235b-a22b-instruct "implement dashboard UI"
```

### Autonomous Mode

Auto-approve is **enabled by default**. For fully autonomous mode, add `--dangerous`:

```bash
# Basic usage (auto-approve already enabled)
claudish "delete unused files"

# Fully autonomous (auto-approve + dangerous sandbox disabled)
claudish --dangerous "install dependencies"

# Disable auto-approve if you want prompts
claudish --no-auto-approve "make important changes"
```

### Custom Port

```bash
# Use specific port
claudish --port 3000 "analyze codebase"

# Or set default
export CLAUDISH_PORT=3000
claudish "your task"
```

### Passing Claude Flags

```bash
# Verbose mode
claudish "debug issue" --verbose

# Custom working directory
claudish "analyze code" --cwd /path/to/project

# Multiple flags
claudish --model openai/gpt-5-codex "task" --verbose --debug
```

### Monitor Mode

**NEW!** Claudish now includes a monitor mode to help you understand how Claude Code works internally.

```bash
# Enable monitor mode (requires real Anthropic API key)
claudish --monitor --debug "implement a feature"
```

**What Monitor Mode Does:**
- ✅ **Proxies to REAL Anthropic API** (not OpenRouter) - Uses your actual Anthropic API key
- ✅ **Logs ALL traffic** - Captures complete requests and responses
- ✅ **Both streaming and JSON** - Logs SSE streams and JSON responses
- ✅ **Debug logs to file** - Saves to `logs/claudish_*.log` when `--debug` is used
- ✅ **Pass-through proxy** - No translation, forwards as-is to Anthropic

**When to use Monitor Mode:**
- 🔍 Understanding Claude Code's API protocol
- 🐛 Debugging integration issues
- 📊 Analyzing Claude Code's behavior
- 🔬 Research and development

**Requirements:**
```bash
# Monitor mode requires a REAL Anthropic API key (not placeholder)
export ANTHROPIC_API_KEY='sk-ant-api03-...'

# Use with --debug to save logs to file
claudish --monitor --debug "your task"

# Logs are saved to: logs/claudish_TIMESTAMP.log
```

**Example Output:**
```
[Monitor] Server started on http://127.0.0.1:8765
[Monitor] Mode: Passthrough to real Anthropic API
[Monitor] All traffic will be logged for analysis

=== [MONITOR] Claude Code → Anthropic API Request ===
{
  "model": "claude-sonnet-4.5",
  "messages": [...],
  "max_tokens": 4096,
  ...
}
=== End Request ===

=== [MONITOR] Anthropic API → Claude Code Response (Streaming) ===
event: message_start
data: {"type":"message_start",...}

event: content_block_start
data: {"type":"content_block_start",...}
...
=== End Streaming Response ===
```

**Note:** Monitor mode charges your Anthropic account (not OpenRouter). Use `--debug` flag to save logs for analysis.

### Output Modes

Claudish supports three output modes for different use cases:

#### 1. Quiet Mode (Default in Single-Shot)

Clean output with no `[claudish]` logs - perfect for piping to other tools:

```bash
# Quiet by default in single-shot
claudish "what is 2+2?"
# Output: 2 + 2 equals 4.

# Use in pipelines
claudish "list 3 colors" | grep -i blue

# Redirect to file
claudish "analyze code" > analysis.txt
```

#### 2. Verbose Mode

Show all `[claudish]` log messages for debugging:

```bash
# Verbose mode
claudish --verbose "what is 2+2?"
# Output:
# [claudish] Starting Claude Code with openai/gpt-4o
# [claudish] Proxy URL: http://127.0.0.1:8797
# [claudish] Status line: dir • openai/gpt-4o • $cost • ctx%
# ...
# 2 + 2 equals 4.
# [claudish] Shutting down proxy server...
# [claudish] Done

# Interactive mode is verbose by default
claudish --interactive
```

#### 3. JSON Output Mode

Structured output perfect for automation and tool integration:

```bash
# JSON output (always quiet)
claudish --json "what is 2+2?"
# Output: {"type":"result","result":"2 + 2 equals 4.","total_cost_usd":0.068,"usage":{...}}

# Extract just the result with jq
claudish --json "list 3 colors" | jq -r '.result'

# Get cost and token usage
claudish --json "analyze code" | jq '{result, cost: .total_cost_usd, tokens: .usage.input_tokens}'

# Use in scripts
RESULT=$(claudish --json "check if tests pass" | jq -r '.result')
echo "AI says: $RESULT"

# Track costs across multiple runs
for task in task1 task2 task3; do
  claudish --json "$task" | jq -r '"\(.total_cost_usd)"'
done | awk '{sum+=$1} END {print "Total: $"sum}'
```

**JSON Output Fields:**
- `result` - The AI's response text
- `total_cost_usd` - Total cost in USD
- `usage.input_tokens` - Input tokens used
- `usage.output_tokens` - Output tokens used
- `duration_ms` - Total duration in milliseconds
- `num_turns` - Number of conversation turns
- `modelUsage` - Per-model usage breakdown

## How It Works

### Architecture

```
claudish "your prompt"
    ↓
1. Parse arguments (--model, --no-auto-approve, --dangerous, etc.)
2. Find available port (random or specified)
3. Start local proxy on http://127.0.0.1:PORT
4. Spawn: claude --auto-approve --env ANTHROPIC_BASE_URL=http://127.0.0.1:PORT
5. Proxy translates: Anthropic API → OpenRouter API
6. Stream output in real-time
7. Cleanup proxy on exit
```

### Request Flow

**Normal Mode (OpenRouter):**
```
Claude Code → Anthropic API format → Local Proxy → OpenRouter API format → OpenRouter
                                         ↓
Claude Code ← Anthropic API format ← Local Proxy ← OpenRouter API format ← OpenRouter
```

**Monitor Mode (Anthropic Passthrough):**
```
Claude Code → Anthropic API format → Local Proxy (logs) → Anthropic API
                                         ↓
Claude Code ← Anthropic API format ← Local Proxy (logs) ← Anthropic API
```

### Parallel Runs

Each `claudish` invocation:
- Gets a unique random port
- Starts isolated proxy server
- Runs independent Claude Code instance
- Cleans up on exit

This allows multiple parallel runs:

```bash
# Terminal 1
claudish --model x-ai/grok-code-fast-1 "task A"

# Terminal 2
claudish --model openai/gpt-5-codex "task B"

# Terminal 3
claudish --model minimax/minimax-m2 "task C"
```

## Development

### Project Structure

```
mcp/claudish/
├── src/
│   ├── index.ts              # Main entry point
│   ├── cli.ts                # CLI argument parser
│   ├── proxy-server.ts       # Hono-based proxy server
│   ├── transform.ts          # API format translation (from claude-code-proxy)
│   ├── claude-runner.ts      # Claude CLI runner (creates temp settings)
│   ├── port-manager.ts       # Port utilities
│   ├── config.ts             # Constants and defaults
│   └── types.ts              # TypeScript types
├── tests/                    # Test files
├── package.json
├── tsconfig.json
└── biome.json
```

### Proxy Implementation

Claudish uses a **Hono-based proxy server** inspired by [claude-code-proxy](https://github.com/kiyo-e/claude-code-proxy):

- **Framework**: [Hono](https://hono.dev/) - Fast, lightweight web framework
- **API Translation**: Converts Anthropic API format ↔ OpenAI format
- **Streaming**: Full support for Server-Sent Events (SSE)
- **Tool Calling**: Handles Claude's tool_use ↔ OpenAI's tool_calls
- **Battle-tested**: Based on production-ready claude-code-proxy implementation

**Why Hono?**
- Native Bun support (no adapters needed)
- Extremely fast and lightweight
- Middleware support (CORS, logging, etc.)
- Works across Node.js, Bun, and Cloudflare Workers

### Build & Test

```bash
# Install dependencies
bun install

# Development mode
bun run dev "test prompt"

# Build
bun run build

# Lint
bun run lint

# Format
bun run format

# Type check
bun run typecheck

# Run tests
bun test
```

### Protocol Compliance Testing

Claudish includes a comprehensive snapshot testing system to ensure 1:1 compatibility with the official Claude Code protocol:

```bash
# Run snapshot tests (13/13 passing ✅)
bun test tests/snapshot.test.ts

# Full workflow: capture fixtures + run tests
./tests/snapshot-workflow.sh --full

# Capture new test fixtures from monitor mode
./tests/snapshot-workflow.sh --capture

# Debug SSE events
bun tests/debug-snapshot.ts
```

**What Gets Tested:**
- ✅ Event sequence (message_start → content_block_start → deltas → stop → message_delta → message_stop)
- ✅ Content block indices (sequential: 0, 1, 2, ...)
- ✅ Tool input streaming (fine-grained JSON chunks)
- ✅ Usage metrics (present in message_start and message_delta)
- ✅ Stop reasons (always present and valid)
- ✅ Cache metrics (creation and read tokens)

**Documentation:**
- [Quick Start Guide](./QUICK_START_TESTING.md) - Get started with testing
- [Snapshot Testing Guide](./SNAPSHOT_TESTING.md) - Complete testing documentation
- [Implementation Details](./IMPLEMENTATION_COMPLETE.md) - Technical implementation summary
- [Protocol Compliance Plan](./PROTOCOL_COMPLIANCE_PLAN.md) - Detailed compliance roadmap

### Install Globally

```bash
# Link for global use
bun run install:global

# Now use anywhere
claudish "your task"
```

## Troubleshooting

### "Claude Code CLI is not installed"

Install Claude Code:

```bash
npm install -g claude-code
# or visit: https://claude.com/claude-code
```

### "OPENROUTER_API_KEY environment variable is required"

Set your API key:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
```

Or add to your shell profile (`~/.zshrc`, `~/.bashrc`):

```bash
echo 'export OPENROUTER_API_KEY=sk-or-v1-...' >> ~/.zshrc
source ~/.zshrc
```

### "No available ports found"

Specify a custom port:

```bash
claudish --port 3000 "your task"
```

Or increase port range in `src/config.ts`.

### Proxy errors

Check OpenRouter API status:
- https://openrouter.ai/status

Verify your API key works:
- https://openrouter.ai/keys

### Status line not showing model

If the status line doesn't show the model name:

1. **Check if --settings flag is being passed:**
   ```bash
   # Look for this in Claudish output:
   # [claudish] Instance settings: /tmp/claudish-settings-{timestamp}.json
   ```

2. **Verify environment variable is set:**
   ```bash
   # Should be set automatically by Claudish
   echo $CLAUDISH_ACTIVE_MODEL_NAME
   # Should output something like: xAI/Grok-1
   ```

3. **Test status line command manually:**
   ```bash
   export CLAUDISH_ACTIVE_MODEL_NAME="xAI/Grok-1"
   cat > /dev/null && echo "[$CLAUDISH_ACTIVE_MODEL_NAME] 📁 $(basename "$(pwd)")"
   # Should output: [xAI/Grok-1] 📁 your-directory-name
   ```

4. **Check temp settings file:**
   ```bash
   # File is created in /tmp/claudish-settings-*.json
   ls -la /tmp/claudish-settings-*.json 2>/dev/null | tail -1
   cat /tmp/claudish-settings-*.json | head -1
   ```

5. **Verify bash is available:**
   ```bash
   which bash
   # Should show path to bash (usually /bin/bash or /usr/bin/bash)
   ```

**Note:** Temp settings files are automatically cleaned up when Claudish exits. If you see multiple files, you may have crashed instances - they're safe to delete manually.

## Comparison with Claude Code

| Feature | Claude Code | Claudish |
|---------|-------------|----------|
| Model | Anthropic models only | Any OpenRouter model |
| API | Anthropic API | OpenRouter API |
| Cost | Anthropic pricing | OpenRouter pricing |
| Setup | API key → direct | API key → proxy → OpenRouter |
| Speed | Direct connection | ~Same (local proxy) |
| Features | All Claude Code features | All Claude Code features |

**When to use Claudish:**
- ✅ Want to try different models (Grok, GPT-5, etc.)
- ✅ Need OpenRouter-specific features
- ✅ Prefer OpenRouter pricing
- ✅ Testing model performance

**When to use Claude Code:**
- ✅ Want latest Anthropic models only
- ✅ Need official Anthropic support
- ✅ Simpler setup (no proxy)

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing`
5. Open Pull Request

## License

MIT © MadAppGang

## Acknowledgments

Claudish's proxy implementation is based on [claude-code-proxy](https://github.com/kiyo-e/claude-code-proxy) by [@kiyo-e](https://github.com/kiyo-e). We've adapted their excellent Hono-based API translation layer for OpenRouter integration.

**Key contributions from claude-code-proxy:**
- Anthropic ↔ OpenAI API format translation (`transform.ts`)
- Streaming response handling with Server-Sent Events
- Tool calling compatibility layer
- Clean Hono framework architecture

Thank you to the claude-code-proxy team for building a robust, production-ready foundation! 🙏

## Links

- **GitHub**: https://github.com/MadAppGang/claude-code
- **OpenRouter**: https://openrouter.ai
- **Claude Code**: https://claude.com/claude-code
- **Bun**: https://bun.sh
- **Hono**: https://hono.dev
- **claude-code-proxy**: https://github.com/kiyo-e/claude-code-proxy

---

Made with ❤️ by [MadAppGang](https://madappgang.com)
