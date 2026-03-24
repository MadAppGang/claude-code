---
name: developer-detective
description: "Traces implementation details using claudemem AST callers/callees analysis. Locates function definitions, maps data flow, finds all usages, and assesses change impact. Use when asked 'how does X work', 'find implementation of', 'trace data flow', 'where is X defined', or 'find all usages'."
---

# Developer Detective

Software Developer perspective for implementation investigation using claudemem's `callers`, `callees`, `context`, `symbol`, and `impact` commands for precise code tracing.

## Workflow

1. **Verify claudemem** — confirm v0.3.0+ installed and indexed. Check freshness; reindex if stale.
2. **Map the area** — run `claudemem --agent map "feature area"` to get an overview.
3. **Find the entry point** — run `claudemem --agent symbol <Name>` to locate the highest-PageRank symbol.
4. **Trace the flow** — run `callees` to see what the function calls (data flows out), then follow the chain.
5. **Understand usage** — run `callers` to see every place that calls the function (impact of changes).
6. **Check impact** (v0.4.0+) — before modifying code, run `claudemem --agent impact <Name>` for full transitive caller tree.
7. **Read specific code** — use Read tool on exact file:line ranges from results, never whole files.

## Example: Tracing Payment Flow

```bash
# Step 1: Find the function
claudemem --agent symbol processPayment

# Step 2: What does it call? (data flow)
claudemem --agent callees processPayment
# Output: validateCard, getCustomer, chargeStripe, saveTransaction

# Step 3: Who calls it? (usage/impact)
claudemem --agent callers processPayment
# Output: CheckoutController.submit:45, SubscriptionService.renew:89

# Step 4: Full impact before refactoring (v0.4.0+)
claudemem --agent impact processPayment
```

**Verification:** Confirm callers/callees output includes file:line references. If symbol returns "not found", check spelling or reindex.

## Common Scenarios

| Scenario | Commands |
|----------|----------|
| "How does X work?" | `symbol X` → `callees X` → `callers X` |
| Refactoring | `callers oldFunction` → document each location → update systematically |
| Adding to existing code | `symbol targetModule` → `callees` (deps) → `callers` (patterns) |
| Impact assessment | `impact functionToChange` → review all transitive callers |

## Fallback Protocol

Never use grep/find/Glob without explicit user approval. If claudemem fails:

1. Stop — do not silently switch tools.
2. Diagnose — run `claudemem status`.
3. Ask user via AskUserQuestion (reindex, different query, grep fallback with warning, or cancel).

## Notes

- Always check `callers` before modifying any code — know the impact
- `callees` traces data flow — follow the execution path
- `context` gives complete picture — symbol + callers + callees combined
- Read specific file:line ranges, never whole files
- Never truncate claudemem output — use `--tokens` or `-n` flags for size control
