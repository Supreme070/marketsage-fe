import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Update user validation schema
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']).optional(),
  isSuspended: z.boolean().optional(),
  suspensionReason: z.string().max(500).optional(),
  adminNotes: z.string().max(1000).optional(),
  organizationId: z.string().uuid().optional(),
});

// Response types
interface UserDetailResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    emailVerified: Date | null;
    lastActiveAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    isSuspended: boolean;
    suspendedAt: Date | null;
    suspensionReason: string | null;
    adminNotes: string | null;
    organization: {
      id: string;
      name: string;
      domain: string | null;
    } | null;
    subscription: {
      id: string;
      plan: string;
      status: string;
      currentPeriodEnd: Date;
    } | null;
    _count: {
      campaigns: number;
      contacts: number;
      workflows: number;
      auditLogs: number;
    };
  };
  activityLogs: Array<{
    id: string;
    action: string;
    resourceType: string;
    createdAt: Date;
    ipAddress: string;
    details: any;
  }>;
  adminNotes: Array<{
    id: string;
    note: string;
    createdBy: {
      id: string;
      name: string | null;
      email: string;
    };
    createdAt: Date;
  }>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Build where clause for organization restrictions
    const whereClause: any = { id: userId };
    if (session.user.role === 'ADMIN' && session.user.organizationId) {
      whereClause.organizationId = session.user.organizationId;
    }

    // Get user details with related data
    const [user, activityLogs, adminNotes] = await Promise.all([
      prisma.user.findFirst({
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
          adminNotes: true,
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          subscription: {
            select: {
              id: true,
              plan: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
              contacts: true,
              workflows: true,
              auditLogs: {
                where: {
                  createdAt: {
                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                  },
                },
              },
            },
          },
        },
      }),

      // Get recent activity logs
      prisma.adminAuditLog.findMany({
        where: {
          OR: [
            { resourceId: userId },
            { adminUserId: userId }, // If this user is an admin, show their actions too
          ],
        },
        select: {
          id: true,
          action: true,
          resource: true,
          timestamp: true,
          ipAddress: true,
          details: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),

      // Get admin notes about this user
      prisma.adminNote.findMany({
        where: { userId },
        select: {
          id: true,
          note: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response: UserDetailResponse = {
      user,
      activityLogs,
      adminNotes,
    };

    // Log the admin access
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'VIEW_USER_DETAILS',
        resource: 'USER',
        resourceId: userId,
        details: {
          viewedUserId: userId,
          viewedUserEmail: user.email,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const body = await req.json();

    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Check if user exists and get current state
    const whereClause: any = { id: userId };
    if (session.user.role === 'ADMIN' && session.user.organizationId) {
      whereClause.organizationId = session.user.organizationId;
    }

    const existingUser = await prisma.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        email: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        adminNotes: true,
        organizationId: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role change restrictions
    if (validatedData.role && validatedData.role !== existingUser.role) {
      // Only SUPER_ADMIN can change roles
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Only Super Admin can change user roles' }, { status: 403 });
      }
      
      // Cannot change own role
      if (userId === session.user.id) {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 });
      }
    }

    // Organization change restrictions
    if (validatedData.organizationId && session.user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can change user organizations' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    const changes: string[] = [];

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
      changes.push(`name changed to "${validatedData.name}"`);
    }

    if (validatedData.role !== undefined && validatedData.role !== existingUser.role) {
      updateData.role = validatedData.role;
      changes.push(`role changed from ${existingUser.role} to ${validatedData.role}`);
    }

    if (validatedData.isSuspended !== undefined) {
      updateData.isSuspended = validatedData.isSuspended;
      if (validatedData.isSuspended) {
        updateData.suspendedAt = new Date();
        updateData.suspensionReason = validatedData.suspensionReason || 'No reason provided';
        changes.push(`user suspended: ${updateData.suspensionReason}`);
      } else {
        updateData.suspendedAt = null;
        updateData.suspensionReason = null;
        changes.push('user unsuspended');
      }
    }

    if (validatedData.adminNotes !== undefined) {
      updateData.adminNotes = validatedData.adminNotes;
      changes.push('admin notes updated');
    }

    if (validatedData.organizationId !== undefined) {
      updateData.organizationId = validatedData.organizationId;
      changes.push(`organization changed`);
    }

    // Perform the update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspensionReason: true,
        adminNotes: true,
        organizationId: true,
        updatedAt: true,
      },
    });

    // Create admin audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'UPDATE_USER',
        resource: 'USER',
        resourceId: userId,
        details: {
          changes: changes,
          oldData: {
            role: existingUser.role,
            isSuspended: existingUser.isSuspended,
            suspensionReason: existingUser.suspensionReason,
          },
          newData: validatedData,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // Add admin note if provided
    if (validatedData.adminNotes && validatedData.adminNotes !== existingUser.adminNotes) {
      await prisma.adminNote.create({
        data: {
          userId,
          createdById: session.user.id,
          note: `User updated: ${changes.join(', ')}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User updated: ${changes.join(', ')}`,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can delete users' }, { status: 403 });
    }

    const userId = params.id;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Cannot delete own account
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        _count: {
          select: {
            campaigns: true,
            contacts: true,
            workflows: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has associated data
    const hasData = user._count.campaigns > 0 || user._count.contacts > 0 || user._count.workflows > 0;
    
    if (hasData) {
      return NextResponse.json({
        error: 'Cannot delete user with associated data. Please transfer or delete associated campaigns, contacts, and workflows first.',
        details: user._count,
      }, { status: 400 });
    }

    // Perform soft delete by suspending the user instead of hard delete
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspensionReason: 'Account deleted by admin',
        email: `deleted_${Date.now()}_${user.email}`, // Unique email to prevent conflicts
      },
    });

    // Create admin audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'DELETE_USER',
        resource: 'USER',
        resourceId: userId,
        details: {
          deletedUser: {
            email: user.email,
            name: user.name,
            role: user.role,
          },
          reason: 'Admin deletion',
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User account has been deactivated and marked for deletion',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}