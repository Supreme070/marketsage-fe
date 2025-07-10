import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowCostTracker } from '@/lib/workflow/cost-tracking';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = params.id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'summary':
        const summary = await workflowCostTracker.getCostSummary(workflowId);
        return NextResponse.json({
          success: true,
          data: summary
        });

      case 'projection':
        const period = searchParams.get('period') || 'MONTHLY';
        const projection = await workflowCostTracker.generateCostProjection(workflowId, period);
        return NextResponse.json({
          success: true,
          data: projection
        });

      case 'recommendations':
        const recommendations = await workflowCostTracker.getCostOptimizationRecommendations(workflowId);
        return NextResponse.json({
          success: true,
          data: recommendations
        });

      default:
        // Default to summary
        const defaultSummary = await workflowCostTracker.getCostSummary(workflowId);
        return NextResponse.json({
          success: true,
          data: defaultSummary
        });
    }

  } catch (error) {
    logger.error('Error getting workflow costs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get workflow costs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only ADMIN or OWNER can record costs
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const workflowId = params.id;
    const { costType, amount, quantity, unitCost, description, provider, region, executionId } = await request.json();

    if (!costType || amount === undefined || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required cost data' }, { status: 400 });
    }

    // Record the cost
    await workflowCostTracker.recordCost(workflowId, executionId, {
      costType,
      amount,
      quantity,
      unitCost: unitCost || (amount / quantity),
      description,
      provider,
      region
    });

    return NextResponse.json({
      success: true,
      message: 'Cost recorded successfully'
    });

  } catch (error) {
    logger.error('Error recording workflow cost:', error);
    return NextResponse.json(
      { 
        error: 'Failed to record workflow cost',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}