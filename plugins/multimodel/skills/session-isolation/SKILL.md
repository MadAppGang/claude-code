---
name: session-isolation
description: Use when orchestrating workflows that generate multiple files (designs, reviews, reports) to prevent file collisions across concurrent or sequential sessions with unique session directories.
keywords: [session-isolation, artifact-isolation, file-collision, concurrent-sessions, sequential-workflows, session-directory, multi-artifact, session-metadata]
plugin: multimodel
updated: 2026-01-20
---

# Session Isolation Pattern

Session-based artifact isolation for multi-artifact workflows. Use when orchestrating workflows that generate multiple files (designs, reviews, reports) to prevent file collisions across concurrent or sequential sessions.

## Problem

When multiple workflows run (even sequentially), artifacts with the same name collide:

```
Session 1 (SEO): writes ai-docs/plan-review-grok.md
Session 2 (API): writes ai-docs/plan-review-grok.md  <-- OVERWRITES!
```

## Solution

Use unique session folders to isolate artifacts:

```
ai-docs/sessions/agentdev-seo-20260105-143022-a3f2/
├── session-meta.json      # Session tracking
├── design.md              # Primary artifact
├── reviews/
│   ├── plan-review/       # Plan review phase
│   │   ├── internal.md
│   │   ├── grok.md
│   │   └── consolidated.md
│   └── impl-review/       # Implementation review phase
│       ├── internal.md
│       └── consolidated.md
└── report.md              # Final report
```

## Implementation Pattern

### 1. Session Initialization (Orchestrator)

Add to Phase 0 of your orchestrator command:

```bash
# Generate unique session path
TARGET_SLUG=$(echo "${TARGET_NAME:-workflow}" | tr '[:upper:] ' '[:lower:]-' | sed 's/[^a-z0-9-]//g' | head -c20)
SESSION_BASE="${WORKFLOW_TYPE}-${TARGET_SLUG}-$(date +%Y%m%d-%H%M%S)-$(head -c4 /dev/urandom | xxd -p | head -c4)"
SESSION_PATH="ai-docs/sessions/${SESSION_BASE}"

# Create directory structure
mkdir -p "${SESSION_PATH}/reviews/plan-review" \
         "${SESSION_PATH}/reviews/impl-review" || {
  echo "Warning: Cannot create session directory, using legacy mode"
  SESSION_PATH="ai-docs"
}

# Create session metadata (if not legacy mode)
if [[ "$SESSION_PATH" != "ai-docs" ]]; then
  cat > "${SESSION_PATH}/session-meta.json" << EOF
{
  "session_id": "${SESSION_BASE}",
  "type": "${WORKFLOW_TYPE}",
  "target": "${USER_REQUEST}",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "in_progress"
}
EOF
fi
```

### 2. Pass SESSION_PATH to Sub-Agents

Include in all agent prompts:

```
SESSION_PATH: ${SESSION_PATH}

{actual task description}

Save output to: ${SESSION_PATH}/{artifact_path}
```

### 3. Sub-Agent SESSION_PATH Detection

Add to agent `<critical_constraints>`:

```xml
<session_path_support>
  **Check for Session Path Directive**

  If prompt contains `SESSION_PATH: {path}`:
  1. Extract the session path
  2. Use it for all output file paths
  3. Primary artifact: `${SESSION_PATH}/{type}.md`
  4. Reviews: `${SESSION_PATH}/reviews/{phase}/{model}.md`

  **If NO SESSION_PATH**: Use legacy paths (ai-docs/)
</session_path_support>
```

### 4. Session Completion

Update metadata when workflow completes:

```bash
if [[ -f "${SESSION_PATH}/session-meta.json" ]]; then
  jq '.status = "completed" | .completed_at = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' \
    "${SESSION_PATH}/session-meta.json" > "${SESSION_PATH}/session-meta.json.tmp" && \
  mv "${SESSION_PATH}/session-meta.json.tmp" "${SESSION_PATH}/session-meta.json"
fi
```

## Artifact Path Mapping

| Artifact Type | SESSION_PATH Format | Legacy Format |
|---------------|---------------------|---------------|
| Design/Context | `${SESSION_PATH}/design.md` | `ai-docs/agent-design-{name}.md` |
| Plan Review | `${SESSION_PATH}/reviews/plan-review/{model}.md` | `ai-docs/plan-review-{model}.md` |
| Impl Review | `${SESSION_PATH}/reviews/impl-review/{model}.md` | `ai-docs/impl-review-{model}.md` |
| Consolidated | `${SESSION_PATH}/reviews/{phase}/consolidated.md` | `ai-docs/{phase}-consolidated.md` |
| Final Report | `${SESSION_PATH}/report.md` | `ai-docs/{workflow}-report-{name}.md` |

## Backward Compatibility

**Legacy Mode Triggers:**
1. `SESSION_PATH` not provided in prompt
2. Directory creation fails (permissions)
3. Explicit `LEGACY_MODE: true` in prompt

**Behavior:**
- Fall back to flat `ai-docs/` paths
- Log warning about legacy mode
- All features still work, just without isolation

## Session Metadata Schema

```json
{
  "session_id": "agentdev-seo-20260105-143022-a3f2",
  "type": "agentdev",
  "target": "SEO agent improvements",
  "started_at": "2026-01-05T14:30:22Z",
  "completed_at": "2026-01-05T15:45:30Z",
  "status": "completed",
  "phases_completed": ["init", "design", "plan-review", "implementation", "quality-review"],
  "models_used": ["claude-embedded", "x-ai/grok-code-fast-1", "google/gemini-3-pro"],
  "artifacts": {
    "design": "design.md",
    "plan_reviews": ["reviews/plan-review/internal.md", "reviews/plan-review/grok.md"],
    "impl_reviews": ["reviews/impl-review/internal.md", "reviews/impl-review/gemini.md"],
    "report": "report.md"
  }
}
```

## Plugins Using Session Isolation

| Plugin | Command | Session Pattern |
|--------|---------|-----------------|
| **agentdev** | `/develop` | `agentdev-{target}-{timestamp}-{random}` |
| **frontend** | `/review`, `/implement` | `review-{timestamp}-{random}` |
| **seo** | `/review`, `/alternatives` | `seo-review-{timestamp}-{random}` |
| **multimodel** | `/team` | `team-{task-slug}-{timestamp}-{random}` |

### Team Session Example

The `/team` command creates a session for multi-model blind voting:

```
ai-docs/sessions/team-stats-validation-20260209-143022-a3f2/
├── task.md                 # Raw task description (shared by all models)
├── grok-result.md          # Grok's investigation findings
├── gemini-result.md        # Gemini's investigation findings
├── deepseek-result.md      # DeepSeek's investigation findings
├── internal-result.md      # Internal Claude's findings
└── verdict.md              # Aggregated verdict with vote breakdown
```

**Key difference from other plugins:** Team sessions contain results from
multiple AI models investigating the same task independently. Each model
writes to its own result file to prevent conflicts during parallel execution.

## Best Practices

1. **Always initialize early**: Session creation should happen in Phase 0
2. **Include SESSION_PATH in all prompts**: Sub-agents need it for output paths
3. **Use descriptive slugs**: Include workflow type and target in folder name
4. **Update metadata on completion**: Track status changes
5. **Fallback gracefully**: Never fail the workflow due to session creation issues
