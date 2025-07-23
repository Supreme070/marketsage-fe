import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db/prisma';
import { isAuthorizedAdmin } from '@/lib/admin-config';
import { startOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin authorization check
    const userRole = (session.user as any)?.role;
    if (!isAuthorizedAdmin(session.user.email, userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch real-time statistics
    const [incidents, onlineUsers, currentMRR, previousMRR] = await Promise.all([
      // Get active incidents (using AI safety events as proxy for incidents)
      db.aISafetyEvent.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),

      // Get online users (users active in last 5 minutes)
      db.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      }),

      // Calculate current month MRR
      calculateMRR(startOfMonth(new Date())),

      // Calculate previous month MRR
      calculateMRR(startOfMonth(subMonths(new Date(), 1)))
    ]);

    // Determine incident severity based on count
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (incidents >= 10) severity = 'critical';
    else if (incidents >= 5) severity = 'high';
    else if (incidents >= 2) severity = 'medium';

    // Calculate MRR percentage change
    const percentageChange = previousMRR > 0 
      ? ((currentMRR - previousMRR) / previousMRR) * 100 
      : 0;

    return NextResponse.json({
      incidents: {
        count: incidents,
        severity
      },
      onlineUsers,
      mrr: {
        amount: currentMRR,
        percentageChange,
        previousAmount: previousMRR
      }
    });

  } catch (error) {
    console.error('Error fetching quick stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick stats' },
      { status: 500 }
    );
  }
}

// Helper function to calculate MRR
async function calculateMRR(fromDate: Date): Promise<number> {
  const subscriptions = await db.subscription.findMany({
    where: {
      status: 'ACTIVE',
      startDate: {
        lte: new Date()
      },
      OR: [
        { endDate: null },
        { endDate: { gte: fromDate } }
      ]
    },
    include: {
      plan: true
    }
  });

  return subscriptions.reduce((total, sub) => {
    // Convert subscription price to monthly if needed
    let monthlyAmount = sub.plan.price;
    
    if (sub.plan.interval === 'YEARLY') {
      monthlyAmount = sub.plan.price / 12;
    } else if (sub.plan.interval === 'QUARTERLY') {
      monthlyAmount = sub.plan.price / 3;
    }

    return total + monthlyAmount;
  }, 0);
}