import { UserList } from '@/components/UserList';
import { CreateUserForm } from '@/components/CreateUserForm';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { SecureStackClient } from '@lemur-bookstores/client';

async function getUsers() {
  const client = new SecureStackClient({ url: 'http://localhost:3000/api' });
  return client.query('user.listUsers');
}

export default async function Home() {
  const queryClient = new QueryClient();

  // Prefetch on server
  await queryClient.prefetchQuery({
    queryKey: ['user.listUsers', undefined],
    queryFn: () => getUsers(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="container">
        <h1>SecureStack Next.js + SSR Example</h1>
        <p className="subtitle">Server-Side Rendering with React Query hydration</p>

        <div className="grid">
          <CreateUserForm />
          <UserList />
        </div>
      </main>
    </HydrationBoundary>
  );
}
