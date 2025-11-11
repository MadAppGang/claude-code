# Claudish MCP Server

MCP (Model Context Protocol) server that provides tools for calling external AI models via OpenRouter. This replaces the need for separate Codex proxy agents by providing MCP tools that Claude can use to invoke external AI models for specialized tasks.

## Overview

The Claudish MCP server enables Claude Code to call external AI models (like OpenAI's Codex, xAI's Grok, MiniMax, etc.) for specialized tasks such as:

- **Code Review** - Get a second opinion on code quality and architecture
- **UI/UX Review** - Validate design implementation and user experience
- **Design Validation** - Check design fidelity and consistency
- **Technical Analysis** - Complex technical questions and analysis

## Architecture

Instead of using proxy agents that run as separate Claude sessions, this MCP server:

1. **Exposes MCP tools** - Claude can call `call_external_ai` tool directly
2. **Routes to OpenRouter** - Makes API calls to OpenRouter with selected model
3. **Returns responses** - External AI model's response comes back as tool result
4. **Stays in context** - Claude stays in control and makes decisions

### Before (Proxy Agents)
```
Claude → Task Agent → Spawns Codex Agent → Proxies to Claude with Codex model → Returns
```

### After (MCP Server)
```
Claude → Calls MCP tool → Routes to OpenRouter → Returns result to Claude
```

## Installation

### 1. Install Dependencies

```bash
cd mcp/claudish-mcp
bun install
```

### 2. Build

```bash
bun run build
```

### 3. Configure Environment

Add to your `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "OPENROUTER_API_KEY": "your-openrouter-api-key-here"
  }
}
```

Get your OpenRouter API key: https://openrouter.ai/keys

### 4. Add to Plugin MCP Configuration

Add to `plugins/frontend/mcp-servers/mcp-config.json`:

```json
{
  "claudish": {
    "command": "node",
    "args": ["/absolute/path/to/mcp/claudish-mcp/dist/index.js"],
    "env": {
      "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}"
    }
  }
}
```

Or use `npx` for published package:

```json
{
  "claudish": {
    "command": "npx",
    "args": ["-y", "@madappgang/claudish-mcp"],
    "env": {
      "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}"
    }
  }
}
```

## Available Tools

### `call_external_ai`

Call an external AI model for specialized tasks.

**Parameters:**
- `model` (required) - Model to use:
  - `code-review` - OpenAI GPT-5 Codex for code review
  - `ui-review` - OpenAI GPT-5 Codex for UI/UX review
  - `design-review` - OpenAI GPT-5 Codex for design validation
  - `grok-fast` - xAI Grok for fast coding tasks
  - `minimax` - MiniMax M2 for high-performance tasks
  - `qwen-vision` - Alibaba Qwen for vision-language tasks
- `prompt` (required) - The task/question to send to the AI
- `system_prompt` (optional) - System prompt to set context and role
- `max_tokens` (optional) - Maximum response length (default: 4000)

**Example Usage:**

```typescript
// In a Claude Code agent
const result = await mcp__claudish__call_external_ai({
  model: 'code-review',
  prompt: 'Review this TypeScript code for best practices and potential bugs:\n\n' + code,
  system_prompt: 'You are a senior TypeScript developer conducting a code review.'
});
```

### `list_available_models`

List all available AI models and their recommended use cases.

**Example Usage:**

```typescript
const models = await mcp__claudish__list_available_models({});
console.log(models);
```

## Replacing Codex Agents

### Old Approach (Proxy Agents)

Previously, we had separate agents that proxied to external AI:

- `codex-code-reviewer` - Code review via Codex
- `ui-developer-codex` - UI review via Codex
- `designer-codex` - Design review via Codex

These agents:
- Required spawning new Task agents
- Lost context between calls
- Added complexity to orchestration
- Made it harder to reason about the flow

### New Approach (MCP Tools)

Now, any agent can directly call external AI models:

**Example: Code Review in /implement command**

```markdown
## PHASE 3: Code Review

1. **Run Senior Code Reviewer** (in parallel with MCP call)
2. **Call Codex via MCP**:
   ```typescript
   const codexReview = await mcp__claudish__call_external_ai({
     model: 'code-review',
     prompt: `Review this implementation:\n\n${code}\n\nFocus on: type safety, error handling, performance`,
     system_prompt: 'Senior TypeScript expert conducting production code review.'
   });
   ```
3. **Synthesize both reviews** and create action items

**Benefits:**
- ✅ Simpler orchestration - direct MCP calls instead of agent spawning
- ✅ Better context - stays in same agent, sees full conversation
- ✅ Faster execution - fewer round trips
- ✅ Easier to debug - clear tool calls visible in logs
- ✅ More flexible - can call any model for any task

## Usage in Agents

### Agent Instructions Update

Update agent instructions to use MCP tools instead of spawning Codex agents:

**Before:**
```markdown
Use the Task tool to spawn codex-code-reviewer agent for code review.
```

**After:**
```markdown
Use the mcp__claudish__call_external_ai tool with model='code-review' for expert code review.

Example:
const review = await mcp__claudish__call_external_ai({
  model: 'code-review',
  prompt: 'Review this code for: ' + focusAreas + '\n\n' + code,
  system_prompt: 'Expert TypeScript reviewer for production code.'
});
```

### Example: UI Developer Agent

```markdown
For complex design validation, call external design expert:

const designFeedback = await mcp__claudish__call_external_ai({
  model: 'design-review',
  prompt: `Validate this UI implementation against design:\n\nDesign: ${designRef}\n\nImplementation: ${code}`,
  system_prompt: 'Senior UI/UX designer validating pixel-perfect implementation.'
});
```

## Available Models

| Model Key | OpenRouter Model | Best For |
|-----------|------------------|----------|
| `code-review` | `openai/gpt-5-codex` | Code quality, architecture, best practices |
| `ui-review` | `openai/gpt-5-codex` | UI/UX implementation review |
| `design-review` | `openai/gpt-5-codex` | Design fidelity validation |
| `grok-fast` | `x-ai/grok-code-fast-1` | Fast coding tasks |
| `minimax` | `minimax/minimax-m2` | High-performance general tasks |
| `qwen-vision` | `qwen/qwen3-vl-235b-a22b-instruct` | Vision-language tasks |

## Development

### Run in Dev Mode

```bash
bun run dev
```

### Type Check

```bash
bun run typecheck
```

### Lint & Format

```bash
bun run lint
bun run format
```

## Configuration

### Environment Variables

- `OPENROUTER_API_KEY` (required) - Your OpenRouter API key

### Model Configuration

Edit `src/index.ts` to add or change models:

```typescript
const MODELS = {
  'code-review': 'openai/gpt-5-codex',
  'custom-model': 'provider/model-name',
  // Add more models...
};
```

## Security

- **API Key Safety**: Store `OPENROUTER_API_KEY` in `.claude/settings.local.json` (gitignored)
- **No Secrets in Git**: Never commit API keys to the repository
- **Personal Keys**: Each developer should use their own OpenRouter API key
- **Rate Limiting**: OpenRouter has rate limits - be mindful of API usage

## Troubleshooting

### "OPENROUTER_API_KEY environment variable is required"

**Solution**: Add your OpenRouter API key to `.claude/settings.local.json`:

```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-v1-..."
  }
}
```

### "Unknown model: xyz"

**Solution**: Check available models with `list_available_models` tool or refer to the Models table above.

### "OpenRouter API error: 401"

**Solution**: Your API key is invalid or expired. Get a new key from https://openrouter.ai/keys

### MCP Server Not Appearing in `/mcp`

**Solution**:
1. Verify MCP server is built: `bun run build`
2. Check MCP configuration in plugin's `mcp-config.json`
3. Verify environment variable is set
4. Restart Claude Code

## License

MIT - See LICENSE file for details

## Author

Jack Rudenko <i@madappgang.com> @ MadAppGang
