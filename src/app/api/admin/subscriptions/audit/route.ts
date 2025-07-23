import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSubscriptionService } from "@/lib/admin-subscription-service";
import prisma from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !["ADMIN", "SUPER_ADMIN", "IT_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const auditData = await AdminSubscriptionService.getSubscriptionAudit();
    return NextResponse.json(auditData);
  } catch (error) {
    console.error("Failed to fetch subscription audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription audit" },
      { status: 500 }
    );
  }
}