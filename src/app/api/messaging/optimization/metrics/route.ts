import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { providerOptimizationEngine } from '@/lib/messaging/provider-optimization-engine';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const updateMetricsSchema = z.object({
  provider: z.string(),
  channel: z.enum(['sms', 'email', 'whatsapp']),
  region: z.string(),
  messageCount: z.number().min(1),
  successCount: z.number().min(0),
  failCount: z.number().min(0),
  averageDeliveryTime: z.number().min(0)
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateMetricsSchema.parse(body);

    await providerOptimizationEngine.updateProviderMetrics(
      validatedData.provider,
      validatedData.channel,
      validatedData.region,
      validatedData.messageCount,
      validatedData.successCount,
      validatedData.failCount,
      validatedData.averageDeliveryTime
    );

    return NextResponse.json({
      success: true,
      message: 'Provider metrics updated successfully'
    });

  } catch (error) {
    console.error('Provider metrics update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update metrics'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const region = searchParams.get('region');
    const timeframe = searchParams.get('timeframe') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build query conditions
    const whereConditions: any = {
      lastUpdated: {
        gte: startDate
      }
    };

    if (channel) {
      whereConditions.channel = channel;
    }

    if (region) {
      whereConditions.region = region;
    }

    // Get provider metrics
    const metrics = await prisma.providerMetrics.findMany({
      where: whereConditions,
      orderBy: [
        { channel: 'asc' },
        { provider: 'asc' },
        { lastUpdated: 'desc' }
      ]
    });

    // Get aggregated performance data
    const performanceData = await prisma.providerMetrics.groupBy({
      by: ['provider', 'channel'],
      where: whereConditions,
      _avg: {
        deliveryRate: true,
        averageDeliveryTime: true,
        errorRate: true
      },
      _sum: {
        totalMessagesSent: true,
        totalSuccessful: true,
        totalFailed: true
      }
    });

    // Format response
    const formattedMetrics = metrics.map(metric => ({
      provider: metric.provider,
      channel: metric.channel,
      region: metric.region,
      deliveryRate: metric.deliveryRate,
      averageDeliveryTime: metric.averageDeliveryTime,
      errorRate: metric.errorRate,
      totalMessagesSent: metric.totalMessagesSent,
      totalSuccessful: metric.totalSuccessful,
      totalFailed: metric.totalFailed,
      lastUpdated: metric.lastUpdated
    }));

    const formattedPerformance = performanceData.map(data => ({
      provider: data.provider,
      channel: data.channel,
      avgDeliveryRate: data._avg.deliveryRate,
      avgDeliveryTime: data._avg.averageDeliveryTime,
      avgErrorRate: data._avg.errorRate,
      totalMessagesSent: data._sum.totalMessagesSent,
      totalSuccessful: data._sum.totalSuccessful,
      totalFailed: data._sum.totalFailed
    }));

    return NextResponse.json({
      success: true,
      metrics: formattedMetrics,
      performance: formattedPerformance,
      timeframe: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Provider metrics retrieval error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to retrieve metrics'
    }, { status: 500 });
  }
}