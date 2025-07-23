/**
 * AI Permission Middleware
 * ========================
 * 
 * Middleware for automatically checking AI permissions on API routes
 * Integrates with NextAuth and existing authorization system
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  AIPermissionService, 
  AIPermission, 
  RiskLevel,
  checkAIPermission
} from '@/lib/ai/ai-permission-system';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export interface AIPermissionConfig {
  requiredPermissions?: AIPermission[];
  operation?: string;
  riskLevel?: RiskLevel;
  requireApproval?: boolean;
  bypassForRoles?: string[];
}

/**
 * Higher-order function to create AI permission middleware
 */
export function withAIPermissions(config: AIPermissionConfig) {
  return function middleware(
    handler: (request: NextRequest, context: any) => Promise<NextResponse>
  ) {
    return async function wrappedHandler(
      request: NextRequest, 
      context: any
    ): Promise<NextResponse> {
      
      try {
        // Get user session
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { 
            id: true,
            role: true, 
            organizationId: true,
            isActive: true
          }
        });

        if (!user || !user.isActive) {
          return NextResponse.json(
            { success: false, error: 'User not found or inactive' },
            { status: 401 }
          );
        }

        // Check if user role bypasses permission checks
        if (config.bypassForRoles?.includes(user.role)) {
          // Add user context to request
          const enrichedContext = {
            ...context,
            user: {
              id: user.id,
              role: user.role,
              organizationId: user.organizationId
            }
          };
          
          return await handler(request, enrichedContext);
        }

        // Check specific permissions if required
        if (config.requiredPermissions) {
          for (const permission of config.requiredPermissions) {
            if (!AIPermissionService.hasAIPermission(user.role, permission)) {
              await AIPermissionService.logPermissionEvent(
                user.id,
                `permission_check_${permission}`,
                false,
                `Missing required permission: ${permission}`
              );

              return NextResponse.json(
                { 
                  success: false, 
                  error: `Insufficient permissions: ${permission}`,
                  required: permission,
                  userRole: user.role
                },
                { status: 403 }
              );
            }
          }
        }

        // Check operation-specific permissions
        if (config.operation) {
          const result = await checkAIPermission(
            user.id,
            user.role,
            user.organizationId || '',
            config.operation
          );

          if (!result.allowed) {
            return NextResponse.json(
              { 
                success: false, 
                error: result.reason || 'Operation not permitted',
                operation: config.operation,
                userRole: user.role
              },
              { status: 403 }
            );
          }

          // Check if approval is required for high-risk operations
          if (config.requireApproval && config.riskLevel === RiskLevel.CRITICAL) {
            // For critical operations, check if approval workflow should be triggered
            const approvalRequired = await checkApprovalRequired(
              user.id,
              user.role,
              config.operation
            );

            if (approvalRequired) {
              return NextResponse.json(
                { 
                  success: false, 
                  error: 'Operation requires approval',
                  operation: config.operation,
                  requiresApproval: true,
                  approvalWorkflow: 'critical_ai_operation'
                },
                { status: 202 } // Accepted but requires approval
              );
            }
          }
        }

        // Log successful permission check
        await AIPermissionService.logPermissionEvent(
          user.id,
          config.operation || 'api_access',
          true
        );

        // Add user context to request for handler
        const enrichedContext = {
          ...context,
          user: {
            id: user.id,
            role: user.role,
            organizationId: user.organizationId
          },
          aiPermissions: {
            effective: await AIPermissionService.getEffectiveAIPermissions(
              user.id,
              user.role
            )
          }
        };

        // Call the original handler with enriched context
        return await handler(request, enrichedContext);

      } catch (error) {
        logger.error('AI Permission middleware error', { 
          error: error instanceof Error ? error.message : String(error),
          url: request.url,
          method: request.method
        });

        return NextResponse.json(
          { success: false, error: 'Permission check failed' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Quick permission decorators for common operations
 */
export const requireAIChat = withAIPermissions({
  requiredPermissions: [AIPermission.USE_AI_CHAT]
});

export const requireAIAnalysis = withAIPermissions({
  requiredPermissions: [AIPermission.USE_AI_ANALYSIS, AIPermission.ACCESS_ANALYTICS_DATA]
});

export const requireTaskExecution = withAIPermissions({
  requiredPermissions: [AIPermission.EXECUTE_CREATE_TASKS],
  operation: 'create_task',
  riskLevel: RiskLevel.MEDIUM
});

export const requireAutonomousExecution = withAIPermissions({
  requiredPermissions: [AIPermission.AUTONOMOUS_TASK_EXECUTION],
  operation: 'autonomous_task',
  riskLevel: RiskLevel.HIGH,
  requireApproval: true
});

export const requireCriticalOperation = withAIPermissions({
  requiredPermissions: [AIPermission.EMERGENCY_OVERRIDE],
  riskLevel: RiskLevel.CRITICAL,
  requireApproval: true,
  bypassForRoles: ['SUPER_ADMIN']
});

/**
 * Check if operation requires approval workflow
 */
async function checkApprovalRequired(
  userId: string,
  userRole: string,
  operation: string
): Promise<boolean> {
  
  // Super admins bypass approval requirements
  if (userRole === 'SUPER_ADMIN') {
    return false;
  }

  // IT admins can approve their own critical operations
  if (userRole === 'IT_ADMIN') {
    return false;
  }

  // Check if user has override permissions for this operation
  const hasOverride = await AIPermissionService.checkTemporalPermissions(
    userId,
    [AIPermission.EMERGENCY_OVERRIDE]
  );

  if (hasOverride.granted) {
    return false;
  }

  // All other users require approval for critical operations
  return true;
}

/**
 * Create an approval request for critical operations
 */
export async function createApprovalRequest(
  userId: string,
  operation: string,
  payload: any,
  riskLevel: RiskLevel
): Promise<string> {
  
  const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const approval = {
    id: approvalId,
    userId,
    operation,
    payload,
    riskLevel,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };

  // Store approval request (would typically be in database)
  // For now, we'll use Redis
  const { redisCache } = await import('@/lib/cache/redis-client');
  await redisCache.set(`ai_approval:${approvalId}`, approval, 86400); // 24 hours

  // Log approval request
  logger.info('AI operation approval requested', {
    approvalId,
    userId,
    operation,
    riskLevel
  });

  // TODO: Send notification to appropriate approvers
  // This would integrate with the notification system

  return approvalId;
}

/**
 * Check approval status
 */
export async function checkApprovalStatus(approvalId: string): Promise<{
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedBy?: string;
  approvedAt?: Date;
  reason?: string;
}> {
  
  try {
    const { redisCache } = await import('@/lib/cache/redis-client');
    const approval = await redisCache.get(`ai_approval:${approvalId}`);
    
    if (!approval) {
      return { status: 'expired' };
    }

    return {
      status: approval.status,
      approvedBy: approval.approvedBy,
      approvedAt: approval.approvedAt,
      reason: approval.reason
    };

  } catch (error) {
    logger.error('Error checking approval status', { approvalId, error });
    return { status: 'expired' };
  }
}

/**
 * Approve or reject an operation
 */
export async function processApproval(
  approvalId: string,
  approverId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<boolean> {
  
  try {
    const { redisCache } = await import('@/lib/cache/redis-client');
    const approval = await redisCache.get(`ai_approval:${approvalId}`);
    
    if (!approval || approval.status !== 'pending') {
      return false;
    }

    // Update approval
    approval.status = action === 'approve' ? 'approved' : 'rejected';
    approval.approvedBy = approverId;
    approval.approvedAt = new Date();
    approval.reason = reason;

    await redisCache.set(`ai_approval:${approvalId}`, approval, 86400);

    logger.info('AI operation approval processed', {
      approvalId,
      approverId,
      action,
      originalUserId: approval.userId,
      operation: approval.operation
    });

    return true;

  } catch (error) {
    logger.error('Error processing approval', { approvalId, error });
    return false;
  }
}