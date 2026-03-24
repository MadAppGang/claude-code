---
name: dependency-check
description: "Verifies Chrome DevTools MCP, OpenRouter API key, and Claudish CLI availability before running frontend commands. Reports missing tools with setup instructions and caches results per session. Use when checking prerequisites, setting up frontend tools, or before /implement, /review, and /validate-ui commands."
---

# Dependency Check

Verifies external dependencies required by frontend plugin commands and provides setup guidance when missing.

## Workflow

1. **Check Chrome DevTools MCP** — call `mcp__chrome-devtools__list_pages`; if it succeeds, browser automation is available.
2. **Check OpenRouter API key** — verify `OPENROUTER_API_KEY` environment variable is non-empty.
3. **Check Claudish CLI** — run `npx claudish --version`; if it exits 0, multi-model review is available.
4. **Report status** — display pass/fail for each dependency with missing-dependency setup instructions.
5. **Offer options** — if any dependency is missing, ask user to continue with reduced functionality or install first.
6. **Cache to session** — write dependency status to `session-meta.json` so subsequent commands skip re-checking.

## Example: Full Dependency Check

```bash
# Chrome DevTools MCP
CHROME_MCP=false
if mcp__chrome-devtools__list_pages 2>/dev/null; then
  CHROME_MCP=true
  echo "Chrome DevTools MCP: Available"
else
  echo "Chrome DevTools MCP: Not available"
  echo "  Install: npm install -g claudeup@latest && claudeup mcp add chrome-devtools"
fi

# OpenRouter API Key
OPENROUTER=false
if [[ -n "${OPENROUTER_API_KEY}" ]]; then
  OPENROUTER=true
  echo "OpenRouter API Key: Configured"
else
  echo "OpenRouter API Key: Not configured"
  echo "  Set: export OPENROUTER_API_KEY=your-key"
fi

# Claudish CLI
CLAUDISH=false
if npx claudish --version 2>/dev/null; then
  CLAUDISH=true
  echo "Claudish CLI: Available"
else
  echo "Claudish CLI: Not available"
  echo "  Install: npm install -g claudish"
fi
```

**Verification:** Confirm all three checks run to completion before proceeding. Never block the command — always allow the user to continue with degraded functionality.

## Graceful Degradation

| Missing Dependency | Impact | Fallback |
|--------------------|--------|----------|
| Chrome DevTools MCP | No screenshots, no UI validation | Manual visual verification |
| OpenRouter + Claudish | No multi-model reviews | Embedded Claude review only |
| Both missing | Minimal mode | Core implementation still functional |

## Quick Setup (Copy-Paste)

```bash
npm install -g claudeup@latest
claudeup mcp add chrome-devtools
npm install -g claudish
# Set in your shell profile:
export OPENROUTER_API_KEY=your-api-key
```

## Notes

- Non-blocking by default — commands always complete even with missing dependencies
- Cache results in `session-meta.json` to avoid repeated checks within a session
- OpenRouter offers free model tiers (e.g., `openrouter/polaris-alpha`)
- Recommend claudeup for simplified MCP server management
