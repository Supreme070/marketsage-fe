import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubscriptionService, SubscriptionTier, type TierFeatures } from "./subscription-service";
import prisma from "@/lib/db/prisma";

export interface SubscriptionCheckOptions {
  feature?: keyof TierFeatures;
  minimumTier?: SubscriptionTier;
  usageType?: "emails" | "sms" | "whatsapp" | "leadPulseVisits";
  incrementUsage?: number;
}

/**
 * Middleware to check subscription permissions
 * Use this in API routes to gate features based on subscription tier
 */
export async function requireSubscription(options: SubscriptionCheckOptions = {}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Get user's organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  // Check specific feature access
  if (options.feature) {
    const hasAccess = await SubscriptionService.checkFeatureAccess(
      user.organizationId,
      options.feature
    );

    if (!hasAccess) {
      return NextResponse.json(
        { 
          error: "Feature not available in your current plan",
          feature: options.feature,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }
  }

  // Check minimum tier requirement
  if (options.minimumTier) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { subscriptionTier: true },
    });

    const currentTier = org?.subscriptionTier || "FREE";
    const tierOrder = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
    
    if (tierOrder.indexOf(currentTier) < tierOrder.indexOf(options.minimumTier)) {
      return NextResponse.json(
        { 
          error: `This feature requires ${options.minimumTier} tier or higher`,
          currentTier,
          requiredTier: options.minimumTier,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }
  }

  // Check usage limits for metered features
  if (options.usageType) {
    const usageCheck = await SubscriptionService.checkUsageLimit(
      user.organizationId,
      options.usageType,
      options.incrementUsage || 0
    );

    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: `${options.usageType} limit exceeded`,
          limit: usageCheck.limit,
          remaining: usageCheck.remaining,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }
  }

  // All checks passed
  return null;
}

/**
 * Higher-order function to wrap API route handlers with subscription checks
 */
export function withSubscription(
  handler: Function,
  options: SubscriptionCheckOptions = {}
) {
  return async (request: Request, context?: any) => {
    const subscriptionError = await requireSubscription(options);
    if (subscriptionError) {
      return subscriptionError;
    }
    return handler(request, context);
  };
}