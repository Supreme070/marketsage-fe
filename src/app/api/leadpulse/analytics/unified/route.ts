import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const analytics = await request.json();

    // Validate required fields
    if (!analytics.session?.sessionId || !analytics.session?.visitorId) {
      return NextResponse.json(
        { error: 'Missing required session data' },
        { status: 400 }
      );
    }

    const { session, scrollAnalytics, clickHeatmap, behavioralInsights } = analytics;

    // Store unified analytics session
    await prisma.leadPulseAnalytics.upsert({
      where: {
        sessionId: session.sessionId
      },
      update: {
        endTime: session.endTime ? new Date(session.endTime) : null,
        scrollAnalytics: scrollAnalytics || {},
        clickHeatmap: clickHeatmap || {},
        behavioralInsights: behavioralInsights || {},
        engagementScore: behavioralInsights?.engagementScore || 0,
        userIntent: behavioralInsights?.userIntent || 'browse',
        conversionProbability: behavioralInsights?.conversionProbability || 0,
        frustrationSignals: behavioralInsights?.frustrationSignals || [],
        updatedAt: new Date()
      },
      create: {
        id: `analytics_${session.sessionId}`,
        sessionId: session.sessionId,
        visitorId: session.visitorId,
        page: session.page,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : null,
        userAgent: session.userAgent,
        viewport: session.viewport,
        referrer: session.referrer,
        isNewVisitor: session.isNewVisitor,
        scrollAnalytics: scrollAnalytics || {},
        clickHeatmap: clickHeatmap || {},
        behavioralInsights: behavioralInsights || {},
        engagementScore: behavioralInsights?.engagementScore || 0,
        userIntent: behavioralInsights?.userIntent || 'browse',
        conversionProbability: behavioralInsights?.conversionProbability || 0,
        frustrationSignals: behavioralInsights?.frustrationSignals || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update visitor engagement score
    if (behavioralInsights?.engagementScore) {
      try {
        await prisma.leadPulseVisitor.update({
          where: { fingerprint: session.visitorId },
          data: {
            engagementScore: behavioralInsights.engagementScore,
            lastVisit: new Date()
          }
        });
      } catch (error) {
        // Visitor might not exist yet, create minimal record
        await prisma.leadPulseVisitor.upsert({
          where: { fingerprint: session.visitorId },
          update: {
            engagementScore: behavioralInsights.engagementScore,
            lastVisit: new Date()
          },
          create: {
            id: `visitor_${session.visitorId}`,
            fingerprint: session.visitorId,
            engagementScore: behavioralInsights.engagementScore,
            isActive: true,
            totalVisits: 1,
            firstVisit: new Date(),
            lastVisit: new Date()
          }
        });
      }
    }

    // Log insights for monitoring
    logger.info('Unified analytics recorded', {
      sessionId: session.sessionId,
      engagementScore: behavioralInsights?.engagementScore,
      userIntent: behavioralInsights?.userIntent,
      conversionProbability: behavioralInsights?.conversionProbability,
      frustrationSignals: behavioralInsights?.frustrationSignals?.length || 0,
      scrollDepth: scrollAnalytics?.averageDepth,
      totalClicks: clickHeatmap?.totalClicks
    });

    // Check for actionable insights
    if (behavioralInsights?.frustrationSignals?.length > 0) {
      logger.warn('User frustration detected', {
        sessionId: session.sessionId,
        signals: behavioralInsights.frustrationSignals,
        page: session.page
      });
    }

    if (behavioralInsights?.conversionProbability > 70) {
      logger.info('High conversion probability user', {
        sessionId: session.sessionId,
        probability: behavioralInsights.conversionProbability,
        intent: behavioralInsights.userIntent,
        recommendations: behavioralInsights.recommendedActions
      });
    }

    return NextResponse.json({ 
      success: true,
      insights: {
        engagementScore: behavioralInsights?.engagementScore,
        userIntent: behavioralInsights?.userIntent,
        conversionProbability: behavioralInsights?.conversionProbability,
        recommendations: behavioralInsights?.recommendedActions
      }
    });
  } catch (error) {
    logger.error('Error recording unified analytics:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const visitorId = searchParams.get('visitorId');
    const timeRange = searchParams.get('timeRange') || '24h';

    const whereClause: any = {};

    if (sessionId) {
      whereClause.sessionId = sessionId;
    } else if (visitorId) {
      whereClause.visitorId = visitorId;
    }

    // Add time range filter
    const now = new Date();
    let cutoffTime: Date;
    switch (timeRange) {
      case '1h': cutoffTime = new Date(now.getTime() - 60 * 60 * 1000); break;
      case '6h': cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
      case '24h': cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      default: cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    whereClause.createdAt = { gte: cutoffTime };

    const analytics = await prisma.leadPulseAnalytics.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: sessionId ? 1 : 100
    });

    // Calculate aggregated insights
    const aggregatedInsights = {
      totalSessions: analytics.length,
      averageEngagement: analytics.reduce((sum, a) => sum + (a.engagementScore || 0), 0) / analytics.length,
      conversionProbabilities: analytics.map(a => a.conversionProbability || 0),
      userIntents: analytics.reduce((acc, a) => {
        acc[a.userIntent || 'browse'] = (acc[a.userIntent || 'browse'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      frustrationPatterns: analytics.flatMap(a => a.frustrationSignals || [])
        .reduce((acc, signal) => {
          acc[signal] = (acc[signal] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };

    return NextResponse.json({
      analytics: sessionId ? analytics[0] : analytics,
      insights: aggregatedInsights
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}