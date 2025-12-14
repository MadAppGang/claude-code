---
name: ultrathink-detective
description: "⚡ PRIMARY TOOL for: 'comprehensive audit', 'deep analysis', 'full codebase review', 'multi-perspective investigation', 'complex questions'. Combines ALL detective perspectives (architect+developer+tester+debugger). Uses Opus model. REPLACES grep/glob entirely. Uses claudemem v0.2.0 INDEXED MEMORY with LLM enrichment. GREP/FIND/GLOB ARE FORBIDDEN."
allowed-tools: Bash, Task, Read, AskUserQuestion
model: opus
---

# ⛔⛔⛔ CRITICAL: INDEXED MEMORY v0.2.0 ONLY ⛔⛔⛔

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🧠 THIS SKILL USES INDEXED MEMORY (claudemem v0.2.0) EXCLUSIVELY           ║
║                                                                              ║
║   ❌ GREP IS FORBIDDEN                                                       ║
║   ❌ FIND IS FORBIDDEN                                                       ║
║   ❌ GLOB IS FORBIDDEN                                                       ║
║   ❌ rg/ripgrep IS FORBIDDEN                                                 ║
║   ❌ git grep IS FORBIDDEN                                                   ║
║   ❌ Grep tool IS FORBIDDEN                                                  ║
║   ❌ Glob tool IS FORBIDDEN                                                  ║
║                                                                              ║
║   ✅ claudemem search "query" --use-case navigation IS THE ONLY WAY         ║
║                                                                              ║
║   ⭐ v0.2.0: Full 3-layer architecture with LLM enrichment                  ║
║      - file_summary for ARCHITECTURE discovery                               ║
║      - symbol_summary for IMPLEMENTATION & BEHAVIOR                          ║
║      - code_chunk for EXACT SYNTAX                                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

# Ultrathink Detective Skill

**Version:** 2.0.0
**Role:** Senior Principal Engineer / Tech Lead
**Purpose:** Deep multi-dimensional codebase investigation using INDEXED MEMORY with LLM enrichment

## Why Indexed Memory with Enrichment is Non-Negotiable

| grep/find (FORBIDDEN) | claudemem v0.1.x | claudemem v0.2.0 (REQUIRED) |
|----------------------|------------------|------------------------------|
| Text matching only | Vector similarity | Vector + LLM UNDERSTANDING |
| 500 unranked results | Top 10 ranked | Top 10 with file/symbol CONTEXT |
| Misses synonyms | Finds similar | Understands PURPOSE and BEHAVIOR |
| No pattern recognition | Finds some patterns | Detects ARCHITECTURAL patterns |
| No behavior awareness | Code only | file_summary + symbol_summary |

**v0.2.0 enrichment gives you SEMANTIC UNDERSTANDING of what each file and function DOES.**

---

## 🧠 CLAUDEMEM v0.2.0: The 3-Layer Semantic Memory System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               INDEXED MEMORY ARCHITECTURE (v0.2.0 ENRICHED)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SEARCH LAYER                                                               │
│  └── Query → Embed → Vector Search + BM25 → Ranked Results                 │
│      └── Matches 3 document types with weighted scores                     │
│                                                                             │
│  ENRICHMENT LAYER (LLM) ⭐NEW                                              │
│  └── file_summary: File PURPOSE, exports, patterns (1 call/file)           │
│  └── symbol_summary: Function BEHAVIOR, params, side effects (batched)     │
│                                                                             │
│  INDEX LAYER                                                                │
│  └── Tree-sitter AST → Semantic Chunks → Vector Embeddings → LanceDB       │
│  └── code_chunk: Raw functions, classes, methods                           │
│                                                                             │
│  SEARCH MATCHES BOTH RAW CODE AND LLM SUMMARIES                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Document Types for Comprehensive Analysis

| Document Type | Source | Best For | Ultrathink Use |
|---------------|--------|----------|----------------|
| `file_summary` | LLM analysis | Architecture, file roles | Dimension 1: Structure |
| `symbol_summary` | LLM analysis | Behavior, side effects | Dimensions 2-4: Behavior, Quality, Reliability |
| `code_chunk` | Tree-sitter | Exact implementation | All dimensions for evidence |

### Navigation Mode (Agent-Optimized)

**ALWAYS use `--use-case navigation`** which prioritizes:
- symbol_summary: 35% (behavior understanding)
- file_summary: 30% (architecture context)
- code_chunk: 20% (implementation details)

---

## PHASE 0: MANDATORY SETUP (CANNOT BE SKIPPED)

### Step 1: Verify claudemem v0.2.0
```bash
# Check version (must be 0.2.0+)
which claudemem && claudemem --version
```

### Step 2: If Not Installed → STOP

**DO NOT FALL BACK TO GREP.** Use AskUserQuestion:

```typescript
AskUserQuestion({
  questions: [{
    question: "claudemem v0.2.0 (indexed memory with LLM enrichment) is required for comprehensive analysis. Grep/find are NOT acceptable alternatives. How would you like to proceed?",
    header: "Required",
    multiSelect: false,
    options: [
      { label: "Install via npm (Recommended)", description: "Run: npm install -g claude-codemem" },
      { label: "Install via Homebrew", description: "Run: brew tap MadAppGang/claude-mem && brew install --cask claudemem (macOS)" },
      { label: "Cancel and install manually", description: "Stop here - I'll install it myself" }
    ]
  }]
})
```

### Step 3: Check Status AND Enrichment ⭐CRITICAL

```bash
claudemem status
```

**Look for:**
```
Document Types:
  code_chunk: 1,234      ← Basic index
  file_summary: 567      ← LLM enrichment (REQUIRED)
  symbol_summary: 890    ← LLM enrichment (REQUIRED)
Enrichment: complete
```

### Step 4: Index with Enrichment if Needed

```bash
# If file_summary = 0, run enrichment
claudemem index --enrich

# Or enrich existing index
claudemem enrich
```

**Ultrathink analysis requires ALL THREE document types for comprehensive understanding.**

---

## Role Context

You are investigating as a **Senior Principal Engineer**. Your analysis is:
- **Holistic** - All perspectives (architecture, implementation, testing, debugging)
- **Deep** - Beyond surface-level to root patterns using symbol_summary
- **Strategic** - Long-term implications from file_summary patterns
- **Evidence-based** - Every conclusion backed by code from claudemem
- **Actionable** - Clear recommendations with priorities

## When to Use Ultrathink

- Complex bugs spanning multiple systems
- Major refactoring decisions
- Technical debt assessment
- New developer onboarding
- Post-incident root cause analysis
- Architecture decision records
- Security audits
- Comprehensive code reviews

---

## Multi-Dimensional Analysis Framework (v0.2.0)

### Dimension 1: Architecture (file_summary driven)
```bash
# Layer identification (file_summary shows file purpose)
claudemem search "controller handler endpoint API presentation layer" --use-case navigation
claudemem search "service business logic domain layer orchestration" --use-case navigation
claudemem search "repository database data access persistence layer" --use-case navigation

# Pattern detection (file_summary shows patterns)
claudemem search "factory pattern create instantiation builder" --use-case navigation
claudemem search "dependency injection container provider" --use-case navigation
claudemem search "event driven publish subscribe observer pattern" --use-case navigation
```

### Dimension 2: Implementation (symbol_summary driven)
```bash
# Data flow (symbol_summary shows params/returns)
claudemem search "transform map convert data flow processing" --use-case navigation
claudemem search "validate input sanitize check guard" --use-case navigation
claudemem search "persist save store database insert update" --use-case navigation

# Side effects (symbol_summary lists these explicitly)
claudemem search "external API call network request fetch" --use-case navigation
claudemem search "file system read write storage" --use-case navigation
claudemem search "emit event notification message publish" --use-case navigation
```

### Dimension 3: Quality (symbol_summary shows test purpose)
```bash
# Test coverage (symbol_summary shows what tests verify)
claudemem search "describe it test spec should verify" --use-case navigation
claudemem search "mock stub fake spy vi.mock jest.mock" --use-case navigation
claudemem search "assert expect toBe toEqual toThrow" --use-case navigation

# Test gaps (compare implementation vs test symbol_summary)
claudemem search "error throw exception handler" -n 15 --use-case navigation
claudemem search "edge case boundary null undefined empty" --use-case navigation
```

### Dimension 4: Reliability (symbol_summary shows error paths)
```bash
# Error handling patterns (symbol_summary shows error behavior)
claudemem search "try catch finally error handling recovery" --use-case navigation
claudemem search "throw new Error custom exception class" --use-case navigation
claudemem search "error response status code message format" --use-case navigation

# Failure modes (symbol_summary shows failure side effects)
claudemem search "timeout retry backoff failure circuit breaker" --use-case navigation
claudemem search "fallback default graceful degradation" --use-case navigation
```

### Dimension 5: Security (file_summary + symbol_summary)
```bash
# Authentication/Authorization (file_summary shows auth patterns)
claudemem search "authentication token JWT session middleware" --use-case navigation
claudemem search "authorization permission role check guard" --use-case navigation

# Input validation (symbol_summary shows validation)
claudemem search "sanitize escape validate input XSS prevention" --use-case navigation
claudemem search "SQL injection prepared statement parameterized" --use-case navigation
```

### Dimension 6: Performance (symbol_summary shows side effects)
```bash
# N+1 queries (symbol_summary shows database calls)
claudemem search "loop database query fetch each N+1" --use-case navigation

# Caching (file_summary shows caching patterns)
claudemem search "cache memoize store reuse Redis" --use-case navigation

# Async patterns (symbol_summary shows async side effects)
claudemem search "Promise.all parallel concurrent batch async" --use-case navigation
```

---

## Comprehensive Analysis Workflow (v0.2.0)

### Phase 1: Initialize with Enrichment (5 min)
```bash
# Verify setup AND enrichment
which claudemem && claudemem status

# Ensure enriched (file_summary + symbol_summary > 0)
# If not, run:
claudemem index --enrich
```

### Phase 2: Architecture Mapping (10 min)
```bash
# Entry points (file_summary shows file purpose)
claudemem search "main entry bootstrap application startup" -n 5 --use-case navigation

# Module structure (file_summary shows exports)
claudemem search "module export public interface boundary" -n 20 --use-case navigation

# Layer identification
claudemem search "controller service repository pattern layer" -n 20 --use-case navigation

# Design patterns (file_summary shows patterns)
claudemem search "factory strategy decorator middleware pattern" -n 15 --use-case navigation
```

### Phase 3: Critical Path Analysis (15 min)
```bash
# Payment flow (symbol_summary shows side effects)
claudemem search "payment transaction order checkout process" -n 15 --use-case navigation

# Authentication (file_summary + symbol_summary)
claudemem search "authentication login session security token" -n 15 --use-case navigation

# User data (symbol_summary shows data operations)
claudemem search "user data personal information PII" -n 15 --use-case navigation
```

### Phase 4: Quality Assessment (10 min)
```bash
# Test coverage (symbol_summary shows what tests verify)
claudemem search "describe test spec verify assert" -n 20 --use-case navigation

# Error handling (symbol_summary shows error behavior)
claudemem search "try catch error handling exception" -n 20 --use-case navigation

# Type safety
claudemem search "type interface any unknown strict" -n 15 --use-case navigation
```

### Phase 5: Risk Identification (10 min)
```bash
# Security (symbol_summary shows sensitive operations)
claudemem search "password hash salt bcrypt" -n 5 --use-case navigation
claudemem search "SQL query database parameterized" -n 10 --use-case navigation
claudemem search "user input form data validation" -n 10 --use-case navigation
```

### Phase 6: Technical Debt Inventory (10 min)
```bash
# TODOs and FIXMEs
claudemem search "TODO FIXME HACK workaround technical debt" -n 30 --use-case navigation

# Code smells (file_summary shows file complexity)
claudemem search "god class large file monolithic" -n 10 --use-case navigation
claudemem search "duplicate code copy paste DRY" -n 10 --use-case navigation
claudemem search "deprecated old legacy outdated" -n 10 --use-case navigation
```

---

## Output Format: Comprehensive Report (v0.2.0)

### Executive Summary
```
┌─────────────────────────────────────────────────────────────────┐
│           CODEBASE COMPREHENSIVE ANALYSIS (v0.2.0)               │
├─────────────────────────────────────────────────────────────────┤
│  Overall Health: 🟡 MODERATE (7.2/10)                           │
│  Search Method: claudemem v0.2.0 (enriched)                     │
│  Enrichment: ✅ file_summary + symbol_summary available        │
│                                                                  │
│  Dimensions:                                                     │
│  ├── Architecture:    🟢 GOOD      (8/10) [file_summary driven]│
│  ├── Implementation:  🟡 MODERATE  (7/10) [symbol_summary driven]│
│  ├── Testing:         🔴 POOR      (5/10) [test symbol_summary] │
│  ├── Reliability:     🟢 GOOD      (8/10) [error side_effects] │
│  ├── Security:        🟡 MODERATE  (7/10) [auth patterns]      │
│  └── Performance:     🟢 GOOD      (8/10) [async side_effects] │
│                                                                  │
│  Critical: 3 | Major: 7 | Minor: 15                             │
└─────────────────────────────────────────────────────────────────┘
```

### Dimension Details (with enrichment context)

#### Architecture (from file_summary)
```
Layers Identified:
├── Presentation: src/controllers/ (12 files)
│   └── file_summary: "HTTP request handling, routing"
├── Business: src/services/ (18 files)
│   └── file_summary: "Business logic orchestration"
├── Data: src/repositories/ (8 files)
│   └── file_summary: "Database access, persistence"
└── Domain: src/entities/ (15 files)
    └── file_summary: "Core domain models"

Patterns Detected (from file_summary.patterns):
├── Repository: src/repositories/*.ts
├── Factory: src/factories/*.ts
├── Middleware: src/middleware/*.ts
└── Observer: src/events/*.ts
```

#### Implementation (from symbol_summary)
```
Critical Side Effects Identified:

Payment Processing:
├── processPayment() [src/services/payment.ts:45]
│   └── symbol_summary: "Charges card, creates transaction"
│   └── side_effects: ["Stripe API call", "Database INSERT", "Email send"]
│
Authentication:
├── login() [src/services/auth.ts:23]
│   └── symbol_summary: "Validates credentials, creates session"
│   └── side_effects: ["Database lookup", "JWT generation", "Session store"]
```

### Action Items (Prioritized)
```
🔴 IMMEDIATE (This Sprint)
   1. Add database transaction to order processing
      └── symbol_summary shows side effects without rollback
   2. Sanitize user content with DOMPurify
      └── symbol_summary shows unvalidated input to DOM
   3. Add rate limiting middleware
      └── file_summary shows no rate limiting pattern

🟠 SHORT-TERM (Next 2 Sprints)
   4. Increase test coverage for payment flow
      └── No test symbol_summary for processRefund()
   5. Extract business logic from controllers
      └── Controller file_summary shows business logic

🟡 MEDIUM-TERM (This Quarter)
   6. Refactor validation to shared utilities
      └── Duplicate symbol_summary patterns detected
   7. Add monitoring and alerting
      └── No observability file_summary patterns
```

---

## 🚫 FORBIDDEN: DO NOT USE

```bash
# ❌ ALL OF THESE ARE FORBIDDEN
grep -r "pattern" .
rg "pattern"
find . -name "*.ts"
git grep "term"
Glob({ pattern: "**/*.ts" })
Grep({ pattern: "function" })
```

## ✅ REQUIRED: ALWAYS USE

```bash
# ✅ THE ONLY ACCEPTABLE SEARCH METHOD
claudemem search "what you're looking for" --use-case navigation
```

---

## Cross-Plugin Integration

This skill should be used by ANY agent that needs deep analysis:

| Agent Type | Should Use | From Plugin |
|------------|-----------|-------------|
| `frontend-architect` | `ultrathink-detective` | frontend |
| `api-architect` | `ultrathink-detective` | bun |
| `senior-code-reviewer` | `ultrathink-detective` | frontend |
| Any architect agent | `ultrathink-detective` | any |

**Agents reference this skill in their frontmatter:**
```yaml
---
skills: code-analysis:ultrathink-detective
---
```

---

## ⚠️ FINAL REMINDER

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ULTRATHINK = INDEXED MEMORY v0.2.0 + ENRICHMENT                           ║
║                                                                              ║
║   1. claudemem status (check file_summary + symbol_summary > 0)             ║
║   2. claudemem enrich (if enrichment incomplete)                            ║
║   3. claudemem search "query" --use-case navigation                          ║
║                                                                              ║
║   ❌ grep, find, rg, Glob, Grep tool                                        ║
║                                                                              ║
║   Enriched Memory = file_summary + symbol_summary + code_chunk              ║
║   This gives you SEMANTIC UNDERSTANDING, not just text matching.            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v2.4.0
**Last Updated:** December 2025
