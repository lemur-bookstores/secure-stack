import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookies, clearAuthCookies } from '@lemur-bookstores/client/server';

/**
 * POST /api/auth/cookie-demo
 * Demonstrates cookie utilities
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { action } = body;

    if (action === 'set') {
        // Demo: Set cookies (normally done after successful login)
        await setSessionCookies({
            accessToken: 'demo-access-token-' + Date.now(),
            refreshToken: 'demo-refresh-token-' + Date.now(),
        }, {
            maxAge: 60 * 15, // 15 minutes for access token
        });

        return NextResponse.json({
            message: 'Cookies set successfully',
            note: 'Check Application > Cookies in DevTools',
        });
    }

    if (action === 'clear') {
        // Demo: Clear all auth cookies (normally done on logout)
        await clearAuthCookies();

        return NextResponse.json({
            message: 'Cookies cleared successfully',
        });
    }

    return NextResponse.json(
        { error: 'Invalid action. Use "set" or "clear"' },
        { status: 400 }
    );
}

/**
 * GET /api/auth/cookie-demo
 * Read and display current cookies
 */
export async function GET() {
    const { getSessionCookies } = await import('@lemur-bookstores/client/server');
    const cookies = await getSessionCookies();

    return NextResponse.json({
        cookies,
        hasCookies: !!(cookies.accessToken || cookies.refreshToken),
    });
}
