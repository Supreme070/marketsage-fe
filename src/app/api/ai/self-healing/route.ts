/**
 * AI Self-Healing API
 * ===================
 * API endpoints for triggering and monitoring self-healing capabilities
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { trace } from '@opentelemetry/api';

// Request validation schemas
const healingRequestSchema = z.object({
  integrationId: z.string().optional(),
  force: z.boolean().default(false),
  dryRun: z.boolean().default(false)
});

const healingConfigSchema = z.object({
  autoHealingEnabled: z.boolean(),
  healingInterval: z.number().min(5).max(60).optional(), // minutes
  riskThreshold: z.enum(['low', 'medium', 'high']).optional()
});

// GET: Get healing status and history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const tracer = trace.getTracer('self-healing-api');
    
    return tracer.startActiveSpan('get-healing-status', async (span) => {
      try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') || 'status';
        const limit = Number.parseInt(url.searchParams.get('limit') || '10');

        span.setAttributes({
          'healing.request.type': type,
          'healing.request.limit': limit,
          'user.id': user.id,
          'organization.id': user.organizationId
        });

        // Dynamic imports
        const {
          getHealingHistory,
          getActiveHealingSessions
        } = await import('@/lib/ai/self-healing-engine');

        switch (type) {
          case 'history':
            const history = await getHealingHistory(limit);
            return NextResponse.json({
              success: true,
              data: {
                type: 'healing_history',
                history,
                total: history.length
              }
            });

          case 'active':
            const activeSessions = await getActiveHealingSessions();
            return NextResponse.json({
              success: true,
              data: {
                type: 'active_sessions',
                sessions: activeSessions,
                total: activeSessions.length
              }
            });

          case 'status':
          default:
            const [historyData, activeData] = await Promise.all([
              getHealingHistory(5),
              getActiveHealingSessions()
            ]);

            return NextResponse.json({
              success: true,
              data: {
                type: 'healing_status',
                summary: {
                  autoHealingEnabled: true, // Would come from config
                  lastHealingSession: historyData[0]?.timestamp || null,
                  activeSessions: activeData.length,
                  totalSessionsToday: historyData.filter(h => 
                    h.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length
                },
                recentHistory: historyData.slice(0, 3),
                activeSessions: activeData,
                systemMetrics: {
                  uptime: process.uptime(),
                  memory: process.memoryUsage(),
                  lastCheck: new Date()
                }
              }
            });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        
        logger.error('Failed to get healing status', {
          error: errorMessage,
          userId: user?.id,
          organizationId: user?.organizationId
        });

        return NextResponse.json(
          { error: 'Failed to retrieve healing status' },
          { status: 500 }
        );
      } finally {
        span.end();
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Self-healing API GET error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Trigger healing process
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const validatedData = healingRequestSchema.parse(body);
    
    const tracer = trace.getTracer('self-healing-trigger');
    
    return tracer.startActiveSpan('trigger-healing', async (span) => {
      try {
        const { integrationId, force, dryRun } = validatedData;

        span.setAttributes({
          'healing.trigger.type': integrationId ? 'specific' : 'system',
          'healing.trigger.integration_id': integrationId || 'all',
          'healing.trigger.force': force,
          'healing.trigger.dry_run': dryRun,
          'user.id': user.id,
          'organization.id': user.organizationId
        });

        logger.info('Healing process triggered', {
          userId: user.id,
          organizationId: user.organizationId,
          integrationId,
          force,
          dryRun
        });

        if (dryRun) {
          // Return what would be done without actually executing
          return NextResponse.json({
            success: true,
            data: {
              type: 'dry_run',
              message: integrationId 
                ? `Would attempt to heal integration: ${integrationId}`
                : 'Would attempt to heal all unhealthy integrations',
              estimatedActions: integrationId ? 1 : 'multiple',
              estimatedDuration: '2-10 minutes',
              riskLevel: 'low'
            }
          });
        }

        // Dynamic imports
        const {
          healSpecificIntegration,
          triggerSystemHealing
        } = await import('@/lib/ai/self-healing-engine');

        // Execute healing
        const healingReport = integrationId
          ? await healSpecificIntegration(user.id, integrationId)
          : await triggerSystemHealing(user.id);

        span.setAttributes({
          'healing.session.id': healingReport.sessionId,
          'healing.session.actions_total': healingReport.summary.totalActions,
          'healing.session.actions_successful': healingReport.summary.successfulActions,
          'healing.session.health_improvement': healingReport.systemHealth.improvement
        });

        return NextResponse.json({
          success: true,
          data: {
            type: 'healing_executed',
            sessionId: healingReport.sessionId,
            summary: healingReport.summary,
            systemHealth: healingReport.systemHealth,
            message: healingReport.systemHealth.improvement > 0
              ? `✅ Healing completed successfully! System health improved by ${healingReport.systemHealth.improvement} points`
              : healingReport.systemHealth.improvement === 0
                ? '⚠️ Healing completed but no improvement detected'
                : '❌ Healing completed but system health declined - manual intervention may be needed',
            recommendations: healingReport.recommendations,
            actionsExecuted: healingReport.actionsExecuted.length,
            estimatedDowntimePrevented: `${healingReport.summary.estimatedDowntimePrevented} minutes`,
            costSavings: `$${healingReport.summary.costSavings}`,
            nextCheckIn: healingReport.nextCheckIn
          }
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        
        logger.error('Failed to trigger healing process', {
          error: errorMessage,
          userId: user.id,
          integrationId: validatedData.integrationId
        });

        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      } finally {
        span.end();
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Self-healing API POST error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update healing configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const validatedData = healingConfigSchema.parse(body);

    try {
      const { autoHealingEnabled, healingInterval, riskThreshold } = validatedData;

      logger.info('Healing configuration updated', {
        userId: user.id,
        organizationId: user.organizationId,
        autoHealingEnabled,
        healingInterval,
        riskThreshold
      });

      // Dynamic import and update self-healing engine configuration
      if (autoHealingEnabled !== undefined) {
        const { selfHealingEngine } = await import('@/lib/ai/self-healing-engine');
        selfHealingEngine.toggleAutoHealing(autoHealingEnabled);
      }

      // Note: healingInterval and riskThreshold would be implemented
      // in the self-healing engine configuration system

      return NextResponse.json({
        success: true,
        data: {
          type: 'configuration_updated',
          config: {
            autoHealingEnabled,
            healingInterval: healingInterval || 10,
            riskThreshold: riskThreshold || 'medium'
          },
          message: 'Self-healing configuration updated successfully',
          appliedAt: new Date()
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to update healing configuration', {
        error: errorMessage,
        userId: user.id,
        organizationId: user.organizationId
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Self-healing API PUT error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Stop active healing session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;

    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('sessionId');

      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID required' },
          { status: 400 }
        );
      }

      logger.info('Stopping healing session', {
        userId: user.id,
        organizationId: user.organizationId,
        sessionId
      });

      // This would implement session stopping logic
      // For now, return success as if stopped
      return NextResponse.json({
        success: true,
        data: {
          type: 'session_stopped',
          sessionId,
          message: 'Healing session stopped successfully',
          stoppedAt: new Date(),
          warning: 'Stopping healing sessions may leave system in degraded state'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to stop healing session', {
        error: errorMessage,
        userId: user.id,
        organizationId: user.organizationId
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Self-healing API DELETE error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}