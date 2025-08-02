/**
 * NestJS Backend Proxy Configuration
 * Routes /api/v2/* requests to NestJS backend service
 */

import { type NextRequest, NextResponse } from 'next/server';

const NESTJS_BASE_URL = process.env.NESTJS_BASE_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3006';

export async function proxyToNestJS(request: NextRequest) {
  try {
    // Extract the path after /api/v2
    const url = new URL(request.url);
    const pathAfterV2 = url.pathname.replace('/api/v2', '');
    
    // Construct the NestJS URL (NestJS already has /api/v2 prefix in main.ts)
    const nestjsUrl = `${NESTJS_BASE_URL}/api/v2${pathAfterV2}${url.search}`;

    // Forward headers, excluding host
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Add correlation ID for tracing
    headers.set('x-correlation-id', crypto.randomUUID());
    headers.set('x-forwarded-for', request.ip || 'unknown');
    headers.set('x-forwarded-proto', url.protocol.slice(0, -1));

    // Prepare request options
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Add body for non-GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestOptions.body = await request.arrayBuffer();
    }

    // Forward request to NestJS
    const response = await fetch(nestjsUrl, requestOptions);

    // Create response with original status and headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // Add proxy identification header
    responseHeaders.set('x-proxied-by', 'nextjs-nestjs-proxy');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[NestJS Proxy Error]:', error);
    console.error('[NestJS Proxy] NESTJS_BASE_URL:', NESTJS_BASE_URL);
    console.error('[NestJS Proxy] Target URL:', `${NESTJS_BASE_URL}/api/v2${new URL(request.url).pathname.replace('/api/v2', '')}`);
    
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