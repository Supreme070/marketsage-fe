import { type NextRequest, NextResponse } from "next/server";
import { ActivityType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound 
} from "@/lib/errors";

// GET WhatsApp campaign analytics - Real-time metrics calculation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // Check if campaign exists and user has access
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        createdById: true,
        status: true,
        sentAt: true,
        templateId: true,
        template: {
          select: {
            name: true,
            category: true,
            status: true
          }
        }
      }
    });

    if (!campaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return forbidden("You don't have permission to view this campaign's analytics");
    }

    // Only provide analytics for campaigns that have been sent
    if (campaign.status !== "SENT" && campaign.status !== "SENDING") {
      return NextResponse.json({
        message: "Analytics not available for campaigns that haven't been sent",
        status: campaign.status
      }, { status: 400 });
    }

    // Get real-time campaign analytics from WhatsApp activities
    const activityStats = await prisma.whatsAppActivity.groupBy({
      by: ['type'],
      where: {
        campaignId,
      },
      _count: {
        type: true,
      },
    });

    // Get comprehensive analytics in optimized parallel queries
    const [analyticsData, retryStats] = await Promise.all([
      prisma.$queryRaw<Array<{totalActivities: bigint, uniqueContacts: bigint}>>`
        SELECT 
          COUNT(*) as "totalActivities",
          COUNT(DISTINCT "contactId") as "uniqueContacts"
        FROM "WhatsAppActivity" 
        WHERE "campaignId" = ${campaignId}
      `,
      // Get retry queue statistics for this campaign
      prisma.$queryRaw<Array<{
        pending: bigint,
        processing: bigint,
        failed: bigint,
        succeeded: bigint
      }>>`
        SELECT 
          COUNT(CASE WHEN status = 'RETRY_PENDING' THEN 1 END) as "pending",
          COUNT(CASE WHEN status = 'RETRY_PROCESSING' THEN 1 END) as "processing",
          COUNT(CASE WHEN status = 'FAILED' AND "retryCount" > 0 THEN 1 END) as "failed",
          COUNT(CASE WHEN status = 'SENT' AND "retryCount" > 0 THEN 1 END) as "succeeded"
        FROM "WhatsAppHistory" 
        WHERE "metadata"::text LIKE '%"campaignId":"${campaignId}"%'
      `
    ]);

    const { totalActivities: totalActivitiesBig, uniqueContacts: uniqueContactsBig } = analyticsData[0] || { totalActivities: 0n, uniqueContacts: 0n };
    const totalActivities = Number(totalActivitiesBig);
    const uniqueContacts = Number(uniqueContactsBig);

    // Extract retry statistics
    const retryData = retryStats[0] || { pending: 0n, processing: 0n, failed: 0n, succeeded: 0n };
    const retryMetrics = {
      pending: Number(retryData.pending),
      processing: Number(retryData.processing),
      failed: Number(retryData.failed),
      succeeded: Number(retryData.succeeded)
    };

    // Transform activity stats into counts
    const typeCounts = activityStats.reduce((acc: Record<string, number>, stat) => {
      acc[stat.type] = stat._count.type;
      return acc;
    }, {});

    // Calculate real-time analytics
    const sent = typeCounts[ActivityType.SENT] || 0;
    const delivered = typeCounts[ActivityType.DELIVERED] || 0;
    const failed = typeCounts[ActivityType.FAILED] || 0;
    const opened = typeCounts[ActivityType.OPENED] || 0;
    const clicked = typeCounts[ActivityType.CLICKED] || 0;
    const replied = typeCounts[ActivityType.REPLIED] || 0;

    // Calculate rates based on sent messages
    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const failureRate = sent > 0 ? (failed / sent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const responseRate = delivered > 0 ? (replied / delivered) * 100 : 0;

    // Get time-based analytics if campaign was sent recently
    let timeBasedMetrics = null;
    if (campaign.sentAt) {
      const sentTime = new Date(campaign.sentAt);
      const now = new Date();
      const hoursSinceSent = (now.getTime() - sentTime.getTime()) / (1000 * 60 * 60);

      // Only provide hourly breakdown for campaigns sent within last 24 hours
      if (hoursSinceSent <= 24) {
        const hourlyStats = await prisma.whatsAppActivity.findMany({
          where: {
            campaignId,
            timestamp: {
              gte: sentTime
            }
          },
          select: {
            type: true,
            timestamp: true
          }
        });

        // Group by hour
        const hourlyBreakdown = hourlyStats.reduce((acc: Record<string, Record<string, number>>, activity) => {
          const hour = new Date(activity.timestamp).getHours();
          const hourKey = `${hour}:00`;
          
          if (!acc[hourKey]) {
            acc[hourKey] = { SENT: 0, DELIVERED: 0, FAILED: 0, OPENED: 0, CLICKED: 0, REPLIED: 0 };
          }
          
          acc[hourKey][activity.type] = (acc[hourKey][activity.type] || 0) + 1;
          return acc;
        }, {});

        timeBasedMetrics = {
          hoursSinceSent: Math.round(hoursSinceSent * 10) / 10,
          hourlyBreakdown: Object.entries(hourlyBreakdown).map(([hour, stats]) => ({
            hour,
            ...stats
          }))
        };
      }
    }

    // WhatsApp-specific insights
    const whatsappInsights = {
      templateCompliance: campaign.template?.status === 'APPROVED' ? 'Compliant' : 'Needs Review',
      businessMessaging: true, // WhatsApp Business API compliance
      templateCategory: campaign.template?.category || 'UTILITY',
      isTemplateApproved: campaign.template?.status === 'APPROVED'
    };

    // Prepare analytics response
    const analytics = {
      campaignId,
      status: campaign.status,
      sentAt: campaign.sentAt,
      
      // Core metrics
      sent,
      delivered,
      failed,
      opened,
      clicked,
      replied,
      
      // Calculated rates (rounded to 1 decimal place)
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      failureRate: Math.round(failureRate * 10) / 10,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      responseRate: Math.round(responseRate * 10) / 10,
      
      // Additional metrics
      totalRecipients: uniqueContacts,
      totalActivities,
      
      // WhatsApp Business cost estimates (Meta pricing)
      estimatedCost: sent * 0.0055, // $0.0055 per WhatsApp message estimate
      costPerMessage: 0.0055,
      
      // Time-based metrics
      timeBasedMetrics,
      
      // WhatsApp-specific insights
      whatsappInsights,
      
      // Retry mechanism analytics
      retryMetrics: {
        pending: retryMetrics.pending,
        processing: retryMetrics.processing,
        failed: retryMetrics.failed,
        succeeded: retryMetrics.succeeded,
        totalRetries: retryMetrics.pending + retryMetrics.processing + retryMetrics.failed + retryMetrics.succeeded,
        successRate: (retryMetrics.succeeded + retryMetrics.failed) > 0 ? 
          Math.round((retryMetrics.succeeded / (retryMetrics.succeeded + retryMetrics.failed)) * 100 * 10) / 10 : 0
      },
      
      // Performance insights
      insights: {
        performanceGrade: deliveryRate >= 98 ? 'A' : deliveryRate >= 95 ? 'B' : deliveryRate >= 90 ? 'C' : 'D',
        isHighPerforming: deliveryRate >= 98, // Higher threshold for WhatsApp
        needsAttention: failureRate > 5 || retryMetrics.pending > 0, // Lower threshold for WhatsApp
        responseRating: responseRate >= 10 ? 'High' : responseRate >= 5 ? 'Medium' : 'Low',
        engagementLevel: (openRate + clickRate + responseRate) / 3,
        retryStatus: retryMetrics.pending > 0 ? 'Active' : 
                    retryMetrics.processing > 0 ? 'Processing' : 
                    retryMetrics.succeeded > 0 ? 'Completed' : 'None'
      },
      
      // Template information
      template: campaign.template ? {
        name: campaign.template.name,
        category: campaign.template.category,
        status: campaign.template.status,
        needsReapproval: campaign.template.status !== 'APPROVED'
      } : null
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching WhatsApp campaign analytics:", error);
    return handleApiError(error, "/api/whatsapp/campaigns/[id]/analytics/route.ts");
  }
}