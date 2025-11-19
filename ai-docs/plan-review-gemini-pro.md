# Plan Review: /update-models v2.0

**Reviewer:** Gemini Pro
**Date:** 2025-11-19
**Status:** Complete

---

## Overall Assessment

The redesign of the `/update-models` command and the introduction of the `model-api-manager` agent is an excellent and well-considered architectural improvement. The transition from a brittle, complex scraping system to a robust, fast, and simple API-driven caching model is a significant leap forward.

The plan is comprehensive, covering architecture, caching, migration, and error handling. The design documents are clear, detailed, and demonstrate a strong understanding of the problem domain. The following feedback is intended to refine and harden this already solid plan.

---

## Critical Feedback by Category

### 1. Architecture Design

*   **LOW: No issues.** The API + Caching architecture is a standard, best-practice solution for this problem. It correctly separates the data fetching/processing logic (`model-api-manager`) from the orchestration (`/update-models` command). The design is sound, simple, and reliable.

### 2. Cache Strategy

*   **MEDIUM: Cache Schema Robustness.** The current cache schema is good, but could be made more resilient to future changes.
    *   **Recommendation:** Add a `hash` field to the cache schema. This hash (e.g., SHA256) would be calculated on the `rawModels` data. This allows for a quick and definitive way to check if the underlying model list has changed, even if the `cachedAt` timestamp is the same. It protects against scenarios where the cache file is overwritten but the content is identical.
*   **LOW: TTL Appropriateness.** The 3-day TTL is a reasonable starting point. The inclusion of the `--ttl` flag provides excellent flexibility. No change is required, but this is a key metric to monitor post-launch.
*   **LOW: Schema Completeness.** The decision to store both `filtered` and `rawModels` is excellent. It provides performance for the common path and flexibility for the uncommon path (e.g., re-filtering with different criteria) without requiring another API call.

### 3. API Integration

*   **HIGH: Pricing Data Parsing.** The `jq` scripts assume that `pricing.prompt` and `pricing.completion` will always be valid number strings. The OpenRouter API may return `null` or non-numeric values for some models, which would cause `tonumber` to fail and break the entire filtering process.
    *   **Recommendation:** Harden the `jq` scripts to handle `null` or invalid pricing data. Use a fallback value or exclude the model if its pricing is non-standard. For example:
        ```jq
        # Safely parse pricing, defaulting to a large number if null/invalid
        (.pricing.prompt | tonumber? // 9999)
        ```
*   **MEDIUM: API Response Sanity Check.** The plan includes a check for a minimum model count (`> 50`), which is great. This could be slightly improved.
    *   **Recommendation:** In addition to the model count, add a sanity check on the number of unique providers found in the raw API response. If the provider count drops suspiciously low (e.g., < 10), it might indicate a malformed API response, even if the model count is high. This provides an extra layer of defense against corrupted data.

### 4. Filtering Logic

*   **CRITICAL: Category Balancing Logic Implementation.** The *design* for category balancing is excellent ("relax provider dedup for that category"). However, the *implementation* shown in the `jq` examples does not fully realize this. The example shows counting models per category, but not the actual logic to go back and add more models if a category is under-represented. This is a complex, multi-pass operation that is non-trivial to implement in a single, monolithic `jq` command.
    *   **Recommendation:** Explicitly design this as a multi-step process in the `model-api-manager` agent. For example:
        1.  Run initial provider deduplication.
        2.  Count models in each category.
        3.  For each category with `< 2` models:
            a.  Go back to the pre-deduplicated, categorized list.
            b.  Find the next-best model(s) for that category from providers that were already used.
            c.  Add it to the final list, ensuring not to exceed the overall 9-12 model target.
        This will likely require a small script (e.g., using Bash) that pipes data through `jq` multiple times, rather than a single complex query.

*   **MEDIUM: "Reasoning" as a Default Category.** The logic defaults any uncategorized model to "reasoning". This is a safe default, but it could lead to less-than-ideal models appearing in that category.
    *   **Recommendation:** Add a final "unclassified" category. If a model doesn't fit anywhere, place it there. The final selection logic can then ignore this category, ensuring that only models that meet specific criteria are recommended. This improves the signal-to-noise ratio of the final list.

### 5. Migration Plan

*   **LOW: No issues.** The migration plan is excellent. The phased approach is safe and logical. Deprecating rather than deleting old components is the correct approach for a smooth transition and retaining historical context. The plan to update dependent commands is crucial and well-identified.

### 6. Completeness

*   **HIGH: Documentation for Manual Cache Creation.** The error recovery for "API fails AND no cache" suggests the user "manually create cache". The design does not specify how a user would do this or what the format should be.
    *   **Recommendation:** Create a small, dedicated documentation file (`ai-docs/MANUAL_MODEL_CACHE_GUIDE.md`) that explains how a user could construct a minimal, valid `.model-cache.json` file in an emergency. This could include a template with a few known-good "starter" models. The error message should then point the user to this file.
*   **MEDIUM: Versioning of Human-Readable Docs.** The agent design shows the version of `recommended-models.md` being incremented. This could lead to merge conflicts if multiple people run the command.
    *   **Recommendation:** Instead of a version number, simply use a "Last Updated" timestamp in the documentation. This avoids conflicts and still conveys freshness. The cache itself has a proper version field, which is sufficient for technical versioning.

### 7. Simplicity vs Functionality

*   **LOW: No issues.** This is the strongest part of the design. It achieves a massive simplification (removing scraping, MCP, sync scripts) while simultaneously increasing functionality (richer metadata, faster execution, graceful degradation). It is a textbook example of a successful architectural refactor.

---

## Summary of Actionable Recommendations

*   **CRITICAL (1):**
    1.  **Refine Category Balancing:** Design the category balancing logic as a multi-step script, as it is too complex for a single `jq` query. The current plan does not fully implement the described logic.
*   **HIGH (2):**
    1.  **Harden Pricing Parser:** Add `?` and `//` fallbacks to `jq` scripts to handle `null` or invalid pricing data from the API.
    2.  **Add Manual Cache Guide:** Create a recovery document for the "API down + no cache" scenario.
*   **MEDIUM (4):**
    1.  **Add Cache Hash:** Include a SHA256 hash of `rawModels` in the cache to detect content changes.
    2.  **Add Provider Count Check:** Augment API validation to check for a suspicious drop in unique providers.
    3.  **Add "Unclassified" Category:** Use this instead of defaulting to "reasoning" to improve signal quality.
    4.  **Remove Doc Versioning:** Use only a "Last Updated" timestamp in the Markdown file to prevent merge conflicts.
