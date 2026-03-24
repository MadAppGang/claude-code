---
name: browser-debugger
description: "Tests UI in a real browser via Chrome DevTools MCP — captures screenshots, monitors console errors, tracks network requests, and validates design fidelity with optional vision models through Claudish. Use after implementing UI features, for design validation, when investigating console errors, or for responsive regression testing."
allowed-tools: Task, Bash
---

# Browser Debugger

Browser-based UI testing and debugging via Chrome DevTools MCP with optional vision model analysis through Claudish.

## Workflow

1. **Verify dependencies** — confirm Chrome DevTools MCP is available via `mcp__chrome-devtools__list_pages`. Check OpenRouter API key for vision models.
2. **Navigate and capture** — load the target URL, resize viewport, take screenshot.
3. **Inspect console and network** — check for errors, failed requests, and warnings.
4. **Analyze visually** — compare screenshot against design reference using embedded Claude or external vision model.
5. **Report findings** — categorize issues by severity, provide actionable fixes.

## Prerequisites

```bash
# Required: Chrome DevTools MCP
claudeup mcp add chrome-devtools

# Optional: Vision models via Claudish + OpenRouter
npm install -g claudish
# Set OPENROUTER_API_KEY for external vision models
```

## Vision Model Selection

| Task | Recommended Model | Cost |
|------|-------------------|------|
| Design fidelity | `qwen/qwen3-vl-32b-instruct` | ~$0.06/1M |
| Quick smoke tests | `google/gemini-2.5-flash` | ~$0.05/1M |
| Complex layouts | `openai/gpt-4o` | ~$0.15/1M |
| Budget/free | `openrouter/polaris-alpha` | Free |

Before first analysis in a session, ask user which model to use via AskUserQuestion. Save choice to session metadata.

## Example: Post-Implementation Validation

```
# 1. Navigate and screenshot
mcp__chrome-devtools__navigate_page(url: "http://localhost:5173/component")
mcp__chrome-devtools__resize_page(width: 1440, height: 900)
mcp__chrome-devtools__take_screenshot(filePath: "/tmp/implementation.png")

# 2. Check console for errors
mcp__chrome-devtools__list_console_messages(types: ["error", "warn"])

# 3. Check network for failures
mcp__chrome-devtools__list_network_requests(resourceTypes: ["fetch", "xhr"])

# 4. Optional: Vision model analysis
npx claudish --model qwen/qwen3-vl-32b-instruct --stdin --quiet <<EOF
Analyze this UI screenshot for visual issues:
IMAGE: /tmp/implementation.png
Check: layout alignment, spacing, typography, color contrast, missing elements.
Report each issue with severity and Tailwind CSS fix.
EOF
```

**Verification:** Confirm zero console errors and all network requests succeeded before reporting PASS.

## Recipe: Design Fidelity Check

1. Capture design reference (Figma MCP export, URL screenshot, or local file).
2. Capture implementation screenshot at matching viewport size.
3. Send both to vision model for side-by-side comparison.
4. Score on 5 categories (colors, typography, spacing, visuals, responsive) out of 10 each.
5. PASS >= 40/50, NEEDS WORK 30-39, FAIL < 30.

## Recipe: Responsive Testing

```bash
# Test across breakpoints
for width in 375 428 768 1280 1920; do
  mcp__chrome-devtools__resize_page(width: $width, height: 900)
  mcp__chrome-devtools__take_screenshot(filePath: "/tmp/responsive-${width}.png")
done
```

Check each screenshot for: text overflow, element overlap, touch targets < 44px, horizontal scroll.

## Recipe: Interactive Element Testing

1. `mcp__chrome-devtools__take_snapshot()` — get DOM with element UIDs.
2. `mcp__chrome-devtools__click(uid: "button-id")` — trigger interaction.
3. `mcp__chrome-devtools__wait_for(text: "Expected", timeout: 5000)` — verify result.
4. Take before/after screenshots and compare.

## Chrome DevTools MCP Quick Reference

| Category | Tools |
|----------|-------|
| Navigation | `navigate_page`, `new_page`, `select_page`, `close_page` |
| Inspection | `take_snapshot`, `take_screenshot`, `list_pages` |
| Interaction | `click`, `fill`, `fill_form`, `hover`, `drag`, `press_key` |
| Console | `list_console_messages`, `get_console_message` |
| Network | `list_network_requests`, `get_network_request` |
| Advanced | `evaluate_script`, `resize_page`, `emulate`, `performance_start_trace` |

## Notes

- Always check console errors after navigation — many UI bugs only surface at runtime
- Use `resize_page` before screenshots to ensure consistent viewport dimensions
- Vision model analysis is optional — embedded Claude can describe screenshots for basic checks
- Cache vision model choice in session metadata to avoid repeated prompts
- Agent validation protocols: developer (5-point check), reviewer (visual diff), tester (comprehensive), ui-developer (fix verification)
