// Retry utilities for API calls

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return true;
    }
    
    if (error.statusCode) {
      // Don't retry on client errors (4xx) except for auth issues
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return error.statusCode === 401 || error.statusCode === 429; // Auth or rate limit
      }
      // Retry on server errors (5xx)
      return error.statusCode >= 500;
    }
    
    return true; // Retry on unknown errors
  },
};

export class RetryManager {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  async execute<T>(
    operation: () => Promise<T>,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const opts = { ...this.options, ...customOptions };
    let lastError: any;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry if condition doesn't match
        if (opts.retryCondition && !opts.retryCondition(error)) {
          throw error;
        }

        // Don't wait on the last attempt
        if (attempt === opts.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        let delay = Math.min(
          opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
          opts.maxDelay
        );

        // Add jitter to prevent thundering herd
        if (opts.jitter) {
          delay += Math.random() * delay * 0.1;
        }

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Update retry options
  updateOptions(options: Partial<RetryOptions>): void {
    this.options = { ...this.options, ...options };
  }

  // Get current options
  getOptions(): RetryOptions {
    return { ...this.options };
  }
}

// Circuit breaker for preventing cascading failures
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private resetTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

// Rate limiter to prevent hitting API limits
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens = 100,
    private refillRate = 10, // tokens per second
    private interval = 1000 // refill interval in ms
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(tokensNeeded = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded;
      return;
    }

    // Wait for tokens to become available
    const waitTime = ((tokensNeeded - this.tokens) / this.refillRate) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    this.refill();
    this.tokens -= tokensNeeded;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.interval) * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}