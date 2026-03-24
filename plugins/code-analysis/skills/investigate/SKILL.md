---
name: investigate
description: "Routes code investigation queries to specialized detectives (debugger, tester, architect, developer) via priority-based keyword matching and Task delegation. Use when the investigation type is unclear, for general code exploration, or to auto-select the right detective skill."
---

# Investigate Skill

Unified entry point for code investigation. Analyzes query keywords, selects the best detective specialist, and delegates via the Task tool.

## Workflow

1. **Extract and normalize the query** from the task description or user input.
2. **Detect keywords** using the priority system below and select a detective.
3. **Show the routing decision** to the user before delegating.
4. **Delegate via the Task tool** to the chosen detective.
5. **Offer override** if the user disagrees with the auto-routing.

## Priority Routing

| Priority | Category | Keywords | Detective |
|----------|----------|----------|-----------|
| 1 | Error/Debug | debug, error, broken, failing, crash | `debugger-detective` |
| 2 | Testing | test, coverage, edge case, mock | `tester-detective` |
| 3 | Architecture | architecture, design, structure, layer | `architect-detective` |
| 4 | Implementation (default) | implementation, how does, code flow | `developer-detective` |

When multiple categories match, the highest priority wins. No matches default to `developer-detective`.

## Example

**Input:** "Why is login broken?"

```bash
# Normalize query
QUERY_LOWER=$(echo "$INVESTIGATION_QUERY" | tr '[:upper:]' '[:lower:]')

# Keyword detection — "broken" matches Priority 1
DETECTIVE="debugger-detective"
```

```typescript
// Delegate to selected detective
Task({
  description: "Why is login broken?",
  agent: "debugger-detective"
})
```

**Verification:** Confirm the routing decision is shown to the user before delegation proceeds.

## Conflict Resolution Example

**Input:** "Debug the test coverage"
- "debug" matches Priority 1, "test" matches Priority 2
- Priority 1 wins → routes to `debugger-detective`

## Fallback Protocol

1. Show the routing decision to the user.
2. Offer override via AskUserQuestion if needed.
3. Default to `developer-detective` when ambiguous.

## Notes

- Case-insensitive keyword matching
- Additive only — direct detective usage and /analyze command remain unchanged
- Works with all claudemem versions (v0.3.0+)
