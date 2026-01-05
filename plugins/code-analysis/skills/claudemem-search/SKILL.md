---
name: claudemem-search
description: "⚡ PRIMARY TOOL for semantic code search AND structural analysis. NEW: AST tree navigation with map, symbol, callers, callees, context commands. PageRank ranking. ANTI-PATTERNS: Reading files without mapping, Grep for 'how does X work', Modifying without caller analysis."
allowed-tools: Bash, Task, AskUserQuestion
---

# Claudemem Semantic Code Search Expert (v0.6.0)

This Skill provides comprehensive guidance on leveraging **claudemem** v0.7.0+ with **AST-based structural analysis**, **code analysis commands**, and **framework documentation** for intelligent codebase understanding.

## What's New in v0.3.0

```
┌─────────────────────────────────────────────────────────────────┐
│                  CLAUDEMEM v0.3.0 ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 AST STRUCTURAL LAYER ⭐NEW                  │  │
│  │  Tree-sitter Parse → Symbol Graph → PageRank Ranking       │  │
│  │  map | symbol | callers | callees | context                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    SEARCH LAYER                             │  │
│  │  Query → Embed → Vector Search + BM25 → Ranked Results     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     INDEX LAYER                             │  │
│  │  AST Parse → Chunk → Embed → LanceDB + Symbol Graph        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Innovation: Structural Understanding

v0.3.0 adds **AST tree navigation** with symbol graph analysis:
- **PageRank ranking** - Symbols ranked by importance (how connected they are)
- **Call graph analysis** - Track callers/callees for impact assessment
- **Structural overview** - Map the codebase before reading code

---

## Quick Reference

```bash
# For agentic use, always use --agent flag for clean output
claudemem --agent <command>

# Core commands for agents
claudemem --agent map [query]              # Get structural overview (repo map)
claudemem --agent symbol <name>            # Find symbol definition
claudemem --agent callers <name>           # What calls this symbol?
claudemem --agent callees <name>           # What does this symbol call?
claudemem --agent context <name>           # Full context (symbol + dependencies)
claudemem --agent search <query>           # Semantic search (clean output)
claudemem --agent search <query> --map     # Search + include repo map context
```

---

## Version Compatibility

Claudemem has evolved significantly. **Check your version** before using commands:

```bash
claudemem --version
```

### Command Availability by Version

| Command | Minimum Version | Status | Purpose |
|---------|-----------------|--------|---------|
| `map` | v0.3.0 | ✅ Available | Architecture overview with PageRank |
| `symbol` | v0.3.0 | ✅ Available | Find exact file:line location |
| `callers` | v0.3.0 | ✅ Available | What calls this symbol? |
| `callees` | v0.3.0 | ✅ Available | What does this symbol call? |
| `context` | v0.3.0 | ✅ Available | Full call chain (callers + callees) |
| `search` | v0.3.0 | ✅ Available | Semantic vector search |
| `dead-code` | v0.4.0+ | ⚠️ Check version | Find unused symbols |
| `test-gaps` | v0.4.0+ | ⚠️ Check version | Find high-importance untested code |
| `impact` | v0.4.0+ | ⚠️ Check version | BFS transitive caller analysis |
| `docs` | v0.7.0+ | ✅ Available | Framework documentation fetching |

### Version Detection in Scripts

```bash
# Get version number
VERSION=$(claudemem --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)

# Check if v0.4.0+ features available
if [ -n "$VERSION" ] && printf '%s\n' "0.4.0" "$VERSION" | sort -V -C; then
  # v0.4.0+ available
  claudemem --agent dead-code  claudemem --agent test-gaps  claudemem --agent impact SymbolNameelse
  echo "Code analysis commands require claudemem v0.4.0+"
  echo "Current version: $VERSION"
  echo "Fallback to v0.3.0 commands (map, symbol, callers, callees)"
fi
```

### Graceful Degradation

When using v0.4.0+ commands, always provide fallback:

```bash
# Try impact analysis (v0.4.0+), fallback to callers (v0.3.0)
IMPACT=$(claudemem --agent impact SymbolName  2>/dev/null)
if [ -n "$IMPACT" ] && [ "$IMPACT" != "command not found" ]; then
  echo "$IMPACT"
else
  echo "Using fallback (direct callers only):"
  claudemem --agent callers SymbolNamefi
```

**Why This Matters:**
- v0.3.0 commands work for 90% of use cases (navigation, modification)
- v0.4.0+ commands are specialized (code analysis, cleanup planning)
- Scripts should work across versions with appropriate fallbacks

---

## The Correct Workflow ⭐CRITICAL

### Phase 1: Understand Structure First (ALWAYS DO THIS)

Before reading any code files, get the structural overview:

```bash
# For a specific task, get focused repo map
claudemem --agent map "authentication flow"
# Output shows relevant symbols ranked by importance (PageRank):
# file: src/auth/AuthService.ts
# line: 15-89
# kind: class
# name: AuthService
# pagerank: 0.0921
# signature: class AuthService
# ---
# file: src/middleware/auth.ts
# ...
```

This tells you:
- Which files contain relevant code
- Which symbols are most important (high PageRank = heavily used)
- The structure before you read actual code

### Phase 2: Locate Specific Symbols

Once you know what to look for:

```bash
# Find exact location of a symbol
claudemem --agent symbol AuthService
# Output:
# file: src/auth/AuthService.ts
# line: 15-89
# kind: class
# name: AuthService
# signature: class AuthService implements IAuthProvider
# exported: true
# pagerank: 0.0921
# docstring: Handles user authentication and session management
```

### Phase 3: Understand Dependencies

Before modifying code, understand what depends on it:

```bash
# What calls AuthService? (impact of changes)
claudemem --agent callers AuthService
# Output:
# caller: LoginController.authenticate
# file: src/controllers/login.ts
# line: 34
# kind: call
# ---
# caller: SessionMiddleware.validate
# file: src/middleware/session.ts
# line: 12
# kind: call
```

```bash
# What does AuthService call? (its dependencies)
claudemem --agent callees AuthService
# Output:
# callee: Database.query
# file: src/db/database.ts
# line: 45
# kind: call
# ---
# callee: TokenManager.generate
# file: src/auth/tokens.ts
# line: 23
# kind: call
```

### Phase 4: Get Full Context

For complex modifications, get everything at once:

```bash
claudemem --agent context AuthService
# Output includes:
# [symbol]
# file: src/auth/AuthService.ts
# line: 15-89
# kind: class
# name: AuthService
# ...
# [callers]
# caller: LoginController.authenticate
# ...
# [callees]
# callee: Database.query
# ...
```

### Phase 5: Search for Code (Only If Needed)

When you need actual code snippets:

```bash
# Semantic search
claudemem --agent search "password hashing"
# Search with repo map context (recommended for complex tasks)
claudemem --agent search "password hashing" --map```

---

## Output Format

When using `--agent` flag, commands output machine-readable format:

```
# Raw output format (line-based, easy to parse)
file: src/core/indexer.ts
line: 45-120
kind: class
name: Indexer
signature: class Indexer
pagerank: 0.0842
exported: true
---
file: src/core/store.ts
line: 12-89
kind: class
name: VectorStore
...
```

Records are separated by `---`. Each field is `key: value` on its own line.

---

## Command Reference

### claudemem map [query]

Get structural overview of the codebase. Optionally focused on a query.

```bash
# Full repo map (top symbols by PageRank)
claudemem --agent map
# Focused on specific task
claudemem --agent map "authentication"
# Limit tokens
claudemem --agent map "auth" --tokens 500```

**Output fields**: file, line, kind, name, signature, pagerank, exported

**When to use**: Always first - understand structure before reading code

### claudemem symbol <name>

Find a symbol by name. Disambiguates using PageRank and export status.

```bash
claudemem --agent symbol Indexerclaudemem --agent symbol "search" --file retriever   # hint which file
```

**Output fields**: file, line, kind, name, signature, pagerank, exported, docstring

**When to use**: When you know the symbol name and need exact location

### claudemem callers <name>

Find all symbols that call/reference the given symbol.

```bash
claudemem --agent callers AuthService```

**Output fields**: caller (name), file, line, kind (call/import/extends/etc)

**When to use**: Before modifying anything - know the impact radius

### claudemem callees <name>

Find all symbols that the given symbol calls/references.

```bash
claudemem --agent callees AuthService```

**Output fields**: callee (name), file, line, kind

**When to use**: To understand dependencies and trace data flow

### claudemem context <name>

Get full context: the symbol plus its callers and callees.

```bash
claudemem --agent context Indexerclaudemem --agent context Indexer --callers 10 --callees 20```

**Output sections**: [symbol], [callers], [callees]

**When to use**: For complex modifications requiring full awareness

### claudemem search <query>

Semantic search across the codebase.

```bash
claudemem --agent search "error handling"claudemem --agent search "error handling" --map   # include repo map
claudemem --agent search "auth" -n 5   # limit results
```

**Output fields**: file, line, kind, name, score, content (truncated)

**When to use**: When you need actual code snippets (after mapping)

---

## Code Analysis Commands (v0.4.0+ Required)

### claudemem dead-code

Find unused symbols in the codebase.

```bash
# Find all unused symbols
claudemem --agent dead-code
# Stricter threshold (only very low PageRank)
claudemem --agent dead-code --max-pagerank 0.005
# Include exported symbols (usually excluded)
claudemem --agent dead-code --include-exported```

**Algorithm:**
- Zero callers (nothing references the symbol)
- Low PageRank (< 0.001 default)
- Not exported (by default, exports may be used externally)

**Output fields**: file, line, kind, name, pagerank, last_caller_removed

**When to use**: Architecture cleanup, tech debt assessment, before major refactoring

**Empty Result Handling:**
```bash
RESULT=$(claudemem --agent dead-code )
if [ -z "$RESULT" ] || [ "$RESULT" = "No dead code found" ]; then
  echo "Codebase is clean - no dead code detected!"
  echo "This indicates good code hygiene."
else
  echo "$RESULT"
fi
```

**Static Analysis Limitations:**
- Dynamic imports (`import()`) may hide real callers
- Reflection-based access not captured
- External callers (other repos, CLI usage) not visible
- Exported symbols excluded by default for this reason

### claudemem test-gaps

Find high-importance code without test coverage.

```bash
# Find all test coverage gaps
claudemem --agent test-gaps
# Only critical gaps (high PageRank)
claudemem --agent test-gaps --min-pagerank 0.05```

**Algorithm:**
- High PageRank (> 0.01 default) - Important code
- Zero callers from test files (*.test.ts, *.spec.ts, *_test.go)

**Output fields**: file, line, kind, name, pagerank, production_callers, test_callers

**When to use**: Test coverage analysis, QA planning, identifying critical gaps

**Empty Result Handling:**
```bash
RESULT=$(claudemem --agent test-gaps )
if [ -z "$RESULT" ] || [ "$RESULT" = "No test gaps found" ]; then
  echo "Excellent! All high-importance code has test coverage."
  echo "Consider lowering --min-pagerank threshold for additional coverage."
else
  echo "$RESULT"
fi
```

**Static Analysis Limitations:**
- Test file detection based on naming patterns only
- Integration tests calling code indirectly may not be detected
- Mocked dependencies may show false positives

### claudemem impact <symbol>

Analyze the impact of changing a symbol using BFS traversal.

```bash
# Get all transitive callers
claudemem --agent impact UserService
# Limit depth for large codebases
claudemem --agent impact UserService --max-depth 5```

**Algorithm:**
- BFS traversal from symbol to all transitive callers
- Groups results by depth level
- Shows file:line for each caller

**Output sections**: direct_callers, transitive_callers (with depth), grouped_by_file

**When to use**: Before ANY modification, refactoring planning, risk assessment

**Empty Result Handling:**
```bash
RESULT=$(claudemem --agent impact FunctionName )
if [ -z "$RESULT" ] || echo "$RESULT" | grep -q "No callers found"; then
  echo "No callers found - this symbol appears unused or is an entry point."
  echo "If unused, consider running: claudemem --agent dead-code "
  echo "If entry point (API handler, main), this is expected."
else
  echo "$RESULT"
fi
```

**Static Analysis Limitations:**
- Callback/event-based calls may not be detected
- Dependency injection containers hide static call relationships
- External service callers not visible

---

## LLM Enrichment Document Types (v0.2.0+)

Claudemem v0.2.0+ supports **LLM-enriched semantic search** with specialized document types.

### Document Types

| Type | Purpose | Generated By |
|------|---------|--------------|
| `symbol_summary` | Function behavior, params, returns, side effects | LLM analysis |
| `file_summary` | File purpose, exports, architectural patterns | LLM analysis |
| `idiom` | Common patterns in codebase | Pattern detection |
| `usage_example` | How to use APIs | Documentation extraction |
| `anti_pattern` | What NOT to do | Static analysis + LLM |
| `project_doc` | Project-level documentation | README, CLAUDE.md |

### Navigation Mode

For agent-optimized search with document type weighting:

```bash
# Navigation-focused search (prioritizes summaries)
claudemem --agent search "authentication" --use-case navigation
# Default search (balanced)
claudemem --agent search "authentication"```

**Navigation mode search weights:**
- `symbol_summary`: 1.5x (higher priority)
- `file_summary`: 1.3x (higher priority)
- `code_chunk`: 1.0x (normal)
- `idiom`: 1.2x (higher for pattern discovery)

### Symbol Summary Fields

```yaml
symbol: AuthService.authenticate
file: src/services/auth.ts
line: 45-89
behavior: "Validates user credentials and generates JWT token"
params:
  - name: credentials
    type: LoginCredentials
    description: "Email and password from login form"
returns:
  type: AuthResult
  description: "JWT token and user profile on success, error on failure"
side_effects:
  - "Updates user.lastLogin timestamp"
  - "Logs authentication attempt"
  - "May trigger rate limiting"
```

### File Summary Fields

```yaml
file: src/services/auth.ts
purpose: "Core authentication service handling login, logout, and session management"
exports:
  - AuthService (class)
  - authenticate (function)
  - validateToken (function)
patterns:
  - "Dependency Injection (constructor takes IUserRepository)"
  - "Factory Pattern (createSession)"
  - "Strategy Pattern (IAuthProvider interface)"
dependencies:
  - bcrypt (password hashing)
  - jsonwebtoken (JWT generation)
  - UserRepository (user data access)
```

### Using Document Types in Investigation

```bash
# Find function behavior without reading code
claudemem --agent search "processPayment behavior" --use-case navigation
# Output includes symbol_summary:
# symbol: PaymentService.processPayment
# behavior: "Charges customer card via Stripe and saves transaction"
# side_effects: ["Updates balance", "Sends receipt email", "Logs to audit"]

# Find file purposes for architecture understanding
claudemem --agent search "file:services purpose" --use-case navigation
# Find anti-patterns to avoid
claudemem --agent search "anti_pattern SQL"```

### Regenerating Enrichments

If codebase changes significantly:

```bash
# Re-index with LLM enrichment
claudemem index --enrich

# Or enrich specific files
claudemem enrich src/services/payment.ts
```

---

## Workflow Templates

Standardized investigation patterns for common scenarios. All templates include error handling for empty results and version compatibility checks.

### Template 1: Bug Investigation

**Trigger:** "Why is X broken?", "Find bug", "Root cause"

```bash
# Step 1: Locate the symptom
SYMBOL=$(claudemem --agent symbol FunctionFromStackTrace )
if [ -z "$SYMBOL" ]; then
  echo "Symbol not found - check spelling or run: claudemem --agent map 'related keywords' "
  exit 1
fi

# Step 2: Get full context (callers + callees)
claudemem --agent context FunctionFromStackTrace
# Step 3: Trace backwards to find root cause
claudemem --agent callers suspectedSource
# Step 4: Check full impact of the bug (v0.4.0+)
IMPACT=$(claudemem --agent impact BuggyFunction  2>/dev/null)
if [ -n "$IMPACT" ]; then
  echo "$IMPACT"
else
  echo "Impact analysis requires claudemem v0.4.0+ or no callers found"
  echo "Fallback: claudemem --agent callers BuggyFunction "
fi

# Step 5: Read identified file:line ranges
# Fix bug, verify callers still work

# Step 6: Document impacted code for testing
```

**Output Template:**

```markdown
## Bug Investigation Report

**Symptom:** [Description]
**Root Cause:** [Location and explanation]
**Call Chain:** [How we got here]
**Impact Radius:** [What else is affected]
**Fix Applied:** [What was changed]
**Verification:** [Tests run, callers checked]
```

### Template 2: New Feature Implementation

**Trigger:** "Add feature", "Implement X", "Extend functionality"

```bash
# Step 1: Map the feature area
MAP=$(claudemem --agent map "feature area keywords" )
if [ -z "$MAP" ]; then
  echo "No matches found - try broader keywords"
fi

# Step 2: Identify extension points
claudemem --agent callees ExistingFeature
# Step 3: Get full context for modification point
claudemem --agent context ModificationPoint
# Step 4: Check existing patterns to follow
claudemem --agent search "similar pattern" --use-case navigation
# Step 5: Implement following existing patterns

# Step 6: Check test coverage gaps (v0.4.0+)
GAPS=$(claudemem --agent test-gaps  2>/dev/null)
if [ -n "$GAPS" ]; then
  echo "Test gaps to address:"
  echo "$GAPS"
else
  echo "test-gaps requires v0.4.0+ or no gaps found"
fi
```

**Output Template:**

```markdown
## Feature Implementation Plan

**Feature:** [Description]
**Extension Point:** [Where to add]
**Dependencies:** [What it needs]
**Pattern to Follow:** [Existing similar code]
**Test Requirements:** [Coverage needs]
```

### Template 3: Refactoring

**Trigger:** "Rename X", "Extract function", "Move code", "Refactor"

```bash
# Step 1: Find the symbol to refactor
SYMBOL=$(claudemem --agent symbol SymbolToRename )
if [ -z "$SYMBOL" ]; then
  echo "Symbol not found - check exact name"
  exit 1
fi

# Step 2: Get FULL impact (all transitive callers) (v0.4.0+)
IMPACT=$(claudemem --agent impact SymbolToRename  2>/dev/null)
if [ -n "$IMPACT" ]; then
  echo "$IMPACT"
  # (impact output includes grouped_by_file)
else
  echo "Using fallback (direct callers only):"
  claudemem --agent callers SymbolToRenamefi

# Step 3: Group by file for systematic updates

# Step 4: Update each caller location systematically

# Step 5: Verify all callers updated
claudemem --agent callers NewSymbolName
# Step 6: Run affected tests
```

**Output Template:**

```markdown
## Refactoring Report

**Original:** [Old name/location]
**Target:** [New name/location]
**Direct Callers:** [Count]
**Transitive Callers:** [Count]
**Files Modified:** [List]
**Verification:** [All callers updated, tests pass]
```

### Template 4: Architecture Understanding

**Trigger:** "How does X work?", "Explain architecture", "Onboarding"

```bash
# Step 1: Get full structural map
MAP=$(claudemem --agent map )
if [ -z "$MAP" ]; then
  echo "Index may be empty - run: claudemem index"
  exit 1
fi
echo "$MAP"

# Step 2: Identify architectural pillars (PageRank > 0.05)
# Document top 5 by PageRank

# Step 3: For each pillar, get full context
claudemem --agent context PillarSymbol
# Step 4: Trace major flows via callees
claudemem --agent callees EntryPoint
# Step 5: Identify dead code (cleanup opportunities) (v0.4.0+)
DEAD=$(claudemem --agent dead-code  2>/dev/null)
if [ -n "$DEAD" ]; then
  echo "Dead code found:"
  echo "$DEAD"
else
  echo "No dead code found (or v0.4.0+ required)"
fi

# Step 6: Identify test gaps (risk areas) (v0.4.0+)
GAPS=$(claudemem --agent test-gaps  2>/dev/null)
if [ -n "$GAPS" ]; then
  echo "Test gaps:"
  echo "$GAPS"
else
  echo "No test gaps found (or v0.4.0+ required)"
fi
```

**Output Template:**

```markdown
## Architecture Report

**Core Abstractions (PageRank > 0.05):**
1. [Symbol] - [Role in system]
2. [Symbol] - [Role in system]
3. [Symbol] - [Role in system]

**Layer Structure:**
```
[Presentation Layer]
      |
[Business Layer]
      |
[Data Layer]
```

**Major Flows:**
- [Flow 1: Entry -> Processing -> Output]
- [Flow 2: Entry -> Processing -> Output]

**Health Indicators:**
- Dead Code: [Count] symbols
- Test Gaps: [Count] high-importance untested
- Tech Debt: [Summary]
```

### Template 5: Security Audit

**Trigger:** "Security review", "Audit authentication", "Check permissions"

```bash
# Step 1: Map security-related code
claudemem --agent map "auth permission security token"
# Step 2: Find authentication entry points
SYMBOL=$(claudemem --agent symbol authenticate )
if [ -z "$SYMBOL" ]; then
  echo "No 'authenticate' symbol - try: login, verify, validate"
fi
claudemem --agent callers authenticate
# Step 3: Trace authentication flow
claudemem --agent callees authenticate
# Step 4: Check authorization patterns
claudemem --agent map "authorize permission check guard"
# Step 5: Find sensitive data handlers
claudemem --agent map "password hash token secret key"
# Step 6: Check for test coverage on security code (v0.4.0+)
GAPS=$(claudemem --agent test-gaps --min-pagerank 0.01  2>/dev/null)
if [ -n "$GAPS" ]; then
  # Filter for security-related symbols
  echo "$GAPS" | grep -E "(auth|login|password|token|permission|secret)"
fi
```

**Output Template:**

```markdown
## Security Audit Report

**Authentication:**
- Entry Points: [List]
- Flow: [Description]
- Gaps: [Issues found]

**Authorization:**
- Permission Checks: [Where implemented]
- Coverage: [All routes covered?]

**Sensitive Data:**
- Password Handling: [How stored/compared]
- Token Management: [Generation/validation]
- Secrets: [How managed]

**Test Coverage:**
- Security Code Coverage: [X%]
- Critical Gaps: [List]

**Recommendations:**
1. [Priority 1 fix]
2. [Priority 2 fix]
```

---

## Static Analysis Limitations

Claudemem uses static AST analysis. Some patterns are not captured:

### Dynamic Imports
```javascript
// NOT visible to static analysis
const module = await import(`./modules/${name}`);
```
**Result:** May show as "dead code" but is actually used dynamically.
**Action:** Mark as "Potentially Dead - Manual Review"

### External Callers
```javascript
// Exported for external use
export function publicAPI() { ... }
```
**Result:** May show 0 callers but used by other repositories.
**Action:** Use `--include-exported` carefully, or mark as "Externally Called - Manual Review Required"

### Reflection/Eval
```javascript
// NOT visible to static analysis
const fn = obj[methodName]();
eval("functionName()");
```
**Result:** Callers not detected.
**Action:** Search codebase for `eval`, `Object.keys`, bracket notation.

### Event-Driven Code
```javascript
// NOT visible as direct callers
emitter.on('event', handler);
document.addEventListener('click', onClick);
```
**Result:** `handler` and `onClick` may show 0 callers.
**Action:** Check for event registration patterns.

### Dependency Injection
```typescript
// Container registration hides relationships
container.register(IService, ServiceImpl);
```
**Result:** `ServiceImpl` may show 0 callers.
**Action:** Check DI container configuration.

---

## Scenarios

### Scenario 1: Bug Fix

**Task**: "Fix the null pointer exception in user authentication"

```bash
# Step 1: Get overview of auth-related code
claudemem --agent map "authentication null pointer"
# Step 2: Locate the specific symbol mentioned in error
claudemem --agent symbol authenticate
# Step 3: Check what calls it (to understand how it's used)
claudemem --agent callers authenticate
# Step 4: Read the actual code at the identified location
# Now you know exactly which file:line to read
```

### Scenario 2: Add New Feature

**Task**: "Add rate limiting to the API endpoints"

```bash
# Step 1: Understand API structure
claudemem --agent map "API endpoints rate"
# Step 2: Find the main API handler
claudemem --agent symbol APIController
# Step 3: See what the API controller depends on
claudemem --agent callees APIController
# Step 4: Check if rate limiting already exists somewhere
claudemem --agent search "rate limit"
# Step 5: Get full context for the modification point
claudemem --agent context APIController```

### Scenario 3: Refactoring

**Task**: "Rename DatabaseConnection to DatabasePool"

```bash
# Step 1: Find the symbol
claudemem --agent symbol DatabaseConnection
# Step 2: Find ALL callers (these all need updating)
claudemem --agent callers DatabaseConnection
# Step 3: The output shows every file:line that references it
# Update each location systematically
```

### Scenario 4: Understanding Unfamiliar Codebase

**Task**: "How does the indexing pipeline work?"

```bash
# Step 1: Get high-level structure
claudemem --agent map "indexing pipeline"
# Step 2: Find the main entry point (highest PageRank)
claudemem --agent symbol Indexer
# Step 3: Trace the flow - what does Indexer call?
claudemem --agent callees Indexer
# Step 4: For each major callee, get its callees
claudemem --agent callees VectorStoreclaudemem --agent callees FileTracker
# Now you have the full pipeline traced
```

---

## Token Efficiency Guide

| Action | Token Cost | When to Use |
|--------|------------|-------------|
| `map` (focused) | ~500 | Always first - understand structure |
| `symbol` | ~50 | When you know the name |
| `callers` | ~100-500 | Before modifying anything |
| `callees` | ~100-500 | To understand dependencies |
| `context` | ~200-800 | For complex modifications |
| `search` | ~1000-3000 | When you need actual code |
| `search --map` | ~1500-4000 | For unfamiliar codebases |

**Optimal order**: map → symbol → callers/callees → search (only if needed)

This pattern typically uses **80% fewer tokens** than blind exploration.

---

## Integration Pattern for Agents

For maximum efficiency, follow this pattern:

```
1. RECEIVE TASK
   ↓
2. claudemem --agent map "<task keywords>"   → Understand structure, identify key symbols
   ↓
3. claudemem --agent symbol <high-pagerank-symbol>   → Get exact location
   ↓
4. claudemem --agent callers <symbol>   (if modifying)
   → Know the impact radius
   ↓
5. claudemem --agent callees <symbol>   (if needed)
   → Understand dependencies
   ↓
6. READ specific file:line ranges (not whole files)
   ↓
7. MAKE CHANGES with full awareness
   ↓
8. CHECK callers still work
```

---

## PageRank: Understanding Symbol Importance

PageRank measures how "central" a symbol is in the codebase:

| PageRank | Meaning | Action |
|----------|---------|--------|
| > 0.05 | Core abstraction | Understand this first - everything depends on it |
| 0.01-0.05 | Important symbol | Key functionality, worth understanding |
| 0.001-0.01 | Standard symbol | Normal code, read as needed |
| < 0.001 | Utility/leaf | Helper functions, read only if directly relevant |

**Why PageRank matters**:
- High-PageRank symbols are heavily used → understand them first
- Low-PageRank symbols are utilities → read later if needed
- Focus on high-PageRank symbols to understand architecture quickly

---

## 🔴 ANTI-PATTERNS (DO NOT DO THESE)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           COMMON MISTAKES TO AVOID                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ❌ Anti-Pattern 1: Blind File Reading                                       ║
║     → BAD: cat src/core/*.ts | head -1000                                   ║
║     → GOOD: claudemem --agent map "your task"                         ║
║     → WHY: Wastes tokens on irrelevant code, misses important files         ║
║                                                                              ║
║  ❌ Anti-Pattern 2: Grep Without Context                                     ║
║     → BAD: grep -r "Database" src/                                          ║
║     → GOOD: claudemem --agent symbol Database                         ║
║     → WHY: Grep returns string matches, not semantic relationships          ║
║                                                                              ║
║  ❌ Anti-Pattern 3: Modifying Without Impact Analysis                        ║
║     → BAD: Edit src/auth/tokens.ts without knowing callers                  ║
║     → GOOD: claudemem --agent callers generateToken  FIRST            ║
║     → WHY: Changes may break callers you don't know about                   ║
║                                                                              ║
║  ❌ Anti-Pattern 4: Searching Before Mapping                                 ║
║     → BAD: claudemem search "fix the bug"                              ║
║     → GOOD: claudemem --agent map "feature"  THEN search              ║
║     → WHY: Search results lack context without structural understanding     ║
║                                                                              ║
║  ❌ Anti-Pattern 5: Ignoring PageRank                                        ║
║     → BAD: Read every file that matches "Database"                          ║
║     → GOOD: Focus on high-PageRank symbols first                            ║
║     → WHY: Low-PageRank = utilities, High-PageRank = core abstractions      ║
║                                                                              ║
║  ❌ Anti-Pattern 6: Not Using --agent                                       ║
║     → BAD: claudemem search "query" (includes ASCII art)                    ║
║     → GOOD: claudemem --agent search "query"                          ║
║     → WHY: Logo and decorations make parsing unreliable                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Additional Anti-Pattern: Output Truncation

## CRITICAL: NEVER TRUNCATE CLAUDEMEM OUTPUT

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ⛔ OUTPUT TRUNCATION IS FORBIDDEN                                          ║
║                                                                              ║
║   claudemem output is ALREADY OPTIMIZED for LLM context windows.             ║
║   Truncating it may hide the most critical results.                          ║
║                                                                              ║
║   ❌ NEVER DO THIS (any form of output truncation):                          ║
║      claudemem --agent map "query" | head -80                                ║
║      claudemem --agent callers UserService | head -100                       ║
║      claudemem --agent callees Func | tail -50                               ║
║      claudemem --agent impact Svc | head -N                                  ║
║      claudemem --agent search "auth" | grep -m 10 "pattern"                  ║
║      claudemem --agent map "q" | awk 'NR <= 50'                              ║
║      claudemem --agent callers X | sed '50q'                                 ║
║      claudemem --agent search "x" | sort | head -20                          ║
║      claudemem --agent map "q" | grep "pattern" | head -20                   ║
║                                                                              ║
║   WHY `tail` IS EQUALLY PROBLEMATIC:                                         ║
║      `tail` skips the BEGINNING of output, which often contains:             ║
║      • Summary headers showing total counts                                  ║
║      • Highest-ranked results (PageRank, relevance score)                    ║
║      • Context that explains what follows                                    ║
║                                                                              ║
║   ✅ ALWAYS DO THIS:                                                         ║
║      claudemem --agent map "query"                                           ║
║      claudemem --agent callers UserService                                   ║
║      claudemem --agent callees Func                                          ║
║      claudemem --agent impact Svc                                            ║
║      claudemem --agent search "auth" -n 10        # Use built-in limit       ║
║                                                                              ║
║   WHY THIS MATTERS:                                                          ║
║   • search results are sorted by relevance - truncating loses best matches   ║
║   • map results are sorted by PageRank - truncating loses core architecture  ║
║   • callers/callees show ALL dependencies - truncating causes missed changes ║
║   • impact shows full blast radius - truncating underestimates risk          ║
║                                                                              ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║   IF OUTPUT IS TOO LARGE, USE BUILT-IN FLAGS:                                ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║                                                                              ║
║   --tokens N     Token-limited output (respects LLM context)                 ║
║                  Example: claudemem --agent map "query" --tokens 2000        ║
║                                                                              ║
║   --page-size N  Pagination with N results per page                          ║
║   --page N       Fetch specific page number                                  ║
║                  Example: claudemem --agent search "x" --page-size 20 --page 1║
║                                                                              ║
║   -n N           Limit result count at query level (not post-hoc)            ║
║                  Example: claudemem --agent search "auth" -n 10              ║
║                                                                              ║
║   --max-depth N  Limit traversal depth (for context, callers, impact)        ║
║                  Example: claudemem --agent context Func --max-depth 3       ║
║                                                                              ║
║   ACCEPTABLE: Piping to file for later analysis                              ║
║      claudemem --agent map "query" > /tmp/full-map.txt                       ║
║      (Full output preserved, can be processed separately)                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

NOTE: The freshness check pattern `head -5` for sampling stale files remains valid.
      This prohibition applies only to truncating claudemem COMMAND OUTPUT.

### Anti-Pattern vs Correct Pattern Summary

| Anti-Pattern | Why It's Wrong | Correct Pattern |
|--------------|----------------|-----------------|
| Read files blindly | No ranking, token waste | `map` first, then read specific lines |
| `grep -r "auth"` | No semantic understanding | `claudemem --agent symbol auth` |
| Modify without callers | Breaking changes | `callers` before any modification |
| Search immediately | No structural context | `map` → `symbol` → `callers` → search |
| Treat all symbols equal | Miss core abstractions | Focus on high-PageRank first |
| `cmd \| head/tail/awk/sed` | Output is pre-optimized; truncation hides critical results | Use full output or `-n`, `--tokens` flags |

---

## The Correct Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                 CORRECT INVESTIGATION FLOW (v0.3.0)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. claudemem --agent map "task"                          │
│     → Understand structure, find high-PageRank symbols          │
│                                                                  │
│  2. claudemem --agent symbol <name>                       │
│     → Get exact file:line location                              │
│                                                                  │
│  3. claudemem --agent callers <name>                      │
│     → Know impact radius BEFORE modifying                       │
│                                                                  │
│  4. claudemem --agent callees <name>                      │
│     → Understand dependencies                                    │
│                                                                  │
│  5. Read specific file:line ranges (NOT whole files)            │
│                                                                  │
│  6. Make changes with full awareness                            │
│                                                                  │
│  ⚠️ NEVER: Start with Read/Glob for semantic questions          │
│  ⚠️ NEVER: Modify without checking callers                      │
│  ⚠️ NEVER: Search without mapping first                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation & Setup

### Check Installation

```bash
# Check if claudemem CLI is available
which claudemem || command -v claudemem

# Check version (must be 0.3.0+)
claudemem --version
```

### Installation Options

```bash
# npm (recommended)
npm install -g claude-codemem

# Homebrew (macOS)
brew tap MadAppGang/claude-mem && brew install --cask claudemem
```

### Index Codebase

```bash
# Index current project
claudemem index

# Check status
claudemem --version && ls -la .claudemem/index.db 2>/dev/null
```

---

## Framework Documentation (v0.7.0+) ⭐NEW

Claudemem v0.7.0+ includes **automatic framework documentation fetching** for your project dependencies. Documentation is indexed alongside your code, enabling unified semantic search across both.

### Quick Reference

```bash
# Core documentation commands
claudemem docs status            # Show indexed libraries and cache state
claudemem docs fetch             # Fetch docs for all detected dependencies
claudemem docs fetch react vue   # Fetch specific libraries
claudemem docs providers         # List available documentation providers
claudemem docs refresh           # Force refresh all cached documentation
claudemem docs clear             # Clear all documentation cache
claudemem docs clear react       # Clear specific library cache
```

### Documentation Providers

Claudemem uses a **provider hierarchy** with automatic fallback:

| Priority | Provider | Coverage | Requirements |
|----------|----------|----------|--------------|
| 1 (Best) | **Context7** | 6000+ libraries with versioned code examples | API key (free tier available) |
| 2 | **llms.txt** | Official AI-friendly docs from framework sites | Free, no key needed |
| 3 | **DevDocs** | Consistent offline documentation, 100+ languages | Free, no key needed |

### Dependency Detection

Claudemem automatically detects dependencies from:

| File | Ecosystem | Example |
|------|-----------|---------|
| `package.json` | npm/yarn | React, Vue, Express |
| `requirements.txt` | Python/pip | Django, FastAPI, Pandas |
| `go.mod` | Go | Gin, Echo, GORM |
| `Cargo.toml` | Rust | Tokio, Actix, Serde |

### Setup

```bash
# Option 1: Run init (includes docs configuration)
claudemem init

# Option 2: Configure Context7 manually (optional, for best coverage)
export CONTEXT7_API_KEY=your_key

# Get free API key at: https://context7.com/dashboard
```

### Usage Examples

```bash
# Check current documentation status
claudemem docs status

# Output:
# 📚 Documentation Status
#
#   Enabled:     Yes
#   Providers:   Context7, llms.txt, DevDocs
#   Libraries:   12 indexed
#   Cache Age:   2h 15m
#
#   Indexed Libraries:
#     react (v18) via Context7 - 145 chunks
#     typescript (v5) via Context7 - 89 chunks
#     express (v4) via llms.txt - 34 chunks
#     ...

# Fetch documentation for all project dependencies
claudemem docs fetch

# Output:
# 📚 Fetching Documentation
#
#   [1/8] react... ✓ 145 chunks via Context7
#   [2/8] typescript... ✓ 89 chunks via Context7
#   [3/8] express... ✓ 34 chunks via llms.txt
#   [4/8] lodash... ✓ 67 chunks via DevDocs
#   ...

# Fetch specific library
claudemem docs fetch fastapi

# View available providers
claudemem docs providers

# Force refresh (clears cache, refetches)
claudemem docs refresh
```

### Unified Search (Code + Documentation)

After indexing documentation, `claudemem search` returns results from **both** your codebase **and** framework documentation:

```bash
claudemem --agent search "how to use React hooks"
# Output includes:
# --- Your Code ---
# file: src/components/UserProfile.tsx
# line: 12-45
# kind: function
# name: useUserProfile
# score: 0.89
# content: Custom hook for user profile management...
# ---
# --- React Documentation ---
# library: react
# section: Hooks Reference
# title: useEffect
# score: 0.87
# content: The useEffect Hook lets you perform side effects...
# ---
# library: react
# section: Hooks Reference
# title: useState
# score: 0.85
# content: useState is a Hook that lets you add state...
```

### When to Use Documentation Commands

| Scenario | Command | Why |
|----------|---------|-----|
| New project setup | `claudemem docs fetch` | Index docs for all dependencies |
| Learning new library | `claudemem docs fetch <library>` | Get searchable reference |
| Updated dependencies | `claudemem docs refresh` | Refresh to get new versions |
| Check what's indexed | `claudemem docs status` | View cache state |
| Clear space | `claudemem docs clear` | Remove cached documentation |

### Integration with Investigation Workflow

Add documentation fetch to your investigation workflow:

```bash
# ENHANCED Investigation Workflow (v0.7.0+)

# Step 0: Ensure framework docs are available (one-time)
claudemem docs status || claudemem docs fetch

# Step 1: Map architecture (now includes library patterns)
claudemem --agent map "authentication"
# Step 2: Search both code AND framework docs
claudemem --agent search "JWT token validation"# Returns: your auth code + library docs on JWT handling

# Step 3: Understand how the library recommends usage
claudemem --agent search "react best practices hooks"# Returns: your patterns + React official guidance
```

### Version Information

The `claudemem docs` command requires **v0.7.0+**. Check your version:

```bash
claudemem --version
# Expected: 0.7.0 or higher
```

**Note:** If `claudemem docs help` returns "Unknown command", upgrade your claudemem installation.

---

## Search Feedback Protocol (v0.8.0+) ⭐NEW

Claudemem learns from your search patterns. After completing a task, report which search results were helpful to improve future searches.

### Why Feedback Matters

| Feedback Type | Effect | Over Time |
|---------------|--------|-----------|
| Helpful | +10% boost | Files you consistently use rank higher |
| Unhelpful | -10% demotion | Irrelevant results rank lower |
| Document Type | Type weighting | Helpful types (e.g., symbol_summary) get priority |

### CLI Interface

```bash
# After using search results, report feedback
claudemem feedback --query "your original query" \
  --helpful id1,id2 \
  --unhelpful id3,id4

# Result IDs are shown in search output:
claudemem search "authentication" --agent# Output includes:
# id: abc123
# file: src/auth/middleware.ts
# ...
```

### MCP Interface

```json
{
  "tool": "report_search_feedback",
  "arguments": {
    "query": "authentication flow",
    "allResultIds": ["id1", "id2", "id3"],
    "helpfulIds": ["id1"],
    "unhelpfulIds": ["id3"]
  }
}
```

### When to Track as Helpful

A result should be marked as **helpful** when:
- The file was read and contained relevant information
- The code was used to understand the problem
- The symbol was part of the call chain being traced
- The file contributed to the final answer

### When to Track as Unhelpful

A result should be marked as **unhelpful** when:
- The file was read but contained irrelevant information
- The result was a false positive (matched query but wrong context)
- The file was skipped after reading initial content
- The symbol was not related to the investigation

### When NOT to Track

Do not track feedback for:
- Results from `map` command (structural overview, not semantic search)
- Results from `symbol` command (exact lookup, not search)
- Results from `callers`/`callees` commands (call graph, not search)
- Only `search` command results should have feedback

### Integration with Workflow Templates

Add feedback reporting to the end of each workflow template:

```bash
# Template 1: Bug Investigation (add at end)
# Step 7: Report feedback
if [ -n "$SEARCH_QUERY" ] && [ -n "$HELPFUL_IDS" ]; then
  # Check if feedback is available (v0.8.0+)
  if claudemem feedback --help 2>&1 | grep -qi "feedback"; then
    timeout 5 claudemem feedback --query "$SEARCH_QUERY" \
      --helpful "${HELPFUL_IDS}" \
      --unhelpful "${UNHELPFUL_IDS}" 2>/dev/null || true
  else
    echo "Note: Search feedback requires claudemem v0.8.0+"
  fi
fi
```

### Feedback Workflow Example

```bash
# Full investigation with feedback tracking

# 0. Check if feedback is available (v0.8.0+)
FEEDBACK_AVAILABLE=false
if claudemem feedback --help 2>&1 | grep -qi "feedback"; then
  FEEDBACK_AVAILABLE=true
else
  echo "Note: Search feedback requires claudemem v0.8.0+"
fi

# 1. Search and capture IDs
RESULTS=$(claudemem --agent search "payment processing" -n 10 )
ALL_IDS=$(echo "$RESULTS" | grep "^id:" | awk '{print $2}')
SEARCH_QUERY="payment processing"

# 2. Initialize tracking arrays
HELPFUL=()
UNHELPFUL=()

# 3. Process results (during investigation)
# When you read a result and it's useful:
HELPFUL+=("abc123")
# When you read a result and it's not relevant:
UNHELPFUL+=("def456")

# 4. Report feedback (at end of investigation)
if [ "$FEEDBACK_AVAILABLE" = true ] && ([ ${#HELPFUL[@]} -gt 0 ] || [ ${#UNHELPFUL[@]} -gt 0 ]); then
  timeout 5 claudemem feedback \
    --query "$SEARCH_QUERY" \
    --helpful "$(IFS=,; echo "${HELPFUL[*]}")" \
    --unhelpful "$(IFS=,; echo "${UNHELPFUL[*]}")" \
    2>/dev/null || echo "Note: Feedback not sent (optional)"
fi
```

### Quality Checklist Update

Add to the existing Quality Checklist:

- [ ] **Tracked result IDs during search** (if using `search` command)
- [ ] **Reported feedback at end of investigation** (if applicable)

---

## Index Freshness Check (v0.5.0)

Before proceeding with investigation, verify the index is current:

```bash
# Count files modified since last index
STALE_COUNT=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) \
  -newer .claudemem/index.db 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "dist" | grep -v "build" | wc -l)
STALE_COUNT=$((STALE_COUNT + 0))  # Normalize to integer

if [ "$STALE_COUNT" -gt 0 ]; then
  # Get index time with explicit platform detection
  if [[ "$OSTYPE" == "darwin"* ]]; then
    INDEX_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" .claudemem/index.db 2>/dev/null)
  else
    INDEX_TIME=$(stat -c "%y" .claudemem/index.db 2>/dev/null | cut -d'.' -f1)
  fi
  INDEX_TIME=${INDEX_TIME:-"unknown time"}

  # Use AskUserQuestion to ask user how to proceed
  # Options: [1] Reindex now (Recommended), [2] Proceed with stale index, [3] Cancel
fi
```

**AskUserQuestion Template:**

```typescript
AskUserQuestion({
  questions: [{
    question: `${STALE_COUNT} files have been modified since the last index (${INDEX_TIME}). The claudemem index may be outdated, which could cause missing or incorrect results. How would you like to proceed?`,
    header: "Index Freshness Warning",
    multiSelect: false,
    options: [
      {
        label: "Reindex now (Recommended)",
        description: "Run claudemem index to update. Takes ~1-2 minutes."
      },
      {
        label: "Proceed with stale index",
        description: "Continue investigation. May miss recent code changes."
      },
      {
        label: "Cancel investigation",
        description: "I'll handle this manually."
      }
    ]
  }]
})
```

---

## Result Validation Guidelines

### After Every Command

1. **Check exit code** - Non-zero indicates failure
2. **Check for empty results** - May need reindex or different query
3. **Validate relevance** - Results should match query semantics

### Validation Examples

```bash
# map validation
RESULTS=$(claudemem --agent map "authentication" )
EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "ERROR: claudemem command failed"
  # Diagnose index health
  DIAGNOSIS=$(claudemem --version && ls -la .claudemem/index.db 2>&1)
  # Use AskUserQuestion
fi

if [ -z "$RESULTS" ]; then
  echo "WARNING: No results found - may need reindex or different query"
  # Use AskUserQuestion
fi

if ! echo "$RESULTS" | grep -qi "auth\|login\|user\|session"; then
  echo "WARNING: Results may not be relevant to authentication query"
  # Use AskUserQuestion
fi

# symbol validation
RESULTS=$(claudemem --agent symbol UserService )
if ! echo "$RESULTS" | grep -q "name: UserService"; then
  echo "WARNING: UserService not found - check spelling or reindex"
  # Use AskUserQuestion
fi

# search validation
RESULTS=$(claudemem --agent search "error handling" )
MATCH_COUNT=0
for kw in error handling catch try; do
  if echo "$RESULTS" | grep -qi "$kw"; then
    MATCH_COUNT=$((MATCH_COUNT + 1))
  fi
done
if [ "$MATCH_COUNT" -lt 2 ]; then
  echo "WARNING: Results may not be relevant to error handling query"
  # Use AskUserQuestion
fi
```

---

## FALLBACK PROTOCOL

**CRITICAL: Never use grep/find/Glob without explicit user approval.**

If claudemem fails or returns irrelevant results:

1. **STOP** - Do not silently switch to grep/find
2. **DIAGNOSE** - Run `claudemem status` to check index health
3. **COMMUNICATE** - Tell user what happened
4. **ASK** - Get explicit user permission via AskUserQuestion

```typescript
// Fallback AskUserQuestion Templates
AskUserQuestion({
  questions: [{
    question: "claudemem [command] failed or returned no relevant results. How should I proceed?",
    header: "Investigation Issue",
    multiSelect: false,
    options: [
      { label: "Reindex codebase", description: "Run claudemem index (~1-2 min)" },
      { label: "Try different query", description: "Rephrase the search" },
      { label: "Use grep (not recommended)", description: "Traditional search - loses semantic understanding" },
      { label: "Cancel", description: "Stop investigation" }
    ]
  }]
})
```

**Grep Fallback Warning:**

If user explicitly chooses grep fallback, display this warning:

```markdown
## WARNING: Using Fallback Search (grep)

You have chosen to use grep as a fallback. Please understand the limitations:

| Feature | claudemem | grep |
|---------|-----------|------|
| Semantic understanding | Yes | No |
| Call graph analysis | Yes | No |
| Symbol relationships | Yes | No |
| PageRank ranking | Yes | No |
| False positives | Low | High |

**Recommendation:** After completing this task, run `claudemem index` to rebuild
the index for future investigations.

Proceeding with grep...
```

**See ultrathink-detective skill for complete Fallback Protocol documentation.**

---

## Quality Checklist

Before completing a claudemem workflow, ensure:

- [ ] claudemem CLI is installed (v0.3.0+)
- [ ] Codebase is indexed (check with `claudemem status`)
- [ ] **Checked index freshness** before starting ⭐NEW in v0.5.0
- [ ] **Started with `map`** to understand structure ⭐CRITICAL
- [ ] Used `--agent` for all commands
- [ ] **Validated results after every command** ⭐NEW in v0.5.0
- [ ] Checked `callers` before modifying any symbol
- [ ] Focused on high-PageRank symbols first
- [ ] Read only specific file:line ranges (not whole files)
- [ ] **Never silently switched to grep** ⭐NEW in v0.5.0
- [ ] **Reported search feedback** if `search` command was used ⭐NEW in v0.8.0

---

## Notes

- Requires OpenRouter API key for embeddings (https://openrouter.ai)
- Default model: `voyage/voyage-code-3` (best code understanding)
- All data stored locally in `.claudemem/` directory
- Tree-sitter provides AST parsing for TypeScript, Go, Python, Rust
- PageRank based on symbol call graph analysis
- Can run as MCP server with `--mcp` flag
- Initial indexing takes ~1-2 minutes for typical projects
- **NEW in v0.3.0**: `map`, `symbol`, `callers`, `callees`, `context` commands
- **NEW in v0.3.0**: PageRank ranking for symbol importance
- **NEW in v0.3.0**: `--agent` flag for clean, parseable output
- **NEW in v0.4.0**: `dead-code`, `test-gaps`, `impact` commands for code analysis
- **NEW in v0.4.0**: BFS traversal for transitive caller analysis
- **NEW in v0.7.0**: `docs` command for framework documentation fetching
- **NEW in v0.7.0**: Context7, llms.txt, DevDocs documentation providers
- **NEW in v0.7.0**: Unified search across code AND framework documentation
- **NEW in v0.7.0**: Auto-detection of dependencies from package.json, requirements.txt, go.mod, Cargo.toml

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Plugin:** code-analysis v2.8.0
**Last Updated:** December 2025 (v0.8.0 - Search feedback protocol)
