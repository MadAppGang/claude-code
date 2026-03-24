---
name: multi-agent-coordination
description: "Orchestrates multiple specialized agents in parallel or sequential workflows using Task tool delegation. Decomposes complex tasks, manages agent selection, aggregates results, and handles inter-agent dependencies. Use when running agents simultaneously, delegating to sub-agents, coordinating multi-step workflows, or decomposing tasks across specialists."
---

# Multi-Agent Coordination

Patterns for orchestrating multiple specialized agents in parallel and sequential workflows via the Task tool.

## Workflow

1. **Decompose the task** into subtasks, identifying dependencies between them.
2. **Select agents** for each subtask based on role specialization.
3. **Determine execution order** — sequential for dependencies, parallel for independent work.
4. **Delegate via Task tool** with file-based context passing (not inline prompts).
5. **Aggregate results** from all agents into a unified output.

## Sequential vs Parallel

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Sequential | Agent B needs Agent A's output | Plan → implement → test → review |
| Parallel | Agents are independent | 3 reviewers validating same code simultaneously |
| Fan-out/fan-in | Independent work then merge | Parallel reviews → consolidated verdict |

## Example: Sequential Pipeline

```
Phase 1: api-architect → outputs architecture-plan.md
Phase 2: backend-developer → reads plan, outputs src/auth.ts (depends on Phase 1)
Phase 3: test-architect → reads src/auth.ts, outputs tests/ (depends on Phase 2)
```

## Example: Parallel Validation

```typescript
// Launch 3 reviewers in parallel via Task tool
Task({ agent: "senior-code-reviewer", description: "Review auth implementation" })
Task({ agent: "test-architect", description: "Review test coverage" })
Task({ agent: "security-reviewer", description: "Audit auth security" })
// Aggregate: collect all 3 results, consolidate findings
```

**Verification:** Confirm all parallel tasks completed before aggregating results.

## Agent Selection Guide

| Task Type | Recommended Agent | Reasoning |
|-----------|-------------------|-----------|
| Architecture design | api-architect / frontend-architect | System-level decisions |
| Feature implementation | backend-developer / typescript-frontend-dev | Code writing |
| Testing | test-architect | Coverage analysis |
| Code review | senior-code-reviewer | Quality validation |
| UI work | ui-developer / designer | Visual implementation |
| Debugging | debugger agent | Root cause analysis |

## Context Passing

- **File-based:** Agent A writes to `ai-docs/plan.md`, Agent B reads it. Best for large outputs.
- **Prompt-based:** Pass key findings inline in the Task description. Best for small context.
- **Never share full context windows** between agents — extract only what the next agent needs.

## Notes

- Keep agent context windows clean — delegate to sub-agents instead of doing everything inline
- Use session-isolation for file artifacts to prevent collisions across concurrent workflows
- Set explicit timeouts and use error-recovery patterns for external model agents
- Fan-out/fan-in is the most common pattern: split work, run in parallel, merge results
