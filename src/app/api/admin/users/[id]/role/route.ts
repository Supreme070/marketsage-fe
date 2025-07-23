import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAuthorizedAdmin, getAdminPermissions } from "@/lib/admin-config";
import { prisma } from "@/lib/db/prisma";
import { logPermissionChange } from "@/lib/admin-audit-logger";
import { z } from "zod";

const roleUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN", "IT_ADMIN", "SUPER_ADMIN"]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!permissions.canManageStaff) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = roleUpdateSchema.parse(body);

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-role change
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        role: validatedData.role,
      },
    });

    // Log the permission change
    await logPermissionChange(
      session.user.id,
      session.user.email,
      targetUser.id,
      targetUser.email,
      targetUser.role,
      validatedData.role,
      {
        adminRole: userRole,
        targetUserName: targetUser.name,
        endpoint: `/api/admin/users/${params.id}/role`,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}