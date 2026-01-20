---
name: auth-patterns
version: 1.0.0
description: Use when implementing authentication (JWT, sessions, OAuth), authorization (RBAC, ABAC), password hashing, MFA, or security best practices for backend services.
keywords:
  - authentication
  - authorization
  - JWT
  - sessions
  - OAuth
  - RBAC
  - ABAC
  - password hashing
  - bcrypt
  - MFA
  - security
plugin: dev
updated: 2026-01-20
---

# Authentication Patterns

## Overview

Authentication and authorization patterns for securing backend applications.

## Authentication Methods

### JWT (JSON Web Tokens)

```
┌─────────────────────────────────────────────────────────┐
│ Header.Payload.Signature                                │
│                                                         │
│ Header:  { "alg": "HS256", "typ": "JWT" }              │
│ Payload: { "sub": "user123", "exp": 1609459200, ... }  │
│ Signature: HMACSHA256(base64(header) + "." +            │
│            base64(payload), secret)                      │
└─────────────────────────────────────────────────────────┘
```

**Token Structure:**

```typescript
interface JWTPayload {
  sub: string;      // Subject (user ID)
  iat: number;      // Issued at
  exp: number;      // Expiration
  iss?: string;     // Issuer
  aud?: string;     // Audience
  roles?: string[]; // Custom claims
}
```

**Implementation:**

```typescript
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { sub: user.id, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
}
```

### Session-Based Authentication

```typescript
// Session storage (Redis recommended for production)
interface Session {
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// Login
async function login(email: string, password: string, req: Request) {
  const user = await findUserByEmail(email);
  if (!user || !await verifyPassword(password, user.passwordHash)) {
    throw new AuthError('Invalid credentials');
  }

  const sessionId = generateSecureId();
  await redis.set(`session:${sessionId}`, JSON.stringify({
    userId: user.id,
    createdAt: new Date(),
    expiresAt: addDays(new Date(), 7),
    userAgent: req.headers['user-agent'],
  }), 'EX', 7 * 24 * 60 * 60);

  return sessionId;
}

// Middleware
async function authenticate(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.session;
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });

  const session = await redis.get(`session:${sessionId}`);
  if (!session) return res.status(401).json({ error: 'Session expired' });

  req.user = JSON.parse(session);
  next();
}
```

### OAuth 2.0 / OpenID Connect

```
┌──────────┐                              ┌──────────────┐
│  Client  │──────1. Auth Request──────▶│    Auth      │
│  (App)   │◀─────2. Auth Code──────────│   Provider   │
│          │──────3. Exchange Code──────▶│  (Google,    │
│          │◀─────4. Access Token───────│   GitHub)    │
│          │──────5. API Requests───────▶│              │
└──────────┘                              └──────────────┘
```

**Implementation with Passport.js:**

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    const user = await findOrCreateUser({
      provider: 'google',
      providerId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
    });
    done(null, user);
  }
));

// Routes
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/dashboard')
);
```

## Password Security

### Hashing

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Password Requirements

```typescript
const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain a special character');
  }

  return errors;
}
```

## Authorization Patterns

### Role-Based Access Control (RBAC)

```typescript
type Role = 'admin' | 'editor' | 'viewer';

const PERMISSIONS: Record<Role, string[]> = {
  admin: ['read', 'write', 'delete', 'manage_users'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

function hasPermission(user: User, permission: string): boolean {
  return user.roles.some(role =>
    PERMISSIONS[role]?.includes(permission)
  );
}

// Middleware
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.delete('/users/:id', requirePermission('manage_users'), deleteUser);
```

### Attribute-Based Access Control (ABAC)

```typescript
interface Policy {
  resource: string;
  action: string;
  condition: (user: User, resource: any) => boolean;
}

const policies: Policy[] = [
  {
    resource: 'document',
    action: 'edit',
    condition: (user, doc) =>
      doc.ownerId === user.id || user.roles.includes('admin'),
  },
  {
    resource: 'document',
    action: 'delete',
    condition: (user, doc) =>
      doc.ownerId === user.id,
  },
];

function canPerform(user: User, action: string, resource: string, resourceData: any): boolean {
  const policy = policies.find(p =>
    p.resource === resource && p.action === action
  );
  if (!policy) return false;
  return policy.condition(user, resourceData);
}
```

## Security Best Practices

### Token Storage

| Storage | Access Token | Refresh Token |
|---------|--------------|---------------|
| Memory | Yes | No |
| HttpOnly Cookie | Yes (CSRF protection needed) | Yes |
| localStorage | Avoid | Never |
| sessionStorage | Last resort | Never |

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many login attempts, try again later' },
  standardHeaders: true,
});

app.post('/auth/login', authLimiter, loginHandler);
```

### Account Lockout

```typescript
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

async function handleLogin(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError('Account locked. Try again later.');
  }

  if (!await verifyPassword(password, user.passwordHash)) {
    await incrementFailedAttempts(user.id);
    if (user.failedAttempts + 1 >= MAX_FAILED_ATTEMPTS) {
      await lockAccount(user.id, LOCKOUT_DURATION);
    }
    throw new AuthError('Invalid credentials');
  }

  await resetFailedAttempts(user.id);
  return generateTokens(user);
}
```

### Secure Headers

```typescript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
}));
```

## Multi-Factor Authentication

### TOTP (Time-based One-Time Password)

```typescript
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Setup MFA
async function setupMFA(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `MyApp (${user.email})`,
  });

  await saveUserMFASecret(userId, secret.base32);

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, qrCode: qrCodeUrl };
}

// Verify MFA code
function verifyMFACode(secret: string, code: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1, // Allow 1 step tolerance
  });
}
```

## Refresh Token Rotation

```typescript
async function refreshTokens(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  // Check if token is in blocklist (revoked)
  if (await isTokenRevoked(refreshToken)) {
    throw new AuthError('Token revoked');
  }

  // Revoke old refresh token
  await revokeToken(refreshToken);

  // Generate new tokens
  const user = await findUserById(payload.sub);
  return generateTokens(user);
}
```

---

*Authentication and authorization patterns for secure applications*
