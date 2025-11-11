# Release Notes

Detailed release documentation for MAG Claude Plugins.

See [CHANGELOG.md](./CHANGELOG.md) for version history.

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
