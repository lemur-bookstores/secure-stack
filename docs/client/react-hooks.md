# React Hooks

SecureStack provides powerful React hooks for building type-safe, reactive applications with automatic caching, optimistic updates, and real-time subscriptions.

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [useQuery](#usequery)
- [useMutation](#usemutation)
- [useSubscription](#usesubscription)
- [Cache Management](#cache-management)
- [Advanced Patterns](#advanced-patterns)

## Installation

```bash
npm install @lemur-bookstores/secure-stack-client @tanstack/react-query
```

## Setup

### Create Client

```typescript
// src/lib/client.ts
import { createClient } from '@lemur-bookstores/secure-stack-client';

export const client = createClient({
  url: 'http://localhost:3000/api',
  headers: () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }),
});
```

### Provider Setup

```typescript
// src/App.tsx
import { SecureStackProvider } from '@lemur-bookstores/secure-stack-client/react';
import { client } from './lib/client';

function App() {
  return (
    <SecureStackProvider client={client}>
      <YourApp />
    </SecureStackProvider>
  );
}
```

## useQuery

Fetch data with automatic caching and refetching.

### Basic Usage

```typescript
import { useQuery } from '@lemur-bookstores/secure-stack-client/react';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery('user.getUser', {
    input: { id: userId },
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

### With Options

```typescript
function PostList() {
  const { data, isLoading, refetch } = useQuery('post.list', {
    input: { page: 1, limit: 10 },
    // Cache for 5 minutes
    cacheTime: 5 * 60 * 1000,
    // Consider stale after 1 minute
    staleTime: 1 * 60 * 1000,
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Retry failed requests
    retry: 3,
  });
  
  return (
    <div>
      {data?.posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Dependent Queries

```typescript
function PostWithComments({ postId }: { postId: string }) {
  // First query
  const { data: post } = useQuery('post.get', {
    input: { id: postId },
  });
  
  // Second query depends on first
  const { data: comments } = useQuery('comment.list', {
    input: { postId },
    enabled: !!post, // Only run when post is loaded
  });
  
  return (
    <div>
      <h1>{post?.title}</h1>
      <div>{post?.content}</div>
      <CommentList comments={comments} />
    </div>
  );
}
```

### Pagination

```typescript
function PaginatedPosts() {
  const [page, setPage] = useState(1);
  
  const { data, isLoading, isFetching } = useQuery('post.list', {
    input: { page, limit: 10 },
    keepPreviousData: true, // Keep old data while fetching new
  });
  
  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {data.posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          
          <div>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            
            <span>Page {page} of {data.pagination.pages}</span>
            
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.pagination.pages}
            >
              Next
            </button>
          </div>
          
          {isFetching && <div>Updating...</div>}
        </>
      )}
    </div>
  );
}
```

### Infinite Scroll

```typescript
import { useInfiniteQuery } from '@lemur-bookstores/secure-stack-client/react';

function InfinitePostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery('post.list', {
    input: (pageParam) => ({
      page: pageParam || 1,
      limit: 10,
    }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
  });
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## useMutation

Modify data with automatic cache invalidation.

### Basic Usage

```typescript
import { useMutation } from '@lemur-bookstores/secure-stack-client/react';

function CreatePostForm() {
  const createPost = useMutation('post.create');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const post = await createPost.mutateAsync({
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        published: true,
      });
      
      console.log('Created post:', post);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit" disabled={createPost.isLoading}>
        {createPost.isLoading ? 'Creating...' : 'Create Post'}
      </button>
      {createPost.error && (
        <div>Error: {createPost.error.message}</div>
      )}
    </form>
  );
}
```

### With Callbacks

```typescript
function CreatePostForm() {
  const createPost = useMutation('post.create', {
    onSuccess: (data) => {
      toast.success('Post created successfully!');
      router.push(`/posts/${data.id}`);
    },
    onError: (error) => {
      if (error.code === 'UNAUTHORIZED') {
        toast.error('Please log in to create a post');
        router.push('/login');
      } else {
        toast.error('Failed to create post');
      }
    },
  });
  
  return <form>...</form>;
}
```

### Cache Invalidation

```typescript
import { useInvalidateQuery } from '@lemur-bookstores/secure-stack-client/react';

function CreatePostForm() {
  const invalidate = useInvalidateQuery();
  
  const createPost = useMutation('post.create', {
    onSuccess: () => {
      // Invalidate post list to trigger refetch
      invalidate('post.list');
    },
  });
  
  return <form>...</form>;
}
```

### Optimistic Updates

```typescript
function LikeButton({ postId }: { postId: string }) {
  const { data: post } = useQuery('post.get', {
    input: { id: postId },
  });
  
  const likePost = useMutation('post.like', {
    onMutate: async ({ postId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['post.get', { id: postId }]);
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['post.get', { id: postId }]);
      
      // Optimistically update
      queryClient.setQueryData(['post.get', { id: postId }], (old: any) => ({
        ...old,
        likes: old.likes + 1,
        isLiked: true,
      }));
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['post.get', { id: variables.postId }],
        context.previous
      );
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries(['post.get', { id: variables.postId }]);
    },
  });
  
  return (
    <button onClick={() => likePost.mutate({ postId })}>
      {post?.isLiked ? '❤️' : '🤍'} {post?.likes}
    </button>
  );
}
```

## useSubscription

Real-time data with WebSocket subscriptions.

### Basic Usage

```typescript
import { useSubscription } from '@lemur-bookstores/secure-stack-client/react';

function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useSubscription('chat.onMessage', {
    input: { roomId },
    onData: (message) => {
      setMessages(prev => [...prev, message]);
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
  });
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### With State Management

```typescript
function UserStatus({ userId }: { userId: string }) {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  
  useSubscription('user.onStatusChange', {
    input: { userId },
    onData: (data) => {
      setStatus(data.status);
    },
    enabled: !!userId, // Only subscribe when userId is available
  });
  
  return (
    <span className={status === 'online' ? 'online' : 'offline'}>
      {status}
    </span>
  );
}
```

## Cache Management

### Invalidate Queries

```typescript
import { useInvalidateQuery } from '@lemur-bookstores/secure-stack-client/react';

function RefreshButton() {
  const invalidate = useInvalidateQuery();
  
  const handleRefresh = () => {
    // Invalidate all post queries
    invalidate('post');
    
    // Invalidate specific query
    invalidate('post.get', { id: '123' });
  };
  
  return <button onClick={handleRefresh}>Refresh</button>;
}
```

### Prefetch Data

```typescript
import { usePrefetch } from '@lemur-bookstores/secure-stack-client/react';

function PostLink({ postId }: { postId: string }) {
  const prefetch = usePrefetch();
  
  const handleMouseEnter = () => {
    // Prefetch post data on hover
    prefetch('post.get', { id: postId });
  };
  
  return (
    <Link
      to={`/posts/${postId}`}
      onMouseEnter={handleMouseEnter}
    >
      View Post
    </Link>
  );
}
```

### Manual Cache Updates

```typescript
import { useQueryClient } from '@tanstack/react-query';

function UpdatePostButton({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  
  const handleUpdate = () => {
    queryClient.setQueryData(['post.get', { id: postId }], (old: any) => ({
      ...old,
      title: 'Updated Title',
    }));
  };
  
  return <button onClick={handleUpdate}>Update</button>;
}
```

## Advanced Patterns

### Conditional Fetching

```typescript
function ConditionalData({ shouldFetch }: { shouldFetch: boolean }) {
  const { data } = useQuery('data.get', {
    input: {},
    enabled: shouldFetch, // Only fetch when true
  });
  
  return <div>{data?.value}</div>;
}
```

### Parallel Queries

```typescript
function Dashboard() {
  const user = useQuery('user.getProfile', { input: {} });
  const posts = useQuery('post.list', { input: { page: 1 } });
  const stats = useQuery('stats.get', { input: {} });
  
  if (user.isLoading || posts.isLoading || stats.isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <UserInfo user={user.data} />
      <PostList posts={posts.data} />
      <Stats stats={stats.data} />
    </div>
  );
}
```

### Error Boundaries

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(error) => {
        console.error('Error:', error);
      }}
    >
      <SecureStackProvider client={client}>
        <YourApp />
      </SecureStackProvider>
    </ErrorBoundary>
  );
}
```

### Custom Hooks

```typescript
function useCurrentUser() {
  return useQuery('user.getCurrentUser', {
    input: {},
    staleTime: Infinity, // Never consider stale
    cacheTime: Infinity, // Keep in cache forever
  });
}

function usePost(postId: string) {
  return useQuery('post.get', {
    input: { id: postId },
    enabled: !!postId,
  });
}

// Usage
function MyComponent() {
  const { data: user } = useCurrentUser();
  const { data: post } = usePost('123');
  
  return <div>...</div>;
}
```

## Best Practices

### 1. Use Descriptive Keys

```typescript
// ✅ Good: Clear query keys
useQuery('user.getProfile', { input: { id: userId } });
useQuery('post.list', { input: { page, limit } });

// ❌ Bad: Generic keys
useQuery('getData', { input: {} });
```

### 2. Handle Loading States

```typescript
// ✅ Good: Proper loading handling
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;

// ❌ Bad: No loading state
return <Content data={data} />; // data might be undefined
```

### 3. Invalidate After Mutations

```typescript
// ✅ Good: Invalidate related queries
const createPost = useMutation('post.create', {
  onSuccess: () => {
    invalidate('post.list');
  },
});

// ❌ Bad: No invalidation
const createPost = useMutation('post.create');
```

### 4. Use Optimistic Updates Carefully

```typescript
// ✅ Good: With rollback
onMutate: async (variables) => {
  const previous = queryClient.getQueryData(key);
  queryClient.setQueryData(key, optimisticData);
  return { previous };
},
onError: (err, variables, context) => {
  queryClient.setQueryData(key, context.previous);
},
```

## Next Steps

- [Learn about Cache Management](./cache.md)
- [Explore SSR Support](./ssr.md)
- [See Full-Stack Example](../examples/fullstack.md)
- [View Client API Reference](./api.md)
