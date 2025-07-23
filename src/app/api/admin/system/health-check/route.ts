import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/admin/system/health-check
 * Manual comprehensive system health check and diagnostics
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
    const { scope = 'all', store = true } = body;

    // Log the admin action
    await logAdminAction(user, 'RUN_HEALTH_CHECK', 'system', {
      scope,
      store,
    });

    const healthReport = await runComprehensiveHealthCheck(scope);
    
    // Store results if requested
    if (store) {
      await storeHealthCheckResults(healthReport, user);
    }

    return Response.json({
      success: true,
      data: healthReport,
    });

  } catch (error) {
    console.error('Manual health check error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to run health check',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * GET /api/admin/system/health-check
 * Get recent health check results
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
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Get recent health check results from system metrics
    const recentHealthChecks = await prisma.systemMetrics.findMany({
      where: {
        metricType: 'health_check_result',
        source: 'health_monitor',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return Response.json({
      success: true,
      data: {
        recentChecks: recentHealthChecks,
        count: recentHealthChecks.length,
      },
    });

  } catch (error) {
    console.error('Get health check results error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to get health check results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * Run comprehensive system health check
 */
async function runComprehensiveHealthCheck(scope: string): Promise<any> {
  const healthReport: any = {
    timestamp: new Date(),
    scope,
    overall: 'unknown',
    checks: {},
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0,
    },
    recommendations: [],
    criticalIssues: [],
  };

  // Database Health Check
  if (scope === 'all' || scope === 'database') {
    healthReport.checks.database = await checkDatabaseHealth();
  }

  // Redis Health Check
  if (scope === 'all' || scope === 'redis') {
    healthReport.checks.redis = await checkRedisHealth();
  }

  // External Services Health Check
  if (scope === 'all' || scope === 'external') {
    healthReport.checks.externalServices = await checkExternalServicesHealth();
  }

  // System Resources Health Check
  if (scope === 'all' || scope === 'system') {
    healthReport.checks.systemResources = await checkSystemResourcesHealth();
  }

  // Security Health Check
  if (scope === 'all' || scope === 'security') {
    healthReport.checks.security = await checkSecurityHealth();
  }

  // Configuration Health Check
  if (scope === 'all' || scope === 'config') {
    healthReport.checks.configuration = await checkConfigurationHealth();
  }

  // Data Integrity Check
  if (scope === 'all' || scope === 'data') {
    healthReport.checks.dataIntegrity = await checkDataIntegrityHealth();
  }

  // Calculate overall status and summary
  const checkResults = Object.values(healthReport.checks);
  healthReport.summary.total = checkResults.length;

  checkResults.forEach((check: any) => {
    switch (check.status) {
      case 'healthy':
      case 'passed':
        healthReport.summary.passed++;
        break;
      case 'critical':
      case 'failed':
        healthReport.summary.failed++;
        healthReport.criticalIssues.push({
          category: check.category || 'unknown',
          issue: check.error || check.message || 'Unknown critical issue',
          severity: 'critical',
        });
        break;
      case 'warning':
      case 'degraded':
        healthReport.summary.warnings++;
        if (check.recommendations) {
          healthReport.recommendations.push(...check.recommendations);
        }
        break;
    }
  });

  // Determine overall health status
  if (healthReport.summary.failed > 0) {
    healthReport.overall = 'critical';
  } else if (healthReport.summary.warnings > 0) {
    healthReport.overall = 'warning';
  } else {
    healthReport.overall = 'healthy';
  }

  return healthReport;
}

/**
 * Database health check
 */
async function checkDatabaseHealth(): Promise<any> {
  const check: any = {
    category: 'database',
    status: 'unknown',
    timestamp: new Date(),
    tests: {},
  };

  try {
    // Connection test
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const connectionTime = Date.now() - startTime;

    check.tests.connection = {
      status: connectionTime < 500 ? 'passed' : 'warning',
      responseTime: connectionTime,
      threshold: 500,
    };

    // Table access test
    try {
      const userCount = await prisma.user.count();
      check.tests.tableAccess = {
        status: 'passed',
        userCount,
      };
    } catch (error) {
      check.tests.tableAccess = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Table access failed',
      };
    }

    // Transaction test
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1`;
        return true;
      });
      check.tests.transactions = { status: 'passed' };
    } catch (error) {
      check.tests.transactions = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Transaction test failed',
      };
    }

    // Determine overall database status
    const testStatuses = Object.values(check.tests).map((test: any) => test.status);
    if (testStatuses.includes('failed')) {
      check.status = 'critical';
    } else if (testStatuses.includes('warning')) {
      check.status = 'warning';
    } else {
      check.status = 'healthy';
    }

  } catch (error) {
    check.status = 'critical';
    check.error = error instanceof Error ? error.message : 'Database health check failed';
  }

  return check;
}

/**
 * Redis health check
 */
async function checkRedisHealth(): Promise<any> {
  const check: any = {
    category: 'redis',
    status: 'unknown',
    timestamp: new Date(),
    tests: {},
  };

  try {
    const { redis } = await import('@/lib/cache/redis');
    
    if (!redis) {
      check.status = 'not_configured';
      check.message = 'Redis is not configured';
      return check;
    }

    // Connection test
    const startTime = Date.now();
    await redis.ping();
    const responseTime = Date.now() - startTime;

    check.tests.connection = {
      status: responseTime < 100 ? 'passed' : 'warning',
      responseTime,
      threshold: 100,
    };

    // Set/Get test
    const testKey = `health_check_${Date.now()}`;
    const testValue = 'health_test';
    
    await redis.set(testKey, testValue, 'EX', 60); // Expire in 60 seconds
    const retrievedValue = await redis.get(testKey);
    
    check.tests.setGet = {
      status: retrievedValue === testValue ? 'passed' : 'failed',
      testKey,
      testValue,
      retrievedValue,
    };

    // Clean up test key
    await redis.del(testKey);

    // Memory check
    try {
      const info = await redis.info('memory');
      const memoryInfo = info.split('\n').reduce((acc: any, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key] = value.trim();
        return acc;
      }, {});

      check.tests.memory = {
        status: 'passed',
        usedMemory: memoryInfo.used_memory_human || 'unknown',
        maxMemory: memoryInfo.maxmemory_human || 'unlimited',
      };
    } catch (error) {
      check.tests.memory = {
        status: 'warning',
        error: 'Could not retrieve memory information',
      };
    }

    // Determine overall Redis status
    const testStatuses = Object.values(check.tests).map((test: any) => test.status);
    if (testStatuses.includes('failed')) {
      check.status = 'critical';
    } else if (testStatuses.includes('warning')) {
      check.status = 'warning';
    } else {
      check.status = 'healthy';
    }

  } catch (error) {
    check.status = 'critical';
    check.error = error instanceof Error ? error.message : 'Redis health check failed';
  }

  return check;
}

/**
 * External services health check
 */
async function checkExternalServicesHealth(): Promise<any> {
  const check: any = {
    category: 'external_services',
    status: 'unknown',
    timestamp: new Date(),
    services: {},
  };

  // Email providers check
  try {
    const emailProviders = await prisma.emailProvider.findMany({
      where: { status: 'ACTIVE' },
    });

    check.services.email = {
      status: emailProviders.length > 0 ? 'healthy' : 'warning',
      activeProviders: emailProviders.length,
      providers: emailProviders.map(p => p.name),
    };
  } catch (error) {
    check.services.email = {
      status: 'failed',
      error: 'Could not check email providers',
    };
  }

  // SMS providers check
  try {
    const smsProviders = await prisma.smsProvider.findMany({
      where: { status: 'ACTIVE' },
    });

    check.services.sms = {
      status: smsProviders.length > 0 ? 'healthy' : 'warning',
      activeProviders: smsProviders.length,
      providers: smsProviders.map(p => p.name),
    };
  } catch (error) {
    check.services.sms = {
      status: 'failed',
      error: 'Could not check SMS providers',
    };
  }

  // Configuration checks for external APIs
  const externalConfigs = {
    paystack: !!process.env.PAYSTACK_SECRET_KEY,
    whatsapp: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    africastalking: !!process.env.AFRICASTALKING_API_KEY,
    termii: !!process.env.TERMII_API_KEY,
  };

  check.services.apiConfigs = {
    status: Object.values(externalConfigs).some(Boolean) ? 'healthy' : 'warning',
    configured: externalConfigs,
    configuredCount: Object.values(externalConfigs).filter(Boolean).length,
  };

  // Determine overall external services status
  const serviceStatuses = Object.values(check.services).map((service: any) => service.status);
  if (serviceStatuses.includes('failed')) {
    check.status = 'critical';
  } else if (serviceStatuses.includes('warning')) {
    check.status = 'warning';
  } else {
    check.status = 'healthy';
  }

  return check;
}

/**
 * System resources health check
 */
async function checkSystemResourcesHealth(): Promise<any> {
  const check: any = {
    category: 'system_resources',
    status: 'unknown',
    timestamp: new Date(),
    resources: {},
  };

  // Memory check
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  check.resources.memory = {
    status: memoryUsagePercent < 80 ? 'healthy' : memoryUsagePercent < 90 ? 'warning' : 'critical',
    usagePercent: Math.round(memoryUsagePercent),
    heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
    heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
  };

  // Process uptime check
  const uptime = process.uptime();
  check.resources.processUptime = {
    status: 'healthy',
    uptime: Math.round(uptime),
    uptimeFormatted: formatUptime(uptime),
  };

  // Event loop lag check
  const eventLoopStart = performance.now();
  await new Promise(resolve => setImmediate(resolve));
  const eventLoopLag = performance.now() - eventLoopStart;

  check.resources.eventLoop = {
    status: eventLoopLag < 10 ? 'healthy' : eventLoopLag < 50 ? 'warning' : 'critical',
    lag: Math.round(eventLoopLag * 100) / 100,
    threshold: 10,
  };

  // Determine overall system resources status
  const resourceStatuses = Object.values(check.resources).map((resource: any) => resource.status);
  if (resourceStatuses.includes('critical')) {
    check.status = 'critical';
  } else if (resourceStatuses.includes('warning')) {
    check.status = 'warning';
  } else {
    check.status = 'healthy';
  }

  return check;
}

/**
 * Security health check
 */
async function checkSecurityHealth(): Promise<any> {
  const check: any = {
    category: 'security',
    status: 'unknown',
    timestamp: new Date(),
    checks: {},
  };

  // Recent security events check
  try {
    const recentSecurityEvents = await prisma.securityEvent.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        resolved: false,
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const criticalEvents = recentSecurityEvents.filter(event => event.severity === 'HIGH');

    check.checks.recentEvents = {
      status: criticalEvents.length === 0 ? 'healthy' : 'critical',
      totalEvents: recentSecurityEvents.length,
      criticalEvents: criticalEvents.length,
      events: recentSecurityEvents.slice(0, 5),
    };
  } catch (error) {
    check.checks.recentEvents = {
      status: 'warning',
      error: 'Could not check security events',
    };
  }

  // Environment variables security check
  const requiredSecrets = [
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
  ];

  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);

  check.checks.environmentSecurity = {
    status: missingSecrets.length === 0 ? 'healthy' : 'critical',
    requiredSecrets: requiredSecrets.length,
    missingSecrets: missingSecrets.length,
    missing: missingSecrets,
  };

  // Determine overall security status
  const securityStatuses = Object.values(check.checks).map((securityCheck: any) => securityCheck.status);
  if (securityStatuses.includes('critical')) {
    check.status = 'critical';
  } else if (securityStatuses.includes('warning')) {
    check.status = 'warning';
  } else {
    check.status = 'healthy';
  }

  return check;
}

/**
 * Configuration health check
 */
async function checkConfigurationHealth(): Promise<any> {
  const check: any = {
    category: 'configuration',
    status: 'healthy',
    timestamp: new Date(),
    configs: {},
  };

  // Node environment check
  check.configs.nodeEnv = {
    status: 'healthy',
    value: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };

  // Database configuration check
  check.configs.database = {
    status: process.env.DATABASE_URL ? 'healthy' : 'critical',
    configured: !!process.env.DATABASE_URL,
  };

  // NextAuth configuration check
  check.configs.auth = {
    status: process.env.NEXTAUTH_SECRET ? 'healthy' : 'critical',
    configured: !!process.env.NEXTAUTH_SECRET,
  };

  return check;
}

/**
 * Data integrity health check
 */
async function checkDataIntegrityHealth(): Promise<any> {
  const check: any = {
    category: 'data_integrity',
    status: 'unknown',
    timestamp: new Date(),
    integrity: {},
  };

  try {
    // Check for orphaned records or data consistency issues
    const [userCount, contactCount, campaignCount] = await Promise.all([
      prisma.user.count(),
      prisma.contact.count(),
      prisma.campaign.count(),
    ]);

    check.integrity.basicCounts = {
      status: 'healthy',
      users: userCount,
      contacts: contactCount,
      campaigns: campaignCount,
    };

    // Check for users without organizations (if applicable)
    // This would need to be customized based on your data model requirements

    check.status = 'healthy';
  } catch (error) {
    check.status = 'critical';
    check.error = error instanceof Error ? error.message : 'Data integrity check failed';
  }

  return check;
}

/**
 * Store health check results
 */
async function storeHealthCheckResults(healthReport: any, user: any): Promise<void> {
  try {
    await prisma.systemMetrics.create({
      data: {
        metricType: 'health_check_result',
        value: healthReport.summary.passed / healthReport.summary.total * 100, // Success percentage
        unit: 'percentage',
        source: 'health_monitor',
        metadata: {
          ...healthReport,
          performedBy: user.email,
        },
      },
    });
  } catch (error) {
    console.error('Failed to store health check results:', error);
  }
}

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
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