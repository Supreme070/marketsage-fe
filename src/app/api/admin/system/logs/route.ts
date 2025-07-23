import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/system/logs
 * System logs access with filtering and pagination
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
    const logType = url.searchParams.get('type') || 'all';
    const severity = url.searchParams.get('severity');
    const source = url.searchParams.get('source');
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search');

    // Log the admin action
    await logAdminAction(user, 'ACCESS_SYSTEM_LOGS', 'logs', {
      logType,
      severity,
      source,
      timeRange,
      limit,
      search,
    });

    const logs = await getSystemLogs({
      logType,
      severity,
      source,
      timeRange,
      limit,
      offset,
      search,
    });

    return Response.json({
      success: true,
      data: logs,
    });

  } catch (error) {
    console.error('System logs access error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to access system logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * POST /api/admin/system/logs
 * Create a system log entry
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
    const { level, message, source, metadata } = body;

    // Create system log entry
    const logEntry = await createSystemLog({
      level,
      message,
      source,
      metadata: {
        ...metadata,
        createdBy: user.email,
        adminAction: true,
      },
    });

    // Log the admin action
    await logAdminAction(user, 'CREATE_SYSTEM_LOG', 'logs', {
      level,
      message,
      source,
    });

    return Response.json({
      success: true,
      data: logEntry,
      message: 'System log entry created',
    });

  } catch (error) {
    console.error('System log creation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create system log entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * Get system logs with filtering and pagination
 */
async function getSystemLogs(options: {
  logType: string;
  severity?: string | null;
  source?: string | null;
  timeRange: string;
  limit: number;
  offset: number;
  search?: string | null;
}): Promise<any> {
  const timeRanges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  const timeRangeMs = timeRanges[options.timeRange] || timeRanges['24h'];
  const fromDate = new Date(Date.now() - timeRangeMs);

  const logs: any = {
    entries: [],
    pagination: {
      limit: options.limit,
      offset: options.offset,
      total: 0,
    },
    filters: {
      logType: options.logType,
      severity: options.severity,
      source: options.source,
      timeRange: options.timeRange,
      search: options.search,
    },
    summary: {
      byLevel: {},
      bySource: {},
      timeRange: options.timeRange,
      fromDate,
    },
  };

  // Build query based on log type
  switch (options.logType) {
    case 'error':
      logs.entries = await getErrorLogs(fromDate, options);
      logs.pagination.total = await countErrorLogs(fromDate, options);
      break;
    case 'security':
      logs.entries = await getSecurityLogs(fromDate, options);
      logs.pagination.total = await countSecurityLogs(fromDate, options);
      break;
    case 'performance':
      logs.entries = await getPerformanceLogs(fromDate, options);
      logs.pagination.total = await countPerformanceLogs(fromDate, options);
      break;
    case 'audit':
      logs.entries = await getAuditLogs(fromDate, options);
      logs.pagination.total = await countAuditLogs(fromDate, options);
      break;
    case 'system':
      logs.entries = await getSystemMetricsLogs(fromDate, options);
      logs.pagination.total = await countSystemMetricsLogs(fromDate, options);
      break;
    default: // 'all'
      logs.entries = await getAllLogs(fromDate, options);
      logs.pagination.total = await countAllLogs(fromDate, options);
      break;
  }

  // Calculate summary statistics
  logs.summary.byLevel = logs.entries.reduce((acc: any, log: any) => {
    const level = log.level || log.severity || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  logs.summary.bySource = logs.entries.reduce((acc: any, log: any) => {
    const source = log.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  return logs;
}

/**
 * Get error logs from various sources
 */
async function getErrorLogs(fromDate: Date, options: any): Promise<any[]> {
  const logs: any[] = [];

  try {
    // Get system metrics errors
    const systemErrors = await prisma.systemMetrics.findMany({
      where: {
        metricType: { in: ['api_errors', 'system_errors', 'database_errors'] },
        timestamp: { gte: fromDate },
        ...(options.source && { source: options.source }),
      },
      orderBy: { timestamp: 'desc' },
      skip: options.offset,
      take: Math.min(options.limit, 50),
    });

    logs.push(...systemErrors.map(error => ({
      id: error.id,
      timestamp: error.timestamp,
      level: 'error',
      message: error.metadata?.message || `${error.metricType} occurred`,
      source: error.source,
      type: 'system_metric',
      metadata: error.metadata,
    })));

    // Add more error sources as needed
    // Could include application logs, API errors, etc.

  } catch (error) {
    console.error('Failed to get error logs:', error);
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get security logs
 */
async function getSecurityLogs(fromDate: Date, options: any): Promise<any[]> {
  const logs: any[] = [];

  try {
    // Security events
    const securityEvents = await prisma.securityEvent.findMany({
      where: {
        timestamp: { gte: fromDate },
        ...(options.severity && { severity: options.severity.toUpperCase() }),
      },
      orderBy: { timestamp: 'desc' },
      skip: options.offset,
      take: Math.min(options.limit, 50),
    });

    logs.push(...securityEvents.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      level: event.severity.toLowerCase(),
      message: event.title,
      source: 'security_monitor',
      type: 'security_event',
      metadata: {
        eventType: event.eventType,
        details: event.details,
        resolved: event.resolved,
        userId: event.userId,
        ipAddress: event.ipAddress,
      },
    })));

    // Audit logs (security-related)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        timestamp: { gte: fromDate },
        action: {
          in: ['LOGIN_FAILED', 'PERMISSION_DENIED', 'SECURITY_VIOLATION'],
        },
      },
      orderBy: { timestamp: 'desc' },
      skip: 0,
      take: 25,
    });

    logs.push(...auditLogs.map(audit => ({
      id: audit.id,
      timestamp: audit.timestamp,
      level: 'warning',
      message: `${audit.action}: ${audit.resource}`,
      source: 'audit_system',
      type: 'audit_log',
      metadata: {
        adminEmail: audit.adminEmail,
        action: audit.action,
        resource: audit.resource,
        details: audit.details,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      },
    })));

  } catch (error) {
    console.error('Failed to get security logs:', error);
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get performance logs
 */
async function getPerformanceLogs(fromDate: Date, options: any): Promise<any[]> {
  const logs: any[] = [];

  try {
    // Performance metrics
    const performanceMetrics = await prisma.systemMetrics.findMany({
      where: {
        metricType: {
          in: ['api_response_time', 'database_query_time', 'memory_usage', 'cpu_usage'],
        },
        timestamp: { gte: fromDate },
        ...(options.source && { source: options.source }),
        // Only get slow responses or high resource usage
        OR: [
          { metricType: 'api_response_time', value: { gte: 1000 } }, // > 1 second
          { metricType: 'database_query_time', value: { gte: 500 } }, // > 500ms
          { metricType: 'memory_usage', value: { gte: 80 } }, // > 80%
          { metricType: 'cpu_usage', value: { gte: 80 } }, // > 80%
        ],
      },
      orderBy: { timestamp: 'desc' },
      skip: options.offset,
      take: Math.min(options.limit, 50),
    });

    logs.push(...performanceMetrics.map(metric => ({
      id: metric.id,
      timestamp: metric.timestamp,
      level: metric.value > (metric.metricType.includes('usage') ? 90 : 2000) ? 'critical' : 'warning',
      message: `${metric.metricType}: ${metric.value}${metric.unit}`,
      source: metric.source,
      type: 'performance_metric',
      metadata: {
        ...metric.metadata,
        metricType: metric.metricType,
        value: metric.value,
        unit: metric.unit,
      },
    })));

  } catch (error) {
    console.error('Failed to get performance logs:', error);
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get audit logs
 */
async function getAuditLogs(fromDate: Date, options: any): Promise<any[]> {
  const logs: any[] = [];

  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        timestamp: { gte: fromDate },
        ...(options.search && {
          OR: [
            { action: { contains: options.search, mode: 'insensitive' } },
            { resource: { contains: options.search, mode: 'insensitive' } },
            { adminEmail: { contains: options.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { timestamp: 'desc' },
      skip: options.offset,
      take: Math.min(options.limit, 100),
    });

    logs.push(...auditLogs.map(audit => ({
      id: audit.id,
      timestamp: audit.timestamp,
      level: 'info',
      message: `${audit.action}: ${audit.resource}`,
      source: 'audit_system',
      type: 'audit_log',
      metadata: {
        adminId: audit.adminId,
        adminEmail: audit.adminEmail,
        adminRole: audit.adminRole,
        action: audit.action,
        resource: audit.resource,
        details: audit.details,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      },
    })));

  } catch (error) {
    console.error('Failed to get audit logs:', error);
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get system metrics logs
 */
async function getSystemMetricsLogs(fromDate: Date, options: any): Promise<any[]> {
  const logs: any[] = [];

  try {
    const systemMetrics = await prisma.systemMetrics.findMany({
      where: {
        timestamp: { gte: fromDate },
        ...(options.source && { source: options.source }),
      },
      orderBy: { timestamp: 'desc' },
      skip: options.offset,
      take: Math.min(options.limit, 50),
    });

    logs.push(...systemMetrics.map(metric => ({
      id: metric.id,
      timestamp: metric.timestamp,
      level: 'info',
      message: `${metric.metricType}: ${metric.value}${metric.unit}`,
      source: metric.source,
      type: 'system_metric',
      metadata: {
        ...metric.metadata,
        metricType: metric.metricType,
        value: metric.value,
        unit: metric.unit,
      },
    })));

  } catch (error) {
    console.error('Failed to get system metrics logs:', error);
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get all logs combined
 */
async function getAllLogs(fromDate: Date, options: any): Promise<any[]> {
  const [errorLogs, securityLogs, auditLogs] = await Promise.all([
    getErrorLogs(fromDate, { ...options, limit: 20 }),
    getSecurityLogs(fromDate, { ...options, limit: 20 }),
    getAuditLogs(fromDate, { ...options, limit: 20 }),
  ]);

  const allLogs = [...errorLogs, ...securityLogs, ...auditLogs];
  
  return allLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(options.offset, options.offset + options.limit);
}

/**
 * Count functions for pagination
 */
async function countErrorLogs(fromDate: Date, options: any): Promise<number> {
  try {
    return await prisma.systemMetrics.count({
      where: {
        metricType: { in: ['api_errors', 'system_errors', 'database_errors'] },
        timestamp: { gte: fromDate },
        ...(options.source && { source: options.source }),
      },
    });
  } catch (error) {
    return 0;
  }
}

async function countSecurityLogs(fromDate: Date, options: any): Promise<number> {
  try {
    const [securityCount, auditCount] = await Promise.all([
      prisma.securityEvent.count({
        where: {
          timestamp: { gte: fromDate },
          ...(options.severity && { severity: options.severity.toUpperCase() }),
        },
      }),
      prisma.auditLog.count({
        where: {
          timestamp: { gte: fromDate },
          action: { in: ['LOGIN_FAILED', 'PERMISSION_DENIED', 'SECURITY_VIOLATION'] },
        },
      }),
    ]);
    return securityCount + auditCount;
  } catch (error) {
    return 0;
  }
}

async function countPerformanceLogs(fromDate: Date, options: any): Promise<number> {
  try {
    return await prisma.systemMetrics.count({
      where: {
        metricType: {
          in: ['api_response_time', 'database_query_time', 'memory_usage', 'cpu_usage'],
        },
        timestamp: { gte: fromDate },
        ...(options.source && { source: options.source }),
      },
    });
  } catch (error) {
    return 0;
  }
}

async function countAuditLogs(fromDate: Date, options: any): Promise<number> {
  try {
    return await prisma.auditLog.count({
      where: {
        timestamp: { gte: fromDate },
        ...(options.search && {
          OR: [
            { action: { contains: options.search, mode: 'insensitive' } },
            { resource: { contains: options.search, mode: 'insensitive' } },
            { adminEmail: { contains: options.search, mode: 'insensitive' } },
          ],
        }),
      },
    });
  } catch (error) {
    return 0;
  }
}

async function countSystemMetricsLogs(fromDate: Date, options: any): Promise<number> {
  try {
    return await prisma.systemMetrics.count({
      where: {
        timestamp: { gte: fromDate },
        ...(options.source && { source: options.source }),
      },
    });
  } catch (error) {
    return 0;
  }
}

async function countAllLogs(fromDate: Date, options: any): Promise<number> {
  const [errorCount, securityCount, auditCount] = await Promise.all([
    countErrorLogs(fromDate, options),
    countSecurityLogs(fromDate, options),
    countAuditLogs(fromDate, options),
  ]);
  return errorCount + securityCount + auditCount;
}

/**
 * Create a system log entry
 */
async function createSystemLog(logData: {
  level: string;
  message: string;
  source: string;
  metadata?: any;
}): Promise<any> {
  // Store as system metric for consistency
  return await prisma.systemMetrics.create({
    data: {
      metricType: `${logData.level}_log`,
      value: 1, // Log occurrence count
      unit: 'count',
      source: logData.source,
      metadata: {
        message: logData.message,
        level: logData.level,
        ...logData.metadata,
      },
    },
  });
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