/**
 * Notifications API Service
 * Handles user notifications and preferences
 */

import { BaseApiClient } from '../base/api-client';
import type {
  NotificationData,
  NotificationCreateRequest,
  NotificationUpdateRequest,
  NotificationFilters,
  NotificationResponse,
  NotificationStats,
  BulkNotificationRequest,
  NotificationPreferences,
} from '../types/notifications';

export class NotificationsService extends BaseApiClient {
  // Get user notifications
  async getUserNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<NotificationResponse[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await this.get(`/notifications/users/${userId}${query}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get unread notification count
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const response = await this.get(`/notifications/users/${userId}/unread-count`);
      return response.count;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Create a notification
  async createNotification(data: NotificationCreateRequest): Promise<NotificationResponse> {
    try {
      return await this.post('/notifications', data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Create multiple notifications
  async createBulkNotification(data: BulkNotificationRequest): Promise<{
    success: boolean;
    created: number;
    failed: number;
    notifications: NotificationResponse[];
  }> {
    try {
      return await this.post('/notifications/bulk', data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Update a notification
  async updateNotification(
    id: string,
    updates: NotificationUpdateRequest
  ): Promise<NotificationResponse> {
    try {
      return await this.patch(`/notifications/${id}`, updates);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Mark notification as read
  async markNotificationAsRead(id: string): Promise<NotificationResponse> {
    try {
      return await this.patch(`/notifications/${id}`, { read: true });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Mark all notifications as read for a user
  async markAllNotificationsAsRead(userId: string): Promise<{
    success: boolean;
    updatedCount: number;
  }> {
    try {
      return await this.patch(`/notifications/users/${userId}/mark-all-read`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<{
    success: boolean;
    updatedCount: number;
    failed: string[];
  }> {
    try {
      return await this.patch('/notifications/mark-read', {
        notificationIds,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Delete a notification
  async deleteNotification(id: string): Promise<void> {
    try {
      await this.delete(`/notifications/${id}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Delete multiple notifications
  async deleteMultipleNotifications(notificationIds: string[]): Promise<{
    success: boolean;
    deletedCount: number;
    failed: string[];
  }> {
    try {
      return await this.delete('/notifications/bulk', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications(
    userId: string,
    olderThan: Date
  ): Promise<{
    success: boolean;
    deletedCount: number;
  }> {
    try {
      return await this.delete(`/notifications/users/${userId}/cleanup`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          olderThan: olderThan.toISOString(),
        }),
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      return await this.get(`/notifications/users/${userId}/stats`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get organization-wide notification statistics
  async getOrganizationNotificationStats(
    organizationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalNotifications: number;
    totalUsers: number;
    avgNotificationsPerUser: number;
    readRate: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    timeline: Array<{
      date: string;
      count: number;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.get(`/notifications/organizations/${organizationId}/stats${query}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Notification Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      return await this.get(`/notifications/users/${userId}/preferences`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      return await this.patch(`/notifications/users/${userId}/preferences`, preferences);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Real-time notifications (WebSocket/SSE)
  async subscribeToNotifications(
    userId: string,
    onNotification: (notification: NotificationResponse) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    try {
      return await this.stream(
        `/notifications/users/${userId}/stream`,
        onNotification,
        onError
      );
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      return () => {};
    }
  }

  // System notifications for admins
  async createSystemNotification(
    organizationId: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      targetUsers?: string[];
      targetRoles?: string[];
      link?: string;
    }
  ): Promise<{
    success: boolean;
    notificationsCreated: number;
    targetUsers: string[];
  }> {
    try {
      return await this.post(`/notifications/organizations/${organizationId}/system`, notification);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Template-based notifications
  async createNotificationFromTemplate(
    templateId: string,
    data: {
      userId?: string;
      userIds?: string[];
      variables?: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    notifications: NotificationResponse[];
  }> {
    try {
      return await this.post(`/notifications/templates/${templateId}/create`, data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Scheduled notifications
  async scheduleNotification(
    notification: NotificationCreateRequest & {
      scheduledFor: string;
      timezone?: string;
    }
  ): Promise<{
    success: boolean;
    scheduledNotificationId: string;
    scheduledFor: string;
  }> {
    try {
      return await this.post('/notifications/schedule', notification);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async cancelScheduledNotification(scheduledNotificationId: string): Promise<void> {
    try {
      await this.delete(`/notifications/scheduled/${scheduledNotificationId}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getScheduledNotifications(
    userId?: string,
    organizationId?: string
  ): Promise<Array<{
    id: string;
    notification: NotificationCreateRequest;
    scheduledFor: string;
    status: 'pending' | 'sent' | 'cancelled';
    createdAt: string;
  }>> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (organizationId) params.append('organizationId', organizationId);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.get(`/notifications/scheduled${query}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
}