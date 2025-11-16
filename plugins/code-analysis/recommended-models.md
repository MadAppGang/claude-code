# Recommended AI Models for Code Development

**Version:** 1.1.4
**Last Updated:** 2025-11-16
**Pricing Last Verified:** 2025-11-16
**Purpose:** Curated OpenRouter model recommendations for code development tasks
**Maintained By:** MadAppGang Claude Code Team

---

## Quick Reference - Model IDs Only

**Coding (Fast):**
- `x-ai/grok-code-fast-1` - Ultra-fast coding, $0.85/1M, 256K ⭐

**Reasoning (Architecture):**
- `google/gemini-2.5-flash` - Advanced reasoning with built-in thinking, $1.40/1M, 1M ⭐
- `qwen/qwen3-235b-a22b-2507` - Large-scale reasoning, $3.13/1M, 33K

**Budget (Free/Cheap):**
- `minimax/minimax-m2` - Compact high-efficiency, $0.64/1M, 205K ⭐
- `z-ai/glm-4.6` - Ultra-budget balanced pricing, $0.10/1M, 128K ⭐
- `openai/gpt-4o-mini` - Compact multimodal, $0.38/1M, 128K ⭐
- `tngtech/deepseek-r1t2-chimera:free` - Free reasoning model, FREE, 64K ⭐
- `openrouter/polaris-alpha` - OpenRouter ultra-budget, $0.05/1M, 128K ⭐

---

## How to Use This Guide

### For AI Agents

This file provides curated model recommendations for different code development tasks. When a user needs to select an AI model for plan review, code review, or other multi-model workflows:

1. **Start with Quick Reference** - Extract model slugs from the top section (8 recommended models)
2. **Read detailed sections** for context on "Best For", "Trade-offs", and use cases
3. **Use ⭐ markers** to identify top recommendations in each category
4. **Present options to user** with pricing, context window, and use case guidance
5. **Copy OpenRouter IDs exactly** as shown in backticks (e.g., `x-ai/grok-code-fast-1`)

### For Human Users

Browse categories to find models that match your needs:
- **Fast Coding Models** ⚡ - Quick iterations, code generation, reviews
- **Advanced Reasoning Models** 🧠 - Architecture, complex problem-solving
- **Budget-Friendly Models** 💰 - High-volume tasks, simple operations

Each model includes:
- OpenRouter ID (for use with Claudish CLI)
- Context window and pricing information
- Best use cases and trade-offs
- Guidance on when to use or avoid

---

## Quick Reference Table

| Model | Category | Speed | Quality | Cost | Context | Recommended For |
|-------|----------|-------|---------|------|---------|----------------|
| x-ai/grok-code-fast-1 | Coding ⚡ | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 256K | Ultra-fast coding, budget-friendly |
| google/gemini-2.5-flash | Reasoning 🧠 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰💰 | 1049K | Advanced reasoning, huge context |
| qwen/qwen3-235b-a22b-2507 | Reasoning 🧠 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | 33K | Large-scale reasoning (235B params) |
| minimax/minimax-m2 | Budget 💰 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 205K | Compact high-efficiency coding |
| z-ai/glm-4.6 | Budget 💰 | ⚡⚡⚡⚡ | ⭐⭐⭐ | 💰 | 128K | Ultra-budget balanced pricing |
| openai/gpt-4o-mini | Budget 💰 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 128K | Compact multimodal |
| tngtech/deepseek-r1t2-chimera:free | Budget 💰 | ⚡⚡⚡ | ⭐⭐⭐ | FREE | 64K | Free reasoning model |
| openrouter/polaris-alpha | Budget 💰 | ⚡⚡⚡⚡ | ⭐⭐⭐ | 💰 | 128K | OpenRouter ultra-budget |

**Legend:**
- Speed: ⚡ (1-5, more = faster)
- Quality: ⭐ (1-5, more = better)
- Cost: 💰 (1-5, more = expensive)
- Context: Token window size

---

## Category 1: Fast Coding Models ⚡

**Use When:** You need quick code generation, reviews, or iterations. Speed is priority.

### x-ai/grok-code-fast-1 (⭐ RECOMMENDED)

- **Provider:** xAI
- **OpenRouter ID:** `x-ai/grok-code-fast-1`
- **Model Version:** Grok Code Fast 1 (2025-11-16)
- **Context Window:** 256,000 tokens
- **Pricing:** $0.20/1M input, $1.50/1M output (Verified: 2025-11-16)
- **Response Time:** Ultra-fast (<2s typical)

**Best For:**
- Ultra-fast code reviews with visible reasoning traces
- Quick syntax and logic checks
- Rapid prototyping and iteration
- Agentic coding workflows
- Budget-conscious fast development
- High-volume code reviews

**Trade-offs:**
- Less sophisticated than premium models for complex architecture
- Smaller context than Gemini (256K vs 1049K)
- May miss subtle edge cases in complex systems

**When to Use:**
- ✅ **Budget-conscious fast coding** ($0.85/1M avg!)
- ✅ Inner dev loop (test-fix-test cycles)
- ✅ Quick feedback on code changes
- ✅ Large codebases needing fast turnaround
- ✅ Reasoning traces for debugging
- ✅ High-volume code reviews

**Avoid For:**
- ❌ Complex architectural decisions (use advanced reasoning models)
- ❌ Security-critical code review (use premium models)
- ❌ Performance optimization requiring deep analysis
- ❌ Tasks requiring >256K context

---

## Category 2: Advanced Reasoning Models 🧠

**Use When:** You need deep analysis, architectural planning, or complex problem-solving.

### google/gemini-2.5-flash (⭐ RECOMMENDED)

- **Provider:** Google
- **OpenRouter ID:** `google/gemini-2.5-flash`
- **Model Version:** Gemini 2.5 Flash (2025-11-16)
- **Context Window:** 1,049,000 tokens
- **Pricing:** $0.30/1M input, $2.50/1M output (Verified: 2025-11-16)
- **Response Time:** Very fast (<2s typical)

**Best For:**
- **Advanced reasoning, coding, and math with built-in thinking**
- Massive context analysis (1M+ tokens!)
- Multi-file refactoring
- Large repository analysis
- Complex system comprehension
- Architecture planning with extensive context

**Trade-offs:**
- Moderate pricing ($1.40/1M avg)
- Lower quality than specialized premium models for most complex reasoning
- Better for breadth than depth

**When to Use:**
- ✅ **Advanced reasoning with massive context** (1M tokens at $1.40/1M)
- ✅ Whole codebase analysis
- ✅ Multi-file architectural planning
- ✅ Large-scale refactoring
- ✅ Built-in thinking mode for complex problems
- ✅ Fast iterations on large projects

**Avoid For:**
- ❌ Tasks requiring absolute highest quality (use specialized premium models)
- ❌ When budget is primary constraint (use budget models)
- ❌ Simple coding tasks (use fast coding models)
- ❌ Small context tasks (<100K tokens)

---

### qwen/qwen3-235b-a22b-2507

- **Provider:** Alibaba (Qwen)
- **OpenRouter ID:** `qwen/qwen3-235b-a22b-2507`
- **Model Version:** Qwen3 235B A22B (2025-11-16)
- **Context Window:** 32,768 tokens
- **Pricing:** $1.25/1M input, $5.00/1M output (Verified: 2025-11-16)
- **Response Time:** Moderate (~5s typical)

**Best For:**
- **Large-scale reasoning model with 235B parameters**
- Complex algorithmic problem-solving
- Advanced mathematical reasoning
- Deep code analysis
- High-quality reasoning tasks
- Performance-critical reasoning

**Trade-offs:**
- Premium pricing ($3.13/1M avg)
- Smaller context window (33K vs Gemini's 1M)
- Slower than Flash models

**When to Use:**
- ✅ **Large-scale reasoning** (235B parameters)
- ✅ Complex algorithmic tasks
- ✅ Advanced mathematical reasoning
- ✅ When premium quality reasoning is needed
- ✅ Deep code analysis
- ✅ Quality over speed or cost

**Avoid For:**
- ❌ Large context needs (>33K)
- ❌ Budget-constrained projects
- ❌ Simple coding tasks
- ❌ When speed is critical

---

## Category 3: Budget-Friendly Models 💰

**Use When:** You need to minimize costs for high-volume or simple tasks.

### minimax/minimax-m2 (⭐ RECOMMENDED)

- **Provider:** MiniMax
- **OpenRouter ID:** `minimax/minimax-m2`
- **Model Version:** MiniMax M2 (2025-11-16)
- **Context Window:** 204,800 tokens
- **Pricing:** $0.255/1M input, $1.02/1M output (Verified: 2025-11-16)
- **Response Time:** Very fast (<2s typical)

**Best For:**
- Compact, high-efficiency end-to-end coding workflows
- Code generation and refactoring
- Quick prototyping
- Algorithm implementation
- Balanced speed and quality
- Mid-range budget projects

**Trade-offs:**
- Moderate pricing ($0.64/1M avg)
- Smaller context than Gemini models (205K vs 1049K)
- Less specialized than domain-specific models

**When to Use:**
- ✅ **High-efficiency coding** at affordable price ($0.64/1M)
- ✅ End-to-end development workflows
- ✅ Balanced speed and quality needs
- ✅ Quick iterations with good context (205K)
- ✅ Mid-range budget projects
- ✅ General-purpose coding tasks

**Avoid For:**
- ❌ Ultra-large context needs (>205K)
- ❌ Specialized software engineering (use premium models)
- ❌ When absolute lowest cost required
- ❌ Vision/UI tasks (use multimodal models)

---

### z-ai/glm-4.6 (⭐ RECOMMENDED)

- **Provider:** Zhipu AI
- **OpenRouter ID:** `z-ai/glm-4.6`
- **Model Version:** GLM-4.6 (2025-11-16)
- **Context Window:** 128,000 tokens
- **Pricing:** $0.10/1M input, $0.10/1M output (Verified: 2025-11-16)
- **Response Time:** Fast (~3s typical)

**Best For:**
- **Ultra-budget model with balanced input/output pricing**
- High-volume simple coding tasks
- Quick comprehension tasks
- Budget-conscious projects
- Learning and experimentation
- Simple code generation

**Trade-offs:**
- Lower quality than premium models
- Smaller context (128K)
- Less specialized for complex tasks
- Best for simple, straightforward operations

**When to Use:**
- ✅ **Ultra-budget balanced pricing** ($0.10/1M avg!)
- ✅ High-volume simple tasks
- ✅ Learning and experimentation
- ✅ Quick comprehension
- ✅ Budget-conscious projects
- ✅ Simple code generation

**Avoid For:**
- ❌ Complex architectural decisions
- ❌ Critical code review
- ❌ Large context needs (>128K)
- ❌ Production-critical implementations

---

### openai/gpt-4o-mini (⭐ RECOMMENDED)

- **Provider:** OpenAI
- **OpenRouter ID:** `openai/gpt-4o-mini`
- **Model Version:** GPT-4o Mini (2025-11-16)
- **Context Window:** 128,000 tokens
- **Pricing:** $0.15/1M input, $0.60/1M output (Verified: 2025-11-16)
- **Response Time:** Fast (~3s typical)

**Best For:**
- **Compact multimodal model supporting text and image inputs**
- Budget multimodal tasks
- Quick UI analysis
- Code review with screenshots
- Simple vision tasks
- Learning and experimentation

**Trade-offs:**
- Smaller context (128K)
- Lower quality than full GPT-4o
- Less specialized than domain models

**When to Use:**
- ✅ **Budget multimodal** from OpenAI ($0.38/1M)
- ✅ Quick UI reviews with screenshots
- ✅ Simple vision + code tasks
- ✅ Learning and experimentation
- ✅ Good context window (128K)
- ✅ Balanced cost and capabilities

**Avoid For:**
- ❌ Complex architectural planning
- ❌ Critical code review
- ❌ Large context needs (>128K)
- ❌ When specialized models are better suited

---

### tngtech/deepseek-r1t2-chimera:free (⭐ RECOMMENDED)

- **Provider:** TNG Technology Consulting
- **OpenRouter ID:** `tngtech/deepseek-r1t2-chimera:free`
- **Model Version:** DeepSeek R1T2 Chimera (2025-11-16)
- **Context Window:** 64,000 tokens
- **Pricing:** FREE (Verified: 2025-11-16)
- **Response Time:** Moderate (~5s typical)

**Best For:**
- **Free reasoning model variant optimized for cost-sensitive applications**
- Zero-cost experimentation
- High-volume testing
- Learning and exploration
- Budget-constrained projects
- Simple reasoning tasks

**Trade-offs:**
- Smaller context (64K)
- Lower quality than paid models
- Free tier may have rate limits
- Best for non-critical tasks

**When to Use:**
- ✅ **Completely free** (no cost!)
- ✅ Zero-cost experimentation
- ✅ High-volume testing
- ✅ Learning and exploration
- ✅ Budget-constrained projects
- ✅ Simple reasoning tasks

**Avoid For:**
- ❌ Production-critical applications
- ❌ Complex reasoning tasks
- ❌ Large context needs (>64K)
- ❌ When quality is paramount

---

### openrouter/polaris-alpha (⭐ RECOMMENDED)

- **Provider:** OpenRouter
- **OpenRouter ID:** `openrouter/polaris-alpha`
- **Model Version:** Polaris Alpha (2025-11-16)
- **Context Window:** 128,000 tokens
- **Pricing:** $0.05/1M input, $0.05/1M output (Verified: 2025-11-16)
- **Response Time:** Fast (~3s typical)

**Best For:**
- **OpenRouter's in-house ultra-budget model**
- Ultra-cheap high-volume tasks
- Simple code comprehension
- Quick syntax checks
- Learning and experimentation
- Budget-conscious projects

**Trade-offs:**
- Lower quality than premium models
- Less specialized for complex tasks
- Best for simple, straightforward operations

**When to Use:**
- ✅ **OpenRouter ultra-budget** ($0.05/1M avg!)
- ✅ Ultra-cheap high-volume tasks
- ✅ Simple code comprehension
- ✅ Quick syntax checks
- ✅ Learning and experimentation
- ✅ Budget-conscious projects

**Avoid For:**
- ❌ Complex architectural decisions
- ❌ Critical code review
- ❌ Production-critical implementations
- ❌ When quality is paramount

---

## Model Selection Decision Tree

Use this flowchart to choose the right model:

```
START: What is your primary need?

┌─ Architecture Planning or Complex Reasoning?
│  ├─ Need massive context (>400K) + speed → google/gemini-2.5-flash ⭐ ($1.40/1M, 1M)
│  └─ Need large-scale reasoning (235B params) → qwen/qwen3-235b-a22b-2507 ($3.13/1M, 33K)

┌─ Fast Code Review or Generation?
│  └─ Ultra-fast + reasoning traces → x-ai/grok-code-fast-1 ⭐ ($0.85/1M, 256K)

┌─ Budget is Top Priority?
│  ├─ Completely free → tngtech/deepseek-r1t2-chimera:free ⭐ (FREE, 64K)
│  ├─ Ultra-cheap → openrouter/polaris-alpha ⭐ ($0.05/1M, 128K)
│  ├─ Ultra-budget balanced → z-ai/glm-4.6 ⭐ ($0.10/1M, 128K)
│  ├─ Budget multimodal → openai/gpt-4o-mini ⭐ ($0.38/1M, 128K)
│  └─ Best value efficiency → minimax/minimax-m2 ⭐ ($0.64/1M, 205K)

┌─ High-Volume Simple Tasks?
│  ├─ Free → tngtech/deepseek-r1t2-chimera:free ⭐ (FREE, 64K)
│  └─ Ultra-cheap → openrouter/polaris-alpha ⭐ ($0.05/1M, 128K)

└─ Not sure? → Start with x-ai/grok-code-fast-1 (fast + affordable + reasoning)
```

---

## Performance Benchmarks

### Speed Comparison (Typical Response Times)

| Model | Simple Task | Complex Task | Large Context |
|-------|-------------|--------------|---------------|
| x-ai/grok-code-fast-1 | <2s | 4-5s | 6s |
| minimax/minimax-m2 | <2s | 4-5s | 6s |
| google/gemini-2.5-flash | <2s | 3-4s | 5s |
| z-ai/glm-4.6 | 3s | 5-6s | 7s |
| openai/gpt-4o-mini | 3s | 5-6s | 7s |
| openrouter/polaris-alpha | 3s | 5-6s | 7s |
| tngtech/deepseek-r1t2-chimera:free | 5s | 7-8s | 9s |
| qwen/qwen3-235b-a22b-2507 | 4-5s | 8-10s | 12s |

**Notes:**
- Times are approximate and vary based on load
- "Large Context" = >100K tokens
- Reasoning models may be slower for chain-of-thought
- Free models may have additional queuing time

### Cost Comparison (Per 1M Tokens)

| Model | Input | Output | Average (1:1 ratio) |
|-------|-------|--------|---------------------|
| tngtech/deepseek-r1t2-chimera:free | FREE | FREE | FREE |
| openrouter/polaris-alpha | $0.05 | $0.05 | $0.05 |
| z-ai/glm-4.6 | $0.10 | $0.10 | $0.10 |
| openai/gpt-4o-mini | $0.15 | $0.60 | $0.38 |
| minimax/minimax-m2 | $0.255 | $1.02 | $0.64 |
| x-ai/grok-code-fast-1 | $0.20 | $1.50 | $0.85 |
| google/gemini-2.5-flash | $0.30 | $2.50 | $1.40 |
| qwen/qwen3-235b-a22b-2507 | $1.25 | $5.00 | $3.13 |

**Notes:**
- Prices from OpenRouter (subject to change)
- "Average" assumes equal input/output tokens
- Typical code review is ~70% input, 30% output

### Quality vs Cost Analysis

**Best Value for Code Review:**
1. **tngtech/deepseek-r1t2-chimera:free** - Free reasoning model (FREE)
2. **openrouter/polaris-alpha** - OpenRouter ultra-budget ($0.05/1M)
3. **z-ai/glm-4.6** - Ultra-budget balanced pricing ($0.10/1M)
4. **minimax/minimax-m2** - High-efficiency coding ($0.64/1M)

**Best Quality:**
1. **qwen/qwen3-235b-a22b-2507** - Large-scale reasoning (235B params, $3.13/1M)
2. **google/gemini-2.5-flash** - Advanced reasoning + massive context ($1.40/1M)

**Best for Massive Context:**
1. **google/gemini-2.5-flash** - 1M tokens at $1.40/1M (fast reasoning)

---

## Integration Examples

### Example 1: Multi-Model Plan Review (PHASE 1.5)

**In /implement command:**

```markdown
## PHASE 1.5: Multi-Model Plan Review

**Step 1:** Read model recommendations

Use Read tool to load: ${CLAUDE_PLUGIN_ROOT}/recommended-models.md

**Step 2:** Extract recommended reasoning models

From section "Advanced Reasoning Models 🧠", extract models marked with ⭐:
- google/gemini-2.5-flash (advanced reasoning + massive context - $1.40/1M)

**Step 3:** Present options to user

AskUserQuestion with these options:

"Select AI models for architecture plan review:

**Recommended (Advanced Reasoning):**
• google/gemini-2.5-flash - Advanced reasoning, 1M context ($1.40/1M)
• qwen/qwen3-235b-a22b-2507 - Large-scale reasoning, 235B params ($3.13/1M)

**Fast & Affordable:**
• x-ai/grok-code-fast-1 - Ultra-fast architectural feedback ($0.85/1M)
• minimax/minimax-m2 - High-efficiency planning ($0.64/1M)

**Custom:**
• Enter any OpenRouter model ID

**Skip:**
• Continue without multi-model review

Which models would you like to use? (select 1-3 or skip)"
```

### Example 2: Budget-Optimized Code Review

**In code review workflow:**

```markdown
## Budget-Optimized Multi-Model Review

**Read recommendations:**
${CLAUDE_PLUGIN_ROOT}/recommended-models.md → "Budget-Friendly Models"

**Extract budget models:**
- tngtech/deepseek-r1t2-chimera:free (FREE) - Free reasoning model
- openrouter/polaris-alpha ($0.05/1M) - OpenRouter ultra-budget
- z-ai/glm-4.6 ($0.10/1M) - Ultra-budget balanced pricing

**Run 3 parallel reviews:**
1. Claude Sonnet (internal, comprehensive)
2. DeepSeek R1T2 Chimera (external, free)
3. Polaris Alpha (external, ultra-cheap)

**Total cost for 100K token review:**
- Claude Sonnet: ~$1.80
- DeepSeek R1T2 Chimera: FREE
- Polaris Alpha: ~$0.005
- **Grand Total: ~$1.81** (vs $9.00 for 3x Sonnet)
```

### Example 3: Vision Task Model Selection

**In UI validation workflow:**

```markdown
## UI Design Validation

**Task:** Compare Figma design screenshot to implemented UI

**Recommended model:**
openai/gpt-4o-mini
- Compact multimodal model (text + images)
- 128K token context
- Budget-friendly multimodal ($0.38/1M)
- Strong UI analysis capabilities

**Run with Claudish:**
npx claudish --model openai/gpt-4o-mini --stdin --quiet < prompt.txt
```

---

## Maintenance and Updates

### How to Update This File

**Step 1: Edit Source**
```bash
# Edit the source file (ONLY place to edit!)
vim shared/recommended-models.md
```

**Step 2: Sync to Plugins**
```bash
# Distribute updates to all plugins
bun run sync-shared
```

**Step 3: Verify**
```bash
# Check files were updated
cat plugins/frontend/recommended-models.md | head -20
cat plugins/bun/recommended-models.md | head -20
cat plugins/code-analysis/recommended-models.md | head -20
```

### Update Checklist

When adding a new model:
- [ ] Add to appropriate category section
- [ ] Include all required fields (Provider, ID, Context, Pricing, etc.)
- [ ] Write "Best For", "Trade-offs", "When to Use", "Avoid For"
- [ ] Update Quick Reference section
- [ ] Update Quick Reference Table
- [ ] Update Decision Tree if needed
- [ ] Update Performance Benchmarks
- [ ] Run sync script
- [ ] Test in a command (verify AI can extract the model)

When removing a model:
- [ ] Remove from category section
- [ ] Remove from Quick Reference section
- [ ] Remove from Quick Reference Table
- [ ] Update Decision Tree if needed
- [ ] Update Performance Benchmarks
- [ ] Run sync script
- [ ] Update any commands that hardcoded the model

When updating pricing:
- [ ] Update in model entry
- [ ] Update in Quick Reference section
- [ ] Update in Quick Reference Table
- [ ] Update in Cost Comparison table
- [ ] Update last-updated date at top
- [ ] Run sync script

---

## Questions and Support

**For model recommendations:**
- See category sections and decision tree above
- Ask in project discussions or issues

**For technical issues:**
- Check `shared/README.md` for sync pattern
- See `CLAUDE.md` for project overview
- Contact: Jack Rudenko (i@madappgang.com)

**To suggest new models:**
- Open an issue with model details
- Include: Provider, ID, pricing, use cases
- Maintainers will evaluate and add

---

**Maintained By:** MadAppGang Claude Code Team
**Repository:** https://github.com/MadAppGang/claude-code
**License:** MIT
