import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockInsightData } from '@/app/api/leadpulse/_mockData';

/**
 * GET /api/leadpulse/insights
 * Returns AI-powered insights about visitors
 */
export async function GET(request: NextRequest) {
  try {
    // Attempt to fetch real insight data
    // In a production system, this would:
    // 1. Query visitor analytics data
    // 2. Run AI analysis algorithms
    // 3. Generate actionable insights
    
    try {
      // Query some visitor data to generate insights
      const visitorCount = await prisma.anonymousVisitor.count();
      
      // If we have visitors, generate some basic insights
      if (visitorCount > 0) {
        // Get some engagement stats
        const highEngagementVisitors = await prisma.anonymousVisitor.count({
          where: {
            engagementScore: {
              gte: 70
            }
          }
        });
        
        const conversionRate = await prisma.anonymousVisitor.count({
          where: {
            contactId: {
              not: null
            }
          }
        }) / visitorCount * 100;
        
        // Get page view data
        const touchpoints = await prisma.leadPulseTouchpoint.findMany({
          take: 100,
          orderBy: {
            timestamp: 'desc'
          }
        });
        
        // Calculate page popularity
        const pageViews = new Map<string, number>();
        touchpoints.forEach((tp: { pageUrl: string }) => {
          const url = tp.pageUrl;
          pageViews.set(url, (pageViews.get(url) || 0) + 1);
        });
        
        // Sort pages by views
        const sortedPages = [...pageViews.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        const topPage = sortedPages[0];
        
        // Generate insights
        const insights = [
          {
            id: 'i1',
            type: 'behavior',
            title: `${highEngagementVisitors} highly engaged visitors`,
            description: `You have ${highEngagementVisitors} visitors with high engagement scores. These visitors are more likely to convert.`,
            importance: highEngagementVisitors > 10 ? 'high' : 'medium',
            metric: {
              label: 'High Engagement Visitors',
              value: highEngagementVisitors,
              format: 'number'
            },
            recommendation: 'Consider targeting these visitors with personalized offers.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'i2',
            type: 'trend',
            title: topPage ? `${topPage[0]} is your most visited page` : 'Page popularity insight',
            description: topPage 
              ? `Your page ${topPage[0]} has received ${topPage[1]} views, making it your most popular content.` 
              : 'Monitor which pages are receiving the most traffic.',
            importance: 'medium',
            metric: {
              label: 'Views',
              value: topPage ? topPage[1] : 0,
              format: 'number'
            },
            recommendation: 'Optimize this page further to increase conversions.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'i3',
            type: 'prediction',
            title: 'Conversion rate opportunity',
            description: `Your current conversion rate is ${conversionRate.toFixed(1)}%. With improvements to your forms and calls-to-action, you could increase this significantly.`,
            importance: conversionRate < 5 ? 'high' : 'medium',
            metric: {
              label: 'Conversion Rate',
              value: conversionRate,
              format: 'percentage'
            },
            recommendation: 'Test different form layouts and CTAs to improve conversion.',
            createdAt: new Date().toISOString()
          }
        ];
        
        return NextResponse.json({ insights });
      }
    } catch (prismaError) {
      console.error('Error generating insights from Prisma data:', prismaError);
      // Continue to fallback data
    }
    
    // If no data or error, return mock insights as fallback
    const mockInsights = generateMockInsightData();
    return NextResponse.json({ insights: mockInsights });
    
  } catch (error) {
    console.error('Error in insights API:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
} 