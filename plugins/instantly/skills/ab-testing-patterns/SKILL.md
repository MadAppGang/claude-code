---
name: ab-testing-patterns
version: 1.0.0
description: A/B testing methodology for cold email optimization
---

# A/B Testing Patterns

## Testing Fundamentals

### One Variable at a Time

**CRITICAL:** Only change one element per test for clear attribution.

| Test Type | Variable | Keep Same |
|-----------|----------|-----------|
| Subject Line | Subject only | Body, CTA, timing |
| Opening Line | First sentence | Subject, rest of body |
| CTA | Call to action | Subject, body intro |
| Send Time | Delivery time | All copy elements |

### Sample Size Requirements

| Confidence Level | Minimum Sample per Variant |
|------------------|----------------------------|
| 90% | 100 |
| 95% (standard) | 150 |
| 99% | 200 |

**Formula:**
```
sample_size = (Z^2 * p * (1-p)) / E^2

Where:
  Z = 1.96 for 95% confidence
  p = expected conversion rate (use 0.5 if unknown)
  E = margin of error (typically 0.05)
```

## Subject Line Testing

### Test Categories

| Category | Control Example | Variant Example |
|----------|-----------------|-----------------|
| Curiosity vs Specific | "Quick question" | "2 min about {{company}}'s pipeline" |
| Personal vs Generic | "{{first_name}}, saw this" | "Your team might like this" |
| Question vs Statement | "Struggling with X?" | "How we fixed X for [Company]" |
| Short vs Medium | "Quick win?" | "{{first_name}}, 2 ideas for {{company}}" |

### Best Practices

1. **Test 2-3 variants maximum** - More variants require more sample
2. **Run for minimum 3 days** - Account for daily patterns
3. **Test during stable periods** - Avoid holidays, major events
4. **Document everything** - Record hypothesis, results, learnings

## Body Copy Testing

### Elements to Test

| Element | Low-Lift | High-Lift |
|---------|----------|-----------|
| Opening hook | Different pain point | Different approach entirely |
| Social proof | Different company name | No social proof |
| Value proposition | Reframe benefit | Different benefit |
| CTA | Soft vs hard ask | Different action |

### Copy Frameworks to Test

**PAS vs AIDA:**
- PAS: Problem-Agitate-Solution (emotional)
- AIDA: Attention-Interest-Desire-Action (logical)

**Test Hypothesis:** PAS performs better for pain-point-heavy ICPs, AIDA for solution-seekers.

## Timing Tests

### Variables to Test

| Variable | Options to Test |
|----------|-----------------|
| Day of week | Tue vs Thu (typically best) |
| Time of day | 8-10am vs 2-4pm |
| Timezone | Send in prospect's local time vs batch send |
| Sequence gaps | 2-day vs 3-day follow-up gaps |

### Default Schedule (Starting Point)

```
Optimal Sending Windows:
  Primary: Tuesday-Thursday, 9-11am local time
  Secondary: Tuesday-Thursday, 2-4pm local time
  Avoid: Monday morning, Friday afternoon
```

## Statistical Significance

### Quick Significance Check

| Total Sample | Lift Needed for 95% Confidence |
|--------------|--------------------------------|
| 200 (100 per variant) | 15%+ lift |
| 500 (250 per variant) | 10%+ lift |
| 1000 (500 per variant) | 7%+ lift |

### Decision Framework

```
IF lift >= 15% AND sample >= 100/variant:
  Declare winner with medium confidence

IF lift >= 10% AND sample >= 250/variant:
  Declare winner with high confidence

IF lift < 10% OR sample < 100/variant:
  Continue test or call it inconclusive
```

## Implementing A/B Tests in Instantly

### Method 1: Split Leads

1. Export lead list
2. Randomly split into Variant A and Variant B groups
3. Create two identical campaigns with one variable different
4. Use `move_leads_to_campaign` to assign leads

### Method 2: Sequential Testing

1. Run Control for X days, collect metrics
2. Update campaign with Variant (`update_campaign_sequence`)
3. Run Variant for X days, collect metrics
4. Compare (less rigorous, use only if lead volume is limited)

### Tracking Results

```markdown
## A/B Test Log

**Test ID**: {uuid}
**Campaign**: {campaign_name}
**Variable**: {what_was_tested}
**Hypothesis**: {expected_outcome}

**Control**:
- Version: {control_description}
- Sample: {n}
- Open Rate: {x}%
- Reply Rate: {y}%

**Variant**:
- Version: {variant_description}
- Sample: {n}
- Open Rate: {x}%
- Reply Rate: {y}%

**Result**: {Winner|Inconclusive}
**Lift**: {z}%
**Confidence**: {confidence}%
**Learning**: {what_we_learned}
```
