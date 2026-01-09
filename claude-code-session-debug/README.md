# AgentDev Debug Sessions

This directory contains debug capture files from AgentDev sessions.

## Purpose

When debug mode is enabled, AgentDev records detailed session information to JSONL files in this directory. This data can be used for:

- Debugging agent behavior
- Analyzing workflow performance
- Optimizing multi-model validation
- Understanding tool usage patterns

## File Format

Files use JSONL (JSON Lines) format where each line is a complete JSON event.

**Naming Pattern:**
```
agentdev-{slug}-{date}-{time}-{random}.jsonl
```

Example: `agentdev-graphql-reviewer-20260109-063623-ba71.jsonl`

## Enabling Debug Mode

```bash
# Via environment variable
export AGENTDEV_DEBUG=true

# Via command flag
/develop --debug Create an agent...
```

## Documentation

For complete documentation including:
- Event types and schemas
- Analysis commands with jq
- Sensitive data protection
- Cleanup instructions

See the skill documentation:
```
/agentdev:debug-mode
```

Or read directly:
```
plugins/agentdev/skills/debug-mode/SKILL.md
```

## Security Note

Debug files may contain session context and are created with restrictive permissions (0o600). They are gitignored by default to prevent accidental commits.

## Cleanup

```bash
# Remove files older than 7 days
find . -name "*.jsonl" -mtime +7 -delete

# Remove all debug files
rm -f *.jsonl
```
