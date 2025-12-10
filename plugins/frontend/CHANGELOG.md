# Changelog

All notable changes to the Frontend Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.12.0] - 2025-12-10

### Added

- **Dependency Check Skill** - New skill that checks for required dependencies before running commands
  - Chrome DevTools MCP availability check for UI validation
  - OpenRouter API key check for multi-model orchestration
  - User-friendly setup instructions with `claudeup` recommendations
  - Graceful degradation when dependencies unavailable

- **Visual Analysis Model Selection** - Interactive model picker for screenshot analysis
  - Asks user which vision model to use on first analysis
  - Remembers choice for session (temporary) or project (persistent)
  - Supports: Qwen VL 32B (recommended), Gemini 2.5 Flash, GPT-4o, Polaris Alpha (free)
  - Saves preference to `.claude/settings.json` for future sessions

- **Enhanced Browser Debugger Skill** - Comprehensive visual analysis and validation recipes
  - 6 validation recipes: Agent Self-Validation, Design Fidelity, Interactive Testing, Responsive Design, Accessibility, Console/Network Debugging
  - Vision model recommendations with cost comparison
  - Agent integration protocols for developer, reviewer, tester, ui-developer
  - Decision tree for model selection flow

### Changed

- **`/implement` command** - Added PRELIMINARY 2 dependency check phase
  - Checks Chrome DevTools MCP before UI validation phases
  - Checks OpenRouter API key before multi-model code review
  - Adapts workflow based on available dependencies

- **`/review` command** - Added dependency check for OpenRouter API
  - Checks API key availability before offering multi-model options
  - Gracefully falls back to embedded Claude only

- **`/validate-ui` command** - Added Chrome DevTools MCP requirement check
  - Hard requirement (cannot proceed without MCP)
  - Clear installation instructions via claudeup

### Research Sources

Visual analysis model recommendations based on:
- [OpenRouter Models](https://openrouter.ai/models) - Vision model pricing
- [Browser-Use Framework](https://browser-use.com/) - Browser automation patterns
- [Qwen VL](https://openrouter.ai/qwen) - Best OCR & spatial reasoning
- [DataCamp VLM Comparison](https://www.datacamp.com/blog/top-vision-language-models) - Benchmarks

---

## [3.11.0] - 2025-12-09

### Added

- **LLM Performance Tracking** - Track external model execution times and quality scores
  - Persistent storage in `ai-docs/llm-performance.json`
  - Per-model metrics: execution time, issues found, quality score
  - Smart recommendations for slow/unreliable models

---

## [3.10.0] - 2025-12-08

### Added

- **shadcn/ui Component Library Skill** - 60+ component knowledge
  - Installation and configuration guidance
  - Component usage patterns and best practices
  - Theming and customization

---

## [3.9.0] - 2025-12-07

### Added

- **Session Management** - Unique session IDs for artifact isolation
- **Model Preference Persistence** - Save review model choices

---

## [3.8.0] - 2025-11-26

### Changed

- **Opus 4.5 Upgrades** - Critical agents upgraded to Claude Opus 4.5
  - `architect` - Superior architecture planning
  - `reviewer` - Enhanced code review reasoning
  - `test-architect` - Better testing strategy
  - `plan-reviewer` - Improved multi-model plan review

---

## [3.7.0] - 2025-11-25

### Added

- **CSS Developer Agent** - Specialized CSS/Tailwind agent
- **UI Developer Agent** - Senior UI developer with React 19 best practices

---

## [3.6.0] - 2025-11-24

### Added

- **`/review` Command** - Multi-model code review orchestrator
  - Parallel execution (3-5x speedup)
  - Consensus analysis across models
  - Cost transparency with token estimates

---

## [3.5.0] - 2025-11-23

### Added

- **Plan Reviewer Agent** - Multi-model architecture plan validation
- **Designer Agent** - UI/UX design review specialist

---

## [3.0.0] - 2025-11-20

### Added

- **Multi-Model Code Review** - External AI models via Claudish
- **Intelligent Workflow Detection** - API/UI/Mixed task detection
- **Test-Driven Development Loop** - Automated test feedback in PHASE 2.5

### Changed

- **Modular Skills Architecture** - 11 focused skills vs monolithic file
- **Context-Efficient Design** - Load only needed skills

---

## [2.0.0] - 2025-11-15

### Added

- **Multi-Agent Orchestration** - `/implement` command with 8 phases
- **Quality Gates** - User approval checkpoints
- **Chrome DevTools Integration** - Browser-based testing

---

## [1.0.0] - 2025-11-10

### Added

- Initial release
- TypeScript frontend developer agent
- Frontend architect agent
- Basic testing capabilities
- TanStack Router & Query v5 skills
