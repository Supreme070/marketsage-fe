import { NextResponse } from 'next/server';
import prisma from "@/lib/db/prisma";
import { trace } from '@opentelemetry/api';
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Health check with Prometheus metrics format and OpenTelemetry tracing
export async function GET(request: Request) {
  const tracer = trace.getTracer('marketsage-health');
  
  return tracer.startActiveSpan('health-check-api', async (span) => {
    try {
      const { searchParams } = new URL(request.url);
      const format = searchParams.get('format');
      
      span.setAttributes({
        'http.method': 'GET',
        'http.route': '/api/health',
        'request.format': format || 'json',
        'service.name': 'marketsage',
      });

      const startTime = Date.now();
      
      // Perform health checks with tracing
      const healthChecks = await performHealthChecks();
      const responseTime = Date.now() - startTime;
      
      span.setAttributes({
        'app.health.overall': healthChecks.overall,
        'app.health.database': healthChecks.database,
        'app.health.response_time_ms': responseTime,
      });

      // Return Prometheus metrics format if requested
      if (format === 'prometheus') {
        span.setStatus({ code: 1 }); // OK
        return new Response(generatePrometheusMetrics(healthChecks, responseTime), {
          headers: { 'Content-Type': 'text/plain; version=0.0.4' },
          status: 200
        });
      }

      // Return JSON format (default)
      span.setStatus({ code: 1 }); // OK
      // Prepare system info based on environment
      const systemInfo = process.env.NODE_ENV === 'production' 
        ? undefined  // Hide system details in production
        : {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
          };

      const telemetryInfo = process.env.NODE_ENV === 'production'
        ? { enabled: !!process.env.OTEL_ENABLED }  // Only show if enabled in production
        : {
            enabled: true,
            endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4318'
          };

      return NextResponse.json({
        status: healthChecks.overall ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'marketsage',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        responseTime: `${responseTime}ms`,
        checks: healthChecks,
        uptime: process.uptime(),
        memory: process.env.NODE_ENV === 'production' ? undefined : process.memoryUsage(),
        system: systemInfo,
        telemetry: telemetryInfo
      }, { 
        status: healthChecks.overall ? 200 : 503 
      });

    } catch (error) {
      console.error('Health check failed:', error);
      
      span.setStatus({ code: 2, message: String(error) }); // ERROR
      span.setAttributes({
        'error.message': String(error),
        'app.health.status': 'error',
      });
      
      const { searchParams } = new URL(request.url);
      const format = searchParams.get('format');
      
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
        error: 'Health check failed',
        telemetry: process.env.NODE_ENV === 'production'
          ? { enabled: !!process.env.OTEL_ENABLED }
          : {
              enabled: true,
              endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4318'
            }
      }, { status: 500 });
    } finally {
      span.end();
    }
  });
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

    // External APIs health check - Enhanced with AI integration testing
    try {
      // Import integration testing engine
      const { integrationTestingEngine } = await import('@/lib/ai/integration-testing-engine');
      const integrationHealth = await integrationTestingEngine.performIntegrationHealthCheck();
      
      // Consider external APIs healthy if overall score > 70
      checks.external_apis = integrationHealth.overall.score > 70;
      
      // Add detailed integration metrics to response
      checks.integration_details = {
        overallScore: integrationHealth.overall.score,
        healthyCount: integrationHealth.metrics.healthyCount,
        unhealthyCount: integrationHealth.metrics.unhealthyCount,
        averageResponseTime: integrationHealth.metrics.averageResponseTime,
        riskLevel: integrationHealth.insights.riskLevel,
        trending: integrationHealth.insights.trending
      };
    } catch (error) {
      console.error('AI Integration testing failed:', error);
      checks.external_apis = false;
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
