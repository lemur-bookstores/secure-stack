import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookies } from '@lemur-bookstores/secure-stack-client/server';

export async function GET(request: NextRequest) {
    const { refreshToken, accessToken: cookieAccessToken } = await getSessionCookies();

    // Check Authorization header for access token
    const authHeader = request.headers.get('authorization');
    const accessToken = extractToken(authHeader) || cookieAccessToken;

    // If no refresh token cookie, user is not logged in
    if (!refreshToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // If access token is invalid or expired, return 401 to trigger refresh
    if (accessToken && accessToken === 'expired-token') {
        return NextResponse.json({ message: 'Token expired' }, { status: 401 });
    }

    // If we have a valid access token (or the session is being checked without one)
    // Return the user data
    return NextResponse.json({
        id: '1',
        email: 'demo@example.com',
        role: 'admin',
        permissions: ['read:users', 'write:users']
    });
}

function extractToken(authHeader: string | null): string | undefined {
    if (!authHeader) return undefined;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        return parts[1];
    }
    return authHeader;
}
