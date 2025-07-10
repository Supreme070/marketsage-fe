import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiPerformanceMonitoringDashboard, MetricType, AlertSeverity, AlertType } from '@/lib/ai/ai-performance-monitoring-dashboard';
import { logger } from '@/lib/logger';

/**
 * AI Performance Monitoring Dashboard API
 * 
 * Provides comprehensive AI performance monitoring with real-time metrics and alerting
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action,
      metricType,
      value,
      unit,
      source,
      context,
      metadata,
      alertId,
      thresholds,
      organizationId = session.user.organizationId
    } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: action'
      }, { status: 400 });
    }

    logger.info('AI performance monitoring request', {
      action,
      organizationId,
      userId: session.user.id
    });

    let result;

    switch (action) {
      case 'record_metric':
        if (!metricType || value === undefined || !unit || !source) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: metricType, value, unit, source'
          }, { status: 400 });
        }

        await aiPerformanceMonitoringDashboard.recordMetric(
          metricType as MetricType,
          value,
          unit,
          source,
          organizationId,
          context || {},
          metadata || {}
        );

        result = { recorded: true };
        break;

      case 'get_dashboard':
        result = await aiPerformanceMonitoringDashboard.getPerformanceDashboard(organizationId);
        break;

      case 'get_system_health':
        result = aiPerformanceMonitoringDashboard.getSystemHealth();
        break;

      case 'get_alerts':
        const { resolved = false } = body;
        result = aiPerformanceMonitoringDashboard.getAlerts(organizationId, resolved);
        break;

      case 'resolve_alert':
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: alertId'
          }, { status: 400 });
        }

        const alertResolved = await aiPerformanceMonitoringDashboard.resolveAlert(alertId, organizationId);
        
        if (!alertResolved) {
          return NextResponse.json({
            success: false,
            error: 'Alert not found or already resolved'
          }, { status: 404 });
        }

        result = { resolved: true };
        break;

      case 'get_benchmark_results':
        result = aiPerformanceMonitoringDashboard.getBenchmarkResults();
        break;

      case 'get_performance_summary':
        result = await aiPerformanceMonitoringDashboard.getPerformanceSummary(organizationId);
        break;

      case 'update_alert_thresholds':
        if (!thresholds) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: thresholds'
          }, { status: 400 });
        }

        const thresholdMap = new Map<MetricType, number>(
          Object.entries(thresholds).map(([key, value]) => [key as MetricType, value as number])
        );

        await aiPerformanceMonitoringDashboard.updateAlertThresholds(organizationId, thresholdMap);
        result = { updated: true };
        break;

      case 'create_test_alert':
        // For testing purposes
        const testAlert = await aiPerformanceMonitoringDashboard.createAlert({
          type: AlertType.PERFORMANCE_DEGRADATION,
          severity: AlertSeverity.MEDIUM,
          title: 'Test Alert',
          message: 'This is a test alert for demonstration purposes',
          source: 'test_system',
          organizationId,
          context: {
            metricType: MetricType.RESPONSE_TIME,
            threshold: 5000,
            currentValue: 6500,
            component: 'test_component'
          }
        });

        result = testAlert;
        break;

      case 'simulate_metrics':
        // Generate sample metrics for testing
        const metrics = [
          { type: MetricType.RESPONSE_TIME, value: 1500 + Math.random() * 2000, unit: 'ms' },
          { type: MetricType.THROUGHPUT, value: 50 + Math.random() * 100, unit: 'requests/sec' },
          { type: MetricType.ERROR_RATE, value: Math.random() * 0.05, unit: 'percentage' },
          { type: MetricType.SUCCESS_RATE, value: 0.95 + Math.random() * 0.05, unit: 'percentage' },
          { type: MetricType.RESOURCE_UTILIZATION, value: 0.3 + Math.random() * 0.5, unit: 'percentage' }
        ];

        for (const metric of metrics) {
          await aiPerformanceMonitoringDashboard.recordMetric(
            metric.type,
            metric.value,
            metric.unit,
            'simulation',
            organizationId,
            { operation: 'simulation', environment: 'test' },
            { simulated: true }
          );
        }

        result = { simulated: metrics.length };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI performance monitoring API error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI performance monitoring operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action') || 'capabilities';

    switch (action) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            capabilities: {
              realTimeMetrics: true,
              performanceAnalytics: true,
              resourceMonitoring: true,
              alertingSystem: true,
              benchmarking: true,
              trendAnalysis: true,
              customThresholds: true,
              dashboardVisualization: true,
              historicalAnalysis: true,
              predictiveAnalytics: true,
              performanceOptimization: true,
              scalingRecommendations: true
            },
            supportedMetrics: Object.values(MetricType),
            alertTypes: Object.values(AlertType),
            alertSeverities: Object.values(AlertSeverity),
            features: [
              'Real-time AI performance metrics collection',
              'System resource utilization monitoring',
              'Task execution performance tracking',
              'Error rate and success rate analytics',
              'Response time and throughput monitoring',
              'Model performance degradation detection',
              'Automated alerting and notification system',
              'Historical performance analysis',
              'Comparative performance benchmarking',
              'Capacity planning and scaling recommendations',
              'Custom alert thresholds and rules',
              'WebSocket streaming for real-time updates',
              'Performance trend analysis and forecasting',
              'Automated performance optimization suggestions'
            ],
            metricTypes: [
              {
                type: 'response_time',
                description: 'Time taken to process AI requests',
                unit: 'milliseconds',
                threshold: 5000
              },
              {
                type: 'throughput',
                description: 'Number of requests processed per second',
                unit: 'requests/sec',
                threshold: 10
              },
              {
                type: 'error_rate',
                description: 'Percentage of failed requests',
                unit: 'percentage',
                threshold: 0.05
              },
              {
                type: 'success_rate',
                description: 'Percentage of successful requests',
                unit: 'percentage',
                threshold: 0.95
              },
              {
                type: 'resource_utilization',
                description: 'System resource usage percentage',
                unit: 'percentage',
                threshold: 0.8
              },
              {
                type: 'model_accuracy',
                description: 'ML model prediction accuracy',
                unit: 'percentage',
                threshold: 0.8
              },
              {
                type: 'system_uptime',
                description: 'System availability percentage',
                unit: 'percentage',
                threshold: 0.99
              },
              {
                type: 'queue_length',
                description: 'Number of pending tasks in queue',
                unit: 'count',
                threshold: 100
              }
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'dashboard_overview':
        const dashboard = await aiPerformanceMonitoringDashboard.getPerformanceDashboard(organizationId);
        
        return NextResponse.json({
          success: true,
          data: {
            overview: dashboard.overview,
            realTimeMetrics: dashboard.realTimeMetrics,
            activeAlerts: dashboard.alerts.length,
            systemHealth: aiPerformanceMonitoringDashboard.getSystemHealth().overall,
            lastUpdate: dashboard.timestamp
          },
          timestamp: new Date().toISOString()
        });

      case 'health_summary':
        const systemHealth = aiPerformanceMonitoringDashboard.getSystemHealth();
        
        return NextResponse.json({
          success: true,
          data: {
            overall: systemHealth.overall,
            componentCount: Object.keys(systemHealth.components).length,
            healthyComponents: Object.values(systemHealth.components)
              .filter(c => c.status === 'healthy').length,
            degradedComponents: Object.values(systemHealth.components)
              .filter(c => c.status === 'degraded').length,
            unhealthyComponents: Object.values(systemHealth.components)
              .filter(c => c.status === 'unhealthy').length,
            systemMetrics: systemHealth.systemMetrics,
            timestamp: systemHealth.timestamp
          },
          timestamp: new Date().toISOString()
        });

      case 'alerts_summary':
        const activeAlerts = aiPerformanceMonitoringDashboard.getAlerts(organizationId, false);
        const resolvedAlerts = aiPerformanceMonitoringDashboard.getAlerts(organizationId, true);
        
        const alertSummary = {
          total: activeAlerts.length + resolvedAlerts.length,
          active: activeAlerts.length,
          resolved: resolvedAlerts.length,
          bySeverity: {
            critical: activeAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
            high: activeAlerts.filter(a => a.severity === AlertSeverity.HIGH).length,
            medium: activeAlerts.filter(a => a.severity === AlertSeverity.MEDIUM).length,
            low: activeAlerts.filter(a => a.severity === AlertSeverity.LOW).length
          },
          byType: activeAlerts.reduce((acc, alert) => {
            acc[alert.type] = (acc[alert.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          recent: activeAlerts
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5)
            .map(alert => ({
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              title: alert.title,
              timestamp: alert.timestamp,
              source: alert.source
            }))
        };
        
        return NextResponse.json({
          success: true,
          data: alertSummary,
          timestamp: new Date().toISOString()
        });

      case 'benchmark_summary':
        const benchmarkResults = aiPerformanceMonitoringDashboard.getBenchmarkResults();
        const latest = benchmarkResults[benchmarkResults.length - 1];
        
        return NextResponse.json({
          success: true,
          data: {
            totalBenchmarks: benchmarkResults.length,
            latestBenchmark: latest,
            averageImprovement: benchmarkResults.reduce((sum, b) => sum + b.results.improvement, 0) / benchmarkResults.length || 0,
            trendDirection: latest && latest.results.improvement > 0 ? 'improving' : 'declining',
            nextBenchmark: new Date(Date.now() + 3600000) // 1 hour from now
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported GET action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI performance monitoring GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI performance monitoring information',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}