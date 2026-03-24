---
name: link-strategy
description: "Audit internal links, optimize anchor text, and build topic clusters to improve site authority and rankings. Use when planning internal links, fixing orphan pages, or restructuring site architecture."
---

# Link Strategy

## Workflow

1. **Audit existing links** -- inventory current internal links and identify gaps
2. **Find orphan pages** -- locate pages with zero internal links pointing to them
3. **Fix broken links** -- test all internal links and remove or repair broken ones
4. **Optimize anchor text** -- replace generic anchors with keyword-rich descriptions
5. **Build topic clusters** -- group related content into pillar-cluster structures
6. **Verify improvements** -- confirm new links are crawlable and passing authority

## Step 1: Internal Linking Principles

| Principle | Rule | Example |
|-----------|------|---------|
| Link high to low authority | Homepage → Category → Post | Established pages link to new pages |
| Descriptive anchor text | Use target keyword naturally | Good: "SEO keyword research guide" Bad: "click here" |
| Contextual placement | Body content links > nav links | Link within relevant paragraphs |
| Reasonable density | 3-5 internal links per 1000 words | Avoid 100+ links on one page |

## Step 2: Identify Orphan Pages

Orphan pages have no internal links pointing to them. To find them:

1. Use Glob to collect all internal link targets across the site
2. Compare against sitemap or page inventory
3. Pages not in the link target list are orphans
4. Add links from topically relevant content to each orphan

## Step 3: Anchor Text Optimization

| Type | Example | Usage |
|------|---------|-------|
| Exact Match | "SEO tools" | Sparingly, 1-2x per page |
| Partial Match | "best SEO tools for startups" | Primary usage |
| Branded | "SEMrush" | Brand mentions |
| Generic | "click here" | Avoid |

Rule: Vary anchor text naturally. Never use 100% exact match anchors for the same target.

## Step 4: Build Topic Clusters

```
PILLAR: "Content Marketing" (broad, high volume keyword)
  ├── Supporting: "Content Marketing Strategy" (links to/from pillar)
  ├── Supporting: "Content Marketing Examples" (links to/from pillar)
  └── Supporting: "Content Marketing Tools" (links to/from pillar)
```

Benefits: establishes topical authority, passes PageRank efficiently, improves user navigation, signals content relationships to search engines.

## Step 5: Generate Linking Plan

```markdown
## Internal Linking Plan

### Target Page: {url}
**Target Keyword**: {keyword}

### Linking Opportunities

1. **From**: {source_page}
   - **Anchor**: {anchor_text}
   - **Context**: {surrounding_sentence}
   - **Priority**: HIGH

2. **From**: {source_page}
   - **Anchor**: {anchor_text}
   - **Context**: {surrounding_sentence}
   - **Priority**: MEDIUM

### Topic Cluster
PILLAR: {main_topic_page}
- Supporting: {page1}
- Supporting: {page2}
```

## Example: Auditing a Blog

```
Site: example.com/blog (45 posts)

Audit results:
- 8 orphan pages found (no internal links)
- 12 generic anchors ("click here", "read more")
- 3 broken internal links (404s)

Actions taken:
1. Added links to 8 orphan pages from related posts
2. Replaced 12 generic anchors with keyword-rich text
3. Fixed 2 broken links, removed 1 (page deleted)
4. Created 3 topic clusters around pillar pages

Expected impact: +15-25% crawl coverage, improved rankings for cluster topics
```

## Validation Checklist

- [ ] All orphan pages now have at least one internal link
- [ ] No broken internal links remain (all 404s fixed or removed)
- [ ] Generic anchors replaced with descriptive, keyword-relevant text
- [ ] Each topic cluster has bidirectional links between pillar and supporting pages
- [ ] No page exceeds 100 internal links
