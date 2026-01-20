---
name: multi-agent-coordination
description: Coordinate multiple agents in parallel or sequential workflows. Use when running agents simultaneously, delegating to sub-agents, switching between specialized agents, or managing agent selection. Trigger keywords - "parallel agents", "sequential workflow", "delegate", "multi-agent", "sub-agent", "agent switching", "task decomposition".
version: 0.1.0
tags: [orchestration, multi-agent, parallel, sequential, delegation, coordination]
keywords: [parallel, sequential, delegate, sub-agent, agent-switching, multi-agent, task-decomposition, coordination]
plugin: orchestration
updated: 2026-01-20
---

# Multi-Agent Coordination

**Version:** 1.0.0
**Purpose:** Patterns for coordinating multiple agents in complex workflows
**Status:** Production Ready

## Overview

Multi-agent coordination is the foundation of sophisticated Claude Code workflows. This skill provides battle-tested patterns for orchestrating multiple specialized agents to accomplish complex tasks that are beyond the capabilities of a single agent.

The key challenge in multi-agent systems is **dependencies**. Some tasks must execute sequentially (one agent's output feeds into another), while others can run in parallel (independent validations from different perspectives). Getting this right is the difference between a 5-minute workflow and a 15-minute one.

This skill teaches you:
- When to run agents in **parallel** vs **sequential**
- How to **select the right agent** for each task
- How to **delegate** to sub-agents without polluting context
- How to manage **context windows** across multiple agent calls

## Core Patterns

### Pattern 1: Sequential vs Parallel Execution

**When to Use Sequential:**

Use sequential execution when there are **dependencies** between agents:
- Agent B needs Agent A's output as input
- Workflow phases must complete in order (plan → implement → test → review)
- Each agent modifies shared state (same files)

**Example: Multi-Phase Implementation**

```
Phase 1: Architecture Planning
  Task: api-architect
    Output: ai-docs/architecture-plan.md
    Wait for completion ✓

Phase 2: Implementation (depends on Phase 1)
  Task: backend-developer
    Input: Read ai-docs/architecture-plan.md
    Output: src/auth.ts, src/routes.ts
    Wait for completion ✓

Phase 3: Testing (depends on Phase 2)
  Task: test-architect
    Input: Read src/auth.ts, src/routes.ts
    Output: tests/auth.test.ts
```

**When to Use Parallel:**

Use parallel execution when agents are **independent**:
- Multiple validation perspectives (designer + tester + reviewer)
- Multiple AI models reviewing same code (Grok + Gemini + Claude)
- Multiple feature implementations in separate files

**Example: Multi-Perspective Validation**

```
Single Message with Multiple Task Calls:

Task: designer
  Prompt: Validate UI against Figma design
  Output: ai-docs/design-review.md
---
Task: ui-manual-tester
  Prompt: Test UI in browser for usability
  Output: ai-docs/testing-report.md
---
Task: senior-code-reviewer
  Prompt: Review code quality and patterns
  Output: ai-docs/code-review.md

All three execute simultaneously (3x speedup!)
Wait for all to complete, then consolidate results.
```

**The 4-Message Pattern for True Parallel Execution:**

This is **CRITICAL** for achieving true parallelism:

```
Message 1: Preparation (Bash Only)
  - Create workspace directories
  - Validate inputs
  - Write context files
  - NO Task calls, NO TodoWrite

Message 2: Parallel Execution (Task Only)
  - Launch ALL agents in SINGLE message
  - ONLY Task tool calls
  - Each Task is independent
  - All execute simultaneously

Message 3: Consolidation (Task Only)
  - Launch consolidation agent
  - Automatically triggered when N agents complete

Message 4: Present Results
  - Show user final consolidated results
  - Include links to detailed reports
```

**Anti-Pattern: Mixing Tool Types Breaks Parallelism**

```
❌ WRONG - Executes Sequentially:
  await TodoWrite({...});  // Tool 1
  await Task({...});       // Tool 2 - waits for TodoWrite
  await Bash({...});       // Tool 3 - waits for Task
  await Task({...});       // Tool 4 - waits for Bash

✅ CORRECT - Executes in Parallel:
  await Task({...});  // Task 1
  await Task({...});  // Task 2
  await Task({...});  // Task 3
  // All execute simultaneously
```

**Why Mixing Fails:**

Claude Code sees different tool types and assumes there are dependencies between them, forcing sequential execution. Using a single tool type (all Task calls) signals that operations are independent and can run in parallel.

---

### Pattern 2: Agent Selection by Task Type

**Task Detection Logic:**

Intelligent workflows automatically detect task type and select appropriate agents:

```
Task Type Detection:

IF request mentions "API", "endpoint", "backend", "database":
  → API-focused workflow
  → Use: api-architect, backend-developer, test-architect
  → Skip: designer, ui-developer (not relevant)

ELSE IF request mentions "UI", "component", "design", "Figma":
  → UI-focused workflow
  → Use: designer, ui-developer, ui-manual-tester
  → Optional: ui-developer-codex (external validation)

ELSE IF request mentions both API and UI:
  → Mixed workflow
  → Use all relevant agents from both categories
  → Coordinate between backend and frontend agents

ELSE IF request mentions "test", "coverage", "bug":
  → Testing-focused workflow
  → Use: test-architect, ui-manual-tester
  → Optional: codebase-detective (for bug investigation)

ELSE IF request mentions "review", "validate", "feedback":
  → Review-focused workflow
  → Use: senior-code-reviewer, designer, ui-developer
  → Optional: external model reviewers
```

**Agent Capability Matrix:**

| Task Type | Primary Agent | Secondary Agent | Optional External |
|-----------|---------------|-----------------|-------------------|
| API Implementation | backend-developer | api-architect | - |
| UI Implementation | ui-developer | designer | ui-developer-codex |
| Testing | test-architect | ui-manual-tester | - |
| Code Review | senior-code-reviewer | - | codex-code-reviewer |
| Architecture Planning | api-architect OR frontend-architect | - | plan-reviewer |
| Bug Investigation | codebase-detective | test-architect | - |
| Design Validation | designer | ui-developer | designer-codex |

**Agent Switching Pattern:**

Some workflows benefit from **adaptive agent selection** based on context:

```
Example: UI Development with External Validation

Base Implementation:
  Task: ui-developer
    Prompt: Implement navbar component from design

User requests external validation:
  → Switch to ui-developer-codex OR add parallel ui-developer-codex
  → Run both: embedded ui-developer + external ui-developer-codex
  → Consolidate feedback from both

Scenario 1: User wants speed
  → Use ONLY ui-developer (embedded, fast)

Scenario 2: User wants highest quality
  → Use BOTH ui-developer AND ui-developer-codex (parallel)
  → Consensus analysis on feedback

Scenario 3: User is out of credits
  → Fallback to ui-developer only
  → Notify user external validation unavailable
```

---

### Pattern 3: Sub-Agent Delegation

**File-Based Instructions (Context Isolation):**

When delegating to sub-agents, use **file-based instructions** to avoid context pollution:

```
✅ CORRECT - File-Based Delegation:

Step 1: Write instructions to file
  Write: ai-docs/architecture-instructions.md
    Content: "Design authentication system with JWT tokens..."

Step 2: Delegate to agent with file reference
  Task: api-architect
    Prompt: "Read instructions from ai-docs/architecture-instructions.md
             and create architecture plan."

Step 3: Agent reads file, does work, writes output
  Agent reads: ai-docs/architecture-instructions.md
  Agent writes: ai-docs/architecture-plan.md

Step 4: Agent returns brief summary ONLY
  Return: "Architecture plan complete. See ai-docs/architecture-plan.md"

Step 5: Orchestrator reads output file if needed
  Read: ai-docs/architecture-plan.md
  (Only if orchestrator needs to process the output)
```

**Why File-Based?**

- **Avoids context pollution:** Long user requirements don't bloat orchestrator context
- **Reusable:** Multiple agents can read same instruction file
- **Debuggable:** Files persist after workflow completes
- **Clean separation:** Input file, output file, orchestrator stays lightweight

**Anti-Pattern: Inline Delegation**

```
❌ WRONG - Context Pollution:

Task: api-architect
  Prompt: "Design authentication system with:
    - JWT tokens with refresh token rotation
    - Email/password login with bcrypt hashing
    - OAuth2 integration with Google, GitHub
    - Rate limiting on login endpoint (5 attempts per 15 min)
    - Password reset flow with time-limited tokens
    - Email verification on signup
    - Role-based access control (admin, user, guest)
    - Session management with Redis
    - Security headers (CORS, CSP, HSTS)
    - ... (500 more lines of requirements)"

Problem: Orchestrator's context now contains 500+ lines of requirements
         that are only relevant to the architect agent.
```

**Brief Summary Returns:**

Sub-agents should return **2-5 sentence summaries**, not full output:

```
✅ CORRECT - Brief Summary:
  "Architecture plan complete. Designed 3-layer authentication:
   JWT with refresh tokens, OAuth2 integration (Google/GitHub),
   and Redis session management. See ai-docs/architecture-plan.md
   for detailed component breakdown."

❌ WRONG - Full Output:
  "Architecture plan:
   [500 lines of detailed architecture documentation]
   Components: AuthController, TokenService, OAuthService...
   [another 500 lines]"
```

**Proxy Mode Invocation:**

For external AI models (Claudish), use the PROXY_MODE directive:

```
Task: codex-code-reviewer PROXY_MODE: x-ai/grok-code-fast-1
  Prompt: "Review authentication implementation for security issues.
           Code context in ai-docs/code-review-context.md"

Agent Behavior:
  1. Detects PROXY_MODE directive
  2. Extracts model: x-ai/grok-code-fast-1
  3. Extracts task: "Review authentication implementation..."
  4. Executes: claudish --model x-ai/grok-code-fast-1 --stdin <<< "..."
  5. Waits for full response (blocking execution)
  6. Writes: ai-docs/grok-review.md (full detailed review)
  7. Returns: "Grok review complete. Found 3 CRITICAL issues. See ai-docs/grok-review.md"
```

**Key: Blocking Execution**

External models MUST execute synchronously (blocking) so the agent waits for the full response:

```
✅ CORRECT - Blocking:
  RESULT=$(claudish --model x-ai/grok-code-fast-1 --stdin <<< "$PROMPT")
  echo "$RESULT" > ai-docs/grok-review.md
  echo "Review complete - see ai-docs/grok-review.md"

❌ WRONG - Background (returns before completion):
  claudish --model x-ai/grok-code-fast-1 --stdin <<< "$PROMPT" &
  echo "Review started..."  # Agent returns immediately, review not done!
```

---

### Pattern 4: Context Window Management

**When to Delegate:**

Delegate to sub-agents when:
- Task is self-contained (clear input → output)
- Output is large (architecture plan, test suite, review report)
- Task requires specialized expertise (designer, tester, reviewer)
- Multiple independent tasks can run in parallel

**When to Execute in Main Context:**

Execute in main orchestrator when:
- Task is small (simple file edit, command execution)
- Output is brief (yes/no decision, status check)
- Task depends on orchestrator state (current phase, iteration count)
- Context pollution risk is low

**Context Size Estimation:**

**Note:** Token estimates below are approximations based on typical usage. Actual context consumption varies by skill complexity, Claude model version, and conversation history. Use these as guidelines, not exact measurements.

Estimate context usage to decide delegation strategy:

```
Context Budget: ~200k tokens (Claude Sonnet 4.5 - actual varies by model)

Current context usage breakdown:
  - System prompt: 10k tokens
  - Skill content (5 skills): 10k tokens
  - Command instructions: 5k tokens
  - User request: 1k tokens
  - Conversation history: 20k tokens
  ───────────────────────────────────
  Total used: 46k tokens
  Remaining: 154k tokens

Safe threshold for delegation: If task will consume >30k tokens, delegate

Example: Architecture planning for large system
  - Requirements: 5k tokens
  - Expected output: 20k tokens
  - Total: 25k tokens
  ───────────────────────────────────
  Decision: Delegate (keeps orchestrator lightweight)
```

**Delegation Strategy by Context Size:**

| Task Output Size | Strategy |
|------------------|----------|
| < 1k tokens | Execute in orchestrator |
| 1k - 10k tokens | Delegate with summary return |
| 10k - 30k tokens | Delegate with file-based output |
| > 30k tokens | Multi-agent decomposition |

**Example: Multi-Agent Decomposition**

```
User Request: "Implement complete e-commerce system"

This is >100k tokens if done by single agent. Decompose:

Phase 1: Break into sub-systems
  - Product catalog
  - Shopping cart
  - Checkout flow
  - User authentication
  - Order management
  - Payment integration

Phase 2: Delegate each sub-system to separate agent
  Task: backend-developer
    Instruction file: ai-docs/product-catalog-requirements.md
    Output file: ai-docs/product-catalog-implementation.md

  Task: backend-developer
    Instruction file: ai-docs/shopping-cart-requirements.md
    Output file: ai-docs/shopping-cart-implementation.md

  ... (6 parallel agent invocations)

Phase 3: Integration agent
  Task: backend-developer
    Instruction: "Integrate 6 sub-systems. Read output files:
                  ai-docs/*-implementation.md"
    Output: ai-docs/integration-plan.md

Total context per agent: ~20k tokens (manageable)
vs. Single agent: 120k+ tokens (context overflow risk)
```

---

## Integration with Other Skills

**multi-agent-coordination + multi-model-validation:**

```
Use Case: Code review with multiple AI models

Step 1: Agent Selection (multi-agent-coordination)
  - Detect task type: Code review
  - Select agents: senior-code-reviewer (embedded) + external models

Step 2: Parallel Execution (multi-model-validation)
  - Follow 4-Message Pattern
  - Launch all reviewers simultaneously
  - Wait for all to complete

Step 3: Consolidation (multi-model-validation)
  - Auto-consolidate reviews
  - Apply consensus analysis
```

**multi-agent-coordination + quality-gates:**

```
Use Case: Iterative UI validation

Step 1: Agent Selection (multi-agent-coordination)
  - Detect task type: UI validation
  - Select agents: designer, ui-developer

Step 2: Iteration Loop (quality-gates)
  - Run designer validation
  - If not PASS: delegate to ui-developer for fixes
  - Loop until PASS or max iterations

Step 3: User Validation Gate (quality-gates)
  - MANDATORY user approval
  - Collect feedback if issues found
```

**multi-agent-coordination + todowrite-orchestration:**

```
Use Case: Multi-phase implementation workflow

Step 1: Initialize TodoWrite (todowrite-orchestration)
  - Create task list for all phases

Step 2: Sequential Agent Delegation (multi-agent-coordination)
  - Phase 1: api-architect
  - Phase 2: backend-developer (depends on Phase 1)
  - Phase 3: test-architect (depends on Phase 2)
  - Update TodoWrite after each phase
```

---

## Best Practices

**Do:**
- ✅ Use parallel execution for independent tasks (3-5x speedup)
- ✅ Use sequential execution when there are dependencies
- ✅ Use file-based instructions to avoid context pollution
- ✅ Return brief summaries (2-5 sentences) from sub-agents
- ✅ Select agents based on task type (API/UI/Testing/Review)
- ✅ Decompose large tasks into multiple sub-agent calls
- ✅ Estimate context usage before delegating

**Don't:**
- ❌ Mix tool types in parallel execution (breaks parallelism)
- ❌ Inline long instructions in Task prompts (context pollution)
- ❌ Return full output from sub-agents (use files instead)
- ❌ Use parallel execution for dependent tasks (wrong results)
- ❌ Use single agent for >100k token tasks (context overflow)
- ❌ Forget to wait for all parallel tasks before consolidating

**Performance Tips:**
- Parallel execution: 3-5x faster than sequential (5min vs 15min)
- File-based delegation: Saves 50-80% context usage
- Agent switching: Adapt to user preferences (speed vs quality)
- Context decomposition: Enables tasks that would otherwise overflow

---

## Examples

### Example 1: Parallel Multi-Model Code Review

**Scenario:** User requests "Review my authentication code with Grok and Gemini"

**Agent Selection:**
- Task type: Code review
- Agents: senior-code-reviewer (embedded), external Grok, external Gemini

**Execution:**

```
Message 1: Preparation
  - Write code context to ai-docs/code-review-context.md

Message 2: Parallel Execution (3 Task calls in single message)
  Task: senior-code-reviewer
    Prompt: "Review ai-docs/code-review-context.md for security issues"
  ---
  Task: codex-code-reviewer PROXY_MODE: x-ai/grok-code-fast-1
    Prompt: "Review ai-docs/code-review-context.md for security issues"
  ---
  Task: codex-code-reviewer PROXY_MODE: google/gemini-2.5-flash
    Prompt: "Review ai-docs/code-review-context.md for security issues"

  All 3 execute simultaneously (3x faster than sequential)

Message 3: Auto-Consolidation
  Task: senior-code-reviewer
    Prompt: "Consolidate 3 reviews from:
             - ai-docs/claude-review.md
             - ai-docs/grok-review.md
             - ai-docs/gemini-review.md
             Prioritize by consensus."

Message 4: Present Results
  "Review complete. 3 models analyzed your code.
   Top 5 issues by consensus:
   1. [UNANIMOUS] Missing input validation on login endpoint
   2. [STRONG] SQL injection risk in user query
   3. [MAJORITY] Weak password requirements
   See ai-docs/consolidated-review.md for details."
```

**Result:** 5 minutes total (vs 15+ if sequential), consensus-based prioritization

---

### Example 2: Sequential Multi-Phase Implementation

**Scenario:** User requests "Implement payment integration feature"

**Agent Selection:**
- Task type: API implementation
- Agents: api-architect → backend-developer → test-architect → senior-code-reviewer

**Execution:**

```
Phase 1: Architecture Planning
  Write: ai-docs/payment-requirements.md
    "Integrate Stripe payment processing with webhook support..."

  Task: api-architect
    Prompt: "Read ai-docs/payment-requirements.md
             Create architecture plan"
    Output: ai-docs/payment-architecture.md
    Return: "Architecture plan complete. Designed 3-layer payment system."

  Wait for completion ✓

Phase 2: Implementation (depends on Phase 1)
  Task: backend-developer
    Prompt: "Read ai-docs/payment-architecture.md
             Implement payment integration"
    Output: src/payment.ts, src/webhooks.ts
    Return: "Payment integration implemented. 2 new files, 500 lines."

  Wait for completion ✓

Phase 3: Testing (depends on Phase 2)
  Task: test-architect
    Prompt: "Write tests for src/payment.ts and src/webhooks.ts"
    Output: tests/payment.test.ts, tests/webhooks.test.ts
    Return: "Test suite complete. 20 tests covering payment flows."

  Wait for completion ✓

Phase 4: Code Review (depends on Phase 3)
  Task: senior-code-reviewer
    Prompt: "Review payment integration implementation"
    Output: ai-docs/payment-review.md
    Return: "Review complete. 2 MEDIUM issues found."

  Wait for completion ✓
```

**Result:** Sequential execution ensures each phase has correct inputs

---

### Example 3: Adaptive Agent Switching

**Scenario:** User requests "Validate navbar implementation" with optional external AI

**Agent Selection:**
- Task type: UI validation
- Base agent: designer
- Optional: designer-codex (if user wants external validation)

**Execution:**

```
Step 1: Ask user preference
  "Do you want external AI validation? (Yes/No)"

Step 2a: If user says NO (speed mode)
  Task: designer
    Prompt: "Validate navbar against Figma design"
    Output: ai-docs/design-review.md
    Return: "Design validation complete. PASS with 2 minor suggestions."

Step 2b: If user says YES (quality mode)
  Message 1: Parallel Validation
    Task: designer
      Prompt: "Validate navbar against Figma design"
    ---
    Task: designer PROXY_MODE: design-review-codex
      Prompt: "Validate navbar against Figma design"

  Message 2: Consolidate
    Task: designer
      Prompt: "Consolidate 2 design reviews. Prioritize by consensus."
      Output: ai-docs/design-review-consolidated.md
      Return: "Consolidated review complete. Both agree on 1 CRITICAL issue."

Step 3: User validation
  Present consolidated review to user for approval
```

**Result:** Adaptive workflow based on user preference (speed vs quality)

---

## Troubleshooting

**Problem: Parallel tasks executing sequentially**

Cause: Mixed tool types in same message

Solution: Use 4-Message Pattern with ONLY Task calls in Message 2

```
❌ Wrong:
  await TodoWrite({...});
  await Task({...});
  await Task({...});

✅ Correct:
  Message 1: await Bash({...});  (prep only)
  Message 2: await Task({...}); await Task({...}); (parallel)
```

---

**Problem: Orchestrator context overflowing**

Cause: Inline instructions or full output returns

Solution: Use file-based delegation + brief summaries

```
❌ Wrong:
  Task: agent
    Prompt: "[1000 lines of inline requirements]"
  Return: "[500 lines of full output]"

✅ Correct:
  Write: ai-docs/requirements.md
  Task: agent
    Prompt: "Read ai-docs/requirements.md"
  Return: "Complete. See ai-docs/output.md"
```

---

**Problem: Wrong agent selected for task**

Cause: Task type detection failed

Solution: Explicitly detect task type using keywords

```
Check user request for keywords:
  - API/endpoint/backend → api-architect, backend-developer
  - UI/component/design → designer, ui-developer
  - test/coverage → test-architect
  - review/validate → senior-code-reviewer

Default: Ask user to clarify task type
```

---

**Problem: Agent returns immediately before external model completes**

Cause: Background execution (non-blocking claudish call)

Solution: Use synchronous (blocking) execution

```
❌ Wrong:
  claudish --model grok ... &  (background, returns immediately)

✅ Correct:
  RESULT=$(claudish --model grok ...)  (blocks until complete)
```

---

## Summary

Multi-agent coordination is about choosing the right execution strategy:

- **Parallel** when tasks are independent (3-5x speedup)
- **Sequential** when tasks have dependencies (correct results)
- **File-based delegation** to avoid context pollution (50-80% savings)
- **Brief summaries** from sub-agents (clean orchestrator context)
- **Task type detection** for intelligent agent selection
- **Context decomposition** for large tasks (avoid overflow)

Master these patterns and you can orchestrate workflows of any complexity.

---

**Extracted From:**
- `/implement` command (task detection, sequential workflows)
- `/validate-ui` command (adaptive agent switching)
- `/review` command (parallel execution, 4-Message Pattern)
- `CLAUDE.md` Parallel Multi-Model Execution Protocol
