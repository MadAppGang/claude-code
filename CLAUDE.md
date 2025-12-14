# Project Context for Claude Code

## Project Overview

**Repository:** MAG Claude Plugins
**Purpose:** Professional plugin marketplace for Claude Code
**Owner:** Jack Rudenko (i@madappgang.com) @ MadAppGang
**License:** MIT

## What This Repository Contains

A complete Claude Code plugin marketplace with enterprise-level architecture:

- **Plugin Marketplace** (`mag-claude-plugins`)
- **Frontend Development Plugin** (v3.12.0) - Full-featured Opus-powered
  - 11 Specialized Agents (Plan Reviewer + CSS Developer + Designer + UI Developer ecosystem with multi-model review)
  - **LLM Performance Tracking** (NEW in v3.11.0) - Track external model execution times, quality scores, and recommendations to `ai-docs/llm-performance.json`
  - **Opus 4.5 Upgrades** (NEW in v3.8.0) - Critical architecture and review agents now use Opus 4.5 for superior reasoning
  - **Multi-Model Code Review** (NEW in v3.6.0) - `/review` command with parallel execution (3-5x speedup), consensus analysis, and cost transparency
  - 7 Slash Commands (including `/review` for multi-model code review)
  - **11 Modular Skills** (efficient context usage - load only what you need):
    - **core-principles** - Project structure, execution rules, authoritative sources
    - **tooling-setup** - Vite, TypeScript, Biome, Vitest configuration
    - **react-patterns** - React 19 compiler, actions, forms, hooks
    - **tanstack-router** - Type-safe routing patterns
    - **tanstack-query** - Comprehensive Query v5 guide (900+ lines)
    - **router-query-integration** - Router loaders with Query prefetching
    - **api-integration** - Apidog + OpenAPI + MCP patterns
    - **performance-security** - Performance, a11y, security best practices
    - **browser-debugger** - Chrome DevTools MCP testing
    - **api-spec-analyzer** - OpenAPI analysis
    - **ui-implementer** - Proactive UI implementation
  - MCP Servers (auto-configured)
  - **Modular Best Practices Architecture** - Context-efficient skill system prevents information overload
  - **Intelligent Workflow Detection** - Automatically detects API/UI/Mixed tasks and adapts execution
  - **Chrome DevTools MCP debugging methodology** for responsive layout issues
  - CSS-aware design validation with DOM inspection and computed CSS analysis
  - CSS architecture management with knowledge files
  - Pixel-perfect UI implementation with parallel design validation
  - Task decomposition for isolated, parallel implementation
- **Code Analysis Plugin** (v2.4.0) - Deep codebase investigation with ENFORCED claudemem v0.2.0
  - 1 Specialized Agent (codebase-detective)
  - 11 Skills + 5 PreToolUse Hooks + 1 SessionStart Hook
  - **Claudemem v0.2.0 LLM Enrichment** (NEW in v2.4.0) - symbol_summary and file_summary for code understanding
    - symbol_summary: Function behavior, params, returns, side effects
    - file_summary: File purpose, exports, architectural patterns
    - --use-case navigation: Agent-optimized search weights
  - **PreToolUse Hooks** - Automatically intercept Grep/Bash/Glob/Read
    - Grep → BLOCKED, replaced with claudemem search results
    - Bash grep/rg/find → BLOCKED, replaced with claudemem search
    - Glob (broad patterns) → WARNING, suggests claudemem
    - Read (3+ files) → WARNING, suggests claudemem
  - **Zero Context Overhead** - Hooks run externally, don't consume tokens
  - **`/setup` Command** - Inject enforcement rules into project CLAUDE.md
  - Local semantic code search with claudemem CLI (Tree-sitter + OpenRouter + LanceDB)
- **Bun Backend Plugin** (v1.5.2) - Production-ready TypeScript backend with Bun
  - 3 Specialized Agents (backend-developer + api-architect + apidog)
  - **Opus 4.5 Architecture** (NEW in v1.5.0) - API Architect now uses Opus 4.5 for superior system design
  - 3 Slash Commands (/implement-api + /setup-project + /apidog)
  - 1 Skill (best-practices with camelCase conventions)
  - MCP Servers (Apidog)
  - **Comprehensive camelCase naming conventions** for API and database
  - Apidog integration for API documentation synchronization
  - Clean architecture (routes → controllers → services → repositories)
  - Full-stack TypeScript consistency
- **Orchestration Plugin** (v0.5.0) - Shared multi-agent coordination patterns with ENFORCED LLM performance tracking
  - **5 Specialized Skills** (shared orchestration knowledge):
    - **multi-agent-coordination** - Parallel vs sequential execution, agent selection, sub-agent delegation
    - **multi-model-validation** - 4-Message Pattern, Claudish proxy, consensus analysis, 3-5x speedup, **MANDATORY Statistics Checklist** (NEW in v0.5.0)
    - **quality-gates** - User approval, iteration loops, TDD pattern, severity classification
    - **todowrite-orchestration** - Phase tracking, real-time progress, workflow management
    - **error-recovery** - Timeout, API failures, partial success, retry strategies, graceful degradation
  - **SubagentStop Hook** (NEW in v0.5.0) - Enforces statistics collection, warns if multi-model review is incomplete
  - **SessionStart Hook** - Checks claudish installation and API key at session start
  - **`/setup` Command** - Inject 4-Message Pattern rules into project CLAUDE.md
  - **LLM Performance Tracking** - Track model execution times, quality scores, and recommendations to `ai-docs/llm-performance.json`
  - **Skills-only architecture** - Pure knowledge plugin (2 commands + 5 skills + 2 hooks)
  - **Skill bundles** - core, advanced, testing, complete
  - **Context-efficient** - Load only needed skills (vs monolithic)
  - **Dependency model** - Auto-installs with plugins that need orchestration
- **Claudish** - Run Claude Code with OpenRouter models
  - **GitHub**: https://github.com/MadAppGang/claudish
  - **Install**: `npm install -g claudish`
  - CLI tool (standalone, separate repository)
  - Local Anthropic API proxy
  - **Top Recommended Models for Development:**
    - `x-ai/grok-code-fast-1` - xAI's Grok (fast coding)
    - `openai/gpt-5-codex` - OpenAI's GPT-5 Codex (advanced reasoning)
    - `minimax/minimax-m2` - MiniMax M2 (high performance)
    - `qwen/qwen3-vl-235b-a22b-instruct` - Alibaba's Qwen (vision-language)
    - `anthropic/claude-sonnet-4.5` - Claude (for comparison)
  - Interactive model selector (Ink UI)
  - Auto-approve enabled by default
  - Real-time streaming output
  - **100% VERIFIED** - Routes to real OpenRouter models, NOT Anthropic

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

## Commands and Agents Available

### Frontend Plugin (Full-Featured - Sonnet)

**Agents:**
- `typescript-frontend-dev` - TypeScript/React implementation (Sonnet)
- `frontend-architect` - Architecture planning (Sonnet)
- `plan-reviewer` - Multi-model architecture plan review (Proxy) **NEW in v3.3.0**
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
- `/implement` - Full-cycle implementation with intelligent workflow detection (API/UI/Mixed) and adaptive execution (8 phases)
  - **NEW in v2.8.0**: Automatically detects task type and adapts workflow
  - API-focused: Skips design validation, runs 2 code reviewers, focuses on API testing
  - UI-focused: Full design validation, runs 3 reviewers (code + codex + UI tester), UI testing
  - Mixed: Both workflows combined with appropriate focus areas
- `/implement-ui` - Implement UI from scratch with intelligent agent switching
- `/import-figma` - Import Figma components
- `/api-docs` - API documentation workflows
- `/cleanup-artifacts` - Clean temporary files
- `/validate-ui` - UI validation workflow with designer & ui-developer
- `/review` - **NEW in v3.6.0**: Multi-model code review orchestrator with parallel execution (3-5x speedup)
  - Review unstaged changes, specific files, or recent commits
  - Choose up to 9 external models + 1 embedded (Grok, Gemini, DeepSeek, GPT-5 Codex, etc.)
  - Parallel execution: 15 min → 5 min with real-time progress indicators
  - Consensus analysis: Prioritize issues by cross-model agreement (unanimous/strong/majority/divergent)
  - Cost transparency: Input/output token separation with range-based estimates
  - Graceful degradation: Works with embedded Claude Sonnet if external models unavailable

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
- `claudemem-search` - Expert guidance on claudemem CLI for local semantic search

### Bun Backend Plugin

**Agents:**
- `backend-developer` - TypeScript backend implementation with Bun (Sonnet)
- `api-architect` - Backend API architecture planning (Sonnet)
- `apidog` - API documentation synchronization specialist (Sonnet)

**Commands:**
- `/implement-api` - Full-cycle API implementation with multi-agent orchestration
- `/setup-project` - Initialize new Bun + TypeScript backend project
- `/apidog` - Synchronize API specifications with Apidog

**Skills:**
- `best-practices` - Comprehensive TypeScript backend best practices with Bun (2025)
  - camelCase naming conventions for API and database
  - Clean architecture patterns
  - Security best practices
  - Prisma ORM patterns
  - Testing strategies

### Orchestration Plugin (Skills-Only)

**Purpose:** Centralized multi-agent coordination and workflow orchestration patterns

**Skills (5):**
- `multi-agent-coordination` - Parallel vs sequential execution, agent selection patterns
- `multi-model-validation` - 4-Message Pattern for parallel AI model execution via Claudish
- `quality-gates` - Approval gates, iteration loops, TDD pattern, severity classification
- `todowrite-orchestration` - Phase tracking in complex multi-step workflows
- `error-recovery` - Production error handling (timeout, failures, cancellation, retries)

**Skill Bundles:**
- `core` - multi-agent-coordination, quality-gates
- `advanced` - multi-model-validation, error-recovery
- `testing` - quality-gates, todowrite-orchestration
- `complete` - All 5 skills

**Usage:**
Plugins declare orchestration as a dependency:
```json
{
  "dependencies": {
    "orchestration@mag-claude-plugins": "^0.1.0"
  }
}
```

Commands/agents reference skills in frontmatter:
```yaml
---
skills: orchestration:multi-model-validation, orchestration:quality-gates
---
```

**Key Innovation:** Transforms hardcoded orchestration knowledge from command prompts into modular, context-efficient skills that load on-demand.

### Orchestration Skills (Shared Across All Plugins)

**Skills:**
- `multi-agent-coordination` - Coordinate multiple agents (parallel/sequential)
- `multi-model-validation` - Run multiple AI models in parallel via Claudish
- `quality-gates` - Implement approval gates and iteration loops
- `todowrite-orchestration` - Track progress in complex workflows
- `error-recovery` - Handle production failures gracefully

**How to Use:**
Skills auto-load when commands/agents reference them in frontmatter. Plugins that depend on orchestration get automatic access to all orchestration skills.

## Claudemem Semantic Search (v0.2.0)

The code-analysis plugin uses **claudemem v0.2.0** CLI with **LLM enrichment** for intelligent semantic code search.

### What's New in v0.2.0: LLM Enrichment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CLAUDEMEM v0.2.0 ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SEARCH LAYER                                                               │
│  └── Query → Embed → Vector Search + BM25 → Ranked Results                 │
│                              ↓                                              │
│  ENRICHMENT LAYER (LLM) ⭐NEW                                              │
│  └── file_summary: File PURPOSE, exports, patterns (1 call/file)           │
│  └── symbol_summary: Function BEHAVIOR, params, side effects (batched)     │
│                              ↓                                              │
│  INDEX LAYER                                                                │
│  └── Tree-sitter AST → Semantic Chunks → Embeddings → LanceDB              │
│                                                                             │
│  SEARCH MATCHES BOTH RAW CODE AND LLM SUMMARIES                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Innovation**: Search queries now match BOTH raw code chunks AND LLM-enriched summaries (file_summary, symbol_summary). This dramatically improves semantic understanding.

### Document Types

| Document Type | Source | Best For |
|---------------|--------|----------|
| `code_chunk` | Tree-sitter AST | Exact implementations, signatures |
| `file_summary` ⭐NEW | LLM analysis | Architecture discovery, file roles |
| `symbol_summary` ⭐NEW | LLM analysis | Function behavior, side effects, params |

### Search Use Cases

| Use Case | When to Use | Command |
|----------|-------------|---------|
| **Search** (default) | Human searching codebase | `claudemem search "query"` |
| **Navigation** ⭐AGENTS | AI agent exploring codebase | `claudemem search "query" --use-case navigation` |
| **FIM** | Code completion | `claudemem search "query" --use-case fim` |

**⚠️ IMPORTANT**: When using claudemem in agents, ALWAYS use `--use-case navigation` for optimized weights.

### Installation

```bash
# npm (recommended)
npm install -g claude-codemem

# Homebrew (macOS)
brew tap MadAppGang/claude-mem && brew install --cask claudemem
```

### Configuration

```bash
# Initialize with OpenRouter API key
claudemem init

# Get API key at: https://openrouter.ai/keys

# See available embedding models
claudemem --models
```

### Embedding Models

| Model | Best For | Price |
|-------|----------|-------|
| `voyage/voyage-code-3` | **Best Quality** (default) | $0.180/1M |
| `qwen/qwen3-embedding-8b` | Best Balanced | $0.010/1M |
| `qwen/qwen3-embedding-0.6b` | Best Value | $0.002/1M |

### Usage (v0.2.0)

```bash
# Index with LLM enrichment (RECOMMENDED)
claudemem index --enrich

# Or index first, then enrich
claudemem index
claudemem enrich

# Semantic search (default mode)
claudemem search "user authentication flow"

# Search for agents (navigation mode)
claudemem search "user authentication flow" --use-case navigation

# Check status (shows enrichment)
claudemem status
```

### Key Features

- **3-Layer Architecture** - Search + Enrichment + Index
- **LLM Enrichment** ⭐NEW - file_summary + symbol_summary
- **Tree-sitter parsing** - Preserves function/class boundaries
- **OpenRouter embeddings** - Uses voyage/voyage-code-3 by default
- **Local storage** - LanceDB in `.claudemem/` directory
- **Hybrid search** - BM25 keyword + dense vector similarity
- **MCP server mode** - Run with `claudemem --mcp`
- **Use Case Modes** ⭐NEW - search, navigation (agents), fim (completion)

### ⚠️ TOOL SELECTION RULES FOR CODE INVESTIGATION

**CRITICAL**: When investigating code, ALWAYS prefer claudemem over grep/glob.

```
┌─────────────────────────────────────────────────────────────────────┐
│              CODE INVESTIGATION TOOL SELECTION (v0.2.0)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BEFORE ANY CODE SEARCH:                                            │
│  1. Run: claudemem status                                           │
│  2. Check: file_summary > 0, symbol_summary > 0 (enriched)          │
│  3. If not enriched → Run: claudemem enrich                         │
│  4. Search with: --use-case navigation (for agents)                 │
│                                                                      │
│  ❌ NEVER use grep/glob for:                                        │
│     - "How does X work?"                                            │
│     - "Find implementations of"                                     │
│     - "Audit architecture"                                          │
│     - "Trace data flow"                                             │
│                                                                      │
│  ✅ ONLY use grep for:                                              │
│     - Exact string matches: grep -r "SPECIFIC_CONSTANT"             │
│     - Symbol lookup: grep -r "class ExactName"                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Quick Reference:**

| User Request | ❌ DON'T | ✅ DO |
|-------------|----------|-------|
| "How does auth work?" | `grep -r "auth"` | `claudemem search "authentication flow" --use-case navigation` |
| "Find API endpoints" | `grep -r "router"` | `claudemem search "API endpoint handler" --use-case navigation` |
| "Audit integrations" | `grep -r "import"` | `claudemem search "external integration API" --use-case navigation` |

### Why Enrichment Matters

| Without Enrichment (v0.1.x) | With Enrichment (v0.2.0) |
|-----------------------------|-----------------------------|
| Matches code chunks only | Matches code + file_summary + symbol_summary |
| No understanding of PURPOSE | Knows file purpose and patterns |
| No understanding of BEHAVIOR | Knows function params, returns, side effects |
| Good for finding syntax | Great for finding MEANING |

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

## Parallel Multi-Model Execution Protocol

### Critical: When to Use This Protocol

**Use this protocol when user requests:**
- "Run reviewers in parallel" or "Validate with multiple models"
- "Run internal and external reviewers"
- Any request involving multiple AI models executing simultaneously
- Multi-model code review (`/review` command)

### The 4-Message Pattern (MANDATORY)

**❌ NEVER mix Bash and Task in the same message for parallel execution**

**✅ ALWAYS follow this strict sequence:**

#### Message 1: Preparation (Bash Only)
- Create workspace directories
- Validate inputs
- **NO Task calls**
- **NO TodoWrite**

```typescript
// CORRECT
await Bash({ command: "mkdir -p /tmp/multi-review-123" });
```

#### Message 2: Parallel Execution (ONLY Task Calls)
- Launch ALL reviewers/agents in **SINGLE message**
- **ONLY Task tool calls** - no Bash, no TodoWrite, no other tools
- Each Task is independent (no dependencies between them)
- All Tasks execute in parallel

```typescript
// CORRECT - Single message with 5 Task calls
await Task({ subagent_type: "senior-code-reviewer", prompt: "..." });
await Task({ subagent_type: "codex-code-reviewer", model: "openai/gpt-5.1-codex" });
await Task({ subagent_type: "codex-code-reviewer", model: "x-ai/grok-code-fast-1" });
await Task({ subagent_type: "codex-code-reviewer", model: "google/gemini-2.5-flash" });
await Task({ subagent_type: "codex-code-reviewer", model: "minimax/minimax-m2" });
```

#### Message 3: Automatic Consolidation (Task Only)
- **DO NOT wait for user to request consolidation**
- Automatically launch consolidation agent
- Pass all review file paths to consolidator

```typescript
// CORRECT - Automatic upon receiving N summaries
if (receivedSummaries.length >= 2) {
  await Task({
    subagent_type: "senior-code-reviewer",
    description: "Consolidate multi-model reviews",
    prompt: `
Consolidate these ${receivedSummaries.length} reviews:
[review contents]

Return consensus analysis and prioritized recommendations.
    `
  });
}
```

#### Message 4: Present Results
- Show consolidated review to user
- Include summary and link to detailed file

### What Makes Parallel Execution Fail

#### ❌ Anti-Pattern 1: Mixed Tools
```typescript
// WRONG - Will execute sequentially, NOT in parallel
await TodoWrite({...});           // Tool 1
await Task({...});                // Tool 2 - waits for TodoWrite
await Bash({...});                // Tool 3 - waits for Task
await Task({...});                // Tool 4 - waits for Bash
```

**Why it fails**: Claude Code sees different tool types and assumes dependencies

#### ✅ Correct Pattern: Single Tool Type
```typescript
// CORRECT - All Tasks run in parallel
await Task({...});                // Task 1
await Task({...});                // Task 2
await Task({...});                // Task 3
// All execute simultaneously
```

### Proxy Mode: Blocking Execution Required

**When using external models (Claudish) in agents:**

❌ **WRONG** (returns immediately, doesn't wait):
```bash
# Background execution - agent returns before model completes
claudish --model x-ai/grok-code-fast-1 ... &
```

✅ **CORRECT** (blocks until completion):
```bash
# Synchronous execution - agent waits for full response
RESULT=$(claudish --model x-ai/grok-code-fast-1 ...)
echo "$RESULT" > review.md
echo "Review complete - see review.md"  # Brief summary
```

**Agent Requirements:**
1. Execute claudish **synchronously** (blocking)
2. Capture full output
3. Write detailed results to file
4. Return **brief summary** (2-5 sentences) to orchestrator
5. **NEVER** return full output to orchestrator

### Auto-Consolidation Logic

**Automatic trigger**: After receiving N review summaries where N ≥ 2

```typescript
// In orchestrator code
const reviewSummaries = await Promise.allSettled(allReviewTasks);

// Auto-trigger consolidation
if (reviewSummaries.filter(r => r.status === 'fulfilled').length >= 2) {
  // DON'T wait for user prompt - do it automatically
  const consolidated = await Task({
    subagent_type: "senior-code-reviewer",
    description: "Auto-consolidate reviews",
    prompt: `Consolidate ${reviewSummaries.length} reviews into consensus analysis`
  });

  // Present results
  return formatConsolidatedResults(consolidated);
}
```

### Why This Protocol Exists

**Problem**: User requests "run 5 reviewers in parallel" but gets sequential execution

**Root Causes**:
1. Mixing Bash + Task in same message → Claude assumes dependencies
2. No auto-consolidation → Waited for user to request it
3. Proxy mode not blocking → Agents returned before external models completed
4. No clear workflow protocol → Agents didn't know the pattern

**Solution**: This explicit 4-message protocol ensures:
- ✅ True parallel execution (5-10x faster)
- ✅ Automatic consolidation (no user prompt needed)
- ✅ Blocking proxy execution (waits for external models)
- ✅ Predictable workflow (clear state machine)

### Example: Complete Workflow

**User**: "Run internal and 4 external reviewers to validate implementation"

```typescript
// Message 1: Prep
await Bash({ command: "mkdir -p /tmp/review-123" });

// Message 2: Parallel reviews (SINGLE message, 5 Task calls)
const tasks = [
  Task({ subagent_type: "senior-code-reviewer", prompt: "Internal review" }),
  Task({ subagent_type: "codex-code-reviewer", model: "openai/gpt-5.1-codex" }),
  Task({ subagent_type: "codex-code-reviewer", model: "x-ai/grok-code-fast-1" }),
  Task({ subagent_type: "codex-code-reviewer", model: "google/gemini-2.5-flash" }),
  Task({ subagent_type: "codex-code-reviewer", model: "minimax/minimax-m2" })
];
const results = await Promise.allSettled(tasks);

// Message 3: Auto-consolidation (triggered automatically)
const consolidated = await Task({
  subagent_type: "senior-code-reviewer",
  description: "Consolidate reviews",
  prompt: `${results.length} reviews completed. Analyze consensus and divergence.`
});

// Message 4: Present results
return formatReviewResults(consolidated);
```

**Total**: 1 user request → 4 assistant messages → Complete results

---

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
- Use **orchestration** (auto-installed) for multi-agent coordination patterns

### Installation Options

**Option 1: Automatic (Recommended)**
When you install a plugin that depends on orchestration (like frontend), orchestration installs automatically.

**Option 2: Standalone**
Install orchestration plugin independently:
```bash
/plugin install orchestration@mag-claude-plugins
```

**Option 3: Global**
Install globally (available to all projects):
```bash
/plugin install orchestration@mag-claude-plugins --global
```

### Alternative: Global Plugin Installation

Install plugin globally (not recommended for teams):
```bash
/plugin marketplace add MadAppGang/claude-code
/plugin install frontend@mag-claude-plugins
```

### Local Development

Test local changes:
```bash
/plugin marketplace add /path/to/claude-code
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

**5 Complete Plugins:**
1. **Orchestration** (v0.5.0) - 5 skills, 2 commands, 2 hooks - Shared multi-agent coordination patterns with ENFORCED statistics
2. **Frontend** (v3.13.0) - 11 agents, 7 commands, 11 skills - Full-featured with LLM performance tracking
3. **Code Analysis** (v2.4.0) - 1 agent, 3 commands, 11 skills, 5 hooks - ENFORCED claudemem v0.2.0 with LLM enrichment
4. **Bun Backend** (v1.5.2) - 3 agents, 3 commands, 1 skill - Production TypeScript backend with Bun
5. **Agent Development** (v1.1.0) - 3 agents, 1 command, 3 skills - Create Claude Code agents with LLM performance tracking

**Features:**
- **LLM Performance Tracking** (NEW v0.2.0) - Track external model execution times, quality scores, recommendations
  - Persistent storage in `ai-docs/llm-performance.json`
  - Historical performance data across sessions
  - Identify slow models (2x+ avg) and unreliable models (>30% failure)
  - Data-driven shortlist recommendations
- **Skills-First Architecture** - Orchestration plugin demonstrates pure skills pattern
- **Shared Orchestration Knowledge** - 5 skills available across all plugins
- **Context-Efficient Design** - Load only needed skills (4-5 focused skills vs monolithic)
- 13+ specialized agents
- 7+ slash commands
- 18+ focused skills
- MCP server integrations
- Multi-model validation with consensus analysis
- 6,774+ lines of orchestration documentation
- **Modular Best Practices System (v2.9.0)** - Context-efficient skill architecture
  - 8 focused best practice skills (vs 1 monolithic 1200-line file)
  - Load only what you need: tooling, React, Router, Query, API, performance, security
  - 900+ lines TanStack Query v5 guidance in dedicated skill
  - Prevents context overload - agents get relevant information only
  - Cross-referenced skills for easy navigation
  - Feature-based colocation, query key factories, Query Options API
  - Multi-layer error handling, Suspense integration, optimistic updates
  - Advanced patterns: prefetching, infinite queries, pagination
  - Performance optimization, MSW testing, anti-patterns
- **Intelligent Workflow Detection with Test-Driven Development** (Enhanced in v2.9.0)
  - API-focused workflows: **Test-driven feedback loop** in PHASE 2.5 (NEW!)
    - Automated Vitest test writing and execution
    - Test-architect analyzes failures (test vs implementation issues)
    - Loops with developer until all tests pass
    - Eliminates manual testing, ensures quality before code review
  - UI-focused workflows: Design validation and 3-reviewer quality gates
  - Mixed workflows: Combine test-driven API development with UI validation
- **Designer + UI Developer ecosystem** (3 agents for pixel-perfect implementation)
- **Design Fidelity Validation** in /implement command (PHASE 2.5 - adaptive)
- Modern UI development with **Tailwind CSS 4 & React 19 best practices (2025)**
- **Semantic code search** with 40% token reduction
- **Smart agent switching** - adaptively uses UI Developer or UI Developer Codex
- Team architecture implemented
- Smart validation system
- Security best practices
- Ready for distribution

## Release Documentation

**Version History:** See [CHANGELOG.md](./CHANGELOG.md) for all versions

**Detailed Release Notes:** See [RELEASES.md](./RELEASES.md) for comprehensive release documentation

**Current Versions:**
- Orchestration Plugin: **v0.5.0** (2025-12-14)
- Frontend Plugin: **v3.13.0** (2025-12-14)
- Code Analysis Plugin: **v2.4.0** (2025-12-14)
- Bun Backend Plugin: **v1.5.2** (2025-11-26)
- Agent Development Plugin: **v1.1.0** (2025-12-09)
- Claudish CLI: See https://github.com/MadAppGang/claudish (separate repository)

**Latest Changes (Code Analysis v2.4.0 - Claudemem v0.2.0 LLM Enrichment):**
- ✅ **Claudemem v0.2.0 Integration**: Full support for LLM-enriched semantic search
- ✅ **New Document Types**: symbol_summary (function behavior, side effects) and file_summary (file purpose, patterns)
- ✅ **Navigation Search Mode**: All agents/hooks use `--use-case navigation` for optimized weights
- ✅ **Enrichment Status Checking**: SessionStart hook and all skills verify enrichment status
- ✅ **Detective Skills v2.0.0**: All 5 detective skills updated for document type specialization
  - architect-detective: Uses file_summary for architecture discovery
  - developer-detective: Uses symbol_summary for implementation understanding
  - tester-detective: Uses symbol_summary for test purpose analysis
  - debugger-detective: Uses symbol_summary side_effects for bug tracing
  - ultrathink-detective: Combines all document types for multi-dimensional analysis
- ✅ **Updated Hooks**: intercept-grep.sh and intercept-bash.sh use navigation mode

**Previous Changes (Orchestration v0.5.0 - Statistics Enforcement):**
- ✅ **SubagentStop Hook**: Automatically detects multi-model validation and warns if statistics weren't collected
- ✅ **MANDATORY Statistics Checklist**: 6-step checklist in skill prevents incomplete reviews
- ✅ **Timing Instrumentation Examples**: Pre-flight checklist, per-model timing, bash associative arrays
- ✅ **Required Output Template**: Standardized performance table format
- ✅ **Verification Script**: `verify_statistics_complete()` function to check before presenting results
- ✅ **Common Mistakes Table**: Quick reference for debugging timing issues
- ✅ **Based on Real Feedback**: Addressed actual agent failures in production use

**Previous Changes (Orchestration v0.4.0 - SessionStart Hook & CLAUDE.md Injection):**
- ✅ **SessionStart Hook**: Check claudish installation and OpenRouter API key at session start
- ✅ **`/setup` Command**: Inject 4-Message Pattern enforcement rules into project CLAUDE.md
- ✅ **CLAUDE.md Template**: Comprehensive rules for multi-model parallel execution
- ✅ **Zero Context Overhead**: Hooks run externally, don't consume tokens
- ✅ **Claudish Status Messages**: Clear guidance when claudish not installed/configured

**Previous Changes (Code Analysis v2.3.0 - PreToolUse Hook Enforcement):**
- ✅ **PreToolUse Hooks**: Automatically intercept search tools with zero context overhead
  - `intercept-grep.sh` - Blocks Grep, returns claudemem results
  - `intercept-bash.sh` - Blocks bash grep/rg/find, returns claudemem results
  - `intercept-glob.sh` - Warns on broad patterns, suggests claudemem
  - `intercept-read.sh` - Warns on 3+ sequential reads, suggests claudemem
- ✅ **SessionStart Hook**: Checks claudemem status at session start
- ✅ **`/setup` Command**: Inject enforcement rules into project CLAUDE.md
- ✅ **Zero Context Overhead**: Hooks run externally, don't consume tokens
- ✅ **Transparent Replacement**: Claude calls Grep, gets claudemem results automatically

**Previous Changes (Code Analysis v2.2.0 - Auto-Triggering Skills):**
- ✅ Auto-invocation triggers on keywords ("audit", "investigate", "how does X work")
- ✅ search-interceptor skill for multi-file Read/Glob detection
- ✅ Anti-pattern detection for tool familiarity bias

**Previous Changes (Code Analysis v2.1.0 - Tool Selection Rules):**
- ✅ Explicit tool selection rules in codebase-detective agent
- ✅ code-search-selector skill with decision tree

**Previous Changes (Multi-Model Validation v0.3.0 & Detective v1.4.0):**
- ✅ Dynamic model discovery via `claudish --top-models` and `claudish --free`
- ✅ Session-Based Workspaces: Unique `/tmp/review-{timestamp}-{hash}` directories
- ✅ Interactive Model Selection: AskUserQuestion with multiSelect for model choice
- ✅ Free Model Support: Recommended free models (qwen3-coder, devstral-2512, qwen3-235b)
- ✅ Pattern 0: Session setup and model discovery workflow
- ✅ Pattern 8: Data-driven model selection based on historical performance
- ✅ Detective Claudemem Integration: Local semantic search with claudemem CLI

**Previous Changes (LLM Performance Tracking v0.2.0):**
- ✅ **NEW**: LLM Performance Tracking across all multi-model plugins
- ✅ **Persistent Storage**: `ai-docs/llm-performance.json` tracks all external model executions
- ✅ **Per-Model Metrics**: Execution time, issues found, quality score, success rate
- ✅ **Historical Analysis**: Track performance across 50+ sessions
- ✅ **Smart Recommendations**: Identify slow models (2x+ avg), unreliable models (>30% failure)
- ✅ **Data-Driven Shortlists**: Top performers based on quality/speed ratio
- ✅ **Updated Plugins**:
  - Orchestration v0.2.0 - Pattern 7: Statistics Collection in multi-model-validation skill
  - Frontend v3.11.0 - `/review` command with full statistics tracking
  - Agent Development v1.1.0 - `/develop` command tracks plan review + quality review stats

**Previous Changes (Agent Development v1.0.0):**
- ✅ **NEW**: Agent Development plugin for creating Claude Code agents
- ✅ **3 Specialized Agents**: `agentdev:architect`, `agentdev:developer`, `agentdev:reviewer`
- ✅ **1 Orchestration Command**: `/develop` for full-cycle agent development
- ✅ **3 Reusable Skills**: `xml-standards`, `patterns`, `schemas`
- ✅ **Multi-Model Validation**: Parallel external reviews via Claudish
- ✅ **Depends on Orchestration**: Uses shared coordination patterns
- ✅ **Marketplace**: v4.2.0 release

**Previous Changes (Path Cleanup v4.1.2):**
- ✅ **Path Cleanup** - Eliminated all hardcoded `/Users/jack` paths across entire codebase
- ✅ **Documentation Portability** - All docs now use relative paths for better portability

**Previous Changes (Frontend v3.8.0 & Bun v1.5.0):**
- ✅ **Opus 4.5 Upgrades** - Critical agents upgraded to Claude Opus 4.5 for superior reasoning
- ✅ **Frontend**: `architect`, `reviewer`, `test-architect`, `plan-reviewer` updated
- ✅ **Bun**: `api-architect` updated

**Previous Changes (Orchestration v0.1.0):**
- ✅ **NEW**: Orchestration plugin with 5 shared skills
- ✅ **Skills-only architecture** - Pure knowledge, no agents/commands
- ✅ **Skill bundles** - core, advanced, testing, complete
- ✅ **Multi-model validation patterns** - 4-Message Pattern, parallel execution, consensus analysis
- ✅ **Error recovery patterns** - 7 failure scenarios with retry strategies
- ✅ **TDD loop pattern** - Extracted from /implement command
- ✅ **Context-efficient** - Load only what you need
- ✅ **6,774 lines** of comprehensive orchestration knowledge

**Git Tags:**
- Orchestration: `plugins/orchestration/v0.5.0`
- Frontend: `plugins/frontend/v3.13.0`
- Bun: `plugins/bun/v1.5.2`
- Code Analysis: `plugins/code-analysis/v2.4.0`
- Agent Development: `plugins/agentdev/v1.1.0`
- Use correct tag format when releasing: `plugins/{plugin-name}/vX.Y.Z`

**⚠️ RELEASE CHECKLIST (ALL 3 REQUIRED):**
When releasing a plugin, you MUST update ALL THREE of these:
1. **Plugin version** - `plugins/{name}/plugin.json` → `"version": "X.Y.Z"`
2. **Marketplace version** - `.claude-plugin/marketplace.json` → plugin entry `"version": "X.Y.Z"`
3. **Git tag** - `git tag -a plugins/{name}/vX.Y.Z -m "Release message"` → push with `--tags`

Missing any of these will cause claudeup to not see the update!

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Last Updated:** December 14, 2025
**Version:** 5 plugins (Orchestration v0.5.0, Frontend v3.13.0, Code Analysis v2.4.0, Bun Backend v1.5.2, Agent Development v1.1.0)
- do not use hardcoded path in code, docs, comments or any other files