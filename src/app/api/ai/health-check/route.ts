/**
 * AI System Health Check API
 * =========================
 * Comprehensive health check for the AI task execution system
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { taskExecutionMonitor } from '@/lib/ai/task-execution-monitor';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const startTime = Date.now();

    // Basic authentication check
    const isAuthenticated = !!session?.user;
    const userRole = session?.user?.role || 'UNAUTHENTICATED';
    const hasAdminPrivileges = ['SUPER_ADMIN', 'ADMIN', 'IT_ADMIN'].includes(userRole);

    // Database connectivity check
    let dbStatus = 'unknown';
    let dbError = null;
    try {
      await prisma.user.findFirst({ select: { id: true } });
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
      dbError = error instanceof Error ? error.message : String(error);
    }

    // Check if required models exist
    const modelChecks = {
      user: false,
      task: false,
      taskComment: false,
      workflow: false,
      emailCampaign: false,
      userActivity: false
    };

    try {
      // Test basic operations on each model
      const userCount = await prisma.user.count();
      modelChecks.user = userCount >= 0;

      const taskCount = await prisma.task.count();
      modelChecks.task = taskCount >= 0;

      const commentCount = await prisma.taskComment.count();
      modelChecks.taskComment = commentCount >= 0;

      const workflowCount = await prisma.workflow.count();
      modelChecks.workflow = workflowCount >= 0;

      const campaignCount = await prisma.emailCampaign.count();
      modelChecks.emailCampaign = campaignCount >= 0;

      const activityCount = await prisma.userActivity.count();
      modelChecks.userActivity = activityCount >= 0;
    } catch (error) {
      logger.warn('Model checks failed', { error: error instanceof Error ? error.message : String(error) });
    }

    // Environment configuration check
    const envConfig = {
      useOpenAiOnly: process.env.USE_OPENAI_ONLY === 'true',
      supremeAiMode: process.env.SUPREME_AI_MODE || 'unknown',
      openAiApiKey: !!process.env.OPENAI_API_KEY,
      openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      nodeEnv: process.env.NODE_ENV || 'unknown'
    };

    // Task execution monitoring stats
    const monitoringStats = taskExecutionMonitor.getOverallMetrics();
    const healthStatus = taskExecutionMonitor.getHealthStatus();

    // AI system configuration validation
    const aiSystemConfig = {
      taskExecutionEnabled: !envConfig.useOpenAiOnly && envConfig.supremeAiMode === 'enabled',
      taskExecutionForRole: hasAdminPrivileges,
      localAiEnabled: envConfig.supremeAiMode === 'enabled',
      fallbackToOpenAi: envConfig.useOpenAiOnly || envConfig.supremeAiMode === 'disabled'
    };

    // Overall system health
    const responseTime = Date.now() - startTime;
    const allModelsWorking = Object.values(modelChecks).every(check => check);
    const systemHealthy = dbStatus === 'connected' && allModelsWorking && !dbError;

    const healthCheckResult = {
      timestamp: new Date().toISOString(),
      responseTime,
      overall: {
        status: systemHealthy ? 'healthy' : 'unhealthy',
        version: '3.0-enhanced',
        systemReady: systemHealthy && aiSystemConfig.taskExecutionEnabled
      },
      authentication: {
        isAuthenticated,
        userRole,
        hasAdminPrivileges,
        canExecuteTasks: isAuthenticated && hasAdminPrivileges && aiSystemConfig.taskExecutionEnabled
      },
      database: {
        status: dbStatus,
        error: dbError,
        models: modelChecks,
        allModelsWorking
      },
      environment: envConfig,
      aiSystem: aiSystemConfig,
      monitoring: {
        healthStatus,
        taskStats: monitoringStats,
        metricsCollected: Object.keys(monitoringStats).length > 0
      },
      recommendations: [
        ...(!systemHealthy ? ['Fix database connectivity issues'] : []),
        ...(!aiSystemConfig.taskExecutionEnabled ? ['Enable AI task execution by setting USE_OPENAI_ONLY=false and SUPREME_AI_MODE=enabled'] : []),
        ...(!hasAdminPrivileges && isAuthenticated ? ['Current user needs ADMIN, IT_ADMIN, or SUPER_ADMIN role for task execution'] : []),
        ...(!isAuthenticated ? ['User must be authenticated to use AI task execution'] : []),
        ...healthStatus.recommendations
      ],
      debug: {
        sessionUser: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        } : null,
        requestHeaders: {
          userAgent: request.headers.get('user-agent'),
          host: request.headers.get('host')
        }
      }
    };

    // Log the health check
    logger.info('AI System Health Check', {
      overall: healthCheckResult.overall,
      userRole,
      canExecuteTasks: healthCheckResult.authentication.canExecuteTasks,
      responseTime
    });

    return NextResponse.json(healthCheckResult, {
      status: systemHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Health check failed', { error: errorMessage });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: {
        status: 'error',
        version: '3.0-enhanced'
      },
      error: errorMessage,
      message: 'Health check system encountered an error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'Use GET for health checks'
  }, { status: 405 });
}