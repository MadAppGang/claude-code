# Project Context for Claude Code

## CRITICAL RULES

**NEVER use `pkill` or broad process-killing commands** (like `pkill -f "claudeup"` or `pkill -f "claude"`). This kills all Claude CLI sessions running on the machine. Instead, ask the user to restart applications manually or close specific windows.

## Project Overview

**Repository:** MAG Claude Plugins
**Purpose:** Professional plugin marketplace for Claude Code
**Owner:** Jack Rudenko (i@madappgang.com) @ MadAppGang
**License:** MIT

## Plugins

| Plugin | Version | Purpose |
|--------|---------|---------|
| **Frontend** | v3.13.0 | React/TypeScript dev with 11 agents, multi-model review |
| **Code Analysis** | v3.0.0 | Codebase investigation with claudemem, enrichment mode (non-blocking) |
| **Bun Backend** | v1.5.2 | TypeScript backend with Bun, Apidog integration |
| **Orchestration** | v0.8.2 | Multi-agent coordination patterns (6 skills) |
| **Agent Development** | v1.3.0 | Create Claude Code agents, PROXY_MODE error handling |
| **SEO** | v1.5.1 | SEO analysis and optimization with AUTO GATEs |
| **Video Editing** | v1.0.1 | FFmpeg, Whisper, Final Cut Pro integration |
| **Nanobanana** | v2.2.3 | AI image generation with Gemini 3 Pro Image |
| **Dev** | v1.26.0 | Universal dev assistant with real validation loops, 44 skills |

**Claudish CLI**: `npm install -g claudish` - Run Claude with OpenRouter models (separate repo)

## Key Architecture Decisions

### 1. Team-First Configuration

**Shareable** (committed to git):
- Project IDs, URLs, configuration
- `.claude/settings.json` with project config
- No secrets

**Private** (environment variables):
- API tokens, credentials
- Each developer's `.env` file
- Never committed

### 2. Smart Validation

Configuration commands check existing setup before asking questions, validate credentials before saving.

### 3. Project-Specific Installation

Plugins can be installed:
- Globally (all projects)
- Per-project (`.claude/settings.json`)
- Teams use project-specific for consistency

## Directory Structure

```
claude-code/
├── README.md                  # Main documentation
├── CLAUDE.md                  # This file
├── .env.example              # Environment template
├── LICENSE                   # MIT
├── .gitignore               # Excludes secrets
├── RELEASE_PROCESS.md        # Plugin release process guide
├── docs/                    # User documentation
│   ├── frontend-development.md
│   └── local-development.md
├── ai-docs/                 # Technical documentation
│   ├── TEAM_CONFIG_ARCHITECTURE.md
│   ├── DYNAMIC_MCP_GUIDE.md
│   ├── IMPROVEMENTS_SUMMARY.md
│   ├── COMPLETE_PLUGIN_SUMMARY.md
│   └── FINAL_SUMMARY.md
├── skills/                  # Project-level skills
│   └── release/             # Plugin release process skill
│       └── SKILL.md
├── .claude-plugin/
│   └── marketplace.json
└── plugins/
    ├── multimodel/                   # Multi-model collaboration and orchestration
    │   ├── plugin.json
    │   ├── commands/                (team command)
    │   └── skills/                  (14 skills)
    ├── frontend/                     # Full-featured frontend plugin
    │   ├── plugin.json
    │   ├── DEPENDENCIES.md
    │   ├── README.md
    │   ├── agents/                   (11 agents)
    │   ├── commands/                 (7 commands)
    │   ├── skills/                   (11 skills)
    │   └── mcp-servers/
    ├── code-analysis/                # Code analysis plugin
    │   ├── plugin.json
    │   ├── agents/                   (1 agent)
    │   ├── commands/                 (1 command)
    │   └── skills/                   (2 skills)
    └── bun/                          # Backend plugin
        ├── plugin.json
        ├── README.md
        ├── agents/                   (3 agents)
        ├── commands/                 (3 commands)
        ├── skills/                   (1 skill)
        └── mcp-servers/
```

## Important Files

### For Users
- `README.md` - Start here for installation and usage
- `.env.example` - Template for required environment variables
- `ai-docs/TEAM_CONFIG_ARCHITECTURE.md` - Setup guide
- `skills/release/SKILL.md` - Plugin release process (for maintainers)

### For Maintainers
- `.claude-plugin/marketplace.json` - Marketplace configuration ⚠️ **Update when releasing!**
- `plugins/frontend/plugin.json` - Plugin manifest
- `RELEASE_PROCESS.md` - Complete release process documentation
- `skills/release/SKILL.md` - Quick reference release skill
- `ai-docs/DYNAMIC_MCP_GUIDE.md` - MCP configuration patterns

### For Contributors
- `ai-docs/COMPLETE_PLUGIN_SUMMARY.md` - Complete reference
- `plugins/frontend/DEPENDENCIES.md` - Dependencies

## Environment Variables

### Required (Per Developer)
```bash
APIDOG_API_TOKEN=your-personal-token
FIGMA_ACCESS_TOKEN=your-personal-token
```

### Optional
```bash
GITHUB_PERSONAL_ACCESS_TOKEN=your-token
CHROME_EXECUTABLE_PATH=/path/to/chrome
CODEX_API_KEY=your-codex-key
```

## Claude Code Plugin Requirements

**Plugin System Format:**
- Plugin manifest: `.claude-plugin/plugin.json` (must be in this location)
- Settings format: `enabledPlugins` must be object with boolean values
- Component directories: `agents/`, `commands/`, `skills/`, `mcp-servers/` at plugin root
- Environment variables: Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths

**Example Settings:**
```json
{
  "enabledPlugins": {
    "plugin-name@marketplace-name": true
  }
}
```

## Dependencies

**System:**
- Node.js v18+ (with npm/npx)
- Chrome browser
- Git

**Optional:**
- Codex CLI (for codex-powered code review)

---

## Quick Reference

**Setup:** `/plugin marketplace add MadAppGang/claude-code`

**Enable in `.claude/settings.json`:**
```json
{
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true,
    "code-analysis@mag-claude-plugins": true
  }
}
```

**Local dev:** `/plugin marketplace add /path/to/claude-code`

## Design Principles

1. **Shareable Config, Private Secrets** - Configuration in git, credentials in environment
2. **Validation First** - Check before ask, validate before save
3. **Team Ready** - Auto-install, consistent setup, no drift
4. **Security First** - No secrets in git, personal tokens, clear docs
5. **Developer Experience** - Smart defaults, clear errors, fast for returning users

## Release Documentation

**Version History:** See [CHANGELOG.md](./CHANGELOG.md) for all versions

**Detailed Release Notes:** See [RELEASES.md](./RELEASES.md) for comprehensive release documentation

**Current Versions:**
- Multimodel Plugin: **v2.0.0** (2026-01-28)
- Frontend Plugin: **v3.13.0** (2025-12-14)
- Code Analysis Plugin: **v2.15.0** (2026-01-11)
- Bun Backend Plugin: **v1.5.2** (2025-11-26)
- Agent Development Plugin: **v1.4.0** (2026-01-05)
- SEO Plugin: **v1.5.1** (2026-01-08)
- Video Editing Plugin: **v1.0.1** (2026-01-06)
- Nanobanana Plugin: **v2.2.3** (2026-01-08)
- Conductor Plugin: **v2.0.1** (2026-01-06)
- Dev Plugin: **v1.26.0** (2026-02-03)
- Claudish CLI: See https://github.com/MadAppGang/claudish (separate repository)

**Latest Changes (Code Analysis v2.15.0):**
- ✅ **Hybrid 2+3 Hook Approach**: Results-first format with "Task complete" language
- ✅ **71% Retry Reduction**: Agents treat denials as completions instead of retrying
- ✅ **"Completed via claudemem"**: Success-like language in denial reasons
- ✅ **Minimal Context**: 10 lines vs 32 lines (69% reduction in noise)
- ✅ **Preserved Fallbacks**: Native tools still work when claudemem not indexed

**Git Tags:**
- Multimodel: `plugins/multimodel/v2.0.0`
- Frontend: `plugins/frontend/v3.13.0`
- Bun: `plugins/bun/v1.5.2`
- Code Analysis: `plugins/code-analysis/v2.15.0`
- Agent Development: `plugins/agentdev/v1.3.0`
- SEO: `plugins/seo/v1.5.1`
- Video Editing: `plugins/video-editing/v1.0.1`
- Nanobanana: `plugins/nanobanana/v2.2.3`
- Conductor: `plugins/conductor/v2.0.1`
- Dev: `plugins/dev/v1.26.0`
- Use correct tag format when releasing: `plugins/{plugin-name}/vX.Y.Z`

**⚠️ RELEASE CHECKLIST (ALL 3 REQUIRED):**
When releasing a plugin, you MUST update ALL THREE of these:
1. **Plugin version** - `plugins/{name}/plugin.json` → `"version": "X.Y.Z"`
2. **Marketplace version** - `.claude-plugin/marketplace.json` → plugin entry `"version": "X.Y.Z"`
3. **Git tag** - `git tag -a plugins/{name}/vX.Y.Z -m "Release message"` → push with `--tags`

Missing any of these will cause claudeup to not see the update!

**⚠️ CLAUDEUP RELEASE PROCESS:**
Claudeup (the TUI tool) has its own release process:
1. **Update version** - `tools/claudeup/package.json` → `"version": "X.Y.Z"`
2. **Commit changes** - `git commit -m "feat(claudeup): vX.Y.Z - Description"`
3. **Create tag** - `git tag -a tools/claudeup/vX.Y.Z -m "Release message"`
4. **Push** - `git push origin main --tags`

The workflow `.github/workflows/claudeup-release.yml` triggers on `tools/claudeup/v*` tags and:
- Builds with pnpm
- Publishes to npm via OIDC (no tokens needed - Trusted Publisher configured)
- Creates GitHub release

**Current claudeup version:** v1.3.0
**Install:** `bun install -g claudeup@latest`

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Last Updated:** February 3, 2026
**Version:** 10 plugins (Multimodel v2.0.0, Frontend v3.13.0, Code Analysis v2.15.0, Bun Backend v1.5.2, Agent Development v1.4.0, SEO v1.5.1, Video Editing v1.0.1, Nanobanana v2.2.3, Conductor v2.0.1, Dev v1.26.0)
- do not use hardcoded path in code, docs, comments or any other files