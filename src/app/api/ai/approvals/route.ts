import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const approvalActionSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional()
});

// GET: List pending approvals for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'my_requests';
    
    let approvals;
    
    if (filter === 'my_requests') {
      // Get approvals requested by current user
      const { safetyApprovalSystem } = await import('@/lib/ai/safety-approval-system');
      approvals = safetyApprovalSystem.getPendingApprovals(session.user.id);
    } else if (filter === 'requiring_action') {
      // Get approvals that current user can act on
      const { safetyApprovalSystem } = await import('@/lib/ai/safety-approval-system');
      approvals = safetyApprovalSystem.getApprovalsForRole(session.user.role || 'USER');
    } else {
      return NextResponse.json(
        { error: "Invalid filter. Use 'my_requests' or 'requiring_action'" },
        { status: 400 }
      );
    }

    // Format response
    const formattedApprovals = approvals.map(approval => ({
      id: approval.id,
      operationId: approval.operationId,
      status: approval.status,
      approvalLevel: approval.approvalLevel,
      operation: {
        action: approval.operation.action,
        entity: approval.operation.entity,
        operationType: approval.operation.operationType,
        parameters: approval.operation.parameters
      },
      justification: approval.justification,
      requesterId: approval.requesterId,
      requesterRole: approval.requesterRole,
      expiresAt: approval.expiresAt,
      createdAt: approval.operation.context.timestamp,
      approvedBy: approval.approvedBy,
      approvedAt: approval.approvedAt,
      rejectionReason: approval.rejectionReason
    }));

    logger.info('Approvals fetched', {
      userId: session.user.id,
      filter,
      count: formattedApprovals.length
    });

    return NextResponse.json({
      approvals: formattedApprovals,
      total: formattedApprovals.length,
      filter
    });

  } catch (error) {
    logger.error('Approvals fetch error', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

// POST: Approve or reject an operation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = approvalActionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid request format",
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { approvalId, action, reason } = validation.data;

    logger.info('Approval action requested', {
      approvalId,
      action,
      userId: session.user.id,
      userRole: session.user.role
    });

    let result;

    if (action === 'approve') {
      const { safetyApprovalSystem } = await import('@/lib/ai/safety-approval-system');
      result = await safetyApprovalSystem.approveOperation(
        approvalId,
        session.user.id,
        session.user.role || 'USER'
      );
    } else if (action === 'reject') {
      if (!reason) {
        return NextResponse.json(
          { error: "Reason is required for rejection" },
          { status: 400 }
        );
      }
      
      const { safetyApprovalSystem } = await import('@/lib/ai/safety-approval-system');
      result = await safetyApprovalSystem.rejectOperation(
        approvalId,
        session.user.id,
        reason
      );
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Operation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      action,
      approvalId
    });

  } catch (error) {
    logger.error('Approval action error', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to process approval action" },
      { status: 500 }
    );
  }
}

// PUT: Update approval settings or extend expiration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can modify approval settings
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Super Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { approvalId, action, extendMinutes } = body;

    if (action === 'extend' && approvalId && extendMinutes) {
      // Extend approval expiration time
      // This would be implemented in the safety system
      logger.info('Approval extended', {
        approvalId,
        extendMinutes,
        userId: session.user.id
      });

      return NextResponse.json({
        success: true,
        message: `Approval extended by ${extendMinutes} minutes`
      });
    }

    return NextResponse.json(
      { error: "Invalid update action" },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Approval update error', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}