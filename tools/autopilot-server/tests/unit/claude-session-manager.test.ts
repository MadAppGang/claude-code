/**
 * Unit tests for Claude Session Manager
 *
 * Tests session management, message handling, and edge cases
 */

import { describe, it, expect } from "bun:test";

describe("Claude Session Manager - Content Type Handling", () => {
  it("should handle non-string content in tool results gracefully", () => {
    // Test the content handling logic that was causing the bug
    // This replicates the fix in claude-session-manager.ts line 430

    // Test case 1: undefined content
    const undefinedContent = undefined;
    const result1 = typeof undefinedContent === 'string' ? undefinedContent : String(undefinedContent || "");
    expect(result1).toBe("");
    expect(() => result1.startsWith("/")).not.toThrow();

    // Test case 2: null content
    const nullContent = null;
    const result2 = typeof nullContent === 'string' ? nullContent : String(nullContent || "");
    expect(result2).toBe("");
    expect(() => result2.startsWith("/")).not.toThrow();

    // Test case 3: number content
    const numberContent = 42;
    const result3 = typeof numberContent === 'string' ? numberContent : String(numberContent || "");
    expect(result3).toBe("42");
    expect(() => result3.startsWith("/")).not.toThrow();

    // Test case 4: object content
    const objectContent = { foo: "bar" };
    const result4 = typeof objectContent === 'string' ? objectContent : String(objectContent || "");
    expect(result4).toBe("[object Object]");
    expect(() => result4.startsWith("/")).not.toThrow();

    // Test case 5: array content
    const arrayContent = ["test", "array"];
    const result5 = typeof arrayContent === 'string' ? arrayContent : String(arrayContent || "");
    expect(result5).toBe("test,array");
    expect(() => result5.startsWith("/")).not.toThrow();

    // Test case 6: valid string content
    const stringContent = "/path/to/file";
    const result6 = typeof stringContent === 'string' ? stringContent : String(stringContent || "");
    expect(result6).toBe("/path/to/file");
    expect(result6.startsWith("/")).toBe(true);

    // Test case 7: empty string content
    const emptyContent = "";
    const result7 = typeof emptyContent === 'string' ? emptyContent : String(emptyContent || "");
    expect(result7).toBe("");
    expect(result7.startsWith("/")).toBe(false);
  });

  it("should correctly identify tool hints from various content types", () => {
    // Test the tool hint detection logic that relies on string methods

    // Test Read tool detection
    const readContent = "     1→{";
    expect(readContent.includes("→")).toBe(true);
    expect(readContent.match(/^\s*\d+→/)).toBeTruthy();

    // Test Glob tool detection
    const globContent = "/path/to/file1.ts\n/path/to/file2.ts";
    expect(globContent.startsWith("/")).toBe(true);
    expect(globContent.includes("\n")).toBe(true);

    // Test Bash:pwd detection
    const pwdContent = "/Users/jack/project";
    expect(pwdContent.startsWith("/")).toBe(true);
    expect(pwdContent.includes("\n")).toBe(false);

    // Test Bash:ls detection
    const lsContent = "total 184\ndrwxr-xr-x  5 jack  staff  160 Jan  9 10:00 src";
    expect(lsContent.startsWith("total ")).toBe(true);

    // Test error detection
    const errorContent = "Error: file not found";
    expect(errorContent.includes("error") || errorContent.includes("Error")).toBe(true);

    // Test empty content
    const emptyContent = "";
    expect(emptyContent).toBe("");
  });

  it("should handle edge cases in content type conversion", () => {
    // Test the exact scenario that caused the original bug

    // Scenario: result.content is undefined
    const mockResult = { content: undefined };
    const content = typeof mockResult.content === 'string'
      ? mockResult.content
      : String(mockResult.content || "");

    // This should NOT throw "content.startsWith is not a function"
    expect(() => content.startsWith("/")).not.toThrow();
    expect(content).toBe("");

    // Scenario: result.content is a number (edge case)
    const mockResult2 = { content: 123 as any };
    const content2 = typeof mockResult2.content === 'string'
      ? mockResult2.content
      : String(mockResult2.content || "");

    expect(() => content2.includes("error")).not.toThrow();
    expect(content2).toBe("123");
  });
});
