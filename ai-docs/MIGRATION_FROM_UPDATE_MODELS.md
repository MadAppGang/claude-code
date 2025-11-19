# Migration from /update-models Command

**Version:** 1.0.0
**Status:** Migration Guide
**Date:** 2025-11-19
**Target Audience:** Plugin maintainers and users

## Executive Summary

The `/update-models` command (if it existed in Claude Code) is **deprecated** in favor of delegating model management to **Claudish**. This migration guide explains the new architecture and how to transition.

**TL;DR:**
- ❌ **OLD**: `/update-models` command in Claude Code
- ✅ **NEW**: `claudish --list-models --json` (dynamic queries)
- ✅ **FUTURE**: `claudish --update-models` (if implemented)

## Background

### Old Architecture (Hypothetical)

If `/update-models` existed, it would have:
- Fetched model list from OpenRouter API
- Cached in Claude Code plugin directory
- Updated local `recommended-models.json`
- Duplicated Claudish's functionality

**Problems:**
- ❌ Duplicate caching logic
- ❌ Duplicate API integration
- ❌ Maintenance burden across two tools
- ❌ Inconsistent model data

### New Architecture (Recommended)

**Claudish as Single Source of Truth:**
- ✅ Claudish owns `recommended-models.json`
- ✅ Claude Code queries Claudish dynamically
- ✅ No duplicate infrastructure
- ✅ Simpler, cleaner architecture

**Data Flow:**
```
Claude Code → claudish --list-models --json → recommended-models.json → OpenRouter API
                                               (cached in Claudish)
```

## Migration Steps

### For Plugin Maintainers

#### Step 1: Remove /update-models Command

**If the command exists:**

1. Mark as deprecated in documentation
2. Add deprecation warning to command output
3. Update command to redirect to Claudish
4. Remove in future major version

**Example Deprecation Notice:**
```typescript
// In /update-models command
console.warn("⚠️  WARNING: /update-models is deprecated");
console.warn("Use Claudish to manage model lists:");
console.warn("");
console.warn("  claudish --list-models --json     # Query current models");
console.warn("  claudish --update-models          # Update from API (future)");
console.warn("");
console.warn("Learn more: ai-docs/CLAUDISH_INTEGRATION_ARCHITECTURE.md");
```

#### Step 2: Update Commands to Query Claudish

**Before (Static Model List):**
```typescript
// commands/review.md or similar
const REVIEW_MODELS = [
  "x-ai/grok-code-fast-1",
  "google/gemini-2.5-flash",
  "openai/gpt-5.1-codex"
];
```

**After (Dynamic Claudish Query):**
```typescript
// commands/review.md or similar
const EMBEDDED_DEFAULT_MODELS = [
  { id: "x-ai/grok-code-fast-1", name: "Grok", category: "coding" },
  { id: "google/gemini-2.5-flash", name: "Gemini", category: "reasoning" }
];

async function getRecommendedModels() {
  try {
    const { stdout } = await Bash("claudish --list-models --category=coding --json");
    return JSON.parse(stdout).models;
  } catch {
    console.warn("Could not query Claudish, using embedded defaults");
    return EMBEDDED_DEFAULT_MODELS;
  }
}
```

**See:** `skills/claudish-integration/SKILL.md` for complete patterns

#### Step 3: Update Documentation

**Remove references to /update-models:**
- Plugin README
- Command documentation
- User guides

**Add Claudish integration docs:**
- Link to `skills/claudish-integration/SKILL.md`
- Explain dynamic model queries
- Document user override mechanism (CLAUDE.md)

#### Step 4: Test Integration

**Verify:**
- ✅ Commands query Claudish successfully
- ✅ JSON parsing works correctly
- ✅ Graceful fallback to embedded defaults
- ✅ User overrides from CLAUDE.md work
- ✅ Error messages are clear and helpful

**Test Cases:**
1. Claudish installed and up-to-date
2. Claudish not installed (fallback to defaults)
3. Claudish version too old (fallback to defaults)
4. Invalid JSON from Claudish (error handling)
5. Empty model list (error handling)

### For Users

#### Step 1: Install or Update Claudish

**Check current version:**
```bash
claudish --version
```

**Update to v1.2.0+ (with JSON support):**
```bash
npm install -g claudish@latest
```

**Verify JSON support:**
```bash
claudish --list-models --json | jq '.'
# Should output valid JSON
```

#### Step 2: Remove Old Workflows

**If you had custom /update-models workflows:**

**Before:**
```bash
# Old workflow (hypothetical)
claude /update-models
```

**After:**
```bash
# No action needed - commands query Claudish automatically
# Models are always up-to-date from Claudish
```

#### Step 3: Configure User Overrides (Optional)

**If you want to specify preferred models:**

**Create or edit `.claude/CLAUDE.md`:**
```markdown
## Claudish Configuration

**Recommended Models for Code Review:**
- x-ai/grok-code-fast-1
- google/gemini-2.5-flash
- openai/gpt-5.1-codex

**Model Categories:**
- coding: grok, minimax
- reasoning: gpt-5, gemini
```

**Commands will automatically use these models if specified.**

#### Step 4: Verify Integration

**Test dynamic model query:**
```bash
claudish --list-models --json | jq '.models | length'
# Should show number of available models
```

**Test command integration:**
```bash
# Run a command that uses models (e.g., /review)
claude /review --help
# Should show current model recommendations
```

## Troubleshooting

### Issue 1: "Command /update-models not found"

**This is expected** - the command has been removed or deprecated.

**Solution:**
```bash
# Query models via Claudish
claudish --list-models --json

# Commands automatically query Claudish, no manual update needed
```

### Issue 2: "Could not query Claudish"

**Cause:** Claudish not installed or version too old

**Solution:**
```bash
# Install Claudish
npm install -g claudish@latest

# Verify installation
claudish --version
# Should show v1.2.0 or higher
```

### Issue 3: "Invalid JSON from Claudish"

**Cause:** Claudish version too old (no JSON support)

**Solution:**
```bash
# Update Claudish
npm install -g claudish@latest

# Verify JSON support
claudish --list-models --json | jq '.'
```

**Temporary Workaround:**
Commands will fall back to embedded defaults automatically.

### Issue 4: "Embedded defaults used instead of Claudish"

**Cause:** Multiple possible reasons

**Diagnosis:**
```bash
# Check Claudish installation
which claudish

# Check version
claudish --version

# Test JSON output
claudish --list-models --json
```

**Solutions:**
- If not found: `npm install -g claudish@latest`
- If old version: `npm update -g claudish`
- If JSON fails: Check error message, report bug if needed

### Issue 5: "User overrides from CLAUDE.md not working"

**Cause:** Incorrect format or file location

**Solution:**

**Check file location:**
```bash
ls -la .claude/CLAUDE.md
# Should exist in project root's .claude/ directory
```

**Check format:**
```markdown
## Claudish Configuration

**Recommended Models for Code Review:**
- x-ai/grok-code-fast-1
- google/gemini-2.5-flash

# Note: Use bullet points (-)
# Model IDs must match exactly
```

**Verify parsing:**
```bash
# Check command output for "Using models from CLAUDE.md"
claude /review
```

## Timeline and Deprecation Plan

### Phase 1: Claudish Enhancement (Week 1)

**Status:** In Progress

**Tasks:**
- ✅ Add `--list-models --json` to Claudish
- ✅ Add `--list-models --category=<category>` to Claudish
- ✅ Release Claudish v1.2.0

**User Impact:** None (new features, backward compatible)

### Phase 2: Integration (Week 2)

**Status:** Planned

**Tasks:**
- Update commands to query Claudish
- Add user override support (CLAUDE.md)
- Add graceful fallbacks
- Update documentation

**User Impact:**
- Commands get dynamic model lists
- User overrides available
- Better model recommendations

### Phase 3: Deprecation (Week 3)

**Status:** Planned

**Tasks:**
- Mark /update-models as deprecated (if exists)
- Add deprecation warnings
- Update all documentation
- Announce to users

**User Impact:**
- Deprecation warning shown
- Redirect to Claudish
- Old workflow still works (graceful period)

### Phase 4: Removal (v4.0.0 or later)

**Status:** Future

**Tasks:**
- Remove /update-models command entirely
- Clean up legacy code
- Update major version

**User Impact:**
- /update-models no longer available
- Must use Claudish (already transitioned)
- Breaking change (major version bump)

## Comparison: Old vs New

### Old Architecture (Hypothetical)

```
User → /update-models → OpenRouter API → Claude Code cache → recommended-models.json (local)
                                          ↓
                       Commands read from local cache
                       (static until next /update-models)
```

**Pros:**
- Simple for users (single command)

**Cons:**
- ❌ Duplicate infrastructure (also in Claudish)
- ❌ Static until manually updated
- ❌ Inconsistent with Claudish data
- ❌ Maintenance burden

### New Architecture (Recommended)

```
User → (no action) → Commands → claudish --list-models --json → Claudish cache → recommended-models.json
                                                                                   ↓
                                                                    OpenRouter API (cached)
```

**Pros:**
- ✅ Single source of truth (Claudish)
- ✅ Dynamic queries (always current)
- ✅ No duplicate infrastructure
- ✅ Simpler architecture
- ✅ User overrides supported (CLAUDE.md)

**Cons:**
- Requires Claudish installation
- (Mitigated by graceful fallback to embedded defaults)

## FAQ

### Q: Do I need to manually update models now?

**A:** No. Commands query Claudish dynamically, so models are always current from Claudish's cache.

### Q: What if I don't have Claudish installed?

**A:** Commands gracefully fall back to embedded default models. You'll see a warning:
```
Could not query Claudish, using embedded defaults
To fix: npm install -g claudish@latest
```

### Q: Can I still use custom models?

**A:** Yes! Two ways:
1. **CLAUDE.md overrides** - Specify preferred models in project config
2. **Command arguments** - Pass `--models=model1,model2` (if supported)

### Q: Will /update-models be removed?

**A:** If it exists, it will be deprecated first (with warnings), then removed in a future major version. Plenty of advance notice will be given.

### Q: How do I update models now?

**A:** Models are updated automatically when Claudish updates its cache. Future versions may add `claudish --update-models` for manual updates.

### Q: What about offline usage?

**A:** Embedded defaults work offline. If you need specific models offline, use CLAUDE.md overrides.

### Q: Can I still use the old workflow?

**A:** During deprecation period (Phase 3), yes. After removal (Phase 4), you must use the new workflow.

## Benefits of Migration

### For Users

- ✅ **No manual updates** - Models always current from Claudish
- ✅ **User overrides** - Specify preferred models via CLAUDE.md
- ✅ **Better recommendations** - Claudish curates best models
- ✅ **Graceful fallback** - Works offline with embedded defaults
- ✅ **Clear errors** - Helpful messages guide troubleshooting

### For Maintainers

- ✅ **Single source of truth** - Claudish owns model data
- ✅ **No duplicate code** - No API client in Claude Code
- ✅ **Simpler architecture** - Delegate to specialized tool
- ✅ **Easier maintenance** - Update Claudish, not every command
- ✅ **Consistent data** - All commands use same model list

### For Ecosystem

- ✅ **Clear separation** - Claudish = models, Claude Code = orchestration
- ✅ **Reusability** - Other tools can query Claudish too
- ✅ **Scalability** - Easy to add new models (update Claudish only)
- ✅ **Flexibility** - User overrides + dynamic queries + fallbacks

## Next Steps

### For Plugin Maintainers

1. **Read integration skill:** `skills/claudish-integration/SKILL.md`
2. **Update commands** to query Claudish (see examples above)
3. **Add user override support** via CLAUDE.md parsing
4. **Test thoroughly** with various scenarios
5. **Update documentation** to reflect new patterns
6. **Mark /update-models as deprecated** (if exists)
7. **Announce migration** to users

### For Users

1. **Install/update Claudish:** `npm install -g claudish@latest`
2. **Verify JSON support:** `claudish --list-models --json`
3. **Configure overrides** (optional): Edit `.claude/CLAUDE.md`
4. **Test commands:** Run `/review` or other model-using commands
5. **Report issues:** If fallback warnings appear, report to maintainers

## References

**Related Documents:**
- `ai-docs/CLAUDISH_INTEGRATION_ARCHITECTURE.md` - Overall architecture
- `ai-docs/CLAUDISH_ENHANCEMENT_PROPOSAL.md` - Claudish feature spec
- `skills/claudish-integration/SKILL.md` - Integration patterns for agents
- `mcp/claudish/README.md` - Claudish documentation

**Key Changes:**
- Claudish v1.2.0: Added `--list-models --json` flag
- Claudish v1.2.0: Added `--list-models --category=<category>` filter
- Claude Code: Commands now query Claudish dynamically

**Support:**
- GitHub Issues: https://github.com/MadAppGang/claude-code/issues
- Claudish Issues: https://github.com/MadAppGang/claude-code/issues (same repo)
