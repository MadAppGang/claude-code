# Context Detection Skill

**Version:** 1.0.0
**Purpose:** Patterns for detecting project technology stack from files, configs, and directory structure
**Used By:** stack-detector agent, all dev commands

## Overview

The context detection skill provides systematic patterns for analyzing any project to determine its technology stack(s). It enables the dev plugin to auto-load appropriate framework-specific skills based on what's actually in the project.

**Key Innovation:** Multi-stack detection for fullstack projects (e.g., React + Go).

---

## Detection Priority

Detection follows a priority order from most explicit to most inferred:

### 1. Explicit User Preference (Highest Priority)

**Source:** `.claude/settings.json`

```json
{
  "pluginSettings": {
    "dev": {
      "stack": ["react-typescript", "golang"],
      "features": {
        "testing": "vitest",
        "api": "rest"
      }
    }
  }
}
```

**When to use:**
- User wants to override auto-detection
- Project has ambiguous structure
- Custom stack combinations

### 2. Current File Context

**Source:** File extension of current editing context

```yaml
extension_mappings:
  ".tsx": ["react-typescript", "testing-frontend"]
  ".vue": ["vue-typescript", "testing-frontend"]
  ".go": ["golang", "testing-strategies"]
  ".rs": ["rust", "testing-strategies"]
  ".py": ["python", "testing-strategies"]
```

**When to use:**
- User is editing a specific file
- Immediate context for implementation
- Quick detection without full project scan

### 3. Configuration Files (Primary Detection)

**Source:** Project configuration files

```yaml
config_file_patterns:
  package.json:
    check: "dependencies.react exists"
    skills: ["react-typescript", "state-management", "testing-frontend"]
    mode: "frontend"

  package.json:
    check: "dependencies.vue exists"
    skills: ["vue-typescript", "state-management", "testing-frontend"]
    mode: "frontend"

  go.mod:
    check: "file exists"
    skills: ["golang", "api-design", "database-patterns"]
    mode: "backend"

  Cargo.toml:
    check: "file exists"
    skills: ["rust", "api-design"]
    mode: "backend"

  pyproject.toml:
    check: "file exists"
    skills: ["python", "api-design"]
    mode: "backend"

  bun.lockb:
    check: "file exists AND no react/vue in package.json"
    skills: ["bunjs", "api-design"]
    mode: "backend"
```

**When to use:**
- First time analyzing a project
- Most reliable detection method
- Determine versions and dependencies

### 4. Directory Structure Patterns (Supporting Evidence)

**Source:** Common directory layouts

```yaml
directory_patterns:
  "src/routes/":
    indicator: "React Router structure"
    skills: ["react-typescript"]

  "src/components/":
    indicator: "Component-based frontend"
    skills: ["react-typescript", "vue-typescript"]

  "cmd/":
    indicator: "Go standard project layout"
    skills: ["golang"]

  "src/main.rs":
    indicator: "Rust binary crate"
    skills: ["rust"]

  "frontend/":
    indicator: "Separate frontend directory (fullstack)"
    note: "Check for backend/ as well"

  "backend/":
    indicator: "Separate backend directory (fullstack)"
    note: "Check for frontend/ as well"
```

**When to use:**
- Confirming config file detection
- Identifying fullstack projects
- Disambiguating multi-purpose projects

---

## Multi-Stack Detection Algorithm

**CRITICAL:** Always check for MULTIPLE stacks. Projects can be fullstack.

```bash
# Step 1: Find ALL config files (not just first match)
find_all_configs() {
  configs=()
  [ -f "package.json" ] && configs+=("package.json")
  [ -f "go.mod" ] && configs+=("go.mod")
  [ -f "Cargo.toml" ] && configs+=("Cargo.toml")
  [ -f "pyproject.toml" ] && configs+=("pyproject.toml")
  [ -f "bun.lockb" ] && configs+=("bun.lockb")

  echo "${configs[@]}"
}

# Step 2: Analyze EACH config file
analyze_all_configs() {
  local detected_stacks=()

  # Check package.json
  if [ -f "package.json" ]; then
    if grep -q '"react"' package.json; then
      detected_stacks+=("react-typescript")
    elif grep -q '"vue"' package.json; then
      detected_stacks+=("vue-typescript")
    fi
  fi

  # Check go.mod
  if [ -f "go.mod" ]; then
    detected_stacks+=("golang")
  fi

  # Check Cargo.toml
  if [ -f "Cargo.toml" ]; then
    detected_stacks+=("rust")
  fi

  # Check pyproject.toml
  if [ -f "pyproject.toml" ]; then
    detected_stacks+=("python")
  fi

  # Check bun.lockb (only if NOT frontend)
  if [ -f "bun.lockb" ] && ! grep -q '"react"\|"vue"' package.json 2>/dev/null; then
    detected_stacks+=("bunjs")
  fi

  echo "${detected_stacks[@]}"
}

# Step 3: Determine mode
determine_mode() {
  local stacks=("$@")
  local has_frontend=false
  local has_backend=false

  for stack in "${stacks[@]}"; do
    case "$stack" in
      react-typescript|vue-typescript)
        has_frontend=true
        ;;
      golang|rust|python|bunjs)
        has_backend=true
        ;;
    esac
  done

  if [ "$has_frontend" = true ] && [ "$has_backend" = true ]; then
    echo "fullstack"
  elif [ "$has_frontend" = true ]; then
    echo "frontend"
  elif [ "$has_backend" = true ]; then
    echo "backend"
  else
    echo "unknown"
  fi
}

# Step 4: Map stacks to skills
map_stacks_to_skills() {
  local stacks=("$@")
  local skills=(
    # Core skills (ALWAYS included)
    "universal-patterns"
    "testing-strategies"
    "debugging-strategies"
  )

  for stack in "${stacks[@]}"; do
    case "$stack" in
      react-typescript)
        skills+=("react-typescript" "state-management" "testing-frontend")
        ;;
      vue-typescript)
        skills+=("vue-typescript" "state-management" "testing-frontend")
        ;;
      golang)
        skills+=("golang" "api-design" "database-patterns")
        ;;
      rust)
        skills+=("rust" "api-design")
        ;;
      python)
        skills+=("python" "api-design")
        ;;
      bunjs)
        skills+=("bunjs" "api-design")
        ;;
    esac
  done

  # Deduplicate
  echo "${skills[@]}" | tr ' ' '\n' | sort -u
}

# Step 5: Complete detection
detect_project_stack() {
  # Check explicit preference first
  local explicit_stack=$(jq -r '.pluginSettings.dev.stack // empty' .claude/settings.json 2>/dev/null)
  if [ -n "$explicit_stack" ]; then
    echo "Using explicit stack from .claude/settings.json"
    return
  fi

  # Auto-detect all stacks
  local detected_stacks=($(analyze_all_configs))

  if [ ${#detected_stacks[@]} -eq 0 ]; then
    echo "ERROR: No stack detected"
    return 1
  fi

  # Determine mode
  local mode=$(determine_mode "${detected_stacks[@]}")

  # Map to skills
  local skills=($(map_stacks_to_skills "${detected_stacks[@]}"))

  # Output result
  echo "Detected: ${detected_stacks[*]}"
  echo "Mode: $mode"
  echo "Skills: ${skills[*]}"
}
```

---

## Framework-Specific Detection

### React Detection

```bash
detect_react() {
  # Check package.json
  if [ -f "package.json" ]; then
    # React in dependencies or devDependencies
    if jq -e '.dependencies.react // .devDependencies.react' package.json >/dev/null 2>&1; then
      # Check for TypeScript
      local has_typescript=false
      if jq -e '.dependencies["@types/react"] // .devDependencies["@types/react"]' package.json >/dev/null 2>&1; then
        has_typescript=true
      fi

      # Get version
      local react_version=$(jq -r '.dependencies.react // .devDependencies.react' package.json | sed 's/[^0-9.]//g')

      echo "react-typescript"
      echo "version: $react_version"
      echo "typescript: $has_typescript"
      return 0
    fi
  fi

  return 1
}
```

### Vue Detection

```bash
detect_vue() {
  if [ -f "package.json" ]; then
    if jq -e '.dependencies.vue' package.json >/dev/null 2>&1; then
      local vue_version=$(jq -r '.dependencies.vue' package.json | sed 's/[^0-9.]//g')
      echo "vue-typescript"
      echo "version: $vue_version"
      return 0
    fi
  fi

  return 1
}
```

### Go Detection

```bash
detect_go() {
  if [ -f "go.mod" ]; then
    local go_version=$(grep '^go ' go.mod | awk '{print $2}')
    local module_name=$(grep '^module ' go.mod | awk '{print $2}')

    echo "golang"
    echo "version: $go_version"
    echo "module: $module_name"
    return 0
  fi

  return 1
}
```

### Rust Detection

```bash
detect_rust() {
  if [ -f "Cargo.toml" ]; then
    local package_name=$(grep '^\[package\]' -A 5 Cargo.toml | grep '^name' | cut -d'"' -f2)
    local edition=$(grep '^\[package\]' -A 5 Cargo.toml | grep '^edition' | cut -d'"' -f2)

    echo "rust"
    echo "edition: $edition"
    echo "package: $package_name"
    return 0
  fi

  return 1
}
```

### Python Detection

```bash
detect_python() {
  if [ -f "pyproject.toml" ]; then
    local has_fastapi=$(grep -i 'fastapi' pyproject.toml)
    local has_django=$(grep -i 'django' pyproject.toml)

    echo "python"
    [ -n "$has_fastapi" ] && echo "framework: fastapi"
    [ -n "$has_django" ] && echo "framework: django"
    return 0
  fi

  return 1
}
```

### Bun Detection

```bash
detect_bun() {
  # Bun backend (NOT frontend with Bun runtime)
  if [ -f "bun.lockb" ]; then
    # Check if this is a frontend project
    if [ -f "package.json" ]; then
      if jq -e '.dependencies.react // .dependencies.vue' package.json >/dev/null 2>&1; then
        # This is frontend using Bun runtime, not Bun backend
        return 1
      fi
    fi

    # This is a Bun backend project
    echo "bunjs"
    return 0
  fi

  return 1
}
```

---

## Quality Checks by Stack

Quality checks are automatically determined based on detected stack(s):

### Frontend Quality Checks

```yaml
react-typescript:
  - command: "bun run format"
    tool: "Biome"
    purpose: "Code formatting"
  - command: "bun run lint"
    tool: "Biome"
    purpose: "Linting"
  - command: "bun run typecheck"
    tool: "TypeScript"
    purpose: "Type checking"
  - command: "bun test"
    tool: "Vitest"
    purpose: "Unit tests"

vue-typescript:
  - command: "bun run format"
    tool: "Biome"
  - command: "bun run lint"
    tool: "Biome"
  - command: "bun run typecheck"
    tool: "TypeScript"
  - command: "bun test"
    tool: "Vitest"
```

### Backend Quality Checks

```yaml
golang:
  - command: "go fmt ./..."
    purpose: "Format Go code"
  - command: "go vet ./..."
    purpose: "Static analysis"
  - command: "golangci-lint run"
    purpose: "Comprehensive linting"
  - command: "go test ./..."
    purpose: "Run tests"

rust:
  - command: "cargo fmt --check"
    purpose: "Check formatting"
  - command: "cargo clippy -- -D warnings"
    purpose: "Linting"
  - command: "cargo test"
    purpose: "Run tests"

python:
  - command: "black --check ."
    purpose: "Check formatting"
  - command: "ruff check ."
    purpose: "Linting"
  - command: "mypy ."
    purpose: "Type checking"
  - command: "pytest"
    purpose: "Run tests"

bunjs:
  - command: "bun run format"
    tool: "Biome"
  - command: "bun run lint"
    tool: "Biome"
  - command: "bun run typecheck"
    tool: "TypeScript"
  - command: "bun test"
    tool: "Bun test runner"
```

### Fullstack Quality Checks

For fullstack projects, run checks for BOTH stacks:

```yaml
fullstack (react + go):
  frontend:
    directory: "./frontend"
    checks:
      - "cd frontend && bun run format"
      - "cd frontend && bun run lint"
      - "cd frontend && bun run typecheck"
      - "cd frontend && bun test"
  backend:
    directory: "."
    checks:
      - "go fmt ./..."
      - "go vet ./..."
      - "golangci-lint run"
      - "go test ./..."
```

---

## Skill Path Generation

Convert detected stacks to skill file paths using ${PLUGIN_ROOT} placeholder:

```bash
generate_skill_paths() {
  local stacks=("$@")
  local skill_paths=(
    # Core skills (ALWAYS)
    '${PLUGIN_ROOT}/skills/core/universal-patterns/SKILL.md'
    '${PLUGIN_ROOT}/skills/core/testing-strategies/SKILL.md'
    '${PLUGIN_ROOT}/skills/core/debugging-strategies/SKILL.md'
  )

  for stack in "${stacks[@]}"; do
    case "$stack" in
      react-typescript)
        skill_paths+=(
          '${PLUGIN_ROOT}/skills/frontend/react-typescript/SKILL.md'
          '${PLUGIN_ROOT}/skills/frontend/state-management/SKILL.md'
          '${PLUGIN_ROOT}/skills/frontend/testing-frontend/SKILL.md'
        )
        ;;
      vue-typescript)
        skill_paths+=(
          '${PLUGIN_ROOT}/skills/frontend/vue-typescript/SKILL.md'
          '${PLUGIN_ROOT}/skills/frontend/state-management/SKILL.md'
          '${PLUGIN_ROOT}/skills/frontend/testing-frontend/SKILL.md'
        )
        ;;
      golang)
        skill_paths+=(
          '${PLUGIN_ROOT}/skills/backend/golang/SKILL.md'
          '${PLUGIN_ROOT}/skills/backend/api-design/SKILL.md'
          '${PLUGIN_ROOT}/skills/backend/database-patterns/SKILL.md'
        )
        ;;
      rust)
        skill_paths+=(
          '${PLUGIN_ROOT}/skills/backend/rust/SKILL.md'
          '${PLUGIN_ROOT}/skills/backend/api-design/SKILL.md'
        )
        ;;
      python)
        skill_paths+=(
          '${PLUGIN_ROOT}/skills/backend/python/SKILL.md'
          '${PLUGIN_ROOT}/skills/backend/api-design/SKILL.md'
        )
        ;;
      bunjs)
        skill_paths+=(
          '${PLUGIN_ROOT}/skills/backend/bunjs/SKILL.md'
          '${PLUGIN_ROOT}/skills/backend/api-design/SKILL.md'
        )
        ;;
    esac
  done

  # Print unique paths
  printf '%s\n' "${skill_paths[@]}" | sort -u
}
```

**CRITICAL:** Always use `${PLUGIN_ROOT}` placeholder, NOT hardcoded paths. This placeholder is expanded at runtime to the actual plugin directory.

---

## Error Handling

### No Stack Detected

```yaml
error: "no_stack_detected"
trigger: "No config files found AND no recognizable directory structure"
recovery:
  1. Prompt user for manual stack selection
  2. Offer generic "unknown" stack with only core skills
  3. Save user choice to ${SESSION_PATH}/context.json
  4. Proceed with core skills only
```

### Ambiguous Detection

```yaml
error: "ambiguous_stack"
trigger: "Multiple possible interpretations"
recovery:
  1. Present all possibilities to user
  2. Ask for confirmation
  3. Save confirmed stack to context
```

### Incomplete Detection

```yaml
error: "incomplete_detection"
trigger: "Found some indicators but missing key files"
recovery:
  1. Report partial detection
  2. Load available skills
  3. Warn user about potential missing skills
```

---

## Usage Examples

### Example 1: React Frontend

**Project Structure:**
```
project/
├── package.json (with react: "^19.0.0")
├── src/
│   ├── routes/
│   └── components/
└── .tsx files
```

**Detection Result:**
```json
{
  "detected_stack": "react-typescript",
  "mode": "frontend",
  "stacks": ["react-typescript"],
  "skill_paths": [
    "${PLUGIN_ROOT}/skills/core/universal-patterns/SKILL.md",
    "${PLUGIN_ROOT}/skills/core/testing-strategies/SKILL.md",
    "${PLUGIN_ROOT}/skills/frontend/react-typescript/SKILL.md",
    "${PLUGIN_ROOT}/skills/frontend/state-management/SKILL.md",
    "${PLUGIN_ROOT}/skills/frontend/testing-frontend/SKILL.md"
  ]
}
```

### Example 2: Go Backend

**Project Structure:**
```
project/
├── go.mod
├── cmd/
│   └── server/
└── internal/
```

**Detection Result:**
```json
{
  "detected_stack": "golang",
  "mode": "backend",
  "stacks": ["golang"],
  "skill_paths": [
    "${PLUGIN_ROOT}/skills/core/universal-patterns/SKILL.md",
    "${PLUGIN_ROOT}/skills/core/testing-strategies/SKILL.md",
    "${PLUGIN_ROOT}/skills/backend/golang/SKILL.md",
    "${PLUGIN_ROOT}/skills/backend/api-design/SKILL.md",
    "${PLUGIN_ROOT}/skills/backend/database-patterns/SKILL.md"
  ]
}
```

### Example 3: Fullstack (React + Go)

**Project Structure:**
```
project/
├── frontend/
│   ├── package.json (with react)
│   └── src/
├── go.mod
├── cmd/
└── internal/
```

**Detection Result:**
```json
{
  "detected_stack": "react-typescript + golang",
  "mode": "fullstack",
  "stacks": ["react-typescript", "golang"],
  "skill_paths": [
    "${PLUGIN_ROOT}/skills/core/universal-patterns/SKILL.md",
    "${PLUGIN_ROOT}/skills/core/testing-strategies/SKILL.md",
    "${PLUGIN_ROOT}/skills/frontend/react-typescript/SKILL.md",
    "${PLUGIN_ROOT}/skills/frontend/state-management/SKILL.md",
    "${PLUGIN_ROOT}/skills/frontend/testing-frontend/SKILL.md",
    "${PLUGIN_ROOT}/skills/backend/golang/SKILL.md",
    "${PLUGIN_ROOT}/skills/backend/api-design/SKILL.md",
    "${PLUGIN_ROOT}/skills/backend/database-patterns/SKILL.md"
  ],
  "quality_checks": {
    "frontend": ["cd frontend && bun run format", "..."],
    "backend": ["go fmt ./...", "..."]
  }
}
```

---

## Integration with Agents

### stack-detector Agent

The stack-detector agent implements this skill:

1. Reads this skill file for detection patterns
2. Applies detection algorithm
3. Generates skill paths using ${PLUGIN_ROOT}
4. Writes result to ${SESSION_PATH}/context.json
5. Returns summary to orchestrator

### Orchestrator Commands

Commands read context.json and pass skill paths to implementation agents:

```
Task: universal-developer
Prompt: |
  SESSION_PATH: ${SESSION_PATH}

  Read these skills before implementing:
  - ${PLUGIN_ROOT}/skills/frontend/react-typescript/SKILL.md
  - ${PLUGIN_ROOT}/skills/frontend/testing-frontend/SKILL.md

  Then implement: Create user profile component
```

### Implementation Agents

Agents use Read tool to load skill files:

```
1. Read skill file paths from prompt
2. Use Read tool to load each skill
3. Extract relevant patterns
4. Apply patterns during implementation
```

---

## Version History

### v1.0.0 (2026-01-05)
- Initial release
- Multi-stack detection support
- Framework-specific patterns for React, Vue, Go, Rust, Python, Bun
- Quality check mapping
- Skill path generation with ${PLUGIN_ROOT}
