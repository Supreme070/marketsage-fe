/**
 * LeadPulse Error Middleware
 * 
 * Express-style middleware for handling errors in LeadPulse endpoints
 * with automatic fallback strategies and graceful degradation.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { leadPulseErrorBoundary, ErrorCategory, type ErrorContext } from './error-boundary';
import { logger } from '@/lib/logger';

// Request wrapper for error handling
export interface ErrorHandledRequest {
  execute: <T>(
    operation: () => Promise<T>,
    category: ErrorCategory,
    operationName: string
  ) => Promise<T>;
  
  context: ErrorContext;
  request: NextRequest;
}

/**
 * Create error-handled request wrapper
 */
export function createErrorHandledRequest(request: NextRequest): ErrorHandledRequest {
  // Extract context from request
  const context: ErrorContext = {
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    metadata: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    },
  };
  
  return {
    execute: async <T>(
      operation: () => Promise<T>,
      category: ErrorCategory,
      operationName: string
    ): Promise<T> => {
      const result = await leadPulseErrorBoundary.executeWithRecovery(
        operation,
        category,
        context,
        operationName
      );
      
      if (!result.success) {
        // Log the failure but don't throw - let the endpoint handle it
        logger.warn('Error boundary operation failed', {
          operation: operationName,
          category,
          context,
          result,
        });
        
        // Return the fallback data or throw based on strategy
        if (result.fallbackUsed && result.data) {
          return result.data;
        }
        
        throw new Error(result.message || 'Operation failed');
      }
      
      // Cache successful results for future fallback
      if (result.data && !result.fallbackUsed) {
        await leadPulseErrorBoundary.cacheResult(
          operationName,
          context,
          result.data
        );
      }
      
      return result.data;
    },
    
    context,
    request,
  };
}

/**
 * Error response generator with fallback data
 */
export function createErrorResponse(
  error: Error,
  fallbackData?: any,
  status: number = 500
): NextResponse {
  const isValidationError = status === 400;
  const isRateLimitError = status === 429;
  const isBotBlockError = status === 403;
  
  // For certain errors, provide graceful responses
  if (isValidationError) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request data',
      message: error.message,
      fallback: false,
    }, { status: 400 });
  }
  
  if (isRateLimitError) {
    return NextResponse.json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Please slow down your requests',
      fallback: false,
    }, { status: 429 });
  }
  
  if (isBotBlockError) {
    return NextResponse.json({
      success: false,
      error: 'Request blocked',
      message: 'Automated traffic detected',
      fallback: false,
    }, { status: 403 });
  }
  
  // For server errors, try to provide fallback data
  if (fallbackData) {
    logger.info('Returning fallback data in error response', {
      error: error.message,
      hasFallback: !!fallbackData,
    });
    
    return NextResponse.json({
      success: true,
      fallback: true,
      data: fallbackData,
      message: 'Service temporarily degraded, using cached data',
    }, { status: 200 });
  }
  
  // Generic error response
  return NextResponse.json({
    success: false,
    error: 'Internal server error',
    message: 'Service temporarily unavailable',
    fallback: false,
  }, { status: 500 });
}

/**
 * Tracking endpoint error handler
 */
export async function handleTrackingError(
  request: NextRequest,
  error: Error,
  context: Partial<ErrorContext> = {}
): Promise<NextResponse> {
  const fullContext: ErrorContext = {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  logger.error('Tracking endpoint error', {
    error: error.message,
    context: fullContext,
    stack: error.stack,
  });
  
  // For tracking endpoints, we want to minimize disruption
  // Return success even if there are internal issues
  return NextResponse.json({
    success: true,
    fallback: true,
    visitorId: context.visitorId || `fallback_${Date.now()}`,
    message: 'Event tracked with fallback processing',
  }, { status: 200 });
}

/**
 * Form submission error handler
 */
export async function handleFormSubmissionError(
  request: NextRequest,
  error: Error,
  context: Partial<ErrorContext> = {}
): Promise<NextResponse> {
  const fullContext: ErrorContext = {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  logger.error('Form submission error', {
    error: error.message,
    context: fullContext,
    formId: context.metadata?.formId,
  });
  
  // Try to queue the form submission for later processing
  try {
    await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        throw error; // Trigger fallback processing
      },
      ErrorCategory.PROCESSING,
      fullContext,
      'processFormSubmission'
    );
    
    return NextResponse.json({
      success: true,
      fallback: true,
      contactCreated: false,
      message: 'Form submission queued for processing',
    }, { status: 200 });
    
  } catch (recoveryError) {
    // Even the error boundary failed
    return NextResponse.json({
      success: false,
      error: 'Service temporarily unavailable',
      message: 'Please try again later',
    }, { status: 503 });
  }
}

/**
 * Analytics endpoint error handler
 */
export async function handleAnalyticsError(
  request: NextRequest,
  error: Error,
  context: Partial<ErrorContext> = {}
): Promise<NextResponse> {
  const fullContext: ErrorContext = {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  logger.error('Analytics endpoint error', {
    error: error.message,
    context: fullContext,
  });
  
  // Try to return fallback analytics data
  try {
    const fallbackResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        throw error; // Trigger fallback processing
      },
      ErrorCategory.PROCESSING,
      fullContext,
      'analytics'
    );
    
    return NextResponse.json(fallbackResult.data, { status: 200 });
    
  } catch (recoveryError) {
    // Return minimal analytics data
    return NextResponse.json({
      success: true,
      fallback: true,
      data: {
        traffic: { data: [], metrics: {} },
        message: 'Analytics temporarily unavailable',
      },
    }, { status: 200 });
  }
}

/**
 * Mobile tracking error handler
 */
export async function handleMobileTrackingError(
  request: NextRequest,
  error: Error,
  context: Partial<ErrorContext> = {}
): Promise<NextResponse> {
  const fullContext: ErrorContext = {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  logger.error('Mobile tracking error', {
    error: error.message,
    context: fullContext,
    visitorId: context.visitorId,
    eventType: context.eventType,
  });
  
  // For mobile tracking, always return success to avoid breaking app flow
  return NextResponse.json({
    success: true,
    fallback: true,
    touchpointId: `fallback_${Date.now()}`,
    message: 'Mobile event queued for processing',
  }, { status: 200 });
}

/**
 * Visitor lookup error handler
 */
export async function handleVisitorLookupError(
  request: NextRequest,
  error: Error,
  context: Partial<ErrorContext> = {}
): Promise<NextResponse> {
  const fullContext: ErrorContext = {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  logger.error('Visitor lookup error', {
    error: error.message,
    context: fullContext,
  });
  
  // Return "not found" for lookup errors
  return NextResponse.json({
    visitorId: null,
    isReturning: false,
    fallback: true,
    message: 'Visitor lookup temporarily unavailable',
  }, { status: 200 });
}

/**
 * Database operation wrapper with error handling
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  operationName: string
): Promise<T> {
  return await leadPulseErrorBoundary.executeWithRecovery(
    operation,
    ErrorCategory.DATABASE,
    context,
    operationName
  ).then(result => {
    if (!result.success) {
      throw new Error(result.message || 'Database operation failed');
    }
    return result.data;
  });
}

/**
 * Cache operation wrapper with error handling
 */
export async function withCacheErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  operationName: string
): Promise<T> {
  return await leadPulseErrorBoundary.executeWithRecovery(
    operation,
    ErrorCategory.CACHE,
    context,
    operationName
  ).then(result => {
    if (!result.success) {
      // For cache errors, we can often continue without the cache
      logger.warn('Cache operation failed, continuing without cache', {
        operation: operationName,
        context,
      });
      throw new Error(result.message || 'Cache operation failed');
    }
    return result.data;
  });
}

/**
 * External API operation wrapper with error handling
 */
export async function withExternalAPIErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  operationName: string
): Promise<T> {
  return await leadPulseErrorBoundary.executeWithRecovery(
    operation,
    ErrorCategory.EXTERNAL_API,
    context,
    operationName
  ).then(result => {
    if (!result.success) {
      throw new Error(result.message || 'External API operation failed');
    }
    return result.data;
  });
}

/**
 * Validation error handler
 */
export function handleValidationError(
  error: Error,
  field?: string
): NextResponse {
  logger.warn('Validation error', {
    error: error.message,
    field,
  });
  
  return NextResponse.json({
    success: false,
    error: 'Validation failed',
    message: error.message,
    field,
    fallback: false,
  }, { status: 400 });
}

/**
 * Rate limiting error handler
 */
export function handleRateLimitError(
  ip: string,
  limit: string,
  resetTime?: number
): NextResponse {
  logger.warn('Rate limit exceeded', { ip, limit });
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': limit,
    'X-RateLimit-Remaining': '0',
  };
  
  if (resetTime) {
    headers['X-RateLimit-Reset'] = resetTime.toString();
  }
  
  return NextResponse.json({
    success: false,
    error: 'Rate limit exceeded',
    message: 'Too many requests. Please slow down.',
    fallback: false,
  }, { 
    status: 429,
    headers,
  });
}

/**
 * Bot detection error handler
 */
export function handleBotDetectionError(
  confidence: number,
  reasons: string[]
): NextResponse {
  logger.info('Bot traffic detected and blocked', {
    confidence,
    reasons,
  });
  
  return NextResponse.json({
    success: false,
    error: 'Request blocked',
    message: 'Automated traffic detected',
    fallback: false,
  }, { status: 403 });
}

/**
 * Generic error handler for unexpected errors
 */
export function handleUnexpectedError(
  error: Error,
  context?: Partial<ErrorContext>
): NextResponse {
  logger.error('Unexpected error in LeadPulse endpoint', {
    error: error.message,
    stack: error.stack,
    context,
  });
  
  return NextResponse.json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    fallback: false,
  }, { status: 500 });
}

/**
 * Health check error handler
 */
export function handleHealthCheckError(error: Error): NextResponse {
  logger.error('Health check failed', {
    error: error.message,
  });
  
  return NextResponse.json({
    status: 'unhealthy',
    error: error.message,
    timestamp: new Date().toISOString(),
  }, { status: 503 });
}