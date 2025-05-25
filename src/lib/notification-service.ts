/**
 * Notification Service
 * 
 * Provides functionality for managing user notifications
 */

import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

// Create a direct connection to the database with connection details
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://marketsage:marketsage_password@db:5432/marketsage?schema=public"
    }
  }
});

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

    // Query notifications
    const notifications = await prisma.$queryRaw`
      SELECT id, "userId", title, message, type, category, read, link, timestamp
      FROM "Notification"
      WHERE "userId" = ${userId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

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
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Notification"
      WHERE "userId" = ${userId} AND read = false
    `;
    return result[0].count;
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
    const notification = await prisma.$executeRaw`
      INSERT INTO "Notification" (
        id, "userId", title, message, type, category, read, link, timestamp
      ) VALUES (
        uuid_generate_v4(), ${data.userId}, ${data.title}, ${data.message}, 
        ${data.type}, ${data.category}, ${data.read || false}, ${data.link}, ${data.timestamp || new Date()}
      )
      RETURNING *
    `;

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
    await prisma.$executeRaw`
      UPDATE "Notification"
      SET read = true
      WHERE id = ${id}
    `;

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
    const result = await prisma.$executeRaw`
      UPDATE "Notification"
      SET read = true
      WHERE "userId" = ${userId} AND read = false
    `;

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
    await prisma.$executeRaw`
      DELETE FROM "Notification"
      WHERE id = ${id}
    `;

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
    const result = await prisma.$executeRaw`
      DELETE FROM "Notification"
      WHERE "userId" = ${userId} AND read = true AND timestamp < ${olderThan}
    `;

    logger.info(`Cleaned up old notifications for user ${userId}`);
    return result;
  } catch (error) {
    logger.error(`Error cleaning up old notifications: ${(error as Error).message}`, error);
    throw new Error(`Failed to clean up old notifications: ${(error as Error).message}`);
  }
} 