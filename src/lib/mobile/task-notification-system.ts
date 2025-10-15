/**
 * Mobile Task Notification System
 * ===============================
 * Comprehensive mobile notifications and offline sync for task management
 * 
 * Features:
 * 📱 Push notifications for mobile devices
 * 🔄 Offline sync with conflict resolution
 * 🌍 African market mobile optimization
 * 📊 Low-bandwidth friendly updates
 * ⚡ Real-time task updates
 * 🔔 Smart notification scheduling
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';
import { logger } from '@/lib/logger';

export interface MobileTaskNotification {
  id: string;
  userId: string;
  taskId: string;
  type: 'task_assigned' | 'task_due_soon' | 'task_overdue' | 'task_completed' | 'task_updated' | 'priority_changed';
  title: string;
  body: string;
  data: {
    taskId: string;
    taskTitle: string;
    priority: string;
    dueDate?: string;
    assignee?: string;
    category?: string;
  };
  scheduled_for: Date;
  sent_at?: Date;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  device_tokens: string[];
  african_market_optimizations: {
    low_bandwidth_payload: boolean;
    offline_sync_enabled: boolean;
    local_language: string;
    cultural_timing_respected: boolean;
  };
}

export interface OfflineSyncData {
  id: string;
  userId: string;
  device_id: string;
  sync_version: number;
  tasks: {
    created: TaskOfflineData[];
    updated: TaskOfflineData[];
    deleted: string[];
  };
  last_sync: Date;
  conflict_resolution: 'server_wins' | 'client_wins' | 'merge';
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
  bandwidth_optimization: {
    compressed_payload: boolean;
    delta_sync: boolean;
    critical_only: boolean;
  };
}

export interface TaskOfflineData {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  dueDate?: Date;
  assigneeId?: string;
  category: string;
  estimatedDuration?: number;
  tags: string[];
  offline_metadata: {
    created_offline: boolean;
    last_modified: Date;
    sync_hash: string;
    conflict_indicators: string[];
  };
}

export interface PushNotificationConfig {
  enabled: boolean;
  device_token: string;
  platform: 'ios' | 'android' | 'web';
  timezone: string;
  quiet_hours: {
    start: number;
    end: number;
  };
  notification_preferences: {
    task_assignments: boolean;
    due_date_reminders: boolean;
    priority_changes: boolean;
    team_updates: boolean;
  };
  african_market_settings: {
    respect_prayer_times: boolean;
    low_bandwidth_mode: boolean;
    local_language_notifications: boolean;
    business_hours_only: boolean;
  };
}

export class MobileTaskNotificationSystem {
  private readonly NOTIFICATION_BATCH_SIZE = 100;
  private readonly SYNC_BATCH_SIZE = 50;
  private readonly AFRICAN_BUSINESS_HOURS = { start: 8, end: 18 };
  private readonly LOW_BANDWIDTH_THRESHOLD = 1024; // 1KB

  /**
   * Send task notification to mobile devices
   */
  async sendTaskNotification(
    taskId: string,
    notificationType: MobileTaskNotification['type'],
    recipientUserIds: string[],
    customMessage?: {
      title?: string;
      body?: string;
    }
  ): Promise<{
    notifications_sent: number;
    notifications_scheduled: number;
    african_optimizations_applied: number;
  }> {
    try {
      logger.info('Sending mobile task notifications', {
        taskId,
        notificationType,
        recipientCount: recipientUserIds.length
      });

      // Get task details
      const taskResponse = await fetch(`${BACKEND_URL}/api/tasks/${taskId}?include=assignee,creator`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!taskResponse.ok) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const task = await taskResponse.json();

      const results = {
        notifications_sent: 0,
        notifications_scheduled: 0,
        african_optimizations_applied: 0
      };

      // Get notification configs for all recipients
      const notificationConfigs = await this.getUserNotificationConfigs(recipientUserIds);

      for (const userId of recipientUserIds) {
        const config = notificationConfigs.get(userId);
        if (!config?.enabled) continue;

        // Check notification preferences
        if (!this.shouldSendNotification(notificationType, config)) continue;

        // Generate notification content
        const notification = await this.generateNotificationContent(
          task,
          notificationType,
          userId,
          config,
          customMessage
        );

        // Apply African market optimizations
        const optimizedNotification = await this.applyAfricanMarketOptimizations(
          notification,
          config
        );

        if (optimizedNotification.african_market_optimizations.cultural_timing_respected) {
          results.african_optimizations_applied++;
        }

        // Schedule or send immediately
        const shouldSchedule = await this.shouldScheduleNotification(
          optimizedNotification,
          config
        );

        if (shouldSchedule) {
          await this.scheduleNotification(optimizedNotification);
          results.notifications_scheduled++;
        } else {
          await this.sendNotificationImmediately(optimizedNotification);
          results.notifications_sent++;
        }

        // Store notification record
        await this.storeNotificationRecord(optimizedNotification);
      }

      logger.info('Mobile task notifications processed', {
        taskId,
        results
      });

      return results;

    } catch (error) {
      logger.error('Failed to send mobile task notifications', {
        error: error instanceof Error ? error.message : String(error),
        taskId,
        notificationType
      });
      throw error;
    }
  }

  /**
   * Sync tasks for offline mobile access
   */
  async syncTasksForOfflineAccess(
    userId: string,
    deviceId: string,
    clientSyncData?: OfflineSyncData
  ): Promise<{
    sync_data: OfflineSyncData;
    bandwidth_saved: number;
    conflicts_resolved: number;
    african_optimizations: {
      compressed_payload: boolean;
      low_bandwidth_friendly: boolean;
      delta_sync_applied: boolean;
    };
  }> {
    try {
      logger.info('Starting mobile task sync', {
        userId,
        deviceId,
        hasClientData: !!clientSyncData
      });

      // Get user's current tasks
      const serverTasks = await this.getUserTasksForSync(userId);
      
      // Get last sync info
      const lastSync = await this.getLastSyncInfo(userId, deviceId);
      
      // Resolve conflicts if client data provided
      const conflictsResolved = clientSyncData 
        ? await this.resolveOfflineConflicts(clientSyncData, serverTasks)
        : 0;

      // Generate sync data with bandwidth optimization
      const syncData = await this.generateOptimizedSyncData(
        userId,
        deviceId,
        serverTasks,
        lastSync
      );

      // Apply African market optimizations
      const optimizedSyncData = await this.applyAfricanSyncOptimizations(syncData);
      
      // Calculate bandwidth savings
      const bandwidthSaved = await this.calculateBandwidthSavings(
        syncData,
        optimizedSyncData
      );

      // Store sync record
      await this.storeSyncRecord(optimizedSyncData);

      const result = {
        sync_data: optimizedSyncData,
        bandwidth_saved: bandwidthSaved,
        conflicts_resolved: conflictsResolved,
        african_optimizations: {
          compressed_payload: optimizedSyncData.bandwidth_optimization.compressed_payload,
          low_bandwidth_friendly: optimizedSyncData.bandwidth_optimization.critical_only,
          delta_sync_applied: optimizedSyncData.bandwidth_optimization.delta_sync
        }
      };

      logger.info('Mobile task sync completed', {
        userId,
        deviceId,
        syncDataSize: JSON.stringify(optimizedSyncData).length,
        bandwidthSaved,
        conflictsResolved
      });

      return result;

    } catch (error) {
      logger.error('Failed to sync tasks for offline access', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        deviceId
      });
      throw error;
    }
  }

  /**
   * Process scheduled notifications based on optimal timing
   */
  async processScheduledNotifications(): Promise<{
    processed: number;
    sent: number;
    rescheduled: number;
    failed: number;
  }> {
    try {
      // Get pending notifications
      const notificationsResponse = await fetch(
        `${BACKEND_URL}/api/notifications/pending?limit=${this.NOTIFICATION_BATCH_SIZE}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!notificationsResponse.ok) {
        throw new Error('Failed to fetch pending notifications');
      }

      const pendingNotifications = await notificationsResponse.json();

      const results = {
        processed: 0,
        sent: 0,
        rescheduled: 0,
        failed: 0
      };

      for (const notification of pendingNotifications) {
        try {
          results.processed++;

          // Check if still appropriate to send
          const shouldSend = await this.validateNotificationTiming(notification);
          
          if (shouldSend) {
            await this.sendNotificationImmediately(notification);
            results.sent++;
          } else {
            // Reschedule for better timing
            await this.rescheduleNotification(notification);
            results.rescheduled++;
          }

        } catch (error) {
          logger.error('Failed to process individual notification', {
            error: error instanceof Error ? error.message : String(error),
            notificationId: notification.id
          });
          results.failed++;
        }
      }

      return results;

    } catch (error) {
      logger.error('Failed to process scheduled notifications', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Register mobile device for push notifications
   */
  async registerMobileDevice(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    preferences: {
      timezone?: string;
      quiet_hours?: { start: number; end: number };
      african_market_settings?: {
        respect_prayer_times?: boolean;
        low_bandwidth_mode?: boolean;
        local_language_notifications?: boolean;
      };
    }
  ): Promise<{
    registered: boolean;
    device_id: string;
    optimization_profile: string;
  }> {
    try {
      const deviceId = `${platform}-${userId}-${Date.now()}`;

      // Detect African market context
      const africanMarketProfile = await this.detectAfricanMarketProfile(userId);

      const config: PushNotificationConfig = {
        enabled: true,
        device_token: deviceToken,
        platform,
        timezone: preferences.timezone || africanMarketProfile.timezone,
        quiet_hours: preferences.quiet_hours || { start: 22, end: 7 },
        notification_preferences: {
          task_assignments: true,
          due_date_reminders: true,
          priority_changes: true,
          team_updates: true
        },
        african_market_settings: {
          respect_prayer_times: preferences.african_market_settings?.respect_prayer_times ?? africanMarketProfile.respectPrayerTimes,
          low_bandwidth_mode: preferences.african_market_settings?.low_bandwidth_mode ?? africanMarketProfile.lowBandwidthMode,
          local_language_notifications: preferences.african_market_settings?.local_language_notifications ?? true,
          business_hours_only: africanMarketProfile.businessHoursOnly
        }
      };

      // Store device configuration
      await this.storeDeviceConfiguration(userId, deviceId, config);

      return {
        registered: true,
        device_id: deviceId,
        optimization_profile: africanMarketProfile.profile
      };

    } catch (error) {
      logger.error('Failed to register mobile device', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        platform
      });
      throw error;
    }
  }

  // Private helper methods

  private async getUserNotificationConfigs(
    userIds: string[]
  ): Promise<Map<string, PushNotificationConfig>> {
    const configs = new Map<string, PushNotificationConfig>();
    
    // Mock implementation - would query actual device configurations
    for (const userId of userIds) {
      configs.set(userId, {
        enabled: true,
        device_token: `mock-token-${userId}`,
        platform: 'android', // Assume Android for African markets
        timezone: 'Africa/Lagos',
        quiet_hours: { start: 22, end: 7 },
        notification_preferences: {
          task_assignments: true,
          due_date_reminders: true,
          priority_changes: true,
          team_updates: true
        },
        african_market_settings: {
          respect_prayer_times: true,
          low_bandwidth_mode: true,
          local_language_notifications: true,
          business_hours_only: true
        }
      });
    }

    return configs;
  }

  private shouldSendNotification(
    type: MobileTaskNotification['type'],
    config: PushNotificationConfig
  ): boolean {
    switch (type) {
      case 'task_assigned':
        return config.notification_preferences.task_assignments;
      case 'task_due_soon':
      case 'task_overdue':
        return config.notification_preferences.due_date_reminders;
      case 'priority_changed':
        return config.notification_preferences.priority_changes;
      case 'task_updated':
      case 'task_completed':
        return config.notification_preferences.team_updates;
      default:
        return true;
    }
  }

  private async generateNotificationContent(
    task: any,
    type: MobileTaskNotification['type'],
    userId: string,
    config: PushNotificationConfig,
    customMessage?: { title?: string; body?: string }
  ): Promise<MobileTaskNotification> {
    const notificationTemplates = {
      task_assigned: {
        title: 'New Task Assigned',
        body: `You've been assigned: ${task.title}`
      },
      task_due_soon: {
        title: 'Task Due Soon',
        body: `"${task.title}" is due soon`
      },
      task_overdue: {
        title: 'Task Overdue',
        body: `"${task.title}" is overdue`
      },
      task_completed: {
        title: 'Task Completed',
        body: `"${task.title}" has been completed`
      },
      task_updated: {
        title: 'Task Updated',
        body: `"${task.title}" has been updated`
      },
      priority_changed: {
        title: 'Priority Changed',
        body: `"${task.title}" priority changed to ${task.priority}`
      }
    };

    const template = notificationTemplates[type];

    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      taskId: task.id,
      type,
      title: customMessage?.title || template.title,
      body: customMessage?.body || template.body,
      data: {
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        assignee: task.assignee?.name,
        category: task.category
      },
      scheduled_for: new Date(),
      delivery_status: 'pending',
      device_tokens: [config.device_token],
      african_market_optimizations: {
        low_bandwidth_payload: config.african_market_settings.low_bandwidth_mode,
        offline_sync_enabled: true,
        local_language: config.african_market_settings.local_language_notifications ? 'en' : 'en',
        cultural_timing_respected: false // Will be set by optimization
      }
    };
  }

  private async applyAfricanMarketOptimizations(
    notification: MobileTaskNotification,
    config: PushNotificationConfig
  ): Promise<MobileTaskNotification> {
    const optimized = { ...notification };

    // Low bandwidth optimization
    if (config.african_market_settings.low_bandwidth_mode) {
      optimized.body = optimized.body.substring(0, 50) + '...'; // Truncate long messages
      optimized.african_market_optimizations.low_bandwidth_payload = true;
    }

    // Cultural timing optimization
    if (config.african_market_settings.respect_prayer_times) {
      const now = new Date();
      const hour = now.getHours();
      
      // Avoid prayer times (5 AM, 12 PM, 3 PM, 6 PM, 8 PM)
      const prayerHours = [5, 12, 15, 18, 20];
      if (prayerHours.includes(hour)) {
        // Schedule for 30 minutes later
        optimized.scheduled_for = new Date(now.getTime() + 30 * 60 * 1000);
        optimized.african_market_optimizations.cultural_timing_respected = true;
      }
    }

    // Business hours only
    if (config.african_market_settings.business_hours_only) {
      const hour = optimized.scheduled_for.getHours();
      if (hour < this.AFRICAN_BUSINESS_HOURS.start || hour > this.AFRICAN_BUSINESS_HOURS.end) {
        // Schedule for next business day
        const tomorrow = new Date(optimized.scheduled_for);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(this.AFRICAN_BUSINESS_HOURS.start, 0, 0, 0);
        optimized.scheduled_for = tomorrow;
      }
    }

    return optimized;
  }

  private async shouldScheduleNotification(
    notification: MobileTaskNotification,
    config: PushNotificationConfig
  ): Promise<boolean> {
    const now = new Date();
    const scheduledTime = notification.scheduled_for;

    // If scheduled for future, always schedule
    if (scheduledTime.getTime() > now.getTime()) {
      return true;
    }

    // Check quiet hours
    const hour = now.getHours();
    if (hour >= config.quiet_hours.start || hour <= config.quiet_hours.end) {
      return true;
    }

    return false;
  }

  private async sendNotificationImmediately(
    notification: MobileTaskNotification
  ): Promise<void> {
    try {
      // Mock push notification sending
      logger.info('Sending push notification', {
        notificationId: notification.id,
        title: notification.title,
        deviceTokens: notification.device_tokens.length
      });

      // Update notification status
      notification.delivery_status = 'sent';
      notification.sent_at = new Date();

    } catch (error) {
      notification.delivery_status = 'failed';
      throw error;
    }
  }

  private async scheduleNotification(
    notification: MobileTaskNotification
  ): Promise<void> {
    // Store for later processing
    logger.info('Notification scheduled', {
      notificationId: notification.id,
      scheduledFor: notification.scheduled_for
    });
  }

  private async storeNotificationRecord(
    notification: MobileTaskNotification
  ): Promise<void> {
    try {
      // Store in database (mock implementation)
      logger.info('Notification record stored', {
        notificationId: notification.id,
        type: notification.type
      });
    } catch (error) {
      logger.warn('Failed to store notification record', {
        error: error instanceof Error ? error.message : String(error),
        notificationId: notification.id
      });
    }
  }

  private async getUserTasksForSync(userId: string): Promise<TaskOfflineData[]> {
    const tasksResponse = await fetch(
      `${BACKEND_URL}/api/tasks?userId=${userId}&limit=${this.SYNC_BATCH_SIZE}&orderBy=updatedAt&order=desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!tasksResponse.ok) {
      throw new Error('Failed to fetch user tasks for sync');
    }

    const tasks = await tasksResponse.json();

    return tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority as any,
      status: task.status as any,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      category: task.category || 'general',
      estimatedDuration: task.estimatedDuration,
      tags: [], // Would be from task tags relation
      offline_metadata: {
        created_offline: false,
        last_modified: task.updatedAt,
        sync_hash: this.generateSyncHash(task),
        conflict_indicators: []
      }
    }));
  }

  private async getLastSyncInfo(userId: string, deviceId: string): Promise<any> {
    // Mock implementation
    return {
      last_sync: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      sync_version: 1
    };
  }

  private async resolveOfflineConflicts(
    clientData: OfflineSyncData,
    serverTasks: TaskOfflineData[]
  ): Promise<number> {
    let conflictsResolved = 0;

    // Simple conflict resolution - server wins
    for (const clientTask of clientData.tasks.updated) {
      const serverTask = serverTasks.find(t => t.id === clientTask.id);
      if (serverTask && serverTask.offline_metadata.last_modified > clientTask.offline_metadata.last_modified) {
        conflictsResolved++;
      }
    }

    return conflictsResolved;
  }

  private async generateOptimizedSyncData(
    userId: string,
    deviceId: string,
    tasks: TaskOfflineData[],
    lastSync: any
  ): Promise<OfflineSyncData> {
    // Filter tasks modified since last sync (delta sync)
    const modifiedTasks = tasks.filter(task => 
      task.offline_metadata.last_modified > lastSync.last_sync
    );

    return {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      device_id: deviceId,
      sync_version: lastSync.sync_version + 1,
      tasks: {
        created: [],
        updated: modifiedTasks,
        deleted: []
      },
      last_sync: new Date(),
      conflict_resolution: 'server_wins',
      sync_status: 'completed',
      bandwidth_optimization: {
        compressed_payload: true,
        delta_sync: true,
        critical_only: false
      }
    };
  }

  private async applyAfricanSyncOptimizations(
    syncData: OfflineSyncData
  ): Promise<OfflineSyncData> {
    const optimized = { ...syncData };

    // Enable aggressive bandwidth optimization for African markets
    optimized.bandwidth_optimization = {
      compressed_payload: true,
      delta_sync: true,
      critical_only: true // Only sync critical updates
    };

    // Filter to only critical tasks if bandwidth optimization enabled
    if (optimized.bandwidth_optimization.critical_only) {
      optimized.tasks.updated = optimized.tasks.updated.filter(task => 
        task.priority === 'HIGH' || task.priority === 'URGENT' || 
        task.status === 'IN_PROGRESS'
      );
    }

    return optimized;
  }

  private async calculateBandwidthSavings(
    original: OfflineSyncData,
    optimized: OfflineSyncData
  ): Promise<number> {
    const originalSize = JSON.stringify(original).length;
    const optimizedSize = JSON.stringify(optimized).length;
    return originalSize - optimizedSize;
  }

  private async storeSyncRecord(syncData: OfflineSyncData): Promise<void> {
    logger.info('Sync record stored', {
      syncId: syncData.id,
      userId: syncData.userId,
      deviceId: syncData.device_id,
      tasksCount: syncData.tasks.updated.length
    });
  }

  private generateSyncHash(task: any): string {
    return Buffer.from(
      `${task.id}-${task.updatedAt.getTime()}-${task.title}-${task.status}`
    ).toString('base64').substring(0, 16);
  }

  private async validateNotificationTiming(notification: any): Promise<boolean> {
    // Check if timing is still appropriate
    const now = new Date();
    const hour = now.getHours();
    
    // Basic validation - avoid very late/early hours
    return hour >= 7 && hour <= 22;
  }

  private async rescheduleNotification(notification: any): Promise<void> {
    const newTime = new Date();
    newTime.setHours(9, 0, 0, 0); // Schedule for 9 AM next day
    if (newTime.getTime() <= Date.now()) {
      newTime.setDate(newTime.getDate() + 1);
    }
    
    logger.info('Notification rescheduled', {
      notificationId: notification.id,
      newTime: newTime.toISOString()
    });
  }

  private async detectAfricanMarketProfile(userId: string): Promise<{
    profile: string;
    timezone: string;
    respectPrayerTimes: boolean;
    lowBandwidthMode: boolean;
    businessHoursOnly: boolean;
  }> {
    // Mock implementation - would use user's country/location data
    return {
      profile: 'african_mobile_optimized',
      timezone: 'Africa/Lagos',
      respectPrayerTimes: true,
      lowBandwidthMode: true,
      businessHoursOnly: true
    };
  }

  private async storeDeviceConfiguration(
    userId: string,
    deviceId: string,
    config: PushNotificationConfig
  ): Promise<void> {
    logger.info('Device configuration stored', {
      userId,
      deviceId,
      platform: config.platform,
      africanOptimizations: config.african_market_settings
    });
  }
}

// Export singleton instance
export const mobileTaskNotificationSystem = new MobileTaskNotificationSystem();