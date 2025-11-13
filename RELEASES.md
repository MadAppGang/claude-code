# Release Notes

Detailed release documentation for MAG Claude Plugins.

See [CHANGELOG.md](./CHANGELOG.md) for version history.

---

## Frontend Plugin v3.2.0 (2025-11-13)

**Tag:** `plugins/frontend/v3.2.0`

### 🎯 Overview

**Multi-Model Plan Review** - Get independent perspectives from external AI models on architecture plans *before* implementation begins. This release adds an optional PHASE 1.5 to the `/implement` command, allowing users to catch architectural issues, missing considerations, and edge cases early when changes are cheap.

**Key Innovation:** Review plans with multiple AI models in parallel, highlight cross-model consensus (high confidence), and optionally revise the plan based on consolidated feedback.

### ✨ What's New

#### Multi-Model Plan Review (PHASE 1.5)

**Workflow Integration:**

```
PHASE 1: Architect creates plan → User approves
    ↓
PHASE 1.5 (NEW): Multi-Model Plan Review
    1. Ask user: "Want multi-model plan review?"
    2. If yes: User selects AI models (multi-select UI)
    3. Launch plan-reviewer agents in parallel (one per model)
    4. Consolidate feedback with cross-model consensus
    5. Present synthesized report to user
    6. User decides: Revise plan OR proceed as-is
    ↓
PHASE 2: Implementation begins
```

**Supported AI Models:**
- **Grok Code Fast** (xAI) - Fast coding analysis, implementation efficiency
- **GPT-5 Codex** (OpenAI) - Advanced reasoning, edge cases, system design
- **MiniMax M2** - High-performance analysis, pattern recognition
- **Qwen Vision-Language** (Alibaba) - Multi-modal understanding, UX focus
- **Custom models** - Any OpenRouter model ID

**Key Features:**

1. **User-Controlled Workflow**
   - Fully optional (user can skip)
   - Multi-select model chooser (pick 1+ models)
   - User decides whether to revise plan based on feedback

2. **Parallel Multi-Model Execution**
   - All selected models review simultaneously
   - Efficient use of time (parallel, not sequential)
   - Independent perspectives reduce bias

3. **Cross-Model Consensus**
   - Issues flagged by **multiple models** = **HIGHEST PRIORITY**
   - Shows which models agreed (e.g., "Flagged by: Grok, GPT-5 Codex [2/3 models - HIGH CONFIDENCE]")
   - Single-model findings still valuable but noted as lower confidence

4. **Consolidated Feedback Presentation**
   - **Critical Issues** (must address before implementation)
   - **Medium Suggestions** (should consider)
   - **Low Improvements** (nice to have)
   - **Plan Strengths** (validated by models)
   - Overall assessment: APPROVED ✅ | NEEDS REVISION ⚠️ | MAJOR CONCERNS ❌

5. **Plan Revision Loop**
   - Option to re-launch architect with multi-model feedback
   - Architect addresses critical and medium issues
   - User approves revised plan
   - Optional second review round on revised plan

6. **Graceful Degradation**
   - Handles missing OPENROUTER_API_KEY
   - Handles Claudish CLI not installed
   - Handles individual model failures (uses successful ones)
   - Allows user opt-out at any time

**New Agent: `plan-reviewer`**

- Specialized for reviewing architecture plans via external AI models
- Supports PROXY_MODE for OpenRouter model delegation
- Evaluates:
  - **Architectural Issues**: Design flaws, anti-patterns, scalability, maintainability
  - **Missing Considerations**: Edge cases, error handling, security, accessibility, performance
  - **Alternative Approaches**: Better patterns, simpler solutions, modern best practices
  - **Technology Choices**: Library appropriateness, compatibility, technical debt
  - **Implementation Risks**: Complex areas, testing challenges, integration points
- Output format: Structured report with severity levels and actionable recommendations

**Updated `/implement` Command:**

- Added PHASE 1.5 section (8 steps, comprehensive)
- Updated todo list initialization (Step 0)
- Updated Success Criteria to include PHASE 1.5 validation
- Added configuration support documentation (future enhancement)
- Error handling for missing API keys, model failures, partial successes

### 🚀 Benefits

| Benefit | Description |
|---------|-------------|
| 🎯 **Early Issue Detection** | Fix architectural problems before writing code (10x cheaper) |
| 🤝 **Multi-Model Wisdom** | Different AI models bring different perspectives and catch different issues |
| 📊 **Consensus Validation** | Issues flagged by multiple models = high confidence signal |
| 💰 **Cost Effective** | Reviewing 1-page plan is cheaper than refactoring 1000 lines of code |
| 🔒 **User Control** | Fully optional, user chooses models and whether to revise |
| ⚡ **Parallel Efficiency** | All models review simultaneously (not sequential) |
| 🛡️ **Risk Reduction** | Catch edge cases, security issues, performance bottlenecks early |

### 📦 Updated Files

**New:**
- `plugins/frontend/agents/plan-reviewer.md` - Plan review agent

**Modified:**
- `plugins/frontend/commands/implement.md` - Added PHASE 1.5 (500+ lines)
- `plugins/frontend/plugin.json` - Added plan-reviewer, updated description
- `CHANGELOG.md` - v3.2.0 entry
- `RELEASES.md` - This file
- `CLAUDE.md` - Updated with v3.2.0 information

### 🔧 Configuration (Optional)

**Future Enhancement** - Configure default models and auto-enable:

```json
{
  "pluginSettings": {
    "frontend": {
      "planReviewModels": ["x-ai/grok-code-fast-1", "openai/gpt-5-codex"],
      "autoEnablePlanReview": false
    }
  }
}
```

**Behavior:**
- If `autoEnablePlanReview: true` → Skip asking user, use configured models automatically
- If `autoEnablePlanReview: false` → Ask user, use configured models if yes
- If not configured → Interactive model selection (default)

### 📋 Requirements

**To use multi-model plan review:**
1. Claudish CLI installed: `npx claudish --version`
2. OpenRouter API key: `export OPENROUTER_API_KEY=your-key`
3. Claude Code plugin: Frontend v3.2.0+

**If requirements not met:**
- Workflow gracefully skips PHASE 1.5
- Logs helpful message about missing requirements
- Implementation proceeds normally

### 🎬 Example Usage

**Scenario:** User wants to implement a new user management feature.

```
1. User runs: /implement "Create user management feature with CRUD operations"

2. PHASE 1: Architect creates comprehensive plan
   - Gap analysis
   - Architecture design
   - Implementation roadmap
   - User approves plan ✅

3. PHASE 1.5: Multi-Model Plan Review (NEW!)

   Orchestrator: "🤖 Multi-Model Plan Review Available

   Before we begin, would you like external AI models to review the plan?"

   User: "Yes - Review the plan with external AI models"

   Orchestrator: "Which AI models? (Select one or more)"

   User selects: [✓] Grok Code Fast, [✓] GPT-5 Codex

   Orchestrator launches 2 plan-reviewer agents in parallel...

   Results:
   - Grok: NEEDS REVISION ⚠️ (found 2 critical, 3 medium issues)
   - GPT-5 Codex: NEEDS REVISION ⚠️ (found 3 critical, 2 medium issues)

   Cross-Model Consensus:
   - Issue #1: "Missing authorization checks on delete endpoint"
     [FLAGGED BY: Grok, GPT-5 Codex - 2/2 models - UNANIMOUS]
   - Issue #2: "No rate limiting on user creation"
     [FLAGGED BY: GPT-5 Codex - 1/2 models]

   Orchestrator: "Based on multi-model review, revise the plan?"

   User: "Yes - Revise based on feedback"

   Orchestrator re-launches architect with consolidated feedback...
   Architect addresses all critical issues...

   User approves revised plan ✅

4. PHASE 2: Implementation begins with improved plan
```

### 🎓 When to Use Plan Review

**Recommended for:**
- ✅ Complex features with many moving parts
- ✅ Critical features (authentication, payments, security)
- ✅ Features involving new technologies or patterns
- ✅ Features with significant architectural decisions
- ✅ When you're uncertain about approach
- ✅ High-risk features that are expensive to refactor

**Skip for:**
- ❌ Simple UI tweaks
- ❌ Minor bug fixes
- ❌ Well-understood patterns you've used many times
- ❌ Quick prototypes/experiments
- ❌ When speed is more important than quality

### 📊 Success Metrics

**Updated Success Criteria:**

The `/implement` command now requires PHASE 1.5 completion:

```
1. ✅ User approved the architecture plan (Phase 1 gate)
2. ✅ PHASE 1.5 (Multi-Model Plan Review) completed:
   - If enabled: External AI models reviewed and feedback consolidated
   - User decided: Revised plan OR proceeded as-is
   - If skipped: User explicitly skipped OR external AI unavailable
3. ✅ Implementation follows the approved plan
[... rest of criteria ...]
```

### 🔄 Migration from v3.1.1

**No breaking changes!** Fully backward compatible.

1. **Update plugin** (if globally installed):
   ```bash
   /plugin marketplace add MadAppGang/claude-code
   /plugin install frontend@mag-claude-plugins
   ```

2. **Enable in project** (recommended for teams):
   ```json
   // .claude/settings.json
   {
     "enabledPlugins": {
       "frontend@mag-claude-plugins": true
     }
   }
   ```

3. **Set up OpenRouter** (if you want plan review):
   ```bash
   export OPENROUTER_API_KEY=your-key-here
   ```

4. **That's it!** Next time you run `/implement`, you'll see PHASE 1.5 option

**Existing behavior preserved:**
- If you skip plan review → Works exactly like v3.1.1
- If OpenRouter not configured → Skips automatically, no errors
- All other phases unchanged

### 🐛 Known Limitations

1. **OpenRouter API required** - No offline plan review (needs external models)
2. **Cost consideration** - Multi-model reviews use OpenRouter API (costs apply based on model pricing)
3. **Model availability** - Some models may be unavailable or deprecated on OpenRouter
4. **English only** - External AI models work best with English prompts

### 📚 Additional Resources

- **CLAUDE.md** - Updated with v3.2.0 information and plan review workflow
- **CHANGELOG.md** - Detailed changelog entry
- **Plugin Documentation** - See `/implement` command for complete PHASE 1.5 workflow
- **Claudish CLI** - See mcp/claudish/README.md for OpenRouter model catalog

### 🏷️ Git Tag

```bash
git tag -a plugins/frontend/v3.2.0 -m "Frontend Plugin v3.2.0 - Multi-Model Plan Review (PHASE 1.5)"
git push origin plugins/frontend/v3.2.0
```

### 👥 Credits

**Developed by:** Jack Rudenko @ MadAppGang
**License:** MIT
**Repository:** https://github.com/MadAppGang/claude-code

---

## Frontend Plugin v3.1.1 (2025-11-11)

**Tag:** `plugins/frontend/v3.1.1`
**Commit:** `79b1448`

### Overview

Documentation improvements clarifying Claudish CLI usage modes across all agents and commands. No functional changes - purely documentation clarity for better user experience.

### What Changed

#### Documentation Clarifications

**Updated 7 agents with accurate Claudish CLI instructions:**
- `reviewer.md` - Senior Code Reviewer
- `developer.md` - TypeScript Frontend Developer
- `architect.md` - Frontend Architecture Planner
- `designer.md` - UI/UX Design Reviewer
- `css-developer.md` - CSS Architecture Specialist
- `ui-developer.md` - Senior UI Developer
- `test-architect.md` - Test Strategy & Implementation

**Clarified Claudish CLI modes:**
```markdown
## Interactive Mode (Default)
- Command: `claudish`
- Shows model selector UI
- Persistent session
- User selects model interactively

## Single-Shot Mode (Automation)
- Command: `npx claudish --model <model> --stdin --quiet`
- No model selector
- One task, returns result, exits
- Used by agents for PROXY_MODE delegation
```

**Updated files:**
- Agent PROXY_MODE instructions (7 files)
- `/implement` command documentation
- `DEPENDENCIES.md` - Setup instructions
- `mcp-servers/README.md` - Claudish section

### Companion Release

**Claudish v1.1.2** released alongside with:
- Interactive mode as default (no args = shows model selector)
- `--version` flag added
- Async buffered logging (1000x fewer disk operations)
- No log files by default (debug only with `--debug` flag)
- Package renamed: `@madappgang/claudish` → `claudish`

### Migration Guide

**No migration needed!** This is a documentation-only release.

If you're using v3.1.0, the functionality is identical. Update to v3.1.1 to get clearer documentation.

### For Users

**What to expect:**
- Same functionality as v3.1.0
- Clearer documentation about Claudish modes
- Better understanding of when/how to use interactive vs single-shot mode

### For Maintainers

**Tag format reminder:**
```bash
# ✅ CORRECT
git tag -a plugins/frontend/v3.1.1 -m "..."
git push origin plugins/frontend/v3.1.1

# ❌ WRONG
git tag -a frontend-v3.1.1 -m "..."
```

---

## Frontend Plugin v3.1.0 (2025-11-11)

**Tag:** `plugins/frontend/v3.1.0`
**Commit:** `117378e3abf2544a73cbe8cd555f56b504b1fd83`

### Overview

Major architectural improvement replacing Claudish MCP server with CLI-based external AI delegation. This simplifies setup, removes MCP complexity, and provides better support for large prompts.

### What Changed

#### 1. Claudish CLI Enhancement

**Added stdin support for piping large prompts:**

```bash
# Before (MCP tool call - limited size)
mcp__claudish__call_external_ai({ model: "...", prompt: "..." })

# After (CLI with stdin - unlimited size)
echo "$PROMPT" | npx claudish --stdin --model x-ai/grok-code-fast-1 --quiet
```

**Implementation details:**
- Added `readStdin()` async function to handle piped input
- Updated CLI parser with `--stdin` flag
- Added comprehensive help documentation
- Handles unlimited prompt sizes (perfect for git diffs)

#### 2. Agent Architecture Migration (7 agents)

**Migrated from MCP to CLI approach:**

| Agent | Role | Changes |
|-------|------|---------|
| `reviewer.md` | Senior Code Reviewer | MCP → Bash + CLI |
| `developer.md` | TypeScript Frontend Developer | MCP → Bash + CLI |
| `architect.md` | Frontend Architecture Planner | MCP → Bash + CLI |
| `designer.md` | UI/UX Design Reviewer | MCP → Bash + CLI |
| `css-developer.md` | CSS Architecture Specialist | MCP → Bash + CLI |
| `ui-developer.md` | Senior UI Developer | MCP → Bash + CLI |
| `test-architect.md` | Test Strategy & Implementation | MCP → Bash + CLI |

**PROXY_MODE pattern updated:**

```markdown
## Before (v3.0.0)
tools: TodoWrite, mcp__claudish__call_external_ai

1. Check for PROXY_MODE directive
2. Call mcp__claudish__call_external_ai(...)
3. Return response

## After (v3.1.0)
tools: TodoWrite, Bash

1. Check for PROXY_MODE directive
2. Prepare full prompt (system + task)
3. Execute: echo "$PROMPT" | npx claudish --stdin --model {model} --quiet
4. Return response with attribution
```

#### 3. Command Updates

**/implement command:**
- Updated from "Claudish MCP" to "Claudish CLI"
- Setup check: `npx claudish --help` instead of MCP server
- Same multi-model review functionality

**/validate-ui command:**
- Updated from "Claudish MCP" to "Claudish CLI"
- Same design validation functionality
- Simplified setup instructions

#### 4. Complete MCP Server Removal

**Deleted files (6):**
```
mcp/claudish-mcp/.gitignore
mcp/claudish-mcp/README.md
mcp/claudish-mcp/biome.json
mcp/claudish-mcp/package.json
mcp/claudish-mcp/src/index.ts
mcp/claudish-mcp/tsconfig.json
```

**Configuration cleanup:**
- Removed `claudish` from `mcp-config.json`
- Removed `claudish` from `mcp-config.example.json`
- Updated MCP README to remove Claudish references
- Removed MCP verification steps

**Documentation updates:**
- `plugins/frontend/DEPENDENCIES.md` - MCP → CLI setup
- `plugins/frontend/mcp-servers/README.md` - Updated Claudish section
- Removed outdated strategy document

### Why This Change?

#### Problems with MCP Approach

1. **Unnecessary Complexity**
   - Required MCP server configuration
   - Additional server to manage and maintain
   - More failure points in the system

2. **Limited Prompt Size**
   - MCP tool calls have size limitations
   - Difficult to pass large git diffs
   - Required chunking and workarounds

3. **Setup Friction**
   - Users had to configure MCP servers
   - Additional documentation overhead
   - More support questions

#### Benefits of CLI Approach

1. **Simpler Architecture**
   ```
   Before: Agent → MCP Tool → MCP Server → OpenRouter
   After:  Agent → Bash Tool → CLI → OpenRouter
   ```

2. **Better Developer Experience**
   - ✅ No MCP configuration needed
   - ✅ Just `npx claudish` works
   - ✅ Standard Unix patterns
   - ✅ Easier debugging

3. **Unlimited Prompt Size**
   - ✅ stdin handles any size input
   - ✅ Perfect for git diffs
   - ✅ No chunking needed

4. **More Flexible**
   - ✅ CLI works standalone
   - ✅ Can use in scripts
   - ✅ Better CI/CD integration

### Migration Guide

#### For Users with Claudish MCP

**Step 1: Remove MCP Configuration**

If you have Claudish MCP configured in `.claude/mcp-servers/config.json`:

```json
// Remove this entry:
{
  "claudish": {
    "command": "node",
    "args": ["..."],
    "env": { "OPENROUTER_API_KEY": "..." }
  }
}
```

**Step 2: Verify CLI Works**

```bash
# Should show help and available options
npx claudish --help
```

**Step 3: Keep Environment Variable**

```bash
# Still required (add to ~/.zshrc or ~/.bashrc)
export OPENROUTER_API_KEY="sk-or-v1-your-key"
```

**Step 4: Update Plugin**

```bash
/plugin marketplace update mag-claude-plugins
/plugin uninstall frontend@mag-claude-plugins
/plugin install frontend@mag-claude-plugins
```

#### What Doesn't Change

✅ **Plugin configuration** - `.claude/settings.json` stays the same
✅ **Review models** - `pluginSettings.frontend.reviewModels` unchanged
✅ **PROXY_MODE** - External AI delegation works identically
✅ **Multi-model review** - Same functionality, simpler implementation
✅ **OpenRouter costs** - Pricing unchanged

### Breaking Changes

**None for end users.**

External AI delegation works exactly the same. Only the internal implementation changed from MCP to CLI.

**For developers/contributors:**

- Agents no longer use `mcp__claudish__call_external_ai` tool
- Must use Bash tool with `npx claudish --stdin` pattern
- See agent files for implementation examples

### Technical Details

#### Files Changed

**Total:** 46 files

**Modified:**
- 7 agent files (PROXY_MODE pattern)
- 2 command files (/implement, /validate-ui)
- 3 MCP configuration files
- 3 documentation files
- 1 plugin.json (version bump)
- 30+ Claudish CLI enhancements

**Deleted:**
- 6 Claudish MCP server files
- 1 outdated strategy document

**Added:**
- stdin support implementation
- Updated help documentation
- CLI usage examples

#### Code Metrics

- **Lines Added:** ~6,346 (including Claudish improvements)
- **Lines Removed:** ~1,754 (MCP server deletion)
- **Net Change:** +4,592 lines
- **Agents Updated:** 7
- **Commands Updated:** 2

#### Git Information

```bash
# Tag
plugins/frontend/v3.1.0

# Commit
117378e3abf2544a73cbe8cd555f56b504b1fd83

# Branch
main

# Commit Message
feat(frontend): Replace Claudish MCP with CLI-based external AI delegation (v3.1.0)
```

### Testing Verification

#### Automated Tests

- ✅ Claudish CLI stdin support works with large inputs
- ✅ All 7 agents properly detect PROXY_MODE directive
- ✅ External AI delegation functions correctly
- ✅ Multi-model code review executes as expected

#### Manual Verification

- ✅ No MCP references remain in plugin code
- ✅ Documentation updated comprehensively
- ✅ Plugin.json version bumped correctly
- ✅ Git tag created with correct format

#### Integration Tests

- ✅ `/implement` command with multi-model review
- ✅ `/validate-ui` command with external AI
- ✅ PROXY_MODE delegation in all agents
- ✅ Large prompt handling via stdin

### Performance Impact

#### Improvements

- **Direct execution** - No MCP protocol overhead
- **Faster for API tasks** - 30-40% improvement maintained
- **Better token efficiency** - No MCP message wrapping

#### No Regression

- **OpenRouter costs** - Unchanged
- **External AI quality** - Identical
- **Feature functionality** - Fully maintained

### Known Issues

None. This is a pure internal refactoring with no functional changes.

### Upgrade Recommendation

**Recommended for all users.**

Benefits:
- Simpler setup
- Better for large prompts
- Easier maintenance
- No downside

### Support

**Issues:** https://github.com/MadAppGang/claude-code/issues
**Discussions:** Use GitHub Discussions for questions

### Next Steps

Users should:
1. Update marketplace: `/plugin marketplace update mag-claude-plugins`
2. Reinstall plugin: `/plugin uninstall` + `/plugin install`
3. Remove old MCP configuration (if configured)
4. Verify: `npx claudish --help`

---

## Release Process (For Maintainers)

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0) - Breaking changes
- **MINOR** (0.x.0) - New features, backwards compatible
- **PATCH** (0.0.x) - Bug fixes, backwards compatible

### Release Checklist

#### Before Release

- [ ] All features implemented and tested
- [ ] Documentation updated
- [ ] CHANGELOG.md updated with new version
- [ ] RELEASES.md updated with detailed notes
- [ ] plugin.json version bumped
- [ ] Git status clean (no uncommitted changes)

#### Creating Release

```bash
# 1. Update version in plugin.json
# Edit: plugins/frontend/plugin.json

# 2. Update CHANGELOG.md
# Add new version section at top

# 3. Create detailed release notes
# Edit: RELEASES.md with comprehensive details

# 4. Update CLAUDE.md (if needed)
# Update version references

# 5. Commit changes
git add -A
git commit -m "feat(frontend): [Feature description] (v X.Y.Z)"

# 6. Create tag (IMPORTANT: Use correct format!)
git tag -a plugins/frontend/vX.Y.Z -m "Frontend Plugin vX.Y.Z - [Summary]"

# 7. Push to remote
git push origin main
git push origin plugins/frontend/vX.Y.Z

# 8. Verify tag on GitHub
# Check: https://github.com/MadAppGang/claude-code/tags
```

#### After Release

- [ ] Test plugin update via `/plugin marketplace update`
- [ ] Verify new version appears in plugin menu
- [ ] Test key features work correctly
- [ ] Monitor for user reports
- [ ] Update GitHub release notes (optional)

### Tag Format

**CRITICAL**: Claude Code plugin system expects this exact format:

```bash
# ✅ CORRECT
plugins/frontend/v3.1.0

# ❌ WRONG (don't use these)
frontend-v3.1.0
v3.1.0
plugins-frontend-v3.1.0
```

### Release Template

Use this template for RELEASES.md entries:

```markdown
## Frontend Plugin vX.Y.Z (YYYY-MM-DD)

**Tag:** `plugins/frontend/vX.Y.Z`
**Commit:** `[commit-hash]`

### Overview

[Brief summary of changes and why they matter]

### What Changed

[Detailed breakdown of all changes]

### Why This Change?

[Problem statement and solution]

### Migration Guide

[Step-by-step upgrade instructions]

### Breaking Changes

[List any breaking changes or "None"]

### Technical Details

[Code metrics, files changed, etc.]

### Testing Verification

[What was tested and verified]

### Known Issues

[Any known issues or "None"]

### Upgrade Recommendation

[Who should upgrade and why]
```

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Last Updated:** 2025-11-11
**License:** MIT
