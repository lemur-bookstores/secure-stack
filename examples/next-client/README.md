# SecureStack Next.js Example

Example Next.js application demonstrating SecureStack Client with Server-Side Rendering (SSR).

## Features

- ✅ Server-Side Rendering with React Query hydration
- ✅ App Router (Next.js 14)
- ✅ TypeScript
- ✅ Automatic data prefetching
- ✅ Optimistic updates
- ✅ Error handling

## Getting Started

1. **Start the backend server** (from repo root):

   ```bash
   npm run dev:server --workspace=examples/basic
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the development server**:

   ```bash
   npm run dev --workspace=examples/next-client
   ```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## How It Works

### Server-Side Rendering

The `page.tsx` file demonstrates SSR with data prefetching:

```tsx
export default async function Home() {
  const queryClient = new QueryClient();

  // Prefetch on server
  await queryClient.prefetchQuery({
    queryKey: ['user.listUsers', undefined],
    queryFn: () => getUsers(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>{/* Client components */}</HydrationBoundary>
  );
}
```

### Client Components

- `UserList.tsx`: Displays the list of users (hydrated from server)
- `CreateUserForm.tsx`: Form to create new users with optimistic updates

## Project Structure

```
next-client/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page (SSR)
│   │   ├── providers.tsx    # React Query provider
│   │   └── globals.css      # Global styles
│   └── components/
│       ├── UserList.tsx     # User list component
│       └── CreateUserForm.tsx # Create user form
├── package.json
├── tsconfig.json
└── next.config.js
```

## Learn More

- [SecureStack Documentation](../../packages/client/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
