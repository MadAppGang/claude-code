---
name: claudemem-orchestration
description: Use when orchestrating multi-agent code analysis with claudemem. Run claudemem once, share output across parallel agents. Enables parallel investigation, consensus analysis, and role-based command mapping.
updated: 2026-01-20
keywords: claudemem, orchestration, multi-agent, parallel-execution, consensus
allowed-tools: Bash, Task, Read, Write, AskUserQuestion
skills: orchestration:multi-model-validation
---

# Claudemem Multi-Agent Orchestration

**Version:** 1.1.0
**Purpose:** Coordinate multiple agents using shared claudemem output

## Overview

When multiple agents need to investigate the same codebase:
1. **Run claudemem ONCE** to get structural overview
2. **Write output to shared file** in session directory
3. **Launch agents in parallel** - all read the same file
4. **Consolidate results** with consensus analysis

This pattern avoids redundant claudemem calls and enables consensus-based prioritization.

**For parallel execution patterns, see:** `orchestration:multi-model-validation` skill

## Claudemem-Specific Patterns

This skill focuses on claudemem-specific orchestration. For general parallel execution:
- **4-Message Pattern** - See `orchestration:multi-model-validation` Pattern 1
- **Session Setup** - See `orchestration:multi-model-validation` Pattern 0
- **Statistics Collection** - See `orchestration:multi-model-validation` Pattern 7

### Pattern 1: Shared Claudemem Output

**Purpose:** Run expensive claudemem commands ONCE, share results across agents.

```bash
# Create unique session directory (per orchestration:multi-model-validation Pattern 0)
SESSION_ID="analysis-$(date +%Y%m%d-%H%M%S)-$(head -c 4 /dev/urandom | xxd -p)"
SESSION_DIR="/tmp/${SESSION_ID}"
mkdir -p "$SESSION_DIR"

# Run claudemem ONCE, write to shared files
claudemem --agent map "feature area" > "$SESSION_DIR/structure-map.md"
claudemem --agent test-gaps > "$SESSION_DIR/test-gaps.md" 2>&1 || echo "No gaps found" > "$SESSION_DIR/test-gaps.md"
claudemem --agent dead-code > "$SESSION_DIR/dead-code.md" 2>&1 || echo "No dead code" > "$SESSION_DIR/dead-code.md"

# Export session info
echo "$SESSION_ID" > "$SESSION_DIR/session-id.txt"
```

**Why shared output matters:**
- Claudemem indexing is expensive (full AST parse)
- Same index serves all queries in session
- Parallel agents reading same file = no redundant computation

### Pattern 2: Role-Based Agent Distribution

After running claudemem, distribute to role-specific agents:

```
# Parallel Execution (ONLY Task calls - per 4-Message Pattern)
Task: architect-detective
  Prompt: "Analyze architecture from $SESSION_DIR/structure-map.md.
           Focus on layer boundaries and design patterns.
           Write findings to $SESSION_DIR/architect-analysis.md"
---
Task: tester-detective
  Prompt: "Analyze test gaps from $SESSION_DIR/test-gaps.md.
           Prioritize coverage recommendations.
           Write findings to $SESSION_DIR/tester-analysis.md"
---
Task: developer-detective
  Prompt: "Analyze dead code from $SESSION_DIR/dead-code.md.
           Identify cleanup opportunities.
           Write findings to $SESSION_DIR/developer-analysis.md"

All 3 execute simultaneously (3x speedup!)
```

### Pattern 3: Consolidation with Ultrathink

```
Task: ultrathink-detective
  Prompt: "Consolidate analyses from:
           - $SESSION_DIR/architect-analysis.md
           - $SESSION_DIR/tester-analysis.md
           - $SESSION_DIR/developer-analysis.md

           Create unified report with prioritized action items.
           Write to $SESSION_DIR/consolidated-analysis.md"
```

### Pattern 4: Consolidated Feedback Reporting (v0.8.0+)

When multiple agents perform searches, consolidate feedback for efficiency.

**Why Consolidate?**

- Avoid duplicate feedback submissions
- Single point of failure handling
- Cleaner session cleanup

**Shared Feedback Collection:**

Each agent writes feedback to a shared file in the session directory:

```bash
# Agent writes feedback entry (atomic with flock)
report_agent_feedback() {
  local query="$1"
  local helpful="$2"
  local unhelpful="$3"

  # Use file locking to prevent race conditions
  (
    flock -x 200
    printf '%s|%s|%s\n' "$query" "$helpful" "$unhelpful" >> "$SESSION_DIR/feedback.log"
  ) 200>"$SESSION_DIR/feedback.lock"
}

# Usage in agent
report_agent_feedback "$SEARCH_QUERY" "$HELPFUL_IDS" "$UNHELPFUL_IDS"
```

**Orchestrator Consolidation:**

After all agents complete, the orchestrator submits all feedback:

```bash
consolidate_feedback() {
  local session_dir="$1"
  local feedback_log="$session_dir/feedback.log"

  # Skip if no feedback collected
  [ -f "$feedback_log" ] || return 0

  # Check if feedback command available (v0.8.0+)
  if ! claudemem feedback --help 2>&1 | grep -qi "feedback"; then
    echo "Note: Search feedback requires claudemem v0.8.0+"
    return 0
  fi

  local success=0
  local failed=0

  while IFS='|' read -r query helpful unhelpful; do
    # Skip empty lines
    [ -n "$query" ] || continue

    if timeout 5 claudemem feedback \
      --query "$query" \
      --helpful "$helpful" \
      --unhelpful "$unhelpful" 2>/dev/null; then
      ((success++))
    else
      ((failed++))
    fi
  done < "$feedback_log"

  echo "Feedback: $success submitted, $failed failed"

  # Cleanup
  rm -f "$feedback_log" "$session_dir/feedback.lock"
}

# Call after consolidation
consolidate_feedback "$SESSION_DIR"
```

**Multi-Agent Workflow Integration:**

```
Phase 1: Session Setup
  └── Create SESSION_DIR with feedback.log

Phase 2: Parallel Agent Execution
  └── Agent 1: Search → Track → Write feedback entry
  └── Agent 2: Search → Track → Write feedback entry
  └── Agent 3: Search → Track → Write feedback entry

Phase 3: Results Consolidation
  └── Consolidate agent outputs

Phase 4: Feedback Consolidation (NEW)
  └── Read all feedback entries from log
  └── Submit each to claudemem
  └── Report success/failure counts

Phase 5: Cleanup
  └── Remove SESSION_DIR (includes feedback files)
```

**Best Practices Update:**

**Do:**
- Use file locking for concurrent writes (`flock -x`)
- Consolidate feedback AFTER agent completion
- Report success/failure counts
- Clean up feedback files after submission

**Don't:**
- Submit feedback from each agent individually
- Skip the version check
- Block on feedback submission failures
- Track feedback for non-search commands (map, symbol, callers, etc.)

## Role-Based Command Mapping

| Agent Role | Primary Commands | Secondary Commands | Focus |
|------------|------------------|-------------------|-------|
| Architect | `map`, `dead-code` | `context` | Structure, cleanup |
| Developer | `callers`, `callees`, `impact` | `symbol` | Modification scope |
| Tester | `test-gaps` | `callers` | Coverage priorities |
| Debugger | `context`, `impact` | `symbol`, `callers` | Error tracing |
| Ultrathink | ALL | ALL | Comprehensive |

## Sequential Investigation Flow

For complex bugs or features requiring ordered investigation:

```
Phase 1: Architecture Understanding
  claudemem --agent map "problem area"  Identify high-PageRank symbols (> 0.05)

Phase 2: Symbol Deep Dive
  For each high-PageRank symbol:
    claudemem --agent context <symbol>    Document dependencies and callers

Phase 3: Impact Assessment (v0.4.0+)
  claudemem --agent impact <primary-symbol>  Document full blast radius

Phase 4: Gap Analysis (v0.4.0+)
  claudemem --agent test-gaps --min-pagerank 0.01  Identify coverage holes in affected code

Phase 5: Action Planning
  Prioritize by: PageRank * impact_depth * test_coverage
```

## Agent System Prompt Integration

When an agent needs deep code analysis, it should reference the claudemem skill:

```yaml
---
skills: code-analysis:claudemem-search, code-analysis:claudemem-orchestration
---
```

The agent then follows this pattern:

1. **Check claudemem status**: `claudemem status`
2. **Index if needed**: `claudemem index`
3. **Run appropriate command** based on role
4. **Write results to session file** for sharing
5. **Return brief summary** to orchestrator

## Best Practices

**Do:**
- Run claudemem ONCE per investigation type
- Write all output to session directory
- Use parallel execution for independent analyses (see `orchestration:multi-model-validation`)
- Consolidate with ultrathink for cross-perspective insights
- Handle empty results gracefully

**Don't:**
- Run same claudemem command multiple times
- Let each agent run its own claudemem (wasteful)
- Skip the consolidation step
- Forget to clean up session directory (automatic TTL cleanup via `session-start.sh`)

## Session Lifecycle Management

**Automatic TTL Cleanup:**

The `session-start.sh` hook automatically cleans up expired session directories:
- Default TTL: 24 hours
- Runs at session start
- Cleans `/tmp/analysis-*`, `/tmp/review-*` directories older than TTL
- See `plugins/code-analysis/hooks/session-start.sh` for implementation

**Manual Cleanup:**

```bash
# Clean up specific session
rm -rf "$SESSION_DIR"

# Clean all old sessions (24+ hours)
find /tmp -maxdepth 1 -name "analysis-*" -o -name "review-*" -mtime +1 -exec rm -rf {} \;
```

## Error Handling Templates

For robust orchestration, handle common claudemem errors. See `claudemem-search` skill for complete error handling templates:

### Empty Results
```bash
RESULT=$(claudemem --agent map "query" 2>/dev/null)
if [ -z "$RESULT" ] || echo "$RESULT" | grep -q "No results found"; then
  echo "No results - try broader keywords or check index status"
fi
```

### Version Compatibility
```bash
# Check if command is available (v0.4.0+ commands)
if claudemem --agent dead-code 2>&1 | grep -q "unknown command"; then
  echo "dead-code requires claudemem v0.4.0+"
  echo "Fallback: Use map command instead"
fi
```

### Index Status
```bash
# Verify index before running commands
if ! claudemem status 2>&1 | grep -qE "[0-9]+ (chunks|symbols)"; then
  echo "Index not found - run: claudemem index"
  exit 1
fi
```

**Reference:** For complete error handling patterns, see templates in `code-analysis:claudemem-search` skill (Templates 1-5)

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v2.8.0
**Last Updated:** December 2025 (v1.1.0 - Search feedback protocol support)
