import { describe, expect, test } from 'bun:test';
import { validateUser, ValidationResult } from './user-validation';

describe('validateUser', () => {
  describe('email validation', () => {
    test('accepts valid email addresses', () => {
      const result = validateUser('user@example.com', 'ValidPass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('rejects email without @', () => {
      const result = validateUser('userexample.com', 'ValidPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('rejects email without domain', () => {
      const result = validateUser('user@', 'ValidPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('rejects email without local part', () => {
      const result = validateUser('@example.com', 'ValidPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('rejects empty email', () => {
      const result = validateUser('', 'ValidPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });

  describe('password validation', () => {
    test('accepts password with min 8 chars, uppercase, and number', () => {
      const result = validateUser('user@example.com', 'Password1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('rejects password shorter than 8 characters', () => {
      const result = validateUser('user@example.com', 'Pass1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    test('rejects password without uppercase letter', () => {
      const result = validateUser('user@example.com', 'password1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('rejects password without number', () => {
      const result = validateUser('user@example.com', 'Password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('rejects empty password', () => {
      const result = validateUser('user@example.com', '');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });
  });

  describe('combined validation', () => {
    test('reports multiple errors when both email and password are invalid', () => {
      const result = validateUser('invalid-email', 'weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Invalid email format');
    });

    test('accepts when both email and password are valid', () => {
      const result = validateUser('john.doe@example.com', 'SecurePass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
