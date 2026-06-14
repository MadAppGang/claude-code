# Hermes Tweet Plugin

**Version:** 0.1.6
**License:** MIT

Hermes Tweet helps Hermes Agent workflows research public X/Twitter context,
monitor social signals, analyze trends, and run account actions only when
Hermes Tweet action gates are enabled.

## Quick Start

Install Hermes Tweet in Hermes Agent:

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
```

Configure an API key in the Hermes Agent environment:

```bash
export XQUIK_API_KEY="..."
```

Enable account actions only when the workflow explicitly needs them:

```bash
export HERMES_TWEET_ENABLE_ACTIONS=true
```

## Available Skill

### hermes-tweet

Use this skill when Claude Code is preparing or reviewing a Hermes Agent
workflow that needs X/Twitter research, monitored context, trend analysis, or
approval-gated account actions.

The skill keeps the default path read-only, checks that write actions remain
behind Hermes Tweet action controls, and points users to the native Hermes Agent
plugin as the runtime surface.
