---
name: analytics-interpretation
description: "Interpret GA4 and GSC data by comparing metrics against benchmarks, diagnosing cross-source patterns, and calculating content health scores. Use when analyzing content performance or explaining analytics to stakeholders."
---

# Analytics Interpretation

## Workflow

1. **Collect GA4 and GSC metrics** -- gather engagement and search performance data
2. **Compare against benchmarks** -- classify each metric as Good, Warning, or Poor
3. **Cross-reference signals** -- combine GA4 engagement with GSC search data for diagnosis
4. **Calculate health score** -- compute weighted content health score (0-100)
5. **Detect anomalies** -- flag significant week-over-week changes
6. **Generate report** -- produce executive summary with prioritized actions

## Step 1: GA4 Benchmarks

| Metric | Good | Warning | Poor | Action When Poor |
|--------|------|---------|------|------------------|
| Avg Time on Page | >3 min | 1-3 min | <1 min | Improve content depth, add multimedia |
| Bounce Rate | <40% | 40-70% | >70% | Add internal links, improve intro hook |
| Engagement Rate | >60% | 30-60% | <30% | Review content quality, add CTAs |
| Scroll Depth | >75% | 50-75% | <50% | Add visual breaks, improve structure |
| Pages/Session | >2.5 | 1.5-2.5 | <1.5 | Improve internal linking |

## Step 2: GSC Benchmarks

| Metric | Good | Warning | Poor | Action When Poor |
|--------|------|---------|------|------------------|
| CTR | >5% | 2-5% | <2% | Improve title/meta description |
| Avg Position | 1-3 | 4-10 | >10 | Strengthen content, build links |
| Impressions Trend | Growing | Stable | Declining | Refresh content, target new keywords |
| Core Web Vitals | GOOD | NEEDS_IMPROVEMENT | POOR | Optimize performance |

## Step 3: Cross-Source Diagnosis

| GSC Signal | GA4 Signal | Diagnosis | Action |
|------------|------------|-----------|--------|
| High impressions | Low clicks | Title/meta mismatch | Rewrite meta description |
| High CTR | High bounce | Content doesn't deliver | Align content with search intent |
| Low CTR | High engagement | Hidden gem | Improve snippet to get more clicks |
| Growing impressions | Stable clicks | Ranking improving | Optimize CTR while momentum builds |

### Traffic Quality Matrix

| Quadrant | Traffic | Engagement | Action |
|----------|---------|------------|--------|
| STAR | High | High | Maintain, replicate pattern |
| HIDDEN GEM | Low | High | Promote via internal links and social |
| LEAKY | High | Low | Optimize content quality |
| UNDERPERFORMER | Low | Low | Rework or consolidate |

## Step 4: Calculate Health Score

```
health_score = engagement_score * 0.30 + seo_score * 0.30 + ranking_score * 0.20 + trend_score * 0.20
```

| Score | Rating | Action |
|-------|--------|--------|
| 90-100 | Excellent | Maintain, minor tweaks |
| 75-89 | Good | Optimize weak areas |
| 60-74 | Fair | Address key issues |
| 40-59 | Poor | Major revision needed |
| 0-39 | Critical | Complete overhaul |

## Step 5: Detect Anomalies

| Metric | Significant Change | Alert Level |
|--------|-------------------|-------------|
| Traffic | ±30% WoW | HIGH |
| CTR | ±1pp WoW | MEDIUM |
| Position | ±5 positions | HIGH |
| Bounce Rate | ±10pp WoW | MEDIUM |

Common causes: sudden traffic drop (algorithm update, technical issue), CTR spike (SERP feature win), position fluctuation (Google testing), engagement drop (content staleness).

## Step 6: Generate Report

```markdown
## Content Performance Summary

**Overall Health**: {score}/100 ({rating})

### Key Wins
- {positive finding 1}
- {positive finding 2}

### Concerns
- {issue 1} -- {metric}: {value} vs benchmark {benchmark}

### Priority Actions
1. {highest priority action}
2. {second priority action}
3. {third priority action}
```

## Example: Interpreting a Blog Post

```
URL: /blog/seo-guide
GA4: Avg Time 4:12 (GOOD), Bounce 35% (GOOD), Scroll 82% (GOOD)
GSC: CTR 1.8% (POOR), Position 6.2 (WARNING), Impressions +15% WoW

Diagnosis: HIDDEN GEM -- strong engagement but low CTR
Health Score: 90*0.30 + 40*0.30 + 55*0.20 + 70*0.20 = 64 (Fair)
Priority Action: Rewrite title tag and meta description to improve CTR
```

## Validation Checklist

- [ ] Both GA4 and GSC data collected for the same date range
- [ ] Each metric classified against correct benchmark tier
- [ ] Cross-source signals checked for contradictions
- [ ] Health score calculated with all four components
- [ ] Anomalies flagged if any metric exceeds change thresholds
