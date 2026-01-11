#!/usr/bin/env bun
/**
 * =============================================================================
 * UNIFIED HOOK HANDLER - TypeScript replacement for bash scripts (v2.0.0)
 * =============================================================================
 * Handles all Claude Code hook events for the code-analysis plugin.
 * Replaces: session-start.sh, intercept-*.sh, auto-reindex.sh
 *
 * v2.0.0 Changes:
 * - Imperative blocking messages with visual templates
 * - Evasion tracking for workaround detection
 * - Chained blocking (Grep blocked -> Glob/Read/Bash also blocked)
 * - Bulk read detection and blocking
 *
 * Usage: bun handler.ts < stdin.json
 * Output: JSON to fd 3 (or stdout if fd 3 not available)
 * =============================================================================
 */

import { spawn, spawnSync } from "child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  rmSync,
} from "fs";
import { join, extname } from "path";

// Import state management
import {
  loadState,
  saveState,
  recordBlock,
  checkForEvasion,
  trackRead,
  recordEvasionAttempt,
  isCodeSearchGlobPattern,
  extractConceptFromGlob,
  inferConceptFromFiles,
  type HookState,
} from "./state";

// =============================================================================
// BYPASS HELPER
// =============================================================================

/**
 * Check if tool input has explicit bypass flags.
 * Power users can add these flags to skip claudemem enforcement.
 */
function shouldBypass(toolInput: Record<string, unknown> | undefined): boolean {
  if (!toolInput) return false;
  return (
    toolInput._bypass_claudemem === true ||
    toolInput._native === true ||
    toolInput._no_claudemem === true
  );
}

// =============================================================================
// TYPES
// =============================================================================

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: "default" | "plan" | "bypasspermissions";
  hook_event_name: "SessionStart" | "PreToolUse" | "PostToolUse" | "Stop";
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: Record<string, unknown>;
  tool_use_id?: string;
}

interface HookOutput {
  additionalContext?: string;
  hookSpecificOutput?: {
    hookEventName: "PreToolUse";
    permissionDecision: "allow" | "deny";
    permissionDecisionReason?: string;
  };
}

// =============================================================================
// UTILITIES
// =============================================================================

function runCommand(cmd: string, args: string[], cwd?: string): string | null {
  try {
    const result = spawnSync(cmd, args, {
      cwd,
      encoding: "utf-8",
      timeout: 10000,
    });
    if (result.status === 0) {
      return result.stdout?.trim() || null;
    }
    return null;
  } catch {
    return null;
  }
}

function getClaudememVersion(): string | null {
  const output = runCommand("claudemem", ["--version"]);
  if (!output) return null;
  const match = output.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function isIndexed(cwd: string): { indexed: boolean; symbolCount?: string } {
  const status = runCommand("claudemem", ["status"], cwd);
  if (!status) return { indexed: false };

  const match = status.match(/(\d+)\s+(chunks|symbols)/);
  if (match) {
    return { indexed: true, symbolCount: match[0] };
  }
  return { indexed: false };
}

function versionGte(version: string, required: string): boolean {
  const v1 = version.split(".").map(Number);
  const v2 = required.split(".").map(Number);

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const a = v1[i] || 0;
    const b = v2[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

// =============================================================================
// SESSION START HANDLER
// =============================================================================

async function handleSessionStart(input: HookInput): Promise<HookOutput> {
  // Clean up old session directories (TTL: 24 hours)
  const tmpDir = "/tmp";
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  try {
    const entries = readdirSync(tmpDir);
    for (const entry of entries) {
      if (
        entry.startsWith("analysis-") ||
        entry.startsWith("review-") ||
        entry.startsWith("plan-review-") ||
        entry.startsWith("hook-state-")
      ) {
        const fullPath = join(tmpDir, entry);
        try {
          const stat = statSync(fullPath);
          // For hook-state files, use shorter TTL
          const ttl = entry.startsWith("hook-state-")
            ? 30 * 60 * 1000
            : 24 * 60 * 60 * 1000;
          const cutoff = Date.now() - ttl;
          if (
            (stat.isDirectory() && stat.mtimeMs < oneDayAgo) ||
            (stat.isFile() && stat.mtimeMs < cutoff)
          ) {
            rmSync(fullPath, { recursive: true, force: true });
          }
        } catch {
          // Ignore errors on individual entries
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }

  // Check claudemem installation
  const version = getClaudememVersion();
  if (!version) {
    return {
      additionalContext: `**claudemem not installed**

The code-analysis plugin uses AST structural analysis. Install with:
\`\`\`bash
npm install -g claude-codemem
claudemem init       # Configure API key
claudemem index      # Build AST index
\`\`\`

Until indexed, Grep/Glob will work normally.`,
    };
  }

  // Check version requirements
  if (!versionGte(version, "0.3.0")) {
    return {
      additionalContext: `**claudemem update required**

Current: v${version}
Required: v0.3.0+

Update with:
\`\`\`bash
npm install -g claude-codemem@latest
claudemem index  # Rebuild index for AST features
\`\`\``,
    };
  }

  // Check index status
  const status = isIndexed(input.cwd);

  // Build feature message
  const hasV4 = versionGte(version, "0.4.0");
  const featureMsg = hasV4
    ? `**claudemem v${version}** (v0.4.0+ features available)

Available commands:
- **v0.3.0**: \`map\`, \`symbol\`, \`callers\`, \`callees\`, \`context\`, \`search\`
- **v0.4.0**: \`dead-code\`, \`test-gaps\`, \`impact\``
    : `**claudemem v${version}** (v0.3.0)

Available commands: \`map\`, \`symbol\`, \`callers\`, \`callees\`, \`context\`, \`search\`

**Upgrade to v0.4.0+ for:** \`dead-code\`, \`test-gaps\`, \`impact\``;

  if (!status.indexed) {
    return {
      additionalContext: `${featureMsg}

**Not indexed for this project**

Run \`claudemem index\` to enable AST analysis.`,
    };
  }

  return {
    additionalContext: `${featureMsg}

AST index: ${status.symbolCount}

**ENFORCEMENT ACTIVE**: Grep/rg/find intercepted and blocked. Workaround tools (Glob, bulk Read, Bash search) are also tracked.`,
  };
}

// =============================================================================
// GREP INTERCEPT HANDLER (Updated with imperative blocking)
// =============================================================================

async function handleGrepIntercept(
  input: HookInput
): Promise<HookOutput | null> {
  const pattern = input.tool_input?.pattern as string;
  if (!pattern) return null;

  // Check for explicit bypass
  if (shouldBypass(input.tool_input)) {
    return {
      additionalContext: `[Bypass flag set - using native Grep]`,
    };
  }

  // Load state for evasion tracking
  const state = loadState(input.session_id);

  // Check if indexed
  const status = isIndexed(input.cwd);
  if (!status.indexed) {
    return {
      additionalContext: `**claudemem not indexed** - Grep allowed as fallback.

For AST structural analysis, run:
\`\`\`bash
claudemem index
\`\`\``,
    };
  }

  // Determine best command based on pattern
  let results: string | null = null;
  let commandUsed = "map";

  // If pattern looks like a symbol name, try symbol lookup first
  if (/^[A-Z][a-zA-Z0-9]*$|^[a-z][a-zA-Z0-9]*$|^[a-z_]+$/.test(pattern)) {
    results = runCommand(
      "claudemem",
      ["--agent", "symbol", pattern],
      input.cwd
    );
    if (results && results !== "No results found") {
      commandUsed = "symbol";
    } else {
      results = null;
    }
  }

  // Fallback to map
  if (!results) {
    results =
      runCommand("claudemem", ["--agent", "map", pattern], input.cwd) ||
      "No results found";
    commandUsed = "map";
  }

  // Record this block for evasion detection
  recordBlock(
    state,
    "Grep",
    pattern,
    "claudemem indexed - native search disabled",
    ["Glob", "Read", "Bash"] // Forbidden alternatives
  );

  // Truncate results for preview
  const resultsPreview =
    results.length > 800 ? results.substring(0, 800) + "\n... (truncated)" : results;

  return {
    additionalContext: `## SEARCH RESULTS (claudemem)

\`\`\`
${resultsPreview}
\`\`\`

**Task complete.** Results above answer query "${pattern}".

For different queries: \`claudemem --agent map "query"\``,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `Grep completed via claudemem. Results provided.`,
    },
  };
}

// =============================================================================
// GLOB INTERCEPT HANDLER (Updated - Now Blocks Code Search Patterns)
// =============================================================================

async function handleGlobIntercept(
  input: HookInput
): Promise<HookOutput | null> {
  const pattern = input.tool_input?.pattern as string;
  if (!pattern) return null;

  // Check for explicit bypass
  if (shouldBypass(input.tool_input)) {
    return {
      additionalContext: `[Bypass flag set - using native Glob]`,
    };
  }

  // Load state
  const state = loadState(input.session_id);

  // Check for evasion first
  const evasion = checkForEvasion(state, "Glob");
  if (evasion.isEvasion && evasion.originalBlock) {
    recordEvasionAttempt(state, evasion.pattern!);

    // Re-run claudemem with original query to provide results
    const results =
      runCommand("claudemem", ["--agent", "map", evasion.originalBlock.pattern], input.cwd) ||
      "No results found";

    // Truncate results for preview
    const resultsPreview =
      results.length > 800 ? results.substring(0, 800) + "\n... (truncated)" : results;

    return {
      additionalContext: `## SEARCH RESULTS (claudemem)

\`\`\`
${resultsPreview}
\`\`\`

**Task complete.** Results above answer query "${evasion.originalBlock.pattern}".

For different queries: \`claudemem --agent map "query"\``,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Glob completed via claudemem. Results provided.`,
      },
    };
  }

  // Check if indexed
  const status = isIndexed(input.cwd);
  if (!status.indexed) {
    return {
      additionalContext: `**Glob used** - Consider claudemem for semantic search:
\`\`\`bash
claudemem index  # First time only
claudemem --agent map "your query"
\`\`\``,
    };
  }

  // Check if this is a code search pattern
  if (isCodeSearchGlobPattern(pattern)) {
    const concept = extractConceptFromGlob(pattern);

    // Record block
    recordBlock(state, "Glob", pattern, "code search pattern detected", [
      "Read",
      "Bash",
    ]);

    // Run claudemem to provide results
    const results =
      runCommand("claudemem", ["--agent", "map", concept], input.cwd) ||
      "No results found";

    // Truncate results for preview
    const resultsPreview =
      results.length > 800 ? results.substring(0, 800) + "\n... (truncated)" : results;

    return {
      additionalContext: `## SEARCH RESULTS (claudemem)

\`\`\`
${resultsPreview}
\`\`\`

**Task complete.** Results above answer query "${concept}".

For different queries: \`claudemem --agent map "query"\``,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Glob completed via claudemem. Results provided.`,
      },
    };
  }

  // Non-code-search glob patterns are allowed with a tip
  return {
    additionalContext: `**Tip:** For semantic code search, use claudemem:
\`\`\`bash
claudemem --agent map "component"   # Find by concept
claudemem --agent symbol "Button"   # Find by name
\`\`\``,
  };
}

// =============================================================================
// READ INTERCEPT HANDLER (Updated - Tracks Bulk Reads)
// =============================================================================

async function handleReadIntercept(
  input: HookInput
): Promise<HookOutput | null> {
  const filePath = input.tool_input?.file_path as string;
  if (!filePath) return null;

  // Check for explicit bypass
  if (shouldBypass(input.tool_input)) {
    return null; // Allow native read
  }

  // Load state
  const state = loadState(input.session_id);

  // Track reads first (needed for evasion check threshold)
  const readInfo = trackRead(state, filePath);

  // Check for evasion (only triggers if 5+ reads due to state.ts threshold)
  const evasion = checkForEvasion(state, "Read");
  if (evasion.isEvasion && evasion.originalBlock && readInfo.readCount >= 5) {
    recordEvasionAttempt(state, evasion.pattern!);

    // Run claudemem with original query to provide results
    const results =
      runCommand("claudemem", ["--agent", "map", evasion.originalBlock.pattern], input.cwd) ||
      "No results found";

    // Truncate results for preview
    const resultsPreview =
      results.length > 800 ? results.substring(0, 800) + "\n... (truncated)" : results;

    return {
      additionalContext: `## SEARCH RESULTS (claudemem)

\`\`\`
${resultsPreview}
\`\`\`

**Task complete.** Results above answer query "${evasion.originalBlock.pattern}".

For different queries: \`claudemem --agent map "query"\``,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Bulk read completed via claudemem. Results provided.`,
      },
    };
  }

  // Check if indexed (only relevant for blocking)
  const status = isIndexed(input.cwd);
  if (!status.indexed) {
    return null; // No blocking if not indexed
  }

  // Only block at 5+ reads (no 3-file warning)
  if (readInfo.readCount >= 5) {
    const concept = inferConceptFromFiles(readInfo.files);

    // Run claudemem to provide results
    const results =
      runCommand("claudemem", ["--agent", "map", concept], input.cwd) ||
      "No results found";

    // Truncate results for preview
    const resultsPreview =
      results.length > 800 ? results.substring(0, 800) + "\n... (truncated)" : results;

    return {
      additionalContext: `## SEARCH RESULTS (claudemem)

\`\`\`
${resultsPreview}
\`\`\`

**Task complete.** Results above answer query "${concept}".

For different queries: \`claudemem --agent map "query"\``,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Bulk read completed via claudemem. Results provided.`,
      },
    };
  }

  return null; // Allow individual reads (no warnings)
}

// =============================================================================
// BASH INTERCEPT HANDLER (Updated with evasion detection)
// =============================================================================

async function handleBashIntercept(
  input: HookInput
): Promise<HookOutput | null> {
  const command = input.tool_input?.command as string;
  if (!command) return null;

  // Check for explicit bypass
  if (shouldBypass(input.tool_input)) {
    return {
      additionalContext: `[Bypass flag set - using native Bash]`,
    };
  }

  // Load state
  const state = loadState(input.session_id);

  // Check for evasion
  const evasion = checkForEvasion(state, "Bash");

  // Check if command contains grep/find/rg
  const searchPatterns = [
    /\bgrep\b/,
    /\brg\b/,
    /\bfind\s+.*-name\b/,
    /\bfind\s+.*-iname\b/,
    /\bag\b/,
    /\back\b/,
  ];

  const isSearchCommand = searchPatterns.some((p) => p.test(command));

  // If evasion detected and search command, block
  if (evasion.isEvasion && evasion.originalBlock && isSearchCommand) {
    recordEvasionAttempt(state, evasion.pattern!);

    // Re-run claudemem with original query to provide results
    const results =
      runCommand("claudemem", ["--agent", "map", evasion.originalBlock.pattern], input.cwd) ||
      "No results found";

    // Truncate results for preview
    const resultsPreview =
      results.length > 800 ? results.substring(0, 800) + "\n... (truncated)" : results;

    return {
      additionalContext: `## SEARCH RESULTS (claudemem)

\`\`\`
${resultsPreview}
\`\`\`

**Task complete.** Results above answer query "${evasion.originalBlock.pattern}".

For different queries: \`claudemem --agent map "query"\``,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Bash search completed via claudemem. Results provided.`,
      },
    };
  }

  // Non-evasion case: Check for search commands normally
  if (!isSearchCommand) return null;

  // Check if indexed
  const status = isIndexed(input.cwd);
  if (!status.indexed) {
    return {
      additionalContext: `**Search command detected but claudemem not indexed**

Command: \`${command}\`

For AST structural analysis, run \`claudemem index\` first.
Allowing command as fallback.`,
    };
  }

  // Extract search pattern from command
  const grepMatch = command.match(
    /(?:grep|rg|ag|ack)\s+(?:-[^\s]+\s+)*['""]?([^'""\s|>]+)['""]?/
  );
  const findMatch = command.match(/-i?name\s+['""]?\*?([^'""\s*]+)/);
  const pattern = grepMatch?.[1] || findMatch?.[1];

  if (!pattern) {
    return {
      additionalContext: `**Search command detected** - Consider using claudemem instead:
\`\`\`bash
claudemem --agent map "your query"\`\`\``,
    };
  }

  // Run claudemem instead
  const results =
    runCommand("claudemem", ["--agent", "map", pattern], input.cwd) ||
    "No results found";

  // Record block
  recordBlock(
    state,
    "Bash",
    pattern,
    "bash search command replaced with claudemem",
    ["Glob", "Read"]
  );

  // Truncate results for preview
  const resultsPreviewBash =
    results.length > 800 ? results.substring(0, 800) + "\n... (truncated)" : results;

  return {
    additionalContext: `## SEARCH RESULTS (claudemem)

\`\`\`
${resultsPreviewBash}
\`\`\`

**Task complete.** Results above answer query "${pattern}".

For different queries: \`claudemem --agent map "query"\``,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `Bash search completed via claudemem. Results provided.`,
    },
  };
}

// =============================================================================
// TASK INTERCEPT HANDLER (Explore Agent Replacement)
// =============================================================================

async function handleTaskIntercept(
  input: HookInput
): Promise<HookOutput | null> {
  // Type guard check
  if (!input.tool_input || typeof input.tool_input !== "object") return null;

  // Check for explicit bypass
  if (shouldBypass(input.tool_input)) {
    return {
      additionalContext: `[Bypass flag set - using native Task]`,
    };
  }

  const toolInput = input.tool_input as {
    subagent_type?: string;
    prompt?: string;
    description?: string;
  };

  const subagentType = toolInput.subagent_type;

  // Only intercept the built-in Explore agent
  // Case-insensitive check with trim to handle potential variations
  if (!subagentType || subagentType.trim().toLowerCase() !== "explore") {
    return null; // Allow all other Task calls to proceed
  }

  // Load state for evasion tracking
  const state = loadState(input.session_id);

  // Check if claudemem is indexed for this project
  const status = isIndexed(input.cwd);

  if (!status.indexed) {
    // If not indexed, allow Explore but suggest indexing
    return {
      additionalContext: `**Explore agent bypassing AST analysis** - claudemem not indexed.

For structural code navigation with PageRank ranking, run:
\`\`\`bash
claudemem index
\`\`\`

Then use \`code-analysis:detective\` agent instead of Explore.`,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason:
          "claudemem not indexed - Explore allowed as fallback",
      },
    };
  }

  // Record block for evasion tracking
  recordBlock(
    state,
    "Explore",
    toolInput.prompt || toolInput.description || "explore",
    "claudemem indexed - Explore replaced with detective",
    ["Glob", "Read", "Grep", "Bash"]
  );

  // Extract the search intent from the prompt
  const prompt = toolInput.prompt || "";
  const description = toolInput.description || "";
  const searchContext = prompt || description;

  // Run claudemem map to provide structural overview (with short timeout)
  let mapResults: string | null = null;
  if (searchContext) {
    // Extract potential keywords from the prompt
    const keywords = extractSearchKeywords(searchContext);
    if (keywords) {
      try {
        // Use shorter timeout (3s) for preview
        mapResults = runCommand(
          "claudemem",
          ["--agent", "map", keywords],
          input.cwd
        );
      } catch {
        mapResults =
          "(claudemem preview unavailable - try 'claudemem index' to rebuild)";
      }
    }
  }

  // Build helpful context for the redirect
  const structuralOverview = mapResults
    ? `\n**Structural Overview** (from claudemem map):\n${mapResults}\n`
    : "";

  return {
    additionalContext: `
==============================================================================================
                    EXPLORE BLOCKED - USE DETECTIVE INSTEAD
==============================================================================================

  The Explore agent is BLOCKED. Use \`code-analysis:detective\` instead.

  The code-analysis plugin provides AST-based structural analysis with PageRank ranking,
  which is more effective than the built-in Explore agent's grep/find approach.
${structuralOverview}
  HOW TO USE:

  Task({
    subagent_type: "code-analysis:detective",
    prompt: "${escapeForTemplate(searchContext || "your search query")}",
    description: "Investigate codebase structure"
  })

  WHAT DETECTIVE PROVIDES:
  - AST structural analysis (not just text matching)
  - PageRank symbol importance ranking
  - Caller/callee dependency tracing
  - Semantic code navigation

  WORKAROUND TOOLS ARE ALSO BLOCKED:
  - Glob, Read (bulk), Grep, Bash search

==============================================================================================
`,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "Explore agent replaced with code-analysis:detective for AST structural analysis. See context above for how to use detective.",
    },
  };
}

// Helper: Extract search keywords from natural language prompt
function extractSearchKeywords(text: string): string | null {
  if (!text) return null;

  // Remove common question words and filler
  const cleaned = text
    .toLowerCase()
    .replace(
      /\b(find|search|look|locate|where|what|how|is|are|the|a|an|in|for|all|any)\b/g,
      " "
    )
    .replace(/[?!.,;:'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Return if we have meaningful keywords
  if (cleaned.length > 2) {
    return cleaned;
  }

  // Fall back to first 5 words of original
  const words = text.split(/\s+/).slice(0, 5).join(" ");
  return words.length > 2 ? words : null;
}

// Helper: Escape string for template literal display
function escapeForTemplate(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/"/g, '\\"')
    .substring(0, 200); // Limit length for display
}

// =============================================================================
// AUTO-REINDEX HANDLER
// =============================================================================

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".rb",
  ".java",
  ".kt",
  ".scala",
  ".swift",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".php",
  ".vue",
  ".svelte",
]);

const DEBOUNCE_SECONDS = 30;

async function handleAutoReindex(input: HookInput): Promise<HookOutput | null> {
  const filePath = (input.tool_response?.filePath ||
    input.tool_input?.file_path) as string;
  if (!filePath) return null;

  // Check if code file
  const ext = extname(filePath).toLowerCase();
  if (!CODE_EXTENSIONS.has(ext)) return null;

  // Check if project is indexed
  const indexDir = join(input.cwd, ".claudemem");
  if (!existsSync(indexDir)) return null;

  // Debounce check
  const debounceFile = join(indexDir, ".reindex-timestamp");
  const lockFile = join(indexDir, ".reindex-lock");

  if (existsSync(debounceFile)) {
    try {
      const lastReindex = parseInt(readFileSync(debounceFile, "utf-8"));
      const elapsed = Math.floor(Date.now() / 1000) - lastReindex;
      if (elapsed < DEBOUNCE_SECONDS) {
        return null; // Debounced
      }
    } catch {
      // Ignore read errors
    }
  }

  // Check lock file for running process
  if (existsSync(lockFile)) {
    try {
      const pid = parseInt(readFileSync(lockFile, "utf-8"));
      // Check if process is still running
      try {
        process.kill(pid, 0); // Throws if not running
        return null; // Still running
      } catch {
        // Process not running, remove stale lock
        rmSync(lockFile, { force: true });
      }
    } catch {
      // Ignore lock check errors
    }
  }

  // Update timestamp and spawn background reindex
  writeFileSync(debounceFile, Math.floor(Date.now() / 1000).toString());

  const child = spawn("claudemem", ["index", "--quiet"], {
    cwd: input.cwd,
    detached: true,
    stdio: "ignore",
  });

  // Write PID to lock file
  if (child.pid) {
    writeFileSync(lockFile, child.pid.toString());
  }

  child.unref();

  return null; // No context for background operation
}

// =============================================================================
// MAIN DISPATCHER
// =============================================================================

async function main() {
  // Read JSON from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const inputJson = Buffer.concat(chunks).toString("utf-8");
  if (!inputJson.trim()) {
    process.exit(0);
  }

  let input: HookInput;
  try {
    input = JSON.parse(inputJson);
  } catch (error) {
    console.error("Failed to parse hook input:", error);
    process.exit(2);
  }

  let output: HookOutput | null = null;

  try {
    switch (input.hook_event_name) {
      case "SessionStart":
        output = await handleSessionStart(input);
        break;

      case "PreToolUse":
        switch (input.tool_name) {
          case "Grep":
            output = await handleGrepIntercept(input);
            break;
          case "Bash":
            output = await handleBashIntercept(input);
            break;
          case "Glob":
            output = await handleGlobIntercept(input);
            break;
          case "Read":
            output = await handleReadIntercept(input);
            break;
          case "Task":
            output = await handleTaskIntercept(input);
            break;
        }
        break;

      case "PostToolUse":
        if (input.tool_name === "Write" || input.tool_name === "Edit") {
          output = await handleAutoReindex(input);
        }
        break;
    }
  } catch (error) {
    console.error("Hook handler error:", error);
    process.exit(2);
  }

  // Output result
  if (output) {
    // Try to write to fd 3 first (Claude Code's expected output)
    try {
      const fs = await import("fs");
      fs.writeFileSync(3, JSON.stringify(output));
    } catch {
      // Fall back to stdout
      console.log(JSON.stringify(output));
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Hook handler fatal error:", error);
  process.exit(2);
});
