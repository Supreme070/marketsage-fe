import { NextRequest, NextResponse } from 'next/server';
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

    // Check permissions - only ADMIN or OWNER can deploy
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const workflowId = params.id;
    const { 
      versionId, 
      deploymentNotes, 
      skipValidation = false, 
      dryRun = false 
    } = await request.json();

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
    }

    // Deploy the version
    const deploymentResult = await workflowVersionControl.deployVersion(
      workflowId,
      versionId,
      {
        deployedBy: session.user.id,
        deploymentNotes,
        skipValidation,
        dryRun
      }
    );

    return NextResponse.json({
      success: true,
      data: deploymentResult,
      message: dryRun ? 'Deployment validation completed' : 'Workflow deployed successfully'
    });

  } catch (error) {
    logger.error('Error deploying workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to deploy workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get deployment history
    const deployments = await workflowVersionControl.getDeploymentHistory(workflowId, limit);

    return NextResponse.json({
      success: true,
      data: deployments,
      total: deployments.length
    });

  } catch (error) {
    logger.error('Error getting deployment history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get deployment history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}