/**
 * Enhanced API Proxy Utility for MarketSage Frontend
 * Provides standardized proxy functionality to forward requests to NestJS backend
 * with authentication, error handling, and response formatting
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// Configuration
const NESTJS_BASE_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
const API_PREFIX = '/api/v2';

export interface ProxyOptions {
  /** Custom path mapping if the backend endpoint differs from frontend */
  backendPath?: string;
  /** Whether to require authentication (default: true) */
  requireAuth?: boolean;
  /** Custom headers to add to the request */
  customHeaders?: Record<string, string>;
  /** Whether to log requests for debugging (default: false) */
  enableLogging?: boolean;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

export interface ProxyResponse {
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  success: boolean;
  status: number;
}

/**
 * Enhanced proxy function that forwards requests to NestJS backend
 */
export async function proxyToBackend(
  request: NextRequest,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const {
    backendPath,
    requireAuth = true,
    customHeaders = {},
    enableLogging = false,
    timeout = 30000,
  } = options;

  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    // Extract path and query parameters
    const url = new URL(request.url);
    const frontendPath = url.pathname;
    const queryString = url.search;

    // Determine the backend path
    const targetPath = backendPath || frontendPath.replace('/api/', '');
    const nestjsUrl = `${NESTJS_BASE_URL}${API_PREFIX}/${targetPath}${queryString}`;

    // Authentication handling
    let authToken: string | undefined;
    if (requireAuth) {
      const session = await getServerSession(authOptions);
      
      if (enableLogging) {
        console.log(`[API Proxy] Session check for ${frontendPath}:`, { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          hasAccessToken: !!session?.accessToken 
        });
      }
      
      if (!session || !session.user) {
        if (enableLogging) {
          console.log(`[API Proxy] Authentication failed for ${frontendPath}`);
        }
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          } as ProxyResponse,
          { status: 401 }
        );
      }

      // Extract JWT token from session
      authToken = session.accessToken as string;
      
      if (enableLogging) {
        console.log(`[API Proxy] Using access token for ${frontendPath}:`, authToken ? 'present' : 'missing');
      }
    }

    // Prepare headers
    const headers = new Headers();
    
    // Copy original headers (except host)
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Add authentication header if available
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    // Add tracking and debugging headers
    headers.set('x-correlation-id', correlationId);
    headers.set('x-forwarded-for', request.ip || 'unknown');
    headers.set('x-forwarded-proto', url.protocol.slice(0, -1));
    headers.set('x-proxy-source', 'marketsage-frontend');
    headers.set('x-proxy-timestamp', new Date().toISOString());

    // Add custom headers
    Object.entries(customHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // Prepare request options
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for non-GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        requestOptions.body = await request.arrayBuffer();
      } catch (error) {
        console.error('[API Proxy] Failed to read request body:', error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REQUEST_BODY',
              message: 'Failed to parse request body',
            },
          } as ProxyResponse,
          { status: 400 }
        );
      }
    }

    // Log request if enabled
    if (enableLogging) {
      console.log(`[API Proxy] ${request.method} ${frontendPath} -> ${nestjsUrl}`, {
        correlationId,
        headers: Object.fromEntries(headers.entries()),
        hasAuth: !!authToken,
      });
    }

    // Forward request to NestJS backend
    const response = await fetch(nestjsUrl, requestOptions);
    const responseTime = Date.now() - startTime;

    // Prepare response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // Add proxy metadata headers
    responseHeaders.set('x-proxied-by', 'marketsage-api-proxy');
    responseHeaders.set('x-correlation-id', correlationId);
    responseHeaders.set('x-response-time', `${responseTime}ms`);

    // Log response if enabled
    if (enableLogging) {
      console.log(`[API Proxy] Response ${response.status} for ${frontendPath}`, {
        correlationId,
        responseTime: `${responseTime}ms`,
        status: response.status,
      });
    }

    // Handle different response types
    let responseBody: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch (error) {
        console.error('[API Proxy] Failed to parse JSON response:', error);
        responseBody = { 
          success: false, 
          error: { code: 'INVALID_RESPONSE', message: 'Invalid JSON response from backend' } 
        };
      }
    } else {
      responseBody = await response.text();
    }

    // Return proxied response
    return NextResponse.json(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('[API Proxy] Proxy error:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      targetUrl: `${NESTJS_BASE_URL}${API_PREFIX}`,
      responseTime: `${responseTime}ms`,
    });

    // Handle specific error types
    let errorResponse: ProxyResponse;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorResponse = {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timeout - backend service took too long to respond',
          },
          status: 504,
        };
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        errorResponse = {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Backend service is currently unavailable',
          },
          status: 503,
        };
      } else {
        errorResponse = {
          success: false,
          error: {
            code: 'PROXY_ERROR',
            message: 'Failed to proxy request to backend service',
            details: error.message,
          },
          status: 500,
        };
      }
    } else {
      errorResponse = {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
        },
        status: 500,
      };
    }

    return NextResponse.json(errorResponse, { 
      status: errorResponse.status,
      headers: {
        'x-correlation-id': correlationId,
        'x-response-time': `${responseTime}ms`,
        'x-proxied-by': 'marketsage-api-proxy',
      }
    });
  }
}

/**
 * Simplified proxy function for common use cases
 */
export async function createProxy(backendPath?: string) {
  return async (request: NextRequest) => {
    return proxyToBackend(request, {
      backendPath,
      enableLogging: process.env.NODE_ENV === 'development',
    });
  };
}

/**
 * Proxy function with authentication disabled (for public endpoints)
 */
export async function createPublicProxy(backendPath?: string) {
  return async (request: NextRequest) => {
    return proxyToBackend(request, {
      backendPath,
      requireAuth: false,
      enableLogging: process.env.NODE_ENV === 'development',
    });
  };
}

/**
 * Utility to check if NestJS backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${NESTJS_BASE_URL}${API_PREFIX}/health`, {
      method: 'GET',
      headers: {
        'x-correlation-id': crypto.randomUUID(),
      },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error('[API Proxy] Backend health check failed:', error);
    return false;
  }
}