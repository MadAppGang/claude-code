---
name: worktree-lifecycle
description: "Use when starting isolated feature work or before executing implementation plans. Manages full worktree lifecycle from creation through cleanup with safety checks and error recovery."
keywords: [worktree, git, isolation, feature-branch, parallel-development, workspace, cleanup, lifecycle, worktrees]
created: 2026-02-11
updated: 2026-02-11
plugin: dev
type: discipline
difficulty: intermediate
---

# Worktree Lifecycle

**Purpose:** Manage git worktrees for isolated feature work with safety checks, multi-stack setup, and clean lifecycle management.

## When to Use

This skill applies whenever you:
- Start a new feature that requires isolated workspace
- Execute risky or experimental changes
- Need to keep current work untouched while testing alternatives
- Coordinate parallel agent work (each agent in separate worktree)
- Follow an implementation plan requiring clean environment
- Preserve long-running feature work across sessions

**Trigger keywords:** experiment, prototype, risky, breaking, parallel, isolate, worktree, workspace

## Red Flags (Anti-Patterns)

- [ ] Creating worktree without checking if branch already exists
- [ ] Creating worktree without checking if directory path is available
- [ ] Forgetting to add worktree directory to .gitignore
- [ ] Manually deleting worktree with `rm -rf` (use `git worktree remove`)
- [ ] Removing worktree with uncommitted changes without user confirmation
- [ ] Using same branch in multiple worktrees simultaneously
- [ ] Working in worktree after returning to main directory (stale CWD)
- [ ] Not storing original CWD before entering worktree
- [ ] Skipping dependency installation in new worktree
- [ ] Not running baseline tests before starting work

## 6-Phase Lifecycle

### Phase 1: Pre-flight Checks

**Purpose:** Verify all prerequisites before creating anything.

**Required checks** (all must pass):

```bash
# 1. Verify git repository
git rev-parse --git-dir &>/dev/null
if [ $? -ne 0 ]; then
  ERROR: "Not a git repository"
  RECOVERY: Abort with clear error message
fi

# 2. Detect detached HEAD state
if ! git symbolic-ref HEAD &>/dev/null; then
  WARNING: "Currently in detached HEAD state"
  RECOVERY: Ask user if they want to create branch from current commit
fi

# 3. Check if branch already in a worktree
if git worktree list | grep -q "$BRANCH"; then
  ERROR: "Branch $BRANCH already checked out in a worktree"
  RECOVERY: Ask user - reuse existing, rename branch, or cancel
fi

# 4. Check if branch exists (but not in worktree)
if git branch --list "$BRANCH" | grep -q .; then
  WARNING: "Branch $BRANCH already exists"
  RECOVERY: Ask user - use existing branch or create new with different name
fi

# 5. Check if target path is available
# IMPORTANT: Create directory first before checking (git check-ignore needs path to exist)
mkdir -p "$WORKTREE_DIR"
if [ -d "$WORKTREE_PATH" ]; then
  ERROR: "Directory $WORKTREE_PATH already exists"
  RECOVERY: Ask user - choose different path or remove existing
fi
```

**Error Recovery Table:**

| Error | Detection | Recovery |
|-------|-----------|----------|
| Not a git repo | `git rev-parse --git-dir` fails | Abort with clear error |
| Detached HEAD | `git symbolic-ref HEAD` fails | Ask: create branch from commit? |
| Branch in worktree | `git worktree list \| grep $BRANCH` succeeds | Ask: reuse, rename, or cancel |
| Branch exists | `git branch --list $BRANCH` returns result | Ask: use existing or rename |
| Path exists | Directory already present | Ask: choose different path or remove |
| Parent not writable | Cannot create parent directory | Abort with permission error |

### Phase 2: Directory Selection

**Priority order** (cascading, first match wins):

1. **Check for existing `.worktrees/` directory** → use it (no prompt)
2. **Check for existing `worktrees/` directory** → use it (no prompt)
3. **Check CLAUDE.md for worktree preference** → follow it (no prompt)
4. **Ask user** (only if no default found)

**For orchestrator integration**: Pass `WORKTREE_DIR=".worktrees"` to skip this phase entirely.

**Example detection**:
```bash
if [ -d ".worktrees" ]; then
  WORKTREE_DIR=".worktrees"
elif [ -d "worktrees" ]; then
  WORKTREE_DIR="worktrees"
elif grep -q "worktree.*directory" CLAUDE.md 2>/dev/null; then
  WORKTREE_DIR=$(grep "worktree.*directory" CLAUDE.md | extract_path)
else
  # Ask user via AskUserQuestion
  # Options: .worktrees/, worktrees/, custom
fi
```

### Phase 3: Creation

**Steps** (must be executed in order):

```bash
# 1. Verify .gitignore safety
# IMPORTANT: Directory must exist before git check-ignore
mkdir -p "$WORKTREE_DIR"

if ! git check-ignore -q "$WORKTREE_DIR" 2>/dev/null; then
  echo "$WORKTREE_DIR/" >> .gitignore
  git add .gitignore
  git commit -m "chore: add $WORKTREE_DIR to .gitignore"
fi

# 2. Store original CWD (critical for Phase 6 cleanup)
ORIGINAL_CWD=$(pwd)

# 3. Create worktree
git worktree add "$WORKTREE_PATH" -b "$BRANCH"

# 4. Verify creation succeeded
if [ ! -d "$WORKTREE_PATH" ]; then
  ERROR: "Worktree creation failed"
  RECOVERY: Clean up any partial state, report error
  exit 1
fi

# 5. Change to worktree directory
cd "$WORKTREE_PATH"

# 6. Initialize submodules (if any)
if [ -f .gitmodules ]; then
  git submodule update --init --recursive
fi

# 7. Write statusline worktree marker (persists across compaction)
if [ -n "$SESSION_ID" ]; then
  cat > "$HOME/.claude/.statusline-worktree-${SESSION_ID}" <<MARKER_EOF
{
  "worktree_path": "$WORKTREE_PATH",
  "branch": "$BRANCH",
  "worktree_name": "$(basename "$WORKTREE_PATH")"
}
MARKER_EOF
fi
```

**Error handling**: If `git worktree add` fails, clean up any partial state and report the error to user.

### Phase 4: Setup

**Multi-stack detection**:

```bash
# Detect all present stacks
STACKS=()
[ -f package.json ] && STACKS+=("nodejs")
[ -f Cargo.toml ] && STACKS+=("rust")
[ -f go.mod ] && STACKS+=("golang")
[ -f pyproject.toml ] || [ -f requirements.txt ] && STACKS+=("python")
[ -f Gemfile ] && STACKS+=("ruby")

# Run setup for each detected stack
for stack in "${STACKS[@]}"; do
  echo "Setting up $stack..."
  case "$stack" in
    nodejs)
      if [ -f bun.lockb ]; then
        bun install
      elif [ -f pnpm-lock.yaml ]; then
        pnpm install
      elif [ -f yarn.lock ]; then
        yarn install
      else
        npm install
      fi
      ;;
    rust)
      cargo build
      ;;
    golang)
      go mod download
      ;;
    python)
      if [ -f pyproject.toml ]; then
        pip install -e .
      else
        pip install -r requirements.txt
      fi
      ;;
    ruby)
      bundle install
      ;;
  esac
done
```

**Baseline test verification**:

```bash
# Run tests and capture output (allow pre-existing failures)
for stack in "${STACKS[@]}"; do
  case "$stack" in
    nodejs)
      if [ -f bun.lockb ]; then
        bun test 2>&1 | tee test-output.log
      else
        npm test 2>&1 | tee test-output.log
      fi
      ;;
    rust)
      cargo test 2>&1 | tee test-output.log
      ;;
    golang)
      go test ./... 2>&1 | tee test-output.log
      ;;
    python)
      pytest 2>&1 | tee test-output.log
      ;;
  esac

  # Parse test results (do NOT block on pre-existing failures)
  PASSING=$(grep -o '[0-9]* passing' test-output.log | cut -d' ' -f1)
  FAILING=$(grep -o '[0-9]* failing' test-output.log | cut -d' ' -f1)

  echo "Baseline tests: $PASSING passing, $FAILING failing"
  if [ "${FAILING:-0}" -gt 0 ]; then
    echo "WARNING: Pre-existing test failures detected. Proceed with caution."
  fi
done
```

### Phase 5: Handoff

**Structured output for orchestrator**:

```
Worktree ready:
  Path: .worktrees/feature-auth-system
  Branch: feature/auth-system
  Stacks: nodejs
  Dependencies: installed
  Tests: 47 passing, 0 failing
  Status: READY

Original CWD: /path/to/project
Worktree CWD: /path/to/project/.worktrees/feature-auth-system
```

**Write metadata to session** (for cleanup phase):

```bash
cat > "${SESSION_PATH}/worktree-metadata.json" <<EOF
{
  "worktreePath": "$WORKTREE_PATH",
  "absolutePath": "$(realpath $WORKTREE_PATH)",
  "branchName": "$BRANCH",
  "originalCwd": "$ORIGINAL_CWD",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "stacks": $(printf '%s\n' "${STACKS[@]}" | jq -R . | jq -s .),
  "baselineTests": {
    "passing": ${PASSING:-0},
    "failing": ${FAILING:-0}
  },
  "status": "active"
}
EOF
```

**Orchestrator context passing** (for dev:developer):

```
SESSION_PATH: ${SESSION_PATH}
WORKTREE_PATH: ${WORKTREE_PATH}
BRANCH_NAME: ${BRANCH_NAME}
ORIGINAL_CWD: ${ORIGINAL_CWD}

IMPORTANT: You are working in an isolated worktree.
- cd to WORKTREE_PATH before writing any code
- Session artifacts stay in SESSION_PATH (main worktree)
- When complete, return control to orchestrator for cleanup
```

### Phase 6: Cleanup

**Trigger conditions:**
- Orchestrator completion phase
- Explicit user request via `/dev:worktree cleanup`
- Error recovery (abort implementation)

**Steps** (with safety checks):

```bash
# 1. Verify worktree metadata exists
if [ ! -f "${SESSION_PATH}/worktree-metadata.json" ]; then
  ERROR: "No worktree metadata found"
  RECOVERY: Ask user for worktree path manually
fi

# Read metadata
WORKTREE_PATH=$(jq -r .worktreePath "${SESSION_PATH}/worktree-metadata.json")
ORIGINAL_CWD=$(jq -r .originalCwd "${SESSION_PATH}/worktree-metadata.json")
BRANCH=$(jq -r .branchName "${SESSION_PATH}/worktree-metadata.json")

# 2. Return to original CWD if currently in worktree
CURRENT_CWD=$(pwd)
if [[ "$CURRENT_CWD" == *"$WORKTREE_PATH"* ]]; then
  cd "$ORIGINAL_CWD"
fi

# 3. Check for uncommitted changes
cd "$WORKTREE_PATH"
if [ -n "$(git status --porcelain)" ]; then
  # Use AskUserQuestion to resolve
  echo "WARNING: Uncommitted changes detected in worktree"
  # Options: commit now, stash, discard, abort cleanup
  # DO NOT proceed until resolved
fi

# 4. Return to original CWD
cd "$ORIGINAL_CWD"

# 5. Remove worktree (NEVER use rm -rf)
git worktree remove "$WORKTREE_PATH"

# 6. Optionally delete branch (only if merged or user confirms)
if git branch --merged | grep -q "$BRANCH"; then
  git branch -d "$BRANCH"  # Safe delete (only if merged)
else
  # Ask user: keep branch or force delete?
  # git branch -D "$BRANCH"  # Force delete (only with confirmation)
fi

# 7. Update metadata status
jq '.status = "removed" | .removedAt = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"' \
  "${SESSION_PATH}/worktree-metadata.json" > "${SESSION_PATH}/worktree-metadata.json.tmp"
mv "${SESSION_PATH}/worktree-metadata.json.tmp" "${SESSION_PATH}/worktree-metadata.json"

# 8. Remove statusline worktree marker
if [ -n "$SESSION_ID" ]; then
  rm -f "$HOME/.claude/.statusline-worktree-${SESSION_ID}"
fi
```

**Error handling during cleanup:**

| Error | Detection | Recovery |
|-------|-----------|----------|
| Currently in worktree | CWD matches worktree path | Auto-return to original CWD |
| Uncommitted changes | `git status --porcelain` not empty | Ask user: commit/stash/discard |
| Worktree in use | `git worktree remove` fails | Ask: force removal with `--force`? |
| Branch not merged | `git branch -d` fails | Ask: keep branch or force delete? |
| Stale marker file | Marker exists but worktree removed | Auto-cleaned by statusline (marker ignored if worktree gone) |

## Error Recovery

**Critical errors** (abort workflow):
- Not a git repository
- Permission denied creating directory
- Git worktree creation fails without clear reason

**Recoverable errors** (ask user):
- Branch already exists → Use existing or rename
- Path already exists → Choose different path or remove
- Uncommitted changes during cleanup → Commit/stash/discard
- Tests fail during baseline → Proceed or abort

## Quick Reference Card

**Before starting isolated work:**

1. ✅ Run Pre-flight Checks (Phase 1)
   - Git repo valid
   - Branch available
   - Path available
2. ✅ Select or detect worktree directory (Phase 2)
3. ✅ Create worktree + verify .gitignore (Phase 3)
4. ✅ Install dependencies for all stacks (Phase 4)
5. ✅ Run baseline tests (Phase 4)
6. ✅ Store metadata and hand off to agent (Phase 5)

**After completing work:**

7. ✅ Return to original CWD if in worktree
8. ✅ Check for uncommitted changes → resolve
9. ✅ Remove worktree with `git worktree remove`
10. ✅ Optionally delete branch (only if merged or confirmed)

**Remember:** Always use `git worktree remove`, never `rm -rf`.

## Orchestrator Integration

### `/dev:feature` Integration

**Phase 0** (after session init):
- Add AskUserQuestion: "Create isolated worktree?"
- If yes: Run Phases 1-5, pass WORKTREE_PATH to all agents
- If no: Continue as normal

**Phase 8** (completion):
- If worktree created: Ask cleanup options (PR, merge, keep, discard)
- Execute Phase 6 with chosen option

### `/dev:implement` Integration

**Phase 1** (lightweight version):
- Add AskUserQuestion: "Use isolated worktree?"
- If yes: Run Phases 1-5 with defaults (no directory selection)
- Use `.worktrees/` automatically, skip multi-stack detection

**Phase 6** (finalization):
- If worktree created: Ask "Merge and clean up?"
- Execute Phase 6 with merge or keep option

### Subagent Context Template

When delegating to agents in worktrees, always include:

```
SESSION_PATH: ${SESSION_PATH}
WORKTREE_PATH: ${WORKTREE_PATH}
BRANCH_NAME: ${BRANCH_NAME}

IMPORTANT: You are working in an isolated worktree.
- cd to WORKTREE_PATH before writing any code
- Read from ${SESSION_PATH} for architecture/requirements
- Write code to WORKTREE_PATH (current branch: ${BRANCH_NAME})
- Session artifacts stay in ${SESSION_PATH} (main worktree)
```

## Integration with Other Skills

- **test-driven-development:** Baseline tests verify environment readiness
- **verification-before-completion:** Worktree cleanup requires clean state
- **systematic-debugging:** Isolated worktrees for reproducing bugs
- **context-detection:** Multi-stack detection feeds into setup phase
- **agent-coordination-discipline:** Parallel agents use separate worktrees
