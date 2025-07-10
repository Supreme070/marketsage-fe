import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowVersionControl } from '@/lib/workflow/version-control';
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
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get version history
    const versions = await workflowVersionControl.getVersionHistory(workflowId, {
      includeArchived,
      status,
      limit
    });

    return NextResponse.json({
      success: true,
      data: versions,
      total: versions.length
    });

  } catch (error) {
    logger.error('Error getting workflow versions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get workflow versions',
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

    // Check permissions - only ADMIN or OWNER can create versions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const workflowId = params.id;
    const { definition, description, status, changelog, tags } = await request.json();

    if (!definition) {
      return NextResponse.json({ error: 'Workflow definition is required' }, { status: 400 });
    }

    // Create new version
    const newVersion = await workflowVersionControl.createVersion(workflowId, definition, {
      description,
      status: status || 'draft',
      changelog: changelog || [],
      tags: tags || [],
      createdBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: newVersion,
      message: 'Workflow version created successfully'
    });

  } catch (error) {
    logger.error('Error creating workflow version:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create workflow version',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}