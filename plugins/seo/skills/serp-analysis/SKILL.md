---
name: serp-analysis
description: "Analyze search engine results pages to classify intent, identify SERP feature opportunities, and assess competitor content gaps. Use when researching keywords, planning content strategy, or evaluating competitive positioning."
---

# SERP Analysis

## Workflow

1. **Search the keyword** -- use WebSearch to fetch current SERP results
2. **Classify intent** -- determine informational, commercial, transactional, or navigational
3. **Identify SERP features** -- note featured snippets, PAA, image packs, and other features
4. **Analyze competitors** -- collect format, word count, heading structure, and gaps for top 10
5. **Find content gaps** -- identify topics competitors miss or cover weakly
6. **Generate recommendations** -- propose content format, word count, and differentiator

## Step 1: Classify Search Intent

| Intent | SERP Signals | Content Format |
|--------|--------------|----------------|
| Informational | Wikipedia, knowledge panels, "what is" queries | Guide, tutorial, explainer |
| Commercial | Reviews, comparisons, "best X" queries | Comparison, listicle, review |
| Transactional | Product pages, shopping results, "buy X" | Product page, pricing |
| Navigational | Brand homepage, login pages | Homepage, login page |

Process: Search the keyword, count result types, assign intent based on dominant type, note confidence as percentage of results supporting classification.

## Step 2: Identify SERP Features

| Feature | Optimization Strategy |
|---------|----------------------|
| Featured Snippet | Direct answer in first 100 words (40-60 words for paragraph type) |
| People Also Ask | Add FAQ section answering common questions |
| Image Pack | High-quality images with descriptive alt text |
| Video Results | Create relevant YouTube content |
| Local Pack | GMB optimization, create location pages |
| Knowledge Panel | Add Schema markup, establish Wikipedia presence |
| Sitelinks | Clear site structure with strong internal linking |

### Featured Snippet Formats

| Type | How to Optimize |
|------|-----------------|
| Paragraph | 40-60 word direct answer immediately after the H2 |
| List | Use ordered/unordered HTML lists |
| Table | Use HTML tables with clear headers |

## Step 3: Analyze Competitors

For each top 10 result, collect:

| Data Point | Why It Matters |
|------------|---------------|
| Content format | Reveals what Google rewards for this query |
| Word count | Sets minimum content depth target |
| Heading structure | Shows required subtopics |
| Unique angle | Identifies differentiation opportunities |
| Content gaps | Reveals what to add for competitive advantage |

### Competitor Matrix

| Rank | Domain | Format | Words | Unique Angle | Gap |
|------|--------|--------|-------|--------------|-----|
| 1 | {domain} | {format} | {count} | {angle} | {gap} |
| 2 | {domain} | {format} | {count} | {angle} | {gap} |

## Step 4: Generate Report

```markdown
## SERP Analysis: {keyword}

### Search Intent
- **Primary Intent**: {Informational | Commercial | Transactional | Navigational}
- **Confidence**: {percentage}%
- **Secondary Intent**: {if mixed}

### SERP Features Present
- [ ] Featured Snippet ({type})
- [ ] People Also Ask
- [ ] Image Pack
- [ ] Video Results
- [ ] Local Pack

### Competitor Analysis
| Rank | Domain | Format | Words | Unique Angle |
|------|--------|--------|-------|--------------|
| 1 | {domain} | {format} | {count} | {angle} |

### Content Gaps
1. {gap} -- {which competitors miss this}

### Recommendations
1. **Content Format**: {based on what ranks}
2. **Word Count**: {competitor avg + 20%}
3. **Featured Snippet**: {opportunity and capture strategy}
4. **Differentiator**: {unique angle to stand out}
```

## Example: Analyzing "best project management tools"

```
Intent: Commercial (90% confidence) -- reviews and comparisons dominate
SERP Features: Featured Snippet (list), PAA (6 questions), Image Pack

Top 3 competitors:
1. pcmag.com -- Listicle, 4500 words, detailed reviews with screenshots
2. forbes.com -- Comparison, 3200 words, pricing tables
3. zapier.com -- Listicle, 2800 words, integration focus

Content gaps: No competitor covers AI features, team size recommendations, or migration guides
Recommendation: 4000+ word comparison with pricing tables, AI feature analysis, and team-size matrix
```

## Validation Checklist

- [ ] At least top 10 SERP results analyzed
- [ ] Intent classified with confidence percentage
- [ ] All visible SERP features documented
- [ ] Content gaps identified from competitor analysis
- [ ] Recommended word count exceeds competitor average by 20%
