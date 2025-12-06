/**
 * Auth-specific React Hooks
 */

import { useSession } from './context';
import { useClient } from './context';
import { useCallback } from 'react';

/**
 * Simple hook to check if user is authenticated
 * 
 * @example
 * ```tsx
 * const isAuthenticated = useIsAuthenticated();
 * if (!isAuthenticated) return <Login />;
 * ```
 */
export function useIsAuthenticated(): boolean {
    const { isAuthenticated } = useSession();
    return isAuthenticated;
}

/**
 * Hook for sign in functionality
 * Returns a function to call the login endpoint
 * 
 * @example
 * ```tsx
 * const signIn = useSignIn();
 * 
 * const handleLogin = async () => {
 *   const result = await signIn('auth.login', { 
 *     email: 'user@example.com',
 *     password: '***' 
 *   });
 *   if (result.accessToken) {
 *     // Login successful
 *   }
 * };
 * ```
 */
export function useSignIn() {
    const client = useClient();
    const { refresh, setAccessToken } = useSession();

    return useCallback(
        async <TInput = any, TOutput extends { accessToken?: string; user?: any } = any>(
            path: string,
            credentials: TInput
        ): Promise<TOutput> => {
            const response = await client.mutate<TInput, TOutput>(path, credentials);

            // If response contains access token, store it
            if (response.accessToken) {
                setAccessToken(response.accessToken);
            }

            // Refresh session to update context
            await refresh();

            return response;
        },
        [client, refresh, setAccessToken]
    );
}

/**
 * Hook for sign out functionality
 * Returns a function to call the logout endpoint
 * 
 * @example
 * ```tsx
 * const signOut = useSignOut();
 * 
 * const handleLogout = async () => {
 *   await signOut('auth.logout');
 * };
 * ```
 */
export function useSignOut() {
    const client = useClient();
    const { refresh, setAccessToken } = useSession();

    return useCallback(
        async (path: string = 'auth.logout'): Promise<void> => {
            try {
                // Call logout endpoint
                await client.mutate(path, {});
            } catch (error) {
                // Even if logout fails, clear local state
                console.error('[useSignOut] Logout error:', error);
            } finally {
                // Clear access token from memory
                setAccessToken(null);

                // Refresh session to update context
                await refresh();
            }
        },
        [client, refresh, setAccessToken]
    );
}
