---
name: generate
description: Generate images from text prompts with optional styles and aspect ratios
allowed-tools: Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep
skills: nanobanana:gemini-api
---

<role>
  <identity>Image Generation Command</identity>
  <mission>
    Parse user arguments, validate and sanitize inputs,
    and delegate to image-generator agent.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<orchestration>
  <allowed_tools>Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep</allowed_tools>
  <forbidden_tools>Write, Edit</forbidden_tools>

  <delegation_rules>
    <rule scope="generation">ALL image generation -> image-generator agent</rule>
    <rule scope="style_lookup">Style path resolution -> local validation</rule>
    <rule scope="error_display">Error presentation -> direct output</rule>
  </delegation_rules>

  <phases>
    <phase number="1" name="Input Validation">
      <objective>Validate and sanitize all user inputs</objective>
      <steps>
        <step>Extract quoted prompts from $ARGUMENTS</step>
        <step>Validate each prompt is non-empty</step>
        <step>Escape special characters in prompts</step>
        <step>Parse --style flag (resolve to styles/{name}.md)</step>
        <step>Parse --aspect flag, validate against allowed list</step>
        <step>Determine output path (default: generated/{slug}.png)</step>
      </steps>
      <quality_gate>
        All prompts are valid and properly escaped.
        Style path exists (if specified).
        Aspect ratio is valid.
      </quality_gate>
    </phase>

    <phase number="2" name="Pre-Flight Validation">
      <objective>Verify environment is ready</objective>
      <steps>
        <step>Check GEMINI_API_KEY is set</step>
        <step>If --style, verify styles/{name}.md exists</step>
        <step>Validate style content for injection patterns</step>
      </steps>
      <quality_gate>
        API key present.
        All referenced files exist.
        No security warnings.
      </quality_gate>
    </phase>

    <phase number="3" name="Generate">
      <objective>Execute image generation</objective>
      <steps>
        <step>Task image-generator with sanitized arguments</step>
        <step>Wait for completion</step>
        <step>Capture results</step>
      </steps>
      <quality_gate>
        Generation task completes (success or failure).
      </quality_gate>
    </phase>

    <phase number="4" name="Present Results">
      <objective>Report outcome to user</objective>
      <steps>
        <step>Show generated file path(s)</step>
        <step>Report any errors with explanations</step>
        <step>Suggest follow-up actions</step>
      </steps>
      <quality_gate>
        User receives clear outcome report.
      </quality_gate>
    </phase>
  </phases>

  <error_recovery>
    <strategy name="missing_api_key">
      Show setup instructions for GEMINI_API_KEY.
      Link to Google AI Studio.
    </strategy>
    <strategy name="style_not_found">
      List available styles.
      Suggest creating new style with /nanobanana:style create.
    </strategy>
    <strategy name="invalid_prompt">
      Report specific validation error.
      Suggest corrected prompt format.
    </strategy>
    <strategy name="partial_failure">
      Report which images succeeded.
      Offer to retry failed items.
    </strategy>
  </error_recovery>
</orchestration>

<argument_parsing>
  **Prompt Extraction:**
  - Single: "A mountain lake" -> ["A mountain lake"]
  - Multiple: "cube" "sphere" -> ["cube", "sphere"]
  - Escape special chars: "Hello & world" -> 'Hello & world'

  **Style Resolution:**
  - --style glass -> styles/glass.md
  - --style styles/glass.md -> styles/glass.md (pass through)

  **Output Path:**
  - If not specified, generate from first prompt slug
  - Batch adds _001, _002 suffixes
</argument_parsing>

<examples>
  <example name="Simple">
    <input>/nanobanana:generate "A serene mountain lake at sunset"</input>
    <flow>
      1. Parse: prompts=["A serene mountain lake at sunset"]
      2. Validate: prompt non-empty, no special chars
      3. Output: generated/a_serene_mountain.png
      4. Task image-generator: run main.py
    </flow>
  </example>

  <example name="With Style">
    <input>/nanobanana:generate "gear icon" --style glass</input>
    <flow>
      1. Parse: prompts=["gear icon"], style="glass"
      2. Resolve: styles/glass.md
      3. Validate: file exists, content is safe
      4. Task image-generator: run main.py --style styles/glass.md
    </flow>
  </example>

  <example name="Batch">
    <input>/nanobanana:generate "cube" "sphere" "pyramid" --style glass --aspect 1:1</input>
    <flow>
      1. Parse: prompts=["cube", "sphere", "pyramid"]
      2. Validate: all prompts valid, style exists
      3. Output: generated/cube_001.png, etc.
      4. Task image-generator: batch generation
    </flow>
  </example>
</examples>
