#!/bin/bash
# Automated /dev:worktree E2E Integration Test Runner
# Tests whether /dev:worktree executes correct git operations, invokes skills,
# and handles safety checks properly.
#
# Usage:
#   ./autotest/worktree/run-e2e-tests.sh [OPTIONS]
#
# Options:
#   --cases <ids>       Comma-separated test case IDs (default: all)
#   --output-dir <dir>  Custom output directory (default: auto-generated)
#   --timeout <secs>    Per-test timeout in seconds (default: 120)
#   --dry-run           Show what would be run without executing
#   --help              Show this help message

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_CASES_FILE="$SCRIPT_DIR/e2e-test-cases.json"
ANALYZER="$SCRIPT_DIR/analyze-e2e-transcript.py"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="$SCRIPT_DIR/results/run-$TIMESTAMP"
TIMEOUT=120
DRY_RUN=false
SELECTED_CASES=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --cases) SELECTED_CASES="$2"; shift 2 ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help)
      head -12 "$0" | tail -11
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Verify dependencies
if ! command -v claude &>/dev/null; then
  echo "ERROR: 'claude' CLI not found in PATH"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "ERROR: 'jq' not found. Install with: brew install jq"
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "ERROR: 'python3' not found"
  exit 1
fi

if [[ ! -f "$TEST_CASES_FILE" ]]; then
  echo "ERROR: Test cases file not found: $TEST_CASES_FILE"
  exit 1
fi

# Load test cases
TOTAL_CASES=$(jq '.test_cases | length' "$TEST_CASES_FILE")
echo "=== /dev:worktree E2E Integration Test Runner ==="
echo "Test cases file: $TEST_CASES_FILE"
echo "Total test cases: $TOTAL_CASES"
echo "Timeout per test: ${TIMEOUT}s"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Copy test cases for reference
cp "$TEST_CASES_FILE" "$OUTPUT_DIR/test-cases.json"

# Filter test cases if --cases specified
if [[ -n "$SELECTED_CASES" ]]; then
  IFS=',' read -ra CASE_IDS <<< "$SELECTED_CASES"
  echo "Running selected cases: ${CASE_IDS[*]}"
else
  CASE_IDS=()
  while IFS= read -r id; do
    CASE_IDS+=("$id")
  done < <(jq -r '.test_cases[].id' "$TEST_CASES_FILE")
fi

echo "Cases to run: ${#CASE_IDS[@]}"
echo ""

# Track results
PASS=0
FAIL=0
ERROR=0
TOTAL=0

run_single_test() {
  local case_id="$1"
  local case_dir="$OUTPUT_DIR/$case_id"
  mkdir -p "$case_dir"

  # Extract test case data
  local prompt
  prompt=$(jq -r --arg id "$case_id" '.test_cases[] | select(.id == $id) | .prompt' "$TEST_CASES_FILE")
  local description
  description=$(jq -r --arg id "$case_id" '.test_cases[] | select(.id == $id) | .description' "$TEST_CASES_FILE")
  local checks
  checks=$(jq -c --arg id "$case_id" '.test_cases[] | select(.id == $id) | .checks' "$TEST_CASES_FILE")

  if [[ -z "$prompt" || "$prompt" == "null" ]]; then
    echo "  ERROR: Test case '$case_id' not found"
    return 1
  fi

  local transcript_file="$case_dir/transcript.jsonl"
  local analysis_file="$case_dir/analysis.json"
  local meta_file="$case_dir/meta.json"

  echo "  [$case_id] $description"
  echo "    Prompt: ${prompt:0:80}..."

  if $DRY_RUN; then
    echo "    [DRY RUN] Would execute claude -p with ${TIMEOUT}s timeout"
    return 0
  fi

  # Write metadata
  jq -n \
    --arg id "$case_id" \
    --arg prompt "$prompt" \
    --arg checks "$checks" \
    --arg started "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{
      test_id: $id,
      prompt: $prompt,
      checks: ($checks | fromjson),
      started_at: $started
    }' > "$meta_file"

  local start_time
  start_time=$(date +%s)

  # Execute with timeout (must run from project root so /dev:worktree is available)
  cd "$REPO_ROOT"
  set +e
  if command -v gtimeout &>/dev/null; then
    gtimeout "$TIMEOUT" claude -p \
      --output-format stream-json \
      --verbose \
      --dangerously-skip-permissions \
      "$prompt" \
      > "$transcript_file" \
      2> "$case_dir/stderr.txt"
  else
    # Use perl timeout for macOS
    perl -e "alarm $TIMEOUT; exec @ARGV" -- \
      claude -p \
      --output-format stream-json \
      --verbose \
      --dangerously-skip-permissions \
      "$prompt" \
      > "$transcript_file" \
      2> "$case_dir/stderr.txt"
  fi
  local exit_code=$?
  set -e
  cd "$SCRIPT_DIR"

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  # Run analysis
  local analysis_result
  set +e
  analysis_result=$(python3 "$ANALYZER" "$transcript_file" "$checks" 2>"$case_dir/analyzer-stderr.txt")
  local analysis_exit=$?
  set -e

  if [[ $analysis_exit -eq 0 ]]; then
    echo "$analysis_result" > "$analysis_file"
  else
    # Analysis failed
    echo "$analysis_result" > "$analysis_file" 2>/dev/null || true
  fi

  # Determine result
  local result="ERROR"
  local passed_checks=0
  local total_checks=0
  local failed_details=""

  if [[ -n "$analysis_result" ]]; then
    local all_passed
    all_passed=$(echo "$analysis_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('passed') else 'false')" 2>/dev/null || echo "false")
    passed_checks=$(echo "$analysis_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('summary',{}).get('passed_checks',0))" 2>/dev/null || echo "0")
    total_checks=$(echo "$analysis_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('summary',{}).get('total_checks',0))" 2>/dev/null || echo "0")
    failed_details=$(echo "$analysis_result" | python3 -c "
import sys,json
d=json.load(sys.stdin)
failed = [c for c in d.get('checks',[]) if not c.get('passed')]
for f in failed:
    print(f'    FAIL: {f[\"check\"]}: {f[\"detail\"]}')
" 2>/dev/null || echo "")

    if [[ "$all_passed" == "true" ]]; then
      result="PASS"
      ((PASS++))
    else
      result="FAIL"
      ((FAIL++))
    fi
  else
    result="ERROR"
    ((ERROR++))
  fi
  ((TOTAL++))

  # Update metadata with results
  jq -n \
    --arg id "$case_id" \
    --arg result "$result" \
    --arg duration "$duration" \
    --arg passed "$passed_checks" \
    --arg total "$total_checks" \
    --arg exit_code "$exit_code" \
    --arg finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{
      test_id: $id,
      result: $result,
      duration_seconds: ($duration | tonumber),
      passed_checks: ($passed | tonumber),
      total_checks: ($total | tonumber),
      exit_code: ($exit_code | tonumber),
      finished_at: $finished
    }' > "$meta_file"

  # Print result
  echo "    Result: $result ($passed_checks/$total_checks checks) | ${duration}s"
  if [[ -n "$failed_details" ]]; then
    echo "$failed_details"
  fi
  echo ""
}

# Main execution loop
echo "=== Starting Tests ==="
echo ""

for case_id in "${CASE_IDS[@]}"; do
  run_single_test "$case_id"
done

# Cleanup test worktrees created during tests
echo ""
echo "=== Cleaning up test worktrees ==="
cd "$REPO_ROOT"
if command -v git &>/dev/null; then
  # Find and remove any test worktrees (matching pattern test-wt-*)
  while IFS= read -r wt_line; do
    wt_path=$(echo "$wt_line" | awk '{print $1}')
    if [[ "$wt_path" == *"test-wt-"* ]]; then
      echo "Removing test worktree: $wt_path"
      git worktree remove "$wt_path" --force 2>/dev/null || true
    fi
  done < <(git worktree list --porcelain | grep '^worktree ' | sed 's/^worktree //')
fi
cd "$SCRIPT_DIR"
echo ""

# Generate summary
echo ""
echo "=== Test Results Summary ==="
echo "Total: $TOTAL | Pass: $PASS | Fail: $FAIL | Error: $ERROR"
if [[ $TOTAL -gt 0 ]]; then
  echo "Pass Rate: $(( PASS * 100 / TOTAL ))%"
else
  echo "Pass Rate: N/A (no tests executed)"
fi
echo ""
echo "Results directory: $OUTPUT_DIR"

# Collect all meta files into summary
python3 -c "
import json, glob, os

results_dir = '$OUTPUT_DIR'
runs = []

for meta_file in sorted(glob.glob(os.path.join(results_dir, '*', 'meta.json'))):
    try:
        with open(meta_file) as f:
            runs.append(json.load(f))
    except:
        pass

total = len(runs)
passed = sum(1 for r in runs if r.get('result') == 'PASS')
failed = sum(1 for r in runs if r.get('result') == 'FAIL')
errors = total - passed - failed

summary = {
    'runs': runs,
    'summary': {
        'total': total,
        'passed': passed,
        'failed': failed,
        'errors': errors,
        'pass_rate': round(passed / total * 100, 1) if total > 0 else 0,
        'timestamp': '$TIMESTAMP'
    }
}

with open(os.path.join(results_dir, 'results-summary.json'), 'w') as f:
    json.dump(summary, f, indent=2)
" 2>/dev/null || echo "WARNING: Could not generate summary JSON"

# Detailed results table
echo ""
echo "=== Detailed Results ==="
echo ""
printf "%-25s %-8s %-12s %-8s\n" "TEST_ID" "RESULT" "CHECKS" "TIME"
printf "%-25s %-8s %-12s %-8s\n" "-------" "------" "------" "----"

for case_id in "${CASE_IDS[@]}"; do
  meta_file="$OUTPUT_DIR/$case_id/meta.json"
  if [[ -f "$meta_file" ]]; then
    result=$(jq -r '.result' "$meta_file")
    passed=$(jq -r '.passed_checks' "$meta_file")
    total=$(jq -r '.total_checks' "$meta_file")
    duration=$(jq -r '.duration_seconds' "$meta_file")
    printf "%-25s %-8s %-12s %-8s\n" "$case_id" "$result" "${passed}/${total}" "${duration}s"
  fi
done

echo ""
echo "Full results: $OUTPUT_DIR/results-summary.json"
