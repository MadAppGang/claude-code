---
name: openrouter-trending-models
description: "Fetches the top 9 trending programming models from OpenRouter rankings via a Bun script, returning model IDs, context windows, pricing, and weekly token usage as structured JSON. Use when comparing LLM costs, finding the cheapest or best model for a task, selecting models for multi-model review, or refreshing model recommendations."
---

# OpenRouter Trending Models

Fetches and structures data about the top 9 trending AI programming models from OpenRouter's public rankings.

## Workflow

1. **Run the script** — execute `bun run scripts/get-trending-models.ts` to fetch current rankings.
2. **Parse output** — read the structured JSON containing models, pricing, context windows, and usage stats.
3. **Select or filter** — use jq to find models matching criteria (cheapest, largest context, most popular).
4. **Cache if needed** — save output to `trending-models.json` and refresh weekly.
5. **Integrate** — pass selected model IDs to Claudish or agent workflows.

## Example: Fetch and Filter Models

```bash
# Fetch fresh data
bun run scripts/get-trending-models.ts > /tmp/trending-models.json

# Pretty print all models
cat /tmp/trending-models.json | jq '.models[] | {rank, id, name, context: .contextLength, price: .pricing.promptPer1M}'

# Find cheapest models with 100K+ context
bun run scripts/get-trending-models.ts | jq '.models | map(select(.contextLength > 100000)) | sort_by(.pricing.promptPer1M) | .[:3] | .[] | {name, id, contextLength, price: .pricing.promptPer1M}'
```

**Verification:** Confirm the script exits with code 0 and output contains a non-empty `models` array.

## Output Schema

```json
{
  "metadata": { "fetchedAt": "ISO-8601", "weekEnding": "YYYY-MM-DD", "category": "programming" },
  "models": [
    {
      "rank": 1, "id": "x-ai/grok-code-fast-1", "name": "Grok Code Fast",
      "tokenUsage": 908664328688, "contextLength": 131072,
      "pricing": { "promptPer1M": 0.5, "completionPer1M": 1.0 }
    }
  ],
  "summary": { "totalTokens": 4500000000000, "topProvider": "x-ai", "priceRange": { "min": 0.5, "max": 15.0 } }
}
```

## Caching Strategy

```bash
# Check cache freshness (7-day threshold)
CACHE="trending-models.json"
if [ ! -f "$CACHE" ] || [ $(find "$CACHE" -mtime +7 2>/dev/null) ]; then
  bun run scripts/get-trending-models.ts > "$CACHE"
fi
```

Freshness: 0-7 days (fresh), 8-14 days (stale), 14+ days (re-fetch required).

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| `Failed to fetch rankings` | Network/site down | Retry once, then use cached data if < 14 days old |
| `Failed to extract JSON from RSC format` | Page structure changed | Inspect raw HTML, update regex in script |
| `Model not found in API` | ID mismatch | Model gets default values (0 context/pricing) |

Fallback chain: fresh fetch -> cached file -> hardcoded model list in agent prompt.

## Notes

- Data source: OpenRouter Rankings (programming category) + Models API
- Rankings update weekly; refresh cache on the same cadence
- Script uses only Bun built-in APIs — zero external dependencies
- Typical execution time: 2-5 seconds
