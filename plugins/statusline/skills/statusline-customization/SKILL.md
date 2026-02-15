---
name: statusline-customization
description: Configuration reference and troubleshooting for the statusline plugin — sections, themes, bar widths, and script architecture
globs:
  - "**/statusline*"
  - "**/.claude/settings.json"
  - "**/statusline-config.json"
---

# Statusline Customization Reference

## Config File

**Location:** `~/.claude/statusline-config.json`

### Schema

```json
{
  "sections": {
    "model": true,         // Model name (Opus/Sonnet/Haiku)
    "branch": true,        // Git branch name
    "worktree": true,      // Worktree indicator (wt:name)
    "cost": true,          // Session cost ($X.XX)
    "duration": true,      // Session duration (Xm Xs)
    "context_bar": true,   // Context window usage bar
    "plan_limits": true    // Plan limit bars with reset countdowns
  },
  "context_bar_width": 12, // Width of context bar in chars (8-20)
  "plan_bar_width": 10,    // Width of plan limit bar in chars (6-16)
  "theme": "default"       // Color theme name
}
```

All fields are optional. Missing fields use defaults shown above.

## Sections Reference

| Section | Color | Description |
|---------|-------|-------------|
| `model` | Cyan (bold) | Shortened model name with `*` prefix |
| `branch` | Green | Current git branch or short commit hash |
| `worktree` | Orange (bold) | `wt:name` — only shown when inside a linked worktree |
| `cost` | Yellow | Cumulative session cost in USD |
| `duration` | Magenta | Session duration in minutes/seconds |
| `context_bar` | Green→Red gradient | Visual bar + token count (90k/200k) + compaction indicator (⟳) |
| `plan_limits` | Teal→Red gradient | Dual bar: top=5h, bottom=7d plan usage with reset countdowns |

### Plan Limits Bar Characters

- `█` — both 5h and 7d usage at this position
- `▀` — only 5h usage (top half)
- `▄` — only 7d usage (bottom half)
- `-` — empty (unused capacity)

### Reset Countdown Format

After each percentage, a countdown shows when the limit resets:

- `↻1h40m` — resets in 1 hour 40 minutes
- `↻3d12h` — resets in 3 days 12 hours
- `↻now` — resetting now

Example: `█▄▄------- 5h:18% ↻1h40m 7d:35% ↻3d12h`

### Context Bar Token Count

After the percentage, a dim token count shows current/max context usage:

- `45% 90k/200k` — 90k tokens used out of 200k window
- `72% 144k/200k` — approaching limit
- Only shown when Claude Code provides token data in stdin

### Compaction Detection

A bold magenta `⟳` appears after the token count when auto-compaction is detected:

- `25% 50k/200k ⟳` — compaction just happened (tokens dropped)
- The indicator appears for one render only, then disappears
- Detection works by caching `total_input_tokens` between renders; a drop means compaction occurred
- Cache file: `~/.claude/.statusline-token-cache`

## Themes

| Theme | Description |
|-------|-------------|
| `default` | Warm/cool ANSI palette — bright cyan, green, yellow, orange, red |
| `monochrome` | White and gray only — no colors |
| `minimal` | Muted dim ANSI colors (30-series) — subtle and low-contrast |
| `neon` | 256-color bright variants — vivid and high-contrast |

## Script Architecture

### Data Flow

1. Claude Code pipes JSON session data to stdin
2. Script reads config from `~/.claude/statusline-config.json`
3. Extracts fields with `jq`
4. Detects git branch and worktree from `cwd`
5. Reads plan usage from non-blocking background cache
6. Renders ANSI-colored output to stdout

### Non-Blocking API Cache

- **Cache file:** `~/.claude/.statusline-usage-cache.json`
- **TTL:** 60 seconds
- **Mechanism:** Background subshell `( ... ) &` fires API call; current render uses stale cache
- **Token source:** macOS Keychain (`security find-generic-password -s "Claude Code-credentials"`)
- **API endpoint:** `https://api.anthropic.com/api/oauth/usage`

### Input JSON Schema (from Claude Code)

```json
{
  "model": { "display_name": "Claude Opus 4.6" },
  "cost": { "total_cost_usd": 1.23, "total_duration_ms": 180000 },
  "context_window": { "used_percentage": 45.2 },
  "cwd": "/path/to/project"
}
```

## Troubleshooting

### jq not found
The script requires `jq` for JSON parsing. Install with:
```bash
brew install jq
```

### No plan limits showing
- Check if cache file exists: `ls -la ~/.claude/.statusline-usage-cache.json`
- Verify Keychain access: `security find-generic-password -s "Claude Code-credentials" -w | head -c 20`
- If Keychain prompts are denied, the API call silently fails — grant access when prompted
- Plan limits only show when both 5h and 7d utilization data are available

### Config not taking effect
- Verify JSON syntax: `jq . ~/.claude/statusline-config.json`
- After changing config, the script picks it up on next render (no restart needed)
- To redeploy the script itself after a plugin update, run `/statusline:install-statusline`

### Script not executable
```bash
chmod +x ~/.claude/statusline-command.sh
# or for project-level:
chmod +x .claude/statusline-command.sh
```

### Reset countdown not showing
- Reset times come from the `resets_at` field in the usage API response
- If the field is missing from the API response, no countdown is shown
- Verify with: `jq '.five_hour.resets_at, .seven_day.resets_at' ~/.claude/.statusline-usage-cache.json`
