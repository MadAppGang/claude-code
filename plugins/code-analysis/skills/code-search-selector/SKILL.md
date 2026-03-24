---
name: code-search-selector
description: "Selects between semantic search (claudemem) and native tools (Grep/Glob) based on query type. Checks claudemem index status and classifies tasks as semantic or exact-match. Use when choosing a code search tool, before investigation tasks, or when deciding between claudemem search and grep."
---

# Code Search Tool Selector

Chooses the most effective search tool for each task by classifying queries and checking claudemem availability.

## Workflow

1. **Check claudemem status** — run `claudemem status` (mandatory before any semantic search).
2. **Classify the task** — determine if the query is semantic (conceptual) or exact-match (literal string).
3. **Select the tool** based on classification and claudemem availability.
4. **Execute the search** using the recommended approach.

## Classification Guide

| Query Type | Example | Recommended Tool |
|------------|---------|------------------|
| "How does X work?" | "How does authentication work?" | `claudemem search` |
| Find implementations | "Find all API endpoints" | `claudemem search` |
| Architecture questions | "Map the service layer" | `claudemem --agent map` |
| Trace data flow | "How does user data flow?" | `claudemem search` |
| Exact string match | "Find 'DEPRECATED_FLAG'" | `Grep` |
| Count occurrences | "How many TODO comments?" | `Grep -c` |
| File patterns | "Find all *.config.ts" | `Glob` |

## Example: Semantic Query

```bash
# Step 1: Check index
claudemem status
# Output shows chunk count (e.g., "938 chunks") → indexed

# Step 2: Search semantically
claudemem search "authentication login flow JWT" -n 15
# Result: Top 15 ranked code chunks vs. grep's 500 lines of noise
```

**Verification:** Confirm `claudemem status` shows chunk count before proceeding with semantic search.

## Example: Exact Match

```bash
# Exact string — use native tools
grep -r "DEPRECATED_FLAG" src/
```

## Bulk Read Optimization

Before reading 3+ files, check if one semantic query is more efficient:

| Planned Operation | Better Alternative |
|-------------------|-------------------|
| Read 5 auth files individually | `claudemem search "authentication login session" -n 15` |
| Glob all services then read | `claudemem search "service layer business logic"` |
| Sequential reads to understand | One semantic query (~500 vs ~5000 tokens) |

## If Claudemem Not Indexed

```bash
# Offer to index
claudemem index -y
# Takes 1-2 minutes, enables semantic search
```

## Notes

- Semantic search finds related code even with different terminology
- Results sorted by relevance and PageRank — important code comes first
- Hook system may provide claudemem results proactively when index is available
- Use `_bypass_claudemem: true` when native tool behavior is specifically needed
