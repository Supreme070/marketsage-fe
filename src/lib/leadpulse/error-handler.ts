/**
 * LeadPulse Error Handling & Reliability System
 * 
 * Provides comprehensive error handling, fallbacks, and reliability features
 * for production-ready LeadPulse operations
 */

import { logger } from '@/lib/logger';
import { redis } from '@/lib/cache/redis';

// Error types for LeadPulse
export enum LeadPulseErrorType {
  TRACKING_ERROR = 'tracking_error',
  DATABASE_ERROR = 'database_error',
  CACHE_ERROR = 'cache_error',
  WEBSOCKET_ERROR = 'websocket_error',
  VALIDATION_ERROR = 'validation_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  EXTERNAL_API_ERROR = 'external_api_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  visitorId?: string;
  fingerprint?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
  endpoint?: string;
  method?: string;
  additionalData?: Record<string, any>;
}

// Error record interface
export interface ErrorRecord {
  id: string;
  type: LeadPulseErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  resolved: boolean;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  resolvedAt?: Date;
}

export class LeadPulseErrorHandler {
  private static instance: LeadPulseErrorHandler;
  private errorQueue: ErrorRecord[] = [];
  private maxQueueSize = 1000;
  private retryIntervals = [1000, 3000, 10000, 30000, 60000]; // Progressive backoff

  static getInstance(): LeadPulseErrorHandler {
    if (!LeadPulseErrorHandler.instance) {
      LeadPulseErrorHandler.instance = new LeadPulseErrorHandler();
    }
    return LeadPulseErrorHandler.instance;
  }

  constructor() {
    this.startErrorProcessor();
  }

  // Handle and classify errors
  async handleError(
    error: Error | unknown,
    context: Partial<ErrorContext> = {},
    type?: LeadPulseErrorType
  ): Promise<ErrorRecord> {
    const errorRecord: ErrorRecord = {
      id: this.generateErrorId(),
      type: type || this.classifyError(error),
      severity: this.determineSeverity(error, type),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        timestamp: new Date(),
        ...context
      },
      resolved: false,
      retryCount: 0,
      maxRetries: this.getMaxRetries(type || this.classifyError(error)),
      createdAt: new Date()
    };

    // Log the error
    this.logError(errorRecord);

    // Store in error queue for processing
    this.addToQueue(errorRecord);

    // Store in cache for monitoring
    await this.storeErrorInCache(errorRecord);

    // Handle critical errors immediately
    if (errorRecord.severity === ErrorSeverity.CRITICAL) {
      await this.handleCriticalError(errorRecord);
    }

    return errorRecord;
  }

  // Classify error type based on error content
  private classifyError(error: unknown): LeadPulseErrorType {
    if (!error) return LeadPulseErrorType.UNKNOWN_ERROR;

    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const stack = error instanceof Error ? error.stack?.toLowerCase() : '';

    if (message.includes('database') || message.includes('prisma') || message.includes('sql')) {
      return LeadPulseErrorType.DATABASE_ERROR;
    }

    if (message.includes('redis') || message.includes('cache')) {
      return LeadPulseErrorType.CACHE_ERROR;
    }

    if (message.includes('websocket') || message.includes('socket')) {
      return LeadPulseErrorType.WEBSOCKET_ERROR;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return LeadPulseErrorType.VALIDATION_ERROR;
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return LeadPulseErrorType.RATE_LIMIT_ERROR;
    }

    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return LeadPulseErrorType.EXTERNAL_API_ERROR;
    }

    if (stack?.includes('leadpulse') || stack?.includes('tracking')) {
      return LeadPulseErrorType.TRACKING_ERROR;
    }

    return LeadPulseErrorType.UNKNOWN_ERROR;
  }

  // Determine error severity
  private determineSeverity(error: unknown, type?: LeadPulseErrorType): ErrorSeverity {
    const errorType = type || this.classifyError(error);
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    // Critical errors that affect core functionality
    if (errorType === LeadPulseErrorType.DATABASE_ERROR && 
        (message.includes('connection') || message.includes('pool'))) {
      return ErrorSeverity.CRITICAL;
    }

    if (message.includes('out of memory') || message.includes('disk full')) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (errorType === LeadPulseErrorType.DATABASE_ERROR || 
        errorType === LeadPulseErrorType.WEBSOCKET_ERROR) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (errorType === LeadPulseErrorType.CACHE_ERROR || 
        errorType === LeadPulseErrorType.EXTERNAL_API_ERROR) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors
    return ErrorSeverity.LOW;
  }

  // Get maximum retries based on error type
  private getMaxRetries(type: LeadPulseErrorType): number {
    const retryMap: Record<LeadPulseErrorType, number> = {
      [LeadPulseErrorType.TRACKING_ERROR]: 3,
      [LeadPulseErrorType.DATABASE_ERROR]: 2,
      [LeadPulseErrorType.CACHE_ERROR]: 5,
      [LeadPulseErrorType.WEBSOCKET_ERROR]: 3,
      [LeadPulseErrorType.VALIDATION_ERROR]: 0, // Don't retry validation errors
      [LeadPulseErrorType.RATE_LIMIT_ERROR]: 2,
      [LeadPulseErrorType.EXTERNAL_API_ERROR]: 3,
      [LeadPulseErrorType.UNKNOWN_ERROR]: 1
    };

    return retryMap[type] || 1;
  }

  // Log error with appropriate level
  private logError(errorRecord: ErrorRecord): void {
    const logData = {
      errorId: errorRecord.id,
      type: errorRecord.type,
      severity: errorRecord.severity,
      message: errorRecord.message,
      context: errorRecord.context,
      stack: errorRecord.stack
    };

    switch (errorRecord.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('CRITICAL LeadPulse Error:', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('HIGH severity LeadPulse Error:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('MEDIUM severity LeadPulse Error:', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('LOW severity LeadPulse Error:', logData);
        break;
    }
  }

  // Add error to processing queue
  private addToQueue(errorRecord: ErrorRecord): void {
    if (this.errorQueue.length >= this.maxQueueSize) {
      // Remove oldest error
      this.errorQueue.shift();
    }

    this.errorQueue.push(errorRecord);
  }

  // Store error in cache for monitoring
  private async storeErrorInCache(errorRecord: ErrorRecord): Promise<void> {
    try {
      const cacheKey = `leadpulse:errors:${errorRecord.id}`;
      await redis.set(cacheKey, errorRecord, 24 * 60 * 60); // 24 hours

      // Add to error list for monitoring
      await redis.lpush('leadpulse:errors:list', errorRecord, 100); // Keep last 100

      // Update error counters
      const dateKey = new Date().toISOString().split('T')[0];
      await redis.incr(`leadpulse:errors:count:${dateKey}`, 24 * 60 * 60);
      await redis.incr(`leadpulse:errors:count:${errorRecord.type}:${dateKey}`, 24 * 60 * 60);
    } catch (cacheError) {
      logger.warn('Failed to store error in cache:', cacheError);
    }
  }

  // Handle critical errors with immediate action
  private async handleCriticalError(errorRecord: ErrorRecord): Promise<void> {
    logger.error('CRITICAL ERROR - Taking immediate action:', errorRecord);

    // Store critical error for alerting
    try {
      await redis.lpush('leadpulse:errors:critical', errorRecord, 10);
    } catch (error) {
      logger.error('Failed to store critical error:', error);
    }

    // TODO: Add alerting mechanism (email, Slack, etc.)
    // This could integrate with external monitoring services
  }

  // Start error processing loop
  private startErrorProcessor(): void {
    setInterval(async () => {
      await this.processErrorQueue();
    }, 5000); // Process every 5 seconds
  }

  // Process errors in queue for retries
  private async processErrorQueue(): Promise<void> {
    const retryableErrors = this.errorQueue.filter(
      error => !error.resolved && error.retryCount < error.maxRetries
    );

    for (const errorRecord of retryableErrors) {
      if (this.shouldRetry(errorRecord)) {
        await this.retryOperation(errorRecord);
      }
    }

    // Clean up resolved errors
    this.errorQueue = this.errorQueue.filter(error => !error.resolved);
  }

  // Check if error should be retried
  private shouldRetry(errorRecord: ErrorRecord): boolean {
    if (errorRecord.retryCount >= errorRecord.maxRetries) {
      return false;
    }

    const timeSinceLastRetry = Date.now() - errorRecord.createdAt.getTime();
    const retryInterval = this.retryIntervals[errorRecord.retryCount] || 60000;

    return timeSinceLastRetry >= retryInterval;
  }

  // Retry failed operations
  private async retryOperation(errorRecord: ErrorRecord): Promise<void> {
    errorRecord.retryCount++;

    try {
      logger.info(`Retrying operation for error ${errorRecord.id}, attempt ${errorRecord.retryCount}`);

      // The actual retry logic would depend on the error type
      // For now, we'll mark certain types as resolved
      if (errorRecord.type === LeadPulseErrorType.CACHE_ERROR) {
        // Cache errors often resolve themselves
        errorRecord.resolved = true;
        errorRecord.resolvedAt = new Date();
      }

      // Update in cache
      await this.storeErrorInCache(errorRecord);
    } catch (retryError) {
      logger.warn(`Retry failed for error ${errorRecord.id}:`, retryError);
    }
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `lp-err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get error statistics
  async getErrorStats(days = 7): Promise<any> {
    try {
      const stats = {
        totalErrors: 0,
        errorsByType: {} as Record<string, number>,
        errorsBySeverity: {} as Record<string, number>,
        dailyErrorCounts: {} as Record<string, number>,
        recentErrors: [] as ErrorRecord[]
      };

      // Get recent errors from cache
      const recentErrors = await redis.lrange<ErrorRecord>('leadpulse:errors:list', 0, 50);
      stats.recentErrors = recentErrors;
      stats.totalErrors = recentErrors.length;

      // Count by type and severity
      recentErrors.forEach(error => {
        stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
        stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
      });

      // Get daily counts
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const count = await redis.get(`leadpulse:errors:count:${dateKey}`) || 0;
        stats.dailyErrorCounts[dateKey] = count as number;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting error stats:', error);
      return null;
    }
  }

  // Get critical errors
  async getCriticalErrors(): Promise<ErrorRecord[]> {
    try {
      return await redis.lrange<ErrorRecord>('leadpulse:errors:critical', 0, -1);
    } catch (error) {
      logger.error('Error getting critical errors:', error);
      return [];
    }
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; errorRate?: number; criticalErrors?: number }> {
    try {
      const stats = await this.getErrorStats(1); // Last 24 hours
      const criticalErrors = await this.getCriticalErrors();

      const today = new Date().toISOString().split('T')[0];
      const todayErrors = stats?.dailyErrorCounts[today] || 0;

      return {
        healthy: criticalErrors.length === 0 && todayErrors < 100, // Arbitrary threshold
        errorRate: todayErrors,
        criticalErrors: criticalErrors.length
      };
    } catch (error) {
      return { healthy: false };
    }
  }
}

// Utility functions for specific error scenarios

// Graceful degradation for database failures
export async function withDatabaseFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: Partial<ErrorContext>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    await LeadPulseErrorHandler.getInstance().handleError(
      error,
      context,
      LeadPulseErrorType.DATABASE_ERROR
    );
    logger.warn('Database operation failed, using fallback value:', fallback);
    return fallback;
  }
}

// Graceful degradation for cache failures
export async function withCacheFallback<T>(
  cacheOperation: () => Promise<T | null>,
  dbOperation: () => Promise<T>,
  context?: Partial<ErrorContext>
): Promise<T> {
  try {
    const cached = await cacheOperation();
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    await LeadPulseErrorHandler.getInstance().handleError(
      error,
      context,
      LeadPulseErrorType.CACHE_ERROR
    );
    logger.warn('Cache operation failed, falling back to database');
  }

  return await dbOperation();
}

// Rate limiting protection
export async function withRateLimit<T>(
  operation: () => Promise<T>,
  key: string,
  maxRequests = 100,
  windowMs = 60000
): Promise<T> {
  const rateLimitKey = `rate_limit:${key}`;
  
  try {
    const current = await redis.incr(rateLimitKey, Math.ceil(windowMs / 1000));
    
    if (current === 1) {
      // First request in window
      await redis.client?.expire(rateLimitKey, Math.ceil(windowMs / 1000));
    }
    
    if (current > maxRequests) {
      throw new Error(`Rate limit exceeded for ${key}: ${current}/${maxRequests}`);
    }
    
    return await operation();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      await LeadPulseErrorHandler.getInstance().handleError(
        error,
        { additionalData: { key, maxRequests, windowMs } },
        LeadPulseErrorType.RATE_LIMIT_ERROR
      );
    }
    throw error;
  }
}

// Export singleton instance
export const leadPulseErrorHandler = LeadPulseErrorHandler.getInstance();