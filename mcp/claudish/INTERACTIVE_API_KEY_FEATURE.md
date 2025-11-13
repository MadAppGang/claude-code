# Interactive API Key Prompt Feature

**Added to:** v1.3.0
**Date:** 2025-11-12

## Overview

Added interactive prompting for OpenRouter API key when not set in environment variables. This makes claudish much easier to use for first-time users and allows quick experimentation with different API keys without managing environment variables.

---

## Problem

**Before this feature:**
- Users had to know how to set environment variables
- First-time users would hit an error immediately: "Error: OPENROUTER_API_KEY environment variable is required"
- No easy way to try different API keys without modifying shell config
- Higher barrier to entry for non-technical users

---

## Solution

**Interactive API key prompting:**
1. If running in **interactive mode** AND
2. `OPENROUTER_API_KEY` is not set AND
3. NOT in monitor mode
4. → Prompt user to enter API key

**Benefits:**
- ✅ Zero setup for first try - just run `claudish`
- ✅ Paste API key when prompted
- ✅ Session-only (not saved to disk)
- ✅ Validates format (warns if doesn't start with `sk-or-v1-`)
- ✅ Non-interactive mode still requires env var (fast fail for CI/CD)

---

## Implementation

### 1. Created `promptForApiKey()` Function

**File:** `src/simple-selector.ts`

```typescript
export async function promptForApiKey(): Promise<string> {
  return new Promise((resolve) => {
    console.log("\n\x1b[1m\x1b[36mOpenRouter API Key Required\x1b[0m\n");
    console.log("\x1b[2mGet your free API key from: https://openrouter.ai/keys\x1b[0m\n");
    console.log("Enter your OpenRouter API key:");
    console.log("\x1b[2m(it will not be saved, only used for this session)\x1b[0m\n");

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false, // CRITICAL: Avoid stdin interference
    });

    let apiKey: string | null = null;

    rl.on("line", (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        console.log("\x1b[31mError: API key cannot be empty\x1b[0m");
        return;
      }

      // Validation: warn if format doesn't match OpenRouter
      if (!trimmed.startsWith("sk-or-v1-")) {
        console.log("\x1b[33mWarning: OpenRouter API keys usually start with 'sk-or-v1-'\x1b[0m");
        console.log("\x1b[2mContinuing anyway...\x1b[0m");
      }

      apiKey = trimmed;
      rl.close();
    });

    rl.on("close", () => {
      if (apiKey) {
        // CRITICAL: Clean stdin before resolving
        process.stdin.pause();
        process.stdin.removeAllListeners("data");
        process.stdin.removeAllListeners("end");
        process.stdin.removeAllListeners("error");
        process.stdin.removeAllListeners("readable");

        if (process.stdin.isTTY && process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }

        // Wait for stdin to fully detach
        setTimeout(() => {
          resolve(apiKey);
        }, 200);
      } else {
        console.error("\x1b[31mError: API key is required\x1b[0m");
        process.exit(1);
      }
    });
  });
}
```

**Key features:**
- Clean, minimal UI with colors
- Proper stdin cleanup (prevents interference with Claude Code)
- Format validation with helpful warning
- Security note that key is not saved
- 200ms delay for complete stdin detach

### 2. Updated `cli.ts` to Allow Missing API Key

**Changes:**
1. Moved interactive mode determination BEFORE API key check
2. Only require API key in non-interactive mode
3. Allow undefined API key in interactive mode (will be prompted)

**Code:**
```typescript
// Determine if this will be interactive mode BEFORE API key check
if (!config.claudeArgs || config.claudeArgs.length === 0) {
  config.interactive = true;
}

// Handle API keys based on mode
if (!config.monitor) {
  const apiKey = process.env[ENV.OPENROUTER_API_KEY];
  if (!apiKey) {
    // In interactive mode, we'll prompt for it later
    // In non-interactive mode, it's required now
    if (!config.interactive) {
      console.error("Error: OPENROUTER_API_KEY environment variable is required");
      console.error("Get your API key from: https://openrouter.ai/keys");
      console.error("");
      console.error("Set it now:");
      console.error("  export OPENROUTER_API_KEY='sk-or-v1-...'");
      process.exit(1);
    }
    // Will be prompted for in interactive mode
    config.openrouterApiKey = undefined;
  } else {
    config.openrouterApiKey = apiKey;
  }
}
```

### 3. Updated `index.ts` to Prompt When Needed

**Changes:**
Added API key prompt before model selector:

```typescript
// Prompt for OpenRouter API key if not set (interactive mode only, not monitor mode)
if (config.interactive && !config.monitor && !config.openrouterApiKey) {
  config.openrouterApiKey = await promptForApiKey();
  console.log(""); // Empty line after input
}

// Show interactive model selector ONLY in interactive mode when model not specified
if (config.interactive && !config.monitor && !config.model) {
  config.model = await selectModelInteractively();
  console.log(""); // Empty line after selection
}
```

**Flow:**
1. Check Claude Code is installed
2. **NEW:** Prompt for API key if missing (interactive only)
3. Prompt for model if not specified (interactive only)
4. Continue with normal flow

---

## User Experience

### Before (Required Env Var)

```bash
$ claudish
Error: OPENROUTER_API_KEY environment variable is required
Get your API key from: https://openrouter.ai/keys

$ export OPENROUTER_API_KEY=sk-or-v1-...
$ claudish
# Works!
```

### After (Optional Env Var)

```bash
$ claudish

OpenRouter API Key Required

Get your free API key from: https://openrouter.ai/keys

Enter your OpenRouter API key:
(it will not be saved, only used for this session)

sk-or-v1-...  [user pastes key]

Select an OpenRouter model:

  1. Grok Code Fast
     xAI - Fast coding model

  2. GPT-5 Codex
     OpenAI - Advanced coding model
...
```

**Much smoother!** No need to understand environment variables.

---

## Testing

### Test Cases

1. ✅ **Interactive mode without API key**
   - Prompts for API key
   - Validates format (warns if wrong)
   - Accepts and continues

2. ✅ **Interactive mode with API key**
   - Skips prompt
   - Uses env var directly

3. ✅ **Non-interactive mode without API key**
   - Shows error immediately
   - Exits with code 1
   - Explains how to set env var

4. ✅ **Non-interactive mode with API key**
   - Works normally
   - No changes to existing behavior

5. ✅ **Monitor mode**
   - Never prompts for OpenRouter API key
   - Uses Anthropic API key instead

### Manual Testing

```bash
# Test 1: Interactive without env var (NEW behavior)
unset OPENROUTER_API_KEY
export ANTHROPIC_API_KEY=sk-ant-api03-placeholder
claudish
# → Should prompt for API key

# Test 2: Interactive with env var (existing behavior)
export OPENROUTER_API_KEY=sk-or-v1-...
export ANTHROPIC_API_KEY=sk-ant-api03-placeholder
claudish
# → Should skip prompt, show model selector

# Test 3: Non-interactive without env var (existing behavior)
unset OPENROUTER_API_KEY
export ANTHROPIC_API_KEY=sk-ant-api03-placeholder
claudish --model x-ai/grok-code-fast-1 "test prompt"
# → Should error immediately

# Test 4: Non-interactive with env var (existing behavior)
export OPENROUTER_API_KEY=sk-or-v1-...
export ANTHROPIC_API_KEY=sk-ant-api03-placeholder
claudish --model x-ai/grok-code-fast-1 "test prompt"
# → Should work normally
```

---

## Documentation Updates

### 1. README.md

**Updated sections:**
- **Features:** Added "Interactive setup - Prompts for API key and model if not provided"
- **Quick Start:** Split into two options:
  - Option 1: Interactive Mode (just run `claudish`)
  - Option 2: With Environment Variables (traditional)
- **Environment Variables:** Updated table to show API key is optional in interactive mode

### 2. CHANGELOG.md

**Added comprehensive section:**
- "✨ Feature: Interactive API Key Prompt"
- What Changed
- Benefits
- Usage examples
- Before/after comparison

---

## Security Considerations

### What We Did Right

1. **Session-only storage**
   - API key is only stored in memory
   - Never written to disk or config files
   - Lost when process ends

2. **Clear user communication**
   - Prompt explicitly says: "(it will not be saved, only used for this session)"
   - Users know it's temporary

3. **No password masking confusion**
   - We don't mask input (readline limitation)
   - But we also don't echo/log the key anywhere
   - Key only used for API requests

4. **Validation without strict enforcement**
   - Warns if format looks wrong
   - But still allows it (maybe they have a special key format)

### What Users Should Know

- **Still recommend env var for regular use** - Documented in README
- **Session-only is a feature** - Good for testing/trying different keys
- **Terminal history risk** - If they type (vs paste), key might be in shell history
  - But this is same risk as `export OPENROUTER_API_KEY=...`
  - Less risk than saving to file

---

## Future Improvements

### Possible Enhancements

1. **Secure input (password masking)**
   - Could use a library like `read` or `inquirer` for hidden input
   - Trade-off: Adds dependency, might complicate stdin handling

2. **Optional save to .env**
   - Prompt: "Save for future use? (y/n)"
   - Auto-create/update `.env` file
   - Security concern: File permissions, git tracking

3. **API key validation**
   - Actually test the key with OpenRouter API
   - Show error if invalid before starting Claude Code
   - Trade-off: Extra API call, slower startup

4. **Multi-key management**
   - Store multiple API keys (project-specific)
   - Select from saved keys
   - Requires local storage/config

---

## Metrics to Track

**Success indicators:**
- Reduced "API key not set" error reports
- More first-time successful runs
- User feedback about ease of use
- Adoption rate increase

**Potential issues:**
- Users confused about temporary nature
- Users expecting key to be saved
- Terminal history concerns

---

## Summary

**What changed:**
- ✅ Added `promptForApiKey()` function
- ✅ Updated CLI parsing to allow missing API key in interactive mode
- ✅ Integrated prompt into main flow
- ✅ Updated all documentation

**Impact:**
- 🎯 **Much easier first-time experience** - Just run and paste key
- 🎯 **Maintains existing workflows** - Env var still works (and is preferred)
- 🎯 **Zero breaking changes** - All existing usage identical
- 🎯 **Secure** - Session-only, not saved

**Status:** ✅ **Implemented and documented in v1.3.0**

---

**Added by:** Jack Rudenko
**Date:** 2025-11-12
**Version:** 1.3.0
