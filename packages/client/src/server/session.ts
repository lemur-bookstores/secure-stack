/**
 * Server-side utilities for session management
 * Works with Next.js App Router (RSC + Route Handlers)
 */

import type { AuthSession } from '../types';
import { COOKIE_NAMES } from './cookies';
import { decodeJWTPayload, mapPayloadToUser, isAuthSession, isUserShape } from './jwt';

const DEFAULT_TOKEN_COOKIE_NAMES = [
    COOKIE_NAMES.SESSION,
    COOKIE_NAMES.ACCESS_TOKEN,
    COOKIE_NAMES.REFRESH_TOKEN,
    'auth_token',
];

type SessionDecoderResult = AuthSession | AuthSession['user'] | null | undefined;
export type SessionDecoder = (token: string) => Promise<SessionDecoderResult> | SessionDecoderResult;

/**
 * Options for getServerSession
 */
export interface GetServerSessionOptions {
    /**
     * Cookies object from Next.js (from cookies() function)
     */
    cookies: any;
    /**
     * API endpoint to validate session
     * @default '/api/auth/session'
     */
    sessionEndpoint?: string;
    /**
     * Base URL for API calls
     */
    baseUrl?: string;
    /**
     * Ordered list of cookie names to inspect for session tokens
     */
    tokenCookieNames?: string[];
    /**
     * Custom decoder for session tokens (e.g., verified JWT decode)
     */
    sessionDecoder?: SessionDecoder;
    /**
     * Enable built-in JWT payload decoding (non-verified)
     * @default true
     */
    enableJwtDecode?: boolean;
    /**
     * Custom mapper to convert decoded payloads into AuthSession user shape
     */
    mapJwtPayloadToUser?: (payload: Record<string, any>) => AuthSession['user'] | null;
    /**
     * If true, skip the network request fallback when decoding fails
     */
    disableRequest?: boolean;
    /**
     * Additional fetch options when calling the session endpoint
     */
    requestInit?: RequestInit;
}

/**
 * Get session data on the server (RSC or Route Handler)
 * Reads the refresh token from cookies and validates it
 */
export async function getServerSession(
    options: GetServerSessionOptions
): Promise<AuthSession | null> {
    const {
        cookies,
        sessionEndpoint = '/api/auth/session',
        baseUrl = '',
        tokenCookieNames = DEFAULT_TOKEN_COOKIE_NAMES,
        sessionDecoder,
        enableJwtDecode = true,
        mapJwtPayloadToUser: customMapper,
        disableRequest = false,
        requestInit,
    } = options;

    try {
        const tokenInfo = getTokenFromCookies(cookies, tokenCookieNames);

        if (!tokenInfo) {
            return unauthenticatedSession();
        }

        // 1. Attempt custom decoder / JWT decode locally
        const decodedSession = await decodeSessionFromToken(tokenInfo.value, {
            sessionDecoder,
            enableJwtDecode,
            customMapper,
        });

        if (decodedSession) {
            return decodedSession;
        }

        if (disableRequest) {
            return unauthenticatedSession();
        }

        // 2. Fallback to session endpoint fetch
        const url = baseUrl ? `${baseUrl}${sessionEndpoint}` : sessionEndpoint;

        const headers = new Headers(requestInit?.headers as HeadersInit);
        if (tokenInfo.name) {
            headers.set('cookie', `${tokenInfo.name}=${tokenInfo.value}`);
        }

        const response = await fetch(url, {
            cache: 'no-store',
            ...requestInit,
            headers,
        });

        if (!response.ok) {
            return unauthenticatedSession();
        }

        const payload = await response.json();
        const session = normalizeSessionResponse(payload, customMapper);
        if (session) {
            return session;
        }

        return unauthenticatedSession();
    } catch (error) {
        console.error('[getServerSession] Error:', error);
        return errorSession(error);
    }
}

function getTokenFromCookies(
    cookieStore: any,
    names: string[]
): { name: string; value: string } | null {
    for (const name of names) {
        const raw = getCookieValue(cookieStore, name);
        if (raw) {
            return { name, value: raw };
        }
    }
    return null;
}

function getCookieValue(cookieStore: any, name: string): string | undefined {
    if (!cookieStore) return undefined;

    if (typeof cookieStore.get === 'function') {
        const value = cookieStore.get(name);
        if (!value) return undefined;
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && typeof value.value === 'string') {
            return value.value;
        }
    }

    if (typeof cookieStore === 'object' && cookieStore[name]) {
        const value = cookieStore[name];
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && typeof value.value === 'string') {
            return value.value;
        }
    }

    return undefined;
}

async function decodeSessionFromToken(
    token: string,
    options: {
        sessionDecoder?: SessionDecoder;
        enableJwtDecode: boolean;
        customMapper?: (payload: Record<string, any>) => AuthSession['user'] | null;
    }
): Promise<AuthSession | null> {
    const { sessionDecoder, enableJwtDecode, customMapper } = options;

    if (sessionDecoder) {
        const result = await sessionDecoder(token);
        const normalized = normalizeDecoderResult(result);
        if (normalized) {
            return normalized;
        }
    }

    if (enableJwtDecode) {
        const payload = decodeJWTPayload(token);
        if (payload) {
            const user = (customMapper || mapPayloadToUser)(payload);
            if (user) {
                return authenticatedSession(user);
            }
        }
    }

    return null;
}

function normalizeDecoderResult(result: SessionDecoderResult): AuthSession | null {
    if (!result) {
        return null;
    }

    if (isAuthSession(result)) {
        return {
            ...result,
            isLoading: false,
            status: result.status || (result.isAuthenticated ? 'authenticated' : 'unauthenticated'),
        };
    }

    if (isUserShape(result)) {
        return authenticatedSession(result);
    }

    return null;
}

function normalizeSessionResponse(
    payload: any,
    customMapper?: (payload: Record<string, any>) => AuthSession['user'] | null
): AuthSession | null {
    if (!payload) {
        return null;
    }

    if (isAuthSession(payload)) {
        return {
            ...payload,
            isLoading: false,
        };
    }

    const maybeUser = payload.user || payload;
    const user = customMapper ? customMapper(maybeUser) : isUserShape(maybeUser) ? maybeUser : null;

    if (user) {
        return authenticatedSession(user);
    }

    return null;
}

function authenticatedSession(user: AuthSession['user']): AuthSession {
    return {
        user,
        isAuthenticated: true,
        isLoading: false,
        status: 'authenticated',
        error: null,
    };
}

function unauthenticatedSession(): AuthSession {
    return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: 'unauthenticated',
        error: null,
    };
}

function errorSession(error: unknown): AuthSession {
    return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: 'error',
        error: error instanceof Error ? error : new Error('Unknown error'),
    };
}

/**
 * Serialize session for client hydration
 */
export function serializeSession(session: AuthSession | null): string {
    if (!session) return '';
    return Buffer.from(JSON.stringify(session)).toString('base64');
}

/**
 * Deserialize session from client hydration
 */
export function deserializeSession(serialized: string): AuthSession | null {
    if (!serialized) return null;
    try {
        const json = Buffer.from(serialized, 'base64').toString('utf-8');
        return JSON.parse(json);
    } catch {
        return null;
    }
}
