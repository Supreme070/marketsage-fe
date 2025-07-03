/**
 * Action Plans API Endpoints
 * ===========================
 * 
 * CRUD operations for AI-generated action plans
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlanManager } from '@/lib/actions/action-plan-manager';
import { ActionPlanBuilder, ActionStatus, ActionType, RiskLevel } from '@/lib/actions/action-plan-interface';
import { EventPriority } from '@/lib/events/event-bus';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const CreateActionPlanSchema = z.object({
  contactId: z.string(),
  organizationId: z.string(),
  actionType: z.nativeEnum(ActionType),
  actionName: z.string(),
  actionDescription: z.string(),
  aiConfidence: z.number().min(0).max(1).optional(),
  aiReasoning: z.string().optional(),
  priority: z.nativeEnum(EventPriority).default(EventPriority.NORMAL),
  riskLevel: z.nativeEnum(RiskLevel).default(RiskLevel.LOW),
  scheduledAt: z.string().transform(str => new Date(str)).optional(),
  expiresAt: z.string().transform(str => new Date(str)).optional(),
  parameters: z.record(z.any()).default({}),
  context: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  estimatedImpact: z.number().min(0).max(1).optional(),
  costEstimate: z.number().optional()
});

const UpdateActionPlanSchema = z.object({
  actionName: z.string().optional(),
  actionDescription: z.string().optional(),
  status: z.nativeEnum(ActionStatus).optional(),
  priority: z.nativeEnum(EventPriority).optional(),
  scheduledAt: z.string().transform(str => new Date(str)).optional(),
  expiresAt: z.string().transform(str => new Date(str)).optional(),
  parameters: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

const QueryActionPlansSchema = z.object({
  contactId: z.string().optional(),
  organizationId: z.string().optional(),
  status: z.union([
    z.nativeEnum(ActionStatus),
    z.array(z.nativeEnum(ActionStatus))
  ]).optional(),
  actionType: z.union([
    z.nativeEnum(ActionType),
    z.array(z.nativeEnum(ActionType))
  ]).optional(),
  riskLevel: z.union([
    z.nativeEnum(RiskLevel),
    z.array(z.nativeEnum(RiskLevel))
  ]).optional(),
  requiresApproval: z.boolean().optional(),
  createdBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().transform(str => new Date(str)).optional(),
  dateTo: z.string().transform(str => new Date(str)).optional(),
  limit: z.number().max(1000).default(100),
  offset: z.number().default(0)
});

const ActionApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  reason: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = CreateActionPlanSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid action plan data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check organization access
    if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== data.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized - Access denied to organization' },
        { status: 403 }
      );
    }

    // Build action plan using builder pattern
    const builder = new ActionPlanBuilder(data.contactId, data.organizationId, data.actionType)
      .withName(data.actionName)
      .withDescription(data.actionDescription)
      .withPriority(data.priority)
      .withRiskLevel(data.riskLevel)
      .withParameters(data.parameters)
      .withContext(data.context)
      .withTags(data.tags)
      .withMetadata(data.metadata);

    if (data.aiConfidence && data.aiReasoning) {
      builder.withAIDecision(data.aiConfidence, data.aiReasoning);
    }

    if (data.scheduledAt) {
      builder.withSchedule(data.scheduledAt);
    }

    if (data.expiresAt) {
      builder.withExpiration(data.expiresAt);
    }

    if (data.estimatedImpact) {
      builder.withEstimatedImpact(data.estimatedImpact);
    }

    if (data.costEstimate) {
      builder.withCostEstimate(data.costEstimate);
    }

    // Set created by
    if (!data.aiConfidence) {
      builder.withMetadata({ ...data.metadata, createdBy: session.user.id });
    }

    const actionPlan = builder.build();

    // Create the action plan
    const actionPlanId = await ActionPlanManager.createActionPlan(actionPlan);

    logger.info('Action plan created via API', {
      actionPlanId,
      contactId: data.contactId,
      actionType: data.actionType,
      createdBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        actionPlanId,
        status: actionPlan.status,
        requiresApproval: actionPlan.requiresApproval,
        priority: actionPlan.priority,
        riskLevel: actionPlan.riskLevel
      }
    });

  } catch (error) {
    logger.error('Failed to create action plan via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to create action plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const queryParams: any = {};
    
    searchParams.forEach((value, key) => {
      if (key === 'status' || key === 'actionType' || key === 'riskLevel') {
        // Handle array parameters
        if (value.includes(',')) {
          queryParams[key] = value.split(',');
        } else {
          queryParams[key] = value;
        }
      } else if (key === 'tags') {
        queryParams[key] = value.split(',');
      } else if (key === 'requiresApproval') {
        queryParams[key] = value === 'true';
      } else if (key === 'limit' || key === 'offset') {
        queryParams[key] = Number.parseInt(value);
      } else {
        queryParams[key] = value;
      }
    });

    const validationResult = QueryActionPlansSchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const query = validationResult.data;

    // Set organization filter for non-super-admin users
    if (session.user.role !== 'SUPER_ADMIN') {
      query.organizationId = session.user.organizationId;
    }

    // Build date range if provided
    if (query.dateFrom || query.dateTo) {
      query.dateRange = {
        from: query.dateFrom || new Date('1970-01-01'),
        to: query.dateTo || new Date()
      };
    }

    // Query action plans
    const actionPlans = await ActionPlanManager.queryActionPlans(query);

    return NextResponse.json({
      success: true,
      data: {
        actionPlans,
        total: actionPlans.length,
        limit: query.limit,
        offset: query.offset
      }
    });

  } catch (error) {
    logger.error('Failed to query action plans via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to query action plans',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const actionPlanId = searchParams.get('id');
    
    if (!actionPlanId) {
      return NextResponse.json(
        { error: 'Action plan ID is required' },
        { status: 400 }
      );
    }

    // Get existing action plan
    const existingPlan = await ActionPlanManager.getActionPlan(actionPlanId);
    
    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Action plan not found' },
        { status: 404 }
      );
    }

    // Check organization access
    if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== existingPlan.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized - Access denied to organization' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = UpdateActionPlanSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid update data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Handle status updates
    if (updateData.status) {
      await ActionPlanManager.updateActionPlanStatus(actionPlanId, updateData.status);
    }

    // Handle other updates
    const updateFields: any = {};
    
    if (updateData.actionName) updateFields.actionName = updateData.actionName;
    if (updateData.actionDescription) updateFields.actionDescription = updateData.actionDescription;
    if (updateData.priority) updateFields.priority = updateData.priority;
    if (updateData.scheduledAt) updateFields.scheduledAt = updateData.scheduledAt;
    if (updateData.expiresAt) updateFields.expiresAt = updateData.expiresAt;

    // Update action data
    if (updateData.parameters || updateData.context || updateData.tags || updateData.metadata) {
      const existingActionData = existingPlan.metadata || {};
      updateFields.actionData = {
        ...existingActionData,
        ...(updateData.parameters && { parameters: updateData.parameters }),
        ...(updateData.context && { context: updateData.context }),
        ...(updateData.tags && { tags: updateData.tags }),
        ...(updateData.metadata && { metadata: updateData.metadata })
      };
    }

    if (Object.keys(updateFields).length > 0) {
      updateFields.updatedAt = new Date();
      
      await prisma.aIActionPlan.update({
        where: { id: actionPlanId },
        data: updateFields
      });
    }

    logger.info('Action plan updated via API', {
      actionPlanId,
      updatedBy: session.user.id,
      updateFields: Object.keys(updateFields)
    });

    return NextResponse.json({
      success: true,
      message: 'Action plan updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update action plan via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to update action plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and above can delete action plans
    if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - ADMIN access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const actionPlanId = searchParams.get('id');
    
    if (!actionPlanId) {
      return NextResponse.json(
        { error: 'Action plan ID is required' },
        { status: 400 }
      );
    }

    // Get existing action plan
    const existingPlan = await ActionPlanManager.getActionPlan(actionPlanId);
    
    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Action plan not found' },
        { status: 404 }
      );
    }

    // Check organization access
    if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== existingPlan.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized - Access denied to organization' },
        { status: 403 }
      );
    }

    // Cancel the action plan instead of deleting
    await ActionPlanManager.cancelActionPlan(actionPlanId, `Cancelled by ${session.user.name || session.user.email}`);

    logger.info('Action plan cancelled via API', {
      actionPlanId,
      cancelledBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Action plan cancelled successfully'
    });

  } catch (error) {
    logger.error('Failed to cancel action plan via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to cancel action plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}