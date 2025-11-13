# Code Review Configuration Fixes

**Date**: 2025-11-13
**Issue**: External code reviewers configuration and naming confusion
**Status**: ✅ FIXED

---

## Problems Identified

### 1. **Wrong Agent Being Called**
**Issue**: User reported seeing `frontend:plan-reviewer` being used for code review instead of `frontend:reviewer`

**Evidence**:
```
⏺ frontend:plan-reviewer(External Codex review of implementation)
  ⎿  Done (1 tool use · 24.5k tokens · 2m 17s)
```

**Root Cause**: The `plan-reviewer` agent is designed for reviewing architecture **plans**, not implementation **code**. Using it for code review is incorrect.

### 2. **Model Naming Confusion**
**Issue**: User saw "External Codex (GPT-4o)" which is contradictory

**Evidence**: Review results showing "GPT-4o" when user expected "Codex"

**Root Cause**:
- "Codex" typically refers to OpenAI's Codex model
- "GPT-4o" is a different OpenAI model
- The orchestration was unclear about which model was actually being called

### 3. **No User Choice for External Code Reviewers**
**Issue**: External code review models were hardcoded or configured only in `.claude/settings.json`

**Problem**: Users couldn't easily choose which external models to use for code review during the workflow

---

## Solutions Implemented

### 1. **Added PHASE 1.6: Configure External Code Reviewers** ✅

**Location**: `commands/implement.md` lines 898-1018

**What it does**:
- Asks user which external AI models they want for code review in PHASE 3
- Happens AFTER plan approval, BEFORE implementation starts
- Gives user explicit control over code review configuration

**User Selection Options**:
- **Grok Code Fast (xAI)** - Fast code analysis with modern patterns
- **GPT-4o (OpenAI)** - Advanced reasoning for complex logic
- **Claude Opus (Anthropic)** - Deep quality and maintainability analysis
- **Qwen Coder (Alibaba)** - Strong at finding bugs and optimizations
- **Other** (skip) - Only use Claude Sonnet for review

**Model Mapping**:
```javascript
const modelMapping = {
  "Grok Code Fast (xAI)": "x-ai/grok-code-fast-1",
  "GPT-4o (OpenAI)": "openai/gpt-4o",
  "Claude Opus (Anthropic)": "anthropic/claude-opus-4-20250514",
  "Qwen Coder (Alibaba)": "qwen/qwq-32b-preview"
}
```

**Example User Experience**:
```
## 🤖 External Code Reviewers Configuration

Before starting implementation, let's configure which external AI models
will review your code in PHASE 3.

**Why use external code reviewers?**
- ✅ Multiple independent perspectives catch more issues
- ✅ Different AI models have different strengths
- ✅ Cross-model consensus increases confidence

Which external AI models would you like to review your implementation
code in PHASE 3? (Select one or more, or select 'Other' to skip)

□ Grok Code Fast (xAI)
□ GPT-4o (OpenAI)
□ Claude Opus (Anthropic)
□ Qwen Coder (Alibaba)
```

**Stored as**: `code_review_models` array for use in PHASE 3

---

### 2. **Updated PHASE 3 to Use User-Selected Models** ✅

**Location**: `commands/implement.md` lines 1828-1834

**Before**:
```javascript
// Read from .claude/settings.json
const reviewModels = settings?.pluginSettings?.frontend?.reviewModels ?? ["grok-fast", "code-review"]
```

**After**:
```javascript
// Use models selected by user in PHASE 1.6
const external_review_models = code_review_models  // From PHASE 1.6
// e.g., ["x-ai/grok-code-fast-1", "openai/gpt-4o"]
```

**Impact**: External code reviewers are now explicitly chosen by the user during the workflow, not hidden in config files

---

### 3. **Clarified Agent Usage in PHASE 3** ✅

**Location**: `commands/implement.md` line 1904

**Explicit Instruction Added**:
```javascript
// Use Task tool with `subagent_type: frontend:reviewer` (**NOT** `frontend:plan-reviewer`)
```

**Why this matters**:
- `frontend:reviewer` - Designed for reviewing implementation code ✅
- `frontend:plan-reviewer` - Designed for reviewing architecture plans ❌

**Agent Responsibilities**:
| Agent | Purpose | Used In |
|-------|---------|---------|
| `frontend:architect` | Create architecture plans | PHASE 1, 1.5b |
| `frontend:plan-reviewer` | Review architecture plans (via external AI) | PHASE 1.5 |
| `frontend:developer` | Implement features | PHASE 2 |
| `frontend:reviewer` | Review implementation code (via external AI) | PHASE 3 ✅ |
| `frontend:tester` | Manual UI testing in browser | PHASE 3 |

---

### 4. **Fixed Model Name Display** ✅

**Location**: `commands/implement.md` lines 1917-1926

**Added Model Name Mapping for Display**:
```javascript
/**
 * Model Name Display: When presenting results, show friendly names:
 */
const displayNames = {
  "x-ai/grok-code-fast-1": "Grok Code Fast (xAI)",
  "openai/gpt-4o": "GPT-4o (OpenAI)",
  "anthropic/claude-opus-4-20250514": "Claude Opus (Anthropic)",
  "qwen/qwq-32b-preview": "Qwen Coder (Alibaba)"
}
```

**Example Output**:
```
PHASE 3: Code Review Results

| Reviewer                   | Status     | Critical Issues |
|----------------------------|------------|-----------------|
| Internal Reviewer (Claude Sonnet) | ✅ APPROVED | 0               |
| Grok Code Fast (xAI)       | ✅ APPROVED | 0               |
| GPT-4o (OpenAI)           | ✅ APPROVED | 0               |
```

**NOT**: "External Codex (GPT-4o)" ❌ (confusing!)

---

### 5. **Updated Workflow Strategy Descriptions** ✅

**Location**: `commands/implement.md` lines 1807-1826

**Before**:
- "Default: 3 reviewers (Claude Sonnet + Grok + GPT-5 Codex)"
- "Configurable via `pluginSettings.frontend.reviewModels`"

**After**:
- "Example: 3 reviewers (Claude Sonnet + Grok Code Fast + GPT-4o)"
- "External models configured by user in PHASE 1.6"

**Why**: Makes it clear that:
1. These are examples, not hardcoded defaults
2. User controls configuration in PHASE 1.6
3. Model names are accurate (GPT-4o, not "GPT-5 Codex")

---

### 6. **Added PHASE 1.6 to Global TODO List** ✅

**Location**: `commands/implement.md` lines 155-157

**Added**:
```javascript
- content: "PHASE 1.6: Configure external code reviewers for PHASE 3"
  status: "pending"
  activeForm: "PHASE 1.6: Configuring external code reviewers"
```

**Placement**: After PHASE 1.5, before PHASE 2

**Why**: Ensures orchestrator tracks this new phase in the workflow

---

## Workflow Changes

### Old Workflow (Before Fix):

```
PHASE 1: Architecture Planning
  ↓
PHASE 1.5: Multi-Model Plan Review (optional)
  ↓
PHASE 2: Implementation
  ↓
PHASE 3: Code Review
  • Uses hardcoded or config-file models ❌
  • May use wrong agent (plan-reviewer) ❌
  • Confusing model names ❌
```

### New Workflow (After Fix):

```
PHASE 1: Architecture Planning
  ↓
PHASE 1.5: Multi-Model Plan Review (optional)
  ↓
PHASE 1.6: Configure External Code Reviewers ✅ NEW
  • User selects which external models to use
  • Clear model names and descriptions
  • Stored for use in PHASE 3
  ↓
PHASE 2: Implementation
  ↓
PHASE 3: Code Review ✅ FIXED
  • Uses models selected in PHASE 1.6
  • Uses correct agent (frontend:reviewer)
  • Clear model name display
```

---

## Benefits of These Fixes

### 1. **User Control** ✅
- Users now explicitly choose which external code reviewers to use
- No more hidden configuration in settings files
- Can skip external reviewers if desired (Claude Sonnet only)

### 2. **Correct Agent Usage** ✅
- `frontend:reviewer` used for code review (correct!)
- `frontend:plan-reviewer` used only for plan review (correct!)
- Clear documentation to prevent future confusion

### 3. **Clear Model Naming** ✅
- "Grok Code Fast (xAI)" - Clear provider and model
- "GPT-4o (OpenAI)" - Accurate model name
- No more "Codex (GPT-4o)" confusion

### 4. **Better UX** ✅
- User sees exactly which models are reviewing their code
- Results show friendly names (not just model IDs)
- Transparent about what's happening

### 5. **Flexibility** ✅
- Easy to add new external models in the future
- Users can experiment with different model combinations
- No code changes needed to try different reviewers

---

## Example: Complete PHASE 1.6 Flow

### Step 1: User Selects Models

```
## 🤖 External Code Reviewers Configuration

Which external AI models would you like to review your implementation
code in PHASE 3?

User selects:
☑ Grok Code Fast (xAI)
☑ GPT-4o (OpenAI)
☐ Claude Opus (Anthropic)
☐ Qwen Coder (Alibaba)

Result: code_review_models = ["x-ai/grok-code-fast-1", "openai/gpt-4o"]
```

### Step 2: Confirmation

```
✅ PHASE 1.6 Complete: External Code Reviewers Configured

Configuration:
- Internal reviewer: Claude Sonnet (always runs)
- External reviewers: Grok Code Fast (xAI), GPT-4o (OpenAI)
- Total PHASE 3 reviewers: 3

These reviewers will analyze your implementation in PHASE 3 after
the developer completes work.
```

### Step 3: PHASE 3 Uses Selected Models

```
PHASE 3: Launching 3 code reviewers in parallel...

⏺ frontend:reviewer(Code review with Claude Sonnet)
  ⎿  Done (18 tool uses · 42.9k tokens · 3m 5s)

⏺ frontend:reviewer(PROXY_MODE: x-ai/grok-code-fast-1)
  ⎿  Done (5 tool uses · 38.2k tokens · 1m 45s)

⏺ frontend:reviewer(PROXY_MODE: openai/gpt-4o)
  ⎿  Done (5 tool uses · 39.1k tokens · 2m 10s)

PHASE 3: Code Review Results

| Reviewer                     | Status      | Critical | Medium | Low |
|------------------------------|-------------|----------|--------|-----|
| Claude Sonnet (Internal)     | ✅ APPROVED | 0        | 2      | 3   |
| Grok Code Fast (xAI)         | ✅ APPROVED | 0        | 1      | 2   |
| GPT-4o (OpenAI)              | ✅ APPROVED | 0        | 0      | 1   |

All reviewers approved! ✅
```

---

## Testing the Fixes

### Test Scenario 1: Select Multiple External Reviewers

```bash
/implement Add a feature...

# PHASE 1.6 will appear after plan approval:
→ Select: Grok Code Fast + GPT-4o

# PHASE 3 should show:
- 3 reviewers total (Claude Sonnet + Grok + GPT-4o)
- Correct agent used: frontend:reviewer (not plan-reviewer)
- Clear model names in results
```

### Test Scenario 2: Skip External Reviewers

```bash
/implement Add a feature...

# PHASE 1.6:
→ Select: Other (skip)

# PHASE 3 should show:
- 1 reviewer total (Claude Sonnet only)
- No external reviewers called
```

### Test Scenario 3: API-Focused Workflow

```bash
/implement Implement API compliance...

# Workflow detected: API_FOCUSED
# PHASE 1.6:
→ Select: Grok + GPT-4o

# PHASE 3 should show:
- 3 code reviewers (Claude + Grok + GPT-4o)
- UI tester SKIPPED (correct for API workflow)
```

---

## Verification Checklist

After running `/implement`, verify:

### PHASE 1.6:
- [ ] User is asked to select external code reviewers
- [ ] Options are clearly named (e.g., "GPT-4o (OpenAI)")
- [ ] Can select multiple models or skip
- [ ] Confirmation shows selected models
- [ ] Todo list includes PHASE 1.6

### PHASE 3:
- [ ] Correct number of reviewers launched (1 + selected external models)
- [ ] Uses `frontend:reviewer` agent (not `plan-reviewer`)
- [ ] PROXY_MODE uses correct model IDs (e.g., `openai/gpt-4o`)
- [ ] Results show friendly model names (e.g., "GPT-4o (OpenAI)")
- [ ] No "Codex (GPT-4o)" confusion

### General:
- [ ] Workflow feels intuitive
- [ ] User understands which models are reviewing
- [ ] Results are clear and actionable

---

## Migration Notes

### For Existing Projects Using `.claude/settings.json`:

**Old Configuration** (still works but deprecated):
```json
{
  "pluginSettings": {
    "frontend": {
      "reviewModels": ["grok-fast", "code-review"]
    }
  }
}
```

**New Approach** (recommended):
- Remove `reviewModels` from settings
- Select models interactively in PHASE 1.6 during workflow
- More flexible and transparent

**Backward Compatibility**:
- Old config will be ignored
- User must select models in PHASE 1.6 (one-time per workflow run)
- This gives user explicit control

---

## Summary

**What Changed**:
1. ✅ Added PHASE 1.6 for user selection of external code reviewers
2. ✅ Updated PHASE 3 to use selected models (not config)
3. ✅ Clarified agent usage (`frontend:reviewer` for code, NOT `plan-reviewer`)
4. ✅ Fixed model naming (GPT-4o, not "Codex")
5. ✅ Updated workflow descriptions and examples
6. ✅ Added PHASE 1.6 to global TODO list

**Why It Matters**:
- Users have explicit control over code review configuration
- Correct agent used for each purpose
- Clear, accurate model naming
- Better transparency and UX

**Expected Impact**:
- No more confusion about which models are being used
- No more wrong agent being called
- Users can experiment with different reviewer combinations
- Clearer review results with proper model attribution

---

**Status**: ✅ ALL FIXES IMPLEMENTED

**Next**: Test with real `/implement` workflow to verify behavior

**Version**: Frontend Plugin v3.4.0 (includes these fixes)

---

**Implementation Date**: November 13, 2025
**Issue Reporter**: User (Jack)
**Implemented By**: Claude (Sonnet 4.5)
