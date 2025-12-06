/**
 * Lightweight JWT decoding helpers for server-side session resolution
 */

import type { AuthSession } from '../types';

const ID_FIELDS = ['id', 'sub', 'userId', 'user_id', 'uid'];
const EMAIL_FIELDS = ['email', 'user_email'];
const ROLE_FIELDS = ['role', 'roles', 'user_role'];
const PERMISSION_FIELDS = ['permissions', 'perms', 'scopes'];

/**
 * Decode the payload portion of a JWT without verifying the signature.
 * This should only be used for non-sensitive reads (e.g., SSR hydration).
 */
export function decodeJWTPayload(token: string): Record<string, any> | null {
    try {
        const [header, payload, signature] = token.split('.');
        if (!payload || !header || !signature) {
            return null;
        }

        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
        const decodedPayload = Buffer.from(base64 + padding, 'base64').toString('utf-8');
        return JSON.parse(decodedPayload);
    } catch (error) {
        console.warn('[SecureStack][JWT] Failed to decode token payload:', error);
        return null;
    }
}

/**
 * Normalize arbitrary payload/user objects into AuthSession user shape
 */
export function mapPayloadToUser(payload: Record<string, any>): AuthSession['user'] | null {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const source = payload.user && typeof payload.user === 'object' ? payload.user : payload;

    const id = findFirstMatch(source, ID_FIELDS);
    if (!id || typeof id !== 'string') {
        return null;
    }

    const email = (findFirstMatch(source, EMAIL_FIELDS) as string) || source.email || '';
    const rawRole = findFirstMatch(source, ROLE_FIELDS);
    const role = Array.isArray(rawRole) ? rawRole[0] : rawRole || source.role || 'user';

    const permissionsSource = findFirstMatch(source, PERMISSION_FIELDS) ?? source.permissions;
    const permissions = Array.isArray(permissionsSource)
        ? permissionsSource.map(String)
        : typeof permissionsSource === 'string'
            ? [permissionsSource]
            : [];

    return {
        id,
        email,
        role,
        permissions,
        ...source,
    };
}

export function isAuthSession(value: unknown): value is AuthSession {
    return (
        typeof value === 'object' &&
        value !== null &&
        'user' in value &&
        'isAuthenticated' in value &&
        'status' in value
    );
}

export function isUserShape(value: any): value is AuthSession['user'] {
    return (
        value &&
        typeof value === 'object' &&
        typeof value.id === 'string' &&
        typeof value.email === 'string' &&
        typeof value.role === 'string' &&
        Array.isArray(value.permissions)
    );
}

function findFirstMatch(source: Record<string, any>, keys: string[]): any {
    for (const key of keys) {
        if (source[key] !== undefined) {
            return source[key];
        }
    }
    return undefined;
}
