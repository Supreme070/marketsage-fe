import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const userActionSchema = z.object({
  action: z.enum(['update_role', 'suspend', 'activate', 'transfer', 'remove']),
  userId: z.string(),
  role: z.enum(['USER', 'ADMIN', 'IT_ADMIN']).optional(),
  targetOrganizationId: z.string().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/admin/organizations/[id]/users
 * Get all users belonging to an organization with detailed information
 */
export const GET = createAdminHandler(async (req, { user, permissions }, context) => {
  try {
    const organizationId = context.params.id;
    
    // Get query parameters for filtering and pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Log the admin action
    await logAdminAction(user, 'VIEW_ORGANIZATION_USERS', 'users', {
      organizationId,
      filters: { search, role, status, page, limit },
      adminUser: user.email,
    }, req);

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        createdAt: true,
      },
    });

    if (!organization) {
      return Response.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Build where clause for user filtering
    const where: any = {
      organizationId: organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Build sort clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get users with pagination and detailed information
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          company: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          lastActivityAt: true,
          
          // User preferences
          preferences: {
            select: {
              id: true,
              preferences: true,
              updatedAt: true,
            },
          },
          
          // User activity count
          _count: {
            select: {
              activities: true,
              sessions: true,
            },
          },
          
          // Recent activities
          activities: {
            select: {
              id: true,
              type: true,
              channel: true,
              timestamp: true,
              metadata: true,
            },
            orderBy: {
              timestamp: 'desc',
            },
            take: 5,
          },
          
          // Recent sessions
          sessions: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              duration: true,
            },
            orderBy: {
              startTime: 'desc',
            },
            take: 3,
          },
          
          // Account connections
          accounts: {
            select: {
              id: true,
              type: true,
              provider: true,
              providerAccountId: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get organization-level user statistics
    const [userStats, roleStats, activityStats, recentLoginStats] = await Promise.all([
      // Basic user statistics
      prisma.user.aggregate({
        where: { organizationId },
        _count: {
          id: true,
        },
        _min: {
          createdAt: true,
        },
        _max: {
          lastLogin: true,
        },
      }),
      
      // Role distribution
      prisma.user.groupBy({
        where: { organizationId },
        by: ['role'],
        _count: {
          role: true,
        },
        orderBy: {
          _count: {
            role: 'desc',
          },
        },
      }),
      
      // Activity statistics (last 30 days)
      prisma.user.count({
        where: {
          organizationId,
          activities: {
            some: {
              timestamp: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
      
      // Recent login statistics
      prisma.user.count({
        where: {
          organizationId,
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Process role distribution
    const roleDistribution = roleStats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.role;
      return acc;
    }, {} as Record<string, number>);

    // Enhanced user data with computed fields
    const enhancedUsers = users.map(user => {
      const totalActivities = user._count.activities;
      const totalSessions = user._count.sessions;
      const lastActivity = user.activities[0]?.timestamp;
      const avgSessionDuration = user.sessions.length > 0 
        ? user.sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / user.sessions.length
        : 0;

      // Calculate user engagement score (0-100)
      let engagementScore = 0;
      if (user.lastLogin) {
        const daysSinceLogin = (Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
        engagementScore += Math.max(0, 30 - daysSinceLogin); // Max 30 points for recent login
      }
      engagementScore += Math.min(totalActivities * 2, 40); // Max 40 points for activities
      engagementScore += Math.min(totalSessions * 5, 30); // Max 30 points for sessions

      return {
        ...user,
        metrics: {
          totalActivities,
          totalSessions,
          avgSessionDuration: Math.round(avgSessionDuration),
          engagementScore: Math.min(Math.round(engagementScore), 100),
          lastActivity,
          daysSinceLogin: user.lastLogin 
            ? Math.floor((Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
        // Parse preferences if exists
        parsedPreferences: user.preferences?.preferences 
          ? JSON.parse(user.preferences.preferences) 
          : null,
      };
    });

    return Response.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          plan: organization.plan,
          createdAt: organization.createdAt,
        },
        
        users: enhancedUsers,
        
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        
        statistics: {
          total: userStats._count.id,
          active: users.filter(u => u.isActive).length,
          inactive: users.filter(u => !u.isActive).length,
          recentlyActive: activityStats,
          recentLogins: recentLoginStats,
          
          roles: roleDistribution,
          
          engagement: {
            avgScore: Math.round(
              enhancedUsers.reduce((sum, u) => sum + u.metrics.engagementScore, 0) / enhancedUsers.length || 0
            ),
            highEngagement: enhancedUsers.filter(u => u.metrics.engagementScore >= 70).length,
            mediumEngagement: enhancedUsers.filter(u => u.metrics.engagementScore >= 40 && u.metrics.engagementScore < 70).length,
            lowEngagement: enhancedUsers.filter(u => u.metrics.engagementScore < 40).length,
          },
          
          joinDates: {
            oldest: userStats._min.createdAt,
            newest: userStats._max.lastLogin,
          },
        },
        
        metadata: {
          generatedAt: new Date().toISOString(),
          filters: { search, role, status, sortBy, sortOrder },
          adminUser: user.email,
        },
      },
    });

  } catch (error) {
    console.error('Admin organization users fetch error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch organization users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canViewUsers');

/**
 * POST /api/admin/organizations/[id]/users
 * Perform user management actions for organization users
 */
export const POST = createAdminHandler(async (req, { user, permissions }, context) => {
  try {
    const organizationId = context.params.id;

    // Check permissions
    if (!permissions.canManageStaff) {
      return Response.json(
        { success: false, error: 'Insufficient permissions for user management' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = userActionSchema.parse(body);

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      return Response.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Verify user exists and belongs to organization
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        organizationId: true,
      },
    });

    if (!targetUser) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.organizationId !== organizationId) {
      return Response.json(
        { success: false, error: 'User does not belong to this organization' },
        { status: 400 }
      );
    }

    // Prevent admin from modifying their own account in certain ways
    if (targetUser.id === user.id && ['suspend', 'remove', 'transfer'].includes(validatedData.action)) {
      return Response.json(
        { success: false, error: 'Cannot perform this action on your own account' },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (validatedData.action) {
      case 'update_role':
        if (!validatedData.role) {
          return Response.json(
            { success: false, error: 'Role is required for role update' },
            { status: 400 }
          );
        }

        // Prevent role escalation to SUPER_ADMIN
        if (validatedData.role === 'SUPER_ADMIN') {
          return Response.json(
            { success: false, error: 'Cannot assign SUPER_ADMIN role' },
            { status: 403 }
          );
        }

        const updatedUser = await prisma.user.update({
          where: { id: validatedData.userId },
          data: { role: validatedData.role },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        result = {
          action: 'update_role',
          user: updatedUser,
          previousRole: targetUser.role,
          newRole: validatedData.role,
        };
        break;

      case 'suspend':
        await prisma.user.update({
          where: { id: validatedData.userId },
          data: { isActive: false },
        });

        result = {
          action: 'suspend',
          userId: validatedData.userId,
          suspendedAt: new Date().toISOString(),
          reason: validatedData.reason,
        };
        break;

      case 'activate':
        await prisma.user.update({
          where: { id: validatedData.userId },
          data: { isActive: true },
        });

        result = {
          action: 'activate',
          userId: validatedData.userId,
          activatedAt: new Date().toISOString(),
        };
        break;

      case 'transfer':
        if (!validatedData.targetOrganizationId) {
          return Response.json(
            { success: false, error: 'Target organization ID is required for transfer' },
            { status: 400 }
          );
        }

        // Verify target organization exists
        const targetOrg = await prisma.organization.findUnique({
          where: { id: validatedData.targetOrganizationId },
          select: { id: true, name: true },
        });

        if (!targetOrg) {
          return Response.json(
            { success: false, error: 'Target organization not found' },
            { status: 404 }
          );
        }

        await prisma.user.update({
          where: { id: validatedData.userId },
          data: { 
            organizationId: validatedData.targetOrganizationId,
            role: 'USER', // Reset to basic role in new organization
          },
        });

        result = {
          action: 'transfer',
          userId: validatedData.userId,
          fromOrganization: organization.name,
          toOrganization: targetOrg.name,
          transferredAt: new Date().toISOString(),
          reason: validatedData.reason,
        };
        break;

      case 'remove':
        // This is a soft delete - we'll deactivate and clear organization
        await prisma.user.update({
          where: { id: validatedData.userId },
          data: {
            isActive: false,
            organizationId: null,
            role: 'USER',
          },
        });

        result = {
          action: 'remove',
          userId: validatedData.userId,
          removedAt: new Date().toISOString(),
          reason: validatedData.reason,
        };
        break;

      default:
        return Response.json(
          { success: false, error: 'Unknown user action' },
          { status: 400 }
        );
    }

    // Log the admin action
    await logAdminAction(user, 'USER_MANAGEMENT_ACTION', 'users', {
      organizationId,
      organizationName: organization.name,
      targetUserId: validatedData.userId,
      targetUserEmail: targetUser.email,
      action: validatedData.action,
      details: result,
      adminUser: user.email,
      reason: validatedData.reason,
    }, req);

    return Response.json({
      success: true,
      message: `User action '${validatedData.action}' completed successfully`,
      data: result,
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

    console.error('Admin user management error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to perform user action',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}