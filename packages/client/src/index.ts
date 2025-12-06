/**
 * SecureStack Client - Core Package
 */

export { SecureStackClient } from './client';
export type {
    ClientConfig,
    RequestOptions,
    ClientResponse,
    ClientError,
    QueryOptions,
    MutationOptions,
    SubscriptionOptions,
    ClientMiddleware,
    MiddlewareContext,
    MiddlewareNext,
    AuthSession,
} from './types';

export { CacheManager } from './cache/cache';
export { TimeBasedStrategy, StaleWhileRevalidateStrategy } from './cache/strategies';
export type { CacheStrategy } from './cache/strategies';

export { TokenManager, globalTokenManager, createAuthMiddleware } from './auth';
export type { AuthMiddlewareConfig } from './auth';

export {
    generateCSRFToken,
    getCSRFTokenFromCookie,
    setCSRFTokenCookie,
    ensureCSRFToken,
    clearCSRFToken,
    validateCSRFToken,
    createCSRFMiddleware,
    csrfMiddleware,
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
} from './security';
export type { CSRFMiddlewareConfig } from './security';
