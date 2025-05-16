import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  calculateJourneyAnalytics,
  getJourneyAnalytics,
  identifyJourneyBottlenecks,
  getJourneyFlowDistribution,
  getJourneyCompletionTimeDistribution,
  validateJourney
} from "@/lib/journey-mapping";
import { handleApiError, unauthorized } from "@/lib/errors";

/**
 * GET: Get journey analytics
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("journeyId");
    const type = searchParams.get("type") || "general"; // "general", "bottlenecks", "flow", "completion"
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      );
    }
    
    // Validate journey exists and user has access
    await validateJourney(journeyId);
    
    // Handle different types of analytics
    switch (type) {
      case "general":
        // For general analytics, we can either calculate fresh or get historical
        if (startDate || endDate) {
          // Get historical analytics for the date range
          const analytics = await getJourneyAnalytics(journeyId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
          });
          return NextResponse.json(analytics);
        } else {
          // Calculate fresh analytics
          const analytics = await calculateJourneyAnalytics(journeyId);
          return NextResponse.json(analytics);
        }
        
      case "bottlenecks":
        // Identify bottlenecks in the journey
        const bottlenecks = await identifyJourneyBottlenecks(journeyId);
        return NextResponse.json(bottlenecks);
        
      case "flow":
        // Get contact flow distribution across stages
        const flow = await getJourneyFlowDistribution(journeyId);
        return NextResponse.json(flow);
        
      case "completion":
        // Get journey completion time distribution
        const completionTime = await getJourneyCompletionTimeDistribution(journeyId);
        return NextResponse.json(completionTime);
        
      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error, "/api/journeys/analytics [GET]");
  }
} 