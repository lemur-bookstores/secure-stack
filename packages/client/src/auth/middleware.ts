import type { ClientMiddleware, MiddlewareContext, MiddlewareNext } from '../types';
import type { TokenManager } from './token-manager';

export interface AuthMiddlewareConfig {
    /**
     * Token manager instance
     */
    tokenManager: TokenManager;

    /**
     * Optional refresh callback to obtain a new token when a 401 occurs
     */
    onRefreshToken?: () => Promise<string | null>;

    /**
     * Optional callback when token refresh fails
     */
    onRefreshFailed?: () => void;

    /**
     * Header name for the authorization token
     * @default 'Authorization'
     */
    headerName?: string;

    /**
     * Token prefix (e.g., 'Bearer')
     * @default 'Bearer'
     */
    tokenPrefix?: string;
}

/**
 * Creates an authentication middleware that:
 * 1. Injects the access token into request headers
 * 2. Handles 401 errors by attempting to refresh the token
 * 3. Retries the original request with the new token
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig): ClientMiddleware {
    const {
        tokenManager,
        onRefreshToken,
        onRefreshFailed,
        headerName = 'Authorization',
        tokenPrefix = 'Bearer',
    } = config;

    return async (context: MiddlewareContext, next: MiddlewareNext) => {
        // 1. Inject access token if available
        const token = tokenManager.getToken();
        if (token) {
            context.headers[headerName] = `${tokenPrefix} ${token}`;
        }

        try {
            // 2. Execute the request
            return await next(context);
        } catch (error: any) {
            // 3. Handle 401 Unauthorized - attempt token refresh
            if (error.status === 401 && onRefreshToken) {
                try {
                    const newToken = await onRefreshToken();

                    if (newToken) {
                        // Update token manager
                        tokenManager.setToken(newToken);

                        // Retry the request with the new token
                        context.headers[headerName] = `${tokenPrefix} ${newToken}`;
                        return await next(context);
                    } else {
                        // Refresh returned null - session is invalid
                        tokenManager.setToken(null);
                        if (onRefreshFailed) onRefreshFailed();
                        throw error;
                    }
                } catch (refreshError) {
                    // Refresh failed - clear token and notify
                    tokenManager.setToken(null);
                    if (onRefreshFailed) onRefreshFailed();
                    throw error;
                }
            }

            // Re-throw non-401 errors or if no refresh callback
            throw error;
        }
    };
}
