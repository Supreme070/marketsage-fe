import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    // Get the path from the URL
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/v2/auth/', '');
    
    // Forward to backend
    const backendUrl = process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
    const response = await fetch(`${backendUrl}/api/v2/auth/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.accessToken && { 'Authorization': `Bearer ${session.accessToken}` }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

