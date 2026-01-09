/**
 * Sensitive Data Sanitization Module
 *
 * Provides comprehensive filtering of credentials, PII, and sensitive data
 * before writing to debug logs. Uses pattern matching and whitelist approaches.
 *
 * @module sanitize
 */

/**
 * Patterns for detecting sensitive data that must be redacted.
 * CRITICAL: This list must be comprehensive to prevent credential leaks.
 */
export const SENSITIVE_PATTERNS: RegExp[] = [
  // API keys and tokens
  /api[_-]?key/i,
  /api[_-]?secret/i,
  /access[_-]?token/i,
  /auth[_-]?token/i,
  /bearer\s+\S+/i,
  /authorization/i,
  /refresh[_-]?token/i,

  // Common credential prefixes (value patterns)
  /^sk-/,           // OpenAI, Stripe secret keys
  /^pk_/,           // Stripe public keys (still sensitive in logs)
  /^ghp_/,          // GitHub personal access tokens
  /^gho_/,          // GitHub OAuth tokens
  /^github_pat_/,   // GitHub PAT (new format)
  /^xox[baprs]-/,   // Slack tokens
  /^AIza/,          // Google API keys
  /^AKIA/,          // AWS access key IDs
  /^aws_/i,         // AWS credentials
  /^npm_/,          // npm tokens
  /^pypi-/,         // PyPI tokens
  /^glpat-/,        // GitLab personal access tokens
  /^dop_v1_/,       // DigitalOcean tokens
  /^r[0-9][a-z0-9]{31}/i, // Cloudflare API tokens

  // Generic patterns (key names)
  /password/i,
  /passwd/i,
  /secret/i,
  /credential/i,
  /private[_-]?key/i,
  /client[_-]?secret/i,
  /signing[_-]?key/i,
  /encryption[_-]?key/i,
  /ssh[_-]?key/i,
  /pgp[_-]?key/i,
  /jwt[_-]?secret/i,

  // PII patterns
  /social[_-]?security/i,
  /ssn/i,
  /credit[_-]?card/i,
  /card[_-]?number/i,
  /cvv/i,
  /expir/i,
  /birth[_-]?date/i,
  /passport/i,
  /driver[_-]?license/i,

  // Database credentials
  /db[_-]?password/i,
  /database[_-]?url/i,
  /connection[_-]?string/i,
  /mongodb(\+srv)?:\/\//i,
  /postgres(ql)?:\/\//i,
  /mysql:\/\//i,
  /redis:\/\//i,
];

/**
 * Environment variables that are safe to log (whitelist approach).
 * All other env vars are redacted.
 */
export const SAFE_ENV_VARS: Set<string> = new Set([
  'AGENTDEV_DEBUG',
  'AGENTDEV_DEBUG_LEVEL',
  'AGENTDEV_DEBUG_FILE',
  'NODE_ENV',
  'PATH',
  'HOME',
  'USER',
  'SHELL',
  'PWD',
  'LANG',
  'TERM',
  'EDITOR',
  'VISUAL',
  'PAGER',
  'TMPDIR',
  'TZ',
  'LC_ALL',
  'LC_CTYPE',
  'COLORTERM',
  'TERM_PROGRAM',
]);

/**
 * Maximum recursion depth for nested object sanitization.
 */
const MAX_DEPTH = 10;

/**
 * Maximum string length before truncation.
 */
const MAX_STRING_LENGTH = 1000;

/**
 * Check if a key name suggests sensitive content.
 *
 * @param key - The key name to check
 * @returns true if the key matches any sensitive pattern
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Check if a string value matches sensitive patterns.
 *
 * @param value - The string value to check
 * @returns true if the value matches any sensitive pattern
 */
export function isSensitiveValue(value: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Try to decode Base64, return null if invalid.
 *
 * @param value - The string to try decoding
 * @returns The decoded string or null if not valid Base64
 */
function tryBase64Decode(value: string): string | null {
  try {
    // Check if it looks like Base64
    if (!/^[A-Za-z0-9+/=]+$/.test(value)) {
      return null;
    }
    const decoded = Buffer.from(value, 'base64').toString('utf-8');
    // Check if decoded string is printable (not binary garbage)
    if (/[\x00-\x08\x0e-\x1f]/.test(decoded)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Sanitize a string value.
 *
 * @param value - The string to sanitize
 * @param _key - Optional key name for context (unused but kept for API consistency)
 * @returns The sanitized string
 */
function sanitizeString(value: string, _key?: string): string {
  // Check for sensitive patterns in the value itself
  if (isSensitiveValue(value)) {
    return '[REDACTED]';
  }

  // Check for Base64-encoded secrets (common pattern)
  if (value.length > 20 && /^[A-Za-z0-9+/=]+$/.test(value)) {
    // Likely Base64, could be encoded credential
    const decoded = tryBase64Decode(value);
    if (decoded && isSensitiveValue(decoded)) {
      return '[REDACTED_BASE64]';
    }
  }

  // Truncate long strings
  if (value.length > MAX_STRING_LENGTH) {
    return value.substring(0, MAX_STRING_LENGTH) + '... [TRUNCATED]';
  }

  return value;
}

/**
 * Recursively sanitize an object.
 *
 * @param obj - The object to sanitize
 * @param depth - Current recursion depth
 * @returns The sanitized object
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  depth: number
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value, key, depth);
  }

  return sanitized;
}

/**
 * Recursively sanitizes parameters, redacting sensitive data.
 *
 * @param value - Any value to sanitize
 * @param key - Optional key name for context-aware filtering
 * @param depth - Current recursion depth (max 10)
 * @returns Sanitized value
 */
export function sanitizeValue(
  value: unknown,
  key?: string,
  depth: number = 0
): unknown {
  // Prevent infinite recursion
  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // Check if key itself indicates sensitive data
  if (key && isSensitiveKey(key)) {
    return '[REDACTED]';
  }

  // Handle different value types
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value, key);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeValue(item, `${key || ''}[${index}]`, depth + 1)
    );
  }

  if (typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>, depth + 1);
  }

  // Functions, symbols, etc.
  return '[UNSUPPORTED_TYPE]';
}

/**
 * Main sanitization entry point for tool parameters.
 *
 * @param params - The parameters object to sanitize
 * @returns Sanitized parameters with sensitive data redacted
 */
export function sanitizeParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  return sanitizeObject(params, 0);
}

/**
 * Sanitize environment variables using whitelist approach.
 *
 * @param env - Environment variables object
 * @returns Sanitized environment with non-whitelisted vars redacted
 */
export function sanitizeEnv(
  env: Record<string, string | undefined>
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (SAFE_ENV_VARS.has(key)) {
      sanitized[key] = value || '';
    } else {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}
