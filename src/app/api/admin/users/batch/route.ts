import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Request validation schemas
const batchActionSchema = z.object({
  action: z.enum(['suspend', 'unsuspend', 'change_role', 'delete', 'export']),
  userIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(10).max(500).optional(),
  newRole: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']).optional(),
});

// Response types
interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: Array<{
    userId: string;
    email: string;
    success: boolean;
    error?: string;
  }>;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = batchActionSchema.parse(body);
    const { action, userIds, reason, newRole } = validatedData;

    // Additional validation based on action
    if (action === 'suspend' && !reason) {
      return NextResponse.json({ 
        error: 'Reason is required for suspension actions' 
      }, { status: 400 });
    }

    if (action === 'change_role' && !newRole) {
      return NextResponse.json({ 
        error: 'New role is required for role change actions' 
      }, { status: 400 });
    }

    // Role-specific restrictions
    if (session.user.role === 'ADMIN') {
      if (action === 'delete') {
        return NextResponse.json({ 
          error: 'Only Super Admin can delete users' 
        }, { status: 403 });
      }
      
      if (action === 'change_role') {
        return NextResponse.json({ 
          error: 'Only Super Admin can change user roles' 
        }, { status: 403 });
      }
    }

    // Cannot perform actions on self
    if (userIds.includes(session.user.id)) {
      return NextResponse.json({ 
        error: 'Cannot perform batch actions on your own account' 
      }, { status: 400 });
    }

    // Build where clause for organization restrictions
    const whereClause: any = {
      id: { in: userIds },
    };

    if (session.user.role === 'ADMIN' && session.user.organizationId) {
      whereClause.organizationId = session.user.organizationId;
    }

    // Get all target users
    const targetUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuspended: true,
        organizationId: true,
        _count: {
          select: {
            campaigns: true,
            contacts: true,
            workflows: true,
          },
        },
      },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json({ 
        error: 'No users found or access denied' 
      }, { status: 404 });
    }

    // Check for users not found
    const foundUserIds = targetUsers.map(u => u.id);
    const notFoundIds = userIds.filter(id => !foundUserIds.includes(id));

    // Additional validations based on action
    if (action === 'change_role') {
      const superAdmins = targetUsers.filter(u => u.role === 'SUPER_ADMIN');
      if (superAdmins.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot change roles of Super Admin users' 
        }, { status: 403 });
      }
    }

    if (action === 'delete') {
      const usersWithData = targetUsers.filter(u => 
        u._count.campaigns > 0 || u._count.contacts > 0 || u._count.workflows > 0
      );
      if (usersWithData.length > 0) {
        return NextResponse.json({
          error: 'Cannot delete users with associated data',
          details: usersWithData.map(u => ({
            id: u.id,
            email: u.email,
            dataCount: u._count,
          })),
        }, { status: 400 });
      }
    }

    const results: Array<{
      userId: string;
      email: string;
      success: boolean;
      error?: string;
    }> = [];

    let processedCount = 0;
    let failedCount = 0;

    // Process each user
    for (const user of targetUsers) {
      try {
        let updateData: any = {};
        let actionDescription = '';

        switch (action) {
          case 'suspend':
            if (user.isSuspended) {
              results.push({
                userId: user.id,
                email: user.email,
                success: false,
                error: 'User is already suspended',
              });
              failedCount++;
              continue;
            }
            updateData = {
              isSuspended: true,
              suspendedAt: new Date(),
              suspensionReason: reason || 'Batch suspension',
            };
            actionDescription = `suspended: ${reason}`;
            break;

          case 'unsuspend':
            if (!user.isSuspended) {
              results.push({
                userId: user.id,
                email: user.email,
                success: false,
                error: 'User is not suspended',
              });
              failedCount++;
              continue;
            }
            updateData = {
              isSuspended: false,
              suspendedAt: null,
              suspensionReason: null,
            };
            actionDescription = 'unsuspended';
            break;

          case 'change_role':
            if (user.role === newRole) {
              results.push({
                userId: user.id,
                email: user.email,
                success: false,
                error: `User already has role ${newRole}`,
              });
              failedCount++;
              continue;
            }
            updateData = {
              role: newRole,
            };
            actionDescription = `role changed from ${user.role} to ${newRole}`;
            break;

          case 'delete':
            // Perform soft delete
            updateData = {
              isSuspended: true,
              suspendedAt: new Date(),
              suspensionReason: 'Account deleted by admin (batch operation)',
              email: `deleted_${Date.now()}_${user.email}`,
            };
            actionDescription = 'deleted';
            break;

          default:
            results.push({
              userId: user.id,
              email: user.email,
              success: false,
              error: `Unknown action: ${action}`,
            });
            failedCount++;
            continue;
        }

        // Perform the update
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        // Create admin audit log
        await prisma.adminAuditLog.create({
          data: {
            adminUserId: session.user.id,
            adminEmail: session.user.email,
            action: `BATCH_${action.toUpperCase()}`,
            resource: 'USER',
            resourceId: user.id,
            details: {
              batchOperation: true,
              action: actionDescription,
              reason: reason || 'Batch operation',
              targetUser: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
            },
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
          },
        });

        // Create admin note
        await prisma.adminNote.create({
          data: {
            userId: user.id,
            createdById: session.user.id,
            note: `Batch operation: ${actionDescription}`,
            type: action === 'suspend' || action === 'delete' ? 'WARNING' : 'INFO',
          },
        });

        results.push({
          userId: user.id,
          email: user.email,
          success: true,
        });
        processedCount++;

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: 'Processing failed',
        });
        failedCount++;
      }
    }

    // Add results for not found users
    notFoundIds.forEach(id => {
      results.push({
        userId: id,
        email: 'unknown',
        success: false,
        error: 'User not found or access denied',
      });
      failedCount++;
    });

    // Create summary audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'BATCH_OPERATION_SUMMARY',
        resource: 'USER',
        details: {
          action,
          totalRequested: userIds.length,
          processedCount,
          failedCount,
          reason: reason || 'Batch operation',
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    const response: BatchOperationResult = {
      success: failedCount === 0,
      processedCount,
      failedCount,
      results,
      message: `Batch operation completed: ${processedCount} successful, ${failedCount} failed`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in batch user operation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Batch operation failed' },
      { status: 500 }
    );
  }
}

// GET endpoint for batch export
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const userIdsParam = searchParams.get('userIds');
    const format = searchParams.get('format') || 'json';

    if (!userIdsParam) {
      return NextResponse.json({ error: 'userIds parameter is required' }, { status: 400 });
    }

    const userIds = userIdsParam.split(',').filter(id => 
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    );

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No valid user IDs provided' }, { status: 400 });
    }

    // Build where clause for organization restrictions
    const whereClause: any = {
      id: { in: userIds },
    };

    if (session.user.role === 'ADMIN' && session.user.organizationId) {
      whereClause.organizationId = session.user.organizationId;
    }

    // Export user data
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
        isSuspended: true,
        suspendedAt: true,
        suspensionReason: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
            contacts: true,
            workflows: true,
          },
        },
      },
    });

    // Log the export
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'BATCH_EXPORT_USERS',
        resource: 'USER',
        details: {
          exportedUserCount: users.length,
          requestedUserCount: userIds.length,
          format,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    if (format === 'csv') {
      // Return CSV format
      const csvHeaders = [
        'ID', 'Email', 'Name', 'Role', 'Email Verified', 'Last Active', 
        'Created At', 'Suspended', 'Suspension Reason', 'Organization', 
        'Campaigns Count', 'Contacts Count', 'Workflows Count'
      ].join(',');

      const csvRows = users.map(user => [
        user.id,
        user.email,
        user.name || '',
        user.role,
        user.emailVerified ? 'Yes' : 'No',
        user.lastActiveAt?.toISOString() || '',
        user.createdAt.toISOString(),
        user.isSuspended ? 'Yes' : 'No',
        user.suspensionReason || '',
        user.organization?.name || '',
        user._count.campaigns,
        user._count.contacts,
        user._count.workflows,
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      users,
      exportedAt: new Date().toISOString(),
      totalCount: users.length,
    });
  } catch (error) {
    console.error('Error in batch user export:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}