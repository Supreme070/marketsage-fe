import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Validation schema for cost rule creation
const createCostRuleSchema = z.object({
  workflowId: z.string().optional(), // null for global rules
  name: z.string().min(1),
  description: z.string().optional(),
  costType: z.enum(['EMAIL_SEND', 'SMS_SEND', 'WHATSAPP_SEND', 'API_CALL', 'WEBHOOK_CALL', 'DATA_STORAGE', 'COMPUTE_TIME', 'EXTERNAL_SERVICE', 'CUSTOM']).optional(),
  provider: z.string().optional(),
  region: z.string().optional(),
  unitCost: z.number().positive(),
  currency: z.string().default('USD'),
  tieredPricing: z.array(z.object({
    minVolume: z.number(),
    maxVolume: z.number().optional(),
    unitCost: z.number()
  })).optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  priority: z.number().default(0)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const costType = searchParams.get('costType');
    const provider = searchParams.get('provider');
    const includeGlobal = searchParams.get('includeGlobal') === 'true';

    // Build where condition
    const whereCondition: any = {
      isActive: true,
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } }
      ]
    };

    if (workflowId || !includeGlobal) {
      whereCondition.workflowId = workflowId || { not: null };
    }

    if (costType) {
      whereCondition.costType = costType;
    }

    if (provider) {
      whereCondition.provider = provider;
    }

    const rules = await prisma.workflowCostRule.findMany({
      where: whereCondition,
      include: {
        workflow: {
          select: {
            name: true
          }
        },
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { workflowId: 'desc' }, // Workflow-specific rules first
        { priority: 'desc' }    // Higher priority first
      ]
    });

    return NextResponse.json({
      success: true,
      data: rules.map(rule => ({
        ...rule,
        tieredPricing: rule.tieredPricing ? JSON.parse(rule.tieredPricing as string) : null,
        workflowName: rule.workflow?.name,
        creatorName: rule.creator.name
      }))
    });

  } catch (error) {
    logger.error('Error getting cost rules:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get cost rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only ADMIN or OWNER can create cost rules
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createCostRuleSchema.parse(body);

    // Create cost rule
    const costRule = await prisma.workflowCostRule.create({
      data: {
        workflowId: validatedData.workflowId || null,
        name: validatedData.name,
        description: validatedData.description,
        costType: validatedData.costType || null,
        provider: validatedData.provider,
        region: validatedData.region,
        unitCost: validatedData.unitCost,
        currency: validatedData.currency,
        tieredPricing: validatedData.tieredPricing ? JSON.stringify(validatedData.tieredPricing) : null,
        effectiveFrom: validatedData.effectiveFrom ? new Date(validatedData.effectiveFrom) : new Date(),
        effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : null,
        priority: validatedData.priority,
        createdBy: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: costRule,
      message: 'Cost rule created successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating cost rule:', error);
    
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
        error: 'Failed to create cost rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}