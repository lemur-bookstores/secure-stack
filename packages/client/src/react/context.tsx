/**
 * React Context for SecureStack Client
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SecureStackClient } from '../client';
import type { ClientConfig, AuthSession } from '../types';
import { globalTokenManager } from '../auth/token-manager';
import type { TokenManager } from '../auth/token-manager';

/**
 * Context value
 */
interface SecureStackContextValue {
  client: SecureStackClient;
  queryClient: QueryClient;
}

/**
 * Provider props
 */
export interface SecureStackProviderProps {
  /**
   * Client configuration (required if client is not provided)
   */
  config?: ClientConfig;

  /**
   * Existing client instance (optional)
   */
  client?: SecureStackClient;

  /**
   * Optional custom QueryClient
   */
  queryClient?: QueryClient;

  /**
   * Children components
   */
  children: React.ReactNode;
}

// Create context
export const SecureStackContext = createContext<SecureStackContextValue | null>(null);

/**
 * Provider component for SecureStack client
 */
export function SecureStackProvider({
  config,
  client: customClient,
  queryClient: customQueryClient,
  children,
}: SecureStackProviderProps) {
  // Create client instance (memoized)
  const client = useMemo(() => {
    if (customClient) return customClient;
    if (!config) throw new Error('SecureStackProvider: either client or config must be provided');
    return new SecureStackClient(config);
  }, [config, customClient]);

  // Create or use custom query client
  const queryClient = useMemo(
    () =>
      customQueryClient ||
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 3,
            staleTime: 0,
          },
          mutations: {
            retry: false,
          },
        },
      }),
    [customQueryClient]
  );

  const value = useMemo(
    () => ({
      client,
      queryClient,
    }),
    [client, queryClient]
  );

  return (
    <SecureStackContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>{children as any}</QueryClientProvider>
    </SecureStackContext.Provider>
  );
}

/**
 * Hook to access SecureStack context
 */
export function useSecureStackContext(): SecureStackContextValue {
  const context = useContext(SecureStackContext);

  if (!context) {
    throw new Error('useSecureStackContext must be used within SecureStackProvider');
  }

  return context;
}

/**
 * Hook to access the client directly
 */
export function useClient(): SecureStackClient {
  const { client } = useSecureStackContext();
  return client;
}

/**
 * Hook to access the query client directly
 */
export function useQueryClient(): QueryClient {
  const { queryClient } = useSecureStackContext();
  return queryClient;
}

/**
 * Session Context Value
 */
export interface SessionContextValue extends AuthSession {
  refresh: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
  tokenManager: TokenManager;
}

/**
 * Session Provider Props
 */
export interface SessionProviderProps {
  children: React.ReactNode;
  /**
   * Path to fetch session data
   * @default 'auth.session'
   */
  path?: string;
  /**
   * Optional background refresh interval in milliseconds
   * If provided, the session will auto-refresh at this interval
   */
  refreshInterval?: number;
  /**
   * Initial session data from server-side rendering
   * If provided, the session will be hydrated with this data
   * and skip the initial loading state
   */
  initialSession?: AuthSession;
}

// Create Session Context
export const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Provider component for Authentication Session
 * Must be used within SecureStackProvider
 */
export function SessionProvider({
  children,
  path = 'auth.session',
  refreshInterval,
  initialSession,
}: SessionProviderProps) {
  const client = useClient();
  const tokenManager = globalTokenManager; // Use global instance
  const [session, setSession] = useState<AuthSession>(() => {
    // If we have initial session from SSR, use it
    if (initialSession) {
      return initialSession;
    }
    // Otherwise start with loading state
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      status: 'loading',
      error: null,
    };
  });

  const setAccessToken = (token: string | null) => {
    tokenManager.setToken(token);
  };

  const refresh = async () => {
    try {
      // Only set loading if not already loading to avoid flicker on initial load if possible,
      // but here we want to show loading state.
      // However, if we already have a user, maybe we don't want to set isLoading=true immediately?
      // For now, simple logic.
      setSession((prev) => ({ ...prev, isLoading: true }));

      // We use the client to fetch the session.
      // The client should have middleware configured to attach tokens if needed.
      const user = await client.query<void, any>(path);

      setSession({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        status: user ? 'authenticated' : 'unauthenticated',
        error: null,
      });
    } catch (error) {
      // If error (e.g. 401), we assume not authenticated
      const errorObj = error instanceof Error ? error : new Error('Session fetch failed');
      setSession({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: 'unauthenticated',
        error: errorObj,
      });
    }
  };

  // Initial refresh - skip if we have initial session from SSR
  useEffect(() => {
    if (!initialSession) {
      refresh();
    }
  }, [client, path, initialSession]);

  // Background refresh if interval is provided
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      // Only refresh if authenticated
      if (session.isAuthenticated && !session.isLoading) {
        console.log('[SessionProvider] Background refresh');
        refresh();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, session.isAuthenticated, session.isLoading]);

  const value = useMemo(
    () => ({
      ...session,
      refresh,
      setAccessToken,
      tokenManager,
    }),
    [session, tokenManager]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Hook to access the session
 */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
