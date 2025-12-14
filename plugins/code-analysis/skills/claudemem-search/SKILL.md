---
name: claudemem-search
description: "⚡ PRIMARY TOOL for semantic code understanding with LLM enrichment. ANTI-PATTERNS: Reading 5+ files sequentially, Glob then read all, Grep for 'how does X work'. CORRECT: claudemem search first (use --use-case navigation for agents), Read specific lines after."
allowed-tools: Bash, Task, AskUserQuestion
---

# Claudemem Semantic Code Search Expert (v0.2.0)

This Skill provides comprehensive guidance on leveraging **claudemem** v0.2.0 with **LLM enrichment** for intelligent, context-aware semantic code search.

## What's New in v0.2.0

```
┌─────────────────────────────────────────────────────────────┐
│                   CLAUDEMEM v0.2.0 ARCHITECTURE              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    SEARCH LAYER                          ││
│  │  Query → Embed → Vector Search + BM25 → Ranked Results   ││
│  └─────────────────────────────────────────────────────────┘│
│                              ↓                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              ENRICHMENT LAYER (LLM) ⭐NEW                ││
│  │  file_summary │ symbol_summary │ idiom │ usage_example   ││
│  │  (1 call/file)│ (batched/file) │       │                 ││
│  └─────────────────────────────────────────────────────────┘│
│                              ↓                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     INDEX LAYER                          ││
│  │  AST Parse → Chunk (functions/classes) → Embed → LanceDB ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Innovation: Dual Matching

Search queries now match **BOTH**:
- **Raw code chunks** (exact implementation, syntax)
- **LLM-enriched summaries** (semantic meaning, purpose, behavior)

This dramatically improves semantic understanding over v0.1.x.

---

## Document Types (NEW in v0.2.0)

### 1. code_chunk (Raw AST Code)

**Source:** Tree-sitter AST parsing
**Content:** Actual code blocks (functions, classes, methods)
**Best for:** Implementation details, signatures, exact syntax

| Field | Description |
|-------|-------------|
| `id` | SHA256 hash |
| `content` | Raw code |
| `filePath` | File location |
| `startLine` / `endLine` | Line numbers (1-indexed) |
| `chunkType` | function, class, method, module, block |
| `name` | Function/class name |
| `signature` | Extracted signature |

**When to prioritize:**
- Finding exact implementations
- Looking up function signatures
- Code completion (FIM)
- Syntax-level understanding

### 2. file_summary (LLM-Enriched) ⭐NEW

**Source:** LLM analysis (1 call per file)
**Content:** File purpose, exports, dependencies, patterns
**Best for:** Architecture discovery, understanding file roles

**Example enriched content:**
```
File: src/core/indexer.ts
Purpose: Core indexing orchestrator for claudemem
Responsibilities:
- Coordinates file scanning, parsing, and embedding
- Manages incremental updates via content hashing
- Integrates with enrichment pipeline for LLM summaries
Exports: CodebaseIndexer, IndexStatus
Dependencies: VectorStore, FileTracker, Enricher
Patterns: Factory pattern, progress callbacks
```

**When to prioritize:**
- Understanding codebase structure
- Finding entry points
- Mapping dependencies
- Architecture analysis

### 3. symbol_summary (LLM-Enriched, Batched) ⭐NEW

**Source:** LLM analysis (1 call for ALL symbols in file)
**Content:** Function/class documentation
**Best for:** API understanding, finding by behavior

**Example enriched content:**
```
function: enrichFiles
Summary: Enriches multiple files using batched LLM calls for efficiency
Parameters:
- files: Array of files with content and code chunks
- options: Concurrency and progress callback settings
Returns: EnrichmentResult with document counts and errors
Side effects: Stores documents in vector store, updates tracker
Usage: Called during index --enrich or standalone enrich command
```

**When to prioritize:**
- Finding functions by behavior (not name)
- Understanding parameters and returns
- Identifying side effects
- API exploration

---

## Search Use Cases & Weight Presets ⭐NEW

claudemem v0.2.0 provides three optimized search modes:

### 1. FIM (Fill-in-Middle) Completion

**Use case:** Code completion, autocomplete
**Optimizes for:** Exact code patterns

```bash
claudemem search "async function handle" --use-case fim
```

**Weight distribution:**
| Document Type | Weight |
|---------------|--------|
| code_chunk | 50% |
| usage_example | 25% |
| idiom | 15% |
| symbol_summary | 10% |

### 2. Search (Human Queries) - DEFAULT

**Use case:** Developer searching codebase
**Optimizes for:** Balanced understanding

```bash
claudemem search "authentication flow" # default mode
```

**Weight distribution:**
| Document Type | Weight |
|---------------|--------|
| file_summary | 25% |
| symbol_summary | 25% |
| code_chunk | 20% |
| idiom | 15% |
| usage_example | 10% |

### 3. Navigation (Agent Discovery) ⭐RECOMMENDED FOR AGENTS

**Use case:** AI agent exploring codebase
**Optimizes for:** Understanding structure

```bash
claudemem search "authentication middleware" --use-case navigation
```

**Weight distribution:**
| Document Type | Weight |
|---------------|--------|
| symbol_summary | 35% |
| file_summary | 30% |
| code_chunk | 20% |
| idiom | 10% |
| project_doc | 5% |

**⚠️ IMPORTANT:** When using claudemem in detective agents, ALWAYS use `--use-case navigation` for optimal results.

---

## CLI Commands Reference (Updated for v0.2.0)

### Index Codebase

```bash
# Basic indexing (AST + embeddings only)
claudemem index [path]

# Force full re-index
claudemem index -f

# Index with LLM enrichment ⭐NEW
claudemem index --enrich

# Force re-index with enrichment
claudemem index -f --enrich
```

### Enrich Indexed Files ⭐NEW

```bash
# Run enrichment on indexed files
claudemem enrich [path]

# Control parallelism (default: 10)
claudemem enrich --concurrency 5

# Enrich specific path
claudemem enrich ./src/core
```

### Search

```bash
# Semantic search (default: search use case)
claudemem search "authentication middleware"

# Limit results
claudemem search "error handling" -n 20

# Filter by language
claudemem search "class definition" -l typescript

# Specific use case ⭐NEW
claudemem search "validate input" --use-case navigation
claudemem search "async handler" --use-case fim
```

### Status

```bash
# Show index and enrichment status
claudemem status

# Output includes:
# - Total files/chunks indexed
# - Document type counts (code_chunk, file_summary, symbol_summary) ⭐NEW
# - Enrichment progress (pending/complete) ⭐NEW
# - Embedding model used
```

### AI Instructions

```bash
# Get role-specific instructions
claudemem ai architect    # System design focus
claudemem ai developer    # Implementation focus
claudemem ai tester       # Test coverage focus
claudemem ai debugger     # Error tracing focus

# Raw output for clipboard
claudemem ai developer --raw | pbcopy
```

---

## When to Use This Skill

Claude should invoke this Skill when:

- User mentions: "claudemem", "tree-sitter search", "local semantic search"
- User wants semantic search WITHOUT cloud dependencies
- User asks: "install claudemem", "set up local code search"
- User has OpenRouter API key but not OpenAI/Zilliz
- Before launching codebase-detective when claudemem is preferred
- User asks about alternatives to claude-context
- User asks about enrichment, document types, or search modes

---

## Phase 1: Installation Validation (REQUIRED)

### Step 1: Check if claudemem is Installed

```bash
# Check if claudemem CLI is available
which claudemem || command -v claudemem

# Check version (must be 0.2.0+)
claudemem --version
```

**If NOT installed**, present installation options:

```typescript
AskUserQuestion({
  questions: [{
    question: "claudemem CLI not found. How would you like to install it?",
    header: "Install",
    multiSelect: false,
    options: [
      { label: "npm (Recommended)", description: "npm install -g claude-codemem" },
      { label: "Homebrew (macOS)", description: "brew tap MadAppGang/claude-mem && brew install --cask claudemem" },
      { label: "Shell script", description: "curl -fsSL https://raw.githubusercontent.com/MadAppGang/claudemem/main/install.sh | bash" },
      { label: "Skip installation", description: "I'll install it manually later" }
    ]
  }]
})
```

### Step 2: Check Configuration and Enrichment Status ⭐UPDATED

```bash
# Check if initialized (looks for config)
ls ~/.claudemem/config.json 2>/dev/null || echo "Not configured"

# Check for project-local index
ls .claudemem/ 2>/dev/null || echo "No local index"

# Check full status including enrichment
claudemem status
```

**Status output now includes:**
- Total files/chunks indexed
- Document type breakdown (code_chunk, file_summary, symbol_summary)
- Enrichment status (complete, pending, not run)

### Step 3: Index with Enrichment (Recommended)

```bash
# Full index with LLM enrichment (recommended)
claudemem index --enrich

# Or index first, then enrich separately
claudemem index
claudemem enrich
```

**⚠️ Without enrichment**, you only get code_chunk results (v0.1.x behavior).
**✅ With enrichment**, you get file_summary + symbol_summary for much better semantic understanding.

---

## Phase 2: Indexing Best Practices (Updated)

### 2.1 Initial Indexing with Enrichment

```bash
# Index with enrichment (recommended for semantic search)
claudemem index --enrich

# Or index in stages
claudemem index           # Fast: AST + embeddings
claudemem enrich          # Slower: LLM enrichment
```

**What happens during enrichment:**
1. LLM analyzes each file (1 call/file)
2. Generates file_summary with purpose, exports, patterns
3. Batches symbol analysis (1 call for all symbols in file)
4. Stores enriched documents in LanceDB

### 2.2 Check Enrichment Status

```bash
claudemem status
```

Look for:
```
Document Types:
  code_chunk: 1,234
  file_summary: 567   ← Should match file count
  symbol_summary: 890 ← Functions/classes documented
Enrichment: complete  ← Ready for semantic search
```

### 2.3 Embedding Models

```bash
claudemem --models
```

**Curated Picks:**

| Model | Best For | Price | Context |
|-------|----------|-------|---------|
| `voyage/voyage-code-3` | **Best Quality** (default) | $0.180/1M | 32K |
| `qwen/qwen3-embedding-8b` | Best Balanced | $0.010/1M | 33K |
| `qwen/qwen3-embedding-0.6b` | Best Value | $0.002/1M | 33K |

**Recommendation**: Use `voyage/voyage-code-3` for best code understanding (default).

---

## Phase 3: Search Query Formulation (Updated)

### 3.1 Use Case Selection ⭐NEW

**Choose the right use case for your task:**

| Task | Use Case | Command |
|------|----------|---------|
| Developer searching | `search` (default) | `claudemem search "query"` |
| AI agent exploring | `navigation` | `claudemem search "query" --use-case navigation` |
| Code completion | `fim` | `claudemem search "query" --use-case fim` |

### 3.2 Effective Query Patterns

**Concept-Based Queries (Best for enriched search):**
```bash
claudemem search "user authentication login flow with JWT tokens"
claudemem search "database connection pooling initialization"
claudemem search "error handling middleware for HTTP requests"
```

**Why These Work Better with Enrichment:**
- Matches file_summary (file purpose, patterns)
- Matches symbol_summary (function behavior, side effects)
- Matches code_chunk (exact implementation)
- Triple-layer matching = much higher relevance

### 3.3 Query Templates by Use Case

**Architecture Discovery (use file_summary):**
```bash
claudemem search "main entry point application bootstrap" --use-case navigation
claudemem search "service layer business logic orchestration" --use-case navigation
claudemem search "repository data access pattern" --use-case navigation
```

**API Exploration (use symbol_summary):**
```bash
claudemem search "create user account function parameters" --use-case navigation
claudemem search "validate input before save" --use-case navigation
claudemem search "error response formatting" --use-case navigation
```

**Implementation Details (use code_chunk):**
```bash
claudemem search "JWT token generation implementation"
claudemem search "password hashing bcrypt"
claudemem search "database transaction commit"
```

---

## Phase 4: Integration Patterns for Agents

### 4.1 Pattern: Semantic-First Discovery

**Anti-pattern:** Sequential file reads, grep for keywords
**Best practice:** Semantic search → targeted file reads

```typescript
// WRONG: Read all files
const files = await glob("src/**/*.ts");
for (const file of files) {
  const content = await read(file);
  if (content.includes("auth")) { /* ... */ }
}

// RIGHT: Semantic search first
// 1. Check enrichment status
claudemem status  // Verify enrichment complete

// 2. Search with navigation use case
claudemem search "authentication flow user login" --use-case navigation -n 10

// 3. Only read high-scoring matches
// Results are ranked by combined code_chunk + file_summary + symbol_summary
```

### 4.2 Pattern: Document Type Selection

Match document type to your needs:

| Task | Primary Types | Why |
|------|---------------|-----|
| Architecture discovery | `file_summary` | Understands file purposes |
| API exploration | `symbol_summary` | Has params, returns, side effects |
| Code completion | `code_chunk` | Exact syntax needed |
| Understanding behavior | `symbol_summary` | LLM-analyzed purpose |
| Finding patterns | `file_summary` | Contains detected patterns |

### 4.3 Pattern: Progressive Discovery

Start broad with file_summary, narrow down to symbol_summary, then code_chunk:

```bash
# Step 1: Broad architecture search (file_summary weighted)
claudemem search "authentication" --use-case navigation -n 5

# Step 2: Specific function search (symbol_summary weighted)
claudemem search "validate JWT token function" --use-case navigation -n 10

# Step 3: Implementation details (code_chunk weighted)
claudemem search "JWT verification implementation" -n 3
```

### 4.4 Pattern: Check Enrichment Before Relying on It

```bash
# ALWAYS check status first
claudemem status

# If enrichment not complete, run it
claudemem enrich

# Then search with confidence
claudemem search "auth flow" --use-case navigation
```

---

## Phase 5: MCP Server Integration

### 5.1 Available Tools

```typescript
// Semantic search
search_code(
  query: string,
  limit?: number,        // Default: 10
  language?: string,     // Filter by language
  autoIndex?: boolean    // Auto-index changes (default: true)
)

// Index codebase
index_codebase(
  path?: string,         // Default: current directory
  force?: boolean,       // Force re-index
  model?: string         // Override embedding model
)

// Get status
get_status(path?: string)

// Clear index
clear_index(path?: string)

// List models
list_embedding_models(freeOnly?: boolean)
```

### 5.2 MCP Configuration

Add to `.mcp.json`:
```json
{
  "mcpServers": {
    "claudemem": {
      "command": "claudemem",
      "args": ["--mcp"]
    }
  }
}
```

---

## Phase 6: Score Interpretation

### Understanding Search Scores

| Score | Meaning | Action |
|-------|---------|--------|
| > 0.85 | Strong match | Use directly |
| 0.70-0.85 | Good match | Review briefly |
| 0.50-0.70 | Partial match | Verify manually |
| < 0.50 | Weak match | Refine query |

**With enrichment**, scores are generally higher because:
- file_summary matches purpose/intent
- symbol_summary matches behavior description
- code_chunk matches implementation

---

## Phase 7: Troubleshooting

### Problem: No enriched results

```bash
# Check enrichment status
claudemem status

# Look for:
# Enrichment: not run OR incomplete

# Run enrichment if needed
claudemem enrich
```

### Problem: Slow enrichment

```bash
# Reduce concurrency
claudemem enrich --concurrency 3

# Or enrich specific directories
claudemem enrich ./src/core
claudemem enrich ./src/services
```

### Problem: Low search scores

- Use more descriptive queries
- Check if files are indexed AND enriched: `claudemem status`
- Try `--use-case navigation` for agent tasks
- Use language filter: `-l typescript`

### Problem: Missing file_summary or symbol_summary

```bash
# Check document type counts
claudemem status

# If file_summary count is 0, enrichment hasn't run
claudemem enrich

# Force re-enrichment
claudemem index -f --enrich
```

---

## Quality Checklist (Updated for v0.2.0)

Before completing a claudemem workflow, ensure:

- [ ] claudemem CLI is installed (v0.2.0+)
- [ ] OpenRouter API key is configured
- [ ] Codebase is indexed (check with `claudemem status`)
- [ ] **Enrichment is complete** (file_summary + symbol_summary counts > 0) ⭐NEW
- [ ] Search queries use natural language concepts
- [ ] Using appropriate use case (`--use-case navigation` for agents) ⭐NEW
- [ ] Results are relevant and actionable
- [ ] File locations are documented for follow-up

---

## 🔴 ANTI-PATTERNS (DO NOT DO)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           COMMON MISTAKES TO AVOID                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ❌ Reading 5+ files sequentially when investigating a feature              ║
║     → WHY WRONG: Token waste, no ranking, no context                        ║
║     → DO INSTEAD: claudemem search "feature concept" --use-case navigation  ║
║                                                                              ║
║  ❌ Using Glob to find all files, then reading them one-by-one              ║
║     → WHY WRONG: Gets ALL files, not RELEVANT files                         ║
║     → DO INSTEAD: claudemem search "what you're looking for"                ║
║                                                                              ║
║  ❌ Using Grep for architectural questions like "how does X work"           ║
║     → WHY WRONG: Text match ≠ semantic understanding                        ║
║     → DO INSTEAD: claudemem search "X functionality flow" --use-case nav    ║
║                                                                              ║
║  ❌ Searching without checking enrichment status                            ║
║     → WHY WRONG: Missing file_summary and symbol_summary matches            ║
║     → DO INSTEAD: claudemem status first, enrich if needed                  ║
║                                                                              ║
║  ❌ Using default search mode for agent exploration                         ║
║     → WHY WRONG: Default weights optimized for humans, not agents           ║
║     → DO INSTEAD: --use-case navigation for agent tasks                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Anti-Pattern vs Correct Pattern

| Anti-Pattern | Why It's Wrong | Correct Pattern |
|--------------|----------------|-----------------|
| `claudemem search "auth"` (no enrichment) | Missing LLM summaries | `claudemem status` → `enrich` → search |
| `claudemem search "auth flow"` (agent) | Wrong use case | `claudemem search "auth flow" --use-case navigation` |
| `Read auth/login.ts` then `Read auth/session.ts`... | No ranking, token waste | `claudemem search "auth login session"` |
| `grep -r "auth" src/` | No semantic understanding | `claudemem search "authentication flow"` |
| Assume enrichment is done | May miss summaries | Check `claudemem status` first |

### The Correct Workflow (v0.2.0)

```
┌─────────────────────────────────────────────────────────────────┐
│               CORRECT INVESTIGATION FLOW (v0.2.0)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. claudemem status        → Check index AND enrichment        │
│  2. claudemem enrich        → Run if enrichment incomplete      │
│  3. claudemem search "..."  → Use --use-case navigation         │
│     --use-case navigation                                        │
│  4. Review results          → See ranked file/symbol/code       │
│  5. Read specific lines     → ONLY from search results          │
│                                                                  │
│  ⚠️ NEVER: Start with Read/Glob for semantic questions          │
│  ⚠️ NEVER: Search without verifying enrichment                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notes

- Requires OpenRouter API key (https://openrouter.ai) - all embedding models are paid
- **NEW:** Enrichment requires additional LLM calls (1 per file + 1 batch per file for symbols)
- Default model: `voyage/voyage-code-3` (best code understanding, $0.180/1M tokens)
- Run `claudemem --models` to see all available models and choose based on budget/quality
- All data stored locally in `.claudemem/` directory (no cloud storage)
- Tree-sitter provides excellent parsing for TypeScript, Go, Python, Rust
- Hybrid search combines keyword (BM25) + semantic (embeddings)
- Can run as MCP server with `--mcp` flag
- Initial indexing takes ~1-2 minutes for typical projects
- **NEW:** Enrichment adds ~5-10 minutes depending on codebase size
- Automatic change detection re-indexes modified files on search
- **NEW:** Use `--use-case navigation` for AI agent exploration

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Plugin:** code-analysis v2.4.0
**Last Updated:** December 2025
