# SecureStackClient API

The `SecureStackClient` is the core entry point for consuming your SecureStack API on the client side. It handles connection management, request batching, caching, and type inference.

## Installation

```bash
npm install @lemur-bookstores/secure-stack-client
```

## Creating a Client

```typescript
import { createClient } from '@lemur-bookstores/secure-stack-client';

const client = createClient({
  url: 'http://localhost:3000/api',
});
```

## Configuration Options

```typescript
interface ClientConfig {
  // Required: API URL
  url: string;
  
  // Optional: Custom headers
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  
  // Optional: Fetch implementation (defaults to window.fetch)
  fetch?: typeof fetch;
  
  // Optional: AbortController implementation
  AbortController?: typeof AbortController;
  
  // Optional: Transformer (defaults to SuperJSON)
  transformer?: Transformer;
}
```

### With Authentication Headers

```typescript
const client = createClient({
  url: 'http://localhost:3000/api',
  headers: async () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'X-Client-Version': '1.0.0',
    };
  },
});
```

## Making Requests

### Queries

```typescript
// Basic query
const user = await client.user.get.query({ id: '123' });

// Query with options
const posts = await client.post.list.query(
  { limit: 10 },
  { signal: abortController.signal }
);
```

### Mutations

```typescript
const newUser = await client.user.create.mutate({
  name: 'Alice',
  email: 'alice@example.com',
});
```

### Subscriptions

```typescript
const unsubscribe = client.chat.onMessage.subscribe(
  { roomId: 'general' },
  {
    onData: (message) => {
      console.log('New message:', message);
    },
    onError: (err) => {
      console.error('Subscription error:', err);
    },
    onComplete: () => {
      console.log('Subscription closed');
    },
  }
);

// Later
unsubscribe();
```

## React Integration

For React applications, wrap your app in `SecureStackProvider`.

```typescript
import { SecureStackProvider } from '@lemur-bookstores/secure-stack-client/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SecureStackProvider client={client} queryClient={queryClient}>
        <YourApp />
      </SecureStackProvider>
    </QueryClientProvider>
  );
}
```

## Error Handling

Errors returned by the client are typed `SecureStackClientError`.

```typescript
try {
  await client.user.get.query({ id: '999' });
} catch (error) {
  if (error.data?.code === 'NOT_FOUND') {
    console.log('User not found');
  }
  console.log(error.message);
}
```

## Type Inference

You can infer types directly from your server router type.

```typescript
// Import type from server (NOT implementation)
import type { AppRouter } from '../server/types';

// Infer inputs
type CreateUserInput = inferRouterInputs<AppRouter>['user']['create'];

// Infer outputs
type User = inferRouterOutputs<AppRouter>['user']['get'];
```

## Advanced Usage

### Custom Links

You can customize the transport layer using [tRPC links](https://trpc.io/docs/links).

```typescript
import { httpBatchLink, loggerLink } from '@trpc/client';

const client = createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: 'http://localhost:3000/api',
    }),
  ],
});
```

### WebSocket Client

For subscriptions, you need a WebSocket link.

```typescript
import { createWSClient, wsLink, splitLink, httpBatchLink } from '@trpc/client';

const wsClient = createWSClient({
  url: 'ws://localhost:3000',
});

const client = createClient({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: wsLink({
        client: wsClient,
      }),
      false: httpBatchLink({
        url: 'http://localhost:3000/api',
      }),
    }),
  ],
});
```
