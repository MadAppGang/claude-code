---
description: |
  Orchestrates a 5-phase workflow to update recommended AI models from OpenRouter trending rankings.
  Delegates scraping and filtering to model-scraper agent, obtains user approval, updates shared models file,
  and syncs to all plugins with comprehensive error recovery.
allowed-tools: Task, AskUserQuestion, Bash, Read, Glob, Grep, TodoWrite
---

<mission>
Streamline the process of keeping AI model recommendations current by coordinating specialized agents for OpenRouter data collection and intelligent filtering, obtaining user validation, and distributing updates across all plugins.
</mission>

<user_request>
$ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <orchestrator_role mandatory="true">
      **STRICT Orchestrator Pattern Enforcement:**

      You MUST:
      - Use Task tool to delegate ALL data manipulation to agents
      - Use AskUserQuestion for user approval gate
      - Use Bash for running sync script and git commands
      - Use Read for file verification only
      - Use Glob/Grep for finding files

      You MUST NOT:
      - Use Write or Edit tools directly
      - Perform filtering, categorization, or file updates yourself
      - Manipulate data structures
      - Only coordinate workflow and make decisions about delegation

      **Rationale:** Orchestrators coordinate but never manipulate data. All data operations
      must be delegated to specialized agents with appropriate tool permissions.
    </orchestrator_role>

    <todowrite_requirement>
      You MUST use the TodoWrite tool to create and maintain a todo list throughout your orchestration workflow.

      **Before starting**, create a todo list with all 5 phases:
      1. PHASE 0: Initialization
      2. PHASE 1: Scrape and Filter Models
      3. PHASE 2: User Approval
      4. PHASE 3: Update Shared File
      5. PHASE 4: Sync to Plugins

      **Update continuously**:
      - Mark tasks as "in_progress" when starting
      - Mark tasks as "completed" immediately after finishing
      - Keep only ONE task as "in_progress" at a time
    </todowrite_requirement>

    <delegation_contract mandatory="true">
      **Strict Delegation Rules:**

      - ALL scraping → model-scraper agent
      - ALL filtering/deduplication/categorization → model-scraper agent
      - ALL file updates → model-scraper agent
      - Orchestrator only: coordinates, validates, approves, recovers from errors

      **Never violate this contract.** If you find yourself about to use Write/Edit,
      STOP and delegate to model-scraper instead.
    </delegation_contract>

    <user_approval_gate mandatory="true">
      You MUST present filtered model list to user before updating:

      - Show: model IDs, providers, categories, pricing
      - Allow user to: approve, modify, or reject
      - Do NOT proceed without approval
      - Support structured modification input (see knowledge section)
    </user_approval_gate>
  </critical_constraints>

  <core_principles>
    <principle name="Strict Orchestration Pattern" priority="critical">
      - Orchestrator coordinates but never manipulates data
      - All data operations delegated to specialized agents
      - Clear separation of concerns: orchestration vs implementation
      - Tool restrictions enforced: NO Write/Edit in orchestrator
    </principle>

    <principle name="Context-Aware Filtering" priority="high">
      Provide these filtering rules to model-scraper agent:

      1. **Anthropic Filter**: Exclude all Anthropic models (Claude available natively)
      2. **Provider Deduplication**: Max 1 per provider (keep top-ranked)
      3. **Category Balance**: Min 2 models per category (coding, reasoning, vision, budget)
      4. **Target Count**: 9-12 models
      5. **Diversity**: ≥5 different providers

      **Category Balance Override:**
      - If category has <2 models after deduplication, allow 2nd model from that provider
      - Priority: Category diversity > Provider deduplication
    </principle>

    <principle name="Safe Updates" priority="high">
      - Always read existing file first for verification
      - Create backup before sync
      - Rollback on any failure
      - Preserve existing file if update fails
      - User approval required before modifications
    </principle>

    <principle name="Error Recovery with Retry Limits" priority="high">
      - Handle scraping failures gracefully (max 3 attempts)
      - Rollback on sync script errors
      - Partial sync recovery (continue with successful, retry failures)
      - Log all errors for debugging
      - User decision gates for ambiguous failures
    </principle>
  </core_principles>

  <workflow>
    <phase number="0" name="Initialization">
      <objective>Set up workflow tracking and validate prerequisites</objective>

      <steps>
        <step>Create TodoWrite with all 5 phases</step>
        <step>Mark PHASE 0 as in_progress</step>
        <step>Check if model-scraper agent available:
          ```bash
          test -f /Users/jack/mag/claude-code/.claude/agents/model-scraper.md
          ```
        </step>
        <step>Check if sync script exists:
          ```bash
          test -f /Users/jack/mag/claude-code/scripts/sync-shared.ts
          ```
        </step>
        <step>Check if shared models file exists:
          ```bash
          test -f /Users/jack/mag/claude-code/shared/recommended-models.md
          ```
        </step>
        <step>Read existing shared/recommended-models.md to cache current state</step>
        <step>Mark PHASE 0 as completed</step>
        <step>Mark PHASE 1 as in_progress</step>
      </steps>

      <quality_gate>
        All prerequisites validated:
        - model-scraper agent exists
        - sync script exists
        - shared models file exists
      </quality_gate>

      <error_recovery>
        - If model-scraper missing: Report error, suggest creating agent first
        - If sync script missing: Report error, stop workflow
        - If shared file missing: Report error, suggest manual creation
      </error_recovery>
    </phase>

    <phase number="1" name="Scrape and Filter Models">
      <objective>Get latest model rankings from OpenRouter and apply intelligent filtering</objective>

      <steps>
        <step>Launch model-scraper agent via Task tool with filtering rules:
          ```
          Prompt: "Scrape trending programming models from OpenRouter and apply these filters:

          **CRITICAL: Tiered Pricing Handling**
          - See shared/TIERED_PRICING_SPEC.md for complete specification
          - If model has tiered pricing (e.g., Claude Sonnet: 0-200K vs 200K-1M):
            * Calculate average price for EACH tier
            * Select tier with LOWEST average price
            * Use that tier's MAXIMUM context (NOT full model capacity!)
            * Record tier metadata (tiered: true, note about pricing)
          - Example: Claude Sonnet (200K/$9 tier vs 1M/$90 tier) → record as $9/1M, 200K context
          - Never average prices across tiers (misleading!)

          **Filtering Rules:**
          - Exclude providers: anthropic (Claude models available natively)
          - Max per provider: 1 (keep top-ranked only for diversity)
          - Min per category: 2 (ensure category balance)
          - Target count: 9-12 models

          **Category Focus:**
          - Fast coding models (low latency, high throughput)
          - Advanced reasoning models (complex problem-solving)
          - Vision-capable models (multimodal)
          - Budget-friendly options (cost-effective)

          **Deduplication Algorithm:**
          1. Filter: Remove all Anthropic models
          2. Group by provider: Extract provider from slug (provider/model-name)
          3. Deduplicate: Keep ONLY top-ranked model per provider (first in list)
             - Ranking = OpenRouter's inherent sort order (most popular first)
          4. Category balance: Count models per category
             - If category has <2 models, consider re-adding 2nd model from that provider
             - Priority: Under-represented categories > provider deduplication
          5. Limit: If >12 models, remove lowest-ranked budget models first

          **Return:**
          - JSON array of filtered models with: slug, provider, category, pricing, context, rank
          - Summary of filtering (original count, filtered count, models removed)
          - DO NOT update shared/recommended-models.md yet (wait for user approval)"
          ```
        </step>
        <step>Wait for model-scraper to complete</step>
        <step>Parse returned model data (JSON format)</step>
        <step>Validate data completeness:
          - Minimum 7 models extracted
          - All models have required fields (slug, provider, category, pricing)
          - No Anthropic models in list
          - Providers are diverse (≥5 different providers)
        </step>
        <step>Mark PHASE 1 as completed</step>
        <step>Mark PHASE 2 as in_progress</step>
      </steps>

      <quality_gate>
        Minimum 7 diverse models extracted successfully with:
        - ≥5 different providers
        - No Anthropic models
        - All required fields present
      </quality_gate>

      <error_recovery>
        **Retry Limits (Max 3 Attempts):**

        - **Attempt 1:** If <7 models, retry scraping once
        - **Attempt 2:** If still <7 models, retry with relaxed filters (allow 2 per provider)
        - **Attempt 3:** If still fails, ask user:
          * Option A: Use existing recommendations (preserve current file, no update)
          * Option B: Proceed with fewer models (if ≥5 models available)
          * Option C: Abort workflow
        - **Max retries:** 3 attempts total

        **Scraping Failure Behavior:**
        - If Chrome DevTools MCP error: Report error, suggest MCP configuration check
        - If page structure changed: Report error, suggest manual verification
        - If network issues: Report error, suggest retry later
        - "Use existing models" means: Abort update, preserve current shared/recommended-models.md, notify user no changes made
      </error_recovery>
    </phase>

    <phase number="2" name="User Approval">
      <objective>Present filtered models to user for validation</objective>

      <steps>
        <step>Format model shortlist for presentation:
          ```
          ## 🔄 Model Update Proposal

          **Status:** Ready for approval

          ### Summary
          - **Original scraped:** {original_count} models
          - **After Anthropic filter:** {after_anthropic} models (-{anthropic_count} Anthropic)
          - **After deduplication:** {after_dedup} models (-{dedup_count} duplicate providers)
          - **Final shortlist:** {final_count} models

          ### Proposed Updates

          #### Fast Coding ⚡
          1. **x-ai/grok-3**
             - Provider: xAI
             - Pricing: $2.00/1M avg
             - Context: 256K tokens
             - Rank: #1

          #### Advanced Reasoning 🧠
          2. **google/gemini-2.5-pro**
             - Provider: Google
             - Pricing: $5.63/1M avg
             - Context: 1049K tokens
             - Rank: #2

          [... continue for all models ...]

          ### Models Removed
          - ❌ anthropic/claude-sonnet-4.5 (Reason: Native Claude access)
          - ❌ x-ai/grok-code-fast-1 (Reason: Duplicate xAI - kept higher-ranked grok-3)

          ### Diversity Check
          - ✅ {provider_count} providers (xAI, Google, OpenAI, etc.)
          - ✅ {category_count} categories covered
          - ✅ Price range: ${min_price}-${max_price}/1M

          **Approve this update?**
          ```
        </step>
        <step>Use AskUserQuestion with structured options:
          - **Question:** "Approve these model updates?"
          - **Options:**
            1. ✅ Approve and proceed with update
            2. ✏️ Modify list (add/remove models)
            3. ❌ Cancel update
        </step>
        <step>**If "Approve":** Proceed to PHASE 3</step>
        <step>**If "Modify":**
          - Show structured input format:
            ```
            To add a model:
            add: provider/model-slug, category, pricing

            To remove a model:
            remove: provider/model-slug

            Examples:
            add: meta-llama/llama-3.2-11b-vision-instruct, vision, 0.25
            remove: deepseek/deepseek-chat
            ```
          - Parse user input with validation (see knowledge section)
          - Update shortlist based on validated input
          - Re-present for approval
          - Maximum 2 modification loops to prevent infinite iterations
          - After 2 loops, force decision: approve current or cancel
        </step>
        <step>**If "Cancel":** Stop workflow, mark all phases complete, report no changes</step>
        <step>Mark PHASE 2 as completed</step>
        <step>Mark PHASE 3 as in_progress</step>
      </steps>

      <quality_gate>
        User approved model shortlist
      </quality_gate>

      <error_recovery>
        - If user cancels: Acknowledge, preserve existing file, cleanup backup
        - If user input invalid: Show validation error, request correct format
        - If modification loops >2: Force decision (approve/cancel)
      </error_recovery>
    </phase>

    <phase number="3" name="Update Shared File">
      <objective>Update shared/recommended-models.md AND generate JSON for Claudish with approved models</objective>

      <steps>
        <step>Create backup of current file:
          ```bash
          cp /Users/jack/mag/claude-code/shared/recommended-models.md \
             /Users/jack/mag/claude-code/shared/recommended-models.md.backup
          ```
        </step>
        <step>Launch model-scraper agent to update files:
          ```
          Prompt: "Update shared/recommended-models.md AND generate recommended-models.json with these approved models:

          {JSON array of approved models}

          **Instructions for Markdown file (shared/recommended-models.md):**
          - Preserve file structure (decision tree, examples, metadata)
          - Update Quick Reference Table
          - Update model entries in each category section
          - Update Performance Benchmarks
          - Increment version number (patch: 1.1.0 → 1.1.1)
          - Update 'Last Updated' date to today (YYYY-MM-DD)
          - DO NOT modify decision tree section
          - DO NOT modify integration examples section
          - DO NOT modify maintenance instructions section

          **ALSO Generate JSON file (mcp/claudish/recommended-models.json):**
          - Create/overwrite: /Users/jack/mag/claude-code/mcp/claudish/recommended-models.json
          - Format: Array of model objects with metadata
          - Schema:
            ```json
            {
              "version": "1.1.1",
              "lastUpdated": "2025-11-16",
              "models": [
                {
                  "id": "x-ai/grok-code-fast-1",
                  "name": "Grok Code Fast",
                  "description": "xAI's fast coding model",
                  "provider": "xAI",
                  "category": "coding",
                  "priority": 1,
                  "pricing": {
                    "input": "$0.20/1M",
                    "output": "$1.50/1M",
                    "average": "$0.85/1M"
                  },
                  "context": "256K",
                  "recommended": true
                }
              ]
            }
            ```
          - Extract model metadata from approved list
          - Sort by priority (1 = highest)
          - Add "recommended": true for models marked with ⭐ in Quick Reference

          **Return:**
          - Summary of changes (models added/removed/updated)
          - Version number (old → new)
          - Confirmation of both file updates (MD + JSON)
          - Path to generated JSON file"
          ```
        </step>
        <step>Wait for model-scraper to complete</step>
        <step>Read updated files to verify changes:
          ```bash
          # Verify version incremented in MD
          grep "Version:" /Users/jack/mag/claude-code/shared/recommended-models.md

          # Verify date updated in MD
          grep "Last Updated:" /Users/jack/mag/claude-code/shared/recommended-models.md

          # Verify JSON file created
          test -f /Users/jack/mag/claude-code/mcp/claudish/recommended-models.json

          # Verify JSON is valid
          cat /Users/jack/mag/claude-code/mcp/claudish/recommended-models.json | jq .version

          # Verify JSON has models array
          cat /Users/jack/mag/claude-code/mcp/claudish/recommended-models.json | jq '.models | length'
          ```
        </step>
        <step>If verification fails:
          - Restore from backup:
            ```bash
            cp /Users/jack/mag/claude-code/shared/recommended-models.md.backup \
               /Users/jack/mag/claude-code/shared/recommended-models.md
            ```
          - Remove invalid JSON if created:
            ```bash
            rm -f /Users/jack/mag/claude-code/mcp/claudish/recommended-models.json
            ```
          - Report error and stop
          - Preserve backup for debugging
        </step>
        <step>Mark PHASE 3 as completed</step>
        <step>Mark PHASE 4 as in_progress</step>
      </steps>

      <quality_gate>
        Files updated successfully and verified:
        - ✅ **MD File:** Version number incremented (patch)
        - ✅ **MD File:** Last Updated date is today
        - ✅ **MD File:** All approved models present
        - ✅ **MD File:** Decision tree section unchanged
        - ✅ **MD File:** Valid markdown (no syntax errors)
        - ✅ **JSON File:** Created at mcp/claudish/recommended-models.json
        - ✅ **JSON File:** Valid JSON format (jq can parse)
        - ✅ **JSON File:** Has version field matching MD version
        - ✅ **JSON File:** Has models array with ≥7 models
        - ✅ **JSON File:** All models have required fields (id, name, provider, category, priority)
      </quality_gate>

      <error_recovery>
        - If model-scraper fails: Restore backup, remove invalid JSON, report error
        - If MD verification fails: Restore backup, remove JSON, report specific issue
        - If JSON verification fails: Restore MD backup, remove JSON, report JSON error
        - If file corrupted: Restore backup, remove JSON, suggest manual edit
      </error_recovery>
    </phase>

    <phase number="4" name="Sync to Plugins">
      <objective>Distribute updated models file to all plugins with partial failure recovery</objective>

      <steps>
        <step>Run sync script via Bash:
          ```bash
          cd /Users/jack/mag/claude-code && bun run scripts/sync-shared.ts
          ```
        </step>
        <step>Wait for script completion</step>
        <step>Verify sync results:
          ```bash
          # Check that files were updated
          ls -l /Users/jack/mag/claude-code/plugins/*/recommended-models.md

          # Verify content matches source (md5 hash comparison)
          md5 /Users/jack/mag/claude-code/shared/recommended-models.md \
              /Users/jack/mag/claude-code/plugins/frontend/recommended-models.md \
              /Users/jack/mag/claude-code/plugins/bun/recommended-models.md \
              /Users/jack/mag/claude-code/plugins/code-analysis/recommended-models.md
          ```
        </step>
        <step>**Partial Sync Recovery Strategy:**
          - If ALL syncs fail:
            * Restore backup: `cp shared/recommended-models.md.backup shared/recommended-models.md`
            * Report complete failure
            * Suggest checking permissions and re-running
          - If SOME syncs succeed:
            * Identify which plugins synced successfully (check md5 hashes)
            * Identify which plugins failed (different md5 or missing file)
            * Ask user:
              - Option A: Continue with successful syncs (partial update)
              - Option B: Rollback everything (restore backup + manual sync)
              - Option C: Retry failed plugins only (selective retry, max 2 attempts)
            * Based on user choice:
              - **Continue:** Keep successful, report failed plugins for manual sync
              - **Rollback:** Restore backup, revert all plugin files to backup
              - **Retry:** Run sync script again (if still fails, offer continue/rollback)
        </step>
        <step>Show git status to user:
          ```bash
          cd /Users/jack/mag/claude-code && git status
          cd /Users/jack/mag/claude-code && git diff --stat
          ```
        </step>
        <step>Present summary:
          ```
          ## ✅ Model Update Complete

          **Models Updated:** {count} models
          **File Updated:** shared/recommended-models.md
          **Version:** {old_version} → {new_version}
          **Synced To:**
          - ✅ plugins/frontend/recommended-models.md
          - ✅ plugins/bun/recommended-models.md
          - ✅ plugins/code-analysis/recommended-models.md

          **Next Steps:**
          1. Review changes: git diff shared/recommended-models.md
          2. Test model selection in /implement command
          3. Commit changes: git add . && git commit -m "chore: update recommended models v{new_version}"

          **Files Modified:**
          M  shared/recommended-models.md
          M  plugins/frontend/recommended-models.md
          M  plugins/bun/recommended-models.md
          M  plugins/code-analysis/recommended-models.md
          ```
        </step>
        <step>Remove backup file:
          ```bash
          rm /Users/jack/mag/claude-code/shared/recommended-models.md.backup
          ```
        </step>
        <step>Mark PHASE 4 as completed</step>
        <step>Mark all TodoWrite tasks as completed</step>
      </steps>

      <quality_gate>
        Files synced successfully, git status shows expected changes:
        - ✅ shared/recommended-models.md modified
        - ✅ All 3 plugin files modified (or partial with user approval)
        - ✅ md5 hashes match (or partial with user approval)
      </quality_gate>

      <error_recovery>
        - If sync script fails completely: Restore backup, report error, suggest manual sync
        - If verification fails: Restore backup, report error
        - If partial sync: Offer continue/rollback/retry options
        - If git status unexpected: Show diff to user for manual review
      </error_recovery>
    </phase>
  </workflow>
</instructions>

<orchestration>
  <allowed_tools>
    - **Task**: Delegate to model-scraper agent for all data operations
    - **AskUserQuestion**: User approval gate, modification requests, error decisions
    - **Bash**: Run sync script, git commands, file verification commands
    - **Read**: Read files for verification only (NOT for data extraction before Write/Edit)
    - **Glob**: Find files (e.g., locate plugin directories)
    - **Grep**: Search files (e.g., verify version numbers)
    - **TodoWrite**: Progress tracking throughout workflow
  </allowed_tools>

  <forbidden_tools>
    - **Write**: File creation (delegate to model-scraper)
    - **Edit**: File modification (delegate to model-scraper)
  </forbidden_tools>

  <delegation_rules>
    <rule scope="Scraping OpenRouter" delegate_to="model-scraper agent">
      **Rationale:** Specialized for Chrome DevTools MCP automation
    </rule>

    <rule scope="Filtering models" delegate_to="model-scraper agent">
      **Rationale:** Agent has data manipulation capabilities and Write tool access
    </rule>

    <rule scope="Categorizing models" delegate_to="model-scraper agent">
      **Rationale:** Agent understands model capabilities from scraping context
    </rule>

    <rule scope="Deduplication logic" delegate_to="model-scraper agent">
      **Rationale:** Agent has Write tool access for updates; orchestrator cannot manipulate data
    </rule>

    <rule scope="User approval" delegate_to="AskUserQuestion">
      **Rationale:** Interactive decision gate; orchestrator facilitates user input
    </rule>

    <rule scope="File updates" delegate_to="model-scraper agent">
      **Rationale:** Agent has Write tool access; orchestrator forbidden from Write/Edit
    </rule>

    <rule scope="Syncing to plugins" delegate_to="Bash script">
      **Rationale:** Automated distribution via sync-shared.ts; orchestrator coordinates execution
    </rule>

    <rule scope="Verification" delegate_to="Orchestrator (Read + Bash)">
      **Rationale:** Validation after delegation; orchestrator uses Read for verification only
    </rule>
  </delegation_rules>
</orchestration>

<knowledge>
  <model_scraper_contract>
    <capabilities>
      The model-scraper agent is responsible for:

      1. **Scraping** - Extract model data from OpenRouter rankings
      2. **Filtering** - Apply filtering rules provided by orchestrator:
         - Remove Anthropic models
         - Deduplicate by provider (keep top-ranked per provider)
         - Balance categories (ensure diversity)
         - Limit to 9-12 models
      3. **Categorization** - Assign categories (coding, reasoning, vision, budget)
      4. **File Updates** - Update BOTH files:

         **A) Markdown File (shared/recommended-models.md):**
         - Quick Reference Table
         - Model entries per category
         - Performance Benchmarks
         - Version increment (patch)
         - Last Updated date

         **B) JSON File (mcp/claudish/recommended-models.json):**
         - Create/overwrite JSON file for Claudish runtime
         - Extract model metadata (id, name, provider, category, priority, pricing, context)
         - Include version and lastUpdated fields
         - Sort by priority (1 = highest)
         - Mark recommended models (⭐ in Quick Reference)
    </capabilities>

    <input_format>
      Task prompt with:
      - Target URL (OpenRouter rankings)
      - Filtering rules:
        * exclude_providers: ["anthropic"]
        * max_per_provider: 1
        * min_per_category: 2
        * target_count: 9-12 models
      - Category focus areas
      - File structure preservation rules
    </input_format>

    <output_format>
      - List of filtered models with:
        * slug (provider/model-name)
        * provider name
        * category
        * pricing (average)
        * context window
        * rank (original position)
      - Summary of changes (added/removed/updated)
      - Updated file path
    </output_format>
  </model_scraper_contract>

  <filtering_algorithm>
    <rule name="Anthropic Filter" priority="1">
      ```yaml
      exclude_providers:
        - anthropic
      reason: Claude models available natively via Anthropic API
      ```
    </rule>

    <rule name="Provider Deduplication" priority="2">
      ```yaml
      max_per_provider: 1
      strategy: keep_top_ranked
      ranking_source: OpenRouter inherent sort order
      exception: category_balance_override (see Rule 3)
      ```

      **Clarification on Ranking:**
      - "Rank" = Position in OpenRouter's scraped list (1 = first/top)
      - OpenRouter sorts by popularity/usage metrics
      - "Top-ranked per provider" = First occurrence of that provider in list
    </rule>

    <rule name="Category Balance" priority="3">
      ```yaml
      min_per_category: 2
      categories:
        - coding (fast, low-latency models)
        - reasoning (complex problem-solving)
        - vision (multimodal, image understanding)
        - budget (cost-effective options)

      balancing_strategy:
        # If category has <2 models after deduplication:
        # Consider re-adding 2nd model from under-represented provider
        # Priority: Category diversity > Provider deduplication

      algorithm:
        1. Apply Anthropic filter
        2. Apply provider deduplication (keep top-ranked)
        3. Count models per category
        4. For categories with <2 models:
           - Find providers with removed 2nd-ranked models in that category
           - Re-add highest-ranked removed model from that category
           - Only re-add up to 2 models per provider maximum
        5. Final limit: 12 models (remove lowest-ranked budget models if exceeded)
      ```
    </rule>

    <rule name="Target Count" priority="4">
      ```yaml
      target_range: 9-12 models
      if_exceeded: remove_lowest_ranked_budget_models_first
      if_below_minimum: keep_all_filtered (already filtered to best)
      ```
    </rule>

    <diversity_thresholds>
      ```yaml
      min_providers: 5 different providers
      max_per_provider: 2 models (only with category balance override)
      min_per_category: 2 models per category
      target_category_balance: 25% per category (flexible)
      price_range_diversity: Include models from budget (<$1) to premium (>$5)
      ```
    </diversity_thresholds>
  </filtering_algorithm>

  <user_input_validation>
    <structured_format>
      **Add a model:**
      ```
      add: provider/model-slug, category, pricing
      ```

      **Remove a model:**
      ```
      remove: provider/model-slug
      ```

      **Examples:**
      ```
      add: meta-llama/llama-3.2-11b-vision-instruct, vision, 0.25
      remove: deepseek/deepseek-chat
      ```
    </structured_format>

    <validation_algorithm>
      ```typescript
      // Pseudocode for input validation
      function parseUserModification(input: string): Modification {
        const lines = input.split('\n').filter(l => l.trim());

        for (const line of lines) {
          if (line.startsWith('add:')) {
            const [_, data] = line.split('add:');
            const [slug, category, pricing] = data.split(',').map(s => s.trim());

            // Validate slug format
            if (!slug.match(/^[\w-]+\/[\w-]+$/)) {
              throw new Error(`Invalid slug format: ${slug}`);
            }

            // Validate category
            const validCategories = ['coding', 'reasoning', 'vision', 'budget'];
            if (!validCategories.includes(category)) {
              throw new Error(`Invalid category: ${category}`);
            }

            // Validate pricing
            if (isNaN(parseFloat(pricing))) {
              throw new Error(`Invalid pricing: ${pricing}`);
            }

            return { action: 'add', slug, category, pricing: parseFloat(pricing) };
          }

          if (line.startsWith('remove:')) {
            const [_, slug] = line.split('remove:');
            const trimmedSlug = slug.trim();

            // Validate slug format
            if (!trimmedSlug.match(/^[\w-]+\/[\w-]+$/)) {
              throw new Error(`Invalid slug format: ${trimmedSlug}`);
            }

            return { action: 'remove', slug: trimmedSlug };
          }
        }

        throw new Error('No valid modification command found');
      }
      ```
    </validation_algorithm>
  </user_input_validation>

  <sync_script_behavior>
    The `scripts/sync-shared.ts` script:

    1. Reads `/Users/jack/mag/claude-code/shared/recommended-models.md`
    2. Writes identical copy to each plugin directory:
       - `plugins/frontend/recommended-models.md`
       - `plugins/bun/recommended-models.md`
       - `plugins/code-analysis/recommended-models.md`
    3. Reports success/failure per file with exit codes
    4. Exits with code 0 on complete success, non-zero on any failure
    5. **Does NOT commit changes** - User must commit manually

    **Partial Failure Behavior:**
    - Script may succeed for some files and fail for others
    - Check md5 hashes to identify which files synced successfully
    - Use git status to see which files were modified
  </sync_script_behavior>

  <deduplication_retry_strategy>
    **When deduplication results in too few models (<7):**

    1. **First Retry:** Keep same filters, retry scraping (page may have loaded more models)
    2. **Second Retry:** Relax provider limit (allow 2 per provider)
    3. **Third Retry:** Final attempt with maximum relaxation
    4. **Max Retries Reached:** Ask user to decide:
       - Use existing recommendations (preserve current file)
       - Proceed with fewer models (if ≥5 available)
       - Abort workflow

    **Clarification on "Use Existing":**
    - Preserve current shared/recommended-models.md with no changes
    - Notify user models may be outdated
    - Abort workflow gracefully (no files modified)
  </deduplication_retry_strategy>
</knowledge>

<examples>
  <example name="Successful Update with Deduplication">
    <scenario>User runs `/update-models` and model-scraper successfully deduplicates providers</scenario>

    <execution>
```
PHASE 0: Initialize workflow ✅
  - Verified model-scraper agent exists
  - Verified sync script exists
  - Read existing shared/recommended-models.md (v1.1.0)

PHASE 1: Scrape and filter models ✅
  - Delegated to model-scraper with filtering rules
  - Original scraped: 9 models (2 Anthropic, 2 xAI, 2 Google, 1 OpenAI, 1 Qwen, 1 DeepSeek)
  - Anthropic filter: 9 → 7 models
  - Provider deduplication: 7 → 5 models
    * Removed x-ai/grok-code-fast-1 (kept x-ai/grok-3)
    * Removed google/gemini-flash (kept google/gemini-pro)
  - Category balance: 5 models (coding=2, reasoning=2, vision=0, budget=1)
    * Re-added qwen/qwen3-vl for vision (under-represented)
  - Final: 6 diverse models

PHASE 2: User approval ✅
  - Presented shortlist with diversity metrics
  - User approved without modifications

PHASE 3: Update shared file ✅
  - Delegated to model-scraper for file update
  - Version: 1.1.0 → 1.1.1
  - Verified changes (version, date, model entries)
  - Backup created

PHASE 4: Sync to plugins ✅
  - Synced to 3 plugin directories
  - Verified md5 hashes match
  - Git status: 4 files modified
  - Removed backup
```
    </execution>

    <output>
```markdown
## ✅ Model Update Complete

**Models Updated:** 6 models
**File Updated:** shared/recommended-models.md (v1.1.1)
**Synced To:** frontend, bun, code-analysis plugins

**Models Added:**
- x-ai/grok-3 (Fast Coding)
- google/gemini-2.5-pro (Advanced Reasoning)
- openai/gpt-5-codex (Advanced Reasoning)
- qwen/qwen3-vl-30b-a3b-instruct (Vision)
- deepseek/deepseek-chat (Budget)
- meta-llama/llama-3.2-90b-vision-instruct (Vision)

**Models Removed:**
- anthropic/claude-sonnet-4.5 (Native access)
- anthropic/claude-sonnet-4 (Native access)
- x-ai/grok-code-fast-1 (Duplicate provider - kept grok-3)
- google/gemini-2.5-flash (Duplicate provider - kept gemini-pro)

**Diversity Metrics:**
- ✅ 5 providers (xAI, Google, OpenAI, Qwen, DeepSeek, Meta)
- ✅ 4 categories covered (2 coding, 2 reasoning, 2 vision, 1 budget)
- ✅ Price range: $0.25-$9.00/1M

**Next Steps:**
1. Review: git diff shared/recommended-models.md
2. Test in /implement command
3. Commit: git add . && git commit -m "chore: update models v1.1.1"
```
    </output>
  </example>

  <example name="User Modifies List with Structured Input">
    <scenario>User runs `/update-models`, reviews shortlist, and requests modifications</scenario>

    <execution>
```
PHASE 0-1: ✅ (scraped and filtered to 5 models)

PHASE 2: User approval with modification ✏️
  - Presented shortlist (5 models)
  - User selects "Modify"
  - Orchestrator shows structured input format:
    """
    To add a model:
    add: provider/model-slug, category, pricing

    To remove a model:
    remove: provider/model-slug
    """
  - User input:
    """
    add: meta-llama/llama-3.2-11b-vision-instruct, vision, 0.25
    remove: deepseek/deepseek-chat
    """
  - Orchestrator validates input:
    ✅ Slug format valid
    ✅ Category valid (vision)
    ✅ Pricing valid (0.25)
  - Updated shortlist: 5 models (added llama, removed deepseek)
  - Re-presented for approval
  - User approved

PHASE 3-4: ✅ (updated with 5 modified models)
```
    </execution>

    <key_difference>
      Structured user input with validation ensures clean parsing and prevents errors.
      Maximum 2 modification loops prevents infinite iterations.
    </key_difference>
  </example>

  <example name="Scraping Failure with Retry Limits">
    <scenario>Chrome DevTools MCP fails, resulting in insufficient models after 3 retries</scenario>

    <execution>
```
PHASE 0: Initialize workflow ✅

PHASE 1: Scrape and filter models (with retries) ⚠️
  - Attempt 1: Delegated to model-scraper
    * Error: Chrome DevTools MCP not responding
    * Only 4 models extracted (below minimum 7)
    * Retry...

  - Attempt 2: Delegated with relaxed filters (allow 2 per provider)
    * Error: Still only 5 models extracted
    * Retry with further relaxation...

  - Attempt 3: Final attempt
    * Error: Still only 6 models (below minimum 7)
    * Max retries reached (3/3)

  - Fallback decision requested from user:
    1. Use existing recommendations (no update)
    2. Proceed with 6 models (below target)
    3. Abort workflow

  - User selects: Option 1 (Use existing)

PHASE 2-4: SKIPPED (user chose to preserve existing)

Workflow completed: No files modified
```
    </execution>

    <output>
```markdown
## ⚠️ Model Update Aborted (Insufficient Data)

**Phase:** PHASE 1 - Scrape and Filter Models
**Error:** Insufficient models extracted after 3 retry attempts

**Retry History:**
- Attempt 1: 4 models (below minimum 7)
- Attempt 2: 5 models (with relaxed filters)
- Attempt 3: 6 models (final attempt)

**Likely Causes:**
1. Chrome DevTools MCP not responding properly
2. OpenRouter page structure may have changed
3. Network connectivity issues during scraping

**User Decision:** Use existing recommendations (no update)

**Result:** No files were modified. Current recommendations preserved.

**Recommendation:**
1. Check MCP status: Test Chrome DevTools MCP manually
2. Verify page access: Visit https://openrouter.ai/rankings in browser
3. Review logs: Check model-scraper agent output for detailed errors
4. Retry later: Run /update-models again when MCP is stable

**Next Steps:** Fix MCP issues and re-run /update-models
```
    </output>
  </example>

  <example name="Partial Sync Failure with Recovery">
    <scenario>Sync script succeeds for 2/3 plugins but fails for code-analysis due to permissions</scenario>

    <execution>
```
PHASE 0-3: ✅ (scraped, filtered, approved, file updated successfully)

PHASE 4: Sync to plugins (partial failure) ⚠️
  - Sync script ran
  - Verification results:
    * ✅ plugins/frontend/recommended-models.md (md5 match)
    * ✅ plugins/bun/recommended-models.md (md5 match)
    * ❌ plugins/code-analysis/recommended-models.md (md5 mismatch - permission denied)

  - Partial sync detected: 2/3 successful

  - Orchestrator asks user:
    1. Continue with successful syncs (frontend, bun updated; code-analysis needs manual sync)
    2. Rollback everything (restore backup + revert plugin files)
    3. Retry failed plugin only (attempt selective sync)

  - User selects: Option 1 (Continue)

  - Orchestrator confirms:
    * Keeps shared/recommended-models.md updated
    * Keeps frontend and bun plugin synced
    * Reports code-analysis needs manual sync
    * Removes backup (successful update)
```
    </execution>

    <output>
```markdown
## ⚠️ Model Update Partial Success

**Phase:** PHASE 4 - Sync to Plugins (Partial Failure)
**Error:** code-analysis plugin sync failed (permission denied)

**Status:**
- ✅ Models scraped successfully (6 models)
- ✅ Models filtered and approved
- ✅ Shared file updated (v1.1.0 → 1.1.1)
- ✅ Frontend plugin synced
- ✅ Bun plugin synced
- ❌ Code-analysis plugin sync failed

**User Decision:** Continue with successful syncs

**Files Modified:**
M  shared/recommended-models.md
M  plugins/frontend/recommended-models.md
M  plugins/bun/recommended-models.md

**Manual Recovery Steps for code-analysis plugin:**
1. Check permissions:
   ```bash
   ls -la /Users/jack/mag/claude-code/plugins/code-analysis/
   ```
2. Manually copy file:
   ```bash
   cp /Users/jack/mag/claude-code/shared/recommended-models.md \
      /Users/jack/mag/claude-code/plugins/code-analysis/recommended-models.md
   ```
3. Verify sync:
   ```bash
   md5 /Users/jack/mag/claude-code/shared/recommended-models.md \
       /Users/jack/mag/claude-code/plugins/code-analysis/recommended-models.md
   ```

**Next Steps:**
1. Fix permissions issue for code-analysis plugin
2. Manually sync code-analysis file (commands above)
3. Verify all 3 plugins have matching files
4. Commit changes: git add . && git commit -m "chore: update models v1.1.1"
```
    </output>
  </example>
</examples>

<error_recovery>
  <strategy name="Scraping Failures (with Retry Limits)">
    **Symptom:** model-scraper returns <7 models

    **Recovery:**
    1. **Attempt 1:** Retry with same filters
    2. **Attempt 2:** Retry with relaxed filters (allow 2 per provider)
    3. **Attempt 3:** Final retry (last chance)
    4. **Max retries reached:** Ask user:
       - Option A: Use existing recommendations (preserve file)
       - Option B: Proceed with fewer models (if ≥5 models)
       - Option C: Abort workflow
    5. **Clarification on "Use existing":** Preserve current shared/recommended-models.md with no changes, notify user models may be outdated
  </strategy>

  <strategy name="User Cancellation">
    **Symptom:** User selects "Cancel" in approval gate

    **Recovery:**
    1. Acknowledge cancellation
    2. No files modified (preserve existing)
    3. Remove backup if created (cleanup)
    4. Mark all TodoWrite tasks complete
    5. Provide summary of what was scraped (for user reference)
  </strategy>

  <strategy name="File Update Failures">
    **Symptom:** model-scraper fails to update file

    **Recovery:**
    1. Restore from backup immediately:
       ```bash
       cp /Users/jack/mag/claude-code/shared/recommended-models.md.backup \
          /Users/jack/mag/claude-code/shared/recommended-models.md
       ```
    2. Verify backup restoration (read file)
    3. Report specific error to user
    4. Suggest checking file permissions
    5. Offer manual edit option with approved model list
  </strategy>

  <strategy name="Sync Script Failures">
    **Symptom:** `bun run scripts/sync-shared.ts` exits non-zero

    **Recovery:**

    ### Complete Failure (0/3 plugins synced)
    1. Restore backup:
       ```bash
       cp /Users/jack/mag/claude-code/shared/recommended-models.md.backup \
          /Users/jack/mag/claude-code/shared/recommended-models.md
       ```
    2. Verify restoration with md5sum
    3. Report error and script output
    4. Suggest manual sync commands
    5. Provide diagnostic steps (check permissions, check script)

    ### Partial Failure (1-2/3 plugins synced)
    1. Identify successful syncs (md5 hash comparison)
    2. Identify failed syncs (different md5 or error)
    3. Ask user:
       - **Continue:** Keep successful syncs, report failures for manual sync
       - **Rollback:** Restore backup + revert all plugin files (use git restore)
       - **Retry:** Attempt sync again for failed plugins only (max 2 retry attempts)
    4. Based on user choice:
       - **Continue:** Remove backup, report manual steps for failed plugins
       - **Rollback:** Execute rollback, verify all files restored, remove backup
       - **Retry:** Re-run sync script (if still fails, offer continue/rollback)

    ### Partial Sync Recovery Decision Matrix

    | Successful | Failed | Recommendation | Rationale |
    |------------|--------|----------------|-----------|
    | 3/3 | 0/3 | Continue normally | Complete success |
    | 2/3 | 1/3 | Offer continue/retry/rollback | Minor issue, fixable |
    | 1/3 | 2/3 | Suggest rollback or retry | Major issue, risky state |
    | 0/3 | 3/3 | Restore backup, report error | Complete failure |
  </strategy>

  <strategy name="Modification Loop Limit">
    **Symptom:** User requests >2 modifications to model list

    **Recovery:**
    1. After 2 modification loops, force decision
    2. Present options:
       - Approve current list (proceed with update)
       - Abort update (preserve existing file)
       - Manually edit shared file (provide model list for reference)
    3. Explain why limit exists (prevent infinite loops, time management)
    4. Proceed based on user selection
  </strategy>
</error_recovery>

<success_criteria>
  Command execution is successful when:

  - ✅ TodoWrite initialized and all tasks completed
  - ✅ model-scraper successfully scraped ≥7 models (within 3 retry attempts)
  - ✅ Anthropic models filtered out (delegated to model-scraper)
  - ✅ Providers deduplicated with category balance (delegated to model-scraper)
  - ✅ User approved final model list
  - ✅ shared/recommended-models.md updated correctly (delegated to model-scraper)
  - ✅ Version number incremented (patch)
  - ✅ Last Updated date is current
  - ✅ Decision tree and examples preserved
  - ✅ Sync script completed successfully (or partial success with user approval)
  - ✅ All or approved-subset of plugin files updated
  - ✅ Git status shows expected changes

  **Quality Indicators:**
  - Model count: 9-12 (diverse selection)
  - Provider count: ≥5 different providers
  - Category balance: ≥2 models per category
  - No Anthropic models in final list
  - Max 2 models per provider (only with category balance override)
  - File structure preserved (decision tree intact)
  - Orchestrator never used Write/Edit tools (strict delegation)
</success_criteria>
