# Server-Side Rendering (SSR)

SecureStack provides excellent support for Server-Side Rendering, particularly with Next.js. This ensures your application is SEO-friendly and has a fast initial load time.

## Next.js Integration (App Router)

For Next.js 13+ App Router, we recommend using React Server Components (RSC) to fetch data directly on the server.

### 1. Create Server Client

```typescript
// lib/server-client.ts
import { createClient } from '@lemur-bookstores/secure-stack-client';
import { headers } from 'next/headers';

export const serverClient = createClient({
  url: 'http://localhost:3000/api',
  headers: () => {
    // Forward headers from the incoming request
    const h = headers();
    return {
      cookie: h.get('cookie') || '',
      authorization: h.get('authorization') || '',
    };
  },
});
```

### 2. Fetch in Server Component

```typescript
// app/page.tsx
import { serverClient } from '@/lib/server-client';

export default async function Page() {
  // Direct fetch, no hooks needed
  const posts = await serverClient.post.list.query({ limit: 10 });
  
  return (
    <main>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </main>
  );
}
```

## Next.js Integration (Pages Router)

For the classic Pages Router, use `getServerSideProps` or `getStaticProps` with hydration.

### 1. Setup `_app.tsx`

```typescript
// pages/_app.tsx
import { SecureStackProvider, createClient } from '@lemur-bookstores/secure-stack-client';
import { QueryClient, QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { useState } from 'react';

export default function App({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient());
  const [client] = useState(() => createClient({
    url: '/api/trpc',
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <SecureStackProvider client={client} queryClient={queryClient}>
          <Component {...pageProps} />
        </SecureStackProvider>
      </Hydrate>
    </QueryClientProvider>
  );
}
```

### 2. Prefetch in `getServerSideProps`

```typescript
// pages/posts.tsx
import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/context';
import SuperJSON from 'superjson';

export async function getServerSideProps(context) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: await createContext(context),
    transformer: SuperJSON,
  });
  
  // Prefetch data
  await helpers.post.list.prefetch({ limit: 10 });
  
  return {
    props: {
      trpcState: helpers.dehydrate(),
    },
  };
}

export default function PostsPage() {
  // Data is already in cache, no loading state!
  const { data } = useQuery('post.list', { input: { limit: 10 } });
  
  return (
    <div>
      {data.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## Static Site Generation (SSG)

You can use `getStaticProps` in the same way as `getServerSideProps` to generate static pages at build time.

```typescript
export async function getStaticProps() {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {}, // No request context available at build time
    transformer: SuperJSON,
  });
  
  await helpers.post.list.prefetch({ limit: 10 });
  
  return {
    props: {
      trpcState: helpers.dehydrate(),
    },
    revalidate: 60, // Revalidate every minute
  };
}
```

## SEO Benefits

Using SSR or SSG ensures that:
1. Search engines can crawl your content.
2. Social media previews (OG tags) work correctly.
3. First Contentful Paint (FCP) is faster.
4. Users see content immediately without loading spinners.

## Authentication in SSR

When fetching data on the server that requires authentication, ensure you forward the user's cookies or tokens.

```typescript
// lib/server-client.ts
export const getServerClient = () => {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  
  return createClient({
    url: process.env.API_URL,
    headers: {
      Authorization: token ? `Bearer ${token.value}` : '',
    },
  });
};
```
