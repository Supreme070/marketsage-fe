// Main API client that combines all services

import { BaseApiClient } from './base/api-client';
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';
import { ContactsService } from './services/contacts.service';
import { CampaignsService } from './services/campaigns.service';
import { AIService } from './services/ai.service';
import { CommunicationsService } from './services/communications.service';
import { NotificationsService } from './services/notifications.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { WorkflowsService } from './services/workflows.service';
import { LeadPulseService } from './services/leadpulse.service';
import { EmailService } from './services/email.service';
import { RetryManager, CircuitBreaker, RateLimiter } from './utils/retry';
import { CacheManager, globalCache } from './utils/cache';

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  cache?: {
    enabled: boolean;
    ttl?: number;
    maxSize?: number;
  };
  rateLimit?: {
    enabled: boolean;
    maxTokens?: number;
    refillRate?: number;
  };
  circuitBreaker?: {
    enabled: boolean;
    threshold?: number;
    timeout?: number;
  };
}

export class MarketSageApiClient extends BaseApiClient {
  // Service instances
  public readonly auth: AuthService;
  public readonly users: UsersService;
  public readonly contacts: ContactsService;
  public readonly campaigns: CampaignsService;
  public readonly ai: AIService;
  public readonly communications: CommunicationsService;
  public readonly notifications: NotificationsService;
  public readonly subscriptions: SubscriptionsService;
  public readonly workflows: WorkflowsService;
  public readonly leadpulse: LeadPulseService;
  public readonly email: EmailService;

  // Utility instances
  private retryManager: RetryManager;
  private circuitBreaker?: CircuitBreaker;
  private rateLimiter?: RateLimiter;
  private cacheManager: CacheManager;

  constructor(config: ApiClientConfig = {}) {
    super(config.baseUrl);

    // Initialize services
    this.auth = new AuthService(config.baseUrl);
    this.users = new UsersService(config.baseUrl);
    this.contacts = new ContactsService(config.baseUrl);
    this.campaigns = new CampaignsService(config.baseUrl);
    this.ai = new AIService(config.baseUrl);
    this.communications = new CommunicationsService(config.baseUrl);
    this.notifications = new NotificationsService(config.baseUrl);
    this.subscriptions = new SubscriptionsService(config.baseUrl);
    this.workflows = new WorkflowsService(config.baseUrl);
    this.leadpulse = new LeadPulseService(config.baseUrl);
    this.email = new EmailService(config.baseUrl);

    // Initialize utilities
    this.retryManager = new RetryManager({
      maxRetries: config.retries || 3,
    });

    if (config.circuitBreaker?.enabled) {
      this.circuitBreaker = new CircuitBreaker(
        config.circuitBreaker.threshold,
        config.circuitBreaker.timeout
      );
    }

    if (config.rateLimit?.enabled) {
      this.rateLimiter = new RateLimiter(
        config.rateLimit.maxTokens,
        config.rateLimit.refillRate
      );
    }

    this.cacheManager = config.cache?.enabled ? 
      new CacheManager({
        ttl: config.cache.ttl,
        maxSize: config.cache.maxSize,
      }) : 
      globalCache;
  }

  /**
   * Execute API call with retry, circuit breaker, and rate limiting
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: {
      skipCache?: boolean;
      cacheKey?: string;
      cacheTtl?: number;
    }
  ): Promise<T> {
    // Check rate limit
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    // Check cache first
    if (!options?.skipCache && options?.cacheKey) {
      const cached = this.cacheManager.getCache('api').get(options.cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Execute with circuit breaker and retry
    const execute = async () => {
      if (this.circuitBreaker) {
        return this.circuitBreaker.execute(operation);
      }
      return operation();
    };

    const result = await this.retryManager.execute(execute);

    // Cache result
    if (!options?.skipCache && options?.cacheKey) {
      this.cacheManager.getCache('api').set(
        options.cacheKey,
        result,
        options.cacheTtl
      );
    }

    return result;
  }

  /**
   * Batch multiple API calls
   */
  async batch<T>(
    operations: Array<{
      operation: () => Promise<T>;
      key?: string;
    }>,
    options?: {
      concurrency?: number;
      failFast?: boolean;
    }
  ): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
    const concurrency = options?.concurrency || 5;
    const results: Array<{ success: boolean; data?: T; error?: Error }> = [];

    const executeChunk = async (chunk: typeof operations) => {
      const promises = chunk.map(async (op, index) => {
        try {
          const data = await this.executeWithRetry(op.operation);
          return { success: true, data };
        } catch (error) {
          if (options?.failFast) {
            throw error;
          }
          return { success: false, error: error as Error };
        }
      });

      return Promise.all(promises);
    };

    // Process operations in chunks
    for (let i = 0; i < operations.length; i += concurrency) {
      const chunk = operations.slice(i, i + concurrency);
      const chunkResults = await executeChunk(chunk);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Stream API responses (useful for real-time data)
   */
  async stream<T>(
    endpoint: string,
    onData: (data: T) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<() => void> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onData(data);
      } catch (error) {
        if (onError) {
          onError(new Error('Failed to parse stream data'));
        }
      }
    };

    eventSource.onerror = (event) => {
      if (onError) {
        onError(new Error('Stream connection error'));
      }
    };

    eventSource.addEventListener('complete', () => {
      eventSource.close();
      if (onComplete) {
        onComplete();
      }
    });

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  /**
   * Get API client status
   */
  async getStatus(): Promise<{
    healthy: boolean;
    services: {
      [key: string]: boolean;
    };
    cache: {
      enabled: boolean;
      stats: any;
    };
    rateLimit: {
      enabled: boolean;
      availableTokens?: number;
    };
    circuitBreaker: {
      enabled: boolean;
      state?: string;
      failures?: number;
    };
  }> {
    try {
      const healthCheck = await this.healthCheck();
      
      return {
        healthy: true,
        services: {
          auth: true,
          users: true,
          contacts: true,
          campaigns: true,
          ai: true,
          communications: true,
          notifications: true,
          subscriptions: true,
          workflows: true,
          leadpulse: true,
          email: true,
        },
        cache: {
          enabled: true,
          stats: this.cacheManager.getGlobalStats(),
        },
        rateLimit: {
          enabled: !!this.rateLimiter,
          availableTokens: this.rateLimiter?.getAvailableTokens(),
        },
        circuitBreaker: {
          enabled: !!this.circuitBreaker,
          state: this.circuitBreaker?.getState(),
          failures: this.circuitBreaker?.getFailures(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        services: {
          auth: false,
          users: false,
          contacts: false,
          campaigns: false,
          ai: false,
          communications: false,
          notifications: false,
          subscriptions: false,
          workflows: false,
          leadpulse: false,
        },
        cache: {
          enabled: true,
          stats: this.cacheManager.getGlobalStats(),
        },
        rateLimit: {
          enabled: !!this.rateLimiter,
          availableTokens: this.rateLimiter?.getAvailableTokens(),
        },
        circuitBreaker: {
          enabled: !!this.circuitBreaker,
          state: this.circuitBreaker?.getState(),
          failures: this.circuitBreaker?.getFailures(),
        },
      };
    }
  }

  /**
   * Clear all caches
   */
  clearCache(namespace?: string): void {
    if (namespace) {
      this.cacheManager.clearNamespace(namespace);
    } else {
      this.cacheManager.clearAll();
    }
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): number {
    return this.cacheManager.cleanupAll();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    if (config.baseUrl) {
      this.setBaseUrl(config.baseUrl);
      this.auth.setBaseUrl(config.baseUrl);
      this.users.setBaseUrl(config.baseUrl);
      this.contacts.setBaseUrl(config.baseUrl);
      this.campaigns.setBaseUrl(config.baseUrl);
      this.ai.setBaseUrl(config.baseUrl);
      this.communications.setBaseUrl(config.baseUrl);
      this.notifications.setBaseUrl(config.baseUrl);
      this.subscriptions.setBaseUrl(config.baseUrl);
      this.workflows.setBaseUrl(config.baseUrl);
      this.leadpulse.setBaseUrl(config.baseUrl);
      this.email.setBaseUrl(config.baseUrl);
    }

    if (config.retries !== undefined) {
      this.retryManager.updateOptions({ maxRetries: config.retries });
    }
  }
}

// Default client instance
export const apiClient = new MarketSageApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2',
  timeout: 30000,
  retries: 3,
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 200,
  },
  rateLimit: {
    enabled: true,
    maxTokens: 100,
    refillRate: 10,
  },
  circuitBreaker: {
    enabled: true,
    threshold: 5,
    timeout: 60000,
  },
});

// Export types and utilities
export * from './types';
export * from './base/api-client';
export * from './services/auth.service';
export * from './services/users.service';
export * from './services/contacts.service';
export * from './services/campaigns.service';
export * from './services/ai.service';
export * from './services/communications.service';
export * from './services/notifications.service';
export * from './services/subscriptions.service';
export * from './utils/retry';
export * from './utils/cache';