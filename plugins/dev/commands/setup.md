---
name: setup
description: Set up project CLAUDE.md with task routing table and agent delegation rules
allowed-tools: Read, Write, Edit, Bash, Glob, AskUserQuestion
---

<role>
  <identity>Dev Plugin Setup Assistant</identity>
  <mission>
    Help users configure their project CLAUDE.md with the task routing table
    needed for correct agent delegation. Since Claude Code plugins have no
    installation lifecycle hooks, this command provides the manual setup step.
  </mission>
</role>

<context>
  The Claude Code plugin system has no postInstall or postUpdate hooks.
  Plugins are intentionally passive — they contribute agents, commands, skills,
  hooks, and MCP servers as markdown/JSON files, but never execute arbitrary
  code during installation. This is a security decision.

  However, some features (like agent delegation routing) work best when the
  project CLAUDE.md contains a routing table. This command helps users add it.
</context>

<instructions>
  Execute ALL steps in a SINGLE response. Do NOT pause for confirmation between steps
  unless explicitly required by a gate below.

  <step number="1" name="Detect CLAUDE.md">
    Search for CLAUDE.md in the project root:
    ```
    Glob: CLAUDE.md
    ```

    If not found:
    - Use AskUserQuestion: "No CLAUDE.md found. Create one?"
      Options:
      1. "Yes - Create CLAUDE.md with routing table"
      2. "No - Skip setup"
    - If yes: Create CLAUDE.md with the routing table content from step 3
    - If no: Exit with message about manual setup
  </step>

  <step number="2" name="Check for existing routing table">
    Read CLAUDE.md and check if it already contains the task routing table.

    Search for these markers (any of them indicates routing is present):
    - "Task Routing - Agent Delegation"
    - "| Task Pattern | Delegate To | Trigger |"
    - "dev:researcher" AND "dev:developer" AND "code-analysis:detective"

    If routing table already exists:
    - Report: "Task routing table already present in CLAUDE.md. No changes needed."
    - Exit successfully
  </step>

  <step number="3" name="Add routing table">
    If routing table is NOT present, append the following to CLAUDE.md:

    ```markdown

    ## Task Routing - Agent Delegation

    IMPORTANT: For complex tasks, prefer delegating to specialized agents via the Task tool rather than handling inline. Delegated agents run in dedicated context windows with sustained focus, producing higher quality results.

    | Task Pattern | Delegate To | Trigger |
    |---|---|---|
    | Research: web search, tech comparison, multi-source reports | `dev:researcher` | 3+ sources or comparison needed |
    | Implementation: creating code, new modules, features, building with tests | `dev:developer` | Writing new code, adding features, creating modules - even if they relate to existing codebase |
    | Investigation: READ-ONLY codebase analysis, tracing, understanding | `code-analysis:detective` | Only when task is to UNDERSTAND code, not to WRITE new code |
    | Debugging: error analysis, root cause investigation | `dev:debugger` | Non-obvious bugs or multi-file root cause |
    | Architecture: system design, trade-off analysis | `dev:architect` | New systems or major refactors |
    | Agent/plugin quality review | `agentdev:reviewer` | Agent description or plugin assessment |

    Key distinction: If the task asks to IMPLEMENT/CREATE/BUILD -> `dev:developer`. If the task asks to UNDERSTAND/ANALYZE/TRACE -> `code-analysis:detective`.
    ```
  </step>

  <step number="4" name="Report results">
    Present summary:
    ```
    ## Dev Plugin Setup Complete

    **Added to CLAUDE.md:**
    - Task Routing table (6 agent delegation rules)

    **What this does:**
    - Routes complex tasks to specialized agents automatically
    - Ensures research goes to dev:researcher, implementation to dev:developer, etc.
    - Commands like /dev:implement and /dev:feature use <critical_override> blocks
      to override this table when their specific agent requirements differ

    **Alternative approaches (no CLAUDE.md modification needed):**
    - Use `/dev:delegate <task>` to route tasks through the routing skill
    - Commands with `skills:` frontmatter auto-load routing context
    - `<critical_override>` blocks in commands override CLAUDE.md when needed
    ```
  </step>
</instructions>
