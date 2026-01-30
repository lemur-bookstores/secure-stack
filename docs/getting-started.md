# Getting Started with SecureStack

This guide will help you get started with SecureStack in just a few minutes.

## Prerequisites

- **Node.js** 20+ or **Bun** 1.0+
- **npm**, **pnpm**, or **yarn**
- Basic knowledge of TypeScript

## Installation

Install SecureStack packages based on your needs:

### For Server Development

```bash
npm install @lemur-bookstores/secure-stack-core @lemur-bookstores/secure-stack-server
# or
pnpm add @lemur-bookstores/secure-stack-core @lemur-bookstores/secure-stack-server
```

### For Client Development

```bash
npm install @lemur-bookstores/secure-stack-client
# For React applications
npm install @lemur-bookstores/secure-stack-client @tanstack/react-query
```

### Additional Packages

```bash
# Authentication & RBAC
npm install @lemur-bookstores/secure-stack-auth

# Service Mesh
npm install @lemur-bookstores/secure-stack-mesh
```

## Your First Server

Create a simple API server in just a few lines:

```typescript
// server.ts
import { SecureStackServer, router } from '@lemur-bookstores/secure-stack';
import { z } from 'zod';

// Create server instance
const app = new SecureStackServer({
  name: 'my-first-api',
  port: 3000,
  cors: {
    origin: '*',
    credentials: true,
  },
});

// Define a simple router
const helloRouter = router()
  .query('hello', {
    input: z.object({ name: z.string().optional() }),
    handler: async ({ input }) => {
      return {
        message: `Hello, ${input.name || 'World'}!`,
        timestamp: new Date().toISOString(),
      };
    },
  })
  .mutation('echo', {
    input: z.object({ text: z.string() }),
    handler: async ({ input }) => {
      return { echo: input.text };
    },
  });

// Register router
app.router('hello', helloRouter);

// Add lifecycle hooks
app.hook('onReady', () => {
  console.log('✅ Server is ready to accept requests!');
});

// Start the server
await app.start();
```

Run your server:

```bash
npx tsx server.ts
```

Your API is now running at `http://localhost:3000`! 🎉

## Test Your API

You can test your endpoints using curl:

```bash
# Query endpoint
curl "http://localhost:3000/api/hello/hello?input=%7B%22name%22%3A%22Alice%22%7D"

# Mutation endpoint
curl -X POST http://localhost:3000/api/hello/echo \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello SecureStack!"}'
```

## Your First Client

Now let's create a React client to consume your API:

```typescript
// App.tsx
import { SecureStackProvider, createClient } from '@lemur-bookstores/secure-stack-client';
import { useQuery, useMutation } from '@lemur-bookstores/secure-stack-client/react';

// Create client instance
const client = createClient({
  url: 'http://localhost:3000/api',
});

function HelloComponent() {
  // Use query hook
  const { data, isLoading } = useQuery('hello.hello', {
    input: { name: 'Alice' },
  });

  // Use mutation hook
  const echoMutation = useMutation('hello.echo');

  const handleEcho = async () => {
    const result = await echoMutation.mutateAsync({
      text: 'Hello from client!',
    });
    console.log(result);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{data?.message}</h1>
      <button onClick={handleEcho}>
        Echo Message
      </button>
    </div>
  );
}

function App() {
  return (
    <SecureStackProvider client={client}>
      <HelloComponent />
    </SecureStackProvider>
  );
}

export default App;
```

## Project Structure

Here's a recommended project structure:

```
my-app/
├── src/
│   ├── server/
│   │   ├── index.ts           # Server entry point
│   │   ├── routers/           # API routers
│   │   │   ├── user.ts
│   │   │   └── post.ts
│   │   └── middleware/        # Custom middleware
│   │       └── auth.ts
│   └── client/
│       ├── App.tsx            # React app
│       └── components/
├── package.json
└── tsconfig.json
```

## Next Steps

Now that you have a basic setup, explore more features:

1. **[Add Authentication](./auth/setup.md)** - Secure your API with JWT and RBAC
2. **[Use Middleware](./core/middleware.md)** - Add logging, validation, and more
3. **[Enable Service Mesh](./mesh/overview.md)** - Secure microservices communication
4. **[Add Real-time Features](./examples/realtime.md)** - WebSocket subscriptions
5. **[Deploy to Production](./advanced/deployment.md)** - Deployment strategies

## Common Patterns

### Adding Middleware

```typescript
import { middleware } from '@lemur-bookstores/secure-stack-core';

// Create custom middleware
const loggerMiddleware = middleware()
  .use(async ({ next, ctx }) => {
    console.log(`[${ctx.type}] ${ctx.path}`);
    return next();
  });

// Apply to router
const router = router()
  .middleware(loggerMiddleware)
  .query('protected', {
    handler: async () => ({ data: 'Protected data' }),
  });
```

### Error Handling

```typescript
import { SecureStackError } from '@lemur-bookstores/secure-stack-core';

const userRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input }) => {
      const user = await db.user.findUnique({ where: { id: input.id } });
      
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

### Context & Dependency Injection

```typescript
import { createContext } from '@lemur-bookstores/secure-stack-core';

// Define context
const createAppContext = () => {
  return {
    db: prisma,
    redis: redisClient,
  };
};

// Use in server
const app = new SecureStackServer({
  name: 'my-api',
  port: 3000,
  context: createAppContext,
});

// Access in handlers
const userRouter = router()
  .query('getUser', {
    input: z.object({ id: z.string() }),
    handler: async ({ input, ctx }) => {
      // ctx.db is available here
      return ctx.db.user.findUnique({ where: { id: input.id } });
    },
  });
```

## Troubleshooting

### Port Already in Use

If you get an error about the port being in use:

```typescript
const app = new SecureStackServer({
  name: 'my-api',
  port: process.env.PORT || 3000, // Use environment variable
});
```

### CORS Issues

Enable CORS for your frontend:

```typescript
const app = new SecureStackServer({
  name: 'my-api',
  port: 3000,
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  },
});
```

### Type Inference Not Working

Make sure you're using TypeScript 5.0+ and have proper type imports:

```typescript
import type { inferRouterInputs, inferRouterOutputs } from '@lemur-bookstores/secure-stack-core';

type RouterInputs = inferRouterInputs<typeof myRouter>;
type RouterOutputs = inferRouterOutputs<typeof myRouter>;
```

## Getting Help

- 📖 [Read the full documentation](./README.md)
- 🐛 [Report issues](https://github.com/lemur-bookstores/secure-stack/issues)
- 💬 [Join our community](https://github.com/lemur-bookstores/secure-stack/discussions)

Happy coding! 🚀
