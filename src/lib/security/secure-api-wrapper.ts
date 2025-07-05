/**
 * Secure API Wrapper
 * ==================
 * Centralized security wrapper for all API endpoints
 * Handles authentication, authorization, input validation, and rate limiting
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { AuthorizationService, Permission } from './authorization';
import { SecurityValidator, validateRequest } from './input-validation';
import { rateLimiters } from './rate-limiter';
import { logger } from '@/lib/logger';
import type { z } from 'zod';

export interface SecureApiConfig {
  requireAuth?: boolean;
  requiredPermissions?: Permission[];
  requireAnyPermission?: Permission[];
  allowedRoles?: string[];
  rateLimitType?: 'api' | 'ai' | 'email' | 'sms' | 'upload' | 'export';
  validationSchema?: z.ZodSchema<any>;
  allowAnonymous?: boolean;
  requireOrganization?: boolean;
  logRequests?: boolean;
  sanitizeResponse?: boolean;
}

export interface SecureApiContext {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    organizationName: string;
  };
  validatedData?: any;
  request: NextRequest;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
}

export interface SecureApiResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
}

/**
 * Secure API wrapper function
 */
export function secureApiHandler(
  config: SecureApiConfig,
  handler: (context: SecureApiContext) => Promise<SecureApiResult>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = request.nextUrl.pathname;
    const method = request.method;
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = getClientIP(request);
    
    try {
      // 1. Rate limiting check
      if (config.rateLimitType) {
        const rateLimiter = rateLimiters[config.rateLimitType];
        const identifier = `${ip}:${userAgent.slice(0, 50)}`;
        const rateResult = rateLimiter.check(identifier, endpoint);
        
        if (!rateResult.allowed) {
          logger.warn('Rate limit exceeded', {
            endpoint,
            method,
            ip,
            type: config.rateLimitType,
            retryAfter: rateResult.retryAfter
          });
          
          return NextResponse.json(
            { 
              error: 'Too Many Requests',
              message: 'Rate limit exceeded. Please try again later.',
              retryAfter: rateResult.retryAfter
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateResult.limit.toString(),
                'X-RateLimit-Remaining': rateResult.remaining.toString(),
                'X-RateLimit-Reset': new Date(rateResult.resetTime).toISOString(),
                'Retry-After': (rateResult.retryAfter || 60).toString()
              }
            }
          );
        }
      }
      
      // 2. Authentication check
      let session = null;
      if (config.requireAuth && !config.allowAnonymous) {
        session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
          logger.warn('Unauthenticated request', { endpoint, method, ip });
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
      }
      
      // 3. Authorization check
      if (session?.user && (config.requiredPermissions || config.requireAnyPermission)) {
        const userRole = session.user.role as any;
        
        if (config.requiredPermissions) {
          const hasPermissions = AuthorizationService.hasAllPermissions(
            userRole,
            config.requiredPermissions
          );
          
          if (!hasPermissions) {
            logger.warn('Insufficient permissions', {
              endpoint,
              method,
              userId: session.user.id,
              userRole,
              requiredPermissions: config.requiredPermissions
            });
            
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }
        
        if (config.requireAnyPermission) {
          const hasAnyPermission = AuthorizationService.hasAnyPermission(
            userRole,
            config.requireAnyPermission
          );
          
          if (!hasAnyPermission) {
            logger.warn('Insufficient permissions (any)', {
              endpoint,
              method,
              userId: session.user.id,
              userRole,
              requireAnyPermission: config.requireAnyPermission
            });
            
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }
      }
      
      // 4. Role-based access check
      if (config.allowedRoles && session?.user) {
        if (!config.allowedRoles.includes(session.user.role)) {
          logger.warn('Role not allowed', {
            endpoint,
            method,
            userId: session.user.id,
            userRole: session.user.role,
            allowedRoles: config.allowedRoles
          });
          
          return NextResponse.json(
            { error: 'Access denied for your role' },
            { status: 403 }
          );
        }
      }
      
      // 5. Organization check
      if (config.requireOrganization && session?.user) {
        if (!session.user.organizationId) {
          logger.warn('Organization required', {
            endpoint,
            method,
            userId: session.user.id
          });
          
          return NextResponse.json(
            { error: 'Organization membership required' },
            { status: 403 }
          );
        }
      }
      
      // 6. Input validation
      let validatedData = null;
      if (config.validationSchema && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        try {
          const body = await request.json();
          const validation = validateRequest(config.validationSchema, body, endpoint);
          
          if (!validation.success) {
            logger.warn('Input validation failed', {
              endpoint,
              method,
              errors: validation.errors,
              userId: session?.user?.id
            });
            
            return NextResponse.json(
              { 
                error: 'Invalid input data',
                details: validation.errors 
              },
              { status: 400 }
            );
          }
          
          validatedData = validation.data;
        } catch (error) {
          logger.error('Failed to parse request body', {
            endpoint,
            method,
            error: error instanceof Error ? error.message : String(error),
            userId: session?.user?.id
          });
          
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          );
        }
      }
      
      // 7. Security headers check
      const contentType = request.headers.get('content-type');
      if (contentType && !isAllowedContentType(contentType)) {
        logger.warn('Blocked content type', {
          endpoint,
          method,
          contentType,
          userId: session?.user?.id
        });
        
        return NextResponse.json(
          { error: 'Content type not allowed' },
          { status: 415 }
        );
      }
      
      // 8. Build context
      const context: SecureApiContext = {
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.role || 'USER',
          organizationId: session.user.organizationId || '',
          organizationName: session.user.organizationName || ''
        } : undefined,
        validatedData,
        request,
        rateLimitInfo: config.rateLimitType ? {
          remaining: rateLimiters[config.rateLimitType].getStatus(
            `${ip}:${userAgent.slice(0, 50)}`, 
            endpoint
          )?.remaining || 0,
          resetTime: Date.now() + (60 * 1000) // Default 1 minute
        } : undefined
      };
      
      // 9. Log request if enabled
      if (config.logRequests) {
        logger.info('API request', {
          endpoint,
          method,
          userId: context.user?.id,
          userRole: context.user?.role,
          organizationId: context.user?.organizationId,
          ip,
          userAgent: userAgent.slice(0, 100)
        });
      }
      
      // 10. Execute handler
      const result = await handler(context);
      
      // 11. Handle response
      const responseHeaders: Record<string, string> = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        ...result.headers
      };
      
      // 12. Sanitize response if enabled
      let responseData = result.data;
      if (config.sanitizeResponse && responseData) {
        responseData = sanitizeResponseData(responseData);
      }
      
      // 13. Log response
      const executionTime = Date.now() - startTime;
      logger.info('API response', {
        endpoint,
        method,
        statusCode: result.statusCode || (result.success ? 200 : 500),
        executionTime,
        userId: context.user?.id,
        success: result.success
      });
      
      // 14. Return response
      return NextResponse.json(
        result.success ? responseData : { error: result.error },
        {
          status: result.statusCode || (result.success ? 200 : 500),
          headers: responseHeaders
        }
      );
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('API handler error', {
        endpoint,
        method,
        error: errorMessage,
        executionTime,
        userId: session?.user?.id,
        ip
      });
      
      // Don't expose internal errors to client
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          }
        }
      );
    }
  };
}

/**
 * Check if content type is allowed
 */
function isAllowedContentType(contentType: string): boolean {
  const allowedTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
    'text/csv',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  return allowedTypes.some(type => contentType.includes(type));
}

/**
 * Sanitize response data to prevent information disclosure
 */
function sanitizeResponseData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key')) {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = sanitizeResponseData(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Extract client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Helper function to create secure API handlers with common configurations
 */
export const secureApiHelpers = {
  /**
   * Create handler for authenticated user operations
   */
  userOperation: (
    validationSchema: z.ZodSchema<any>,
    handler: (context: SecureApiContext) => Promise<SecureApiResult>
  ) => secureApiHandler({
    requireAuth: true,
    rateLimitType: 'api',
    validationSchema,
    logRequests: true,
    requireOrganization: true
  }, handler),
  
  /**
   * Create handler for admin operations
   */
  adminOperation: (
    permissions: Permission[],
    validationSchema: z.ZodSchema<any>,
    handler: (context: SecureApiContext) => Promise<SecureApiResult>
  ) => secureApiHandler({
    requireAuth: true,
    requiredPermissions: permissions,
    rateLimitType: 'api',
    validationSchema,
    logRequests: true,
    requireOrganization: true
  }, handler),
  
  /**
   * Create handler for AI operations
   */
  aiOperation: (
    validationSchema: z.ZodSchema<any>,
    handler: (context: SecureApiContext) => Promise<SecureApiResult>
  ) => secureApiHandler({
    requireAuth: true,
    requiredPermissions: [Permission.USE_AI_FEATURES],
    rateLimitType: 'ai',
    validationSchema,
    logRequests: true,
    requireOrganization: true
  }, handler),
  
  /**
   * Create handler for public operations
   */
  publicOperation: (
    validationSchema?: z.ZodSchema<any>,
    handler?: (context: SecureApiContext) => Promise<SecureApiResult>
  ) => secureApiHandler({
    allowAnonymous: true,
    rateLimitType: 'api',
    validationSchema,
    logRequests: true
  }, handler || (async () => ({ success: true, data: { message: 'OK' } }))),
  
  /**
   * Create handler for super admin operations
   */
  superAdminOperation: (
    validationSchema: z.ZodSchema<any>,
    handler: (context: SecureApiContext) => Promise<SecureApiResult>
  ) => secureApiHandler({
    requireAuth: true,
    allowedRoles: ['SUPER_ADMIN'],
    rateLimitType: 'api',
    validationSchema,
    logRequests: true,
    sanitizeResponse: true
  }, handler)
};