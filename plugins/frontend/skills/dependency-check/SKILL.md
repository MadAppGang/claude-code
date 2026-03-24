---
name: dependency-check
description: "Checks for Chrome DevTools MCP and OpenRouter API key before running frontend commands. Provides setup guidance, offers graceful degradation, and caches results per session. Use at the start of /implement, /review, or /validate-ui commands to verify required external dependencies."
---

# Dependency Check

Standardized dependency verification for frontend plugin commands that require external tools and services.

## Workflow

1. **Check Chrome DevTools MCP** — attempt `mcp__chrome-devtools__list_pages` to verify browser automation is available.
2. **Check OpenRouter API Key** — verify `OPENROUTER_API_KEY` environment variable is set.
3. **Check Claudish CLI** — verify `npx claudish --version` succeeds.
4. **Report status** — show which dependencies are available and which are missing.
5. **Offer options** — if dependencies are missing, present setup instructions and ask user to continue or install first.
6. **Cache results** — store dependency status in session metadata to avoid repeated checks.

## Example: Checking Both Dependencies

```bash
# Check Chrome DevTools MCP
CHROME_MCP_AVAILABLE=false
if mcp__chrome-devtools__list_pages 2>/dev/null; then
  CHROME_MCP_AVAILABLE=true
  echo "✓ Chrome DevTools MCP: Available"
else
  echo "✗ Chrome DevTools MCP: Not available"
fi

# Check OpenRouter API Key
OPENROUTER_AVAILABLE=false
if [[ -n "${OPENROUTER_API_KEY}" ]]; then
  OPENROUTER_AVAILABLE=true
  echo "✓ OpenRouter API Key: Configured"
else
  echo "✗ OpenRouter API Key: Not configured"
fi
```

**Verification:** Confirm both checks complete before proceeding with the command workflow.

## Graceful Degradation

| Missing Dependency | Impact | Fallback |
|--------------------|--------|----------|
| Chrome DevTools MCP | Skip UI validation, screenshots | Manual visual verification required |
| OpenRouter + Claudish | No multi-model reviews | Embedded Claude Sonnet review only |
| Both | Minimal mode | Core implementation still functional |

Commands always complete, even with missing dependencies.

## Quick Setup (Copy-Paste Ready)

```bash
# Install claudeup for easy management
npm install -g claudeup@latest

# Add Chrome DevTools MCP
claudeup mcp add chrome-devtools

# Configure OpenRouter API key
claudeup config set OPENROUTER_API_KEY your-api-key
```

## Notes

- Non-blocking by default — always allow users to continue with reduced functionality
- Cache dependency status in `session-meta.json` to check once per session
- OpenRouter is affordable with free model options available
- Recommend claudeup for simplified dependency management
