# Security Best Practices

This document provides security guidelines for using the string sanitization utility module.

## Defense in Depth

**Never rely on sanitization alone.** Always implement multiple layers of security:

1. **Input Validation** - Verify format before sanitization
2. **Sanitization** - Clean the input (this library)
3. **Output Encoding** - Context-aware encoding on output
4. **Security Headers** - CSP, X-Frame-Options, etc.
5. **Principle of Least Privilege** - Limit permissions

## Common Vulnerabilities & Mitigations

### 1. Cross-Site Scripting (XSS)

**Vulnerability**: Untrusted data inserted into HTML can execute malicious scripts.

**Mitigations**:
```typescript
import { escapeHtml, sanitizeXss } from './utils/sanitize';

// For plain text insertion
const userComment = escapeHtml(userInput);
document.getElementById('comment').textContent = userComment;

// For HTML content (user-generated HTML)
const userBio = sanitizeXss(userInput);
// Still use with caution - consider using a dedicated HTML sanitizer
// like DOMPurify for production use cases
```

**Additional Defenses**:
- Implement Content Security Policy (CSP) headers
- Use `textContent` instead of `innerHTML` when possible
- Consider using a dedicated library like DOMPurify for complex HTML

### 2. SQL Injection

**Vulnerability**: Untrusted data in SQL queries can manipulate database operations.

**Mitigations**:
```typescript
import { sanitizeSql } from './utils/sanitize';

// PRIMARY DEFENSE: Always use parameterized queries
const query = 'SELECT * FROM users WHERE email = ?';
db.execute(query, [userEmail]);

// SECONDARY DEFENSE: Sanitize as additional layer
const sanitizedEmail = sanitizeSql(userEmail);
```

**Critical Notes**:
- **NEVER** use `sanitizeSql()` as the sole defense
- **ALWAYS** use parameterized queries/prepared statements
- `sanitizeSql()` is an additional safety layer only

### 3. Path Traversal

**Vulnerability**: Malicious filenames can access unauthorized files.

**Mitigations**:
```typescript
import { sanitizeFilename } from './utils/sanitize';
import path from 'path';

function saveUploadedFile(filename: string, content: Buffer) {
  // Sanitize the filename
  const safeName = sanitizeFilename(filename);

  // Ensure it stays in the upload directory
  const uploadDir = '/var/uploads';
  const fullPath = path.join(uploadDir, safeName);

  // Verify the resolved path is still in the upload directory
  if (!fullPath.startsWith(uploadDir)) {
    throw new Error('Invalid file path');
  }

  // Additional checks
  const allowedExtensions = ['.jpg', '.png', '.pdf'];
  const ext = path.extname(safeName).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error('File type not allowed');
  }

  fs.writeFileSync(fullPath, content);
}
```

**Additional Defenses**:
- Store uploads outside the web root
- Use a separate domain for user content
- Validate file type (magic bytes, not just extension)
- Implement file size limits
- Scan uploads for malware

### 4. Open Redirect

**Vulnerability**: Unvalidated URLs in redirects can send users to malicious sites.

**Mitigations**:
```typescript
import { sanitizeUrl } from './utils/sanitize';

function handleRedirect(redirectUrl: string) {
  const sanitized = sanitizeUrl(redirectUrl);

  if (!sanitized) {
    throw new Error('Invalid redirect URL');
  }

  // Additional check: Ensure it's relative or on your domain
  if (sanitized.startsWith('/')) {
    // Relative URL - safe
    return sanitized;
  }

  const url = new URL(sanitized);
  const allowedDomains = ['example.com', 'subdomain.example.com'];

  if (!allowedDomains.includes(url.hostname)) {
    throw new Error('Redirect to external domain not allowed');
  }

  return sanitized;
}
```

**Additional Defenses**:
- Implement an allowlist of redirect destinations
- Use indirect references (e.g., `redirect_id=5` instead of URLs)
- Always validate URLs before redirecting

### 5. Command Injection

**Vulnerability**: User input in system commands can execute arbitrary code.

**Mitigation**: **NEVER** pass user input to system commands.

```typescript
// BAD - NEVER DO THIS
const filename = req.body.filename;
exec(`convert ${filename} output.jpg`); // DANGEROUS!

// GOOD - Use libraries instead
import sharp from 'sharp';
const sanitized = sanitizeFilename(filename);
await sharp(sanitized).toFile('output.jpg');
```

## Validation Examples

Always validate input format before sanitization:

### Email Validation
```typescript
import { sanitizeAll } from './utils/sanitize';

function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  return sanitizeAll(email.toLowerCase(), {
    escapeHtml: true,
    normalizeWhitespace: true,
  });
}
```

### Username Validation
```typescript
function validateUsername(username: string): string {
  // Only allow alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }

  if (username.length < 3 || username.length > 20) {
    throw new Error('Username must be 3-20 characters');
  }

  return username.toLowerCase();
}
```

### URL Validation
```typescript
import { sanitizeUrl } from './utils/sanitize';

function validateUrl(url: string): string {
  const sanitized = sanitizeUrl(url, {
    allowedProtocols: ['https:'], // Only HTTPS
  });

  if (!sanitized) {
    throw new Error('Invalid URL');
  }

  return sanitized;
}
```

## Context-Aware Output Encoding

Different contexts require different encoding:

### HTML Context
```typescript
import { escapeHtml } from './utils/sanitize';

// HTML body
const html = `<div>${escapeHtml(userInput)}</div>`;

// HTML attribute
const html = `<div title="${escapeHtml(userInput)}"></div>`;
```

### JavaScript Context
```typescript
// In a script tag - requires JSON encoding
const script = `<script>
  const userData = ${JSON.stringify(userInput)};
</script>`;
```

### URL Context
```typescript
// In a URL parameter
const url = `/search?q=${encodeURIComponent(userInput)}`;
```

### CSS Context
```typescript
// In CSS - be very careful
// Best practice: Don't use user input in CSS at all
```

## Security Headers

Implement these headers in your application:

```typescript
// Express.js example
app.use((req, res, next) => {
  // Prevent XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );

  // HTTPS only
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
});
```

## Testing for Security

Always test your sanitization:

```typescript
import { describe, it, expect } from 'bun:test';
import { escapeHtml, sanitizeUrl } from './utils/sanitize';

describe('Security Tests', () => {
  it('should block XSS attempts', () => {
    const xssVectors = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg/onload=alert(1)>',
      'javascript:alert(1)',
    ];

    xssVectors.forEach((vector) => {
      const escaped = escapeHtml(vector);
      expect(escaped).not.toContain('<script');
      expect(escaped).not.toContain('onerror');
    });
  });

  it('should block dangerous URLs', () => {
    const dangerousUrls = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
    ];

    dangerousUrls.forEach((url) => {
      expect(sanitizeUrl(url)).toBe('');
    });
  });
});
```

## Common Mistakes to Avoid

### 1. Double Encoding
```typescript
// BAD - Double encoding makes data unreadable
const bad = escapeHtml(escapeHtml(userInput));

// GOOD - Encode once at the right time
const good = escapeHtml(userInput);
```

### 2. Sanitizing Too Late
```typescript
// BAD - Data already in database unsanitized
const user = await db.query('SELECT * FROM users');
const safe = escapeHtml(user.bio); // Too late!

// GOOD - Sanitize on input
const sanitizedBio = escapeHtml(req.body.bio);
await db.query('INSERT INTO users (bio) VALUES (?)', [sanitizedBio]);
```

### 3. Using Wrong Function for Context
```typescript
// BAD - HTML escaping doesn't work for URLs
const url = `/redirect?url=${escapeHtml(userUrl)}`;

// GOOD - Use URL encoding
const url = `/redirect?url=${encodeURIComponent(sanitizeUrl(userUrl))}`;
```

### 4. Trusting Client-Side Validation Only
```typescript
// BAD - Never trust client-side only
// frontend.js
const email = validateEmail(input); // Client-side only

// GOOD - Always validate server-side
// backend.js
const email = validateEmail(req.body.email); // Server-side validation
```

## Incident Response

If you discover a security vulnerability:

1. **Don't Panic** - Stay calm and assess the situation
2. **Contain** - Disable affected features if necessary
3. **Document** - Record what happened and when
4. **Fix** - Patch the vulnerability
5. **Test** - Verify the fix works
6. **Notify** - Inform affected users if required
7. **Learn** - Conduct post-mortem and improve processes

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Content Security Policy Reference](https://content-security-policy.com/)

## Support

For security issues with this library, please report them privately to the maintainers.

---

**Remember**: Security is a process, not a product. Stay informed, keep dependencies updated, and always think like an attacker.
