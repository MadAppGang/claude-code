---
name: statusline-customization
description: "Configures statusline sections (model, branch, cost, context bar, plan limits), themes, and bar widths via JSON config. Covers troubleshooting for jq, plan limits, and script permissions. Use when customizing the statusline display, changing themes, adjusting bar widths, or diagnosing statusline rendering issues."
---

# Statusline Customization Reference

## Config File

**Location:** `~/.claude/statusline-config.json`

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
  "context_bar_width": 12, // Width in chars (8-20)
  "plan_bar_width": 10,    // Width in chars (6-16)
  "theme": "default"       // Color theme name
}
```

All fields are optional. Missing fields use defaults shown above.

## Sections

| Section | Color | Description |
|---------|-------|-------------|
| `model` | Cyan (bold) | Shortened model name with `*` prefix |
| `branch` | Green | Current git branch or short commit hash |
| `worktree` | Orange (bold) | `wt:name` — only inside linked worktrees |
| `cost` | Yellow | Cumulative session cost in USD |
| `duration` | Magenta | Session duration in minutes/seconds |
| `context_bar` | Green-Red gradient | Visual bar + token count + compaction indicator |
| `plan_limits` | Teal-Red gradient | Dual bar: 5h/7d plan usage with reset countdowns |

## Themes

| Theme | Description |
|-------|-------------|
| `default` | Warm/cool ANSI palette — bright colors |
| `monochrome` | White and gray only |
| `minimal` | Muted dim ANSI colors |
| `neon` | 256-color bright variants |

## Troubleshooting

**jq not found:**
```bash
brew install jq
```

**No plan limits showing:**
- Check cache: `ls -la ~/.claude/.statusline-usage-cache.json`
- Verify Keychain access: `security find-generic-password -s "Claude Code-credentials" -w | head -c 20`

**Config not taking effect:**
- Verify JSON syntax: `jq . ~/.claude/statusline-config.json`
- Changes apply on next render — no restart needed

**Script not executable:**
```bash
chmod +x ~/.claude/statusline-command.sh
```

## Notes

- Data flow: Claude Code pipes JSON to stdin, script renders ANSI output to stdout
- Plan limits use a non-blocking background cache (TTL: 60s) to avoid blocking renders
- Compaction detection shows `⟳` when auto-compaction is detected (one render only)
- Token source on macOS: Keychain (`security find-generic-password -s "Claude Code-credentials"`)
