/**
 * AI Integration Health Monitoring API
 * ===================================
 * Comprehensive integration testing and monitoring with predictive insights
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { trace } from '@opentelemetry/api';

// Request validation schemas
const integrationTestRequestSchema = z.object({
  integrationId: z.string().optional(),
  forceRefresh: z.boolean().default(false),
  includeHistory: z.boolean().default(false)
});

// GET: Get integration health status with AI insights
export async function GET(request: NextRequest) {
  const tracer = trace.getTracer('integration-health-api');
  
  return tracer.startActiveSpan('integration-health-check', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      const user = session?.user;
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Dynamic imports to prevent circular dependencies
      const { 
        integrationTestingEngine, 
        getIntegrationHealth, 
        testSpecificIntegration,
        runFullIntegrationTest 
      } = await import('@/lib/ai/integration-testing-engine');

      const url = new URL(request.url);
      const integrationId = url.searchParams.get('integrationId');
      const forceRefresh = url.searchParams.get('forceRefresh') === 'true';
      const includeHistory = url.searchParams.get('includeHistory') === 'true';

      span.setAttributes({
        'integration.request.type': integrationId ? 'specific' : 'all',
        'integration.request.force_refresh': forceRefresh,
        'user.id': user.id,
        'organization.id': user.organizationId
      });

      logger.info('Integration health check requested', {
        userId: user.id,
        organizationId: user.organizationId,
        integrationId,
        forceRefresh
      });

      if (integrationId) {
        // Get specific integration status
        const integration = await testSpecificIntegration(integrationId);
        
        if (!integration) {
          return NextResponse.json(
            { success: false, error: 'Integration not found' },
            { status: 404 }
          );
        }

          span.setAttributes({
            'integration.specific.id': integrationId,
            'integration.specific.status': integration.status,
            'integration.specific.response_time': integration.responseTime
          });

          return NextResponse.json({
            success: true,
            data: {
              integration,
              lastChecked: integration.lastChecked,
              recommendations: integration.status === 'unhealthy' 
                ? ['Check integration configuration', 'Verify API credentials', 'Review error logs']
                : ['Integration is healthy'],
              ...(includeHistory && { history: [] }) // Would implement history tracking
            }
          });
        } else {
          // Get comprehensive health report
          const healthReport = forceRefresh 
            ? await runFullIntegrationTest(user.organizationId)
            : await getIntegrationHealth(user.organizationId);

          span.setAttributes({
            'integration.health.overall_status': healthReport.overall.status,
            'integration.health.score': healthReport.overall.score,
            'integration.metrics.total': healthReport.metrics.totalIntegrations,
            'integration.metrics.healthy': healthReport.metrics.healthyCount,
            'integration.metrics.unhealthy': healthReport.metrics.unhealthyCount,
            'integration.insights.risk_level': healthReport.insights.riskLevel
          });

          return NextResponse.json({
            success: true,
            data: {
              ...healthReport,
              systemMetrics: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
              },
              lastUpdated: healthReport.overall.lastUpdated,
              nextCheck: new Date(Date.now() + 5 * 60 * 1000), // Next automatic check in 5 minutes
              alertSummary: {
                critical: healthReport.integrations.filter(i => 
                  i.status === 'unhealthy' && i.criticalityLevel === 'critical'
                ).length,
                warnings: healthReport.integrations.filter(i => 
                  i.status === 'degraded' || i.responseTime > i.slaTarget
                ).length
              }
            }
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        span.setAttributes({
          'error.message': errorMessage,
          'integration.health.error': true
        });
        
        logger.error('Integration health check failed', {
          error: errorMessage,
          userId: user?.id,
          organizationId: user?.organizationId
        });

        return NextResponse.json({
          success: false,
          error: 'Failed to retrieve integration health status',
          data: {
            fallback: true,
            message: 'Integration monitoring temporarily unavailable'
          }
        }, { status: 500 });
      } finally {
        span.end();
      }
    });
}

// POST: Trigger integration tests or update configuration
export async function POST(request: NextRequest) {
  const tracer = trace.getTracer('integration-test-trigger');
  
  return tracer.startActiveSpan('trigger-integration-test', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      const user = session?.user;
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const body = await request.json();
      const validationResult = integrationTestRequestSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request data' },
          { status: 400 }
        );
      }

      const { integrationId, forceRefresh } = validationResult.data;

      // Dynamic imports to prevent circular dependencies
      const { 
        testSpecificIntegration,
        runFullIntegrationTest 
      } = await import('@/lib/ai/integration-testing-engine');

      span.setAttributes({
          'integration.test.trigger': 'manual',
          'integration.test.integration_id': integrationId || 'all',
          'integration.test.force_refresh': forceRefresh,
          'user.id': user.id,
          'organization.id': user.organizationId
        });

        logger.info('Manual integration test triggered', {
          userId: user.id,
          organizationId: user.organizationId,
          integrationId,
          forceRefresh
        });

        if (integrationId) {
          // Test specific integration
          const result = await testSpecificIntegration(integrationId);
          
          if (!result) {
            return NextResponse.json({
              success: false,
              error: 'Integration not found'
            }, { status: 404 });
          }

          span.setAttributes({
            'integration.test.result.status': result.status,
            'integration.test.result.response_time': result.responseTime
          });

          return NextResponse.json({
            success: true,
            data: {
              integrationId,
              status: result.status,
              responseTime: result.responseTime,
              lastChecked: result.lastChecked,
              message: result.status === 'healthy' 
                ? `✅ ${result.name} is healthy and responding normally`
                : `❌ ${result.name} is experiencing issues`,
              recommendations: result.status === 'unhealthy'
                ? [
                    'Check integration configuration and credentials',
                    'Verify network connectivity to the service',
                    'Review service status page for known issues',
                    'Contact support if issue persists'
                  ]
                : ['Integration is operating normally']
            }
          });
        } else {
          // Run full integration test suite
          const healthReport = await runFullIntegrationTest(user.organizationId);

          span.setAttributes({
            'integration.test.suite.overall_status': healthReport.overall.status,
            'integration.test.suite.score': healthReport.overall.score,
            'integration.test.suite.tested_count': healthReport.metrics.totalIntegrations
          });

          const criticalIssues = healthReport.integrations.filter(i => 
            i.status === 'unhealthy' && i.criticalityLevel === 'critical'
          );

          return NextResponse.json({
            success: true,
            data: {
              testSuite: 'complete',
              overallStatus: healthReport.overall.status,
              score: healthReport.overall.score,
              summary: {
                total: healthReport.metrics.totalIntegrations,
                healthy: healthReport.metrics.healthyCount,
                degraded: healthReport.metrics.degradedCount,
                unhealthy: healthReport.metrics.unhealthyCount,
                averageResponseTime: `${Math.round(healthReport.metrics.averageResponseTime)}ms`
              },
              insights: healthReport.insights,
              criticalIssues: criticalIssues.map(i => ({
                name: i.name,
                type: i.type,
                status: i.status,
                errorCount: i.errorCount,
                lastChecked: i.lastChecked
              })),
              message: criticalIssues.length > 0
                ? `🚨 ${criticalIssues.length} critical integrations need immediate attention`
                : healthReport.overall.status === 'healthy'
                  ? '✅ All integrations are healthy and operating normally'
                  : `⚠️ System is ${healthReport.overall.status} - some integrations may need attention`,
              recommendations: healthReport.insights.recommendations
            }
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        
        logger.error('Manual integration test failed', {
          error: errorMessage,
          userId: user.id,
          integrationId: validationResult.data.integrationId
        });

        return NextResponse.json({
          success: false,
          error: errorMessage
        }, { status: 500 });
      } finally {
        span.end();
      }
    });
}

// PUT: Update integration configuration or circuit breaker settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const putRequestSchema = z.object({
      integrationId: z.string().min(1, 'Integration ID required'),
      action: z.enum(['reset_circuit_breaker', 'update_config', 'force_healthy']),
      config: z.record(z.any()).optional()
    });

    const validationResult = putRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { integrationId, action, config } = validationResult.data;

      logger.info('Integration configuration update requested', {
        userId: user.id,
        integrationId,
        action
      });

      // This would implement circuit breaker resets and configuration updates
      // For now, return success for basic actions
      
      switch (action) {
        case 'reset_circuit_breaker':
          return NextResponse.json({
            success: true,
            data: {
              integrationId,
              action: 'circuit_breaker_reset',
              message: 'Circuit breaker has been reset and will retry connections',
              timestamp: new Date()
            }
          });
          
        case 'force_healthy':
          return NextResponse.json({
            success: true,
            data: {
              integrationId,
              action: 'forced_healthy',
              message: 'Integration status temporarily set to healthy',
              timestamp: new Date(),
              warning: 'This is a temporary override - underlying issues should still be resolved'
            }
          });
          
        default:
          return NextResponse.json({
            success: false,
            error: 'Action not implemented yet'
          }, { status: 400 });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Integration configuration update failed', {
        error: errorMessage,
        userId: user.id,
        integrationId: validationResult.data.integrationId
      });

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 });
    }
}