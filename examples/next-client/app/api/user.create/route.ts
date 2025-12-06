import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email } = body;

        // Validate input
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            );
        }

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create new user
        const newUser = {
            id: Math.random().toString(36).slice(2, 11),
            name,
            email,
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json(newUser);
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }
}
