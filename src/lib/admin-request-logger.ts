import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export interface AdminRequestLog {
  id: string;
  method: string;
  url: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  userId?: string;
  userRole?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  duration: number;
  statusCode: number;
  responseSize: number;
  error?: string;
  metadata?: any;
}

export interface LoggingConfig {
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'debug';
  logHeaders: boolean;
  logBody: boolean;
  logResponse: boolean;
  sensitiveFields: string[];
  excludePaths: string[];
  includePaths?: string[];
  maxBodySize: number; // Maximum body size to log in bytes
  maxLogRetention: number; // Days to keep logs
}

// Default logging configuration
const defaultLoggingConfig: LoggingConfig = {
  enabled: process.env.NODE_ENV !== 'production', // Disabled in production by default
  logLevel: 'standard',
  logHeaders: true,
  logBody: true,
  logResponse: false, // Don't log responses by default (can be large)
  sensitiveFields: [
    'password', 'token', 'authorization', 'cookie', 'x-api-key',
    'secret', 'key', 'auth', 'session', 'csrf'
  ],
  excludePaths: [
    '/api/health',
    '/api/ping',
    '/_next',
    '/favicon.ico'
  ],
  includePaths: [
    '/api/admin'
  ],
  maxBodySize: 10 * 1024, // 10KB
  maxLogRetention: 30 // 30 days
};

// In-memory log store (in production, use database or external logging service)
class AdminRequestLogStore {
  private logs = new Map<string, AdminRequestLog>();
  private maxLogs = 10000; // Keep maximum 10,000 logs in memory

  add(log: AdminRequestLog): void {
    this.logs.set(log.id, log);
    
    // Remove oldest logs if we exceed the maximum
    if (this.logs.size > this.maxLogs) {
      const oldestKey = this.logs.keys().next().value;
      this.logs.delete(oldestKey);
    }
  }

  getLogs(filter?: {
    userId?: string;
    method?: string;
    statusCode?: number;
    fromDate?: Date;
    toDate?: Date;
    hasError?: boolean;
    limit?: number;
  }): AdminRequestLog[] {
    let logs = Array.from(this.logs.values());

    // Apply filters
    if (filter) {
      if (filter.userId) {
        logs = logs.filter(log => log.userId === filter.userId);
      }
      if (filter.method) {
        logs = logs.filter(log => log.method === filter.method);
      }
      if (filter.statusCode) {
        logs = logs.filter(log => log.statusCode === filter.statusCode);
      }
      if (filter.fromDate) {
        logs = logs.filter(log => log.timestamp >= filter.fromDate!);
      }
      if (filter.toDate) {
        logs = logs.filter(log => log.timestamp <= filter.toDate!);
      }
      if (filter.hasError !== undefined) {
        logs = logs.filter(log => filter.hasError ? !!log.error : !log.error);
      }
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }

    return logs;
  }

  getStats(): {
    total: number;
    errors: number;
    avgDuration: number;
    slowRequests: number;
    recentRequests: number;
  } {
    const logs = Array.from(this.logs.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const errors = logs.filter(log => log.statusCode >= 400).length;
    const avgDuration = logs.length > 0 
      ? logs.reduce((sum, log) => sum + log.duration, 0) / logs.length 
      : 0;
    const slowRequests = logs.filter(log => log.duration > 2000).length; // > 2 seconds
    const recentRequests = logs.filter(log => log.timestamp > oneHourAgo).length;

    return {
      total: logs.length,
      errors,
      avgDuration: Math.round(avgDuration),
      slowRequests,
      recentRequests
    };
  }

  cleanup(): void {
    const cutoffDate = new Date(Date.now() - defaultLoggingConfig.maxLogRetention * 24 * 60 * 60 * 1000);
    
    for (const [id, log] of this.logs.entries()) {
      if (log.timestamp < cutoffDate) {
        this.logs.delete(id);
      }
    }
  }
}

const requestLogStore = new AdminRequestLogStore();

// Cleanup old logs every 6 hours
setInterval(() => requestLogStore.cleanup(), 6 * 60 * 60 * 1000);

/**
 * Admin Request Logger Service
 */
export class AdminRequestLogger {
  private config: LoggingConfig;

  constructor(config?: Partial<LoggingConfig>) {
    this.config = { ...defaultLoggingConfig, ...config };
  }

  /**
   * Main logging middleware for admin requests
   */
  async logRequest(
    req: NextRequest,
    response: NextResponse,
    userInfo?: { id: string; role: string },
    startTime?: number,
    error?: Error
  ): Promise<void> {
    try {
      if (!this.shouldLogRequest(req)) {
        return;
      }

      const endTime = Date.now();
      const duration = startTime ? endTime - startTime : 0;

      const log = await this.createRequestLog(req, response, userInfo, duration, error);
      
      // Store the log
      requestLogStore.add(log);

      // In production, also send to external logging service
      if (process.env.NODE_ENV === 'production') {
        await this.sendToExternalLogger(log);
      }

      // Log to console based on log level
      this.logToConsole(log);

    } catch (loggingError) {
      console.error('Request logging failed:', loggingError);
    }
  }

  private shouldLogRequest(req: NextRequest): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const path = new URL(req.url).pathname;

    // Check exclude paths
    if (this.config.excludePaths.some(excludePath => path.startsWith(excludePath))) {
      return false;
    }

    // Check include paths (if specified)
    if (this.config.includePaths && this.config.includePaths.length > 0) {
      return this.config.includePaths.some(includePath => path.startsWith(includePath));
    }

    return true;
  }

  private async createRequestLog(
    req: NextRequest,
    response: NextResponse,
    userInfo?: { id: string; role: string },
    duration = 0,
    error?: Error
  ): Promise<AdminRequestLog> {
    const url = new URL(req.url);
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Get client IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';

    // Prepare headers (filter sensitive ones)
    const headers = this.config.logHeaders ? this.sanitizeHeaders(req.headers) : {};

    // Prepare body (if enabled and not too large)
    let body: any = undefined;
    if (this.config.logBody && req.method !== 'GET') {
      try {
        const clonedRequest = req.clone();
        const bodyText = await clonedRequest.text();
        
        if (bodyText && bodyText.length <= this.config.maxBodySize) {
          try {
            body = JSON.parse(bodyText);
            body = this.sanitizeBody(body);
          } catch {
            // If not JSON, store as text (truncated)
            body = bodyText.substring(0, 500);
          }
        }
      } catch (bodyError) {
        // Ignore body parsing errors
      }
    }

    // Calculate response size
    const responseSize = this.calculateResponseSize(response);

    return {
      id,
      method: req.method,
      url: req.url,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers,
      body,
      userId: userInfo?.id,
      userRole: userInfo?.role,
      ip,
      userAgent: req.headers.get('user-agent') || '',
      timestamp: new Date(),
      duration,
      statusCode: response.status,
      responseSize,
      error: error?.message,
      metadata: {
        hasBody: !!body,
        queryParams: url.searchParams.size,
        headerCount: req.headers.size || 0,
        ...(error && {
          errorStack: error.stack?.substring(0, 1000),
          errorName: error.name
        })
      }
    };
  }

  private sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      
      if (this.config.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (typeof body !== 'object' || body === null) {
      return body;
    }

    const sanitized = { ...body };

    // Recursively sanitize sensitive fields
    for (const [key, value] of Object.entries(sanitized)) {
      const lowerKey = key.toLowerCase();
      
      if (this.config.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeBody(value);
      }
    }

    return sanitized;
  }

  private calculateResponseSize(response: NextResponse): number {
    const contentLength = response.headers.get('content-length');
    return contentLength ? Number.parseInt(contentLength, 10) : 0;
  }

  private logToConsole(log: AdminRequestLog): void {
    const level = this.getLogLevel(log);
    const message = this.formatLogMessage(log);

    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'debug':
      default:
        console.log(message);
        break;
    }
  }

  private getLogLevel(log: AdminRequestLog): 'error' | 'warn' | 'info' | 'debug' {
    if (log.error || log.statusCode >= 500) {
      return 'error';
    }
    if (log.statusCode >= 400 || log.duration > 5000) {
      return 'warn';
    }
    if (log.statusCode >= 200) {
      return 'info';
    }
    return 'debug';
  }

  private formatLogMessage(log: AdminRequestLog): string {
    const parts = [
      `[ADMIN-API]`,
      `${log.method} ${log.path}`,
      `${log.statusCode}`,
      `${log.duration}ms`,
      `${log.ip}`
    ];

    if (log.userId) {
      parts.push(`user:${log.userId}`);
    }

    if (log.userRole) {
      parts.push(`role:${log.userRole}`);
    }

    if (log.error) {
      parts.push(`error:${log.error}`);
    }

    let message = parts.join(' ');

    // Add detailed information based on log level
    if (this.config.logLevel === 'detailed' || this.config.logLevel === 'debug') {
      if (Object.keys(log.query).length > 0) {
        message += ` query:${JSON.stringify(log.query)}`;
      }
      
      if (log.responseSize > 0) {
        message += ` size:${log.responseSize}b`;
      }
    }

    if (this.config.logLevel === 'debug') {
      if (log.body) {
        message += ` body:${JSON.stringify(log.body).substring(0, 200)}`;
      }
    }

    return message;
  }

  private async sendToExternalLogger(log: AdminRequestLog): Promise<void> {
    // In a real implementation, send to external logging service
    // Examples: DataDog, New Relic, CloudWatch, Splunk, etc.
    
    // Example for a generic webhook-based logger:
    /*
    if (process.env.ADMIN_LOG_WEBHOOK_URL) {
      try {
        await fetch(process.env.ADMIN_LOG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log)
        });
      } catch (error) {
        console.error('Failed to send log to external service:', error);
      }
    }
    */
  }

  /**
   * Get request logs with filtering
   */
  getLogs(filter?: {
    userId?: string;
    method?: string;
    statusCode?: number;
    fromDate?: Date;
    toDate?: Date;
    hasError?: boolean;
    limit?: number;
  }): AdminRequestLog[] {
    return requestLogStore.getLogs(filter);
  }

  /**
   * Get logging statistics
   */
  getStats() {
    return {
      ...requestLogStore.getStats(),
      config: {
        enabled: this.config.enabled,
        logLevel: this.config.logLevel,
        maxRetention: this.config.maxLogRetention
      }
    };
  }

  /**
   * Update logging configuration
   */
  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Global logger instance
export const adminRequestLogger = new AdminRequestLogger();

/**
 * Middleware wrapper for admin request logging
 */
export function withAdminRequestLogging(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    let response: NextResponse;
    let error: Error | undefined;
    let userInfo: { id: string; role: string } | undefined;

    try {
      // Try to get user info from request (if available)
      // This would typically come from authentication middleware
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        // In a real implementation, decode the auth token to get user info
        // userInfo = await getUserFromToken(authHeader);
      }

      // Execute the handler
      response = await handler(req, ...args);

    } catch (err) {
      error = err as Error;
      // Create error response
      response = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    // Log the request
    await adminRequestLogger.logRequest(req, response, userInfo, startTime, error);

    return response;
  };
}

/**
 * API endpoints for accessing logs
 */
export async function getLogsHandler(req: Request) {
  const url = new URL(req.url);
  const filter = {
    userId: url.searchParams.get('userId') || undefined,
    method: url.searchParams.get('method') || undefined,
    statusCode: url.searchParams.get('statusCode') ? 
      Number.parseInt(url.searchParams.get('statusCode')!) : undefined,
    limit: url.searchParams.get('limit') ? 
      Number.parseInt(url.searchParams.get('limit')!) : 100
  };

  const logs = adminRequestLogger.getLogs(filter);
  const stats = adminRequestLogger.getStats();

  return NextResponse.json({
    success: true,
    data: {
      logs,
      stats,
      filter
    }
  });
}

export async function getLogsStatsHandler() {
  const stats = adminRequestLogger.getStats();
  
  return NextResponse.json({
    success: true,
    data: stats
  });
}

export default adminRequestLogger;