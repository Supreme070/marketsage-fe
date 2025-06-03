import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized, notFound, forbidden } from "@/lib/errors";
import { markNotificationAsRead } from "@/lib/notification-service";
import prisma from "@/lib/db/prisma";

/**
 * POST /api/notifications/[id]/read
 * 
 * Mark a specific notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }
    
    // Get notification ID from params
    const { id } = params;
    
    try {
      // Check if notification exists and belongs to the user
      const notification = await (prisma as any).notification.findUnique({
        where: { id },
      });
      
      if (!notification) {
        return notFound("Notification not found");
      }
      
      // Ensure the notification belongs to the current user
      if (notification.userId !== session.user.id) {
        return forbidden("You don't have permission to access this notification");
      }
      
      // Mark notification as read
      await markNotificationAsRead(id);
      
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("Database error marking notification as read:", dbError);
      if (process.env.NODE_ENV === "development") {
        // Return mock success in development
        return NextResponse.json({ success: true });
      }
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error, "/api/notifications/[id]/read/route.ts");
  }
} 