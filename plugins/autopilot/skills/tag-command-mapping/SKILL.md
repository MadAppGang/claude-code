---
name: tag-command-mapping
description: "Routes Linear tasks to Claude Code commands based on tag labels, applying precedence rules when multiple tags exist and falling back to text classification. Supports custom mappings via autopilot.local.md. Use when resolving which agent handles a Linear task."
---

# Tag-to-Command Mapping

Routes incoming Linear tasks to the appropriate Claude Code command/agent based on tag labels, precedence rules, and text classification fallback.

## Workflow

1. **Extract tags** - filter labels starting with `@` from the Linear issue
2. **Apply precedence** - if multiple tags, select highest-priority tag
3. **Resolve mapping** - look up command, agent, and skills for the selected tag
4. **Fallback to classification** - if no tags, classify from title/description text
5. **Return routing** - provide the resolved command, agent, and skills to the caller

## Default Tag Mappings

| Tag | Command | Agent | Skills |
|-----|---------|-------|--------|
| `@debug` | `/dev:debug` | debugger | debugging-strategies |
| `@test` | `/dev:test-architect` | test-architect | testing-strategies |
| `@ui` | `/dev:ui` | ui | ui-design-review |
| `@frontend` | `/dev:feature` | developer | react-typescript |
| `@backend` | `/dev:implement` | developer | golang, api-design |
| `@review` | `/commit-commands:commit-push-pr` | reviewer | universal-patterns |
| `@refactor` | `/dev:implement` | developer | universal-patterns |
| `@research` | `/dev:deep-research` | researcher | n/a |

## Precedence Order (highest to lowest)

`@debug` > `@test` > `@ui` > `@frontend` > `@backend` > `@review` > `@refactor` > `@research`

```typescript
const PRECEDENCE = ['@debug', '@test', '@ui', '@frontend', '@backend', '@review', '@refactor', '@research'];

function selectTag(labels: string[]): string {
  const agentTags = labels.filter(l => l.startsWith('@'));
  if (agentTags.length <= 1) return agentTags[0] || 'default';
  for (const tag of PRECEDENCE) {
    if (agentTags.includes(tag)) return tag;
  }
  return 'default';
}
```

## Text Classification Fallback

When no tags are present, classify from task text:

```typescript
function classifyTask(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (/\b(fix|bug|error|crash|broken)\b/.test(text)) return 'BUG_FIX';    // → @debug
  if (/\b(add|implement|create|new|feature)\b/.test(text)) return 'FEATURE'; // → @frontend
  if (/\b(refactor|clean|optimize|improve)\b/.test(text)) return 'REFACTOR'; // → @refactor
  if (/\b(ui|design|component|style|visual)\b/.test(text)) return 'UI_CHANGE'; // → @ui
  if (/\b(test|coverage|e2e|spec)\b/.test(text)) return 'TEST';            // → @test
  return 'UNKNOWN'; // → @frontend (default)
}
```

## Custom Mappings

Define project-specific mappings in `.claude/autopilot.local.md`:

```yaml
tag_mappings:
  "@database":
    command: "/dev:implement"
    agent: "developer"
    skills: ["database-patterns"]
  "@performance":
    command: "/dev:implement"
    agent: "developer"
    skills: ["universal-patterns"]
```

## Examples

### Single tag resolution
```typescript
const labels = ['@frontend', 'feature'];
selectTag(labels);  // '@frontend'
// → { command: '/dev:feature', agent: 'developer', skills: ['react-typescript'] }
```

### Multiple tag precedence
```typescript
const labels = ['@frontend', '@debug'];
selectTag(labels);  // '@debug' (higher precedence)
// → { command: '/dev:debug', agent: 'debugger', skills: ['debugging-strategies'] }
```

### Text classification fallback
```typescript
resolveMapping([], "Fix login button not working", "");
// Classifies as BUG_FIX → @debug
// → { command: '/dev:debug', agent: 'debugger', skills: ['debugging-strategies'] }
```

## Verification

When resolving a mapping, confirm:
- [ ] Correct tag selected based on precedence
- [ ] Mapping resolves to valid command, agent, and skills
- [ ] Custom mappings in autopilot.local.md are checked before defaults
- [ ] Fallback classification produces reasonable routing
