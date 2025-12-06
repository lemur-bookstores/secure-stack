import { NextRequest, NextResponse } from 'next/server';

// Mock users data
const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Alice Johnson', email: 'alice@example.com' },
];

export async function GET(request: NextRequest) {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(users);
}
