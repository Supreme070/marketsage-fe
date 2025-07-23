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

    const issues = await AdminSubscriptionService.verifySubscriptionIntegrity();
    return NextResponse.json(issues);
  } catch (error) {
    console.error("Failed to verify subscription integrity:", error);
    return NextResponse.json(
      { error: "Failed to verify subscription integrity" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subscriptionId, action, reason } = body;

    if (!subscriptionId || !action || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await AdminSubscriptionService.manuallyVerifySubscription(
      subscriptionId,
      session.user.id,
      action,
      reason
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to verify subscription:", error);
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    );
  }
}