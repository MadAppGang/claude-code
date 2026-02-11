import { describe, expect, it } from 'bun:test';
import {
  escapeHtml,
  unescapeHtml,
  sanitizeSql,
  sanitizeXss,
  normalizeWhitespace,
  stripHtmlTags,
  sanitizeFilename,
  removeNullBytes,
  sanitizeUrl,
  sanitizeAll,
} from './sanitize';

describe('escapeHtml', () => {
  it('should escape basic HTML entities', () => {
    expect(escapeHtml('<div>Hello</div>')).toBe('&lt;div&gt;Hello&lt;&#x2F;div&gt;');
  });

  it('should escape quotes', () => {
    expect(escapeHtml('"Hello" and \'World\'')).toBe('&quot;Hello&quot; and &#x27;World&#x27;');
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape script tags', () => {
    expect(escapeHtml('<script>alert("XSS")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should handle empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle strings without special characters', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('should escape multiple special characters', () => {
    expect(escapeHtml('<img src="x" onerror=\'alert(1)\'/>'))
      .toContain('&lt;img src=&quot;x&quot; onerror=&#x27;alert(1)&#x27;&#x2F;&gt;');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => escapeHtml(123 as any)).toThrow(TypeError);
    expect(() => escapeHtml(null as any)).toThrow(TypeError);
    expect(() => escapeHtml(undefined as any)).toThrow(TypeError);
    expect(() => escapeHtml({} as any)).toThrow(TypeError);
  });
});

describe('unescapeHtml', () => {
  it('should unescape basic HTML entities', () => {
    expect(unescapeHtml('&lt;div&gt;Hello&lt;&#x2F;div&gt;')).toBe('<div>Hello</div>');
  });

  it('should unescape quotes', () => {
    expect(unescapeHtml('&quot;Hello&quot; and &#x27;World&#x27;')).toBe('"Hello" and \'World\'');
  });

  it('should unescape ampersands', () => {
    expect(unescapeHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });

  it('should handle both &#x27; and &#39; for apostrophes', () => {
    expect(unescapeHtml('&#x27;Hello&#39;')).toBe('\'Hello\'');
  });

  it('should handle empty strings', () => {
    expect(unescapeHtml('')).toBe('');
  });

  it('should handle strings without entities', () => {
    expect(unescapeHtml('Hello World')).toBe('Hello World');
  });

  it('should be inverse of escapeHtml', () => {
    const original = '<div>"Hello" & \'World\'</div>';
    expect(unescapeHtml(escapeHtml(original))).toBe(original);
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => unescapeHtml(123 as any)).toThrow(TypeError);
  });
});

describe('sanitizeSql', () => {
  it('should escape single quotes', () => {
    expect(sanitizeSql("O'Reilly")).toBe("O''Reilly");
  });

  it('should escape backslashes', () => {
    expect(sanitizeSql('C:\\path\\to\\file')).toBe('C:\\\\path\\\\to\\\\file');
  });

  it('should handle SQL injection attempts', () => {
    expect(sanitizeSql("'; DROP TABLE users; --")).toBe("''; DROP TABLE users; --");
  });

  it('should handle multiple special characters', () => {
    expect(sanitizeSql("It's a \\ path")).toBe("It''s a \\\\ path");
  });

  it('should handle empty strings', () => {
    expect(sanitizeSql('')).toBe('');
  });

  it('should handle strings without special characters', () => {
    expect(sanitizeSql('Hello World')).toBe('Hello World');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => sanitizeSql(123 as any)).toThrow(TypeError);
  });
});

describe('sanitizeXss', () => {
  it('should remove script tags', () => {
    expect(sanitizeXss('<script>alert("XSS")</script>')).toBe('');
  });

  it('should remove script tags with content', () => {
    expect(sanitizeXss('Hello<script>alert(1)</script>World')).toBe('HelloWorld');
  });

  it('should remove inline event handlers with double quotes', () => {
    expect(sanitizeXss('<img src="x" onerror="alert(1)">')).toBe('<img src="x">');
  });

  it('should remove inline event handlers with single quotes', () => {
    expect(sanitizeXss("<img src='x' onerror='alert(1)'>")).toBe("<img src='x'>");
  });

  it('should remove inline event handlers without quotes', () => {
    expect(sanitizeXss('<img src=x onerror=alert(1)>')).toBe('<img src=x>');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeXss('<a href="javascript:alert(1)">Click</a>'))
      .toBe('<a href="alert(1)">Click</a>');
  });

  it('should remove data:text/html protocol', () => {
    expect(sanitizeXss('<a href="data:text/html,<script>alert(1)</script>">'))
      .toBe('<a href=",">');
  });

  it('should handle case-insensitive patterns', () => {
    expect(sanitizeXss('<SCRIPT>alert(1)</SCRIPT>')).toBe('');
    expect(sanitizeXss('<img ONERROR="alert(1)">')).toBe('<img>');
    expect(sanitizeXss('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  it('should handle multiple XSS vectors', () => {
    const input = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    const result = sanitizeXss(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('script');
  });

  it('should handle empty strings', () => {
    expect(sanitizeXss('')).toBe('');
  });

  it('should handle safe HTML', () => {
    expect(sanitizeXss('<div class="safe">Hello</div>'))
      .toBe('<div class="safe">Hello</div>');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => sanitizeXss(123 as any)).toThrow(TypeError);
  });
});

describe('normalizeWhitespace', () => {
  it('should collapse multiple spaces', () => {
    expect(normalizeWhitespace('Hello    World')).toBe('Hello World');
  });

  it('should convert tabs to spaces', () => {
    expect(normalizeWhitespace('Hello\tWorld')).toBe('Hello World');
  });

  it('should convert newlines to spaces', () => {
    expect(normalizeWhitespace('Hello\nWorld')).toBe('Hello World');
  });

  it('should convert carriage returns to spaces', () => {
    expect(normalizeWhitespace('Hello\rWorld')).toBe('Hello World');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  Hello World  ')).toBe('Hello World');
  });

  it('should handle mixed whitespace', () => {
    expect(normalizeWhitespace('  Hello   \t\n  World  \r  ')).toBe('Hello World');
  });

  it('should handle empty strings', () => {
    expect(normalizeWhitespace('')).toBe('');
  });

  it('should handle strings with only whitespace', () => {
    expect(normalizeWhitespace('   \t\n  ')).toBe('');
  });

  it('should handle strings without whitespace', () => {
    expect(normalizeWhitespace('Hello')).toBe('Hello');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => normalizeWhitespace(123 as any)).toThrow(TypeError);
  });
});

describe('stripHtmlTags', () => {
  it('should remove simple HTML tags', () => {
    expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello');
  });

  it('should remove nested HTML tags', () => {
    expect(stripHtmlTags('<div><p>Hello <strong>World</strong></p></div>'))
      .toBe('Hello World');
  });

  it('should remove self-closing tags', () => {
    expect(stripHtmlTags('Hello<br/>World')).toBe('HelloWorld');
  });

  it('should remove tags with attributes', () => {
    expect(stripHtmlTags('<div class="container" id="main">Hello</div>'))
      .toBe('Hello');
  });

  it('should normalize whitespace after tag removal', () => {
    expect(stripHtmlTags('<p>Hello</p>   <p>World</p>')).toBe('Hello World');
  });

  it('should handle empty strings', () => {
    expect(stripHtmlTags('')).toBe('');
  });

  it('should handle strings without HTML', () => {
    expect(stripHtmlTags('Hello World')).toBe('Hello World');
  });

  it('should handle malformed HTML', () => {
    expect(stripHtmlTags('<div>Hello<div>World')).toBe('HelloWorld');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => stripHtmlTags(123 as any)).toThrow(TypeError);
  });
});

describe('sanitizeFilename', () => {
  it('should replace path separators', () => {
    expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
    expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
  });

  it('should prevent directory traversal', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('______etc_passwd');
  });

  it('should remove dangerous characters', () => {
    expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file_______.txt');
  });

  it('should use custom replacement character', () => {
    expect(sanitizeFilename('file/name.txt', { replacement: '-' })).toBe('file-name.txt');
  });

  it('should trim dots and spaces from edges', () => {
    expect(sanitizeFilename('...file.txt...')).toBe('_file.txt_');
    expect(sanitizeFilename('  file.txt  ')).toBe('file.txt');
  });

  it('should enforce maximum length', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const result = sanitizeFilename(longName, { maxLength: 255 });
    expect(result.length).toBeLessThanOrEqual(255);
    expect(result.endsWith('.txt')).toBe(true);
  });

  it('should preserve file extension when truncating', () => {
    const longName = 'a'.repeat(300) + '.jpeg';
    const result = sanitizeFilename(longName, { maxLength: 20 });
    expect(result.endsWith('.jpeg')).toBe(true);
    expect(result.length).toBe(20);
  });

  it('should handle files without extensions', () => {
    expect(sanitizeFilename('filename')).toBe('filename');
  });

  it('should throw error for empty filename after sanitization', () => {
    expect(() => sanitizeFilename('////')).toThrow('Filename cannot be empty after sanitization');
    expect(() => sanitizeFilename('....')).toThrow('Filename cannot be empty after sanitization');
  });

  it('should handle normal filenames', () => {
    expect(sanitizeFilename('my-file_123.txt')).toBe('my-file_123.txt');
  });

  it('should handle control characters', () => {
    expect(sanitizeFilename('file\x00\x01\x02.txt')).toBe('file___.txt');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => sanitizeFilename(123 as any)).toThrow(TypeError);
  });
});

describe('removeNullBytes', () => {
  it('should remove null bytes', () => {
    expect(removeNullBytes('hello\x00world')).toBe('helloworld');
  });

  it('should remove multiple null bytes', () => {
    expect(removeNullBytes('a\x00b\x00c\x00')).toBe('abc');
  });

  it('should handle strings without null bytes', () => {
    expect(removeNullBytes('hello world')).toBe('hello world');
  });

  it('should handle empty strings', () => {
    expect(removeNullBytes('')).toBe('');
  });

  it('should handle string with only null bytes', () => {
    expect(removeNullBytes('\x00\x00\x00')).toBe('');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => removeNullBytes(123 as any)).toThrow(TypeError);
  });
});

describe('sanitizeUrl', () => {
  it('should allow https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('should allow http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('should allow mailto URLs', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
  });

  it('should block javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('should block data: protocol by default', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should block file: protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('should allow custom protocols', () => {
    expect(sanitizeUrl('ftp://example.com', { allowedProtocols: ['http:', 'https:', 'ftp:'] }))
      .toBe('ftp://example.com/');
  });

  it('should allow relative URLs starting with /', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });

  it('should allow relative URLs starting with ./', () => {
    expect(sanitizeUrl('./path/to/page')).toBe('./path/to/page');
  });

  it('should allow relative URLs starting with ../', () => {
    expect(sanitizeUrl('../path/to/page')).toBe('../path/to/page');
  });

  it('should block javascript: in relative URLs', () => {
    expect(sanitizeUrl('/path/javascript:alert(1)')).toBe('');
  });

  it('should block data: in relative URLs', () => {
    expect(sanitizeUrl('/path/data:text/html')).toBe('');
  });

  it('should handle URLs with query parameters', () => {
    const url = 'https://example.com/search?q=test&page=1';
    expect(sanitizeUrl(url)).toBe('https://example.com/search?q=test&page=1');
  });

  it('should handle URLs with fragments', () => {
    expect(sanitizeUrl('https://example.com/page#section')).toBe('https://example.com/page#section');
  });

  it('should trim whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com/');
  });

  it('should remove null bytes', () => {
    expect(sanitizeUrl('https://example.com\x00/path')).toBe('https://example.com/path');
  });

  it('should handle empty strings', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('should handle invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBe('');
    expect(sanitizeUrl('ht!tp://example')).toBe('');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => sanitizeUrl(123 as any)).toThrow(TypeError);
  });
});

describe('sanitizeAll', () => {
  it('should apply all sanitization by default', () => {
    const input = '<script>alert(1)</script>  Hello   \x00World  ';
    const result = sanitizeAll(input);
    expect(result).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt; Hello World');
    expect(result).not.toContain('\x00');
    expect(result).not.toContain('  ');
  });

  it('should skip HTML escaping when disabled', () => {
    const input = '<div>Hello</div>';
    const result = sanitizeAll(input, { escapeHtml: false });
    expect(result).toBe('<div>Hello</div>');
  });

  it('should skip whitespace normalization when disabled', () => {
    const input = 'Hello    World';
    const result = sanitizeAll(input, { normalizeWhitespace: false });
    expect(result).toBe('Hello    World');
  });

  it('should skip null byte removal when disabled', () => {
    const input = 'Hello\x00World';
    const result = sanitizeAll(input, { removeNullBytes: false });
    expect(result).toBe('Hello\x00World');
  });

  it('should handle empty strings', () => {
    expect(sanitizeAll('')).toBe('');
  });

  it('should handle safe strings', () => {
    expect(sanitizeAll('Hello World')).toBe('Hello World');
  });

  it('should apply sanitization in correct order', () => {
    // Order: null bytes -> whitespace -> HTML escape
    const input = '<div>\x00  Hello   </div>';
    const result = sanitizeAll(input);
    expect(result).toBe('&lt;div&gt; Hello &lt;&#x2F;div&gt;');
  });

  it('should throw TypeError for non-string input', () => {
    expect(() => sanitizeAll(123 as any)).toThrow(TypeError);
  });
});

// Integration tests
describe('Integration tests', () => {
  it('should handle complex user input safely', () => {
    const maliciousInput = `
      <script>alert('XSS')</script>
      <img src=x onerror="alert(1)">
      javascript:alert(document.cookie)
      ' OR '1'='1
      \x00null\x00bytes\x00
    `;

    const escaped = escapeHtml(maliciousInput);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');

    const xssSanitized = sanitizeXss(maliciousInput);
    expect(xssSanitized).not.toContain('onerror');
    expect(xssSanitized).not.toContain('javascript:');

    const sqlSanitized = sanitizeSql("' OR '1'='1");
    expect(sqlSanitized).toBe("'' OR ''1''=''1");
  });

  it('should safely process filename uploads', () => {
    const dangerousFilenames = [
      '../../../etc/passwd',
      'file<script>.exe',
      'con.txt',  // Reserved on Windows
      '../../important-file.txt',
    ];

    dangerousFilenames.forEach((filename) => {
      const sanitized = sanitizeFilename(filename);
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });
  });

  it('should safely process URLs from user input', () => {
    const dangerousUrls = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'vbscript:msgbox(1)',
    ];

    dangerousUrls.forEach((url) => {
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('');
    });

    const safeUrls = [
      'https://example.com',
      'http://example.com',
      '/relative/path',
      'mailto:test@example.com',
    ];

    safeUrls.forEach((url) => {
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBeTruthy();
    });
  });
});

// Performance tests
describe('Performance tests', () => {
  it('should handle large strings efficiently', () => {
    const largeString = '<div>' + 'a'.repeat(100000) + '</div>';
    const start = performance.now();
    escapeHtml(largeString);
    const end = performance.now();
    expect(end - start).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should handle many sanitization calls efficiently', () => {
    const testString = '<script>alert("test")</script>';
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      sanitizeXss(testString);
    }
    const end = performance.now();
    expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
  });
});
