# Authentication & Authorization Example

This example demonstrates a complete authentication flow including registration, login, JWT management, and Role-Based Access Control (RBAC).

## Features

- **User Registration**: Hash passwords with bcrypt.
- **Login**: Issue JWT access and refresh tokens.
- **Middleware**: Protect routes with authentication middleware.
- **RBAC**: Restrict access based on user roles (Admin vs User).

## 1. Setup & Configuration

```typescript
// config.ts
export const JWT_SECRET = 'super-secret-key';
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;
```

## 2. Database Schema (Prisma)

```prisma
model User {
  id       String @id @default(uuid())
  email    String @unique
  password String
  role     String @default("user")
}
```

## 3. Authentication Logic

```typescript
// auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from './config';

export const hashPassword = (pwd: string) => bcrypt.hash(pwd, 10);
export const verifyPassword = (pwd: string, hash: string) => bcrypt.compare(pwd, hash);

export const generateTokens = (user: { id: string; role: string }) => {
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
```

## 4. Middleware

```typescript
// middleware.ts
import { middleware, SecureStackError } from '@lemur-bookstores/core';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config';

export const isAuthenticated = middleware().use(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers.authorization;
  if (!authHeader) throw new SecureStackError({ code: 'UNAUTHORIZED', message: 'No token' });

  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    return next({ ctx: { ...ctx, user } });
  } catch {
    throw new SecureStackError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
  }
});

export const hasRole = (role: string) => middleware().use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== role) {
    throw new SecureStackError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
  }
  return next();
});
```

## 5. Router Implementation

```typescript
// server.ts
import { SecureStackServer, router } from '@lemur-bookstores/server';
import { z } from 'zod';
import { hashPassword, verifyPassword, generateTokens } from './auth';
import { isAuthenticated, hasRole } from './middleware';

const app = new SecureStackServer({ name: 'auth-demo', port: 3000 });

const authRouter = router()
  .mutation('register', {
    input: z.object({ email: z.string().email(), password: z.string().min(6) }),
    handler: async ({ input, ctx }) => {
      const hashedPassword = await hashPassword(input.password);
      const user = await ctx.db.user.create({
        data: { email: input.email, password: hashedPassword },
      });
      return { id: user.id, email: user.email };
    },
  })
  .mutation('login', {
    input: z.object({ email: z.string(), password: z.string() }),
    handler: async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (!user || !(await verifyPassword(input.password, user.password))) {
        throw new SecureStackError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }
      return generateTokens(user);
    },
  });

const adminRouter = router()
  .middleware(isAuthenticated)
  .middleware(hasRole('admin')) // Only admins can access
  .query('dashboard', {
    handler: async () => ({ secretData: 'Only for admins' }),
  });

const userRouter = router()
  .middleware(isAuthenticated)
  .query('profile', {
    handler: async ({ ctx }) => ({ id: ctx.user.userId, role: ctx.user.role }),
  });

app.router('auth', authRouter);
app.router('admin', adminRouter);
app.router('user', userRouter);

await app.start();
```

## 6. Client Usage

```typescript
// client.ts
import { createClient } from '@lemur-bookstores/client';

const client = createClient({
  url: 'http://localhost:3000',
  headers: () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }),
});

// Login
const { accessToken } = await client.auth.login.mutate({
  email: 'admin@example.com',
  password: 'password',
});
localStorage.setItem('token', accessToken);

// Access protected route
try {
  const data = await client.admin.dashboard.query();
  console.log(data);
} catch (err) {
  console.error('Access denied');
}
```
