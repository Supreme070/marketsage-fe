import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const suspensionSchema = z.object({
  reason: z.string().min(1, 'Suspension reason is required'),
  duration: z.number().optional(), // Duration in days, null for indefinite
  notifyUser: z.boolean().default(true),
});

/**
 * POST /api/admin/users/[id]/suspend
 * Suspend a user account
 */
export const POST = createAdminHandler(async (req, { user, permissions }, context) => {
  try {
    const userId = context.params.id;
    const body = await req.json();
    
    // Check permissions
    if (!permissions.canManageStaff) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate request data
    const validatedData = suspensionSchema.parse(body);

    // Prevent self-suspension
    if (userId === user.id) {
      return Response.json(
        { success: false, error: 'Cannot suspend your own account' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!targetUser.isActive) {
      return Response.json(
        { success: false, error: 'User is already suspended' },
        { status: 400 }
      );
    }

    const suspensionEndDate = validatedData.duration 
      ? new Date(Date.now() + validatedData.duration * 24 * 60 * 60 * 1000)
      : null;

    // Suspend the user
    const [updatedUser] = await Promise.all([
      prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
        },
      }),
      // Invalidate all active sessions
      prisma.session.deleteMany({
        where: {
          userId: userId,
          expires: {
            gt: new Date(),
          },
        },
      }),
      // Create a security event
      prisma.securityEvent.create({
        data: {
          eventType: 'ACCOUNT_LOCKED',
          severity: 'MEDIUM',
          title: 'Account Suspended by Admin',
          description: `Account suspended by ${user.email}. Reason: ${validatedData.reason}`,
          userId: userId,
          metadata: {
            adminId: user.id,
            adminEmail: user.email,
            reason: validatedData.reason,
            duration: validatedData.duration,
            suspensionEndDate: suspensionEndDate?.toISOString(),
          },
        },
      }),
    ]);

    // Log the admin action
    await logAdminAction(user, 'SUSPEND_USER', 'users', {
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      reason: validatedData.reason,
      duration: validatedData.duration,
      suspensionEndDate: suspensionEndDate?.toISOString(),
    });

    // TODO: Send notification email to user if notifyUser is true
    // This would be implemented with your email service

    return Response.json({
      success: true,
      message: 'User suspended successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        suspensionEndDate: suspensionEndDate,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Admin user suspension error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to suspend user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canManageStaff');

/**
 * DELETE /api/admin/users/[id]/suspend
 * Unsuspend a user account
 */
export const DELETE = createAdminHandler(async (req, { user, permissions }, context) => {
  try {
    const userId = context.params.id;
    
    // Check permissions
    if (!permissions.canManageStaff) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.isActive) {
      return Response.json(
        { success: false, error: 'User is not suspended' },
        { status: 400 }
      );
    }

    // Unsuspend the user
    const [updatedUser] = await Promise.all([
      prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
        },
      }),
      // Create a security event
      prisma.securityEvent.create({
        data: {
          eventType: 'ACCOUNT_LOCKED', // We'll mark it as resolved
          severity: 'LOW',
          title: 'Account Unsuspended by Admin',
          description: `Account unsuspended by ${user.email}`,
          userId: userId,
          resolved: true,
          resolvedBy: user.id,
          resolvedAt: new Date(),
          metadata: {
            adminId: user.id,
            adminEmail: user.email,
            action: 'unsuspension',
          },
        },
      }),
    ]);

    // Log the admin action
    await logAdminAction(user, 'UNSUSPEND_USER', 'users', {
      targetUserId: userId,
      targetUserEmail: targetUser.email,
    });

    return Response.json({
      success: true,
      message: 'User unsuspended successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
      },
    });

  } catch (error) {
    console.error('Admin user unsuspension error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to unsuspend user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canManageStaff');

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}