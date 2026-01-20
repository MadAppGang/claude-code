---
name: autonomous-keyword-research
description: Use when running fully autonomous keyword research workflows with discovery, expansion, clustering, and prioritization phases. Operates with ~80% autonomy using AUTO GATEs and self-correction loops.
keywords: [autonomous-keyword-research, keyword-discovery, keyword-expansion, keyword-clustering, topic-clusters, serp-analysis, auto-gate, self-correction, retry-protocol]
plugin: seo
updated: 2026-01-20
---

# Autonomous Keyword Research Skill

Fully autonomous keyword research workflow with discovery, clustering, and prioritization.
Operates with ~80% autonomy - only final approval requires user interaction.

---

## Overview

This skill enables a complete keyword research workflow that runs autonomously through
multiple phases, using AUTO GATEs to progress between steps and self-correction loops
to recover from failures.

**Autonomy Level**: ~80%
- 4 AUTO GATEs (agent-to-agent with quality thresholds)
- 1 USER GATE (final approval only - optional)

---

## Workflow Phases

### Phase 1: DISCOVERY (seo-analyst)

**Objective**: Identify initial keyword opportunities from seed keyword

**Steps**:
1. Execute WebSearch for seed keyword
2. Extract related searches from SERP
3. Capture People Also Ask (PAA) questions
4. Identify 5+ competitor URLs
5. Note SERP features present

**AUTO GATE: discovery_gate**:
```yaml
discovery_gate:
  thresholds:
    initial_keywords: >= 20
    competitors_found: >= 5
    paa_questions: >= 3
    serp_features_documented: true
  on_pass: Proceed to EXPANSION
  on_fail: Retry (max 3x) → Escalate to USER GATE
```

**Self-Correction Strategies**:
- Low keyword count: Try alternative query formats, add modifiers
- Few competitors: Broaden search, check related niches
- No PAA: Check other SERP features, use related queries

---

### Phase 2: EXPANSION (seo-researcher)

**Objective**: Expand initial keywords to 75+ terms using systematic patterns

**Steps**:
1. Apply question modifiers (how, what, why, when, where)
2. Apply comparison modifiers (vs, alternatives, comparison)
3. Apply commercial modifiers (best, top, review, pricing)
4. Apply audience modifiers (for beginners, for enterprise)
5. Apply use-case modifiers (for marketing, for sales)
6. Include long-tail variations

**AUTO GATE: expansion_gate**:
```yaml
expansion_gate:
  thresholds:
    total_keywords: >= 75
    long_tail_ratio: >= 40%
    intent_variety:
      informational: >= 20%
      commercial: >= 20%
      transactional: >= 10%
  on_pass: Proceed to CLUSTERING
  on_fail: Retry (max 3x) → Escalate to USER GATE
```

**Self-Correction Strategies**:
- Low count: Apply more expansion patterns
- Skewed intent: Target underrepresented intent types
- Low long-tail: Add more question and audience variants

---

### Phase 3: CLUSTERING (seo-researcher)

**Objective**: Organize keywords into semantic topic clusters

**Steps**:
1. Analyze semantic relationships between keywords
2. Group by topic theme (not just lexical similarity)
3. Identify pillar content topics vs supporting content
4. Name each cluster descriptively
5. Assign intent and funnel stage to each cluster

**AUTO GATE: clustering_gate**:
```yaml
clustering_gate:
  thresholds:
    cluster_count: >= 5
    avg_cluster_size: >= 8
    pillar_topics_identified: >= 2
    funnel_stages_covered: 3  # awareness, consideration, decision
  on_pass: Proceed to PRIORITIZATION
  on_fail: Retry (max 3x) → Escalate to USER GATE
```

**Self-Correction Strategies**:
- Too few clusters: Try finer granularity grouping
- Too many small clusters: Merge related clusters
- Missing funnel stages: Add keywords for underserved stages

---

### Phase 4: PRIORITIZATION (seo-analyst + seo-researcher)

**Objective**: Score and rank keywords by opportunity

**Steps**:
1. Estimate search volume tiers (high/medium/low)
2. Assess keyword difficulty (based on competitor strength)
3. Calculate opportunity score: potential / difficulty
4. Identify quick wins (low difficulty, decent volume)
5. Identify strategic targets (high volume, worth investment)
6. Create priority ranking (top 20)

**AUTO GATE: prioritization_gate**:
```yaml
prioritization_gate:
  thresholds:
    priority_keywords: >= 15
    quick_wins_identified: >= 5
    strategic_targets_identified: >= 3
    opportunity_scores_assigned: true
  on_pass: Proceed to REPORT
  on_fail: Retry (max 3x) → Escalate to USER GATE
```

**Self-Correction Strategies**:
- All high difficulty: Expand to more niche long-tails
- No strategic targets: Include higher-volume parent topics
- Scoring incomplete: Use heuristic estimates if data unavailable

---

### Phase 5: REPORT (output)

**Objective**: Compile comprehensive keyword research deliverable

**Steps**:
1. Generate executive summary (5-7 key findings)
2. Create cluster overview table
3. List priority keywords with scores
4. Suggest content calendar mapping
5. Include recommendations for next steps

**USER GATE: final_approval** (optional):
```yaml
final_approval_gate:
  type: USER (optional)
  purpose: User reviews and approves research before use
  options:
    - APPROVE: Accept research as-is
    - REFINE: Request additional expansion for specific clusters
    - REJECT: Discard and restart with different seed
```

---

## Quality Thresholds Reference

| Gate | Metric | Minimum | Target | Excellent |
|------|--------|---------|--------|-----------|
| Discovery | Initial keywords | 15 | 20 | 30+ |
| Discovery | Competitors | 3 | 5 | 10+ |
| Discovery | PAA questions | 2 | 3 | 8+ |
| Expansion | Total keywords | 50 | 75 | 100+ |
| Expansion | Long-tail ratio | 30% | 40% | 60%+ |
| Clustering | Cluster count | 3 | 5 | 10+ |
| Clustering | Avg cluster size | 5 | 8 | 12+ |
| Prioritization | Priority keywords | 10 | 15 | 25+ |
| Prioritization | Quick wins | 3 | 5 | 10+ |

---

## Error Handling

### Retry Protocol

Each phase allows up to 3 retry attempts with progressive strategies:

```yaml
retry_protocol:
  attempt_1:
    strategy: "Simplify - focus on core requirement"
    delay: 1 second
    budget: 4000 tokens
  attempt_2:
    strategy: "Alternative - try different approach"
    delay: 2 seconds
    budget: 4000 tokens
  attempt_3:
    strategy: "Minimum viable - achieve minimum threshold"
    delay: 4 seconds
    budget: 4000 tokens
  escalation:
    trigger: "All 3 attempts failed"
    action: "USER GATE with diagnostic context"
```

### Circuit Breaker

If the same failure occurs 3x across different workflows:
- Pause new workflow initiations
- Alert user with diagnostic information
- Wait for manual intervention or configuration fix

---

## Integration with Commands

This skill is invoked by:

1. **`/research` command**: Uses this skill's workflow for autonomous research
2. **`/brief` command**: Can invoke Phase 1-3 for keyword context
3. **Direct invocation**: `seo:autonomous-keyword-research` in agent prompts

### Usage Example

```yaml
# In command or agent prompt
skill: seo:autonomous-keyword-research
input:
  seed_keyword: "content marketing"
  target_audience: "B2B SaaS marketers"
  content_goal: "blog cluster"
output:
  clusters: 7
  total_keywords: 92
  priority_targets: 18
  quick_wins: 8
```

---

## Output Artifacts

The skill produces these artifacts in SESSION_PATH:

| File | Description |
|------|-------------|
| `discovery-results.md` | Phase 1 output (initial keywords, competitors, PAA) |
| `expanded-keywords.md` | Phase 2 output (full keyword list with metadata) |
| `keyword-clusters.md` | Phase 3 output (clusters with assignments) |
| `priority-ranking.md` | Phase 4 output (scored and ranked keywords) |
| `keyword-research-report.md` | Phase 5 output (comprehensive final report) |

---

## Autonomy Metrics

**Expected Performance**:
- AUTO GATE pass rate: 70-85% on first attempt
- Retry success rate: 85-95% within 3 attempts
- USER GATE escalation rate: 5-15% of workflows
- End-to-end autonomous completion: 80-90%

**Time Estimates**:
- Phase 1 (Discovery): 30-60 seconds
- Phase 2 (Expansion): 45-90 seconds
- Phase 3 (Clustering): 30-60 seconds
- Phase 4 (Prioritization): 30-60 seconds
- Phase 5 (Report): 20-40 seconds
- Total: 2.5-5 minutes (autonomous)
