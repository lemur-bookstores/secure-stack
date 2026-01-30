# tRPC Integration

SecureStack provides first-class support for [tRPC](https://trpc.io/), enabling end-to-end type safety between your server and client without code generation.

## Features

- **Zero Boilerplate**: Routers are automatically compatible with tRPC
- **Type Inference**: Share types directly with the client
- **React Query Integration**: Seamless data fetching hooks
- **Batching**: Automatic request batching
- **Transformers**: Built-in support for SuperJSON

## Server Setup

The tRPC adapter is enabled by default in `SecureStackServer`.

```typescript
import { SecureStackServer, router } from '@lemur-bookstores/secure-stack-server';

const app = new SecureStackServer({
  name: 'trpc-api',
  port: 3000,
});

const appRouter = router()
  .query('hello', {
    handler: async () => 'Hello tRPC!',
  });

app.router('api', appRouter);

// Export type for client
export type AppRouter = typeof appRouter;

await app.start();
```

## Client Setup

### 1. Create Client

```typescript
// client.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server'; // Import type only

export const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
    }),
  ],
});
```

### 2. Use Client

```typescript
// main.ts
async function main() {
  const result = await client.api.hello.query();
  console.log(result); // "Hello tRPC!"
}
```

## React Integration

For React applications, use `@lemur-bookstores/secure-stack-client` which wraps tRPC's React Query adapter.

```typescript
// App.tsx
import { SecureStackProvider, createClient } from '@lemur-bookstores/secure-stack-client';
import { useQuery } from '@lemur-bookstores/secure-stack-client/react';

const client = createClient({
  url: 'http://localhost:3000/api',
});

function MyComponent() {
  const { data } = useQuery('api.hello');
  return <div>{data}</div>;
}

export default function App() {
  return (
    <SecureStackProvider client={client}>
      <MyComponent />
    </SecureStackProvider>
  );
}
```

## Context Integration

SecureStack context is automatically mapped to tRPC context.

```typescript
// server.ts
const createContext = ({ req, res }) => ({
  user: req.headers['x-user'],
});

const app = new SecureStackServer({
  context: createContext,
  // ...
});

const router = router()
  .query('me', {
    handler: ({ ctx }) => {
      return { user: ctx.user };
    },
  });
```

## Middleware Mapping

SecureStack middleware is compatible with tRPC middleware.

```typescript
const authMiddleware = middleware().use(async ({ ctx, next }) => {
  if (!ctx.user) throw new Error('Unauthorized');
  return next();
});

const protectedRouter = router()
  .middleware(authMiddleware)
  .query('secret', {
    handler: () => 'Secret Data',
  });
```

## Error Handling

Errors thrown in SecureStack are converted to tRPC errors:

```typescript
import { SecureStackError } from '@lemur-bookstores/secure-stack-core';

// Server
throw new SecureStackError({
  code: 'NOT_FOUND',
  message: 'Item missing',
});

// Client
try {
  await client.getItem.query();
} catch (e) {
  console.log(e.data.code); // "NOT_FOUND"
  console.log(e.message);   // "Item missing"
}
```

## Batching

Request batching is enabled by default. Multiple queries made within the same tick are grouped into a single HTTP request.

```typescript
// These result in a single HTTP request
const [user, posts] = await Promise.all([
  client.user.get.query({ id: 1 }),
  client.post.list.query({ userId: 1 }),
]);
```

## Transformers

SecureStack uses SuperJSON by default to support complex types like `Date`, `Map`, and `Set`.

```typescript
// Server
router().query('now', {
  handler: () => new Date(),
});

// Client
const date = await client.now.query();
console.log(date instanceof Date); // true
```

## WebSocket Support (Subscriptions)

tRPC subscriptions are supported via WebSockets.

```typescript
// Server
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ server: app.server.server });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
});

// Client
import { createWSClient, wsLink } from '@trpc/client';

const wsClient = createWSClient({
  url: `ws://localhost:3000`,
});

const client = createTRPCProxyClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
  ],
});
```
