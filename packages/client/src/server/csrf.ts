/**
 * Server-side CSRF validation utilities for Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../security/csrf';

/**
 * Validate CSRF token from Next.js request
 * 
 * @example
 * ```ts
 * // In Route Handler
 * export async function POST(request: NextRequest) {
 *   if (!validateCSRFFromRequest(request)) {
 *     return NextResponse.json(
 *       { error: 'Invalid CSRF token' },
 *       { status: 403 }
 *     );
 *   }
 *   
 *   // Process request...
 * }
 * ```
 */
export function validateCSRFFromRequest(request: NextRequest): boolean {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!headerToken) return false;

    return validateCSRFToken(cookieToken, headerToken);
}

/**
 * CSRF validation middleware wrapper for Route Handlers
 * 
 * @example
 * ```ts
 * export const POST = withCSRFProtection(async (request: NextRequest) => {
 *   // Your handler logic - CSRF already validated
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withCSRFProtection(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
        // Only validate for state-changing methods
        const method = request.method.toUpperCase();
        const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

        if (protectedMethods.includes(method)) {
            if (!validateCSRFFromRequest(request)) {
                return NextResponse.json(
                    {
                        error: 'CSRF validation failed',
                        code: 'CSRF_TOKEN_MISMATCH'
                    },
                    { status: 403 }
                );
            }
        }

        return handler(request, context);
    };
}

/**
 * Middleware function for Next.js middleware.ts file
 * Validates CSRF for protected routes
 * 
 * @example
 * ```ts
 * // middleware.ts
 * import { csrfMiddleware } from '@lemur-bookstores/secure-stack-client/server';
 * 
 * export function middleware(request: NextRequest) {
 *   return csrfMiddleware(request, {
 *     excludePaths: ['/api/webhook/*', '/api/public/*']
 *   });
 * }
 * 
 * export const config = {
 *   matcher: '/api/:path*'
 * };
 * ```
 */
export function csrfMiddleware(
    request: NextRequest,
    options: {
        excludePaths?: string[];
        onFailure?: (request: NextRequest) => NextResponse;
    } = {}
): NextResponse | null {
    const { excludePaths = [], onFailure } = options;

    // Check if path is excluded
    const pathname = request.nextUrl.pathname;
    const isExcluded = excludePaths.some(pattern => {
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(pathname);
        }
        return pathname === pattern || pathname.startsWith(pattern);
    });

    if (isExcluded) {
        return null; // Continue to next middleware/handler
    }

    // Only validate state-changing methods
    const method = request.method.toUpperCase();
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (!protectedMethods.includes(method)) {
        return null; // Continue to next middleware/handler
    }

    // Validate CSRF
    if (!validateCSRFFromRequest(request)) {
        if (onFailure) {
            return onFailure(request);
        }

        return NextResponse.json(
            {
                error: 'CSRF validation failed',
                code: 'CSRF_TOKEN_MISMATCH'
            },
            { status: 403 }
        );
    }

    return null; // CSRF valid, continue
}

/**
 * Generate CSRF token and set cookie in response
 * Useful for initial page load or after login
 * 
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   // ... login logic ...
 *   
 *   const response = NextResponse.json({ user });
 *   setCSRFCookie(response);
 *   return response;
 * }
 * ```
 */
export function setCSRFCookie(
    response: NextResponse,
    options: {
        maxAge?: number;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
    } = {}
): void {
    const {
        maxAge = 60 * 60 * 24, // 24 hours
        secure = process.env.NODE_ENV === 'production',
        sameSite = 'strict',
    } = options;

    // Generate token (server-side uses same function)
    const { generateCSRFToken } = require('../security/csrf');
    const token = generateCSRFToken();

    response.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Must be readable by JavaScript
        secure,
        sameSite,
        maxAge,
        path: '/',
    });
}
