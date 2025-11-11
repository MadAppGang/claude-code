# Monitor Mode - Key Findings

## Test Results Summary

### Test 1: Simple Query with Monitor Mode

**Command:**
```bash
./dist/index.js --monitor --debug "What is 2+2? Answer in one sentence."
```

**Log File:** `logs/claudish_2025-11-10_14-05-42.log`

---

## Key Discoveries

### 1. **Claude Code Protocol Structure**

Claude Code makes multiple API calls in sequence:

1. **Warmup Call** (Haiku 4.5) - Fast model for planning
   - Model: `claude-haiku-4-5-20251001`
   - Purpose: Initial context loading and warmup
   - Contains full system prompts and project context

2. **Main Call** (Sonnet 4.5) - Primary model for execution
   - Model: `claude-sonnet-4-5-20250929`
   - Purpose: Actual task execution
   - Receives tools and can execute them

3. **Tool Execution Calls** (when needed)
   - Subsequent calls with tool results
   - Streams responses back

### 2. **Request Headers**

Claude Code sends comprehensive metadata:

```json
{
  "anthropic-beta": "claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14",
  "anthropic-dangerous-direct-browser-access": "true",
  "anthropic-version": "2023-06-01",
  "user-agent": "claude-cli/2.0.36 (external, cli)",
  "x-api-key": "sk-ant-api03-...",
  "x-app": "cli",
  "x-stainless-arch": "arm64",
  "x-stainless-helper-method": "stream",
  "x-stainless-lang": "js",
  "x-stainless-os": "MacOS",
  "x-stainless-package-version": "0.68.0",
  "x-stainless-runtime": "node",
  "x-stainless-runtime-version": "v24.3.0",
  "x-stainless-timeout": "600"
}
```

**Key Beta Features:**
- `claude-code-20250219` - Claude Code specific features
- `interleaved-thinking-2025-05-14` - Thinking mode support
- `fine-grained-tool-streaming-2025-05-14` - Streaming tool calls

### 3. **Prompt Caching**

Claude Code uses extensive prompt caching with `cache_control`:

```json
{
  "type": "text",
  "text": "...",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

Caching is applied to:
- System prompts
- Project context (CLAUDE.md)
- Tool definitions
- Large context blocks

### 4. **System Prompt Structure**

The system prompt includes:

1. **Identity**
   - "You are Claude Code, Anthropic's official CLI for Claude."

2. **Agent-Specific Instructions**
   - Different instructions for different agent types
   - File search specialist, code reviewer, etc.

3. **Project Context**
   - Full CLAUDE.md contents
   - Wrapped in `<system-reminder>` tags

4. **Environment Information**
   ```
   Working directory: /Users/jack/mag/claude-code/mcp/claudish
   Platform: darwin
   OS Version: Darwin 25.1.0
   Today's date: 2025-11-11
   ```

5. **Git Status**
   - Current branch
   - Modified files
   - Recent commits

### 5. **Tool Definitions**

Claude Code provides these tools:
- `Task` - Launch specialized agents
- `Bash` - Execute shell commands
- `Glob` - File pattern matching
- `Grep` - Content search
- `Read` - Read files
- `Edit` - Edit files
- `Write` - Write files
- `NotebookEdit` - Edit Jupyter notebooks
- `WebFetch` - Fetch web content
- `WebSearch` - Search the web
- `BashOutput` - Get output from background shells
- `KillShell` - Kill background shells
- `Skill` - Execute skills
- `SlashCommand` - Execute slash commands

Each tool has complete JSON Schema definitions with detailed descriptions and parameter specifications.

---

## Current Issues

### Issue 1: API Key Authentication

**Problem:** When `ANTHROPIC_API_KEY` is set to a placeholder (for OpenRouter mode), Claude Code sends that placeholder to Anthropic, which rejects it:

```json
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "invalid x-api-key"
  }
}
```

**Root Cause:** Our OpenRouter mode requires `ANTHROPIC_API_KEY=sk-ant-api03-placeholder` to prevent Claude Code from showing a dialog, but this same placeholder is used in monitor mode.

**Solution Options:**

1. **Option A:** Don't set `ANTHROPIC_API_KEY` when using monitor mode
   - Pros: Claude Code uses its native authentication
   - Cons: May show dialog if not authenticated

2. **Option B:** Detect monitor mode in CLI and skip API key validation
   - Pros: Clean user experience
   - Cons: User still needs to be authenticated with Claude Code

3. **Option C:** Allow users to provide their own Anthropic key for monitor mode
   - Pros: Explicit control
   - Cons: Extra setup step

**Recommended:** Option B - Skip ANTHROPIC_API_KEY validation in monitor mode, let Claude Code handle authentication naturally.

---

## Next Steps

1. ✅ Fix API key handling in monitor mode
2. ⏳ Test with real Claude Code authentication
3. ⏳ Document tool execution patterns
4. ⏳ Document streaming response format
5. ⏳ Test with complex multi-tool scenarios
6. ⏳ Create comprehensive protocol documentation

---

## Monitor Mode Implementation Status

✅ **Working:**
- API key extraction from headers
- Request logging (full JSON)
- Headers logging (complete metadata)
- Pass-through proxy to Anthropic
- Token counting endpoint support

⏳ **To Verify:**
- Streaming response logging
- Tool call/result patterns
- Multi-turn conversations
- Error handling

❌ **Issues:**
- API key placeholder rejection (fixable)

---

## Insights for Proxy Implementation

From these logs, we learned:

1. **Streaming is Always Used** - Claude Code requests `stream: true` by default
2. **Prompt Caching is Critical** - Extensive use of ephemeral caching
3. **Beta Features Required** - Must support claude-code-20250219 beta
4. **Tool Streaming is Fine-Grained** - Uses fine-grained-tool-streaming-2025-05-14
5. **Thinking Mode** - Supports interleaved-thinking-2025-05-14
6. **Multiple Models** - Haiku for warmup, Sonnet for execution
7. **Rich Metadata** - Extensive headers for tracking and debugging

---

**Last Updated:** 2025-11-10
**Log File:** `logs/claudish_2025-11-10_14-05-42.log`
