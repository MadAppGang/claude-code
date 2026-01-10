---
name: setup
description: Add claudemem enforcement rules to project CLAUDE.md and verify setup
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
---

# Setup Claudemem Enforcement

This command sets up claudemem semantic search enforcement for this project.

## Steps

### 1. Check claudemem installation

```bash
which claudemem && claudemem --version
```

If not installed, guide user:
```bash
npm install -g claude-codemem
claudemem init
```

### 2. Check index status

```bash
claudemem status
```

If not indexed:
```bash
claudemem index
```

### 3. Check CLAUDE.md for existing rules

Read the project's CLAUDE.md and look for the marker:
`## Code Search: CLAUDEMEM ENFORCED`

### 4. If rules not present, ask user

```typescript
AskUserQuestion({
  questions: [{
    question: "Add claudemem enforcement rules to CLAUDE.md?",
    header: "Setup",
    multiSelect: false,
    options: [
      { label: "Yes, add rules (Recommended)", description: "Adds documentation about Grep/Glob interception" },
      { label: "No, skip", description: "Hooks will still work, just no documentation in CLAUDE.md" }
    ]
  }]
})
```

### 5. Inject rules if user agrees

Append the following to CLAUDE.md:

```markdown

## Code Search: CLAUDEMEM ENFORCED

> Added by `code-analysis` plugin v2.14.0

### Mandatory Enforcement Rules

**The hook system is INESCAPABLE when claudemem is indexed.**

| Tool | Behavior | Workaround Blocked? |
|------|----------|-------------------|
| **Grep** | BLOCKED - Results provided in block message | N/A (primary) |
| **Glob (code patterns)** | BLOCKED if pattern matches `**/*.ts` etc | YES |
| **Bash grep/rg/find** | BLOCKED - Pattern extracted and analyzed | YES |
| **Read (3+ files)** | WARNING at 3, BLOCKED at 5+ | YES |
| **Task (Explore)** | BLOCKED - Redirect to detective | YES |

### Evasion Detection

The hook system tracks blocked tools and detects workaround patterns:

- Grep blocked -> Glob attempted -> **EVASION BLOCKED**
- Grep blocked -> 5 Read calls -> **BULK READ BLOCKED**
- Explore blocked -> Bash search -> **EVASION BLOCKED**

**There is no workaround. Use claudemem or detective skills.**

### Required Response to Block

When you see a block message:

1. **READ** the provided claudemem results in the block message
2. **USE** those results if sufficient
3. **INVOKE** `code-analysis:claudemem-search` skill if more data needed
4. **NEVER** attempt Glob, bulk Read, or Bash search as alternatives

### Manual Commands

```bash
claudemem search "authentication flow"  # Semantic search
claudemem --agent symbol "UserService"  # Find definition
claudemem --agent callers "login"       # Impact analysis
claudemem status                        # Check index
claudemem index                         # Re-index project
```

### Why This Exists

1. **Token Efficiency**: claudemem ~500 tokens vs 5+ files ~5000+ tokens
2. **Semantic Ranking**: Results ranked by relevance, not file order
3. **No Noise**: Excludes node_modules, generated types, fixtures
4. **AST Analysis**: Understands code structure, not just text patterns

### Consequences of Ignoring

- Workaround tools will be blocked
- Evasion patterns are logged
- Each block adds context overhead
- Task fails to progress until compliance
```

### 6. Confirm setup

Report status:
- claudemem installed: Yes/No
- claudemem indexed: Yes/No (X chunks)
- CLAUDE.md rules: Added/Already present/Skipped
- Hooks active: Yes (via plugin.json)

## Success Message

```
✅ Claudemem enforcement setup complete!

- Grep/rg/find will be automatically replaced with semantic search
- Broad Glob patterns will show suggestions
- Bulk file reads will show warnings

Test it by running any Grep command - it should be intercepted.
```
