---
name: worktree
description: Manage git worktrees - create isolated workspaces, list active worktrees, and clean up
allowed-tools: Bash, Read, AskUserQuestion, Glob, Grep
skills: dev:worktree-lifecycle
---

<role>
  <identity>Worktree Management Command</identity>
  <expertise>
    - Git worktree operations
    - Workspace lifecycle management
    - Safety checks and error recovery
  </expertise>
  <mission>
    Provide a simple interface for managing git worktrees following the
    dev:worktree-lifecycle skill's 6-phase approach.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  Parse $ARGUMENTS to determine subcommand:

  <subcommand name="create">
    **Usage:** `/dev:worktree create [branch-name]`

    Create a new worktree following the dev:worktree-lifecycle skill phases 1-5.

    Steps:
    1. If branch-name not provided, ask user for branch name
    2. Use AskUserQuestion to ask for worktree directory (or use .worktrees/ default)
    3. Execute Phase 1: Pre-flight Checks
       - Verify git repository
       - Check branch availability
       - Check path availability
    4. Execute Phase 2: Directory Selection (use provided or ask)
    5. Execute Phase 3: Creation
       - Verify .gitignore
       - Create worktree with `git worktree add`
       - Store original CWD
    6. Execute Phase 4: Setup
       - Detect stacks (nodejs, rust, golang, python, ruby)
       - Install dependencies for each stack
       - Run baseline tests
    7. Execute Phase 5: Handoff
       - Display worktree information
       - Show path, branch, stacks, test results
    8. Write worktree context marker for statusline persistence
       - Get Claude Code session ID (if available from environment or session context)
       - Write marker file to `~/.claude/.statusline-worktree-{SESSION_ID}`:
         ```json
         {
           "worktree_path": ".worktrees/{slug}",
           "branch": "{branch-name}",
           "worktree_name": "{slug}"
         }
         ```
       - This marker survives context compaction and ensures the statusline
         continues showing worktree info after long-running operations

    Output format:
    ```
    Worktree created successfully!

    Path: .worktrees/{slug}
    Branch: {branch-name}
    Stacks: {detected-stacks}
    Tests: {passing} passing, {failing} failing

    To work in this worktree:
      cd .worktrees/{slug}

    To clean up later:
      /dev:worktree cleanup .worktrees/{slug}
    ```
  </subcommand>

  <subcommand name="list">
    **Usage:** `/dev:worktree list`

    Show all active worktrees in this repository.

    Steps:
    1. Run `git worktree list --porcelain`
    2. Parse output to extract:
       - Worktree path
       - Branch name
       - HEAD commit
       - Locked status
    3. Format as table:

    ```
    Active Worktrees:

    Path                          Branch              Commit
    ────────────────────────────────────────────────────────────
    /path/to/project              main                abc1234
    /path/to/.worktrees/feature   feature/auth        def5678
    /path/to/.worktrees/hotfix    hotfix/login        ghi9012
    ```

    If no worktrees besides main:
    ```
    No additional worktrees found.
    Only main worktree is active.

    Create a worktree with: /dev:worktree create [branch-name]
    ```
  </subcommand>

  <subcommand name="cleanup">
    **Usage:** `/dev:worktree cleanup [path]`

    Remove a worktree following dev:worktree-lifecycle Phase 6.

    Steps:
    1. If path not provided, list available worktrees and ask which to clean up
    2. Execute Phase 6 cleanup:
       - Return to original CWD if currently in worktree
       - Check for uncommitted changes
       - If uncommitted changes:
         Use AskUserQuestion:
           question: "Uncommitted changes found. How to proceed?"
           options:
             - Commit now
             - Stash changes
             - Discard changes
             - Abort cleanup
       - Remove worktree with `git worktree remove`
       - Remove statusline worktree marker: `rm -f ~/.claude/.statusline-worktree-*`
         (clean all markers for this project to avoid stale files)
       - Optionally delete branch (only if merged)

    Safety checks:
    - NEVER use `rm -rf` on worktree directories
    - ALWAYS use `git worktree remove`
    - Check for uncommitted changes before removing
    - Warn if branch is not merged

    Output format:
    ```
    Worktree removed: .worktrees/{slug}
    Branch status: {merged | unmerged}

    {if merged}
    Branch deleted: {branch-name}
    {else}
    Branch kept: {branch-name} (not merged to main)
    To delete: git branch -D {branch-name}
    {end}
    ```
  </subcommand>

  <subcommand name="status">
    **Usage:** `/dev:worktree status`

    Show current worktree information.

    Steps:
    1. Get current working directory
    2. Run `git worktree list` to find all worktrees
    3. Determine which worktree contains current directory
    4. Get branch information with `git branch --show-current`
    5. Get commit with `git rev-parse --short HEAD`
    6. Check for uncommitted changes with `git status --porcelain`

    Output format:
    ```
    Current Worktree:
      Path: /path/to/current/worktree
      Branch: {branch-name}
      Commit: {short-sha}
      Status: {clean | uncommitted changes}

    {if uncommitted}
      Modified files: {count}
      Untracked files: {count}
    {end}

    All Worktrees: {total-count}
    To see all: /dev:worktree list
    ```

    If not in a worktree:
    ```
    Not in a git worktree.
    Current directory is the main working tree.

    Create a worktree with: /dev:worktree create [branch-name]
    ```
  </subcommand>

  <subcommand name="help">
    **Usage:** `/dev:worktree` or `/dev:worktree help`

    Show help message when no arguments provided or "help" requested.

    Output:
    ```
    Git Worktree Management

    Commands:
      create [branch]    Create new isolated worktree
      list               Show all active worktrees
      cleanup [path]     Remove worktree and optionally delete branch
      status             Show current worktree information
      help               Show this help message

    Examples:
      /dev:worktree create feature/auth-system
      /dev:worktree list
      /dev:worktree cleanup .worktrees/auth-system
      /dev:worktree status

    See dev:worktree-lifecycle skill for detailed documentation.
    ```
  </subcommand>

  <error_handling>
    If subcommand not recognized:
    ```
    Unknown subcommand: {subcommand}

    Available commands: create, list, cleanup, status, help
    Use: /dev:worktree help
    ```

    If git command fails:
    ```
    Error: {error-message}

    This may be because:
    - Not in a git repository
    - Worktree path doesn't exist
    - Branch is already checked out elsewhere
    - Insufficient permissions

    Check git status and try again.
    ```
  </error_handling>
</instructions>

<formatting>
  <communication_style>
    - Be concise and actionable
    - Show clear success/error messages
    - Provide next steps after each operation
    - Use tables for list output
    - Highlight safety warnings
  </communication_style>
</formatting>
