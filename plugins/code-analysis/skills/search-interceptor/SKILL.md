---
name: search-interceptor
description: "Intercepts bulk file read and glob operations, suggests semantic search alternatives via claudemem to reduce token usage by up to 90%. Use when planning to read 3+ files, using broad glob patterns, or investigating code across multiple files."
---

# Search Interceptor

Optimizes bulk file operations by redirecting to semantic search when more efficient. Checks claudemem status, evaluates planned operations, and suggests ranked alternatives.

## Workflow

1. **Pause before bulk execution** — when about to read 3+ files or use broad globs, stop.
2. **Check claudemem status** — run `claudemem status` to verify the index is available.
3. **Evaluate the operation** against the decision matrix below.
4. **Execute the better alternative** — use one semantic query instead of N file reads.
5. **Read specific lines** from ranked results only after the semantic search.

## Decision Matrix

| Situation | Intercept? | Action |
|-----------|-----------|--------|
| Read 1-2 specific files | No | Proceed with Read |
| Read 3+ files in investigation | **Yes** | `claudemem search "concept" -n 15` |
| Glob for exact filename | No | Proceed with Glob |
| Glob for pattern discovery | **Yes** | `claudemem search "concept"` |
| Grep for exact string | No | Proceed with Grep |
| Grep for semantic concept | **Yes** | `claudemem search "concept"` |

## Example: Auth Investigation

```bash
# Instead of reading 5 auth files individually (~5000 tokens):
claudemem status
claudemem search "authentication login session JWT token validation" -n 15
# Result: ~500 tokens with ranked, relevant chunks
```

**Verification:** Compare token cost of planned reads vs. semantic search result size.

## Example: Pattern Discovery

```bash
# Instead of: Glob("src/**/*.controller.ts") then reading 15 files
claudemem search "HTTP controller endpoint route handler" -n 20
# Gets the most relevant routing code, ranked by PageRank
```

## Token Cost Comparison

| Approach | Token Cost | Ranking |
|----------|------------|---------|
| Read 5+ files | ~5000 tokens | None |
| Glob + read all matches | ~3000+ tokens | None |
| `claudemem search` once | ~500 tokens | By relevance + PageRank |

## Bypass Flag

When native tool behavior is specifically needed:

```json
{ "pattern": "exact string", "_bypass_claudemem": true }
```

## Notes

- Works with code-search-selector (determines tool), deep-analysis (uses good patterns), and detective skills
- If claudemem is not indexed, run `claudemem index -y` first
- Hook system may proactively provide claudemem results for grep and bulk read operations
