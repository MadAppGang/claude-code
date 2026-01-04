# Video Editing Plugin Design Review

**Reviewer:** minimax/minimax-m2.1 via Claudish
**Date:** 2025-12-29
**Target Document:** /Users/jack/mag/claude-code/ai-docs/agent-design-video-editing-plugin.md

---

## Summary

The video-editing plugin design document is a well-structured blueprint for a professional video editing toolkit with FFmpeg operations, Whisper transcription, and Final Cut Pro FCPXML generation capabilities. The design follows established plugin patterns with 3 skills, 3 agents, and 3 commands organized in a logical hierarchy. While the document provides comprehensive coverage of FFmpeg operations, transcription workflows, and FCPXML generation, it has several structural issues that need addressing before implementation, particularly around YAML frontmatter formatting, skill path conventions, and error handling completeness.

---

## Strengths

The design demonstrates strong architectural decisions in several areas. The orchestrator pattern is correctly implemented with `/video-edit` command delegating to specialized agents rather than executing operations directly, which aligns with best practices established in other MAG plugins. The skill-based knowledge distribution is excellent - reference material is properly isolated in skills while agents focus on execution workflows. The FCPXML documentation is thorough with accurate timing calculations, frame duration references for various frame rates, and complete project templates that will ensure valid output generation.

**Key Insight:** The decision to use FCPXML 1.9 for broad compatibility while supporting modern features like HDR and object tracking reflects careful consideration of real-world NTSC timing complexities (1001/30000s notation) that commonly trip up developers new to video editing.

The TodoWrite integration requirements are consistently applied across all agents with clear phase definitions that will enable good progress tracking during long-running video operations. The quality gates at each workflow phase provide natural checkpoints for validation before proceeding.

---

## Issues

### CRITICAL

**1. Incorrect Skill Path Format in plugin.json**

In `plugin.json` at lines 82-85, the skills array uses directory paths without `SKILL.md`:

```json
"skills": [
  "./skills/ffmpeg-core",
  "./skills/transcription",
  "./skills/final-cut-pro"
]
```

Claude Code requires explicit file references, not directories. This should be:

```json
"skills": [
  "./skills/ffmpeg-core/SKILL.md",
  "./skills/transcription/SKILL.md",
  "./skills/final-cut-pro/SKILL.md"
]
```

**2. Inconsistent YAML Frontmatter Formatting**

The skills use inconsistent YAML frontmatter. For example, `ffmpeg-core` skill at line 99-104 has:

```yaml
---
name: ffmpeg-core
description: FFmpeg fundamentals for video/audio manipulation...
---
```

However, `transcription` at line 286-291 and `final-cut-pro` at line 583-588 use the same format but the parent document's example `agentdev:schemas` standard shows namespaced skills should reference themselves differently for plugin resolution. Additionally, agents use `skills: video-editing:ffmpeg-core` which expects a namespaced skill reference, but skills define only the local name.

---

### HIGH

**3. Missing README.md Documentation**

The architecture diagram at lines 24-44 shows `README.md` at the plugin root, and `plugin.json` at line 46-87 references the manifest, but no README content is provided. A professional plugin requires installation instructions, usage examples, and dependency verification steps.

**4. Commands Missing Frontmatter Type Specification**

Commands at lines 1665-1673 (video-edit), 1916-1924 (transcribe), and 2069-2077 (create-fcp-project) lack the required `type` field in YAML frontmatter. Other MAG plugins use:

```yaml
type: command
```

**5. XML Instruction Structure Missing Closing Tags**

The XML structures throughout the document have inconsistent closing. The `ffmpeg-core` skill ends at line 278-279 with:

```xml
## Related Skills

- **transcription** - Extract audio for Whisper processing
```

The closing `</xml>` tag is missing. This pattern repeats across all skills and agents - the entire XML content block lacks proper closure.

---

### MEDIUM

**6. Skills Missing Required `type` Field**

Following the `agentdev:schemas` standard, skills require:

```yaml
type: skill
```

This is missing from all three skill frontmatter definitions at lines 100, 287, and 584.

**7. Agents Missing Explicit Type in Frontmatter**

While agents have `model: sonnet` and `color: green`, the `type: agent` field should be explicit for clarity and consistency with other plugins in the marketplace.

**8. Incomplete Error Recovery Documentation**

The error handling table at lines 2248-2255 provides detection and recovery strategies, but the actual implementation details in agent `<knowledge>` sections are incomplete. For example:
- `video-processor` has error_recovery at lines 1095-1101 but lacks recovery for hardware acceleration failures
- `timeline-builder` has common_issues at lines 1571-1576 but no recovery steps
- `transcriber` has error handling at lines 545-569 but missing Whisper-specific GPU/transcription failures

**9. No Batch Processing Coordination**

The design mentions batch processing in skills (lines 484-510, 539-543) but the orchestrator commands don't have explicit parallel execution patterns. The `/transcribe` command at line 2016 says "consider parallel execution" but provides no implementation guidance.

---

### LOW

**10. Missing Environment Variables Documentation**

FFmpeg and Whisper can benefit from environment configuration (e.g., `FFMPEG_BINARY`, `WHISPER_MODEL_PATH`) but no environment variable conventions are documented.

**11. Hardware Acceleration Not Fully Integrated**

While hardware acceleration is mentioned in skill content (lines 244-245 for VideoToolbox), agents don't have explicit workflows for GPU detection and utilization. The `video-processor` agent could include a phase for detecting and utilizing hardware acceleration.

**12. No Output Directory Configuration**

The design doesn't specify where output files should be created or how to handle naming conflicts. All three agents should have clear conventions for output file naming and location.

---

## Recommendations

### Immediate Fixes Required Before Implementation

1. **Skill paths in `plugin.json`** must be corrected to include `SKILL.md` file references
2. **All three skills** need `type: skill` added to their frontmatter
3. **All commands** need `type: command` in their frontmatter
4. **README.md** should be created with installation instructions, dependency verification commands, and quick-start examples

### Architecture Improvements

Consider adding a dedicated `Write` tool capability to agents that currently only have `TodoWrite, Read, Bash, Glob, Grep` - the `transcriber` agent at line 1182 and `timeline-builder` at line 1416 both need `Write` tool access to create output files.

**Key Insight:** The timeline-builder agent requires Write capability to create FCPXML files, yet the tools list only includes TodoWrite, Read, Bash, Glob, Grep. This is a common oversight in design - the tools list often omits what's needed for file output, only focusing on file analysis.

Add a validation phase for all agents that runs before processing to verify not just input files but also output path writability and available disk space.

### Missing Components to Add

1. The plugin would benefit from a **shared utility module** or helper functions for common operations like timecode parsing, frame rate calculations, and format detection that are currently inline in each agent
2. Consider adding an **MCP server configuration** in `mcp-servers/` if there are external video processing APIs to integrate

### Documentation Gaps

Add troubleshooting section to README covering:
- Common FFmpeg errors
- Whisper model selection guide for different hardware configurations
- FCPXML import troubleshooting

---

## Issue Summary

| Severity | Count | Categories |
|----------|-------|------------|
| CRITICAL | 2 | Skill paths, YAML frontmatter |
| HIGH | 3 | Missing README, command type, XML structure |
| MEDIUM | 4 | Skill type, agent type, error recovery, batch processing |
| LOW | 3 | Environment vars, hardware acceleration, output directories |

---

*Generated by: minimax/minimax-m2.1 via Claudish*
