import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Validation schema for compliance rule creation
const createComplianceRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  country: z.string().min(2).max(3), // ISO country code
  regulation: z.string().min(1),
  category: z.enum(['DATA_PROTECTION', 'CONSENT_MANAGEMENT', 'COMMUNICATION_LIMITS', 'FINANCIAL_REGULATIONS', 'ANTI_MONEY_LAUNDERING', 'KNOW_YOUR_CUSTOMER', 'REPORTING_REQUIREMENTS', 'CROSS_BORDER_TRANSFERS', 'MARKET_CONDUCT', 'CONSUMER_PROTECTION']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  conditions: z.object({
    type: z.enum(['workflow_structure', 'communication_frequency', 'consent_tracking', 'data_retention', 'cross_border_data']),
    rules: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists']),
      value: z.any(),
      description: z.string().optional()
    })),
    customLogic: z.string().optional()
  }),
  actions: z.object({
    preventExecution: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    addAuditLog: z.boolean().optional(),
    notifyCompliance: z.boolean().optional(),
    modifyWorkflow: z.object({
      addSteps: z.array(z.any()).optional(),
      removeSteps: z.array(z.string()).optional(),
      modifyProperties: z.record(z.any()).optional()
    }).optional()
  }),
  isMandatory: z.boolean().default(true),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const regulation = searchParams.get('regulation');
    const category = searchParams.get('category');
    const isActive = searchParams.get('active');
    const limit = Number.parseInt(searchParams.get('limit') || '50');

    // Build where condition
    const whereCondition: any = {};

    if (country) {
      whereCondition.country = country;
    }

    if (regulation) {
      whereCondition.regulation = regulation;
    }

    if (category) {
      whereCondition.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      whereCondition.isActive = isActive === 'true';
    }

    // Add date filtering for active rules
    if (isActive === 'true') {
      whereCondition.effectiveFrom = { lte: new Date() };
      whereCondition.OR = [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } }
      ];
    }

    const rules = await prisma.workflowComplianceRule.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            checks: true,
            violations: true
          }
        }
      },
      orderBy: [
        { isMandatory: 'desc' },
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        country: rule.country,
        regulation: rule.regulation,
        category: rule.category,
        severity: rule.severity,
        conditions: rule.conditions,
        actions: rule.actions,
        isMandatory: rule.isMandatory,
        isActive: rule.isActive,
        effectiveFrom: rule.effectiveFrom,
        effectiveTo: rule.effectiveTo,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        creator: rule.creator,
        stats: {
          totalChecks: rule._count.checks,
          totalViolations: rule._count.violations
        }
      }))
    });

  } catch (error) {
    logger.error('Error getting compliance rules:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get compliance rules',
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

    // Check permissions - only ADMIN or OWNER can create compliance rules
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createComplianceRuleSchema.parse(body);

    // Create compliance rule
    const rule = await prisma.workflowComplianceRule.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        country: validatedData.country,
        regulation: validatedData.regulation,
        category: validatedData.category,
        severity: validatedData.severity,
        conditions: JSON.stringify(validatedData.conditions),
        actions: JSON.stringify(validatedData.actions),
        isMandatory: validatedData.isMandatory,
        effectiveFrom: new Date(validatedData.effectiveFrom),
        effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : null,
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...rule,
        conditions: validatedData.conditions,
        actions: validatedData.actions
      },
      message: 'Compliance rule created successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating compliance rule:', error);
    
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
        error: 'Failed to create compliance rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}