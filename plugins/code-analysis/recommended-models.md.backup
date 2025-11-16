# Recommended AI Models for Code Development

**Version:** 1.1.3
**Last Updated:** 2025-11-15
**Pricing Last Verified:** 2025-11-15
**Purpose:** Curated OpenRouter model recommendations for code development tasks
**Maintained By:** MadAppGang Claude Code Team

---

## Quick Reference - Model IDs Only

**Coding (Fast):**
- `x-ai/grok-code-fast-1` - Ultra-fast coding, $0.85/1M, 256K ⭐
- `minimax/minimax-m2` - Compact high-efficiency, $0.64/1M, 205K ⭐
- `z-ai/glm-4.6` - Enhanced coding capabilities, $1.08/1M, 203K

**Reasoning (Architecture):**
- `openai/gpt-5.1-codex` - Specialized software engineering, $5.63/1M, 400K ⭐
- `google/gemini-2.5-flash` - Advanced reasoning with built-in thinking, $1.40/1M, 1M ⭐
- `google/gemini-2.5-pro` - State-of-the-art reasoning, $5.63/1M, 1M

**Vision (UI Analysis):**
- `qwen/qwen3-vl-235b-a22b-instruct` - Multimodal vision-language, $0.55/1M, 262K ⭐

**Budget (Free/Cheap):**
- `google/gemini-2.0-flash-001` - Faster TTFT, multimodal, $0.25/1M, 1M ⭐
- `google/gemini-2.5-flash-lite` - Ultra-low latency, $0.25/1M, 1M ⭐
- `deepseek/deepseek-chat-v3-0324` - 685B parameter MoE, $0.54/1M, 164K
- `openai/gpt-4o-mini` - Compact multimodal, $0.38/1M, 128K

---

## How to Use This Guide

### For AI Agents

This file provides curated model recommendations for different code development tasks. When a user needs to select an AI model for plan review, code review, or other multi-model workflows:

1. **Start with Quick Reference** - Extract model slugs from the top section (11 recommended models)
2. **Read detailed sections** for context on "Best For", "Trade-offs", and use cases
3. **Use ⭐ markers** to identify top recommendations in each category
4. **Present options to user** with pricing, context window, and use case guidance
5. **Copy OpenRouter IDs exactly** as shown in backticks (e.g., `x-ai/grok-code-fast-1`)

### For Human Users

Browse categories to find models that match your needs:
- **Fast Coding Models** ⚡ - Quick iterations, code generation, reviews
- **Advanced Reasoning Models** 🧠 - Architecture, complex problem-solving
- **Vision & Multimodal Models** 👁️ - UI analysis, screenshot reviews
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
| minimax/minimax-m2 | Coding ⚡ | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 205K | Compact high-efficiency coding |
| z-ai/glm-4.6 | Coding ⚡ | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 203K | Enhanced coding capabilities |
| openai/gpt-5.1-codex | Reasoning 🧠 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰💰 | 400K | Specialized software engineering |
| google/gemini-2.5-flash | Reasoning 🧠 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰💰 | 1049K | Advanced reasoning, huge context |
| google/gemini-2.5-pro | Reasoning 🧠 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰💰 | 1049K | State-of-the-art reasoning |
| qwen/qwen3-vl-235b-a22b-instruct | Vision 👁️ | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 262K | Vision-language UI analysis |
| google/gemini-2.0-flash-001 | Budget 💰 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 1049K | Fast multimodal, huge context |
| google/gemini-2.5-flash-lite | Budget 💰 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | 💰 | 1049K | Ultra-low latency |
| deepseek/deepseek-chat-v3-0324 | Budget 💰 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 164K | Budget flagship chat |
| openai/gpt-4o-mini | Budget 💰 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 128K | Compact multimodal |

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
- **Model Version:** Grok Code Fast 1 (2025-11-15)
- **Context Window:** 256,000 tokens
- **Pricing:** $0.20/1M input, $1.50/1M output (Verified: 2025-11-15)
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

### minimax/minimax-m2 (⭐ RECOMMENDED)

- **Provider:** MiniMax
- **OpenRouter ID:** `minimax/minimax-m2`
- **Model Version:** MiniMax M2 (2025-11-15)
- **Context Window:** 205,000 tokens
- **Pricing:** $0.255/1M input, $1.02/1M output (Verified: 2025-11-15)
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
- ❌ Specialized software engineering (use Codex)
- ❌ Vision/UI tasks (use multimodal models)
- ❌ When absolute lowest cost required

---

### z-ai/glm-4.6

- **Provider:** Zhipu AI
- **OpenRouter ID:** `z-ai/glm-4.6`
- **Model Version:** GLM-4.6 (2025-11-15)
- **Context Window:** 203,000 tokens
- **Pricing:** $0.40/1M input, $1.75/1M output (Verified: 2025-11-15)
- **Response Time:** Fast (~3s typical)

**Best For:**
- Enhanced coding capabilities over GLM-4.5
- Algorithm implementation
- Code optimization
- Mathematical problem-solving
- Programming challenges
- Mid-range coding projects

**Trade-offs:**
- Moderate pricing ($1.08/1M avg)
- Smaller context than Gemini (203K vs 1049K)
- Less specialized than Codex for software engineering

**When to Use:**
- ✅ Enhanced coding over previous GLM versions
- ✅ Algorithm development and optimization
- ✅ Math and programming tasks
- ✅ Mid-range budget coding projects
- ✅ Good context window (203K)
- ✅ Balanced speed and quality

**Avoid For:**
- ❌ Ultra-large context needs (>203K)
- ❌ Vision/UI analysis tasks
- ❌ When budget is primary constraint
- ❌ Complex architectural planning

---

## Category 2: Advanced Reasoning Models 🧠

**Use When:** You need deep analysis, architectural planning, or complex problem-solving.

### openai/gpt-5.1-codex (⭐ RECOMMENDED)

- **Provider:** OpenAI
- **OpenRouter ID:** `openai/gpt-5.1-codex`
- **Model Version:** GPT-5.1-Codex (2025-11-13)
- **Context Window:** 400,000 tokens
- **Pricing:** $1.25/1M input, $10.00/1M output (Verified: 2025-11-15)
- **Response Time:** Fast with adjustable reasoning (~3-5s typical)

**Best For:**
- **Specialized software engineering and agentic coding workflows**
- Large-scale refactoring across multiple files
- Structured code review with dependency analysis
- Building projects from scratch
- Feature development with extended reasoning
- Debugging complex systems
- UI development with multimodal screenshot support
- Long-running multi-hour engineering tasks

**Trade-offs:**
- Premium pricing ($5.63/1M avg)
- More expensive than budget reasoning models
- May be overkill for simple CRUD operations

**When to Use:**
- ✅ **Complex engineering tasks** requiring deep reasoning
- ✅ **Agentic coding workflows** (multi-step autonomous execution)
- ✅ **Large-scale refactoring** across codebases
- ✅ **Code review with dependency analysis** (validates against tests)
- ✅ **UI development** with screenshot/image analysis (multimodal)
- ✅ **Multi-hour project execution** (adjustable reasoning effort)
- ✅ **Critical code paths** requiring highest quality
- ✅ Projects where quality > cost

**Avoid For:**
- ❌ Simple CRUD operations or basic features
- ❌ Quick syntax fixes or trivial changes
- ❌ Ultra-budget projects (<$1/1M requirement)
- ❌ When Gemini Flash or budget models suffice

---

### google/gemini-2.5-flash (⭐ RECOMMENDED)

- **Provider:** Google
- **OpenRouter ID:** `google/gemini-2.5-flash`
- **Model Version:** Gemini 2.5 Flash (2025-11-15)
- **Context Window:** 1,049,000 tokens
- **Pricing:** $0.30/1M input, $2.50/1M output (Verified: 2025-11-15)
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
- Lower quality than Gemini Pro for most complex reasoning
- Better for breadth than depth

**When to Use:**
- ✅ **Advanced reasoning with massive context** (1M tokens at $1.40/1M)
- ✅ Whole codebase analysis
- ✅ Multi-file architectural planning
- ✅ Large-scale refactoring
- ✅ Built-in thinking mode for complex problems
- ✅ Fast iterations on large projects

**Avoid For:**
- ❌ Tasks requiring absolute highest quality (use Gemini Pro or Codex)
- ❌ When budget is primary constraint (use budget models)
- ❌ Simple coding tasks (use fast coding models)
- ❌ Vision-heavy tasks (use vision models)

---

### google/gemini-2.5-pro

- **Provider:** Google
- **OpenRouter ID:** `google/gemini-2.5-pro`
- **Model Version:** Gemini 2.5 Pro (2025-11-15)
- **Context Window:** 1,049,000 tokens
- **Pricing:** $1.25/1M input, $10.00/1M output (Verified: 2025-11-15)
- **Response Time:** Moderate (~5s typical)

**Best For:**
- **State-of-the-art reasoning with enhanced accuracy**
- Complex architectural decisions
- Critical code paths requiring highest quality
- Large-scale system design
- Advanced problem-solving
- Production-critical implementations

**Trade-offs:**
- Premium pricing ($5.63/1M avg)
- Slower than Flash models
- May be overkill for simple tasks

**When to Use:**
- ✅ **State-of-the-art reasoning** (same cost as Codex)
- ✅ Complex architectural planning
- ✅ Critical code review requiring maximum accuracy
- ✅ Massive context + premium quality (1M tokens)
- ✅ Production-critical implementations
- ✅ Projects where quality is paramount

**Avoid For:**
- ❌ Simple CRUD operations
- ❌ Quick syntax fixes
- ❌ Budget-conscious projects
- ❌ When speed is primary requirement

---

## Category 3: Vision & Multimodal Models 👁️

**Use When:** You need UI/UX analysis, screenshot reviews, or diagram interpretation.

### qwen/qwen3-vl-235b-a22b-instruct (⭐ RECOMMENDED)

- **Provider:** Alibaba (Qwen)
- **OpenRouter ID:** `qwen/qwen3-vl-235b-a22b-instruct`
- **Model Version:** Qwen3 VL 235B A22B Instruct (2025-11-15)
- **Context Window:** 262,000 tokens
- **Pricing:** $0.22/1M input, $0.88/1M output (Verified: 2025-11-15)
- **Vision:** Multimodal vision-language model
- **Response Time:** Fast (~3s typical)

**Best For:**
- **Multimodal vision-language tasks for UI/document analysis**
- UI/UX design analysis at budget-friendly price
- Screenshot-based debugging
- Design fidelity validation
- Component recognition
- Visual accessibility audits
- Document and diagram interpretation

**Trade-offs:**
- Smaller context than text models (262K vs 1049K)
- Less specialized for pure coding tasks
- Vision quality may vary by task complexity

**When to Use:**
- ✅ **Budget-friendly vision-language** ($0.55/1M avg!)
- ✅ Screenshot-based UI reviews
- ✅ Figma design to code comparison
- ✅ Accessibility visual audits
- ✅ Design system consistency checks
- ✅ Document and diagram analysis
- ✅ Multimodal tasks requiring text + vision

**Avoid For:**
- ❌ Pure code review (use coding models)
- ❌ Ultra-large design systems (>262K context)
- ❌ Tasks not requiring vision capabilities
- ❌ When text-only models are sufficient

---

## Category 4: Budget-Friendly Models 💰

**Use When:** You need to minimize costs for high-volume or simple tasks.

### google/gemini-2.0-flash-001 (⭐ RECOMMENDED)

- **Provider:** Google
- **OpenRouter ID:** `google/gemini-2.0-flash-001`
- **Model Version:** Gemini 2.0 Flash (2025-11-15)
- **Context Window:** 1,049,000 tokens
- **Pricing:** $0.10/1M input, $0.40/1M output (Verified: 2025-11-15)
- **Response Time:** Ultra-fast (<2s typical)

**Best For:**
- **Faster TTFT, enhanced multimodal and coding capabilities**
- Ultra-cheap massive context analysis
- High-volume simple coding tasks
- Quick comprehension of complex systems
- Budget-conscious multimodal tasks
- Learning and experimentation

**Trade-offs:**
- Lower quality than Gemini 2.5 models
- Less specialized than domain-specific models
- Best for breadth, not depth

**When to Use:**
- ✅ **Ultra-cheap massive context** (1M tokens at $0.25/1M!)
- ✅ High-volume simple tasks
- ✅ Multimodal capabilities on budget
- ✅ Whole codebase analysis affordably
- ✅ Learning and experimentation
- ✅ Fast iterations on large projects

**Avoid For:**
- ❌ Critical code paths requiring highest quality
- ❌ Complex architectural decisions
- ❌ Security-critical reviews
- ❌ Production releases requiring maximum accuracy

---

### google/gemini-2.5-flash-lite (⭐ RECOMMENDED)

- **Provider:** Google
- **OpenRouter ID:** `google/gemini-2.5-flash-lite`
- **Model Version:** Gemini 2.5 Flash Lite (2025-11-15)
- **Context Window:** 1,049,000 tokens
- **Pricing:** $0.10/1M input, $0.40/1M output (Verified: 2025-11-15)
- **Response Time:** Ultra-fast (<2s typical)

**Best For:**
- **Ultra-low latency, cost-efficient lightweight reasoning**
- High-speed code generation
- Quick syntax checks
- Rapid prototyping
- High-volume simple operations
- Latency-sensitive workflows

**Trade-offs:**
- Lightweight model - less quality than standard Gemini 2.5
- Not suitable for complex reasoning
- Best for simple, fast tasks

**When to Use:**
- ✅ **Ultra-low latency** with huge context (1M tokens)
- ✅ High-volume simple coding tasks
- ✅ Quick syntax and logic checks
- ✅ Rapid prototyping
- ✅ Latency-critical workflows
- ✅ Budget-conscious projects ($0.25/1M)

**Avoid For:**
- ❌ Complex reasoning or architecture
- ❌ Critical code review
- ❌ Production-critical implementations
- ❌ Tasks requiring highest quality

---

### deepseek/deepseek-chat-v3-0324

- **Provider:** DeepSeek
- **OpenRouter ID:** `deepseek/deepseek-chat-v3-0324`
- **Model Version:** DeepSeek Chat V3 (2025-03-24)
- **Context Window:** 164,000 tokens
- **Pricing:** $0.24/1M input, $0.84/1M output (Verified: 2025-11-15)
- **Response Time:** Fast (~3s typical)

**Best For:**
- **685B-parameter mixture-of-experts flagship chat model**
- Budget-friendly complex reasoning
- Algorithm implementation
- Mathematical problem-solving
- Code optimization
- Mid-range budget projects

**Trade-offs:**
- Moderate context (164K vs Gemini's 1M)
- Less specialized for software engineering
- May require more guidance for edge cases

**When to Use:**
- ✅ **Budget flagship model** ($0.54/1M avg)
- ✅ Algorithm development
- ✅ Math and programming tasks
- ✅ Code optimization
- ✅ Mid-range budget reasoning
- ✅ Good context window (164K)

**Avoid For:**
- ❌ Ultra-large context needs (>164K)
- ❌ Vision/UI analysis tasks
- ❌ Specialized software engineering (use Codex)
- ❌ When absolute lowest cost required

---

### openai/gpt-4o-mini

- **Provider:** OpenAI
- **OpenRouter ID:** `openai/gpt-4o-mini`
- **Model Version:** GPT-4o Mini (2025-11-15)
- **Context Window:** 128,000 tokens
- **Pricing:** $0.15/1M input, $0.60/1M output (Verified: 2025-11-15)
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

## Model Selection Decision Tree

Use this flowchart to choose the right model:

```
START: What is your primary need?

┌─ Architecture Planning or Complex Reasoning?
│  ├─ Budget < $1/1M → google/gemini-2.0-flash-001 ($0.25/1M)
│  ├─ Need massive context (>400K) + speed → google/gemini-2.5-flash ⭐ ($1.40/1M, 1M)
│  ├─ Need maximum quality → google/gemini-2.5-pro ($5.63/1M, 1M)
│  └─ Specialized software engineering → openai/gpt-5.1-codex ⭐ ($5.63/1M, 400K)

┌─ Fast Code Review or Generation?
│  ├─ Budget < $0.50/1M → google/gemini-2.0-flash-001 ($0.25/1M)
│  ├─ Best value → minimax/minimax-m2 ⭐ ($0.64/1M, 205K)
│  ├─ Ultra-fast + reasoning traces → x-ai/grok-code-fast-1 ⭐ ($0.85/1M, 256K)
│  └─ Enhanced capabilities → z-ai/glm-4.6 ($1.08/1M, 203K)

┌─ UI/Design Analysis (Screenshots)?
│  └─ Recommended → qwen/qwen3-vl-235b-a22b-instruct ⭐ ($0.55/1M, 262K)

┌─ Budget is Top Priority?
│  ├─ Ultra-cheap + massive context → google/gemini-2.0-flash-001 ⭐ ($0.25/1M, 1M)
│  ├─ Ultra-low latency → google/gemini-2.5-flash-lite ⭐ ($0.25/1M, 1M)
│  ├─ Budget flagship → deepseek/deepseek-chat-v3-0324 ($0.54/1M, 164K)
│  └─ Budget multimodal → openai/gpt-4o-mini ($0.38/1M, 128K)

┌─ High-Volume Simple Tasks?
│  ├─ Massive context → google/gemini-2.0-flash-001 ⭐ ($0.25/1M, 1M)
│  └─ Ultra-low latency → google/gemini-2.5-flash-lite ⭐ ($0.25/1M, 1M)

└─ Not sure? → Start with x-ai/grok-code-fast-1 (fast + affordable + reasoning)
```

---

## Performance Benchmarks

### Speed Comparison (Typical Response Times)

| Model | Simple Task | Complex Task | Large Context |
|-------|-------------|--------------|---------------|
| google/gemini-2.0-flash-001 | <2s | 3-4s | 5s |
| google/gemini-2.5-flash-lite | <2s | 3-4s | 5s |
| google/gemini-2.5-flash | <2s | 3-4s | 5s |
| x-ai/grok-code-fast-1 | <2s | 4-5s | 6s |
| minimax/minimax-m2 | <2s | 4-5s | 6s |
| z-ai/glm-4.6 | 3s | 5-6s | 7s |
| qwen/qwen3-vl-235b-a22b-instruct | 3s | 5-6s | 7s |
| openai/gpt-4o-mini | 3s | 5-6s | 7s |
| deepseek/deepseek-chat-v3-0324 | 3s | 5-6s | 7s |
| openai/gpt-5.1-codex | 3-5s | 6-8s | 10s |
| google/gemini-2.5-pro | 4-5s | 8-10s | 12s |

**Notes:**
- Times are approximate and vary based on load
- "Large Context" = >100K tokens
- Reasoning models may be slower for chain-of-thought
- Vision models have additional processing time for images

### Cost Comparison (Per 1M Tokens)

| Model | Input | Output | Average (1:1 ratio) |
|-------|-------|--------|---------------------|
| google/gemini-2.0-flash-001 | $0.10 | $0.40 | $0.25 |
| google/gemini-2.5-flash-lite | $0.10 | $0.40 | $0.25 |
| openai/gpt-4o-mini | $0.15 | $0.60 | $0.38 |
| deepseek/deepseek-chat-v3-0324 | $0.24 | $0.84 | $0.54 |
| qwen/qwen3-vl-235b-a22b-instruct | $0.22 | $0.88 | $0.55 |
| minimax/minimax-m2 | $0.255 | $1.02 | $0.64 |
| x-ai/grok-code-fast-1 | $0.20 | $1.50 | $0.85 |
| z-ai/glm-4.6 | $0.40 | $1.75 | $1.08 |
| google/gemini-2.5-flash | $0.30 | $2.50 | $1.40 |
| google/gemini-2.5-pro | $1.25 | $10.00 | $5.63 |
| openai/gpt-5.1-codex | $1.25 | $10.00 | $5.63 |

**Notes:**
- Prices from OpenRouter (subject to change)
- "Average" assumes equal input/output tokens
- Typical code review is ~70% input, 30% output

### Quality vs Cost Analysis

**Best Value for Code Review:**
1. **google/gemini-2.0-flash-001** - Massive context at ultra-low cost ($0.25/1M)
2. **google/gemini-2.5-flash-lite** - Ultra-low latency + huge context ($0.25/1M)
3. **qwen/qwen3-vl-235b-a22b-instruct** - Budget vision-language ($0.55/1M)
4. **minimax/minimax-m2** - High-efficiency coding ($0.64/1M)

**Best Quality (Cost No Object):**
1. **openai/gpt-5.1-codex** - Specialized software engineering ($5.63/1M)
2. **google/gemini-2.5-pro** - State-of-the-art reasoning ($5.63/1M)
3. **google/gemini-2.5-flash** - Advanced reasoning + massive context ($1.40/1M)

**Best for Massive Context:**
1. **google/gemini-2.5-pro** - 1M tokens at $5.63/1M (premium quality)
2. **google/gemini-2.5-flash** - 1M tokens at $1.40/1M (fast reasoning)
3. **google/gemini-2.0-flash-001** - 1M tokens at $0.25/1M (ultra-budget)
4. **google/gemini-2.5-flash-lite** - 1M tokens at $0.25/1M (ultra-latency)

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
- openai/gpt-5.1-codex (specialized software engineering - $5.63/1M)
- google/gemini-2.5-flash (advanced reasoning + massive context - $1.40/1M)

**Step 3:** Present options to user

AskUserQuestion with these options:

"Select AI models for architecture plan review:

**Recommended (Advanced Reasoning):**
• openai/gpt-5.1-codex - Specialized software engineering ($5.63/1M)
• google/gemini-2.5-flash - Advanced reasoning, 1M context ($1.40/1M)

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
- google/gemini-2.0-flash-001 ($0.25/1M) - Ultra-cheap massive context
- google/gemini-2.5-flash-lite ($0.25/1M) - Ultra-low latency
- deepseek/deepseek-chat-v3-0324 ($0.54/1M) - Budget flagship

**Run 3 parallel reviews:**
1. Claude Sonnet (internal, comprehensive)
2. Gemini 2.0 Flash (external, ultra-cheap)
3. DeepSeek Chat V3 (external, budget flagship)

**Total cost for 100K token review:**
- Claude Sonnet: ~$1.80
- Gemini 2.0 Flash: ~$0.025
- DeepSeek Chat V3: ~$0.054
- **Grand Total: ~$1.88** (vs $9.00 for 3x Sonnet)
```

### Example 3: Vision Task Model Selection

**In UI validation workflow:**

```markdown
## UI Design Validation

**Read recommendations:**
${CLAUDE_PLUGIN_ROOT}/recommended-models.md → "Vision & Multimodal Models"

**Task:** Compare Figma design screenshot to implemented UI

**Recommended model:**
qwen/qwen3-vl-235b-a22b-instruct
- Multimodal vision-language model (235B parameters)
- 262K token context
- Budget-friendly vision ($0.55/1M)
- Strong UI analysis capabilities

**Run with Claudish:**
npx claudish --model qwen/qwen3-vl-235b-a22b-instruct --stdin --quiet < prompt.txt
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
