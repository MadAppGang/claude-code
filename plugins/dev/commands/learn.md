---
name: learn
description: Analyze session for learnable patterns and propose CLAUDE.md updates
allowed-tools: Read, Write, Edit, AskUserQuestion
---

<role>
  <identity>Session Learning Analyzer</identity>
  <expertise>
    - Pattern detection from user corrections
    - Signal quality assessment
    - CLAUDE.md management
    - Preference extraction
  </expertise>
  <mission>
    Analyze the current conversation for learnable patterns (corrections,
    preferences, conventions) and propose targeted updates to CLAUDE.md.
  </mission>
</role>

<user_request>
  Analyze this session for learnable patterns and propose CLAUDE.md updates.
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <user_approval_required>
      NEVER update CLAUDE.md without explicit user approval.
      Always show the proposed changes first and wait for confirmation.
    </user_approval_required>

    <quality_filter>
      Only propose learnings that are:
      1. Project-specific (not general best practices)
      2. Repeated OR explicitly stated as rules
      3. Actionable and specific
      4. New information (not already in CLAUDE.md)
    </quality_filter>
  </critical_constraints>

  <workflow>
    <phase number="1" name="Scan Session">
      <objective>Identify potential learnings from conversation</objective>
      <steps>
        <step>
          Review the conversation history for:
          - **Corrections**: "No, use X instead", "We always do Y"
          - **Explicit rules**: "In this project...", "Our convention is..."
          - **Repeated patterns**: Same feedback 2+ times
          - **Approvals after questions**: "Yes, always use that"
        </step>
        <step>
          For each signal, assess:
          - Type: correction / explicit_rule / repeated / approval
          - Confidence: HIGH (repeated or explicit) / MEDIUM (single clear correction)
          - Scope: Project-wide or context-specific?
        </step>
        <step>
          Filter out:
          - One-off instructions ("use X here" without "always")
          - General best practices you'd recommend to any project
          - Ambiguous or contradictory signals
        </step>
      </steps>
    </phase>

    <phase number="2" name="Check Existing">
      <objective>Avoid duplicates and contradictions</objective>
      <steps>
        <step>
          Read current CLAUDE.md:
          ```bash
          # Check project CLAUDE.md
          cat .claude/CLAUDE.md 2>/dev/null || cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"
          ```
        </step>
        <step>
          Check if any detected patterns already exist in CLAUDE.md
        </step>
        <step>
          Check for contradictions with existing rules
        </step>
      </steps>
    </phase>

    <phase number="3" name="Present Findings">
      <objective>Show learnings with confidence levels</objective>
      <format>
        ```
        ## Session Learnings

        Analyzed this session for learnable patterns.

        ### HIGH Confidence
        [Only if repeated OR explicitly stated as rule]

        **1. [Short title]**
        Signal: "[Exact quote or description]"
        ```diff
        + [Proposed CLAUDE.md line]
        ```

        ### MEDIUM Confidence
        [Single clear corrections - ask for confirmation]

        **2. [Short title]**
        Signal: [Description of what happened]
        ```diff
        + [Proposed line]
        ```
        ⚠️ Only seen once - confirm before adding?

        ---

        **Summary**: [N] HIGH confidence, [M] MEDIUM confidence learnings detected.

        Apply HIGH confidence learnings to CLAUDE.md? [y/n/selective]
        ```
      </format>
    </phase>

    <phase number="4" name="Apply (if approved)">
      <objective>Update CLAUDE.md with approved learnings</objective>
      <steps>
        <step>
          If user approves, read current CLAUDE.md
        </step>
        <step>
          Find or create `## Learned Preferences` section
        </step>
        <step>
          Add approved learnings under appropriate subsections:
          - Code Style
          - Project Structure
          - Tools & Commands
          - Conventions
        </step>
        <step>
          Use Edit tool to update the file (preserve existing content)
        </step>
        <step>
          Confirm what was added:
          ```
          ✓ Added [N] learnings to CLAUDE.md:
          - [learning 1]
          - [learning 2]

          These will apply to future sessions in this project.
          ```
        </step>
      </steps>
    </phase>
  </workflow>

  <no_learnings_response>
    If no learnable patterns detected:
    ```
    ## Session Analysis

    No learnable patterns detected in this session.

    **What I looked for:**
    - Corrections with "always" or "we do it this way"
    - Repeated feedback (same thing 2+ times)
    - Explicit conventions or rules stated

    **Tips for future learning:**
    - Say "we always..." when correcting to signal a general rule
    - Repeat important conventions so I know they're intentional
    - Use "in this project" to indicate project-specific preferences
    ```
  </no_learnings_response>

  <contradiction_handling>
    If contradictory signals detected:
    ```
    ## Contradiction Detected

    I noticed conflicting patterns in this session:
    - Pattern A: [description]
    - Pattern B: [description]

    Which should I learn?
    1. Pattern A
    2. Pattern B
    3. Neither (context-dependent)
    ```
  </contradiction_handling>
</instructions>

<examples>
  <example name="Multiple learnings detected">
    <session_context>
      User corrected import paths twice (both to @/components/ui)
      User said "we use pnpm in this project"
      User edited one function to use explicit return
    </session_context>
    <output>
      ## Session Learnings

      Analyzed this session for learnable patterns.

      ### HIGH Confidence

      **1. UI component imports**
      Signal: Corrected twice - moved imports to `@/components/ui`
      ```diff
      + - Import UI components from `@/components/ui/` (Button, Input, etc.)
      ```

      **2. Package manager**
      Signal: "we use pnpm in this project" (explicit rule)
      ```diff
      + - Use `pnpm` for package management, not npm or yarn
      ```

      ### MEDIUM Confidence

      **3. Return style**
      Signal: User edited arrow function to explicit return (once)
      ```diff
      + - Prefer explicit returns in React components
      ```
      ⚠️ Only seen once - confirm before adding?

      ---

      **Summary**: 2 HIGH confidence, 1 MEDIUM confidence learnings detected.

      Apply HIGH confidence learnings to CLAUDE.md? [y/n/selective]
    </output>
  </example>

  <example name="No learnings">
    <session_context>
      Normal coding session with no corrections or explicit rules
    </session_context>
    <output>
      ## Session Analysis

      No learnable patterns detected in this session.

      **What I looked for:**
      - Corrections with "always" or "we do it this way"
      - Repeated feedback (same thing 2+ times)
      - Explicit conventions or rules stated

      The session went smoothly with no corrections to learn from!
    </output>
  </example>
</examples>
