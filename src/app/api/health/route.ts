import { NextResponse } from 'next/server';
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Health check with Prometheus metrics format
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');

  try {
    const startTime = Date.now();
    
    // Perform health checks
    const healthChecks = await performHealthChecks();
    const responseTime = Date.now() - startTime;

    // Return Prometheus metrics format if requested
    if (format === 'prometheus') {
      return new Response(generatePrometheusMetrics(healthChecks, responseTime), {
        headers: { 'Content-Type': 'text/plain; version=0.0.4' },
        status: 200
      });
    }

    // Return JSON format (default)
    return NextResponse.json({
      status: healthChecks.overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'marketsage',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: `${responseTime}ms`,
      checks: healthChecks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }, { 
      status: healthChecks.overall ? 200 : 503 
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    if (format === 'prometheus') {
      return new Response(generateErrorMetrics(), {
        headers: { 'Content-Type': 'text/plain; version=0.0.4' },
        status: 500
      });
    }

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'marketsage',
      error: 'Health check failed'
    }, { status: 500 });
  }
}

async function performHealthChecks() {
  const checks = {
    database: false,
    redis: false,
    ai: false,
    external_apis: false,
    overall: false
  };

  try {
    // Database health check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Redis health check (if available)
    try {
      // Add Redis ping if you have Redis client available
      checks.redis = true; // Placeholder
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    // AI system health check
    try {
      // Check if AI endpoints are responsive
      checks.ai = true; // Placeholder
    } catch (error) {
      console.error('AI health check failed:', error);
    }

    // External APIs health check
    try {
      // Check email, SMS, WhatsApp services
      checks.external_apis = true; // Placeholder
    } catch (error) {
      console.error('External APIs health check failed:', error);
    }

    // Overall health
    checks.overall = checks.database && checks.redis && checks.ai;

  } catch (error) {
    console.error('Health checks failed:', error);
  }

  return checks;
}

function generatePrometheusMetrics(healthChecks: any, responseTime: number) {
  const timestamp = Date.now();
  
  return `
# HELP marketsage_health_check Application health check status
# TYPE marketsage_health_check gauge
marketsage_health_check{component="overall"} ${healthChecks.overall ? 1 : 0} ${timestamp}
marketsage_health_check{component="database"} ${healthChecks.database ? 1 : 0} ${timestamp}
marketsage_health_check{component="redis"} ${healthChecks.redis ? 1 : 0} ${timestamp}
marketsage_health_check{component="ai"} ${healthChecks.ai ? 1 : 0} ${timestamp}
marketsage_health_check{component="external_apis"} ${healthChecks.external_apis ? 1 : 0} ${timestamp}

# HELP marketsage_response_time_milliseconds Health check response time
# TYPE marketsage_response_time_milliseconds gauge
marketsage_response_time_milliseconds ${responseTime} ${timestamp}

# HELP marketsage_uptime_seconds Application uptime in seconds
# TYPE marketsage_uptime_seconds counter
marketsage_uptime_seconds ${process.uptime()} ${timestamp}

# HELP marketsage_memory_usage_bytes Memory usage in bytes
# TYPE marketsage_memory_usage_bytes gauge
marketsage_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss} ${timestamp}
marketsage_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal} ${timestamp}
marketsage_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed} ${timestamp}
marketsage_memory_usage_bytes{type="external"} ${process.memoryUsage().external} ${timestamp}

# HELP marketsage_info Application information
# TYPE marketsage_info gauge
marketsage_info{version="${process.env.APP_VERSION || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}",node_version="${process.version}"} 1 ${timestamp}
`.trim();
}

function generateErrorMetrics() {
  const timestamp = Date.now();
  
  return `
# HELP marketsage_health_check Application health check status
# TYPE marketsage_health_check gauge
marketsage_health_check{component="overall"} 0 ${timestamp}

# HELP marketsage_health_check_error Health check error occurred
# TYPE marketsage_health_check_error gauge
marketsage_health_check_error 1 ${timestamp}
`.trim();
}
