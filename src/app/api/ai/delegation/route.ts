import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { aiDelegationManager } from '@/lib/ai/ai-delegation-manager';
import { UserRole } from '@prisma/client';

/**
 * AI Delegation API
 * 
 * Manages AI delegation permissions and grants
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const requestId = searchParams.get('requestId');
    const grantId = searchParams.get('grantId');

    switch (action) {
      case 'permissions':
        const permissions = aiDelegationManager.getAvailablePermissions(category || undefined);
        return NextResponse.json({
          success: true,
          data: permissions,
          timestamp: new Date().toISOString()
        });

      case 'grants':
        const grants = aiDelegationManager.getUserGrants(session.user.id, organizationId);
        return NextResponse.json({
          success: true,
          data: grants,
          timestamp: new Date().toISOString()
        });

      case 'requests':
        const requests = aiDelegationManager.getUserRequests(session.user.id, organizationId);
        return NextResponse.json({
          success: true,
          data: requests,
          timestamp: new Date().toISOString()
        });

      case 'pending':
        // Only admins can see pending requests
        if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        
        const pendingRequests = aiDelegationManager.getPendingRequests(organizationId);
        return NextResponse.json({
          success: true,
          data: pendingRequests,
          timestamp: new Date().toISOString()
        });

      case 'templates':
        const templates = aiDelegationManager.getTemplates(category || undefined);
        return NextResponse.json({
          success: true,
          data: templates,
          timestamp: new Date().toISOString()
        });

      case 'statistics':
        const stats = aiDelegationManager.getStatistics(organizationId);
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      case 'request_detail':
        if (!requestId) {
          return NextResponse.json({
            success: false,
            error: 'Request ID is required'
          }, { status: 400 });
        }

        const userRequests = aiDelegationManager.getUserRequests(session.user.id, organizationId);
        const request = userRequests.find(r => r.id === requestId);
        
        if (!request) {
          return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: request,
          timestamp: new Date().toISOString()
        });

      case 'grant_detail':
        if (!grantId) {
          return NextResponse.json({
            success: false,
            error: 'Grant ID is required'
          }, { status: 400 });
        }

        const userGrants = aiDelegationManager.getUserGrants(session.user.id, organizationId);
        const grant = userGrants.find(g => g.id === grantId);
        
        if (!grant) {
          return NextResponse.json({ error: 'Grant not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: grant,
          timestamp: new Date().toISOString()
        });

      default:
        // Default: return user's dashboard data
        const dashboardData = {
          permissions: aiDelegationManager.getAvailablePermissions(),
          grants: aiDelegationManager.getUserGrants(session.user.id, organizationId),
          requests: aiDelegationManager.getUserRequests(session.user.id, organizationId),
          templates: aiDelegationManager.getTemplates(),
          statistics: aiDelegationManager.getStatistics(organizationId)
        };

        return NextResponse.json({
          success: true,
          data: dashboardData,
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI delegation GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve delegation data',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, permissionIds, reason, conditions, templateData } = body;

    logger.info('AI delegation action', {
      action,
      userId: session.user.id,
      organizationId: session.user.organizationId
    });

    switch (action) {
      case 'request_permissions':
        if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Permission IDs are required'
          }, { status: 400 });
        }

        if (!reason) {
          return NextResponse.json({
            success: false,
            error: 'Reason is required'
          }, { status: 400 });
        }

        const delegationRequest = await aiDelegationManager.requestPermissions(
          session.user.id,
          session.user.organizationId,
          permissionIds,
          reason,
          conditions || {}
        );

        return NextResponse.json({
          success: true,
          data: delegationRequest,
          message: 'Permission request submitted',
          timestamp: new Date().toISOString()
        });

      case 'create_template':
        if (!templateData) {
          return NextResponse.json({
            success: false,
            error: 'Template data is required'
          }, { status: 400 });
        }

        const template = aiDelegationManager.createTemplate(
          templateData.name,
          templateData.description,
          templateData.category,
          templateData.permissions,
          templateData.defaultConditions,
          session.user.id,
          templateData.isPublic || false
        );

        return NextResponse.json({
          success: true,
          data: template,
          message: 'Template created successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI delegation POST error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI delegation operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, requestId, grantId, reviewNotes } = body;

    // Check admin permissions for approval/rejection
    if ((action === 'approve_request' || action === 'reject_request') && 
        session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    switch (action) {
      case 'approve_request':
        if (!requestId) {
          return NextResponse.json({
            success: false,
            error: 'Request ID is required'
          }, { status: 400 });
        }

        const grants = await aiDelegationManager.approveRequest(
          requestId,
          session.user.id,
          reviewNotes
        );

        return NextResponse.json({
          success: true,
          data: grants,
          message: 'Request approved successfully',
          timestamp: new Date().toISOString()
        });

      case 'reject_request':
        if (!requestId) {
          return NextResponse.json({
            success: false,
            error: 'Request ID is required'
          }, { status: 400 });
        }

        if (!reviewNotes) {
          return NextResponse.json({
            success: false,
            error: 'Review notes are required for rejection'
          }, { status: 400 });
        }

        await aiDelegationManager.rejectRequest(
          requestId,
          session.user.id,
          reviewNotes
        );

        return NextResponse.json({
          success: true,
          message: 'Request rejected successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI delegation PUT error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI delegation operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const grantId = searchParams.get('grantId');
    const reason = searchParams.get('reason') || 'Manual revocation';

    if (!grantId) {
      return NextResponse.json({
        success: false,
        error: 'Grant ID is required'
      }, { status: 400 });
    }

    await aiDelegationManager.revokeGrant(
      grantId,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Grant revoked successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI delegation DELETE error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to revoke grant',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}