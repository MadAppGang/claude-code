---
name: ab-testing-patterns
description: "Design and evaluate A/B tests for cold email campaigns, including sample size calculation, statistical significance checks, and winner declaration. Use when setting up split tests or analyzing test results in Instantly."
---

# A/B Testing Patterns

## Workflow

1. **Define hypothesis** -- identify one variable to test (subject, body, CTA, timing)
2. **Calculate sample size** -- determine minimum sends per variant for target confidence
3. **Configure test** -- split leads or use sequential method in Instantly
4. **Run test** -- send for minimum 3 days to account for daily patterns
5. **Evaluate results** -- check statistical significance before declaring a winner
6. **Document learnings** -- log results for future campaign decisions

## Step 1: Isolate One Variable

| Test Type | Variable | Keep Same |
|-----------|----------|-----------|
| Subject Line | Subject only | Body, CTA, timing |
| Opening Line | First sentence | Subject, rest of body |
| CTA | Call to action | Subject, body intro |
| Send Time | Delivery time | All copy elements |

## Step 2: Calculate Sample Size

| Confidence Level | Minimum per Variant |
|------------------|---------------------|
| 90% | 100 |
| 95% (standard) | 150 |
| 99% | 200 |

Formula: `sample = (Z^2 * p * (1-p)) / E^2` where Z=1.96 for 95%, p=0.5 if unknown, E=0.05.

## Step 3: Configure the Test in Instantly

**Method A -- Split Leads (recommended):**

1. Export lead list
2. Randomly split into Variant A and Variant B groups
3. Create two identical campaigns with one variable different
4. Use `move_leads_to_campaign` to assign leads

**Method B -- Sequential Testing (low volume only):**

1. Run Control for X days, collect metrics
2. Update campaign with Variant via `update_campaign_sequence`
3. Run Variant for X days, collect metrics

## Step 4: Subject Line Test Examples

| Category | Control | Variant |
|----------|---------|---------|
| Curiosity vs Specific | "Quick question" | "2 min about {{company}}'s pipeline" |
| Personal vs Generic | "{{first_name}}, saw this" | "Your team might like this" |
| Question vs Statement | "Struggling with X?" | "How we fixed X for [Company]" |
| Short vs Medium | "Quick win?" | "{{first_name}}, 2 ideas for {{company}}" |

## Step 5: Evaluate Statistical Significance

| Total Sample | Lift Needed for 95% Confidence |
|--------------|--------------------------------|
| 200 (100/variant) | 15%+ lift |
| 500 (250/variant) | 10%+ lift |
| 1000 (500/variant) | 7%+ lift |

### Decision Framework

```
IF lift >= 15% AND sample >= 100/variant → winner (medium confidence)
IF lift >= 10% AND sample >= 250/variant → winner (high confidence)
IF lift < 10% OR sample < 100/variant   → inconclusive, continue test
```

## Step 6: Log Results

```markdown
**Test ID**: {uuid}
**Campaign**: {campaign_name}
**Variable**: {what_was_tested}
**Hypothesis**: {expected_outcome}

| Metric | Control | Variant | Lift |
|--------|---------|---------|------|
| Open Rate | {x}% | {x}% | {z}% |
| Reply Rate | {y}% | {y}% | {z}% |

**Result**: {Winner|Inconclusive}
**Confidence**: {confidence}%
**Learning**: {what_we_learned}
```

## Validation Checklist

- [ ] Only one variable changed between variants
- [ ] Sample size meets minimum for target confidence
- [ ] Test ran for at least 3 days
- [ ] No holidays or major events during test window
- [ ] Lift exceeds significance threshold before declaring winner
