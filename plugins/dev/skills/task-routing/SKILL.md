---
name: task-routing
description: Use BEFORE delegating any complex task to a subagent. Contains the routing table that maps task patterns to the correct specialized agent. MUST be consulted before using the Task tool for delegation decisions. Trigger keywords - "delegate", "subagent", "agent", "research", "implement", "investigate", "debug", "architect".
version: 0.1.0
tags: [dev, routing, delegation, agents, task]
keywords: [delegate, subagent, agent, routing, task, research, implement, investigate, debug, architect]
plugin: dev
updated: 2026-02-09
---

# Task Routing - Agent Delegation

IMPORTANT: For complex tasks, prefer delegating to specialized agents via the Task tool rather than handling inline. Delegated agents run in dedicated context windows with sustained focus, producing higher quality results.

## Routing Table

| Task Pattern | Delegate To | Trigger |
|---|---|---|
| Research: web search, tech comparison, multi-source reports | `dev:researcher` | 3+ sources or comparison needed |
| Implementation: creating code, new modules, features, building with tests | `dev:developer` | Writing new code, adding features, creating modules - even if they relate to existing codebase |
| Investigation: READ-ONLY codebase analysis, tracing, understanding | `code-analysis:detective` | Only when task is to UNDERSTAND code, not to WRITE new code |
| Debugging: error analysis, root cause investigation | `dev:debugger` | Non-obvious bugs or multi-file root cause |
| Architecture: system design, trade-off analysis | `dev:architect` | New systems or major refactors |
| Agent/plugin quality review | `agentdev:reviewer` | Agent description or plugin assessment |

## Key Distinction

If the task asks to IMPLEMENT/CREATE/BUILD → `dev:developer`. If the task asks to UNDERSTAND/ANALYZE/TRACE → `code-analysis:detective`.

## When to Use This Skill

Consult this routing table BEFORE making any delegation decision. If the user's task matches any row in the table above, delegate to the specified agent rather than handling the task inline.
