import { type NextRequest, NextResponse } from 'next/server';
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

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const usage = await prisma.messagingUsage.findMany({
      where: {
        organizationId: session.user.organization.id,
        timestamp: {
          gte: startDate ? new Date(startDate) : defaultStartDate,
          lte: endDate ? new Date(endDate) : defaultEndDate,
        },
      },
      orderBy: { timestamp: 'desc' },
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

    return NextResponse.json({
      usage,
      summary: fullSummary,
    });
  } catch (error) {
    console.error('Error fetching messaging usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}