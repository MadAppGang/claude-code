/**
 * Usage Examples for String Sanitization Utility
 *
 * This file demonstrates common use cases for the sanitization functions.
 * Run with: bun run utils/examples.ts
 */

import {
  escapeHtml,
  sanitizeXss,
  sanitizeSql,
  sanitizeFilename,
  sanitizeUrl,
  normalizeWhitespace,
  stripHtmlTags,
  sanitizeAll,
} from './sanitize';

console.log('=== String Sanitization Examples ===\n');

// Example 1: HTML Escaping for User Comments
console.log('1. HTML Escaping for User Comments:');
const userComment = '<script>alert("XSS")</script>Hello World!';
console.log('Input:', userComment);
console.log('Output:', escapeHtml(userComment));
console.log();

// Example 2: XSS Prevention for Rich Text
console.log('2. XSS Prevention for Rich Text:');
const richText = '<p>Hello</p><img src=x onerror="alert(1)"><p>World</p>';
console.log('Input:', richText);
console.log('Output:', sanitizeXss(richText));
console.log();

// Example 3: SQL String Sanitization (with parameterized queries!)
console.log('3. SQL String Sanitization:');
const userName = "O'Reilly";
console.log('Input:', userName);
console.log('Output:', sanitizeSql(userName));
console.log('Note: Always use parameterized queries as primary defense!');
console.log();

// Example 4: Filename Sanitization for File Uploads
console.log('4. Filename Sanitization for File Uploads:');
const dangerousFilename = '../../../etc/passwd';
console.log('Input:', dangerousFilename);
console.log('Output:', sanitizeFilename(dangerousFilename));
console.log();

// Example 5: URL Sanitization for User Links
console.log('5. URL Sanitization for User Links:');
const urls = [
  'https://example.com',
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
];
urls.forEach((url) => {
  console.log(`Input: ${url}`);
  console.log(`Output: ${sanitizeUrl(url) || '(blocked)'}`);
});
console.log();

// Example 6: Whitespace Normalization
console.log('6. Whitespace Normalization:');
const messyText = '  Hello    \n\t  World  ';
console.log('Input:', JSON.stringify(messyText));
console.log('Output:', JSON.stringify(normalizeWhitespace(messyText)));
console.log();

// Example 7: HTML Tag Stripping
console.log('7. HTML Tag Stripping:');
const htmlContent = '<p>Hello <strong>World</strong>!</p>';
console.log('Input:', htmlContent);
console.log('Output:', stripHtmlTags(htmlContent));
console.log();

// Example 8: Comprehensive Sanitization
console.log('8. Comprehensive Sanitization:');
const uglyInput = '<script>alert(1)</script>  Hello   \x00World  ';
console.log('Input:', JSON.stringify(uglyInput));
console.log('Output:', JSON.stringify(sanitizeAll(uglyInput)));
console.log();

// Example 9: Real-World Form Submission
console.log('9. Real-World Form Submission Example:');
interface UserFormData {
  name: string;
  email: string;
  bio: string;
  website: string;
}

const formData: UserFormData = {
  name: '  John   Doe  ',
  email: 'john@example.com',
  bio: '<script>alert("XSS")</script>I love coding!',
  website: 'https://johndoe.com',
};

const sanitizedFormData = {
  name: normalizeWhitespace(formData.name),
  email: normalizeWhitespace(formData.email.toLowerCase()),
  bio: sanitizeAll(formData.bio),
  website: sanitizeUrl(formData.website),
};

console.log('Raw Form Data:', formData);
console.log('Sanitized Form Data:', sanitizedFormData);
console.log();

console.log('=== Examples Complete ===');
