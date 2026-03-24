---
name: campaign-metrics
description: "Evaluate cold email campaign performance by calculating health scores, diagnosing metric patterns, and recommending fixes. Use when reviewing campaign KPIs or benchmarking open/reply rates in Instantly."
---

# Campaign Metrics

## Workflow

1. **Collect metrics** -- gather open rate, reply rate, bounce rate, and unsubscribe rate
2. **Compare to benchmarks** -- evaluate performance tier by vertical
3. **Diagnose patterns** -- match metric combinations to known issues
4. **Calculate health score** -- compute weighted campaign score (0-100)
5. **Recommend actions** -- prescribe fixes based on diagnosis

## Step 1: Collect Primary Metrics

| Metric | Formula | Good | Average |
|--------|---------|------|---------|
| Open Rate | (Opened / Sent) * 100 | 40-50% | 25-40% |
| Reply Rate | (Replied / Sent) * 100 | 5-10% | 2-5% |
| Positive Reply Rate | (Positive / Replied) * 100 | 25-40% | -- |
| Bounce Rate | (Bounced / Sent) * 100 | <2% | 2-5% |
| Unsubscribe Rate | (Unsubscribed / Sent) * 100 | <0.5% | -- |

## Step 2: Benchmark by Vertical

| Vertical | Open Rate | Reply Rate |
|----------|-----------|------------|
| SaaS | 45-55% | 5-12% |
| Agency | 35-45% | 3-7% |
| E-commerce | 30-40% | 2-5% |
| Financial Services | 25-35% | 2-4% |

### Performance Tiers

| Tier | Open Rate | Reply Rate | Bounce Rate |
|------|-----------|------------|-------------|
| Excellent (Top 10%) | >50% | >10% | <1% |
| Good (Top 25%) | 40-50% | 5-10% | 1-2% |
| Average (Middle 50%) | 25-40% | 2-5% | 2-5% |
| Poor (Bottom 25%) | 15-25% | 1-2% | 5-10% |
| Critical (Bottom 10%) | <15% | <1% | >10% |

## Step 3: Diagnose Patterns

| Open Rate | Reply Rate | Diagnosis | Action |
|-----------|------------|-----------|--------|
| Low (<25%) | Any | Subject line issue | A/B test subjects |
| High (>40%) | Low (<2%) | Body copy issue | Rewrite email body |
| High | High | Winning combo | Scale and replicate |
| Declining | Stable | Fatigue setting in | Refresh creative |
| Any | Any + High Bounce | List quality issue | Verify emails |

## Step 4: Calculate Health Score

```
health_score = open_score * 0.25 + reply_score * 0.35 + deliverability_score * 0.25 + trend_score * 0.15
```

| Component | Calculation |
|-----------|-------------|
| open_score | normalize(open_rate, 0-60%) → 0-100 |
| reply_score | normalize(reply_rate, 0-15%) → 0-100 |
| deliverability_score | 100 - (bounce_rate * 10) |
| trend_score | WoW change: +10%=100, stable=50, -10%=0 |

### Score Interpretation

| Score | Rating | Action |
|-------|--------|--------|
| 90-100 | Excellent | Maintain and scale |
| 75-89 | Good | Minor optimizations |
| 60-74 | Average | Address weak areas |
| 40-59 | Poor | Major revision needed |
| 0-39 | Critical | Pause and fix immediately |

## Example: Diagnosing a Struggling Campaign

```
Campaign: Q1 SaaS Outreach
Open Rate: 22% → POOR (below 25% threshold)
Reply Rate: 1.5% → POOR
Bounce Rate: 3% → WARNING

Diagnosis: Low opens suggest subject line issue
Action: A/B test 2-3 new subject line variants with 150+ leads per variant
Health Score: 22*0.25 + 10*0.35 + 70*0.25 + 50*0.15 = 34 → CRITICAL
```

## Validation Checklist

- [ ] Metrics collected from at least 200 sends
- [ ] Bounce rate checked before diagnosing other metrics
- [ ] Performance compared against correct vertical benchmark
- [ ] Health score calculated with all four components
