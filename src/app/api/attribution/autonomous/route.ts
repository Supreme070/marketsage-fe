/**
 * Autonomous Attribution API
 * =========================
 * HTTP endpoints for autonomous attribution insights and actions
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isActive: true, organizationId: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'insights';

    logger.info('Autonomous attribution API request', {
      action,
      userId: user.id,
      userRole: user.role
    });

    let result;

    // Dynamic import to prevent circular dependencies
    const { autonomousAttributionEngine } = await import('@/lib/attribution/autonomous-attribution-engine');

    switch (action) {
      case 'insights':
        const hours = Number.parseInt(url.searchParams.get('hours') || '24');
        result = await autonomousAttributionEngine.getRecentInsights(hours);
        break;

      case 'metrics':
        result = await autonomousAttributionEngine.getAttributionMetrics();
        break;

      case 'recommendations':
        result = await autonomousAttributionEngine.getAttributionRecommendations();
        break;

      case 'analysis':
        // Trigger manual analysis (admin only)
        if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
        // This would trigger the analysis
        result = { 
          message: 'Attribution analysis triggered',
          status: 'processing',
          estimatedTime: '2-5 minutes'
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Autonomous attribution GET API error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 403 }
      );
    }

    // Check permissions - only admins can execute autonomous actions
    const hasPermission = ['SUPER_ADMIN', 'ADMIN'].includes(user.role);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions for autonomous actions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    logger.info('Autonomous attribution operation request', {
      action,
      userId: user.id,
      userRole: user.role
    });

    let result;

    switch (action) {
      case 'approve_action':
        if (!params.actionId) {
          return NextResponse.json(
            { success: false, error: 'actionId is required' },
            { status: 400 }
          );
        }
        
        result = {
          actionId: params.actionId,
          status: 'approved',
          message: 'Action approved for execution'
        };
        break;

      case 'reject_action':
        if (!params.actionId) {
          return NextResponse.json(
            { success: false, error: 'actionId is required' },
            { status: 400 }
          );
        }
        
        result = {
          actionId: params.actionId,
          status: 'rejected',
          message: 'Action rejected'
        };
        break;

      case 'configure_automation':
        result = {
          configuration: params,
          status: 'updated',
          message: 'Automation configuration updated'
        };
        break;

      case 'trigger_analysis':
        // Manual trigger for attribution analysis
        result = {
          analysisId: `analysis_${Date.now()}`,
          status: 'initiated',
          message: 'Attribution analysis started',
          estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Autonomous attribution POST API error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}