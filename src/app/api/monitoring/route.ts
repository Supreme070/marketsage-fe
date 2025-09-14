/**
 * Monitoring Orchestrator API Endpoints
 * ===================================== 
 * RESTful API for advanced system monitoring and alerting
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Dynamic import to prevent circular dependencies
import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';

/**
 * GET /api/monitoring - Get system health and monitoring data
 */
export async function GET(request: NextRequest) {
  const tracer = trace.getTracer('monitoring-api');
  
  return tracer.startActiveSpan('get-monitoring-data', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user has monitoring access (ADMIN, IT_ADMIN, or SUPER_ADMIN)
      const hasAccess = ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
      if (!hasAccess) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      const url = new URL(request.url);
      const type = url.searchParams.get('type');

      // Dynamic import to prevent circular dependencies
      const { advancedMonitoringOrchestrator } = await import('@/lib/monitoring/advanced-monitoring-orchestrator');

      switch (type) {
        case 'health':
          const health = await advancedMonitoringOrchestrator.getSystemHealth();
          span.setAttributes({
            'monitoring.type': 'health',
            'monitoring.overall_score': health.overall.score,
            'monitoring.status': health.overall.status
          });
          return NextResponse.json(health);

        case 'insights':
          const insights = await advancedMonitoringOrchestrator.getMonitoringInsights();
          span.setAttributes({
            'monitoring.type': 'insights',
            'monitoring.insights_count': insights.length
          });
          return NextResponse.json(insights);

        case 'alerts':
          const alerts = await advancedMonitoringOrchestrator.getActiveAlerts();
          span.setAttributes({
            'monitoring.type': 'alerts',
            'monitoring.active_alerts': alerts.length
          });
          return NextResponse.json(alerts);

        case 'rules':
          const rules = await advancedMonitoringOrchestrator.getMonitoringRules();
          span.setAttributes({
            'monitoring.type': 'rules',
            'monitoring.rules_count': rules.length
          });
          return NextResponse.json(rules);

        case 'stats':
          const stats = await advancedMonitoringOrchestrator.getExecutionStats();
          span.setAttributes({
            'monitoring.type': 'stats',
            'monitoring.total_tasks': stats.totalTasks,
            'monitoring.success_rate': stats.totalTasks > 0 ? (stats.successfulTasks / stats.totalTasks) * 100 : 0
          });
          return NextResponse.json(stats);

        default:
          // Return comprehensive monitoring overview
          const [systemHealth, monitoringInsights, activeAlerts, executionStats] = await Promise.all([
            advancedMonitoringOrchestrator.getSystemHealth(),
            advancedMonitoringOrchestrator.getMonitoringInsights(),
            advancedMonitoringOrchestrator.getActiveAlerts(),
            advancedMonitoringOrchestrator.getExecutionStats()
          ]);

          const overview = {
            health: systemHealth,
            insights: monitoringInsights.slice(0, 10), // Latest 10 insights
            alerts: activeAlerts,
            stats: executionStats,
            timestamp: new Date()
          };

          span.setAttributes({
            'monitoring.type': 'overview',
            'monitoring.health_score': systemHealth.overall.score,
            'monitoring.insights_count': monitoringInsights.length,
            'monitoring.alerts_count': activeAlerts.length
          });

          return NextResponse.json(overview);
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Monitoring API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to retrieve monitoring data' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * POST /api/monitoring - Create monitoring rules or acknowledge alerts
 */
export async function POST(request: NextRequest) {
  const tracer = trace.getTracer('monitoring-api');
  
  return tracer.startActiveSpan('post-monitoring-action', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check permissions
      const hasAccess = ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
      if (!hasAccess) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      const body = await request.json();
      const { action, data } = body;

      span.setAttributes({
        'monitoring.action': action,
        'monitoring.user_id': session.user.id,
        'monitoring.user_role': session.user.role || ''
      });

      // Dynamic import to prevent circular dependencies
      const { advancedMonitoringOrchestrator } = await import('@/lib/monitoring/advanced-monitoring-orchestrator');

      switch (action) {
        case 'acknowledge_alert':
          const { alertId } = data;
          if (!alertId) {
            return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
          }

          const acknowledged = await advancedMonitoringOrchestrator.acknowledgeAlert(
            alertId,
            session.user.id
          );

          if (!acknowledged) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
          }

          logger.info('Alert acknowledged', {
            alertId,
            userId: session.user.id,
            userRole: session.user.role
          });

          return NextResponse.json({ success: true, alertId });

        case 'resolve_alert':
          const { alertId: resolveAlertId } = data;
          if (!resolveAlertId) {
            return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
          }

          const resolved = await advancedMonitoringOrchestrator.resolveAlert(resolveAlertId);

          if (!resolved) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
          }

          logger.info('Alert resolved', {
            alertId: resolveAlertId,
            userId: session.user.id,
            userRole: session.user.role
          });

          return NextResponse.json({ success: true, alertId: resolveAlertId });

        case 'create_rule':
          const { rule } = data;
          if (!rule || !rule.name || !rule.type || !rule.conditions) {
            return NextResponse.json({ 
              error: 'Rule name, type, and conditions are required' 
            }, { status: 400 });
          }

          const ruleId = await advancedMonitoringOrchestrator.addMonitoringRule({
            name: rule.name,
            description: rule.description || '',
            type: rule.type,
            severity: rule.severity || 'medium',
            conditions: rule.conditions,
            actions: rule.actions || [],
            cooldownPeriod: rule.cooldownPeriod || 15
          });

          logger.info('Monitoring rule created', {
            ruleId,
            ruleName: rule.name,
            userId: session.user.id,
            userRole: session.user.role
          });

          return NextResponse.json({ success: true, ruleId });

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Monitoring POST API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to process monitoring action' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * PUT /api/monitoring - Update monitoring rules
 */
export async function PUT(request: NextRequest) {
  const tracer = trace.getTracer('monitoring-api');
  
  return tracer.startActiveSpan('put-monitoring-rule', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only SUPER_ADMIN and IT_ADMIN can modify rules
      const canModify = ['IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
      if (!canModify) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      const body = await request.json();
      const { ruleId, updates } = body;

      if (!ruleId) {
        return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
      }

      span.setAttributes({
        'monitoring.rule_id': ruleId,
        'monitoring.user_id': session.user.id,
        'monitoring.user_role': session.user.role || ''
      });

      // Dynamic import to prevent circular dependencies
      const { advancedMonitoringOrchestrator } = await import('@/lib/monitoring/advanced-monitoring-orchestrator');

      const updated = await advancedMonitoringOrchestrator.updateMonitoringRule(ruleId, updates);

      if (!updated) {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }

      logger.info('Monitoring rule updated', {
        ruleId,
        updates: Object.keys(updates),
        userId: session.user.id,
        userRole: session.user.role
      });

      return NextResponse.json({ success: true, ruleId });

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Monitoring PUT API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to update monitoring rule' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * DELETE /api/monitoring - Delete monitoring rules
 */
export async function DELETE(request: NextRequest) {
  const tracer = trace.getTracer('monitoring-api');
  
  return tracer.startActiveSpan('delete-monitoring-rule', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only SUPER_ADMIN can delete rules
      if (session.user.role !== 'SUPER_ADMIN') {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      const url = new URL(request.url);
      const ruleId = url.searchParams.get('ruleId');

      if (!ruleId) {
        return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
      }

      span.setAttributes({
        'monitoring.rule_id': ruleId,
        'monitoring.user_id': session.user.id,
        'monitoring.user_role': session.user.role || ''
      });

      // Dynamic import to prevent circular dependencies
      const { advancedMonitoringOrchestrator } = await import('@/lib/monitoring/advanced-monitoring-orchestrator');

      const deleted = await advancedMonitoringOrchestrator.deleteMonitoringRule(ruleId);

      if (!deleted) {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }

      logger.info('Monitoring rule deleted', {
        ruleId,
        userId: session.user.id,
        userRole: session.user.role
      });

      return NextResponse.json({ success: true, ruleId });

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Monitoring DELETE API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to delete monitoring rule' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}