import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
