import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowCostTracker } from '@/lib/workflow/cost-tracking';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for budget creation
const createBudgetSchema = z.object({
  budgetAmount: z.number().positive(),
  currency: z.string().default('USD'),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  warningThreshold: z.number().min(0).max(100).default(75),
  criticalThreshold: z.number().min(0).max(100).default(90),
  pauseOnExceeded: z.boolean().default(false),
  autoRenew: z.boolean().default(false)
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

    // Check permissions - only ADMIN or OWNER can create budgets
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const workflowId = params.id;
    const body = await request.json();
    const validatedData = createBudgetSchema.parse(body);

    // Create budget
    const budgetId = await workflowCostTracker.createBudget(
      workflowId,
      {
        budgetAmount: validatedData.budgetAmount,
        currency: validatedData.currency,
        period: validatedData.period,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        warningThreshold: validatedData.warningThreshold,
        criticalThreshold: validatedData.criticalThreshold,
        pauseOnExceeded: validatedData.pauseOnExceeded,
        autoRenew: validatedData.autoRenew
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: { budgetId },
      message: 'Budget created successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating workflow budget:', error);
    
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
        error: 'Failed to create workflow budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}