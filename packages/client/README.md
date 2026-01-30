# SecureStack Client

Type-safe client for SecureStack applications with React integration.

## Features

- 🔒 **Type-safe**: Full TypeScript support for queries and mutations
- ⚛️ **React Hooks**: `useQuery`, `useMutation` powered by TanStack Query
- 🧩 **Vue 3 Composables**: `useQuery`, `useMutation`, `useSubscription` via TanStack Vue Query
- 🚀 **Optimistic Updates**: Built-in support for optimistic UI
- 🔄 **SSR Ready**: Utilities for Next.js and other SSR frameworks
- 🛡️ **Error Handling**: Typed error handling with status codes
- ⚡ **Advanced Caching**: Stale-while-revalidate, Time-based strategies
- 📡 **Real-time**: WebSocket subscriptions support

## Installation

```bash
# React / Next.js
npm install @lemur-bookstores/secure-stack-client @tanstack/react-query react react-dom

# Vue 3
npm install @lemur-bookstores/secure-stack-client @tanstack/vue-query vue
```

## Quick Start

### 1. Setup Provider

Wrap your application with `SecureStackProvider`:

```tsx
import { SecureStackProvider } from '@lemur-bookstores/secure-stack-client/react';

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
import { useQuery, useMutation } from '@lemur-bookstores/secure-stack-client/react';

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
import { useSubscription } from '@lemur-bookstores/secure-stack-client/react';

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
import { SecureStackClient } from '@lemur-bookstores/secure-stack-client';
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

## Vue 3 Integration

Register the plugin once in your app entrypoint:

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { SecureStackPlugin } from '@lemur-bookstores/secure-stack-client/vue';

const app = createApp(App);

app.use(SecureStackPlugin, {
  config: {
    url: 'http://localhost:3000/api',
  },
});

app.mount('#app');
```

Use the composables anywhere:

```ts
import { useQuery, useMutation, useQueryClient } from '@lemur-bookstores/secure-stack-client/vue';

const queryClient = useQueryClient();
const { data: users, isLoading } = useQuery('user.listUsers');

const createUser = useMutation('user.createUser', {
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user.listUsers'] }),
});
```
