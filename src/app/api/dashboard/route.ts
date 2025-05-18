import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { handleApiError, unauthorized } from "@/lib/errors";

// Create a new Prisma instance directly in this file for reliability
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30"; // Default to 30 days

    // Convert period to date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    try {
      // Check if database is accessible with a simple query first
      const userCount = await prisma.user.count({
        where: { id: userId }
      });
      
      if (userCount === 0) {
        // User not found, return empty response
        return NextResponse.json({
          emailStats: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            openRate: 0,
            clickRate: 0,
            bounceRate: 0,
          },
          contactStats: {
            total: 0,
            new: 0,
            growthRate: 0,
          },
          opensByHour: Array(24).fill(0).map((_, hour) => ({ 
            hour: hour.toString().padStart(2, '0'), 
            count: 0 
          })),
          campaignPerformance: [],
          workflowStats: {
            active: 0,
          },
        });
      }
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      // Return a default response when database is inaccessible
      return NextResponse.json({
        error: "Database connection failed",
        emailStats: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0,
        },
        contactStats: {
          total: 0,
          new: 0,
          growthRate: 0,
        },
        opensByHour: Array(24).fill(0).map((_, hour) => ({ 
          hour: hour.toString().padStart(2, '0'), 
          count: 0 
        })),
        campaignPerformance: [],
        workflowStats: {
          active: 0,
        },
      });
    }

    // Get email campaigns data
    let emailCampaigns = [];
    try {
      emailCampaigns = await prisma.emailCampaign.findMany({
        where: {
          createdById: userId,
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          EmailActivity: true,
        },
      });
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      emailCampaigns = [];
    }

    // Get SMS campaigns data
    let smsCampaigns = [];
    try {
      smsCampaigns = await prisma.smSCampaign.findMany({
        where: {
          createdById: userId,
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          SMSActivity: true,
        },
      });
    } catch (error) {
      console.error("Error fetching SMS campaigns:", error);
      smsCampaigns = [];
    }

    // Get WhatsApp campaigns data
    let whatsAppCampaigns = [];
    try {
      whatsAppCampaigns = await prisma.whatsAppCampaign.findMany({
        where: {
          createdById: userId,
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          WhatsAppActivity: true,
        },
      });
    } catch (error) {
      console.error("Error fetching WhatsApp campaigns:", error);
      whatsAppCampaigns = [];
    }

    // Get contacts count
    let totalContacts = 0;
    try {
      totalContacts = await prisma.contact.count({
        where: {
          createdById: userId,
        },
      });
    } catch (error) {
      console.error("Error counting contacts:", error);
    }
    
    // Get new contacts (last 30 days)
    let newContacts = 0;
    try {
      newContacts = await prisma.contact.count({
        where: {
          createdById: userId,
          createdAt: {
            gte: startDate,
          },
        },
      });
    } catch (error) {
      console.error("Error counting new contacts:", error);
    }

    // Calculate email stats
    const emailActivities = emailCampaigns.flatMap(campaign => campaign.EmailActivity);
    const sentEmails = emailCampaigns.length;
    const openedEmails = emailActivities.filter(activity => activity.type === "OPENED").length;
    const clickedEmails = emailActivities.filter(activity => activity.type === "CLICKED").length;
    const bounced = emailActivities.filter(activity => activity.type === "BOUNCED").length;
    
    const openRate = sentEmails > 0 ? openedEmails / sentEmails : 0;
    const clickRate = openedEmails > 0 ? clickedEmails / openedEmails : 0;

    // Calculate daily activity for time series charts
    const dailyOpensByHour = Array(24).fill(0).map((_, hour) => ({ 
      hour: hour.toString().padStart(2, '0'), 
      count: 0 
    }));
    
    emailActivities.forEach(activity => {
      if (activity.type === "OPENED") {
        const hour = new Date(activity.timestamp).getHours();
        dailyOpensByHour[hour].count++;
      }
    });

    // Get workflows count
    let workflows = 0;
    try {
      workflows = await prisma.workflow.count({
        where: {
          createdById: userId,
          status: "ACTIVE",
        },
      });
    } catch (error) {
      console.error("Error counting workflows:", error);
    }

    // Get campaign performance data
    const campaignPerformance = emailCampaigns.map(campaign => {
      const activities = campaign.EmailActivity;
      const sent = 1; // Each campaign counts as 1 sent batch
      const opened = activities.filter(a => a.type === "OPENED").length;
      const clicked = activities.filter(a => a.type === "CLICKED").length;
      
      return {
        id: campaign.id,
        name: campaign.name,
        type: "email",
        openRate: sent > 0 ? opened / sent : 0,
        clickRate: opened > 0 ? clicked / opened : 0,
        status: campaign.status.toLowerCase(),
      };
    }).sort((a, b) => b.openRate - a.openRate).slice(0, 5);

    // Return aggregated dashboard data
    return NextResponse.json({
      emailStats: {
        sent: sentEmails,
        delivered: sentEmails - bounced,
        opened: openedEmails,
        clicked: clickedEmails,
        bounced: bounced,
        openRate: openRate,
        clickRate: clickRate,
        bounceRate: sentEmails > 0 ? bounced / sentEmails : 0,
      },
      contactStats: {
        total: totalContacts,
        new: newContacts,
        growthRate: totalContacts > 0 ? newContacts / totalContacts : 0,
      },
      opensByHour: dailyOpensByHour,
      campaignPerformance: campaignPerformance,
      workflowStats: {
        active: workflows,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return handleApiError(error, "/api/dashboard");
  }
} 