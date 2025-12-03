# SecureStack Client

Type-safe client for SecureStack applications with React integration.

## Features

- 🔒 **Type-safe**: Full TypeScript support for queries and mutations
- ⚛️ **React Hooks**: `useQuery`, `useMutation` powered by TanStack Query
- 🚀 **Optimistic Updates**: Built-in support for optimistic UI
- 🔄 **SSR Ready**: Utilities for Next.js and other SSR frameworks
- 🛡️ **Error Handling**: Typed error handling with status codes

## Installation

```bash
npm install @lemur-bookstores/client @tanstack/react-query
```

## Quick Start

### 1. Setup Provider

Wrap your application with `SecureStackProvider`:

```tsx
import { SecureStackProvider } from '@lemur-bookstores/client';

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
import { useQuery, useMutation } from '@lemur-bookstores/client';

function UserProfile({ userId }) {
  // Query
  const { data: user, isLoading } = useQuery('user.getUser', { id: userId });

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

## SSR with Next.js

```tsx
// app/providers.tsx
'use client';

import { SecureStackProvider } from '@lemur-bookstores/client';
import { useState } from 'react';

export function Providers({ children }) {
  const [config] = useState(() => ({
    url: process.env.NEXT_PUBLIC_API_URL!,
  }));

  return <SecureStackProvider config={config}>{children}</SecureStackProvider>;
}
```

## API Reference

### `SecureStackClient`

Core client class for making requests directly.

```typescript
const client = new SecureStackClient({ url: '...' });
const data = await client.query('user.get', { id: 1 });
```

### `useQuery(path, input?, options?)`

Wrapper around `useQuery` from TanStack Query.

### `useMutation(path, options?)`

Wrapper around `useMutation` from TanStack Query.

### `useMutationWithOptimisticUpdate(path, options)`

Helper for optimistic updates.

```typescript
useMutationWithOptimisticUpdate('todo.add', {
  queryKey: ['todos'],
  updater: (old, newTodo) => [...old, newTodo],
});
```
