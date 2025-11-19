# Claudish Enhancement Proposal

**Version:** 1.0.0
**Target Release:** Claudish v1.2.0
**Status:** Design Complete
**Date:** 2025-11-19

## Overview

This document proposes three new features for Claudish to make it the **single source of truth** for OpenRouter model management in the MAG Claude ecosystem. These enhancements enable Claude Code commands to dynamically query Claudish for model recommendations instead of maintaining duplicate model lists.

## Motivation

**Current Problem:**
- Model lists are duplicated across Claudish and Claude Code
- No dynamic updates - commands use static embedded lists
- `/update-models` command in Claude Code duplicates Claudish functionality
- No machine-readable output from Claudish

**Proposed Solution:**
- Claudish provides machine-readable model data via `--json` flag
- Claude Code commands query Claudish for recommendations
- Single source of truth: `recommended-models.json` in Claudish
- Simpler architecture with clear separation of concerns

## Feature 1: JSON Output for --list-models

### Specification

**Flag:** `--list-models --json`

**Purpose:** Output model list in machine-readable JSON format for programmatic consumption

**Current Behavior:**
```bash
claudish --list-models
# Output: Human-readable text
```

**New Behavior:**
```bash
claudish --list-models --json
# Output: JSON format (same as recommended-models.json)
```

### Output Format

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

### Implementation

**File:** `src/cli.ts`

**Changes:**

1. Update `printAvailableModels()` to accept JSON flag:

```typescript
/**
 * Print available models
 */
function printAvailableModels(jsonOutput = false): void {
  if (jsonOutput) {
    // Read and output recommended-models.json directly
    const jsonPath = join(__dirname, "../recommended-models.json");
    if (existsSync(jsonPath)) {
      const jsonContent = readFileSync(jsonPath, "utf-8");
      console.log(jsonContent);
    } else {
      // Fallback: construct JSON from MODEL_INFO
      const models = getAvailableModels();
      const modelInfo = loadModelInfo();

      const output = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString().split("T")[0],
        source: "build-time config",
        models: models
          .filter(m => m !== "custom")
          .map(m => ({
            id: m,
            name: modelInfo[m]?.name || m,
            description: modelInfo[m]?.description || "",
            provider: modelInfo[m]?.provider || "Unknown",
            category: "coding", // Default category
            priority: modelInfo[m]?.priority || 999,
            pricing: {
              input: "Unknown",
              output: "Unknown",
              average: "Unknown"
            },
            context: "Unknown",
            recommended: true
          }))
      };

      console.log(JSON.stringify(output, null, 2));
    }
    return;
  }

  // Existing text output logic...
  console.log("\nAvailable OpenRouter Models (in priority order):\n");

  const models = getAvailableModels();
  const modelInfo = loadModelInfo();

  for (const model of models) {
    const info = modelInfo[model];
    console.log(`  ${model}`);
    console.log(`    ${info.name} - ${info.description}`);
    console.log("");
  }

  console.log("Set default with: export CLAUDISH_MODEL=<model>");
  console.log("               or: export ANTHROPIC_MODEL=<model>");
  console.log("Or use: claudish --model <model> ...\n");
}
```

2. Update CLI parsing to detect `--json` flag:

```typescript
// In parseArgs()
} else if (arg === "--list-models") {
  // Check if next arg is --json
  const nextArg = args[i + 1];
  const jsonOutput = nextArg === "--json";
  if (jsonOutput) {
    i++; // Consume --json flag
  }

  printAvailableModels(jsonOutput);
  process.exit(0);
}
```

### Testing

**Test Cases:**

1. **JSON output format:**
```bash
claudish --list-models --json | jq '.models | length'
# Should output: 7 (or current model count)
```

2. **Valid JSON:**
```bash
claudish --list-models --json | jq '.'
# Should parse without errors
```

3. **Text output still works:**
```bash
claudish --list-models
# Should output text format (unchanged)
```

4. **Backwards compatibility:**
```bash
# Old usage should still work
claudish --list-models
```

### Documentation

**README.md Update:**

```markdown
### List Available Models

**Text Format (Human-Readable):**
```bash
claudish --list-models
```

**JSON Format (Machine-Readable):**
```bash
claudish --list-models --json
```

**Use Cases:**
- **Text**: Quick reference for humans
- **JSON**: Programmatic consumption by scripts and tools

**Example: Extract Model IDs**
```bash
claudish --list-models --json | jq -r '.models[].id'
```

**Example: Get Coding Models**
```bash
claudish --list-models --json | jq '.models[] | select(.category == "coding")'
```
```

## Feature 2: Category Filtering

### Specification

**Flag:** `--list-models --category=<category>`

**Purpose:** Filter models by category (coding, reasoning, vision, budget)

**Categories:**
- `coding` - Fast coding models (Grok, MiniMax)
- `reasoning` - Advanced reasoning models (GPT-5, Gemini)
- `vision` - Multimodal models (Qwen)
- `budget` - Free or low-cost models (Polaris)
- `all` - All models (default)

### Usage Examples

```bash
# Get coding models only
claudish --list-models --category=coding

# Get coding models in JSON format
claudish --list-models --category=coding --json

# Get all models (default)
claudish --list-models
```

### Output Examples

**Text Output:**
```
Available OpenRouter Models (category: coding):

  x-ai/grok-code-fast-1
    Grok Code Fast 1 - Ultra-fast agentic coding with visible reasoning traces

  minimax/minimax-m2
    MiniMax M2 - Compact high-efficiency model for end-to-end coding
```

**JSON Output:**
```json
{
  "version": "1.1.5",
  "lastUpdated": "2025-11-16",
  "source": "shared/recommended-models.md",
  "models": [
    {
      "id": "x-ai/grok-code-fast-1",
      "name": "Grok Code Fast 1",
      "description": "Ultra-fast agentic coding",
      "category": "coding",
      "priority": 1
    },
    {
      "id": "minimax/minimax-m2",
      "name": "MiniMax M2",
      "description": "Compact high-efficiency model",
      "category": "coding",
      "priority": 2
    }
  ]
}
```

### Implementation

**File:** `src/cli.ts`

**Changes:**

1. Update `printAvailableModels()` signature:

```typescript
/**
 * Print available models with optional filtering
 */
function printAvailableModels(options: {
  jsonOutput?: boolean;
  category?: string;
} = {}): void {
  const { jsonOutput = false, category = "all" } = options;

  const models = getAvailableModels();
  const modelInfo = loadModelInfo();

  // Filter by category (skip "custom" model in filtering)
  const filteredModels = category === "all"
    ? models
    : models.filter(m => {
        if (m === "custom") return false; // Exclude custom from category filters
        return modelInfo[m]?.category === category;
      });

  // Add "custom" back at the end if showing all
  const finalModels = category === "all"
    ? filteredModels
    : [...filteredModels, "custom"];

  if (jsonOutput) {
    const jsonPath = join(__dirname, "../recommended-models.json");

    if (existsSync(jsonPath)) {
      const data = JSON.parse(readFileSync(jsonPath, "utf-8"));

      // Filter models in JSON
      const filtered = {
        ...data,
        models: category === "all"
          ? data.models
          : data.models.filter(m => m.category === category)
      };

      console.log(JSON.stringify(filtered, null, 2));
    } else {
      // Fallback: construct filtered JSON from MODEL_INFO
      const output = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString().split("T")[0],
        source: "build-time config",
        models: finalModels
          .filter(m => m !== "custom")
          .map(m => ({
            id: m,
            name: modelInfo[m]?.name || m,
            description: modelInfo[m]?.description || "",
            provider: modelInfo[m]?.provider || "Unknown",
            category: modelInfo[m]?.category || "coding",
            priority: modelInfo[m]?.priority || 999,
            pricing: { input: "Unknown", output: "Unknown", average: "Unknown" },
            context: "Unknown",
            recommended: true
          }))
      };

      console.log(JSON.stringify(output, null, 2));
    }
    return;
  }

  // Text output with category label
  const label = category === "all"
    ? "in priority order"
    : `category: ${category}`;

  console.log(`\nAvailable OpenRouter Models (${label}):\n`);

  for (const model of finalModels) {
    const info = modelInfo[model];
    if (!info) continue;

    console.log(`  ${model}`);
    console.log(`    ${info.name} - ${info.description}`);
    console.log("");
  }

  console.log("Set default with: export CLAUDISH_MODEL=<model>");
  console.log("               or: export ANTHROPIC_MODEL=<model>");
  console.log("Or use: claudish --model <model> ...\n");
}
```

2. Update CLI parsing to handle `--category`:

```typescript
// In parseArgs()
} else if (arg === "--list-models") {
  const options: { jsonOutput?: boolean; category?: string } = {};

  // Look ahead for --json and --category flags
  let j = i + 1;
  while (j < args.length && args[j].startsWith("--")) {
    if (args[j] === "--json") {
      options.jsonOutput = true;
      j++;
    } else if (args[j].startsWith("--category=")) {
      const category = args[j].split("=")[1];
      const validCategories = ["coding", "reasoning", "vision", "budget", "all"];

      if (!validCategories.includes(category)) {
        console.error(`Invalid category: ${category}`);
        console.error(`Valid categories: ${validCategories.join(", ")}`);
        process.exit(1);
      }

      options.category = category;
      j++;
    } else {
      break; // Unknown flag, stop looking ahead
    }
  }

  printAvailableModels(options);
  process.exit(0);
}
```

### Update ModelMetadata Interface

**File:** `src/model-loader.ts`

**Changes:**

```typescript
interface ModelMetadata {
  name: string;
  description: string;
  priority: number;
  provider: string;
  category?: string; // Add category field (optional for backwards compatibility)
}
```

### Testing

**Test Cases:**

1. **Filter by coding:**
```bash
claudish --list-models --category=coding | grep -c "Grok\|MiniMax"
# Should output: 2 (or current coding model count)
```

2. **Filter by reasoning:**
```bash
claudish --list-models --category=reasoning | grep -c "GPT-5\|Gemini"
# Should output: 2+ (reasoning models)
```

3. **JSON + category:**
```bash
claudish --list-models --category=coding --json | jq '.models | length'
# Should output: 2 (coding models only)
```

4. **Invalid category:**
```bash
claudish --list-models --category=invalid
# Should output error and exit
```

5. **All models (default):**
```bash
claudish --list-models --category=all
# Should show all models
```

### Documentation

**README.md Update:**

```markdown
### Filter Models by Category

**Categories:**
- `coding` - Fast coding models (Grok, MiniMax)
- `reasoning` - Advanced reasoning models (GPT-5, Gemini)
- `vision` - Multimodal models (Qwen)
- `budget` - Free or low-cost models (Polaris)
- `all` - All models (default)

**Usage:**
```bash
# Get coding models only
claudish --list-models --category=coding

# Get coding models in JSON format
claudish --list-models --category=coding --json

# Get all models (default)
claudish --list-models
```

**Example: Find Best Budget Model**
```bash
claudish --list-models --category=budget --json | jq '.models[0].id'
```
```

## Feature 3: Update Models Command (OPTIONAL)

### Specification

**Flag:** `--update-models`

**Purpose:** Fetch latest model list from OpenRouter API and update `recommended-models.json`

**Status:** OPTIONAL - Manual updates via `shared/recommended-models.md` are sufficient for MVP

### Usage

```bash
# Update model list from OpenRouter API
claudish --update-models

# Output:
# Fetching models from OpenRouter API...
# Found 150 models
# Filtering to recommended models (7 selected)
# ✅ Model list updated successfully
# Updated: recommended-models.json
```

### Implementation Outline

**File:** `src/model-loader.ts`

```typescript
/**
 * Update models from OpenRouter API
 */
export async function updateModelsFromOpenRouter(): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY required to update models");
  }

  console.log("Fetching models from OpenRouter API...");

  // Fetch models from OpenRouter API
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`Found ${data.data.length} models`);

  // Filter to recommended models based on criteria
  const recommended = filterRecommendedModels(data.data);
  console.log(`Filtering to recommended models (${recommended.length} selected)`);

  // Update recommended-models.json
  const jsonPath = join(__dirname, "../recommended-models.json");
  const currentVersion = existsSync(jsonPath)
    ? JSON.parse(readFileSync(jsonPath, "utf-8")).version
    : "1.0.0";

  const updated = {
    version: bumpVersion(currentVersion), // Increment patch version
    lastUpdated: new Date().toISOString().split("T")[0],
    source: "OpenRouter API",
    models: recommended,
  };

  writeFileSync(jsonPath, JSON.stringify(updated, null, 2));

  // Clear cache
  _cachedModelInfo = null;
  _cachedModelIds = null;

  console.log("✅ Model list updated successfully");
  console.log(`Updated: ${jsonPath}`);
}

/**
 * Filter OpenRouter models to recommended subset
 */
function filterRecommendedModels(allModels: any[]): any[] {
  // Criteria for recommended models:
  // 1. Specific known-good models (Grok, GPT-5, Gemini, etc.)
  // 2. Categories: coding, reasoning, vision, budget
  // 3. Not deprecated or experimental (unless specifically desired)

  const recommendedIds = [
    "x-ai/grok-code-fast-1",
    "minimax/minimax-m2",
    "google/gemini-2.5-flash",
    "openrouter/polaris-alpha",
    "openai/gpt-5",
    "openai/gpt-5.1-codex",
    "qwen/qwen3-vl-235b-a22b-instruct",
  ];

  return allModels
    .filter(m => recommendedIds.includes(m.id))
    .map(m => ({
      id: m.id,
      name: m.name || m.id,
      description: m.description || "",
      provider: extractProvider(m.id),
      category: inferCategory(m),
      priority: recommendedIds.indexOf(m.id) + 1,
      pricing: {
        input: formatPrice(m.pricing?.input),
        output: formatPrice(m.pricing?.output),
        average: calculateAverage(m.pricing),
      },
      context: formatContext(m.context_length),
      recommended: true,
    }));
}

/**
 * Bump version (increment patch)
 */
function bumpVersion(version: string): string {
  const parts = version.split(".");
  const major = parseInt(parts[0] || "1");
  const minor = parseInt(parts[1] || "0");
  const patch = parseInt(parts[2] || "0");

  return `${major}.${minor}.${patch + 1}`;
}
```

**CLI Integration:**

```typescript
// In parseArgs()
} else if (arg === "--update-models") {
  try {
    await updateModelsFromOpenRouter();
    process.exit(0);
  } catch (error) {
    console.error("Error updating models:", error.message);
    process.exit(1);
  }
}
```

### Testing

**Test Cases:**

1. **API key required:**
```bash
unset OPENROUTER_API_KEY
claudish --update-models
# Should output: Error: OPENROUTER_API_KEY required
```

2. **Successful update:**
```bash
export OPENROUTER_API_KEY=sk-or-v1-...
claudish --update-models
# Should update recommended-models.json
```

3. **Version increment:**
```bash
# Before: version "1.1.5"
claudish --update-models
# After: version "1.1.6"
```

### Decision: Defer to v1.3.0

**Reasoning:**
- Manual updates via `shared/recommended-models.md` work well
- Adds complexity (API error handling, version bumping, filtering logic)
- Not critical for MVP integration with Claude Code
- Can be added in future release if needed

**Alternative:**
- Document manual update process in README
- Provide script in `scripts/update-models.sh` for maintainers

## Implementation Plan

### Phase 1: Core JSON Support (v1.2.0)

**Timeline:** Week 1

**Tasks:**
1. ✅ Add `--list-models --json` flag
2. ✅ Update `printAvailableModels()` function
3. ✅ Update CLI parsing
4. ✅ Add tests for JSON output
5. ✅ Update README.md
6. ✅ Release Claudish v1.2.0

**Files Modified:**
- `src/cli.ts` - Add JSON output logic
- `README.md` - Document new flag
- `package.json` - Bump to v1.2.0
- `CHANGELOG.md` - Add release notes

**Release Notes Template:**
```markdown
## v1.2.0 - JSON Output Support (2025-11-XX)

### New Features
- ✨ **JSON Output**: `claudish --list-models --json` for machine-readable model data
- ✨ **Programmatic Integration**: Enables Claude Code commands to query Claudish dynamically

### Changes
- Updated `--list-models` to support `--json` flag
- Outputs `recommended-models.json` content directly
- Backwards compatible (text output still default)

### Documentation
- Added JSON output examples to README
- Added integration guide for Claude Code
```

### Phase 2: Category Filtering (v1.2.0)

**Timeline:** Week 1 (same release as JSON support)

**Tasks:**
1. ✅ Add `--list-models --category=<category>` flag
2. ✅ Update `printAvailableModels()` to filter by category
3. ✅ Add category validation
4. ✅ Update tests
5. ✅ Update README.md

**Files Modified:**
- `src/cli.ts` - Add category filtering
- `src/model-loader.ts` - Add category field to interface
- `README.md` - Document category filtering
- `CHANGELOG.md` - Add to release notes

**Release Notes Addition:**
```markdown
- ✨ **Category Filtering**: `--list-models --category=coding` to filter by model category
- 📂 **Categories**: coding, reasoning, vision, budget, all
- 🔗 **Combined Flags**: `--list-models --category=coding --json` for filtered JSON
```

### Phase 3: Update Models Command (v1.3.0)

**Timeline:** Week 3-4 (OPTIONAL - defer to future release)

**Tasks:**
1. Add `--update-models` command
2. Implement OpenRouter API integration
3. Add model filtering logic
4. Add version bumping
5. Add tests
6. Update documentation

**Decision:** DEFER to v1.3.0 or later
- Not critical for MVP
- Manual updates sufficient for now
- Focus on core JSON/category features first

## Testing Strategy

### Unit Tests

**File:** `tests/cli.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

describe("CLI - JSON Output", () => {
  it("should output valid JSON with --list-models --json", async () => {
    const { stdout } = await execAsync("bun run src/index.ts --list-models --json");
    const data = JSON.parse(stdout);

    expect(data).toHaveProperty("version");
    expect(data).toHaveProperty("models");
    expect(Array.isArray(data.models)).toBe(true);
  });

  it("should include all required model fields", async () => {
    const { stdout } = await execAsync("bun run src/index.ts --list-models --json");
    const data = JSON.parse(stdout);

    const model = data.models[0];
    expect(model).toHaveProperty("id");
    expect(model).toHaveProperty("name");
    expect(model).toHaveProperty("description");
    expect(model).toHaveProperty("category");
    expect(model).toHaveProperty("priority");
  });
});

describe("CLI - Category Filtering", () => {
  it("should filter by coding category", async () => {
    const { stdout } = await execAsync(
      "bun run src/index.ts --list-models --category=coding --json"
    );
    const data = JSON.parse(stdout);

    expect(data.models.length).toBeGreaterThan(0);
    expect(data.models.every(m => m.category === "coding")).toBe(true);
  });

  it("should error on invalid category", async () => {
    try {
      await execAsync("bun run src/index.ts --list-models --category=invalid");
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.stderr).toContain("Invalid category");
    }
  });
});
```

### Integration Tests

**File:** `tests/integration.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

describe("Integration - Claude Code Querying Claudish", () => {
  it("should parse JSON output correctly", async () => {
    const { stdout } = await execAsync("claudish --list-models --json");
    const data = JSON.parse(stdout);

    // Simulate Claude Code parsing
    const modelIds = data.models.map(m => m.id);
    expect(modelIds.length).toBeGreaterThan(0);
    expect(modelIds[0]).toBe("x-ai/grok-code-fast-1");
  });

  it("should filter coding models for /review command", async () => {
    const { stdout } = await execAsync(
      "claudish --list-models --category=coding --json"
    );
    const data = JSON.parse(stdout);

    // Simulate /review command selecting coding models
    const codingModels = data.models.filter(m => m.category === "coding");
    expect(codingModels.length).toBeGreaterThan(0);
  });
});
```

### Manual Testing Checklist

**Before Release:**

- [ ] `claudish --list-models --json` outputs valid JSON
- [ ] `claudish --list-models` still shows text (backwards compatible)
- [ ] `claudish --list-models --category=coding` filters correctly
- [ ] `claudish --list-models --category=coding --json` combines flags
- [ ] Invalid category shows error message
- [ ] JSON can be piped to `jq` without errors
- [ ] Claude Code can parse output (test with dummy script)
- [ ] README examples work as documented
- [ ] Help text (`claudish --help`) updated with new flags

## Documentation Updates

### README.md

**New Section: Machine-Readable Output**

```markdown
## Machine-Readable Output

Claudish supports JSON output for programmatic integration with scripts and tools.

### JSON Output

Get model list in JSON format:

```bash
claudish --list-models --json
```

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
      "description": "Ultra-fast agentic coding",
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

### Category Filtering

Filter models by category:

```bash
# Coding models only
claudish --list-models --category=coding

# Reasoning models only
claudish --list-models --category=reasoning

# Vision models only
claudish --list-models --category=vision

# Budget models only
claudish --list-models --category=budget

# Combined with JSON
claudish --list-models --category=coding --json
```

**Categories:**
- `coding` - Fast coding models (Grok, MiniMax)
- `reasoning` - Advanced reasoning models (GPT-5, Gemini)
- `vision` - Multimodal models (Qwen)
- `budget` - Free or low-cost models (Polaris)
- `all` - All models (default)

### Examples

**Extract Model IDs:**
```bash
claudish --list-models --json | jq -r '.models[].id'
```

**Get Best Coding Model:**
```bash
claudish --list-models --category=coding --json | jq -r '.models[0].id'
```

**Count Models by Category:**
```bash
claudish --list-models --json | jq '.models | group_by(.category) | map({category: .[0].category, count: length})'
```

**Find Free Models:**
```bash
claudish --list-models --category=budget --json | jq '.models[] | select(.pricing.input == "FREE")'
```
```

### Help Text Update

**File:** `src/cli.ts` - `printHelp()`

```typescript
console.log(`
OPTIONS:
  ...
  --list-models            List available OpenRouter models
  --list-models --json     List models in JSON format (machine-readable)
  --list-models --category=<category>
                           Filter by category (coding, reasoning, vision, budget, all)
  --version                Show version information
  -h, --help               Show this help message
  ...

EXAMPLES:
  ...

  # List models in JSON format
  claudish --list-models --json

  # Filter coding models
  claudish --list-models --category=coding

  # Combined filtering and JSON
  claudish --list-models --category=coding --json
`);
```

## Backwards Compatibility

**Guaranteed:**
- ✅ `claudish --list-models` (text output) - unchanged
- ✅ All existing flags and behaviors - unchanged
- ✅ Model selection in interactive mode - unchanged
- ✅ `recommended-models.json` format - backwards compatible (added fields optional)

**New Features (Opt-In):**
- ✅ `--list-models --json` - new flag, doesn't affect existing usage
- ✅ `--list-models --category=<category>` - new flag, doesn't affect existing usage

**Migration:**
- No migration needed - all changes are additive
- Existing scripts and workflows continue to work
- New features available immediately upon upgrade

## Success Criteria

**After implementation:**

1. ✅ `claudish --list-models --json` outputs valid, parseable JSON
2. ✅ `claudish --list-models --category=coding` filters correctly
3. ✅ Combined flags work: `--category=coding --json`
4. ✅ Invalid category shows helpful error message
5. ✅ Text output (default) unchanged and backwards compatible
6. ✅ JSON output matches `recommended-models.json` format
7. ✅ All tests pass (unit + integration)
8. ✅ README updated with examples
9. ✅ Help text updated
10. ✅ CHANGELOG updated
11. ✅ Released as Claudish v1.2.0
12. ✅ Claude Code can successfully parse output (verified with test script)

## Next Steps

1. **Implement Feature 1 (JSON Output)**
   - Update `src/cli.ts`
   - Add tests
   - Update docs

2. **Implement Feature 2 (Category Filtering)**
   - Update `src/cli.ts`
   - Add category validation
   - Add tests
   - Update docs

3. **Test Integration**
   - Create test script to simulate Claude Code querying Claudish
   - Verify JSON parsing works
   - Test error handling

4. **Release v1.2.0**
   - Bump version in `package.json`
   - Update `CHANGELOG.md`
   - Create git tag
   - Publish to npm

5. **Update Claude Code**
   - Create `skills/claudish-integration/SKILL.md`
   - Update `/review` command to use Claudish
   - Test end-to-end integration

## References

**Related Documents:**
- `ai-docs/CLAUDISH_INTEGRATION_ARCHITECTURE.md` - Overall architecture
- `mcp/claudish/README.md` - Claudish documentation
- `mcp/claudish/src/cli.ts` - CLI implementation
- `mcp/claudish/src/model-loader.ts` - Model loading logic
- `mcp/claudish/recommended-models.json` - Model data

**External Resources:**
- OpenRouter API: https://openrouter.ai/docs
- OpenRouter Models: https://openrouter.ai/models
- Bun Testing: https://bun.sh/docs/cli/test
