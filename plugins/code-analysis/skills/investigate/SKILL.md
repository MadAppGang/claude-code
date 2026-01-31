---
name: investigate
description: "Unified entry point for code investigation. Auto-routes to specialized detective based on query keywords. Use when investigation type is unclear or for general exploration."
allowed-tools: Bash, Task, AskUserQuestion
---

# Investigate Skill

**Version:** 1.0.0
**Purpose:** Keyword-based routing to specialized detective skills
**Pattern:** Smart delegation via Task tool

## Overview

This skill analyzes your investigation query and routes to the appropriate detective specialist:
- **debugger-detective** (errors, bugs, crashes)
- **tester-detective** (tests, coverage, edge cases)
- **architect-detective** (architecture, design, patterns)
- **developer-detective** (implementation, data flow - default)

## Routing Logic

### Priority System (Highest First)

1. **Error/Debug** (Priority 1) - Time-critical bug fixes
   - Keywords: "debug", "error", "broken", "failing", "crash"
   - Route to: `debugger-detective`

2. **Testing** (Priority 2) - Specialized test analysis
   - Keywords: "test", "coverage", "edge case", "mock"
   - Route to: `tester-detective`

3. **Architecture** (Priority 3) - High-level understanding
   - Keywords: "architecture", "design", "structure", "layer"
   - Route to: `architect-detective`

4. **Implementation** (Default, Priority 4) - Most common
   - Keywords: "implementation", "how does", "code flow"
   - Route to: `developer-detective`

### Conflict Resolution

When multiple keywords from different categories are detected:
- **Highest priority wins** (Priority 1 beats Priority 2, etc.)
- **No matches**: Default to developer-detective

## Workflow

### Phase 1: Extract Query

The investigation query should be available from the task description or user input.

```bash
# Query comes from the Task description or user request
INVESTIGATION_QUERY="${TASK_DESCRIPTION:-$USER_QUERY}"

# Normalize to lowercase for case-insensitive matching
QUERY_LOWER=$(echo "$INVESTIGATION_QUERY" | tr '[:upper:]' '[:lower:]')
```

### Phase 2: Keyword Detection

```bash
# Priority 1: Error/Debug keywords
if echo "$QUERY_LOWER" | grep -qE "debug|error|broken|failing|crash"; then
  DETECTIVE="debugger-detective"
  KEYWORDS="debug/error keywords"
  PRIORITY=1
  RATIONALE="Bug fixes are time-critical and require call chain tracing"

# Priority 2: Testing keywords
elif echo "$QUERY_LOWER" | grep -qE "test|coverage|edge case|mock"; then
  DETECTIVE="tester-detective"
  KEYWORDS="test/coverage keywords"
  PRIORITY=2
  RATIONALE="Test analysis is specialized and requires callers analysis"

# Priority 3: Architecture keywords
elif echo "$QUERY_LOWER" | grep -qE "architecture|design|structure|layer"; then
  DETECTIVE="architect-detective"
  KEYWORDS="architecture/design keywords"
  PRIORITY=3
  RATIONALE="High-level understanding requires PageRank analysis"

# Priority 4: Implementation (default)
else
  DETECTIVE="developer-detective"
  KEYWORDS="implementation (default)"
  PRIORITY=4
  RATIONALE="Most common investigation type - data flow via callers/callees"
fi
```

### Phase 3: User Feedback

Before delegating, inform the user of the routing decision:

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Investigation Routing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Query: $INVESTIGATION_QUERY"
echo ""
echo "Detected: $KEYWORDS (Priority $PRIORITY)"
echo "Routing to: $DETECTIVE"
echo "Reason: $RATIONALE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
```

### Phase 4: Delegation via Task Tool

Use the Task tool to delegate to the selected detective:

```typescript
Task({
  description: INVESTIGATION_QUERY,
  agent: DETECTIVE,
  context: {
    routing_reason: `Auto-routed based on ${KEYWORDS}`,
    original_query: INVESTIGATION_QUERY,
    priority: PRIORITY
  }
})
```

## Examples

### Example 1: Debug Keywords

**Input:** "Why is login broken?"

**Detection:**
- Keyword matched: "broken"
- Priority: 1 (Error/Debug)
- Route to: debugger-detective

**Feedback:**
```
🔍 Investigation Routing
Query: Why is login broken?
Detected: debug/error keywords (Priority 1)
Routing to: debugger-detective
Reason: Bug fixes are time-critical and require call chain tracing
```

### Example 2: Test Keywords

**Input:** "What's the test coverage for payment?"

**Detection:**
- Keywords matched: "test", "coverage"
- Priority: 2 (Testing)
- Route to: tester-detective

**Feedback:**
```
🔍 Investigation Routing
Query: What's the test coverage for payment?
Detected: test/coverage keywords (Priority 2)
Routing to: tester-detective
Reason: Test analysis is specialized and requires callers analysis
```

### Example 3: Architecture Keywords

**Input:** "What's the architecture of the auth layer?"

**Detection:**
- Keywords matched: "architecture", "layer"
- Priority: 3 (Architecture)
- Route to: architect-detective

**Feedback:**
```
🔍 Investigation Routing
Query: What's the architecture of the auth layer?
Detected: architecture/design keywords (Priority 3)
Routing to: architect-detective
Reason: High-level understanding requires PageRank analysis
```

### Example 4: No Keywords (Default)

**Input:** "How does payment work?"

**Detection:**
- No keywords matched
- Priority: 4 (Default)
- Route to: developer-detective

**Feedback:**
```
🔍 Investigation Routing
Query: How does payment work?
Detected: implementation (default) (Priority 4)
Routing to: developer-detective
Reason: Most common investigation type - data flow via callers/callees
```

### Example 5: Multi-Keyword Conflict

**Input:** "Debug the test coverage"

**Detection:**
- Keywords matched: "debug" (Priority 1) AND "test" (Priority 2)
- Priority 1 wins
- Route to: debugger-detective

**Feedback:**
```
🔍 Investigation Routing
Query: Debug the test coverage
Detected: debug/error keywords (Priority 1)
Routing to: debugger-detective
Reason: Bug fixes are time-critical and require call chain tracing
(Note: Also detected test keywords, but debug takes priority)
```

## Complete Implementation

Here's the full workflow:

```bash
#!/bin/bash

# Get investigation query from task description
INVESTIGATION_QUERY="${TASK_DESCRIPTION}"

# Normalize to lowercase
QUERY_LOWER=$(echo "$INVESTIGATION_QUERY" | tr '[:upper:]' '[:lower:]')

# Keyword detection with priority routing
if echo "$QUERY_LOWER" | grep -qE "debug|error|broken|failing|crash"; then
  DETECTIVE="debugger-detective"
  KEYWORDS="debug/error keywords"
  PRIORITY=1
  RATIONALE="Bug fixes are time-critical and require call chain tracing"

elif echo "$QUERY_LOWER" | grep -qE "test|coverage|edge case|mock"; then
  DETECTIVE="tester-detective"
  KEYWORDS="test/coverage keywords"
  PRIORITY=2
  RATIONALE="Test analysis is specialized and requires callers analysis"

elif echo "$QUERY_LOWER" | grep -qE "architecture|design|structure|layer"; then
  DETECTIVE="architect-detective"
  KEYWORDS="architecture/design keywords"
  PRIORITY=3
  RATIONALE="High-level understanding requires PageRank analysis"

else
  DETECTIVE="developer-detective"
  KEYWORDS="implementation (default)"
  PRIORITY=4
  RATIONALE="Most common investigation type - data flow via callers/callees"
fi

# Show routing decision
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Investigation Routing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Query: $INVESTIGATION_QUERY"
echo ""
echo "Detected: $KEYWORDS (Priority $PRIORITY)"
echo "Routing to: $DETECTIVE"
echo "Reason: $RATIONALE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
```

Then use the Task tool to delegate:

```typescript
Task({
  description: INVESTIGATION_QUERY,
  agent: DETECTIVE
})
```

## Fallback Protocol

If routing produces unexpected results:

1. **Show routing decision** to user
2. **Ask for override** if needed via AskUserQuestion
3. **Default to developer-detective** if ambiguous

### Override Pattern

```typescript
// If user wants to override the routing
AskUserQuestion({
  questions: [{
    question: `Auto-routing selected ${DETECTIVE}. Override?`,
    header: "Investigation Routing",
    multiSelect: false,
    options: [
      { label: "Continue with auto-routing", description: `Use ${DETECTIVE}` },
      { label: "debugger-detective", description: "Root cause analysis" },
      { label: "tester-detective", description: "Test coverage analysis" },
      { label: "architect-detective", description: "Architecture patterns" },
      { label: "developer-detective", description: "Implementation details" }
    ]
  }]
})
```

## Integration with Existing Workflow

This skill is **additive only** and does not change existing behavior:

- **Direct detective usage** still works (Task → specific detective)
- **/analyze command** unchanged (launches codebase-detective)
- **Parallel orchestration** patterns unchanged
- **All claudemem hooks** preserved

## Use Cases

| When to Use Investigate Skill | When to Use Direct Detective |
|-------------------------------|------------------------------|
| Investigation type unclear | You know which specialist you need |
| General exploration | Parallel orchestration (multimodel plugin) |
| Quick routing decision | Specific workflow requirements |
| Learning/experimenting | Production automation |

## Notes

- Case-insensitive keyword matching
- Priority system resolves conflicts
- User sees routing decision before delegation
- Original query preserved in Task context
- Default to developer-detective when no keywords match
- Works with all claudemem versions (v0.3.0+)

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v3.1.0
**Last Updated:** January 2026 (v1.0.0 - Initial release)
