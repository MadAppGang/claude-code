/**
 * =============================================================================
 * HOOK STATE MANAGEMENT - Evasion tracking for claudemem enforcement (v1.0.0)
 * =============================================================================
 * Manages state for detecting workaround patterns when tools are blocked.
 * State is stored in /tmp/ with session-based isolation.
 *
 * Used by: handler.ts
 * =============================================================================
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

// =============================================================================
// TYPES
// =============================================================================

export interface BlockRecord {
  tool: string;
  pattern: string;
  reason: string;
  timestamp: number;
  alternatives_forbidden: string[];
}

export interface HookState {
  session_id: string;
  created_at: number;
  last_updated: number;

  // Recent blocks (rolling window of last 5 blocks)
  recent_blocks: BlockRecord[];

  // Read tracking for bulk detection
  read_tracker: {
    files: string[];
    first_read_at: number;
    last_read_at: number;
  };

  // Evasion detection counters
  evasion_attempts: {
    count: number;
    patterns: string[]; // e.g., "Grep->Glob", "Grep->Read"
  };
}

export interface EvasionCheckResult {
  isEvasion: boolean;
  originalBlock?: BlockRecord;
  pattern?: string;
}

export interface ReadTrackResult {
  isBulk: boolean;
  readCount: number;
  files: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATE_DIR = "/tmp";
const STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const EVASION_WINDOW_MS = 60 * 1000; // 1 minute window
const BULK_WINDOW_MS = 60 * 1000; // 1 minute window for bulk read detection

// Glob patterns that indicate code search (should be blocked)
const CODE_SEARCH_GLOB_PATTERNS = [
  /\*\*\/\*\.(ts|tsx|js|jsx|py|go|rs|java|kt|swift)$/, // **/*.ts
  /\*\*\/\*[A-Z][a-z]+\*\.(ts|tsx|js|jsx)$/, // **/*Component*.tsx
  /src\/.*\*\*\/\*/, // src/**/*
  /\*\*\/(services|controllers|handlers|models|components|utils|hooks|lib)\//, // **/services/
  /\*\*\/\*\.(service|controller|handler|component|hook|util)\.(ts|tsx|js|jsx)$/, // **/*.service.ts
  /^(apps|packages|modules)\/.*\*\*\//, // monorepo patterns
  /\*\*\/\*\.(spec|test)\.(ts|tsx|js|jsx)$/, // test file patterns
  /\*\*\/\*\.\{ts,tsx\}$/, // brace expansion (escaped)
  /\*\*\/\*\.\{js,jsx\}$/, // brace expansion (escaped)
];

// =============================================================================
// STATE MANAGEMENT FUNCTIONS
// =============================================================================

function getStateFilePath(sessionId: string): string {
  return join(STATE_DIR, `hook-state-${sessionId}.json`);
}

export function loadState(sessionId: string): HookState {
  const path = getStateFilePath(sessionId);
  try {
    if (existsSync(path)) {
      const data = JSON.parse(readFileSync(path, "utf-8"));
      // Check TTL
      if (Date.now() - data.created_at < STATE_TTL_MS) {
        return data;
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Return fresh state
  return {
    session_id: sessionId,
    created_at: Date.now(),
    last_updated: Date.now(),
    recent_blocks: [],
    read_tracker: { files: [], first_read_at: 0, last_read_at: 0 },
    evasion_attempts: { count: 0, patterns: [] },
  };
}

export function saveState(state: HookState): void {
  state.last_updated = Date.now();
  const path = getStateFilePath(state.session_id);
  writeFileSync(path, JSON.stringify(state, null, 2));
}

export function recordBlock(
  state: HookState,
  tool: string,
  pattern: string,
  reason: string,
  forbidden: string[]
): void {
  state.recent_blocks.push({
    tool,
    pattern,
    reason,
    timestamp: Date.now(),
    alternatives_forbidden: forbidden,
  });

  // Keep only last 5 blocks
  if (state.recent_blocks.length > 5) {
    state.recent_blocks.shift();
  }

  saveState(state);
}

export function checkForEvasion(
  state: HookState,
  currentTool: string
): EvasionCheckResult {
  // Check if current tool is in any recent block's forbidden list
  const now = Date.now();

  for (const block of state.recent_blocks) {
    if (now - block.timestamp < EVASION_WINDOW_MS) {
      if (block.alternatives_forbidden.includes(currentTool)) {
        return {
          isEvasion: true,
          originalBlock: block,
          pattern: `${block.tool}->${currentTool}`,
        };
      }
    }
  }

  return { isEvasion: false };
}

export function trackRead(state: HookState, filePath: string): ReadTrackResult {
  const now = Date.now();

  // Reset tracker if window expired
  if (now - state.read_tracker.last_read_at > BULK_WINDOW_MS) {
    state.read_tracker = { files: [], first_read_at: now, last_read_at: now };
  }

  state.read_tracker.files.push(filePath);
  state.read_tracker.last_read_at = now;

  saveState(state);

  return {
    isBulk: state.read_tracker.files.length >= 3,
    readCount: state.read_tracker.files.length,
    files: state.read_tracker.files,
  };
}

export function recordEvasionAttempt(state: HookState, pattern: string): void {
  state.evasion_attempts.count++;
  state.evasion_attempts.patterns.push(pattern);
  saveState(state);
}

// =============================================================================
// PATTERN DETECTION HELPERS
// =============================================================================

export function isCodeSearchGlobPattern(pattern: string): boolean {
  return CODE_SEARCH_GLOB_PATTERNS.some((regex) => regex.test(pattern));
}

export function extractConceptFromGlob(pattern: string): string {
  // Extract meaningful parts from glob pattern
  const parts = pattern
    .replace(/\*\*/g, "")
    .replace(/\*/g, " ")
    .replace(/\.(ts|tsx|js|jsx|py|go|rs|java|kt|swift)$/g, "")
    .replace(/[\/\[\]{}()]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2);

  return parts.join(" ") || "code structure";
}

export function inferConceptFromFiles(files: string[]): string {
  // Extract common directory components and file names
  const dirs = new Set<string>();
  const names = new Set<string>();

  for (const file of files) {
    const parts = file.split("/");
    // Get parent directory name
    if (parts.length > 1) {
      dirs.add(parts[parts.length - 2]);
    }
    // Get filename without extension
    const name = parts[parts.length - 1].replace(
      /\.(ts|tsx|js|jsx|py|go|rs)$/,
      ""
    );
    names.add(name);
  }

  const concepts = [...dirs, ...names]
    .filter((s) => s.length > 2)
    .slice(0, 3);
  return concepts.join(" ") || "code structure";
}
