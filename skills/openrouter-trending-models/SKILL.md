---
name: openrouter-trending-models
description: "Fetches the top 9 trending programming models from OpenRouter rankings via a Bun script. Returns model IDs, context windows, pricing, and weekly usage statistics as structured JSON. Use when selecting models for multi-model review, comparing model pricing, updating model recommendations, or researching current AI coding trends."
---

# OpenRouter Trending Models Skill

## Overview

This skill provides access to current trending programming models from OpenRouter's public rankings. It executes a Bun script that fetches, parses, and structures data about the top 9 most-used AI models for programming tasks.

**What you get:**
- Model IDs and names (e.g., `x-ai/grok-code-fast-1`)
- Token usage statistics (last week's trends)
- Context window sizes (input capacity)
- Pricing information (per token and per 1M tokens)
- Summary statistics (top provider, price ranges, averages)

**Data Source:**
- OpenRouter Rankings (https://openrouter.ai/rankings?category=programming)
- OpenRouter Models API (https://openrouter.ai/api/v1/models)

**Update Frequency:** Weekly (OpenRouter updates rankings every week)

---

## When to Use This Skill

Use this skill when you need to:

1. **Select models for multi-model review**
   - Plan reviewer needs current trending models
   - User asks "which models should I use for review?"
   - Updating model recommendations in agent workflows

2. **Research AI coding trends**
   - Developer wants to know most popular coding models
   - Comparing model capabilities (context, pricing, usage)
   - Identifying "best value" models for specific tasks

3. **Update plugin documentation**
   - Refreshing model lists in README files
   - Keeping agent prompts current with trending models
   - Documentation maintenance workflows

4. **Cost optimization**
   - Finding cheapest models with sufficient context
   - Comparing pricing across trending models
   - Budget planning for AI-assisted development

5. **Model recommendations**
   - User asks "what's the best model for X?"
   - Providing data-driven suggestions vs hardcoded lists
   - Offering alternatives based on requirements

---

## Quick Start

### Running the Script

**Basic Usage:**
```bash
bun run scripts/get-trending-models.ts
```

**Output to File:**
```bash
bun run scripts/get-trending-models.ts > trending-models.json
```

**Pretty Print:**
```bash
bun run scripts/get-trending-models.ts | jq '.'
```

**Help:**
```bash
bun run scripts/get-trending-models.ts --help
```

### Expected Output

The script outputs structured JSON to stdout:

```json
{
  "metadata": {
    "fetchedAt": "2025-11-14T10:30:00.000Z",
    "weekEnding": "2025-11-10",
    "category": "programming",
    "view": "trending"
  },
  "models": [
    {
      "rank": 1,
      "id": "x-ai/grok-code-fast-1",
      "name": "Grok Code Fast",
      "tokenUsage": 908664328688,
      "contextLength": 131072,
      "maxCompletionTokens": 32768,
      "pricing": {
        "prompt": 0.0000005,
        "completion": 0.000001,
        "promptPer1M": 0.5,
        "completionPer1M": 1.0
      }
    }
    // ... 8 more models
  ],
  "summary": {
    "totalTokens": 4500000000000,
    "topProvider": "x-ai",
    "averageContextLength": 98304,
    "priceRange": {
      "min": 0.5,
      "max": 15.0,
      "unit": "USD per 1M tokens"
    }
  }
}
```

### Execution Time

Typical execution: 2-5 seconds
- Fetch rankings: ~1 second
- Fetch model details: ~1-2 seconds (parallel requests)
- Parse and format: <1 second

---

## Output Format

### Metadata Object

```typescript
{
  fetchedAt: string;        // ISO 8601 timestamp of when data was fetched
  weekEnding: string;       // YYYY-MM-DD format, end of ranking week
  category: "programming";  // Fixed category
  view: "trending";         // Fixed view type
}
```

### Models Array (9 items)

Each model contains:

```typescript
{
  rank: number;             // 1-9, position in trending list
  id: string;               // OpenRouter model ID (e.g., "x-ai/grok-code-fast-1")
  name: string;             // Human-readable name (e.g., "Grok Code Fast")
  tokenUsage: number;       // Total tokens used last week
  contextLength: number;    // Maximum input tokens
  maxCompletionTokens: number; // Maximum output tokens
  pricing: {
    prompt: number;         // Per-token input cost (USD)
    completion: number;     // Per-token output cost (USD)
    promptPer1M: number;    // Input cost per 1M tokens (USD)
    completionPer1M: number; // Output cost per 1M tokens (USD)
  }
}
```

### Summary Object

```typescript
{
  totalTokens: number;      // Sum of token usage across top 9 models
  topProvider: string;      // Most represented provider (e.g., "x-ai")
  averageContextLength: number; // Average context window size
  priceRange: {
    min: number;            // Lowest prompt price per 1M tokens
    max: number;            // Highest prompt price per 1M tokens
    unit: "USD per 1M tokens";
  }
}
```

---

## Integration Examples

### Example 1: Dynamic Model Selection in Agent

**Scenario:** Plan reviewer needs current trending models for multi-model review

```markdown
# In plan-reviewer agent workflow

STEP 1: Fetch trending models
- Execute: Bash("bun run scripts/get-trending-models.ts > /tmp/trending-models.json")
- Read: /tmp/trending-models.json

STEP 2: Parse and present to user
- Extract top 3-5 models from models array
- Display with context and pricing info
- Let user select preferred model(s)

STEP 3: Use selected model for review
- Pass model ID to Claudish proxy
```

**Implementation:**
```typescript
// Agent reads output
const data = JSON.parse(bashOutput);

// Extract top 5 models
const topModels = data.models.slice(0, 5);

// Present to user
const modelList = topModels.map((m, i) =>
  `${i + 1}. **${m.name}** (\`${m.id}\`)
   - Context: ${m.contextLength.toLocaleString()} tokens
   - Pricing: $${m.pricing.promptPer1M}/1M input
   - Usage: ${(m.tokenUsage / 1e9).toFixed(1)}B tokens last week`
).join('\n\n');

// Ask user to select
const userChoice = await AskUserQuestion(`Select model for review:\n\n${modelList}`);
```

### Example 2: Find Best Value Models

**Scenario:** User wants high-context models at lowest cost

```bash
# Fetch models and filter with jq
bun run scripts/get-trending-models.ts | jq '
  .models
  | map(select(.contextLength > 100000))
  | sort_by(.pricing.promptPer1M)
  | .[:3]
  | .[] | {
      name,
      id,
      contextLength,
      price: .pricing.promptPer1M
    }
'
```

**Output:**
```json
{
  "name": "Gemini 2.5 Flash",
  "id": "google/gemini-2.5-flash",
  "contextLength": 1000000,
  "price": 0.075
}
{
  "name": "Grok Code Fast",
  "id": "x-ai/grok-code-fast-1",
  "contextLength": 131072,
  "price": 0.5
}
```

### Example 3: Update Plugin Documentation

**Scenario:** Automated weekly update of README model recommendations

```bash
# Fetch models
bun run scripts/get-trending-models.ts > trending.json

# Extract top 5 model names and IDs
jq -r '.models[:5] | .[] | "- `\(.id)` - \(.name) (\(.contextLength / 1024)K context, $\(.pricing.promptPer1M)/1M)"' trending.json

# Output (ready for README):
# - `x-ai/grok-code-fast-1` - Grok Code Fast (128K context, $0.5/1M)
# - `anthropic/claude-4.5-sonnet-20250929` - Claude 4.5 Sonnet (200K context, $3.0/1M)
# - `google/gemini-2.5-flash` - Gemini 2.5 Flash (976K context, $0.075/1M)
```

### Example 4: Check for New Trending Models

**Scenario:** Identify when new models enter top 9

```bash
# Save current trending models
bun run scripts/get-trending-models.ts | jq '.models | map(.id)' > current.json

# Compare with previous week (saved as previous.json)
diff <(jq -r '.[]' previous.json | sort) <(jq -r '.[]' current.json | sort)

# Output shows new entries (>) and removed entries (<)
```

---

## Troubleshooting

### Issue: Script Fails to Fetch Rankings

**Error Message:**
```
✗ Error: Failed to fetch rankings: fetch failed
```

**Possible Causes:**
1. No internet connection
2. OpenRouter site is down
3. Firewall blocking openrouter.ai
4. URL structure changed

**Solutions:**

1. **Test connectivity:**
```bash
curl -I https://openrouter.ai/rankings
# Should return HTTP 200
```

2. **Check URL in browser:**
   - Visit https://openrouter.ai/rankings
   - Verify page loads and shows programming rankings
   - If URL redirects, update RANKINGS_URL constant in script

3. **Check firewall/proxy:**
```bash
# Test from command line
curl "https://openrouter.ai/rankings?category=programming&view=trending&_rsc=2nz0s"
# Should return HTML with embedded JSON
```

4. **Use fallback data:**
   - Keep last successful output as fallback
   - Use cached trending-models.json if < 14 days old

### Issue: Parse Error (Invalid RSC Format)

**Error Message:**
```
✗ Error: Failed to extract JSON from RSC format
```

**Cause:** OpenRouter changed their page structure

**Solutions:**

1. **Inspect raw HTML:**
```bash
curl "https://openrouter.ai/rankings?category=programming&view=trending&_rsc=2nz0s" | head -200
```

2. **Look for data pattern:**
   - Search for `"data":[{` in output
   - Check if line starts with different prefix (not `1b:`)
   - Verify JSON structure matches expected format

3. **Update regex in script:**
   - Edit `scripts/get-trending-models.ts`
   - Modify regex in `fetchRankings()` function
   - Test with new pattern

4. **Report issue:**
   - File issue in plugin repository
   - Include raw HTML sample (first 500 chars)
   - Specify when error started occurring

### Issue: Model Details Not Found

**Warning Message:**
```
Warning: Model x-ai/grok-code-fast-1 not found in API, using defaults
```

**Cause:** Model ID in rankings doesn't match API

**Impact:** Model will have 0 values for context/pricing

**Solutions:**

1. **Verify model exists in API:**
```bash
curl "https://openrouter.ai/api/v1/models" | jq '.data[] | select(.id == "x-ai/grok-code-fast-1")'
```

2. **Check for ID mismatches:**
   - Rankings may use different ID format
   - API might have model under different name
   - Model may be new and not yet in API

3. **Manual correction:**
   - Edit output JSON file
   - Add correct details from OpenRouter website
   - Note discrepancy for future fixes

### Issue: Stale Data Warning

**Symptom:** Models seem outdated compared to OpenRouter site

**Check data age:**
```bash
jq '.metadata.fetchedAt' trending-models.json
# Compare with current date
```

**Solutions:**

1. **Re-run script:**
```bash
bun run scripts/get-trending-models.ts > trending-models.json
```

2. **Set up weekly refresh:**
   - Add to cron: `0 0 * * 1 cd /path/to/repo && bun run scripts/get-trending-models.ts > skills/openrouter-trending-models/trending-models.json`
   - Or use GitHub Actions (see Automation section)

3. **Add staleness check in agents:**
```typescript
const data = JSON.parse(readFile("trending-models.json"));
const fetchedDate = new Date(data.metadata.fetchedAt);
const daysSinceUpdate = (Date.now() - fetchedDate.getTime()) / (1000 * 60 * 60 * 24);

if (daysSinceUpdate > 7) {
  console.warn("Data is over 7 days old, consider refreshing");
}
```

---

## Best Practices

### Data Freshness

**Recommended Update Schedule:**
- Weekly: Ideal (matches OpenRouter update cycle)
- Bi-weekly: Acceptable for stable periods
- Monthly: Minimum for production use

**Staleness Guidelines:**
- 0-7 days: Fresh (green)
- 8-14 days: Slightly stale (yellow)
- 15-30 days: Stale (orange)
- 30+ days: Very stale (red)

### Caching Strategy

**When to cache:**
- Multiple agents need same data
- Frequent model selection workflows
- Avoiding rate limits

**How to cache:**
1. Run script once: `bun run scripts/get-trending-models.ts > trending-models.json`
2. Commit to repository (under `skills/openrouter-trending-models/`)
3. Agents read from file instead of re-running script
4. Refresh weekly via manual run or automation

**Cache invalidation:**
```bash
# Check if cache is stale (> 7 days)
if [ $(find trending-models.json -mtime +7) ]; then
  echo "Cache is stale, refreshing..."
  bun run scripts/get-trending-models.ts > trending-models.json
fi
```

### Error Handling in Agents

**Graceful degradation pattern:**

```markdown
1. Try to fetch fresh data
   - Run: bun run scripts/get-trending-models.ts
   - If succeeds: Use fresh data
   - If fails: Continue to step 2

2. Try cached data
   - Check if trending-models.json exists
   - Check if < 14 days old
   - If valid: Use cached data
   - If not: Continue to step 3

3. Fallback to hardcoded models
   - Use known good models from agent prompt
   - Warn user data may be outdated
   - Suggest manual refresh
```

### Integration Patterns

**Pattern 1: On-Demand (Fresh Data)**
```bash
# Run before each use
bun run scripts/get-trending-models.ts > /tmp/models.json
# Read from /tmp/models.json
```

**Pattern 2: Cached (Fast Access)**
```bash
# Check cache age first
CACHE_FILE="skills/openrouter-trending-models/trending-models.json"
if [ ! -f "$CACHE_FILE" ] || [ $(find "$CACHE_FILE" -mtime +7) ]; then
  bun run scripts/get-trending-models.ts > "$CACHE_FILE"
fi
# Read from cache
```

**Pattern 3: Background Refresh (Non-Blocking)**
```bash
# Start refresh in background (don't wait)
bun run scripts/get-trending-models.ts > trending-models.json &

# Continue with workflow
# Use cached data if available
# Fresh data will be ready for next run
```

---

## Changelog

### v1.0.0 (2025-11-14)
- Initial release
- Fetch top 9 trending programming models from OpenRouter
- Parse RSC streaming format
- Include context length, pricing, and token usage
- Zero dependencies (Bun built-in APIs only)
- Comprehensive error handling
- Summary statistics (total tokens, top provider, price range)

---

## Future Enhancements

### Planned Features
- Category selection (programming, creative, analysis, etc.)
- Historical trend tracking (compare week-over-week)
- Provider filtering (focus on specific providers)
- Cost calculator (estimate workflow costs)

### Research Ideas
- Correlate rankings with model performance benchmarks
- Identify "best value" models (performance/price ratio)
- Predict upcoming trending models
- Multi-category analysis

---

**Skill Version:** 1.0.0
**Last Updated:** November 14, 2025
**Maintenance:** Weekly refresh recommended
**Dependencies:** Bun runtime, internet connection
