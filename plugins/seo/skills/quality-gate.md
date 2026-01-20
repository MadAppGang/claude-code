---
name: quality-gate
description: Use when implementing automatic agent-to-agent progression with quality thresholds, replacing manual gates with AUTO GATEs for autonomous workflows (~80% autonomy).
keywords: [quality-gate, auto-gate, user-gate, quality-threshold, e-e-a-t-score, self-correction, retry-protocol, escalation, autonomous-workflow, agent-progression]
plugin: seo
updated: 2026-01-20
---

# Quality Gate Skill

Enables automatic agent-to-agent progression when quality thresholds are met.
Replaces manual USER GATEs with automated AUTO GATEs for ~80% autonomy.

---

## Gate Types

### 1. SERP Analysis Gate (analyst → researcher)

**Triggering Agent**: seo-analyst
**Quality Thresholds**:
- Search intent identified with ≥80% confidence
- At least 5 competitors analyzed
- SERP features documented
- Intent classification complete

**Auto-Pass Criteria**:
```yaml
serp_analysis_gate:
  intent_confidence: >= 80
  competitors_analyzed: >= 5
  serp_features_documented: true
  result: AUTO_PASS → proceed to seo-researcher
```

**Auto-Fail Actions**:
```yaml
serp_analysis_retry:
  attempt_1: Retry with simplified query
  attempt_2: Try 3 alternative keyword variations
  attempt_3: Expand to related SERPs for cross-reference
  escalation: USER_GATE after 3 failures
```

---

### 2. Keyword Expansion Gate (researcher → writer)

**Triggering Agent**: seo-researcher
**Quality Thresholds**:
- ≥50 keywords discovered (target: 75+)
- ≥3 topic clusters identified (target: 5+)
- All 4 intent types covered (informational, commercial, transactional, navigational)
- Funnel stages mapped

**Auto-Pass Criteria**:
```yaml
keyword_expansion_gate:
  total_keywords: >= 50
  topic_clusters: >= 3
  intent_coverage: all_four_types
  funnel_mapped: true
  result: AUTO_PASS → proceed to brief/writer
```

**Auto-Fail Actions**:
```yaml
keyword_expansion_retry:
  attempt_1: Add question modifiers (how, what, why, when, where)
  attempt_2: Include audience variants (for startups, for enterprise, for beginners)
  attempt_3: Expand to adjacent topics and competitor keywords
  escalation: USER_GATE after 3 failures
```

---

### 3. Content Quality Gate (writer → editor)

**Triggering Agent**: seo-writer (self-assessment before handoff)
**Quality Thresholds**:
- E-E-A-T score ≥60/100 (writer self-check)
- Word count within ±10% of brief target
- Keyword density 1-2%
- Readability (Flesch) ≥55
- Internal links ≥2

**Auto-Pass Criteria**:
```yaml
content_quality_gate:
  eeat_score: >= 60
  word_count_variance: <= 10%
  keyword_density: 1.0 - 2.0
  readability_flesch: >= 55
  internal_links: >= 2
  result: AUTO_PASS → proceed to seo-editor
```

**Auto-Fail Actions**:
```yaml
content_quality_retry:
  low_experience:
    action: Add 2-3 first-hand examples or case studies
    target_improvement: +5-8 points
  low_expertise:
    action: Deepen technical sections, add edge cases
    target_improvement: +5-8 points
  low_authority:
    action: Add 3-4 authoritative source citations
    target_improvement: +5-8 points
  low_trust:
    action: Verify claims, add data sources, balance perspective
    target_improvement: +5-8 points
  low_readability:
    action: Break sentences, simplify jargon, add subheadings
    target_improvement: +5-10 points
  escalation: USER_GATE after 3 failures
```

---

### 4. Editorial Gate (editor → publish)

**Triggering Agent**: seo-editor
**Gate Type**: USER GATE (always requires human approval)

**Why USER GATE**:
- Final content before public publication
- Brand voice and legal compliance
- Factual accuracy verification
- Strategic alignment check

**Display to User**:
```markdown
## Editorial Review Complete

**E-E-A-T Score**: {score}/100 ({PASS|CONDITIONAL|FAIL})

**Issues Found**:
- CRITICAL ({count}): {list}
- HIGH ({count}): {list}
- MEDIUM ({count}): {list}

**Recommendation**: {APPROVE | REVISE | REJECT}

Do you approve publication?
```

---

## Self-Correction Protocol

When an AUTO GATE fails, agents follow this protocol:

### Step 1: Increment Retry Counter
```yaml
retry_state:
  current_attempt: {1|2|3}
  max_attempts: 3
  failure_reason: {specific_threshold_missed}
```

### Step 2: Analyze Failure Reason
```yaml
failure_analysis:
  missed_threshold: {threshold_name}
  current_value: {value}
  target_value: {threshold}
  gap: {target - current}
```

### Step 3: Modify Approach
Based on failure type, apply specific correction strategy:

| Failure Type | Correction Strategy |
|--------------|---------------------|
| Low E-E-A-T Experience | Add 2-3 first-hand examples, case studies, "lessons learned" |
| Low E-E-A-T Expertise | Deepen technical coverage, add edge cases, cite research |
| Low E-E-A-T Authority | Add 3-5 authoritative sources (studies, official docs, experts) |
| Low E-E-A-T Trust | Verify claims with data, add dates, disclose limitations |
| Insufficient keywords | Apply more expansion patterns, adjacent topics |
| Weak clustering | Re-analyze semantic relationships, merge small clusters |
| Low readability | Shorten sentences, explain jargon, add subheadings |

### Step 4: Retry the Step
Execute the corrected approach and re-evaluate against thresholds.

### Step 5: Escalation (if needed)
After 3 failed retries:
```yaml
escalation:
  action: USER_GATE
  message: "Automatic quality gate failed after 3 attempts. Human review required."
  context:
    - All 3 attempt results
    - Specific threshold failures
    - Recommended manual intervention
```

---

## Quality Metrics Reference

### E-E-A-T Scoring (0-100)

| Dimension | Points | What to Check |
|-----------|--------|---------------|
| Experience | 0-25 | First-hand examples, personal insights, real scenarios |
| Expertise | 0-25 | Subject depth, accuracy, comprehensive treatment |
| Authoritativeness | 0-25 | Cited sources, references, credentials |
| Trustworthiness | 0-25 | Accurate claims, transparent sourcing, balanced view |

**Thresholds**:
- ≥70: PASS (publication ready)
- 60-69: CONDITIONAL (minor improvements needed)
- <60: FAIL (requires significant revision or retry)

### Keyword Research Metrics

| Metric | Minimum | Target | Excellent |
|--------|---------|--------|-----------|
| Total keywords | 30 | 50-75 | 100+ |
| Topic clusters | 3 | 5-7 | 10+ |
| Long-tail ratio | 40% | 50-60% | 70%+ |
| Intent coverage | 3/4 types | 4/4 types | 4/4 balanced |

### Content Quality Metrics

| Metric | Minimum | Target | Excellent |
|--------|---------|--------|-----------|
| Readability (Flesch) | 55 | 60-70 | 65-70 |
| Keyword density | 0.8% | 1-2% | 1.5% |
| Internal links | 2 | 3-5 | 5+ |
| External links | 1 | 2-3 | 3+ |
| Word count variance | ±15% | ±10% | ±5% |

---

## Integration with Commands

### /research Command
```
Phase 2: SERP Analysis
  └── AUTO GATE: serp_analysis_gate
      ├── PASS → Phase 3
      └── FAIL → Retry (max 3) → USER GATE

Phase 3: Keyword Expansion
  └── AUTO GATE: keyword_expansion_gate
      ├── PASS → Phase 4
      └── FAIL → Retry (max 3) → USER GATE
```

### /optimize Command
```
Phase 2: Content Analysis
  └── AUTO GATE: content_quality_gate (current state)
      ├── PASS → Phase 3
      └── FAIL → Identify improvements

Phase 3: Optimization
  └── AUTO GATE: content_quality_gate (after optimization)
      ├── PASS → Report
      └── FAIL → Retry optimization (max 3)
```

### /brief → /write → /edit Workflow
```
Writer Output
  └── AUTO GATE: content_quality_gate (self-check)
      ├── PASS → Editor
      └── FAIL → Self-correct (max 3) → USER GATE

Editor Review
  └── USER GATE: editorial_gate (always)
      ├── APPROVE → Publish
      ├── REVISE → Back to Writer
      └── REJECT → Archive
```

---

## Logging and Observability

All gate evaluations are logged:

```yaml
gate_evaluation_log:
  timestamp: 2026-01-07T15:30:00Z
  session_id: seo-research-20260107-153000-keyword
  gate_type: keyword_expansion_gate
  agent: seo-researcher
  attempt: 2
  thresholds:
    total_keywords: {required: 50, actual: 42, passed: false}
    topic_clusters: {required: 3, actual: 4, passed: true}
    intent_coverage: {required: 4, actual: 4, passed: true}
  result: FAIL
  next_action: retry_attempt_3
  correction_strategy: "Expand to adjacent topics and competitor keywords"
```

---

## Usage in Agent Prompts

Agents reference this skill for quality checks:

```xml
<quality_gate skill="seo:quality-gate">
  <check type="content_quality_gate">
    <evaluate>
      - E-E-A-T score: {calculate from content}
      - Word count: {count} / {target}
      - Keyword density: {percentage}
      - Readability: {flesch_score}
      - Internal links: {count}
    </evaluate>
    <on_pass>Proceed to seo-editor</on_pass>
    <on_fail>Apply self-correction protocol</on_fail>
  </check>
</quality_gate>
```
