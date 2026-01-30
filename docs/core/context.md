# Context Management

Context in SecureStack provides a powerful dependency injection system that makes services, database connections, and request-scoped data available throughout your application.

## Table of Contents

- [What is Context?](#what-is-context)
- [Creating Context](#creating-context)
- [Using Context](#using-context)
- [Context Augmentation](#context-augmentation)
- [Type-Safe Context](#type-safe-context)
- [Common Patterns](#common-patterns)

## What is Context?

Context is an object that:
- Contains request-scoped data (user, request info, etc.)
- Provides access to services (database, cache, email, etc.)
- Can be augmented by middleware
- Is fully type-safe

### Default Context

Every request has a default context with:

```typescript
interface DefaultContext {
  req: Request;        // HTTP request object
  res: Response;       // HTTP response object
  type: 'query' | 'mutation' | 'subscription';
  path: string;        // Procedure path
  input: unknown;      // Validated input
}
```

## Creating Context

### Basic Context

```typescript
import { SecureStackServer } from '@lemur-bookstores/secure-stack-server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const app = new SecureStackServer({
  name: 'my-api',
  port: 3000,
  context: () => ({
    db: prisma,
  }),
});
```

### Context with Services

```typescript
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { S3Client } from '@aws-sdk/client-s3';

const createContext = () => {
  return {
    db: new PrismaClient(),
    redis: new Redis(process.env.REDIS_URL),
    s3: new S3Client({ region: 'us-east-1' }),
    logger: winston.createLogger({ ... }),
  };
};

const app = new SecureStackServer({
  context: createContext,
});
```

### Request-Scoped Context

Access request information in context:

```typescript
const createContext = ({ req, res }) => {
  return {
    db: prisma,
    req,
    res,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
};
```

### Async Context

Context creator can be async:

```typescript
const createContext = async ({ req }) => {
  // Initialize async services
  const redis = await connectRedis();
  
  // Fetch request-specific data
  const tenant = await getTenantFromRequest(req);
  
  return {
    db: prisma,
    redis,
    tenant,
  };
};
```

## Using Context

### In Handlers

```typescript
const userRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input, ctx }) => {
      // Access context services
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
      });
      
      // Use logger
      ctx.logger.info(`User ${input.id} fetched`);
      
      // Cache result
      await ctx.redis.setex(
        `user:${input.id}`,
        3600,
        JSON.stringify(user)
      );
      
      return user;
    },
  });
```

### In Middleware

```typescript
const loggerMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    ctx.logger.info(`[${ctx.type}] ${ctx.path} - Start`);
    
    const result = await next();
    
    ctx.logger.info(`[${ctx.type}] ${ctx.path} - Complete`);
    
    return result;
  });
```

## Context Augmentation

Middleware can add data to context:

### Adding User

```typescript
const authMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    const token = ctx.req.headers.authorization?.replace('Bearer ', '');
    const user = await verifyToken(token, ctx.db);
    
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
      // ctx.user is available
      return {
        id: ctx.user.id,
        email: ctx.user.email,
      };
    },
  });
```

### Adding Multiple Properties

```typescript
const enrichContextMiddleware = middleware()
  .use(async ({ ctx, next }) => {
    const session = await getSession(ctx.req);
    const permissions = await getPermissions(session.userId);
    
    return next({
      ctx: {
        ...ctx,
        session,
        permissions,
        isAdmin: permissions.includes('admin'),
      },
    });
  });
```

## Type-Safe Context

### Define Context Type

```typescript
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

interface AppContext {
  db: PrismaClient;
  redis: Redis;
  logger: Logger;
}

const createContext = (): AppContext => ({
  db: new PrismaClient(),
  redis: new Redis(),
  logger: winston.createLogger(),
});
```

### Augmented Context Types

```typescript
interface BaseContext {
  db: PrismaClient;
  redis: Redis;
}

interface AuthContext extends BaseContext {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

const authMiddleware = middleware<BaseContext, AuthContext>()
  .use(async ({ ctx, next }) => {
    const user = await authenticate(ctx);
    
    return next({
      ctx: {
        ...ctx,
        user, // Typed correctly
      },
    });
  });
```

### Type Inference

```typescript
const createContext = () => ({
  db: prisma,
  redis: redisClient,
  emailService: new EmailService(),
});

type Context = ReturnType<typeof createContext>;

// Use in handlers
const handler = async ({ ctx }: { ctx: Context }) => {
  // ctx is fully typed
  await ctx.emailService.send({ ... });
};
```

## Common Patterns

### Database Connection

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createContext = () => ({
  db: prisma,
});

// Use in handlers
const handler = async ({ ctx }) => {
  const users = await ctx.db.user.findMany();
  return users;
};
```

### Caching Layer

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const createContext = () => ({
  db: prisma,
  cache: {
    get: async (key: string) => {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    },
    set: async (key: string, value: any, ttl: number) => {
      await redis.setex(key, ttl, JSON.stringify(value));
    },
    del: async (key: string) => {
      await redis.del(key);
    },
  },
});

// Use in handlers
const handler = async ({ input, ctx }) => {
  const cacheKey = `user:${input.id}`;
  
  // Try cache first
  const cached = await ctx.cache.get(cacheKey);
  if (cached) return cached;
  
  // Fetch from database
  const user = await ctx.db.user.findUnique({
    where: { id: input.id },
  });
  
  // Cache result
  await ctx.cache.set(cacheKey, user, 3600);
  
  return user;
};
```

### Service Layer

```typescript
class UserService {
  constructor(private db: PrismaClient) {}
  
  async getUser(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }
  
  async createUser(data: CreateUserInput) {
    return this.db.user.create({ data });
  }
}

class EmailService {
  async send(to: string, subject: string, body: string) {
    // Send email logic
  }
}

const createContext = () => ({
  db: prisma,
  userService: new UserService(prisma),
  emailService: new EmailService(),
});

// Use in handlers
const handler = async ({ input, ctx }) => {
  const user = await ctx.userService.createUser(input);
  
  await ctx.emailService.send(
    user.email,
    'Welcome!',
    'Welcome to our platform'
  );
  
  return user;
};
```

### Multi-Tenancy

```typescript
const createContext = async ({ req }) => {
  const tenantId = req.headers['x-tenant-id'];
  
  if (!tenantId) {
    throw new Error('Tenant ID required');
  }
  
  // Create tenant-scoped database client
  const tenantDb = prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
    },
  });
  
  return {
    db: tenantDb,
    tenantId,
  };
};

// All queries automatically scoped to tenant
const handler = async ({ ctx }) => {
  // Only returns users for this tenant
  return ctx.db.user.findMany();
};
```

### Request Tracking

```typescript
import { v4 as uuidv4 } from 'uuid';

const createContext = ({ req }) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  const logger = winston.createLogger({
    defaultMeta: { requestId },
  });
  
  return {
    db: prisma,
    requestId,
    logger,
  };
};

// All logs include request ID
const handler = async ({ ctx }) => {
  ctx.logger.info('Processing request');
  // Log: { message: 'Processing request', requestId: '...' }
};
```

### Feature Flags

```typescript
class FeatureFlagService {
  constructor(private redis: Redis) {}
  
  async isEnabled(flag: string, userId?: string): Promise<boolean> {
    // Check feature flag logic
    const enabled = await this.redis.get(`flag:${flag}`);
    return enabled === 'true';
  }
}

const createContext = () => ({
  db: prisma,
  redis: redisClient,
  features: new FeatureFlagService(redisClient),
});

// Use in handlers
const handler = async ({ ctx }) => {
  const newFeatureEnabled = await ctx.features.isEnabled(
    'new-feature',
    ctx.user?.id
  );
  
  if (newFeatureEnabled) {
    return newImplementation();
  } else {
    return oldImplementation();
  }
};
```

### Analytics Tracking

```typescript
class AnalyticsService {
  async track(event: string, properties: Record<string, any>) {
    // Send to analytics platform
    console.log('Analytics:', event, properties);
  }
}

const createContext = ({ req }) => ({
  db: prisma,
  analytics: new AnalyticsService(),
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

// Track events in handlers
const handler = async ({ input, ctx }) => {
  const result = await processData(input);
  
  await ctx.analytics.track('data_processed', {
    userId: ctx.user?.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  
  return result;
};
```

## Best Practices

### 1. Initialize Services Once

```typescript
// ✅ Good: Create services once
const prisma = new PrismaClient();
const redis = new Redis();

const createContext = () => ({
  db: prisma,
  redis,
});

// ❌ Bad: Creating new instances per request
const createContext = () => ({
  db: new PrismaClient(), // Don't do this!
  redis: new Redis(),     // Don't do this!
});
```

### 2. Keep Context Lean

```typescript
// ✅ Good: Only essential services
const createContext = () => ({
  db: prisma,
  redis: redisClient,
  logger: logger,
});

// ❌ Bad: Too much in context
const createContext = () => ({
  db: prisma,
  redis: redisClient,
  s3: s3Client,
  ses: sesClient,
  sns: snsClient,
  sqs: sqsClient,
  // ... too many services
});
```

### 3. Use Dependency Injection

```typescript
// ✅ Good: Services receive dependencies
class UserService {
  constructor(
    private db: PrismaClient,
    private emailService: EmailService
  ) {}
}

const createContext = () => {
  const emailService = new EmailService();
  const userService = new UserService(prisma, emailService);
  
  return {
    db: prisma,
    userService,
    emailService,
  };
};
```

### 4. Type Everything

```typescript
// ✅ Good: Fully typed context
interface AppContext {
  db: PrismaClient;
  redis: Redis;
  logger: Logger;
}

const createContext = (): AppContext => ({
  db: prisma,
  redis: redisClient,
  logger: logger,
});
```

## Next Steps

- [Learn about Middleware](./middleware.md)
- [Explore Error Handling](./errors.md)
- [See Service Layer Patterns](../advanced/architecture.md)
- [View Complete Examples](../examples/fullstack.md)
