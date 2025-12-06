/**
 * Core Client Types
 */

import type { DefaultContext } from '@lemur-bookstores/core';

/**
 * Client configuration options
 */
export interface ClientConfig {
    /**
     * Base URL for the API server
     */
    url: string;

    /**
     * Custom headers to include in all requests
     */
    headers?: Record<string, string>;

    /**
     * Request timeout in milliseconds
     * @default 30000 (30 seconds)
     */
    timeout?: number;

    /**
     * Enable automatic retries on network errors
     * @default true
     */
    retry?: boolean;

    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxRetries?: number;

    /**
     * Abort signal for cancelling requests
     */
    signal?: AbortSignal | undefined;

    /**
     * Middleware to run before requests
     */
    middleware?: ClientMiddleware[];
}

/**
 * Middleware Types
 */
export interface MiddlewareContext {
    path: string;
    method: string;
    body?: any;
    headers: Record<string, string>;
}

export type MiddlewareNext = (context: MiddlewareContext) => Promise<any>;

export type ClientMiddleware = (
    context: MiddlewareContext,
    next: MiddlewareNext
) => Promise<any>;

/**
 * Auth Session Types
 */
export interface AuthSession {
    user: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
        [key: string]: any;
    } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
    error?: Error | null;
}

/**
 * Request options for individual calls
 */
export interface RequestOptions {
    /**
     * Override default headers for this request
     */
    headers?: Record<string, string>;

    /**
     * Override default timeout for this request
     */
    timeout?: number;

    /**
     * Abort signal for this specific request
     */
    signal?: AbortSignal;

    /**
     * Custom context to pass to the server
     */
    context?: Partial<DefaultContext>;

    /**
     * Enable client-side caching for this request
     */
    enableCache?: boolean;

    /**
     * Cache TTL in milliseconds
     */
    cacheTTL?: number;
}

/**
 * Subscription options
 */
export interface SubscriptionOptions<TData = unknown> {
    /**
     * Callback on data received
     */
    onData: (data: TData) => void;

    /**
     * Callback on error
     */
    onError?: (error: ClientError) => void;

    /**
     * Callback on connection open
     */
    onOpen?: () => void;

    /**
     * Callback on connection close
     */
    onClose?: () => void;
}

/**
 * Base response from the server
 */
export interface ClientResponse<TData = unknown> {
    /**
     * Response data
     */
    data: TData;

    /**
     * Response headers
     */
    headers: Record<string, string>;

    /**
     * HTTP status code
     */
    status: number;
}

/**
 * Error response from the server
 */
export interface ClientError extends Error {
    /**
     * HTTP status code
     */
    status?: number;

    /**
     * Error code from SecureStackError
     */
    code?: string;

    /**
     * Additional error data
     */
    data?: unknown;
}

/**
 * Query options
 */
export interface QueryOptions {
    /**
     * Enable/disable the query
     * @default true
     */
    enabled?: boolean;

    /**
     * Refetch on window focus
     * @default true
     */
    refetchOnWindowFocus?: boolean;

    /**
     * Refetch on reconnect
     * @default true
     */
    refetchOnReconnect?: boolean;

    /**
     * Refetch interval in milliseconds
     */
    refetchInterval?: number;

    /**
     * Stale time in milliseconds
     * @default 0
     */
    staleTime?: number;

    /**
     * Cache time in milliseconds
     * @default 5 minutes
     */
    cacheTime?: number;

    /**
     * Retry failed requests
     * @default 3
     */
    retry?: boolean | number;
}

/**
 * Mutation options
 */
export interface MutationOptions {
    /**
     * Callback on success
     */
    onSuccess?: (data: unknown) => void | Promise<void>;

    /**
     * Callback on error
     */
    onError?: (error: ClientError) => void | Promise<void>;

    /**
     * Callback when mutation starts
     */
    onMutate?: (variables: unknown) => void | Promise<void>;

    /**
     * Callback when mutation settles (success or error)
     */
    onSettled?: (data: unknown | undefined, error: ClientError | null) => void | Promise<void>;

    /**
     * Retry failed mutations
     * @default false
     */
    retry?: boolean | number;
}
