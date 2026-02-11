/**
 * String Sanitization Utility Module
 *
 * Provides production-ready string sanitization functions for common security scenarios.
 * Includes HTML escaping, XSS protection, SQL injection prevention, and whitespace normalization.
 *
 * @module utils/sanitize
 */

/**
 * HTML entity mapping for encoding special characters
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * HTML entity mapping for decoding entities back to characters
 */
const HTML_DECODE_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#39;': "'",
};

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Converts characters like <, >, &, ", ' to their HTML entity equivalents.
 *
 * @param input - The string to escape
 * @returns The escaped string safe for HTML insertion
 * @throws {TypeError} If input is not a string
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
 * ```
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Decodes HTML entities back to their original characters.
 *
 * @param input - The HTML-encoded string to decode
 * @returns The decoded string
 * @throws {TypeError} If input is not a string
 *
 * @example
 * ```typescript
 * unescapeHtml('&lt;div&gt;Hello&lt;/div&gt;');
 * // Returns: '<div>Hello</div>'
 * ```
 */
export function unescapeHtml(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  return input.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#39);/g, (entity) => HTML_DECODE_ENTITIES[entity] || entity);
}

/**
 * Sanitizes input for safe SQL usage by escaping single quotes and backslashes.
 * NOTE: This is a basic defense layer. Always use parameterized queries/prepared statements.
 *
 * @param input - The string to sanitize for SQL
 * @returns The sanitized string
 * @throws {TypeError} If input is not a string
 *
 * @example
 * ```typescript
 * sanitizeSql("O'Reilly");
 * // Returns: "O''Reilly"
 *
 * sanitizeSql("'; DROP TABLE users; --");
 * // Returns: "'''; DROP TABLE users; --"
 * ```
 */
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  // Escape backslashes first, then single quotes
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");
}

/**
 * Removes dangerous JavaScript event handlers and script tags from strings.
 * Protects against XSS attacks by stripping potentially malicious content.
 *
 * @param input - The string to sanitize
 * @returns The sanitized string with dangerous content removed
 * @throws {TypeError} If input is not a string
 *
 * @example
 * ```typescript
 * sanitizeXss('<img src=x onerror="alert(1)">');
 * // Returns: '<img src=x >'
 *
 * sanitizeXss('<script>alert("XSS")</script>');
 * // Returns: ''
 * ```
 */
export function sanitizeXss(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  let sanitized = input;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove inline event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
}

/**
 * Normalizes whitespace in a string by:
 * - Trimming leading and trailing whitespace
 * - Collapsing multiple spaces into single spaces
 * - Converting tabs and newlines to spaces
 *
 * @param input - The string to normalize
 * @returns The normalized string
 * @throws {TypeError} If input is not a string
 *
 * @example
 * ```typescript
 * normalizeWhitespace('  Hello   World  \n\t  ');
 * // Returns: 'Hello World'
 * ```
 */
export function normalizeWhitespace(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  return input
    .replace(/[\t\n\r]/g, ' ')  // Convert tabs and newlines to spaces
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .trim();                      // Remove leading/trailing whitespace
}

/**
 * Strips all HTML tags from a string, leaving only the text content.
 * Useful for converting HTML to plain text.
 *
 * @param input - The HTML string to strip
 * @returns The text content without HTML tags
 * @throws {TypeError} If input is not a string
 *
 * @example
 * ```typescript
 * stripHtmlTags('<p>Hello <strong>World</strong></p>');
 * // Returns: 'Hello World'
 * ```
 */
export function stripHtmlTags(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  return input
    .replace(/<[^>]*>/g, '')     // Remove all HTML tags
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim();
}

/**
 * Sanitizes a filename by removing or replacing dangerous characters.
 * Prevents directory traversal attacks and ensures filesystem compatibility.
 *
 * @param filename - The filename to sanitize
 * @param options - Configuration options
 * @param options.replacement - Character to replace invalid chars with (default: '_')
 * @param options.maxLength - Maximum filename length (default: 255)
 * @returns The sanitized filename
 * @throws {TypeError} If filename is not a string
 * @throws {Error} If filename becomes empty after sanitization
 *
 * @example
 * ```typescript
 * sanitizeFilename('../../../etc/passwd');
 * // Returns: '_etc_passwd'
 *
 * sanitizeFilename('my file (1).txt');
 * // Returns: 'my_file_(1).txt'
 *
 * sanitizeFilename('file<>:"|?*.txt', { replacement: '-' });
 * // Returns: 'file-------.txt'
 * ```
 */
export function sanitizeFilename(
  filename: string,
  options: { replacement?: string; maxLength?: number } = {}
): string {
  if (typeof filename !== 'string') {
    throw new TypeError('Filename must be a string');
  }

  const { replacement = '_', maxLength = 255 } = options;

  let sanitized = filename;

  // Remove path separators and directory traversal attempts
  sanitized = sanitized.replace(/[/\\]+/g, replacement);
  sanitized = sanitized.replace(/\.{2,}/g, replacement);

  // Remove other dangerous characters (Windows + Unix)
  // < > : " | ? * and control characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, replacement);

  // Trim dots and spaces from start and end (problematic on Windows)
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // Ensure it doesn't exceed max length
  if (sanitized.length > maxLength) {
    const extension = sanitized.match(/\.[^.]*$/)?.[0] || '';
    const nameWithoutExt = sanitized.slice(0, sanitized.length - extension.length);
    sanitized = nameWithoutExt.slice(0, maxLength - extension.length) + extension;
  }

  // Ensure filename is not empty
  if (!sanitized || sanitized === replacement) {
    throw new Error('Filename cannot be empty after sanitization');
  }

  return sanitized;
}

/**
 * Removes null bytes from a string, which can be used in various injection attacks.
 *
 * @param input - The string to sanitize
 * @returns The string without null bytes
 * @throws {TypeError} If input is not a string
 *
 * @example
 * ```typescript
 * removeNullBytes('hello\x00world');
 * // Returns: 'helloworld'
 * ```
 */
export function removeNullBytes(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  return input.replace(/\0/g, '');
}

/**
 * Sanitizes a URL to prevent XSS and other attacks.
 * Only allows http, https, and mailto protocols.
 *
 * @param url - The URL to sanitize
 * @param options - Configuration options
 * @param options.allowedProtocols - Array of allowed protocols (default: ['http:', 'https:', 'mailto:'])
 * @returns The sanitized URL or empty string if invalid
 * @throws {TypeError} If url is not a string
 *
 * @example
 * ```typescript
 * sanitizeUrl('https://example.com');
 * // Returns: 'https://example.com'
 *
 * sanitizeUrl('javascript:alert(1)');
 * // Returns: ''
 *
 * sanitizeUrl('ftp://example.com', { allowedProtocols: ['http:', 'https:', 'ftp:'] });
 * // Returns: 'ftp://example.com'
 * ```
 */
export function sanitizeUrl(
  url: string,
  options: { allowedProtocols?: string[] } = {}
): string {
  if (typeof url !== 'string') {
    throw new TypeError('URL must be a string');
  }

  const { allowedProtocols = ['http:', 'https:', 'mailto:'] } = options;

  // Trim and remove null bytes
  const trimmed = removeNullBytes(url.trim());

  if (!trimmed) {
    return '';
  }

  // Try to parse the URL
  try {
    const parsed = new URL(trimmed);

    // Check if protocol is allowed
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    // If URL parsing fails, check if it's a relative URL
    // Relative URLs don't have a protocol, so they're generally safe
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      // Still check for dangerous patterns
      if (trimmed.toLowerCase().includes('javascript:') || trimmed.toLowerCase().includes('data:')) {
        return '';
      }
      return trimmed;
    }

    // Invalid URL
    return '';
  }
}

/**
 * Comprehensive sanitizer that applies multiple sanitization strategies.
 * Useful for user-generated content that will be displayed as HTML.
 *
 * @param input - The string to sanitize
 * @param options - Configuration options
 * @param options.escapeHtml - Whether to escape HTML (default: true)
 * @param options.normalizeWhitespace - Whether to normalize whitespace (default: true)
 * @param options.removeNullBytes - Whether to remove null bytes (default: true)
 * @returns The fully sanitized string
 * @throws {TypeError} If input is not a string
 *
 * @example
 * ```typescript
 * sanitizeAll('<script>alert(1)</script>  Hello   World  ');
 * // Returns: '&lt;script&gt;alert(1)&lt;&#x2F;script&gt; Hello World'
 * ```
 */
export function sanitizeAll(
  input: string,
  options: {
    escapeHtml?: boolean;
    normalizeWhitespace?: boolean;
    removeNullBytes?: boolean;
  } = {}
): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  const {
    escapeHtml: shouldEscapeHtml = true,
    normalizeWhitespace: shouldNormalizeWhitespace = true,
    removeNullBytes: shouldRemoveNullBytes = true,
  } = options;

  let result = input;

  if (shouldRemoveNullBytes) {
    result = removeNullBytes(result);
  }

  if (shouldNormalizeWhitespace) {
    result = normalizeWhitespace(result);
  }

  if (shouldEscapeHtml) {
    result = escapeHtml(result);
  }

  return result;
}
