import { validateUser } from './user-validation';

// Example 1: Valid user
console.log('Example 1: Valid credentials');
const validResult = validateUser('john.doe@example.com', 'SecurePass123');
console.log('Result:', validResult);
console.log('---\n');

// Example 2: Invalid email
console.log('Example 2: Invalid email format');
const invalidEmailResult = validateUser('not-an-email', 'ValidPass123');
console.log('Result:', invalidEmailResult);
console.log('---\n');

// Example 3: Weak password
console.log('Example 3: Weak password');
const weakPasswordResult = validateUser('user@example.com', 'weak');
console.log('Result:', weakPasswordResult);
console.log('---\n');

// Example 4: Multiple errors
console.log('Example 4: Multiple validation errors');
const multipleErrorsResult = validateUser('invalid', 'no');
console.log('Result:', multipleErrorsResult);
console.log('Errors:', multipleErrorsResult.errors);
