---
name: search-interceptor
description: "💡 Bulk file read optimizer. Suggests semantic search alternatives when reading multiple files. Helps reduce token usage by using claudemem's ranked results instead of sequential file reads."
allowed-tools: Bash, AskUserQuestion
---

# Search Interceptor

This skill helps optimize bulk file operations by suggesting semantic search alternatives when they would be more efficient.

## When Semantic Search is More Efficient

| Scenario | Token Cost | Alternative |
|----------|------------|-------------|
| Read 5+ files | ~5000 tokens | `claudemem search` (~500 tokens) |
| Glob all *.ts files | ~3000+ tokens | `claudemem --agent map` |
| Sequential reads to understand | Variable | One semantic query |

## When to Consider Alternatives

### Multiple File Reads

If planning to read several files, consider:
```bash
# Instead of reading 5 files individually
claudemem search "concept from those files" -n 15
# Gets ranked results with context
```

### Broad Glob Patterns

If using patterns like `src/**/*.ts`:
```bash
# Instead of globbing and reading all matches
claudemem --agent map "what you're looking for"
# Gets structural overview with PageRank ranking
```

### File Paths Mentioned in Task

Even when specific paths are mentioned, semantic search often finds additional relevant code:
```bash
claudemem search "concept related to mentioned files"
```

---

## Interception Protocol

### Step 1: Pause Before Execution

When you're about to execute bulk file operations, STOP and run:

```bash
claudemem status
```

### Step 2: Evaluate

**If claudemem is indexed:**

| Your Plan | Better Alternative |
|-----------|-------------------|
| Read 5 auth files | `claudemem search "authentication login session"` |
| Glob all services | `claudemem search "service layer business logic"` |
| Read mentioned paths | `claudemem search "[concept from those paths]"` |

**If claudemem is NOT indexed:**

```bash
claudemem index -y
```
Then proceed with semantic search.

### Step 3: Execute Better Alternative

```bash
# Instead of reading N files, run ONE semantic query
claudemem search "concept describing what you need" -n 15

# ONLY THEN read specific lines from results
```

---

## Interception Decision Matrix

| Situation | Intercept? | Action |
|-----------|-----------|--------|
| Read 1-2 specific files | No | Proceed with Read |
| Read 3+ files in investigation | **YES** | Convert to claudemem search |
| Glob for exact filename | No | Proceed with Glob |
| Glob for pattern discovery | **YES** | Convert to claudemem search |
| Grep for exact string | No | Proceed with Grep |
| Grep for semantic concept | **YES** | Convert to claudemem search |
| Files mentioned in prompt | **YES** | Search semantically first |

---

## Examples of Interception

### Example 1: Auth Investigation

**❌ Original plan:**
```
I see the task mentions auth, let me read:
- src/services/auth/login.ts
- src/services/auth/session.ts
- src/services/auth/jwt.ts
- src/services/auth/middleware.ts
- src/services/auth/utils.ts
```

**✅ After interception:**
```bash
claudemem status  # Check if indexed
claudemem search "authentication login session JWT token validation" -n 15
# Now I have ranked, relevant chunks instead of 5 full files
```

### Example 2: API Integration Audit

**❌ Original plan:**
```
Audit mentions Prime API files:
- src/services/prime/internal_api/client.ts
- src/services/prime/api.ts
Let me just Read these directly...
```

**✅ After interception:**
```bash
claudemem search "Prime API integration endpoints HTTP client" -n 20
# This finds ALL Prime-related code, ranked by relevance
# Not just the 2 files mentioned
```

### Example 3: Pattern Discovery

**❌ Original plan:**
```
Glob("src/**/*.controller.ts")
Then read all 15 controllers to understand routing
```

**✅ After interception:**
```bash
claudemem search "HTTP controller endpoint route handler" -n 20
# Gets the most relevant routing code, not all controllers
```

---

## Why Semantic Search Often Works Better

| Native Tools | Semantic Search |
|--------------|-----------------|
| No ranking | Ranked by relevance + PageRank |
| No relationships | Shows code connections |
| ~5000 tokens for 5 files | ~500 tokens for ranked results |
| Only explicitly requested code | Discovers related code |

**Tip:** For investigation tasks, try `claudemem search` first to get a ranked view of relevant code.

---

## Integration with Other Skills

This skill works with:

| Skill | Relationship |
|-------|-------------|
| `code-search-selector` | Selector determines WHAT tool; Interceptor validates BEFORE execution |
| `claudemem-search` | Interceptor redirects to claudemem; this skill shows HOW to search |
| `deep-analysis` | Interceptor prevents bad patterns; deep-analysis uses good patterns |
| Detective skills | Interceptor prevents duplicate work by trusting detective agents |

---

## Hook System Integration

The hook system may provide claudemem results proactively when the index is available:

- **Grep queries** → May receive claudemem search results instead
- **Bulk reads** → May receive suggestion to use semantic search
- **Broad globs** → May receive map results

### Using the Bypass Flag

When you specifically need native tool behavior:
```json
{ "pattern": "exact string", "_bypass_claudemem": true }
```

This tells hooks you intentionally want native tool output.

---

## Quick Reference

Before bulk Read/Glob operations, consider:

1. **Is claudemem indexed?** → `claudemem status`
2. **Can this be one semantic query?** → Often yes
3. **Do you need exact matches?** → Use native tools with bypass flag

**General guideline:** For understanding/investigation, try semantic search first. For exact matches, use native tools.

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v2.16.0
**Purpose:** Help optimize bulk file operations with semantic search alternatives
