---
description: |
  Edit existing images with natural language.
  Usage: /nb-edit <image> "instruction" [--ref image]
  Examples:
    /nb-edit photo.jpg "Make the sky more dramatic"
    /nb-edit logo.png "Change colors to blue and gold"
    /nb-edit scene.jpg "Add a rainbow" --ref rainbow_style.png
  Workflow: VALIDATE -> SANITIZE -> EDIT -> PRESENT
allowed-tools: Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep
skills: nanobanana:gemini-api
---

<role>
  <identity>Image Editing Command</identity>
  <mission>
    Parse edit arguments, validate inputs, and delegate to
    image-generator agent with --edit flag.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<orchestration>
  <allowed_tools>Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep</allowed_tools>
  <forbidden_tools>Write, Edit</forbidden_tools>

  <delegation_rules>
    <rule scope="editing">ALL image editing -> image-generator agent</rule>
    <rule scope="validation">Path validation -> local checks</rule>
  </delegation_rules>

  <phases>
    <phase number="1" name="Input Validation">
      <objective>Validate and sanitize edit request</objective>
      <steps>
        <step>Extract source image path</step>
        <step>Extract edit instruction (quoted text)</step>
        <step>Validate instruction is non-empty</step>
        <step>Escape special characters in instruction</step>
        <step>Parse --ref flag if present</step>
        <step>Generate output path: {source}_edited.png</step>
      </steps>
      <quality_gate>
        Source path extracted.
        Instruction is valid and sanitized.
        Output path determined.
      </quality_gate>
    </phase>

    <phase number="2" name="Pre-Flight Validation">
      <objective>Verify files and environment</objective>
      <steps>
        <step>Check source image exists</step>
        <step>Check GEMINI_API_KEY is set</step>
        <step>If --ref, verify reference exists</step>
      </steps>
      <quality_gate>
        All required files exist.
        API key present.
      </quality_gate>
    </phase>

    <phase number="3" name="Edit">
      <objective>Execute image edit</objective>
      <steps>
        <step>Task image-generator with edit command:
          uv run python main.py output.png "instruction" --edit source.jpg
        </step>
      </steps>
      <quality_gate>
        Edit operation completes.
      </quality_gate>
    </phase>

    <phase number="4" name="Present Results">
      <objective>Report edit outcome</objective>
      <steps>
        <step>Show before/after paths</step>
        <step>Report any errors</step>
        <step>Suggest further edits</step>
      </steps>
      <quality_gate>
        User sees clear outcome.
      </quality_gate>
    </phase>
  </phases>

  <error_recovery>
    <strategy name="source_not_found">
      Report: "Source image not found: {path}"
      Suggest: Check path, list available images
    </strategy>
    <strategy name="content_policy">
      Report: "Edit blocked by content policy"
      Suggest: Rephrase instruction
    </strategy>
  </error_recovery>
</orchestration>

<examples>
  <example name="Simple Edit">
    <input>/nb-edit photo.jpg "Add sunset colors to the sky"</input>
    <flow>
      1. Parse: source=photo.jpg, instruction="Add sunset colors to the sky"
      2. Validate: instruction non-empty, sanitize
      3. Verify photo.jpg exists
      4. Output: photo_edited.png
      5. Command: main.py photo_edited.png "Add sunset..." --edit photo.jpg
    </flow>
  </example>

  <example name="With Reference">
    <input>/nb-edit logo.png "Make it look like this style" --ref style.png</input>
    <flow>
      1. Parse: source=logo.png, instruction, ref=style.png
      2. Verify both files exist
      3. Command: main.py logo_edited.png "..." --edit logo.png --ref style.png
    </flow>
  </example>
</examples>
