import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { ActivityType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Verify campaign exists and user has access
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        sentAt: true,
        lists: {
          select: {
            members: {
              select: {
                contactId: true,
              },
            },
          },
        },
        segments: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Calculate total potential recipients (unique contacts from lists and segments)
    const uniqueContactIds = new Set<string>();
    
    // Add contacts from lists
    for (const list of campaign.lists) {
      for (const member of list.members) {
        uniqueContactIds.add(member.contactId);
      }
    }
    
    // For segments, we'd add those contacts too (simplified for now)
    const totalRecipients = uniqueContactIds.size;

    // Get email activities for this campaign
    const activities = await prisma.emailActivity.findMany({
      where: { campaignId },
      select: {
        type: true,
        createdAt: true,
        metadata: true,
      },
    });

    // Count activities by type
    const activityCounts = {
      [ActivityType.SENT]: 0,
      [ActivityType.DELIVERED]: 0,
      [ActivityType.OPENED]: 0,
      [ActivityType.CLICKED]: 0,
      [ActivityType.BOUNCED]: 0,
      [ActivityType.SPAM]: 0,
      [ActivityType.UNSUBSCRIBED]: 0,
    };

    activities.forEach(activity => {
      activityCounts[activity.type]++;
    });

    // Calculate rates
    const sent = activityCounts[ActivityType.SENT];
    const delivered = activityCounts[ActivityType.DELIVERED] || sent; // If no delivery tracking, assume sent = delivered
    const opened = activityCounts[ActivityType.OPENED];
    const clicked = activityCounts[ActivityType.CLICKED];
    const bounced = activityCounts[ActivityType.BOUNCED];
    const unsubscribed = activityCounts[ActivityType.UNSUBSCRIBED];

    const openRate = sent > 0 ? (opened / sent) * 100 : 0;
    const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;
    const unsubscribeRate = sent > 0 ? (unsubscribed / sent) * 100 : 0;
    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;

    // Extract clicked URLs from activity metadata
    const clickedUrls: Record<string, number> = {};
    activities
      .filter(activity => activity.type === ActivityType.CLICKED)
      .forEach(activity => {
        try {
          const metadata = typeof activity.metadata === 'string' 
            ? JSON.parse(activity.metadata) 
            : activity.metadata;
          
          if (metadata?.url) {
            clickedUrls[metadata.url] = (clickedUrls[metadata.url] || 0) + 1;
          }
        } catch (e) {
          // Ignore invalid metadata
        }
      });

    // Sort clicked URLs by count
    const topClickedUrls = Object.entries(clickedUrls)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([url, count]) => ({ url, clicks: count }));

    // Prepare time-series data for opens over time (grouped by hour)
    const opensOverTime: Record<string, number> = {};
    activities
      .filter(activity => activity.type === ActivityType.OPENED)
      .forEach(activity => {
        const hour = new Date(activity.createdAt).toISOString().slice(0, 13) + ':00:00Z';
        opensOverTime[hour] = (opensOverTime[hour] || 0) + 1;
      });

    const opensTimeSeriesData = Object.entries(opensOverTime)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, count]) => ({ time, opens: count }));

    // Prepare response
    const analytics = {
      summary: {
        totalRecipients,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
      },
      topClickedUrls,
      opensOverTime: opensTimeSeriesData,
      activityBreakdown: activityCounts,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}