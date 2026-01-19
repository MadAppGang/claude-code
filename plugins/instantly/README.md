# Instantly Plugin for Claude Code

Cold email outreach toolkit with Instantly.ai MCP integration.

## Features

- **Campaign Analytics** - Performance metrics, reply rates, open rates, bounce tracking
- **Sequence Builder** - Multi-step email sequence creation with timing optimization
- **A/B Testing** - Create and analyze email variations with statistical significance
- **Auto-Optimization** - Pause underperforming campaigns, suggest improvements
- **Lead Management** - Add, move, and manage leads across campaigns

## Installation

### Prerequisites

1. **Instantly Account** - Active subscription at https://app.instantly.ai
2. **API Key** - Get from Instantly Settings → Integrations → API
3. **Claudish CLI** (optional, for multi-model validation):
   ```bash
   npm install -g claudish
   ```

### Enable Plugin

Add to `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "instantly@mag-claude-plugins": true
  }
}
```

### Configure Environment

Set your Instantly API key:

```bash
export INSTANTLY_API_KEY="your_api_key_here"
```

Or add to `.env` file:
```
INSTANTLY_API_KEY=your_api_key_here
```

## Quick Start

### Entry Point

```bash
/instantly:start
```

Interactive menu to guide you to the right workflow.

### Common Workflows

**View Campaign Performance:**
```bash
/instantly:analytics
```

**Create New Email Sequence:**
```bash
/instantly:sequence
```

**A/B Test Optimization:**
```bash
/instantly:ab-test
```

**Manage Leads:**
```bash
/instantly:leads
```

## Commands

| Command | Purpose |
|---------|---------|
| `/instantly:start` | Interactive entry point and workflow navigation |
| `/instantly:analytics` | Campaign performance analytics and reporting |
| `/instantly:sequence` | Create new cold email sequences |
| `/instantly:ab-test` | A/B testing workflow for optimization |
| `/instantly:leads` | Lead management (add, import, move) |

## Agents

| Agent | Purpose | Use When |
|-------|---------|----------|
| `instantly-campaign-analyst` | Performance analysis | "Analyze my campaign performance" |
| `instantly-sequence-builder` | Email sequence design | "Create a 5-step email sequence" |
| `instantly-outreach-optimizer` | A/B testing & optimization | "Optimize my campaign for better replies" |

## Skills

| Skill | Purpose |
|-------|---------|
| `instantly:campaign-metrics` | Campaign KPIs and benchmarks |
| `instantly:ab-testing-patterns` | A/B testing methodology |
| `instantly:sequence-best-practices` | Email sequence optimization |
| `instantly:email-deliverability` | Deliverability best practices |

## Example Workflows

### Workflow 1: New Campaign Launch

```
1. /instantly:sequence
   → Provide ICP: "Marketing Directors at SaaS companies"
   → Provide value prop: "Increase demo bookings 40%"
   → Select sequence length: 5 emails

2. Agent designs sequence, presents for review

3. User approves → Campaign created in Instantly

4. /instantly:analytics [after 3-5 days]
   → Review initial performance
   → Identify optimization opportunities

5. /instantly:ab-test [if needed]
   → A/B test subject lines for higher opens
```

### Workflow 2: Campaign Optimization

```
1. /instantly:analytics "SaaS Founders Q1"
   → Receive performance report
   → Identify: Open rate 22% (below benchmark)

2. /instantly:ab-test "SaaS Founders Q1"
   → Agent diagnoses: Subject line issue
   → Designs A/B test with 3 subject variants
   → User approves

3. [Wait 3-5 days for test results]

4. /instantly:analytics "SaaS Founders Q1"
   → Variant B wins with 38% open rate
   → Agent recommends rolling out winner
```

## Architecture

```
plugins/instantly/
├── plugin.json                    # Plugin manifest
├── README.md                      # This file
├── mcp-servers/
│   ├── mcp-config.json           # Instantly MCP server configuration
│   └── mcp-config.example.json   # Example with placeholders
├── agents/
│   ├── campaign-analyst.md       # Performance analysis and insights
│   ├── sequence-builder.md       # Email sequence creation
│   └── outreach-optimizer.md     # Campaign optimization and A/B testing
├── commands/
│   ├── start.md                  # Interactive entry point
│   ├── analytics.md              # Performance dashboard
│   ├── sequence.md               # Build sequences
│   ├── ab-test.md                # A/B testing workflow
│   └── leads.md                  # Lead management
├── skills/
│   ├── campaign-metrics/
│   ├── ab-testing-patterns/
│   ├── sequence-best-practices/
│   └── email-deliverability/
└── hooks/
    └── session-start.sh          # Session initialization
```

## Configuration

### MCP Server Configuration

The plugin uses header-based authentication (recommended for security):

```json
{
  "instantly": {
    "url": "https://mcp.instantly.ai/mcp",
    "transport": "streamable-http",
    "headers": {
      "Authorization": "${INSTANTLY_API_KEY}"
    },
    "timeout": 30000
  }
}
```

Alternative (URL-embedded API key):
```json
{
  "instantly": {
    "url": "https://mcp.instantly.ai/mcp/${INSTANTLY_API_KEY}",
    "transport": "streamable-http"
  }
}
```

## Benchmarks

### Cold Email Industry Benchmarks

| Metric | Excellent | Good | Average | Poor | Critical |
|--------|-----------|------|---------|------|----------|
| Open Rate | >50% | 40-50% | 25-40% | 15-25% | <15% |
| Reply Rate | >10% | 5-10% | 2-5% | 1-2% | <1% |
| Bounce Rate | <1% | 1-2% | 2-5% | 5-10% | >10% |
| Positive Reply % | >40% | 25-40% | 15-25% | 5-15% | <5% |

## Multi-Model Validation

This plugin supports PROXY_MODE for external AI model validation via Claudish CLI.

Example:
```
PROXY_MODE: x-ai/grok-code-fast-1

Analyze my "SaaS Founders Q1" campaign performance
```

See `orchestration:multi-model-validation` skill for details.

## Troubleshooting

### "Instantly MCP connection unavailable"

1. Check if `INSTANTLY_API_KEY` is set:
   ```bash
   echo $INSTANTLY_API_KEY | head -c 5
   ```
2. Verify your API key at https://app.instantly.ai/settings/integrations
3. Ensure MCP configuration is correct in `mcp-servers/mcp-config.json`

### High Bounce Rate

1. Pause campaign immediately
2. Remove all hard bounces
3. Re-verify remaining list
4. Resume with verified emails only

### Low Open Rate

1. Check sender score/reputation
2. Send test emails to Gmail/Outlook
3. Review recent changes to sending patterns
4. A/B test subject lines

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| orchestration@mag-claude-plugins | ^0.8.0 | Multi-agent coordination |
| Instantly Account | - | Active subscription required |
| Claudish CLI | latest | For PROXY_MODE (optional) |

## License

MIT

## Author

Jack Rudenko (i@madappgang.com) @ MadAppGang

## Version

1.0.0
