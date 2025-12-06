import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookies, setCSRFCookie } from '@lemur-bookstores/client/server';

export async function POST(request: NextRequest) {
    const body = await request.json();

    // Mock validation
    if (!body.email || body.email.includes('error')) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const user = {
        id: '1',
        email: body.email,
        role: 'admin',
        permissions: ['read:users', 'write:users'],
        name: body.email.split('@')[0],
    };

    const accessToken = `mock-access-token-${Date.now()}`;
    const refreshToken = `mock-refresh-token-${Date.now()}`;
    const sessionToken = createUnsignedJWT({
        ...user,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    });

    await setSessionCookies({
        accessToken,
        refreshToken,
        session: sessionToken,
    });

    const response = NextResponse.json({
        success: true,
        accessToken,
        user,
    });

    setCSRFCookie(response);

    return response;
}

function createUnsignedJWT(payload: Record<string, any>): string {
    const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = base64UrlEncode(JSON.stringify(payload));
    return `${header}.${body}.`;
}

function base64UrlEncode(value: string): string {
    return Buffer.from(value)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
