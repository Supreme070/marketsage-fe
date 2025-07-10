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

    const workflowId = params.id;
    const { fromVersionId, toVersionId } = await request.json();

    if (!fromVersionId || !toVersionId) {
      return NextResponse.json(
        { error: 'Both fromVersionId and toVersionId are required' }, 
        { status: 400 }
      );
    }

    // Compare versions
    const comparison = await workflowVersionControl.compareVersions(
      workflowId,
      fromVersionId,
      toVersionId
    );

    return NextResponse.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    logger.error('Error comparing workflow versions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to compare workflow versions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}