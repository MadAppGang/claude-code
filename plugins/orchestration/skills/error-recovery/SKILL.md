---
name: error-recovery
description: Handle errors, timeouts, and failures in multi-agent workflows. Use when dealing with external model timeouts, API failures, partial success, user cancellation, or graceful degradation. Trigger keywords - "error", "failure", "timeout", "retry", "fallback", "cancelled", "graceful degradation", "recovery", "partial success".
version: 0.1.0
tags: [orchestration, error-handling, retry, fallback, timeout, recovery]
keywords: [error, failure, timeout, retry, fallback, graceful-degradation, cancellation, recovery, partial-success, resilience]
plugin: orchestration
updated: 2026-01-20
---

# Error Recovery

**Version:** 1.0.0
**Purpose:** Patterns for handling failures in multi-agent workflows
**Status:** Production Ready

## Overview

Error recovery is the practice of handling failures gracefully in multi-agent workflows, ensuring that temporary errors, timeouts, or partial failures don't derail entire workflows. In production systems with external dependencies (AI models, APIs, network calls), failures are inevitable. The question is not "will it fail?" but "how will we handle it when it does?"

This skill provides battle-tested patterns for:
- **Timeout handling** (external models taking >30s)
- **API failure recovery** (401, 500, network errors)
- **Partial success strategies** (some agents succeed, others fail)
- **User cancellation** (graceful Ctrl+C handling)
- **Missing tools** (claudish not installed)
- **Out of credits** (payment/quota errors)
- **Retry strategies** (exponential backoff, max retries)

With proper error recovery, workflows become **resilient** and **production-ready**.

## Core Patterns

### Pattern 1: Timeout Handling

**Scenario: External Model Takes >30s**

External AI models via Claudish may take >30s due to:
- Model service overloaded (high demand)
- Network latency (slow connection)
- Complex task (large input, detailed analysis)
- Model thinking time (GPT-5, Grok reasoning models)

**Detection:**

```
Monitor execution time and set timeout limits:

const TIMEOUT_THRESHOLD = 30000; // 30 seconds

startTime = Date.now();
executeClaudish(model, prompt);

setInterval(() => {
  elapsedTime = Date.now() - startTime;
  if (elapsedTime > TIMEOUT_THRESHOLD && !modelResponded) {
    handleTimeout();
  }
}, 1000);
```

**Recovery Strategy:**

```
Step 1: Detect Timeout
  Log: "Timeout: x-ai/grok-code-fast-1 after 30s with no response"

Step 2: Notify User
  Present options:
    "Model 'Grok' timed out after 30 seconds.
     Options:
     1. Retry with 60s timeout
     2. Skip this model and continue with others
     3. Cancel entire workflow

     What would you like to do? (1/2/3)"

Step 3a: User selects RETRY
  Increase timeout to 60s
  Re-execute claudish with longer timeout
  If still times out: Offer skip or cancel

Step 3b: User selects SKIP
  Log: "Skipping Grok review due to timeout"
  Mark this model as failed
  Continue with remaining models
  (Graceful degradation pattern)

Step 3c: User selects CANCEL
  Exit workflow gracefully
  Save partial results (if any)
  Log cancellation reason
```

**Graceful Degradation:**

```
Multi-Model Review Example:

Requested: 5 models (Claude, Grok, Gemini, GPT-5, DeepSeek)
Timeout: Grok after 30s

Result:
  - Claude: Success ✓
  - Grok: Timeout ✗ (skipped)
  - Gemini: Success ✓
  - GPT-5: Success ✓
  - DeepSeek: Success ✓

Successful: 4/5 models (80%)
Threshold: N ≥ 2 for consolidation ✓

Action:
  Proceed with consolidation using 4 reviews
  Notify user: "4/5 models completed (Grok timeout). Proceeding with 4-model consensus."

Benefits:
  - Workflow completes despite failure
  - User gets results (4 models better than 1)
  - Timeout doesn't derail entire workflow
```

**Example Implementation:**

```bash
# In codex-code-reviewer agent (proxy mode)

MODEL="x-ai/grok-code-fast-1"
TIMEOUT=30

# Execute with timeout
RESULT=$(timeout ${TIMEOUT}s bash -c "
  printf '%s' '$PROMPT' | claudish --model $MODEL --stdin --quiet --auto-approve
" 2>&1)

# Check exit code
if [ $? -eq 124 ]; then
  # Timeout occurred (exit code 124 from timeout command)
  echo "⚠️ Timeout: Model $MODEL exceeded ${TIMEOUT}s" >&2
  echo "TIMEOUT_ERROR: Model did not respond within ${TIMEOUT}s"
  exit 1
fi

# Success - write results
echo "$RESULT" > ai-docs/grok-review.md
echo "Grok review complete. See ai-docs/grok-review.md"
```

---

### Pattern 2: API Failure Recovery

**Common API Failure Scenarios:**

```
401 Unauthorized:
  - Invalid API key (OPENROUTER_API_KEY incorrect)
  - Expired API key
  - API key not set in environment

500 Internal Server Error:
  - Model service temporarily down
  - Server overload
  - Model deployment issue

Network Errors:
  - Connection timeout (network slow/unstable)
  - DNS resolution failure
  - Firewall blocking request

429 Too Many Requests:
  - Rate limit exceeded
  - Too many concurrent requests
  - Quota exhausted for time window
```

**Recovery Strategies by Error Type:**

**401 Unauthorized:**

```
Detection:
  API returns 401 status code

Recovery:
  1. Log: "API authentication failed (401)"
  2. Check if OPENROUTER_API_KEY is set:
     if [ -z "$OPENROUTER_API_KEY" ]; then
       notifyUser("OpenRouter API key not found. Set OPENROUTER_API_KEY in .env")
     else
       notifyUser("Invalid OpenRouter API key. Check .env file")
     fi
  3. Skip all external models
  4. Fallback to embedded Claude only
  5. Notify user:
     "⚠️ API authentication failed. Falling back to embedded Claude.
      To fix: Add valid OPENROUTER_API_KEY to .env file."

No retry (authentication won't fix itself)
```

**500 Internal Server Error:**

```
Detection:
  API returns 500 status code

Recovery:
  1. Log: "Model service error (500): x-ai/grok-code-fast-1"
  2. Wait 5 seconds (give service time to recover)
  3. Retry ONCE
  4. If retry succeeds: Continue normally
  5. If retry fails: Skip this model, continue with others

Example:
  try {
    result = await claudish(model, prompt);
  } catch (error) {
    if (error.status === 500) {
      log("500 error, waiting 5s before retry...");
      await sleep(5000);

      try {
        result = await claudish(model, prompt); // Retry
        log("Retry succeeded");
      } catch (retryError) {
        log("Retry failed, skipping model");
        skipModel(model);
        continueWithRemaining();
      }
    }
  }

Max retries: 1 (avoid long delays)
```

**Network Errors:**

```
Detection:
  - Connection timeout
  - ECONNREFUSED
  - ETIMEDOUT
  - DNS resolution failure

Recovery:
  Retry up to 3 times with exponential backoff:

  async function retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (!isNetworkError(error)) throw error;  // Not retriable
        if (i === maxRetries - 1) throw error;     // Max retries reached

        const delay = Math.pow(2, i) * 1000;  // 1s, 2s, 4s
        log(`Network error, retrying in ${delay}ms (attempt ${i+1}/${maxRetries})`);
        await sleep(delay);
      }
    }
  }

  result = await retryWithBackoff(() => claudish(model, prompt));

Rationale: Network errors are often transient (temporary)
```

**429 Rate Limiting:**

```
Detection:
  API returns 429 status code
  Response may include Retry-After header

Recovery:
  1. Check Retry-After header (seconds to wait)
  2. If present: Wait for specified time
  3. If not present: Wait 60s (default)
  4. Retry ONCE after waiting
  5. If still rate limited: Skip model

Example:
  if (error.status === 429) {
    const retryAfter = error.headers['retry-after'] || 60;
    log(`Rate limited. Waiting ${retryAfter}s before retry...`);
    await sleep(retryAfter * 1000);

    try {
      result = await claudish(model, prompt);
    } catch (retryError) {
      log("Still rate limited after retry. Skipping model.");
      skipModel(model);
    }
  }

Note: Respect Retry-After header (avoid hammering API)
```

**Graceful Degradation for All API Failures:**

```
Fallback Strategy:

If ALL external models fail (401, 500, network, etc.):
  1. Log all failures
  2. Notify user:
     "⚠️ All external models failed. Falling back to embedded Claude.
      Errors:
      - Grok: Network timeout
      - Gemini: 500 Internal Server Error
      - GPT-5: Rate limited (429)
      - DeepSeek: Authentication failed (401)

      Proceeding with Claude Sonnet (embedded) only."

  3. Run embedded Claude review
  4. Present results with disclaimer:
     "Review completed using Claude only (external models unavailable).
      For multi-model consensus, try again later."

Benefits:
  - User still gets results (better than nothing)
  - Workflow completes (not aborted)
  - Clear error communication (user knows what happened)
```

---

### Pattern 3: Partial Success Strategies

**Scenario: 2 of 4 Models Complete Successfully**

In multi-model workflows, it's common for some models to succeed while others fail.

**Tracking Success/Failure:**

```
const results = await Promise.allSettled([
  Task({ subagent: "reviewer", model: "claude" }),
  Task({ subagent: "reviewer", model: "grok" }),
  Task({ subagent: "reviewer", model: "gemini" }),
  Task({ subagent: "reviewer", model: "gpt-5" })
]);

const successful = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');

log(`Success: ${successful.length}/4`);
log(`Failed: ${failed.length}/4`);
```

**Decision Logic:**

```
If N ≥ 2 successful:
  → Proceed with consolidation
  → Use N reviews (not all 4)
  → Notify user about failures

If N < 2 successful:
  → Insufficient data for consensus
  → Offer user choice:
    1. Retry failures
    2. Abort workflow
    3. Proceed with embedded Claude only

Example:

successful.length = 2 (Claude, Gemini)
failed.length = 2 (Grok timeout, GPT-5 500 error)

Action:
  notifyUser("2/4 models completed successfully. Proceeding with consolidation using 2 reviews.");

  consolidateReviews([
    "ai-docs/claude-review.md",
    "ai-docs/gemini-review.md"
  ]);

  presentResults({
    totalModels: 4,
    successful: 2,
    failureReasons: {
      grok: "Timeout after 30s",
      gpt5: "500 Internal Server Error"
    }
  });
```

**Communication Strategy:**

```
Be transparent with user about partial success:

❌ WRONG:
  "Multi-model review complete!"
  (User assumes all 4 models ran)

✅ CORRECT:
  "Multi-model review complete (2/4 models succeeded).

   Successful:
   - Claude Sonnet ✓
   - Gemini 2.5 Flash ✓

   Failed:
   - Grok: Timeout after 30s
   - GPT-5 Codex: 500 Internal Server Error

   Proceeding with 2-model consensus.
   Top issues: [...]"

User knows:
  - What succeeded (Claude, Gemini)
  - What failed (Grok, GPT-5)
  - Why they failed (timeout, 500 error)
  - What action was taken (2-model consensus)
```

**Consolidation Adapts to N Models:**

```
Consolidation logic must handle variable N:

✅ CORRECT - Flexible N:
  function consolidateReviews(reviewFiles) {
    const N = reviewFiles.length;
    log(`Consolidating ${N} reviews`);

    // Consensus thresholds adapt to N
    const unanimousThreshold = N;           // All N agree
    const strongThreshold = Math.ceil(N * 0.67);  // 67%+ agree
    const majorityThreshold = Math.ceil(N * 0.5); // 50%+ agree

    // Apply consensus analysis with dynamic thresholds
    ...
  }

❌ WRONG - Hardcoded N:
  // Assumes always 4 models
  const unanimousThreshold = 4;  // Breaks if N = 2!
```

---

### Pattern 4: User Cancellation Handling (Ctrl+C)

**Scenario: User Presses Ctrl+C During Workflow**

Users may cancel long-running workflows for various reasons:
- Taking too long
- Realized they want different configuration
- Accidentally triggered workflow
- Need to prioritize other work

**Cleanup Strategy:**

```
process.on('SIGINT', async () => {
  log("⚠️ User cancelled workflow (Ctrl+C)");

  // Step 1: Stop all running processes gracefully
  await stopAllAgents();

  // Step 2: Save partial results to files
  const partialResults = await collectPartialResults();
  await writeFile('ai-docs/partial-review.md', partialResults);

  // Step 3: Log what was completed vs cancelled
  log("Workflow cancelled");
  log("Completed:");
  log("  - PHASE 1: Requirements gathering ✓");
  log("  - PHASE 2: Architecture planning ✓");
  log("Cancelled:");
  log("  - PHASE 3: Implementation (in progress)");
  log("  - PHASE 4: Testing (not started)");
  log("  - PHASE 5: Review (not started)");

  // Step 4: Notify user
  console.log("\n⚠️ Workflow cancelled by user.");
  console.log("Partial results saved to ai-docs/partial-review.md");
  console.log("Completed phases: 2/5");

  // Step 5: Clean exit
  process.exit(0);
});
```

**Save Partial Results:**

```
Partial Results Format:

# Workflow Cancelled by User

**Status:** Cancelled during PHASE 3 (Implementation)
**Completed:** 2/5 phases (40%)
**Duration:** 8 minutes (of estimated 20 minutes)
**Timestamp:** 2025-11-22T14:30:00Z

## Completed Phases

### PHASE 1: Requirements Gathering ✓
- User requirements documented
- See: ai-docs/requirements.md

### PHASE 2: Architecture Planning ✓
- Architecture plan generated
- See: ai-docs/architecture-plan.md

## Cancelled Phases

### PHASE 3: Implementation (IN PROGRESS)
- Status: 30% complete
- Files created: src/auth.ts (partial)
- Files pending: src/routes.ts, src/services.ts

### PHASE 4: Testing (NOT STARTED)
- Pending: Test suite creation

### PHASE 5: Code Review (NOT STARTED)
- Pending: Multi-model review

## How to Resume

To resume from PHASE 3:
1. Review partial implementation in src/auth.ts
2. Complete remaining implementation
3. Continue with PHASE 4 (Testing)

Or restart workflow from beginning with updated requirements.
```

**Resumable Workflows (Advanced):**

```
Save workflow state for potential resume:

// During workflow execution
await saveWorkflowState({
  currentPhase: 3,
  totalPhases: 5,
  completedPhases: [1, 2],
  pendingPhases: [3, 4, 5],
  partialResults: {
    phase1: "ai-docs/requirements.md",
    phase2: "ai-docs/architecture-plan.md",
    phase3: "src/auth.ts (partial)"
  }
}, '.claude/workflow-state.json');

// On next invocation
const state = await loadWorkflowState('.claude/workflow-state.json');
if (state) {
  askUser("Found incomplete workflow from previous session. Resume? (Yes/No)");

  if (userSaysYes) {
    resumeFromPhase(state.currentPhase);
  } else {
    deleteWorkflowState();
    startFresh();
  }
}
```

---

### Pattern 5: Claudish Not Installed

**Scenario: User Requests Multi-Model Review but Claudish Missing**

**Detection:**

```
Check if claudish CLI is installed:

Bash: which claudish
Exit code 0: Installed ✓
Exit code 1: Not installed ✗

Or:

Bash: claudish --version
Output: "claudish version 2.2.1" → Installed ✓
Error: "command not found" → Not installed ✗
```

**Recovery Strategy:**

```
Step 1: Detect Missing Claudish
  hasClaudish = checkCommand('which claudish');

  if (!hasClaudish) {
    log("Claudish CLI not found");
    notifyUser();
  }

Step 2: Notify User with Installation Instructions
  "⚠️ Claudish CLI not found. External AI models unavailable.

   To enable multi-model review:
   1. Install: npm install -g claudish
   2. Configure: Set OPENROUTER_API_KEY in .env
   3. Re-run this command

   For now, falling back to embedded Claude Sonnet only."

Step 3: Fallback to Embedded Claude
  log("Falling back to embedded Claude review");
  runEmbeddedReviewOnly();

Benefits:
  - Workflow doesn't fail (graceful degradation)
  - User gets results (Claude review)
  - Clear instructions for enabling multi-model (future use)
```

**Example Implementation:**

```
Phase 2: Model Selection

Bash: which claudish
if [ $? -ne 0 ]; then
  # Claudish not installed
  echo "⚠️ Claudish CLI not found."
  echo "Install: npm install -g claudish"
  echo "Falling back to embedded Claude only."

  # Skip external model selection
  selectedModels=["claude-sonnet"]
else
  # Claudish available
  echo "Claudish CLI found ✓"
  # Proceed with external model selection
  selectedModels=["claude-sonnet", "grok", "gemini", "gpt-5"]
fi
```

---

### Pattern 6: Out of OpenRouter Credits

**Scenario: External Model API Call Fails Due to Insufficient Credits**

**Detection:**

```
API returns:
  - 402 Payment Required (HTTP status)
  - Or error message contains "credits", "quota", "billing"

Example error messages:
  - "Insufficient credits"
  - "Credit balance too low"
  - "Quota exceeded"
  - "Payment required"
```

**Recovery Strategy:**

```
Step 1: Detect Credit Exhaustion
  if (error.status === 402 || error.message.includes('credits')) {
    handleCreditExhaustion();
  }

Step 2: Log Event
  log("OpenRouter credits exhausted");

Step 3: Notify User
  "⚠️ OpenRouter credits exhausted. External models unavailable.

   To fix:
   1. Visit https://openrouter.ai
   2. Add credits to your account
   3. Re-run this command

   For now, falling back to embedded Claude Sonnet."

Step 4: Skip All External Models
  skipAllExternalModels();

Step 5: Fallback to Embedded Claude
  runEmbeddedReviewOnly();

Benefits:
  - Workflow completes (doesn't fail)
  - User gets results (Claude review)
  - Clear instructions for adding credits
```

**Proactive Credit Check (Advanced):**

```
Before expensive multi-model operation:

Step 1: Check OpenRouter Credit Balance
  Bash: curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
        https://openrouter.ai/api/v1/auth/key

  Response: { "data": { "usage": 1.23, "limit": 10.00 } }

Step 2: Estimate Cost
  estimatedCost = 0.008  // From cost estimation pattern

Step 3: Check if Sufficient Credits
  remainingCredits = 10.00 - 1.23 = 8.77
  if (estimatedCost > remainingCredits) {
    warnUser("Insufficient credits ($8.77 remaining, $0.008 needed)");
  }

Benefits:
  - Warn before operation (not after failure)
  - User can add credits first (avoid wasted time)
```

---

### Pattern 7: Retry Strategies

**Exponential Backoff:**

```
Retry with increasing delays to avoid overwhelming services:

Retry Schedule:
  1st retry: Wait 1 second
  2nd retry: Wait 2 seconds
  3rd retry: Wait 4 seconds
  Max retries: 3

Formula: delay = 2^attempt × 1000ms

async function retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetriable(error)) {
        throw error;  // Don't retry non-retriable errors
      }

      if (attempt === maxRetries - 1) {
        throw error;  // Max retries reached
      }

      const delay = Math.pow(2, attempt) * 1000;
      log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
}
```

**When to Retry:**

```
Retriable Errors (temporary, retry likely to succeed):
  ✓ Network errors (ETIMEDOUT, ECONNREFUSED)
  ✓ 500 Internal Server Error (service temporarily down)
  ✓ 503 Service Unavailable (overloaded, retry later)
  ✓ 429 Rate Limiting (wait for reset, then retry)

Non-Retriable Errors (permanent, retry won't help):
  ✗ 401 Unauthorized (bad credentials)
  ✗ 403 Forbidden (insufficient permissions)
  ✗ 404 Not Found (model doesn't exist)
  ✗ 400 Bad Request (invalid input)
  ✗ User cancellation (SIGINT)

Function:
  function isRetriable(error) {
    const retriableCodes = [500, 503, 429];
    const retriableTypes = ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'];

    return (
      retriableCodes.includes(error.status) ||
      retriableTypes.includes(error.code)
    );
  }
```

**Max Retry Limits:**

```
Set appropriate max retries by operation type:

Network requests: 3 retries (transient failures)
API calls: 1-2 retries (avoid long delays)
User input: 0 retries (ask user to retry manually)

Example:
  result = await retryWithBackoff(
    () => claudish(model, prompt),
    maxRetries: 2  // 2 retries for API calls
  );
```

---

## Integration with Other Skills

**error-recovery + multi-model-validation:**

```
Use Case: Handling external model failures in parallel execution

Step 1: Parallel Execution (multi-model-validation)
  Launch 5 models simultaneously

Step 2: Error Recovery (error-recovery)
  Model 1: Success ✓
  Model 2: Timeout → Skip (timeout handling pattern)
  Model 3: 500 error → Retry once, then skip
  Model 4: Success ✓
  Model 5: Success ✓

Step 3: Partial Success Strategy (error-recovery)
  3/5 successful (≥ 2 threshold)
  Proceed with consolidation using 3 reviews

Step 4: Consolidation (multi-model-validation)
  Consolidate 3 successful reviews
  Notify user about 2 failures
```

**error-recovery + quality-gates:**

```
Use Case: Test-driven loop with error recovery

Step 1: Run Tests (quality-gates TDD pattern)
  Bash: bun test

Step 2: If Test Execution Fails (error-recovery)
  Error type: Syntax error in test file

  Recovery:
    - Fix syntax error
    - Retry test execution
    - If still fails: Notify user, skip TDD phase

Step 3: If Tests Pass (quality-gates)
  Proceed to code review
```

**error-recovery + multi-agent-coordination:**

```
Use Case: Agent selection with fallback

Step 1: Agent Selection (multi-agent-coordination)
  Preferred: ui-developer-codex (external validation)

Step 2: Check Tool Availability (error-recovery)
  Bash: which claudish
  Result: Not found

Step 3: Fallback Strategy (error-recovery)
  Log: "Claudish not installed, falling back to embedded ui-developer"
  Use: ui-developer (embedded)

Step 4: Execution (multi-agent-coordination)
  Task: ui-developer
```

---

## Best Practices

**Do:**
- ✅ Set timeout limits (30s default, 60s for complex tasks)
- ✅ Retry transient errors (network, 500, 503)
- ✅ Use exponential backoff (avoid hammering services)
- ✅ Skip non-retriable errors (401, 404, don't retry)
- ✅ Provide graceful degradation (fallback to embedded Claude)
- ✅ Save partial results on cancellation
- ✅ Communicate transparently (tell user what failed and why)
- ✅ Adapt to partial success (N ≥ 2 reviews is useful)

**Don't:**
- ❌ Retry indefinitely (set max retry limits)
- ❌ Retry non-retriable errors (waste time on 401, 404)
- ❌ Fail entire workflow for single model failure (graceful degradation)
- ❌ Hide errors from user (be transparent)
- ❌ Discard partial results on failure (save what succeeded)
- ❌ Ignore user cancellation (handle SIGINT gracefully)
- ❌ Retry without delay (use backoff)

**Performance:**
- Exponential backoff: Prevents overwhelming services
- Max retries: Limits wasted time (3 retries = <10s overhead)
- Graceful degradation: Workflows complete despite failures

---

## Examples

### Example 1: Timeout with Retry

**Scenario:** Grok model times out, user retries with longer timeout

**Execution:**

```
Attempt 1:
  Bash: timeout 30s claudish --model x-ai/grok-code-fast-1 ...
  Result: Timeout after 30s

  Notify user:
    "⚠️ Grok timed out after 30s.
     Options:
     1. Retry with 60s timeout
     2. Skip Grok
     3. Cancel workflow"

  User selects: 1 (Retry)

Attempt 2:
  Bash: timeout 60s claudish --model x-ai/grok-code-fast-1 ...
  Result: Success after 45s

  Log: "Grok review completed on retry (45s)"
  Write: ai-docs/grok-review.md
  Continue with workflow
```

---

### Example 2: Partial Success (2/4 Models)

**Scenario:** 4 models selected, 2 fail, proceed with 2

**Execution:**

```
Launch 4 models in parallel:
  Task: Claude (embedded)
  Task: Grok (external)
  Task: Gemini (external)
  Task: GPT-5 (external)

Results:
  Claude: Success ✓ (2 min)
  Grok: Timeout ✗ (30s)
  Gemini: 500 error ✗ (retry failed)
  GPT-5: Success ✓ (3 min)

successful.length = 2 (Claude, GPT-5)
2 ≥ 2 ✓ (threshold met)

Notify user:
  "2/4 models completed successfully.

   Successful:
   - Claude Sonnet ✓
   - GPT-5 Codex ✓

   Failed:
   - Grok: Timeout after 30s
   - Gemini: 500 Internal Server Error (retry failed)

   Proceeding with 2-model consensus."

Consolidate:
  consolidateReviews([
    "ai-docs/claude-review.md",
    "ai-docs/gpt5-review.md"
  ]);

Present results with 2-model consensus
```

---

### Example 3: User Cancellation

**Scenario:** User presses Ctrl+C during PHASE 3

**Execution:**

```
Workflow starts:
  PHASE 1: Requirements ✓ (30s)
  PHASE 2: Architecture ✓ (2 min)
  PHASE 3: Implementation (in progress, 3 min elapsed)

User presses Ctrl+C:
  Signal: SIGINT received

Handler executes:
  Log: "User cancelled workflow (Ctrl+C)"

  Stop agents:
    - backend-developer (currently executing)
    - Terminate gracefully

  Collect partial results:
    - ai-docs/requirements.md ✓
    - ai-docs/architecture-plan.md ✓
    - src/auth.ts (30% complete)

  Save to file:
    Write: ai-docs/partial-implementation.md
      "# Workflow Cancelled
       Completed: PHASE 1, PHASE 2
       Partial: PHASE 3 (30%)
       Pending: PHASE 4, PHASE 5"

  Notify user:
    "⚠️ Workflow cancelled by user.
     Partial results saved to ai-docs/partial-implementation.md
     Completed: 2/5 phases (40%)"

  Exit: process.exit(0)
```

---

## Troubleshooting

**Problem: Workflow fails after single model timeout**

Cause: No graceful degradation

Solution: Continue with remaining models

```
❌ Wrong:
  if (timeout) {
    throw new Error("Model timed out");
  }

✅ Correct:
  if (timeout) {
    log("Model timed out, skipping");
    skipModel();
    continueWithRemaining();
  }
```

---

**Problem: Retrying 401 errors indefinitely**

Cause: Retrying non-retriable errors

Solution: Check if error is retriable

```
❌ Wrong:
  for (let i = 0; i < 10; i++) {
    try { return await fn(); }
    catch (e) { /* retry all errors */ }
  }

✅ Correct:
  for (let i = 0; i < 3; i++) {
    try { return await fn(); }
    catch (e) {
      if (!isRetriable(e)) throw e;  // Don't retry 401
      await sleep(delay);
    }
  }
```

---

**Problem: No visibility into what failed**

Cause: Not communicating errors to user

Solution: Transparently report all failures

```
❌ Wrong:
  "Review complete!" (hides 2 failures)

✅ Correct:
  "Review complete (2/4 models succeeded).
   Failed: Grok (timeout), Gemini (500 error)"
```

---

## Summary

Error recovery ensures resilient workflows through:

- **Timeout handling** (detect, retry with longer timeout, or skip)
- **API failure recovery** (retry transient, skip permanent)
- **Partial success strategies** (N ≥ 2 threshold, adapt to failures)
- **User cancellation** (graceful Ctrl+C, save partial results)
- **Missing tools** (claudish not installed, fallback to embedded)
- **Out of credits** (402 error, fallback to free models)
- **Retry strategies** (exponential backoff, max 3 retries)

With these patterns, workflows are **production-ready** and **resilient** to inevitable failures.

---

**Extracted From:**
- `/review` command error handling (external model failures)
- `/implement` command PHASE 2.5 (test-driven loop error recovery)
- Production experience with Claudish proxy failures
- Multi-model validation resilience requirements
