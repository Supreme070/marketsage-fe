import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Return mock data for development
    const mockData = {
      emailStats: {
        sent: 1247,
        delivered: 1198,
        opened: 287,
        clicked: 52,
        bounced: 49,
        openRate: 23.9,
        clickRate: 4.3,
        bounceRate: 3.9,
      },
      contactStats: {
        total: 12847,
        new: 235,
        growthRate: 12.5,
      },
      opensByHour: Array(24).fill(0).map((_, hour) => ({ 
        hour: hour.toString().padStart(2, '0'), 
        count: Math.floor(Math.random() * 50) + 10
      })),
      campaignPerformance: [
        { name: "Welcome Series", sent: 450, opened: 108, clicked: 23, revenue: 125000 },
        { name: "Product Launch", sent: 320, opened: 89, clicked: 18, revenue: 89000 },
        { name: "Newsletter #47", sent: 280, opened: 67, clicked: 11, revenue: 45000 },
      ],
      workflowStats: {
        active: 8,
      },
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
} 