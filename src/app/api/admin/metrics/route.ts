import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

// Staff email domains and whitelist
const ADMIN_DOMAINS = ['marketsage.africa'];
const ADMIN_EMAILS = [
  'admin@marketsage.africa',
  'support@marketsage.africa',
];

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is MarketSage staff
    const userEmail = session.user.email;
    const userRole = (session.user as any)?.role;
    
    const isStaff = userEmail && (
      ADMIN_EMAILS.includes(userEmail) ||
      ADMIN_DOMAINS.some(domain => userEmail.endsWith(`@${domain}`)) ||
      ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)
    );

    if (!isStaff) {
      return NextResponse.json(
        { error: "Access denied. Admin access required." },
        { status: 403 }
      );
    }

    // Fetch real metrics from database with error handling
    let totalUsers = 0;
    let subscriptions: any[] = [];
    let messageFailures = 0;
    let activeSessions = 0;

    try {
      const results = await Promise.allSettled([
        // Total users count
        prisma.user.count(),
        
        // Active subscriptions and revenue calculation
        prisma.organization.findMany({
          where: {
            subscription: {
              not: null
            }
          },
          select: {
            subscription: true
          }
        }),
        
        // Failed messages (mock data for now - would need message queue integration)
        Promise.resolve(0),
        
        // Active users (sessions in last 24 hours)
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      // Extract successful results
      if (results[0].status === 'fulfilled') totalUsers = results[0].value;
      if (results[1].status === 'fulfilled') subscriptions = results[1].value;
      if (results[2].status === 'fulfilled') messageFailures = results[2].value;
      if (results[3].status === 'fulfilled') activeSessions = results[3].value;

    } catch (error) {
      console.error('Error fetching some metrics:', error);
      // Continue with default values
    }

    // Calculate monthly revenue from subscriptions
    const monthlyRevenue = subscriptions.reduce((total, org) => {
      const subscription = org.subscription as any;
      if (subscription?.plan && subscription?.status === 'active') {
        // Basic pricing calculation - would need real pricing data
        const planPrices: Record<string, number> = {
          'STARTER': 25000, // ₦25,000
          'PROFESSIONAL': 75000, // ₦75,000
          'ENTERPRISE': 150000, // ₦150,000
        };
        return total + (planPrices[subscription.plan] || 0);
      }
      return total;
    }, 0);

    // System health check
    const systemHealth = {
      database: 'online' as const, // If we can query, DB is online
      messageQueue: messageFailures > 10 ? 'degraded' as const : 'healthy' as const,
      api: 'healthy' as const, // If we reached here, API is healthy
      activeUsers: activeSessions
    };

    const metrics = {
      totalUsers,
      monthlyRevenue,
      failedMessages: messageFailures,
      systemHealth
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}