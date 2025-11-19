# Claudish Integration Skill

**Version:** 1.0.0
**Purpose:** Guide agents on how to query Claudish for OpenRouter model recommendations
**Status:** Production Ready

## Overview

This skill provides **standardized patterns** for Claude Code agents and commands to query Claudish for model recommendations. Instead of maintaining duplicate model lists, agents should query Claudish as the **single source of truth** for OpenRouter model data.

**Key Principle:** Claudish owns the model list, agents query it dynamically.

## When to Use This Skill

Use this skill when:
- ✅ Building commands that need external AI model selection (e.g., `/review`)
- ✅ Creating proxy mode agents that delegate to OpenRouter models
- ✅ Implementing multi-model validation workflows
- ✅ Building tools that need model metadata (pricing, categories, context sizes)

Do NOT use this skill when:
- ❌ Working with embedded Claude models only (Sonnet, Opus, Haiku)
- ❌ Not using external AI models
- ❌ Claudish is not available or required

## Core Patterns

### Pattern 1: Query All Models (JSON)

**Use Case:** Get complete model list for selection UI

**Implementation:**
```typescript
// Execute Claudish to get model list
const { stdout } = await Bash("claudish --list-models --json");

// Parse JSON output
const modelData = JSON.parse(stdout);

// Access models
const models = modelData.models; // Array of model objects

// Example: Extract model IDs
const modelIds = models.map(m => m.id);
// Result: ["x-ai/grok-code-fast-1", "minimax/minimax-m2", ...]
```

**Expected Output:**
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

### Pattern 2: Filter by Category

**Use Case:** Get models for specific use case (coding, reasoning, vision, budget)

**Categories:**
- `coding` - Fast coding models (Grok, MiniMax)
- `reasoning` - Advanced reasoning models (GPT-5, Gemini)
- `vision` - Multimodal models (Qwen)
- `budget` - Free or low-cost models (Polaris)
- `all` - All models (default)

**Implementation:**
```typescript
// Get coding models only
const { stdout } = await Bash("claudish --list-models --category=coding --json");
const modelData = JSON.parse(stdout);

// Models are pre-filtered by Claudish
const codingModels = modelData.models;
// Result: Only models with category === "coding"
```

**Example: Get Best Coding Model**
```typescript
const { stdout } = await Bash("claudish --list-models --category=coding --json");
const modelData = JSON.parse(stdout);

// First model is highest priority (sorted by priority field)
const bestCodingModel = modelData.models[0];
console.log(`Best coding model: ${bestCodingModel.id}`);
// Output: Best coding model: x-ai/grok-code-fast-1
```

### Pattern 3: User Overrides from CLAUDE.md

**Use Case:** Allow users to specify preferred models in project configuration

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

**Implementation:**
```typescript
async function getRecommendedModels() {
  // 1. Check for user override in CLAUDE.md
  const userModels = await readUserOverrideFromClaudeMd();
  if (userModels) {
    console.log("Using models from CLAUDE.md");
    return userModels;
  }

  // 2. Query Claudish for defaults
  const { stdout } = await Bash("claudish --list-models --category=coding --json");
  const modelData = JSON.parse(stdout);
  return modelData.models;
}

async function readUserOverrideFromClaudeMd(): Promise<Model[] | null> {
  try {
    const claudeMd = await Read({ file_path: "/full/path/to/CLAUDE.md" });

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
    const { stdout } = await Bash("claudish --list-models --json");
    const modelData = JSON.parse(stdout);

    // Filter to user-specified models
    return modelData.models.filter(m => modelIds.includes(m.id));
  } catch (error) {
    console.warn("Could not read CLAUDE.md:", error.message);
    return null;
  }
}
```

### Pattern 4: Graceful Fallback to Embedded Defaults

**Use Case:** Handle errors when Claudish is not available

**Implementation:**
```typescript
// Define embedded defaults as fallback
const EMBEDDED_DEFAULT_MODELS = [
  {
    id: "x-ai/grok-code-fast-1",
    name: "Grok Code Fast 1",
    description: "Ultra-fast agentic coding",
    category: "coding",
    priority: 1
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "State-of-the-art reasoning and coding",
    category: "reasoning",
    priority: 2
  },
  {
    id: "openai/gpt-5.1-codex",
    name: "GPT-5.1 Codex",
    description: "Specialized for software engineering",
    category: "reasoning",
    priority: 3
  }
];

async function getRecommendedModels() {
  // 1. Check for user override
  const userModels = await readUserOverrideFromClaudeMd();
  if (userModels) return userModels;

  // 2. Try querying Claudish
  try {
    const { stdout } = await Bash("claudish --list-models --json");
    const modelData = JSON.parse(stdout);
    return modelData.models;
  } catch (error) {
    // 3. Graceful fallback
    console.warn("Could not query Claudish, using embedded defaults");
    console.warn(`Reason: ${error.message}`);
    return EMBEDDED_DEFAULT_MODELS;
  }
}
```

### Pattern 5: Version Detection

**Use Case:** Check if Claudish supports JSON output (v1.2.0+)

**Implementation:**
```typescript
async function checkClaudishVersion(): Promise<{ major: number; minor: number; patch: number } | null> {
  try {
    const { stdout } = await Bash("claudish --version");
    const match = stdout.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3])
    };
  } catch {
    return null;
  }
}

async function isClaudishJsonSupported(): Promise<boolean> {
  const version = await checkClaudishVersion();
  if (!version) {
    console.warn("Claudish not found");
    return false;
  }

  // JSON support added in 1.2.0
  const isSupported = version.major >= 1 && version.minor >= 2;

  if (!isSupported) {
    console.warn(`Claudish v${version.major}.${version.minor}.${version.patch} detected`);
    console.warn("JSON output requires Claudish v1.2.0+");
    console.warn("Upgrade: npm install -g claudish@latest");
  }

  return isSupported;
}

async function getRecommendedModels() {
  // Check Claudish version before querying
  const jsonSupported = await isClaudishJsonSupported();

  if (!jsonSupported) {
    console.warn("Falling back to embedded defaults");
    return EMBEDDED_DEFAULT_MODELS;
  }

  // Proceed with JSON query
  const { stdout } = await Bash("claudish --list-models --json");
  return JSON.parse(stdout).models;
}
```

## Complete Example: Multi-Model Selection

**Use Case:** `/review` command selects multiple models for parallel code review

**Implementation:**
```typescript
async function selectModelsForReview() {
  // Step 1: Get available models
  const availableModels = await getRecommendedModels(); // Uses patterns above

  // Step 2: Filter to coding/reasoning models
  const suitableModels = availableModels.filter(m =>
    m.category === "coding" || m.category === "reasoning"
  );

  // Step 3: Present selection UI to user (example)
  console.log("\nAvailable models for code review:\n");
  suitableModels.forEach((model, index) => {
    console.log(`${index + 1}. ${model.name}`);
    console.log(`   ${model.description}`);
    console.log(`   Category: ${model.category} | Cost: ${model.pricing.average}\n`);
  });

  // Step 4: User selects models (implementation depends on command)
  const selectedIndices = await promptUserForSelection();

  // Step 5: Return selected models
  return selectedIndices.map(i => suitableModels[i]);
}

async function getRecommendedModels() {
  // 1. User override
  const userModels = await readUserOverrideFromClaudeMd();
  if (userModels) return userModels;

  // 2. Claudish query (with version check)
  const jsonSupported = await isClaudishJsonSupported();
  if (jsonSupported) {
    try {
      const { stdout } = await Bash("claudish --list-models --json");
      return JSON.parse(stdout).models;
    } catch (error) {
      console.warn("Claudish query failed:", error.message);
    }
  }

  // 3. Fallback
  console.warn("Using embedded default models");
  return EMBEDDED_DEFAULT_MODELS;
}
```

## Error Handling

### Error 1: Claudish Not Installed

**Detection:**
```typescript
try {
  await Bash("which claudish");
} catch {
  console.warn("Claudish not installed");
}
```

**Fallback:**
```typescript
console.warn("Claudish not found. Using embedded default models.");
console.warn("To use dynamic model lists, install: npm install -g claudish");
return EMBEDDED_DEFAULT_MODELS;
```

### Error 2: Claudish Version Too Old

**Detection:**
```typescript
const version = await checkClaudishVersion();
const isOld = version && (version.major < 1 || version.minor < 2);
```

**Fallback:**
```typescript
console.warn(`Claudish v${version.major}.${version.minor}.${version.patch} detected`);
console.warn("JSON output requires v1.2.0+");
console.warn("Upgrade: npm install -g claudish@latest");
console.warn("Falling back to embedded defaults");
return EMBEDDED_DEFAULT_MODELS;
```

### Error 3: JSON Parse Error

**Detection:**
```typescript
try {
  const data = JSON.parse(stdout);
} catch (error) {
  console.error("Invalid JSON from Claudish:", error.message);
}
```

**Fallback:**
```typescript
console.error("Could not parse Claudish output");
console.error("Expected JSON format from: claudish --list-models --json");
console.warn("Falling back to embedded defaults");
return EMBEDDED_DEFAULT_MODELS;
```

### Error 4: Empty Model List

**Detection:**
```typescript
const data = JSON.parse(stdout);
if (!data.models || data.models.length === 0) {
  console.warn("No models returned from Claudish");
}
```

**Fallback:**
```typescript
console.warn("Claudish returned empty model list");
console.warn("Try: claudish --update-models (if available)");
console.warn("Falling back to embedded defaults");
return EMBEDDED_DEFAULT_MODELS;
```

### Error 5: Command Execution Failure

**Detection:**
```typescript
try {
  const { stdout } = await Bash("claudish --list-models --json");
} catch (error) {
  console.error("Failed to execute Claudish:", error.message);
}
```

**Fallback:**
```typescript
console.error("Could not execute: claudish --list-models --json");
console.error(`Error: ${error.message}`);
console.warn("Falling back to embedded defaults");
return EMBEDDED_DEFAULT_MODELS;
```

## Best Practices

### 1. Always Provide Embedded Defaults

**Why:** Graceful degradation when Claudish unavailable

**How:**
```typescript
const EMBEDDED_DEFAULT_MODELS = [
  // Minimum viable model list
  { id: "x-ai/grok-code-fast-1", name: "Grok", category: "coding" },
  { id: "google/gemini-2.5-flash", name: "Gemini", category: "reasoning" },
  { id: "openai/gpt-5.1-codex", name: "GPT-5 Codex", category: "reasoning" }
];
```

### 2. Check Version Before Using JSON

**Why:** Avoid errors with old Claudish versions

**How:**
```typescript
const jsonSupported = await isClaudishJsonSupported();
if (!jsonSupported) {
  return EMBEDDED_DEFAULT_MODELS;
}
```

### 3. Support User Overrides

**Why:** Give users control over model selection

**How:**
```typescript
// Always check CLAUDE.md first
const userModels = await readUserOverrideFromClaudeMd();
if (userModels) return userModels;
```

### 4. Log Clear Error Messages

**Why:** Help users understand and fix issues

**How:**
```typescript
console.warn("Could not query Claudish, using embedded defaults");
console.warn("To fix: npm install -g claudish@latest");
```

### 5. Cache Results When Appropriate

**Why:** Avoid repeated Claudish queries in same session

**How:**
```typescript
let _cachedModels: Model[] | null = null;

async function getRecommendedModels() {
  if (_cachedModels) {
    return _cachedModels;
  }

  // Query Claudish...
  const models = await queryClaudish();

  _cachedModels = models;
  return models;
}
```

### 6. Use Category Filtering

**Why:** Get relevant models only, faster response

**How:**
```typescript
// Get coding models only (don't filter manually)
const { stdout } = await Bash("claudish --list-models --category=coding --json");
const models = JSON.parse(stdout).models;
// All models are already filtered to category === "coding"
```

## Anti-Patterns (Avoid These)

### ❌ Don't Parse Text Output

**Wrong:**
```typescript
// Parsing text output is fragile and error-prone
const { stdout } = await Bash("claudish --list-models");
const lines = stdout.split("\n");
// ... complex parsing logic ...
```

**Right:**
```typescript
// Use JSON output instead
const { stdout } = await Bash("claudish --list-models --json");
const models = JSON.parse(stdout).models;
```

### ❌ Don't Assume Claudish is Installed

**Wrong:**
```typescript
// No error handling - will crash if Claudish not found
const { stdout } = await Bash("claudish --list-models --json");
const models = JSON.parse(stdout).models;
```

**Right:**
```typescript
// Graceful fallback
try {
  const { stdout } = await Bash("claudish --list-models --json");
  return JSON.parse(stdout).models;
} catch {
  return EMBEDDED_DEFAULT_MODELS;
}
```

### ❌ Don't Maintain Duplicate Model Lists

**Wrong:**
```typescript
// Hardcoded list that duplicates Claudish data
const MODELS = [
  "x-ai/grok-code-fast-1",
  "minimax/minimax-m2",
  "google/gemini-2.5-flash",
  // ... 20 more models ...
];
```

**Right:**
```typescript
// Query Claudish dynamically, with minimal embedded fallback
const models = await getRecommendedModels(); // Queries Claudish
// EMBEDDED_DEFAULT_MODELS is minimal (3-5 models max)
```

### ❌ Don't Ignore Version Compatibility

**Wrong:**
```typescript
// Assumes --json flag exists (added in v1.2.0)
const { stdout } = await Bash("claudish --list-models --json");
```

**Right:**
```typescript
// Check version first
const jsonSupported = await isClaudishJsonSupported();
if (!jsonSupported) {
  return EMBEDDED_DEFAULT_MODELS;
}
const { stdout } = await Bash("claudish --list-models --json");
```

### ❌ Don't Filter After Fetching

**Wrong:**
```typescript
// Get all models, then filter manually (inefficient)
const { stdout } = await Bash("claudish --list-models --json");
const allModels = JSON.parse(stdout).models;
const codingModels = allModels.filter(m => m.category === "coding");
```

**Right:**
```typescript
// Let Claudish filter (more efficient)
const { stdout } = await Bash("claudish --list-models --category=coding --json");
const codingModels = JSON.parse(stdout).models;
```

## Testing Your Integration

### Unit Test Example

```typescript
import { describe, it, expect } from "bun:test";

describe("Claudish Integration", () => {
  it("should query Claudish and parse JSON", async () => {
    const models = await getRecommendedModels();

    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);

    const model = models[0];
    expect(model).toHaveProperty("id");
    expect(model).toHaveProperty("name");
    expect(model).toHaveProperty("category");
  });

  it("should fall back to embedded defaults if Claudish fails", async () => {
    // Mock Bash to throw error
    const originalBash = global.Bash;
    global.Bash = async () => { throw new Error("Command not found"); };

    const models = await getRecommendedModels();

    expect(models).toEqual(EMBEDDED_DEFAULT_MODELS);

    // Restore
    global.Bash = originalBash;
  });

  it("should filter by category", async () => {
    const models = await getRecommendedModelsByCategory("coding");

    expect(models.every(m => m.category === "coding")).toBe(true);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from "bun:test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

describe("Claudish CLI Integration", () => {
  it("should execute claudish --list-models --json", async () => {
    const { stdout } = await execAsync("claudish --list-models --json");
    const data = JSON.parse(stdout);

    expect(data).toHaveProperty("models");
    expect(data.models.length).toBeGreaterThan(0);
  });

  it("should filter by category via CLI", async () => {
    const { stdout } = await execAsync("claudish --list-models --category=coding --json");
    const data = JSON.parse(stdout);

    expect(data.models.every(m => m.category === "coding")).toBe(true);
  });
});
```

## Migration from Old Patterns

### Before (Embedded Model Lists)

```typescript
// Old pattern: Hardcoded model list
const REVIEW_MODELS = [
  "x-ai/grok-code-fast-1",
  "google/gemini-2.5-flash",
  "openai/gpt-5.1-codex"
];

function getModelsForReview() {
  return REVIEW_MODELS;
}
```

### After (Claudish Integration)

```typescript
// New pattern: Query Claudish dynamically
const EMBEDDED_DEFAULT_MODELS = [
  { id: "x-ai/grok-code-fast-1", name: "Grok", category: "coding" },
  { id: "google/gemini-2.5-flash", name: "Gemini", category: "reasoning" }
];

async function getModelsForReview() {
  // 1. User override
  const userModels = await readUserOverrideFromClaudeMd();
  if (userModels) return userModels;

  // 2. Claudish query
  try {
    const { stdout } = await Bash("claudish --list-models --category=coding --json");
    return JSON.parse(stdout).models;
  } catch {
    // 3. Fallback
    return EMBEDDED_DEFAULT_MODELS;
  }
}
```

**Benefits:**
- ✅ Dynamic updates (no code changes needed)
- ✅ User overrides supported
- ✅ Graceful fallback
- ✅ Single source of truth (Claudish)

## References

**Related Documents:**
- `ai-docs/CLAUDISH_INTEGRATION_ARCHITECTURE.md` - Overall architecture
- `ai-docs/CLAUDISH_ENHANCEMENT_PROPOSAL.md` - Claudish feature spec
- `mcp/claudish/README.md` - Claudish documentation

**Claudish Version Requirements:**
- JSON output: Claudish v1.2.0+
- Category filtering: Claudish v1.2.0+
- Text output: All versions

**External Resources:**
- Claudish npm: https://www.npmjs.com/package/claudish
- OpenRouter: https://openrouter.ai
