import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Return mock data for development
    const mockData = {
      stats: {
        totalCampaigns: 47,
        totalRevenue: 2450000,
        avgEngagement: 68.5,
        activeWorkflows: 12
      },
      conversionData: [
        { month: "Jan", email: 2.1, sms: 3.8, whatsapp: 4.2 },
        { month: "Feb", email: 2.3, sms: 4.1, whatsapp: 4.5 },
        { month: "Mar", email: 2.0, sms: 3.9, whatsapp: 4.8 },
        { month: "Apr", email: 2.4, sms: 4.3, whatsapp: 5.1 },
        { month: "May", email: 2.6, sms: 4.5, whatsapp: 5.3 },
        { month: "Jun", email: 2.2, sms: 4.2, whatsapp: 5.0 }
      ]
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error in decision support API:", error);
    return NextResponse.json(
      { error: "Failed to fetch decision support data" },
      { status: 500 }
    );
  }
}

function calculateChannelOpenRate(activities: any[]): number {
  const sent = activities.filter(a => a.type === "SENT").length;
  const opened = activities.filter(a => a.type === "OPENED").length;
  return sent > 0 ? Math.round((opened / sent) * 100 * 10) / 10 : 0;
}

function generateForecastData(days: number, metric: string) {
  const data = [];
  const baseValues = {
    engagement: 65,
    revenue: 485000,
    audience: 12500,
    openRate: 22.5,
    conversion: 1.8,
  };

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const baseValue = baseValues[metric as keyof typeof baseValues] || 65;
    const trend = 1 + (0.05 * (i / 30)); // 5% monthly growth
    const randomVariation = 0.9 + Math.random() * 0.2;
    const weeklyPattern = 1 + 0.1 * Math.sin((i / 7) * Math.PI);
    
    const value = Math.round(baseValue * trend * randomVariation * weeklyPattern);
    const confidence = Math.max(60, 95 - (i * 0.5));

    data.push({
      date: date.toISOString().split('T')[0],
      value,
      confidence: Math.round(confidence),
    });
  }

  return data;
}

function generateInsights(emailCampaigns: any[], smsCampaigns: any[], whatsappCampaigns: any[], contacts: any[]) {
  const insights = [];

  // Channel performance insight
  if (whatsappCampaigns.length > 0) {
    insights.push({
      type: "positive",
      priority: "high",
      title: "WhatsApp Shows Strong Performance",
      description: "WhatsApp campaigns demonstrate higher engagement rates in the Nigerian market.",
      recommendation: "Consider increasing WhatsApp campaign frequency.",
    });
  }

  // Contact growth insight
  if (contacts.length > 100) {
    insights.push({
      type: "positive",
      priority: "medium",
      title: "Healthy Audience Growth",
      description: `Added ${contacts.length} new contacts in the selected period.`,
      recommendation: "Focus on engagement strategies for new contacts.",
    });
  }

  // Campaign frequency insight
  const totalCampaigns = emailCampaigns.length + smsCampaigns.length + whatsappCampaigns.length;
  if (totalCampaigns < 10) {
    insights.push({
      type: "neutral",
      priority: "medium",
      title: "Campaign Frequency Opportunity",
      description: "Current campaign frequency may be below optimal levels.",
      recommendation: "Consider increasing campaign frequency to 2-3 per week.",
    });
  }

  return insights;
} 