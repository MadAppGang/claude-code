# Team Configuration Guide

## Overview

Claudeup uses Claude Code's native plugin system for marketplace management. This guide explains how to configure marketplaces for your entire team.

## Key Concepts

### Global vs Project Scope

- **Marketplaces**: GLOBAL ONLY (managed by Claude Code)
  - Installed to `~/.claude/plugins/marketplaces/`
  - Shared across all projects
  - Added via `/plugin marketplace add` command

- **Plugins**: THREE SCOPES (managed by claudeup)
  - **User Scope**: Global (`~/.claude/settings.json`)
  - **Project Scope**: Team (`<project>/.claude/settings.json`)
  - **Local Scope**: Private (`<project>/.claude/settings.local.json`)

### Team Configuration Flow

```
1. Dev adds marketplace to .claude/settings.json:
   "extraKnownMarketplaces": { "company-tools": {...} }

2. Commits to git

3. Teammate clones repo and trusts folder

4. Claude Code prompts: "Install marketplace 'company-tools'?"

5. Teammate confirms → Marketplace installed globally
```

## Configuration Examples

### Example 1: Company-Wide Tooling

**.claude/settings.json** (committed):
```json
{
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": {
        "source": "github",
        "repo": "acme-corp/claude-plugins"
      }
    }
  },
  "enabledPlugins": {
    "code-formatter@acme-tools": true,
    "api-client@acme-tools": true
  }
}
```

### Example 2: Project-Specific Plugins

**.claude/settings.json** (committed):
```json
{
  "extraKnownMarketplaces": {
    "mag-claude-plugins": {
      "source": {
        "source": "github",
        "repo": "MadAppGang/claude-code"
      }
    }
  },
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true
  }
}
```

## Best Practices

1. **Commit marketplace config**: Add `extraKnownMarketplaces` to `.claude/settings.json`
2. **Let Claude Code manage installation**: Don't clone repos manually
3. **Use Project scope for team plugins**: Ensures consistency
4. **Document required plugins**: Add README explaining setup

## Troubleshooting

### Marketplace not showing in claudeup?

Run in Claude Code:
```bash
/plugin marketplace list
```

If missing, add it:
```bash
/plugin marketplace add owner/repo
```

Then refresh claudeup with `r`.

### Plugin not auto-installing for teammates?

1. Check `.claude/settings.json` has `extraKnownMarketplaces`
2. Ensure teammate trusted the folder in Claude Code
3. Verify marketplace was added to known_marketplaces.json

### Updates not appearing?

Run in Claude Code:
```bash
/plugin marketplace update
```

Then refresh claudeup with `r`.

## Migration from Claudeup v1.x

Claudeup v2.0.0 no longer manages marketplaces directly. Instead, use Claude Code's native commands:

### Old Way (v1.x)
```
claudeup → press 'n' → enter repo → marketplace cloned
```

### New Way (v2.0+)
```
Claude Code: /plugin marketplace add owner/repo
claudeup → press 'r' → marketplace appears
```

### Why the Change?

- **Eliminates conflicts**: Claude Code is the source of truth
- **Consistent behavior**: Same system for CLI and TUI
- **Better team support**: Auto-prompt for marketplace installation
- **Simpler codebase**: Less duplication, fewer bugs

## Advanced: Local Development Marketplaces

For local plugin development, you can add a local directory as a marketplace:

```bash
/plugin marketplace add /path/to/your/marketplace
```

This is useful for testing plugins before publishing.

---

**Need help?** File an issue at [github.com/MadAppGang/claude-code](https://github.com/MadAppGang/claude-code/issues)
