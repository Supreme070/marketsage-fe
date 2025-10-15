import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Universal Auth Proxy Handler
 * Forwards all auth requests to NestJS backend
 * Supports: GET, POST, PUT, PATCH, DELETE
 */
async function handleAuthProxy(request: NextRequest, method: string) {
  try {
    // Get the path from the URL
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/v2/auth/', '');

    // Get session for token forwarding (non-blocking)
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error('Session error (non-fatal):', sessionError);
    }

    // Prepare request options
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(session?.accessToken && { 'Authorization': `Bearer ${session.accessToken}` }),
    };

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON
      }
    }

    // Forward to backend
    const response = await fetch(`${backendUrl}/api/v2/auth/${path}`, fetchOptions);

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Auth proxy error (${method}):`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleAuthProxy(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleAuthProxy(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleAuthProxy(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return handleAuthProxy(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return handleAuthProxy(request, 'DELETE');
}

