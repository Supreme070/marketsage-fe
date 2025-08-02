import { type NextRequest, NextResponse } from 'next/server';
import { useNestJSAuth, getNestJSBackendURL } from '@/lib/feature-flags';

/**
 * Auth Proxy - Registration Endpoint
 * Routes to either Next.js or NestJS auth based on feature flag
 */

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (useNestJSAuth()) {
      // Forward to NestJS backend
      const nestjsURL = getNestJSBackendURL();
      if (!nestjsURL) {
        throw new Error('NestJS backend URL not configured');
      }

      const body = await request.json();
      
      // Transform request format if needed
      const nestjsPayload = {
        name: body.name,
        email: body.email,
        password: body.password,
        organizationName: body.company || body.organizationName, // Handle both formats
      };

      const response = await fetch(`${nestjsURL}/api/v2/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nestjsPayload),
      });

      const data = await response.json();

      // Transform response format to match Next.js format
      if (data.success) {
        return NextResponse.json({
          message: data.message || 'User registered successfully',
          user: data.data,
        }, { status: 201 });
      } else {
        return NextResponse.json({
          error: data.error?.message || 'Registration failed'
        }, { status: 400 });
      }

    } else {
      // Forward to existing Next.js auth endpoint
      const url = new URL('/api/auth/register', request.url);
      
      return fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(await request.json()),
      }).then(res => res.json()).then(data => {
        return NextResponse.json(data, { 
          status: data.error ? 400 : 201 
        });
      });
    }

  } catch (error) {
    console.error('Auth proxy error:', error);
    return NextResponse.json({
      error: 'Authentication service temporarily unavailable'
    }, { status: 503 });
  }
}