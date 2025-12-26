# Multi-Model Orchestration Design for SEO Plugin

**Version:** 1.0.0
**Date:** 2025-12-26
**Author:** Claude Code Agent Designer
**Plugin:** seo@mag-claude-plugins
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [New Command: /seo-review](#new-command-seo-review)
4. [New Command: /seo-alternatives](#new-command-seo-alternatives)
5. [Updated Command: /seo-optimize](#updated-command-seo-optimize)
6. [Updated Command: /seo-research](#updated-command-seo-research)
7. [Updated Agent: seo-editor](#updated-agent-seo-editor)
8. [Plugin Manifest Updates](#plugin-manifest-updates)
9. [Implementation Priority](#implementation-priority)

---

## Executive Summary

### Current Gap

The SEO plugin has vague references to multi-model validation but lacks concrete implementation:
- `/seo-optimize` mentions "optional multi-model validation" without details
- `seo-editor` has proxy mode support but no orchestration command to use it
- No content generation alternatives using multiple models
- No consensus analysis for SEO content quality

### Solution

This design adds:
1. **`/seo-review`** - Multi-model content quality validation with E-E-A-T consensus
2. **`/seo-alternatives`** - Parallel content generation for A/B testing
3. **Updated `/seo-optimize`** - Concrete multi-model validation implementation
4. **Updated `/seo-research`** - External model validation for keyword strategies

### Key Benefits

| Benefit | Impact |
|---------|--------|
| Parallel execution | 3-5x faster than sequential |
| Consensus analysis | Higher confidence in recommendations |
| E-E-A-T validation | Multiple perspectives on trust signals |
| Cost transparency | Clear cost estimates before execution |
| Content alternatives | Data-driven A/B testing |

---

## Architecture Overview

### Multi-Model Flow Diagram

```
                       User Request
                            |
                            v
                   +------------------+
                   |   Orchestrator   |
                   |  (/seo-review)   |
                   +------------------+
                            |
            +---------------+---------------+
            |               |               |
            v               v               v
    +------------+   +------------+   +------------+
    |  Internal  |   |  External  |   |  External  |
    | seo-editor |   | seo-editor |   | seo-editor |
    |  (Opus)    |   | PROXY Grok |   | PROXY Gem  |
    +------------+   +------------+   +------------+
            |               |               |
            v               v               v
    +------------+   +------------+   +------------+
    | review.md  |   | grok.md    |   | gemini.md  |
    +------------+   +------------+   +------------+
            |               |               |
            +---------------+---------------+
                            |
                            v
                   +------------------+
                   |   Consolidation  |
                   |  (Consensus)     |
                   +------------------+
                            |
                            v
                   +------------------+
                   |   Final Report   |
                   |  (Prioritized)   |
                   +------------------+
```

### Session-Based Architecture

All multi-model operations use session-based workspaces:

```
$SESSION_DIR/
├── session-meta.json       # Session metadata
├── tracking.md             # Model execution tracking (MANDATORY)
├── content-context.md      # Content being analyzed
├── reviews/
│   ├── opus-review.md      # Internal Opus review
│   ├── grok-review.md      # External Grok review
│   ├── gemini-review.md    # External Gemini review
│   └── consolidated.md     # Consensus analysis
├── alternatives/           # For /seo-alternatives
│   ├── grok-version.md
│   ├── gemini-version.md
│   └── comparison.md
├── consensus.md            # Cross-model agreement
└── failures.md             # Failure documentation
```

### Skill Dependencies

All multi-model commands require:
```yaml
skills: orchestration:multi-model-validation, orchestration:model-tracking-protocol, orchestration:quality-gates
```

---

## New Command: /seo-review

### Purpose

Validate SEO content quality using multiple AI models in parallel for consensus-based E-E-A-T feedback.

### File Location

`plugins/seo/commands/review.md`

### Complete Specification

```yaml
---
description: |
  Multi-model SEO content review with parallel execution and consensus analysis.
  Workflow: SESSION INIT -> DISCOVER MODELS -> SELECT MODELS -> PARALLEL REVIEW -> CONSENSUS -> PRESENT
  Validates E-E-A-T, readability, SEO compliance from multiple AI perspectives.
  Uses 4-Message Pattern for true parallel execution (3-5x speedup).
allowed-tools: Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep
skills: orchestration:multi-model-validation, orchestration:model-tracking-protocol, orchestration:quality-gates, seo:content-optimizer
---
```

### XML Structure

```xml
<role>
  <identity>Multi-Model SEO Content Review Orchestrator</identity>
  <expertise>
    - Parallel multi-model AI coordination for 3-5x speedup
    - E-E-A-T consensus analysis across diverse AI perspectives
    - Cost-aware external model management via Claudish proxy mode
    - Graceful degradation (works with/without external models)
    - SEO compliance validation from multiple viewpoints
  </expertise>
  <mission>
    Orchestrate comprehensive multi-model SEO content review with parallel execution,
    E-E-A-T consensus analysis, and actionable insights prioritized by reviewer agreement.

    Provide content creators with high-confidence SEO feedback by aggregating reviews
    from multiple AI models, highlighting E-E-A-T issues flagged by majority consensus
    while maintaining cost transparency.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <orchestrator_role>
      You are an ORCHESTRATOR, not a REVIEWER.

      **You MUST:**
      - Use Task tool to delegate ALL reviews to seo-editor agent
      - Use Bash for session setup and Claudish checks
      - Use Read/Glob/Grep to gather content context
      - Use TodoWrite to track workflow progress (all 6 phases)
      - Use AskUserQuestion for model selection and approval gates
      - Execute external reviews in PARALLEL (single message, multiple Task calls)
      - Follow 4-Message Pattern from orchestration:multi-model-validation

      **You MUST NOT:**
      - Write or edit ANY content files directly
      - Perform reviews yourself
      - Write review files yourself (delegate to seo-editor)
      - Run reviews sequentially (always parallel for external models)
    </orchestrator_role>

    <cost_transparency>
      Before running external models, MUST:
      1. Show estimated costs with INPUT/OUTPUT token separation
      2. Get explicit user approval
      3. Display cost breakdown per model
    </cost_transparency>

    <graceful_degradation>
      If Claudish unavailable or no external models selected:
      - Proceed with embedded Opus seo-editor only
      - Command must always provide value
      - Show message about benefits of multi-model review
    </graceful_degradation>

    <parallel_execution_requirement>
      CRITICAL: Execute ALL external model reviews in parallel using multiple Task
      invocations in a SINGLE message. This achieves 3-5x speedup vs sequential.

      **4-Message Pattern:**
      - Message 1: Session setup (Bash only)
      - Message 2: Parallel Task calls (Task only - single message with ---)
      - Message 3: Auto-consolidation (Task only)
      - Message 4: Present results

      See orchestration:multi-model-validation for complete pattern.
    </parallel_execution_requirement>

    <todowrite_requirement>
      You MUST use TodoWrite to track workflow:

      1. PHASE 0: Initialize session and tracking
      2. PHASE 1: Gather content to review
      3. PHASE 2: Discover models and user selection
      4. PHASE 3: Show costs and get approval
      5. PHASE 4: Execute parallel reviews
      6. PHASE 5: Consolidate with E-E-A-T consensus
      7. PHASE 6: Present prioritized results

      Update status as you progress. Only ONE task in_progress at a time.
    </todowrite_requirement>
  </critical_constraints>

  <workflow>
    <phase number="0" name="Session Initialization">
      <objective>Create session workspace for artifact isolation and tracking</objective>
      <steps>
        <step>Generate unique session ID:
          ```bash
          SESSION_ID="seo-review-$(date +%Y%m%d-%H%M%S)-$(head -c 4 /dev/urandom | xxd -p)"
          SESSION_DIR="/tmp/${SESSION_ID}"
          mkdir -p "$SESSION_DIR/reviews"
          SESSION_START=$(date +%s)
          ```
        </step>
        <step>Create tracking table (MANDATORY - see model-tracking-protocol):
          ```bash
          cat > "$SESSION_DIR/tracking.md" << 'EOF'
          # Multi-Model SEO Review Tracking

          ## Session Info
          - Session ID: ${SESSION_ID}
          - Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)

          ## Model Status

          | Model | Status | Duration | E-E-A-T | Issues | Notes |
          |-------|--------|----------|---------|--------|-------|

          ## Failures
          (populated as needed)

          ## E-E-A-T Consensus
          (populated after all complete)
          EOF
          ```
        </step>
        <step>Create tracking marker:
          ```bash
          echo "$SESSION_DIR" > /tmp/.claude-multi-model-active
          ```
        </step>
        <step>Initialize TodoWrite with 7 phases</step>
      </steps>
      <quality_gate>SESSION_DIR exists, tracking.md created, marker file written</quality_gate>
    </phase>

    <phase number="1" name="Content Gathering">
      <objective>Identify and load content for review</objective>
      <steps>
        <step>Ask user what to review:
          ```
          Options:
          1. Review a content file (specify path)
          2. Review text from clipboard/input
          3. Review a URL (will scrape)
          ```
        </step>
        <step>Gather content based on selection</step>
        <step>Ask for target keyword (if not specified in content)</step>
        <step>Write content context to $SESSION_DIR/content-context.md:
          - Content text
          - Target keyword
          - Content type (blog, landing page, product)
          - Word count
        </step>
        <step>Summarize content for user confirmation</step>
      </steps>
      <quality_gate>Content loaded, keyword identified, context file written</quality_gate>
    </phase>

    <phase number="2" name="Model Discovery and Selection">
      <objective>Discover available models and let user select</objective>
      <steps>
        <step>Check Claudish availability:
          ```bash
          if command -v claudish &> /dev/null || npx claudish --version &> /dev/null; then
            echo "Claudish available"
          else
            echo "Claudish not available - embedded only"
          fi
          ```
        </step>
        <step>If Claudish available, discover models:
          ```bash
          # Get top models for content review
          claudish --top-models

          # Get free models
          claudish --free
          ```
        </step>
        <step>Load historical performance from ai-docs/llm-performance.json (if exists)</step>
        <step>Present model selection using AskUserQuestion with multiSelect:
          ```typescript
          AskUserQuestion({
            questions: [{
              question: "Select models for E-E-A-T content review (embedded Opus always included)",
              header: "Models",
              multiSelect: true,
              options: [
                // Recommended for content review
                { label: "x-ai/grok-code-fast-1 ⚡", description: "$0.85/1M | Quality: 87% | Fast + creative" },
                { label: "google/gemini-3-pro-preview", description: "$7.00/1M | Quality: 91% | High accuracy" },
                { label: "openai/gpt-5.1-codex", description: "$5.63/1M | Quality: 89% | Strong reasoning" },
                // Free options
                { label: "qwen/qwen3-235b-a22b:free 🆓", description: "FREE | Quality: 82% | Large model" },
                { label: "mistralai/devstral-2512:free 🆓", description: "FREE | New model" },
              ]
            }]
          })
          ```
        </step>
        <step>Save selection to session: $SESSION_DIR/selected-models.txt</step>
      </steps>
      <quality_gate>At least embedded model confirmed, external models selected if available</quality_gate>
    </phase>

    <phase number="3" name="Cost Approval">
      <objective>Calculate costs and get user approval</objective>
      <steps>
        <step>Calculate estimated costs:
          - INPUT tokens: word count * 1.3 (content + instructions)
          - OUTPUT tokens: 2000-4000 per model (E-E-A-T review)
          - Per-model cost with INPUT/OUTPUT breakdown
        </step>
        <step>Present cost breakdown:
          ```markdown
          ## Estimated Review Costs

          Content: ~2000 words (~2600 input tokens per model)

          | Model | Input Cost | Output Cost | Total (Est) |
          |-------|------------|-------------|-------------|
          | opus-embedded | FREE | FREE | FREE |
          | x-ai/grok-code-fast-1 | $0.002 | $0.004 | ~$0.006 |
          | google/gemini-3-pro | $0.018 | $0.028 | ~$0.046 |

          **Total Estimated: $0.05 - $0.08**

          Proceed with multi-model review?
          ```
        </step>
        <step>Get explicit user approval</step>
        <step>If rejected, offer to reduce models or proceed with embedded only</step>
      </steps>
      <quality_gate>User explicitly approves costs or selects alternative</quality_gate>
    </phase>

    <phase number="4" name="Parallel Review Execution">
      <objective>Execute ALL reviews in parallel using 4-Message Pattern</objective>
      <steps>
        <step>Record per-model start times:
          ```bash
          declare -A MODEL_START_TIMES
          MODEL_START_TIMES["opus-embedded"]=$(date +%s)
          MODEL_START_TIMES["x-ai/grok-code-fast-1"]=$(date +%s)
          # etc for each model
          ```
        </step>
        <step>Launch embedded review (always first):
          ```
          Task: seo-editor
            Prompt: "SESSION_PATH: $SESSION_DIR

            Review the content at $SESSION_DIR/content-context.md for:
            1. E-E-A-T compliance (score each dimension 0-25)
            2. SEO technical requirements
            3. Readability metrics
            4. Keyword optimization

            Write detailed review to: $SESSION_DIR/reviews/opus-review.md

            RETURN: Brief verdict (2-3 sentences) + E-E-A-T total score only."
          ```
        </step>
        <step>Launch ALL external reviews in SINGLE message (parallel):
          ```
          ---
          Task: seo-editor PROXY_MODE: x-ai/grok-code-fast-1
            Prompt: "SESSION_PATH: $SESSION_DIR

            Review the content at $SESSION_DIR/content-context.md for:
            1. E-E-A-T compliance (Experience, Expertise, Authority, Trust)
            2. SEO requirements (meta, headings, keyword density)
            3. Readability and engagement

            Write detailed review to: $SESSION_DIR/reviews/grok-review.md

            RETURN: Brief verdict + E-E-A-T total score only."
          ---
          Task: seo-editor PROXY_MODE: google/gemini-3-pro-preview
            Prompt: "SESSION_PATH: $SESSION_DIR

            Review the content at $SESSION_DIR/content-context.md for:
            1. E-E-A-T compliance (Experience, Expertise, Authority, Trust)
            2. SEO requirements (meta, headings, keyword density)
            3. Readability and engagement

            Write detailed review to: $SESSION_DIR/reviews/gemini-review.md

            RETURN: Brief verdict + E-E-A-T total score only."
          ---
          [Additional models as selected]
          ```
        </step>
        <step>Update tracking table as each completes:
          ```bash
          # After each TaskOutput returns
          update_model_status() {
            local model="$1" status="$2" eeat_score="$3" issues="$4"
            local end_time=$(date +%s)
            local duration=$((end_time - MODEL_START_TIMES["$model"]))
            echo "| $model | $status | ${duration}s | $eeat_score | $issues | |" >> "$SESSION_DIR/tracking.md"
            track_model_performance "$model" "$status" "$duration" "$issues" "${eeat_score:-}"
          }
          ```
        </step>
        <step>Handle failures gracefully - document in $SESSION_DIR/failures.md</step>
      </steps>
      <quality_gate>At least 2 reviews completed (embedded + 1 external OR 2 external)</quality_gate>
    </phase>

    <phase number="5" name="E-E-A-T Consensus Analysis">
      <objective>Consolidate reviews with E-E-A-T-specific consensus analysis</objective>
      <steps>
        <step>Read all review files from $SESSION_DIR/reviews/</step>
        <step>Extract E-E-A-T scores from each review:
          - Experience (0-25) per model
          - Expertise (0-25) per model
          - Authoritativeness (0-25) per model
          - Trustworthiness (0-25) per model
        </step>
        <step>Calculate E-E-A-T consensus:
          ```markdown
          ## E-E-A-T Consensus Matrix

          | Dimension | Opus | Grok | Gemini | Avg | Consensus |
          |-----------|------|------|--------|-----|-----------|
          | Experience | 18 | 16 | 19 | 17.7 | AGREE |
          | Expertise | 22 | 20 | 21 | 21.0 | STRONG |
          | Authority | 15 | 12 | 14 | 13.7 | AGREE |
          | Trust | 20 | 22 | 21 | 21.0 | UNANIMOUS |
          | **TOTAL** | 75 | 70 | 75 | 73.3 | **PASS** |
          ```
        </step>
        <step>Categorize issues by consensus level:
          - UNANIMOUS: All models flagged this issue
          - STRONG: 67%+ of models agree
          - MAJORITY: 50%+ of models agree
          - DIVERGENT: Single model flagged
        </step>
        <step>Prioritize by consensus level then severity</step>
        <step>Write consolidated report to $SESSION_DIR/reviews/consolidated.md</step>
        <step>Write consensus analysis to $SESSION_DIR/consensus.md</step>
      </steps>
      <quality_gate>Consolidated report with E-E-A-T consensus, prioritized issues</quality_gate>
    </phase>

    <phase number="6" name="Present Results">
      <objective>Present prioritized results with E-E-A-T focus</objective>
      <steps>
        <step>Calculate session statistics:
          ```bash
          PARALLEL_TIME=$(max of all durations)
          SEQUENTIAL_TIME=$(sum of all durations)
          SPEEDUP=$(echo "scale=1; $SEQUENTIAL_TIME / $PARALLEL_TIME" | bc)
          record_session_stats $TOTAL $SUCCESS $FAILED $PARALLEL_TIME $SEQUENTIAL_TIME $SPEEDUP
          ```
        </step>
        <step>Generate brief user summary (under 50 lines)</step>
        <step>Present E-E-A-T consensus scorecard</step>
        <step>Present top 5 issues by consensus</step>
        <step>Display model performance statistics table</step>
        <step>Present recommendations for slow/failing models</step>
        <step>Link to detailed reports in session directory</step>
        <step>Cleanup tracking marker: rm -f /tmp/.claude-multi-model-active</step>
      </steps>
      <quality_gate>User receives actionable summary with E-E-A-T consensus</quality_gate>
    </phase>
  </workflow>
</instructions>

<knowledge>
  <eeat_consensus_methodology>
    **E-E-A-T Consensus Analysis**

    Multi-model E-E-A-T validation provides:
    1. **Diverse perspectives** on trust signals
    2. **Higher confidence** when models agree
    3. **Nuanced understanding** when models disagree

    **Consensus Levels for E-E-A-T:**

    | Level | Agreement | Confidence | Action |
    |-------|-----------|------------|--------|
    | UNANIMOUS | All models within 3 points | VERY HIGH | Reliable assessment |
    | STRONG | 67%+ within 5 points | HIGH | Trustworthy assessment |
    | AGREE | 50%+ within 7 points | MEDIUM | Reasonable assessment |
    | DIVERGENT | Wide spread (>10 points) | LOW | Investigate differences |

    **When Models Disagree:**

    - Different models may weigh E-E-A-T dimensions differently
    - Cultural/regional perspectives may vary
    - Some models better at detecting specific signals
    - Use divergence as opportunity to investigate
  </eeat_consensus_methodology>

  <recommended_models_for_content>
    **Best Models for SEO Content Review:**

    | Model | Strength | E-E-A-T Specialty |
    |-------|----------|-------------------|
    | claude-opus | Nuanced analysis | All dimensions balanced |
    | grok | Creative assessment | Experience detection |
    | gemini | Factual accuracy | Trustworthiness |
    | gpt-5 | Comprehensive | Expertise depth |
    | qwen | Technical accuracy | Authority signals |

    **Recommended Combinations:**

    - **Quick (2 models):** Opus + Grok (~$0.01)
    - **Thorough (3 models):** Opus + Grok + Gemini (~$0.05)
    - **Comprehensive (5 models):** All above (~$0.10)
  </recommended_models_for_content>
</knowledge>

<examples>
  <example name="Multi-Model E-E-A-T Review">
    <user_request>/seo-review content/blog/marketing-guide.md --keyword "content marketing"</user_request>
    <execution>
      **PHASE 0:** Session created: seo-review-20251226-143022-a3f2
      **PHASE 1:** Content loaded (2500 words), keyword confirmed
      **PHASE 2:** User selects: Opus + Grok + Gemini
      **PHASE 3:** Cost approved: ~$0.05
      **PHASE 4:** 3 parallel reviews complete in 52s (vs 156s sequential)
      **PHASE 5:** E-E-A-T consensus:
        - Experience: 17.7/25 (AGREE)
        - Expertise: 21.0/25 (STRONG)
        - Authority: 13.7/25 (AGREE - needs work)
        - Trust: 21.0/25 (UNANIMOUS)
        - **TOTAL: 73.3/100 (PASS)**
      **PHASE 6:** Top issues by consensus:
        1. [UNANIMOUS] Add more cited sources (Authority)
        2. [STRONG] Include personal case study (Experience)
        3. [MAJORITY] Improve meta description

      Speedup: 3.0x | Cost: $0.047
    </execution>
  </example>

  <example name="Embedded Only Fallback">
    <user_request>/seo-review (Claudish unavailable)</user_request>
    <execution>
      **PHASE 0:** Session created
      **PHASE 1:** Content loaded
      **PHASE 2:** Claudish not available - using embedded Opus only
      **PHASE 4:** Single Opus review complete
      **PHASE 5:** Single-model E-E-A-T scores (no consensus)
      **PHASE 6:** Present results with note:
        "Single-model review. For multi-model consensus, install Claudish."
    </execution>
  </example>
</examples>

<error_recovery>
  <strategy scenario="No external models available">
    Proceed with embedded Opus. Show benefits of multi-model review.
    Offer to help user set up Claudish/OpenRouter.
  </strategy>

  <strategy scenario="Some external reviews fail">
    Continue with successful reviews. Document failures.
    Adjust consensus calculations for actual model count.
    Note which models failed and why in results.
  </strategy>

  <strategy scenario="All external reviews fail">
    Fall back to embedded Opus review.
    Show detailed error messages.
    Recommend troubleshooting steps.
  </strategy>

  <strategy scenario="User rejects cost">
    Offer alternatives:
    1. Use free models only (qwen, mistral free tier)
    2. Use embedded Opus only (FREE)
    3. Reduce number of models
  </strategy>
</error_recovery>

<formatting>
  <completion_template>
## SEO Multi-Model Review Complete

**Session:** ${SESSION_ID}
**Content:** ${content_title}
**Target Keyword:** ${keyword}
**Models Used:** ${model_count}

---

### E-E-A-T Consensus Scorecard

| Dimension | Opus | Grok | Gemini | Avg | Consensus |
|-----------|------|------|--------|-----|-----------|
| Experience | ${e1} | ${e2} | ${e3} | ${avg_e} | ${cons_e} |
| Expertise | ${ex1} | ${ex2} | ${ex3} | ${avg_ex} | ${cons_ex} |
| Authoritativeness | ${a1} | ${a2} | ${a3} | ${avg_a} | ${cons_a} |
| Trustworthiness | ${t1} | ${t2} | ${t3} | ${avg_t} | ${cons_t} |
| **TOTAL** | ${total1} | ${total2} | ${total3} | **${avg_total}** | **${verdict}** |

---

### Top Issues by Consensus

1. **[UNANIMOUS]** ${issue1}
2. **[STRONG]** ${issue2}
3. **[MAJORITY]** ${issue3}
4. **[DIVERGENT]** ${issue4}

---

### Model Performance

| Model | Time | E-E-A-T | Issues | Cost |
|-------|------|---------|--------|------|
| opus-embedded | ${t1}s | ${eeat1}/100 | ${i1} | FREE |
| ${model2} | ${t2}s | ${eeat2}/100 | ${i2} | ${cost2} |
| ${model3} | ${t3}s | ${eeat3}/100 | ${i3} | ${cost3} |

**Parallel Speedup:** ${speedup}x
**Total Cost:** ${total_cost}

---

### Detailed Reports

- Consolidated: ${SESSION_DIR}/reviews/consolidated.md
- E-E-A-T Consensus: ${SESSION_DIR}/consensus.md
- Individual reviews: ${SESSION_DIR}/reviews/*.md

### Next Steps

${recommendations}
  </completion_template>
</formatting>
```

---

## New Command: /seo-alternatives

### Purpose

Generate multiple alternative content versions using different AI models for comparison and A/B testing.

### File Location

`plugins/seo/commands/alternatives.md`

### Complete Specification

```yaml
---
description: |
  Generate multiple content alternatives using parallel external AI models.
  Workflow: SESSION INIT -> REQUIREMENTS -> MODEL SELECT -> PARALLEL GENERATE -> COMPARE -> SELECT
  Creates 3-5 alternative headlines, descriptions, or content sections for A/B testing.
allowed-tools: Task, AskUserQuestion, Bash, Read, Write, TodoWrite, Glob, Grep
skills: orchestration:multi-model-validation, orchestration:model-tracking-protocol, seo:content-optimizer
---
```

### XML Structure

```xml
<role>
  <identity>Multi-Model Content Alternatives Orchestrator</identity>
  <expertise>
    - Parallel content generation across AI models
    - A/B content variant creation
    - SEO-optimized alternative comparison
    - Creative diversity from different model perspectives
  </expertise>
  <mission>
    Generate multiple SEO-optimized content alternatives using diverse AI models,
    compare them on key SEO metrics, and help users select the best version
    for their needs or set up A/B testing.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <orchestrator_role>
      You are an ORCHESTRATOR generating alternatives, not writing content yourself.

      **You MUST:**
      - Use Task to delegate generation to seo-writer agent (with PROXY_MODE)
      - Use Task to delegate evaluation to seo-editor agent
      - Execute generation in PARALLEL for speed
      - Compare alternatives on SEO metrics

      **You MUST NOT:**
      - Write content alternatives yourself
      - Skip the comparison phase
    </orchestrator_role>

    <parallel_generation>
      CRITICAL: Generate ALL alternatives in parallel using multiple Task calls
      in a SINGLE message. Each model produces a unique perspective.

      **4-Message Pattern:**
      - Message 1: Session setup + requirements gathering
      - Message 2: Parallel Task calls to seo-writer with different PROXY_MODE models
      - Message 3: Parallel Task calls to seo-editor to evaluate each alternative
      - Message 4: Present comparison and recommendation
    </parallel_generation>

    <diversity_requirement>
      Select models with DIFFERENT strengths for maximum diversity:
      - Grok: Creative, engaging, conversational
      - Gemini: Factual, comprehensive, authoritative
      - GPT-5: Balanced, well-structured, professional
      - Claude: Nuanced, thoughtful, detail-oriented
      - Qwen: Technical accuracy, data-driven
    </diversity_requirement>
  </critical_constraints>

  <workflow>
    <phase number="0" name="Session Initialization">
      <objective>Create session workspace</objective>
      <steps>
        <step>Generate SESSION_ID: seo-alternatives-TIMESTAMP-HASH</step>
        <step>Create $SESSION_DIR/alternatives/ directory</step>
        <step>Create tracking table (MANDATORY)</step>
        <step>Create tracking marker file</step>
      </steps>
    </phase>

    <phase number="1" name="Requirements Gathering">
      <objective>Understand what alternatives to generate</objective>
      <steps>
        <step>Ask user for alternative type:
          ```
          What would you like to generate alternatives for?

          1. Headlines/Titles (5-10 variations)
          2. Meta Descriptions (3-5 variations)
          3. Introduction paragraphs (3 variations)
          4. Full section/article (2-3 variations)
          5. CTAs/Call-to-Actions (5-10 variations)
          ```
        </step>
        <step>Gather context:
          - Target keyword
          - Tone preference (professional, casual, urgent, etc.)
          - Brand voice guidelines (if any)
          - Existing content to improve (if applicable)
        </step>
        <step>Determine word count/character limits</step>
        <step>Write requirements to $SESSION_DIR/requirements.md</step>
      </steps>
    </phase>

    <phase number="2" name="Model Selection">
      <objective>Select diverse models for maximum creativity</objective>
      <steps>
        <step>Check Claudish availability</step>
        <step>Present model selection with diversity focus:
          ```typescript
          AskUserQuestion({
            questions: [{
              question: "Select 3-5 models for diverse alternatives (different strengths recommended)",
              header: "Creative Diversity",
              multiSelect: true,
              options: [
                { label: "x-ai/grok-code-fast-1", description: "Creative, engaging, conversational" },
                { label: "google/gemini-3-pro", description: "Factual, comprehensive, authoritative" },
                { label: "openai/gpt-5.1-codex", description: "Balanced, well-structured, professional" },
                { label: "qwen/qwen3-235b-a22b:free 🆓", description: "Technical accuracy, data-driven" },
              ]
            }]
          })
          ```
        </step>
        <step>Calculate and show cost estimate</step>
        <step>Get user approval</step>
      </steps>
    </phase>

    <phase number="3" name="Parallel Generation">
      <objective>Generate alternatives from all models in parallel</objective>
      <steps>
        <step>Record start times per model</step>
        <step>Launch ALL generations in SINGLE message:
          ```
          Task: seo-writer PROXY_MODE: x-ai/grok-code-fast-1
            Prompt: "Generate ${alternative_type} for keyword: ${keyword}
                    Tone: ${tone}
                    Requirements: ${requirements}
                    Write to: $SESSION_DIR/alternatives/grok-version.md
                    RETURN: Brief summary of your approach."
          ---
          Task: seo-writer PROXY_MODE: google/gemini-3-pro
            Prompt: "Generate ${alternative_type} for keyword: ${keyword}
                    Tone: ${tone}
                    Requirements: ${requirements}
                    Write to: $SESSION_DIR/alternatives/gemini-version.md
                    RETURN: Brief summary of your approach."
          ---
          [Additional models...]
          ```
        </step>
        <step>Update tracking as each completes</step>
      </steps>
    </phase>

    <phase number="4" name="Parallel Evaluation">
      <objective>Evaluate each alternative on SEO metrics</objective>
      <steps>
        <step>Launch parallel evaluations (seo-editor for each alternative):
          - Keyword optimization score
          - E-E-A-T alignment
          - Readability score
          - Engagement potential
          - Uniqueness/differentiation
        </step>
        <step>Each evaluation writes to $SESSION_DIR/alternatives/{model}-eval.md</step>
      </steps>
    </phase>

    <phase number="5" name="Comparison and Selection">
      <objective>Compare alternatives and help user select</objective>
      <steps>
        <step>Read all alternatives and evaluations</step>
        <step>Create comparison matrix:
          ```markdown
          ## Alternative Comparison

          | Metric | Grok | Gemini | GPT-5 | Qwen |
          |--------|------|--------|-------|------|
          | Keyword Score | 85 | 90 | 88 | 92 |
          | Readability | 72 | 65 | 68 | 60 |
          | E-E-A-T | 70 | 85 | 78 | 75 |
          | Engagement | 88 | 70 | 75 | 65 |
          | **TOTAL** | 315 | 310 | 309 | 292 |
          ```
        </step>
        <step>Highlight unique strengths of each:
          - "Grok's version is most engaging, best for social"
          - "Gemini's version is most authoritative, best for YMYL"
        </step>
        <step>Recommend:
          1. Top choice (highest total score)
          2. Best for specific use case
          3. Suggestion to A/B test top 2
        </step>
        <step>Write comparison to $SESSION_DIR/alternatives/comparison.md</step>
      </steps>
    </phase>

    <phase number="6" name="Present Results">
      <objective>Present alternatives with recommendations</objective>
      <steps>
        <step>Show all alternatives side-by-side (abbreviated)</step>
        <step>Present comparison matrix</step>
        <step>Highlight recommended choice</step>
        <step>Suggest A/B testing setup if close scores</step>
        <step>Link to full files</step>
        <step>Cleanup tracking marker</step>
      </steps>
    </phase>
  </workflow>
</instructions>

<knowledge>
  <alternative_types>
    **Types of Alternatives and Model Assignments:**

    | Type | Best Models | Output Count |
    |------|-------------|--------------|
    | Headlines | Grok (creative), Gemini (factual) | 5-10 |
    | Meta Descriptions | GPT-5 (concise), Claude (nuanced) | 3-5 |
    | Introductions | Grok (engaging), Gemini (authoritative) | 3 |
    | Full Sections | All models | 2-3 |
    | CTAs | Grok (urgent), GPT-5 (professional) | 5-10 |
  </alternative_types>

  <evaluation_criteria>
    **SEO Alternative Evaluation Metrics:**

    | Metric | Weight | Description |
    |--------|--------|-------------|
    | Keyword Score | 25% | Keyword placement and density |
    | Readability | 20% | Flesch score, sentence length |
    | E-E-A-T | 25% | Trust signals present |
    | Engagement | 20% | Hook, emotional appeal |
    | Uniqueness | 10% | Differentiation from competitors |
  </evaluation_criteria>
</knowledge>

<examples>
  <example name="Headline Alternatives">
    <user_request>/seo-alternatives headlines --keyword "content marketing"</user_request>
    <execution>
      PHASE 1: User wants 5 headline alternatives
      PHASE 2: Selects Grok, Gemini, GPT-5
      PHASE 3: 3 models generate 5 headlines each (15 total) in parallel
      PHASE 4: seo-editor evaluates all 15
      PHASE 5: Comparison shows:
        - Best overall: "10 Content Marketing Strategies That Actually Work in 2025" (Grok)
        - Most authoritative: "The Complete Guide to Content Marketing for B2B" (Gemini)
        - Best for clicks: "Why Your Content Marketing Is Failing (And How to Fix It)" (Grok)
      PHASE 6: Recommend A/B test top 2
    </execution>
  </example>
</examples>

<formatting>
  <completion_template>
## Content Alternatives Generated

**Type:** ${alternative_type}
**Keyword:** ${keyword}
**Models Used:** ${model_count}
**Alternatives Created:** ${total_alternatives}

---

### Top Alternatives

**#1 - ${top_model} (Score: ${score1})**
${alternative1}

**#2 - ${second_model} (Score: ${score2})**
${alternative2}

**#3 - ${third_model} (Score: ${score3})**
${alternative3}

---

### Comparison Matrix

| Metric | ${model1} | ${model2} | ${model3} |
|--------|-----------|-----------|-----------|
| Keyword | ${kw1} | ${kw2} | ${kw3} |
| Readability | ${r1} | ${r2} | ${r3} |
| E-E-A-T | ${e1} | ${e2} | ${e3} |
| Engagement | ${eng1} | ${eng2} | ${eng3} |
| **TOTAL** | ${t1} | ${t2} | ${t3} |

---

### Recommendations

**Top Choice:** ${recommendation}
**A/B Test:** ${ab_suggestion}

### Files

- All alternatives: ${SESSION_DIR}/alternatives/
- Comparison: ${SESSION_DIR}/alternatives/comparison.md
  </completion_template>
</formatting>
```

---

## Updated Command: /seo-optimize

### Current State

The current `/seo-optimize` has a vague "multi_model_option" section that needs concrete implementation.

### Updated Section

Replace the `<multi_model_option>` section with:

```xml
<phase number="4.5" name="Multi-Model Validation (Optional)">
  <objective>Validate optimizations using multiple AI perspectives</objective>
  <trigger>User selected multi-model validation in Phase 2</trigger>

  <steps>
    <step>Create validation session:
      ```bash
      VALIDATION_SESSION="$SESSION_PATH/multi-model-validation"
      mkdir -p "$VALIDATION_SESSION"
      echo "$VALIDATION_SESSION" > /tmp/.claude-multi-model-active
      VALIDATION_START=$(date +%s)
      ```
    </step>

    <step>Copy optimized content for validation:
      ```bash
      cp "$SESSION_PATH/optimized-content.md" "$VALIDATION_SESSION/content.md"
      ```
    </step>

    <step>Model discovery (if not cached):
      ```bash
      claudish --top-models  # Get available models
      claudish --free        # Get free options
      ```
    </step>

    <step>Interactive model selection:
      ```typescript
      AskUserQuestion({
        questions: [{
          question: "Select models to validate your optimizations",
          header: "Validation Models",
          multiSelect: true,
          options: [
            { label: "Quick (1 model)", description: "Standard seo-editor review - FREE" },
            { label: "Thorough (3 models)", description: "Opus + Grok + Gemini - ~$0.02" },
            { label: "Comprehensive (5 models)", description: "Add GPT-5 + DeepSeek - ~$0.05" },
          ]
        }]
      })
      ```
    </step>

    <step>Execute parallel validation (4-Message Pattern):
      ```
      Message 1: Preparation complete above

      Message 2: Parallel Task calls
      Task: seo-editor
        Prompt: "Validate optimizations at $VALIDATION_SESSION/content.md
                 Compare to original: $SESSION_PATH/original-content.md
                 Write review to: $VALIDATION_SESSION/opus-review.md"
      ---
      Task: seo-editor PROXY_MODE: x-ai/grok-code-fast-1
        Prompt: "Validate optimizations at $VALIDATION_SESSION/content.md
                 Write review to: $VALIDATION_SESSION/grok-review.md"
      ---
      Task: seo-editor PROXY_MODE: google/gemini-3-pro-preview
        Prompt: "Validate optimizations at $VALIDATION_SESSION/content.md
                 Write review to: $VALIDATION_SESSION/gemini-review.md"

      Message 3: Consolidate reviews with consensus
      Task: seo-editor
        Prompt: "Consolidate reviews from $VALIDATION_SESSION/*.md
                 Apply consensus analysis (unanimous > strong > majority)
                 Write to: $VALIDATION_SESSION/consolidated.md"

      Message 4: Present validation results
      ```
    </step>

    <step>Track performance:
      ```bash
      track_model_performance "opus-embedded" "success" $OPUS_TIME $OPUS_ISSUES $OPUS_QUALITY
      track_model_performance "x-ai/grok-code-fast-1" "success" $GROK_TIME $GROK_ISSUES
      track_model_performance "google/gemini-3-pro" "success" $GEMINI_TIME $GEMINI_ISSUES

      PARALLEL_TIME=$(max of times)
      SEQUENTIAL_TIME=$(sum of times)
      SPEEDUP=$(echo "scale=1; $SEQUENTIAL_TIME / $PARALLEL_TIME" | bc)

      record_session_stats 3 3 0 $PARALLEL_TIME $SEQUENTIAL_TIME $SPEEDUP
      ```
    </step>

    <step>Present validation results:
      - Before/After E-E-A-T comparison by consensus
      - Issues found with consensus levels
      - Model agreement on optimization quality
      - Recommendations for further improvement
    </step>

    <step>Cleanup:
      ```bash
      rm -f /tmp/.claude-multi-model-active
      ```
    </step>
  </steps>

  <quality_gate>
    Validation complete with consensus analysis.
    At least 2 models agree on optimization quality.
    Performance statistics recorded.
  </quality_gate>
</phase>
```

### Updated Skills Reference

Change the frontmatter to:
```yaml
skills: orchestration:quality-gates, orchestration:multi-model-validation, orchestration:model-tracking-protocol, seo:content-optimizer
```

---

## Updated Command: /seo-research

### Current State

The command has no multi-model validation for keyword strategies.

### New Phase to Add

Insert between Phase 3 and Phase 4:

```xml
<phase number="3.5" name="Keyword Strategy Validation (Optional)">
  <objective>Validate keyword strategy using external AI perspectives</objective>
  <trigger>User opts for multi-model validation when prompted</trigger>

  <steps>
    <step>After keyword expansion, prompt user:
      ```typescript
      AskUserQuestion({
        questions: [{
          question: "Would you like to validate this keyword strategy with external AI models?",
          header: "Multi-Model Validation",
          options: [
            { label: "Yes - Quick validation (2 models)", description: "~30s, ~$0.01" },
            { label: "Yes - Thorough validation (4 models)", description: "~60s, ~$0.03" },
            { label: "No - Continue with current analysis", description: "Skip external validation" },
          ]
        }]
      })
      ```
    </step>

    <step>If user selects validation, create validation session:
      ```bash
      VALIDATION_SESSION="$SESSION_PATH/keyword-validation"
      mkdir -p "$VALIDATION_SESSION"
      cp "$SESSION_PATH/keyword-research.md" "$VALIDATION_SESSION/keywords.md"
      ```
    </step>

    <step>Execute parallel keyword validation:
      ```
      Task: seo-analyst PROXY_MODE: x-ai/grok-code-fast-1
        Prompt: "Validate keyword strategy at $VALIDATION_SESSION/keywords.md
                 Assess:
                 1. Competition difficulty accuracy
                 2. Intent classification correctness
                 3. Content gap validity
                 4. Cluster coherence
                 Write to: $VALIDATION_SESSION/grok-validation.md"
      ---
      Task: seo-analyst PROXY_MODE: google/gemini-3-pro-preview
        Prompt: "Validate keyword strategy at $VALIDATION_SESSION/keywords.md
                 Assess same criteria.
                 Write to: $VALIDATION_SESSION/gemini-validation.md"
      ```
    </step>

    <step>Consolidate keyword validation:
      - Compare intent classifications across models
      - Identify keywords where models disagree on difficulty
      - Highlight clusters with consensus support
      - Flag keywords with conflicting assessments
    </step>

    <step>Present validation summary:
      ```markdown
      ## Keyword Strategy Validation

      | Cluster | Opus | Grok | Gemini | Consensus |
      |---------|------|------|--------|-----------|
      | "content marketing" | High Priority | High | High | UNANIMOUS |
      | "content strategy" | Medium | High | Medium | MAJORITY Medium |
      | "blog writing" | Low | Low | Medium | MAJORITY Low |

      **High Confidence Keywords (Unanimous):** 45/75 (60%)
      **Moderate Confidence (Majority):** 25/75 (33%)
      **Needs Review (Divergent):** 5/75 (7%)
      ```
    </step>

    <step>Offer to refine divergent keywords:
      - Present keywords where models disagree
      - Ask user to confirm or adjust priorities
    </step>
  </steps>

  <quality_gate>
    Validation complete OR user skipped.
    Divergent keywords flagged for review.
  </quality_gate>
</phase>
```

### Updated Skills Reference

Change the frontmatter to:
```yaml
skills: orchestration:multi-agent-coordination, orchestration:multi-model-validation, orchestration:quality-gates, orchestration:error-recovery
```

---

## Updated Agent: seo-editor

### Current State

The agent has proxy mode support but needs enhanced patterns for multi-model orchestration.

### Updates Required

1. **Enhanced PROXY_MODE handling** with timing instrumentation
2. **E-E-A-T scoring output format** for consensus analysis
3. **Brief summary return pattern** for orchestrator efficiency

### Updated Proxy Mode Section

```xml
<proxy_mode_support>
  **FIRST STEP: Check for Proxy Mode Directive**

  If prompt starts with `PROXY_MODE: {model_name}`:

  1. Extract model name (e.g., "x-ai/grok-code-fast-1")
  2. Extract actual task (everything after PROXY_MODE line)
  3. Record start time for instrumentation:
     ```bash
     PROXY_START=$(date +%s)
     ```
  4. Delegate via Claudish (BLOCKING execution):
     ```bash
     AGENT_PROMPT="Use the Task tool to launch the 'seo-editor' agent with this task:

{actual_task}"

     RESULT=$(printf '%s' "$AGENT_PROMPT" | npx claudish --stdin --model {model_name} --quiet --auto-approve)
     ```
  5. Write detailed output to specified file path
  6. Calculate duration:
     ```bash
     PROXY_END=$(date +%s)
     DURATION=$((PROXY_END - PROXY_START))
     ```
  7. Return BRIEF summary only (2-5 sentences):
     ```markdown
     ## Review via {model_name}

     **E-E-A-T Score:** {total}/100
     **Issues Found:** {count}
     **Verdict:** {PASS|CONDITIONAL|FAIL}
     **Duration:** {duration}s

     Full review: {output_file_path}

     ---
     *Generated by: {model_name} via Claudish*
     ```
  8. **STOP** - Do not execute locally

  **CRITICAL:** Use BLOCKING execution (no &), wait for full response.

  **If NO PROXY_MODE**: Proceed with normal workflow
</proxy_mode_support>
```

### Add E-E-A-T Output Format for Consensus

```xml
<eeat_output_format>
  **MANDATORY: E-E-A-T Scores for Consensus Analysis**

  When reviewing content, ALWAYS include structured E-E-A-T scores:

  ```markdown
  ## E-E-A-T Assessment

  | Dimension | Score | Evidence |
  |-----------|-------|----------|
  | Experience | {0-25} | {brief justification} |
  | Expertise | {0-25} | {brief justification} |
  | Authoritativeness | {0-25} | {brief justification} |
  | Trustworthiness | {0-25} | {brief justification} |
  | **TOTAL** | **{0-100}** | **{PASS/CONDITIONAL/FAIL}** |
  ```

  This structured format enables:
  - Cross-model E-E-A-T comparison
  - Dimension-specific consensus analysis
  - Quantified improvement tracking
</eeat_output_format>
```

---

## Plugin Manifest Updates

### Updated plugin.json

```json
{
  "name": "seo",
  "version": "1.1.0",
  "description": "Comprehensive SEO toolkit with keyword research, content optimization, technical audits, and multi-model content validation. Features multi-model E-E-A-T consensus analysis, parallel content alternative generation, and cost-transparent external AI integration.",
  "author": {
    "name": "Jack Rudenko",
    "email": "i@madappgang.com",
    "company": "MadAppGang"
  },
  "license": "MIT",
  "keywords": [
    "seo",
    "content-optimization",
    "keyword-research",
    "serp-analysis",
    "technical-seo",
    "content-strategy",
    "multi-model",
    "eeat",
    "content-validation"
  ],
  "category": "content",
  "dependencies": {
    "orchestration@mag-claude-plugins": "^0.6.0"
  },
  "agents": [
    "./agents/analyst.md",
    "./agents/researcher.md",
    "./agents/writer.md",
    "./agents/editor.md"
  ],
  "commands": [
    "./commands/research.md",
    "./commands/optimize.md",
    "./commands/brief.md",
    "./commands/audit.md",
    "./commands/review.md",
    "./commands/alternatives.md"
  ],
  "skills": [
    "./skills/keyword-cluster-builder",
    "./skills/content-optimizer",
    "./skills/content-brief",
    "./skills/technical-audit",
    "./skills/serp-analysis",
    "./skills/schema-markup",
    "./skills/link-strategy"
  ]
}
```

---

## Implementation Priority

### Phase 1: Core Multi-Model Infrastructure (Priority: CRITICAL)

1. **Create `/seo-review` command** - Full implementation as specified above
2. **Update `seo-editor` agent** - Enhanced proxy mode and E-E-A-T output format
3. **Update `plugin.json`** - Add new commands and orchestration dependency

### Phase 2: Content Alternatives (Priority: HIGH)

4. **Create `/seo-alternatives` command** - Parallel generation workflow
5. **Add `seo-writer` proxy mode support** (if not present)

### Phase 3: Enhance Existing Commands (Priority: MEDIUM)

6. **Update `/seo-optimize`** - Add concrete PHASE 4.5 multi-model validation
7. **Update `/seo-research`** - Add optional PHASE 3.5 keyword validation

### Implementation Checklist

```
[ ] Create commands/review.md (complete specification above)
[ ] Create commands/alternatives.md (complete specification above)
[ ] Update agents/editor.md (enhanced proxy mode, E-E-A-T format)
[ ] Update commands/optimize.md (add PHASE 4.5)
[ ] Update commands/research.md (add PHASE 3.5)
[ ] Update plugin.json (new commands, updated version)
[ ] Test /seo-review with 3 external models
[ ] Test /seo-alternatives with 3 models
[ ] Test /seo-optimize multi-model validation
[ ] Test graceful degradation (no Claudish)
[ ] Verify performance statistics in ai-docs/llm-performance.json
```

---

## Summary

This design adds comprehensive multi-model orchestration to the SEO plugin:

| Component | Type | Purpose |
|-----------|------|---------|
| `/seo-review` | New Command | Multi-model E-E-A-T content validation |
| `/seo-alternatives` | New Command | Parallel content generation for A/B testing |
| `/seo-optimize` PHASE 4.5 | Update | Concrete multi-model optimization validation |
| `/seo-research` PHASE 3.5 | Update | Optional keyword strategy validation |
| `seo-editor` | Update | Enhanced proxy mode + E-E-A-T output format |

**Key Patterns Used:**
- 4-Message Pattern for true parallel execution
- Session-based artifact isolation
- Mandatory tracking protocol (model-tracking-protocol skill)
- E-E-A-T-specific consensus analysis
- Cost transparency with user approval gates
- Graceful degradation for environments without Claudish

**Expected Improvements:**
- 3-5x faster multi-model reviews (parallel vs sequential)
- Higher confidence through E-E-A-T consensus
- Content alternative generation for data-driven decisions
- Performance tracking for model optimization over time
