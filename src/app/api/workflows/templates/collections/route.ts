import { type NextRequest, NextResponse } from 'next/server';
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

    // Get featured collections
    const collections = await workflowTemplateMarketplace.getFeaturedCollections();

    return NextResponse.json({
      success: true,
      data: collections
    });

  } catch (error) {
    logger.error('Error getting template collections:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get template collections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}