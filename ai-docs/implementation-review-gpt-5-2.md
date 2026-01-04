# Video Editing Plugin Implementation Review (GPT-5.2)

## Summary
The `plugins/video-editing/` plugin is structurally complete (plugin manifest + 3 agents + 3 commands + 3 skills) and generally follows the **agentdev frontmatter schemas** and **XML tag standards**.

Strengths:
- Commands behave as orchestrators: `allowed-tools` includes `Task`, and XML `<orchestration>` explicitly forbids `Write, Edit`.
- Agents include usage examples (3+), valid `model: sonnet`, and tool lists match “implementer” expectations.
- XML blocks are consistently organized (`<role>`, `<instructions>`, `<knowledge>`, `<examples>`, `<formatting>`).

Main gaps:
- **Hardcoded absolute-path examples** exist in the `final-cut-pro` skill (violates project rule “no hardcoded path in code, docs, comments or any other files”).
- `plugin.json` is minimal compared to other plugins (no `homepage`, `dependencies`, `compatibility`, `hooks`, `mcpServers`, etc.). This may be acceptable, but if marketplace tooling expects those fields, it’s incomplete.

---

## Issues

### CRITICAL

1) **Hardcoded absolute paths in docs**
- Project instruction explicitly forbids hardcoded paths anywhere.
- Found in `/Users/jack/mag/claude-code/plugins/video-editing/skills/final-cut-pro/SKILL.md:38-39` and other locations.

Evidence:
- `plugins/video-editing/skills/final-cut-pro/SKILL.md:39`
  - `<library location="file:///Users/user/Movies/MyLibrary.fcpbundle/">`
- `plugins/video-editing/skills/final-cut-pro/SKILL.md:79-84`
  - `src="file:///Users/user/Footage/interview.mov"`

This is likely to fail internal review in this repo, even though the paths are “example” strings.

---

### HIGH

2) **`plugin.json` manifest lacks fields used by other plugins**
- `plugins/video-editing/plugin.json` contains only: `name`, `version`, `description`, `author`, `license`, `keywords`, `category`, `agents`, `commands`, `skills`.
- Other plugins in this repo frequently include additional fields (examples):
  - `homepage` (orchestration: `plugins/orchestration/plugin.json:6`)
  - `dependencies` (seo: `plugins/seo/plugin.json:23-25`)
  - `compatibility` (agentdev/orchestration)
  - `hooks` (orchestration/code-analysis/seo)
  - `mcpServers` (frontend/bun/seo)

If marketplace validation expects parity, the video-editing manifest may be rejected or appear “incomplete” in listings.

---

### MEDIUM

3) **Skill namespace references may not match how other plugins reference skills**
- Agents and commands reference skills with prefix `video-editing:...`.
  - Example: `plugins/video-editing/agents/video-processor.md:12-13` → `skills: video-editing:ffmpeg-core`
  - Example: `plugins/video-editing/commands/video-edit.md:6-7` → `skills: video-editing:ffmpeg-core, ...`

In other plugins, skill references are commonly cross-plugin (e.g., `plugins/frontend/agents/tester.md:4` → `skills: code-analysis:tester-detective`).

This may be fine (depends on your skill resolution rules), but it’s worth verifying that:
- the marketplace runtime supports `plugin-name:skill-name` style for *same-plugin* skills, and
- the skill directory names (`./skills/ffmpeg-core`, etc.) map to those identifiers.

---

### LOW

4) **README uses generic placeholder path**
- `plugins/video-editing/README.md:55-56` includes `/plugin marketplace add /path/to/claude-code`.

This is not a hardcoded absolute path, but it may still trip a strict interpretation of the “no hardcoded path” project rule.

---

## Recommendations

1) **Remove/neutralize absolute path examples in `final-cut-pro` skill**
- Replace `file:///Users/user/...` with a tokenized placeholder (e.g., `file://{ABSOLUTE_PATH_TO_MEDIA}`) to satisfy the project rule while preserving meaning.

2) **Align `plugin.json` fields with repo conventions**
- Add at least `homepage` and `compatibility` (and optionally `dependencies`) if your marketplace/claudeup tooling expects them.
- Consider adding `mcpServers` only if needed; otherwise it’s fine to omit.

3) **Confirm skill identifier resolution**
- Verify that `video-editing:ffmpeg-core` resolves to `./skills/ffmpeg-core/SKILL.md` at runtime.
- If the runtime expects just `ffmpeg-core` for same-plugin skills, update references consistently across agents/commands.

4) **Quality gates are generally good; consider making validation steps executable**
- Commands already specify quality gates (dependency checks, `xmllint`, etc.). Ensure the actual orchestrator runtime will execute those bash checks (the command docs include them as steps).

---

## Notes on YAML / XML validation criteria
- Agent frontmatter compliance checks applied using the provided schema:
  - Opening/closing `---` present.
  - `name` matches lowercase-with-hyphens.
  - `description` includes 3+ examples.
  - `model: sonnet` valid.
  - `tools` are comma-separated with spaces.
- Command frontmatter compliance checks applied:
  - `description` multi-line includes workflow.
  - `allowed-tools` includes `Task` and does not include `Write/Edit`.
- XML tag structure aligned with `agentdev:xml-standards`:
  - `<role>` identity/expertise/mission blocks present.
  - `<instructions>` contains constraints and `<workflow>` phases.
  - Commands include `<orchestration>` + `<error_recovery>`.

