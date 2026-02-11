#!/bin/bash
# Git Worktree Lifecycle Functional Test Runner
# Tests actual git worktree operations to validate the worktree lifecycle
# that the dev:worktree-lifecycle skill will use.
#
# Usage:
#   ./autotest/worktree/run-tests.sh [OPTIONS]
#
# Options:
#   --suite <name>      Run specific test suite (lifecycle, preflight, directory, cleanup, multiworktree, edge_cases)
#   --test <id>         Run specific test by ID (e.g., lifecycle-01)
#   --keep-temp         Don't clean up temp directories (for debugging)
#   --verbose           Show detailed command output
#   --dry-run           Show what would be run without executing
#   --help              Show this help message

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="$SCRIPT_DIR/results/run-$TIMESTAMP"
KEEP_TEMP=false
VERBOSE=false
DRY_RUN=false
SELECTED_SUITE=""
SELECTED_TEST=""

# Temp directory for test repos
TEMP_BASE=""

# Colors (if terminal supports them)
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  NC='\033[0m' # No Color
else
  GREEN='' RED='' YELLOW='' BLUE='' NC=''
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --suite) SELECTED_SUITE="$2"; shift 2 ;;
    --test) SELECTED_TEST="$2"; shift 2 ;;
    --keep-temp) KEEP_TEMP=true; shift ;;
    --verbose) VERBOSE=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help)
      head -14 "$0" | tail -13
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Verify dependencies
for cmd in git jq; do
  if ! command -v $cmd &>/dev/null; then
    echo "ERROR: '$cmd' not found in PATH"
    exit 1
  fi
done

# Track results
PASS=0
FAIL=0
SKIP=0
TOTAL=0
FAILED_TESTS=()

# ============================================================================
# Test Helpers
# ============================================================================

log() {
  if $VERBOSE; then
    echo "    [verbose] $*"
  fi
}

create_test_repo() {
  # Create a temporary git repository for testing
  local repo_dir="$1"
  mkdir -p "$repo_dir"
  cd "$repo_dir"
  git init -b main --quiet
  git config user.email "test@test.com"
  git config user.name "Test User"

  # Create initial content
  echo '{"name": "test-project", "version": "1.0.0"}' > package.json
  echo "node_modules/" > .gitignore
  mkdir -p src
  echo 'console.log("hello");' > src/index.js
  git add -A
  git commit -m "Initial commit" --quiet

  log "Created test repo at $repo_dir"
}

assert_eq() {
  local actual="$1"
  local expected="$2"
  local msg="${3:-assertion failed}"
  if [[ "$actual" != "$expected" ]]; then
    echo "    ASSERT FAILED: $msg"
    echo "      Expected: $expected"
    echo "      Actual:   $actual"
    return 1
  fi
  return 0
}

assert_dir_exists() {
  local dir="$1"
  local msg="${2:-directory should exist: $dir}"
  if [[ ! -d "$dir" ]]; then
    echo "    ASSERT FAILED: $msg"
    return 1
  fi
  return 0
}

assert_dir_not_exists() {
  local dir="$1"
  local msg="${2:-directory should not exist: $dir}"
  if [[ -d "$dir" ]]; then
    echo "    ASSERT FAILED: $msg"
    return 1
  fi
  return 0
}

assert_file_contains() {
  local file="$1"
  local pattern="$2"
  local msg="${3:-file should contain pattern}"
  if ! grep -q "$pattern" "$file" 2>/dev/null; then
    echo "    ASSERT FAILED: $msg (pattern: $pattern)"
    return 1
  fi
  return 0
}

assert_command_fails() {
  local msg="${1:-command should fail}"
  shift
  if "$@" 2>/dev/null; then
    echo "    ASSERT FAILED: $msg (command succeeded but should have failed)"
    return 1
  fi
  return 0
}

run_test() {
  local test_id="$1"
  local test_func="$2"
  local description="$3"

  # Filter by suite or test if specified
  if [[ -n "$SELECTED_TEST" && "$test_id" != "$SELECTED_TEST" ]]; then
    return 0
  fi
  if [[ -n "$SELECTED_SUITE" ]]; then
    local suite_prefix="${test_id%%-*}"
    if [[ "$suite_prefix" != "$SELECTED_SUITE" && "${test_id%%[0-9]*}" != "${SELECTED_SUITE}-" ]]; then
      # Check alternate prefix matching
      case "$SELECTED_SUITE" in
        lifecycle) [[ "$test_id" != lifecycle-* ]] && return 0 ;;
        preflight) [[ "$test_id" != preflight-* ]] && return 0 ;;
        directory|dir) [[ "$test_id" != dir-* ]] && return 0 ;;
        cleanup) [[ "$test_id" != cleanup-* ]] && return 0 ;;
        multiworktree|multi) [[ "$test_id" != multi-* ]] && return 0 ;;
        edge_cases|edge) [[ "$test_id" != edge-* ]] && return 0 ;;
        *) return 0 ;;
      esac
    fi
  fi

  ((TOTAL++))

  # Create fresh temp repo for each test
  local test_repo="$TEMP_BASE/$test_id"
  local test_output_dir="$OUTPUT_DIR/$test_id"
  mkdir -p "$test_output_dir"

  echo -n "  [$test_id] $description ... "

  if $DRY_RUN; then
    echo "[DRY RUN]"
    return 0
  fi

  # Run test in subshell to isolate CWD changes
  local test_log="$test_output_dir/test.log"
  local result=0
  (
    set -euo pipefail
    create_test_repo "$test_repo"
    cd "$test_repo"
    $test_func "$test_repo"
  ) > "$test_log" 2>&1 || result=$?

  if [[ $result -eq 0 ]]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
    echo "PASS" > "$test_output_dir/result.txt"
  else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
    FAILED_TESTS+=("$test_id")
    echo "FAIL" > "$test_output_dir/result.txt"
    # Show failure details
    if [[ -f "$test_log" ]]; then
      grep "ASSERT FAILED" "$test_log" 2>/dev/null | head -5 || true
      if $VERBOSE; then
        echo "    --- Full log ---"
        cat "$test_log" | sed 's/^/    /'
        echo "    --- End log ---"
      fi
    fi
  fi
}

# ============================================================================
# Test Suite: Lifecycle
# ============================================================================

test_lifecycle_01() {
  local repo="$1"

  # Create worktree with new branch
  mkdir -p .worktrees
  git worktree add .worktrees/test-feature -b feature/test-feature --quiet

  # Verify worktree exists
  assert_dir_exists ".worktrees/test-feature" "Worktree directory should exist"

  # Verify branch was created
  local branch_exists
  branch_exists=$(git branch --list "feature/test-feature" | wc -l | tr -d ' ')
  assert_eq "$branch_exists" "1" "Branch feature/test-feature should exist"

  # Verify worktree shows in list
  local worktree_count
  worktree_count=$(git worktree list | wc -l | tr -d ' ')
  assert_eq "$worktree_count" "2" "Should have 2 worktrees (main + feature)"

  # Verify files exist in worktree
  assert_file_contains ".worktrees/test-feature/package.json" "test-project" "Worktree should have project files"

  # Clean up
  git worktree remove .worktrees/test-feature

  # Verify worktree removed
  assert_dir_not_exists ".worktrees/test-feature" "Worktree directory should be removed"

  # Verify only main worktree remains
  worktree_count=$(git worktree list | wc -l | tr -d ' ')
  assert_eq "$worktree_count" "1" "Should have 1 worktree after cleanup"
}

test_lifecycle_02() {
  local repo="$1"

  # Create worktree
  mkdir -p .worktrees
  git worktree add .worktrees/feature-work -b feature/work --quiet

  # Make changes in worktree
  cd .worktrees/feature-work
  echo 'console.log("new feature");' > src/feature.js
  git add src/feature.js
  git commit -m "Add feature" --quiet

  # Verify commit exists on branch
  local commit_count
  commit_count=$(git log --oneline | wc -l | tr -d ' ')
  assert_eq "$commit_count" "2" "Should have 2 commits (initial + feature)"

  # Verify main branch doesn't have the commit
  cd "$repo"
  local main_count
  main_count=$(git log --oneline | wc -l | tr -d ' ')
  assert_eq "$main_count" "1" "Main should still have 1 commit"

  # Clean up
  git worktree remove .worktrees/feature-work
}

test_lifecycle_03() {
  local repo="$1"

  # Create worktree
  mkdir -p .worktrees
  git worktree add .worktrees/feature-setup -b feature/setup --quiet

  # Verify package.json exists in worktree (for dep install detection)
  assert_file_contains ".worktrees/feature-setup/package.json" "test-project" "Worktree should have package.json"

  # Simulate stack detection (what the skill does)
  cd .worktrees/feature-setup
  local stacks=""
  [ -f package.json ] && stacks="${stacks}nodejs "
  [ -f Cargo.toml ] && stacks="${stacks}rust "
  [ -f go.mod ] && stacks="${stacks}golang "
  [ -f pyproject.toml ] && stacks="${stacks}python "

  assert_eq "$(echo "$stacks" | xargs)" "nodejs" "Should detect nodejs stack"

  # Clean up
  cd "$repo"
  git worktree remove .worktrees/feature-setup
}

# ============================================================================
# Test Suite: Pre-flight
# ============================================================================

test_preflight_01() {
  local repo="$1"

  # Create a branch first
  git branch feature/existing

  # Create worktree for that branch
  mkdir -p .worktrees
  git worktree add .worktrees/existing feature/existing --quiet

  # Try to create another worktree for same branch (should fail)
  assert_command_fails "Should not create duplicate worktree for same branch" \
    git worktree add .worktrees/existing-2 feature/existing

  # Clean up
  git worktree remove .worktrees/existing
}

test_preflight_02() {
  local repo="$1"

  # Create directory at worktree path
  mkdir -p .worktrees/conflict

  # Create a file inside to make it non-empty
  echo "blocker" > .worktrees/conflict/file.txt

  # Try to create worktree at existing path (should fail)
  assert_command_fails "Should not create worktree at existing non-empty path" \
    git worktree add .worktrees/conflict -b feature/conflict

  # Clean up the blocking directory
  rm -rf .worktrees/conflict
}

test_preflight_03() {
  local repo="$1"

  # Add .worktrees to .gitignore
  echo ".worktrees/" >> .gitignore
  git add .gitignore
  git commit -m "Add .worktrees to gitignore" --quiet

  # IMPORTANT: git check-ignore requires the path to exist on disk
  # This is a real discovery — the skill must create the dir BEFORE checking
  mkdir -p .worktrees

  # Verify git check-ignore works
  local ignored
  if git check-ignore -q .worktrees 2>/dev/null; then
    ignored="yes"
  else
    ignored="no"
  fi
  assert_eq "$ignored" "yes" ".worktrees should be ignored by git"

  # Cleanup for clean state
  rmdir .worktrees
}

test_preflight_04() {
  local repo="$1"

  # git check-ignore needs the path to exist, so create it first
  mkdir -p .worktrees

  # .gitignore exists but doesn't have .worktrees/
  # Verify it's NOT ignored
  local ignored_before="no"
  if git check-ignore -q .worktrees 2>/dev/null; then
    ignored_before="yes"
  fi
  assert_eq "$ignored_before" "no" ".worktrees should NOT be ignored initially"

  # Simulate auto-fix (what the skill does):
  # 1. Detect missing .gitignore entry
  # 2. Add it
  # 3. Commit
  echo ".worktrees/" >> .gitignore
  git add .gitignore
  git commit -m "chore: add .worktrees to .gitignore" --quiet

  # Verify it IS ignored now
  local ignored_after="no"
  if git check-ignore -q .worktrees 2>/dev/null; then
    ignored_after="yes"
  fi
  assert_eq "$ignored_after" "yes" ".worktrees should be ignored after auto-fix"

  # Cleanup
  rmdir .worktrees
}

# ============================================================================
# Test Suite: Directory
# ============================================================================

test_dir_01() {
  local repo="$1"

  # Create hidden .worktrees directory
  mkdir -p .worktrees
  echo ".worktrees/" >> .gitignore
  git add .gitignore
  git commit -m "Add .worktrees to gitignore" --quiet

  # Create worktree in hidden directory
  git worktree add .worktrees/my-feature -b feature/my-feature --quiet

  # Verify it's hidden (starts with .)
  assert_dir_exists ".worktrees" "Hidden .worktrees directory should exist"
  assert_dir_exists ".worktrees/my-feature" "Worktree should exist inside .worktrees"

  # Verify hidden dir doesn't show in basic ls
  local visible
  visible=$(ls -1 | grep "^worktrees$" | wc -l | tr -d ' ')
  assert_eq "$visible" "0" ".worktrees should not appear in basic ls"

  # Clean up
  git worktree remove .worktrees/my-feature
}

test_dir_02() {
  local repo="$1"

  # Create visible worktrees directory
  mkdir -p worktrees
  echo "worktrees/" >> .gitignore
  git add .gitignore
  git commit -m "Add worktrees to gitignore" --quiet

  # Create worktree in visible directory
  git worktree add worktrees/my-feature -b feature/my-feature --quiet

  # Verify it's visible
  assert_dir_exists "worktrees/my-feature" "Worktree should exist inside worktrees/"

  local visible
  visible=$(ls -1 | grep "^worktrees$" | wc -l | tr -d ' ')
  assert_eq "$visible" "1" "worktrees should appear in basic ls"

  # Clean up
  git worktree remove worktrees/my-feature
}

test_dir_03() {
  local repo="$1"

  # Simulate the skill's directory detection logic
  local detected_dir=""

  # Check hidden first
  if [ -d ".worktrees" ]; then
    detected_dir=".worktrees"
  elif [ -d "worktrees" ]; then
    detected_dir="worktrees"
  fi

  # Initially neither exists
  assert_eq "$detected_dir" "" "No worktree directory should be detected initially"

  # Create .worktrees
  mkdir -p .worktrees

  # Re-detect
  detected_dir=""
  if [ -d ".worktrees" ]; then
    detected_dir=".worktrees"
  elif [ -d "worktrees" ]; then
    detected_dir="worktrees"
  fi

  assert_eq "$detected_dir" ".worktrees" "Should detect .worktrees directory"

  # Create worktrees too (hidden should still win priority)
  mkdir -p worktrees

  detected_dir=""
  if [ -d ".worktrees" ]; then
    detected_dir=".worktrees"
  elif [ -d "worktrees" ]; then
    detected_dir="worktrees"
  fi

  assert_eq "$detected_dir" ".worktrees" ".worktrees should have priority over worktrees"
}

# ============================================================================
# Test Suite: Cleanup
# ============================================================================

test_cleanup_01() {
  local repo="$1"

  # Create worktree
  mkdir -p .worktrees
  git worktree add .worktrees/to-remove -b feature/to-remove --quiet

  # Proper cleanup with git worktree remove
  git worktree remove .worktrees/to-remove

  # Verify directory removed
  assert_dir_not_exists ".worktrees/to-remove" "Worktree directory should be removed"

  # Verify no stale entries in worktree list
  local stale
  stale=$(git worktree list | grep "to-remove" | wc -l | tr -d ' ')
  assert_eq "$stale" "0" "No stale worktree entries should remain"
}

test_cleanup_02() {
  local repo="$1"

  # Create worktree and make uncommitted changes
  mkdir -p .worktrees
  git worktree add .worktrees/dirty -b feature/dirty --quiet

  # Make uncommitted changes
  echo "dirty change" > .worktrees/dirty/src/dirty.js

  # Detect dirty state (what the skill should do before cleanup)
  cd .worktrees/dirty
  local is_dirty="no"
  if [ -n "$(git status --porcelain)" ]; then
    is_dirty="yes"
  fi
  assert_eq "$is_dirty" "yes" "Worktree should be detected as dirty"

  # git worktree remove should fail on dirty worktree (without --force)
  cd "$repo"
  assert_command_fails "Should not remove dirty worktree without --force" \
    git worktree remove .worktrees/dirty

  # Force removal should work
  git worktree remove --force .worktrees/dirty
  assert_dir_not_exists ".worktrees/dirty" "Dirty worktree should be removed with --force"
}

test_cleanup_03() {
  local repo="$1"

  # Create worktree
  mkdir -p .worktrees
  git worktree add .worktrees/stale -b feature/stale --quiet

  # Simulate manual removal (the anti-pattern)
  rm -rf .worktrees/stale

  # Verify stale metadata exists
  local stale_before
  stale_before=$(git worktree list | grep -c "stale" || true)
  # Note: git worktree list may or may not show stale entries depending on git version
  # The key test is that prune cleans them up

  # Run prune
  git worktree prune

  # After prune, should be clean
  local stale_after
  stale_after=$(git worktree list | grep -c "prunable" || true)
  assert_eq "$stale_after" "0" "No prunable worktree entries should remain after prune"
}

test_cleanup_04() {
  local repo="$1"

  # Create worktree
  mkdir -p .worktrees
  git worktree add .worktrees/cwd-test -b feature/cwd-test --quiet

  # CWD is in the repo root - removing should work fine
  git worktree remove .worktrees/cwd-test
  assert_dir_not_exists ".worktrees/cwd-test" "Should be able to remove worktree when CWD is outside it"

  # Recreate for the CWD-inside test
  git worktree add .worktrees/cwd-test -b feature/cwd-test-2 --quiet

  # Demonstrate the CWD safety pattern:
  # Store original CWD before entering worktree
  local original_cwd
  original_cwd=$(pwd)

  cd .worktrees/cwd-test

  # Return to original before cleanup
  cd "$original_cwd"

  # Now removal works
  git worktree remove .worktrees/cwd-test
  assert_dir_not_exists ".worktrees/cwd-test" "Should remove after returning to original CWD"
}

# ============================================================================
# Test Suite: Multi-worktree
# ============================================================================

test_multi_01() {
  local repo="$1"

  # Create two worktrees simultaneously
  mkdir -p .worktrees
  git worktree add .worktrees/feature-a -b feature/a --quiet
  git worktree add .worktrees/feature-b -b feature/b --quiet

  # Both should exist
  assert_dir_exists ".worktrees/feature-a" "Worktree A should exist"
  assert_dir_exists ".worktrees/feature-b" "Worktree B should exist"

  # Should show 3 worktrees total
  local count
  count=$(git worktree list | wc -l | tr -d ' ')
  assert_eq "$count" "3" "Should have 3 worktrees (main + A + B)"

  # Make independent changes
  echo "feature a" > .worktrees/feature-a/src/a.js
  echo "feature b" > .worktrees/feature-b/src/b.js

  # Commit in each
  cd .worktrees/feature-a
  git add src/a.js
  git commit -m "Feature A" --quiet
  cd "$repo"

  cd .worktrees/feature-b
  git add src/b.js
  git commit -m "Feature B" --quiet
  cd "$repo"

  # Verify independent (A doesn't have B's file and vice versa)
  [ ! -f .worktrees/feature-a/src/b.js ] || { echo "    ASSERT FAILED: A should not have B's file"; return 1; }
  [ ! -f .worktrees/feature-b/src/a.js ] || { echo "    ASSERT FAILED: B should not have A's file"; return 1; }

  # Clean up both
  git worktree remove .worktrees/feature-a
  git worktree remove .worktrees/feature-b
}

test_multi_02() {
  local repo="$1"

  # Create branch and first worktree
  mkdir -p .worktrees
  git worktree add .worktrees/first -b feature/shared --quiet

  # Try to create second worktree for SAME branch (should fail)
  assert_command_fails "Should not create two worktrees for same branch" \
    git worktree add .worktrees/second feature/shared

  # Clean up
  git worktree remove .worktrees/first
}

test_multi_03() {
  local repo="$1"

  # Create multiple worktrees
  mkdir -p .worktrees
  git worktree add .worktrees/wt-1 -b feature/wt-1 --quiet
  git worktree add .worktrees/wt-2 -b feature/wt-2 --quiet

  # git worktree list should show all
  local list_output
  list_output=$(git worktree list)

  local count
  count=$(echo "$list_output" | wc -l | tr -d ' ')
  assert_eq "$count" "3" "worktree list should show 3 entries"

  # Verify each worktree appears in the list
  echo "$list_output" | grep -q "wt-1" || { echo "    ASSERT FAILED: wt-1 not in worktree list"; return 1; }
  echo "$list_output" | grep -q "wt-2" || { echo "    ASSERT FAILED: wt-2 not in worktree list"; return 1; }

  # Clean up
  git worktree remove .worktrees/wt-1
  git worktree remove .worktrees/wt-2
}

# ============================================================================
# Test Suite: Edge Cases
# ============================================================================

test_edge_01() {
  local repo="$1"

  # Branch with slashes (common for feature/auth/login pattern)
  mkdir -p .worktrees
  git worktree add .worktrees/auth-login -b feature/auth/login --quiet

  # Verify it works
  assert_dir_exists ".worktrees/auth-login" "Worktree with slashed branch should exist"

  # Verify branch
  local branch_exists
  branch_exists=$(git branch --list "feature/auth/login" | wc -l | tr -d ' ')
  assert_eq "$branch_exists" "1" "Branch with slashes should exist"

  # Clean up
  git worktree remove .worktrees/auth-login
}

test_edge_02() {
  local repo="$1"

  # Get current commit hash
  local commit_hash
  commit_hash=$(git rev-parse HEAD)

  # Create detached HEAD worktree
  mkdir -p .worktrees
  git worktree add --detach .worktrees/detached "$commit_hash" --quiet

  # Verify detached HEAD
  assert_dir_exists ".worktrees/detached" "Detached worktree should exist"

  cd .worktrees/detached
  # Git may say "HEAD detached at..." or "Not currently on any branch."
  # Most reliable check: git symbolic-ref HEAD fails on detached HEAD
  if git symbolic-ref HEAD 2>/dev/null; then
    echo "    ASSERT FAILED: Should be in detached HEAD state (symbolic-ref succeeded)"
    return 1
  fi

  # Clean up
  cd "$repo"
  git worktree remove .worktrees/detached
}

test_edge_03() {
  local repo="$1"

  # Create worktree
  mkdir -p .worktrees
  git worktree add .worktrees/resilient -b feature/resilient --quiet

  # Make a commit on main (simulating remote changes)
  echo "new main content" > src/main-update.js
  git add src/main-update.js
  git commit -m "Main update" --quiet

  # Worktree should still work fine
  cd .worktrees/resilient
  local status
  status=$(git status --porcelain | wc -l | tr -d ' ')
  assert_eq "$status" "0" "Worktree should be clean after main commit"

  # Can fetch from worktree (simulates git fetch)
  # In a real scenario with remote, this would be `git fetch origin`
  # Here we just verify the worktree is functional
  local current_branch
  current_branch=$(git branch --show-current)
  assert_eq "$current_branch" "feature/resilient" "Should still be on feature branch"

  # Verify worktree is functional (can run git commands)
  # Note: `git log main` visibility depends on worktree sharing the object store
  # The key test is that the worktree itself remains functional after main changes
  local log_output
  log_output=$(git log --oneline 2>&1)
  echo "$log_output" | grep -q "Initial commit" || { echo "    ASSERT FAILED: Worktree should have access to its own history"; return 1; }

  # Clean up
  cd "$repo"
  git worktree remove .worktrees/resilient
}

# ============================================================================
# Main Execution
# ============================================================================

echo "=== Git Worktree Lifecycle Test Runner ==="
echo "Timestamp: $TIMESTAMP"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create output and temp directories
mkdir -p "$OUTPUT_DIR"
TEMP_BASE=$(mktemp -d "${TMPDIR:-/tmp}/worktree-tests-XXXXXX")
echo "Temp directory: $TEMP_BASE"
echo ""

if $DRY_RUN; then
  echo "[DRY RUN MODE - no tests will execute]"
  echo ""
fi

# Run all test suites
echo "--- Lifecycle Tests ---"
run_test "lifecycle-01" test_lifecycle_01 "Create worktree, verify, clean up"
run_test "lifecycle-02" test_lifecycle_02 "Create worktree, make commits, verify isolation"
run_test "lifecycle-03" test_lifecycle_03 "Create worktree, detect project stack"

echo ""
echo "--- Pre-flight Tests ---"
run_test "preflight-01" test_preflight_01 "Prevent duplicate worktree for same branch"
run_test "preflight-02" test_preflight_02 "Prevent worktree at existing non-empty path"
run_test "preflight-03" test_preflight_03 "Verify .gitignore check works"
run_test "preflight-04" test_preflight_04 "Auto-fix missing .gitignore entry"

echo ""
echo "--- Directory Tests ---"
run_test "dir-01" test_dir_01 "Hidden .worktrees/ pattern"
run_test "dir-02" test_dir_02 "Visible worktrees/ pattern"
run_test "dir-03" test_dir_03 "Auto-detect worktree directory with priority"

echo ""
echo "--- Cleanup Tests ---"
run_test "cleanup-01" test_cleanup_01 "Proper git worktree remove"
run_test "cleanup-02" test_cleanup_02 "Handle uncommitted changes during cleanup"
run_test "cleanup-03" test_cleanup_03 "Prune stale worktree metadata"
run_test "cleanup-04" test_cleanup_04 "CWD safety during cleanup"

echo ""
echo "--- Multi-Worktree Tests ---"
run_test "multi-01" test_multi_01 "Two worktrees with independent changes"
run_test "multi-02" test_multi_02 "Prevent same branch in two worktrees"
run_test "multi-03" test_multi_03 "git worktree list shows all active"

echo ""
echo "--- Edge Case Tests ---"
run_test "edge-01" test_edge_01 "Branch with slashes (feature/auth/login)"
run_test "edge-02" test_edge_02 "Detached HEAD worktree"
run_test "edge-03" test_edge_03 "Worktree survives main branch commits"

# ============================================================================
# Results Summary
# ============================================================================

echo ""
echo "==========================================="
echo "         TEST RESULTS SUMMARY"
echo "==========================================="
echo ""
printf "  Total:   %d\n" "$TOTAL"
printf "  ${GREEN}Passed:  %d${NC}\n" "$PASS"
printf "  ${RED}Failed:  %d${NC}\n" "$FAIL"
if [[ $TOTAL -gt 0 ]]; then
  local_rate=$(( PASS * 100 / TOTAL ))
  printf "  Rate:    %d%%\n" "$local_rate"
fi
echo ""

if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
  echo -e "  ${RED}Failed tests:${NC}"
  for ft in "${FAILED_TESTS[@]}"; do
    echo "    - $ft (see $OUTPUT_DIR/$ft/test.log)"
  done
  echo ""
fi

# Generate results JSON
python3 -c "
import json, os, glob

results_dir = '$OUTPUT_DIR'
tests = []

for result_file in sorted(glob.glob(os.path.join(results_dir, '*', 'result.txt'))):
    test_id = os.path.basename(os.path.dirname(result_file))
    with open(result_file) as f:
        result = f.read().strip()
    tests.append({'test_id': test_id, 'result': result})

total = len(tests)
passed = sum(1 for t in tests if t['result'] == 'PASS')
failed = sum(1 for t in tests if t['result'] == 'FAIL')

summary = {
    'tests': tests,
    'summary': {
        'total': total,
        'passed': passed,
        'failed': failed,
        'pass_rate': round(passed / total * 100, 1) if total > 0 else 0,
        'timestamp': '$TIMESTAMP'
    }
}

with open(os.path.join(results_dir, 'results-summary.json'), 'w') as f:
    json.dump(summary, f, indent=2)
" 2>/dev/null || echo "WARNING: Could not generate summary JSON"

echo "Results saved to: $OUTPUT_DIR/results-summary.json"

# Cleanup temp directory
if ! $KEEP_TEMP; then
  rm -rf "$TEMP_BASE"
  log "Cleaned up temp directory: $TEMP_BASE"
else
  echo "Temp directory preserved: $TEMP_BASE"
fi

# Exit with failure code if any tests failed
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
