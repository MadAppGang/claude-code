# MCP Server Configuration

The frontend plugin includes four MCP servers that auto-load when the plugin is enabled:

- **Apidog** - API documentation and endpoint management
- **Figma** - Design file access and component import
- **Chrome DevTools** - Browser debugging and UI inspection
- **Claudish** - External AI models via OpenRouter (Codex, Grok, GPT-5, etc.)

## How It Works

### 1. MCP Servers Auto-Load

When you enable the plugin, MCP servers automatically start using environment variables from your `.claude/settings.json` file.

### 2. Two Types of Configuration

**Secrets (Personal):**
- API tokens, access tokens, personal credentials
- Store in `.env` file or `.claude/settings.local.json` (gitignored)
- Each developer has their own

**Project-Specific (Shared):**
- Project IDs, URLs, team identifiers
- Store in `.claude/settings.json` (committed to git)
- Whole team uses the same values

## Quick Setup

### Step 1: Add Personal Secrets

Create or edit `.claude/settings.local.json` in your project:

```json
{
  "env": {
    "APIDOG_API_TOKEN": "your-personal-token-here",
    "FIGMA_ACCESS_TOKEN": "your-figma-token-here",
    "OPENROUTER_API_KEY": "your-openrouter-key-here"
  }
}
```

**Note:** This file should be gitignored so tokens stay private.

### Step 2: Add Project Configuration

Add to `.claude/settings.json` (this gets committed):

```json
{
  "env": {
    "APIDOG_PROJECT_ID": "your-team-project-id"
  },
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true
  }
}
```

### Step 3: Verify MCP Servers

Run `/mcp` to see connected servers. You should see:
- ✅ apidog (if APIDOG_API_TOKEN and APIDOG_PROJECT_ID are set)
- ✅ figma (if FIGMA_ACCESS_TOKEN is set)
- ✅ chrome-devtools (always available, no credentials required)
- ✅ claudish (if OPENROUTER_API_KEY is set)

## Interactive Setup

If you haven't configured values yet, skills and agents will ask for them when needed:

```
User: Import the LoginForm component from Figma
Claude: I need your Figma access token to import components. Would you like to configure it now?
User: Yes
Claude: [Asks for token, validates it, saves to settings.local.json]
Claude: ✅ Figma configured! Now importing LoginForm...
```

The configuration is saved, so you won't be asked again.

## Environment Variables Reference

### Apidog

**Required:**
- `APIDOG_API_TOKEN` (secret, personal) - Your Apidog API token
- `APIDOG_PROJECT_ID` (project-specific, shared) - Team's Apidog project ID

**Optional:**
- `APIDOG_BASE_URL` - Custom API URL for self-hosted Apidog

**Get your token:** https://apidog.com/settings/tokens

### Figma

**Required:**
- `FIGMA_ACCESS_TOKEN` (secret, personal) - Your Figma personal access token

**Get your token:** https://www.figma.com/developers/api#access-tokens

### Chrome DevTools

**No configuration required** - Works out of the box!

**What it does:**
- Launch and control Chrome browser instances
- Inspect DOM and CSS
- Debug responsive layouts
- Capture screenshots
- Analyze performance
- Test accessibility

**Used by:**
- `ui-manual-tester` agent
- `browser-debugger` skill
- `/implement` and `/validate-ui` commands

### Claudish

**Required:**
- `OPENROUTER_API_KEY` (secret, personal) - Your OpenRouter API key

**Get your key:** https://openrouter.ai/keys

**What it does:**
- Call external AI models (Codex, Grok, GPT-5, MiniMax, Qwen)
- Get expert code reviews
- Validate UI/UX designs
- Technical analysis and architecture advice

**Available models:**
- `code-review` - OpenAI GPT-5 Codex
- `ui-review` - OpenAI GPT-5 Codex
- `design-review` - OpenAI GPT-5 Codex
- `grok-fast` - xAI Grok (fast coding)
- `minimax` - MiniMax M2 (high performance)
- `qwen-vision` - Alibaba Qwen (vision-language)

**Used by:**
- `/implement` command (code review, design validation)
- `/validate-ui` command (design validation)
- Can be used by any agent for specialized tasks

**See:** `/mcp/claudish-mcp/README.md` for detailed usage

## Configuration Patterns

### Pattern 1: Team Project + Personal Tokens (Recommended)

**Project `.claude/settings.json` (committed):**
```json
{
  "env": {
    "APIDOG_PROJECT_ID": "team-project-123"
  },
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true
  }
}
```

**Personal `.claude/settings.local.json` (gitignored):**
```json
{
  "env": {
    "APIDOG_API_TOKEN": "personal-token-abc",
    "FIGMA_ACCESS_TOKEN": "figma-token-xyz",
    "OPENROUTER_API_KEY": "sk-or-v1-..."
  }
}
```

**Why this works:**
- ✅ Project configuration shared across team
- ✅ Personal tokens stay private
- ✅ No secrets in git
- ✅ Easy onboarding for new team members

### Pattern 2: Global Personal Tokens

**Global `~/.claude/settings.json`:**
```json
{
  "env": {
    "APIDOG_API_TOKEN": "personal-token-abc",
    "FIGMA_ACCESS_TOKEN": "figma-token-xyz",
    "OPENROUTER_API_KEY": "sk-or-v1-..."
  }
}
```

**Project `.claude/settings.json`:**
```json
{
  "env": {
    "APIDOG_PROJECT_ID": "team-project-123"
  }
}
```

**Why this works:**
- ✅ Tokens available in all projects
- ✅ Set once, use everywhere
- ✅ Project still configures project-specific values

### Pattern 3: Environment File

**Create `.env` in project root:**
```bash
APIDOG_API_TOKEN=personal-token-abc
APIDOG_PROJECT_ID=team-project-123
FIGMA_ACCESS_TOKEN=figma-token-xyz
OPENROUTER_API_KEY=sk-or-v1-...
```

**Add to `.gitignore`:**
```
.env
```

**Load in `.claude/settings.json`:**
```json
{
  "env": {
    "APIDOG_API_TOKEN": "${APIDOG_API_TOKEN}",
    "APIDOG_PROJECT_ID": "${APIDOG_PROJECT_ID}",
    "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}",
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}"
  }
}
```

## Troubleshooting

### MCP Server Not Appearing in `/mcp`

**Check 1: Environment variables set?**
```bash
# In Claude Code
/config

# Look for env variables in settings
```

**Check 2: Plugin enabled?**
```bash
/plugin list

# Should show: frontend@mag-claude-plugins ✓ enabled
```

**Check 3: MCP server logs**
```bash
# Check Claude Code logs for MCP errors
# Usually in ~/.claude/logs/
```

### "Connection Failed" Error

**Apidog:**
- Verify `APIDOG_API_TOKEN` is correct
- Verify `APIDOG_PROJECT_ID` exists and you have access
- Check https://apidog.com to confirm project is accessible

**Figma:**
- Verify `FIGMA_ACCESS_TOKEN` is valid
- Token might have expired - generate new one
- Check token has correct scopes

### MCP Server Starts But No Tools Available

This usually means the server started but configuration is incomplete:
- For Apidog: Need both token AND project ID
- For Figma: Need valid access token

## Security Best Practices

### DO ✅

- Store secrets in `.claude/settings.local.json` (gitignored)
- Store project IDs in `.claude/settings.json` (committed)
- Use personal access tokens, not shared team tokens
- Rotate tokens regularly
- Use tokens with minimal required scopes

### DON'T ❌

- Commit tokens to git
- Share tokens between team members
- Use admin/full-access tokens when limited scope works
- Store tokens in global settings for project-specific use

## Example: Complete Setup for Team

**1. Team lead sets up project**

`.claude/settings.json`:
```json
{
  "env": {
    "APIDOG_PROJECT_ID": "abc123xyz"
  },
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true
  }
}
```

`.gitignore`:
```
.claude/settings.local.json
.env
```

Commit and push.

**2. Team members clone and add personal tokens**

Each developer creates `.claude/settings.local.json`:
```json
{
  "env": {
    "APIDOG_API_TOKEN": "their-personal-token",
    "FIGMA_ACCESS_TOKEN": "their-figma-token"
  }
}
```

**3. Everyone has working MCP servers**

- ✅ Shared project configuration
- ✅ Personal tokens stay private
- ✅ No secrets in git
- ✅ Consistent experience across team
