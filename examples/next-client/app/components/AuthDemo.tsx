'use client';

import { useIsAuthenticated, useSignIn, useSignOut } from '@lemur-bookstores/secure-stack-client/react';
import { useState } from 'react';

/**
 * Demo component showcasing new auth helper hooks
 */
export function AuthDemo() {
  const isAuthenticated = useIsAuthenticated();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn<
        { email: string; password: string },
        { accessToken: string; user: any }
      >('auth.login', { email, password });
      console.log('Login successful:', result.user);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      console.log('Logged out successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
      <h2 className="text-xl font-bold mb-4">Auth Helper Hooks Demo</h2>

      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="text-sm text-gray-400">Status:</div>
        <div className="text-lg font-semibold">
          {isAuthenticated ? (
            <span className="text-green-400">✓ Authenticated</span>
          ) : (
            <span className="text-red-400">✗ Not Authenticated</span>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className={'m-0'}>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800 text-white"
              placeholder="user@example.com"
              required
            />
          </div>
          <div className={'m-0'}>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800 text-white"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In (useSignIn)'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-green-300 text-sm">
            You are logged in! Use the button below to sign out.
          </p>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Signing out...' : 'Sign Out (useSignOut)'}
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
        <div className="font-semibold mb-1">Hooks used:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <code>useIsAuthenticated()</code> - Simple boolean check
          </li>
          <li>
            <code>useSignIn()</code> - Login helper with token storage
          </li>
          <li>
            <code>useSignOut()</code> - Logout helper with cleanup
          </li>
        </ul>
      </div>
    </div>
  );
}
