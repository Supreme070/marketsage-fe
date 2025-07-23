import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-api-auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Request validation schema
const getUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'IT_ADMIN', 'ADMIN', 'USER']).optional(),
  status: z.enum(['active', 'pending_verification', 'suspended']).optional(),
  organizationId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'email', 'name', 'lastActiveAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Response types
interface UserListResponse {
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: 'active' | 'pending_verification' | 'suspended';
    emailVerified: Date | null;
    lastActiveAt: Date | null;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
    } | null;
    _count: {
      emailCampaigns: number;
      contacts: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    suspended: number;
    verified: number;
    unverified: number;
    byRole: {
      SUPER_ADMIN: number;
      ADMIN: number;
      USER: number;
    };
  };
}

export async function GET(req: NextRequest) {
  try {
    console.log('Admin Users API: Starting request');
    
    // Check authentication
    const auth = await checkAdminAuth();
    console.log('Admin Users API: Auth check result:', { authorized: auth.authorized });
    
    if (!auth.authorized) {
      console.log('Admin Users API: Unauthorized, returning auth response');
      return auth.response;
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const validatedParams = getUsersSchema.parse(searchParams);

    // Build where clause
    const whereClause: Prisma.UserWhereInput = {};

    // Search filter
    if (validatedParams.search) {
      whereClause.OR = [
        { email: { contains: validatedParams.search, mode: 'insensitive' } },
        { name: { contains: validatedParams.search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (validatedParams.role) {
      whereClause.role = validatedParams.role;
    }

    // Status filter
    if (validatedParams.status === 'suspended') {
      whereClause.isSuspended = true;
    } else if (validatedParams.status === 'active') {
      whereClause.isSuspended = false;
      whereClause.emailVerified = { not: null };
    } else if (validatedParams.status === 'pending_verification') {
      whereClause.emailVerified = null;
      whereClause.isSuspended = false;
    }

    // Organization filter
    if (validatedParams.organizationId) {
      whereClause.organizationId = validatedParams.organizationId;
    }

    // If not SUPER_ADMIN, only show users from same organization
    if (auth.session?.user?.role === 'ADMIN' && auth.session?.user?.organizationId) {
      whereClause.organizationId = auth.session.user.organizationId;
    }

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // Execute queries in parallel for better performance
    let users, total, stats;
    try {
      [users, total, stats] = await Promise.all([
      // Get users with pagination
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          lastActiveAt: true,
          createdAt: true,
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
              emailCampaigns: true,
              contacts: true,
            },
          },
        },
        orderBy: {
          [validatedParams.sortBy]: validatedParams.sortOrder,
        },
        skip,
        take: validatedParams.limit,
      }),

      // Get total count
      prisma.user.count({ where: whereClause }),

      // Get statistics  
      prisma.user.groupBy({
        by: ['role', 'isSuspended'],
        _count: true,
        where: auth.session?.user?.role === 'ADMIN' && auth.session?.user?.organizationId
          ? { organizationId: auth.session.user.organizationId }
          : undefined,
      }),
    ]);
    } catch (dbError) {
      console.error('Admin Users API: Database query failed:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    // Process statistics
    const processedStats = {
      total: 0,
      active: 0,
      suspended: 0,
      verified: 0,
      unverified: 0,
      byRole: {
        SUPER_ADMIN: 0,
        ADMIN: 0,
        USER: 0,
      },
    };

    stats.forEach(stat => {
      const count = stat._count;
      processedStats.total += count;
      
      if (stat.isSuspended) {
        processedStats.suspended += count;
      } else {
        processedStats.active += count;
      }
      
      if (stat.role in processedStats.byRole) {
        processedStats.byRole[stat.role as keyof typeof processedStats.byRole] += count;
      }
    });

    // Get verified/unverified counts separately 
    const [verifiedCount, unverifiedCount] = await Promise.all([
      prisma.user.count({ 
        where: { 
          ...whereClause, 
          emailVerified: { not: null } 
        } 
      }),
      prisma.user.count({ 
        where: { 
          ...whereClause, 
          emailVerified: null 
        } 
      })
    ]);

    processedStats.verified = verifiedCount;
    processedStats.unverified = unverifiedCount;

    // Format users
    const formattedUsers = users.map(user => ({
      ...user,
      status: user.isSuspended ? 'suspended' as const : 
              user.emailVerified ? 'active' as const : 'pending_verification' as const,
    }));

    // Prepare response
    const response = {
      success: true,
      users: formattedUsers,
      total,
      totalPages: Math.ceil(total / validatedParams.limit),
      page: validatedParams.page,
      limit: validatedParams.limit,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        totalPages: Math.ceil(total / validatedParams.limit),
      },
      stats: processedStats,
    };

    // Log the admin access
    await prisma.auditLog.create({
      data: {
        userId: auth.session?.user?.id || 'unknown',
        action: 'VIEW_USERS',
        entity: 'USER',
        entityId: 'list',
        metadata: {
          filters: validatedParams,
          resultsCount: users.length,
          userEmail: auth.session?.user?.email,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    // Check if it's a database connection error
    if (error.message?.includes('connect') || error.message?.includes('connection')) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }
    
    // Check if it's specifically the "Network unavailable" error
    if (error.message?.includes('Network unavailable')) {
      console.error('Admin Users API: Network unavailable error - likely admin portal disabled');
      return NextResponse.json(
        { error: 'Network unavailable' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}