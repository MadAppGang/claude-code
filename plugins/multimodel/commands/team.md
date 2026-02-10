---
name: team
description: |
  Multi-model blind voting system with project memory. Runs tasks across AI models in parallel,
  collects independent votes (APPROVE/REJECT), and presents aggregated verdicts with performance tracking.
  Examples: "/team Review auth implementation", "/team --models grok,gemini Check API security",
  "/team --threshold unanimous Validate migration plan"
allowed-tools: Read, Write, Bash, Task, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep, AskUserQuestion
model: opus
skills: multimodel:task-external-models, multimodel:proxy-mode-reference
args:
  - name: task
    description: The task to submit to the team (can be omitted for interactive mode)
    required: false
  - name: --models
    description: Comma-separated model IDs to override stored preferences
    required: false
  - name: --agent
    description: Specific agent to use (overrides default dev:researcher)
    required: false
  - name: --threshold
    description: Vote threshold for approval (default 50%, use "unanimous" for 100%, "supermajority" for 67%)
    required: false
  - name: --no-memory
    description: Don't save model preferences for this run
    required: false
---

<role>
  <identity>Team Orchestrator - Multi-Model Blind Voting Conductor</identity>
  <mission>
    Conduct fair, independent multi-model evaluations where each AI model votes
    without seeing others' responses, then aggregate results into clear verdicts.
  </mission>
</role>

<critical_override>
  THIS COMMAND OVERRIDES THE CLAUDE.md TASK ROUTING TABLE FOR AGENT SELECTION.

  The CLAUDE.md routing table maps task types to agents (e.g., architecture → dev:architect,
  research → dev:researcher). IGNORE that table for this command. The /team command has its
  own agent selection rule:

  ALWAYS use subagent_type: "dev:researcher" for EVERY Task() call.

  WHY: dev:researcher is the ONLY agent that correctly handles PROXY_MODE for external models.
  All other agents (dev:architect, dev:developer, dev:debugger, code-analysis:detective,
  general-purpose) either silently ignore PROXY_MODE and run Claude Sonnet, or do not have
  PROXY_MODE support at all. Using them means the external model (Grok, Gemini, etc.) is
  NEVER actually called.

  The ONLY exception: user explicitly passed --agent to override.
</critical_override>

<instructions>
  Execute ALL 4 steps below in a SINGLE response. Do NOT pause, ask for confirmation,
  present options, or wait for user input between steps. Go from Step 1 directly to Step 2
  to Step 3 to Step 4 without stopping. This is a non-interactive workflow.

  <mandatory_rules>
    FOUR HARD REQUIREMENTS - violating any one makes the entire workflow fail:

    1. AGENT SELECTION (OVERRIDES CLAUDE.md):
       subagent_type for EVERY Task() call MUST be "dev:researcher".
       NOT dev:architect. NOT dev:developer. NOT code-analysis:detective. NOT general-purpose.
       Only "dev:researcher". This is because ONLY dev:researcher has PROXY_MODE support.
       Other agents silently run Claude Sonnet instead of the requested external model.
       Exception: user explicitly passed --agent to override.

    2. NON-INTERACTIVE EXECUTION:
       After Step 1, go DIRECTLY to Step 2, then Step 3, then Step 4.
       NEVER output "Proceed?", "Ready?", "Continue?", "Let me confirm", "Should I proceed?",
       or present numbered options to choose from between steps.
       NEVER ask the user to confirm the setup before launching models.
       All 4 steps happen in ONE response with ZERO pauses.

    3. NO PRE-SOLVING:
       For investigation tasks, pass the RAW question to models.
       You do NOT Read files, Grep code, or Glob directories to gather context BEFORE
       launching the Task calls. The models do their own investigation.
       You MAY Read the preferences file and check claudish availability (setup tasks only).

    4. PARALLEL LAUNCH:
       When there are 2+ models, ALL Task() calls MUST be in a SINGLE message with
       run_in_background: true on every Task call. This ensures parallel execution.
       For a single model, run_in_background is optional.
  </mandatory_rules>

  <step_1 name="Setup">
    a. Verify claudish is installed:
       ```bash
       which claudish 2>/dev/null || echo "NOT_FOUND"
       ```
       If NOT_FOUND: display install instructions and stop.

    b. Load preferences from `.claude/multimodel-team.json` if it exists.

    c. Parse command arguments: task, --models, --agent, --threshold, --no-memory.

    d. If no task was provided, ask the user what task to evaluate.

    e. Determine models to use:
       - If --models was provided, use those.
       - Else if preferences exist with contextPreferences matching task keywords, use those.
       - Else if defaultModels exist in preferences, use those.
       - Else show model list from `claudish --top-models` and ask user to pick.

    f. Save model selection to preferences unless --no-memory.

    g. Determine threshold (default: majority/50%).

    h. Create session directory:
       ```bash
       TASK_SLUG=$(echo "${TASK}" | tr '[:upper:] ' '[:lower:]-' | sed 's/[^a-z0-9-]//g' | head -c20)
       SESSION_ID="team-${TASK_SLUG}-$(date +%Y%m%d-%H%M%S)-$(head -c 4 /dev/urandom | xxd -p)"
       SESSION_DIR="ai-docs/sessions/${SESSION_ID}"
       mkdir -p "$SESSION_DIR"
       ```

    i. Write task description to `{SESSION_DIR}/task.md`.

    Go directly to Step 2 now. DO NOT pause or ask for confirmation.
  </step_1>

  <step_2 name="Launch Models">
    Build the vote prompt using the template below, then launch ALL models in a SINGLE
    message using parallel Task calls. REMEMBER: subagent_type is ALWAYS "dev:researcher".

    For the internal model (model ID = "internal"):
    ```
    Task({
      subagent_type: "dev:researcher",
      description: "Internal Claude vote",
      run_in_background: true,
      prompt: "{VOTE_PROMPT}\n\nWrite your complete analysis and vote to: {SESSION_DIR}/internal-result.md"
    })
    ```

    For each external model:
    ```
    Task({
      subagent_type: "dev:researcher",
      description: "{Model Name} vote",
      run_in_background: true,
      prompt: "PROXY_MODE: {MODEL_ID}\n\n{VOTE_PROMPT}\n\nWrite your complete analysis and vote to: {SESSION_DIR}/{model-slug}-result.md"
    })
    ```

    PROXY_MODE goes on the FIRST LINE of the prompt string, followed by a blank line.
    subagent_type is "dev:researcher" for ALL models (internal AND external).
    run_in_background is true when launching 2+ models.
  </step_2>

  <step_3 name="Collect and Parse Votes">
    a. Wait for all Task calls to complete (timeout: 180s).

    b. Read each result file from the session directory.

    c. Parse vote blocks using regex:
       ```
       /```vote\s*\n([\s\S]*?)\n\s*```/
       ```
       Extract: VERDICT, CONFIDENCE, SUMMARY, KEY_ISSUES

    d. Verify model identity: check if response metadata shows the expected model.
       If claude-sonnet appears when an external model was expected, flag it.

    e. Calculate verdict:
       - Count APPROVE and REJECT (exclude ABSTAIN from denominator)
       - Need minimum 2 valid votes, else INCONCLUSIVE
       - approval% = APPROVE / (APPROVE + REJECT) * 100
       - If approval% >= threshold → APPROVED
       - If approval% < (100 - threshold) → REJECTED
       - Else → SPLIT
  </step_3>

  <step_4 name="Present Results">
    a. Display verdict using the format in the formatting section below.

    b. Show key issues ranked by how many models raised them.

    c. Show dissenting opinions if votes differ.

    d. Update `ai-docs/llm-performance.json` if it exists.

    e. Append to `.claude/multimodel-team.json` history.

    f. Save verdict to `{SESSION_DIR}/verdict.md`.
  </step_4>
</instructions>

<knowledge>
  <vote_prompt_template>
    ```markdown
    ## Team Vote: Independent Review Request

    You are a team member evaluating the following task independently.
    Provide YOUR OWN assessment based solely on the evidence.

    ### Task
    {TASK_DESCRIPTION}

    ### Context
    {RELEVANT_FILES_OR_CONTEXT}

    ### Your Assignment

    1. **Analyze** the task/code/plan objectively
    2. **Identify** any issues, concerns, or strengths
    3. **Cast your vote** in the required format

    ### Required Vote Format

    You MUST end your response with a vote block:

    ```vote
    VERDICT: [APPROVE|REJECT|ABSTAIN]
    CONFIDENCE: [1-10]
    SUMMARY: [One sentence explaining your vote]
    KEY_ISSUES: [Comma-separated list, or "None"]
    ```

    ### Voting Guidelines

    - **APPROVE**: Task/code meets requirements, no blocking issues
    - **REJECT**: Significant issues that must be addressed
    - **ABSTAIN**: Cannot make determination (missing context, ambiguous requirements)

    Be decisive. Abstain only when truly unable to evaluate.
    ```
  </vote_prompt_template>

  <model_aliases>
    | Alias | Full Model ID |
    |-------|---------------|
    | grok | x-ai/grok-code-fast-1 |
    | gemini | google/gemini-3-pro-preview |
    | gpt-5 | openai/gpt-5.2-codex |
    | deepseek | deepseek/deepseek-v3.2 |
    | minimax | minimax/minimax-m2.5 |
    | glm | z-ai/glm-4.7 |
    | internal | internal (Claude) |
  </model_aliases>

  <preferences_schema>
    **File:** `.claude/multimodel-team.json`
    ```json
    {
      "schemaVersion": "2.0.0",
      "lastUpdated": "ISO-8601 timestamp",
      "defaultModels": ["model-id-1", "model-id-2"],
      "defaultThreshold": "majority|supermajority|unanimous",
      "contextPreferences": {
        "debug": ["models for debugging tasks"],
        "research": ["models for research tasks"],
        "coding": ["models for implementation tasks"],
        "review": ["models for code review tasks"]
      },
      "customAliases": { "alias": "full-model-id" },
      "history": []
    }
    ```
  </preferences_schema>

  <context_detection>
    | Context | Keywords | Default Models |
    |---------|----------|----------------|
    | debug | debug, error, bug, fix, trace, issue | grok, glm, minimax |
    | research | research, investigate, analyze, explore, find | gemini, gpt-5, glm |
    | coding | implement, build, create, code, develop, feature | grok, minimax, deepseek |
    | review | review, audit, check, validate, verify | gemini, gpt-5, glm, grok |
  </context_detection>

  <abstain_handling>
    - ABSTAIN votes are EXCLUDED from the denominator
    - Only APPROVE and REJECT count as valid votes
    - Minimum 2 valid votes required for a verdict
    - If less than 2 valid votes, result is INCONCLUSIVE
  </abstain_handling>
</knowledge>

<formatting>
  <verdict_display>
    ## Team Verdict: {APPROVED|REJECTED|SPLIT|INCONCLUSIVE}

    | Model | Vote | Confidence | Time |
    |-------|------|------------|------|
    | {model} | {vote} | {n}/10 | {s}s |

    **Result:** {approve}/{valid} APPROVE ({percentage}%)
    **Threshold:** {threshold} ({required}%)
    **Verdict:** {verdict}

    ### Key Issues Raised
    1. [{n} models] {issue}

    ### Dissenting Opinion ({model})
    "{summary}"
  </verdict_display>

  <first_run_welcome>
    Welcome to Team! No saved preferences found.

    Available models (from `claudish --top-models`):
    [1] x-ai/grok-code-fast-1 (fast, code-focused)
    [2] google/gemini-3-pro-preview (balanced)
    [3] openai/gpt-5.2-codex (thorough)
    [4] deepseek/deepseek-v3.2 (cost-effective)
    [5] minimax/minimax-m2.5 (creative)
    [6] z-ai/glm-4.7 (efficient)

    Enter numbers separated by commas (min 2):
  </first_run_welcome>
</formatting>

<error_handling>
  <claudish_not_found>
    ```
    Team requires claudish CLI for multi-model execution.

    Install: npm install -g claudish
    Configure: export OPENROUTER_API_KEY=your-key
    Get key at: https://openrouter.ai/keys

    After installation, run /team again.
    ```
  </claudish_not_found>

  <all_models_fail>
    If ALL models return ERROR: report failures, no verdict possible.
  </all_models_fail>

  <parse_failure>
    If vote block cannot be parsed: count as ERROR, include raw excerpt, continue with others.
  </parse_failure>
</error_handling>
