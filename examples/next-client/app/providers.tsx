'use client';

import { SecureStackProvider, SessionProvider } from '@lemur-bookstores/secure-stack-client/react';
import {
  SecureStackClient,
  createAuthMiddleware,
  createCSRFMiddleware,
  globalTokenManager,
  ensureCSRFToken,
  CSRF_HEADER_NAME,
  type AuthSession,
} from '@lemur-bookstores/secure-stack-client';

// Create client with auth and CSRF middleware
const client = new SecureStackClient({
  url: 'http://localhost:3000/api',
  middleware: [
    // CSRF Protection - must come before auth middleware
    createCSRFMiddleware({
      protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
      excludePaths: ['/webhook/*'], // Exclude webhooks from CSRF
    }),
    // Logging middleware
    async (ctx, next) => {
      console.log(`[Request] ${ctx.method} ${ctx.path}`);
      const start = Date.now();
      try {
        const result = await next(ctx);
        const duration = Date.now() - start;
        console.log(`[Success] ${ctx.method} ${ctx.path} (${duration}ms)`);
        return result;
      } catch (error) {
        console.error(`[Error] ${ctx.method} ${ctx.path}:`, error);
        throw error;
      }
    },
    // Auth middleware - injects tokens and handles 401
    createAuthMiddleware({
      tokenManager: globalTokenManager,
      onRefreshToken: async () => {
        try {
          console.log('[Auth] Attempting to refresh token...');

          // Ensure CSRF token is in cookie and get it for header
          const csrfToken = ensureCSRFToken();

          const response = await fetch('http://localhost:3000/api/auth.refresh', {
            method: 'POST',
            credentials: 'include', // Important: include cookies
            headers: {
              'Content-Type': 'application/json',
              [CSRF_HEADER_NAME]: csrfToken, // Include CSRF token
            },
          });

          if (!response.ok) {
            console.error('[Auth] Refresh failed:', response.status);
            return null;
          }

          const data = await response.json();
          console.log('[Auth] Token refreshed successfully');
          return data.accessToken;
        } catch (error) {
          console.error('[Auth] Refresh error:', error);
          return null;
        }
      },
      onRefreshFailed: () => {
        console.log('[Auth] Session expired - please log in again');
      },
    }),
  ],
});

export function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: AuthSession | null;
}) {
  return (
    <SecureStackProvider client={client}>
      <SessionProvider
        path="auth.session"
        refreshInterval={5 * 60 * 1000} // Refresh every 5 minutes
        initialSession={initialSession || undefined}
      >
        {children}
      </SessionProvider>
    </SecureStackProvider>
  );
}
