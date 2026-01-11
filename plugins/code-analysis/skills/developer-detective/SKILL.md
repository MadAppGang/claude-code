---
name: developer-detective
description: "⚡ Implementation analysis skill. Best for: 'how does X work', 'find implementation of', 'trace data flow', 'where is X defined', 'find all usages'. Uses claudemem AST with callers/callees for efficient code tracing."
allowed-tools: Bash, Task, Read, AskUserQuestion
---

# Developer Detective Skill

This skill uses claudemem's callers/callees analysis for implementation investigation.

## Why Claudemem Works Better for Development

| Task | claudemem | Native Tools |
|------|-----------|--------------|
| Find usages | `callers` shows all call sites | Grep (text match) |
| Trace dependencies | `callees` shows called functions | Manual reading |
| Understand context | `context` gives full picture | Multiple reads |
| Impact analysis | Caller chain reveals risk | Unknown |

**Primary commands:**
- `claudemem --agent callers <name>` - What calls this code
- `claudemem --agent callees <name>` - What this code calls
- `claudemem --agent context <name>` - Full understanding

# Developer Detective Skill

**Version:** 3.3.0
**Role:** Software Developer
**Purpose:** Implementation investigation using AST callers/callees and impact analysis

## Role Context

You are investigating this codebase as a **Software Developer**. Your focus is on:
- **Implementation details** - How code actually works
- **Data flow** - How data moves through the system (via callees)
- **Usage patterns** - How code is used (via callers)
- **Dependencies** - What a function needs to work
- **Impact analysis** - What breaks if you change something

## Why callers/callees is Perfect for Development

The `callers` and `callees` commands show you:
- **callers** = Every place that calls this code (impact of changes)
- **callees** = Every function this code calls (its dependencies)
- **Exact file:line** = Precise locations for reading/editing
- **Call kinds** = call, import, extends, implements

## Developer-Focused Commands (v0.3.0)

### Find Implementation

```bash
# Find where a function is defined
claudemem --agent symbol processPayment
# Get full context with callers and callees
claudemem --agent context processPayment```

### Trace Data Flow

```bash
# What does this function call? (data flows OUT)
claudemem --agent callees processPayment
# Follow the chain
claudemem --agent callees validateCardclaudemem --agent callees chargeStripe```

### Find All Usages

```bash
# Who calls this function? (usage patterns)
claudemem --agent callers processPayment
# This shows EVERY place that uses this code
```

### Impact Analysis (v0.4.0+ Required)

```bash
# Before modifying ANY code, check full impact
claudemem --agent impact functionToChange
# Output shows ALL transitive callers:
# direct_callers:
#   - LoginController.authenticate:34
#   - SessionMiddleware.validate:12
# transitive_callers (depth 2):
#   - AppRouter.handleRequest:45
#   - TestSuite.runAuth:89
```

**Why impact matters**:
- `callers` shows only direct callers (1 level)
- `impact` shows ALL transitive callers (full tree)
- Critical for refactoring decisions

**Handling Empty Results:**
```bash
IMPACT=$(claudemem --agent impact functionToChange)
if echo "$IMPACT" | grep -q "No callers"; then
  echo "No callers found. This is either:"
  echo "  1. An entry point (API handler, main function) - expected"
  echo "  2. Dead code - verify with: claudemem dead-code"
  echo "  3. Dynamically called - check for import(), reflection"
fi
```

### Impact Analysis (BEFORE Modifying)

```bash
# Quick check - direct callers only (v0.3.0)
claudemem --agent callers functionToChange
# Deep check - ALL transitive callers (v0.4.0+ Required)
IMPACT=$(claudemem --agent impact functionToChange)

# Handle results
if [ -z "$IMPACT" ] || echo "$IMPACT" | grep -q "No callers"; then
  echo "No static callers found - verify dynamic usage patterns"
else
  echo "$IMPACT"
  echo ""
  echo "This tells you:"
  echo "- Direct callers (immediate impact)"
  echo "- Transitive callers (ripple effects)"
  echo "- Grouped by file (for systematic updates)"
fi
```

### Understanding Complex Code

```bash
# Get full picture: definition + callers + callees
claudemem --agent context complexFunction```

## PHASE 0: MANDATORY SETUP

### Step 1: Verify claudemem v0.3.0

```bash
which claudemem && claudemem --version
# Must be 0.3.0+
```

### Step 2: If Not Installed → STOP

Use AskUserQuestion (see ultrathink-detective for template)

### Step 3: Check Index Status

```bash
# Check claudemem installation and index
claudemem --version && ls -la .claudemem/index.db 2>/dev/null
```

### Step 3.5: Check Index Freshness

Before proceeding with investigation, verify the index is current:

```bash
# First check if index exists
if [ ! -d ".claudemem" ] || [ ! -f ".claudemem/index.db" ]; then
  # Use AskUserQuestion to prompt for index creation
  # Options: [1] Create index now (Recommended), [2] Cancel investigation
  exit 1
fi

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

  # Get sample of stale files
  STALE_SAMPLE=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -newer .claudemem/index.db 2>/dev/null | grep -v "node_modules" | grep -v ".git" | head -5)

  # Use AskUserQuestion (see template in ultrathink-detective)
fi
```

### Step 4: Index if Needed

```bash
claudemem index
```

---

## Workflow: Implementation Investigation (v0.3.0)

### Phase 1: Map the Area

```bash
# Get overview of the feature area
claudemem --agent map "payment processing"```

### Phase 2: Find the Entry Point

```bash
# Locate the main function (highest PageRank in area)
claudemem --agent symbol PaymentService```

### Phase 3: Trace the Flow

```bash
# What does PaymentService call?
claudemem --agent callees PaymentService
# For each major callee, trace further
claudemem --agent callees validatePaymentclaudemem --agent callees processChargeclaudemem --agent callees saveTransaction```

### Phase 4: Understand Usage

```bash
# Who uses PaymentService?
claudemem --agent callers PaymentService
# This shows the entry points
```

### Phase 5: Read Specific Code

```bash
# Now read ONLY the relevant file:line ranges from results
# DON'T read whole files
```

## Output Format: Implementation Report

### 1. Symbol Overview

```
┌─────────────────────────────────────────────────────────┐
│              IMPLEMENTATION ANALYSIS                     │
├─────────────────────────────────────────────────────────┤
│  Symbol: processPayment                                  │
│  Location: src/services/payment.ts:45-89                │
│  Kind: function                                          │
│  PageRank: 0.034                                         │
│  Search Method: claudemem v0.3.0 (AST analysis)         │
└─────────────────────────────────────────────────────────┘
```

### 2. Data Flow (Callees)

```
processPayment
  ├── validateCard (src/validators/card.ts:12)
  ├── getCustomer (src/services/customer.ts:34)
  ├── chargeStripe (src/integrations/stripe.ts:56)
  │     └── stripe.charges.create (external)
  └── saveTransaction (src/repositories/transaction.ts:78)
        └── database.insert (src/db/index.ts:23)
```

### 3. Usage (Callers)

```
processPayment is called by:
  ├── CheckoutController.submit (src/controllers/checkout.ts:45)
  ├── SubscriptionService.renew (src/services/subscription.ts:89)
  └── RetryQueue.processPayment (src/workers/retry.ts:23)
```

### 4. Impact Analysis

```
⚠️ IMPACT: Changing processPayment will affect:
  - 3 direct callers (shown above)
  - Checkout flow (user-facing)
  - Subscription renewals (automated)
  - Payment retry logic (background)
```

## Scenarios

### Scenario: "How does X work?"

```bash
# Step 1: Find X
claudemem --agent symbol X
# Step 2: See what X does
claudemem --agent callees X
# Step 3: See how X is used
claudemem --agent callers X
# Step 4: Read the specific code
# Use Read tool on exact file:line from results
```

### Scenario: Refactoring

```bash
# Step 1: Find ALL usages (callers)
claudemem --agent callers oldFunction
# Step 2: Document each caller location
# Step 3: Update each caller systematically
```

### Scenario: Adding to Existing Code

```bash
# Step 1: Find where to add
claudemem --agent symbol targetModule
# Step 2: Understand dependencies
claudemem --agent callees targetModule
# Step 3: Check existing patterns
claudemem --agent callers targetModule```

## Result Validation Pattern

After EVERY claudemem command, validate results:

### Symbol/Callers Validation

When tracing implementation:

```bash
# Find symbol
SYMBOL=$(claudemem --agent symbol PaymentService)
EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ] || [ -z "$SYMBOL" ] || echo "$SYMBOL" | grep -qi "not found\|error"; then
  # Symbol doesn't exist, typo, or index issue
  # Diagnose index health
  DIAGNOSIS=$(claudemem --version && ls -la .claudemem/index.db 2>&1)
  # Use AskUserQuestion with suggestions:
  # [1] Reindex, [2] Try different name, [3] Cancel
fi

# Check callers
CALLERS=$(claudemem --agent callers PaymentService)
# 0 callers is valid (entry point or unused)
# But error message is not
if echo "$CALLERS" | grep -qi "error\|failed"; then
  # Use AskUserQuestion
fi
```

### Empty/Irrelevant Results

```bash
RESULTS=$(claudemem --agent callees FunctionName)

# Validate relevance
# Extract keywords from the user's investigation query
# Example: QUERY="how does auth work" → KEYWORDS="auth work authentication"
# The orchestrating agent must populate KEYWORDS before this check
MATCH_COUNT=0
for kw in $KEYWORDS; do
  if echo "$RESULTS" | grep -qi "$kw"; then
    MATCH_COUNT=$((MATCH_COUNT + 1))
  fi
done

if [ "$MATCH_COUNT" -eq 0 ]; then
  # Results don't match expected dependencies
  # Use AskUserQuestion: Reindex, Different query, or Cancel
fi
```

---

## FALLBACK PROTOCOL

**CRITICAL: Never use grep/find/Glob without explicit user approval.**

If claudemem fails or returns irrelevant results:

1. **STOP** - Do not silently switch tools
2. **DIAGNOSE** - Run `claudemem status`
3. **REPORT** - Tell user what happened
4. **ASK** - Use AskUserQuestion for next steps

```typescript
// Fallback options (in order of preference)
AskUserQuestion({
  questions: [{
    question: "claudemem [command] failed or returned no relevant results. How should I proceed?",
    header: "Investigation Issue",
    multiSelect: false,
    options: [
      { label: "Reindex codebase", description: "Run claudemem index (~1-2 min)" },
      { label: "Try different query", description: "Rephrase the search" },
      { label: "Use grep (not recommended)", description: "Traditional search - loses call graph analysis" },
      { label: "Cancel", description: "Stop investigation" }
    ]
  }]
})
```

**See ultrathink-detective skill for complete Fallback Protocol documentation.**

---

## Anti-Patterns

| Anti-Pattern | Why Wrong | Correct Approach |
|--------------|-----------|------------------|
| `grep -r "function"` | No call relationships | `claudemem --agent callees func` |
| Modify without callers | Breaking changes | ALWAYS check `callers` first |
| Read whole files | Token waste | Read specific file:line from results |
| Guess dependencies | Miss connections | Use `callees` for exact deps |
| `cmd \| head/tail` | Hides callers/callees | Use full output or `--tokens` |

### Output Truncation Warning

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ❌ Anti-Pattern 7: Truncating Claudemem Output                              ║
║                                                                              ║
║     FORBIDDEN (any form of output truncation):                               ║
║     → BAD: claudemem --agent map "query" | head -80                         ║
║     → BAD: claudemem --agent callers X | tail -50                           ║
║     → BAD: claudemem --agent search "x" | grep -m 10 "y"                    ║
║     → BAD: claudemem --agent map "q" | awk 'NR <= 50'                       ║
║     → BAD: claudemem --agent callers X | sed '50q'                          ║
║     → BAD: claudemem --agent search "x" | sort | head -20                   ║
║     → BAD: claudemem --agent map "q" | grep "pattern" | head -20            ║
║                                                                              ║
║     CORRECT (use full output or built-in limits):                            ║
║     → GOOD: claudemem --agent map "query"                                   ║
║     → GOOD: claudemem --agent search "x" -n 10                              ║
║     → GOOD: claudemem --agent map "q" --tokens 2000                         ║
║     → GOOD: claudemem --agent search "x" --page-size 20 --page 1            ║
║     → GOOD: claudemem --agent context Func --max-depth 3                    ║
║                                                                              ║
║     WHY: Output is pre-optimized; truncation hides critical results         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

---

## Feedback Reporting (v0.8.0+)

After completing investigation, report search feedback to improve future results.

### When to Report

Report feedback ONLY if you used the `search` command during investigation:

| Result Type | Mark As | Reason |
|-------------|---------|--------|
| Read and used | Helpful | Contributed to investigation |
| Read but irrelevant | Unhelpful | False positive |
| Skipped after preview | Unhelpful | Not relevant to query |
| Never read | (Don't track) | Can't evaluate |

### Feedback Pattern

```bash
# Track during investigation
SEARCH_QUERY="your original query"
HELPFUL_IDS=""
UNHELPFUL_IDS=""

# When reading a helpful result
HELPFUL_IDS="$HELPFUL_IDS,$result_id"

# When reading an unhelpful result
UNHELPFUL_IDS="$UNHELPFUL_IDS,$result_id"

# Report at end of investigation (v0.8.0+ only)
if claudemem feedback --help 2>&1 | grep -qi "feedback"; then
  timeout 5 claudemem feedback \
    --query "$SEARCH_QUERY" \
    --helpful "${HELPFUL_IDS#,}" \
    --unhelpful "${UNHELPFUL_IDS#,}" 2>/dev/null || true
fi
```

### Output Update

Include in investigation report:

```
Search Feedback: [X helpful, Y unhelpful] - Submitted (v0.8.0+)
```

---

## Notes

- **`callers` is essential before any modification** - Know your impact
- **`callees` traces data flow** - Follow the execution path
- **`context` gives complete picture** - Symbol + callers + callees
- Always read specific file:line ranges, not whole files
- Works best with TypeScript, Go, Python, Rust codebases

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v2.7.0
**Last Updated:** December 2025 (v3.3.0 - Cross-platform compatibility, inline templates, improved validation)
