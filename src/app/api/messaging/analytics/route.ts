import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const timeframe = searchParams.get('timeframe') || '30d';

    // Calculate date range
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default timeframes
      switch (timeframe) {
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Get usage data
    const usage = await prisma.messagingUsage.findMany({
      where: {
        organizationId: session.user.organization.id,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Get credit transactions
    const creditTransactions = await prisma.creditTransaction.findMany({
      where: {
        organizationId: session.user.organization.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get current organization data
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organization.id },
      select: {
        creditBalance: true,
        messagingModel: true,
        autoTopUp: true,
        autoTopUpAmount: true,
        autoTopUpThreshold: true,
        region: true,
      },
    });

    // Calculate summary statistics
    const summary = usage.reduce((acc, item) => {
      const key = item.channel;
      if (!acc[key]) {
        acc[key] = { messages: 0, credits: 0 };
      }
      acc[key].messages += item.messageCount;
      acc[key].credits += item.credits;
      return acc;
    }, {} as Record<string, { messages: number; credits: number }>);

    // Ensure all channels are represented
    const fullSummary = {
      sms: summary.sms || { messages: 0, credits: 0 },
      email: summary.email || { messages: 0, credits: 0 },
      whatsapp: summary.whatsapp || { messages: 0, credits: 0 },
    };

    // Calculate daily breakdown
    const dailyBreakdown = usage.reduce((acc, item) => {
      const date = item.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { sms: 0, email: 0, whatsapp: 0, totalCredits: 0 };
      }
      acc[date][item.channel as keyof typeof acc[typeof date]] += item.messageCount;
      acc[date].totalCredits += item.credits;
      return acc;
    }, {} as Record<string, { sms: number; email: number; whatsapp: number; totalCredits: number }>);

    // Calculate provider breakdown
    const providerBreakdown = usage.reduce((acc, item) => {
      const provider = item.provider;
      if (!acc[provider]) {
        acc[provider] = { messages: 0, credits: 0, channels: {} };
      }
      acc[provider].messages += item.messageCount;
      acc[provider].credits += item.credits;
      
      if (!acc[provider].channels[item.channel]) {
        acc[provider].channels[item.channel] = { messages: 0, credits: 0 };
      }
      acc[provider].channels[item.channel].messages += item.messageCount;
      acc[provider].channels[item.channel].credits += item.credits;
      
      return acc;
    }, {} as Record<string, { messages: number; credits: number; channels: Record<string, { messages: number; credits: number }> }>);

    // Calculate cost analysis
    const totalCreditsUsed = usage.reduce((sum, item) => sum + item.credits, 0);
    const totalCreditsSpent = creditTransactions
      .filter(t => t.type === 'purchase' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const costPerMessage = totalCreditsUsed > 0 ? totalCreditsSpent / usage.reduce((sum, item) => sum + item.messageCount, 0) : 0;
    const costPerChannel = {
      sms: fullSummary.sms.messages > 0 ? fullSummary.sms.credits / fullSummary.sms.messages : 0,
      email: fullSummary.email.messages > 0 ? fullSummary.email.credits / fullSummary.email.messages : 0,
      whatsapp: fullSummary.whatsapp.messages > 0 ? fullSummary.whatsapp.credits / fullSummary.whatsapp.messages : 0,
    };

    // Calculate ROI metrics (simplified - would need campaign conversion data for full ROI)
    const estimatedROI = {
      totalSpent: totalCreditsSpent,
      messagesDelivered: usage.reduce((sum, item) => sum + item.messageCount, 0),
      estimatedReach: usage.reduce((sum, item) => sum + item.messageCount, 0) * 0.95, // 95% delivery rate assumption
      costEfficiency: costPerMessage,
    };

    // Get recent transactions for activity feed
    const recentTransactions = creditTransactions.slice(0, 10).map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt,
      paymentMethod: t.paymentMethod,
    }));

    return NextResponse.json({
      organization,
      summary: fullSummary,
      dailyBreakdown,
      providerBreakdown,
      costAnalysis: {
        totalCreditsUsed,
        totalCreditsSpent,
        costPerMessage,
        costPerChannel,
      },
      roiMetrics: estimatedROI,
      recentTransactions,
      usage: usage.slice(0, 50), // Limit to recent usage
      timeframe: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching messaging analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}