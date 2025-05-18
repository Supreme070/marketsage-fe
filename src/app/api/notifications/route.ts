import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";
import { getUserNotifications } from "@/lib/notification-service";
import { PrismaClient } from "@prisma/client";

// Direct database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://marketsage:marketsage_password@db:5432/marketsage?schema=public"
    }
  }
});

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
      // Build where clause
      let whereCondition = `"userId" = '${session.user.id}'`;
      
      // Only include unread if specified
      if (!includeRead) {
        whereCondition += ` AND read = false`;
      }
      
      // Filter by category if specified
      if (category) {
        whereCondition += ` AND category = '${category}'`;
      }
      
      // Filter by type if specified
      if (type) {
        whereCondition += ` AND type = '${type}'`;
      }

      // Query notifications using raw SQL
      const query = `
        SELECT id, "userId", title, message, type, category, read, link, timestamp
        FROM "Notification"
        WHERE ${whereCondition}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
      
      const notifications = await prisma.$queryRawUnsafe(query);
      return NextResponse.json(notifications);
    } catch (error) {
      console.error('Error in notification query:', error);
      throw new Error(`Failed to get user notifications: ${(error as Error).message}`);
    }
  } catch (error) {
    return handleApiError(error, "/api/notifications/route.ts");
  }
} 