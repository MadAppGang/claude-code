# Project Context for Claude Code

## Project Overview

**Repository:** MAG Claude Plugins
**Purpose:** Professional plugin marketplace for Claude Code
**Owner:** Jack Rudenko (i@madappgang.com) @ MadAppGang
**License:** MIT

## What This Repository Contains

A complete Claude Code plugin marketplace with enterprise-level architecture:

- **Plugin Marketplace** (`mag-claude-plugins`)
- **Frontend Development Plugin** (v2.7.0) - Full-featured Sonnet-powered
  - 13 Specialized Agents (including CSS Developer + Designer + Designer-Codex + UI Developer ecosystem)
  - 6 Slash Commands
  - 3 Skills
  - MCP Servers (auto-configured)
  - **Chrome DevTools MCP debugging methodology** for responsive layout issues
  - CSS-aware design validation with DOM inspection and computed CSS analysis
  - CSS architecture management with knowledge files
  - Pixel-perfect UI implementation with parallel design validation
  - Task decomposition for isolated, parallel implementation
- **Code Analysis Plugin** (v1.1.0) - Deep codebase investigation
  - 1 Specialized Agent (codebase-detective)
  - 2 Skills (deep-analysis + semantic-code-search)
  - Pattern discovery and bug investigation
  - Semantic code search with claude-context MCP

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
├── docs/                    # User documentation
│   ├── frontend-development.md
│   └── local-development.md
├── ai-docs/                 # Technical documentation
│   ├── TEAM_CONFIG_ARCHITECTURE.md
│   ├── DYNAMIC_MCP_GUIDE.md
│   ├── IMPROVEMENTS_SUMMARY.md
│   ├── COMPLETE_PLUGIN_SUMMARY.md
│   └── FINAL_SUMMARY.md
├── .claude-plugin/
│   └── marketplace.json
└── plugins/
    ├── frontend/                     # Full-featured frontend plugin
    │   ├── plugin.json
    │   ├── DEPENDENCIES.md
    │   ├── README.md
    │   ├── agents/                   (13 agents)
    │   ├── commands/                 (6 commands)
    │   ├── skills/                   (3 skills)
    │   └── mcp-servers/
    └── code-analysis/                # Code analysis plugin
        ├── plugin.json
        ├── agents/                   (1 agent)
        ├── commands/                 (1 command)
        └── skills/                   (2 skills)
```

## Important Files

### For Users
- `README.md` - Start here for installation and usage
- `.env.example` - Template for required environment variables
- `ai-docs/TEAM_CONFIG_ARCHITECTURE.md` - Setup guide

### For Maintainers
- `.claude-plugin/marketplace.json` - Marketplace configuration
- `plugins/frontend/plugin.json` - Plugin manifest
- `ai-docs/DYNAMIC_MCP_GUIDE.md` - MCP configuration patterns

### For Contributors
- `ai-docs/COMPLETE_PLUGIN_SUMMARY.md` - Complete reference
- `plugins/frontend/DEPENDENCIES.md` - Dependencies

## Commands and Agents Available

### Frontend Plugin (Full-Featured - Sonnet)

**Agents:**
- `typescript-frontend-dev` - TypeScript/React implementation (Sonnet)
- `frontend-architect` - Architecture planning (Sonnet)
- `ui-manual-tester` - Browser UI testing (Haiku)
- `test-architect` - Testing strategy (Sonnet)
- `api-documentation-analyst` - API docs analysis (Sonnet)
- `project-cleaner` - Cleanup utilities (Haiku)
- `senior-code-reviewer` - Code review (Sonnet)
- `codex-code-reviewer` - AI code review via Codex (Proxy)
- `designer` - UI/UX design review specialist (Sonnet)
- `ui-developer` - Senior UI developer with Tailwind CSS 4 & React 19 best practices (Sonnet)
- `ui-developer-codex` - Expert UI review proxy via Codex AI (Proxy)

**Commands:**
- `/implement` - Full-cycle implementation with design fidelity validation (8 phases)
- `/implement-ui` - Implement UI from scratch with intelligent agent switching
- `/import-figma` - Import Figma components
- `/configure-mcp` - Configure MCP servers
- `/api-docs` - API documentation workflows
- `/cleanup-artifacts` - Clean temporary files
- `/validate-ui` - UI validation workflow with designer & ui-developer

**Skills:**
- `browser-debugger` - UI testing & debugging
- `api-spec-analyzer` - OpenAPI/Swagger analysis
- `ui-implementer` - Proactive UI implementation from design references

### Code Analysis Plugin

**Agents:**
- `codebase-detective` - Deep code investigation (Sonnet)

**Commands:**
- `/analyze` - Launch deep codebase investigation

**Skills:**
- `deep-analysis` - Automatic code investigation and analysis
- `semantic-code-search` - Expert guidance on claude-context MCP usage

## MCP Error Handling

### Claude-Context "Not Indexed" Error

**CRITICAL**: When using `mcp__claude-context__search_code` and receiving an error "Codebase 'X' is not indexed", follow this **ERROR-TRIGGERED INDEXING** pattern:

```
# ❌ WRONG - Don't index proactively every time
mcp__claude-context__index_codebase(path: "/path")
mcp__claude-context__search_code(path: "/path", query: "...")

# ✅ CORRECT - Only index when error occurs
1. Try search FIRST:
   mcp__claude-context__search_code(path: "/path", query: "...")

2. IF error contains "not indexed":
   - Log: "Codebase not indexed. Indexing now..."
   - Run: mcp__claude-context__index_codebase(path: "/path", splitter: "ast")
   - Wait for indexing to complete
   - Retry: mcp__claude-context__search_code(path: "/path", query: "...")

3. IF error is different (e.g., invalid path):
   - Report error to user
   - Ask for correct path
```

**Key Principles:**
- ✅ **Always try search first** - Don't assume codebase isn't indexed
- ✅ **Only index on error** - Check if "not indexed" is in error message
- ✅ **Use AST splitter by default** - Best for code search
- ✅ **Retry search after indexing** - Complete the original operation
- ❌ **Never index proactively** - Wastes time if already indexed
- ❌ **Never re-index unnecessarily** - Check status first if unsure

**Example Error Handling:**

```typescript
// User asks: "Find authentication logic"

// Step 1: Try search first
result = mcp__claude-context__search_code({
  path: "/Users/jack/project",
  query: "user authentication login flow"
})

// Step 2: Handle error if not indexed
if (result.error && result.error.includes("not indexed")) {
  console.log("Codebase not indexed. Indexing now (first time setup)...")

  // Index the codebase
  mcp__claude-context__index_codebase({
    path: "/Users/jack/project",
    splitter: "ast",
    force: false  // Don't overwrite existing index
  })

  // Retry the search
  result = mcp__claude-context__search_code({
    path: "/Users/jack/project",
    query: "user authentication login flow"
  })
}

// Step 3: Use search results
// ... process results ...
```

**This Pattern Ensures:**
- Fast searches when codebase is already indexed (99% of cases)
- Automatic indexing only when needed (first time or after clear)
- No wasted time re-indexing already-indexed codebases
- Seamless user experience (error is handled transparently)

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

## Quick Reference

### Recommended Setup (Global Marketplace + Per-Project Plugins)

**Step 1: Add marketplace globally (one-time):**
```bash
/plugin marketplace add MadAppGang/claude-code
```

**Step 2: Enable plugins in project settings:**

Add to `.claude/settings.json`:
```json
{
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true,
    "code-analysis@mag-claude-plugins": true
  }
}
```

Commit this file and team members get automatic setup!

**Plugin Guide:**
- Use **frontend** for production code, complex features, comprehensive testing, UI development
- Use **code-analysis** for investigating bugs, understanding legacy code, semantic code search

### Alternative: Global Plugin Installation

Install plugin globally (not recommended for teams):
```bash
/plugin marketplace add MadAppGang/claude-code
/plugin install frontend@mag-claude-plugins
```

### Local Development

Test local changes:
```bash
/plugin marketplace add /Users/jack/mag/claude-code
/plugin install frontend@mag-claude-plugins
```

### Advanced: Project-Specific Marketplace

Include marketplace in project settings (requires folder trust):
```json
{
  "extraKnownMarketplaces": {
    "mag-claude-plugins": {
      "source": {"source": "github", "repo": "MadAppGang/claude-code"}
    }
  },
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true
  }
}
```

## Design Principles

1. **Shareable Config, Private Secrets** - Configuration in git, credentials in environment
2. **Validation First** - Check before ask, validate before save
3. **Team Ready** - Auto-install, consistent setup, no drift
4. **Security First** - No secrets in git, personal tokens, clear docs
5. **Developer Experience** - Smart defaults, clear errors, fast for returning users

## Status

✅ **Production Ready**

**2 Complete Plugins:**
1. **Frontend** (v2.6.1) - 13 agents, 6 commands, 3 skills - Full-featured Sonnet with CSS-aware validation and CVA best practices
2. **Code Analysis** (v1.1.0) - 1 agent, 1 command, 2 skills - Deep investigation with semantic search

**Features:**
- 13+ specialized agents
- **Designer + UI Developer ecosystem** (3 agents for pixel-perfect implementation)
- 7 slash commands (including /implement-ui with intelligent agent switching)
- 5 workflow skills (including semantic-code-search for claude-context MCP)
- **Design Fidelity Validation** in /implement command (PHASE 2.5)
- Modern UI development with **Tailwind CSS 4 & React 19 best practices (2025)**
- **Semantic code search** with 40% token reduction
- **Smart agent switching** - adaptively uses UI Developer or UI Developer Codex
- 4500+ lines of documentation
- Team architecture implemented
- Smart validation system
- Security best practices
- Ready for distribution

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Last Updated:** November 6, 2024
**Version:** 2.6.1
