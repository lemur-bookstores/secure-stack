/**
 * React Hooks for SecureStack Client
 */

import { useQuery as useReactQuery, useMutation as useReactMutation } from '@tanstack/react-query';
import type {
    UseQueryOptions,
    UseMutationOptions,
    UseQueryResult,
    UseMutationResult,
} from '@tanstack/react-query';
import { useClient, useQueryClient } from './context';
import type { ClientError, SubscriptionOptions } from '../types';
import { useEffect } from 'react';

/**
 * Query hook options
 */
export interface UseSecureStackQueryOptions<TData, TInput>
    extends Omit<UseQueryOptions<TData, ClientError>, 'queryKey' | 'queryFn'> {
    /**
     * Input data for the query
     */
    input?: TInput;
}

/**
 * Mutation hook options
 */
export interface UseSecureStackMutationOptions<TData, TInput>
    extends Omit<UseMutationOptions<TData, ClientError, TInput>, 'mutationFn'> { }

/**
 * Hook for making queries
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useQuery('user.getUser', { id: '123' });
 * ```
 */
export function useQuery<TData = unknown, TInput = void>(
    path: string,
    input?: TInput,
    options?: UseSecureStackQueryOptions<TData, TInput>
): UseQueryResult<TData, ClientError> {
    const client = useClient();

    return useReactQuery<TData, ClientError>({
        queryKey: [path, input],
        queryFn: () => client.query<TInput, TData>(path, input),
        ...options,
    });
}

/**
 * Hook for making mutations
 *
 * @example
 * ```tsx
 * const createUser = useMutation('user.createUser', {
 *   onSuccess: () => {
 *     console.log('User created!');
 *   }
 * });
 *
 * createUser.mutate({ name: 'Alice', email: 'alice@example.com' });
 * ```
 */
export function useMutation<TData = unknown, TInput = unknown>(
    path: string,
    options?: UseSecureStackMutationOptions<TData, TInput>
): UseMutationResult<TData, ClientError, TInput> {
    const client = useClient();

    return useReactMutation<TData, ClientError, TInput>({
        mutationFn: (input: TInput) => client.mutate<TInput, TData>(path, input),
        ...options,
    });
}

/**
 * Optimistic update helper
 */
export interface OptimisticUpdateOptions<TData, TInput> {
    /**
     * Query key to update
     */
    queryKey: unknown[];

    /**
     * Updater function
     */
    updater: (oldData: TData | undefined, newData: TInput) => TData;
}

/**
 * Hook for mutations with optimistic updates
 *
 * @example
 * ```tsx
 * const updateUser = useMutationWithOptimisticUpdate('user.updateUser', {
 *   queryKey: ['user.getUser', { id: '123' }],
 *   updater: (oldUser, updates) => ({ ...oldUser, ...updates }),
 *   onSuccess: () => {
 *     console.log('User updated!');
 *   }
 * });
 * ```
 */
export function useMutationWithOptimisticUpdate<TData = unknown, TInput = unknown>(
    path: string,
    options: UseSecureStackMutationOptions<TData, TInput> & OptimisticUpdateOptions<TData, TInput>
): UseMutationResult<TData, ClientError, TInput> {
    const { queryKey, updater, ...mutationOptions } = options;
    const client = useClient();
    const queryClient = useQueryClient();

    return useReactMutation<TData, ClientError, TInput>({
        mutationFn: (input: TInput) => client.mutate<TInput, TData>(path, input),
        onMutate: async (newData: TInput) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot previous value
            const previousData = queryClient.getQueryData<TData>(queryKey);

            // Optimistically update
            queryClient.setQueryData<TData>(queryKey, (old: TData | undefined) =>
                updater(old, newData)
            );

            // Return context with snapshot
            return { previousData };
        },
        onError: (_err, _newData, context) => {
            // Rollback on error
            const ctx = context as { previousData?: TData } | undefined;
            if (ctx?.previousData !== undefined) {
                queryClient.setQueryData(queryKey, ctx.previousData);
            }
        },
        onSettled: () => {
            // Refetch after mutation
            queryClient.invalidateQueries({ queryKey });
        },
        ...mutationOptions,
    });
}

/**
 * Hook to invalidate queries manually
 */
export function useInvalidateQuery() {
    const queryClient = useQueryClient();

    return (queryKey: unknown[]) => {
        queryClient.invalidateQueries({ queryKey });
    };
}

/**
 * Hook to prefetch a query
 */
export function usePrefetch() {
    const client = useClient();
    const queryClient = useQueryClient();

    return async <TData = unknown, TInput = void>(path: string, input?: TInput) => {
        await queryClient.prefetchQuery({
            queryKey: [path, input],
            queryFn: () => client.query<TInput, TData>(path, input),
        });
    };
}

/**
 * Hook for subscriptions
 */
export function useSubscription<TData = unknown, TInput = void>(
    path: string,
    input: TInput,
    options: SubscriptionOptions<TData>
) {
    const client = useClient();

    useEffect(() => {
        const unsubscribe = client.subscribe<TInput, TData>(path, input, options);
        return () => {
            unsubscribe();
        };
    }, [path, JSON.stringify(input), client]); // JSON.stringify to handle object inputs in dependency array
}
