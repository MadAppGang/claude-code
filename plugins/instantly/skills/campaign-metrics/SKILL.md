---
name: campaign-metrics
version: 1.0.0
description: Cold email campaign KPIs, benchmarks, and diagnostic patterns
---

# Campaign Metrics

## Core KPIs

### Primary Metrics

| Metric | Formula | Benchmark (Cold Email) |
|--------|---------|------------------------|
| Open Rate | (Opened / Sent) * 100 | 40-50% (good), 25-40% (average) |
| Reply Rate | (Replied / Sent) * 100 | 5-10% (good), 2-5% (average) |
| Positive Reply Rate | (Positive / Replied) * 100 | 25-40% (good) |
| Bounce Rate | (Bounced / Sent) * 100 | <2% (healthy) |
| Unsubscribe Rate | (Unsubscribed / Sent) * 100 | <0.5% (healthy) |

### Secondary Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| Emails per Lead | Total Sent / Unique Leads | Sequence effectiveness |
| Reply by Step | Replies per step / Sent per step | Identify best-performing emails |
| Time to Reply | Avg time between send and reply | Timing optimization |

## Benchmark Reference

### Industry Benchmarks by Vertical

| Vertical | Open Rate | Reply Rate | Notes |
|----------|-----------|------------|-------|
| SaaS | 45-55% | 5-12% | Higher engagement |
| Agency | 35-45% | 3-7% | Competitive space |
| E-commerce | 30-40% | 2-5% | Volume-focused |
| Financial Services | 25-35% | 2-4% | Compliance-heavy |

### Performance Tiers

```
EXCELLENT (Top 10%)
  Open Rate: >50%
  Reply Rate: >10%
  Bounce Rate: <1%

GOOD (Top 25%)
  Open Rate: 40-50%
  Reply Rate: 5-10%
  Bounce Rate: 1-2%

AVERAGE (Middle 50%)
  Open Rate: 25-40%
  Reply Rate: 2-5%
  Bounce Rate: 2-5%

POOR (Bottom 25%)
  Open Rate: 15-25%
  Reply Rate: 1-2%
  Bounce Rate: 5-10%

CRITICAL (Bottom 10%)
  Open Rate: <15%
  Reply Rate: <1%
  Bounce Rate: >10%
```

## Diagnostic Patterns

### Pattern Matrix

| Open Rate | Reply Rate | Diagnosis | Action |
|-----------|------------|-----------|--------|
| Low (<25%) | Any | Subject line issue | A/B test subjects |
| High (>40%) | Low (<2%) | Body copy issue | Rewrite email body |
| High | High | Winning combo | Scale and replicate |
| Declining | Stable | Fatigue setting in | Refresh creative |
| Any | Any + High Bounce | List quality issue | Verify emails |

### Time-Based Analysis

| Pattern | Meaning | Action |
|---------|---------|--------|
| Monday spike | Inbox cleared over weekend | Send Sun night or Mon early |
| Friday drop | Weekend mindset | Avoid Fri afternoon sends |
| Steady decline | Audience exhaustion | Rotate lists or refresh copy |
| Random spikes | External event correlation | Analyze and replicate |

## Score Calculation

### Campaign Health Score (0-100)

```
health_score = (
    open_score * 0.25 +
    reply_score * 0.35 +
    deliverability_score * 0.25 +
    trend_score * 0.15
)
```

**Component Calculations:**

```
open_score = normalize(open_rate, min=0, max=60)
  60%+ open = 100 points
  40% open = 67 points
  20% open = 33 points
  0% open = 0 points

reply_score = normalize(reply_rate, min=0, max=15)
  15%+ reply = 100 points
  10% reply = 67 points
  5% reply = 33 points
  0% reply = 0 points

deliverability_score = 100 - (bounce_rate * 10)
  0% bounce = 100 points
  5% bounce = 50 points
  10% bounce = 0 points

trend_score = based on week-over-week change
  +10% improvement = 100 points
  Stable = 50 points
  -10% decline = 0 points
```

### Score Interpretation

| Score | Rating | Action Required |
|-------|--------|-----------------|
| 90-100 | Excellent | Maintain, scale if possible |
| 75-89 | Good | Minor optimizations |
| 60-74 | Average | Address weak areas |
| 40-59 | Poor | Major revision needed |
| 0-39 | Critical | Pause and fix immediately |
