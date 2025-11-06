# Changelog

All notable changes to the MAG Claude Plugins project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.0] - 2025-11-06

### Added

#### Chrome DevTools MCP Debugging Methodology (949 lines)

Comprehensive systematic debugging approach for responsive layout issues integrated into all three UI-related agents.

**Problem Solved**: Users encounter layout issues (horizontal overflow, unwanted scrolling, layout wrapping) but lack a systematic way to debug them. This leads to guessing, trial-and-error, and breaking other components.

#### UI Developer Agent - Implementation-Focused Debugging (+422 lines)

**New Section**: "🔍 Debugging Responsive Layout Issues with Chrome DevTools MCP"

**Four-Phase Workflow**:
- **Phase 1: Problem Identification** - Connect to Chrome DevTools MCP, measure overflow
- **Phase 2: Root Cause Analysis** - Find overflowing elements, walk parent chain to identify CSS constraints
- **Phase 3: Targeted Fixes** - Pattern-based fix recommendations (shrink-0 → shrink + min-w-0)
- **Phase 4: Validation** - Reload page, test multiple viewport sizes, validate fixes

**Key Features**:
- Specific Chrome DevTools MCP scripts for overflow detection
- Parent chain walking to identify root CSS constraints
- Common fix patterns for Figma-generated code issues
- Debugging script library (3 ready-to-use scripts)
- Complete example debugging session
- Anti-pattern documentation

**Critical Rules Enforced**:
1. Never make blind changes - inspect first
2. Always walk the parent chain
3. Validate after every change
4. Test at multiple viewport sizes
5. Document findings

#### CSS Developer Agent - Architecture Analysis Guidance (+396 lines)

**New Section**: "🔍 Guiding UI Developers on Debugging Responsive Layout Issues"

**Four-Phase Guidance Workflow**:
- **Phase 1: Problem Identification Guidance** - Guide UI Developer to measure overflow
- **Phase 2: Root Cause Analysis Guidance** - Guide element inspection and parent chain walking
- **Phase 3: CSS Architecture Analysis** - Analyze patterns, assess impact (LOCAL vs GLOBAL)
- **Phase 4: Provide Structured Guidance** - Safe fix recommendations with full context

**Key Features**:
- Guides UI Developer (doesn't implement)
- CSS architecture analysis (is this pattern used elsewhere?)
- Impact assessment for each change
- Safe fix recommendations with context
- Pattern validation against codebase
- Example consultation dialogue

**Guidance Principles**:
- Always analyze architecture first
- Provide context, not just solutions
- Include validation steps
- Update knowledge files after resolution

#### Designer Agent - Layout Issue Detection (+131 lines)

**New Section**: "### 2.5. Detect and Report Layout Issues (Optional)"

**Layout Health Check Workflow**:
- Quick overflow detection script
- Multi-viewport testing (1920px, 1380px, 1200px, 900px)
- Overflowing element identification
- Structured layout issue reporting

**Key Features**:
- Detects layout issues during design review
- Reports layout problems separately from visual discrepancies
- Recommends fixing layout FIRST before design review
- Clear reporting templates
- Delegates to UI/CSS Developer (doesn't implement)

**Important Distinction**:
- Layout issues (overflow) ≠ visual design discrepancies (colors, spacing)
- Can't assess design fidelity if layout is broken
- Focus on visual review once layout is stable

### Chrome DevTools MCP Scripts Provided

**Script 1: Overflow Detection**
- Measures viewport vs document scroll width
- Returns: viewport, documentScrollWidth, horizontalOverflow, status

**Script 2: Find Overflowing Elements**
- Queries all DOM elements, filters by width
- Returns: Top 10 sorted by overflow with className, minWidth, flexShrink

**Script 3: Walk Parent Chain**
- Walks from element up to document.body
- Returns: Full CSS context (width, minWidth, maxWidth, flexShrink, flexGrow)

**Script 4: Analyze Flex Container**
- Examines flex container and all children
- Returns: Container gap/width, child flex properties

### Common Patterns Addressed

**Figma-Generated Anti-Patterns**:
- Universal `shrink-0` classes preventing responsive behavior
- Hard-coded `min-width` from design specs (e.g., "643px")
- Missing `min-w-0` on flex children

**Fix Patterns**:
- `shrink-0` → `shrink + min-w-0`
- `min-w-[643px]` → `min-w-0` or reasonable minimum
- Add `min-w-0` to flex children that should shrink

### Agent Integration Workflow

The three agents now work together seamlessly:
1. Designer detects layout overflow during review
2. UI Developer debugs using systematic methodology
3. CSS Developer provides architecture analysis
4. UI Developer implements safe fix and validates
5. Designer re-reviews with stable layout

### Changed

- **Version Updates:**
  - Frontend Plugin: 2.6.1 → 2.7.0
  - Marketplace: 2.8.1 → 2.9.0

### Benefits

- ✅ **Systematic Approach** - Replaces trial-and-error with proven methodology
- ✅ **Reduced Debugging Time** - From hours to minutes
- ✅ **Safe Fixes** - Architecture analysis prevents breaking other components
- ✅ **Complete Coverage** - Detection → Diagnosis → Fix → Validation loop
- ✅ **Team Consistency** - All agents use same debugging principles
- ✅ **Production Ready** - Battle-tested patterns documented

### Technical Improvements

- **Total Lines Added**: +949 lines across 3 agents
- **UI Developer**: 856 → 1,278 lines (+422)
- **CSS Developer**: 1,237 → 1,633 lines (+396)
- **Designer**: 602 → 733 lines (+131)

### Impact

- Provides systematic debugging instead of guessing
- Catches layout issues before they ship
- Prevents breaking changes through architecture analysis
- Builds consistent debugging knowledge across team

---

## [2.6.1] - 2025-11-06

### Added

#### CVA Best Practices for shadcn/ui
- **Comprehensive CVA guidance** added to CSS Developer and UI Developer agents
  - Type-safe component variant patterns
  - Decision trees for className vs variant props
  - When to add CVA variants vs use className overrides
  - Troubleshooting common CVA issues
  - Documentation templates for CVA components

#### CSS Developer Agent - CVA Section (400+ lines)
- **Critical CVA Rules:**
  - NEVER use !important with CVA components
  - Don't create separate CSS classes for variants (breaks type system)
  - Always add new variants to CVA definition for reusable styles
  - Use className prop for one-off customizations only
  - Let twMerge (via cn()) handle class conflicts

- **Decision Tree for Custom Styling:**
  - One-off customization → Use className prop
  - Reusable style (3+ uses) → Add CVA variant
  - Modifies existing variant slightly → className prop override
  - Completely different style → Add CVA variant

- **Step-by-Step Variant Addition Guide**
- **3 Detailed Consultation Scenarios**
- **Troubleshooting Guide** (variant conflicts, TypeScript errors)
- **CVA Knowledge Documentation Templates**

#### UI Developer Agent - CVA Integration
- **Red Flags** triggering CSS Developer consultation
- **Golden Rule**: Work with CVA, don't fight it
- **Decision Tree** for when to consult CSS Developer
- **2 Detailed Consultation Examples**
- **Clear Guidelines** on what CSS Developer provides

### Changed

- **Version Updates:**
  - Frontend Plugin: 2.6.0 → 2.6.1
  - Marketplace: 2.8.0 → 2.8.1

### Benefits

- ✅ Type-safe component variants with IDE autocomplete
- ✅ Centralized style management (no scattered !important)
- ✅ Reusable patterns across entire codebase
- ✅ Automatic class conflict resolution via twMerge
- ✅ Consistent with shadcn/ui best practices (2025)
- ✅ No anti-patterns in codebase

---

## [2.6.0] - 2025-11-06

### Added

#### CSS-Aware Design Validation
- **DOM Inspection** - Designers now inspect actual rendered elements via Chrome DevTools MCP
- **Computed CSS Analysis** - Get real browser-computed styles (actual values, not just class names)
- **CSS Rule Identification** - See which CSS rules and Tailwind classes are applied
- **Pattern Awareness** - Consult CSS Developer to understand existing patterns before suggesting fixes
- **Safe Fix Recommendations** - Impact assessment (LOCAL/GLOBAL) for each suggested change

#### Enhanced Designer Agent (290+ lines added)

**New 5-Step Workflow:**
1. **Capture Screenshot & Inspect DOM** - Get computed styles for all major elements
2. **Consult CSS Developer for Context** - Understand patterns, tokens, and standard classes
3. **CSS-Aware Design Review** - Compare design vs actual computed CSS values
4. **Consult CSS Developer for Safe Fixes** - Verify each fix won't break other components
5. **Generate CSS-Aware Report** - Include computed CSS, pattern analysis, impact assessment

**Report Enhancements:**
- 🖥️ **Computed CSS Analysis** - Actual padding, colors, fonts from browser
- 🧩 **CSS Developer Insights** - Pattern compliance, standard usage locations
- ⚠️ **CSS-Analyzed Discrepancies** - Expected vs Actual with CSS rules and classes
- 🎯 **CSS Developer Approved Fixes** - Safe changes with impact assessment

#### Enhanced Designer-Codex Agent
- Now receives computed CSS properties for accurate validation
- Gets CSS Developer insights about patterns and impact
- Enables more precise Codex AI recommendations

### Benefits

- ✅ **No More Guessing** - "padding: 8px 16px (computed from px-4 py-2)" vs "the button looks wrong"
- ✅ **Understand WHY** - See which classes/rules cause the visual differences
- ✅ **Safe Fixes** - Know if changing affects 1 component or 26 components
- ✅ **Pattern Awareness** - Align with existing patterns (26 files use bg-blue-600)
- ✅ **Prevent Breaking Changes** - "LOCAL - Only affects this component ✅"

### Changed

- **Version Updates:**
  - Frontend Plugin: 2.5.0 → 2.6.0
  - Marketplace: 2.7.0 → 2.8.0

### Technical Improvements

- **DOM Inspection Integration** via Chrome DevTools MCP
- **CSS Developer Consultation Workflow** for pattern analysis
- **Impact Assessment System** (LOCAL vs GLOBAL changes)
- **Computed CSS Extraction** from actual browser rendering

---

## [2.5.0] - 2025-11-06

### Added

#### CSS Developer Agent (NEW - 879 lines)
- **CSS Architecture Knowledge Management**
  - Creates and maintains `.ai-docs/css-knowledge/` directory
  - 7 knowledge files: README, design-tokens, component-patterns, utility-patterns, element-rules, global-styles, change-log
  - Tracks what CSS patterns exist and where they're used
  - Documents design tokens (colors, spacing, typography)
  - Component pattern registry with usage locations
  - Prevents breaking changes via impact analysis

- **Modern CSS + Tailwind CSS 4 Best Practices (2025):**
  - CSS-first configuration with @theme
  - Container queries for component-responsive design
  - :has() pseudo-class for parent/sibling selection
  - CSS cascade layers for predictable specificity
  - Performance: 5x faster full builds, 100x faster incremental
  - Strategic @apply usage (only for true component abstraction)
  - Mobile-first responsive design
  - WCAG 2.1 AA accessibility compliance

- **Change Impact Assessment:**
  - HIGH/MEDIUM/LOW risk levels
  - Analyzes how many files affected by CSS changes
  - Migration plans for global CSS modifications
  - Safe vs unsafe change guidelines

- **UI Developer Integration:**
  - MANDATORY consultation before CSS changes
  - Step-by-step consultation process
  - Examples of safe vs unsafe changes
  - Explicit approval required for global changes

#### Task Decomposition in /implement-ui (446 lines added)

**New PHASE 1.5: Task Analysis & Decomposition**
- Architect agent analyzes design and splits into independent tasks
- Each task = one component/screen with specific files
- Identifies dependencies between tasks
- Creates parallel execution strategy
- User approval before proceeding

**Task Structure:**
- Task ID, Name, Description
- Files (specific files this task creates/modifies)
- Dependencies (which tasks must complete first)
- Priority (1-5, determines execution order)
- Design Section (specific part of design)
- Complexity (low/medium/high)

**Parallel Execution Strategy:**
- Tasks with no dependencies run in PARALLEL (Round 1)
- Tasks with dependencies wait for prerequisites (Round 2+)
- Each task modifies DIFFERENT files (no overlap)
- Changes to Task A can't break Task B (isolation)

**Per-Task Validation Loops:**
- Each task gets focused validation loop (max 5 iterations)
- Validates ONLY that task's component/screen
- Designer agents focus on specific design section and files
- Prevents "fix Component A, break Component B" problem

### Changed

- **UI Developer Agent** - Added CSS Developer consultation workflow (136+ lines)
  - When to consult CSS Developer
  - How to request CSS architecture analysis
  - Examples of consultation scenarios

- **Version Updates:**
  - Frontend Plugin: 2.4.1 → 2.5.0
  - Marketplace: 2.6.1 → 2.7.0
  - Agent Count: 12 → 13 agents

### Benefits

- ✅ Prevents breaking existing styles when making changes
- ✅ Maintains CSS architecture knowledge automatically
- ✅ Small, focused iterations per component
- ✅ No breaking changes between isolated tasks
- ✅ Parallel execution for independent tasks
- ✅ Clear progress tracking
- ✅ Enforces modern CSS patterns consistently

### Technical Improvements

- **CSS Knowledge Management System** with 7 documentation files
- **Task Decomposition Algorithm** for parallel execution
- **Per-Task Validation** for isolated changes
- **Tailwind CSS 4 Integration** with latest 2025 features

---

## [2.4.1] - 2025-11-06

### Changed

#### MCP Error Handling Improvements
- Enhanced error handling for claude-context MCP server
- Added error-triggered indexing pattern (index only when needed)
- Improved error messages and troubleshooting guidance
- Better handling of "not indexed" errors

### Technical Improvements

- **Smart Indexing Strategy**: Only index when search returns "not indexed" error
- **Error Pattern Recognition**: Distinguishes between different MCP error types
- **Documentation**: Added comprehensive MCP error handling guide to CLAUDE.md

---

## [2.4.0] - 2025-11-06

### Added

#### Parallel Design Validation
- **Designer + Designer-Codex** dual validation approach
- **Flexible validation modes:**
  - Manual only (Designer agent)
  - Automated only (Designer-Codex proxy to Codex AI)
  - Both in parallel for comprehensive validation
- **Independent expert analysis** via external Codex AI
- **Validation comparison** between human-guided and AI-guided approaches

#### Mandatory User Validation Gates
- Added explicit user approval checkpoints in all UI workflows
- Prevents automated changes without user review
- Clear validation prompts in /implement, /implement-ui, /validate-ui

### Changed

- **Version Updates:**
  - Frontend Plugin: 2.3.0 → 2.4.0
  - Marketplace: 2.6.0 → 2.6.1

### Benefits

- ✅ Dual validation catches more design discrepancies
- ✅ User control over automated changes
- ✅ External expert validation option
- ✅ Flexible validation approach based on project needs

---

## [2.3.0] - 2025-01-05

### Added

#### New Agents (3)
- **Designer Agent** - Senior UX/UI design review specialist with comprehensive design fidelity validation
  - Reviews implementation vs design reference (Figma, screenshots, mockups)
  - Calculates design fidelity scores (X/60)
  - Categorizes issues by severity (CRITICAL/MEDIUM/LOW)
  - Provides actionable fixes with code snippets
  - Does NOT write code - only reviews

- **UI Developer Agent** - Senior UI/UX developer specializing in pixel-perfect implementation
  - React 19+ with TypeScript (latest 2025 patterns)
  - Tailwind CSS 4 best practices (utility-first, static classes, no @apply)
  - Mobile-first responsive design with all breakpoints
  - Accessibility compliance (WCAG 2.1 AA, ARIA attributes)
  - Design system integration (atomic components, design tokens)

- **UI Developer Codex Agent** - Expert review proxy via external Codex AI
  - Forwards requests to Codex AI for independent validation
  - Provides third-party expert analysis
  - Pure proxy pattern - no preparation work

#### New Commands (1)
- **/implement-ui** - Implement UI components from scratch with intelligent agent switching
  - Accepts design references (Figma URLs, screenshots, mockups)
  - Initial implementation by UI Developer
  - Iterative validation by Designer agent
  - Smart agent switching based on performance:
    - Switches to Codex after 2 UI Developer consecutive failures
    - Switches back to UI Developer after 2 Codex consecutive failures
  - Maximum 10 iterations with user escalation
  - Comprehensive metrics tracking and design fidelity scoring

#### New Skills (1)
- **ui-implementer** - Proactive UI implementation skill
  - Automatically triggers when user shares Figma links or design references
  - Wraps the /implement-ui workflow for natural conversation
  - Enables: "Here's a Figma design, implement this component"

#### Enhanced Features
- **PHASE 2.5** added to `/implement` command - **Design Fidelity Validation**
  - Automatically detects Figma URLs in feature requests
  - Runs pixel-perfect validation before code review (seamless, conditional)
  - Optional Codex expert review preference
  - Iterative validation (max 3 iterations per component)
  - Quality gate ensuring all UI components match design specifications
  - Comprehensive metrics in final summary

### Changed

#### Updated Commands
- **/implement** - Enhanced with PHASE 2.5 (Design Fidelity Validation)
  - Now 8 phases instead of 7 (added conditional PHASE 2.5)
  - Automatically validates UI against Figma designs when links present
  - Skips PHASE 2.5 if no design references found (no performance impact)
  - Updated final summary with design fidelity metrics

- **/validate-ui** - Complete rewrite with new agent architecture
  - Uses Designer agent for design review (replaced ui-validator)
  - Uses UI Developer agent for fixes
  - Optional UI Developer Codex for expert validation
  - Updated workflow documentation
  - Improved iteration tracking and reporting

#### Updated Documentation
- **CLAUDE.md** - Updated to reflect v2.3.0 features
  - Agent count: 9 → 11
  - Command count: 5 → 6
  - Skill count: 2 → 3
  - Added Designer + UI Developer ecosystem documentation
  - Added smart agent switching description

- **plugin.json** - Updated to v2.3.0
  - New description highlighting pixel-perfect UI capabilities
  - Added 3 new agents
  - Added 1 new command
  - Added 1 new skill

### Removed
- **ui-validator.md** agent - Replaced by the more comprehensive Designer agent

### Technical Improvements

#### Modern UI Development Best Practices (2025)
Based on extensive research, the UI Developer agent includes:
- **Tailwind CSS 4**: Utility-first, static classes only, ARIA variants, design tokens
- **React 19 Patterns**: Functional components, modern hooks, Server Components
- **Accessibility**: WCAG 2.1 AA compliance, color contrast requirements, keyboard navigation
- **Responsive Design**: Mobile-first approach, Container Queries (2025), all breakpoints
- **Performance**: Code splitting, lazy loading, memoization, bundle optimization

#### Smart Agent Switching Algorithm
- Tracks consecutive failures independently for each agent
- Automatically switches agents after 2 consecutive failures
- Resets counters when progress is made
- Balances speed (UI Developer) with expertise (Codex)
- Maximizes success rate through adaptive approach

#### Quality Gates
- Design fidelity score >= 54/60 for PASS
- All CRITICAL issues must be resolved
- Accessibility compliance required (WCAG 2.1 AA)
- Responsive design tested across all breakpoints

### Metrics

- **Total Agents**: 11 (was 9, +2 net after removal)
- **Total Commands**: 6 (was 5, +1)
- **Total Skills**: 3 (was 2, +1)
- **Documentation**: 17,000+ lines total (was 13,000+, +4,000)
- **New Files Created**: 5 agents/commands/skills
- **Files Updated**: 4 existing files
- **Files Deleted**: 1 obsolete agent

### Developer Experience

- Proactive skill triggers automatically on design references
- Seamless integration - PHASE 2.5 only runs when needed
- Comprehensive reporting with design fidelity scores
- Intelligent agent switching for optimal results
- Natural conversation support for UI implementation

### Production Ready

All features tested and production-ready:
- ✅ 11 specialized agents
- ✅ 6 slash commands
- ✅ 3 workflow skills
- ✅ Pixel-perfect design validation
- ✅ Intelligent agent switching
- ✅ Modern 2025 best practices
- ✅ Team-ready configuration
- ✅ Security best practices

---

## [2.2.0] - 2024-11-05

### Added
- UI validation workflow with multi-agent orchestration
- Manual testing instruction generation
- Triple review loop (Code + Codex + UI Testing)

---

## [2.1.0] - 2024-11-04

### Added
- Auto-loading MCP servers with simplified configuration
- Dynamic MCP configuration system

---

## [2.0.1] - 2024-11-03

### Fixed
- enabledPlugins format correction
- Added Claude Code requirements documentation

---

## [2.0.0] - 2024-11-02

### Changed
- Rebrand plugin with shorter, role-based naming
- Complete plugin architecture redesign

---

**Maintained by:** Jack Rudenko @ MadAppGang
**License:** MIT
