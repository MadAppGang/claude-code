#!/bin/bash
# Test script to validate status line calculation with different JSON formats

echo "=== Testing Status Line Calculation ==="
echo ""

maxTokens=256000

# Test 1: Simple format with direct input_tokens/output_tokens
echo "Test 1: Simple direct fields"
JSON1='{"input_tokens":5000,"output_tokens":1000,"total_cost_usd":0.05}'
INPUT=$(echo "$JSON1" | grep -o '"input_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
OUTPUT=$(echo "$JSON1" | grep -o '"output_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
TOTAL=$((INPUT + OUTPUT))
CTX=$(echo "scale=0; ($maxTokens - $TOTAL) * 100 / $maxTokens" | bc 2>/dev/null)
echo "JSON: $JSON1"
echo "Result: INPUT=$INPUT OUTPUT=$OUTPUT TOTAL=$TOTAL CTX=$CTX%"
echo "Expected: INPUT=5000 OUTPUT=1000 TOTAL=6000 CTX=97%"
echo ""

# Test 2: Nested in usage object
echo "Test 2: Nested in usage object"
JSON2='{"total_cost_usd":0.05,"usage":{"input_tokens":5000,"output_tokens":1000}}'
INPUT=$(echo "$JSON2" | grep -o '"input_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
OUTPUT=$(echo "$JSON2" | grep -o '"output_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
TOTAL=$((INPUT + OUTPUT))
CTX=$(echo "scale=0; ($maxTokens - $TOTAL) * 100 / $maxTokens" | bc 2>/dev/null)
echo "JSON: $JSON2"
echo "Result: INPUT=$INPUT OUTPUT=$OUTPUT TOTAL=$TOTAL CTX=$CTX%"
echo "Expected: INPUT=5000 OUTPUT=1000 TOTAL=6000 CTX=97%"
echo ""

# Test 3: Multiple occurrences in modelUsage array (SUMMING)
echo "Test 3: Multiple occurrences in modelUsage array"
JSON3='{"total_cost_usd":0.15,"modelUsage":[{"input_tokens":3000,"output_tokens":500},{"input_tokens":2000,"output_tokens":500}]}'
INPUT=$(echo "$JSON3" | grep -o '"input_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
OUTPUT=$(echo "$JSON3" | grep -o '"output_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
TOTAL=$((INPUT + OUTPUT))
CTX=$(echo "scale=0; ($maxTokens - $TOTAL) * 100 / $maxTokens" | bc 2>/dev/null)
echo "JSON: $JSON3"
echo "Result: INPUT=$INPUT OUTPUT=$OUTPUT TOTAL=$TOTAL CTX=$CTX%"
echo "Expected: INPUT=5000 (3000+2000) OUTPUT=1000 (500+500) TOTAL=6000 CTX=97%"
echo ""

# Test 4: No token data (default to 100%)
echo "Test 4: No token data"
JSON4='{"total_cost_usd":0.05}'
INPUT=$(echo "$JSON4" | grep -o '"input_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
OUTPUT=$(echo "$JSON4" | grep -o '"output_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
TOTAL=$((INPUT + OUTPUT))
CTX=$(echo "scale=0; ($maxTokens - $TOTAL) * 100 / $maxTokens" | bc 2>/dev/null)
[ -z "$CTX" ] && CTX="100" || true
echo "JSON: $JSON4"
echo "Result: INPUT=$INPUT OUTPUT=$OUTPUT TOTAL=$TOTAL CTX=$CTX%"
echo "Expected: INPUT=0 OUTPUT=0 TOTAL=0 CTX=100%"
echo ""

# Test 5: Large conversation (19k tokens)
echo "Test 5: Large conversation"
JSON5='{"total_cost_usd":0.25,"modelUsage":[{"input_tokens":18000,"output_tokens":1000}]}'
INPUT=$(echo "$JSON5" | grep -o '"input_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
OUTPUT=$(echo "$JSON5" | grep -o '"output_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
TOTAL=$((INPUT + OUTPUT))
CTX=$(echo "scale=0; ($maxTokens - $TOTAL) * 100 / $maxTokens" | bc 2>/dev/null)
echo "JSON: $JSON5"
echo "Result: INPUT=$INPUT OUTPUT=$OUTPUT TOTAL=$TOTAL CTX=$CTX%"
echo "Expected: INPUT=18000 OUTPUT=1000 TOTAL=19000 CTX=92%"
echo ""

echo "=== All Tests Complete ==="
