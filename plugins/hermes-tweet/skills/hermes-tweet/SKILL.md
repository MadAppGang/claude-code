---
name: hermes-tweet
version: 0.1.6
description: Use when preparing Hermes Agent workflows that need X/Twitter research, monitored social context, trend analysis, or approval-gated account actions through Hermes Tweet.
keywords:
  - hermes agent
  - hermes tweet
  - x
  - twitter
  - social research
  - trend analysis
  - monitoring
plugin: hermes-tweet
updated: 2026-06-14
---

# Hermes Tweet Skill

Use Hermes Tweet when a Hermes Agent workflow needs X/Twitter research or
controlled account actions.

## Install

Install the native Hermes Agent plugin:

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
```

Set the API key in the Hermes Agent environment:

```bash
export XQUIK_API_KEY="..."
```

Only enable actions when the user explicitly asks for account operations:

```bash
export HERMES_TWEET_ENABLE_ACTIONS=true
```

## Routing Rules

1. Use read-only exploration for research, trend analysis, profile context,
   monitored account context, and source gathering.
2. Treat posting, liking, following, replying, reposting, and profile changes as
   account actions.
3. Before any account action, verify that the workflow explicitly asks for it and
   that Hermes Tweet action gates are enabled.
4. Keep generated prompts focused on public X/Twitter context and avoid storing
   credentials in files or conversation notes.
5. Prefer the native Hermes Agent plugin as the runtime surface. Use this Claude
   Code skill to prepare, review, or document the workflow.

## Good Fit

- Social signal research before a launch.
- Trend monitoring and source-backed briefings.
- Public account or keyword context for planning.
- Review of Hermes Agent prompts that include X/Twitter tools.

## Not a Fit

- Scraping private or authenticated content outside the user's authorized setup.
- Running account actions without explicit approval.
- Replacing the Hermes Agent plugin runtime with ad hoc shell commands.
