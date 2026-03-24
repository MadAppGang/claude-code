---
name: architect-detective
description: "Analyzes codebase architecture using claudemem AST structural analysis with PageRank. Maps layers, identifies core abstractions, traces dependency flow, and detects dead code. Use when analyzing system design, finding design patterns, mapping architectural boundaries, or auditing code structure."
---

# Architect Detective

Software Architect perspective for deep architectural investigation using claudemem's `map`, `symbol`, `callers`, `callees`, and `dead-code` commands with PageRank centrality analysis.

## Workflow

1. **Verify claudemem** — confirm v0.3.0+ installed and indexed. Check freshness; reindex if stale.
2. **Map the landscape** — run `claudemem --agent map` and identify high-PageRank symbols (> 0.05) as architectural pillars.
3. **Identify layers** — map presentation, business, and data layers with targeted queries.
4. **Trace dependencies** — for each pillar, run `callers` (who depends on it) and `callees` (what it depends on).
5. **Find boundaries** — search for interfaces, contracts, and dependency injection points.
6. **Detect dead code** (v0.4.0+) — run `dead-code`, categorize by PageRank (high = broken, low = cleanup candidate).
7. **Validate results** — confirm PageRank data is present and symbols match expected architectural patterns.

## Example: Architecture Analysis

```bash
# Step 1: Structural overview
claudemem --agent map

# Step 2: Layer identification
claudemem --agent map "controller handler endpoint"   # Presentation
claudemem --agent map "service business logic"         # Business
claudemem --agent map "repository database query"      # Data

# Step 3: Dependency tracing for a core abstraction
claudemem --agent symbol UserService
claudemem --agent callers UserService   # What depends on it
claudemem --agent callees UserService   # What it depends on

# Step 4: Dead code detection (v0.4.0+)
claudemem --agent dead-code
```

**Verification:** Confirm `map` output contains PageRank values. If empty or missing PageRank, diagnose and reindex.

## PageRank Interpretation

| PageRank | Architectural Role | Action |
|----------|-------------------|--------|
| > 0.05 | Core abstraction | Analyze first — this IS the architecture |
| 0.01-0.05 | Important component | Key building block |
| 0.001-0.01 | Standard component | Not architecturally significant |
| < 0.001 | Leaf/utility | Skip for architecture analysis |

## Fallback Protocol

Never use grep/find/Glob without explicit user approval. If claudemem fails:

1. Stop — do not silently switch tools.
2. Diagnose — run `claudemem status`.
3. Ask user via AskUserQuestion (reindex, broaden query, or cancel).

## Notes

- `map` is the primary tool — it reveals architecture through PageRank centrality
- High PageRank + dead = something recently broke (investigate immediately)
- Low PageRank + dead = safe cleanup candidate
- Never truncate claudemem output — use `--tokens` or `-n` flags for size control
- Submit search feedback via `claudemem feedback` (v0.8.0+)
