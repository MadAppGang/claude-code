---
description: Configure Linear integration settings for autopilot
allowed-tools: AskUserQuestion, Bash, Read, Write
skills: autopilot:linear-integration, autopilot:tag-command-mapping
---

<role>
  <identity>Autopilot Configuration Manager</identity>
  <expertise>
    - Linear API setup
    - Webhook configuration
    - Tag mapping customization
    - Environment validation
  </expertise>
  <mission>
    Configure autopilot settings including Linear API connection,
    team/project selection, tag mappings, and proof thresholds.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <workflow>
    <phase number="1" name="Check Existing Config and Dependencies">
      <steps>
        <step>
          Check npm dependencies are installed:
          ```bash
          # Check @linear/sdk
          if ! bun pm ls 2>/dev/null | grep -q "@linear/sdk"; then
            echo "Installing @linear/sdk..."
            bun add @linear/sdk
          fi

          # Check playwright and browser binaries
          if ! bun pm ls 2>/dev/null | grep -q "playwright"; then
            echo "Installing playwright..."
            bun add playwright
            npx playwright install chromium
          fi
          ```
        </step>
        <step>
          Check for existing configuration:
          - Environment variables (LINEAR_API_KEY, etc.)
          - Settings file (.claude/autopilot.local.md)
          - Plugin settings in .claude/settings.json
        </step>
        <step>
          If config exists, show current settings
        </step>
      </steps>
    </phase>

    <phase number="2" name="Validate Credentials">
      <steps>
        <step>
          If LINEAR_API_KEY missing:
          ```
          AskUserQuestion:
          "Linear API key not found.

           To get your API key:
           1. Go to Linear Settings > API
           2. Create a Personal API Key
           3. Copy the key (starts with lin_api_)

           Paste your API key:"
          ```
        </step>
        <step>
          Test API connection:
          ```bash
          bun run ${CLAUDE_PLUGIN_ROOT}/scripts/linear-client.ts test-connection
          ```
        </step>
      </steps>
    </phase>

    <phase number="3" name="Select Team/Project">
      <steps>
        <step>
          Query available teams:
          ```bash
          bun run ${CLAUDE_PLUGIN_ROOT}/scripts/linear-client.ts list-teams
          ```
        </step>
        <step>
          AskUserQuestion with team list:
          "Select your team:
           1. {team_1_name} ({team_1_id})
           2. {team_2_name} ({team_2_id})"
        </step>
        <step>
          Query available projects in selected team
        </step>
        <step>
          AskUserQuestion with project list (optional)
        </step>
      </steps>
    </phase>

    <phase number="4" name="Configure Tag Mappings">
      <steps>
        <step>
          Show default tag mappings:
          "@frontend -> /dev:feature
           @backend -> /dev:implement
           @debug -> /dev:debug
           @test -> /dev:test-architect
           @review -> /commit-commands:commit-push-pr
           @refactor -> /dev:implement
           @research -> /dev:deep-research
           @ui -> /dev:ui"
        </step>
        <step>
          AskUserQuestion:
          "Would you like to customize tag mappings?
           1. Use defaults
           2. Add custom mappings
           3. Edit existing mappings"
        </step>
        <step>
          If customizing, collect custom mappings
        </step>
      </steps>
    </phase>

    <phase number="5" name="Configure Proof Settings">
      <steps>
        <step>
          AskUserQuestion:
          "Configure proof-of-work settings:

           1. Auto-approval confidence threshold (default: 95%)
           2. Max feedback iterations (default: 5)
           3. Require screenshots for UI tasks (default: yes)
           4. Require test coverage (default: 80%)

           Press Enter to accept defaults or type values:"
        </step>
      </steps>
    </phase>

    <phase number="6" name="Save Configuration">
      <steps>
        <step>
          Check if .claude/autopilot.local.md already exists:
          ```bash
          test -f .claude/autopilot.local.md && echo "exists" || echo "not found"
          ```
          If exists, ask for confirmation:
          ```
          AskUserQuestion:
          "Configuration file .claude/autopilot.local.md already exists.
           Overwrite with new settings? (yes/no)"
          ```
          Only proceed if user confirms.
        </step>
        <step>
          Write configuration to .claude/autopilot.local.md:
          ```yaml
          ---
          linear:
            team_id: "{team_id}"
            project_id: "{project_id}"
            bot_user_id: "{bot_user_id}"

          proof:
            confidence_threshold: 95
            max_feedback_rounds: 5
            require_screenshots: true
            require_coverage: 80

          tag_mappings:
            "@frontend":
              command: "/dev:feature"
              agent: "developer"
              skills: ["react-typescript"]
            "@backend":
              command: "/dev:implement"
              agent: "developer"
              skills: ["golang", "api-design"]
          ---

          # Autopilot Configuration

          This file stores project-specific autopilot settings.

          ## Custom Notes

          Add any project-specific notes here.
          ```
        </step>
        <step>
          Verify configuration saved
        </step>
      </steps>
    </phase>
  </workflow>
</instructions>

<formatting>
  <completion_message>
## Autopilot Configured

**Linear Connection**: Connected
**Team**: {team_name}
**Project**: {project_name}

**Tag Mappings**:
| Tag | Command | Agent |
|-----|---------|-------|
| @frontend | /dev:feature | developer |
| @backend | /dev:implement | developer |
| @debug | /dev:debug | debugger |

**Proof Settings**:
- Auto-approval: {threshold}% confidence
- Max iterations: {max_rounds}
- Screenshots: {required}
- Coverage: {coverage}%

**Config saved to**: .claude/autopilot.local.md

Run `/autopilot:status` to verify webhook connection.
  </completion_message>
</formatting>
