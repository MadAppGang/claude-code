---
name: deep-analysis
description: "Launches codebase-detective with claudemem indexed memory for comprehensive code investigation. Traces code flow, maps architecture, and locates implementations with semantic search. Use when asked 'how does X work', 'investigate', 'analyze architecture', 'trace flow', or 'find implementations'."
---

# Deep Code Analysis

Provides comprehensive codebase investigation by launching the codebase-detective agent with claudemem semantic search and AST-aware pattern matching.

## Prerequisites

1. Run `code-search-selector` skill first to validate tool choice.
2. Verify claudemem is indexed: `claudemem status`
3. If not indexed: `claudemem index -y`
4. Do NOT start with Read/Glob — use semantic search first, then read specific lines.

## Workflow

1. **Determine investigation scope** — classify the query (feature analysis, implementation search, flow tracing, debugging, pattern finding, or architecture audit).
2. **Launch codebase-detective** via the Task tool with detailed investigation instructions.
3. **Present analysis results** — executive summary, file locations with line numbers, code flow, architecture overview.
4. **Offer follow-up** — suggest deeper dives into specific areas.

## Example: Understanding Authentication

```typescript
Task({
  subagent_type: "code-analysis:detective",
  description: "Investigate user authentication and login flow",
  prompt: `
    1. Check claudemem status, index if needed
    2. claudemem search "authentication login session JWT" -n 15
    3. Trace: login endpoint → auth service → token generation → middleware
    4. Report file locations with line numbers and data flow diagram
  `
})
```

**Expected output:**
- Primary file locations with line numbers
- Step-by-step code flow explanation
- Architecture map showing component relationships
- Actionable next steps

## Search Strategy

| Task | Tool | Example |
|------|------|---------|
| Understand how X works | `claudemem search` | `claudemem search "authentication flow"` |
| Find API endpoints | `claudemem search` | `claudemem search "API endpoint handler"` |
| Trace data flow | `claudemem search` | `claudemem search "data transformation"` |
| Exact string match only | `grep` (fallback) | `grep -r "DEPRECATED_FLAG" src/` |

## Fallback Protocol

If claudemem is unavailable or returns no results:

1. **Stop** — do not silently switch to grep.
2. **Diagnose** — run `claudemem status`.
3. **Ask user** — offer reindex, different query, grep fallback (with quality warning), or cancel.

**Verification:** Confirm results include exact file paths with line numbers before presenting to user.

## Notes

- The codebase-detective agent uses extended thinking for complex analysis
- claudemem requires OpenRouter API key (https://openrouter.ai)
- Default model: `voyage/voyage-code-3` for code understanding
- grep is for exact string matches only, not semantic understanding
