---
name: ultrathink-detective
description: "Runs comprehensive multi-perspective codebase analysis using all claudemem AST commands (map, symbol, callers, callees, context, search). Covers architecture, implementation, testing, reliability, security, performance, and code health dimensions. Use when asked for a comprehensive audit, deep analysis, full codebase review, or multi-perspective investigation."
---

# Ultrathink Detective

Senior Principal Engineer analysis combining all detective perspectives (architect, developer, tester, debugger) using Opus model with full claudemem AST analysis across seven dimensions.

## Workflow

1. **Verify setup** — confirm claudemem v0.3.0+ is installed and indexed. Check index freshness; reindex if stale files detected.
2. **Architecture mapping** — run `claudemem --agent map` to identify high-PageRank symbols (> 0.05) as architectural pillars.
3. **Critical path analysis** — for each pillar, run `symbol`, `callers`, `callees`, and `context` to trace dependencies and usage.
4. **Test coverage assessment** — check callers of critical functions for test file references. High PageRank + 0 test callers = critical gap.
5. **Risk identification** — analyze security symbols, error handling chains, and external integrations.
6. **Technical debt inventory** — search for TODO/FIXME, identify god classes (> 20 callees), find orphaned code.
7. **Code health check** (v0.4.0+) — run `dead-code` and `test-gaps` commands, categorize by PageRank impact.
8. **Generate report** — produce executive summary with per-dimension scores and prioritized action items.

## Seven Analysis Dimensions

| Dimension | Primary Command | Focus |
|-----------|----------------|-------|
| Architecture | `map` | Layers, core abstractions, PageRank |
| Implementation | `callers`/`callees` | Data flow, dependencies |
| Testing | `callers` (test files) | Coverage gaps |
| Reliability | `context` | Error handling chains |
| Security | `symbol` + `callers` | Auth flow, sensitive data |
| Performance | `search` | Database patterns, async, caching |
| Code Health | `dead-code`, `test-gaps` | Cleanup candidates, coverage |

## Example: Full Audit

```bash
# Phase 1: Architecture
claudemem --agent map
claudemem --agent map "controller handler endpoint"
claudemem --agent map "service business logic"

# Phase 2: Critical paths
claudemem --agent symbol PaymentService
claudemem --agent callees PaymentService
claudemem --agent callers PaymentService

# Phase 3: Test coverage
claudemem --agent callers authenticateUser
# Check: are any callers from *.test.ts or *.spec.ts?

# Phase 4: Code health (v0.4.0+)
claudemem --agent dead-code
claudemem --agent test-gaps
```

**Verification:** Confirm every conclusion is backed by specific claudemem output with file:line references.

## Output Format

```
CODEBASE COMPREHENSIVE ANALYSIS
Overall Health: [score]/10

Dimensions:
  Architecture:    [score] [map analysis]
  Implementation:  [score] [callers/callees]
  Testing:         [score] [test-gaps]
  Reliability:     [score] [context tracing]
  Security:        [score] [auth callers]
  Performance:     [score] [async patterns]
  Code Health:     [score] [dead-code + impact]

Action Items (by PageRank impact):
  IMMEDIATE: [high-PageRank critical gaps]
  SHORT-TERM: [important improvements]
  MEDIUM-TERM: [tech debt cleanup]
```

## Fallback Protocol

Never use grep/find/Glob without explicit user approval. If claudemem fails:

1. **Stop** — do not silently switch tools.
2. **Diagnose** — run `claudemem status`.
3. **Ask user** via AskUserQuestion for next steps (reindex, different query, or cancel).

## Notes

- Never truncate claudemem output — use built-in flags (`-n`, `--tokens`, `--max-depth`) instead
- PageRank > 0.05 = architectural pillar, analyze first
- Submit search feedback via `claudemem feedback` (v0.8.0+) after investigation
- Works best with TypeScript, Go, Python, Rust codebases
