#!/bin/bash

# Monitor Mode Integration Tests
# This script runs various Claude Code scenarios with monitor mode to analyze the protocol

set -e

CLAUDISH="./dist/index.js"
TEST_DIR="$(pwd)/tests"
LOGS_DIR="$(pwd)/logs"

echo "========================================"
echo "Claudish Monitor Mode Integration Tests"
echo "========================================"
echo ""

# Create logs directory
mkdir -p "$LOGS_DIR"

# Test scenarios
declare -a TESTS=(
    "1:simple:What is 2+2? Answer briefly."
    "2:file_read:Read the package.json file and tell me the version"
    "3:grep:Search for 'createProxyServer' in the codebase"
    "4:multi_tool:List all TypeScript files in src/ and count them"
)

# Run each test
for test in "${TESTS[@]}"; do
    IFS=':' read -r num name query <<< "$test"

    echo "========================================"
    echo "TEST $num: $name"
    echo "Query: $query"
    echo "========================================"
    echo ""

    # Run claudish with monitor mode
    LOG_FILE="$LOGS_DIR/test_${num}_${name}.log"

    echo "[TEST] Running: $CLAUDISH --monitor --debug \"$query\""
    echo "[TEST] Logs will be saved to: $LOG_FILE"
    echo ""

    # Run the test (redirect stderr to capture logs)
    if $CLAUDISH --monitor --debug "$query" 2>&1 | tee "$LOG_FILE"; then
        echo ""
        echo "[TEST] ✅ Test $num completed successfully"
    else
        echo ""
        echo "[TEST] ❌ Test $num failed"
    fi

    echo ""
    echo "Waiting 2 seconds before next test..."
    sleep 2
    echo ""
done

echo "========================================"
echo "All tests completed!"
echo "========================================"
echo ""
echo "Log files:"
ls -lh "$LOGS_DIR"/test_*.log

echo ""
echo "To analyze logs:"
echo "  cat $LOGS_DIR/test_1_simple.log | grep -A 50 'MONITOR'"
echo "  cat $LOGS_DIR/test_2_file_read.log | grep -A 50 'tool_use'"
