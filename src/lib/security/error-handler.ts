/**
 * Secure Error Handling System
 * ============================
 * Centralized error handling with security considerations
 * Prevents information disclosure while maintaining useful logging
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { Prisma } from '@/types/prisma-types';

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  endpoint: string;
  method: string;
  ip: string;
  userAgent?: string;
  requestId?: string;
}

export interface SecureErrorResponse {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
  requestId?: string;
  details?: any;
}

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Input Validation
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',
  UNSUPPORTED_CONTENT_TYPE = 'UNSUPPORTED_CONTENT_TYPE',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Business Logic
  OPERATION_FAILED = 'OPERATION_FAILED',
  INVALID_OPERATION = 'INVALID_OPERATION',
  PRECONDITION_FAILED = 'PRECONDITION_FAILED',
  CONFLICT = 'CONFLICT',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Security
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BLOCKED_REQUEST = 'BLOCKED_REQUEST',
  
  // AI/ML Operations
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  AI_PROCESSING_FAILED = 'AI_PROCESSING_FAILED'
}

export class SecureErrorHandler {
  
  /**
   * Handle any error and return appropriate response
   */
  static handleError(
    error: any,
    context: ErrorContext,
    isDevelopment = false
  ): NextResponse {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Classify the error
    const classification = this.classifyError(error);
    
    // Log the error securely
    this.logError(error, context, errorId, classification);
    
    // Create secure response
    const response = this.createSecureResponse(
      error,
      classification,
      errorId,
      isDevelopment
    );
    
    // Add security headers
    return NextResponse.json(response.body, {
      status: response.status,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'X-Error-ID': errorId
      }
    });
  }
  
  /**
   * Classify error type and severity
   */
  private static classifyError(error: any): {
    type: ErrorCode;
    severity: 'low' | 'medium' | 'high' | 'critical';
    statusCode: number;
    expose: boolean;
  } {
    // Prisma/Database errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return {
            type: ErrorCode.DUPLICATE_RECORD,
            severity: 'low',
            statusCode: 409,
            expose: true
          };
        case 'P2025':
          return {
            type: ErrorCode.RECORD_NOT_FOUND,
            severity: 'low',
            statusCode: 404,
            expose: true
          };
        case 'P2003':
          return {
            type: ErrorCode.CONSTRAINT_VIOLATION,
            severity: 'medium',
            statusCode: 400,
            expose: false
          };
        default:
          return {
            type: ErrorCode.DATABASE_ERROR,
            severity: 'high',
            statusCode: 500,
            expose: false
          };
      }
    }
    
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return {
        type: ErrorCode.DATABASE_ERROR,
        severity: 'high',
        statusCode: 500,
        expose: false
      };
    }
    
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return {
        type: ErrorCode.SERVICE_UNAVAILABLE,
        severity: 'critical',
        statusCode: 503,
        expose: false
      };
    }
    
    // Authentication errors
    if (error?.message?.includes('Unauthorized') || error?.status === 401) {
      return {
        type: ErrorCode.UNAUTHORIZED,
        severity: 'medium',
        statusCode: 401,
        expose: true
      };
    }
    
    if (error?.message?.includes('Forbidden') || error?.status === 403) {
      return {
        type: ErrorCode.FORBIDDEN,
        severity: 'medium',
        statusCode: 403,
        expose: true
      };
    }
    
    // Validation errors
    if (error?.name === 'ZodError' || error?.message?.includes('validation')) {
      return {
        type: ErrorCode.VALIDATION_FAILED,
        severity: 'low',
        statusCode: 400,
        expose: true
      };
    }
    
    // Rate limiting errors
    if (error?.message?.includes('rate limit') || error?.status === 429) {
      return {
        type: ErrorCode.RATE_LIMIT_EXCEEDED,
        severity: 'medium',
        statusCode: 429,
        expose: true
      };
    }
    
    // Timeout errors
    if (error?.message?.includes('timeout') || error?.code === 'TIMEOUT') {
      return {
        type: ErrorCode.TIMEOUT,
        severity: 'medium',
        statusCode: 504,
        expose: true
      };
    }
    
    // AI service errors
    if (error?.message?.includes('OpenAI') || error?.message?.includes('AI')) {
      return {
        type: ErrorCode.AI_SERVICE_ERROR,
        severity: 'medium',
        statusCode: 502,
        expose: false
      };
    }
    
    // Security violations
    if (error?.message?.includes('security') || error?.message?.includes('suspicious')) {
      return {
        type: ErrorCode.SECURITY_VIOLATION,
        severity: 'high',
        statusCode: 403,
        expose: false
      };
    }
    
    // Network/External service errors
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      return {
        type: ErrorCode.EXTERNAL_SERVICE_ERROR,
        severity: 'medium',
        statusCode: 502,
        expose: false
      };
    }
    
    // Default to internal server error
    return {
      type: ErrorCode.INTERNAL_SERVER_ERROR,
      severity: 'high',
      statusCode: 500,
      expose: false
    };
  }
  
  /**
   * Log error securely with appropriate detail level
   */
  private static logError(
    error: any,
    context: ErrorContext,
    errorId: string,
    classification: any
  ): void {
    const logData = {
      errorId,
      type: classification.type,
      severity: classification.severity,
      statusCode: classification.statusCode,
      endpoint: context.endpoint,
      method: context.method,
      userId: context.userId,
      organizationId: context.organizationId,
      ip: context.ip,
      userAgent: context.userAgent?.slice(0, 200),
      timestamp: new Date().toISOString(),
      
      // Safe error details
      errorName: error?.name,
      errorMessage: error?.message?.slice(0, 500),
      errorCode: error?.code,
      
      // Stack trace only in development or for critical errors
      ...(classification.severity === 'critical' && {
        stack: error?.stack
      })
    };
    
    // Log with appropriate level based on severity
    switch (classification.severity) {
      case 'low':
        logger.info('Request error', logData);
        break;
      case 'medium':
        logger.warn('Request error', logData);
        break;
      case 'high':
        logger.error('Request error', logData);
        break;
      case 'critical':
        logger.error('Critical request error', logData);
        // Could trigger alerts here
        break;
    }
    
    // Additional security logging for suspicious activity
    if (classification.type === ErrorCode.SECURITY_VIOLATION) {
      logger.warn('Security violation detected', {
        errorId,
        ip: context.ip,
        endpoint: context.endpoint,
        userAgent: context.userAgent,
        details: error?.message
      });
    }
  }
  
  /**
   * Create secure response that doesn't leak sensitive information
   */
  private static createSecureResponse(
    error: any,
    classification: any,
    errorId: string,
    isDevelopment: boolean
  ): { body: SecureErrorResponse; status: number } {
    
    const baseResponse: SecureErrorResponse = {
      error: classification.type,
      message: this.getPublicErrorMessage(classification.type),
      code: classification.type,
      timestamp: new Date().toISOString(),
      requestId: errorId
    };
    
    // Add details only if error should be exposed
    if (classification.expose) {
      if (error?.message && !this.containsSensitiveInfo(error.message)) {
        baseResponse.message = error.message;
      }
      
      // Validation errors can include field details
      if (classification.type === ErrorCode.VALIDATION_FAILED && error?.errors) {
        baseResponse.details = this.sanitizeValidationErrors(error.errors);
      }
    }
    
    // Development mode: include more details (but still secure)
    if (isDevelopment && classification.severity !== 'critical') {
      baseResponse.details = {
        originalMessage: error?.message?.slice(0, 200),
        errorName: error?.name,
        ...(error?.code && { errorCode: error.code })
      };
    }
    
    return {
      body: baseResponse,
      status: classification.statusCode
    };
  }
  
  /**
   * Get user-friendly error messages
   */
  private static getPublicErrorMessage(errorType: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Authentication required. Please log in.',
      [ErrorCode.FORBIDDEN]: 'Access denied. You do not have permission to perform this action.',
      [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
      [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions for this action.',
      
      [ErrorCode.INVALID_INPUT]: 'The provided input is invalid.',
      [ErrorCode.VALIDATION_FAILED]: 'Validation failed. Please check your input.',
      [ErrorCode.MALFORMED_REQUEST]: 'The request format is invalid.',
      [ErrorCode.UNSUPPORTED_CONTENT_TYPE]: 'Content type not supported.',
      
      [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
      [ErrorCode.TOO_MANY_REQUESTS]: 'Request limit exceeded. Please slow down.',
      [ErrorCode.QUOTA_EXCEEDED]: 'Usage quota exceeded.',
      
      [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
      [ErrorCode.RECORD_NOT_FOUND]: 'The requested resource was not found.',
      [ErrorCode.DUPLICATE_RECORD]: 'A record with this information already exists.',
      [ErrorCode.CONSTRAINT_VIOLATION]: 'The operation violates data constraints.',
      
      [ErrorCode.OPERATION_FAILED]: 'The operation could not be completed.',
      [ErrorCode.INVALID_OPERATION]: 'This operation is not allowed.',
      [ErrorCode.PRECONDITION_FAILED]: 'Precondition for this operation was not met.',
      [ErrorCode.CONFLICT]: 'The operation conflicts with current state.',
      
      [ErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred.',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable.',
      [ErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error. Please try again later.',
      
      [ErrorCode.SECURITY_VIOLATION]: 'Security violation detected.',
      [ErrorCode.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected.',
      [ErrorCode.BLOCKED_REQUEST]: 'Request blocked.',
      
      [ErrorCode.AI_SERVICE_ERROR]: 'AI service temporarily unavailable.',
      [ErrorCode.AI_QUOTA_EXCEEDED]: 'AI usage quota exceeded.',
      [ErrorCode.AI_PROCESSING_FAILED]: 'AI processing failed. Please try again.'
    };
    
    return messages[errorType] || 'An unexpected error occurred.';
  }
  
  /**
   * Check if error message contains sensitive information
   */
  private static containsSensitiveInfo(message: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /api[_-]?key/i,
      /auth/i,
      /credential/i,
      /connection.*string/i,
      /database.*url/i,
      /internal.*path/i,
      /file.*not.*found/i,
      /\w+@\w+\.\w+/, // Email addresses
      /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card numbers
      /[A-Za-z0-9]{20,}/ // Long random strings (potentially tokens)
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Sanitize validation errors for safe exposure
   */
  private static sanitizeValidationErrors(errors: any[]): any[] {
    return errors.map(error => ({
      field: error.path?.join('.'),
      message: error.message,
      code: error.code
    }));
  }
  
  /**
   * Create standard API error responses
   */
  static unauthorized(message?: string): NextResponse {
    return NextResponse.json(
      {
        error: ErrorCode.UNAUTHORIZED,
        message: message || 'Authentication required',
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );
  }
  
  static forbidden(message?: string): NextResponse {
    return NextResponse.json(
      {
        error: ErrorCode.FORBIDDEN,
        message: message || 'Access denied',
        timestamp: new Date().toISOString()
      },
      { status: 403 }
    );
  }
  
  static badRequest(message?: string, details?: any): NextResponse {
    return NextResponse.json(
      {
        error: ErrorCode.INVALID_INPUT,
        message: message || 'Invalid request',
        details,
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  static notFound(message?: string): NextResponse {
    return NextResponse.json(
      {
        error: ErrorCode.RECORD_NOT_FOUND,
        message: message || 'Resource not found',
        timestamp: new Date().toISOString()
      },
      { status: 404 }
    );
  }
  
  static rateLimit(retryAfter?: number): NextResponse {
    return NextResponse.json(
      {
        error: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded',
        retryAfter,
        timestamp: new Date().toISOString()
      },
      { 
        status: 429,
        headers: retryAfter ? { 'Retry-After': retryAfter.toString() } : {}
      }
    );
  }
  
  static internalError(errorId?: string): NextResponse {
    return NextResponse.json(
      {
        error: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        requestId: errorId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to wrap async API handlers with error handling
export function withErrorHandler(
  handler: (req: any, ...args: any[]) => Promise<NextResponse>,
  context?: Partial<ErrorContext>
) {
  return async (req: any, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      const errorContext: ErrorContext = {
        endpoint: req.nextUrl?.pathname || 'unknown',
        method: req.method || 'unknown',
        ip: req.ip || 'unknown',
        userAgent: req.headers?.get('user-agent') || undefined,
        ...context
      };
      
      return SecureErrorHandler.handleError(
        error,
        errorContext,
        process.env.NODE_ENV === 'development'
      );
    }
  };
}