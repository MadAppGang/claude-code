# Troubleshooting

**Something broken? Let's fix it.**

---

## Installation Issues

### "command not found: claudish"

**With npx (no install):**
```bash
npx claudish@latest --version
```

**Global install:**
```bash
npm install -g claudish
# or
bun install -g claudish
```

**Verify:**
```bash
which claudish
claudish --version
```

### "Node.js version too old"

Claudish requires Node.js 18+.

```bash
node --version  # Should be 18.x or higher

# Update Node.js
nvm install 20
nvm use 20
```

### "Claude Code not installed"

Claudish needs the official Claude Code CLI.

```bash
# Check if installed
claude --version

# If not, get it from:
# https://claude.ai/claude-code
```

---

## API Key Issues

### "OPENROUTER_API_KEY not found"

Set the environment variable:
```bash
export OPENROUTER_API_KEY='sk-or-v1-your-key'
```

Or add to `.env`:
```bash
echo "OPENROUTER_API_KEY=sk-or-v1-your-key" >> .env
```

### "Invalid API key"

1. Check at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Make sure key starts with `sk-or-v1-`
3. Check for extra spaces or quotes

```bash
# Debug
echo "Key: [$OPENROUTER_API_KEY]"  # Spot extra characters
```

### "Insufficient credits"

Check your balance at [openrouter.ai/activity](https://openrouter.ai/activity).

Free tier gives $5. After that, add credits.

---

## Model Issues

### "Model not found"

Verify the model exists:
```bash
claudish --models your-model-name
```

Common mistakes:
- Typo in model name
- Model was removed from OpenRouter
- Using wrong format (should be `provider/model-name`)

### "Model doesn't support tools"

Some models can't use Claude Code's file/bash tools.

Check capabilities:
```bash
claudish --top-models
# Look for ✓ in the "Tools" column
```

Use a model with tool support:
- `x-ai/grok-code-fast-1` ✓
- `openai/gpt-5.1-codex` ✓
- `google/gemini-3-pro-preview` ✓

### "Context length exceeded"

Your prompt + history exceeded the model's limit.

**Solutions:**
1. Start a fresh session
2. Use a model with larger context (Gemini 3 Pro has 1M)
3. Reduce context by being more specific

---

## Connection Issues

### "Connection refused" / "ECONNREFUSED"

The proxy server couldn't start.

**Check if port is in use:**
```bash
lsof -i :3456  # Replace with your port
```

**Use a different port:**
```bash
claudish --port 4567 "your prompt"
```

**Or let Claudish pick automatically:**
```bash
unset CLAUDISH_PORT
claudish "your prompt"
```

### "Timeout" / "Request timed out"

OpenRouter or the model provider is slow/down.

**Check OpenRouter status:**
Visit [status.openrouter.ai](https://status.openrouter.ai)

**Try a different model:**
```bash
claudish --model minimax/minimax-m2 "your prompt"  # Usually fast
```

### "Network error"

Check your internet connection:
```bash
curl https://openrouter.ai/api/v1/models
```

If that fails, it's a network issue on your end.

---

## Runtime Issues

### "Unexpected token" / JSON parse error

The model returned invalid output. This happens occasionally with some models.

**Solutions:**
1. Retry the request
2. Try a different model
3. Simplify your prompt

### "Tool execution failed"

The model tried to use a tool incorrectly.

**Common causes:**
- Model doesn't understand Claude Code's tool format
- Complex tool call the model can't handle
- Sandbox restrictions blocked the operation

**Solutions:**
1. Try a model known to work well (`grok-code-fast-1`, `gpt-5.1-codex`)
2. Use `--dangerous` flag to disable sandbox (careful!)
3. Simplify the task

### "Session hung" / No response

The model is thinking... or stuck.

**Kill and restart:**
```bash
# Ctrl+C to cancel
# Then restart
claudish --model x-ai/grok-code-fast-1 "your prompt"
```

---

## Interactive Mode Issues

### "Readline error" / stdin issues

Claudish's interactive mode has careful stdin handling, but conflicts can occur.

**Solutions:**
1. Exit and restart Claudish
2. Use single-shot mode instead
3. Check for other processes using stdin

### "Model selector not showing"

Make sure you're in a TTY:
```bash
tty  # Should show /dev/ttys* or similar
```

If piping input, the selector is skipped. Use `--model` flag:
```bash
echo "prompt" | claudish --model x-ai/grok-code-fast-1 --stdin
```

---

## MCP Server Issues

### "MCP server not starting"

Test it manually:
```bash
OPENROUTER_API_KEY=sk-or-v1-... claudish --mcp
# Should output: [claudish] MCP server started
```

If nothing happens, check your API key is set correctly.

### "Tools not appearing in Claude"

1. **Restart Claude Code** after adding MCP config
2. Check your settings file syntax (valid JSON?)
3. Verify the path: `~/.config/claude-code/settings.json`

**Correct config:**
```json
{
  "mcpServers": {
    "claudish": {
      "command": "claudish",
      "args": ["--mcp"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    }
  }
}
```

### "run_prompt returns error"

**"Model not found"**
Check the model ID is correct. Use `list_models` tool first to see available models.

**"API key invalid"**
The API key in your MCP config might be wrong. Check it at [openrouter.ai/keys](https://openrouter.ai/keys).

**"Rate limited"**
OpenRouter has rate limits. Wait a moment and try again, or check your account limits.

### "MCP mode works but CLI doesn't" (or vice versa)

They use the same API key. If one works and the other doesn't:

- **CLI**: Uses `OPENROUTER_API_KEY` from environment or `.env`
- **MCP**: Uses the key from Claude Code's MCP settings

Make sure both have valid keys.

---

## Performance Issues

### "Slow responses"

**Causes:**
1. Model is slow (some are)
2. OpenRouter routing delay
3. Large context

**Solutions:**
- Use a faster model (`grok-code-fast-1` is quick)
- Reduce context size
- Check OpenRouter status

### "High token usage"

**Check your usage:**
```bash
claudish --audit-costs  # If using cost tracking
```

**Reduce usage:**
- Be more specific in prompts
- Don't include unnecessary files
- Use single-shot mode for one-off tasks

---

## Debug Mode

When all else fails, enable debug logging:

```bash
claudish --debug --verbose --model x-ai/grok-code-fast-1 "your prompt"
```

This creates `logs/claudish_*.log` with detailed information.

**Share the log** (redact sensitive info) when reporting issues.

---

## Getting Help

**Check documentation:**
- [Quick Start](getting-started/quick-start.md)
- [Usage Modes](usage/interactive-mode.md)
- [Environment Variables](advanced/environment.md)

**Report a bug:**
[github.com/MadAppGang/claude-code/issues](https://github.com/MadAppGang/claude-code/issues)

Include:
- Claudish version (`claudish --version`)
- Node.js version (`node --version`)
- Error message (full)
- Steps to reproduce
- Debug log (if possible)

---

## FAQ

**"Is my code sent to OpenRouter?"**
Yes. OpenRouter routes it to your chosen model provider. Check their privacy policies.

**"Can I use this with private/enterprise models?"**
If they're accessible via OpenRouter, yes. Use custom model ID option.

**"Why isn't X model working?"**
Not all models support Claude Code's tool-use protocol. Stick to recommended models.

**"Can I run multiple instances?"**
Yes. Each instance gets its own proxy port automatically.
