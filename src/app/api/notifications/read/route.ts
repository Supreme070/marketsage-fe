import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";
import { markAllNotificationsAsRead } from "@/lib/notification-service";

/**
 * POST /api/notifications/read
 * 
 * Mark all notifications as read for the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }
    
    // Mark all notifications as read
    const count = await markAllNotificationsAsRead(session.user.id);
    
    return NextResponse.json({ success: true, count });
  } catch (error) {
    return handleApiError(error, "/api/notifications/read/route.ts");
  }
} 