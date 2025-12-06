/**
 * React Context for SecureStack Client
 */

import React, { createContext, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SecureStackClient } from '../client';
import type { ClientConfig } from '../types';

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
