---
name: setup
description: "Initializes Conductor by creating product.md, tech-stack.md, and workflow.md through interactive Q&A. Detects greenfield vs brownfield projects and supports resume from interruption. Use when starting a new project or onboarding an existing codebase to Conductor."
---

# Conductor Setup

Guides users through structured project initialization, creating context artifacts that serve as the foundation for all future development work.

## Workflow

1. **Validate existing state**
   - Check if `conductor/` directory exists
   - If `conductor/setup_state.json` exists with `status != "complete"`, load saved answers and resume from last incomplete section
   - If complete setup exists, ask user: "Re-initialize or abort?"

2. **Detect project type**
   - Scan for existing code files (`src/`, `package.json`, `requirements.txt`)
   - Ask user: Greenfield (new) or Brownfield (existing)?
   - For Brownfield: scan existing code to infer context

3. **Gather product context** (one question at a time, max 5 per section)
   - What is this project about? (1-2 sentences)
   - Who is the target audience?
   - What are the 3 main goals?
   - Any constraints or requirements?
   - Generate `conductor/product.md` from answers

4. **Gather technical context**
   - Primary programming language(s)?
   - Key frameworks/libraries?
   - Database/storage preferences?
   - Deployment target?
   - Generate `conductor/tech-stack.md` from answers

5. **Generate guidelines**
   - Ask about coding conventions and testing requirements
   - Generate `conductor/product-guidelines.md`
   - Generate `conductor/code_styleguides/general.md`
   - Generate language-specific styleguides (TypeScript, Python, Go, etc.)

6. **Finalize setup**
   - Copy `workflow.md` template
   - Create empty `tracks.md`
   - Mark `setup_state.json` as complete
   - Present summary to user

## Constraints

- Ask questions SEQUENTIALLY (one at a time, never multiple)
- Save state to `setup_state.json` after EACH answer for resume capability
- Always include "Type your own answer" option in question prompts
- Respect `.gitignore` patterns when creating files

## State File Schema

```json
{
  "status": "in_progress",
  "startedAt": "ISO-8601",
  "lastUpdated": "ISO-8601",
  "projectType": "greenfield",
  "currentSection": "product",
  "answers": {
    "product": { "description": "...", "audience": "...", "goals": ["..."] },
    "tech": { "languages": ["TypeScript"], "frameworks": ["React"] }
  }
}
```

## Examples

### New project setup
```
User: I want to set up Conductor for my new project

Agent:
1. Checks for existing conductor/ → not found
2. Asks: "Is this a new project or existing codebase?"
3. User: "New project"
4. Begins product context questions (one at a time)
5. Saves each answer to setup_state.json
6. Generates all artifacts
7. Presents summary with next steps
```

### Resume interrupted setup
```
User: Continue setting up Conductor

Agent:
1. Finds conductor/setup_state.json with status: "in_progress"
2. Loads previous answers
3. Shows: "Resuming setup. You've completed: Product Context"
4. Continues from Technical Context section
```

## Verification

After setup completes, confirm these files exist:
- `conductor/product.md`
- `conductor/product-guidelines.md`
- `conductor/tech-stack.md`
- `conductor/workflow.md`
- `conductor/tracks.md`
- `conductor/code_styleguides/general.md`
