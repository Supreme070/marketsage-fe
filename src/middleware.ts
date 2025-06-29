import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { setTenantContext, clearTenantContext } from '@/lib/tenant/edge-tenant-context';

/**
 * Middleware for the MarketSage application
 * - Handles API errors consistently
 * - Adds security headers
 * - Logs API requests
 */
export async function middleware(request: NextRequest) {
  try {
    // Process API routes with consistent headers and tenant context
    if (request.nextUrl.pathname.startsWith('/api')) {
      // Get token for tenant context
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Add security headers
      const response = NextResponse.next();
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('X-Frame-Options', 'DENY');
      
      // Add tenant context to request headers and environment for database middleware
      if (token?.organizationId) {
        response.headers.set('x-tenant-id', token.organizationId);
        // Also add to the request for downstream processing
        request.headers.set('x-tenant-id', token.organizationId);
        // Set in environment for database middleware access
        setTenantContext(token.organizationId);
      } else {
        // Clear tenant context if no valid token
        clearTenantContext();
      }
      
      // Get client IP address from headers (for proxied requests)
      const clientIp = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      // Log API request using structured logger
      logger.info(`API Request: ${request.method} ${request.nextUrl.pathname}`, {
        method: request.method,
        path: request.nextUrl.pathname,
        query: Object.fromEntries(request.nextUrl.searchParams.entries()),
        ip: clientIp,
        userAgent: request.headers.get('user-agent') || 'unknown',
        tenantId: token?.organizationId || 'anonymous',
      });
      
      return response;
    }

    // For non-API routes, handle authentication and authorization
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

    // If the path is a public route, continue
    if (publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // If the path is an API route for password reset, allow it
    if (
      request.nextUrl.pathname.startsWith('/api/auth/forgot-password') ||
      request.nextUrl.pathname.startsWith('/api/auth/reset-password')
    ) {
      return NextResponse.next();
    }

    // If the user is not logged in, redirect to login page
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based access control
    const userRole = token.role || 'USER';
    const path = request.nextUrl.pathname;

    // Super Admin can access everything
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.next();
    }

    // Admin restrictions
    if (userRole === 'ADMIN') {
      // Admins can't access system settings or API management
      if (
        path.includes('/settings/system') ||
        path.includes('/settings/api') ||
        path.includes('/settings/database')
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // IT Admin restrictions
    if (userRole === 'IT_ADMIN') {
      // IT Admins can only access system settings, API, and technical areas
      if (
        path.includes('/settings/users') ||
        path.includes('/settings/billing') ||
        path.startsWith('/campaigns/create') ||
        path.startsWith('/emails/create')
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Regular user restrictions
    if (userRole === 'USER') {
      // Regular users can't access admin areas
      if (
        path.includes('/settings/users') ||
        path.includes('/settings/billing') ||
        path.includes('/settings/system') ||
        path.includes('/settings/api') ||
        path.includes('/settings/database')
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    // Global error handling
    console.error('Middleware error:', error);
    
    // Only handle errors for API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
      return handleApiError(error, request.nextUrl.pathname);
    }

    // For UI routes, redirect to error page
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

/**
 * Configure which paths should be processed by this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
