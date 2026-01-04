# Video Editing Plugin Design Review

**Reviewer:** qwen/qwen3-vl-235b-a22b-thinking (via Claudish proxy, fallback to google/gemini-3-pro-preview)
**Date:** 2025-12-29
**Document Reviewed:** /Users/jack/mag/claude-code/ai-docs/agent-design-video-editing-plugin.md

---

## Summary

The design for the `video-editing` plugin is well-structured and comprehensive, effectively utilizing the Claude Code agent pattern. It separates concerns logically into three domains: encoded media processing (`video-processor`), semantic extraction (`transcriber`), and timeline construction (`timeline-builder`). The documentation for skills is particularly strong, providing excellent reference material for the agents.

However, there is a **CRITICAL** architectural flaw regarding the execution of long-running processes (video encoding and transcription) which will likely cause the plugin to fail for any real-world video task exceeding 10 minutes.

---

## Strengths

- **Clear Separation of Concerns:** Distinct agents for processing, transcribing, and timeline building prevents context bloat.
- **Excellent Skill Documentation:** The `ffmpeg-core` and `final-cut-pro` skills provide production-ready, highly specific knowledge that reduces hallucination risks.
- **Orchestration Pattern:** The distinction between user-facing commands (orchestrators) and execution agents (implementers) is correctly applied.
- **FCPXML 1.9 Standard:** Choosing a specific, widely compatible FCPXML version (1.9) avoids compatibility issues.
- **Safety First:** Explicit constraints against overwriting source files and requirements for validation phases.
- **TodoWrite Integration:** All agents properly require TodoWrite for workflow tracking.
- **Comprehensive Examples:** Both skills and agents include concrete usage examples.
- **Error Recovery Patterns:** Skills include validation functions and error handling guidance.

---

## Issues

### CRITICAL

| Issue | Description | Location | Impact |
|-------|-------------|----------|--------|
| **Bash Tool Timeout Limitation** | The design instructs agents to run `ffmpeg` and `whisper` via the `Bash` tool but does not account for the 10-minute hard timeout limit of the `Bash` tool. Video rendering and transcription often exceed this. Using blocking calls will cause tasks to crash/timeout for medium-to-large files. | `agents/video-processor.md`, `agents/transcriber.md` | Plugin will fail for any video processing task exceeding 10 minutes |

### HIGH

| Issue | Description | Location | Impact |
|-------|-------------|----------|--------|
| **Agent Timeout Risk** | If the orchestrator waits for the sub-agent (which is running a long process), the `Task` call itself might timeout depending on the system configuration. Video operations are fundamentally different from code editing operations in duration. | All commands using Task delegation | Orchestrator may timeout waiting for agents |
| **Missing Write Tool in Video Processor** | While `ffmpeg` writes files via CLI, the agent might need to create temporary file lists for concatenation (`filelist.txt` mentioned in skill). The `video-processor` agent does NOT have the `Write` tool in its `tools:` list. | `agents/video-processor.md` | Cannot perform concatenation workflows that require file lists |

### MEDIUM

| Issue | Description | Location | Impact |
|-------|-------------|----------|--------|
| **Ambiguous Transcription Environment** | The design assumes a local Python environment for Whisper (`pip install`). It does not account for dependency conflicts (Python versions, PyTorch, etc.) or lack of GPU on user machines (making Whisper painfully slow). Should strongly suggest or support `whisper.cpp` or `insanely-fast-whisper` as primary paths. | `skills/transcription/SKILL.md`, `agents/transcriber.md` | Poor user experience on systems without GPU |
| **Input Ambiguity in Orchestrator** | The `video-edit` command instructions on parsing user requests are brief. If a user says "/video-edit trim", the orchestrator needs a robust way to ask *which* file if multiple are present, or fail gracefully. | `commands/video-edit.md` | User confusion when files are not specified |
| **No Proxy Mode Support** | Agents do not include proxy mode support for external AI model validation, which is a standard pattern in the codebase. | All agents | Cannot leverage multi-model validation |

### LOW

| Issue | Description | Location | Impact |
|-------|-------------|----------|--------|
| **XML Validation Dependency** | `xmllint` is assumed to be present (it usually is on macOS), but a fallback check or suggestion to install `libxml2` would be more robust for Linux users. | `agents/timeline-builder.md` | May fail on Linux without `xmllint` |
| **Missing Version in Skill Frontmatter** | Skills do not include version numbers in their frontmatter. | All skills | Harder to track skill evolution |
| **No MCP Server Configuration** | The `mcp-servers/` directory is mentioned but `mcp-config.json` is listed as "optional" without explanation of what it would contain. | `plugin.json` architecture | Unclear whether MCP integration is planned |

---

## Recommendations

### 1. Implement Long-Running Process Pattern (CRITICAL)

Update `video-processor` and `transcriber` workflows to use the `Bash` tool's `run_in_background: true` parameter for the actual execution step. Implement a monitoring loop:

```xml
<phase number="3" name="Execution">
  <step>Mark "Execute processing" as in_progress</step>
  <step>Run FFmpeg in background with run_in_background: true</step>
  <step>Capture process ID from output</step>
  <step>Poll for completion using: ps -p {pid} || echo "done"</step>
  <step>Check output file size periodically to ensure progress</step>
  <step>Timeout gracefully if no progress after extended period</step>
  <step>Mark task as completed when process finishes</step>
</phase>
```

### 2. Add Write Tool to Video Processor (HIGH)

Add `Write` to the `tools` list in `agents/video-processor.md`:

```yaml
tools: TodoWrite, Read, Write, Bash, Glob, Grep
```

This enables concatenation workflows that require creating file lists.

### 3. Hardware and Environment Profiling (MEDIUM)

Add a "System Profiling" step to the `transcriber` agent's startup phase:

```xml
<phase number="0" name="System Profiling">
  <step>Check for CUDA: nvidia-smi 2>/dev/null</step>
  <step>Check for Metal (macOS): system_profiler SPDisplaysDataType</step>
  <step>Select appropriate Whisper engine and device automatically</step>
  <step>Report expected performance based on hardware</step>
</phase>
```

### 4. Add Proxy Mode Support

Include the standard proxy mode pattern in critical constraints for agents that might benefit from external model validation:

```xml
<critical_constraints>
  <proxy_mode_support>
    **FIRST STEP: Check for Proxy Mode Directive**

    If prompt starts with `PROXY_MODE: {model_name}`:
    1. Extract model name and actual task
    2. Delegate via Claudish
    3. Return attributed response and STOP
  </proxy_mode_support>
</critical_constraints>
```

### 5. Enhance Input Handling in Orchestrator

Add explicit file detection and user prompting:

```xml
<phase number="1" name="Request Analysis">
  <steps>
    <step>Parse user request for file patterns</step>
    <step>If no files specified, use Glob to find video files in current directory</step>
    <step>If multiple files found and no pattern given, use AskUserQuestion to clarify</step>
    <step>If no files found, report error with helpful message</step>
  </steps>
</phase>
```

### 6. Create Integration Test Plan

Create a specific plan for testing these agents with *short* (10s) dummy clips first to verify pipelines without hitting timeout limits during development. Consider adding a `test/` directory with:
- Sample short video clips
- Expected outputs for validation
- Test scripts for each workflow

---

## Architecture Completeness Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| Plugin manifest | Complete | Well-structured plugin.json |
| Skills (3) | Complete | Comprehensive reference material |
| Agents (3) | Mostly Complete | Missing Write tool, no background execution pattern |
| Commands (3) | Complete | Good orchestration structure |
| Error handling | Partial | Good strategies but missing timeout handling |
| Integration points | Complete | Clear dependency documentation |

---

## YAML Frontmatter Assessment

| Component | Schema Compliance | Issues |
|-----------|-------------------|--------|
| Agents | Compliant | Correct fields: name, description, model, color, tools, skills |
| Commands | Compliant | Correct fields: description, allowed-tools, skills |
| Skills | Partial | Missing version field, but otherwise correct |

---

## XML Structure Assessment

| Component | Structure Quality | Issues |
|-----------|-------------------|--------|
| `<role>` | Good | Identity, expertise, mission properly defined |
| `<instructions>` | Good | Critical constraints, core principles, workflow phases present |
| `<knowledge>` | Good | Domain-specific reference material included |
| `<examples>` | Good | 2+ concrete examples per component |
| `<formatting>` | Good | Completion templates defined |
| `<orchestration>` | Good | Allowed/forbidden tools, delegation rules, error recovery |

---

## Conclusion

The video-editing plugin design is fundamentally sound in its architecture and follows Claude Code conventions well. The **CRITICAL** issue of Bash tool timeout limits must be addressed before implementation, as it will cause the plugin to fail for most real-world use cases. The **HIGH** priority issues should also be resolved to ensure complete functionality.

**Overall Assessment:** CONDITIONAL PASS - Requires fixes for CRITICAL and HIGH issues before implementation.

---

*Generated by: google/gemini-3-pro-preview via Claudish proxy*
*Note: Original target model (qwen/qwen3-vl-235b-a22b-thinking) experienced tool validation errors, fallback model used*
