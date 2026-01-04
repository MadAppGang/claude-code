# Video Editing Plugin Design Plan Review

**Document Reviewed:** `/Users/jack/mag/claude-code/ai-docs/agent-design-video-editing-plugin.md`
**Reviewer:** Claude Opus 4.5 (Internal)
**Date:** 2025-12-29
**Status:** CONDITIONAL

---

## Summary

The video-editing plugin design is comprehensive and well-structured, covering FFmpeg operations, Whisper transcription, and Final Cut Pro FCPXML generation. The design follows established plugin patterns and demonstrates solid understanding of the orchestrator/agent architecture. However, there are several issues ranging from critical schema violations to medium-priority missing patterns that should be addressed before implementation.

**Overall Assessment:** The design is 85% production-ready with clear structure and good domain knowledge. The issues identified are primarily around adherence to established schema patterns and missing infrastructure elements.

---

## Strengths

### 1. Comprehensive Architecture
- Clear separation of concerns: 3 skills, 3 agents, 3 commands
- Well-defined plugin manifest with proper structure
- Logical skill-to-agent-to-command dependency chain

### 2. Domain Expertise
- FFmpeg skill covers all common operations with correct syntax
- FCPXML skill shows deep understanding of Final Cut Pro format
- Transcription skill includes multiple Whisper installation options

### 3. Proper Orchestrator Pattern
- Commands correctly use Task delegation
- Clear forbidden/allowed tools for orchestrators
- Workflow phases are well-defined with quality gates

### 4. TodoWrite Integration
- All agents and commands include todowrite_requirement
- Workflow phases align with TodoWrite tracking

### 5. Quality Validation
- Input/output validation patterns for FFmpeg
- FCPXML validation with xmllint
- Whisper installation checks

---

## Issues

### CRITICAL Issues (Block Implementation)

#### Issue 1: Missing `model` Field in Agent YAML Frontmatter
- **Category:** YAML Schema
- **Description:** The agent frontmatter examples in the design document include a `model: sonnet` field, but the actual YAML code blocks for agents (video-processor, transcriber, timeline-builder) do NOT include this required field.
- **Impact:** Agents will fail to load or use default model selection, potentially causing unexpected behavior.
- **Location:** Sections 3.1, 3.2, 3.3 - Agent YAML frontmatter blocks
- **Fix:** Add `model: sonnet` to all three agent frontmatter definitions:
  ```yaml
  ---
  name: video-processor
  model: sonnet        # ADD THIS LINE
  description: |
  ...
  ```

#### Issue 2: Skills Frontmatter Missing Required Fields
- **Category:** YAML Schema
- **Description:** Skill frontmatter only includes `name` and `description`. According to the Claude Code plugin system, skill frontmatter should be minimal but the description format should follow patterns. Current format is valid but could be improved.
- **Impact:** LOW - Skills will work but descriptions are not in the recommended format for routing.
- **Location:** Sections 2.1, 2.2, 2.3
- **Fix:** Consider updating to match pattern: "Use when [scenario]. Provides [capabilities]."

---

### HIGH Priority Issues

#### Issue 3: Skill Content Uses XML Tags Inside Markdown Code Blocks
- **Category:** XML Structure
- **Description:** The skill SKILL.md files are shown with ```xml opening but contain markdown content, not XML. Skills should be plain markdown with optional YAML frontmatter, not XML.
- **Impact:** Parser confusion - skill content may not be properly loaded or may display incorrectly.
- **Location:** Sections 2.1, 2.2, 2.3 - Skills show ````xml` but content is markdown
- **Fix:** Remove the outer ```xml markers and use plain markdown. Skills are markdown files, not XML files.

#### Issue 4: Missing Proxy Mode Support in Agents
- **Category:** Completeness
- **Description:** Agents lack the PROXY_MODE support pattern that is standard in other plugin agents (see frontend/developer.md, agentdev/developer.md). This prevents multi-model validation workflows.
- **Impact:** Cannot use external AI models (Grok, GPT-5, etc.) for video processing validation.
- **Location:** Sections 3.1, 3.2, 3.3 - Agent instructions
- **Fix:** Add `<proxy_mode_support>` section to each agent's `<critical_constraints>`:
  ```xml
  <critical_constraints>
    <proxy_mode_support>
      **FIRST STEP: Check for Proxy Mode Directive**

      If prompt starts with `PROXY_MODE: {model_name}`:
      1. Extract model name and actual task
      2. Delegate via Claudish: `printf '%s' "$PROMPT" | npx claudish --stdin --model {model_name} --quiet --auto-approve`
      3. Return attributed response and STOP

      **If NO PROXY_MODE**: Proceed with normal workflow
    </proxy_mode_support>
    ...
  </critical_constraints>
  ```

#### Issue 5: No Session Management in Commands
- **Category:** Completeness
- **Description:** Commands lack session management for artifact isolation. The /review command uses session directories to prevent file conflicts between runs. Video editing commands should follow the same pattern.
- **Impact:** Multiple concurrent video editing sessions could overwrite each other's files.
- **Location:** Sections 4.1, 4.2, 4.3 - Command orchestration
- **Fix:** Add session management pattern to command orchestration:
  ```xml
  <orchestration>
    <session_management>
      <initialization>
        1. Generate session ID: video-YYYYMMDD-HHMMSS-XXXX
        2. Create session directory: ai-docs/sessions/{SESSION_ID}/
        3. Store SESSION_PATH for all artifact paths
      </initialization>
    </session_management>
  </orchestration>
  ```

#### Issue 6: Missing $ARGUMENTS in Agent Prompts
- **Category:** Completeness
- **Description:** Commands correctly include `<user_request>$ARGUMENTS</user_request>` but agents do not. While agents receive prompts via Task, having a consistent pattern helps with debugging and prompt engineering.
- **Impact:** Minor - agents work but lack consistent prompt structure.
- **Location:** Agent XML structures
- **Fix:** Consider adding to agents for consistency, though not strictly required.

---

### MEDIUM Priority Issues

#### Issue 7: Inconsistent Tool Lists
- **Category:** Consistency
- **Description:** The video-processor agent has `tools: TodoWrite, Read, Bash, Glob, Grep` but no `Write` tool. However, the transcriber and timeline-builder have `Write` tool. If video-processor needs to write temporary files or reports, it will fail.
- **Impact:** video-processor cannot write output manifests or logs.
- **Location:** Section 3.1 - video-processor frontmatter
- **Fix:** Evaluate whether video-processor needs Write tool. If it should only run FFmpeg and report results, current config is fine. If it needs to write processing logs, add Write.

#### Issue 8: Timeline-builder Classified as "Implementer" but Color is "purple"
- **Category:** Schema Compliance
- **Description:** According to color guidelines, purple = Planning (architect), green = Implementation. The timeline-builder is typed as "Implementer" but colored purple. It should be green.
- **Impact:** Visual inconsistency in terminal output, potential user confusion.
- **Location:** Section 3.3 - timeline-builder
- **Fix:** Change color from `purple` to `green` since timeline-builder is an implementer.

#### Issue 9: Missing Error Recovery for Commands
- **Category:** Robustness
- **Description:** The /video-edit command has error_recovery section but /transcribe and /create-fcp-project commands do not. All commands should have consistent error recovery strategies.
- **Impact:** Commands may fail ungracefully on errors without clear recovery paths.
- **Location:** Sections 4.2, 4.3
- **Fix:** Add `<error_recovery>` section to /transcribe and /create-fcp-project commands mirroring the /video-edit pattern.

#### Issue 10: Hardcoded Paths in Skill Examples
- **Category:** Best Practices
- **Description:** CLAUDE.md explicitly states "do not use hardcoded path in code, docs, comments or any other files". The skills contain examples with hardcoded paths like `/path/to/`, `/Users/user/`, etc.
- **Impact:** Violates project guidelines, examples may confuse users about path handling.
- **Location:** All skill SKILL.md files
- **Fix:** Replace with relative paths, environment variables, or {placeholder} syntax:
  - `file:///path/to/clip.mov` -> `file://{absolute_path_to}/clip.mov`
  - `/Users/user/Movies/` -> `$HOME/Movies/` or `{user_movies_dir}/`

---

### LOW Priority Issues

#### Issue 11: No Version Pinning for Dependencies
- **Category:** Documentation
- **Description:** Dependencies section lists FFmpeg 5.0+ and general requirements but doesn't specify minimum versions for Whisper models or FCPXML versions.
- **Impact:** Users may have compatibility issues with older tool versions.
- **Location:** Section 5.1
- **Fix:** Add version requirements: "Whisper (openai-whisper 2024+)", "FCPXML 1.9 (FCP 10.5+)"

#### Issue 12: Missing Batch Processing Examples
- **Category:** Completeness
- **Description:** The transcription skill shows batch processing but the agent examples don't demonstrate batch workflows. Common use case would be transcribing multiple files.
- **Impact:** Users may not realize batch processing is supported.
- **Location:** Section 3.2 - transcriber examples
- **Fix:** Add example showing batch transcription workflow.

#### Issue 13: No MCP Server Configuration Details
- **Category:** Completeness
- **Description:** Plugin manifest references `mcp-servers/` but the design document doesn't specify what MCP servers are planned or how they would be configured.
- **Impact:** Unclear if MCP integration is planned or just placeholder.
- **Location:** Section 1.2 Architecture Diagram
- **Fix:** Either define MCP servers or remove from manifest if not planned for v1.0.

#### Issue 14: Skill Cross-References Are Incomplete
- **Category:** Documentation
- **Description:** Skills have "Related Skills" sections but they don't use the proper plugin:skill notation (e.g., `video-editing:ffmpeg-core`).
- **Impact:** Users may not find related skills through standard navigation.
- **Location:** All skill files
- **Fix:** Update to use full skill references: "video-editing:transcription" instead of just "transcription".

---

## Recommendations

### Before Implementation

1. **Fix CRITICAL Issue 1** - Add `model: sonnet` to all agent frontmatters
2. **Fix HIGH Issue 3** - Convert skill content from XML-wrapped to plain markdown
3. **Fix HIGH Issue 4** - Add proxy mode support to enable multi-model validation

### During Implementation

4. Add session management to commands (HIGH Issue 5)
5. Correct timeline-builder color to green (MEDIUM Issue 8)
6. Add error recovery to /transcribe and /create-fcp-project (MEDIUM Issue 9)
7. Replace hardcoded paths with placeholders (MEDIUM Issue 10)

### Post-Implementation

8. Add batch processing examples
9. Clarify MCP server plans or remove from manifest
10. Update skill cross-references to full notation

---

## Approval Decision

**Status:** CONDITIONAL

**Rationale:**
- 0 CRITICAL issues that fundamentally break functionality (Issue 1 is easily fixed)
- 4 HIGH issues that should be addressed before implementation begins
- Implementation can proceed after HIGH issues are resolved

**Blocking Items:**
1. Add `model` field to all agent frontmatters
2. Convert skills from XML-wrapped format to plain markdown
3. Add proxy mode support pattern to agents
4. Add session management to commands

**Non-Blocking Recommendations:**
- Color correction, error recovery, path placeholders can be done during implementation

---

## Appendix: Validation Checklist

### Agent Frontmatter Validation
| Agent | name | model | description | color | tools | skills | Status |
|-------|------|-------|-------------|-------|-------|--------|--------|
| video-processor | OK | MISSING | OK (5 examples) | green | OK | OK | FAIL |
| transcriber | OK | MISSING | OK (5 examples) | orange | OK | OK | FAIL |
| timeline-builder | OK | MISSING | OK (5 examples) | purple->green | OK | OK | FAIL |

### Command Frontmatter Validation
| Command | description | allowed-tools | skills | Status |
|---------|-------------|---------------|--------|--------|
| /video-edit | OK | OK | OK | PASS |
| /transcribe | OK | OK | OK | PASS |
| /create-fcp-project | OK | OK | OK | PASS |

### XML Structure Validation
| Component | role | instructions | critical_constraints | workflow | examples | Status |
|-----------|------|--------------|---------------------|----------|----------|--------|
| video-processor | OK | OK | OK (missing proxy) | OK (5 phases) | OK (2) | PARTIAL |
| transcriber | OK | OK | OK (missing proxy) | OK (5 phases) | OK (2) | PARTIAL |
| timeline-builder | OK | OK | OK (missing proxy) | OK (6 phases) | OK (2) | PARTIAL |
| /video-edit | OK | OK | OK | OK (5 phases) | OK (2) | PASS |
| /transcribe | OK | OK | OK | OK (4 phases) | - | PASS |
| /create-fcp-project | OK | OK | OK | OK (5 phases) | - | PASS |

---

*Review generated by Claude Opus 4.5 (Internal)*
*Document: /Users/jack/mag/claude-code/ai-docs/plan-review-claude-internal.md*
