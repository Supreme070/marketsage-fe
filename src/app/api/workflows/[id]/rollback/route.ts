import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowVersionControl } from '@/lib/workflow/version-control';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only ADMIN or OWNER can rollback
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const workflowId = params.id;
    const { 
      targetVersionId, 
      reason, 
      forceRollback = false 
    } = await request.json();

    if (!targetVersionId) {
      return NextResponse.json({ error: 'Target version ID is required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Rollback reason is required' }, { status: 400 });
    }

    // Perform rollback
    const rollbackResult = await workflowVersionControl.rollbackToVersion(
      workflowId,
      targetVersionId,
      {
        rolledBackBy: session.user.id,
        reason,
        forceRollback
      }
    );

    return NextResponse.json({
      success: true,
      data: rollbackResult,
      message: 'Workflow rolled back successfully'
    });

  } catch (error) {
    logger.error('Error rolling back workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to rollback workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}