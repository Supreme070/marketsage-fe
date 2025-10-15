/**
 * LeadPulse Error Boundaries and Fallback Strategies
 * 
 * Comprehensive error handling system that ensures LeadPulse tracking
 * continues to function even when individual components fail.
 * Implements graceful degradation and resilient data collection.
 */

import { logger } from '@/lib/logger';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';
// NOTE: Prisma removed - using backend API (LeadPulseSecurityEvent exists in backend)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  DATABASE = 'database',
  CACHE = 'cache',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  EXTERNAL_API = 'external_api',
  AUTHENTICATION = 'authentication',
  RATE_LIMITING = 'rate_limiting',
  BOT_DETECTION = 'bot_detection'
}

// Error recovery strategies
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  DEGRADE = 'degrade',
  CACHE = 'cache',
  QUEUE = 'queue',
  IGNORE = 'ignore'
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  visitorId?: string;
  pixelId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  eventType?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Error recovery result
export interface RecoveryResult {
  success: boolean;
  data?: any;
  fallbackUsed: boolean;
  strategy: RecoveryStrategy;
  message?: string;
  retryCount?: number;
}

// Error configuration
interface ErrorConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackEnabled: boolean;
  cacheTimeout: number;
  queueTimeout: number;
}

// Default error configurations per category
const ERROR_CONFIGS: Record<ErrorCategory, ErrorConfig> = {
  [ErrorCategory.DATABASE]: {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackEnabled: true,
    cacheTimeout: 300000, // 5 minutes
    queueTimeout: 600000, // 10 minutes
  },
  [ErrorCategory.CACHE]: {
    maxRetries: 2,
    retryDelay: 500,
    fallbackEnabled: true,
    cacheTimeout: 0,
    queueTimeout: 0,
  },
  [ErrorCategory.NETWORK]: {
    maxRetries: 3,
    retryDelay: 2000,
    fallbackEnabled: true,
    cacheTimeout: 180000, // 3 minutes
    queueTimeout: 300000, // 5 minutes
  },
  [ErrorCategory.VALIDATION]: {
    maxRetries: 0,
    retryDelay: 0,
    fallbackEnabled: false,
    cacheTimeout: 0,
    queueTimeout: 0,
  },
  [ErrorCategory.PROCESSING]: {
    maxRetries: 2,
    retryDelay: 1000,
    fallbackEnabled: true,
    cacheTimeout: 120000, // 2 minutes
    queueTimeout: 300000, // 5 minutes
  },
  [ErrorCategory.EXTERNAL_API]: {
    maxRetries: 3,
    retryDelay: 3000,
    fallbackEnabled: true,
    cacheTimeout: 600000, // 10 minutes
    queueTimeout: 1800000, // 30 minutes
  },
  [ErrorCategory.AUTHENTICATION]: {
    maxRetries: 1,
    retryDelay: 1000,
    fallbackEnabled: false,
    cacheTimeout: 0,
    queueTimeout: 0,
  },
  [ErrorCategory.RATE_LIMITING]: {
    maxRetries: 0,
    retryDelay: 0,
    fallbackEnabled: true,
    cacheTimeout: 60000, // 1 minute
    queueTimeout: 300000, // 5 minutes
  },
  [ErrorCategory.BOT_DETECTION]: {
    maxRetries: 1,
    retryDelay: 500,
    fallbackEnabled: true,
    cacheTimeout: 30000, // 30 seconds
    queueTimeout: 0,
  },
};

// In-memory error recovery cache
const recoveryCache = new Map<string, any>();

// Error queue for failed operations
const errorQueue: Array<{
  id: string;
  operation: string;
  data: any;
  context: ErrorContext;
  timestamp: number;
  retryCount: number;
}> = [];

class LeadPulseErrorBoundary {
  /**
   * Execute an operation with comprehensive error handling
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    category: ErrorCategory,
    context: ErrorContext,
    operationName: string
  ): Promise<RecoveryResult> {
    const config = ERROR_CONFIGS[category];
    let lastError: Error | null = null;
    let retryCount = 0;

    // Try the main operation with retries
    while (retryCount <= config.maxRetries) {
      try {
        const result = await operation();
        
        // Log successful recovery if this was a retry
        if (retryCount > 0) {
          logger.info('Operation recovered after retries', {
            operation: operationName,
            retryCount,
            context,
          });
        }
        
        return {
          success: true,
          data: result,
          fallbackUsed: false,
          strategy: retryCount > 0 ? RecoveryStrategy.RETRY : RecoveryStrategy.RETRY,
          retryCount,
        };
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        logger.warn('Operation failed, attempting recovery', {
          operation: operationName,
          error: lastError.message,
          retryCount,
          maxRetries: config.maxRetries,
          category,
          context,
        });
        
        // Wait before retry (with exponential backoff)
        if (retryCount <= config.maxRetries) {
          await this.delay(config.retryDelay * Math.pow(2, retryCount - 1));
        }
      }
    }
    
    // Main operation failed, try recovery strategies
    logger.error('Main operation failed after retries, attempting fallback', {
      operation: operationName,
      error: lastError?.message,
      retryCount: retryCount - 1,
      category,
      context,
    });
    
    return await this.attemptRecovery(
      operationName,
      lastError!,
      category,
      context,
      retryCount - 1
    );
  }

  /**
   * Attempt recovery using various strategies
   */
  private async attemptRecovery(
    operationName: string,
    error: Error,
    category: ErrorCategory,
    context: ErrorContext,
    retryCount: number
  ): Promise<RecoveryResult> {
    const config = ERROR_CONFIGS[category];
    
    // Try cache recovery first
    if (config.cacheTimeout > 0) {
      const cacheResult = await this.tryCacheRecovery(operationName, context);
      if (cacheResult.success) {
        return cacheResult;
      }
    }
    
    // Try fallback strategy
    if (config.fallbackEnabled) {
      const fallbackResult = await this.tryFallbackStrategy(operationName, category, context);
      if (fallbackResult.success) {
        return fallbackResult;
      }
    }
    
    // Queue for later processing if applicable
    if (config.queueTimeout > 0) {
      const queueResult = await this.queueForRetry(operationName, context, error);
      if (queueResult.success) {
        return queueResult;
      }
    }
    
    // Log critical failure
    logger.error('All recovery strategies failed', {
      operation: operationName,
      error: error.message,
      category,
      context,
      retryCount,
    });
    
    // Store error for monitoring
    await this.recordError(operationName, error, category, context);
    
    return {
      success: false,
      fallbackUsed: false,
      strategy: RecoveryStrategy.IGNORE,
      message: `Operation failed: ${error.message}`,
      retryCount,
    };
  }

  /**
   * Try to recover data from cache
   */
  private async tryCacheRecovery(
    operationName: string,
    context: ErrorContext
  ): Promise<RecoveryResult> {
    try {
      const cacheKey = this.generateCacheKey(operationName, context);
      
      // Check in-memory cache first
      if (recoveryCache.has(cacheKey)) {
        const cachedData = recoveryCache.get(cacheKey);
        
        logger.info('Recovered data from in-memory cache', {
          operation: operationName,
          cacheKey,
          context,
        });
        
        return {
          success: true,
          data: cachedData,
          fallbackUsed: true,
          strategy: RecoveryStrategy.CACHE,
        };
      }
      
      // Try Redis cache
      const cachedData = await leadPulseCache.get(cacheKey);
      if (cachedData) {
        logger.info('Recovered data from Redis cache', {
          operation: operationName,
          cacheKey,
          context,
        });
        
        return {
          success: true,
          data: cachedData,
          fallbackUsed: true,
          strategy: RecoveryStrategy.CACHE,
        };
      }
      
    } catch (cacheError) {
      logger.warn('Cache recovery failed', {
        operation: operationName,
        error: cacheError.message,
        context,
      });
    }
    
    return {
      success: false,
      fallbackUsed: false,
      strategy: RecoveryStrategy.CACHE,
    };
  }

  /**
   * Try fallback strategies based on operation type
   */
  private async tryFallbackStrategy(
    operationName: string,
    category: ErrorCategory,
    context: ErrorContext
  ): Promise<RecoveryResult> {
    try {
      switch (operationName) {
        case 'trackVisitor':
          return await this.fallbackTrackVisitor(context);
          
        case 'recordTouchpoint':
          return await this.fallbackRecordTouchpoint(context);
          
        case 'updateEngagement':
          return await this.fallbackUpdateEngagement(context);
          
        case 'processFormSubmission':
          return await this.fallbackProcessFormSubmission(context);
          
        case 'mobileTracking':
          return await this.fallbackMobileTracking(context);
          
        case 'analytics':
          return await this.fallbackAnalytics(context);
          
        case 'botDetection':
          return await this.fallbackBotDetection(context);
          
        default:
          return await this.genericFallback(operationName, context);
      }
    } catch (fallbackError) {
      logger.warn('Fallback strategy failed', {
        operation: operationName,
        error: fallbackError.message,
        context,
      });
      
      return {
        success: false,
        fallbackUsed: true,
        strategy: RecoveryStrategy.FALLBACK,
        message: `Fallback failed: ${fallbackError.message}`,
      };
    }
  }

  /**
   * Fallback for visitor tracking
   */
  private async fallbackTrackVisitor(context: ErrorContext): Promise<RecoveryResult> {
    // Create minimal visitor record in memory for immediate use
    const fallbackVisitor = {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fingerprint: context.metadata?.fingerprint || 'unknown',
      ipAddress: context.ip || '127.0.0.1',
      userAgent: context.userAgent || 'unknown',
      firstVisit: new Date(),
      lastVisit: new Date(),
      totalVisits: 1,
      engagementScore: 0,
      isActive: true,
      metadata: {
        fallback: true,
        originalError: 'Database unavailable',
        createdAt: new Date().toISOString(),
      },
    };
    
    // Store in memory for short-term use
    const cacheKey = this.generateCacheKey('visitor', context);
    recoveryCache.set(cacheKey, fallbackVisitor);
    
    // Set expiration
    setTimeout(() => {
      recoveryCache.delete(cacheKey);
    }, 300000); // 5 minutes
    
    logger.info('Created fallback visitor', {
      visitorId: fallbackVisitor.id,
      context,
    });
    
    return {
      success: true,
      data: fallbackVisitor,
      fallbackUsed: true,
      strategy: RecoveryStrategy.FALLBACK,
    };
  }

  /**
   * Fallback for touchpoint recording
   */
  private async fallbackRecordTouchpoint(context: ErrorContext): Promise<RecoveryResult> {
    // Store touchpoint data in memory for later processing
    const fallbackTouchpoint = {
      id: `fallback_tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      visitorId: context.visitorId || 'unknown',
      timestamp: new Date(context.timestamp),
      type: context.eventType || 'PAGEVIEW',
      url: context.url || 'unknown',
      metadata: {
        fallback: true,
        originalContext: context,
        queuedAt: new Date().toISOString(),
      },
      value: 1,
    };
    
    // Store for later processing
    const cacheKey = this.generateCacheKey('touchpoint', context);
    recoveryCache.set(cacheKey, fallbackTouchpoint);
    
    logger.info('Created fallback touchpoint', {
      touchpointId: fallbackTouchpoint.id,
      context,
    });
    
    return {
      success: true,
      data: fallbackTouchpoint,
      fallbackUsed: true,
      strategy: RecoveryStrategy.FALLBACK,
    };
  }

  /**
   * Fallback for engagement updates
   */
  private async fallbackUpdateEngagement(context: ErrorContext): Promise<RecoveryResult> {
    // Store engagement update in memory
    const fallbackUpdate = {
      visitorId: context.visitorId,
      engagementType: context.eventType,
      value: context.metadata?.value || 1,
      timestamp: new Date(context.timestamp),
      fallback: true,
    };
    
    const cacheKey = this.generateCacheKey('engagement', context);
    recoveryCache.set(cacheKey, fallbackUpdate);
    
    logger.info('Queued engagement update for fallback processing', {
      visitorId: context.visitorId,
      context,
    });
    
    return {
      success: true,
      data: fallbackUpdate,
      fallbackUsed: true,
      strategy: RecoveryStrategy.FALLBACK,
    };
  }

  /**
   * Fallback for form submission processing
   */
  private async fallbackProcessFormSubmission(context: ErrorContext): Promise<RecoveryResult> {
    // Store form submission for later processing
    const fallbackSubmission = {
      id: `fallback_form_${Date.now()}`,
      formId: context.metadata?.formId,
      formData: context.metadata?.formData,
      visitorId: context.visitorId,
      timestamp: new Date(context.timestamp),
      fallback: true,
      processed: false,
    };
    
    const cacheKey = this.generateCacheKey('form_submission', context);
    recoveryCache.set(cacheKey, fallbackSubmission);
    
    logger.info('Queued form submission for fallback processing', {
      submissionId: fallbackSubmission.id,
      formId: context.metadata?.formId,
      context,
    });
    
    return {
      success: true,
      data: { success: true, fallback: true },
      fallbackUsed: true,
      strategy: RecoveryStrategy.FALLBACK,
    };
  }

  /**
   * Fallback for mobile tracking
   */
  private async fallbackMobileTracking(context: ErrorContext): Promise<RecoveryResult> {
    // Store mobile event for later processing
    const fallbackEvent = {
      id: `fallback_mobile_${Date.now()}`,
      visitorId: context.visitorId,
      eventType: context.eventType,
      appId: context.metadata?.appId,
      screenName: context.metadata?.screenName,
      timestamp: new Date(context.timestamp),
      fallback: true,
    };
    
    const cacheKey = this.generateCacheKey('mobile_event', context);
    recoveryCache.set(cacheKey, fallbackEvent);
    
    logger.info('Queued mobile event for fallback processing', {
      eventId: fallbackEvent.id,
      eventType: context.eventType,
      context,
    });
    
    return {
      success: true,
      data: { success: true, fallback: true },
      fallbackUsed: true,
      strategy: RecoveryStrategy.FALLBACK,
    };
  }

  /**
   * Fallback for analytics
   */
  private async fallbackAnalytics(context: ErrorContext): Promise<RecoveryResult> {
    // Return cached or default analytics data
    const fallbackAnalytics = {
      success: true,
      fallback: true,
      message: 'Analytics temporarily unavailable',
      data: {
        visitors: 0,
        pageviews: 0,
        conversions: 0,
        revenue: 0,
      },
    };
    
    logger.info('Returned fallback analytics data', { context });
    
    return {
      success: true,
      data: fallbackAnalytics,
      fallbackUsed: true,
      strategy: RecoveryStrategy.FALLBACK,
    };
  }

  /**
   * Fallback for bot detection
   */
  private async fallbackBotDetection(context: ErrorContext): Promise<RecoveryResult> {
    // Default to allowing traffic when bot detection fails
    const fallbackResult = {
      confidence: 0, // HUMAN
      score: 0,
      reasons: ['Bot detection unavailable - defaulting to allow'],
      action: 'allow' as const,
      metadata: {
        fallback: true,
        timestamp: new Date().toISOString(),
      },
    };
    
    logger.info('Used fallback bot detection', {
      ip: context.ip,
      userAgent: context.userAgent,
      context,
    });
    
    return {
      success: true,
      data: fallbackResult,
      fallbackUsed: true,
      strategy: RecoveryStrategy.FALLBACK,
    };
  }

  /**
   * Generic fallback for unknown operations
   */
  private async genericFallback(operationName: string, context: ErrorContext): Promise<RecoveryResult> {
    logger.info('Using generic fallback', {
      operation: operationName,
      context,
    });
    
    return {
      success: true,
      data: { success: true, fallback: true, operation: operationName },
      fallbackUsed: true,
      strategy: RecoveryStrategy.FALLBACK,
    };
  }

  /**
   * Queue operation for later retry
   */
  private async queueForRetry(
    operationName: string,
    context: ErrorContext,
    error: Error
  ): Promise<RecoveryResult> {
    const queueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: operationName,
      data: context,
      context,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    errorQueue.push(queueItem);
    
    logger.info('Queued operation for retry', {
      queueId: queueItem.id,
      operation: operationName,
      context,
    });
    
    return {
      success: true,
      data: { queued: true, queueId: queueItem.id },
      fallbackUsed: true,
      strategy: RecoveryStrategy.QUEUE,
    };
  }

  /**
   * Process queued operations
   */
  async processQueuedOperations(): Promise<void> {
    const now = Date.now();
    const itemsToRetry = errorQueue.filter(item => 
      now - item.timestamp > 60000 && // Wait at least 1 minute
      item.retryCount < 3 // Max 3 retries
    );
    
    for (const item of itemsToRetry) {
      try {
        // Remove from queue
        const index = errorQueue.indexOf(item);
        if (index > -1) {
          errorQueue.splice(index, 1);
        }
        
        // Increment retry count
        item.retryCount++;
        
        logger.info('Retrying queued operation', {
          queueId: item.id,
          operation: item.operation,
          retryCount: item.retryCount,
        });
        
        // Retry the operation (implementation depends on operation type)
        await this.retryQueuedOperation(item);
        
      } catch (error) {
        logger.error('Failed to retry queued operation', {
          queueId: item.id,
          operation: item.operation,
          error: error.message,
          retryCount: item.retryCount,
        });
        
        // Requeue if not exceeded max retries
        if (item.retryCount < 3) {
          errorQueue.push(item);
        }
      }
    }
    
    // Clean up old queue items
    const cutoff = now - 3600000; // 1 hour
    const initialLength = errorQueue.length;
    for (let i = errorQueue.length - 1; i >= 0; i--) {
      if (errorQueue[i].timestamp < cutoff) {
        errorQueue.splice(i, 1);
      }
    }
    
    if (errorQueue.length !== initialLength) {
      logger.info('Cleaned up old queue items', {
        removed: initialLength - errorQueue.length,
        remaining: errorQueue.length,
      });
    }
  }

  /**
   * Retry a queued operation
   */
  private async retryQueuedOperation(item: any): Promise<void> {
    // Implementation would depend on the specific operation type
    // This is a placeholder for the actual retry logic
    logger.info('Queued operation retry logic not implemented', {
      operation: item.operation,
      queueId: item.id,
    });
  }

  /**
   * Record error for monitoring and analysis
   */
  private async recordError(
    operationName: string,
    error: Error,
    category: ErrorCategory,
    context: ErrorContext
  ): Promise<void> {
    try {
      // Try to store in database via backend API
      const response = await fetch(`${BACKEND_URL}/api/v2/leadpulse-security-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OPERATION_ERROR',
          severity: this.determineSeverity(category, error),
          description: `${operationName} failed: ${error.message}`,
          ipAddress: context.ip || null,
          userAgent: context.userAgent || null,
          metadata: JSON.stringify({
            operation: operationName,
            category,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            context,
            timestamp: new Date().toISOString(),
          }),
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to record error: ${response.status}`);
      }
    } catch (dbError) {
      // If database is unavailable, log to file/console
      logger.error('Failed to record error in database', {
        originalError: error.message,
        dbError: dbError.message,
        operation: operationName,
        category,
        context,
      });
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(category: ErrorCategory, error: Error): string {
    if (category === ErrorCategory.VALIDATION) {
      return ErrorSeverity.LOW;
    }
    
    if (category === ErrorCategory.CACHE) {
      return ErrorSeverity.MEDIUM;
    }
    
    if (category === ErrorCategory.DATABASE) {
      return ErrorSeverity.HIGH;
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      return ErrorSeverity.HIGH;
    }
    
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Generate cache key for recovery
   */
  private generateCacheKey(operation: string, context: ErrorContext): string {
    const keyParts = [
      'leadpulse_recovery',
      operation,
      context.visitorId || context.ip || 'unknown',
      context.eventType || 'unknown',
    ];
    
    return keyParts.join(':');
  }

  /**
   * Cache successful operation results
   */
  async cacheResult(
    operationName: string,
    context: ErrorContext,
    result: any,
    ttl = 300000 // 5 minutes
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(operationName, context);
      
      // Store in memory cache
      recoveryCache.set(cacheKey, result);
      setTimeout(() => recoveryCache.delete(cacheKey), ttl);
      
      // Store in Redis cache
      await leadPulseCache.set(cacheKey, result, ttl);
      
    } catch (error) {
      logger.warn('Failed to cache result', {
        operation: operationName,
        error: error.message,
        context,
      });
    }
  }

  /**
   * Health check for error boundary system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {
      timestamp: new Date().toISOString(),
      memoryCacheSize: recoveryCache.size,
      errorQueueSize: errorQueue.length,
      uptime: process.uptime(),
    };
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Check memory cache size
    if (recoveryCache.size > 1000) {
      status = 'degraded';
      details.warnings = details.warnings || [];
      details.warnings.push('High memory cache usage');
    }
    
    // Check error queue size
    if (errorQueue.length > 100) {
      status = 'degraded';
      details.warnings = details.warnings || [];
      details.warnings.push('High error queue size');
    }
    
    // Test database connectivity via health endpoint
    try {
      const response = await fetch(`${BACKEND_URL}/health/db`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        details.database = 'connected';
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      status = 'unhealthy';
      details.database = 'disconnected';
      details.errors = details.errors || [];
      details.errors.push('Database connection failed');
    }
    
    // Test cache connectivity
    try {
      await leadPulseCache.set('health_check', 'ok', 1000);
      await leadPulseCache.get('health_check');
      details.cache = 'connected';
    } catch (error) {
      if (status === 'healthy') status = 'degraded';
      details.cache = 'disconnected';
      details.warnings = details.warnings || [];
      details.warnings.push('Cache connection issues');
    }
    
    return { status, details };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    queueSize: number;
    cacheSize: number;
    recentErrors: number;
  } {
    const recentErrors = errorQueue.filter(
      item => Date.now() - item.timestamp < 3600000 // Last hour
    ).length;
    
    return {
      queueSize: errorQueue.length,
      cacheSize: recoveryCache.size,
      recentErrors,
    };
  }
}

// Export singleton instance
export const leadPulseErrorBoundary = new LeadPulseErrorBoundary();

/**
 * Wrapper function for easy error boundary usage
 */
export async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  category: ErrorCategory,
  context: ErrorContext,
  operationName: string
): Promise<T> {
  const result = await leadPulseErrorBoundary.executeWithRecovery(
    operation,
    category,
    context,
    operationName
  );
  
  if (!result.success) {
    throw new Error(result.message || 'Operation failed with error boundary');
  }
  
  return result.data;
}

/**
 * Initialize error boundary system
 */
export function initializeErrorBoundary(): void {
  // Set up periodic queue processing
  setInterval(() => {
    leadPulseErrorBoundary.processQueuedOperations().catch(error => {
      logger.error('Error processing queued operations', { error });
    });
  }, 60000); // Every minute
  
  // Set up health monitoring
  setInterval(() => {
    leadPulseErrorBoundary.healthCheck().then(health => {
      if (health.status !== 'healthy') {
        logger.warn('Error boundary health check', health);
      }
    }).catch(error => {
      logger.error('Error boundary health check failed', { error });
    });
  }, 300000); // Every 5 minutes
  
  logger.info('LeadPulse error boundary system initialized');
}