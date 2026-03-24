---
name: data-extraction-patterns
description: "Extract and combine analytics data from GA4 and GSC APIs using parallel fetching, caching, rate-limit handling, and graceful degradation. Use when building data pipelines or fetching metrics for SEO analysis."
---

# Data Extraction Patterns

## Workflow

1. **Configure API connections** -- identify GA4 property ID and GSC site URL
2. **Fetch data in parallel** -- issue GA4 and GSC requests simultaneously
3. **Handle errors and rate limits** -- retry with exponential backoff on 429s
4. **Cache results** -- store responses for the session to avoid redundant calls
5. **Merge into unified model** -- combine sources into a single JSON structure
6. **Degrade gracefully** -- produce partial reports when a source is unavailable

## Step 1: GA4 API Reference

MCP Server: `mcp-server-google-analytics`

```
get_report({
  propertyId: "properties/123456789",
  dateRange: { startDate: "30daysAgo", endDate: "today" },
  dimensions: ["pagePath", "date"],
  metrics: ["screenPageViews", "averageSessionDuration", "bounceRate"]
})
```

Key metrics: `screenPageViews`, `sessions`, `averageSessionDuration`, `bounceRate`, `engagementRate`, `scrolledUsers`. Key dimensions: `pagePath`, `date`, `sessionSource`, `deviceCategory`.

## Step 2: GSC API Reference

MCP Server: `mcp-server-gsc`

```
search_analytics({
  siteUrl: "https://example.com",
  startDate: "2025-11-27",
  endDate: "2025-12-27",
  dimensions: ["query", "page"],
  rowLimit: 1000
})
```

Key metrics: `clicks`, `impressions`, `ctr`, `position`. Key dimensions: `query`, `page`, `country`, `device`, `date`.

## Step 3: Parallel Fetching

Issue all MCP calls in a single message for simultaneous execution:

```
Message 1 (parallel):
  [MCP Call 1]: google-analytics.get_report(...)
  [MCP Call 2]: google-search-console.search_analytics(...)
  → Both execute simultaneously, ~2x faster than sequential
```

Use sequential fetching only when one call depends on another's result (e.g., fetch page list first, then details per page).

## Step 4: Rate Limits and Retry

| API | Limit | Strategy |
|-----|-------|----------|
| GA4 | 10 QPS per property | Batch dimensions in one call |
| GSC | 1,200 requests/min | Paginate large exports |

Retry pattern: on HTTP 429, wait 5s, then double delay on each retry, max 3 attempts.

## Step 5: Caching

Cache responses per session with a 1-hour TTL. Key format: `{source}_{url}_{dateRange}`. Check cache before every API call; save response after successful fetch.

## Step 6: Unified Output Model

```json
{
  "metadata": {
    "url": "https://example.com/page",
    "fetchedAt": "2025-12-27T14:30:00Z",
    "dateRange": { "start": "2025-11-27", "end": "2025-12-27" }
  },
  "sources": {
    "ga4": {
      "available": true,
      "metrics": { "pageViews": 2450, "bounceRate": 38.2, "engagementRate": 64.5 }
    },
    "gsc": {
      "available": true,
      "metrics": { "impressions": 15200, "clicks": 428, "ctr": 2.82, "avgPosition": 4.2 }
    }
  },
  "computed": { "healthScore": 72, "status": "GOOD" }
}
```

## Graceful Degradation

| Primary Source | Fallback | Last Resort |
|----------------|----------|-------------|
| GA4 traffic data | GSC clicks | Estimate from GSC impressions * CTR |
| GSC search perf | Manual SERP check | WebSearch SERP |
| CWV (CrUX) | PageSpeed API | Lighthouse CLI |

When a source is unavailable, note it in the report and recommend configuring the missing source.

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 401 Unauthorized | Invalid credentials | Re-run /setup-analytics |
| 403 Forbidden | Missing permissions | Grant Viewer role in GA4 Admin |
| 429 Too Many Requests | Rate limit hit | Retry with exponential backoff |
| 404 Not Found | Invalid property/site | Verify IDs in configuration |

## Date Range Reference

| API | Format | Example |
|-----|--------|---------|
| GA4 | Relative or ISO | "30daysAgo", "2025-12-01" |
| GSC | ISO 8601 only | "2025-12-01" |

Common ranges: `7d`, `30d`, `90d`, `mtd` (month-to-date), `ytd` (year-to-date).

## Validation Checklist

- [ ] GA4 property ID and GSC site URL configured correctly
- [ ] Parallel fetch used when requests are independent
- [ ] Cache checked before each API call
- [ ] Error responses handled with retry or fallback
- [ ] Partial data reports note which sources are missing
