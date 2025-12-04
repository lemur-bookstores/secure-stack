# Basic CRUD Application

This guide walks through building a complete CRUD (Create, Read, Update, Delete) application with SecureStack.

## What We'll Build

A simple blog API with:
- User authentication
- Post management (create, read, update, delete)
- Comment system
- Tag filtering

## Project Setup

### 1. Install Dependencies

```bash
npm install @lemur-bookstores/core @lemur-bookstores/server @lemur-bookstores/auth
npm install @prisma/client zod
npm install -D prisma typescript tsx
```

### 2. Database Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  posts     Post[]
  comments  Comment[]
  createdAt DateTime @default(now())
}

model Post {
  id        String    @id @default(uuid())
  title     String
  content   String
  published Boolean   @default(false)
  authorId  String
  author    User      @relation(fields: [authorId], references: [id])
  comments  Comment[]
  tags      Tag[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}

model Tag {
  id    String @id @default(uuid())
  name  String @unique
  posts Post[]
}
```

### 3. Initialize Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Server Implementation

### Context Setup

```typescript
// src/context.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createContext = () => ({
  db: prisma,
});

export type Context = ReturnType<typeof createContext>;
```

### User Router

```typescript
// src/routers/user.ts
import { router } from '@lemur-bookstores/core';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SecureStackError } from '@lemur-bookstores/core';

export const userRouter = router()
  .mutation('register', {
    input: z.object({
      email: z.string().email(),
      name: z.string().min(2),
      password: z.string().min(8),
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
          name: input.name,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
      
      return user;
    },
  })
  .query('getUser', {
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
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

### Post Router

```typescript
// src/routers/post.ts
import { router, middleware } from '@lemur-bookstores/core';
import { z } from 'zod';
import { SecureStackError } from '@lemur-bookstores/core';

// Auth middleware (simplified - use @lemur-bookstores/auth in production)
const requireAuth = middleware()
  .use(async ({ ctx, next }) => {
    // In real app, verify JWT token
    const userId = ctx.req.headers['x-user-id'];
    
    if (!userId) {
      throw new SecureStackError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }
    
    const user = await ctx.db.user.findUnique({
      where: { id: userId as string },
    });
    
    if (!user) {
      throw new SecureStackError({
        code: 'UNAUTHORIZED',
        message: 'Invalid user',
      });
    }
    
    return next({ ctx: { ...ctx, user } });
  });

export const postRouter = router()
  // List posts
  .query('list', {
    input: z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      published: z.boolean().optional(),
      tag: z.string().optional(),
    }),
    handler: async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.limit;
      
      const where = {
        ...(input.published !== undefined && { published: input.published }),
        ...(input.tag && {
          tags: {
            some: { name: input.tag },
          },
        }),
      };
      
      const [posts, total] = await Promise.all([
        ctx.db.post.findMany({
          where,
          skip,
          take: input.limit,
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
            tags: true,
            _count: {
              select: { comments: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.post.count({ where }),
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
  })
  
  // Get single post
  .query('get', {
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          tags: true,
          comments: {
            include: {
              author: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      
      if (!post) {
        throw new SecureStackError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }
      
      return post;
    },
  })
  
  // Create post
  .mutation('create', {
    middleware: requireAuth,
    input: z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      published: z.boolean().default(false),
      tags: z.array(z.string()).optional(),
    }),
    handler: async ({ input, ctx }) => {
      const { tags, ...postData } = input;
      
      const post = await ctx.db.post.create({
        data: {
          ...postData,
          authorId: ctx.user.id,
          ...(tags && {
            tags: {
              connectOrCreate: tags.map(tag => ({
                where: { name: tag },
                create: { name: tag },
              })),
            },
          }),
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          tags: true,
        },
      });
      
      return post;
    },
  })
  
  // Update post
  .mutation('update', {
    middleware: requireAuth,
    input: z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      published: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }),
    handler: async ({ input, ctx }) => {
      const { id, tags, ...updateData } = input;
      
      // Check ownership
      const existing = await ctx.db.post.findUnique({
        where: { id },
      });
      
      if (!existing) {
        throw new SecureStackError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }
      
      if (existing.authorId !== ctx.user.id) {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own posts',
        });
      }
      
      const post = await ctx.db.post.update({
        where: { id },
        data: {
          ...updateData,
          ...(tags && {
            tags: {
              set: [],
              connectOrCreate: tags.map(tag => ({
                where: { name: tag },
                create: { name: tag },
              })),
            },
          }),
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          tags: true,
        },
      });
      
      return post;
    },
  })
  
  // Delete post
  .mutation('delete', {
    middleware: requireAuth,
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      });
      
      if (!post) {
        throw new SecureStackError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }
      
      if (post.authorId !== ctx.user.id) {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own posts',
        });
      }
      
      await ctx.db.post.delete({
        where: { id: input.id },
      });
      
      return { success: true };
    },
  });
```

### Comment Router

```typescript
// src/routers/comment.ts
import { router } from '@lemur-bookstores/core';
import { z } from 'zod';
import { SecureStackError } from '@lemur-bookstores/core';

export const commentRouter = router()
  .mutation('create', {
    middleware: requireAuth,
    input: z.object({
      postId: z.string(),
      content: z.string().min(1).max(500),
    }),
    handler: async ({ input, ctx }) => {
      // Verify post exists
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
      });
      
      if (!post) {
        throw new SecureStackError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }
      
      const comment = await ctx.db.comment.create({
        data: {
          content: input.content,
          postId: input.postId,
          authorId: ctx.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });
      
      return comment;
    },
  })
  
  .mutation('delete', {
    middleware: requireAuth,
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });
      
      if (!comment) {
        throw new SecureStackError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }
      
      if (comment.authorId !== ctx.user.id) {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        });
      }
      
      await ctx.db.comment.delete({
        where: { id: input.id },
      });
      
      return { success: true };
    },
  });
```

### Main Server

```typescript
// src/index.ts
import { SecureStackServer } from '@lemur-bookstores/server';
import { createContext } from './context';
import { userRouter } from './routers/user';
import { postRouter } from './routers/post';
import { commentRouter } from './routers/comment';

const app = new SecureStackServer({
  name: 'blog-api',
  port: 3000,
  context: createContext,
  cors: {
    origin: '*',
    credentials: true,
  },
});

// Register routers
app.router('user', userRouter);
app.router('post', postRouter);
app.router('comment', commentRouter);

// Lifecycle hooks
app.hook('onReady', () => {
  console.log('✅ Blog API is ready!');
  console.log('📡 API available at http://localhost:3000/api');
});

// Start server
await app.start();
```

## Testing the API

### Register a User

```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "password123"
  }'
```

### Create a Post

```bash
curl -X POST http://localhost:3000/api/post/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE" \
  -d '{
    "title": "My First Post",
    "content": "This is my first blog post!",
    "published": true,
    "tags": ["tech", "tutorial"]
  }'
```

### List Posts

```bash
curl "http://localhost:3000/api/post/list?input=%7B%22page%22%3A1%2C%22limit%22%3A10%7D"
```

### Get Single Post

```bash
curl "http://localhost:3000/api/post/get?input=%7B%22id%22%3A%22POST_ID%22%7D"
```

## Next Steps

- [Add Authentication](../auth/setup.md)
- [Implement Real-time Features](./realtime.md)
- [Build a Client](../client/react-hooks.md)
- [Deploy to Production](../advanced/deployment.md)
