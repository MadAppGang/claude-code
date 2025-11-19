# Legacy Cleanup Plan - Remove Old Approach Completely

**Goal:** Remove ALL leftovers from the old static model approach and implement true dynamic Claudish integration.

---

## Components to Remove/Update

### 🔴 HIGH PRIORITY - Hardcoded Model Lists

1. **`/review` command (lines 184-193)**
   - Remove: Hardcoded model list
   - Replace: Dynamic query to `claudish --list-models --json`
   - Add: JSON parsing and AskUserQuestion building

2. **`/implement` command**
   - Status: Already updated documentation
   - Verify: No hardcoded lists remain

### 🟡 MEDIUM PRIORITY - XML Artifacts

3. **XML files (legacy from old migration)**
   - `plugins/frontend/recommended-models.xml`
   - `plugins/bun/recommended-models.xml`
   - `plugins/code-analysis/recommended-models.xml`
   - Action: Delete if unused

### 🟢 LOW PRIORITY - Legacy Infrastructure

4. **`/update-models` command**
   - Current: 5-phase orchestration with model-scraper
   - Options:
     a) Mark as DEPRECATED (add warning)
     b) Simplify to just update shared/recommended-models.md
     c) Remove entirely (Claudish owns the list)
   - Decision: Mark as DEPRECATED for now

5. **`model-scraper` agent**
   - Current: Chrome DevTools MCP scraping
   - Status: Still useful for maintaining shared/recommended-models.md
   - Action: Keep but document as maintenance tool only

---

## Implementation Plan

### Phase 1: Dynamic /review Command

**File:** `plugins/frontend/commands/review.md`

**Changes:**
1. Add new PHASE 1.0: Query Claudish for models
2. Remove hardcoded model list (lines 184-193)
3. Implement JSON parsing
4. Build dynamic AskUserQuestion options
5. Add graceful fallback to embedded defaults

**Pattern:**
```markdown
<phase number="1.0" name="Query Available Models">
  <steps>
    <step>Check Claudish availability: npx claudish --version</step>
    <step>Query models via JSON:
      ```bash
      models_json=$(npx claudish --list-models --json 2>/dev/null)
      ```
    </step>
    <step>Parse JSON and extract model IDs:
      ```bash
      echo "$models_json" | jq -r '.models[] | 
        select(.category == "coding" or .category == "reasoning") | 
        "\(.id)|\(.name)|\(.category)|\(.pricing.average)"'
      ```
    </step>
    <step>Build model selection options from parsed data</step>
    <step>If Claudish unavailable, use embedded defaults:
      - x-ai/grok-code-fast-1
      - google/gemini-2.5-flash
      - Custom model ID
      - Claude Sonnet 4.5 (embedded)
    </step>
  </steps>
</phase>
```

### Phase 2: Dynamic /implement Command

**File:** `plugins/frontend/commands/implement.md`

**Changes:**
1. Already documented to reference Claudish
2. Add actual JSON query for reviewModels selection
3. Implement same pattern as /review

### Phase 3: Cleanup XML Artifacts

**Action:** Delete unused XML files

**Verification:**
```bash
# Check if XML files are referenced anywhere
git grep "recommended-models.xml"

# If no results, safe to delete
git rm plugins/*/recommended-models.xml
```

### Phase 4: Deprecate /update-models

**File:** `.claude/commands/update-models.md`

**Add deprecation notice:**
```markdown
**⚠️ DEPRECATION NOTICE:**
This command uses the legacy model scraping approach. With Claudish v1.8.0+,
model management is handled by Claudish itself via `--list-models --json`.

**Recommended Alternative:**
- Query models: `claudish --list-models --json`
- Update shared file manually if needed
- Commands query Claudish dynamically (no sync needed)

This command is maintained for backward compatibility but will be removed in v4.0.0.
```

---

## Success Criteria

- [ ] /review command queries Claudish dynamically
- [ ] /implement command queries Claudish dynamically
- [ ] No hardcoded model lists in commands
- [ ] XML artifacts removed
- [ ] /update-models marked as deprecated
- [ ] All commands have graceful fallback to embedded defaults
- [ ] Integration tested end-to-end

---

## Rollback Plan

If dynamic integration causes issues:
1. Embedded defaults still work (graceful fallback)
2. Can revert to hardcoded lists temporarily
3. Claudish CLI is stable (v1.8.0)

