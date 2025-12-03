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
} from './types';

export { CacheManager } from './cache/cache';
export { TimeBasedStrategy, StaleWhileRevalidateStrategy } from './cache/strategies';
export type { CacheStrategy } from './cache/strategies';
