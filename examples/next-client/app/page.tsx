import { UserList, CreateUserForm } from './components/Users';
import { SessionInfo } from './components/SessionInfo';
import { LoginForm } from './components/LoginForm';
import { AdminPanel } from './components/AdminPanel';
import { AuthDemo } from './components/AuthDemo';
import { CookieDemo } from './components/CookieDemo';
import { GuardsDemo } from './components/GuardsDemo';
import { NetworkDiagnostics } from './components/NetworkDiagnostics';

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">SecureStack Next.js Example</h1>
        <p className="text-gray-400 mb-8">
          Example of @lemur-bookstores/client with Next.js App Router
        </p>

        <div className="mb-8">
          <NetworkDiagnostics />
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <SessionInfo />
          <AuthDemo />
        </div>
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <CookieDemo />
          <GuardsDemo />
        </div>
        <div className="mb-8">
          <LoginForm />
        </div>
        <div className="mb-8">
          <AdminPanel />
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <CreateUserForm />
          <UserList />
        </div>
      </main>
    </div>
  );
}
