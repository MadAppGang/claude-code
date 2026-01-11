---
name: code-search-selector
description: "💡 Tool selector for code search tasks. Helps choose between semantic search (claudemem) and native tools (Grep/Glob) based on query type. Semantic search recommended for: 'how does X work', 'find all', 'audit', 'investigate', 'architecture'."
allowed-tools: Bash, Read, AskUserQuestion
---

# Code Search Tool Selector

This skill helps choose the most effective search tool for your task.

## When Semantic Search Works Better

Claudemem provides better results for conceptual queries:

| Query Type | Example | Recommended Tool |
|------------|---------|------------------|
| "How does X work?" | "How does authentication work?" | `claudemem search` |
| Find implementations | "Find all API endpoints" | `claudemem search` |
| Architecture questions | "Map the service layer" | `claudemem --agent map` |
| Trace data flow | "How does user data flow?" | `claudemem search` |
| Audit integrations | "Audit Prime API usage" | `claudemem search` |

## When Native Tools Work Better

| Query Type | Example | Recommended Tool |
|------------|---------|------------------|
| Exact string match | "Find 'DEPRECATED_FLAG'" | `Grep` |
| Count occurrences | "How many TODO comments?" | `Grep -c` |
| Specific symbol | "Find class UserService" | `Grep` |
| File patterns | "Find all *.config.ts" | `Glob` |

## Why Semantic Search is Often More Efficient

**Token Efficiency**: Reading 5 files costs ~5000 tokens; claudemem search costs ~500 tokens with ranked results.

**Context Discovery**: Claudemem finds related code you didn't know to ask for.

**Ranking**: Results sorted by relevance and PageRank, so important code comes first.

## Example: Semantic Query

**User asks:** "How does authentication work?"

**Less effective approach:**
```bash
grep -r "auth" src/
# Result: 500 lines of noise, hard to understand
```

**More effective approach:**
```bash
claudemem status  # Check if indexed
claudemem search "authentication login flow JWT"
# Result: Top 10 semantically relevant code chunks, ranked
```

## Quick Decision Guide

### Classify the Task

| User Request | Category | Recommended Tool |
|--------------|----------|------------------|
| "Find all X", "How does X work" | Semantic | claudemem search |
| "Audit X integration", "Map data flow" | Semantic | claudemem search |
| "Understand architecture", "Trace X" | Semantic | claudemem map |
| "Find exact string 'foo'" | Exact Match | Grep |
| "Count occurrences of X" | Exact Match | Grep |
| "Find symbol UserService" | Exact Match | Grep |

### Step 2: Check claudemem Status (MANDATORY for Semantic)

```bash
# ALWAYS run this before semantic search
claudemem status
```

**Interpret the output:**

| Status | What It Means | Next Action |
|--------|---------------|-------------|
| Shows chunk count (e.g., "938 chunks") | ✅ Indexed | **USE CLAUDEMEM** (Step 3) |
| "No index found" | ❌ Not indexed | Offer to index (Step 2b) |
| "command not found" | ❌ Not installed | Fall back to Detective agent |

### Step 2b: If Not Indexed, Offer to Index

```typescript
AskUserQuestion({
  questions: [{
    question: "Claudemem is not indexed. Index now for better semantic search results?",
    header: "Index?",
    multiSelect: false,
    options: [
      { label: "Yes, index now (Recommended)", description: "Takes 1-2 minutes, enables semantic search" },
      { label: "No, use grep instead", description: "Faster but less accurate for semantic queries" }
    ]
  }]
})
```

If user says yes:
```bash
claudemem index -y
```

### Step 3: Execute the Search

**IF CLAUDEMEM IS INDEXED (from Step 2):**

```bash
# Get role-specific guidance first
claudemem ai developer  # or architect, tester, debugger

# Then search semantically
claudemem search "authentication login JWT token validation" -n 15
```

**IF CLAUDEMEM IS NOT AVAILABLE:**

Use the detective agent:
```typescript
Task({
  subagent_type: "code-analysis:detective",
  description: "Investigate [topic]",
  prompt: "Use semantic search to find..."
})
```

### Tool Recommendations by Use Case

| Use Case | Less Efficient | More Efficient |
|----------|----------------|----------------|
| Semantic queries | `grep -r "pattern" src/` | `claudemem search "concept"` |
| Find implementations | `Glob → Read all` | `claudemem search "feature"` |
| Understand flow | `find . -name "*.ts" \| xargs...` | `claudemem --agent map` |

Native tools (Grep, Glob, find) work well for exact matches but provide no semantic ranking.

---

## When Hooks Redirect to Claudemem

If a hook provides claudemem results instead of native tool output:

1. **Use the provided results** - They're ranked by relevance
2. **For more data** - Run additional claudemem queries
3. **Bypass available** - Use `_bypass_claudemem: true` for native tools when needed

The hook system provides claudemem results proactively when the index is available.

---

## Task-to-Tool Mapping Reference

| User Request | Native Approach | Semantic Approach (Recommended) |
|--------------|-----------------|--------------------------------|
| "Audit all API endpoints" | `grep -r "router\|endpoint"` | `claudemem search "API endpoint route handler"` |
| "How does auth work?" | `grep -r "auth\|login"` | `claudemem search "authentication login flow"` |
| "Find all database queries" | `grep -r "prisma\|query"` | `claudemem search "database query SQL prisma"` |
| "Map the data flow" | `grep -r "transform\|map"` | `claudemem search "data transformation pipeline"` |
| "What's the architecture?" | `ls -la src/` | `claudemem --agent map "architecture"` |
| "Find error handling" | `grep -r "catch\|error"` | `claudemem search "error handling exception"` |
| "Trace user creation" | `grep -r "createUser"` | `claudemem search "user creation registration"` |

## When Grep IS Appropriate

✅ **Use Grep for:**
- Finding exact string: `grep -r "DEPRECATED_FLAG" src/`
- Counting occurrences: `grep -c "import React" src/**/*.tsx`
- Finding specific symbol: `grep -r "class UserService" src/`
- Regex patterns: `grep -r "TODO:\|FIXME:" src/`

❌ **Never use Grep for:**
- Understanding how something works
- Finding implementations by concept
- Architecture analysis
- Tracing data flow
- Auditing integrations

## Integration with Detective Skills

After using this skill's decision tree, invoke the appropriate detective:

| Investigation Type | Detective Skill |
|-------------------|-----------------|
| Architecture patterns | `code-analysis:architect-detective` |
| Implementation details | `code-analysis:developer-detective` |
| Test coverage | `code-analysis:tester-detective` |
| Bug root cause | `code-analysis:debugger-detective` |
| Comprehensive audit | `code-analysis:ultrathink-detective` |

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODE SEARCH QUICK REFERENCE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ALWAYS check first:  claudemem status                       │
│                                                                  │
│  2. If indexed:          claudemem search "semantic query"       │
│                                                                  │
│  3. For exact matches:   Grep tool (only this case!)            │
│                                                                  │
│  4. For deep analysis:   Task(code-analysis:detective)          │
│                                                                  │
│  ⚠️ GREP IS FOR EXACT MATCHES, NOT SEMANTIC UNDERSTANDING       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Pre-Investigation Checklist

Before ANY code investigation task, verify:

- [ ] Ran `claudemem status` to check index
- [ ] Classified task as SEMANTIC or EXACT MATCH
- [ ] Selected appropriate tool based on classification
- [ ] NOT using grep for semantic queries when claudemem is indexed

---

## Multi-File Read Optimization

When reading multiple files, consider if a semantic search would be more efficient:

| Scenario | Optimization |
|----------|-------------|
| Read 3+ files in same directory | Try `claudemem search` first |
| Glob with broad patterns | Try `claudemem --agent map` |
| Sequential reads to "understand" | One semantic query may suffice |

**Quick check before bulk reads:**
1. Is claudemem indexed? (`claudemem status`)
2. Can this be one semantic query instead of N file reads?

### Interception Examples

**❌ About to do:**
```
Read src/services/auth/login.ts
Read src/services/auth/session.ts
Read src/services/auth/jwt.ts
Read src/services/auth/middleware.ts
Read src/services/auth/types.ts
Read src/services/auth/utils.ts
```

**✅ Do instead:**
```bash
claudemem search "authentication login session JWT middleware" -n 15
```

**❌ About to do:**
```
Glob pattern: src/services/prime/**/*.ts
Then read all 12 matches sequentially
```

**✅ Do instead:**
```bash
claudemem search "Prime API integration service endpoints" -n 20
```

**❌ Parallelization trap:**
```
"Let me Read these 5 files while the detective agent works..."
```

**✅ Do instead:**
```
Trust the detective agent to use claudemem.
Don't duplicate work with inferior Read/Glob.
```

---

## Efficiency Comparison

| Approach | Token Cost | Result Quality |
|----------|------------|----------------|
| Read 5+ files sequentially | ~5000 tokens | No ranking |
| Glob → Read all matches | ~3000+ tokens | No semantic understanding |
| `claudemem search` once | ~500 tokens | Ranked by relevance |

**Tip:** Claudemem results include context around matches, so you often don't need to read full files.

---

## Recommended Workflow

1. **Check index**: `claudemem status`
2. **Search semantically**: `claudemem search "concept query" -n 15`
3. **Read specific code**: Use results to target file:line reads

This workflow finds relevant code faster than reading files sequentially.

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v2.16.0
**Purpose:** Help choose the most efficient search tool for each task
