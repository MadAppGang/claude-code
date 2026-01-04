# Plan Review: Video Editing Plugin Design

**Reviewer:** OpenAI GPT-5.2 (via Claudish proxy)
**Document Reviewed:** `/Users/jack/mag/claude-code/ai-docs/agent-design-video-editing-plugin.md`
**Review Date:** 2025-12-29

---

## Summary

Strong high-level architecture (3 skills + 3 implementer agents + 3 orchestrator commands) with sensible separation of concerns (FFmpeg vs transcription vs FCPXML). The main risks are **schema/loader mismatches** (plugin manifest location/name conventions, skills naming format, command/agent frontmatter keys), **over-broad tool permissions**, and **underspecified artifact + path handling** (especially for FCPXML `file://` URIs and avoiding source overwrite). Error handling is present but not yet "operationally complete" (no structured failure modes, retry policy boundaries, or partial-success reporting).

---

## Strengths

- Clear component split:
  - `video-processor` for FFmpeg operations
  - `transcriber` for Whisper workflows
  - `timeline-builder` for FCPXML output
  - Orchestrators delegate appropriately *in intent*.
- Good dependency awareness: `ffmpeg/ffprobe`, Whisper optionality, `xmllint` validation.
- Explicit workflow phases and validation-first mindset.
- Skills as knowledge repositories (good fit for Claude Code plugins; keeps agents smaller).

---

## Issues

### CRITICAL

1. **Plugin manifest location / repo convention mismatch**
   - **Category:** Configuration / Paths
   - **Description:** Your repo's documented requirement says the plugin manifest is `.claude-plugin/plugin.json` at marketplace level, and plugin roots contain `plugin.json` under `plugins/{name}/` (as shown for other plugins). Your design says **Target Location** is `/Users/.../plugins/video-editing/` and includes `plugin.json` there—which is consistent with existing plugin folders, *but* you should avoid hardcoded absolute paths in docs (repo instruction: "do not use hardcoded path in code, docs, comments or any other files").
   - **Impact:** Build/install failures; violates repo guidelines
   - **Fix:** Make target location relative (`plugins/video-editing/`) everywhere.

2. **Skills naming / referencing likely inconsistent**
   - **Category:** Schema / Loader
   - **Description:** You reference skills as `video-editing:ffmpeg-core` etc. In this repo, skills are typically loaded by folder path; "namespace:skill" formatting may not match loader expectations unless the platform explicitly supports it.
   - **Impact:** Agent loads but skill resolution fails silently or is ignored.
   - **Fix:** Confirm and standardize the exact skill identifier format used elsewhere in this repo (e.g., `skills: ffmpeg-core` vs `video-editing:ffmpeg-core`).

3. **Orchestrator "MUST delegate" vs `allowed-tools` includes `Bash`**
   - **Category:** Architecture / Consistency
   - **Description:** If `/video-edit` is truly an orchestrator that must not implement, it should not need `Bash` except for minimal dependency checks. Allowing `Bash` makes it easy to violate your own constraint.
   - **Impact:** Erosion of "delegate-only" invariant; harder audits
   - **Fix:** Remove `Bash` from orchestrators (or narrowly constrain: "Bash only for version checks and file existence checks"), and push all execution into implementers.

---

### HIGH

1. **YAML frontmatter keys are not aligned/consistent across components**
   - **Category:** Schema
   - **Description:** Agents use `tools:`; commands use `allowed-tools:`. This may be correct (Claude Code has both patterns depending on file type), but in your repo conventions the exact keys matter.
   - **Impact:** Tools allowlist ignored or misapplied.
   - **Fix:** Pick one schema per artifact type and adhere to it consistently; validate against existing `plugins/*/agents/*.md` and `plugins/*/commands/*.md` patterns.

2. **Missing explicit artifact naming & output directory convention**
   - **Category:** Completeness
   - **Description:** You say "never overwrite source files", but you don't specify:
     - where derived files go (`./output/`, `./renders/`, sibling folder, temp dir)
     - naming rules (`_trimmed`, `_prores`, `normalized_`, hashing)
     - collision handling
   - **Impact:** Operationally brittle, especially in batch workflows.
   - **Fix:** Define an output policy and ensure all agents follow it.

3. **FCPXML path handling underspecified**
   - **Category:** Completeness
   - **Description:** "Absolute file:// URLs" is mentioned, but you need consistent URI encoding rules (spaces, unicode), and a strategy for portability (absolute paths break when moving projects).
   - **Impact:** Failed imports; broken project portability
   - **Fix:** Choose a policy:
     - absolute `file://` for immediate import reliability, plus
     - optional "relativize" mode for portability (with user confirmation).

---

### MEDIUM

1. **Error handling table is too coarse for multi-step pipelines**
   - **Category:** Error Handling
   - **Description:** Example: "Transcription fails -> retry with simpler model or abort" needs guardrails:
     - when to retry
     - what constitutes "simpler"
     - how to report partial success (some files transcribed, some not)
   - **Fix:** Introduce structured outcomes: `SUCCESS | PARTIAL_SUCCESS | FAILURE` with per-artifact status.

2. **Dependency installation instructions are platform-specific**
   - **Category:** Completeness
   - **Description:** `brew install ffmpeg` is macOS-centric (fine for your audience, but if plugin is marketplace-wide you'll want Linux notes).
   - **Fix:** Add conditional guidance (macOS brew; Linux apt/dnf/pacman) in skills, not in agents.

3. **Security boundaries for Bash not explicit**
   - **Category:** Security
   - **Description:** This plugin will run user-provided file paths through shell commands. You should specify quoting and safe invocation patterns (avoid shell injection).
   - **Fix:** Explicit rule: always pass paths as safely quoted args; never interpolate untrusted strings into filtergraphs without validation.

---

### LOW

1. **MCP server placeholder (`mcp-config.json`) is vague**
   - **Category:** Completeness
   - **Description:** If optional, clarify what it would provide (e.g., media metadata indexing, FCPXML validation service) or omit it until real.

2. **Some workflow phase counts differ (5-phase vs 6-phase)**
   - **Category:** Consistency
   - **Description:** Not inherently wrong, but makes orchestration harder to standardize.

---

## Recommendations

### 1. Normalize schemas across the plugin

Create a single "frontmatter contract":
- **Agents:** `name`, `description`, `model`, `color`, `tools`, `skills`
- **Commands:** `description`, `allowed-tools`, `skills`
- **Skills:** `name`, `description`

Then verify these match the existing repo's other plugins exactly.

### 2. Tighten orchestrator tool permissions

- **Orchestrators:** `Task`, `AskUserQuestion`, `TodoWrite`, `Read` (+ maybe `Glob` for file discovery).
- **Implementers:** `Bash` + file ops needed.
- Make "Bash allowed only in implementers" a hard rule unless you have a strong reason.

### 3. Define artifact/output conventions

Example policy:
- Default output dir: `./video-editing-output/`
- Derived files named deterministically: `{stem}.{operation}.{shortid}.{ext}`
- Never overwrite unless `--overwrite` confirmed by user
- Add "validation checkpoint" after each artifact creation (ffprobe duration/streams; subtitle lint; xmllint).

### 4. Make FCPXML generation robust

Specify:
- FCPXML version target(s)
- Frame rate handling and rounding rules
- URI encoding strategy
- "Missing media" behavior (fail vs placeholders)
- Add a validation + "import checklist" block in output.

### 5. Improve pipeline error handling and reporting

Add a standard results table:
- `input -> outputs -> status -> notes`

For batch workflows, require partial success support.

---

## Reviewer's Insight

> In this repo's plugin ecosystem, "correctness" is less about FFmpeg details and more about *manifest + frontmatter contract correctness* (paths, tool allowlists, skills naming), because those are what Claude Code actually loads/enforces.
>
> Orchestrator commands should minimize direct tool surface area (especially `Bash`) and push execution to implementer agents; otherwise you erode the "delegate-only" invariant and audits get harder.
>
> Video workflows are *stateful pipelines* (inputs -> derived artifacts -> verification), so a good design needs explicit artifact naming, working-dir conventions, and validation checkpoints to avoid overwrites and confusing outputs.

---

## Next Steps

1. Address CRITICAL issues before implementation
2. Review existing plugin patterns in `plugins/frontend/`, `plugins/code-analysis/` for schema alignment
3. Add output directory and artifact naming conventions to the design
4. Consider whether `/video-edit` orchestrator truly needs `Bash` or can delegate all checks

---

*Generated by: OpenAI GPT-5.2 via Claudish proxy*
