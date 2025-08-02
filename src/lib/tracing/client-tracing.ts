import { v4 as uuidv4 } from 'uuid';

// Simple client-side tracing utility for Next.js
export class ClientTracing {
  private static correlationId: string | null = null;

  // Generate a new correlation ID for the current page/session
  static generateCorrelationId(): string {
    const id = uuidv4();
    this.correlationId = id;
    
    // Store in session storage for persistence across requests
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('correlation-id', id);
      console.log(`🔍 Generated correlation ID: ${id}`);
    }
    
    return id;
  }

  // Get the current correlation ID
  static getCorrelationId(): string {
    if (this.correlationId) {
      return this.correlationId;
    }

    // Try to get from session storage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('correlation-id');
      if (stored) {
        this.correlationId = stored;
        return stored;
      }
    }

    // Generate new one if none exists
    return this.generateCorrelationId();
  }

  // Clear correlation ID (e.g., on logout)
  static clearCorrelationId(): void {
    this.correlationId = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('correlation-id');
    }
  }

  // Enhanced fetch function that includes correlation ID
  static async fetch(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const correlationId = this.getCorrelationId();
    
    const enhancedOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'x-correlation-id': correlationId,
        'x-request-id': correlationId, // Alternative header name
      },
    };

    console.log(`🌐 API Request [${correlationId}]: ${options.method || 'GET'} ${url}`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, enhancedOptions);
      const duration = Date.now() - startTime;
      
      // Log response details
      const responseCorrelationId = response.headers.get('x-correlation-id');
      const spanId = response.headers.get('x-span-id');
      
      console.log(
        `✅ API Response [${responseCorrelationId}] [${spanId}]: ${response.status} - ${duration}ms`
      );
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ API Error [${correlationId}]: ${error} - ${duration}ms`);
      throw error;
    }
  }

  // Enhanced axios-like request function for easier usage
  static async request(config: {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    headers?: Record<string, string>;
  }): Promise<any> {
    const { url, method = 'GET', data, headers = {} } = config;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await this.fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Specific methods for common operations
  static async get(url: string, headers?: Record<string, string>) {
    return this.request({ url, method: 'GET', headers });
  }

  static async post(url: string, data?: any, headers?: Record<string, string>) {
    return this.request({ url, method: 'POST', data, headers });
  }

  static async put(url: string, data?: any, headers?: Record<string, string>) {
    return this.request({ url, method: 'PUT', data, headers });
  }

  static async delete(url: string, headers?: Record<string, string>) {
    return this.request({ url, method: 'DELETE', headers });
  }

  // Initialize tracing for a new page/session
  static initializeForPage(): string {
    const correlationId = this.generateCorrelationId();
    
    // Log page navigation
    if (typeof window !== 'undefined') {
      console.log(`📄 Page initialized with correlation ID: ${correlationId}`);
      console.log(`🔗 URL: ${window.location.href}`);
    }
    
    return correlationId;
  }

  // Get trace information from the backend
  static async getTrace(traceId: string): Promise<any> {
    try {
      return await this.get(`/api/v2/tracing/trace/${traceId}`);
    } catch (error) {
      console.error('Failed to fetch trace data:', error);
      return null;
    }
  }
}