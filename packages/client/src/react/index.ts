/**
 * SecureStack React Integration
 */

export { SecureStackProvider, useSecureStackContext, useClient, useQueryClient, SessionProvider, useSession } from './context';
export type { SecureStackProviderProps, SessionProviderProps, SessionContextValue } from './context';

export {
    usePermission,
    useRole,
    Protect,
    SessionGuard,
    RoleGate,
    PermissionGate
} from './rbac';
export type {
    ProtectProps,
    SessionGuardProps,
    RoleGateProps,
    PermissionGateProps
} from './rbac';

export { useIsAuthenticated, useSignIn, useSignOut } from './auth-hooks';

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
