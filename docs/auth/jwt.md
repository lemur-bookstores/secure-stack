# JWT Configuration

SecureStack uses JSON Web Tokens (JWT) for stateless authentication. This guide explains how to configure and manage JWTs effectively.

## Configuration

JWT settings are typically managed via environment variables and passed to the auth module.

```typescript
// config/auth.ts
export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default-secret-do-not-use',
  expiresIn: '15m', // Short-lived access tokens
  refreshExpiresIn: '7d', // Long-lived refresh tokens
  issuer: 'my-app',
  audience: 'my-app-users',
};
```

## Token Generation

### Access Token

```typescript
import jwt from 'jsonwebtoken';
import { authConfig } from './config/auth';

const accessToken = jwt.sign(
  {
    userId: user.id,
    role: user.role,
  },
  authConfig.jwtSecret,
  {
    expiresIn: authConfig.expiresIn,
    issuer: authConfig.issuer,
    audience: authConfig.audience,
  }
);
```

### Refresh Token

Refresh tokens should be stored securely (e.g., HTTP-only cookie) and used to obtain new access tokens.

```typescript
const refreshToken = jwt.sign(
  {
    userId: user.id,
    type: 'refresh',
  },
  authConfig.jwtSecret,
  {
    expiresIn: authConfig.refreshExpiresIn,
  }
);
```

## Token Verification

The authentication middleware automatically verifies tokens.

```typescript
// middleware/auth.ts
import { middleware } from '@lemur-bookstores/secure-stack-core';
import jwt from 'jsonwebtoken';

export const authMiddleware = middleware().use(async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return next({
      ctx: { ...ctx, user: decoded },
    });
  } catch (err) {
    throw new Error('Invalid token');
  }
});
```

## Refresh Token Rotation

To enhance security, implement refresh token rotation. When a refresh token is used, issue a new one and invalidate the old one.

```typescript
router().mutation('refreshToken', {
  input: z.object({ refreshToken: z.string() }),
  handler: async ({ input, ctx }) => {
    // 1. Verify old refresh token
    const decoded = jwt.verify(input.refreshToken, process.env.JWT_SECRET);
    
    // 2. Check if token is in blocklist (if implemented)
    // ...
    
    // 3. Issue new tokens
    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);
    
    // 4. Invalidate old refresh token (optional but recommended)
    // ...
    
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },
});
```

## Security Best Practices

1.  **HTTPS Only**: Always transmit tokens over HTTPS.
2.  **Short Expiration**: Keep access tokens short-lived (e.g., 15 minutes).
3.  **Secure Storage**: Store refresh tokens in `HttpOnly` cookies to prevent XSS attacks.
4.  **Algorithm**: Use strong algorithms like `HS256` or `RS256`.
