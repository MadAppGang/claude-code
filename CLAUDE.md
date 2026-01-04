# Project Context for Claude Code

## Project Overview

**Repository:** MAG Claude Plugins
**Purpose:** Professional plugin marketplace for Claude Code
**Owner:** Jack Rudenko (i@madappgang.com) @ MadAppGang
**License:** MIT

## Plugins

| Plugin | Version | Purpose |
|--------|---------|---------|
| **Frontend** | v3.13.0 | React/TypeScript dev with 11 agents, multi-model review |
| **Code Analysis** | v2.10.0 | Codebase investigation with claudemem, unified --agent flag |
| **Bun Backend** | v1.5.2 | TypeScript backend with Bun, Apidog integration |
| **Orchestration** | v0.6.0 | Multi-agent coordination patterns (5 skills) |
| **Agent Development** | v1.1.0 | Create Claude Code agents |
| **SEO** | v1.2.2 | SEO analysis and optimization |
| **Video Editing** | v1.0.0 | FFmpeg, Whisper, Final Cut Pro integration |
| **Nanobanana** | v2.1.0 | AI image generation with Gemini 3 Pro Image |

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
    ├── orchestration/               # Shared orchestration patterns plugin
    │   ├── plugin.json
    │   ├── README.md
    │   ├── skills/                  (5 skills)
    │   └── examples/                (3 workflow examples)
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
- Orchestration Plugin: **v0.6.0** (2025-12-14)
- Frontend Plugin: **v3.13.0** (2025-12-14)
- Code Analysis Plugin: **v2.10.0** (2025-12-30)
- Bun Backend Plugin: **v1.5.2** (2025-11-26)
- Agent Development Plugin: **v1.1.0** (2025-12-09)
- SEO Plugin: **v1.2.2** (2025-12-20)
- Video Editing Plugin: **v1.0.0** (2025-12-29)
- Nanobanana Plugin: **v2.1.0** (2026-01-04)
- Claudish CLI: See https://github.com/MadAppGang/claudish (separate repository)

**Latest Changes (Code Analysis v2.10.0 - Unified --agent Flag):**
- ✅ **Unified --agent Flag**: Replaces `--nologo --raw --plain` with single flag
- ✅ **Auto-detection**: Enabled in CI environments (CLAUDE_CODE_ENTRYPOINT, CI=true, NO_COLOR)
- ✅ **Clean Output**: No ASCII logo, compact file:line format, no emojis/ANSI
- ✅ **All Skills Updated**: 7 detective skills migrated to new flag pattern
- ✅ **Hooks Updated**: TypeScript handler and bash scripts use --agent

**Git Tags:**
- Orchestration: `plugins/orchestration/v0.6.0`
- Frontend: `plugins/frontend/v3.13.0`
- Bun: `plugins/bun/v1.5.2`
- Code Analysis: `plugins/code-analysis/v2.10.0`
- Agent Development: `plugins/agentdev/v1.1.0`
- SEO: `plugins/seo/v1.2.2`
- Video Editing: `plugins/video-editing/v1.0.0`
- Nanobanana: `plugins/nanobanana/v2.1.0`
- Use correct tag format when releasing: `plugins/{plugin-name}/vX.Y.Z`

**⚠️ RELEASE CHECKLIST (ALL 3 REQUIRED):**
When releasing a plugin, you MUST update ALL THREE of these:
1. **Plugin version** - `plugins/{name}/plugin.json` → `"version": "X.Y.Z"`
2. **Marketplace version** - `.claude-plugin/marketplace.json` → plugin entry `"version": "X.Y.Z"`
3. **Git tag** - `git tag -a plugins/{name}/vX.Y.Z -m "Release message"` → push with `--tags`

Missing any of these will cause claudeup to not see the update!

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Last Updated:** January 4, 2026
**Version:** 8 plugins (Orchestration v0.6.0, Frontend v3.13.0, Code Analysis v2.10.0, Bun Backend v1.5.2, Agent Development v1.1.0, SEO v1.2.2, Video Editing v1.0.0, Nanobanana v2.1.0)
- do not use hardcoded path in code, docs, comments or any other files