import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: {
    type: string;
    entityType: string;
    entityId: string;
    userId: string;
    metadata?: any;
  };
  recipients: string[]; // User IDs or roles
  channels: ('email' | 'slack' | 'in_app' | 'webhook')[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  triggers: {
    actions: string[]; // Audit log actions that trigger this rule
    entities?: string[]; // Entity types to monitor
    conditions?: {
      userRoles?: string[];
      severity?: string[];
      metadata?: Record<string, any>;
    };
  };
  notification: {
    type: AdminNotification['type'];
    title: string;
    messageTemplate: string;
    channels: AdminNotification['channels'];
    priority: AdminNotification['priority'];
    recipients: {
      type: 'roles' | 'users' | 'all';
      values: string[];
    };
  };
  enabled: boolean;
  cooldown?: number; // Minutes to wait before sending another notification of this type
}

/**
 * Default notification rules for admin actions
 */
export const defaultNotificationRules: NotificationRule[] = [
  {
    id: 'critical_system_changes',
    name: 'Critical System Changes',
    description: 'Notify when critical system settings are modified',
    triggers: {
      actions: [
        'SYSTEM_CONFIG_UPDATE',
        'SECURITY_SETTINGS_CHANGED',
        'USER_PERMISSIONS_MODIFIED'
      ],
      conditions: {
        severity: ['critical', 'high']
      }
    },
    notification: {
      type: 'warning',
      title: 'Critical System Change',
      messageTemplate: 'User {user} made critical changes to {entity}: {action}',
      channels: ['email', 'slack', 'in_app'],
      priority: 'urgent',
      recipients: {
        type: 'roles',
        values: ['SUPER_ADMIN', 'IT_ADMIN']
      }
    },
    enabled: true,
    cooldown: 5
  },

  {
    id: 'staff_management',
    name: 'Staff Management Actions',
    description: 'Notify when staff members are added, updated, or removed',
    triggers: {
      actions: [
        'STAFF_MEMBER_CREATED',
        'STAFF_MEMBER_UPDATED',
        'STAFF_MEMBER_REMOVED'
      ],
      entities: ['USER']
    },
    notification: {
      type: 'info',
      title: 'Staff Management Action',
      messageTemplate: '{action} performed by {user} for staff member {targetUser}',
      channels: ['in_app', 'slack'],
      priority: 'medium',
      recipients: {
        type: 'roles',
        values: ['SUPER_ADMIN']
      }
    },
    enabled: true,
    cooldown: 1
  },

  {
    id: 'security_incidents',
    name: 'Security Incidents',
    description: 'Notify immediately when security incidents are detected',
    triggers: {
      actions: [
        'INCIDENT_CREATED',
        'SECURITY_VIOLATION',
        'UNAUTHORIZED_ACCESS',
        'LOGIN_FAILED_MULTIPLE'
      ],
      conditions: {
        severity: ['critical', 'high']
      }
    },
    notification: {
      type: 'error',
      title: 'Security Incident Detected',
      messageTemplate: 'Security incident: {action} - {details}',
      channels: ['email', 'slack', 'in_app', 'webhook'],
      priority: 'urgent',
      recipients: {
        type: 'roles',
        values: ['SUPER_ADMIN', 'IT_ADMIN']
      }
    },
    enabled: true,
    cooldown: 0 // No cooldown for security incidents
  },

  {
    id: 'system_health',
    name: 'System Health Alerts',
    description: 'Notify when system performance degrades',
    triggers: {
      actions: [
        'SYSTEM_PERFORMANCE_DEGRADED',
        'DATABASE_CONNECTION_ISSUES',
        'CACHE_FAILURES'
      ]
    },
    notification: {
      type: 'warning',
      title: 'System Health Alert',
      messageTemplate: 'System health issue detected: {action} - {details}',
      channels: ['slack', 'in_app'],
      priority: 'high',
      recipients: {
        type: 'roles',
        values: ['IT_ADMIN', 'SUPER_ADMIN']
      }
    },
    enabled: true,
    cooldown: 15
  },

  {
    id: 'data_operations',
    name: 'Data Operations',
    description: 'Notify for bulk data operations and exports',
    triggers: {
      actions: [
        'LOGS_EXPORTED',
        'DATA_IMPORTED',
        'BULK_OPERATIONS',
        'SYSTEM_CACHE_CLEARED'
      ]
    },
    notification: {
      type: 'info',
      title: 'Data Operation Completed',
      messageTemplate: 'Data operation completed: {action} by {user}',
      channels: ['in_app'],
      priority: 'low',
      recipients: {
        type: 'roles',
        values: ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN']
      }
    },
    enabled: true,
    cooldown: 30
  }
];

/**
 * In-memory notification store (in production, use database/Redis)
 */
class NotificationStore {
  private notifications = new Map<string, AdminNotification>();
  private cooldowns = new Map<string, number>();

  add(notification: AdminNotification): void {
    this.notifications.set(notification.id, notification);
  }

  getForUser(userId: string, limit = 50): AdminNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.recipients.includes(userId))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  setCooldown(ruleId: string, minutes: number): void {
    this.cooldowns.set(ruleId, Date.now() + (minutes * 60 * 1000));
  }

  isCoolingDown(ruleId: string): boolean {
    const cooldownEnd = this.cooldowns.get(ruleId);
    return cooldownEnd ? cooldownEnd > Date.now() : false;
  }

  cleanup(): void {
    // Remove notifications older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.timestamp < thirtyDaysAgo) {
        this.notifications.delete(id);
      }
    }

    // Clean expired cooldowns
    const now = Date.now();
    for (const [ruleId, cooldownEnd] of this.cooldowns.entries()) {
      if (cooldownEnd <= now) {
        this.cooldowns.delete(ruleId);
      }
    }
  }
}

const notificationStore = new NotificationStore();

// Cleanup every hour
setInterval(() => notificationStore.cleanup(), 60 * 60 * 1000);

/**
 * Admin Notification Service
 */
export class AdminNotificationService {
  private rules: NotificationRule[] = [...defaultNotificationRules];

  /**
   * Process an admin action and trigger notifications if needed
   */
  async processAdminAction(auditLogEntry: {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    userId: string;
    metadata?: any;
    user?: { name?: string; email: string; role: string };
  }): Promise<void> {
    try {
      // Find matching notification rules
      const matchingRules = this.rules.filter(rule => 
        rule.enabled && this.ruleMatches(rule, auditLogEntry)
      );

      for (const rule of matchingRules) {
        // Check cooldown
        if (rule.cooldown && notificationStore.isCoolingDown(rule.id)) {
          continue;
        }

        // Create and send notification
        await this.createNotification(rule, auditLogEntry);

        // Set cooldown
        if (rule.cooldown) {
          notificationStore.setCooldown(rule.id, rule.cooldown);
        }
      }
    } catch (error) {
      console.error('Error processing admin notification:', error);
    }
  }

  private ruleMatches(rule: NotificationRule, auditEntry: any): boolean {
    // Check action match
    if (!rule.triggers.actions.includes(auditEntry.action)) {
      return false;
    }

    // Check entity match if specified
    if (rule.triggers.entities && !rule.triggers.entities.includes(auditEntry.entity)) {
      return false;
    }

    // Check conditions if specified
    if (rule.triggers.conditions) {
      const conditions = rule.triggers.conditions;
      
      // Check user role
      if (conditions.userRoles && auditEntry.user?.role) {
        if (!conditions.userRoles.includes(auditEntry.user.role)) {
          return false;
        }
      }

      // Check severity
      if (conditions.severity && auditEntry.metadata?.severity) {
        if (!conditions.severity.includes(auditEntry.metadata.severity)) {
          return false;
        }
      }

      // Check metadata conditions
      if (conditions.metadata) {
        for (const [key, value] of Object.entries(conditions.metadata)) {
          if (auditEntry.metadata?.[key] !== value) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private async createNotification(rule: NotificationRule, auditEntry: any): Promise<void> {
    // Get recipients
    const recipients = await this.getRecipients(rule.notification.recipients);
    
    if (recipients.length === 0) {
      return;
    }

    // Generate notification
    const notification: AdminNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: rule.notification.type,
      title: rule.notification.title,
      message: this.interpolateMessage(rule.notification.messageTemplate, auditEntry),
      action: {
        type: auditEntry.action,
        entityType: auditEntry.entity,
        entityId: auditEntry.entityId,
        userId: auditEntry.userId,
        metadata: auditEntry.metadata
      },
      recipients,
      channels: rule.notification.channels,
      priority: rule.notification.priority,
      timestamp: new Date(),
      read: false,
      actionUrl: this.generateActionUrl(auditEntry)
    };

    // Store notification
    notificationStore.add(notification);

    // Send through configured channels
    await this.sendNotification(notification);
  }

  private async getRecipients(recipientConfig: NotificationRule['notification']['recipients']): Promise<string[]> {
    try {
      switch (recipientConfig.type) {
        case 'all':
          const allAdmins = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'] } },
            select: { id: true }
          });
          return allAdmins.map(user => user.id);

        case 'roles':
          const roleUsers = await prisma.user.findMany({
            where: { role: { in: recipientConfig.values as any } },
            select: { id: true }
          });
          return roleUsers.map(user => user.id);

        case 'users':
          return recipientConfig.values;

        default:
          return [];
      }
    } catch (error) {
      console.error('Error getting notification recipients:', error);
      return [];
    }
  }

  private interpolateMessage(template: string, auditEntry: any): string {
    return template
      .replace('{user}', auditEntry.user?.name || auditEntry.user?.email || 'System')
      .replace('{action}', auditEntry.action.replace(/_/g, ' ').toLowerCase())
      .replace('{entity}', auditEntry.entity)
      .replace('{entityId}', auditEntry.entityId)
      .replace('{targetUser}', auditEntry.metadata?.email || auditEntry.metadata?.targetUser || '')
      .replace('{details}', JSON.stringify(auditEntry.metadata || {}).substring(0, 100));
  }

  private generateActionUrl(auditEntry: any): string | undefined {
    // Generate relevant admin panel URLs based on the action
    const baseUrl = '/admin';
    
    switch (auditEntry.entity) {
      case 'USER':
        return `${baseUrl}/users`;
      case 'ORGANIZATION':
        return `${baseUrl}/organizations`;
      case 'SYSTEM_CONFIG':
        return `${baseUrl}/settings`;
      case 'INCIDENT':
        return `${baseUrl}/incidents`;
      case 'AUDIT_LOG':
        return `${baseUrl}/audit`;
      default:
        return `${baseUrl}/dashboard`;
    }
  }

  private async sendNotification(notification: AdminNotification): Promise<void> {
    // Send through each configured channel
    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case 'in_app':
            // In-app notifications are already stored
            break;
            
          case 'email':
            await this.sendEmailNotification(notification);
            break;
            
          case 'slack':
            await this.sendSlackNotification(notification);
            break;
            
          case 'webhook':
            await this.sendWebhookNotification(notification);
            break;
        }
      } catch (error) {
        console.error(`Error sending ${channel} notification:`, error);
      }
    }
  }

  private async sendEmailNotification(notification: AdminNotification): Promise<void> {
    // Get recipient emails
    const recipients = await prisma.user.findMany({
      where: { id: { in: notification.recipients } },
      select: { email: true, name: true }
    });

    // In a real implementation, you would use your email service
    console.log('📧 Email notification would be sent to:', recipients.map(r => r.email));
    console.log('📧 Subject:', notification.title);
    console.log('📧 Message:', notification.message);
  }

  private async sendSlackNotification(notification: AdminNotification): Promise<void> {
    // In a real implementation, you would use Slack API
    const color = {
      info: '#36a3f7',
      warning: '#ffab00',
      error: '#f56565',
      success: '#38a169'
    }[notification.type];

    console.log('💬 Slack notification would be sent:');
    console.log(`💬 Color: ${color}`);
    console.log(`💬 Title: ${notification.title}`);
    console.log(`💬 Message: ${notification.message}`);
    console.log(`💬 Priority: ${notification.priority}`);
  }

  private async sendWebhookNotification(notification: AdminNotification): Promise<void> {
    // In a real implementation, you would send to configured webhook URLs
    console.log('🔗 Webhook notification would be sent:');
    console.log('🔗 Payload:', JSON.stringify(notification, null, 2));
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(userId: string, limit = 50): Promise<AdminNotification[]> {
    return notificationStore.getForUser(userId, limit);
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    notificationStore.markAsRead(notificationId);
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifications = notificationStore.getForUser(userId);
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Add or update a notification rule
   */
  async updateNotificationRule(rule: NotificationRule): Promise<void> {
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  /**
   * Get all notification rules
   */
  getNotificationRules(): NotificationRule[] {
    return [...this.rules];
  }
}

// Global notification service instance
export const adminNotificationService = new AdminNotificationService();

/**
 * Middleware to automatically create notifications for audit log entries
 */
export async function processAuditLogNotification(auditLogData: any): Promise<void> {
  await adminNotificationService.processAdminAction(auditLogData);
}

/**
 * API endpoint handlers for notifications
 */
export async function getNotificationsHandler(req: Request, userId: string) {
  const url = new URL(req.url);
  const limit = Number.parseInt(url.searchParams.get('limit') || '50');
  
  const notifications = await adminNotificationService.getUserNotifications(userId, limit);
  const unreadCount = await adminNotificationService.getUnreadCount(userId);
  
  return NextResponse.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      total: notifications.length
    }
  });
}

export async function markNotificationReadHandler(req: Request) {
  const { notificationId } = await req.json();
  await adminNotificationService.markNotificationAsRead(notificationId);
  
  return NextResponse.json({
    success: true,
    message: 'Notification marked as read'
  });
}

export default adminNotificationService;