/**
 * Debug Capture Hook Handler
 *
 * Captures tool invocations and results when debug mode is enabled.
 * Implements PreToolUse and PostToolUse hooks for Claude Code plugin system.
 *
 * @module debug-capture
 */

import * as fs from 'fs';
import * as path from 'path';
import { writeEvent } from './debug-writer';
import { sanitizeParams } from './sanitize';

/**
 * Context provided by Claude Code hook system.
 */
export interface HookContext {
  toolName: string;
  parameters: Record<string, unknown>;
  sessionPath?: string;
}

/**
 * Extended context for PostToolUse hook with result information.
 */
export interface PostToolUseContext extends HookContext {
  result: unknown;
  success: boolean;
  error?: string;
}

/**
 * Hook result returned to Claude Code.
 */
export interface HookResult {
  /** Whether to proceed with the tool call */
  proceed: boolean;
  /** Optional message to show */
  message?: string;
  /** Modified parameters (for PreToolUse) */
  modifiedParameters?: Record<string, unknown>;
}

/**
 * Pending invocation tracking for event correlation.
 * Maps a correlation key to the event ID and start time.
 */
interface PendingInvocation {
  eventId: string;
  startTime: number;
}

/**
 * Per-project debug configuration stored in .claude/agentdev-debug.json
 */
interface DebugConfig {
  enabled: boolean;
  level: 'minimal' | 'standard' | 'verbose';
  created_at?: string;
}

/**
 * Cache for config file reading to avoid repeated disk I/O.
 * Invalidated every 5 seconds.
 */
let configCache: { config: DebugConfig | null; timestamp: number } | null = null;
const CONFIG_CACHE_TTL = 5000; // 5 seconds

/**
 * Session-scoped Map for tracking pending invocations.
 * Uses tool name + timestamp as correlation key.
 *
 * Note: This is scoped per-process, which aligns with Claude Code's
 * execution model where each session runs in its own process.
 */
const pendingInvocations = new Map<string, PendingInvocation>();

/**
 * Read the per-project debug config file.
 *
 * @returns The debug config or null if not found/invalid
 */
function readDebugConfig(): DebugConfig | null {
  // Check cache first
  if (configCache && Date.now() - configCache.timestamp < CONFIG_CACHE_TTL) {
    return configCache.config;
  }

  const configPath = path.join(process.cwd(), '.claude', 'agentdev-debug.json');

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as DebugConfig;
      configCache = { config, timestamp: Date.now() };
      return config;
    }
  } catch {
    // Silently fail - config file may be invalid or inaccessible
  }

  configCache = { config: null, timestamp: Date.now() };
  return null;
}

/**
 * Check if debug mode is enabled.
 *
 * Reads from .claude/agentdev-debug.json config file only.
 *
 * @returns true if debug mode is enabled
 */
function isDebugEnabled(): boolean {
  const config = readDebugConfig();
  return config?.enabled === true;
}

/**
 * Get the current debug level.
 *
 * Reads from .claude/agentdev-debug.json level field.
 * Default: 'standard'
 *
 * @returns The debug level
 */
function getDebugLevel(): 'minimal' | 'standard' | 'verbose' {
  const config = readDebugConfig();
  if (config?.level) {
    return config.level;
  }
  return 'standard';
}

/**
 * Generate a correlation key for tool invocations.
 *
 * @param toolName - Name of the tool
 * @returns A unique correlation key
 */
function generateCorrelationKey(toolName: string): string {
  return `${toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Extract phase and agent context from environment or parameters.
 *
 * @param params - Tool parameters that may contain context
 * @returns Context object with phase and agent info
 */
function extractContext(params: Record<string, unknown>): {
  phase?: number;
  agent?: string;
} {
  return {
    phase: typeof params._phase === 'number' ? params._phase : undefined,
    agent: typeof params._agent === 'string' ? params._agent : undefined
  };
}

/**
 * Capture tool invocation event.
 * Called by handlePreToolUse to record the tool call.
 *
 * @param toolName - Name of the tool being invoked
 * @param params - Sanitized parameters
 * @param context - Phase and agent context
 * @returns Correlation key for matching with result
 */
async function captureToolInvocation(
  toolName: string,
  params: Record<string, unknown>,
  context: { phase?: number; agent?: string }
): Promise<string> {
  const eventId = await writeEvent({
    type: 'tool_invocation',
    data: {
      tool_name: toolName,
      parameters: params,
      context
    }
  });

  // Store for correlation with result
  const correlationKey = generateCorrelationKey(toolName);
  pendingInvocations.set(correlationKey, {
    eventId,
    startTime: Date.now()
  });

  return correlationKey;
}

/**
 * Capture tool result event.
 * Called by handlePostToolUse to record the tool result.
 *
 * @param correlationKey - Key from captureToolInvocation
 * @param toolName - Name of the tool
 * @param success - Whether the tool call succeeded
 * @param resultSize - Size of the result in bytes
 */
async function captureToolResult(
  correlationKey: string,
  toolName: string,
  success: boolean,
  resultSize: number
): Promise<void> {
  const pending = pendingInvocations.get(correlationKey);
  const durationMs = pending ? Date.now() - pending.startTime : 0;
  const correlationId = pending?.eventId || null;

  pendingInvocations.delete(correlationKey);

  await writeEvent({
    correlation_id: correlationId,
    type: 'tool_result',
    data: {
      tool_name: toolName,
      success,
      result_size_bytes: resultSize,
      duration_ms: durationMs
    }
  });
}

/**
 * Calculate approximate size of a value in bytes.
 *
 * @param value - Any value to measure
 * @returns Approximate size in bytes
 */
function getResultSize(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'string') {
    return value.length;
  }
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

/**
 * Find correlation key for a tool result.
 * Searches pending invocations for matching tool name.
 *
 * @param toolName - Name of the tool
 * @returns The correlation key if found
 */
function findCorrelationKey(toolName: string): string | undefined {
  // Find the most recent pending invocation for this tool
  for (const [key, _value] of pendingInvocations.entries()) {
    if (key.startsWith(`${toolName}-`)) {
      return key;
    }
  }
  return undefined;
}

/**
 * PreToolUse hook handler.
 * Captures tool invocation when debug mode is enabled.
 *
 * @param context - Hook context from Claude Code
 * @returns Hook result (always proceeds, debug capture is passive)
 */
export async function handlePreToolUse(context: HookContext): Promise<HookResult> {
  // Always proceed - debug capture is passive observation
  const result: HookResult = { proceed: true };

  if (!isDebugEnabled()) {
    return result;
  }

  try {
    const sanitizedParams = sanitizeParams(context.parameters);
    const executionContext = extractContext(context.parameters);

    await captureToolInvocation(
      context.toolName,
      sanitizedParams,
      executionContext
    );
  } catch (error) {
    // Log but don't fail - debug capture should not break tool execution
    console.error('[DEBUG] Failed to capture tool invocation:', error);
  }

  return result;
}

/**
 * PostToolUse hook handler.
 * Captures tool result when debug mode is enabled.
 *
 * @param context - Extended hook context with result
 * @returns Hook result
 */
export async function handlePostToolUse(context: PostToolUseContext): Promise<HookResult> {
  const result: HookResult = { proceed: true };

  if (!isDebugEnabled()) {
    return result;
  }

  try {
    const correlationKey = findCorrelationKey(context.toolName);
    if (correlationKey) {
      const resultSize = getResultSize(context.result);
      await captureToolResult(
        correlationKey,
        context.toolName,
        context.success,
        resultSize
      );
    }
  } catch (error) {
    // Log but don't fail
    console.error('[DEBUG] Failed to capture tool result:', error);
  }

  return result;
}

/**
 * Capture skill activation event.
 * Can be called by agents when loading skills.
 *
 * @param skillName - Name of the skill being activated
 * @param triggeredBy - How the skill was triggered
 * @param agentName - Optional agent that triggered the skill
 */
export async function captureSkillActivation(
  skillName: string,
  triggeredBy: 'agent_load' | 'explicit_call' | 'auto_trigger',
  agentName?: string
): Promise<void> {
  if (!isDebugEnabled()) return;

  try {
    await writeEvent({
      type: 'skill_activation',
      data: {
        skill_name: skillName,
        triggered_by: triggeredBy,
        context: { agent: agentName || null }
      }
    });
  } catch (error) {
    console.error('[DEBUG] Failed to capture skill activation:', error);
  }
}

/**
 * Capture hook trigger event.
 * Used when hooks block or modify tool calls.
 *
 * @param hookType - Type of hook that triggered
 * @param toolOrAgent - Name of the tool or agent
 * @param hookResult - What the hook did
 * @param message - Optional message about the action
 * @param handler - Optional handler file name
 */
export async function captureHookTrigger(
  hookType: 'PreToolUse' | 'PostToolUse' | 'PreAgent' | 'PostAgent',
  toolOrAgent: string,
  hookResult: 'allowed' | 'blocked' | 'modified',
  message?: string,
  handler?: string
): Promise<void> {
  if (!isDebugEnabled()) return;

  try {
    await writeEvent({
      type: 'hook_trigger',
      data: {
        hook_type: hookType,
        tool_name: toolOrAgent,
        hook_result: hookResult,
        message: message || null,
        handler: handler || null
      }
    });
  } catch (error) {
    console.error('[DEBUG] Failed to capture hook trigger:', error);
  }
}

/**
 * Capture agent delegation event.
 *
 * @param targetAgent - Name of the agent being delegated to
 * @param prompt - The prompt being sent to the agent
 * @param proxyMode - Optional proxy mode model ID
 * @param sessionPath - Optional session path
 * @returns Event ID for correlation with response
 */
export async function captureAgentDelegation(
  targetAgent: string,
  prompt: string,
  proxyMode?: string,
  sessionPath?: string
): Promise<string> {
  if (!isDebugEnabled()) return '';

  try {
    return await writeEvent({
      type: 'agent_delegation',
      data: {
        target_agent: targetAgent,
        prompt_preview: prompt.substring(0, 200),
        prompt_length: prompt.length,
        proxy_mode: proxyMode || null,
        session_path: sessionPath || null
      }
    });
  } catch (error) {
    console.error('[DEBUG] Failed to capture agent delegation:', error);
    return '';
  }
}

/**
 * Capture agent response event.
 *
 * @param delegationEventId - Event ID from captureAgentDelegation
 * @param agent - Name of the responding agent
 * @param response - The agent's response
 * @param durationMs - How long the agent took
 * @param success - Whether the agent succeeded
 */
export async function captureAgentResponse(
  delegationEventId: string,
  agent: string,
  response: string,
  durationMs: number,
  success: boolean
): Promise<void> {
  if (!isDebugEnabled()) return;

  try {
    await writeEvent({
      correlation_id: delegationEventId,
      type: 'agent_response',
      data: {
        agent,
        response_preview: response.substring(0, 200),
        response_length: response.length,
        duration_ms: durationMs,
        success
      }
    });
  } catch (error) {
    console.error('[DEBUG] Failed to capture agent response:', error);
  }
}

/**
 * Capture error event.
 *
 * @param errorType - Category of error
 * @param message - Error message
 * @param context - Additional context about where the error occurred
 * @param stackTrace - Optional stack trace
 * @param recoverable - Whether the error is recoverable
 */
export async function captureError(
  errorType: 'tool_error' | 'hook_error' | 'agent_error' | 'system_error' | 'validation_error' | 'timeout_error',
  message: string,
  context: { phase?: number; agent?: string; tool?: string },
  stackTrace?: string,
  recoverable: boolean = true
): Promise<void> {
  if (!isDebugEnabled()) return;

  try {
    await writeEvent({
      type: 'error',
      data: {
        error_type: errorType,
        message,
        stack_trace: stackTrace || null,
        recoverable,
        context
      }
    });
  } catch (error) {
    console.error('[DEBUG] Failed to capture error event:', error);
  }
}

/**
 * Capture phase transition event.
 *
 * @param fromPhase - Previous phase number (null if starting)
 * @param toPhase - New phase number
 * @param fromName - Previous phase name
 * @param toName - New phase name
 * @param reason - Why the transition occurred
 * @param qualityGateResult - Optional quality gate result
 */
export async function capturePhaseTransition(
  fromPhase: number | null,
  toPhase: number,
  fromName: string | null,
  toName: string,
  reason: 'completed' | 'skipped' | 'failed' | 'user_requested',
  qualityGateResult?: boolean
): Promise<void> {
  if (!isDebugEnabled()) return;

  try {
    await writeEvent({
      type: 'phase_transition',
      data: {
        from_phase: fromPhase,
        to_phase: toPhase,
        from_name: fromName,
        to_name: toName,
        transition_reason: reason,
        quality_gate_result: qualityGateResult ?? null
      }
    });
  } catch (error) {
    console.error('[DEBUG] Failed to capture phase transition:', error);
  }
}
