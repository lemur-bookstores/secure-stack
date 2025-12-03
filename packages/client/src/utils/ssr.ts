/**
 * SSR Utilities for SecureStack Client
 */

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { DehydratedState } from '@tanstack/react-query';

/**
 * Helper to dehydrate query state for SSR
 */
export function dehydrateState(queryClient: QueryClient): DehydratedState {
    return dehydrate(queryClient);
}

/**
 * Re-export HydrationBoundary for convenience
 */
export { HydrationBoundary };

/**
 * Create a new QueryClient instance optimized for SSR
 */
export function createSSRQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
            },
        },
    });
}
