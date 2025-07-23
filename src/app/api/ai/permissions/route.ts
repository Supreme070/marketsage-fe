/**
 * AI Permissions Management API
 * =============================
 * 
 * Endpoints for managing AI permissions, delegations, and role-based access
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

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'effective':
        return await getEffectivePermissions(session.user.id);
        
      case 'delegations':
        return await getUserDelegations(session.user.id);
        
      case 'check':
        const operation = searchParams.get('operation');
        if (!operation) {
          return NextResponse.json(
            { success: false, error: 'Operation parameter required' },
            { status: 400 }
          );
        }
        return await checkOperation(session.user.id, operation);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('AI Permissions API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'delegate':
        return await createDelegation(session.user.id, body);
        
      case 'revoke':
        return await revokeDelegation(session.user.id, body.delegationId);
        
      case 'check_bulk':
        return await checkBulkOperations(session.user.id, body.operations);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('AI Permissions API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's effective permissions
async function getEffectivePermissions(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const permissions = await AIPermissionService.getEffectiveAIPermissions(
      userId,
      user.role
    );

    return NextResponse.json({
      success: true,
      data: {
        role: user.role,
        permissions,
        organizationId: user.organizationId
      }
    });

  } catch (error) {
    logger.error('Error getting effective permissions', { error, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to get permissions' },
      { status: 500 }
    );
  }
}

// Get user's delegations
async function getUserDelegations(userId: string) {
  try {
    // This would typically query a database, but we're using Redis for delegations
    // For now, return empty array as delegations are stored in Redis
    
    return NextResponse.json({
      success: true,
      data: {
        granted: [], // Delegations this user has granted
        received: [] // Delegations this user has received
      }
    });

  } catch (error) {
    logger.error('Error getting user delegations', { error, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to get delegations' },
      { status: 500 }
    );
  }
}

// Check if user can perform an operation
async function checkOperation(userId: string, operation: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const result = await checkAIPermission(
      userId,
      user.role,
      user.organizationId || '',
      operation
    );

    return NextResponse.json({
      success: true,
      data: {
        operation,
        allowed: result.allowed,
        reason: result.reason,
        riskLevel: AI_OPERATION_RISKS[operation] || RiskLevel.MEDIUM
      }
    });

  } catch (error) {
    logger.error('Error checking operation', { error, userId, operation });
    return NextResponse.json(
      { success: false, error: 'Failed to check operation' },
      { status: 500 }
    );
  }
}

// Create permission delegation
async function createDelegation(delegatorId: string, body: any) {
  try {
    const { delegateeId, permissions, expiresAt, conditions, maxUses } = body;

    // Validate inputs
    if (!delegateeId || !permissions || !expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if delegator has permission to delegate
    const delegator = await prisma.user.findUnique({
      where: { id: delegatorId },
      select: { role: true }
    });

    if (!delegator) {
      return NextResponse.json(
        { success: false, error: 'Delegator not found' },
        { status: 404 }
      );
    }

    // Check if delegator has DELEGATE_AI_PERMISSIONS
    if (!AIPermissionService.hasAIPermission(delegator.role, AIPermission.DELEGATE_AI_PERMISSIONS)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delegate' },
        { status: 403 }
      );
    }

    // Verify delegatee exists
    const delegatee = await prisma.user.findUnique({
      where: { id: delegateeId },
      select: { id: true }
    });

    if (!delegatee) {
      return NextResponse.json(
        { success: false, error: 'Delegatee not found' },
        { status: 404 }
      );
    }

    // Create delegation
    const delegation = await AIPermissionService.createDelegation(
      delegatorId,
      delegateeId,
      permissions,
      new Date(expiresAt),
      conditions,
      maxUses
    );

    return NextResponse.json({
      success: true,
      data: {
        delegationId: delegation.id,
        expiresAt: delegation.expiresAt,
        riskLevel: delegation.riskLevel,
        permissionCount: delegation.permissions.length
      }
    });

  } catch (error) {
    logger.error('Error creating delegation', { error, delegatorId });
    return NextResponse.json(
      { success: false, error: 'Failed to create delegation' },
      { status: 500 }
    );
  }
}

// Revoke permission delegation
async function revokeDelegation(userId: string, delegationId: string) {
  try {
    if (!delegationId) {
      return NextResponse.json(
        { success: false, error: 'Delegation ID required' },
        { status: 400 }
      );
    }

    const revoked = await AIPermissionService.revokeDelegation(delegationId, userId);

    if (revoked) {
      return NextResponse.json({
        success: true,
        data: {
          delegationId,
          revokedAt: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to revoke delegation or access denied' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Error revoking delegation', { error, userId, delegationId });
    return NextResponse.json(
      { success: false, error: 'Failed to revoke delegation' },
      { status: 500 }
    );
  }
}

// Check multiple operations in bulk
async function checkBulkOperations(userId: string, operations: string[]) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const results = await Promise.all(
      operations.map(async (operation) => {
        const result = await checkAIPermission(
          userId,
          user.role,
          user.organizationId || '',
          operation
        );

        return {
          operation,
          allowed: result.allowed,
          reason: result.reason,
          riskLevel: AI_OPERATION_RISKS[operation] || RiskLevel.MEDIUM
        };
      })
    );

    const summary = {
      total: results.length,
      allowed: results.filter(r => r.allowed).length,
      denied: results.filter(r => !r.allowed).length,
      highRisk: results.filter(r => [RiskLevel.HIGH, RiskLevel.CRITICAL].includes(r.riskLevel)).length
    };

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary
      }
    });

  } catch (error) {
    logger.error('Error checking bulk operations', { error, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to check operations' },
      { status: 500 }
    );
  }
}

// Import operation risks for use in this file
const AI_OPERATION_RISKS: Record<string, RiskLevel> = {
  'read_contact': RiskLevel.LOW,
  'read_campaign': RiskLevel.LOW,
  'read_analytics': RiskLevel.LOW,
  'create_contact': RiskLevel.MEDIUM,
  'update_contact': RiskLevel.MEDIUM,
  'create_campaign': RiskLevel.HIGH,
  'send_campaign': RiskLevel.HIGH,
  'delete_contact': RiskLevel.HIGH,
  'delete_campaign': RiskLevel.CRITICAL,
  'bulk_delete': RiskLevel.CRITICAL,
  'system_configuration': RiskLevel.CRITICAL
};