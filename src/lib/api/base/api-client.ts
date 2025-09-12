import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';

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

export class BaseApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private isServer: boolean;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2';
    this.defaultTimeout = 30000; // 30 seconds
    this.defaultRetries = 3;
    this.defaultRetryDelay = 1000; // 1 second
    this.isServer = typeof window === 'undefined';
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      if (this.isServer) {
        // Server-side: Get token from request context or environment
        return process.env.API_TOKEN || null;
      } else {
        // Client-side: Get session token
        const session = await getSession();
        return session?.accessToken || null;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = config.timeout || this.defaultTimeout;
    const retries = config.retries || this.defaultRetries;
    const retryDelay = config.retryDelay || this.defaultRetryDelay;

    let lastError: any;

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
        }

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
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
          return data.data || data;
        }

        return data;
      } catch (error) {
        lastError = error;

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
  }

  protected async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, config);
  }

  protected async post<T>(
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

  protected async put<T>(
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

  protected async patch<T>(
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

  protected async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, config);
  }

  // Utility methods for handling different response formats
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