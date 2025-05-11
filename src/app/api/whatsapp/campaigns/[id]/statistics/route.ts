import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ActivityType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// GET WhatsApp campaign statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // Check if campaign exists and user has access
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check if user has access to this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get campaign statistics
    const activityStats = await prisma.whatsAppActivity.groupBy({
      by: ['type'],
      where: {
        campaignId,
      },
      _count: {
        type: true,
      },
    });

    // Get total recipient count
    const totalRecipients = await prisma.whatsAppActivity.count({
      where: {
        campaignId,
      },
    });

    // Transform activity stats into a more usable format
    const typeCounts = activityStats.reduce((acc: Record<string, number>, stat) => {
      acc[stat.type] = stat._count.type;
      return acc;
    }, {});

    // Calculate percentages
    const stats = {
      totalRecipients,
      sent: typeCounts[ActivityType.SENT] || 0,
      delivered: typeCounts[ActivityType.DELIVERED] || 0,
      opened: typeCounts[ActivityType.OPENED] || 0,
      clicked: typeCounts[ActivityType.CLICKED] || 0,
      replied: typeCounts[ActivityType.REPLIED] || 0,
      failed: typeCounts[ActivityType.FAILED] || 0,
      deliveryRate: totalRecipients > 0 ? ((typeCounts[ActivityType.DELIVERED] || 0) / totalRecipients) * 100 : 0,
      openRate: totalRecipients > 0 ? ((typeCounts[ActivityType.OPENED] || 0) / totalRecipients) * 100 : 0,
      clickRate: totalRecipients > 0 ? ((typeCounts[ActivityType.CLICKED] || 0) / totalRecipients) * 100 : 0,
      replyRate: totalRecipients > 0 ? ((typeCounts[ActivityType.REPLIED] || 0) / totalRecipients) * 100 : 0,
      failureRate: totalRecipients > 0 ? ((typeCounts[ActivityType.FAILED] || 0) / totalRecipients) * 100 : 0,
    };

    // Get activity timeline (grouped by day)
    const timeline = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        type,
        COUNT(*) as count
      FROM WhatsAppActivity
      WHERE campaignId = ${campaignId}
      GROUP BY DATE(timestamp), type
      ORDER BY date ASC
    `;

    return NextResponse.json({
      ...stats,
      timeline
    });
  } catch (error) {
    console.error("Error fetching WhatsApp campaign statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp campaign statistics" },
      { status: 500 }
    );
  }
} 