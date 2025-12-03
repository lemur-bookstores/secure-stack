# SecureStack Client

Type-safe client for SecureStack applications with React integration.

## Features

- 🔒 **Type-safe**: Full TypeScript support for queries and mutations
- ⚛️ **React Hooks**: `useQuery`, `useMutation` powered by TanStack Query
- 🚀 **Optimistic Updates**: Built-in support for optimistic UI
- 🔄 **SSR Ready**: Utilities for Next.js and other SSR frameworks
- 🛡️ **Error Handling**: Typed error handling with status codes
- ⚡ **Advanced Caching**: Stale-while-revalidate, Time-based strategies
- 📡 **Real-time**: WebSocket subscriptions support

## Installation

```bash
npm install @lemur-bookstores/client @tanstack/react-query
```

## Quick Start

### 1. Setup Provider

Wrap your application with `SecureStackProvider`:

```tsx
import { SecureStackProvider } from '@lemur-bookstores/client/react';

const config = {
  url: 'http://localhost:3000/api',
  headers: {
    Authorization: 'Bearer ...',
  },
};

function App() {
  return (
    <SecureStackProvider config={config}>
      <YourApp />
    </SecureStackProvider>
  );
}
```

### 2. Use Hooks

Make queries and mutations in your components:

```tsx
import { useQuery, useMutation } from '@lemur-bookstores/client/react';

function UserProfile({ userId }) {
  // Query with caching enabled
  const { data: user, isLoading } = useQuery(
    'user.getUser',
    { id: userId },
    {
      enableCache: true,
      cacheTTL: 60000, // 1 minute
    }
  );

  // Mutation
  const updateUser = useMutation('user.updateUser', {
    onSuccess: () => {
      console.log('Updated!');
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => updateUser.mutate({ id: userId, name: 'New Name' })}>
        Update Name
      </button>
    </div>
  );
}
```

### 3. Real-time Subscriptions

```tsx
import { useSubscription } from '@lemur-bookstores/client/react';

function Notifications() {
  useSubscription('notifications.subscribe', undefined, {
    onData: (notification) => {
      console.log('New notification:', notification);
    },
    onError: (err) => console.error(err),
  });

  return <div>Listening for notifications...</div>;
}
```

## SSR with Next.js

See the [Next.js Example](../../examples/next-client) for a full implementation.

```tsx
// app/page.tsx
import { SecureStackClient } from '@lemur-bookstores/client';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function Page() {
  const queryClient = new QueryClient();
  const client = new SecureStackClient({ url: '...' });

  await queryClient.prefetchQuery({
    queryKey: ['user.list'],
    queryFn: () => client.query('user.list'),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientComponent />
    </HydrationBoundary>
  );
}
```

## API Reference

### `SecureStackClient`

Core client class for making requests directly.

```typescript
const client = new SecureStackClient({ url: '...' });

// Query
const data = await client.query('user.get', { id: 1 });

// Mutation
const result = await client.mutate('user.create', { name: 'Alice' });

// Subscription
const unsubscribe = client.subscribe(
  'chat.messages',
  { roomId: '1' },
  {
    onData: (msg) => console.log(msg),
  }
);
```

### `useQuery(path, input?, options?)`

Wrapper around `useQuery` from TanStack Query. Supports `enableCache` and `cacheTTL` options.

### `useMutation(path, options?)`

Wrapper around `useMutation` from TanStack Query.

### `useSubscription(path, input, options)`

Hook for managing WebSocket subscriptions. Automatically handles connection and cleanup.

### `useMutationWithOptimisticUpdate(path, options)`

Helper for optimistic updates.

```typescript
useMutationWithOptimisticUpdate('todo.add', {
  queryKey: ['todos'],
  updater: (old, newTodo) => [...old, newTodo],
});
```
