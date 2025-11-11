#!/bin/bash

# Snapshot Testing Workflow
# Complete workflow for capturing fixtures and running snapshot tests

set -e

CLAUDISH="./dist/index.js"
LOGS_DIR="$(pwd)/logs"
FIXTURES_DIR="$(pwd)/tests/fixtures"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "Snapshot Testing Workflow"
echo -e "========================================${NC}"
echo ""

# Step 1: Build
echo -e "${YELLOW}Step 1: Building Claudish${NC}"
if ! bun run build; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 2: Check environment
echo -e "${YELLOW}Step 2: Checking environment${NC}"
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${RED}❌ ANTHROPIC_API_KEY not set (required for monitor mode)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ANTHROPIC_API_KEY found${NC}"

if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPENROUTER_API_KEY not set (required for snapshot tests)${NC}"
    echo "   Tests will be skipped"
else
    echo -e "${GREEN}✅ OPENROUTER_API_KEY found${NC}"
fi
echo ""

# Create directories
mkdir -p "$LOGS_DIR"
mkdir -p "$FIXTURES_DIR"

# Step 3: Capture fixtures (optional)
if [ "$1" == "--capture" ] || [ "$1" == "--full" ]; then
    echo -e "${YELLOW}Step 3: Capturing fixtures from monitor mode${NC}"
    echo ""

    # Define test scenarios
    declare -a SCENARIOS=(
        "simple_text:What is 2+2? Answer briefly."
        "file_read:Read the README.md file and tell me what this project does in one sentence."
        "grep_search:Search for 'ProxyServer' in the codebase."
        "multi_tool:List all TypeScript files in src/ and count them."
    )

    for scenario in "${SCENARIOS[@]}"; do
        IFS=':' read -r name query <<< "$scenario"

        echo -e "${BLUE}Capturing: ${name}${NC}"
        echo "Query: $query"

        LOG_FILE="$LOGS_DIR/capture_${name}.log"

        # Run in monitor mode (capture real Anthropic API traffic)
        if $CLAUDISH --monitor --debug "$query" 2>&1 | tee "$LOG_FILE"; then
            echo -e "${GREEN}✅ Captured${NC}"

            # Convert log to fixture
            echo "  Converting to fixture..."
            if bun tests/capture-fixture.ts "$LOG_FILE" --name "$name" 2>&1 | grep -q "Fixture created"; then
                echo -e "${GREEN}  ✅ Fixture created: ${name}.json${NC}"
            else
                echo -e "${RED}  ❌ Failed to create fixture${NC}"
            fi
        else
            echo -e "${RED}❌ Capture failed${NC}"
        fi

        echo ""
        sleep 2 # Rate limiting
    done

    echo -e "${GREEN}✅ Fixture capture complete${NC}"
    echo ""
else
    echo -e "${YELLOW}Step 3: Skipping fixture capture (use --capture or --full to capture)${NC}"
    echo ""
fi

# Step 4: List fixtures
echo -e "${YELLOW}Step 4: Available fixtures${NC}"
FIXTURE_COUNT=$(ls -1 "$FIXTURES_DIR"/*.json 2>/dev/null | wc -l)
echo "Found ${FIXTURE_COUNT} fixture(s):"
if [ "$FIXTURE_COUNT" -gt 0 ]; then
    for fixture in "$FIXTURES_DIR"/*.json; do
        name=$(basename "$fixture" .json)
        category=$(jq -r '.category' "$fixture" 2>/dev/null || echo "unknown")
        desc=$(jq -r '.description' "$fixture" 2>/dev/null || echo "")
        echo "  - ${name} (${category}): ${desc}"
    done
else
    echo "  (none - run with --capture to create fixtures)"
fi
echo ""

# Step 5: Run snapshot tests
if [ "$1" == "--test" ] || [ "$1" == "--full" ]; then
    echo -e "${YELLOW}Step 5: Running snapshot tests${NC}"
    echo ""

    if [ "$FIXTURE_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No fixtures found - skipping tests${NC}"
        echo "   Run with --capture first to create fixtures"
    else
        if bun test tests/snapshot.test.ts; then
            echo ""
            echo -e "${GREEN}✅ All snapshot tests passed!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Some snapshot tests failed${NC}"
            echo ""
            echo "Common issues:"
            echo "  1. Content block indices incorrect → Fix proxy-server.ts block tracking"
            echo "  2. Missing events → Add ping events, validate event sequence"
            echo "  3. Tool JSON incomplete → Add JSON validation before content_block_stop"
            echo "  4. Missing usage → Add cache metrics emulation"
            exit 1
        fi
    fi
    echo ""
else
    echo -e "${YELLOW}Step 5: Skipping tests (use --test or --full to run)${NC}"
    echo ""
fi

# Step 6: Summary
echo -e "${BLUE}========================================"
echo "Workflow Summary"
echo -e "========================================${NC}"
echo ""
echo "Fixtures: $FIXTURE_COUNT"
echo "Logs:     $(ls -1 "$LOGS_DIR"/*.log 2>/dev/null | wc -l)"
echo ""
echo "Next steps:"
echo "  1. Review fixtures:  cat tests/fixtures/simple_text.json | jq"
echo "  2. Run tests:        bun test tests/snapshot.test.ts"
echo "  3. Fix proxy:        Edit src/proxy-server.ts based on test failures"
echo "  4. Re-test:          bun test tests/snapshot.test.ts"
echo ""
echo "Usage:"
echo "  $0                  # Check status only"
echo "  $0 --capture        # Capture new fixtures"
echo "  $0 --test           # Run tests only"
echo "  $0 --full           # Capture + test"
echo ""
