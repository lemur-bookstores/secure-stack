/**
 * Cookie Utilities for Cross-Runtime Support
 * 
 * Provides unified cookie management across different Next.js contexts:
 * - Server Components (RSC)
 * - Route Handlers
 * - Middleware
 * - Server Actions
 */

import { cookies as nextCookies } from 'next/headers';

/**
 * Cookie options for setting cookies
 */
export interface CookieOptions {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Default cookie options for auth cookies
 */
const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};

/**
 * Session cookie names
 */
export const COOKIE_NAMES = {
    ACCESS_TOKEN: 'secure-stack.access-token',
    REFRESH_TOKEN: 'secure-stack.refresh-token',
    SESSION: 'secure-stack.session',
} as const;

/**
 * Get all session-related cookies
 * 
 * @example
 * ```ts
 * // In Server Component or Route Handler
 * const sessionCookies = await getSessionCookies();
 * console.log(sessionCookies.accessToken);
 * ```
 */
export async function getSessionCookies(): Promise<{
    accessToken?: string;
    refreshToken?: string;
    session?: string;
}> {
    const cookieStore = await nextCookies();

    return {
        accessToken: cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value,
        refreshToken: cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value,
        session: cookieStore.get(COOKIE_NAMES.SESSION)?.value,
    };
}

/**
 * Set session cookies
 * 
 * @example
 * ```ts
 * // In Route Handler or Server Action
 * await setSessionCookies({
 *   accessToken: 'jwt-token-here',
 *   refreshToken: 'refresh-token-here'
 * });
 * ```
 */
export async function setSessionCookies(
    tokens: {
        accessToken?: string;
        refreshToken?: string;
        session?: string;
    },
    options: CookieOptions = {}
): Promise<void> {
    const cookieStore = await nextCookies();
    const cookieOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options };

    if (tokens.accessToken !== undefined) {
        cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, cookieOptions);
    }

    if (tokens.refreshToken !== undefined) {
        cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, cookieOptions);
    }

    if (tokens.session !== undefined) {
        cookieStore.set(COOKIE_NAMES.SESSION, tokens.session, cookieOptions);
    }
}

/**
 * Clear all auth-related cookies
 * 
 * @example
 * ```ts
 * // In Route Handler or Server Action (logout)
 * await clearAuthCookies();
 * ```
 */
export async function clearAuthCookies(): Promise<void> {
    const cookieStore = await nextCookies();

    cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
    cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);
    cookieStore.delete(COOKIE_NAMES.SESSION);
}

/**
 * Get access token from cookies
 * 
 * @example
 * ```ts
 * const token = await getAccessToken();
 * if (token) {
 *   // Use token
 * }
 * ```
 */
export async function getAccessToken(): Promise<string | undefined> {
    const cookieStore = await nextCookies();
    return cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
}

/**
 * Set access token cookie
 * 
 * @example
 * ```ts
 * await setAccessToken('jwt-token-here', { maxAge: 60 * 15 }); // 15 minutes
 * ```
 */
export async function setAccessToken(
    token: string,
    options: CookieOptions = {}
): Promise<void> {
    const cookieStore = await nextCookies();
    const cookieOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options };
    cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, token, cookieOptions);
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken(): Promise<string | undefined> {
    const cookieStore = await nextCookies();
    return cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
}

/**
 * Set refresh token cookie
 * 
 * @example
 * ```ts
 * await setRefreshToken('refresh-token-here', { maxAge: 60 * 60 * 24 * 30 }); // 30 days
 * ```
 */
export async function setRefreshToken(
    token: string,
    options: CookieOptions = {}
): Promise<void> {
    const cookieStore = await nextCookies();
    const cookieOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options };
    cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, token, cookieOptions);
}
