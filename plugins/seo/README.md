# SEO Plugin

**Version:** 1.2.0
**Category:** Content
**License:** MIT

Comprehensive SEO toolkit with keyword research, content optimization, technical audits, multi-agent content workflows, and analytics integrations (GA4, GSC).

## Features

- **SERP Analysis** - Search engine results page analysis with intent classification
- **Keyword Research** - Semantic clustering and content gap analysis
- **Content Optimization** - On-page SEO improvements with readability scoring
- **Content Brief Generation** - Structured briefs for SEO-optimized content
- **Technical SEO Audits** - Schema markup, internal linking, and technical health checks
- **E-E-A-T Validation** - Experience, Expertise, Authoritativeness, Trustworthiness scoring
- **Multi-Agent Workflows** - Coordinated execution across 5 specialized agents
- **Analytics Integration** - GA4, Google Search Console data correlation
- **Multi-Model Review** - Parallel AI validation with E-E-A-T consensus scoring
- **A/B Alternative Generation** - Multi-model content alternatives with voting

## Architecture

```
+-------------------------------------------------------------+
|                      SEO PLUGIN (v1.2.0)                    |
+-------------------------------------------------------------+
|                                                             |
|  COMMANDS (8)                    AGENTS (5)                 |
|  +-- /research                  +-- seo-analyst (Sonnet)    |
|  +-- /optimize                  +-- seo-researcher (Sonnet) |
|  +-- /brief                     +-- seo-writer (Sonnet)     |
|  +-- /audit                     +-- seo-editor (Opus)       |
|  +-- /review                    +-- seo-data-analyst (Sonnet)|
|  +-- /alternatives                                          |
|  +-- /performance               ANALYTICS INTEGRATIONS      |
|  +-- /setup-analytics           +-- Google Analytics 4      |
|                                 +-- Google Search Console   |
|  SKILLS (10)                                                |
|  +-- keyword-cluster-builder                                |
|  +-- content-optimizer          TOOL INTEGRATIONS           |
|  +-- content-brief              +-- WebFetch, WebSearch     |
|  +-- technical-audit            +-- Chrome DevTools MCP     |
|  +-- serp-analysis              +-- Claudish (multi-model)  |
|  +-- schema-markup              +-- claudeup (MCP setup)    |
|  +-- link-strategy                                          |
|  +-- analytics-interpretation   DEPENDENCIES                |
|  +-- performance-correlation    +-- orchestration plugin    |
|  +-- data-extraction-patterns                               |
|                                                             |
+-------------------------------------------------------------+
```

## Agents

### SEO Analyst (Sonnet, Purple)
SERP analysis, search intent extraction, and competitive intelligence.

**Use cases:**
- Analyze SERP for target keywords
- Classify search intent (informational, commercial, transactional, navigational)
- Competitive content analysis
- Featured snippet opportunity identification

### SEO Researcher (Sonnet, Blue)
Keyword research, content gap analysis, and data gathering.

**Use cases:**
- Expand seed keywords to 50-100 related terms
- Semantic clustering by topic and intent
- Funnel stage mapping (awareness, consideration, decision)
- Content gap identification

### SEO Writer (Sonnet, Green)
SEO-optimized content generation from structured briefs.

**Use cases:**
- Generate content from briefs
- Optimize meta tags (title, description)
- Integrate keywords naturally
- Add internal/external links
- Optimize for featured snippets

### SEO Editor (Opus, Cyan)
Quality review, SEO compliance, and E-E-A-T validation.

**Use cases:**
- Review content for SEO compliance
- Validate E-E-A-T signals
- Check keyword optimization
- Verify readability scores
- Validate schema markup

### SEO Data Analyst (Sonnet, Cyan)
Analytics data specialist for cross-source performance correlation.

**Use cases:**
- Interpret GA4 and GSC data
- Correlate metrics across sources (high impressions + low CTR = snippet issue)
- Calculate Content Health Score (0-100)
- Generate data-driven optimization recommendations

## Commands

### `/seo-research <keyword>`
Comprehensive keyword research workflow with multi-agent orchestration.

**Workflow:** SESSION INIT → ANALYST → RESEARCHER → REPORT

**Deliverables:**
- SERP analysis with intent classification
- 50-100 keyword cluster
- Funnel stage mapping
- Content gap analysis
- Priority recommendations

### `/seo-optimize <file>`
Optimize existing content for target keywords.

**Workflow:** SESSION INIT → ANALYZE → RECOMMEND → APPLY → VERIFY

**Improvements:**
- Keyword density optimization
- Meta tag refinement
- Heading structure
- Readability improvements
- Internal linking suggestions

**Optional:** Multi-model validation for critical content

### `/seo-brief <keyword>`
Generate comprehensive content brief for target keyword.

**Workflow:** SESSION INIT → ANALYST → RESEARCHER → WRITER → BRIEF

**Deliverables:**
- Target keyword and secondaries
- Search intent classification
- Competitor analysis
- Outline with keyword mapping
- Word count target
- E-E-A-T requirements

### `/audit <url>`
Technical SEO audit with Chrome DevTools MCP integration.

**Workflow:** SESSION INIT → FETCH → ANALYZE → REPORT

**Checks:**
- Schema markup validation
- Internal link analysis
- Meta tag compliance
- Readability scoring
- Mobile-friendliness
- Page speed indicators

### `/review <file|content>`
Multi-model E-E-A-T content review with parallel validation.

**Workflow:** SESSION INIT → PARALLEL REVIEWS → CONSENSUS → REPORT

**Features:**
- Parallel execution with 8 external AI models
- E-E-A-T consensus scoring (0-100)
- Severity classification (UNANIMOUS, STRONG, MAJORITY, DIVERGENT)
- Cost transparency before execution

### `/alternatives <content>`
Generate A/B content alternatives using multiple AI models.

**Workflow:** SESSION INIT → PARALLEL GENERATION → VOTING → SELECTION

**Features:**
- Multiple content variations from different AI perspectives
- Community voting simulation
- Best alternative selection with rationale

### `/performance <url>`
Content performance analysis combining GA4 and GSC data.

**Workflow:** SESSION INIT → PARALLEL DATA FETCH → CORRELATE → ANALYZE → RECOMMEND

**Features:**
- Parallel fetching from all configured analytics sources
- Content Health Score (0-100) calculation
- Cross-source correlation patterns
- Graceful degradation (works with 1 or 2 sources)
- Quick wins, strategic, and long-term recommendations

### `/setup-analytics`
Interactive setup wizard for SEO analytics integrations.

**Workflow:** CHECK STATUS → SELECT SERVICES → CONFIGURE → VALIDATE → SAVE

**Supports:**
- Google Analytics 4 (page metrics, engagement)
- Google Search Console (search performance, CTR)

**Quick Setup:** Run `npx claudeup` and navigate to SEO & Analytics.

## Skills

### keyword-cluster-builder
Semantic keyword clustering and topic modeling patterns.

### content-optimizer
On-page SEO optimization techniques and readability formulas.

### content-brief
Structured content brief generation with competitive analysis.

### technical-audit
Technical SEO checklist and validation patterns.

### serp-analysis
SERP feature identification and intent classification.

### schema-markup
Schema.org implementation and validation patterns.

### link-strategy
Internal linking strategy and anchor text optimization.

### analytics-interpretation
Metric benchmarks and status indicators for GA4 and GSC data.

### performance-correlation
Cross-source correlation patterns and Content Health Score calculation.

### data-extraction-patterns
API patterns, rate limiting, caching, and error handling for analytics data.

## Analytics Integration

The SEO plugin integrates with two analytics platforms via MCP servers:

### Google Analytics 4
- **MCP Server:** `mcp-server-google-analytics`
- **Metrics:** Page views, engagement rate, bounce rate, session duration
- **Setup:** Service Account with Analytics Data API enabled

### Google Search Console
- **MCP Server:** `mcp-server-gsc`
- **Metrics:** Impressions, clicks, CTR, average position
- **Setup:** Service Account with Search Console API access

### Quick Setup

```bash
# Recommended: Use claudeup TUI for easy MCP server setup
npx claudeup
# Navigate to: MCP Server Setup → SEO & Analytics
```

Or run `/setup-analytics` for an interactive setup wizard.

## Multi-Agent Workflow

```
Sequential Pipeline with Quality Gates:

+------------------+     +------------------+     +------------------+     +------------------+
|   SEO ANALYST    |---->|   RESEARCHER     |---->|   SEO WRITER     |---->|   SEO EDITOR     |
|     (Sonnet)     |     |     (Sonnet)     |     |     (Sonnet)     |     |     (Opus)       |
+------------------+     +------------------+     +------------------+     +------------------+
        |                        |                        |                        |
        v                        v                        v                        v
   SERP Analysis            Keyword Cluster           Content Draft           Final Review
   Intent Mapping           Content Gaps              Optimized Copy          E-E-A-T Check
   Competitor Intel         Supporting Data           Internal Links          SEO Compliance
        |                        |                        |                        |
        v                        v                        v                        v
   [USER GATE]              [AUTO GATE]              [USER GATE]           [FINAL APPROVE]
```

## Installation

### Option 1: From Marketplace

```bash
/plugin marketplace add MadAppGang/claude-code
/plugin install seo@mag-claude-plugins
```

### Option 2: Per-Project (Recommended for Teams)

Add to `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "seo@mag-claude-plugins": true
  }
}
```

Commit this file and team members get automatic setup.

## Dependencies

This plugin requires the orchestration plugin for multi-agent coordination patterns:

```json
{
  "dependencies": {
    "orchestration@mag-claude-plugins": "^0.5.0"
  }
}
```

The orchestration plugin installs automatically when you install the SEO plugin.

## Session-Based Workflows

All commands use session-based artifact management:

```
Session Path: /tmp/seo-{timestamp}-{keyword-slug}/

Artifacts:
- serp-analysis-{keyword}.md
- keyword-research.md
- content-brief.md
- content-draft.md
- editorial-review.md
- final-report.md
```

**Session Retention:** 7 days (copy important artifacts to `ai-docs/` for permanence)

## Tool Integrations

- **WebSearch** - SERP data retrieval
- **WebFetch** - Competitor page analysis
- **Chrome DevTools MCP** - Technical SEO validation (optional)
- **Claudish** - Multi-model validation (optional)

## Example Usage

### Keyword Research
```
/seo-research "content marketing"
```

**Result:** 75 keywords across 8 clusters with priority recommendations

### Content Optimization
```
/seo-optimize docs/blog/content-marketing-guide.md
```

**Result:** Optimized content with improved keyword density, meta tags, and readability

### Content Brief
```
/seo-brief "best project management software"
```

**Result:** Comprehensive brief with outline, keyword mapping, and competitor insights

### Technical Audit
```
/seo-audit https://example.com/blog/post
```

**Result:** Technical SEO report with schema, internal links, and compliance checks

## E-E-A-T Scoring

The seo-editor agent uses a quantified E-E-A-T rubric (0-100 scale):

| Factor | Weight | Score Range | Signals |
|--------|--------|-------------|---------|
| Experience | 30% | 0-30 | First-hand examples, case studies, original research |
| Expertise | 30% | 0-30 | Depth of coverage, technical accuracy, sources cited |
| Authoritativeness | 20% | 0-20 | Author credentials, backlinks, brand mentions |
| Trustworthiness | 20% | 0-20 | Fact-checking, transparency, contact info, HTTPS |

**Scoring:**
- 90-100: Excellent (publish-ready)
- 75-89: Good (minor improvements)
- 60-74: Fair (needs work)
- <60: Poor (major revisions required)

## Best Practices

1. **Start with Research** - Always run `/seo-research` before content creation
2. **Follow the Pipeline** - ANALYST → RESEARCHER → WRITER → EDITOR
3. **Use Session Artifacts** - Review intermediate outputs for quality
4. **Copy Final Reports** - Move session artifacts to permanent storage
5. **Validate E-E-A-T** - Let seo-editor review before publishing
6. **Test Technical SEO** - Run `/seo-audit` before going live

## Troubleshooting

### WebSearch/WebFetch Failures
- Retry with simplified queries
- Fall back to pattern-based keyword expansion
- Note data limitations in reports

### Session Cleanup
- Sessions older than 7 days may be deleted
- Copy important artifacts to `ai-docs/` directory
- Use session metadata to track artifacts

### Chrome DevTools MCP
- Required for `/seo-audit` command
- Falls back to WebFetch if MCP unavailable
- See orchestration plugin for MCP setup

## Contributing

Issues and feature requests: https://github.com/MadAppGang/claude-code/issues

## License

MIT License - see LICENSE file for details

## Author

Jack Rudenko (i@madappgang.com) @ MadAppGang
