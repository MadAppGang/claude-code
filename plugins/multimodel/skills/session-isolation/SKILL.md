---
name: session-isolation
description: "Creates unique session directories to prevent file collisions across concurrent or sequential multi-artifact workflows. Generates timestamped paths, tracks metadata, and supports legacy fallback. Use when orchestrating workflows that generate multiple files such as designs, reviews, or reports."
---

# Session Isolation Pattern

Isolates artifacts from multi-artifact workflows into unique session directories to prevent file collisions.

## Workflow

1. **Generate a unique session path** using workflow type, target slug, timestamp, and random suffix.
2. **Create the directory structure** with subdirectories for reviews and artifacts.
3. **Write session metadata** (`session-meta.json`) with session ID, type, and start time.
4. **Pass SESSION_PATH** to all sub-agent prompts so they write to isolated paths.
5. **Update metadata on completion** with status and completion timestamp.

## Example: Session Initialization

```bash
# Generate unique session path
TARGET_SLUG=$(echo "${TARGET_NAME:-workflow}" | tr '[:upper:] ' '[:lower:]-' | sed 's/[^a-z0-9-]//g' | head -c20)
SESSION_BASE="${WORKFLOW_TYPE}-${TARGET_SLUG}-$(date +%Y%m%d-%H%M%S)-$(head -c4 /dev/urandom | xxd -p | head -c4)"
SESSION_PATH="ai-docs/sessions/${SESSION_BASE}"

# Create directory structure
mkdir -p "${SESSION_PATH}/reviews/plan-review" \
         "${SESSION_PATH}/reviews/impl-review"

# Create session metadata
cat > "${SESSION_PATH}/session-meta.json" << EOF
{
  "session_id": "${SESSION_BASE}",
  "type": "${WORKFLOW_TYPE}",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "in_progress"
}
EOF
```

**Verification:** Confirm the session directory exists and `session-meta.json` is valid JSON before proceeding.

## Artifact Path Mapping

| Artifact Type | SESSION_PATH Format | Legacy Fallback |
|---------------|---------------------|-----------------|
| Design/Context | `${SESSION_PATH}/design.md` | `ai-docs/agent-design-{name}.md` |
| Plan Review | `${SESSION_PATH}/reviews/plan-review/{model}.md` | `ai-docs/plan-review-{model}.md` |
| Impl Review | `${SESSION_PATH}/reviews/impl-review/{model}.md` | `ai-docs/impl-review-{model}.md` |
| Final Report | `${SESSION_PATH}/report.md` | `ai-docs/{workflow}-report-{name}.md` |

## Backward Compatibility

Falls back to flat `ai-docs/` paths when SESSION_PATH is not provided, directory creation fails, or `LEGACY_MODE: true` is set.

## Notes

- Initialize session in Phase 0 of the orchestrator command
- Include SESSION_PATH in all sub-agent prompts
- Use descriptive slugs (workflow type + target) in folder names
- Never fail the workflow due to session creation issues — fall back to legacy mode
