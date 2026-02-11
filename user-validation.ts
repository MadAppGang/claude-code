export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates user email and password according to security requirements
 * @param email - Email address to validate
 * @param password - Password to validate
 * @returns ValidationResult with isValid flag and error messages
 */
export function validateUser(email: string, password: string): ValidationResult {
  const errors: string[] = [];

  // Email validation
  if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

  // Password validation
  const passwordErrors = validatePassword(password);
  errors.push(...passwordErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format using a basic regex pattern
 */
function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return false;
  }

  // Basic email regex: localpart@domain
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength requirements
 */
function validatePassword(password: string): string[] {
  const errors: string[] = [];

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return errors;
}
