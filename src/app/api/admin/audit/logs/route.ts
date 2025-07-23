import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAuthorizedAdmin, getAdminPermissions } from "@/lib/admin-config";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "admin-actions";
    const action = searchParams.get("action") || "";
    const resource = searchParams.get("resource") || "";
    const userId = searchParams.get("userId") || "";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Build where clause based on type and filters
    const where: Prisma.LeadPulseAuditLogWhereInput = {};

    // Type-specific filters
    switch (type) {
      case "admin-actions":
        where.userId = { not: null };
        where.action = {
          in: ["CREATE", "UPDATE", "DELETE", "PERMISSION_CHANGE"],
        };
        break;
      case "system-changes":
        where.OR = [
          { resource: { in: ["system", "configuration", "settings"] } },
          { action: { in: ["SYSTEM_UPDATE", "CONFIG_CHANGE"] } },
        ];
        break;
      case "access-logs":
        where.action = { in: ["LOGIN", "LOGOUT", "SESSION_START", "SESSION_END"] };
        break;
      case "data-changes":
        where.action = { in: ["CREATE", "UPDATE", "DELETE"] };
        where.resource = {
          notIn: ["system", "configuration", "settings"],
        };
        break;
    }

    // Apply additional filters
    if (action) {
      where.action = action;
    }
    if (resource) {
      where.resource = resource;
    }
    if (userId) {
      where.userId = userId;
    }
    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: "insensitive" } },
        { resource: { contains: search, mode: "insensitive" } },
        { resourceId: { contains: search, mode: "insensitive" } },
      ];
    }
    if (dateFrom) {
      where.timestamp = {
        ...where.timestamp as any,
        gte: new Date(dateFrom),
      };
    }
    if (dateTo) {
      where.timestamp = {
        ...where.timestamp as any,
        lte: new Date(dateTo + "T23:59:59.999Z"),
      };
    }

    // Get total count
    const total = await prisma.leadPulseAuditLog.count({ where });

    // Get paginated logs
    const logs = await prisma.leadPulseAuditLog.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
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

    // Log this access
    await prisma.leadPulseAuditLog.create({
      data: {
        action: "VIEW",
        resource: "audit_logs",
        resourceId: type,
        userId: session.user.id,
        userEmail: session.user.email,
        metadata: {
          endpoint: "/api/admin/audit/logs",
          filters: {
            type,
            action,
            resource,
            userId,
            search,
            dateFrom,
            dateTo,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}