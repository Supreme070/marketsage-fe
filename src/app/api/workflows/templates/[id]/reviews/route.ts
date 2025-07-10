import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowTemplateMarketplace } from '@/lib/workflow/template-marketplace';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for review creation
const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Add review
    const review = await workflowTemplateMarketplace.addReview(
      templateId,
      session.user.id,
      validatedData.rating,
      validatedData.comment
    );

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review added successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error adding template review:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to add template review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}