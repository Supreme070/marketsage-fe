/**
 * Unified MarketSage API Client
 * Single client for all API calls with automatic authentication handling
 * Enhanced with monitoring and performance tracking
 */

import { getSession } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import * as Sentry from '@sentry/nextjs';

// Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: any) => boolean;
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class MarketSageApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private isServer: boolean;

  constructor(baseUrl?: string) {
    // Use frontend proxy to NestJS backend
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2';
    this.defaultTimeout = 30000; // 30 seconds
    this.defaultRetries = 3;
    this.defaultRetryDelay = 1000; // 1 second
    this.isServer = typeof window === 'undefined';
  }

  /**
   * Get authentication token from session
   * Works for both client-side and server-side
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      if (this.isServer) {
        // Server-side: Get token from server session
        const session = await getServerSession(authOptions);
        console.log('🔐 ApiClient (Server): Getting auth token from session:', session ? 'Session found' : 'No session');
        
        if (!session?.accessToken) {
          console.warn('🔐 ApiClient (Server): No accessToken in session');
          return null;
        }
        
        console.log('🔐 ApiClient (Server): Found accessToken:', session.accessToken.substring(0, 20) + '...');
        return session.accessToken;
      } else {
        // Client-side: Get session token
        const session = await getSession();
        console.log('🔐 ApiClient (Client): Getting auth token from session:', session ? 'Session found' : 'No session');
        
        if (!session) {
          console.warn('🔐 ApiClient (Client): No session found');
          return null;
        }
        
        if (!session.accessToken) {
          console.warn('🔐 ApiClient (Client): No accessToken in session:', session);
          return null;
        }
        
        console.log('🔐 ApiClient (Client): Found accessToken:', session.accessToken.substring(0, 20) + '...');
        return session.accessToken;
      }
    } catch (error) {
      console.warn('🔐 ApiClient: Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Make authenticated HTTP request with retry logic and performance monitoring
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = config.timeout || this.defaultTimeout;
    const retries = config.retries || this.defaultRetries;
    const retryDelay = config.retryDelay || this.defaultRetryDelay;
    const method = options.method || 'GET';

    // Performance tracking - START
    const startTime = performance.now();
    let statusCode: number | undefined;
    let responseSize = 0;
    let success = false;

    // Sentry transaction for performance monitoring
    const transaction = Sentry.startTransaction({
      op: 'http.client',
      name: `${method} ${endpoint}`,
      tags: {
        'http.method': method,
        'http.url': endpoint,
      },
    });

    let lastError: any;

    try {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const token = await this.getAuthToken();

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...config.headers,
          };

          if (token) {
            headers.Authorization = `Bearer ${token}`;
            console.log('🔐 ApiClient: Adding Authorization header for request to:', url);
          } else {
            console.warn('🔐 ApiClient: No token available for request to:', url);
          }

          // Add Sentry breadcrumb
          Sentry.addBreadcrumb({
            category: 'http',
            message: `${method} ${endpoint}`,
            level: 'info',
            data: {
              url,
              method,
              attempt: attempt + 1,
            },
          });

          const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          statusCode = response.status;

          // Track response size
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            responseSize = parseInt(contentLength, 10);
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('🔐 ApiClient: Request failed:', {
              url,
              status: response.status,
              statusText: response.statusText,
              errorData,
              hasToken: !!token
            });

            throw new ApiClientError(
              errorData.message || `HTTP ${response.status}: ${response.statusText}`,
              errorData.code || 'HTTP_ERROR',
              response.status,
              errorData
            );
          }

          const data = await response.json();

          // Handle API response format
          if (data && typeof data === 'object' && 'success' in data) {
            if (!data.success) {
              throw new ApiClientError(
                data.error?.message || 'API request failed',
                data.error?.code || 'API_ERROR',
                undefined,
                data.error?.details
              );
            }
            success = true;
            return data.data || data;
          }

          success = true;
          return data;
        } catch (error) {
          lastError = error;

          // Capture error in Sentry
          if (attempt === retries) {
            Sentry.captureException(error, {
              tags: {
                'http.method': method,
                'http.url': endpoint,
                'http.status_code': statusCode || 0,
              },
              extra: {
                attempt: attempt + 1,
                maxRetries: retries,
              },
            });
          }

          // Don't retry on client errors (4xx) except for auth issues
          if (error instanceof ApiClientError && error.statusCode) {
            if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 401) {
              throw error;
            }
          }

          // Don't retry on last attempt
          if (attempt === retries) {
            break;
          }

          // Wait before retrying with exponential backoff
          const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    } finally {
      // Performance tracking - END
      const duration = performance.now() - startTime;

      // Finish Sentry transaction
      transaction.setTag('http.status_code', statusCode || 0);
      transaction.setData('response_size', responseSize);
      transaction.finish();

      // Send metrics to analytics (client-side only)
      if (!this.isServer) {
        this.trackApiCall({
          method,
          endpoint,
          url,
          statusCode: statusCode || 0,
          duration,
          success,
          responseSize,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Track API call metrics (client-side only)
   */
  private trackApiCall(metrics: {
    method: string;
    endpoint: string;
    url: string;
    statusCode: number;
    duration: number;
    success: boolean;
    responseSize: number;
    timestamp: number;
  }): void {
    try {
      // Send to analytics endpoint asynchronously
      fetch('/api/analytics/api-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
        keepalive: true,
      }).catch((error) => {
        // Silently fail - don't disrupt the user experience
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to track API call:', error);
        }
      });
    } catch (error) {
      // Silently fail
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, config);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, config);
  }

  // Utility methods
  protected extractData<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new ApiClientError(
        response.error?.message || 'API request failed',
        response.error?.code || 'API_ERROR',
        undefined,
        response.error?.details
      );
    }
    return response.data!;
  }

  protected handleError(error: any): never {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiClientError('Request timeout', 'TIMEOUT_ERROR');
    }

    throw new ApiClientError(
      error.message || 'Unknown error occurred',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      return await this.get('/health');
    } catch (error) {
      this.handleError(error);
    }
  }

  // Set base URL (useful for different environments)
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  // Get current base URL
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Create singleton instance
export const apiClient = new MarketSageApiClient();

// React hook for using the API client
export function useApiClient(): MarketSageApiClient {
  return apiClient;
}

// Export types for external use
export type { ApiError, ApiResponse, RequestConfig, RetryConfig };