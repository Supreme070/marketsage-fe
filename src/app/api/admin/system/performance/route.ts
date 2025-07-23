import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { performance, PerformanceObserver } from 'perf_hooks';

/**
 * GET /api/admin/system/performance
 * Performance analytics with real metrics from logs and monitoring
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSystem) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const metric = url.searchParams.get('metric');
    const endpoint = url.searchParams.get('endpoint');

    // Log the admin action
    await logAdminAction(user, 'CHECK_PERFORMANCE', 'performance', {
      timeRange,
      metric,
      endpoint,
    });

    const performanceData = await getPerformanceMetrics(timeRange, metric, endpoint);

    return Response.json({
      success: true,
      data: performanceData,
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to get performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * POST /api/admin/system/performance
 * Record performance metrics
 */
export const POST = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSystem) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { endpoint, method, responseTime, statusCode, errorMessage } = body;

    // Store performance metric
    await prisma.systemMetrics.create({
      data: {
        metricType: 'api_response_time',
        value: responseTime,
        unit: 'milliseconds',
        source: 'api_monitor',
        metadata: {
          endpoint,
          method,
          statusCode,
          errorMessage,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Log the admin action
    await logAdminAction(user, 'RECORD_PERFORMANCE_METRIC', 'performance', {
      endpoint,
      method,
      responseTime,
      statusCode,
    });

    return Response.json({
      success: true,
      message: 'Performance metric recorded',
    });

  } catch (error) {
    console.error('Performance metric recording error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to record performance metric',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * Get comprehensive performance metrics
 */
async function getPerformanceMetrics(timeRange: string, metricFilter?: string | null, endpointFilter?: string | null): Promise<any> {
  const timeRanges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  const timeRangeMs = timeRanges[timeRange] || timeRanges['24h'];
  const fromDate = new Date(Date.now() - timeRangeMs);

  const performanceData: any = {
    timeRange,
    fromDate,
    lastUpdated: new Date(),
  };

  // API Response Times
  performanceData.apiPerformance = await getAPIPerformanceMetrics(fromDate, endpointFilter);
  
  // Database Performance
  performanceData.databasePerformance = await getDatabasePerformanceMetrics(fromDate);
  
  // System Performance
  performanceData.systemPerformance = await getSystemPerformanceMetrics(fromDate);
  
  // Error Analytics
  performanceData.errorAnalytics = await getErrorAnalytics(fromDate);
  
  // Throughput Metrics
  performanceData.throughputMetrics = await getThroughputMetrics(fromDate);
  
  // Real-time Performance Snapshot
  performanceData.realTimeSnapshot = await getRealTimePerformanceSnapshot();

  return performanceData;
}

/**
 * Get API performance metrics
 */
async function getAPIPerformanceMetrics(fromDate: Date, endpointFilter?: string | null): Promise<any> {
  try {
    // Get API response time metrics
    const whereClause: any = {
      metricType: 'api_response_time',
      timestamp: { gte: fromDate },
    };

    if (endpointFilter) {
      whereClause.metadata = {
        path: ['endpoint'],
        string_contains: endpointFilter,
      };
    }

    const responseTimeMetrics = await prisma.systemMetrics.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    // Calculate statistics
    const responseTimes = responseTimeMetrics.map(m => m.value);
    const avgResponseTime = responseTimes.length > 0 ? 
      Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length) : 0;
    
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95ResponseTime = sortedTimes.length > 0 ? 
      sortedTimes[Math.floor(sortedTimes.length * 0.95)] : 0;
    const p99ResponseTime = sortedTimes.length > 0 ? 
      sortedTimes[Math.floor(sortedTimes.length * 0.99)] : 0;

    // Group by endpoint
    const endpointStats: Record<string, any> = {};
    responseTimeMetrics.forEach(metric => {
      const endpoint = metric.metadata?.endpoint || 'unknown';
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
          errors: 0,
        };
      }
      
      const stats = endpointStats[endpoint];
      stats.count++;
      stats.totalTime += metric.value;
      stats.minTime = Math.min(stats.minTime, metric.value);
      stats.maxTime = Math.max(stats.maxTime, metric.value);
      
      const statusCode = metric.metadata?.statusCode;
      if (statusCode && statusCode >= 400) {
        stats.errors++;
      }
    });

    // Calculate averages and error rates for each endpoint
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      stats.avgTime = Math.round(stats.totalTime / stats.count);
      stats.errorRate = Math.round((stats.errors / stats.count) * 100 * 100) / 100;
      stats.minTime = stats.minTime === Infinity ? 0 : stats.minTime;
    });

    return {
      overall: {
        totalRequests: responseTimes.length,
        avgResponseTime,
        p95ResponseTime: Math.round(p95ResponseTime),
        p99ResponseTime: Math.round(p99ResponseTime),
        minResponseTime: Math.min(...responseTimes) || 0,
        maxResponseTime: Math.max(...responseTimes) || 0,
      },
      endpoints: endpointStats,
      recentTrend: getRecentTrend(responseTimeMetrics, 'value'),
    };
  } catch (error) {
    console.error('Failed to get API performance metrics:', error);
    return {
      overall: { error: 'Failed to get API performance metrics' },
      endpoints: {},
      recentTrend: [],
    };
  }
}

/**
 * Get database performance metrics
 */
async function getDatabasePerformanceMetrics(fromDate: Date): Promise<any> {
  try {
    // Measure database performance with actual queries
    const startTime = performance.now();
    
    // Test queries with different complexity levels
    const simpleQuery = prisma.user.count();
    const complexQuery = prisma.contact.groupBy({
      by: ['status'],
      _count: { _all: true },
      take: 10,
    });

    const [userCount, contactStats] = await Promise.all([simpleQuery, complexQuery]);
    const queryTime = Math.round(performance.now() - startTime);

    // Get database connection metrics if available
    const connectionMetrics = await prisma.systemMetrics.findMany({
      where: {
        metricType: 'database_connections',
        timestamp: { gte: fromDate },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const avgConnections = connectionMetrics.length > 0 ?
      Math.round(connectionMetrics.reduce((sum, m) => sum + m.value, 0) / connectionMetrics.length) : 0;

    return {
      connectionHealth: 'healthy',
      queryPerformance: {
        testQueryTime: queryTime,
        simpleQueryResult: userCount,
        complexQueryResult: contactStats.length,
      },
      connections: {
        average: avgConnections,
        current: 'N/A', // Would require database-specific queries
        maximum: 'N/A',
      },
      recentMetrics: connectionMetrics.slice(0, 20),
    };
  } catch (error) {
    console.error('Failed to get database performance metrics:', error);
    return {
      connectionHealth: 'error',
      error: error instanceof Error ? error.message : 'Database performance check failed',
    };
  }
}

/**
 * Get system performance metrics
 */
async function getSystemPerformanceMetrics(fromDate: Date): Promise<any> {
  try {
    // Get system metrics from stored data
    const [cpuMetrics, memoryMetrics, loadMetrics] = await Promise.all([
      prisma.systemMetrics.findMany({
        where: {
          metricType: 'cpu_usage',
          timestamp: { gte: fromDate },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
      prisma.systemMetrics.findMany({
        where: {
          metricType: 'memory_usage',
          timestamp: { gte: fromDate },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
      prisma.systemMetrics.findMany({
        where: {
          metricType: 'system_load',
          timestamp: { gte: fromDate },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
    ]);

    const calculateStats = (metrics: any[]) => {
      if (metrics.length === 0) return { avg: 0, min: 0, max: 0, current: 0 };
      
      const values = metrics.map(m => m.value);
      return {
        avg: Math.round(values.reduce((sum, val) => sum + val, 0) / values.length),
        min: Math.min(...values),
        max: Math.max(...values),
        current: values[0] || 0,
      };
    };

    return {
      cpu: calculateStats(cpuMetrics),
      memory: calculateStats(memoryMetrics),
      systemLoad: calculateStats(loadMetrics),
      trends: {
        cpu: getRecentTrend(cpuMetrics, 'value'),
        memory: getRecentTrend(memoryMetrics, 'value'),
        load: getRecentTrend(loadMetrics, 'value'),
      },
    };
  } catch (error) {
    console.error('Failed to get system performance metrics:', error);
    return {
      error: error instanceof Error ? error.message : 'System performance check failed',
    };
  }
}

/**
 * Get error analytics
 */
async function getErrorAnalytics(fromDate: Date): Promise<any> {
  try {
    // Get error metrics from system metrics
    const errorMetrics = await prisma.systemMetrics.findMany({
      where: {
        metricType: { in: ['api_errors', 'system_errors'] },
        timestamp: { gte: fromDate },
      },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });

    // Get security events as errors
    const securityEvents = await prisma.securityEvent.findMany({
      where: {
        timestamp: { gte: fromDate },
        resolved: false,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    // Group errors by type
    const errorsByType: Record<string, number> = {};
    const errorsBySource: Record<string, number> = {};
    
    errorMetrics.forEach(metric => {
      const errorType = metric.metadata?.errorType || 'unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      errorsBySource[metric.source] = (errorsBySource[metric.source] || 0) + 1;
    });

    // Calculate error rate trends
    const hourlyErrors = groupByHour(errorMetrics);

    return {
      totalErrors: errorMetrics.length,
      securityEvents: securityEvents.length,
      errorsByType,
      errorsBySource,
      hourlyTrend: hourlyErrors,
      recentErrors: errorMetrics.slice(0, 10).map(metric => ({
        timestamp: metric.timestamp,
        type: metric.metricType,
        source: metric.source,
        message: metric.metadata?.errorMessage || 'Unknown error',
      })),
      criticalIssues: securityEvents.filter(event => event.severity === 'HIGH').length,
    };
  } catch (error) {
    console.error('Failed to get error analytics:', error);
    return {
      error: error instanceof Error ? error.message : 'Error analytics check failed',
    };
  }
}

/**
 * Get throughput metrics
 */
async function getThroughputMetrics(fromDate: Date): Promise<any> {
  try {
    // Calculate throughput from API calls
    const apiMetrics = await prisma.systemMetrics.findMany({
      where: {
        metricType: 'api_response_time',
        timestamp: { gte: fromDate },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    // Group by time intervals
    const hourlyThroughput = groupByHour(apiMetrics);
    const totalRequests = apiMetrics.length;
    const timeRangeHours = Math.max(1, (Date.now() - fromDate.getTime()) / (1000 * 60 * 60));
    const avgRequestsPerHour = Math.round(totalRequests / timeRangeHours);

    // Calculate peak throughput
    const maxHourlyRequests = Math.max(...Object.values(hourlyThroughput));

    return {
      totalRequests,
      avgRequestsPerHour,
      maxRequestsPerHour: maxHourlyRequests,
      currentThroughput: hourlyThroughput[Object.keys(hourlyThroughput).pop() || ''] || 0,
      hourlyBreakdown: hourlyThroughput,
    };
  } catch (error) {
    console.error('Failed to get throughput metrics:', error);
    return {
      error: error instanceof Error ? error.message : 'Throughput metrics check failed',
    };
  }
}

/**
 * Get real-time performance snapshot
 */
async function getRealTimePerformanceSnapshot(): Promise<any> {
  try {
    // Measure current performance
    const startTime = performance.now();
    
    // Test database responsiveness
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Math.round(performance.now() - startTime);

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get event loop lag
    const eventLoopStart = performance.now();
    await new Promise(resolve => setImmediate(resolve));
    const eventLoopLag = Math.round(performance.now() - eventLoopStart);

    return {
      timestamp: new Date(),
      database: {
        responseTime: dbResponseTime,
        status: dbResponseTime < 100 ? 'healthy' : dbResponseTime < 500 ? 'warning' : 'critical',
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      eventLoop: {
        lag: eventLoopLag,
        status: eventLoopLag < 10 ? 'healthy' : eventLoopLag < 50 ? 'warning' : 'critical',
      },
      process: {
        uptime: Math.round(process.uptime()),
        cpuUsage: process.cpuUsage(),
      },
    };
  } catch (error) {
    console.error('Failed to get real-time performance snapshot:', error);
    return {
      error: error instanceof Error ? error.message : 'Real-time snapshot failed',
    };
  }
}

/**
 * Helper function to get recent trend data
 */
function getRecentTrend(metrics: any[], valueField: string): any[] {
  return metrics
    .slice(0, 20)
    .reverse()
    .map(metric => ({
      timestamp: metric.timestamp,
      value: metric[valueField],
    }));
}

/**
 * Helper function to group metrics by hour
 */
function groupByHour(metrics: any[]): Record<string, number> {
  const grouped: Record<string, number> = {};
  
  metrics.forEach(metric => {
    const hour = new Date(metric.timestamp).toISOString().substring(0, 13) + ':00:00Z';
    grouped[hour] = (grouped[hour] || 0) + 1;
  });
  
  return grouped;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}