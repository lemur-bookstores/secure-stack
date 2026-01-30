import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@lemur-bookstores/secure-stack-client/server';

export async function POST(request: NextRequest) {
    await clearAuthCookies();
    return NextResponse.json({ success: true });
}
