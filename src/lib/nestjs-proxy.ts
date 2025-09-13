/**
 * NestJS Backend Proxy Configuration
 * Routes /api/v2/* requests to NestJS backend service
 */

import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getAppRouterSession } from '@/lib/auth/session-utils';

const NESTJS_BASE_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

export async function proxyToNestJS(request: NextRequest) {
  try {
    console.log('[NestJS Proxy] Starting proxy request');
    
    // Extract the path after /api/v2
    const url = new URL(request.url);
    const pathAfterV2 = url.pathname.replace('/api/v2', '');
    
    // Construct the NestJS URL (NestJS already has /api/v2 prefix in main.ts)
    const nestjsUrl = `${NESTJS_BASE_URL}/api/v2${pathAfterV2}${url.search}`;
    
    console.log('[NestJS Proxy] Target URL:', nestjsUrl);
    console.log('[NestJS Proxy] Method:', request.method);

    // Get session for authentication
    const session = await getAppRouterSession();

    // Forward all headers from the original request
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Add Authorization header if session exists
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
      console.log('[NestJS Proxy] Added Authorization header');
    } else {
      console.log('[NestJS Proxy] No session/access token found');
    }

    // Ensure Content-Type is set for non-GET requests
    if (request.method !== 'GET' && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }

    const response = await fetch(nestjsUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    console.log('[NestJS Proxy] Response status:', response.status);
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
    });

  } catch (error) {
    console.error('[NestJS Proxy Error]:', error);
    console.error('[NestJS Proxy] NESTJS_BASE_URL:', NESTJS_BASE_URL);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Backend service unavailable',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}