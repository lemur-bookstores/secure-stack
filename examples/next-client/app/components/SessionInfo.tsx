'use client';

import { useSession, useClient } from '@lemur-bookstores/client/react';

export function SessionInfo() {
  const { user, isAuthenticated, isLoading, refresh, setAccessToken, tokenManager } = useSession();
  const client = useClient();

  const handleLogout = async () => {
    await client.mutate('auth.logout', {});
    setAccessToken(null); // Clear the access token from memory
    await refresh();
  };

  const handleExpireToken = () => {
    // Simulate token expiration by setting an invalid token
    setAccessToken('expired-token');
    console.log('[Test] Token set to expired - next API call will trigger refresh');
  };

  return (
    <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
      <h2 className="text-2xl font-semibold leading-none tracking-tight mb-4">Session Status</h2>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Is Loading:</span>
          <span className={`text-sm ${isLoading ? 'text-yellow-500' : 'text-green-500'}`}>
            {isLoading ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Authenticated:</span>
          <span className={`text-sm ${isAuthenticated ? 'text-green-500' : 'text-red-500'}`}>
            {isAuthenticated ? 'Yes' : 'No'}
          </span>
        </div>

        {user && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <pre className="text-xs overflow-auto">{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => refresh()}
            className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
          >
            Refresh
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={handleExpireToken}
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white hover:bg-orange-700 h-10 px-4 py-2"
                title="Simulate token expiration to test auto-refresh"
              >
                Test Refresh
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
