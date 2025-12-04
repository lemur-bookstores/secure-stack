# Cache Management

SecureStack's client includes a sophisticated caching system built on top of [TanStack Query](https://tanstack.com/query/latest) (formerly React Query). It provides automatic caching, background refetching, and optimistic updates.

## Core Concepts

- **Stale-While-Revalidate**: Data is served from cache immediately, then updated in the background.
- **Query Keys**: Automatically generated from your router path and input.
- **Query Invalidation**: Mark data as stale to trigger refetching.
- **Optimistic Updates**: Update the UI immediately before the server responds.

## Configuration

Configure cache behavior globally in `QueryClient`.

```typescript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 1 minute
      staleTime: 60 * 1000,
      
      // Cache unused data for 5 minutes
      cacheTime: 5 * 60 * 1000,
      
      // Refetch on window focus
      refetchOnWindowFocus: true,
      
      // Retry failed requests 3 times
      retry: 3,
    },
  },
});
```

## Per-Query Configuration

Override defaults for specific queries:

```typescript
const { data } = useQuery('user.get', {
  input: { id: '123' },
  staleTime: 10 * 1000, // 10 seconds
  cacheTime: 60 * 1000, // 1 minute
});
```

## Invalidation

When you mutate data, you often want to refresh related queries.

### Basic Invalidation

```typescript
import { useInvalidateQuery } from '@lemur-bookstores/client/react';

function EditUser() {
  const invalidate = useInvalidateQuery();
  const mutation = useMutation('user.update', {
    onSuccess: () => {
      // Invalidate specific query
      invalidate('user.get', { id: '123' });
      
      // Invalidate all user queries
      invalidate('user');
    },
  });
}
```

### Smart Invalidation

SecureStack's `useInvalidateQuery` is type-safe and understands your router structure.

```typescript
// Invalidates 'post.list' and 'post.get'
invalidate('post');

// Invalidates only 'post.get' with specific input
invalidate('post.get', { id: '123' });
```

## Optimistic Updates

Update the UI immediately, then rollback if the server request fails.

```typescript
import { useQueryClient } from '@tanstack/react-query';

function TodoItem({ id, title }) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation('todo.update', {
    onMutate: async (newTodo) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries(['todo.get', { id }]);
      
      // 2. Snapshot previous value
      const previousTodo = queryClient.getQueryData(['todo.get', { id }]);
      
      // 3. Optimistically update
      queryClient.setQueryData(['todo.get', { id }], (old) => ({
        ...old,
        ...newTodo,
      }));
      
      // 4. Return context with snapshot
      return { previousTodo };
    },
    
    onError: (err, newTodo, context) => {
      // 5. Rollback on error
      queryClient.setQueryData(
        ['todo.get', { id }],
        context.previousTodo
      );
    },
    
    onSettled: () => {
      // 6. Refetch after error or success
      queryClient.invalidateQueries(['todo.get', { id }]);
    },
  });
}
```

## Prefetching

Load data before it's needed to improve perceived performance.

### On Hover

```typescript
import { usePrefetch } from '@lemur-bookstores/client/react';

function UserLink({ id }) {
  const prefetch = usePrefetch();
  
  return (
    <a
      href={`/user/${id}`}
      onMouseEnter={() => {
        prefetch('user.get', { id });
      }}
    >
      View Profile
    </a>
  );
}
```

### Server-Side Prefetching

See [SSR Support](./ssr.md) for details on prefetching on the server.

## Persistence

Persist your cache to `localStorage` or `AsyncStorage` to support offline mode.

```typescript
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
});
```

## Direct Cache Access

You can read and write to the cache directly.

```typescript
const queryClient = useQueryClient();

// Read
const data = queryClient.getQueryData(['user.get', { id: '123' }]);

// Write
queryClient.setQueryData(['user.get', { id: '123' }], (oldData) => {
  return { ...oldData, name: 'New Name' };
});
```
