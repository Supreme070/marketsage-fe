import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isAuthorizedAdmin, getAdminPermissions, AdminPermissions } from '@/lib/admin-config';
import { adminSecurityMiddleware, defaultAdminSecurityConfig } from '@/lib/admin-security-middleware';

/**
 * Admin API middleware for protecting admin endpoints
 */
export async function withAdminAuth(
  request: NextRequest,
  requiredPermission?: keyof AdminPermissions
): Promise<{ authorized: boolean; response?: NextResponse; user?: any; permissions?: AdminPermissions }> {
  try {
    // Get auth token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    const userEmail = token.email;
    const userRole = token.role;

    // Check if user is authorized admin
    const isAdmin = userEmail && isAuthorizedAdmin(userEmail, userRole);

    if (!isAdmin) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Forbidden', message: 'Admin access required' },
          { status: 403 }
        ),
      };
    }

    // Get permissions for the user's role
    const permissions = getAdminPermissions(userRole);

    // Check specific permission if required
    if (requiredPermission && !permissions[requiredPermission]) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Forbidden', message: `Missing required permission: ${requiredPermission}` },
          { status: 403 }
        ),
      };
    }

    // Return success with user data and permissions
    return {
      authorized: true,
      user: {
        id: token.sub,
        email: userEmail,
        role: userRole,
        organizationId: token.organizationId,
      },
      permissions,
    };
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Utility function to wrap admin API routes with authentication
 */
export function createAdminHandler(
  handler: (
    req: NextRequest,
    context: { 
      params: any;
      user: any;
      permissions: AdminPermissions;
    }
  ) => Promise<NextResponse>,
  requiredPermission?: keyof AdminPermissions
) {
  return async (req: NextRequest, context: { params: any }) => {
    // Apply security middleware first
    const securityResult = await adminSecurityMiddleware(req, defaultAdminSecurityConfig);
    if (securityResult) {
      return securityResult;
    }

    // Then check authentication and authorization
    const authResult = await withAdminAuth(req, requiredPermission);

    if (!authResult.authorized) {
      return authResult.response!;
    }

    // Call the actual handler with auth context
    return handler(req, {
      params: context.params,
      user: authResult.user!,
      permissions: authResult.permissions!,
    });
  };
}

/**
 * Helper function to log admin actions for audit trail
 */
export async function logAdminAction(
  user: any,
  action: string,
  resource: string,
  details?: any,
  req?: NextRequest
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    adminId: user.id,
    adminEmail: user.email,
    adminRole: user.role,
    action,
    resource,
    details: details || {},
    ip: req ? getClientIP(req) : 'unknown',
    userAgent: req ? req.headers.get('user-agent') || 'unknown' : 'unknown',
  };

  // Console log for development
  console.log('Admin Action:', JSON.stringify(logEntry, null, 2));
  
  try {
    // Save to database audit log (if audit log table exists)
    // This is a safe call that won't fail if the table doesn't exist
    const { prisma } = await import('@/lib/db/prisma');
    
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminEmail: user.email,
        adminRole: user.role,
        action,
        resource,
        details: JSON.stringify(logEntry.details),
        ipAddress: logEntry.ip,
        userAgent: logEntry.userAgent,
        timestamp: new Date(),
      },
    }).catch((error) => {
      // If audit log table doesn't exist, just log to console
      console.log('Audit log table not found, logged to console only:', error.message);
    });
  } catch (error) {
    // Fallback to console logging only
    console.log('Failed to save audit log to database:', error);
  }
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: NextRequest): string {
  // Check for forwarded IP first (common in production behind proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check for real IP
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  // Check for connecting IP
  const connectingIP = req.headers.get('x-connecting-ip');
  if (connectingIP) {
    return connectingIP.trim();
  }
  
  // Fallback to connection remote address
  return req.headers.get('x-vercel-forwarded-for') || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
}