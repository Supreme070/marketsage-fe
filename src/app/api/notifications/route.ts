import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";
import prisma from "@/lib/db/prisma";

// Mock data for when database is not available
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Welcome to MarketSage",
    message: "Your task management system is ready to use!",
    timestamp: new Date().toISOString(),
    read: false,
    type: "INFO",
    category: "SYSTEM",
    userId: "mock-user",
  },
  {
    id: "2", 
    title: "Database Setup Required",
    message: "Connect your PostgreSQL database to enable full functionality",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    type: "WARNING",
    category: "SYSTEM",
    userId: "mock-user",
  },
];

/**
 * GET /api/notifications
 * 
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      // Return mock data for unauthenticated users in development
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(MOCK_NOTIFICATIONS);
      }
      return unauthorized();
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const includeRead = searchParams.get('includeRead') === 'true';
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined;
    
    // Get notifications for the user
    try {
      // Build where clause for Prisma
      const whereClause: any = {
        userId: session.user.id,
      };
      
      // Only include unread if specified
      if (!includeRead) {
        whereClause.read = false;
      }
      
      // Filter by category if specified
      if (category) {
        whereClause.category = category;
      }
      
      // Filter by type if specified
      if (type) {
        whereClause.type = type;
      }

      // Query notifications using Prisma
      const notifications = await (prisma as any).notification.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'desc'
        },
        take: limit
      });
      
      return NextResponse.json(notifications);
    } catch (dbError) {
      console.error('Database error in notifications:', dbError);
      // Return mock data if database is not available in development
      if (process.env.NODE_ENV === "development") {
        console.log("Database not available, returning mock notifications");
        return NextResponse.json(MOCK_NOTIFICATIONS);
      }
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error, "/api/notifications/route.ts");
  }
} 