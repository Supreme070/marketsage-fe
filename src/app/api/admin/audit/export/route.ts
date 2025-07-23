import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAuthorizedAdmin, getAdminPermissions } from "@/lib/admin-config";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { format } from "date-fns";

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
    const type = searchParams.get("type") || "all";
    const action = searchParams.get("action") || "";
    const resource = searchParams.get("resource") || "";
    const userId = searchParams.get("userId") || "";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Build where clause
    const where: Prisma.LeadPulseAuditLogWhereInput = {};

    // Type-specific filters
    if (type !== "all") {
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

    // Get all matching logs
    const logs = await prisma.leadPulseAuditLog.findMany({
      where,
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

    // Create CSV content
    const headers = [
      "Timestamp",
      "User Email",
      "User Role",
      "Action",
      "Resource",
      "Resource ID",
      "IP Address",
      "User Agent",
      "Changes",
      "Metadata"
    ];

    const rows = logs.map(log => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      log.userEmail || "",
      log.user?.role || "",
      log.action,
      log.resource,
      log.resourceId,
      log.ipAddress || "",
      log.userAgent || "",
      log.changes ? JSON.stringify(log.changes) : "",
      log.metadata ? JSON.stringify(log.metadata) : ""
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Log this export
    await prisma.leadPulseAuditLog.create({
      data: {
        action: "EXPORT",
        resource: "audit_logs",
        resourceId: `export_${type}`,
        userId: session.user.id,
        userEmail: session.user.email,
        metadata: {
          endpoint: "/api/admin/audit/export",
          filters: {
            type,
            action,
            resource,
            userId,
            search,
            dateFrom,
            dateTo,
          },
          recordCount: logs.length,
        },
      },
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`,
      },
    });
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json(
      { error: "Failed to export audit logs" },
      { status: 500 }
    );
  }
}