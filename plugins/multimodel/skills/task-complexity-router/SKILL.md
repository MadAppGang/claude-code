---
name: task-complexity-router
description: "Routes tasks to optimal model tiers (Native Tools, Haiku, Sonnet, Opus) based on keyword scoring and context analysis. Reduces AI costs by 60-90% through complexity-based routing with dynamic escalation on failure. Use when selecting model tiers, optimizing API costs, implementing tiered routing, or splitting complex tasks into subtasks."
---

# Task Complexity Router

Routes tasks to the cheapest model tier that can handle them, with automatic escalation on failure.

## Workflow

1. **Extract keywords** from the user request and score each one (Tier 0-3).
2. **Apply context modifiers** — file count, security implications, user signals.
3. **Route to the selected tier** based on total score.
4. **Monitor for failure** — escalate to the next tier after 2 failed attempts.
5. **Track cost** — log tier, model, tokens, and cost per task.

## Tier Definitions

| Tier | Model | Cost/1M | Speed | When to Use |
|------|-------|---------|-------|-------------|
| 0 | Native Tools | $0 | Instant | File ops, search, format, git |
| 1 | Haiku | $0.80 | 1-3s | Simple edits, docs, typo fixes |
| 2 | Sonnet (default) | $3.00 | 5-10s | Standard dev, multi-file changes |
| 3 | Opus | $15.00 | 15-30s | Architecture, security audits, complex debugging |

## Keyword Scoring

| Score | Tier | Keywords |
|-------|------|----------|
| +0 | Tier 0 | find, search, list, show, format, rename, grep |
| +1 | Tier 1 | simple, basic, quick, minor, add, fix, update, comment |
| +2 | Tier 2 | implement, create, build, refactor, integrate, develop |
| +3 | Tier 3 | architect, design, audit, complex, critical, optimize |

**Total score:** 0 = Tier 0, 1-2 = Tier 1, 3-5 = Tier 2, 6+ = Tier 3.

## Context Modifiers

| Signal | Modifier |
|--------|----------|
| 1 file affected | -1 tier |
| 11+ files affected | +1 tier |
| Security implications | +2 tiers |
| User says "simple" / "quick" | -1 tier |
| User says "complex" / "critical" | +1 tier |

## Example: Routing a Request

```
Request: "Add user authentication"
Keywords: "add" (+1), "authentication" (+3) → Score 4 → Sonnet (Tier 2)
Context: Security implications (+2) → Score 6 → Opus (Tier 3)

Subtask breakdown:
  "Design auth architecture" → Opus ($0.015)
  "Implement JWT service" → Sonnet ($0.030)
  "Add JSDoc comments" → Haiku ($0.004)
  "Write unit tests" → Haiku ($0.004)
  Total: $0.053 vs $0.105 all-Opus (50% savings)
```

**Verification:** Confirm the tier selection matches the scoring algorithm before dispatching.

## Escalation Protocol

1. Attempt 1: Use routed tier.
2. Attempt 2: Same tier, different approach.
3. Attempt 3: Escalate +1 tier.
4. Attempt 4: Escalate to Opus (maximum).

## Notes

- Default to Sonnet (Tier 2) when scoring is ambiguous
- User model override always takes priority over routing algorithm
- Split complex tasks into subtasks and route each separately for best cost efficiency
- Use native tools (Tier 0) for all file operations — they are instant and free
