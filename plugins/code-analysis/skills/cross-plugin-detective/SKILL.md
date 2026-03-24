---
name: cross-plugin-detective
description: "Maps agent roles to appropriate detective skills (developer-detective, architect-detective, tester-detective, debugger-detective, ultrathink-detective) for cross-plugin integration. Use when connecting agents from other plugins to claudemem investigation capabilities or deciding which detective to reference in agent frontmatter."
---

# Cross-Plugin Detective Integration

Connects any agent across plugins to the appropriate detective skill based on its role, ensuring all code investigation uses claudemem indexed memory exclusively.

## Workflow

1. **Identify the agent's primary role** — implementing, designing, testing, debugging, or reviewing.
2. **Select the matching detective** from the mapping table below.
3. **Add the skill reference** to the agent's frontmatter: `skills: code-analysis:<detective-name>`.
4. **Verify the agent uses claudemem** — never grep, find, Glob, or Grep tools for code discovery.

## Agent-to-Detective Mapping

| Agent Role | Detective Skill | Primary Focus |
|------------|----------------|---------------|
| Developer agents | `code-analysis:developer-detective` | Implementation, data flow, callers/callees |
| Architect agents | `code-analysis:architect-detective` | System design, layers, PageRank analysis |
| Tester agents | `code-analysis:tester-detective` | Coverage analysis, test quality |
| Debugger agents | `code-analysis:debugger-detective` | Root cause analysis, call chains |
| Reviewer agents | `code-analysis:ultrathink-detective` | Comprehensive multi-perspective audit |

## Example: Adding Detective to a Frontend Agent

```yaml
---
name: typescript-frontend-dev
description: Implements features
skills: code-analysis:developer-detective
---

# Investigation Pattern
# 1. claudemem status
# 2. claudemem search "feature I'm implementing"
# 3. Read specific file:line from results
# 4. NEVER use grep or find for discovery
```

**Verification:** Confirm the agent's frontmatter includes the correct `skills:` reference and that investigation code uses `claudemem` commands.

## Plugin Dependency

Add to your plugin's `plugin.json` to ensure detective skills are available:

```json
{
  "dependencies": {
    "code-analysis@mag-claude-plugins": "^1.6.0"
  }
}
```

## Notes

- All detective skills require claudemem indexed memory — grep/find/Glob/Grep are forbidden for semantic queries
- Multi-skill agents can reference multiple detectives: `skills: code-analysis:ultrathink-detective, code-analysis:tester-detective`
- Direct detective usage and /analyze command remain unchanged
