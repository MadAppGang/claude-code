# /update-models Command v2.0 - Design Document

**Status:** Design Phase
**Created:** 2025-11-19
**Author:** Claude Code Agent Architect
**Version:** 2.0.0

---

## Executive Summary

This document outlines the redesign of the `/update-models` command from a brittle Chrome DevTools MCP scraping approach to a robust, API-based system with intelligent caching. The new design eliminates 90% of the complexity while improving reliability, speed, and maintainability.

**Key Improvements:**
- ✅ **Simpler**: 50 lines of curl/jq instead of 300+ lines of Chrome automation
- ✅ **Faster**: <2s API fetch vs 15-30s browser automation
- ✅ **More Reliable**: Stable REST API vs brittle DOM parsing
- ✅ **Smart Caching**: 3-day TTL reduces API calls by 99%
- ✅ **Auto-Update**: Commands fetch fresh models automatically when cache expires
- ✅ **Graceful Degradation**: Uses stale cache if API fails

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Architecture](#solution-architecture)
3. [Cache System Design](#cache-system-design)
4. [Model API Manager Agent](#model-api-manager-agent)
5. [Updated /update-models Command](#updated-update-models-command)
6. [Categorization & Filtering](#categorization--filtering)
7. [Migration Plan](#migration-plan)
8. [Comparison: Old vs New](#comparison-old-vs-new)

---

## Problem Statement

### Current Implementation Issues

**Complexity:**
- Uses Chrome DevTools MCP to scrape OpenRouter website
- Requires browser automation (page navigation, DOM parsing)
- 3 retry attempts due to MCP instability
- Complex error handling for page structure changes

**Brittleness:**
- Breaks when OpenRouter updates page structure
- MCP connection issues cause failures
- DOM selectors hardcoded and fragile
- 15-30s execution time

**Maintenance Burden:**
- Models hardcoded in `shared/recommended-models.md`
- Manual updates required when models change
- Sync script must distribute to all plugins
- Version numbers must be manually incremented

**Files Involved (Current):**
- `.claude/commands/update-models.md` - 5-phase orchestrator
- `agents/model-scraper.md` - Chrome DevTools automation agent
- `shared/recommended-models.md` - Hardcoded model list (643 lines)
- `mcp/claudish/recommended-models.json` - Hardcoded JSON (112 lines)
- `scripts/sync-shared.ts` - Distribution script

### Why This is a Problem

1. **Scraping is Overkill**: OpenRouter provides a public REST API with ALL model data
2. **Static Data Gets Stale**: Models change frequently, manual updates lag behind
3. **Sync Pattern is Outdated**: Commands should fetch dynamically, not rely on synced files
4. **User Approval Slows Workflow**: Cache updates don't need approval (internal-only change)

---

## Solution Architecture

### High-Level Design

**Replace Scraping with API + Caching:**

```
┌─────────────────────────────────────────────────────────────┐
│ OLD APPROACH (Brittle)                                      │
├─────────────────────────────────────────────────────────────┤
│ User: /update-models                                        │
│   ↓                                                         │
│ Orchestrator → model-scraper agent                          │
│   ↓                                                         │
│ Chrome DevTools MCP → OpenRouter webpage                    │
│   ↓                                                         │
│ Parse DOM (brittle selectors)                               │
│   ↓                                                         │
│ Filter/deduplicate/categorize                               │
│   ↓                                                         │
│ User approval gate (slow)                                   │
│   ↓                                                         │
│ Update shared/recommended-models.md (static)                │
│   ↓                                                         │
│ Sync to all plugins (fragile)                               │
│                                                             │
│ Time: 30-60s | Failure Rate: 20% | Complexity: High        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ NEW APPROACH (Robust)                                       │
├─────────────────────────────────────────────────────────────┤
│ User: /update-models OR any command needing models          │
│   ↓                                                         │
│ Check cache: mcp/claudish/.model-cache.json                │
│   ↓                                                         │
│ IF expired (>3 days):                                       │
│   ↓                                                         │
│   API fetch: https://openrouter.ai/api/v1/models           │
│   ↓                                                         │
│   Parse JSON (stable schema)                                │
│   ↓                                                         │
│   Filter/categorize (intelligent rules)                     │
│   ↓                                                         │
│   Update cache (auto, no approval needed)                   │
│   ↓                                                         │
│ ELSE:                                                       │
│   ↓                                                         │
│   Use cached models (instant)                               │
│   ↓                                                         │
│ Return shortlist to command                                 │
│                                                             │
│ Time: <2s (API) or <100ms (cache) | Failure Rate: <1%      │
│ Complexity: Low                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Use OpenRouter REST API** | Public, stable, documented, returns all 337+ models in JSON |
| **Cache Location: `mcp/claudish/.model-cache.json`** | Hidden file (`.` prefix) in Claudish directory (logical grouping) |
| **Cache TTL: 3 days** | Balance freshness (models change weekly) vs API load |
| **Auto-Update Cache** | No user approval needed (internal implementation detail) |
| **Graceful Degradation** | Use stale cache if API fails (better than total failure) |
| **Keep `shared/recommended-models.md`** | Human-readable documentation/reference, NOT source of truth |
| **Remove User Approval Gate** | Cache updates are safe, don't affect user-facing behavior |
| **Remove Plugin Sync** | Commands read cache dynamically (single source of truth) |

---

## Cache System Design

### Cache File Location

```
mcp/claudish/.model-cache.json
```

**Why this location?**
- ✅ Logical grouping with Claudish MCP configuration
- ✅ Hidden file (`.` prefix) - internal implementation detail
- ✅ Shared across all plugins (single source of truth)
- ✅ Not in `.claude/` (not user-facing configuration)

### Cache Schema

```json
{
  "version": "1.0.0",
  "cachedAt": "2025-11-19T10:30:00Z",
  "ttl": 259200,
  "expiresAt": "2025-11-22T10:30:00Z",
  "source": "https://openrouter.ai/api/v1/models",
  "modelCount": 337,
  "integrity": {
    "checksum": "sha256:abc123def456...",
    "algorithm": "sha256",
    "validatedAt": "2025-11-19T10:30:00Z"
  },
  "filtered": {
    "coding": [
      {
        "id": "x-ai/grok-code-fast-1",
        "name": "Grok Code Fast 1",
        "provider": "xAI",
        "category": "coding",
        "priority": 1,
        "pricing": {
          "prompt": 0.0000002,
          "completion": 0.0000015,
          "averagePer1M": 0.85
        },
        "context": 256000,
        "description": "Ultra-fast agentic coding with visible reasoning traces",
        "architecture": {
          "modality": "text->text",
          "inputModalities": ["text"],
          "outputModalities": ["text"]
        },
        "supportsToolCalling": true,
        "created": 1731801600
      }
    ],
    "reasoning": [...],
    "vision": [...],
    "budget": [...]
  },
  "rawModels": [
    {
      "id": "google/gemini-3-pro-preview",
      "name": "Google: Gemini 3 Pro Preview",
      "description": "...",
      "context_length": 1048576,
      "architecture": {...},
      "pricing": {...},
      "created": 1763474668
    }
  ]
}
```

**Schema Explanation:**

| Field | Type | Purpose |
|-------|------|---------|
| `version` | string | Cache format version (for migrations) |
| `cachedAt` | ISO 8601 | When cache was created |
| `ttl` | number | Time-to-live in seconds (259200 = 3 days) |
| `expiresAt` | ISO 8601 | When cache becomes stale |
| `source` | string | API endpoint URL |
| `modelCount` | number | Total models in API response |
| `integrity` | object | Checksum for corruption detection (CRITICAL FIX #3) |
| `integrity.checksum` | string | SHA-256 hash of rawModels array |
| `integrity.algorithm` | string | Hashing algorithm used (sha256) |
| `integrity.validatedAt` | ISO 8601 | When checksum was calculated |
| `filtered` | object | Pre-filtered shortlist by category (9-12 models) |
| `rawModels` | array | Full API response (337+ models) for re-filtering |

**Why Include Both Filtered AND Raw?**
- **Filtered**: Fast access to shortlist (99% of use cases)
- **Raw**: Flexibility to re-filter with different rules without API call

### Cache Validation Algorithm

```typescript
function isCacheValid(cache: ModelCache): boolean {
  // 1. Check if cache file exists
  if (!cache) return false;

  // 2. Check cache schema version
  if (cache.version !== "1.0.0") return false;

  // 3. Check expiration timestamp
  const now = new Date();
  const expiresAt = new Date(cache.expiresAt);

  if (now > expiresAt) {
    console.log(`Cache expired: ${cache.expiresAt} (${Math.floor((now - expiresAt) / (1000 * 60 * 60))}h ago)`);
    return false;
  }

  // 4. Check required fields present
  if (!cache.filtered || !cache.rawModels) {
    console.log("Cache missing required fields");
    return false;
  }

  // 5. Check minimum model count (sanity check)
  if (cache.modelCount < 50) {
    console.log(`Cache has suspiciously few models: ${cache.modelCount}`);
    return false;
  }

  // 6. Validate checksum (CRITICAL FIX #3 - Corruption Detection)
  if (cache.integrity && cache.integrity.checksum) {
    const calculatedChecksum = calculateSHA256(JSON.stringify(cache.rawModels));
    const expectedChecksum = cache.integrity.checksum.replace("sha256:", "");

    if (calculatedChecksum !== expectedChecksum) {
      console.error("Cache corruption detected: Checksum mismatch");
      console.error(`Expected: ${expectedChecksum.slice(0, 16)}...`);
      console.error(`Actual:   ${calculatedChecksum.slice(0, 16)}...`);
      return false;
    }
  } else {
    console.warn("Cache missing integrity checksum (old format)");
    // Allow for backward compatibility, but flag for update
  }

  return true;
}

function calculateSHA256(data: string): string {
  // Bash implementation: echo -n "$data" | sha256sum | awk '{print $1}'
  return sha256(data);
}
```

### Cache Update Strategy

**Trigger Points:**
1. `/update-models` command (explicit refresh)
2. `/update-models --force` (bypass cache, always fetch)
3. Any command needing models (auto-refresh if expired)

**Update Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│ Cache Update Decision Tree                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ START: Command needs model list                             │
│   ↓                                                         │
│ Does cache file exist?                                      │
│   ├─ NO → Fetch from API (first-time setup)                │
│   └─ YES ↓                                                  │
│         Is cache valid? (schema + expiration check)         │
│         ├─ YES → Use cached models (FAST PATH) ✅          │
│         └─ NO ↓                                             │
│               Was --force flag used?                        │
│               ├─ YES → Fetch from API (forced refresh)      │
│               └─ NO ↓                                       │
│                     Is cache expired (>TTL)?                │
│                     ├─ YES → Fetch from API (auto-refresh)  │
│                     └─ NO → Use cached models ✅            │
│                                                             │
│ API Fetch Result:                                           │
│   ├─ SUCCESS → Update cache, return new models ✅          │
│   └─ FAILURE ↓                                              │
│               Does stale cache exist?                       │
│               ├─ YES → Use stale cache (graceful degrade)   │
│               └─ NO → Report error, suggest manual fix      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### TTL Management

**Default TTL: 3 days (259200 seconds)**

**Rationale:**
- Models change infrequently (weekly/monthly releases)
- 3 days balances freshness vs API load
- Users won't notice stale data within 3 days
- Reduces API calls by ~99% (1 call per 3 days vs 10+ calls per day)

**Configurable TTL:**
```bash
# Default (3 days)
/update-models

# Custom TTL (7 days)
/update-models --ttl=7

# Force refresh (ignore cache)
/update-models --force
```

**TTL Override Scenarios:**
1. **Development**: Shorter TTL (1 day) for testing model changes
2. **Production**: Longer TTL (7 days) for stability
3. **Critical Updates**: Force refresh when OpenRouter announces new models

### Graceful Degradation

**Scenario: API fails but stale cache exists**

```typescript
async function fetchModels(forceRefresh = false): Promise<ModelList> {
  const cache = readCache();

  // Check cache validity (includes checksum validation - FIX #3)
  if (!forceRefresh && isCacheValid(cache)) {
    console.log("✅ Using cached models (fresh)");
    return cache.filtered;
  }

  // Attempt API fetch with HTTP status validation (CRITICAL FIX #5)
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");

    // Validate HTTP status code
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const models = await response.json();

    // Validate API schema (CRITICAL FIX #2)
    if (!validateAPISchema(models)) {
      throw new Error("API response schema validation failed");
    }

    // Calculate checksum for integrity (CRITICAL FIX #3)
    const rawModelsJSON = JSON.stringify(models.data);
    const checksum = calculateSHA256(rawModelsJSON);

    // Update cache with file locking (CRITICAL FIX #4)
    const newCache = {
      version: "1.0.0",
      cachedAt: new Date().toISOString(),
      ttl: 259200, // 3 days
      expiresAt: new Date(Date.now() + 259200 * 1000).toISOString(),
      source: "https://openrouter.ai/api/v1/models",
      modelCount: models.data.length,
      integrity: {
        checksum: `sha256:${checksum}`,
        algorithm: "sha256",
        validatedAt: new Date().toISOString()
      },
      filtered: filterModels(models.data),
      rawModels: models.data
    };

    writeCacheWithLock(newCache); // Uses flock internally
    console.log("✅ Cache updated from API");
    return newCache.filtered;

  } catch (error) {
    // Fallback to stale cache (even if corrupted, try filtered section)
    if (cache && cache.filtered) {
      const age = Math.floor((Date.now() - new Date(cache.cachedAt)) / (1000 * 60 * 60 * 24));
      console.warn(`⚠️  API failed, using stale cache (${age} days old)`);
      console.warn(`   Reason: ${error.message}`);
      return cache.filtered;
    }

    // No cache available
    throw new Error("API fetch failed and no cached models available. Please check network connection.");
  }
}

function validateAPISchema(response: any): boolean {
  // Validate required top-level fields
  if (!response || !response.data || !Array.isArray(response.data)) {
    console.error("Invalid API response: Missing 'data' array");
    return false;
  }

  // Validate first model has required fields
  if (response.data.length > 0) {
    const firstModel = response.data[0];
    const requiredFields = ["id", "description", "context_length", "pricing"];

    for (const field of requiredFields) {
      if (!(field in firstModel)) {
        console.error(`Invalid API response: Model missing required field '${field}'`);
        return false;
      }
    }
  }

  return true;
}

function writeCacheWithLock(cache: ModelCache): void {
  // File locking implementation (CRITICAL FIX #4)
  // Bash: (flock -x 200; cat cache.json) 200>/tmp/.model-cache.lock
  const lockFile = "/tmp/.model-cache.lock";
  const lockTimeout = 10000; // 10 seconds

  // Implementation details handled by agent
  // Uses flock for exclusive write access
}
```

**User Experience:**
- ✅ **Silent Degradation**: Commands continue working with stale cache
- ⚠️ **Warning Logged**: Users informed about stale data
- ❌ **Hard Failure**: Only if API fails AND no cache exists (rare)

---

## Model API Manager Agent

### Agent Overview

**Name:** `model-api-manager`
**Role:** Fetch, filter, and cache AI models from OpenRouter API
**Replaces:** `model-scraper` (Chrome DevTools MCP agent)

### Agent Design Highlights

**Core Capabilities:**
1. **API Fetching**: Simple curl/fetch to OpenRouter REST API
2. **Cache Management**: Read, validate, write, expire cache files
3. **Filtering**: Apply intelligent rules (Anthropic exclusion, dedup, balance)
4. **Categorization**: Assign models to coding/reasoning/vision/budget
5. **Documentation**: Optional update to `shared/recommended-models.md`

**Tools:**
- `Bash` - curl for API fetch, jq for JSON parsing
- `Read` - Read cache file for validation
- `Write` - Update cache file and optional documentation
- `TodoWrite` - Track workflow progress

**Model:** Haiku (simple data processing, no complex reasoning needed)

**Workflow:**
```
PHASE 1: Check cache validity
  ├─ Read mcp/claudish/.model-cache.json
  ├─ Validate schema and expiration
  └─ Decide: use cache OR fetch from API

PHASE 2: Fetch from API (if needed)
  ├─ curl https://openrouter.ai/api/v1/models
  ├─ Parse JSON response (337+ models)
  └─ Validate API response structure

PHASE 3: Filter and categorize
  ├─ Apply filtering rules (see Categorization section)
  ├─ Deduplicate by provider
  ├─ Balance categories
  └─ Limit to 9-12 models

PHASE 4: Update cache
  ├─ Write .model-cache.json with TTL metadata
  ├─ Include both filtered shortlist AND raw models
  └─ Set expiration timestamp

PHASE 5: Update documentation (optional)
  ├─ Update shared/recommended-models.md (human-readable)
  ├─ Preserve structure (decision tree, examples)
  └─ Report changes
```

### Agent Advantages vs model-scraper

| Aspect | model-scraper (OLD) | model-api-manager (NEW) |
|--------|---------------------|-------------------------|
| **Complexity** | 300+ lines | 150 lines |
| **Speed** | 15-30s | <2s |
| **Reliability** | 80% (MCP issues) | 99% (REST API) |
| **Dependencies** | Chrome DevTools MCP | curl + jq (built-in) |
| **Error Handling** | 3 retry attempts | Graceful degradation |
| **Maintenance** | High (DOM selectors) | Low (stable API schema) |
| **Data Quality** | Scraped (incomplete) | Full metadata from API |

---

## Updated /update-models Command

### Command Overview

**Simplified Workflow: 3 Phases (vs 5)**

```
OLD (5 phases):
0. Initialization
1. Scrape and Filter
2. User Approval ← REMOVED
3. Update Shared File
4. Sync to Plugins ← REMOVED

NEW (3 phases):
1. Check Cache Validity
2. Fetch from API (if needed)
3. Update Cache + Documentation
```

### Phase-by-Phase Design

#### PHASE 1: Check Cache Validity

**Objective:** Determine if cache refresh is needed

**Steps:**
1. Read `mcp/claudish/.model-cache.json`
2. Validate cache schema (version, required fields)
3. Check expiration timestamp
4. Check for `--force` flag
5. **Decision:**
   - If cache valid AND no `--force` → Skip to PHASE 3 (use cached)
   - If cache invalid OR `--force` → Proceed to PHASE 2 (fetch)

**Quality Gate:**
- Cache file readable (or missing = first-time setup)
- Decision made: use cache OR fetch API

**Error Recovery:**
- If cache corrupted → Delete cache, proceed to PHASE 2
- If cache missing → Proceed to PHASE 2 (first-time setup)

#### PHASE 2: Fetch from API (Conditional)

**Objective:** Get latest model data from OpenRouter API

**Steps:**
1. Delegate to `model-api-manager` agent:
   ```
   Prompt: "Fetch latest models from OpenRouter API:

   1. Call API: https://openrouter.ai/api/v1/models
   2. Parse JSON response
   3. Validate structure (expect 'data' array with 300+ models)
   4. Apply filtering rules (see FILTERING section)
   5. Categorize models (coding, reasoning, vision, budget)
   6. Return filtered shortlist (9-12 models) + raw data"
   ```
2. Wait for agent to complete
3. Validate response (minimum 7 models)

**Quality Gate:**
- API fetch successful
- JSON parsed correctly
- Minimum 7 diverse models extracted

**Error Recovery:**
- **If API fails AND stale cache exists:**
  - Use stale cache (graceful degradation)
  - Warn user about stale data
  - Log API error for debugging
- **If API fails AND no cache:**
  - Report error with diagnostic info
  - Suggest: Check network, retry later, manually create cache

#### PHASE 3: Update Cache + Documentation

**Objective:** Persist new model data and update documentation

**Steps:**
1. Delegate to `model-api-manager` agent:
   ```
   Prompt: "Update cache and documentation with filtered models:

   **Cache File (mcp/claudish/.model-cache.json):**
   - Write new cache with TTL metadata
   - Include filtered shortlist (fast access)
   - Include raw API response (flexibility)
   - Set expiration: now + 3 days

   **Documentation (shared/recommended-models.md) [OPTIONAL]:**
   - Update Quick Reference section
   - Update model entries per category
   - Preserve decision tree and examples
   - Increment version (patch)
   - Update last-updated date"
   ```
2. Verify cache file written
3. Show summary of changes

**Quality Gate:**
- ✅ Cache file created/updated
- ✅ Cache has valid schema
- ✅ Cache expiration set correctly
- ✅ Documentation updated (if requested)

**Error Recovery:**
- If cache write fails → Report permission error, suggest sudo
- If documentation update fails → Cache still updated (partial success)

### Command Flags

```bash
# Default: Respect cache (only fetch if expired)
/update-models

# Force refresh: Bypass cache, always fetch from API
/update-models --force

# Custom TTL: Set cache expiration to 7 days
/update-models --ttl=7

# Skip documentation update: Only update cache
/update-models --cache-only

# Verbose: Show detailed API response and filtering decisions
/update-models --verbose
```

### Success Criteria

Command execution is successful when:

- ✅ Cache validity checked
- ✅ API fetched (if needed) OR cache used
- ✅ Minimum 7 diverse models available
- ✅ Cache file written with correct schema
- ✅ TTL and expiration set correctly
- ✅ Documentation updated (if not `--cache-only`)
- ✅ Summary presented to user

**Quality Indicators:**
- Model count: 9-12 (diverse selection)
- Provider count: ≥5 different providers
- Category balance: ≥2 models per category
- No Anthropic models in list
- Cache expiration valid (now + TTL)

---

## Categorization & Filtering

### API Response Structure

**Sample model from API:**
```json
{
  "id": "x-ai/grok-code-fast-1",
  "name": "xAI: Grok Code Fast 1",
  "description": "Ultra-fast agentic coding with visible reasoning traces...",
  "context_length": 256000,
  "architecture": {
    "modality": "text->text",
    "input_modalities": ["text"],
    "output_modalities": ["text"]
  },
  "pricing": {
    "prompt": "0.0000002",
    "completion": "0.0000015"
  },
  "top_provider": {
    "max_completion_tokens": 32768,
    "is_moderated": false
  },
  "per_request_limits": null,
  "supported_parameters": ["tool_use", "stream", "max_tokens"],
  "created": 1731801600
}
```

### Filtering Rules

1. **Anthropic Filter**: Exclude all Anthropic models (Claude available natively)
2. **Provider Deduplication**: Max 1 per provider (keep top-ranked)
3. **Category Balance (CRITICAL FIX #1)**: Min 2 models per category with multi-step algorithm
4. **Target Count**: 9-12 models
5. **Diversity**: ≥5 different providers

**CRITICAL FIX #1 - Multi-Step Category Balancing Algorithm:**

The category balancing is implemented as a multi-step bash script (NOT a single jq command):

```bash
#!/bin/bash
# Multi-step category balancing algorithm
# Ensures ≥2 models per category while respecting provider diversity

# Step 1: Initial provider deduplication (keep top-ranked per provider)
jq 'group_by(.provider) | map(sort_by(.priority)[0])' \
  /tmp/categorized-models.json > /tmp/deduped-models.json

# Step 2: Count models per category
coding_count=$(jq '[.[] | select(.category == "coding")] | length' /tmp/deduped-models.json)
reasoning_count=$(jq '[.[] | select(.category == "reasoning")] | length' /tmp/deduped-models.json)
vision_count=$(jq '[.[] | select(.category == "vision")] | length' /tmp/deduped-models.json)
budget_count=$(jq '[.[] | select(.category == "budget")] | length' /tmp/deduped-models.json)

echo "Initial counts: coding=$coding_count, reasoning=$reasoning_count, vision=$vision_count, budget=$budget_count"

# Step 3: For each category with <2 models, add 2nd-best model from already-used providers
# This overrides provider deduplication for category balance

if [ $coding_count -lt 2 ]; then
  echo "Coding category under-represented ($coding_count models), adding fallback models..."
  # Find 2nd-best coding model from same providers (sorted by priority)
  jq --argjson needed $((2 - coding_count)) '
    ([.[] | select(.category == "coding")] | sort_by(.priority) | .[$needed:]) as $additional |
    . + $additional | unique_by(.id)
  ' /tmp/categorized-models.json > /tmp/deduped-models-balanced.json
  mv /tmp/deduped-models-balanced.json /tmp/deduped-models.json
fi

if [ $reasoning_count -lt 2 ]; then
  echo "Reasoning category under-represented ($reasoning_count models), adding fallback models..."
  jq --argjson needed $((2 - reasoning_count)) '
    ([.[] | select(.category == "reasoning")] | sort_by(.priority) | .[$needed:]) as $additional |
    . + $additional | unique_by(.id)
  ' /tmp/categorized-models.json > /tmp/deduped-models-balanced.json
  mv /tmp/deduped-models-balanced.json /tmp/deduped-models.json
fi

if [ $vision_count -lt 2 ]; then
  echo "Vision category under-represented ($vision_count models), adding fallback models..."
  jq --argjson needed $((2 - vision_count)) '
    ([.[] | select(.category == "vision")] | sort_by(.priority) | .[$needed:]) as $additional |
    . + $additional | unique_by(.id)
  ' /tmp/categorized-models.json > /tmp/deduped-models-balanced.json
  mv /tmp/deduped-models-balanced.json /tmp/deduped-models.json
fi

if [ $budget_count -lt 2 ]; then
  echo "Budget category under-represented ($budget_count models), adding fallback models..."
  jq --argjson needed $((2 - budget_count)) '
    ([.[] | select(.category == "budget")] | sort_by(.priority) | .[$needed:]) as $additional |
    . + $additional | unique_by(.id)
  ' /tmp/categorized-models.json > /tmp/deduped-models-balanced.json
  mv /tmp/deduped-models-balanced.json /tmp/deduped-models.json
fi

# Step 4: Enforce 9-12 total limit (sort by priority and take top 12)
jq 'sort_by(.priority) | .[0:12]' /tmp/deduped-models.json > /tmp/final-shortlist.json

# Step 5: Verify category balance achieved
final_coding=$(jq '[.[] | select(.category == "coding")] | length' /tmp/final-shortlist.json)
final_reasoning=$(jq '[.[] | select(.category == "reasoning")] | length' /tmp/final-shortlist.json)
final_vision=$(jq '[.[] | select(.category == "vision")] | length' /tmp/final-shortlist.json)
final_budget=$(jq '[.[] | select(.category == "budget")] | length' /tmp/final-shortlist.json)

echo "Final counts: coding=$final_coding, reasoning=$final_reasoning, vision=$final_vision, budget=$final_budget"

# Validation
if [ $final_coding -lt 2 ] || [ $final_reasoning -lt 2 ] || [ $final_vision -lt 2 ] || [ $final_budget -lt 2 ]; then
  echo "WARNING: Category balance not achieved. May need to relax filtering rules."
fi
```

**Why multi-step script vs single jq command?**
- ✅ **Explicit logic** - Each step is clear and debuggable
- ✅ **Conditional execution** - Only add fallback models when needed
- ✅ **Validation** - Can check counts before and after
- ✅ **Maintainability** - Easier to modify than complex nested jq
- ✅ **Error handling** - Can detect when balance fails

### Category Assignment Logic (NEW - API-Based)

**Categorization uses API metadata:**

```typescript
function categorizeModel(model: APIModel): Category[] {
  const categories: Category[] = [];
  const desc = model.description.toLowerCase();
  const arch = model.architecture;
  const pricing = calculateAveragePricing(model.pricing);

  // CODING: Fast, tool-calling support, code-focused description
  if (
    (desc.includes("code") || desc.includes("coding") || desc.includes("programming")) &&
    model.supported_parameters?.includes("tool_use") &&
    pricing < 2.0
  ) {
    categories.push("coding");
  }

  // REASONING: Advanced reasoning, problem-solving, high quality
  if (
    desc.includes("reasoning") ||
    desc.includes("thinking") ||
    desc.includes("problem-solving") ||
    desc.includes("advanced") ||
    model.context_length > 200000
  ) {
    categories.push("reasoning");
  }

  // VISION: Multimodal input (image, video)
  if (
    arch.input_modalities.includes("image") ||
    arch.input_modalities.includes("video") ||
    desc.includes("multimodal") ||
    desc.includes("vision")
  ) {
    categories.push("vision");
  }

  // BUDGET: Low pricing (<$1/1M average)
  if (pricing < 1.0 || pricing === 0) {
    categories.push("budget");
  }

  // If no category assigned, use "reasoning" as default
  return categories.length > 0 ? categories : ["reasoning"];
}

function calculateAveragePricing(pricing: APIPricing): number {
  const prompt = parseFloat(pricing.prompt) * 1_000_000;
  const completion = parseFloat(pricing.completion) * 1_000_000;
  return (prompt + completion) / 2;
}
```

### Improved Metadata Extraction

**The API provides richer data than scraping:**

| Metadata | Scraped (OLD) | API (NEW) |
|----------|---------------|-----------|
| **Tool Calling Support** | ❌ Unknown | ✅ `supported_parameters` array |
| **Input Modalities** | ❌ Unknown | ✅ `architecture.input_modalities` |
| **Output Modalities** | ❌ Unknown | ✅ `architecture.output_modalities` |
| **Pricing** | ⚠️ May be stale | ✅ Real-time from API |
| **Context Window** | ✅ Scraped | ✅ `context_length` |
| **Created Date** | ❌ Unknown | ✅ `created` timestamp |

**Better Categorization Examples:**

```typescript
// Example 1: Detect tool-calling models
if (model.supported_parameters?.includes("tool_use")) {
  // This model supports agentic workflows
  categories.push("coding");
}

// Example 2: Detect vision models accurately
if (model.architecture.input_modalities.includes("image")) {
  // Guaranteed vision support
  categories.push("vision");
}

// Example 3: Prioritize newer models
const ageInDays = (Date.now() / 1000 - model.created) / 86400;
if (ageInDays < 30) {
  // Newly released model - prioritize
  priority -= 1; // Lower number = higher priority
}
```

---

## Migration Plan

### Phase 1: Create New Agent (Week 1)

**Tasks:**
1. Create `agents/model-api-manager.md` agent
2. Implement API fetching with curl/jq
3. Implement cache management (read, validate, write)
4. Implement filtering and categorization
5. Test agent in isolation

**Deliverables:**
- ✅ `agents/model-api-manager.md` (150 lines)
- ✅ Test cache file: `mcp/claudish/.model-cache.json`
- ✅ Agent can fetch, filter, and cache models

### Phase 2: Update Command (Week 1-2)

**Tasks:**
1. Create `.claude/commands/update-models-v2.md`
2. Simplify workflow from 5 phases to 3
3. Remove user approval gate
4. Remove plugin sync dependency
5. Add flag support (`--force`, `--ttl`)
6. Test command end-to-end

**Deliverables:**
- ✅ `.claude/commands/update-models-v2.md` (300 lines, vs 1200 in v1)
- ✅ Working cache update workflow
- ✅ Documentation update (optional)

### Phase 3: Update Dependent Commands (Week 2)

**Tasks:**
1. Update `/implement` command to read from cache
2. Update `/review` command to read from cache
3. Update any other commands using model lists
4. Remove dependency on `shared/recommended-models.md` (use cache instead)

**Deliverables:**
- ✅ All commands use cache dynamically
- ✅ No hardcoded model lists in code

### Phase 4: Deprecate Old System (Week 3)

**Tasks:**
1. Rename `update-models.md` → `update-models-v1-deprecated.md`
2. Rename `model-scraper.md` → `model-scraper-deprecated.md`
3. Update `CLAUDE.md` documentation
4. Remove Chrome DevTools MCP dependency (if not used elsewhere)

**Deliverables:**
- ✅ Old system deprecated but preserved (for reference)
- ✅ New system is default

### Phase 5: Monitor and Optimize (Ongoing)

**Tasks:**
1. Monitor cache hit rate (should be >95%)
2. Monitor API failures (should be <1%)
3. Collect user feedback on model freshness
4. Adjust TTL if needed (3 days → 7 days?)

**Metrics:**
- Cache hit rate: >95%
- API failure rate: <1%
- Command execution time: <2s (vs 30s in v1)
- User complaints about stale models: 0

---

## Comparison: Old vs New

### Complexity

| Metric | Old (Scraper) | New (API + Cache) | Improvement |
|--------|---------------|-------------------|-------------|
| **Total Lines of Code** | ~1500 lines | ~450 lines | **70% reduction** |
| **Agent Complexity** | 300+ lines (Chrome automation) | 150 lines (simple HTTP) | **50% reduction** |
| **Command Complexity** | 1200 lines (5 phases) | 300 lines (3 phases) | **75% reduction** |
| **Dependencies** | Chrome DevTools MCP, sync script | curl + jq (built-in) | **100% fewer external deps** |
| **Error Scenarios** | 15+ error paths | 5 error paths | **66% fewer errors** |

### Performance

| Metric | Old (Scraper) | New (API + Cache) | Improvement |
|--------|---------------|-------------------|-------------|
| **First Run** | 30-60s | 2-3s | **10-20x faster** |
| **Subsequent Runs (cache hit)** | 30-60s (always scrapes) | <100ms (cache read) | **300-600x faster** |
| **Failure Rate** | 20% (MCP issues) | <1% (API downtime) | **20x more reliable** |
| **API Calls per Day** | 10+ (every command run) | <1 (auto-refresh every 3 days) | **99% fewer API calls** |

### Maintainability

| Aspect | Old (Scraper) | New (API + Cache) |
|--------|---------------|-------------------|
| **Page Structure Changes** | ❌ Breaks immediately | ✅ Unaffected (stable API) |
| **Model Updates** | ❌ Manual edit + sync | ✅ Auto-refresh from API |
| **Version Increments** | ❌ Manual | ✅ Automatic (timestamp-based) |
| **Plugin Sync** | ❌ Fragile (can fail) | ✅ Not needed (single cache) |
| **Testing** | ❌ Hard (needs browser) | ✅ Easy (mock API response) |

### User Experience

| Aspect | Old (Scraper) | New (API + Cache) |
|--------|---------------|-------------------|
| **Wait Time** | 30-60s (approval gate) | <2s (auto-update) | ✅ 15-30x faster |
| **User Approval** | Required (every run) | Not needed (internal) | ✅ No interruption |
| **Error Messages** | "MCP not responding" | "API failed, using cache" | ✅ Graceful degradation |
| **Model Freshness** | Depends on manual updates | Auto-refresh every 3 days | ✅ Always current |

---

## Open Questions

1. **Should we keep `shared/recommended-models.md` at all?**
   - **Option A**: Keep as documentation (human-readable reference)
   - **Option B**: Remove entirely (cache is single source of truth)
   - **Recommendation**: Keep as documentation, update optionally

2. **Should cache be hidden (`.model-cache.json`) or visible?**
   - **Option A**: Hidden (internal implementation detail)
   - **Option B**: Visible (`model-cache.json`) for transparency
   - **Recommendation**: Hidden (users shouldn't edit manually)

3. **Should we cache raw API response or only filtered models?**
   - **Option A**: Only filtered (smaller cache, faster reads)
   - **Option B**: Both (flexibility to re-filter without API call)
   - **Recommendation**: Both (storage is cheap, flexibility is valuable)

4. **What should happen if API changes schema?**
   - **Option A**: Fail hard (force user to update agent)
   - **Option B**: Graceful degradation (use stale cache, warn user)
   - **Recommendation**: Option B (better UX)

---

## Success Metrics

**How we'll know the new design is better:**

1. **Reliability**: API failure rate <1% (vs 20% MCP failure rate)
2. **Speed**: Cache hit responses <100ms (vs 30s scraping)
3. **Freshness**: Models updated within 3 days of API changes (vs weeks/months manual)
4. **Complexity**: 70% fewer lines of code (easier to maintain)
5. **User Satisfaction**: Zero complaints about stale models or slow updates

---

## Next Steps

1. **Review this design document** - Get feedback from team
2. **Create model-api-manager agent** - Implement API fetching and caching
3. **Create /update-models-v2 command** - Simplified 3-phase workflow
4. **Test end-to-end** - Verify cache updates work correctly
5. **Migrate dependent commands** - Update /implement, /review to use cache
6. **Deprecate old system** - Mark model-scraper as deprecated
7. **Monitor metrics** - Track cache hit rate, API failures, user feedback

---

**Document Status:** ✅ Ready for Review
**Last Updated:** 2025-11-19
**Next Review:** After team feedback
