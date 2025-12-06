import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@lemur-bookstores/client/server';

export async function POST(request: NextRequest) {
    await clearAuthCookies();
    return NextResponse.json({ success: true });
}
