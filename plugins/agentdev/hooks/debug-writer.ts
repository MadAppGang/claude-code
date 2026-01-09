/**
 * Debug Event Writer Module
 *
 * Provides JSONL append-only writing for debug events.
 * Uses append-only writes for crash resilience and streaming output.
 *
 * @module debug-writer
 */

import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Debug event structure for JSONL output.
 */
export interface DebugEvent {
  event_id: string;
  correlation_id?: string | null;
  timestamp: string;
  type: string;
  data: Record<string, unknown>;
}

/**
 * Input type for appendDebugEvent (without auto-generated fields).
 */
export type DebugEventInput = Omit<DebugEvent, 'event_id' | 'timestamp'>;

/**
 * File permissions for debug files (owner read/write only).
 */
const FILE_MODE = 0o600;

/**
 * Directory permissions for debug directory (owner only).
 */
const DIR_MODE = 0o700;

/**
 * Generates a unique event ID using UUID v4.
 *
 * @returns A new UUID string
 */
export function generateEventId(): string {
  return randomUUID();
}

/**
 * Appends a debug event to the JSONL file.
 * Uses append-only writes for crash resilience.
 *
 * @param event - The event to write (without event_id and timestamp)
 * @returns The event_id for correlation, or empty string if debug mode disabled
 */
export async function writeEvent(
  event: DebugEventInput
): Promise<string> {
  const debugFile = process.env.AGENTDEV_DEBUG_FILE;
  if (!debugFile) {
    return ''; // Debug mode not enabled
  }

  const eventId = generateEventId();
  const fullEvent: DebugEvent = {
    event_id: eventId,
    correlation_id: event.correlation_id ?? null,
    timestamp: new Date().toISOString(),
    type: event.type,
    data: event.data
  };

  const line = JSON.stringify(fullEvent) + '\n';

  try {
    // Append with restrictive permissions (owner read/write only)
    await fs.appendFile(debugFile, line, {
      mode: FILE_MODE,
      flag: 'a'
    });
  } catch (error) {
    // If write fails, try to create directory and retry
    const dir = path.dirname(debugFile);
    try {
      await fs.mkdir(dir, { recursive: true, mode: DIR_MODE });
      await fs.appendFile(debugFile, line, {
        mode: FILE_MODE,
        flag: 'a'
      });
    } catch {
      // Silently fail - debug logging should not break the main flow
      console.error('[DEBUG] Failed to write debug event:', error);
      return '';
    }
  }

  return eventId;
}

/**
 * Alias for writeEvent for backward compatibility.
 */
export const appendDebugEvent = writeEvent;

/**
 * Initialize debug session file with header event.
 *
 * @param sessionId - Unique session identifier
 * @param userRequest - Original user request
 * @param sessionPath - Path to session artifacts
 */
export async function initDebugSession(
  sessionId: string,
  userRequest: string,
  sessionPath: string
): Promise<void> {
  const debugDir = path.join(process.cwd(), 'claude-code-session-debug');
  await fs.mkdir(debugDir, { recursive: true, mode: DIR_MODE });

  const debugFile = path.join(debugDir, `${sessionId}.jsonl`);
  process.env.AGENTDEV_DEBUG_FILE = debugFile;

  // Write session header as first event
  await writeEvent({
    type: 'session_start',
    data: {
      schema_version: '1.0.0',
      session_id: sessionId,
      user_request: userRequest,
      session_path: sessionPath,
      environment: {
        claudish_available: process.env.CLAUDISH_AVAILABLE === 'true',
        plugin_version: '1.4.0',
        node_version: process.version
      }
    }
  });
}

/**
 * Finalize debug session with end event.
 *
 * @param success - Whether the session completed successfully
 * @returns The debug file path, or null if debug mode was not enabled
 */
export async function finalizeDebugSession(
  success: boolean
): Promise<string | null> {
  const debugFile = process.env.AGENTDEV_DEBUG_FILE;
  if (!debugFile) return null;

  // Write session end event
  await writeEvent({
    type: 'session_end',
    data: {
      success,
      ended_at: new Date().toISOString()
    }
  });

  // Clear environment
  delete process.env.AGENTDEV_DEBUG_FILE;

  return debugFile;
}
