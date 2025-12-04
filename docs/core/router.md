# Router & Procedures

The router is the core abstraction in SecureStack for defining type-safe API endpoints. This guide covers everything you need to know about routers and procedures.

## Table of Contents

- [Basic Concepts](#basic-concepts)
- [Creating Routers](#creating-routers)
- [Procedure Types](#procedure-types)
- [Input Validation](#input-validation)
- [Type Inference](#type-inference)
- [Nested Routers](#nested-routers)
- [Advanced Patterns](#advanced-patterns)

## Basic Concepts

A **router** is a collection of **procedures**. Each procedure is a type-safe endpoint that can be called from a client.

There are three types of procedures:
- **Query**: For reading data (GET-like operations)
- **Mutation**: For modifying data (POST/PUT/DELETE-like operations)
- **Subscription**: For real-time data streams (WebSocket-based)

## Creating Routers

### Simple Router

```typescript
import { router } from '@lemur-bookstores/core';
import { z } from 'zod';

const userRouter = router()
  .query('getUser', {
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ input }) => {
      return {
        id: input.id,
        name: 'John Doe',
        email: 'john@example.com',
      };
    },
  })
  .mutation('createUser', {
    input: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    handler: async ({ input }) => {
      // Create user in database
      return {
        id: '123',
        ...input,
      };
    },
  });
```

### Router with Context

Access database, services, and other dependencies through context:

```typescript
const userRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input, ctx }) => {
      // ctx.db is available from context
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
      });
      
      if (!user) {
        throw new SecureStackError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      return user;
    },
  });
```

## Procedure Types

### Queries

Queries are for reading data. They should be idempotent and have no side effects.

```typescript
const postRouter = router()
  .query('getPost', {
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      return ctx.db.post.findUnique({
        where: { id: input.id },
        include: { author: true, comments: true },
      });
    },
  })
  .query('listPosts', {
    input: z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      authorId: z.string().optional(),
    }),
    handler: async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.limit;
      
      const [posts, total] = await Promise.all([
        ctx.db.post.findMany({
          where: input.authorId ? { authorId: input.authorId } : {},
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.post.count({
          where: input.authorId ? { authorId: input.authorId } : {},
        }),
      ]);
      
      return {
        posts,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          pages: Math.ceil(total / input.limit),
        },
      };
    },
  });
```

### Mutations

Mutations are for creating, updating, or deleting data.

```typescript
const postRouter = router()
  .mutation('createPost', {
    input: z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      tags: z.array(z.string()).optional(),
    }),
    handler: async ({ input, ctx }) => {
      // Assuming ctx.user is set by auth middleware
      const post = await ctx.db.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
      });
      
      // Invalidate cache, send notifications, etc.
      await ctx.cache.invalidate('posts');
      
      return post;
    },
  })
  .mutation('updatePost', {
    input: z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
    }),
    handler: async ({ input, ctx }) => {
      const { id, ...data } = input;
      
      // Check ownership
      const post = await ctx.db.post.findUnique({ where: { id } });
      if (post.authorId !== ctx.user.id) {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own posts',
        });
      }
      
      return ctx.db.post.update({
        where: { id },
        data,
      });
    },
  })
  .mutation('deletePost', {
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      await ctx.db.post.delete({
        where: { id: input.id },
      });
      
      return { success: true };
    },
  });
```

### Subscriptions

Subscriptions enable real-time data streams using async generators:

```typescript
const chatRouter = router()
  .subscription('onMessage', {
    input: z.object({
      roomId: z.string(),
    }),
    handler: async function* ({ input, ctx }) {
      // Send initial connection message
      yield {
        type: 'connected',
        roomId: input.roomId,
      };
      
      // Subscribe to Redis pub/sub or similar
      const channel = `room:${input.roomId}`;
      
      for await (const message of ctx.redis.subscribe(channel)) {
        yield {
          type: 'message',
          data: message,
        };
      }
    },
  })
  .subscription('onUserStatus', {
    input: z.object({
      userId: z.string(),
    }),
    handler: async function* ({ input, ctx }) {
      // Poll database or listen to events
      while (true) {
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
          select: { status: true, lastSeen: true },
        });
        
        yield {
          status: user.status,
          lastSeen: user.lastSeen,
        };
        
        // Wait before next update
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    },
  });
```

## Input Validation

SecureStack uses [Zod](https://zod.dev/) for runtime type validation:

### Basic Validation

```typescript
const router = router()
  .query('search', {
    input: z.object({
      query: z.string().min(3, 'Query must be at least 3 characters'),
      filters: z.object({
        category: z.enum(['tech', 'business', 'lifestyle']).optional(),
        minPrice: z.number().positive().optional(),
        maxPrice: z.number().positive().optional(),
      }).optional(),
    }),
    handler: async ({ input }) => {
      // input is fully typed and validated
      return performSearch(input);
    },
  });
```

### Custom Validation

```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number');

const authRouter = router()
  .mutation('register', {
    input: z.object({
      email: z.string().email(),
      password: passwordSchema,
      confirmPassword: z.string(),
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
    handler: async ({ input }) => {
      // Registration logic
    },
  });
```

### Transform Input

```typescript
const router = router()
  .query('getUsers', {
    input: z.object({
      ids: z.string().transform(str => str.split(',')),
      // "1,2,3" becomes ["1", "2", "3"]
    }),
    handler: async ({ input }) => {
      // input.ids is string[]
      return fetchUsersByIds(input.ids);
    },
  });
```

## Type Inference

SecureStack provides full type inference without code generation:

### Infer Router Types

```typescript
import type { inferRouterInputs, inferRouterOutputs } from '@lemur-bookstores/core';

const userRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input }) => ({
      id: input.id,
      name: 'John',
      email: 'john@example.com',
    }),
  });

// Infer types
type RouterInputs = inferRouterInputs<typeof userRouter>;
type RouterOutputs = inferRouterOutputs<typeof userRouter>;

// Usage
type GetUserInput = RouterInputs['getUser'];
// { id: string }

type GetUserOutput = RouterOutputs['getUser'];
// { id: string; name: string; email: string }
```

### Use in Client

```typescript
// Client automatically infers types
const { data } = useQuery('user.getUser', {
  input: { id: '123' },
});

// data is typed as { id: string; name: string; email: string }
console.log(data.name); // ✅ TypeScript knows this exists
console.log(data.age);  // ❌ TypeScript error
```

## Nested Routers

Organize large APIs by nesting routers:

```typescript
// user/profile.ts
const profileRouter = router()
  .query('get', { ... })
  .mutation('update', { ... });

// user/settings.ts
const settingsRouter = router()
  .query('get', { ... })
  .mutation('update', { ... });

// user/index.ts
const userRouter = router()
  .query('getUser', { ... })
  .mutation('createUser', { ... })
  .merge('profile', profileRouter)
  .merge('settings', settingsRouter);

// Usage in client
client.user.getUser({ id: '123' });
client.user.profile.get({ userId: '123' });
client.user.settings.update({ theme: 'dark' });
```

### Namespace Organization

```typescript
// api/index.ts
import { userRouter } from './user';
import { postRouter } from './post';
import { commentRouter } from './comment';

const appRouter = router()
  .merge('user', userRouter)
  .merge('post', postRouter)
  .merge('comment', commentRouter);

export type AppRouter = typeof appRouter;
```

## Advanced Patterns

### Conditional Logic

```typescript
const router = router()
  .query('getData', {
    input: z.object({
      includeDetails: z.boolean().default(false),
    }),
    handler: async ({ input, ctx }) => {
      const baseData = await ctx.db.item.findMany();
      
      if (input.includeDetails) {
        return ctx.db.item.findMany({
          include: { details: true, relations: true },
        });
      }
      
      return baseData;
    },
  });
```

### Batch Operations

```typescript
const router = router()
  .mutation('batchCreate', {
    input: z.object({
      items: z.array(z.object({
        name: z.string(),
        value: z.number(),
      })).min(1).max(100),
    }),
    handler: async ({ input, ctx }) => {
      const results = await ctx.db.item.createMany({
        data: input.items,
      });
      
      return {
        created: results.count,
        items: input.items,
      };
    },
  });
```

### File Uploads

```typescript
const router = router()
  .mutation('uploadFile', {
    input: z.object({
      filename: z.string(),
      content: z.string(), // base64 encoded
      mimeType: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      const buffer = Buffer.from(input.content, 'base64');
      
      const url = await ctx.storage.upload({
        filename: input.filename,
        buffer,
        mimeType: input.mimeType,
      });
      
      return { url };
    },
  });
```

### Pagination Helper

```typescript
function createPaginatedQuery<T>(
  fetchFn: (skip: number, take: number) => Promise<T[]>,
  countFn: () => Promise<number>
) {
  return async (input: { page: number; limit: number }) => {
    const skip = (input.page - 1) * input.limit;
    
    const [items, total] = await Promise.all([
      fetchFn(skip, input.limit),
      countFn(),
    ]);
    
    return {
      items,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit),
      },
    };
  };
}

// Usage
const router = router()
  .query('listUsers', {
    input: z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
    }),
    handler: createPaginatedQuery(
      (skip, take) => db.user.findMany({ skip, take }),
      () => db.user.count()
    ),
  });
```

## Best Practices

### 1. Keep Handlers Focused

```typescript
// ❌ Bad: Too much logic in handler
const router = router()
  .mutation('createOrder', {
    handler: async ({ input, ctx }) => {
      // Validate inventory
      // Calculate pricing
      // Process payment
      // Send emails
      // Update analytics
      // ... too much!
    },
  });

// ✅ Good: Delegate to services
const router = router()
  .mutation('createOrder', {
    handler: async ({ input, ctx }) => {
      return ctx.orderService.create(input);
    },
  });
```

### 2. Use Descriptive Names

```typescript
// ❌ Bad
router().query('get', { ... });

// ✅ Good
router().query('getUserById', { ... });
router().query('listActiveUsers', { ... });
```

### 3. Validate Early

```typescript
const router = router()
  .mutation('updateUser', {
    input: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      age: z.number().min(18).max(120),
    }),
    handler: async ({ input, ctx }) => {
      // Input is already validated
      return ctx.db.user.update({ ... });
    },
  });
```

### 4. Handle Errors Gracefully

```typescript
const router = router()
  .query('getUser', {
    handler: async ({ input, ctx }) => {
      try {
        return await ctx.db.user.findUniqueOrThrow({
          where: { id: input.id },
        });
      } catch (error) {
        if (error.code === 'P2025') {
          throw new SecureStackError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        throw error;
      }
    },
  });
```

## Next Steps

- [Learn about Middleware](./middleware.md)
- [Understand Context](./context.md)
- [Explore Error Handling](./errors.md)
- [See Complete Examples](../examples/basic-crud.md)
