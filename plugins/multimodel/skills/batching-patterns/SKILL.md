---
name: batching-patterns
description: Batch all related operations into single messages for maximum parallelism and performance. Use when launching multiple agents, reading multiple files, running parallel searches, optimizing workflow speed, or avoiding sequential execution bottlenecks. Trigger keywords - "batching", "parallel", "single message", "golden rule", "concurrent", "performance", "sequential bottleneck", "speed optimization".
version: 0.1.0
tags: [orchestration, batching, parallel, performance, golden-rule, single-message]
keywords: [batching, parallel, single-message, golden-rule, concurrent, performance, anti-pattern, sequential, optimization]
plugin: multimodel
updated: 2026-01-28
---

# Batching Patterns

**Version:** 1.0.0
**Purpose:** The Golden Rule of Claude Code execution -- batch operations for maximum parallelism
**Status:** Production Ready

## Overview

The Golden Rule of Claude Code performance:

**"1 MESSAGE = ALL RELATED OPERATIONS"**

Every tool call within a single message executes in parallel (when no dependencies exist). Every separate message introduces a sequential round-trip. This distinction is the difference between a 2-minute workflow and a 10-minute one.

```
Sequential (5 separate messages):
  Message 1: Task(agent-1)  →  2 min
  Message 2: Task(agent-2)  →  2 min (waits for agent-1!)
  Message 3-5: ...           →  2 min each
  Total: ~10 minutes (serial)

Batched (1 message):
  Message 1: Task(agent-1) + Task(agent-2) + ... + Task(agent-5)
  Total: ~2 minutes (parallel, limited by slowest agent)
  Speedup: 5x
```

Each message carries API round-trip overhead. Batching eliminates N-1 round-trips.

---

## The Batching Principle

Claude Code has a simple execution model:

1. **Within ONE message:** Same tool type calls execute in parallel (no data dependencies)
2. **Across SEPARATE messages:** Tool calls execute sequentially
3. **Mixed tool types in ONE message:** May force sequential execution

```
Same tool type in one message = PARALLEL
  Task(A) + Task(B) + Task(C)  →  All run simultaneously

Different tool types in one message = SEQUENTIAL (often)
  TaskCreate(...) + Task(A) + Bash(...)  →  May run one at a time

Separate messages = ALWAYS SEQUENTIAL
  Message 1: Task(A)  →  completes first
  Message 2: Task(B)  →  starts only after A finishes
```

**Why Same Tool Type Signals Independence:**

Multiple calls of the same tool type (all Task, all Read, all Grep) signal independent operations that can run concurrently. Mixing tool types breaks this signal because different types often have implicit ordering requirements.

---

## Batching Patterns by Tool Type

### Task Tool Batching

The most impactful tool to batch -- each agent runs for minutes.

```
❌ Sequential (3 separate messages):
  Message 1: Task(security-reviewer)   → 3 min
  Message 2: Task(perf-reviewer)       → 2 min (waits!)
  Message 3: Task(a11y-reviewer)       → 2 min (waits!)
  Total: ~7 minutes

✅ Batched (1 message):
  Task(security-reviewer) + Task(perf-reviewer) + Task(a11y-reviewer)
  Total: ~3 minutes (3 agents parallel)
  Speedup: 2.3x
```

Agents are independent when they: read same input but don't modify it, write to different output files, perform different analysis, don't need each other's results.

### File Operations Batching

```
❌ Sequential Reads:
  Message 1: Read("src/auth.ts")        → round-trip
  Message 2: Read("src/middleware.ts")   → round-trip
  Message 3: Read("src/routes.ts")      → round-trip
  Total: 3 round-trips

✅ Batched Reads:
  Read("src/auth.ts") + Read("src/middleware.ts") + Read("src/routes.ts")
  Total: 1 round-trip (3x faster)
```

```
❌ Sequential Searches:
  Message 1: Grep("TODO", path="src/")
  Message 2: Grep("FIXME", path="src/")
  Message 3: Glob("**/*.test.ts")

✅ Batched Searches:
  Grep("TODO") + Grep("FIXME") + Glob("**/*.test.ts")
  All parallel in 1 round-trip
```

```
⚠️ Write/Edit Caution:
  ❌ Edit("src/auth.ts", change_1) + Edit("src/auth.ts", change_2)  ← Conflict!
  ✅ Edit("src/auth.ts", change_1) + Edit("src/routes.ts", change_2)  ← Safe
  Rule: Different files = safe to batch. Same file = must be sequential.
```

### Tasks Batching

```
❌ Individual Calls (5 round-trips):
  TaskCreate({ id: "1", title: "Step 1", status: "pending" })
  TaskCreate({ id: "2", title: "Step 2", status: "pending" })
  ...

✅ Single Call (1 round-trip):
  TaskCreate({ id: "1", title: "Step 1", status: "pending" })
  TaskCreate({ id: "2", title: "Step 2", status: "pending" })
  TaskCreate({ id: "3", title: "Step 3", status: "pending" })
  # All in same message = parallel execution
```

### Bash Batching

```
❌ Sequential Independent Commands:
  Message 1: Bash("npm run lint")
  Message 2: Bash("npm run typecheck")
  Message 3: Bash("npm run test")

✅ Parallel Independent Commands (1 message):
  Bash("npm run lint") + Bash("npm run typecheck") + Bash("npm run test")

✅ Dependent Commands Chained (1 Bash call):
  Bash("mkdir -p ai-docs && cp template.md ai-docs/plan.md")
```

---

## The 4-Message Pattern (Reference)

The canonical batching template from multi-agent-coordination:

```
Message 1: Preparation (Bash/Write only)
  - Create directories, write context files, validate inputs
  - NO Task calls, NO Tasks

Message 2: Parallel Execution (Task only)
  - ALL agents in SINGLE message, ONLY Task calls
  - Same tool type = true parallel execution

Message 3: Consolidation (Task only)
  - Consolidation agent reads all output files

Message 4: Present Results
  - Show user final consolidated results
```

**Why 4 messages:** Each depends on the previous (agents need context, consolidation needs agent outputs, presentation needs consolidated result). This is the minimum sequential steps.

---

## Anti-Patterns (Critical)

### Anti-Pattern 1: Sequential Task Launches

```
❌ Message 1: Task(agent-1)     // 2 min
❌ Message 2: Task(agent-2)     // 2 min (waits for agent-1!)
❌ Message 3: Task(agent-3)     // 2 min (waits for agent-2!)
   Total: 6 minutes

✅ Message 1: Task(agent-1) + Task(agent-2) + Task(agent-3)  // All parallel!
   Total: 2 minutes (3x speedup)
```

### Anti-Pattern 2: Mixing Tool Types in Execution Message

```
❌ Mixed Tools (sequential):
  TaskCreate({...})             // Tool type A
  Task(security-reviewer)       // Tool type B
  Bash("echo 'starting'")      // Tool type C
  Task(perf-reviewer)           // Tool type B

✅ Separated (parallel execution):
  Message 1: TaskCreate({...}) + Bash("echo 'starting'")   // Preparation
  Message 2: Task(security-reviewer) + Task(perf-reviewer) // Execution (parallel)
```

### Anti-Pattern 3: Individual Tasks Calls

```
❌ 5 separate TaskCreate calls across messages = 5 round-trips
✅ 5 TaskCreate calls in 1 message = 1 round-trip (parallel)
```

### Anti-Pattern 4: Sequential File Reads

```
❌ 5 separate Read messages = 5 round-trips
✅ 5 Read calls in 1 message = 1 round-trip (5x faster)
```

### Anti-Pattern 5: Unnecessary Dependencies

```
❌ False Dependencies:
  Message 1: Grep("authentication")  // Wait...
  Message 2: Grep("authorization")   // Wait...
  Message 3: Glob("**/*.middleware.ts")  // Wait...

✅ Recognize Independence:
  Message 1: Grep("authentication") + Grep("authorization") + Glob("**/*.middleware.ts")
```

**Dependency Detection Checklist:**

Before splitting across messages, ask:
1. Does B need the OUTPUT of A? If no, batch.
2. Do both write to the SAME file? If no, batch.
3. Does the ORDER matter? If no, batch.
4. Is B CONDITIONAL on A's result? If no, batch.

If all four are "no," operations are independent -- batch them.

---

## When NOT to Batch

- **Data dependencies:** Developer needs architect's plan before implementing
- **Same-file modifications:** Two edits to the same file must be sequential
- **Sequential phases:** Plan -> Implement -> Test -> Review (each depends on previous)
- **Order-dependent operations:** `npm install && npm build && npm test`
- **Conditional execution:** Next action depends on previous result (test pass/fail)

```
CORRECT - Sequential:
  Message 1: Task(architect)   → writes plan.md
  Message 2: Task(developer)   → reads plan.md (depends on Message 1)

CORRECT - Chained:
  Bash("npm install && npm run build && npm run test")
```

---

## Performance Impact

```
Scenario: 5-Agent Code Review
  Sequential: 10 min + 5 round-trips  |  Batched: 3 min + 1 round-trip  |  3.3x

Scenario: 7 Codebase Searches
  Sequential: ~21 seconds             |  Batched: ~3 seconds              |  7x

Scenario: 10 File Reads
  Sequential: ~20 seconds             |  Batched: ~2 seconds              |  10x
```

**Speedup Formula:**

```
Sequential = N * (execution + round_trip)
Batched    = max(executions) + round_trip
Speedup    = approximately N (for identical operations)
```

**Context Benefits:** Fewer messages = less context consumed = more room for useful work.

---

## Best Practices

**Do:**
- ✅ Launch ALL independent agents in a single message (biggest speedup)
- ✅ Read all needed files in one message before processing
- ✅ Run all independent searches (Grep + Glob) in parallel
- ✅ Create all task items in a single message
- ✅ Use the same tool type for parallel operations
- ✅ Check the dependency checklist before splitting across messages
- ✅ Follow the 4-Message Pattern for multi-agent workflows
- ✅ Chain dependent Bash commands with && in a single call

**Don't:**
- ❌ Launch agents in separate messages (forces sequential)
- ❌ Mix tool types in execution messages (breaks parallelism)
- ❌ Read files one at a time across separate messages
- ❌ Create individual TaskCreate calls across separate messages
- ❌ Batch operations that write to the same file
- ❌ Batch operations where B needs A's output
- ❌ Assume all operations can be batched (check dependencies)

---

## Examples

### Example 1: Multi-Model Code Review (Batch 5 Reviewers)

```
Message 1: Preparation
  Bash("mkdir -p ai-docs/reviews")
  Write("ai-docs/review-context.md", code_context)

Message 2: Parallel Execution (5 Task calls)
  Task(security-reviewer)      → ai-docs/reviews/security.md
  Task(performance-reviewer)   → ai-docs/reviews/performance.md
  Task(accessibility-reviewer) → ai-docs/reviews/accessibility.md
  Task(code-quality-reviewer)  → ai-docs/reviews/quality.md
  Task(architecture-reviewer)  → ai-docs/reviews/architecture.md
  ALL 5 execute simultaneously

Message 3: Consolidation
  Task(review-consolidator) → ai-docs/consolidated-review.md

Message 4: Present Results
  Sequential: 5 * 2 min = 10 min  |  Batched: ~4 min  |  2.5x speedup
```

### Example 2: Codebase Exploration (Batch Searches)

```
Message 1: Parallel Searches (7 operations, 1 message)
  Grep("authenticate")  + Grep("authorize")  + Grep("jwt|token")
  + Grep("middleware.*auth") + Glob("**/auth*.ts")
  + Glob("**/middleware/**/*.ts") + Glob("**/*.test.ts")

Message 2: Parallel File Reads (all discovered files)
  Read("src/auth/authenticate.ts") + Read("src/auth/authorize.ts")
  + Read("src/middleware/auth.middleware.ts")
  + Read("src/services/token.service.ts")
  + Read("src/routes/auth.routes.ts") + Read("tests/auth/auth.test.ts")

Total: 2 messages, ~5 seconds
Sequential: 13 messages, ~30+ seconds  |  Speedup: 6x+
```

### Example 3: Multi-Phase Workflow (Mixed Batching/Sequential)

```
Message 1 - Preparation (batch reads + setup):
  Bash("mkdir -p ai-docs/feature") + Read("src/existing-module.ts")
  + Read("package.json") + Glob("**/*.test.ts")

Message 2 - Planning (depends on Message 1):
  Task(architect) → ai-docs/feature/plan.md

Message 3 - Implementation (3 agents parallel, depends on Message 2):
  Task(backend-developer) → src/feature/api.ts
  Task(frontend-developer) → src/feature/ui.tsx
  Task(test-developer) → tests/feature/

Message 4 - Validation (3 checks parallel, depends on Message 3):
  Bash("npm run test -- tests/feature/")
  Bash("npm run lint -- src/feature/")
  Bash("npm run typecheck")

Message 5 - Review (depends on Message 4):
  Task(code-reviewer)

Total: 5 messages (minimum for dependency chain)
Without batching: 10+ messages  |  Speedup: 2-3x
```

---

## Troubleshooting

**Parallel agents executing sequentially?**
Mixed tool types in execution message. Use ONLY Task calls.

**File reads arriving one at a time?**
Each Read in separate message. Batch all Reads into one message.

**Conflicting edits?**
Batched Edit calls targeting same file. Sequence same-file edits, batch different-file edits.

**Workflow slower than expected despite batching?**
Audit dependency chain. Ask at each message boundary: "Does this TRULY depend on the previous one?"

---

## Summary

- **The Golden Rule:** 1 message = all related operations
- **Same tool type** in one message enables true parallel execution
- **Mixed tool types** may force sequential execution
- **3-5x speedup** from batching Task launches (biggest impact)
- **Up to 10x speedup** from batching file reads and searches
- **The 4-Message Pattern** is the canonical batching template
- **Check dependencies** before batching (output deps, same-file conflicts)

Master batching and every workflow runs at maximum speed.

---

**Inspired By:**
- claude-flow concurrent execution mandate
- 4-Message Pattern from multi-agent-coordination skill
- Production performance analysis of sequential vs parallel workflows
- Claude Code tool execution model observations
