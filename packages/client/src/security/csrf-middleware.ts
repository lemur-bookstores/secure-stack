import type { ClientMiddleware, MiddlewareContext, MiddlewareNext } from '../types';
import { ensureCSRFToken, CSRF_HEADER_NAME } from '../security/csrf';

/**
 * CSRF Middleware Configuration
 */
export interface CSRFMiddlewareConfig {
    /**
     * Methods that require CSRF protection
     * @default ['POST', 'PUT', 'PATCH', 'DELETE']
     */
    protectedMethods?: string[];

    /**
     * Paths that should be excluded from CSRF protection
     * Useful for public endpoints or third-party webhooks
     */
    excludePaths?: string[];

    /**
     * Custom header name for CSRF token
     * @default 'X-CSRF-Token'
     */
    headerName?: string;

    /**
     * Enable CSRF protection
     * Set to false to disable (e.g., in development)
     * @default true
     */
    enabled?: boolean;
}

/**
 * Creates a CSRF protection middleware using the double-submit cookie pattern
 * 
 * How it works:
 * 1. Ensures a CSRF token exists in cookies (generates if needed)
 * 2. Injects the token into request headers for protected methods
 * 3. Server validates that cookie and header match
 * 
 * @example
 * ```ts
 * const client = new SecureStackClient({
 *   url: 'http://localhost:3000/api',
 *   middleware: [
 *     createCSRFMiddleware({
 *       protectedMethods: ['POST', 'PUT', 'DELETE'],
 *       excludePaths: ['/webhook/stripe']
 *     })
 *   ]
 * });
 * ```
 */
export function createCSRFMiddleware(config: CSRFMiddlewareConfig = {}): ClientMiddleware {
    const {
        protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'],
        excludePaths = [],
        headerName = CSRF_HEADER_NAME,
        enabled = true,
    } = config;

    return async (context: MiddlewareContext, next: MiddlewareNext) => {
        // Skip if disabled
        if (!enabled) {
            return next(context);
        }

        // Skip if not a protected method
        const method = context.method.toUpperCase();
        if (!protectedMethods.includes(method)) {
            return next(context);
        }

        // Skip if path is excluded
        const isExcluded = excludePaths.some(excludePath => {
            if (excludePath.includes('*')) {
                const regex = new RegExp('^' + excludePath.replace(/\*/g, '.*') + '$');
                return regex.test(context.path);
            }
            return context.path === excludePath || context.path.startsWith(excludePath);
        });

        if (isExcluded) {
            return next(context);
        }

        // Ensure CSRF token exists and inject into headers
        if (typeof document !== 'undefined') {
            const token = ensureCSRFToken();
            context.headers[headerName] = token;
        }

        return next(context);
    };
}

/**
 * Convenience function to create CSRF middleware with default config
 */
export const csrfMiddleware = createCSRFMiddleware();
