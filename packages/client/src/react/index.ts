/**
 * SecureStack React Integration
 */

export { SecureStackProvider, useSecureStackContext, useClient, useQueryClient } from './context';
export type { SecureStackProviderProps } from './context';

export {
    useQuery,
    useMutation,
    useMutationWithOptimisticUpdate,
    useInvalidateQuery,
    usePrefetch,
    useSubscription,
} from './hooks';
export type {
    UseSecureStackQueryOptions,
    UseSecureStackMutationOptions,
    OptimisticUpdateOptions,
} from './hooks';
