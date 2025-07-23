import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const severity = searchParams.get('severity');
    const isResolved = searchParams.get('resolved');
    const limit = Number.parseInt(searchParams.get('limit') || '50');

    // Build where condition
    const whereCondition: any = {};

    if (workflowId) {
      whereCondition.workflowId = workflowId;
    }

    if (severity) {
      whereCondition.severity = severity;
    }

    if (isResolved !== null && isResolved !== undefined) {
      whereCondition.isResolved = isResolved === 'true';
    }

    const alerts = await prisma.workflowCostAlert.findMany({
      where: whereCondition,
      include: {
        workflow: {
          select: {
            name: true
          }
        },
        budget: {
          select: {
            name: true,
            budgetAmount: true
          }
        },
        resolver: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: alerts.map(alert => ({
        id: alert.id,
        workflowId: alert.workflowId,
        workflowName: alert.workflow.name,
        budgetId: alert.budgetId,
        budgetName: alert.budget?.name,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        thresholdValue: alert.thresholdValue,
        currentValue: alert.currentValue,
        projectedValue: alert.projectedValue,
        isResolved: alert.isResolved,
        resolvedAt: alert.resolvedAt,
        resolvedBy: alert.resolver?.name,
        emailSent: alert.emailSent,
        slackSent: alert.slackSent,
        webhookSent: alert.webhookSent,
        createdAt: alert.createdAt,
        metadata: alert.metadata
      }))
    });

  } catch (error) {
    logger.error('Error getting cost alerts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get cost alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId, action } = await request.json();

    if (!alertId || !action) {
      return NextResponse.json({ error: 'Alert ID and action are required' }, { status: 400 });
    }

    switch (action) {
      case 'resolve':
        await prisma.workflowCostAlert.update({
          where: { id: alertId },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy: session.user.id
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully'
        });

      case 'unresolve':
        await prisma.workflowCostAlert.update({
          where: { id: alertId },
          data: {
            isResolved: false,
            resolvedAt: null,
            resolvedBy: null
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Alert marked as unresolved'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error updating cost alert:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update cost alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}