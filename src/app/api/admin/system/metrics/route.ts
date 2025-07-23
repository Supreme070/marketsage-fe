import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import * as os from 'os';
import * as fs from 'fs/promises';
import { performance } from 'perf_hooks';

const metricsSchema = z.object({
  metricType: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  source: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/admin/system/metrics
 * Get real-time system metrics with filtering and aggregation
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
    const metricType = url.searchParams.get('type');
    const source = url.searchParams.get('source');
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const aggregation = url.searchParams.get('aggregation') || 'latest';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const realTime = url.searchParams.get('realtime') === 'true';

    // Collect real-time system metrics if requested
    if (realTime) {
      await collectRealTimeMetrics();
    }

    // Calculate time range
    const timeRanges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const timeRangeMs = timeRanges[timeRange] || timeRanges['24h'];
    const fromDate = new Date(Date.now() - timeRangeMs);

    // Log the admin action
    await logAdminAction(user, 'VIEW_SYSTEM_METRICS', 'system', {
      metricType,
      source,
      timeRange,
      aggregation,
    });

    // Build where clause
    const where: any = {
      timestamp: {
        gte: fromDate,
      },
    };

    if (metricType) {
      where.metricType = metricType;
    }

    if (source) {
      where.source = source;
    }

    // Get metrics based on aggregation type
    let metrics;
    
    if (aggregation === 'avg') {
      metrics = await prisma.systemMetrics.groupBy({
        by: ['metricType', 'source'],
        _avg: {
          value: true,
        },
        _count: {
          _all: true,
        },
        where,
        orderBy: {
          metricType: 'asc',
        },
      });
    } else if (aggregation === 'max') {
      metrics = await prisma.systemMetrics.groupBy({
        by: ['metricType', 'source'],
        _max: {
          value: true,
        },
        _count: {
          _all: true,
        },
        where,
        orderBy: {
          metricType: 'asc',
        },
      });
    } else if (aggregation === 'min') {
      metrics = await prisma.systemMetrics.groupBy({
        by: ['metricType', 'source'],
        _min: {
          value: true,
        },
        _count: {
          _all: true,
        },
        where,
        orderBy: {
          metricType: 'asc',
        },
      });
    } else {
      // Latest values
      metrics = await prisma.systemMetrics.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        select: {
          id: true,
          metricType: true,
          value: true,
          unit: true,
          source: true,
          timestamp: true,
          metadata: true,
        },
      });
    }

    // Get current system health status
    const currentMetrics = await prisma.systemMetrics.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
    });

    // Calculate health status
    const healthStatus = calculateHealthStatus(currentMetrics);

    // Get metric types and sources for filtering
    const [metricTypes, sources] = await Promise.all([
      prisma.systemMetrics.groupBy({
        by: ['metricType'],
        _count: {
          _all: true,
        },
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
      }),
      prisma.systemMetrics.groupBy({
        by: ['source'],
        _count: {
          _all: true,
        },
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
      }),
    ]);

    // Get real-time system snapshot if requested
    const realTimeSnapshot = realTime ? await getRealTimeSystemSnapshot() : null;

    return Response.json({
      success: true,
      data: {
        metrics,
        healthStatus,
        realTimeSnapshot,
        metadata: {
          timeRange,
          aggregation,
          fromDate,
          metricTypes: metricTypes.map(m => ({
            type: m.metricType,
            count: m._count._all,
          })),
          sources: sources.map(s => ({
            source: s.source,
            count: s._count._all,
          })),
        },
      },
    });

  } catch (error) {
    console.error('Admin system metrics error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch system metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * POST /api/admin/system/metrics
 * Record system metrics (for internal system use)
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
    
    // Support both single metric and batch metrics
    const metricsArray = Array.isArray(body) ? body : [body];
    
    // Validate all metrics
    const validatedMetrics = metricsArray.map(metric => 
      metricsSchema.parse(metric)
    );

    // Create metrics
    const createdMetrics = await prisma.systemMetrics.createMany({
      data: validatedMetrics.map(metric => ({
        ...metric,
        timestamp: new Date(),
      })),
    });

    // Log the admin action
    await logAdminAction(user, 'CREATE_SYSTEM_METRICS', 'system', {
      metricsCount: validatedMetrics.length,
      metricTypes: [...new Set(validatedMetrics.map(m => m.metricType))],
    });

    return Response.json({
      success: true,
      message: `${createdMetrics.count} metrics recorded successfully`,
      data: {
        recorded: createdMetrics.count,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid metric data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Admin system metrics creation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to record system metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * Calculate overall system health status based on metrics
 */
function calculateHealthStatus(metrics: any[]): any {
  const latestMetrics: Record<string, any> = {};
  
  // Get latest value for each metric type
  metrics.forEach(metric => {
    const key = `${metric.source}-${metric.metricType}`;
    if (!latestMetrics[key] || metric.timestamp > latestMetrics[key].timestamp) {
      latestMetrics[key] = metric;
    }
  });

  const healthChecks = {
    cpu_usage: { threshold: 80, status: 'healthy' },
    memory_usage: { threshold: 85, status: 'healthy' },
    disk_usage: { threshold: 90, status: 'healthy' },
    database_connections: { threshold: 80, status: 'healthy' },
    redis_memory: { threshold: 80, status: 'healthy' },
    response_time: { threshold: 2000, status: 'healthy' }, // 2 seconds
  };

  let overallStatus = 'healthy';
  const issues: string[] = [];

  Object.values(latestMetrics).forEach((metric: any) => {
    const check = healthChecks[metric.metricType as keyof typeof healthChecks];
    if (check) {
      if (metric.value > check.threshold) {
        check.status = 'warning';
        issues.push(`${metric.metricType} on ${metric.source}: ${metric.value}${metric.unit}`);
        
        if (metric.value > check.threshold * 1.1) { // 10% above threshold
          check.status = 'critical';
          overallStatus = 'critical';
        } else if (overallStatus !== 'critical') {
          overallStatus = 'warning';
        }
      }
    }
  });

  return {
    status: overallStatus,
    checks: healthChecks,
    issues,
    lastUpdated: new Date(),
    totalMetrics: Object.keys(latestMetrics).length,
  };
}

/**
 * Collect real-time system metrics and store them in the database
 */
async function collectRealTimeMetrics(): Promise<void> {
  try {
    const metrics: any[] = [];
    const timestamp = new Date();
    const hostname = os.hostname();

    // CPU Metrics
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const cpuUsage = 100 - Math.round(100 * totalIdle / totalTick);
    
    metrics.push({
      metricType: 'cpu_usage',
      value: cpuUsage,
      unit: 'percentage',
      source: hostname,
      timestamp,
      metadata: {
        cores: cpus.length,
        model: cpus[0]?.model,
        speed: cpus[0]?.speed,
      },
    });

    // Memory Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);

    metrics.push({
      metricType: 'memory_usage',
      value: memUsagePercent,
      unit: 'percentage',
      source: hostname,
      timestamp,
      metadata: {
        totalMB: Math.round(totalMem / 1024 / 1024),
        usedMB: Math.round(usedMem / 1024 / 1024),
        freeMB: Math.round(freeMem / 1024 / 1024),
      },
    });

    // Process Metrics
    const processMemUsage = process.memoryUsage();
    metrics.push({
      metricType: 'process_memory',
      value: Math.round(processMemUsage.heapUsed / 1024 / 1024),
      unit: 'MB',
      source: hostname,
      timestamp,
      metadata: {
        heapTotal: Math.round(processMemUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(processMemUsage.heapUsed / 1024 / 1024),
        external: Math.round(processMemUsage.external / 1024 / 1024),
        rss: Math.round(processMemUsage.rss / 1024 / 1024),
      },
    });

    // System Load
    const loadAvg = os.loadavg();
    metrics.push({
      metricType: 'system_load',
      value: Math.round(loadAvg[0] * 100) / 100,
      unit: 'load',
      source: hostname,
      timestamp,
      metadata: {
        load1m: loadAvg[0],
        load5m: loadAvg[1],
        load15m: loadAvg[2],
      },
    });

    // Network Interfaces
    const networkInterfaces = os.networkInterfaces();
    const activeInterfaces = Object.keys(networkInterfaces).filter(name => {
      const interfaces = networkInterfaces[name];
      return interfaces && interfaces.some(iface => !iface.internal && iface.family === 'IPv4');
    });

    metrics.push({
      metricType: 'network_interfaces',
      value: activeInterfaces.length,
      unit: 'count',
      source: hostname,
      timestamp,
      metadata: {
        interfaces: activeInterfaces,
        total: Object.keys(networkInterfaces).length,
      },
    });

    // Node.js Process Metrics
    metrics.push({
      metricType: 'nodejs_uptime',
      value: Math.round(process.uptime()),
      unit: 'seconds',
      source: hostname,
      timestamp,
      metadata: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });

    // Event Loop Lag
    const startTime = performance.now();
    await new Promise(resolve => setImmediate(resolve));
    const eventLoopLag = performance.now() - startTime;
    
    metrics.push({
      metricType: 'event_loop_lag',
      value: Math.round(eventLoopLag * 100) / 100,
      unit: 'milliseconds',
      source: hostname,
      timestamp,
      metadata: {
        measurement: 'setImmediate_delay',
      },
    });

    // Database Connection Pool Metrics
    try {
      const dbMetrics = await prisma.$metrics.json();
      if (dbMetrics) {
        metrics.push({
          metricType: 'database_connections',
          value: dbMetrics.counters?.['prisma_client_queries_total']?.value || 0,
          unit: 'count',
          source: 'database',
          timestamp,
          metadata: dbMetrics,
        });
      }
    } catch (error) {
      console.log('Database metrics not available:', error);
    }

    // Store all metrics in database
    if (metrics.length > 0) {
      await prisma.systemMetrics.createMany({
        data: metrics,
        skipDuplicates: true,
      });
    }

  } catch (error) {
    console.error('Failed to collect real-time metrics:', error);
  }
}

/**
 * Get real-time system snapshot without storing in database
 */
async function getRealTimeSystemSnapshot(): Promise<any> {
  try {
    const hostname = os.hostname();
    const uptime = os.uptime();
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freeMem();
    const cpus = os.cpus();

    return {
      timestamp: new Date(),
      hostname,
      uptime: Math.round(uptime),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        type: os.type(),
      },
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model,
        speed: cpus[0]?.speed,
        loadAvg: {
          '1m': Math.round(loadAvg[0] * 100) / 100,
          '5m': Math.round(loadAvg[1] * 100) / 100,
          '15m': Math.round(loadAvg[2] * 100) / 100,
        },
      },
      memory: {
        total: Math.round(totalMem / 1024 / 1024),
        free: Math.round(freeMem / 1024 / 1024),
        used: Math.round((totalMem - freeMem) / 1024 / 1024),
        usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      },
      process: {
        pid: process.pid,
        uptime: Math.round(process.uptime()),
        version: process.version,
        memory: process.memoryUsage(),
      },
      network: {
        interfaces: Object.keys(os.networkInterfaces()).length,
        active: Object.keys(os.networkInterfaces()).filter(name => {
          const interfaces = os.networkInterfaces()[name];
          return interfaces && interfaces.some(iface => !iface.internal);
        }).length,
      },
    };
  } catch (error) {
    console.error('Failed to get real-time system snapshot:', error);
    return null;
  }
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