import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { SignJWT } from 'jose';
import { z } from 'zod';

// Request validation schema
const impersonationSchema = z.object({
  reason: z.string().min(10).max(500), // Require a reason for impersonation
  duration: z.number().int().min(1).max(24).default(1), // Hours, max 24
});

// Impersonation token payload
interface ImpersonationTokenPayload {
  adminId: string;
  adminEmail: string;
  targetUserId: string;
  targetUserEmail: string;
  reason: string;
  expiresAt: number;
  createdAt: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication - only SUPER_ADMIN can impersonate
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Only Super Admin can impersonate users' 
      }, { status: 403 });
    }

    const targetUserId = params.id;
    const body = await req.json();

    // Validate input
    const validatedData = impersonationSchema.parse(body);

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Cannot impersonate self
    if (targetUserId === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot impersonate your own account' 
      }, { status: 400 });
    }

    // Check if target user exists and is not suspended
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuspended: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.isSuspended) {
      return NextResponse.json({ 
        error: 'Cannot impersonate suspended user' 
      }, { status: 400 });
    }

    // Cannot impersonate another SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Cannot impersonate another Super Admin' 
      }, { status: 403 });
    }

    // Check for recent impersonations (rate limiting)
    const recentImpersonations = await prisma.adminAuditLog.count({
      where: {
        adminUserId: session.user.id,
        action: 'IMPERSONATE_USER',
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentImpersonations >= 5) {
      return NextResponse.json({ 
        error: 'Too many impersonations in the last hour. Please try again later.' 
      }, { status: 429 });
    }

    // Create impersonation token
    const now = Date.now();
    const expiresAt = now + (validatedData.duration * 60 * 60 * 1000); // Hours to milliseconds

    const tokenPayload: ImpersonationTokenPayload = {
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      reason: validatedData.reason,
      expiresAt,
      createdAt: now,
    };

    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
    );

    const impersonationToken = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt / 1000))
      .setSubject(targetUser.id)
      .sign(secret);

    // Log the impersonation
    const auditLog = await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'IMPERSONATE_USER',
        resource: 'USER',
        resourceId: targetUserId,
        details: {
          targetUser: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role,
            organizationId: targetUser.organizationId,
          },
          reason: validatedData.reason,
          duration: validatedData.duration,
          expiresAt: new Date(expiresAt),
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // Create admin note
    await prisma.adminNote.create({
      data: {
        userId: targetUserId,
        createdById: session.user.id,
        note: `Admin impersonation started: ${validatedData.reason}`,
      },
    });

    return NextResponse.json({
      success: true,
      impersonationToken,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        organization: targetUser.organization,
      },
      expiresAt: new Date(expiresAt).toISOString(),
      duration: validatedData.duration,
      message: `Impersonation token created for ${targetUser.email}. Valid for ${validatedData.duration} hour(s).`,
    });
  } catch (error) {
    console.error('Error creating impersonation token:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create impersonation token' },
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
      return NextResponse.json({ 
        error: 'Only Super Admin can end impersonations' 
      }, { status: 403 });
    }

    const targetUserId = params.id;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Log the impersonation end
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'END_IMPERSONATE_USER',
        resource: 'USER',
        resourceId: targetUserId,
        details: {
          targetUser: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
          },
          reason: 'Admin ended impersonation manually',
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // Create admin note
    await prisma.adminNote.create({
      data: {
        userId: targetUserId,
        createdById: session.user.id,
        note: 'Admin impersonation ended manually',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Impersonation of ${targetUser.email} has been ended.`,
    });
  } catch (error) {
    console.error('Error ending impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    );
  }
}

// GET endpoint to verify impersonation token
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;

    // Get active impersonation logs for this user
    const activeImpersonations = await prisma.adminAuditLog.findMany({
      where: {
        resourceId: targetUserId,
        action: 'IMPERSONATE_USER',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        id: true,
        adminUserId: true,
        timestamp: true,
        details: true,
        adminUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      activeImpersonations: activeImpersonations.map(log => ({
        id: log.id,
        admin: log.adminUser,
        createdAt: log.timestamp,
        reason: log.details?.reason,
        duration: log.details?.duration,
        expiresAt: log.details?.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching impersonation status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impersonation status' },
      { status: 500 }
    );
  }
}