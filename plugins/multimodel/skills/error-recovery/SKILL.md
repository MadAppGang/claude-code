---
name: error-recovery
description: "Handles errors, timeouts, and partial failures in multi-agent workflows with retry logic, fallback strategies, and graceful degradation. Implements exponential backoff, model failover, and partial-success preservation. Use when dealing with API failures, external model timeouts, user cancellation, or building resilient multi-agent pipelines."
---

# Error Recovery

Patterns for handling failures gracefully in multi-agent workflows so temporary errors do not derail entire pipelines.

## Workflow

1. **Wrap external calls** in timeout-aware execution with configurable thresholds (default 30s).
2. **Detect failure type** — timeout, API error (401/500), network error, user cancellation, or out-of-credits.
3. **Apply recovery strategy** from the pattern table below.
4. **Preserve partial results** — if 3 of 4 agents succeeded, use those results and note the gap.
5. **Report outcome** — log the failure, recovery action, and final status.

## Recovery Patterns

| Failure Type | Detection | Recovery Strategy |
|--------------|-----------|-------------------|
| Timeout (>30s) | Elapsed time exceeds threshold | Retry once with shorter prompt, then skip with warning |
| API 401/403 | HTTP status code | Check API key, inform user, skip external model |
| API 500/502/503 | HTTP status code | Retry with exponential backoff (1s, 2s, 4s), max 3 attempts |
| Network error | Connection refused/timeout | Retry once, then fall back to embedded Claude |
| User cancellation (Ctrl+C) | Signal handler | Save partial results, report what completed |
| Out of credits | 402/quota error | Inform user, fall back to embedded Claude |
| Tool not installed | Command not found | Inform user with install instructions, continue without |

## Example: Retry with Exponential Backoff

```bash
MAX_RETRIES=3
RETRY_DELAY=1

for attempt in $(seq 1 $MAX_RETRIES); do
  result=$(timeout 30 npx claudish --model "$MODEL" --stdin --quiet <<< "$PROMPT" 2>&1)
  exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "$result"
    break
  fi

  if [ $attempt -lt $MAX_RETRIES ]; then
    sleep $RETRY_DELAY
    RETRY_DELAY=$((RETRY_DELAY * 2))
  else
    echo "WARNING: $MODEL failed after $MAX_RETRIES attempts, using fallback"
  fi
done
```

**Verification:** Confirm the retry loop exits cleanly on both success and max-retry exhaustion.

## Partial Success Strategy

When running parallel agents and some fail:

1. **Collect all results** — successful and failed.
2. **Check minimum threshold** — if 2+ of 4 agents succeeded, proceed with available results.
3. **Note gaps** — flag which perspectives are missing in the final output.
4. **Never block on optional agents** — only block on critical path agents.

## Model Failover Chain

```
Primary model → Retry same model → Alternative model → Embedded Claude
Example: grok-code-fast-1 → retry → gemini-2.5-flash → embedded Claude Sonnet
```

## Notes

- Always set explicit timeouts on external model calls (30s default, 60s for Opus-tier)
- Log all failures with error type, model, and recovery action for performance tracking
- Inform users when falling back to degraded mode — never silently downgrade
- Preserve partial results even when the workflow cannot fully complete
