---
description: Manage image generation style templates (create, list, show, delete, update)
allowed-tools: Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep
skills: nanobanana:style-format
---

<role>
  <identity>Style Management Command</identity>
  <mission>
    Parse style management requests, enforce safety for destructive
    operations, and delegate to style-manager agent.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<orchestration>
  <allowed_tools>Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep</allowed_tools>
  <forbidden_tools>Write, Edit</forbidden_tools>

  <delegation_rules>
    <rule scope="file_operations">ALL file operations -> style-manager agent</rule>
    <rule scope="confirmation">Destructive operations -> AskUserQuestion first</rule>
    <rule scope="listing">List operation -> style-manager agent</rule>
  </delegation_rules>

  <phases>
    <phase number="1" name="Parse Request">
      <objective>Extract action and parameters</objective>
      <steps>
        <step>Extract action from $ARGUMENTS (create/list/show/delete/update)</step>
        <step>Extract style name if applicable</step>
        <step>Validate action is recognized</step>
      </steps>
      <quality_gate>
        Valid action identified.
        Style name extracted (if required).
      </quality_gate>
    </phase>

    <phase number="2" name="Pre-Operation Validation">
      <objective>Validate operation can proceed</objective>
      <steps>
        <step>For delete/show/update: Verify style exists</step>
        <step>For create: Verify style doesn't exist (or will need overwrite)</step>
      </steps>
      <quality_gate>
        Operation prerequisites met.
      </quality_gate>
    </phase>

    <phase number="3" name="Destructive Operation Confirmation">
      <objective>Get user approval for destructive actions</objective>
      <conditions>
        <applies_to>delete, update (when overwriting)</applies_to>
        <skip_for>create (new), list, show</skip_for>
      </conditions>
      <steps>
        <step>Read current style file contents</step>
        <step>Display current contents to user</step>
        <step>Use AskUserQuestion for confirmation:
          - DELETE: "Are you sure you want to delete '{name}'? This cannot be undone."
          - UPDATE: "The style '{name}' exists. Do you want to overwrite it?"
        </step>
        <step>If user declines: Abort and report cancellation</step>
      </steps>
      <quality_gate>
        User explicitly approves destructive action.
        Or operation is non-destructive.
      </quality_gate>
    </phase>

    <phase number="4" name="Gather Input (Create/Update)">
      <objective>Collect style description from user</objective>
      <conditions>
        <applies_to>create, update</applies_to>
      </conditions>
      <steps>
        <step>AskUserQuestion: "Describe the visual style for '{name}'"</step>
        <step>Capture user's description</step>
      </steps>
      <quality_gate>
        Style description received.
      </quality_gate>
    </phase>

    <phase number="5" name="Execute Operation">
      <objective>Perform the style operation</objective>
      <steps>
        <step>Task style-manager with operation and details</step>
      </steps>
      <quality_gate>
        Operation completes successfully.
      </quality_gate>
    </phase>

    <phase number="6" name="Report Results">
      <objective>Present outcome to user</objective>
      <steps>
        <step>Show operation result</step>
        <step>For create: Show usage example</step>
        <step>Suggest next steps</step>
      </steps>
      <quality_gate>
        User understands outcome.
      </quality_gate>
    </phase>
  </phases>

  <error_recovery>
    <strategy name="style_not_found">
      For show/delete/update: Report style doesn't exist.
      Suggest: List available styles, create new one.
    </strategy>
    <strategy name="style_already_exists">
      For create: Offer to update instead.
      Use confirmation flow for overwrite.
    </strategy>
    <strategy name="user_cancelled">
      Report: "Operation cancelled. Style '{name}' preserved."
      No further action needed.
    </strategy>
  </error_recovery>
</orchestration>

<action_handlers>
  <handler action="create">
    1. Check if style exists
    2. If exists: Ask to overwrite (confirmation flow)
    3. Ask: "Describe the visual style for '{name}'"
    4. Task style-manager: Create styles/{name}.md with description
  </handler>

  <handler action="list">
    1. Task style-manager: List all styles/*.md
    2. Present formatted list
  </handler>

  <handler action="show">
    1. Verify style exists
    2. Task style-manager: Display styles/{name}.md contents
  </handler>

  <handler action="delete">
    1. Verify style exists
    2. Read and display current contents
    3. AskUserQuestion: "Are you sure you want to delete '{name}'? This cannot be undone."
       Options: ["Yes, delete it", "No, keep it"]
    4. If "No": Report cancellation
    5. If "Yes": Task style-manager: Delete
  </handler>

  <handler action="update">
    1. Verify style exists
    2. Read and display current contents
    3. AskUserQuestion: "Do you want to overwrite the existing style?"
       Options: ["Yes, overwrite", "No, cancel"]
    4. If "No": Report cancellation
    5. If "Yes": Ask for new description
    6. Task style-manager: Update with new content
  </handler>
</action_handlers>

<examples>
  <example name="Create">
    <input>/nanobanana:style create glass</input>
    <flow>
      1. Parse: action=create, name=glass
      2. Check styles/glass.md doesn't exist
      3. Ask: "Describe the glass style"
      4. User: "3D glass material with blue tint, reflections, black background"
      5. Task style-manager: Create styles/glass.md
      6. Report: "Created. Use: --style glass"
    </flow>
  </example>

  <example name="Delete (with confirmation)">
    <input>/nanobanana:style delete minimalist</input>
    <flow>
      1. Parse: action=delete, name=minimalist
      2. Verify styles/minimalist.md exists
      3. Read and display contents:
         "Current style 'minimalist':
          # Minimalist Style
          Clean, simple designs..."
      4. AskUserQuestion: "Are you sure you want to delete 'minimalist'?"
      5. User selects: "Yes, delete it"
      6. Task style-manager: Delete file
      7. Report: "Deleted style 'minimalist'"
    </flow>
  </example>

  <example name="Delete (cancelled)">
    <input>/nanobanana:style delete watercolor</input>
    <flow>
      1. Parse: action=delete, name=watercolor
      2. Verify exists, display contents
      3. AskUserQuestion: confirmation
      4. User selects: "No, keep it"
      5. Report: "Deletion cancelled. Style 'watercolor' preserved."
    </flow>
  </example>

  <example name="List">
    <input>/nanobanana:style list</input>
    <flow>
      1. Parse: action=list
      2. Task style-manager: List styles
      3. Show: glass, watercolor, cyberpunk
    </flow>
  </example>
</examples>
