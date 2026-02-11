/**
 * Type definitions for String Sanitization Utility
 */

/**
 * Options for sanitizing filenames
 */
export interface SanitizeFilenameOptions {
  /**
   * Character to replace invalid characters with
   * @default '_'
   */
  replacement?: string;

  /**
   * Maximum filename length
   * @default 255
   */
  maxLength?: number;
}

/**
 * Options for sanitizing URLs
 */
export interface SanitizeUrlOptions {
  /**
   * Array of allowed URL protocols
   * @default ['http:', 'https:', 'mailto:']
   */
  allowedProtocols?: string[];
}

/**
 * Options for comprehensive sanitization
 */
export interface SanitizeAllOptions {
  /**
   * Whether to escape HTML characters
   * @default true
   */
  escapeHtml?: boolean;

  /**
   * Whether to normalize whitespace
   * @default true
   */
  normalizeWhitespace?: boolean;

  /**
   * Whether to remove null bytes
   * @default true
   */
  removeNullBytes?: boolean;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(input: string): string;

/**
 * Decodes HTML entities back to their original characters
 */
export function unescapeHtml(input: string): string;

/**
 * Sanitizes input for safe SQL usage by escaping single quotes and backslashes
 */
export function sanitizeSql(input: string): string;

/**
 * Removes dangerous JavaScript event handlers and script tags from strings
 */
export function sanitizeXss(input: string): string;

/**
 * Normalizes whitespace in a string
 */
export function normalizeWhitespace(input: string): string;

/**
 * Strips all HTML tags from a string, leaving only the text content
 */
export function stripHtmlTags(input: string): string;

/**
 * Sanitizes a filename by removing or replacing dangerous characters
 */
export function sanitizeFilename(
  filename: string,
  options?: SanitizeFilenameOptions
): string;

/**
 * Removes null bytes from a string
 */
export function removeNullBytes(input: string): string;

/**
 * Sanitizes a URL to prevent XSS and other attacks
 */
export function sanitizeUrl(url: string, options?: SanitizeUrlOptions): string;

/**
 * Comprehensive sanitizer that applies multiple sanitization strategies
 */
export function sanitizeAll(input: string, options?: SanitizeAllOptions): string;
