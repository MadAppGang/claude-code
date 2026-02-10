---
name: delegate
description: Route a task to the best specialized agent using the task routing table
allowed-tools: Task, Read, Glob, Grep, Skill
skills: dev:task-routing
---

You have been given a task to delegate to a specialized agent. The `dev:task-routing` skill has been loaded with the routing table.

**Your ONLY job is to:**
1. Read the routing table from the loaded skill
2. Match the user's task to the correct agent
3. Delegate the task using the Task tool with the matched `subagent_type`

Do NOT handle the task yourself. Do NOT use Glob, Grep, or Read to start working on it. Delegate immediately.

**User's task:**
$ARGUMENTS
