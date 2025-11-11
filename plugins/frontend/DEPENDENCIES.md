# Frontend Development Plugin - Dependencies

Complete list of all dependencies, CLI tools, and environment variables required for this plugin.

## Required Dependencies

### 1. Node.js & Package Manager

**Required for:** MCP servers, npm packages

```bash
# Check if installed
node --version   # Required: v18+ or v20+
npm --version    # Required: v9+
npx --version    # Required: v9+

# Or pnpm
pnpm --version   # Alternative to npm
```

**Install:**
```bash
# macOS
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows
# Download from nodejs.org
```

### 2. Chrome Browser

**Required for:** `tester` agent, `browser-debugger` skill

**Why:** Browser-based UI testing via Chrome DevTools

```bash
# Check if installed
which google-chrome || which chrome

# macOS
brew install --cask google-chrome

# Ubuntu/Debian
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb

# Windows
# Download from google.com/chrome
```

### 3. Git

**Required for:** All agents, project management

```bash
# Check if installed
git --version

# macOS
brew install git

# Ubuntu/Debian
sudo apt install git
```

### 4. Codex CLI (Optional but Recommended)

**Required for:** `codex-reviewer` agent

**What it does:** AI-powered code review using Codex

```bash
# Check if installed
codex --version

# Install (if using Codex)
# Visit: https://github.com/anthropics/codex-cli
# Or install via npm:
npm install -g @anthropic-ai/codex-cli
```

**Note:** If Codex CLI is not installed, `codex-reviewer` agent will gracefully degrade to using `reviewer` instead.

## Environment Variables

### MCP Server Configuration

The plugin includes four MCP servers that **auto-load** when enabled. Configuration is done via environment variables in `.claude/settings.json`.

#### Configuration Pattern

**Personal secrets** → `.claude/settings.local.json` (gitignored)
**Project values** → `.claude/settings.json` (committed)

#### 1. Apidog MCP Server

**Required:**
- `APIDOG_API_TOKEN` (secret, personal) - Your Apidog API token
- `APIDOG_PROJECT_ID` (project-specific, shared) - Team's project ID

**Get your token:** https://apidog.com/settings/tokens

**Setup:**

Personal `.claude/settings.local.json`:
```json
{
  "env": {
    "APIDOG_API_TOKEN": "your-personal-apidog-token"
  }
}
```

Project `.claude/settings.json`:
```json
{
  "env": {
    "APIDOG_PROJECT_ID": "your-team-project-id"
  }
}
```

#### 2. Figma MCP Server

**Required:**
- `FIGMA_ACCESS_TOKEN` (secret, personal) - Your Figma access token

**Get your token:** https://www.figma.com/developers/api#access-tokens

**Setup:**

Personal `.claude/settings.local.json`:
```json
{
  "env": {
    "FIGMA_ACCESS_TOKEN": "your-personal-figma-token"
  }
}
```

#### 3. Chrome DevTools MCP Server

**No configuration required** - Works out of the box!

**What it provides:**
- Launch and control Chrome browser
- Inspect DOM and CSS
- Debug responsive layouts
- Capture screenshots
- Analyze performance

**Used by:** `ui-manual-tester` agent, `browser-debugger` skill, `/implement` and `/validate-ui` commands

#### 4. Claudish CLI (External AI Models)

**Required:**
- Claudish installed (`npx claudish --help` to verify)
- `OPENROUTER_API_KEY` (secret, personal) - Your OpenRouter API key

**Get your key:** https://openrouter.ai/keys

**What it provides:**
- Call external AI models (Codex, Grok, GPT-5, MiniMax, Qwen)
- Expert code reviews
- UI/UX design validation
- Technical analysis

**Setup:**

Add to your shell profile (~/.zshrc or ~/.bashrc):
```bash
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

**See also:** `/mcp/claudish/README.md` for detailed usage

### Optional Environment Variables

#### Chrome DevTools Configuration

**Variable:** `CHROME_EXECUTABLE_PATH`
**Purpose:** Custom Chrome installation path
**Default:** Auto-detected

```bash
# Only needed if Chrome is in non-standard location
export CHROME_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

#### Codex Configuration

**Variable:** `CODEX_API_KEY`
**Purpose:** API key for Codex CLI (if using paid tier)
**Default:** Not required for basic usage

```bash
export CODEX_API_KEY="your-codex-api-key"
```

## Quick Setup Example

**Recommended: Personal tokens + Project configuration**

Project `.claude/settings.json` (committed to git):
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

Personal `.claude/settings.local.json` (gitignored):
```json
{
  "env": {
    "APIDOG_API_TOKEN": "your-personal-token",
    "FIGMA_ACCESS_TOKEN": "your-figma-token",
    "OPENROUTER_API_KEY": "sk-or-v1-your-key"
  }
}
```

**That's it!** MCP servers auto-load from the plugin when you have the required environment variables set.

## MCP Servers

### Auto-Loaded by Plugin

These MCP servers are included with the plugin and **automatically start** when you enable the plugin:

| MCP Server | Required By | Env Vars Required |
|------------|-------------|-------------------|
| **apidog** | api-analyst, /api-docs | APIDOG_API_TOKEN, APIDOG_PROJECT_ID |
| **figma** | /import-figma | FIGMA_ACCESS_TOKEN |

**No manual installation needed!** The plugin handles MCP server configuration automatically.

**Setup:** Add environment variables to `.claude/settings.json` or `.claude/settings.local.json` (see Quick Setup Example above).

**Note:** MCP servers are installed on-demand by `npx` when first used. No pre-installation required.

## Setup Instructions

### Quick Setup (New Developer)

1. **Install system dependencies:**
   ```bash
   # macOS
   brew install node git
   brew install --cask google-chrome

   # Ubuntu/Debian
   sudo apt install nodejs git google-chrome-stable
   ```

2. **Clone project:**
   ```bash
   git clone your-project-repo
   cd your-project-repo
   ```

3. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

4. **Get personal tokens:**
   - Apidog: https://app.apidog.com/settings/tokens
   - Figma: https://www.figma.com/settings → Personal Access Tokens
   - GitHub: https://github.com/settings/tokens

5. **Edit .env with your tokens:**
   ```bash
   nano .env
   # Add your personal tokens
   ```

6. **Load environment:**
   ```bash
   source .env
   ```

7. **Verify setup:**
   ```bash
   /configure-mcp apidog
   # Should show: ✅ Configuration valid
   ```

### Environment Variable Setup Methods

#### Method 1: Shell RC File (Permanent)

```bash
# Add to ~/.zshrc or ~/.bashrc
echo 'export APIDOG_API_TOKEN="your-token"' >> ~/.zshrc
echo 'export FIGMA_ACCESS_TOKEN="your-token"' >> ~/.zshrc
source ~/.zshrc
```

**Pros:** Permanent, works across all terminals
**Cons:** Tokens in plaintext in RC file

#### Method 2: .env File (Project-specific)

```bash
# Create .env in project root (add to .gitignore!)
cat > .env <<EOF
APIDOG_API_TOKEN=your-token
FIGMA_ACCESS_TOKEN=your-token
GITHUB_PERSONAL_ACCESS_TOKEN=your-token
EOF

# Load when needed
source .env
```

**Pros:** Project-specific, easy to manage
**Cons:** Must source .env in each new terminal

#### Method 3: direnv (Automatic)

```bash
# Install direnv
brew install direnv  # macOS
sudo apt install direnv  # Ubuntu

# Add to ~/.zshrc
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc

# Create .envrc in project (add to .gitignore!)
cat > .envrc <<EOF
export APIDOG_API_TOKEN=your-token
export FIGMA_ACCESS_TOKEN=your-token
EOF

# Allow direnv
direnv allow
```

**Pros:** Automatic loading when entering directory
**Cons:** Requires direnv installation

#### Method 4: Keychain/Password Manager

```bash
# macOS Keychain
security add-generic-password \
  -s "APIDOG_API_TOKEN" \
  -a "$USER" \
  -w "your-token"

# Retrieve in script
export APIDOG_API_TOKEN=$(security find-generic-password \
  -s "APIDOG_API_TOKEN" -a "$USER" -w)
```

**Pros:** Encrypted storage
**Cons:** Platform-specific

## Verification Checklist

### System Dependencies

```bash
# Check Node.js
node --version    # Should be v18+ or v20+
npm --version     # Should be v9+
npx --version     # Should be v9+

# Check Git
git --version     # Any recent version

# Check Chrome
which google-chrome || which chrome  # Should find Chrome

# Check Codex (optional)
codex --version   # Only if using codex agent
```

### Environment Variables

```bash
# Check required vars
echo $APIDOG_API_TOKEN        # Should show your token
echo $FIGMA_ACCESS_TOKEN      # Should show your token

# Check optional vars
echo $GITHUB_PERSONAL_ACCESS_TOKEN  # If using GitHub
```

### MCP Server Connectivity

```bash
# Test Apidog
npx -y @apidog/mcp-server \
  --project-id 2847593 \
  --token $APIDOG_API_TOKEN \
  --test-connection

# Test Figma
npx -y @modelcontextprotocol/server-figma \
  --token $FIGMA_ACCESS_TOKEN \
  --test

# Test Chrome DevTools
npx -y @modelcontextprotocol/server-chrome-devtools \
  --version
```

### Plugin Installation

```bash
# Verify plugin installed
/plugin list

# Should show:
# ✅ frontend@mag-claude-plugins
```

## Troubleshooting

### Issue: "npx command not found"

**Solution:** Install Node.js
```bash
brew install node  # macOS
sudo apt install nodejs  # Ubuntu
```

### Issue: "Chrome DevTools connection failed"

**Solution:** Ensure Chrome is installed and accessible
```bash
# macOS
brew install --cask google-chrome

# Check Chrome path
which google-chrome

# Set custom path if needed
export CHROME_EXECUTABLE_PATH="/path/to/chrome"
```

### Issue: "Apidog MCP connection failed: 401 Unauthorized"

**Solution:** Check token is valid
```bash
# Verify token is set
echo $APIDOG_API_TOKEN

# Regenerate token at:
# https://app.apidog.com/settings/tokens
```

### Issue: "Figma MCP connection failed"

**Solution:** Verify Figma token
```bash
# Check token
echo $FIGMA_ACCESS_TOKEN

# Test manually
curl -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
  https://api.figma.com/v1/me
```

### Issue: "Codex agent not working"

**Solution:** Install Codex CLI (optional)
```bash
npm install -g @anthropic-ai/codex-cli
codex --version
```

**Alternative:** Use regular code reviewer instead:
- The plugin will automatically fall back to `reviewer` if Codex is not available

## Environment Template (.env.example)

Create this file in your project root and commit it:

```bash
# .env.example - Template for required environment variables
# Copy to .env and fill in your personal tokens
# IMPORTANT: Add .env to .gitignore!

# Required for Apidog MCP server
# Get from: https://app.apidog.com/settings/tokens
APIDOG_API_TOKEN=your-personal-apidog-token-here

# Required for Figma MCP server
# Get from: https://www.figma.com/settings (Personal Access Tokens)
FIGMA_ACCESS_TOKEN=your-personal-figma-token-here

# Optional: GitHub MCP server
# Get from: https://github.com/settings/tokens
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your-github-token-here

# Optional: Custom Chrome path (usually auto-detected)
# CHROME_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

# Optional: Codex API key (if using paid tier)
# CODEX_API_KEY=your-codex-api-key-here
```

## .gitignore Template

Ensure these are in your `.gitignore`:

```bash
# Environment variables (NEVER commit!)
.env
.env.local
.envrc

# Claude Code local settings (NEVER commit!)
.claude/settings.local.json

# Secrets (NEVER commit!)
**/*.secret.json
**/*.credentials.json
```

## Summary

**Minimum Required:**
- ✅ Node.js v18+ with npm/npx
- ✅ Git
- ✅ Chrome browser
- ✅ `APIDOG_API_TOKEN` environment variable
- ✅ `FIGMA_ACCESS_TOKEN` environment variable

**Optional but Recommended:**
- Codex CLI (for codex-powered code review)
- `GITHUB_PERSONAL_ACCESS_TOKEN` (for GitHub operations)

**Time to set up:** 10-15 minutes for new developers ✅
