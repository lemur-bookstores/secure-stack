# Authentication Setup

This guide covers setting up authentication in your SecureStack application using JWT tokens and session management.

## Installation

```bash
npm install @lemur-bookstores/auth bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

## Basic Setup

### 1. Environment Variables

```bash
# .env
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
```

### 2. User Model

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

### 3. Authentication Router

```typescript
// src/routers/auth.ts
import { router } from '@lemur-bookstores/core';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SecureStackError } from '@lemur-bookstores/core';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const authRouter = router()
  // Register new user
  .mutation('register', {
    input: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    }),
    handler: async ({ input, ctx }) => {
      // Check if user exists
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      
      if (existing) {
        throw new SecureStackError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      // Create user
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      
      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      return { user, token };
    },
  })
  
  // Login
  .mutation('login', {
    input: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      // Find user
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      
      if (!user) {
        throw new SecureStackError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }
      
      // Verify password
      const valid = await bcrypt.compare(input.password, user.password);
      
      if (!valid) {
        throw new SecureStackError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }
      
      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    },
  })
  
  // Get current user
  .query('me', {
    middleware: requireAuth, // We'll create this next
    handler: async ({ ctx }) => {
      return ctx.user;
    },
  })
  
  // Refresh token
  .mutation('refresh', {
    middleware: requireAuth,
    handler: async ({ ctx }) => {
      const token = jwt.sign(
        {
          userId: ctx.user.id,
          email: ctx.user.email,
          role: ctx.user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      return { token };
    },
  });
```

### 4. Authentication Middleware

```typescript
// src/middleware/auth.ts
import { middleware } from '@lemur-bookstores/core';
import { SecureStackError } from '@lemur-bookstores/core';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const requireAuth = middleware()
  .use(async ({ ctx, next }) => {
    // Get token from header
    const authHeader = ctx.req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new SecureStackError({
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      // Verify token
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Fetch user from database
      const user = await ctx.db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      
      if (!user) {
        throw new SecureStackError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        });
      }
      
      // Add user to context
      return next({
        ctx: {
          ...ctx,
          user,
        },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new SecureStackError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        });
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        throw new SecureStackError({
          code: 'UNAUTHORIZED',
          message: 'Token expired',
        });
      }
      
      throw error;
    }
  });

// Optional authentication (doesn't throw if no token)
export const optionalAuth = middleware()
  .use(async ({ ctx, next }) => {
    const authHeader = ctx.req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      const user = await ctx.db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      
      if (user) {
        return next({
          ctx: {
            ...ctx,
            user,
          },
        });
      }
    } catch (error) {
      // Ignore errors for optional auth
    }
    
    return next();
  });
```

## Using Authentication

### Protected Routes

```typescript
import { router } from '@lemur-bookstores/core';
import { requireAuth } from './middleware/auth';

const userRouter = router()
  // Public route
  .query('getPublicProfile', {
    input: z.object({ userId: z.string() }),
    handler: async ({ input, ctx }) => {
      return ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true },
      });
    },
  })
  
  // Protected route
  .query('getProfile', {
    middleware: requireAuth,
    handler: async ({ ctx }) => {
      // ctx.user is available
      return ctx.user;
    },
  })
  
  // Protected mutation
  .mutation('updateProfile', {
    middleware: requireAuth,
    input: z.object({
      name: z.string().optional(),
    }),
    handler: async ({ input, ctx }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    },
  });
```

### Global Authentication

```typescript
const protectedRouter = router()
  .middleware(requireAuth) // Apply to all routes
  .query('profile', { ... })
  .mutation('updateProfile', { ... })
  .mutation('deleteAccount', { ... });
```

## Client Integration

### React Setup

```typescript
// src/lib/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Client Configuration

```typescript
// src/lib/client.ts
import { createClient } from '@lemur-bookstores/client';
import { useAuthStore } from './auth';

export const client = createClient({
  url: 'http://localhost:3000/api',
  headers: () => {
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
```

### Login Component

```typescript
import { useMutation } from '@lemur-bookstores/client/react';
import { useAuthStore } from '../lib/auth';

function LoginForm() {
  const setAuth = useAuthStore(state => state.setAuth);
  const login = useMutation('auth.login');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await login.mutateAsync({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      });
      
      setAuth(result.token, result.user);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Advanced Features

### Password Reset

```typescript
const authRouter = router()
  .mutation('requestPasswordReset', {
    input: z.object({ email: z.string().email() }),
    handler: async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      
      if (!user) {
        // Don't reveal if user exists
        return { success: true };
      }
      
      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password-reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Send email with reset link
      await ctx.emailService.send({
        to: user.email,
        subject: 'Password Reset',
        body: `Reset your password: ${process.env.APP_URL}/reset-password?token=${resetToken}`,
      });
      
      return { success: true };
    },
  })
  
  .mutation('resetPassword', {
    input: z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }),
    handler: async ({ input, ctx }) => {
      try {
        const payload = jwt.verify(input.token, JWT_SECRET) as any;
        
        if (payload.type !== 'password-reset') {
          throw new Error('Invalid token type');
        }
        
        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        
        await ctx.db.user.update({
          where: { id: payload.userId },
          data: { password: hashedPassword },
        });
        
        return { success: true };
      } catch (error) {
        throw new SecureStackError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired reset token',
        });
      }
    },
  });
```

## Next Steps

- [Learn about RBAC](./rbac.md)
- [Explore JWT Configuration](./jwt.md)
- [See Authentication Example](../examples/auth-example.md)
- [Understand Security Best Practices](../advanced/security.md)
