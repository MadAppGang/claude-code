---
name: cleanup-artifacts
description: Intelligently clean up temporary artifacts and development files from the project
allowed-tools: Task, AskUserQuestion, Bash, Read, Glob, Grep
---

## Mission

Analyze the current project state, identify temporary artifacts and development files, then run the cleaner agent to clean them up safely while preserving important implementation code and documentation.

## Workflow

### STEP 1: Analyze Current Project State

1. **Gather Project Context**:
   - Run `git status` to see current state
   - Run `git diff --stat` to see what's been modified
   - Use Glob to find common artifact patterns:
     * Test files: `**/*.test.{ts,tsx,js,jsx}`
     * Spec files: `**/*.spec.{ts,tsx,js,jsx}`
     * Temporary documentation: `AI-DOCS/**/*-TEMP.md`, `AI-DOCS/**/*-WIP.md`
     * Development scripts: `scripts/dev-*.{ts,js}`, `scripts/temp-*.{ts,js}`
     * Build artifacts: `dist/**/*`, `build/**/*`, `.cache/**/*`
     * Coverage reports: `coverage/**/*`
     * Log files: `**/*.log`, `**/*.log.*`
     * Editor files: `**/.DS_Store`, `**/*.swp`, `**/*.swo`

2. **Identify Current Task**:
   - Check for AI-DOCS/ folder to understand recent work
   - Look for recent commits to understand context
   - Analyze modified files to determine what's being worked on

3. **Categorize Files**:
   - **Artifacts to Clean**: Temporary files that can be safely removed
   - **Files to Preserve**: Implementation code, final tests, user-facing docs, configs
   - **Uncertain Files**: Files that might need user input

### STEP 2: Present Findings to User

Present a clear summary:

```
# Cleanup Analysis

## Current Project State
- Git Status: [clean/modified/staged]
- Recent Work: [description based on git log and AI-DOCS]
- Modified Files: [count and summary]

## Artifacts Found

### Will Clean (if approved):
- Temporary test files: [count] files
- Development artifacts: [count] files
- Intermediate documentation: [count] files
- Build artifacts: [count] files
- [Other categories found]

### Will Preserve:
- Implementation code: [list key files]
- Final tests: [list]
- User-facing documentation: [list]
- Configuration files: [list]

### Uncertain (need your input):
- [List any files where classification is unclear]
```

### STEP 3: User Approval Gate

Use AskUserQuestion to ask:

**Question**: "Ready to clean up these artifacts? All important implementation code and docs will be preserved."

**Options**:
- "Yes, clean up all artifacts" - Proceed with full cleanup
- "Yes, but let me review uncertain files first" - Show uncertain files and get specific approval
- "No, skip cleanup for now" - Cancel the operation

### STEP 4: Launch Project Cleaner

If user approves:

1. **Prepare Context for Agent**:
   - Document current project state
   - List files categorized for cleanup
   - Specify files to preserve
   - Include any user-specific instructions for uncertain files

2. **Launch cleaner Agent**:
   - Use Task tool with `subagent_type: frontend:cleaner`
   - Provide comprehensive context:
     ```
     You are cleaning up artifacts from: [task description]

     Current project state:
     - [Summary of git status and recent work]

     Please remove the following categories of temporary artifacts:
     - [List categories from Step 1]

     IMPORTANT - Preserve these files/categories:
     - [List files to preserve]

     User preferences for uncertain files:
     - [Any specific guidance from user]

     Provide a detailed summary of:
     1. Files removed (by category)
     2. Space saved
     3. Files preserved
     4. Any files skipped with reasons
     ```

3. **Monitor Cleanup**:
   - Agent performs cleanup following the plan
   - Agent provides detailed report

### STEP 5: Present Cleanup Results

After cleanup completes, present results:

```
# Cleanup Complete ✅

## Summary
- Total files removed: [count]
- Total space saved: [size]
- Files preserved: [count]
- Duration: [time]

## Details by Category
- Temporary test files: [count] removed
- Development artifacts: [count] removed
- Intermediate documentation: [count] removed
- Build artifacts: [count] removed
- [Other categories]

## Preserved
- Implementation code: [count] files
- Final tests: [count] files
- Documentation: [count] files

## Recommendations
- [Any suggestions for further cleanup]
- [Any patterns noticed that could be gitignored]
```

## Safety Rules

### Files That Should NEVER Be Cleaned:
- Source code files: `src/**/*.{ts,tsx,js,jsx,css,html}`
- Package files: `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- Configuration files: `tsconfig.json`, `vite.config.ts`, `.env`, etc.
- Git files: `.git/**/*`, `.gitignore`, `.gitattributes`
- Final tests: Tests explicitly marked as final or in standard test directories
- User documentation: `README.md`, `CHANGELOG.md`, final docs in `docs/`
- CI/CD: `.github/**/*`, `.gitlab-ci.yml`, etc.

### Confirmation Required For:
- Files larger than 1MB (unless clearly artifacts like logs)
- Files in root directory (unless clearly temporary)
- Any files with "KEEP", "FINAL", "PROD" in the name
- Files modified in the last hour (unless user specifically requested cleanup)

### Default Cleanup Targets:
- Files with "temp", "tmp", "test", "wip", "draft" in the name
- Build directories: `dist/`, `build/`, `.cache/`
- Test coverage: `coverage/`
- Log files: `*.log`
- OS artifacts: `.DS_Store`, `Thumbs.db`
- Editor artifacts: `*.swp`, `*.swo`, `.vscode/` (unless committed)
- Node modules cache: `.npm/`, `.yarn/cache/` (not node_modules itself)

## Error Handling

- If cleaner encounters any errors, pause and report to user
- If uncertain about any file, err on the side of caution (don't delete)
- Provide option to undo cleanup if files were accidentally removed (via git if tracked)

## Usage Examples

### Example 1: After Feature Completion
```
User just finished implementing a feature with tests and reviews.
Command analyzes:
- Finds temporary test files from dev iterations
- Finds WIP documentation from planning phase
- Finds build artifacts from testing
User approves → Cleanup removes ~50 temporary files
```

### Example 2: General Project Maintenance
```
User runs cleanup to tidy up project.
Command analyzes:
- Finds old log files
- Finds test coverage reports from last week
- Finds .DS_Store files throughout project
User approves → Cleanup removes minor artifacts
```

### Example 3: Post-Implementation
```
User completed /implement command and is happy with results.
Command analyzes:
- Finds AI-DOCS/implementation-plan-DRAFT.md
- Finds temporary test files
- Finds development scripts used during implementation
User approves → Comprehensive cleanup of all dev artifacts
```

## Notes

- This command can be run at any time, not just after /implement
- It's safe to run frequently - nothing important will be removed without confirmation
- The cleaner agent is conservative and will ask before removing uncertain files
- All git-tracked files that are removed can be restored via git
- For maximum safety, ensure important work is committed before running cleanup
- The command learns from project patterns - if you frequently keep certain file types, it will remember
