import { useQuery as useVueQuery, useMutation as useVueMutation, useQueryClient } from '@tanstack/vue-query';
import type {
    UseQueryOptions,
    UseQueryReturnType,
    UseMutationOptions,
    UseMutationReturnType,
} from '@tanstack/vue-query';
import { watchEffect, type Ref, unref } from 'vue';
import { useClient } from './plugin';
import type { ClientError, SubscriptionOptions } from '../types';

// Helper to unref input
type MaybeRef<T> = T | Ref<T>;

export function useQuery<TData = unknown, TInput = void>(
    path: string,
    input?: MaybeRef<TInput>,
    options?: UseQueryOptions<TData, ClientError>
): UseQueryReturnType<TData, ClientError> {
    const client = useClient();

    return useVueQuery<TData, ClientError>({
        queryKey: [path, input],
        queryFn: () => client.query<TInput, TData>(path, unref(input) as TInput),
        ...options,
    });
}

export function useMutation<TData = unknown, TInput = unknown>(
    path: string,
    options?: UseMutationOptions<TData, ClientError, TInput, unknown>
): UseMutationReturnType<TData, ClientError, TInput, unknown> {
    const client = useClient();

    return useVueMutation<TData, ClientError, TInput>({
        mutationFn: (variables: TInput) => client.mutate<TInput, TData>(path, variables),
        ...options,
    });
}

export function useSubscription<TData = unknown, TInput = void>(
    path: string,
    input: MaybeRef<TInput>,
    options: SubscriptionOptions<TData>
) {
    const client = useClient();

    watchEffect((onCleanup) => {
        const unsubscribe = client.subscribe<TInput, TData>(path, unref(input) as TInput, options);
        onCleanup(() => unsubscribe());
    });
}

export { useQueryClient };
