/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Implements double-submit cookie pattern:
 * 1. Generate random CSRF token
 * 2. Store in cookie (readable by JavaScript)
 * 3. Send same token in custom header
 * 4. Server validates cookie matches header
 */

/**
 * CSRF token cookie name
 */
export const CSRF_COOKIE_NAME = 'secure-stack.csrf-token';

/**
 * CSRF token header name
 */
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 */
export function generateCSRFToken(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // Modern browsers and Node 19+
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        // Fallback for older environments
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Last resort fallback (not cryptographically secure)
    console.warn('[CSRF] Using non-secure random token generation');
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Get CSRF token from document cookies (client-side only)
 */
export function getCSRFTokenFromCookie(): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (typeof value === 'undefined') continue;
        if (name === CSRF_COOKIE_NAME) return decodeURIComponent(value);
    }

    return null;
}

/**
 * Set CSRF token in document cookies (client-side only)
 * Note: This cookie is NOT httpOnly so JavaScript can read it
 */
export function setCSRFTokenCookie(token: string, options: {
    maxAge?: number;
    path?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
} = {}): void {
    if (typeof document === 'undefined') {
        return;
    }

    const {
        maxAge = 60 * 60 * 24, // 24 hours
        path = '/',
        secure = window.location.protocol === 'https:',
        sameSite = 'strict',
    } = options;

    const cookieParts = [
        `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
        `Max-Age=${maxAge}`,
        `Path=${path}`,
        `SameSite=${sameSite}`,
    ];

    if (secure) {
        cookieParts.push('Secure');
    }

    document.cookie = cookieParts.join('; ');
}

/**
 * Ensure CSRF token exists, generate if needed
 * Returns the current or newly generated token
 */
export function ensureCSRFToken(): string {
    let token = getCSRFTokenFromCookie();

    if (!token) {
        token = generateCSRFToken();
        setCSRFTokenCookie(token);
    }

    return token;
}

/**
 * Clear CSRF token from cookies
 */
export function clearCSRFToken(): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.cookie = `${CSRF_COOKIE_NAME}=; Max-Age=0; Path=/`;
}

/**
 * Validate CSRF token (server-side)
 * Compares cookie value with header value
 */
export function validateCSRFToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
    if (!cookieToken || !headerToken) {
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    if (cookieToken.length !== headerToken.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < cookieToken.length; i++) {
        result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
    }

    return result === 0;
}
