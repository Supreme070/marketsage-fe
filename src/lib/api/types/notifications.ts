/**
 * Notifications API Types
 */

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
  timestamp?: Date | string;
}

export interface NotificationCreateRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read?: boolean;
  link?: string;
}

export interface NotificationUpdateRequest {
  read?: boolean;
}

export interface NotificationFilters {
  limit?: number;
  includeRead?: boolean;
  category?: NotificationCategory;
  type?: NotificationType;
  before?: string;
  after?: string;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read: boolean;
  link?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
}

export interface BulkNotificationRequest {
  userIds: string[];
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  link?: string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  categories: {
    [key in NotificationCategory]: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}