/**
 * Notification Service
 *
 * Provides functionality for managing user notifications
 */

// NOTE: Prisma removed - using backend API (Notification table exists in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
import { logger } from '@/lib/logger';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'campaigns' | 'contacts' | 'system' | 'workflows' | 'segments';

export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read?: boolean;
  link?: string;
  timestamp?: Date;
}

/**
 * Get notifications for a specific user
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    includeRead?: boolean;
    category?: string;
    type?: string;
  }
) {
  try {
    const { limit = 50, includeRead = true, category, type } = options || {};

    // Build where clause
    const where: any = { userId };
    
    // Only include unread if specified
    if (!includeRead) {
      where.read = false;
    }
    
    // Filter by category if specified
    if (category) {
      where.category = category;
    }
    
    // Filter by type if specified
    if (type) {
      where.type = type;
    }

    // For debugging
    console.log("Finding notifications with where:", JSON.stringify(where));

    // Query notifications via backend API
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      includeRead: includeRead.toString(),
      ...(category && { category }),
      ...(type && { type }),
    });

    const response = await fetch(
      `${BACKEND_URL}/api/v2/notifications/${userId}?${queryParams}`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Failed to get notifications: ${response.status}`);
    }

    const notifications = await response.json();
    return notifications;
  } catch (error) {
    logger.error(`Error getting user notifications: ${(error as Error).message}`, error);
    throw new Error(`Failed to get user notifications: ${(error as Error).message}`);
  }
}

/**
 * Get a count of unread notifications for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v2/notifications/${userId}/unread-count`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Failed to get unread count: ${response.status}`);
    }

    const result = await response.json();
    return result.count;
  } catch (error) {
    logger.error(`Error counting unread notifications: ${(error as Error).message}`, error);
    throw new Error(`Failed to count unread notifications: ${(error as Error).message}`);
  }
}

/**
 * Create a new notification
 */
export async function createNotification(data: NotificationData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        read: data.read || false,
        link: data.link,
        timestamp: data.timestamp || new Date(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.status}`);
    }

    const notification = await response.json();
    logger.info(`Created notification for user ${data.userId}`);
    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${(error as Error).message}`, error);
    throw new Error(`Failed to create notification: ${(error as Error).message}`);
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.status}`);
    }

    logger.info(`Marked notification ${id} as read`);
    return true;
  } catch (error) {
    logger.error(`Error marking notification as read: ${(error as Error).message}`, error);
    throw new Error(`Failed to mark notification as read: ${(error as Error).message}`);
  }
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/notifications/${userId}/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read: ${response.status}`);
    }

    const result = await response.json();
    logger.info(`Marked notifications as read for user ${userId}`);
    return result;
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${(error as Error).message}`, error);
    throw new Error(`Failed to mark all notifications as read: ${(error as Error).message}`);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.status}`);
    }

    logger.info(`Deleted notification ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting notification: ${(error as Error).message}`, error);
    throw new Error(`Failed to delete notification: ${(error as Error).message}`);
  }
}

/**
 * Delete all read notifications for a user older than a specified date
 */
export async function cleanupOldNotifications(userId: string, olderThan: Date) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v2/notifications/${userId}/cleanup?olderThan=${olderThan.toISOString()}`,
      { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Failed to cleanup old notifications: ${response.status}`);
    }

    const result = await response.json();
    logger.info(`Cleaned up old notifications for user ${userId}`);
    return result;
  } catch (error) {
    logger.error(`Error cleaning up old notifications: ${(error as Error).message}`, error);
    throw new Error(`Failed to clean up old notifications: ${(error as Error).message}`);
  }
} 