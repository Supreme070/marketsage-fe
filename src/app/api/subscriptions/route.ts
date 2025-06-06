import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import type { Organization, Subscription, SubscriptionPlan, Transaction, User } from "@prisma/client";

interface UserWithOrganization extends User {
  organization: (Organization & {
    subscriptions: (Subscription & {
      plan: SubscriptionPlan;
      transactions: Transaction[];
    })[];
  }) | null;
}

// Get current subscription
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: {
                OR: [
                  { status: "ACTIVE" },
                  { status: "TRIALING" }
                ]
              },
              include: {
                plan: true,
                transactions: {
                  orderBy: {
                    createdAt: "desc"
                  },
                  take: 1
                }
              },
              orderBy: {
                createdAt: "desc"
              },
              take: 1
            }
          }
        }
      }
    }) as UserWithOrganization | null;

    if (!user?.organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const activeSubscription = user.organization.subscriptions[0];

    return NextResponse.json({
      subscription: activeSubscription,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        billingEmail: user.organization.billingEmail || user.email,
        billingName: user.organization.billingName,
        billingAddress: user.organization.billingAddress,
      }
    });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's organization and active subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              take: 1
            }
          }
        }
      }
    }) as UserWithOrganization | null;

    if (!user?.organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const activeSubscription = user.organization.subscriptions[0];

    if (!activeSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date()
      }
    });

    return NextResponse.json({
      message: "Subscription canceled successfully"
    });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
} 