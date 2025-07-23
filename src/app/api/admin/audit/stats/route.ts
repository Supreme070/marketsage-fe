import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAuthorizedAdmin, getAdminPermissions } from "@/lib/admin-config";
import { prisma } from "@/lib/db/prisma";
import { startOfDay, subDays } from "date-fns";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is authorized admin
    const userRole = (session.user as any)?.role;
    if (!isAuthorizedAdmin(session.user.email, userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check permissions
    const permissions = getAdminPermissions(userRole);
    if (!permissions.canViewAudit) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get total events count
    const totalEvents = await prisma.leadPulseAuditLog.count();

    // Get today's events count
    const todayEvents = await prisma.leadPulseAuditLog.count({
      where: {
        timestamp: {
          gte: startOfDay(new Date()),
        },
      },
    });

    // Get active users count (unique users who performed actions)
    const activeUsersResult = await prisma.leadPulseAuditLog.groupBy({
      by: ["userId"],
      where: {
        userId: {
          not: null,
        },
      },
    });
    const activeUsers = activeUsersResult.length;

    // Get system changes count
    const systemChanges = await prisma.leadPulseAuditLog.count({
      where: {
        OR: [
          { resource: "system" },
          { resource: "configuration" },
          { resource: "settings" },
          { action: "SYSTEM_UPDATE" },
          { action: "CONFIG_CHANGE" },
        ],
      },
    });

    // Get recent activities (last 10)
    const recentActivities = await prisma.leadPulseAuditLog.findMany({
      take: 10,
      orderBy: {
        timestamp: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Get top resources
    const topResourcesRaw = await prisma.$queryRaw<{ resource: string; count: bigint }[]>`
      SELECT resource, COUNT(*) as count
      FROM "LeadPulseAuditLog"
      GROUP BY resource
      ORDER BY count DESC
      LIMIT 5
    `;
    const topResources = topResourcesRaw.map(item => ({
      resource: item.resource,
      count: Number(item.count),
    }));

    // Get top users
    const topUsersRaw = await prisma.$queryRaw<{ userId: string; userEmail: string; count: bigint }[]>`
      SELECT "userId", "userEmail", COUNT(*) as count
      FROM "LeadPulseAuditLog"
      WHERE "userId" IS NOT NULL
      GROUP BY "userId", "userEmail"
      ORDER BY count DESC
      LIMIT 5
    `;
    const topUsers = topUsersRaw.map(item => ({
      userId: item.userId,
      email: item.userEmail,
      count: Number(item.count),
    }));

    // Log this access
    await prisma.leadPulseAuditLog.create({
      data: {
        action: "VIEW",
        resource: "audit_stats",
        resourceId: "overview",
        userId: session.user.id,
        userEmail: session.user.email,
        metadata: {
          endpoint: "/api/admin/audit/stats",
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalEvents,
        todayEvents,
        activeUsers,
        systemChanges,
        recentActivities,
        topResources,
        topUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit statistics" },
      { status: 500 }
    );
  }
}