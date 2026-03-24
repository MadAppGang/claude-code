---
name: performance-tracking
description: "Tracks agent success rates, model latency, cost-per-task, and routing effectiveness across multi-agent workflows. Logs metrics to JSON, generates trend reports, and alerts on performance degradation. Use when measuring agent performance, optimizing routing, analyzing cost efficiency, or identifying failing patterns."
---

# Performance Tracking

Logs agent, skill, and model metrics to enable data-driven routing optimization and cost reduction.

## Workflow

1. **Log metrics after each task** — record agent, model, tokens, cost, duration, and success/failure.
2. **Aggregate periodically** — generate daily/weekly reports with success rates, cost breakdowns, and tier distribution.
3. **Detect degradation** — alert when agent success rate drops below 70% or model latency exceeds thresholds.
4. **Optimize routing** — use historical data to adjust tier thresholds and agent selection.

## Metric Schema

```json
{
  "task": "Implement profile page",
  "agent": "typescript-frontend-dev",
  "tier": 2,
  "model": "claude-sonnet-4-5",
  "tokens_in": 1200,
  "tokens_out": 2800,
  "cost": 0.0456,
  "duration_seconds": 8,
  "success": true,
  "timestamp": "2026-01-28T10:30:00Z"
}
```

**Verification:** Confirm the JSON entry is written to the metrics log after each task completes.

## What to Track

| Category | Metrics | Purpose |
|----------|---------|---------|
| Agent | Success rate, avg duration, task type affinity | Route tasks to best-fit agents |
| Model | Latency, cost, quality score | Select optimal model per tier |
| Routing | Tier distribution, escalation count | Tune scoring thresholds |
| Cost | Daily total, cost per task, savings vs baseline | Budget tracking |

## Example: Daily Report

```
Daily Cost Report:
  Tier 0 (Native): 45 tasks, $0.00
  Tier 1 (Haiku): 30 tasks, $0.12
  Tier 2 (Sonnet): 20 tasks, $0.60
  Tier 3 (Opus): 5 tasks, $0.75
  Total: 100 tasks, $1.47

Agent Success Rates:
  typescript-frontend-dev: 94% (47/50)
  backend-developer: 88% (22/25)
  test-writer: 96% (24/25)

Alerts:
  backend-developer success rate dropped 8% this week
```

## Degradation Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Agent success rate | < 80% | < 70% |
| Model latency | > 2x baseline | > 5x baseline |
| Escalation rate | > 20% of tasks | > 40% of tasks |
| Daily cost | > 150% of average | > 200% of average |

## Notes

- Store metrics in a JSONL file for easy append and analysis
- Integrate with task-complexity-router to feed routing decisions
- Track across sessions to build historical baselines
- Focus on actionable metrics that drive routing improvements
