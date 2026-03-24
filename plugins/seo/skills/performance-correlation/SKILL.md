---
name: performance-correlation
description: "Correlate content changes with GA4 and GSC metric movements to identify performance drivers and build optimization hypotheses. Use when diagnosing why metrics changed or planning content optimizations."
---

# Performance Correlation

## Workflow

1. **Match symptoms to patterns** -- identify which cross-source pattern applies
2. **Gather evidence** -- collect supporting data from GA4, GSC, and competitor analysis
3. **Log content changes** -- maintain a timeline of modifications
4. **Map metric responses** -- correlate metric shifts to specific changes
5. **Rate confidence** -- assess cause-effect reliability
6. **Build hypothesis** -- propose next optimization with success criteria

## Step 1: Pattern Library

### Pattern 1: High Impressions + Low CTR + Good Position (3-7)

**Diagnosis**: Title/meta description not compelling enough.

Actions: Rewrite title with power words/numbers/year, add benefit-driven meta description, target featured snippet. Expected impact: +50-100% CTR.

### Pattern 2: High CTR + Low Engagement (high bounce, low time on page)

**Diagnosis**: Content doesn't match search intent or promise.

Actions: Align opening with search intent, deliver value in first 100 words, add table of contents. Expected impact: -20-30% bounce rate, +50% time on page.

### Pattern 3: High Engagement + Low Rankings

**Diagnosis**: Good content but weak SEO signals.

Actions: Build quality backlinks, add internal links from high-authority pages, improve on-page SEO. Expected impact: +5-15 positions over 2-3 months.

### Pattern 4: Declining Rankings + Stable Traffic

**Diagnosis**: Competitors advancing; brand queries protecting traffic.

Actions: Refresh content with updated data, add sections competitors have, accelerate link building.

### Pattern 5: Good Rankings (1-5) + Low Impressions

**Diagnosis**: Keyword losing search volume.

Actions: Target related growing keywords, expand content for adjacent queries, consider pivoting topic angle.

### Pattern 6: Position Volatility (fluctuates +/-10 daily)

**Diagnosis**: Google testing content quality or thin content threshold.

Actions: Strengthen E-E-A-T signals, add depth and originality, improve page experience. Expected stabilization: 2-4 weeks.

## Step 2: Log Content Changes

```markdown
| Date | Change Type | Description | Scope |
|------|-------------|-------------|-------|
| 2025-12-01 | Content | Added 500 words on AI SEO | Major |
| 2025-12-10 | Meta | Updated title tag | Minor |
| 2025-12-15 | Links | Added 3 internal links | Minor |
| 2025-12-20 | Technical | Improved page speed | Technical |
```

## Step 3: Map Metric Responses

```markdown
| Date | Metric | Before | After | Change | Likely Cause |
|------|--------|--------|-------|--------|--------------|
| Dec 5 | Position | 8.2 | 6.1 | +2.1 | Content expansion |
| Dec 12 | CTR | 2.1% | 3.8% | +1.7pp | Title update |
| Dec 18 | Time on Page | 2:10 | 3:45 | +1:35 | Content depth |
| Dec 22 | LCP | 2.8s | 1.9s | -0.9s | Speed optimization |
```

## Step 4: Rate Confidence

| Change | Metric Impact | Confidence | Reasoning |
|--------|---------------|------------|-----------|
| +500 words | Position +2.1 | HIGH | Timing matches, logical connection |
| Title update | CTR +1.7pp | HIGH | Direct relationship, immediate effect |
| Internal links | Unknown | LOW | Too recent, effect delayed 2-4 weeks |
| Speed fix | Bounce -5% | MEDIUM | Timing matches, indirect relationship |

## Step 5: Build Hypothesis

```markdown
## Optimization Hypothesis

**Observation**: {what the data shows}
**Hypothesis**: {proposed cause-effect relationship}

**Test Plan**:
1. {specific change to make}
2. {metrics to monitor}: CTR, position, clicks
3. {timeframe}: evaluate after 2 weeks

**Success Criteria**:
- Primary: {main metric target, e.g., CTR > 4%}
- Secondary: {supporting target, e.g., clicks +30%}

**Risk**: {HIGH|MEDIUM|LOW} -- {risk description and mitigation}
```

## Example: Full Correlation Analysis

```
URL: /blog/seo-guide
Change: Title updated from "SEO Guide" to "Complete SEO Guide 2025: 15 Strategies"

Before (Dec 1-7):  Position 4.0, CTR 2.8%, Clicks 420
After (Dec 15-21): Position 3.8, CTR 4.5%, Clicks 680

Pattern match: Pattern 1 (High Impressions + Low CTR)
Confidence: HIGH -- direct relationship, timing matches within days
Result: CTR +60%, Clicks +62%, Position stable
Next hypothesis: Add FAQ section to capture People Also Ask SERP feature
```

## Validation Checklist

- [ ] Content change log maintained with dates and scope
- [ ] Metric data compared for matching time periods (before vs after)
- [ ] At least 2 weeks of post-change data before drawing conclusions
- [ ] Confidence rated for each correlation (HIGH/MEDIUM/LOW)
- [ ] Only one major change made at a time for clear attribution
