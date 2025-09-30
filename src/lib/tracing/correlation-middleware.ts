import type { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation ID middleware for Next.js
 * Ensures all requests have correlation IDs for distributed tracing
 */
export function addCorrelationId(request: NextRequest, response: NextResponse) {
  // Get or create correlation ID
  const correlationId = request.headers.get('x-correlation-id') || 
                     request.headers.get('x-request-id') ||
                     uuidv4();

  // Add to response headers
  response.headers.set('x-correlation-id', correlationId);
  
  // Add to request headers for downstream services
  const newHeaders = new Headers(request.headers);
  newHeaders.set('x-correlation-id', correlationId);
  
  return {
    correlationId,
    headers: newHeaders,
    response
  };
}

/**
 * Enhanced fetch function that preserves correlation IDs
 */
export async function fetchWithCorrelation(
  url: string, 
  options: RequestInit = {},
  correlationId?: string
): Promise<Response> {
  const headers = new Headers(options.headers);
  
  // Add correlation ID if provided
  if (correlationId) {
    headers.set('x-correlation-id', correlationId);
  }
  
  // Add service identifier
  headers.set('x-source-service', 'marketsage-frontend');
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Proxy request to NestJS with correlation ID
 */
export async function proxyToNestJSWithCorrelation(
  request: NextRequest,
  nestjsPath: string,
  correlationId: string
): Promise<Response> {
  const nestjsUrl = process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
  const url = `${nestjsUrl}${nestjsPath}`;
  
  // Copy request headers and add correlation ID
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    headers.set(key, value);
  });
  headers.set('x-correlation-id', correlationId);
  headers.set('x-source-service', 'marketsage-frontend');
  
  // Forward the request
  const response = await fetch(url, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' 
      ? await request.text() 
      : undefined,
  });
  
  // Create response with correlation ID
  const proxyResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  
  // Ensure correlation ID is in response
  proxyResponse.headers.set('x-correlation-id', correlationId);
  
  return proxyResponse;
}