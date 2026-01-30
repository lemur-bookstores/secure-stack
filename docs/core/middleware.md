# Middleware System

Middleware in SecureStack provides a powerful way to add cross-cutting concerns like authentication, logging, validation, and more to your API endpoints.

## Table of Contents

- [What is Middleware?](#what-is-middleware)
- [Creating Middleware](#creating-middleware)
- [Applying Middleware](#applying-middleware)
- [Built-in Middleware](#built-in-middleware)
- [Context Augmentation](#context-augmentation)
- [Middleware Composition](#middleware-composition)
- [Advanced Patterns](#advanced-patterns)

## What is Middleware?

Middleware is a function that runs before your handler, allowing you to:
- Authenticate and authorize requests
- Validate input data
- Log requests and responses
- Transform data
- Add data to context
- Handle errors

### Execution Flow

```
Request → Middleware 1 → Middleware 2 → Handler → Response
            ↓              ↓              ↓
         Context       Context        Context
```

## Creating Middleware

### Basic Middleware

```typescript
import { middleware } from '@lemur-bookstores/secure-stack-core';

const loggerMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    console.log(`[${ctx.type}] ${ctx.path} - Start`);
    
    const result = await next();
    
    console.log(`[${ctx.type}] ${ctx.path} - Complete`);
    
    return result;
  });
```

### Middleware with Configuration

```typescript
interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeInput?: boolean;
}

const createLoggerMiddleware = (config: LoggerConfig) => {
  return middleware()
    .use(async ({ ctx, next, input }) => {
      const logger = ctx.logger || console;
      
      logger[config.level](`[${ctx.type}] ${ctx.path}`);
      
      if (config.includeInput) {
        logger.debug('Input:', input);
      }
      
      const result = await next();
      
      logger[config.level](`[${ctx.type}] ${ctx.path} - Complete`);
      
      return result;
    });
};

// Usage
const router = router()
  .middleware(createLoggerMiddleware({ level: 'info', includeInput: true }))
  .query('getData', { ... });
```

## Applying Middleware

### Global Middleware

Apply to all procedures in a router:

```typescript
const router = router()
  .middleware(authMiddleware)
  .middleware(loggerMiddleware)
  .query('protected', {
    handler: async () => ({ data: 'Protected' }),
  })
  .query('alsoProtected', {
    handler: async () => ({ data: 'Also protected' }),
  });
```

### Procedure-Level Middleware

Apply to specific procedures:

```typescript
const router = router()
  .query('public', {
    handler: async () => ({ data: 'Public' }),
  })
  .query('protected', {
    middleware: authMiddleware,
    handler: async () => ({ data: 'Protected' }),
  });
```

### Conditional Middleware

```typescript
const conditionalAuth = (requireAdmin = false) => {
  return middleware()
    .use(async ({ ctx, next }) => {
      const user = await authenticate(ctx);
      
      if (requireAdmin && user.role !== 'admin') {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }
      
      return next({ ctx: { ...ctx, user } });
    });
};

const router = router()
  .query('userDashboard', {
    middleware: conditionalAuth(false),
    handler: async ({ ctx }) => {
      return { user: ctx.user };
    },
  })
  .query('adminPanel', {
    middleware: conditionalAuth(true),
    handler: async ({ ctx }) => {
      return { adminData: '...' };
    },
  });
```

## Built-in Middleware

SecureStack provides several built-in middleware functions:

### Authentication Middleware

```typescript
import { authMiddleware } from '@lemur-bookstores/secure-stack-auth';

const router = router()
  .middleware(authMiddleware({
    jwtSecret: process.env.JWT_SECRET,
    optional: false, // Require authentication
  }))
  .query('profile', {
    handler: async ({ ctx }) => {
      // ctx.user is available
      return ctx.user;
    },
  });
```

### RBAC Middleware

```typescript
import { rbacMiddleware } from '@lemur-bookstores/secure-stack-auth';

const router = router()
  .middleware(authMiddleware())
  .query('viewPost', {
    middleware: rbacMiddleware({ permissions: ['post:read'] }),
    handler: async () => ({ ... }),
  })
  .mutation('deletePost', {
    middleware: rbacMiddleware({ permissions: ['post:delete'] }),
    handler: async () => ({ ... }),
  });
```

### Rate Limiting Middleware

```typescript
import { rateLimitMiddleware } from '@lemur-bookstores/secure-stack-server';

const router = router()
  .middleware(rateLimitMiddleware({
    max: 100, // 100 requests
    window: 60 * 1000, // per minute
    keyGenerator: (ctx) => ctx.user?.id || ctx.ip,
  }))
  .query('search', {
    handler: async ({ input }) => {
      return performSearch(input);
    },
  });
```

### Validation Middleware

```typescript
import { validationMiddleware } from '@lemur-bookstores/secure-stack-core';

const router = router()
  .middleware(validationMiddleware({
    stripUnknown: true,
    abortEarly: false,
  }))
  .mutation('createUser', {
    input: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    handler: async ({ input }) => {
      // Input is validated and unknown fields stripped
      return createUser(input);
    },
  });
```

### Caching Middleware

```typescript
import { cacheMiddleware } from '@lemur-bookstores/secure-stack-server';

const router = router()
  .query('expensiveQuery', {
    middleware: cacheMiddleware({
      ttl: 5 * 60 * 1000, // 5 minutes
      key: (input) => `expensive:${JSON.stringify(input)}`,
    }),
    handler: async ({ input }) => {
      // This will be cached
      return performExpensiveOperation(input);
    },
  });
```

## Context Augmentation

Middleware can add data to the context for use in handlers:

### Adding User to Context

```typescript
const authMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    const token = ctx.req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new SecureStackError({
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      });
    }
    
    const user = await verifyToken(token);
    
    // Add user to context
    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  });

// Use in handler
const router = router()
  .middleware(authMiddleware)
  .query('profile', {
    handler: async ({ ctx }) => {
      // ctx.user is available and typed
      return {
        id: ctx.user.id,
        name: ctx.user.name,
      };
    },
  });
```

### Adding Multiple Services

```typescript
const servicesMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    return next({
      ctx: {
        ...ctx,
        emailService: new EmailService(),
        storageService: new StorageService(),
        analyticsService: new AnalyticsService(),
      },
    });
  });
```

### Type-Safe Context Augmentation

```typescript
import type { Context } from '@lemur-bookstores/secure-stack-core';

interface AuthContext {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

const authMiddleware = middleware<Context, AuthContext>()
  .use(async ({ ctx, next }) => {
    const user = await authenticate(ctx);
    
    return next({
      ctx: {
        ...ctx,
        user, // Typed as AuthContext['user']
      },
    });
  });
```

## Middleware Composition

### Chaining Middleware

```typescript
const router = router()
  .middleware(loggerMiddleware)
  .middleware(authMiddleware)
  .middleware(rbacMiddleware({ permissions: ['admin'] }))
  .query('adminAction', {
    handler: async ({ ctx }) => {
      // All middleware has run
      return { success: true };
    },
  });
```

### Composing Middleware

```typescript
import { compose } from '@lemur-bookstores/secure-stack-core';

const secureMiddleware = compose(
  loggerMiddleware,
  authMiddleware,
  rbacMiddleware({ permissions: ['user'] })
);

const router = router()
  .middleware(secureMiddleware)
  .query('secureEndpoint', { ... });
```

### Conditional Middleware Chain

```typescript
const createSecureChain = (requireAdmin = false) => {
  const chain = [loggerMiddleware, authMiddleware];
  
  if (requireAdmin) {
    chain.push(rbacMiddleware({ permissions: ['admin'] }));
  }
  
  return compose(...chain);
};

const router = router()
  .query('userEndpoint', {
    middleware: createSecureChain(false),
    handler: async () => ({ ... }),
  })
  .query('adminEndpoint', {
    middleware: createSecureChain(true),
    handler: async () => ({ ... }),
  });
```

## Advanced Patterns

### Error Handling Middleware

```typescript
const errorHandlerMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    try {
      return await next();
    } catch (error) {
      // Log error
      ctx.logger.error('Handler error:', error);
      
      // Transform error
      if (error instanceof PrismaClientKnownRequestError) {
        throw new SecureStackError({
          code: 'BAD_REQUEST',
          message: 'Database error',
          cause: error,
        });
      }
      
      throw error;
    }
  });
```

### Performance Monitoring

```typescript
const performanceMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    const start = Date.now();
    
    try {
      const result = await next();
      
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 1000) {
        ctx.logger.warn(`Slow query: ${ctx.path} took ${duration}ms`);
      }
      
      // Send to analytics
      ctx.analytics.track('api_call', {
        path: ctx.path,
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      ctx.analytics.track('api_call', {
        path: ctx.path,
        duration,
        success: false,
        error: error.message,
      });
      
      throw error;
    }
  });
```

### Request Transformation

```typescript
const transformInputMiddleware = middleware()
  .use(async ({ input, next }) => {
    // Transform input before handler
    const transformedInput = {
      ...input,
      email: input.email?.toLowerCase(),
      name: input.name?.trim(),
    };
    
    return next({ input: transformedInput });
  });
```

### Response Transformation

```typescript
const transformResponseMiddleware = middleware()
  .use(async ({ next }) => {
    const result = await next();
    
    // Add metadata to all responses
    return {
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  });
```

### Tenant Isolation

```typescript
const tenantMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    const tenantId = ctx.req.headers['x-tenant-id'];
    
    if (!tenantId) {
      throw new SecureStackError({
        code: 'BAD_REQUEST',
        message: 'Tenant ID required',
      });
    }
    
    // Create tenant-scoped database client
    const tenantDb = ctx.db.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            args.where = { ...args.where, tenantId };
            return query(args);
          },
        },
      },
    });
    
    return next({
      ctx: {
        ...ctx,
        db: tenantDb,
        tenantId,
      },
    });
  });
```

### Idempotency

```typescript
const idempotencyMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    const idempotencyKey = ctx.req.headers['idempotency-key'];
    
    if (!idempotencyKey) {
      return next();
    }
    
    // Check if request was already processed
    const cached = await ctx.redis.get(`idempotency:${idempotencyKey}`);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Process request
    const result = await next();
    
    // Cache result
    await ctx.redis.setex(
      `idempotency:${idempotencyKey}`,
      24 * 60 * 60, // 24 hours
      JSON.stringify(result)
    );
    
    return result;
  });
```

## Best Practices

### 1. Keep Middleware Focused

Each middleware should do one thing well:

```typescript
// ❌ Bad: Middleware doing too much
const megaMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    // Auth
    // Logging
    // Validation
    // Caching
    // Analytics
    // ... too much!
  });

// ✅ Good: Separate concerns
const router = router()
  .middleware(authMiddleware)
  .middleware(loggerMiddleware)
  .middleware(validationMiddleware)
  .middleware(cacheMiddleware);
```

### 2. Order Matters

Apply middleware in the correct order:

```typescript
const router = router()
  .middleware(loggerMiddleware)      // 1. Log first
  .middleware(authMiddleware)        // 2. Then authenticate
  .middleware(rbacMiddleware)        // 3. Then authorize
  .middleware(validationMiddleware)  // 4. Then validate
  .middleware(cacheMiddleware);      // 5. Finally cache
```

### 3. Handle Errors Gracefully

```typescript
const safeMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    try {
      return await next();
    } catch (error) {
      ctx.logger.error('Middleware error:', error);
      // Decide whether to rethrow or handle
      throw error;
    }
  });
```

### 4. Make Middleware Reusable

```typescript
// ✅ Good: Configurable and reusable
const createRateLimiter = (options: RateLimitOptions) => {
  return middleware()
    .use(async ({ ctx, next }) => {
      await checkRateLimit(ctx, options);
      return next();
    });
};
```

## Next Steps

- [Learn about Context](./context.md)
- [Explore Error Handling](./errors.md)
- [See Authentication Examples](../auth/setup.md)
- [View Complete Examples](../examples/auth-example.md)
