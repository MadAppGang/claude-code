---
name: agent-coordination-discipline
description: "Use when deciding whether to launch an agent, selecting which agent to use, or coordinating multiple agents. Covers delegation criteria, PROXY_MODE patterns, task isolation, and agent selection strategies."
keywords: [agent-coordination, PROXY_MODE, task-isolation, delegation-criteria, multi-agent, external-model, claudish, orchestration, agent-selection, Task-tool, developer-agent, architect-agent, grok-code-fast, sonnet-4-5, thinking-budget]
created: 2026-01-20
updated: 2026-01-20
plugin: dev
type: discipline
difficulty: intermediate
---

# Agent Coordination Discipline

**Iron Law:** "NO AGENT LAUNCH WITHOUT CLEAR DELEGATION CRITERIA"

## When to Use

Use this skill when:
- Considering launching an agent with the Task tool
- Evaluating whether a task requires agent delegation
- Selecting between different agent types or external models
- Coordinating multiple agents in a workflow
- Implementing PROXY_MODE for external model delegation
- Debugging agent coordination failures

This skill prevents premature agent launches, redundant agent usage, and poor task isolation that wastes thinking budget and causes coordination failures.

## Red Flags (Violation Indicators)

- [ ] **Agent for single grep** - Launching agent to run one grep/glob command (trivial-task anti-pattern)
- [ ] **Missing PROXY_MODE model** - Using PROXY_MODE without explicit model name specification
- [ ] **No task isolation** - Agent task description lacks independent context or success criteria
- [ ] **No success criteria** - Task description doesn't define what "done" looks like
- [ ] **Default thinking pattern** - Not considering whether task needs deep thinking vs. fast execution
- [ ] **Multiple agents without coordination** - Launching 2+ agents without clear result routing plan
- [ ] **Result not used** - Launching agent but not routing/validating its output
- [ ] **Agent for trivial decision** - Using agent to make decision you could make directly
- [ ] **No tool exhaustion check** - Launching agent before trying native tools first
- [ ] **Missing timeout consideration** - Not evaluating if task needs extended thinking time
- [ ] **No error handling plan** - Not defining what happens if agent fails or returns partial results
- [ ] **Skill gap unclear** - Not identifying what specific expertise the agent provides

## Key Concepts

### 1. Agent vs. Native Tools Decision Tree

```
Does the task require:
├─ Single tool call (grep, read, edit)?
│  └─ ✗ NO AGENT - Use native tool directly
├─ 2-3 sequential tool calls?
│  └─ ✗ NO AGENT - Use tools directly in sequence
├─ Multi-step investigation with branching logic?
│  └─ ✓ AGENT - Task tool with developer/architect agent
├─ External model expertise (Grok, DeepSeek, etc.)?
│  └─ ✓ AGENT - PROXY_MODE pattern with model specification
├─ Parallel exploration of multiple code paths?
│  └─ ✓ AGENT - Multiple Task calls with coordination
└─ High-risk change needing isolation?
   └─ ✓ AGENT - Task tool with sandbox/review focus
```

### 2. Task Isolation Requirements

Every agent task must be independently executable:

**Bad (not isolated):**
```
Task: "Fix the bug we discussed earlier"
```

**Good (properly isolated):**
```
Task: "Debug the TypeError in src/components/UserProfile.tsx line 42.
Context: User reports 'Cannot read property name of undefined' when viewing profile page.
Evidence: Error occurs after recent commit abc123 that changed user data structure.
Success criteria: Identify root cause, propose fix, verify with test scenario."
```

### 3. PROXY_MODE Pattern

When delegating to external models via claudish:

**Structure:**
```
PROXY_MODE: {model_id}

{Task Description}

Context:
- {Relevant file paths}
- {Current state}
- {Related decisions}

Success Criteria:
- {What constitutes success}
- {Expected output format}

Constraints:
- {Time limits}
- {Tool restrictions}
- {Quality requirements}
```

**Example:**
```
PROXY_MODE: x-ai/grok-code-fast-1

Analyze the React component rendering performance issue in Dashboard.tsx.

Context:
- File: src/components/Dashboard.tsx (247 lines)
- Issue: Component re-renders 40+ times on data updates
- Recent changes: Added real-time WebSocket updates in commit f4a2c1b

Success Criteria:
- Identify unnecessary re-renders (provide line numbers)
- Propose memoization strategy
- Estimate performance improvement

Constraints:
- Max 3 minutes analysis time
- Focus on React 19 compiler-friendly patterns
```

## When to Use Agents

### Multi-Step Investigation
**Trigger:** Task requires 5+ tool calls with conditional branching
**Agent:** developer, architect
**Example:** "Trace data flow through 3 layers to find where user.email becomes null"

### External Model Expertise
**Trigger:** Need specialized model capabilities (code speed, vision, reasoning)
**Agent:** PROXY_MODE with specific model
**Example:** "Use Grok Code Fast to refactor 15 files for consistency in < 2 minutes"

### Parallel Work
**Trigger:** Multiple independent tasks that can run simultaneously
**Agent:** Multiple Task calls with result aggregation
**Example:** "Analyze frontend performance (Task 1) while auditing API security (Task 2)"

### Risk Isolation
**Trigger:** High-risk changes needing review before merging to main workflow
**Agent:** review-focused agent with checkpoint
**Example:** "Evaluate if this database migration will cause downtime"

### Skill Gaps
**Trigger:** Current agent lacks specific skill that another agent has
**Agent:** specialist agent (security, performance, accessibility)
**Example:** "Launch accessibility agent to audit ARIA compliance"

## When NOT to Use Agents

### Single Grep/Glob
**Instead:** Use native Grep or Glob tool directly
```
# ✗ DON'T
Task: "Find all files using the deprecated API"

# ✓ DO
Grep("oldApiCall", output_mode: "files_with_matches", type: "js")
```

### Simple Tool Execution
**Instead:** Use tool directly
```
# ✗ DON'T
Task: "Read the config file and tell me the API URL"

# ✓ DO
Read("/path/to/config.json")
// Parse and extract apiUrl field
```

### Decision Already Made
**Instead:** Execute the decision
```
# ✗ DON'T
Task: "I think we should use React Query. What do you think?"

# ✓ DO
// Just implement React Query since decision is made
Write("src/hooks/useApiQuery.ts", reactQueryCode)
```

### Sequential Tool Calls
**Instead:** Chain tools directly
```
# ✗ DON'T
Task: "Find the function, read it, and edit it"

# ✓ DO
Grep("functionName", output_mode: "files_with_matches")
// => result: src/utils/helper.ts
Read("src/utils/helper.ts")
Edit("src/utils/helper.ts", old_string, new_string)
```

### Nuanced Context Required
**Instead:** Handle in current agent
```
# ✗ DON'T
Task: "Based on our earlier discussion about performance vs. maintainability trade-offs, decide if we should cache this"

# ✓ DO
// Current agent already has context, make decision directly
if (performanceIsCritical) {
  implementCaching()
}
```

## Agent Selection Matrix

| Task Type | Best Agent | Model | Reasoning |
|-----------|------------|-------|-----------|
| **Debugging errors** | developer | sonnet-4-5 | Deep reasoning, context retention |
| **Design review** | architect | sonnet-4-5 | System thinking, trade-off evaluation |
| **Code generation** | developer | grok-code-fast | Speed for repetitive patterns |
| **Multi-codebase analysis** | developer | sonnet-4-5 | Cross-repo understanding |
| **Performance profiling** | developer + PROXY_MODE | grok-code-fast | Fast scanning + specific optimization |
| **Security audit** | security (if available) | sonnet-4-5 | Nuanced threat modeling |
| **Documentation generation** | developer | grok-code-fast | Fast, straightforward task |
| **Refactoring (large scope)** | developer | sonnet-4-5 | Maintain consistency across changes |

## PROXY_MODE Pattern Details

### 1. Model Selection

**Fast Execution (< 2 min):**
- `x-ai/grok-code-fast-1` - Code generation, refactoring, simple analysis
- `anthropic/claude-3-5-haiku` - Quick decisions, data transformation

**Deep Reasoning (> 2 min):**
- `anthropic/claude-sonnet-4-5` - Complex debugging, architecture design
- `google/gemini-2.0-flash-thinking-exp-01-21` - Extended thinking budget

**Specialized:**
- Vision models - Screenshot analysis, diagram interpretation
- Code models - Language-specific optimization

### 2. Context Packaging

**Minimal (< 1000 tokens):**
- File paths only
- Error message
- Success criteria

**Moderate (1000-5000 tokens):**
- Key code snippets (< 50 lines)
- Related file structure
- Recent commit context

**Full (5000+ tokens):**
- Complete file contents
- Related test files
- Architecture documentation

### 3. Success Criteria Definition

**Must include:**
- **Output format** - JSON, markdown, code snippet, report
- **Completeness** - What must be covered
- **Quality bar** - Minimum acceptable quality
- **Constraints** - Time, token, tool limits

**Example:**
```
Success Criteria:
- Output: JSON array of {file, line, issue, suggestion}
- Completeness: All React components in src/ analyzed
- Quality: Each suggestion must include before/after code
- Constraints: Complete within 5 minutes, use only Read/Grep tools
```

### 4. Result Routing

**Pattern:**
```
1. Launch agent with PROXY_MODE
2. Capture result in variable or file
3. Validate result against success criteria
4. Route to next step:
   - If success: Use result in main workflow
   - If partial: Request clarification
   - If failure: Fall back to native tools
```

**Example:**
```
result = Task("PROXY_MODE: x-ai/grok-code-fast-1\n\nRefactor 10 components for React 19...")

if (result.contains("Refactored successfully")) {
  // Apply changes to codebase
  applyRefactorings(result.changes)
} else {
  // Fall back to manual refactoring
  manualRefactor()
}
```

## Task Isolation Checklist

Before launching an agent, verify:

- [ ] **Independent understanding** - Task description is self-contained (no "as discussed", "the bug we saw")
- [ ] **Success criteria defined** - Clear definition of what "done" looks like
- [ ] **Dependencies listed** - All required files, services, credentials specified
- [ ] **Result format specified** - Expected output structure (JSON, markdown, code, report)
- [ ] **Error handling clear** - What happens if agent fails or returns partial results
- [ ] **Timeout reasonable** - Time limit matches task complexity
- [ ] **Tool attempts exhausted** - Tried native tools first, agent is not premature
- [ ] **Model selection justified** - Chosen model matches task requirements (speed vs. reasoning)

## Examples

### Example 1: Bad Agent Usage (Python)

```python
# ✗ VIOLATION: Agent for single grep
Task: "Find all files importing the old database client"

# ✓ CORRECT: Use native tool
Grep("from old_db_client import", type: "py", output_mode: "files_with_matches")
```

### Example 2: Good Agent Usage (TypeScript)

```typescript
// ✓ CORRECT: Multi-step investigation with agent
Task: "Debug the race condition in WebSocket message handling.

Context:
- File: src/services/websocket.ts (342 lines)
- Issue: Messages arrive out of order 5% of the time
- Environment: Production only (not reproducible in dev)
- Recent changes: Added message batching in commit a3f9c21

Success Criteria:
- Identify race condition root cause (provide line numbers)
- Propose synchronization strategy
- Verify solution handles edge cases

Constraints:
- Max 10 minutes analysis
- Use Read, Grep, and Bash tools only
- No code changes (diagnosis only)"
```

### Example 3: PROXY_MODE with External Model (Go)

```go
// ✓ CORRECT: Fast refactoring with Grok
PROXY_MODE: x-ai/grok-code-fast-1

Refactor 15 handler functions in handlers/ to use consistent error handling pattern.

Context:
- Directory: internal/handlers/ (15 files, ~200 lines each)
- Current state: Inconsistent error responses (some use Error(), some use Errorf(), some return raw errors)
- Target pattern: Use custom AppError type with status codes and messages

Success Criteria:
- All 15 handlers use AppError consistently
- Preserve existing business logic (only change error handling)
- Provide git diff summary

Constraints:
- Complete within 3 minutes
- Use Read and Grep tools for analysis
- Return refactored code for all 15 files
```

## Integration with Other Skills

**Works with:**
- **verification-before-completion** - Validate agent results before marking tasks complete
- **systematic-debugging** - Use agents for multi-step debugging investigations
- **orchestration skills** - Multi-agent coordination patterns from orchestration plugin

**Prevents:**
- **Premature agent launches** - Check delegation criteria first
- **Agent thrashing** - Avoid launching agents that just launch more agents
- **Budget waste** - Don't use slow models for fast tasks or vice versa

## Anti-Patterns Table

| Anti-Pattern | ✗ Without Discipline | ✓ With Discipline |
|--------------|---------------------|-------------------|
| **Trivial task delegation** | Launch agent to run single grep | Use Grep tool directly |
| **Missing isolation** | "Fix the bug we discussed" | "Debug TypeError in UserProfile.tsx line 42: 'Cannot read property name of undefined'. Context: ..." |
| **No success criteria** | "Analyze the performance issue" | "Identify re-render causes (line numbers), propose memoization, estimate improvement %" |
| **Wrong model selection** | Use sonnet-4-5 for simple refactoring | Use grok-code-fast for speed |
| **No result validation** | Launch agent, assume success | Check result against success criteria, have fallback plan |
| **Coordination failure** | Launch 3 agents, hope they coordinate | Define result routing: Agent 1 → validate → Agent 2 → aggregate |

## Enforcement Mechanism

**Detection:**
1. Before Task tool call, check if task description includes success criteria
2. Before PROXY_MODE, verify model name is explicitly specified
3. Before agent launch, confirm native tools were attempted first
4. After agent completes, verify result is validated before use

**Correction:**
1. If missing success criteria → Add "Success Criteria:" section to task description
2. If trivial task → Cancel agent launch, use native tool
3. If wrong model → Reconsider model selection based on task requirements
4. If result unused → Add validation and routing logic

**Validation:**
```
Agent Task Checklist (all must be true):
✓ Task requires 5+ tool calls OR external model expertise
✓ Success criteria defined (output format, completeness, quality bar)
✓ Context is self-contained (no references to earlier discussion)
✓ Model selection justified (speed vs. reasoning trade-off considered)
✓ Result routing planned (validation + next steps)
✓ Error handling defined (fallback if agent fails)
✓ Native tools attempted first (or explicitly not applicable)
```

---

**Related Skills:**
- `verification-before-completion` - Validate agent results
- `systematic-debugging` - Multi-step debugging investigations
- `orchestration/multi-agent-orchestration` - Complex coordination patterns

**Version:** 1.0.0
**Last Updated:** 2026-01-20
