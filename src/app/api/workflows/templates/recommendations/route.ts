import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowTemplateMarketplace } from '@/lib/workflow/template-marketplace';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    // Get personalized recommendations
    const recommendations = await workflowTemplateMarketplace.getRecommendations(
      session.user.id,
      limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    logger.error('Error getting template recommendations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get template recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}