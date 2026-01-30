# Auth Helper Hooks

Simplified React hooks for common authentication operations.

## Overview

The client package provides three convenient hooks that wrap common authentication patterns:

- `useIsAuthenticated()` - Simple boolean check
- `useSignIn()` - Login with automatic token storage
- `useSignOut()` - Logout with cleanup

## Usage

### useIsAuthenticated

Returns a boolean indicating if the user is currently authenticated.

```tsx
import { useIsAuthenticated } from '@lemur-bookstores/secure-stack-client/react';

function ProtectedContent() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return <DashboardContent />;
}
```

### useSignIn

Returns a function to sign in users. Automatically stores tokens and refreshes the session.

```tsx
import { useSignIn } from '@lemur-bookstores/secure-stack-client/react';

function LoginForm() {
  const signIn = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const result = await signIn<
        { email: string; password: string },
        { accessToken: string; user: any }
      >('auth.login', { email, password });

      console.log('Logged in as:', result.user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

**What it does:**

1. Calls your login endpoint
2. Extracts the `accessToken` from the response
3. Stores it in the global token manager
4. Refreshes the session context
5. Returns the full response

### useSignOut

Returns a function to sign out users. Automatically clears tokens and refreshes the session.

```tsx
import { useSignOut } from '@lemur-bookstores/secure-stack-client/react';

function LogoutButton() {
  const signOut = useSignOut();

  const handleLogout = async () => {
    try {
      await signOut('auth.logout');
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return <button onClick={handleLogout}>Sign Out</button>;
}
```

**What it does:**

1. Calls your logout endpoint (default: `'auth.logout'`)
2. Clears the access token from memory
3. Refreshes the session context
4. Even if the endpoint fails, local state is cleared

**Custom logout endpoint:**

```tsx
await signOut('custom.logout.endpoint');
```

## Full Example

```tsx
'use client';

import { useIsAuthenticated, useSignIn, useSignOut } from '@lemur-bookstores/secure-stack-client/react';

export function AuthFlow() {
  const isAuthenticated = useIsAuthenticated();
  const signIn = useSignIn();
  const signOut = useSignOut();

  if (!isAuthenticated) {
    return (
      <button
        onClick={() =>
          signIn('auth.login', {
            email: 'user@example.com',
            password: 'password123',
          })
        }
      >
        Login
      </button>
    );
  }

  return (
    <div>
      <p>Welcome back!</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
```

## Type Safety

All hooks are fully typed. For `useSignIn`, you can specify input and output types:

```tsx
type LoginInput = { email: string; password: string };
type LoginOutput = { accessToken: string; user: User; refreshToken?: string };

const signIn = useSignIn();
const result = await signIn<LoginInput, LoginOutput>('auth.login', credentials);
// result is typed as LoginOutput
```

## Error Handling

Both `useSignIn` and `useSignOut` can throw errors. Always wrap them in try/catch:

```tsx
try {
  await signIn('auth.login', credentials);
} catch (error) {
  if (error instanceof Error) {
    console.error('Login error:', error.message);
  }
}
```

## Integration with SessionProvider

These hooks work seamlessly with the `SessionProvider`:

```tsx
import { SessionProvider, useIsAuthenticated } from '@lemur-bookstores/secure-stack-client/react';

function App() {
  return (
    <SecureStackProvider client={client}>
      <SessionProvider path="auth.session">
        <ProtectedApp />
      </SessionProvider>
    </SecureStackProvider>
  );
}

function ProtectedApp() {
  const isAuthenticated = useIsAuthenticated();
  // This value comes from SessionProvider
  return isAuthenticated ? <Dashboard /> : <Login />;
}
```

## See Also

- [Session Management](./session-management.md)
- [Error States](./error-states.md)
- [RBAC](./rbac.md)
