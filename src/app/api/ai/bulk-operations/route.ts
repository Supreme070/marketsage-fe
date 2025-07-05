/**
 * Bulk Operations API Endpoint
 * ============================
 * API for executing and managing bulk operations via AI
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Dynamic imports to prevent circular dependencies during build

// Request validation schemas
const bulkOperationRequestSchema = z.object({
  operation: z.enum(['contact_import', 'contact_update', 'contact_export', 'campaign_send']),
  data: z.array(z.any()).optional(),
  filters: z.record(z.any()).optional(),
  updates: z.record(z.any()).optional(),
  campaignId: z.string().optional(),
  recipients: z.object({
    type: z.enum(['all', 'lists', 'segments', 'contacts']),
    ids: z.array(z.string()).optional()
  }).optional(),
  options: z.object({
    batchSize: z.number().min(1).max(1000).default(100),
    continueOnError: z.boolean().default(true),
    validateData: z.boolean().default(true),
    dryRun: z.boolean().default(false),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    scheduleAt: z.coerce.date().optional(),
    notifyOnComplete: z.boolean().default(false),
    deduplicateBy: z.enum(['email', 'phone', 'email+phone']).optional()
  }).default({})
});

const operationStatusRequestSchema = z.object({
  operationId: z.string().min(1, 'Operation ID required')
});

const operationCancelRequestSchema = z.object({
  operationId: z.string().min(1, 'Operation ID required'),
  reason: z.string().optional()
});

// POST: Execute bulk operation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = bulkOperationRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const user = session.user;
    const validatedData = validation.data;

    // Dynamic imports to prevent circular dependency during build
    const { bulkOperationsEngine } = await import('@/lib/ai/bulk-operations-engine');
    const { Permission } = await import('@/lib/security/authorization');
    
    const { operation, data, filters, updates, campaignId, recipients, options } = validatedData;

      logger.info('Bulk operation requested via AI', {
        operation,
        userId: user.id,
        organizationId: user.organizationId,
        dataCount: data?.length,
        hasFilters: !!filters,
        dryRun: options.dryRun
      });

      let result;

      switch (operation) {
        case 'contact_import':
          if (!data || data.length === 0) {
            return NextResponse.json(
              { success: false, error: 'Contact data is required for import operation' },
              { status: 400 }
            );
          }

          result = await bulkOperationsEngine.executeContactImport(
            {
              type: 'contact_import',
              data,
              options,
              transformations: []
            },
            user.id,
            user.role,
            user.organizationId
          );
          break;

        case 'contact_update':
          if (!filters || !updates) {
            return NextResponse.json(
              { success: false, error: 'Filters and updates are required for contact update operation' },
              { status: 400 }
            );
          }

          result = await bulkOperationsEngine.executeContactUpdate(
            {
              type: 'contact_update',
              data: [],
              filters,
              options,
              transformations: []
            },
            user.id,
            user.role,
            user.organizationId
          );
          break;

        case 'campaign_send':
          if (!campaignId || !recipients) {
            return {
              success: false,
              error: 'Campaign ID and recipients are required for campaign send operation',
              statusCode: 400
            };
          }

          result = await bulkOperationsEngine.executeCampaignSend(
            {
              type: 'campaign_send',
              data: [{
                campaignId,
                recipients,
                options
              }],
              options,
              transformations: []
            },
            user.id,
            user.role,
            user.organizationId
          );
          break;

        default:
          return NextResponse.json(
            { success: false, error: `Operation type '${operation}' not implemented yet` },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        data: {
          operationId: result.operationId,
          summary: result.summary,
          estimated: {
            totalRecords: result.summary.totalRecords,
            estimatedTime: Math.ceil(result.summary.totalRecords * 0.5), // seconds
            batchCount: Math.ceil(result.summary.totalRecords / (options.batchSize || 100))
          },
          isDryRun: options.dryRun,
          ...(options.dryRun && { preview: result.data?.slice(0, 5) })
        }
      });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Bulk operation failed', {
      error: errorMessage,
      operation: body?.operation
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET: Get operation status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Dynamic import to prevent circular dependency during build
    const { bulkOperationsEngine } = await import('@/lib/ai/bulk-operations-engine');
    const url = new URL(request.url);
    const operationId = url.searchParams.get('operationId');
    const listAll = url.searchParams.get('listAll') === 'true';

    if (!operationId && !listAll) {
      return NextResponse.json(
        { success: false, error: 'Operation ID is required or use listAll=true' },
        { status: 400 }
      );
    }

    if (operationId) {
      // Get specific operation status
      const operation = bulkOperationsEngine.getOperationStatus(operationId);
      
      if (!operation) {
        return NextResponse.json(
          { success: false, error: 'Operation not found' },
          { status: 404 }
        );
      }

      // Check if user can access this operation
      if (operation.userId !== user.id && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: operation.id,
          type: operation.type,
          status: operation.status,
          progress: operation.progress,
          estimatedTime: operation.estimatedTime,
          startedAt: operation.startedAt,
          completedAt: operation.completedAt,
          errors: operation.errors.slice(-10), // Last 10 errors
          metadata: {
            batchSize: operation.batchSize,
            hasErrors: operation.errors.length > 0,
            totalErrors: operation.errors.length
          }
        }
      });
    } else {
      // List all operations for user
      // This would require storing operations in database for persistence
      return NextResponse.json({
        success: true,
        data: {
          operations: [],
          message: 'Operation listing not yet implemented'
        }
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Failed to get bulk operation status', {
      error: errorMessage
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE: Cancel operation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = operationCancelRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const user = session.user;
    const { operationId, reason } = validation.data;

    // Dynamic import to prevent circular dependency during build
    const { bulkOperationsEngine } = await import('@/lib/ai/bulk-operations-engine');

    const cancelled = await bulkOperationsEngine.cancelOperation(
      operationId,
      user.id,
      user.role
    );

    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: 'Operation not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    logger.info('Bulk operation cancelled', {
      operationId,
      userId: user.id,
      reason
    });

    return NextResponse.json({
      success: true,
      data: {
        operationId,
        cancelled: true,
        reason: reason || 'User requested cancellation'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Failed to cancel bulk operation', {
      error: errorMessage
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}