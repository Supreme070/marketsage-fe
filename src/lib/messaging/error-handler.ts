/**
 * Comprehensive error handling for messaging providers
 * Handles retries, circuit breakers, and fallback mechanisms
 */

import { logger } from '@/lib/logger';

export interface ErrorHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  fallbackEnabled: boolean;
}

export interface RetryableError {
  isRetryable: boolean;
  retryAfter?: number;
  shouldFallback: boolean;
}

export class MessagingErrorHandler {
  private config: ErrorHandlerConfig;
  private circuitBreakerStates: Map<string, CircuitBreakerState> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 30000,
      fallbackEnabled: config.fallbackEnabled ?? true,
    };
  }

  /**
   * Determine if an error is retryable and get retry strategy
   */
  analyzeError(error: any, provider: string): RetryableError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || error?.status || 'UNKNOWN';

    // Network errors - usually retryable
    if (this.isNetworkError(error)) {
      return {
        isRetryable: true,
        retryAfter: this.calculateRetryDelay(provider),
        shouldFallback: false
      };
    }

    // Rate limiting - retryable with delay
    if (this.isRateLimitError(error)) {
      const retryAfter = this.extractRetryAfterHeader(error) || 60000; // Default 1 minute
      return {
        isRetryable: true,
        retryAfter,
        shouldFallback: false
      };
    }

    // Authentication errors - not retryable, should fallback
    if (this.isAuthError(error)) {
      return {
        isRetryable: false,
        shouldFallback: true
      };
    }

    // Provider-specific error handling
    return this.analyzeProviderSpecificError(error, provider);
  }

  /**
   * Execute operation with retry logic and circuit breaker
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    provider: string
  ): Promise<T> {
    const circuitState = this.getCircuitBreakerState(provider);
    
    // Check circuit breaker
    if (circuitState.state === 'OPEN') {
      if (Date.now() - circuitState.lastFailureTime < this.config.circuitBreakerTimeout) {
        throw new Error(`Circuit breaker is OPEN for provider ${provider}`);
      } else {
        // Try to close circuit breaker
        circuitState.state = 'HALF_OPEN';
        circuitState.failureCount = 0;
      }
    }

    let lastError: any;
    const maxAttempts = this.config.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Success - reset circuit breaker
        this.resetCircuitBreaker(provider);
        this.retryAttempts.delete(operationId);
        
        return result;

      } catch (error) {
        lastError = error;
        
        // Update circuit breaker
        this.recordFailure(provider);
        
        const errorAnalysis = this.analyzeError(error, provider);
        
        logger.warn(`Operation ${operationId} failed (attempt ${attempt}/${maxAttempts})`, {
          provider,
          error: error.message,
          isRetryable: errorAnalysis.isRetryable,
          shouldFallback: errorAnalysis.shouldFallback
        });

        // If this is the last attempt or error is not retryable, throw
        if (attempt === maxAttempts || !errorAnalysis.isRetryable) {
          break;
        }

        // Wait before retry
        await this.delay(errorAnalysis.retryAfter || this.calculateRetryDelay(provider, attempt));
      }
    }

    // All retries failed
    this.retryAttempts.delete(operationId);
    throw lastError;
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: any): boolean {
    const networkErrorCodes = [
      'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET',
      'ENETDOWN', 'ENETUNREACH', 'EHOSTDOWN', 'EHOSTUNREACH'
    ];
    
    const networkErrorMessages = [
      'network', 'timeout', 'connection', 'socket', 'dns'
    ];

    const errorCode = error?.code?.toUpperCase();
    const errorMessage = error?.message?.toLowerCase() || '';

    return networkErrorCodes.includes(errorCode) ||
           networkErrorMessages.some(msg => errorMessage.includes(msg)) ||
           (error?.status >= 500 && error?.status < 600);
  }

  /**
   * Check if error is a rate limiting error
   */
  private isRateLimitError(error: any): boolean {
    const rateLimitCodes = [429, 'TOO_MANY_REQUESTS', 'RATE_LIMIT_EXCEEDED'];
    const rateLimitMessages = ['rate limit', 'too many requests', 'quota exceeded'];

    const errorCode = error?.code || error?.status;
    const errorMessage = error?.message?.toLowerCase() || '';

    return rateLimitCodes.includes(errorCode) ||
           rateLimitMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Check if error is an authentication error
   */
  private isAuthError(error: any): boolean {
    const authCodes = [401, 403, 'UNAUTHORIZED', 'FORBIDDEN', 'INVALID_CREDENTIALS'];
    const authMessages = ['unauthorized', 'forbidden', 'invalid credentials', 'authentication'];

    const errorCode = error?.code || error?.status;
    const errorMessage = error?.message?.toLowerCase() || '';

    return authCodes.includes(errorCode) ||
           authMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Provider-specific error analysis
   */
  private analyzeProviderSpecificError(error: any, provider: string): RetryableError {
    switch (provider.toLowerCase()) {
      case 'twilio':
        return this.analyzeTwilioError(error);
      case 'sendgrid':
        return this.analyzeSendGridError(error);
      case 'mailgun':
        return this.analyzeMailgunError(error);
      case 'africastalking':
        return this.analyzeAfricasTalkingError(error);
      case 'termii':
        return this.analyzeTermiiError(error);
      case 'postmark':
        return this.analyzePostmarkError(error);
      default:
        return {
          isRetryable: false,
          shouldFallback: true
        };
    }
  }

  private analyzeTwilioError(error: any): RetryableError {
    const errorCode = error?.code;
    
    // Twilio specific error codes
    const retryableCodes = [20429, 30001, 30002, 30003, 30004, 30005];
    const fallbackCodes = [20003, 20404, 21211, 21212, 21408];

    if (retryableCodes.includes(errorCode)) {
      return { isRetryable: true, shouldFallback: false };
    }
    
    if (fallbackCodes.includes(errorCode)) {
      return { isRetryable: false, shouldFallback: true };
    }

    return { isRetryable: false, shouldFallback: false };
  }

  private analyzeSendGridError(error: any): RetryableError {
    const statusCode = error?.status || error?.response?.status;
    
    if (statusCode === 429) {
      return { isRetryable: true, shouldFallback: false };
    }
    
    if (statusCode === 401 || statusCode === 403) {
      return { isRetryable: false, shouldFallback: true };
    }

    if (statusCode >= 500) {
      return { isRetryable: true, shouldFallback: false };
    }

    return { isRetryable: false, shouldFallback: false };
  }

  private analyzeMailgunError(error: any): RetryableError {
    const statusCode = error?.status;
    
    if (statusCode === 429 || statusCode >= 500) {
      return { isRetryable: true, shouldFallback: false };
    }
    
    if (statusCode === 401 || statusCode === 403) {
      return { isRetryable: false, shouldFallback: true };
    }

    return { isRetryable: false, shouldFallback: false };
  }

  private analyzeAfricasTalkingError(error: any): RetryableError {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('insufficient balance')) {
      return { isRetryable: false, shouldFallback: true };
    }
    
    if (message.includes('rate limit') || message.includes('too many')) {
      return { isRetryable: true, shouldFallback: false };
    }

    return { isRetryable: false, shouldFallback: false };
  }

  private analyzeTermiiError(error: any): RetryableError {
    const code = error?.code?.toLowerCase();
    
    if (code === 'insufficient_balance') {
      return { isRetryable: false, shouldFallback: true };
    }
    
    if (code === 'rate_limit_exceeded') {
      return { isRetryable: true, shouldFallback: false };
    }

    return { isRetryable: false, shouldFallback: false };
  }

  private analyzePostmarkError(error: any): RetryableError {
    const errorCode = error?.ErrorCode;
    
    // Postmark specific error codes
    if (errorCode === 429 || errorCode >= 500) {
      return { isRetryable: true, shouldFallback: false };
    }
    
    if (errorCode === 10 || errorCode === 300) { // Invalid API token
      return { isRetryable: false, shouldFallback: true };
    }

    return { isRetryable: false, shouldFallback: false };
  }

  /**
   * Extract retry-after header from error response
   */
  private extractRetryAfterHeader(error: any): number | null {
    const retryAfter = error?.response?.headers?.['retry-after'] || 
                      error?.headers?.['retry-after'];
    
    if (retryAfter) {
      const seconds = Number.parseInt(retryAfter, 10);
      return isNaN(seconds) ? null : seconds * 1000;
    }
    
    return null;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(provider: string, attempt = 1): number {
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Get circuit breaker state for provider
   */
  private getCircuitBreakerState(provider: string): CircuitBreakerState {
    if (!this.circuitBreakerStates.has(provider)) {
      this.circuitBreakerStates.set(provider, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0
      });
    }
    
    return this.circuitBreakerStates.get(provider)!;
  }

  /**
   * Record failure for circuit breaker
   */
  private recordFailure(provider: string): void {
    const state = this.getCircuitBreakerState(provider);
    state.failureCount++;
    state.lastFailureTime = Date.now();
    state.successCount = 0;

    if (state.failureCount >= this.config.circuitBreakerThreshold) {
      state.state = 'OPEN';
      logger.warn(`Circuit breaker opened for provider: ${provider}`);
    }
  }

  /**
   * Reset circuit breaker on success
   */
  private resetCircuitBreaker(provider: string): void {
    const state = this.getCircuitBreakerState(provider);
    
    if (state.state === 'HALF_OPEN') {
      state.successCount++;
      if (state.successCount >= 2) { // Require 2 successes to close
        state.state = 'CLOSED';
        state.failureCount = 0;
        logger.info(`Circuit breaker closed for provider: ${provider}`);
      }
    } else if (state.state === 'CLOSED') {
      state.failureCount = 0;
    }
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get provider health status
   */
  getProviderHealth(provider: string): {
    isHealthy: boolean;
    circuitState: string;
    failureCount: number;
    lastFailureTime: number;
  } {
    const state = this.getCircuitBreakerState(provider);
    
    return {
      isHealthy: state.state === 'CLOSED',
      circuitState: state.state,
      failureCount: state.failureCount,
      lastFailureTime: state.lastFailureTime
    };
  }

  /**
   * Manually reset circuit breaker
   */
  resetProviderCircuit(provider: string): void {
    this.circuitBreakerStates.set(provider, {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0
    });
    
    logger.info(`Circuit breaker manually reset for provider: ${provider}`);
  }
}

interface CircuitBreakerState {
  state: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

// Export singleton instance
export const messagingErrorHandler = new MessagingErrorHandler();