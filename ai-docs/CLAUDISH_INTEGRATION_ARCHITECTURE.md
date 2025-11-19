# Claudish Integration Architecture

**Version:** 1.0.0
**Status:** Design Complete
**Date:** 2025-11-19

## Executive Summary

This document defines the **Single Source of Truth** architecture for model management in the MAG Claude ecosystem. Instead of building a complex API + caching system in Claude Code, we delegate model management to **Claudish**, which already has the infrastructure and expertise to handle OpenRouter integration.

**Key Principle:** Claudish owns the model list, Claude Code queries it.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MAG Claude Ecosystem                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐                ┌───────────────────┐  │
│  │   Claudish CLI   │                │   Claude Code     │  │
│  │                  │                │   Commands        │  │
│  │  ┌────────────┐  │                │                   │  │
│  │  │ Model List │◄─┼────────────────┼──  /review        │  │
│  │  │  Manager   │  │  Query Models  │                   │  │
│  │  └────────────┘  │                │  /implement       │  │
│  │         │        │                │                   │  │
│  │         ▼        │                │  /develop-agent   │  │
│  │  recommended-    │                └───────────────────┘  │
│  │  models.json     │                                        │
│  │         │        │                                        │
│  │         ▼        │                                        │
│  │  ┌────────────┐  │                                        │
│  │  │ OpenRouter │  │                                        │
│  │  │    API     │  │                                        │
│  │  └────────────┘  │                                        │
│  └──────────────────┘                                        │
│                                                               │
│  Single Source of Truth: Claudish                            │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Claudish (Model Manager)

**Responsibilities:**
- ✅ Maintain `recommended-models.json` with model metadata
- ✅ Provide `--list-models` CLI command (text output)
- ✅ **NEW**: Provide `--list-models --json` (machine-readable)
- ✅ **NEW**: Provide `--list-models --category=<category>` (filter by category)
- ✅ Cache model info in-memory (already implemented)
- ✅ Handle OpenRouter API integration
- ✅ Update model list from OpenRouter (manual or automated)

**Current State:**
- ✅ `recommended-models.json` exists with 7 models
- ✅ `loadModelInfo()` and `getAvailableModels()` implemented
- ✅ In-memory caching implemented
- ❌ No `--json` flag yet (needs implementation)
- ❌ No `--category` filter yet (needs implementation)

**File Structure:**
```
mcp/claudish/
├── recommended-models.json     # Model metadata (single source of truth)
├── src/
│   ├── model-loader.ts         # Load and cache models
│   ├── cli.ts                  # CLI argument parsing
│   └── config.ts               # Model defaults
```

### 2. Claude Code Commands (Model Consumers)

**Responsibilities:**
- ✅ Query Claudish for model recommendations via `claudish --list-models --json`
- ✅ Parse JSON output for model selection UI
- ✅ Support user overrides from CLAUDE.md or command arguments
- ✅ Graceful degradation if Claudish not available

**Integration Pattern:**
```typescript
// Pseudocode for Claude Code command
async function getRecommendedModels() {
  // 1. Check for user override in CLAUDE.md
  const userModels = await readUserOverrideFromClaudeMd();
  if (userModels) return userModels;

  // 2. Query Claudish for recommendations
  try {
    const result = await exec("claudish --list-models --json");
    const models = JSON.parse(result.stdout);
    return models;
  } catch (error) {
    // 3. Graceful fallback to embedded defaults
    console.warn("Could not query Claudish, using embedded defaults");
    return EMBEDDED_DEFAULT_MODELS;
  }
}
```

**Commands Using This:**
- `/review` - Multi-model code review (needs model selection)
- `/implement` - Could use Claudish for proxy mode
- `/develop-agent` - Could use Claudish for agent testing
- Future commands requiring external AI models

## Claudish Enhancement Specification

### New Feature 1: JSON Output

**Flag:** `--list-models --json`

**Output Format:**
```json
{
  "version": "1.1.5",
  "lastUpdated": "2025-11-16",
  "source": "shared/recommended-models.md",
  "models": [
    {
      "id": "x-ai/grok-code-fast-1",
      "name": "Grok Code Fast 1",
      "description": "Ultra-fast agentic coding with visible reasoning traces",
      "provider": "xAI",
      "category": "coding",
      "priority": 1,
      "pricing": {
        "input": "$0.20/1M",
        "output": "$1.50/1M",
        "average": "$0.85/1M"
      },
      "context": "256K",
      "recommended": true
    }
    // ... more models
  ]
}
```

**Implementation:**
```typescript
// In cli.ts - printAvailableModels()
function printAvailableModels(jsonOutput = false): void {
  const models = getAvailableModels();
  const modelInfo = loadModelInfo();

  if (jsonOutput) {
    // Read and output recommended-models.json directly
    const jsonPath = join(__dirname, "../recommended-models.json");
    const jsonContent = readFileSync(jsonPath, "utf-8");
    console.log(jsonContent);
    return;
  }

  // Existing text output logic...
}
```

**CLI Update:**
```typescript
// In cli.ts - parseArgs()
else if (arg === "--list-models") {
  const nextArg = args[i + 1];
  const jsonOutput = nextArg === "--json";
  if (jsonOutput) i++; // Consume --json flag

  printAvailableModels(jsonOutput);
  process.exit(0);
}
```

### New Feature 2: Category Filtering

**Flag:** `--list-models --category=<category>`

**Categories:**
- `coding` - Fast coding models (Grok, MiniMax)
- `reasoning` - Advanced reasoning models (GPT-5, Gemini)
- `vision` - Multimodal models (Qwen)
- `budget` - Free or low-cost models (Polaris)
- `all` - All models (default)

**Usage Examples:**
```bash
# Get coding models only
claudish --list-models --category=coding

# Get coding models in JSON format
claudish --list-models --category=coding --json

# Get all models (default)
claudish --list-models
```

**Output:**
```
Available OpenRouter Models (category: coding):

  x-ai/grok-code-fast-1
    Grok Code Fast 1 - Ultra-fast agentic coding with visible reasoning traces

  minimax/minimax-m2
    MiniMax M2 - Compact high-efficiency model for end-to-end coding
```

**Implementation:**
```typescript
// In cli.ts
function printAvailableModels(options: {
  jsonOutput?: boolean;
  category?: string;
} = {}): void {
  const { jsonOutput = false, category = "all" } = options;

  const models = getAvailableModels();
  const modelInfo = loadModelInfo();

  // Filter by category
  const filteredModels = category === "all"
    ? models
    : models.filter(m => modelInfo[m]?.category === category);

  if (jsonOutput) {
    const jsonPath = join(__dirname, "../recommended-models.json");
    const data = JSON.parse(readFileSync(jsonPath, "utf-8"));

    // Filter models in JSON
    const filtered = {
      ...data,
      models: data.models.filter(m =>
        category === "all" || m.category === category
      )
    };

    console.log(JSON.stringify(filtered, null, 2));
    return;
  }

  // Text output with category label
  const label = category === "all" ? "in priority order" : `category: ${category}`;
  console.log(`\nAvailable OpenRouter Models (${label}):\n`);

  // ... rest of text output logic
}
```

**CLI Parsing:**
```typescript
// In cli.ts - parseArgs()
else if (arg === "--list-models") {
  const options: { jsonOutput?: boolean; category?: string } = {};

  // Look ahead for --json and --category flags
  let j = i + 1;
  while (j < args.length && args[j].startsWith("--")) {
    if (args[j] === "--json") {
      options.jsonOutput = true;
      j++;
    } else if (args[j].startsWith("--category=")) {
      options.category = args[j].split("=")[1];
      j++;
    } else {
      break;
    }
  }

  printAvailableModels(options);
  process.exit(0);
}
```

### New Feature 3: Model Update Command

**Flag:** `--update-models`

**Purpose:** Fetch latest model list from OpenRouter API and update `recommended-models.json`

**Implementation Strategy:**
```typescript
// In cli.ts - parseArgs()
else if (arg === "--update-models") {
  await updateModelsFromOpenRouter();
  console.log("✅ Model list updated successfully");
  process.exit(0);
}

// In model-loader.ts
async function updateModelsFromOpenRouter(): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY required to update models");
  }

  // Fetch models from OpenRouter API
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();

  // Filter to recommended models (based on criteria)
  const recommended = filterRecommendedModels(data.models);

  // Update recommended-models.json
  const jsonPath = join(__dirname, "../recommended-models.json");
  const updated = {
    version: "1.1.6", // Bump version
    lastUpdated: new Date().toISOString().split("T")[0],
    source: "OpenRouter API",
    models: recommended,
  };

  writeFileSync(jsonPath, JSON.stringify(updated, null, 2));

  // Clear cache
  _cachedModelInfo = null;
  _cachedModelIds = null;
}
```

**Note:** This feature is OPTIONAL for initial implementation. Manual updates via `shared/recommended-models.md` are sufficient for now.

## Claude Code Integration Pattern

### Integration Skill

**Location:** `/Users/jack/mag/claude-code/skills/claudish-integration/SKILL.md`

**Purpose:** Guide agents on how to query Claudish for model recommendations

**Key Functions:**
1. Query Claudish for models (`claudish --list-models --json`)
2. Parse JSON output
3. Support user overrides from CLAUDE.md
4. Graceful fallback to embedded defaults

### Example: /review Command Integration

**Current State:**
- `/review` command has embedded default model list
- No dynamic updates from Claudish

**New State:**
```typescript
// In /review command orchestrator
async function selectModels() {
  // 1. Check CLAUDE.md for user overrides
  const userModels = await readClaudeMdModelOverrides();
  if (userModels) {
    console.log("Using models from CLAUDE.md");
    return userModels;
  }

  // 2. Query Claudish for recommendations
  try {
    const { stdout } = await Bash("claudish --list-models --json --category=coding");
    const data = JSON.parse(stdout);

    return data.models.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      category: m.category,
    }));
  } catch (error) {
    console.warn("Could not query Claudish, using embedded defaults");
    return EMBEDDED_DEFAULT_MODELS;
  }
}
```

### User Override Mechanism

**CLAUDE.md Format:**
```markdown
## Claudish Configuration

**Recommended Models for Code Review:**
- x-ai/grok-code-fast-1
- google/gemini-2.5-flash
- openai/gpt-5.1-codex

**Model Categories:**
- coding: grok, minimax
- reasoning: gpt-5, gemini
```

**Parsing Logic:**
```typescript
async function readClaudeMdModelOverrides(): Promise<Model[] | null> {
  const claudeMd = await Read(".claude/CLAUDE.md");
  if (!claudeMd) return null;

  // Look for "Recommended Models for Code Review:" section
  const match = claudeMd.match(/Recommended Models for Code Review:(.*?)(?=\n\n|$)/s);
  if (!match) return null;

  // Extract model IDs
  const modelIds = match[1]
    .split("\n")
    .filter(line => line.trim().startsWith("-"))
    .map(line => line.replace(/^-\s*/, "").trim());

  if (modelIds.length === 0) return null;

  // Query Claudish for details on these specific models
  try {
    const { stdout } = await Bash("claudish --list-models --json");
    const data = JSON.parse(stdout);

    return data.models.filter(m => modelIds.includes(m.id));
  } catch {
    // Return model IDs without metadata
    return modelIds.map(id => ({ id, name: id, description: "", category: "custom" }));
  }
}
```

## Error Handling and Fallbacks

### Scenario 1: Claudish Not Installed

**Detection:**
```bash
which claudish || which npx
```

**Fallback:**
1. Use embedded default model list in Claude Code command
2. Log warning: "Claudish not found, using embedded defaults"
3. Continue with limited functionality

**Embedded Defaults:**
```typescript
// In command or skill
const EMBEDDED_DEFAULT_MODELS = [
  { id: "x-ai/grok-code-fast-1", name: "Grok Code Fast 1", category: "coding" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", category: "reasoning" },
  { id: "openai/gpt-5.1-codex", name: "GPT-5.1 Codex", category: "reasoning" },
];
```

### Scenario 2: Claudish Version Too Old

**Detection:**
```bash
claudish --version
# Output: claudish version 1.0.0
```

**Fallback:**
1. Check if version >= 1.2.0 (minimum version with --json support)
2. If too old, suggest upgrade: `npm install -g claudish@latest`
3. Fall back to embedded defaults

**Version Check:**
```typescript
async function checkClaudishVersion(): Promise<{ major: number; minor: number; patch: number } | null> {
  try {
    const { stdout } = await Bash("claudish --version");
    const match = stdout.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
    };
  } catch {
    return null;
  }
}

async function isClaudishJsonSupported(): Promise<boolean> {
  const version = await checkClaudishVersion();
  if (!version) return false;

  // JSON support added in 1.2.0
  return version.major >= 1 && version.minor >= 2;
}
```

### Scenario 3: JSON Parse Error

**Detection:**
```typescript
try {
  const data = JSON.parse(stdout);
} catch (error) {
  // Invalid JSON
}
```

**Fallback:**
1. Log error with details
2. Fall back to embedded defaults
3. Suggest checking Claudish installation

### Scenario 4: Empty Model List

**Detection:**
```typescript
const data = JSON.parse(stdout);
if (!data.models || data.models.length === 0) {
  // Empty list
}
```

**Fallback:**
1. Check if `recommended-models.json` exists
2. If not, suggest running `claudish --update-models`
3. Fall back to embedded defaults

## Migration Strategy

### Phase 1: Enhance Claudish (Week 1)

**Tasks:**
1. Add `--list-models --json` flag
2. Add `--list-models --category=<category>` filter
3. Update CLI parsing to handle new flags
4. Add tests for JSON output
5. Update Claudish documentation
6. Release Claudish v1.2.0

**Deliverables:**
- ✅ `claudish --list-models --json` works
- ✅ `claudish --list-models --category=coding --json` works
- ✅ Documentation updated
- ✅ Backwards compatible (text output still default)

### Phase 2: Create Integration Skill (Week 2)

**Tasks:**
1. Create `skills/claudish-integration/SKILL.md`
2. Document query patterns
3. Document parsing logic
4. Document error handling
5. Add examples for common scenarios

**Deliverables:**
- ✅ Integration skill available to all agents
- ✅ Clear guidance on Claudish integration
- ✅ Error handling documented

### Phase 3: Update /review Command (Week 2)

**Tasks:**
1. Update `/review` to query Claudish
2. Add CLAUDE.md override support
3. Add graceful fallbacks
4. Test with Claudish v1.2.0
5. Update documentation

**Deliverables:**
- ✅ `/review` uses dynamic model list from Claudish
- ✅ User overrides supported
- ✅ Backwards compatible (embedded defaults as fallback)

### Phase 4: Deprecate /update-models (Week 3)

**Tasks:**
1. Mark `/update-models` as deprecated
2. Update to redirect: `claudish --update-models` (if implemented)
3. Add deprecation notice to documentation
4. Create migration guide

**Deliverables:**
- ✅ `/update-models` deprecated (or removed)
- ✅ Migration guide published
- ✅ Users transitioned to Claudish

## Benefits of This Architecture

### 1. Single Source of Truth
- ✅ Claudish owns model data
- ✅ No duplicate caching logic
- ✅ Consistent model info across all commands

### 2. Simpler Architecture
- ✅ No complex API client in Claude Code
- ✅ No caching infrastructure in Claude Code
- ✅ Delegate to specialized tool (Claudish)

### 3. Better Separation of Concerns
- ✅ Claudish: Model management + OpenRouter integration
- ✅ Claude Code: Command orchestration + agent execution
- ✅ Clear boundaries and responsibilities

### 4. User Control
- ✅ Override via CLAUDE.md
- ✅ Override via command arguments
- ✅ Dynamic updates via `claudish --update-models`

### 5. Graceful Degradation
- ✅ Works without Claudish (embedded defaults)
- ✅ Works with old Claudish (text parsing fallback)
- ✅ Clear error messages

### 6. Future-Proof
- ✅ Easy to add new models (just update `recommended-models.json`)
- ✅ Easy to add new categories
- ✅ Easy to add new filtering options

## Implementation Checklist

### Claudish Enhancements
- [ ] Add `--list-models --json` flag
- [ ] Add `--list-models --category=<category>` filter
- [ ] Add `--update-models` command (optional)
- [ ] Update CLI parsing (`cli.ts`)
- [ ] Update `printAvailableModels()` function
- [ ] Add tests for JSON output
- [ ] Update README.md with new flags
- [ ] Release Claudish v1.2.0

### Claude Code Integration
- [ ] Create `skills/claudish-integration/SKILL.md`
- [ ] Document query patterns
- [ ] Document error handling
- [ ] Add version detection logic
- [ ] Add CLAUDE.md parsing logic
- [ ] Update `/review` command to use Claudish
- [ ] Add embedded default models (fallback)
- [ ] Add graceful error handling
- [ ] Update command documentation

### Migration
- [ ] Create `ai-docs/MIGRATION_FROM_UPDATE_MODELS.md`
- [ ] Mark `/update-models` as deprecated
- [ ] Update CLAUDE.md with new patterns
- [ ] Announce changes to users

## Success Criteria

**After implementation:**

1. ✅ `claudish --list-models --json` outputs valid JSON
2. ✅ `claudish --list-models --category=coding --json` filters correctly
3. ✅ `/review` command queries Claudish dynamically
4. ✅ User overrides from CLAUDE.md work
5. ✅ Graceful fallback to embedded defaults works
6. ✅ Old `/update-models` deprecated or removed
7. ✅ Documentation complete and clear
8. ✅ No breaking changes for existing users

## References

**Related Documents:**
- `mcp/claudish/README.md` - Claudish documentation
- `mcp/claudish/src/model-loader.ts` - Current model loading logic
- `mcp/claudish/recommended-models.json` - Current model data
- `plugins/frontend/commands/review.md` - `/review` command (uses external models)

**External Resources:**
- OpenRouter API: https://openrouter.ai/docs
- OpenRouter Models: https://openrouter.ai/models
