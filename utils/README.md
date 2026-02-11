# String Sanitization Utility

A production-ready string sanitization module for Node.js/Bun applications. Provides comprehensive security functions to protect against XSS, SQL injection, and other common web vulnerabilities.

## Features

- **HTML Escaping**: Prevent XSS attacks by escaping HTML special characters
- **SQL Injection Protection**: Basic SQL string sanitization (use with parameterized queries)
- **XSS Prevention**: Remove dangerous JavaScript event handlers and protocols
- **Whitespace Normalization**: Clean and normalize whitespace in strings
- **Filename Sanitization**: Prevent directory traversal and filesystem attacks
- **URL Sanitization**: Validate and sanitize URLs to prevent protocol-based attacks
- **Comprehensive Sanitization**: All-in-one function for user-generated content

## Installation

```bash
# If this module is published
bun add @your-org/sanitize

# For local development
# Import directly from the utils directory
```

## Usage

### Basic HTML Escaping

```typescript
import { escapeHtml, unescapeHtml } from './utils/sanitize';

// Escape HTML
const userInput = '<script>alert("XSS")</script>';
const safe = escapeHtml(userInput);
// Result: &lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;

// Unescape HTML
const escaped = '&lt;div&gt;Hello&lt;/div&gt;';
const original = unescapeHtml(escaped);
// Result: <div>Hello</div>
```

### SQL Injection Protection

**Important**: This is a basic defense layer. Always use parameterized queries or prepared statements as the primary defense against SQL injection.

```typescript
import { sanitizeSql } from './utils/sanitize';

const userInput = "O'Reilly";
const safe = sanitizeSql(userInput);
// Result: O''Reilly

// Dangerous input
const malicious = "'; DROP TABLE users; --";
const sanitized = sanitizeSql(malicious);
// Result: '''; DROP TABLE users; --
```

### XSS Prevention

```typescript
import { sanitizeXss } from './utils/sanitize';

const userInput = '<img src=x onerror="alert(1)">';
const safe = sanitizeXss(userInput);
// Result: <img src=x >

// Removes script tags
const malicious = '<script>alert("XSS")</script>';
const cleaned = sanitizeXss(malicious);
// Result: (empty string)
```

### Whitespace Normalization

```typescript
import { normalizeWhitespace } from './utils/sanitize';

const messy = '  Hello   World  \n\t  ';
const clean = normalizeWhitespace(messy);
// Result: 'Hello World'
```

### Strip HTML Tags

```typescript
import { stripHtmlTags } from './utils/sanitize';

const html = '<p>Hello <strong>World</strong></p>';
const text = stripHtmlTags(html);
// Result: 'Hello World'
```

### Filename Sanitization

```typescript
import { sanitizeFilename } from './utils/sanitize';

// Prevent directory traversal
const dangerous = '../../../etc/passwd';
const safe = sanitizeFilename(dangerous);
// Result: '_etc_passwd'

// Custom replacement character
const filename = 'my file (1).txt';
const safe = sanitizeFilename(filename, { replacement: '-' });
// Result: 'my-file-(1).txt'

// Enforce length limit
const longName = 'a'.repeat(300) + '.txt';
const safe = sanitizeFilename(longName, { maxLength: 255 });
// Result: Truncated to 255 chars, preserving .txt extension
```

### URL Sanitization

```typescript
import { sanitizeUrl } from './utils/sanitize';

// Allow safe protocols
const safe = sanitizeUrl('https://example.com');
// Result: 'https://example.com/'

// Block dangerous protocols
const dangerous = sanitizeUrl('javascript:alert(1)');
// Result: '' (empty string)

// Custom allowed protocols
const ftpUrl = sanitizeUrl('ftp://example.com', {
  allowedProtocols: ['http:', 'https:', 'ftp:']
});
// Result: 'ftp://example.com/'

// Relative URLs are allowed
const relative = sanitizeUrl('/path/to/page');
// Result: '/path/to/page'
```

### Comprehensive Sanitization

```typescript
import { sanitizeAll } from './utils/sanitize';

const userInput = '<script>alert(1)</script>  Hello   \x00World  ';
const safe = sanitizeAll(userInput);
// Result: '&lt;script&gt;alert(1)&lt;&#x2F;script&gt; Hello World'
// (null bytes removed, whitespace normalized, HTML escaped)

// Customize sanitization
const customSafe = sanitizeAll(userInput, {
  escapeHtml: false,          // Skip HTML escaping
  normalizeWhitespace: true,  // Keep whitespace normalization
  removeNullBytes: true       // Keep null byte removal
});
```

### Remove Null Bytes

```typescript
import { removeNullBytes } from './utils/sanitize';

const input = 'hello\x00world';
const safe = removeNullBytes(input);
// Result: 'helloworld'
```

## Security Best Practices

### Defense in Depth

This library provides sanitization functions, but they should be used as part of a layered security approach:

1. **SQL Injection**: Always use parameterized queries/prepared statements. `sanitizeSql()` is an additional safety layer.
2. **XSS Prevention**: Use Content Security Policy (CSP) headers in addition to input sanitization.
3. **File Uploads**: Validate file types, scan for malware, and store uploads outside the web root.
4. **URL Validation**: Implement allowlists for redirect destinations.

### When to Use Each Function

- **escapeHtml()**: Before inserting user content into HTML
- **sanitizeXss()**: For user-generated HTML content (comments, posts)
- **sanitizeSql()**: Extra layer with parameterized queries (NOT a replacement)
- **sanitizeFilename()**: For all file upload operations
- **sanitizeUrl()**: Before using URLs in links, redirects, or API calls
- **sanitizeAll()**: For general user input that will be displayed

### Input Validation

Always validate input format before sanitization:

```typescript
// Bad: Only sanitizing
const email = sanitizeAll(userInput);

// Good: Validate then sanitize
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (isValidEmail(userInput)) {
  const email = sanitizeAll(userInput);
  // Use email
} else {
  throw new Error('Invalid email format');
}
```

## API Reference

### escapeHtml(input: string): string

Escapes HTML special characters to prevent XSS attacks.

**Parameters:**
- `input`: String to escape

**Returns:** Escaped string safe for HTML insertion

**Throws:** `TypeError` if input is not a string

---

### unescapeHtml(input: string): string

Decodes HTML entities back to their original characters.

**Parameters:**
- `input`: HTML-encoded string

**Returns:** Decoded string

**Throws:** `TypeError` if input is not a string

---

### sanitizeSql(input: string): string

Escapes single quotes and backslashes for SQL usage.

**Parameters:**
- `input`: String to sanitize

**Returns:** Sanitized string

**Throws:** `TypeError` if input is not a string

**Note:** Always use parameterized queries as the primary defense.

---

### sanitizeXss(input: string): string

Removes dangerous JavaScript event handlers and script tags.

**Parameters:**
- `input`: String to sanitize

**Returns:** String with dangerous content removed

**Throws:** `TypeError` if input is not a string

---

### normalizeWhitespace(input: string): string

Normalizes whitespace by trimming and collapsing multiple spaces.

**Parameters:**
- `input`: String to normalize

**Returns:** Normalized string

**Throws:** `TypeError` if input is not a string

---

### stripHtmlTags(input: string): string

Removes all HTML tags, leaving only text content.

**Parameters:**
- `input`: HTML string

**Returns:** Plain text content

**Throws:** `TypeError` if input is not a string

---

### sanitizeFilename(filename: string, options?: SanitizeFilenameOptions): string

Sanitizes filenames to prevent directory traversal and filesystem attacks.

**Parameters:**
- `filename`: Filename to sanitize
- `options`: Configuration options
  - `replacement`: Character to replace invalid chars (default: `'_'`)
  - `maxLength`: Maximum filename length (default: `255`)

**Returns:** Sanitized filename

**Throws:**
- `TypeError` if filename is not a string
- `Error` if filename becomes empty after sanitization

---

### removeNullBytes(input: string): string

Removes null bytes from strings.

**Parameters:**
- `input`: String to sanitize

**Returns:** String without null bytes

**Throws:** `TypeError` if input is not a string

---

### sanitizeUrl(url: string, options?: SanitizeUrlOptions): string

Sanitizes URLs to prevent XSS and protocol-based attacks.

**Parameters:**
- `url`: URL to sanitize
- `options`: Configuration options
  - `allowedProtocols`: Array of allowed protocols (default: `['http:', 'https:', 'mailto:']`)

**Returns:** Sanitized URL or empty string if invalid

**Throws:** `TypeError` if url is not a string

---

### sanitizeAll(input: string, options?: SanitizeAllOptions): string

Applies multiple sanitization strategies.

**Parameters:**
- `input`: String to sanitize
- `options`: Configuration options
  - `escapeHtml`: Escape HTML (default: `true`)
  - `normalizeWhitespace`: Normalize whitespace (default: `true`)
  - `removeNullBytes`: Remove null bytes (default: `true`)

**Returns:** Fully sanitized string

**Throws:** `TypeError` if input is not a string

## Testing

The module includes comprehensive unit tests with 100% code coverage.

```bash
# Run tests
bun test utils/sanitize.test.ts

# Run with coverage
bun test --coverage utils/sanitize.test.ts
```

## Performance

All functions are optimized for performance:

- Large strings (100,000 characters): < 100ms
- 10,000 sanitization calls: < 1 second

## License

MIT

## Contributing

Contributions are welcome! Please ensure all tests pass and maintain 100% code coverage.

```bash
# Run tests before submitting
bun test utils/sanitize.test.ts

# Check coverage
bun test --coverage utils/sanitize.test.ts
```

## Changelog

### v1.0.0 (2026-02-09)

Initial release with comprehensive sanitization functions:
- HTML escaping and unescaping
- SQL injection protection
- XSS prevention
- Whitespace normalization
- HTML tag stripping
- Filename sanitization
- Null byte removal
- URL sanitization
- Comprehensive sanitization function
- Full test coverage
