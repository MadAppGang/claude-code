# Video Editing Plugin Design Review

**Reviewer:** Claude Opus 4.5 (proxy delegation to moonshotai/kimi-k2-thinking failed; review performed internally)
**Document:** `/Users/jack/mag/claude-code/ai-docs/agent-design-video-editing-plugin.md`
**Date:** 2025-12-29
**Status:** CONDITIONAL

---

## Summary

The video-editing plugin design document is comprehensive and well-structured, covering 3 skills, 3 agents, and 3 commands with detailed XML instructions and workflow definitions. The architecture follows sound orchestrator-agent patterns with proper separation of concerns. However, there are several YAML schema violations, missing required patterns, and XML structure inconsistencies that need addressing before implementation.

---

## Strengths

1. **Comprehensive Architecture** - Complete plugin structure with clear separation between skills (knowledge), agents (workers), and commands (orchestrators)

2. **Detailed Skill Documentation** - FFmpeg, transcription, and FCPXML skills provide extensive reference material with code examples and best practices

3. **Strong TodoWrite Integration** - All agents include proper TodoWrite requirements with phase-based tracking

4. **Excellent Error Handling in Skills** - Each skill includes validation patterns, error recovery suggestions, and common issue resolutions

5. **Clear Orchestrator Pattern** - Commands properly delegate to agents and avoid direct implementation (no Write/Edit tools in commands)

6. **Real-World Examples** - Each agent includes 2+ concrete examples showing correct approach patterns

7. **Dependency Documentation** - Clear external dependency requirements (FFmpeg, Whisper, xmllint) with installation commands

8. **Timing/Format References** - FCPXML skill includes comprehensive timing calculations and format references critical for FCP compatibility

---

## Issues

### CRITICAL Issues

*None identified* - The design is fundamentally sound and would be functional.

---

### HIGH Priority Issues

#### Issue 1: Missing Edit Tool for Implementer Agents
- **Category:** YAML/Schemas
- **Description:** The `video-processor`, `transcriber`, and `timeline-builder` agents are classified as Implementers but lack the `Edit` tool in their frontmatter. Per `agentdev:schemas`, Implementers must have: `TodoWrite, Read, Write, Edit`.
- **Impact:** Agents cannot make incremental file modifications; must rewrite entire files for small changes.
- **Fix:** Add `Edit` to tools list for all three agents:
  ```yaml
  # video-processor
  tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep

  # transcriber
  tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep

  # timeline-builder
  tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep
  ```
- **Location:** Sections 3.1, 3.2, 3.3 - Agent frontmatter

#### Issue 2: Missing Write Tool for video-processor Agent
- **Category:** YAML/Schemas
- **Description:** The `video-processor` agent is missing the `Write` tool despite needing to create output files and validation reports.
- **Impact:** Agent cannot write processing reports, logs, or intermediate files.
- **Fix:** Add `Write` to tools:
  ```yaml
  tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep
  ```
- **Location:** Section 3.1 - video-processor frontmatter

#### Issue 3: Skills Use Wrong Namespace Format
- **Category:** Architecture/Integration
- **Description:** Agent frontmatter references skills as `video-editing:ffmpeg-core` but the skills are defined in the same plugin. The correct format should be just the skill name for local skills or `plugin-name:skill-name` for external references.
- **Impact:** Skill loading may fail if the plugin system expects relative paths.
- **Fix:** Verify skill reference format matches Claude Code plugin system. If local skills, use:
  ```yaml
  skills: ffmpeg-core, transcription, final-cut-pro
  ```
  Or if namespaced is correct, ensure plugin.json `skills` paths align.
- **Location:** All agent frontmatter (sections 3.1, 3.2, 3.3)

#### Issue 4: Missing Proxy Mode Support Pattern
- **Category:** XML/Patterns
- **Description:** Per `agentdev:patterns`, agents that may be invoked via external models should include the `<proxy_mode_support>` critical constraint. None of the agents include this pattern.
- **Impact:** Agents cannot be used with multi-model validation workflows or external AI delegation.
- **Fix:** Add proxy mode support to each agent's `<critical_constraints>`:
  ```xml
  <proxy_mode_support>
    **FIRST STEP: Check for Proxy Mode Directive**

    Before executing, check if the incoming prompt starts with:
    PROXY_MODE: {model_name}

    If present: delegate via Claudish and STOP
    If absent: proceed with normal workflow
  </proxy_mode_support>
  ```
- **Location:** Sections 3.1, 3.2, 3.3 - Agent `<critical_constraints>`

#### Issue 5: Skills Missing YAML Frontmatter Delimiters
- **Category:** YAML/Schemas
- **Description:** The skill YAML frontmatter in the design document shows the frontmatter embedded within code blocks, but doesn't clearly show the required `---` delimiters in their final file format.
- **Impact:** Skills may not parse correctly if delimiters are missing.
- **Fix:** Ensure each skill's SKILL.md starts with proper frontmatter:
  ```yaml
  ---
  name: ffmpeg-core
  description: FFmpeg fundamentals for video/audio manipulation...
  ---
  ```
- **Location:** Sections 2.1, 2.2, 2.3

---

### MEDIUM Priority Issues

#### Issue 6: Inconsistent Color for timeline-builder Agent
- **Category:** YAML/Schemas
- **Description:** The `timeline-builder` agent uses `color: purple` but purple is designated for "Planning" type agents per `agentdev:schemas`. Since timeline-builder is an Implementer that generates FCPXML files, it should use `color: green`.
- **Impact:** Visual inconsistency in terminal output; misleading agent type indication.
- **Fix:** Change to `color: green` to match Implementer convention.
- **Location:** Section 3.3 - timeline-builder frontmatter

#### Issue 7: Missing Quality Gate in Orchestrator Phases
- **Category:** XML/Completeness
- **Description:** The `/video-edit` command phases include quality gates, but `/transcribe` and `/create-fcp-project` commands lack explicit `<quality_gate>` elements in their workflow phases.
- **Impact:** No clear exit criteria for phases; harder to determine when to proceed.
- **Fix:** Add `<quality_gate>` to each phase in `/transcribe` and `/create-fcp-project`:
  ```xml
  <phase number="1" name="Input Analysis">
    <steps>...</steps>
    <quality_gate>All input files validated and properties extracted</quality_gate>
  </phase>
  ```
- **Location:** Sections 4.2, 4.3

#### Issue 8: Skill XML Content Not Properly Wrapped
- **Category:** XML/Structure
- **Description:** The skill content in sections 2.1-2.3 shows XML content starting with `<xml>` or just markdown. Per Claude Code conventions, skills should be markdown files, but the design shows them with XML tags that won't render properly.
- **Impact:** Confusion during implementation about skill file format.
- **Fix:** Clarify that skill files (SKILL.md) are pure markdown with YAML frontmatter, not XML. The XML tags shown are examples/templates, not the actual skill structure.
- **Location:** Sections 2.1, 2.2, 2.3

#### Issue 9: Missing $ARGUMENTS Reference in Some Commands
- **Category:** XML/Completeness
- **Description:** The `/transcribe` and `/create-fcp-project` commands include `<user_request>$ARGUMENTS</user_request>`, which is correct. However, the design doesn't explain how $ARGUMENTS is populated or parsed.
- **Impact:** Implementers may not understand the argument injection mechanism.
- **Fix:** Add a note explaining that `$ARGUMENTS` is automatically replaced with the user's command arguments by Claude Code's command system.
- **Location:** Section 4 introduction

#### Issue 10: No MCP Server Configuration Details
- **Category:** Architecture/Completeness
- **Description:** The plugin.json references an `mcp-servers/` directory but the design doesn't specify any MCP server configuration. The directory structure shows `mcp-config.json` but no details are provided.
- **Impact:** Unclear if MCP servers are needed or just a placeholder.
- **Fix:** Either:
  - Remove MCP references if not needed
  - Or add section explaining MCP configuration for external tool integration
- **Location:** Sections 1.2, 1.3

---

### LOW Priority Issues

#### Issue 11: Missing Version Compatibility Note for Whisper
- **Category:** Completeness
- **Description:** The transcription skill mentions `whisper --list-models` but this flag may not exist in all Whisper versions.
- **Impact:** Minor confusion if command fails on some installations.
- **Fix:** Add note: "Some Whisper versions may not support `--list-models`; fallback to documentation for available models."
- **Location:** Section 2.2

#### Issue 12: Hardcoded Paths in Examples
- **Category:** Completeness
- **Description:** Some FCPXML examples use paths like `/Users/user/Movies/...` which violate the project's "no hardcoded paths" rule from CLAUDE.md.
- **Impact:** Minor; these are examples, but should model best practices.
- **Fix:** Use placeholder paths like `{USER_HOME}/Movies/` or `$HOME/Movies/`.
- **Location:** Section 2.3 - FCPXML examples

#### Issue 13: Example Count Below Schema Recommendation
- **Category:** YAML/Schemas
- **Description:** Agent descriptions should have 3-5 examples per `agentdev:schemas`. The transcriber agent has 5 (good), but video-processor and timeline-builder each have exactly 5 which is at the upper bound. Consider if all are necessary or if some overlap.
- **Impact:** Minimal; examples are adequate but could be more focused.
- **Fix:** Review examples for distinctiveness; ensure each demonstrates a unique capability.
- **Location:** Sections 3.1, 3.3

#### Issue 14: Missing activeForm in TodoWrite Workflow Description
- **Category:** Completeness
- **Description:** The TodoWrite requirement sections describe task statuses but don't mention the `activeForm` field which is required by the TodoWrite tool schema.
- **Impact:** Implementers may not realize activeForm (present continuous verb) is required alongside content (imperative verb).
- **Fix:** Add note: "Each todo item requires both `content` (imperative: 'Validate inputs') and `activeForm` (continuous: 'Validating inputs')."
- **Location:** All agent `<todowrite_requirement>` sections

---

## Recommendations

### Immediate (Before Implementation)

1. **Fix Agent Tool Lists** - Add missing `Write` and `Edit` tools to implementer agents (Issues 1, 2)

2. **Add Proxy Mode Support** - Include proxy mode pattern in all agents for multi-model compatibility (Issue 4)

3. **Verify Skill Reference Format** - Confirm `video-editing:skill-name` vs `skill-name` with Claude Code plugin system (Issue 3)

4. **Correct timeline-builder Color** - Change from purple to green (Issue 6)

### Before Testing

5. **Add Quality Gates** - Complete all command phases with explicit quality gates (Issue 7)

6. **Clarify Skill File Format** - Add note that skills are markdown files with YAML frontmatter (Issue 8)

7. **Document $ARGUMENTS** - Explain the argument injection mechanism (Issue 9)

### Optional Improvements

8. **Remove or Specify MCP Configuration** - Clarify MCP server requirements (Issue 10)

9. **Use Placeholder Paths** - Replace hardcoded paths in FCPXML examples (Issue 12)

10. **Document activeForm Requirement** - Add TodoWrite schema note (Issue 14)

---

## Approval Decision

**Status:** CONDITIONAL

**Rationale:** The design is comprehensive and architecturally sound with 0 CRITICAL issues. However, 5 HIGH priority issues (missing tools, missing patterns, schema violations) must be addressed before implementation to ensure agents function correctly and integrate with multi-model workflows.

**Required for PASS:**
- Fix Issues 1-5 (HIGH priority)
- Address at least 3 of Issues 6-10 (MEDIUM priority)

**Confidence:** 85% - The design demonstrates strong domain knowledge and follows most patterns correctly. The issues identified are mostly schema compliance and pattern completeness rather than fundamental architectural problems.

---

*Review performed by Claude Opus 4.5*
*Note: Original delegation to moonshotai/kimi-k2-thinking via Claudish proxy failed due to model tool call limitations. Review completed internally.*
