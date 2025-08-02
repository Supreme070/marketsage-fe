import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { performance } from 'perf_hooks';

/**
 * Performance Monitoring Middleware
 * Automatically captures API response times and stores them as system metrics
 */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isEnabled = true;

  constructor() {
    // Start periodic flushing of metrics
    this.startPeriodicFlush();
    
    // Graceful shutdown
    process.on('SIGTERM', () => this.flush());
    process.on('SIGINT', () => this.flush());
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push({
      ...metric,
      responseTime: Math.round(metric.responseTime * 100) / 100, // Round to 2 decimal places
    });

    // If we have too many metrics, flush immediately
    if (this.metrics.length >= 100) {
      this.flush();
    }
  }

  /**
   * Start periodic flushing of metrics to database
   */
  private startPeriodicFlush(): void {
    // Flush metrics every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  /**
   * Flush metrics to database
   */
  private async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = []; // Clear the buffer

    try {
      // Convert performance metrics to system metrics format
      const systemMetrics = metricsToFlush.map(metric => ({
        metricType: 'api_response_time',
        value: metric.responseTime,
        unit: 'milliseconds',
        source: 'api_monitor',
        timestamp: new Date(),
        metadata: {
          endpoint: metric.endpoint,
          method: metric.method,
          statusCode: metric.statusCode,
          userAgent: metric.userAgent,
          ip: metric.ip,
          error: metric.error,
          isError: metric.statusCode >= 400,
          isSlowResponse: metric.responseTime > 1000,
        },
      }));

      // Store in database
      await prisma.systemMetrics.createMany({
        data: systemMetrics,
        skipDuplicates: true,
      });

      console.log(`Flushed ${systemMetrics.length} performance metrics to database`);

    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
      
      // Put metrics back in buffer for retry
      this.metrics.unshift(...metricsToFlush);
    }
  }

  /**
   * Get current metrics buffer size
   */
  getBufferSize(): number {
    return this.metrics.length;
  }

  /**
   * Force flush metrics
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware wrapper for API routes to automatically capture performance metrics
 */
export function withPerformanceMonitoring(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options: {
    excludeHealthChecks?: boolean;
    excludeOptions?: boolean;
    sampleRate?: number; // 0-1, percentage of requests to monitor
  } = {}
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const startTime = performance.now();
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method;

    // Skip monitoring based on options
    if (options.excludeHealthChecks && (
      endpoint.includes('/health') || 
      endpoint.includes('/ping') ||
      endpoint.includes('/status')
    )) {
      return handler(req, context);
    }

    if (options.excludeOptions && method === 'OPTIONS') {
      return handler(req, context);
    }

    // Sample rate check
    if (options.sampleRate && Math.random() > options.sampleRate) {
      return handler(req, context);
    }

    let response: Response;
    let error: string | undefined;

    try {
      response = await handler(req, context);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Handler error';
      // Re-throw the error to maintain original behavior
      throw err;
    } finally {
      const responseTime = performance.now() - startTime;
      
      // Record the performance metric
      performanceMonitor.record({
        endpoint,
        method,
        statusCode: response?.status || 500,
        responseTime,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: getClientIP(req),
        error,
      });
    }

    return response!;
  };
}

/**
 * Express-style middleware for Next.js API routes
 */
export function capturePerformanceMetrics(req: NextRequest, res: Response, next?: Function) {
  const startTime = performance.now();
  
  // Monkey patch the response to capture when it's sent
  const originalSend = res.json;
  res.json = function(body: any) {
    const responseTime = performance.now() - startTime;
    const url = new URL(req.url);
    
    performanceMonitor.record({
      endpoint: url.pathname,
      method: req.method,
      statusCode: res.status,
      responseTime,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: getClientIP(req),
    });

    return originalSend.call(this, body);
  };

  if (next) next();
}

/**
 * Manual performance metric recording
 */
export function recordPerformanceMetric(
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode: number,
  metadata?: Record<string, any>
): void {
  performanceMonitor.record({
    endpoint,
    method,
    statusCode,
    responseTime,
    ...metadata,
  });
}

/**
 * Get performance statistics
 */
export async function getPerformanceStats(timeRange = '1h'): Promise<any> {
  const timeRanges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };

  const timeRangeMs = timeRanges[timeRange] || timeRanges['1h'];
  const fromDate = new Date(Date.now() - timeRangeMs);

  try {
    const metrics = await prisma.systemMetrics.findMany({
      where: {
        metricType: 'api_response_time',
        timestamp: { gte: fromDate },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        endpoints: {},
      };
    }

    // Calculate statistics
    const responseTimes = metrics.map(m => m.value);
    const totalRequests = metrics.length;
    const avgResponseTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
    
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    // Error rate calculation
    const errorRequests = metrics.filter(m => m.metadata?.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? Math.round((errorRequests / totalRequests) * 100 * 100) / 100 : 0;

    // Endpoint breakdown
    const endpointStats: Record<string, any> = {};
    metrics.forEach(metric => {
      const endpoint = metric.metadata?.endpoint || 'unknown';
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {
          count: 0,
          totalTime: 0,
          minTime: Number.POSITIVE_INFINITY,
          maxTime: 0,
          errors: 0,
        };
      }
      
      const stats = endpointStats[endpoint];
      stats.count++;
      stats.totalTime += metric.value;
      stats.minTime = Math.min(stats.minTime, metric.value);
      stats.maxTime = Math.max(stats.maxTime, metric.value);
      
      if (metric.metadata?.statusCode >= 400) {
        stats.errors++;
      }
    });

    // Calculate endpoint averages
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      stats.avgTime = Math.round(stats.totalTime / stats.count);
      stats.errorRate = Math.round((stats.errors / stats.count) * 100 * 100) / 100;
      stats.minTime = stats.minTime === Number.POSITIVE_INFINITY ? 0 : stats.minTime;
    });

    return {
      timeRange,
      totalRequests,
      avgResponseTime,
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      errorRate,
      endpoints: endpointStats,
      slowEndpoints: Object.entries(endpointStats)
        .filter(([_, stats]: [string, any]) => stats.avgTime > 1000)
        .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.avgTime - a.avgTime)
        .slice(0, 10),
    };

  } catch (error) {
    console.error('Failed to get performance stats:', error);
    return {
      error: 'Failed to get performance statistics',
    };
  }
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: NextRequest): string {
  // Check for forwarded IP first (common in production behind proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check for real IP
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  // Check for connecting IP
  const connectingIP = req.headers.get('x-connecting-ip');
  if (connectingIP) {
    return connectingIP.trim();
  }
  
  // Fallback to connection remote address
  return req.headers.get('x-vercel-forwarded-for') || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
}

// Enable performance monitoring in production
if (process.env.NODE_ENV === 'production') {
  performanceMonitor.setEnabled(true);
  console.log('Performance monitoring enabled');
}

export { performanceMonitor };