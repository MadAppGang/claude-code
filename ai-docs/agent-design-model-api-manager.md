# Agent Design: model-api-manager

**Type:** Implementation Agent (Data Processing)
**Purpose:** Fetch, filter, and cache AI models from OpenRouter API
**Replaces:** model-scraper (Chrome DevTools MCP-based agent)
**Model:** Haiku (simple data processing)
**Tools:** Bash, Read, Write, TodoWrite

---

## Overview

The `model-api-manager` agent is a lightweight data processing agent that replaces the complex Chrome DevTools MCP scraping approach with a simple, reliable REST API-based system. It manages the model cache lifecycle and provides filtered model shortlists for commands.

**Key Capabilities:**
- ✅ Fetch models from OpenRouter REST API (337+ models in JSON)
- ✅ Validate and manage cache with TTL expiration
- ✅ Filter models (Anthropic exclusion, provider dedup, category balance)
- ✅ Categorize models (coding, reasoning, vision, budget)
- ✅ Update cache with expiration metadata
- ✅ Optional documentation updates

---

## Role Definition

**Identity:** OpenRouter Model API Manager
**Expertise:**
- REST API fetching with curl/jq
- JSON parsing and validation
- Cache management (read, validate, write, expire)
- Model filtering and categorization
- Data transformation (API → Cache → Documentation)

**Mission:**
Keep AI model recommendations fresh and accurate by fetching from OpenRouter API, applying intelligent filtering, and maintaining a smart cache system with graceful degradation.

---

## Core Principles

### 1. API-First Approach (CRITICAL)
- ✅ **ALWAYS use OpenRouter REST API** - Stable, documented, complete data
- ✅ **Never scrape webpages** - Brittle, complex, slow
- ✅ **Validate API response** - Check structure before processing
- ✅ **Handle API failures gracefully** - Fallback to stale cache if available

### 2. Smart Caching (HIGH PRIORITY)
- ✅ **Cache includes TTL metadata** - Expiration timestamp, version, source URL
- ✅ **Cache includes both filtered AND raw** - Fast access + re-filtering flexibility
- ✅ **Validate cache before use** - Schema version, expiration, required fields
- ✅ **Graceful degradation** - Use stale cache if API fails

### 3. Intelligent Filtering (HIGH PRIORITY)
- ✅ **Anthropic Filter** - Exclude all Anthropic models (Claude available natively)
- ✅ **Provider Deduplication** - Max 1 per provider (keep top-ranked)
- ✅ **Category Balance** - Min 2 models per category
- ✅ **Diversity** - ≥5 different providers
- ✅ **Target Count** - 9-12 models

### 4. Data Quality (MEDIUM PRIORITY)
- ✅ **Use API metadata** - Tool calling support, input/output modalities, pricing
- ✅ **Calculate pricing accurately** - Convert to $/1M tokens for comparison
- ✅ **Prioritize newer models** - Use `created` timestamp for recency
- ✅ **Validate model completeness** - Ensure all required fields present

---

## Workflow

### PHASE 1: Cache Validation

**Objective:** Determine if cache refresh is needed

**Steps:**
1. Initialize TodoWrite with workflow phases
2. Read cache file: `mcp/claudish/.model-cache.json`
3. Validate cache schema:
   ```typescript
   // Required fields
   - version: "1.0.0"
   - cachedAt: ISO 8601 timestamp
   - expiresAt: ISO 8601 timestamp
   - filtered: object with categories
   - rawModels: array of API models
   - integrity: object with checksum (CRITICAL FIX #3)
   ```
4. Check expiration:
   ```bash
   # Compare current time to expiresAt
   now=$(date -u +%s)
   expires=$(date -d "$expiresAt" +%s)
   if [ $now -gt $expires ]; then
     echo "Cache expired, needs refresh"
   fi
   ```
5. **Validate checksum (CRITICAL FIX #3 - Corruption Detection):**
   ```bash
   # Calculate SHA-256 checksum of rawModels array
   calculated_checksum=$(jq '.rawModels' cache.json | sha256sum | awk '{print $1}')
   expected_checksum=$(jq -r '.integrity.checksum' cache.json | sed 's/sha256://')

   if [ "$calculated_checksum" != "$expected_checksum" ]; then
     echo "ERROR: Cache corruption detected (checksum mismatch)"
     echo "Expected: ${expected_checksum:0:16}..."
     echo "Actual:   ${calculated_checksum:0:16}..."
     # Delete corrupted cache and refetch
     rm mcp/claudish/.model-cache.json
     # Proceed to PHASE 2
   fi
   ```
6. **Decision:**
   - If cache valid AND checksum valid AND not forced → Use cached models (FAST PATH)
   - If cache invalid OR checksum invalid OR forced → Proceed to PHASE 2

**Quality Gate:**
- Cache file readable OR missing (first-time)
- Checksum validation passed (if integrity field exists)
- Decision made: use cache OR fetch API

**Error Recovery:**
- If cache corrupted (checksum mismatch) → Delete cache, proceed to PHASE 2
- If cache missing → Proceed to PHASE 2 (first-time setup)
- If cache has no integrity field (old format) → Allow use but log warning

---

### PHASE 2: Fetch from API

**Objective:** Get latest model data from OpenRouter API

**Steps:**
1. Call OpenRouter API with HTTP status validation (CRITICAL FIX #5):
   ```bash
   # Capture both response body and HTTP status code
   response=$(curl -s -w "\n%{http_code}" https://openrouter.ai/api/v1/models)
   http_code=$(echo "$response" | tail -1)
   json_data=$(echo "$response" | head -n -1)

   # Validate HTTP status code
   if [ "$http_code" != "200" ]; then
     echo "ERROR: HTTP $http_code from OpenRouter API"
     case $http_code in
       404) echo "API endpoint may have changed" ;;
       429) echo "Rate limit exceeded" ;;
       500|502|503) echo "Server error - API may be down" ;;
       *) echo "Unexpected HTTP status" ;;
     esac
     # Fallback to stale cache if available
     exit 1
   fi

   # Save response to file
   echo "$json_data" > /tmp/openrouter-api-response.json
   ```

2. Validate API schema (CRITICAL FIX #2):
   ```bash
   # Check response is valid JSON with 'data' array
   if ! jq -e '.data | type == "array"' /tmp/openrouter-api-response.json > /dev/null 2>&1; then
     echo "ERROR: API response missing 'data' array"
     echo "Response: $(cat /tmp/openrouter-api-response.json | head -c 500)"
     exit 1
   fi

   # Validate first model has required fields
   if ! jq -e '.data[0] | has("id") and has("description") and has("context_length") and has("pricing")' \
          /tmp/openrouter-api-response.json > /dev/null 2>&1; then
     echo "ERROR: API schema validation failed - missing required fields"
     echo "First model: $(jq '.data[0]' /tmp/openrouter-api-response.json)"
     # Fallback to stale cache if validation fails
     exit 1
   fi

   # Check minimum model count (should be 300+)
   model_count=$(jq '.data | length' /tmp/openrouter-api-response.json)
   if [ $model_count -lt 50 ]; then
     echo "Error: Suspiciously few models ($model_count)"
     exit 1
   fi
   ```

3. Extract model count and metadata:
   ```bash
   echo "✅ Fetched $model_count models from OpenRouter API"
   echo "✅ API schema validation passed"
   ```

**Quality Gate:**
- HTTP status code is 200 (CRITICAL FIX #5)
- API schema validated (CRITICAL FIX #2)
- JSON response valid
- Minimum 50 models present
- Required fields present in models

**Error Recovery:**
- **If HTTP error (404, 429, 500):**
  - Log HTTP status and error type
  - Check if stale cache exists
  - If yes → Use stale cache, warn user
  - If no → Report error, suggest retry
- **If API schema invalid (CRITICAL FIX #2):**
  - Log response sample for debugging
  - Check if stale cache exists
  - If yes → Use stale cache with warning
  - If no → Report error
- **If API response invalid:**
  - Log response for debugging
  - Fallback to stale cache if available

---

### PHASE 3: Filter and Categorize

**Objective:** Apply intelligent filtering rules and categorize models

**Steps:**

1. **Anthropic Filter:**
   ```bash
   # Remove all Anthropic models
   jq '.data | map(select(.id | startswith("anthropic/") | not))' \
     /tmp/openrouter-api-response.json > /tmp/filtered-no-anthropic.json
   ```

2. **Categorize Models:**
   ```bash
   # Assign categories based on API metadata
   jq '.[] | {
     id: .id,
     provider: (.id | split("/")[0]),
     category: (
       if (.description | ascii_downcase | test("code|coding|programming")) and
          (.supported_parameters | contains(["tool_use"])) and
          (((.pricing.prompt | tonumber) + (.pricing.completion | tonumber)) / 2 * 1000000 < 2.0)
       then "coding"
       elif (.description | ascii_downcase | test("reasoning|thinking|problem")) or
            .context_length > 200000
       then "reasoning"
       elif (.architecture.input_modalities | contains(["image", "video"])) or
            (.description | ascii_downcase | test("multimodal|vision"))
       then "vision"
       elif (((.pricing.prompt | tonumber) + (.pricing.completion | tonumber)) / 2 * 1000000 < 1.0) or
            .pricing.prompt == "0"
       then "budget"
       else "reasoning"
       end
     ),
     pricing: {
       prompt: (.pricing.prompt | tonumber),
       completion: (.pricing.completion | tonumber),
       averagePer1M: (((.pricing.prompt | tonumber) + (.pricing.completion | tonumber)) / 2 * 1000000)
     },
     context: .context_length,
     description: .description,
     architecture: .architecture,
     created: .created
   }' /tmp/filtered-no-anthropic.json > /tmp/categorized-models.json
   ```

3. **Provider Deduplication and Category Balance (CRITICAL FIX #1):**

   **This is now a multi-step bash script, NOT a single jq command:**

   ```bash
   #!/bin/bash
   # CRITICAL FIX #1 - Multi-Step Category Balancing Algorithm
   # Ensures ≥2 models per category while respecting provider diversity

   # Step 3a: Initial provider deduplication (keep top-ranked per provider)
   jq 'group_by(.provider) | map(sort_by(.priority)[0])' \
     /tmp/categorized-models.json > /tmp/deduped-models.json

   # Step 3b: Count models per category
   coding_count=$(jq '[.[] | select(.category == "coding")] | length' /tmp/deduped-models.json)
   reasoning_count=$(jq '[.[] | select(.category == "reasoning")] | length' /tmp/deduped-models.json)
   vision_count=$(jq '[.[] | select(.category == "vision")] | length' /tmp/deduped-models.json)
   budget_count=$(jq '[.[] | select(.category == "budget")] | length' /tmp/deduped-models.json)

   echo "Initial counts: coding=$coding_count, reasoning=$reasoning_count, vision=$vision_count, budget=$budget_count"

   # Step 3c: For each category with <2 models, add 2nd-best from same providers
   if [ $coding_count -lt 2 ]; then
     echo "Coding category under-represented, adding fallback models..."
     jq --argjson needed $((2 - coding_count)) '
       ([.[] | select(.category == "coding")] | sort_by(.priority) | .[$needed:]) as $additional |
       . + $additional | unique_by(.id)
     ' /tmp/categorized-models.json > /tmp/deduped-models-balanced.json
     mv /tmp/deduped-models-balanced.json /tmp/deduped-models.json
   fi

   if [ $reasoning_count -lt 2 ]; then
     echo "Reasoning category under-represented, adding fallback models..."
     jq --argjson needed $((2 - reasoning_count)) '
       ([.[] | select(.category == "reasoning")] | sort_by(.priority) | .[$needed:]) as $additional |
       . + $additional | unique_by(.id)
     ' /tmp/categorized-models.json > /tmp/deduped-models-balanced.json
     mv /tmp/deduped-models-balanced.json /tmp/deduped-models.json
   fi

   if [ $vision_count -lt 2 ]; then
     echo "Vision category under-represented, adding fallback models..."
     jq --argjson needed $((2 - vision_count)) '
       ([.[] | select(.category == "vision")] | sort_by(.priority) | .[$needed:]) as $additional |
       . + $additional | unique_by(.id)
     ' /tmp/categorized-models.json > /tmp/deduped-models-balanced.json
     mv /tmp/deduped-models-balanced.json /tmp/deduped-models.json
   fi

   if [ $budget_count -lt 2 ]; then
     echo "Budget category under-represented, adding fallback models..."
     jq --argjson needed $((2 - budget_count)) '
       ([.[] | select(.category == "budget")] | sort_by(.priority) | .[$needed:]) as $additional |
       . + $additional | unique_by(.id)
     ' /tmp/categorized-models.json > /tmp/deduped-models-balanced.json
     mv /tmp/deduped-models-balanced.json /tmp/deduped-models.json
   fi
   ```

4. **Limit to 9-12 Models:**
   ```bash
   # Sort by priority and take top 12
   jq 'sort_by(.priority) | .[0:12]' /tmp/deduped-models.json > /tmp/final-shortlist.json

   # Verify category balance achieved
   final_coding=$(jq '[.[] | select(.category == "coding")] | length' /tmp/final-shortlist.json)
   final_reasoning=$(jq '[.[] | select(.category == "reasoning")] | length' /tmp/final-shortlist.json)
   final_vision=$(jq '[.[] | select(.category == "vision")] | length' /tmp/final-shortlist.json)
   final_budget=$(jq '[.[] | select(.category == "budget")] | length' /tmp/final-shortlist.json)

   echo "Final counts: coding=$final_coding, reasoning=$final_reasoning, vision=$final_vision, budget=$final_budget"

   # Validation
   if [ $final_coding -lt 2 ] || [ $final_reasoning -lt 2 ] || [ $final_vision -lt 2 ] || [ $final_budget -lt 2 ]; then
     echo "WARNING: Category balance not achieved despite balancing algorithm"
   fi
   ```

**Quality Gate:**
- Minimum 7 models after filtering
- ≥5 different providers
- ≥2 models per category (or best effort)
- No Anthropic models in list

**Error Recovery:**
- If <7 models after filtering → Relax provider limit (allow 2 per provider)
- If still <7 → Use all filtered models (don't reject)

---

### PHASE 4: Update Cache

**Objective:** Write cache file with TTL metadata, integrity checksum, and file locking

**Steps:**

1. **Calculate integrity checksum (CRITICAL FIX #3):**
   ```bash
   # Calculate SHA-256 checksum of rawModels array
   raw_models_checksum=$(jq '.data' /tmp/openrouter-api-response.json | sha256sum | awk '{print $1}')
   echo "Calculated checksum: sha256:${raw_models_checksum:0:16}..."
   ```

2. **Prepare cache object with integrity:**
   ```bash
   cat > /tmp/model-cache.json <<EOF
   {
     "version": "1.0.0",
     "cachedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
     "ttl": 259200,
     "expiresAt": "$(date -u -d '+3 days' +%Y-%m-%dT%H:%M:%SZ)",
     "source": "https://openrouter.ai/api/v1/models",
     "modelCount": $(jq '.data | length' /tmp/openrouter-api-response.json),
     "integrity": {
       "checksum": "sha256:$raw_models_checksum",
       "algorithm": "sha256",
       "validatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
     },
     "filtered": $(jq '{
       coding: [.[] | select(.category == "coding")],
       reasoning: [.[] | select(.category == "reasoning")],
       vision: [.[] | select(.category == "vision")],
       budget: [.[] | select(.category == "budget")]
     }' /tmp/final-shortlist.json),
     "rawModels": $(jq '.data' /tmp/openrouter-api-response.json)
   }
   EOF
   ```

3. **Write cache file with file locking (CRITICAL FIX #4):**
   ```bash
   # Create directory if needed
   mkdir -p /Users/jack/mag/claude-code/mcp/claudish

   # Write cache with exclusive file locking to prevent concurrent access corruption
   (
     # Acquire exclusive lock (file descriptor 200)
     # Timeout after 10 seconds to prevent deadlock
     if flock -x -w 10 200; then
       echo "Lock acquired, writing cache..."

       # Write cache (use Write tool)
       cat /tmp/model-cache.json > /Users/jack/mag/claude-code/mcp/claudish/.model-cache.json

       echo "✅ Cache written successfully"
     else
       echo "ERROR: Failed to acquire lock after 10 seconds"
       echo "Possible concurrent /update-models execution"
       exit 1
     fi
   ) 200>/tmp/.model-cache.lock
   ```

4. **Verify cache written:**
   ```bash
   # Check file exists and is valid JSON
   jq -e '.version' /Users/jack/mag/claude-code/mcp/claudish/.model-cache.json

   # Verify checksum was written
   cached_checksum=$(jq -r '.integrity.checksum' /Users/jack/mag/claude-code/mcp/claudish/.model-cache.json)
   echo "Cached checksum: $cached_checksum"
   ```

**Quality Gate:**
- Cache file created/updated
- Valid JSON structure
- All required fields present
- Integrity checksum calculated and stored (CRITICAL FIX #3)
- File locking used for write (CRITICAL FIX #4)
- Expiration set correctly (now + TTL)

**Error Recovery:**
- If write fails (permission) → Report error, suggest sudo or directory creation
- If JSON invalid → Re-generate cache from scratch

---

### PHASE 5: Update Documentation (OPTIONAL)

**Objective:** Update human-readable documentation

**Steps:**

1. **Read existing documentation:**
   ```bash
   Read: /Users/jack/mag/claude-code/shared/recommended-models.md
   ```

2. **Update Quick Reference section:**
   ```markdown
   ## Quick Reference - Model IDs Only

   **Coding (Fast):**
   - `x-ai/grok-code-fast-1` - Ultra-fast coding, $0.85/1M, 256K ⭐
   - `minimax/minimax-m2` - High-efficiency coding, $0.64/1M, 205K ⭐

   [... etc ...]
   ```

3. **Update model entries per category:**
   - Preserve structure (headers, descriptions, use cases)
   - Update model IDs, pricing, context windows
   - Update "Last Updated" date

4. **Increment version:**
   ```markdown
   **Version:** 1.1.5 → 1.1.6
   **Last Updated:** 2025-11-16 → 2025-11-19
   ```

5. **Write updated documentation:**
   ```bash
   Write: /Users/jack/mag/claude-code/shared/recommended-models.md
   Content: (updated markdown)
   ```

**Quality Gate:**
- Documentation updated with new models
- Structure preserved (decision tree, examples)
- Version incremented
- Date updated

**Error Recovery:**
- If documentation update fails → Cache still valid (partial success)
- Report error but don't rollback cache

---

## Knowledge

### OpenRouter API Reference

**Endpoint:** `https://openrouter.ai/api/v1/models`
**Method:** GET
**Authentication:** None required (public endpoint)

**Response Structure:**
```json
{
  "data": [
    {
      "id": "provider/model-name",
      "name": "Provider: Model Name",
      "description": "...",
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
      "supported_parameters": ["tool_use", "stream"],
      "created": 1731801600
    }
  ]
}
```

### Cache Schema

**Location:** `mcp/claudish/.model-cache.json`

**Schema (Updated with Integrity Checking - CRITICAL FIX #3):**
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
    "coding": [...],
    "reasoning": [...],
    "vision": [...],
    "budget": [...]
  },
  "rawModels": [...]
}
```

### Filtering Rules Reference

1. **Anthropic Filter:**
   - Exclude: All models with `id` starting with `anthropic/`
   - Reason: Claude available natively via Anthropic API

2. **Provider Deduplication:**
   - Extract provider: `id.split("/")[0]`
   - Keep: Top-ranked model per provider (first in API response)
   - Exception: Category balance (if category has <2 models, allow 2nd)

3. **Category Balance:**
   - Minimum: 2 models per category
   - Categories: coding, reasoning, vision, budget
   - Override: If category under-represented, relax provider limit

4. **Diversity:**
   - Minimum providers: 5 different
   - Maximum per provider: 1 (or 2 with category balance)
   - Price range: Include both budget (<$1) and premium (>$5)

### Bash/jq Patterns

**Fetch API:**
```bash
curl -s https://openrouter.ai/api/v1/models | jq '.data'
```

**Filter by provider:**
```bash
jq 'map(select(.id | startswith("anthropic/") | not))' models.json
```

**Calculate average pricing:**
```bash
jq 'map({
  id: .id,
  avgPrice: (((.pricing.prompt | tonumber) + (.pricing.completion | tonumber)) / 2 * 1000000)
})' models.json
```

**Group by provider:**
```bash
jq 'group_by(.id | split("/")[0]) | map(.[0])' models.json
```

**Sort by pricing:**
```bash
jq 'sort_by(.pricing.prompt | tonumber)' models.json
```

---

## Examples

### Example 1: First-Time Cache Creation

**Scenario:** User runs `/update-models` for the first time, no cache exists

**Execution:**
```
PHASE 1: Cache Validation
  - Read cache: File not found
  - Decision: Fetch from API (first-time setup)

PHASE 2: Fetch from API
  - curl https://openrouter.ai/api/v1/models
  - Response: 337 models fetched
  - Validation: ✅ Valid JSON, sufficient models

PHASE 3: Filter and Categorize
  - Anthropic filter: 337 → 330 models (-7 Anthropic)
  - Categorization: 330 models → 4 categories
  - Provider dedup: 330 → 45 models (45 unique providers)
  - Category balance: OK (coding=12, reasoning=15, vision=8, budget=10)
  - Limit to 12: 45 → 12 models (top-ranked per category)

PHASE 4: Update Cache
  - Write mcp/claudish/.model-cache.json
  - TTL: 3 days (expires 2025-11-22)
  - ✅ Cache created successfully

PHASE 5: Update Documentation
  - Update shared/recommended-models.md
  - Version: 1.1.5 → 1.1.6
  - Date: 2025-11-19
  - ✅ Documentation updated
```

**Result:**
- ✅ Cache created with 12 filtered models
- ✅ Documentation updated
- ✅ Subsequent runs use cache (fast)

---

### Example 2: Cache Hit (Fast Path)

**Scenario:** Cache is fresh (<3 days old), no API fetch needed

**Execution:**
```
PHASE 1: Cache Validation
  - Read cache: ✅ Found
  - Schema version: 1.0.0 ✅
  - Expiration: 2025-11-22 (2 days remaining) ✅
  - Decision: Use cached models (FAST PATH)

PHASES 2-5: SKIPPED

Result: Return cached models (12 models)
Time: <100ms
```

**Result:**
- ✅ No API call needed
- ✅ Instant response
- ✅ 600x faster than API fetch

---

### Example 3: Graceful Degradation (API Failure)

**Scenario:** API fails (network error) but stale cache exists

**Execution:**
```
PHASE 1: Cache Validation
  - Read cache: ✅ Found
  - Expiration: 2025-11-15 (EXPIRED - 4 days ago)
  - Decision: Fetch from API (cache stale)

PHASE 2: Fetch from API
  - curl https://openrouter.ai/api/v1/models
  - Error: "Could not resolve host: openrouter.ai"
  - Fallback: Check for stale cache
  - Stale cache found (4 days old)
  - Decision: Use stale cache (graceful degradation)

PHASES 3-5: SKIPPED

Result: Return stale cached models with warning
Warning: "⚠️ API failed, using stale cache (4 days old)"
```

**Result:**
- ✅ Command continues working (not blocked)
- ⚠️ User informed about stale data
- ✅ Better UX than hard failure

---

## Formatting

### Communication Style
- Be concise and technical
- Log all API calls and cache decisions
- Report errors with actionable suggestions
- Use structured output (JSON, tables)
- Provide timestamps for cache operations

### Completion Message Template

**For successful cache update:**
```markdown
## ✅ Model Cache Updated

**Source:** OpenRouter API
**Fetched:** 337 models
**Filtered:** 12 models (9-12 target)
**Categories:**
- Coding: 2 models
- Reasoning: 4 models
- Vision: 2 models
- Budget: 4 models

**Cache:**
- Location: mcp/claudish/.model-cache.json
- Expires: 2025-11-22T10:30:00Z (3 days)
- Size: 1.2 MB

**Documentation:**
- Updated: shared/recommended-models.md
- Version: 1.1.5 → 1.1.6
- Date: 2025-11-19

**Next Steps:**
- Commands will use cache automatically
- Cache refreshes in 3 days
- Force refresh: /update-models --force
```

**For cache hit (fast path):**
```markdown
## ✅ Using Cached Models

**Cache Status:** Fresh (1 day old, expires in 2 days)
**Models:** 12 models (4 categories)
**Last Updated:** 2025-11-18T10:30:00Z

**No API call needed** - Cache is current
```

**For graceful degradation:**
```markdown
## ⚠️ API Failed - Using Stale Cache

**API Error:** Network timeout
**Cache Status:** Stale (4 days old)
**Models:** 12 models (may be outdated)

**Action Required:**
- Check network connection
- Retry: /update-models --force
- Cache will auto-refresh when API is available
```

---

## Success Criteria

Agent execution is successful when:

- ✅ Cache validity checked correctly
- ✅ API fetched (if needed) OR cache used
- ✅ Minimum 7 diverse models extracted
- ✅ Anthropic models excluded
- ✅ Providers deduplicated (≥5 unique)
- ✅ Categories balanced (≥2 per category)
- ✅ Cache file written with correct schema
- ✅ TTL and expiration set correctly
- ✅ Documentation updated (if requested)
- ✅ Error handling graceful (fallback to stale cache)

**Quality Indicators:**
- API fetch time: <2s
- Cache read time: <100ms
- Model count: 9-12
- Provider diversity: ≥5
- Category balance: ≥2 per category
- Cache hit rate: >95% (over time)

---

**Agent Type:** Implementation Agent
**Model:** Haiku
**Complexity:** Low (simple data processing)
**Reliability:** High (stable API, graceful degradation)
