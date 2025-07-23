/**
 * Admin Real-time Service
 * ======================
 * 
 * Provides real-time updates for MarketSage admin portal:
 * - System health metrics updates
 * - Security events notifications
 * - User activity monitoring
 * - Organization updates
 * - Live statistics updates
 */

import type { Server as SocketServer } from 'socket.io';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';

// Admin-specific event types
export enum AdminEventType {
  // System health updates
  SYSTEM_METRICS_UPDATE = 'admin:system_metrics_update',
  SERVICE_STATUS_CHANGE = 'admin:service_status_change',
  
  // Security events
  SECURITY_EVENT_CREATED = 'admin:security_event_created',
  THREAT_DETECTED = 'admin:threat_detected',
  
  // User management
  USER_ACTIVITY_UPDATE = 'admin:user_activity_update',
  NEW_USER_REGISTERED = 'admin:new_user_registered',
  USER_STATUS_CHANGED = 'admin:user_status_changed',
  
  // Organization updates
  ORGANIZATION_CREATED = 'admin:organization_created',
  SUBSCRIPTION_CHANGED = 'admin:subscription_changed',
  
  // General statistics
  STATS_UPDATE = 'admin:stats_update',
  ALERT_CREATED = 'admin:alert_created'
}

interface AdminRealTimeData {
  timestamp: string;
  type: AdminEventType;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  adminOnly: boolean;
}

interface AdminSocketData {
  userId: string;
  staffRole: 'SUPER_ADMIN' | 'IT_ADMIN' | 'ADMIN';
  permissions: string[];
  subscriptions: Set<string>;
}

class AdminRealtimeService {
  private io: SocketServer | null = null;
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private connectedAdmins: Map<string, AdminSocketData> = new Map();

  /**
   * Initialize the admin realtime service with Socket.IO server
   */
  initialize(socketServer: SocketServer): void {
    this.io = socketServer;
    this.setupAdminNamespace();
    this.startPeriodicUpdates();
    logger.info('Admin realtime service initialized');
  }

  /**
   * Setup admin-specific namespace and event handlers
   */
  private setupAdminNamespace(): void {
    if (!this.io) return;

    // Create admin namespace
    const adminNamespace = this.io.of('/admin');

    adminNamespace.on('connection', async (socket) => {
      try {
        // Authenticate admin user (simplified - in production add JWT verification)
        const userId = socket.handshake.auth.userId;
        const staffRole = socket.handshake.auth.staffRole;
        
        if (!userId || !this.isValidAdminRole(staffRole)) {
          socket.disconnect(true);
          return;
        }

        // Store admin connection data
        const adminData: AdminSocketData = {
          userId,
          staffRole,
          permissions: this.getPermissionsForRole(staffRole),
          subscriptions: new Set()
        };
        
        this.connectedAdmins.set(socket.id, adminData);

        logger.info(`Admin connected: ${userId} (${staffRole})`);

        // Handle admin subscriptions
        socket.on('admin:subscribe', (channels: string[]) => {
          channels.forEach(channel => {
            if (this.hasPermissionForChannel(adminData, channel)) {
              socket.join(channel);
              adminData.subscriptions.add(channel);
            }
          });
        });

        socket.on('admin:unsubscribe', (channels: string[]) => {
          channels.forEach(channel => {
            socket.leave(channel);
            adminData.subscriptions.delete(channel);
          });
        });

        // Send initial data
        await this.sendInitialAdminData(socket, adminData);

        // Handle disconnect
        socket.on('disconnect', () => {
          this.connectedAdmins.delete(socket.id);
          logger.info(`Admin disconnected: ${userId}`);
        });

      } catch (error) {
        logger.error('Admin connection error:', error);
        socket.disconnect(true);
      }
    });
  }

  /**
   * Check if role is valid for admin access
   */
  private isValidAdminRole(role: string): boolean {
    return ['SUPER_ADMIN', 'IT_ADMIN', 'ADMIN'].includes(role);
  }

  /**
   * Get permissions for admin role
   */
  private getPermissionsForRole(role: string): string[] {
    switch (role) {
      case 'SUPER_ADMIN':
        return ['*']; // All permissions
      case 'IT_ADMIN':
        return ['system', 'security', 'users', 'organizations'];
      case 'ADMIN':
        return ['users', 'organizations'];
      default:
        return [];
    }
  }

  /**
   * Check if admin has permission for specific channel
   */
  private hasPermissionForChannel(adminData: AdminSocketData, channel: string): boolean {
    if (adminData.permissions.includes('*')) return true;
    
    const [category] = channel.split(':');
    return adminData.permissions.includes(category);
  }

  /**
   * Send initial data to connected admin
   */
  private async sendInitialAdminData(socket: any, adminData: AdminSocketData): Promise<void> {
    try {
      // Send system overview if has permission
      if (this.hasPermissionForChannel(adminData, 'system:overview')) {
        const systemStats = await this.getSystemStats();
        socket.emit(AdminEventType.SYSTEM_METRICS_UPDATE, {
          timestamp: new Date().toISOString(),
          data: systemStats,
          priority: 'medium',
          adminOnly: true
        });
      }

      // Send security overview if has permission
      if (this.hasPermissionForChannel(adminData, 'security:overview')) {
        const securityStats = await this.getSecurityStats();
        socket.emit(AdminEventType.SECURITY_EVENT_CREATED, {
          timestamp: new Date().toISOString(),
          data: securityStats,
          priority: 'high',
          adminOnly: true
        });
      }

    } catch (error) {
      logger.error('Error sending initial admin data:', error);
    }
  }

  /**
   * Broadcast event to admin users
   */
  broadcastToAdmins(eventType: AdminEventType, data: Partial<AdminRealTimeData>): void {
    if (!this.io) return;

    const adminNamespace = this.io.of('/admin');
    const eventData: AdminRealTimeData = {
      timestamp: new Date().toISOString(),
      type: eventType,
      data: data.data,
      priority: data.priority || 'medium',
      adminOnly: true,
      ...data
    };

    adminNamespace.emit(eventType, eventData);
  }

  /**
   * Broadcast to specific admin channel
   */
  broadcastToChannel(channel: string, eventType: AdminEventType, data: Partial<AdminRealTimeData>): void {
    if (!this.io) return;

    const adminNamespace = this.io.of('/admin');
    const eventData: AdminRealTimeData = {
      timestamp: new Date().toISOString(),
      type: eventType,
      data: data.data,
      priority: data.priority || 'medium',
      adminOnly: true,
      ...data
    };

    adminNamespace.to(channel).emit(eventType, eventData);
  }

  /**
   * Start periodic updates for admin data
   */
  private startPeriodicUpdates(): void {
    // System metrics every 30 seconds
    const systemInterval = setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);
    this.updateIntervals.set('system', systemInterval);

    // Security events every 10 seconds
    const securityInterval = setInterval(() => {
      this.updateSecurityEvents();
    }, 10000);
    this.updateIntervals.set('security', securityInterval);

    // User activity every 60 seconds
    const usersInterval = setInterval(() => {
      this.updateUserActivity();
    }, 60000);
    this.updateIntervals.set('users', usersInterval);
  }

  /**
   * Update system metrics
   */
  private async updateSystemMetrics(): Promise<void> {
    try {
      const stats = await this.getSystemStats();
      this.broadcastToChannel('system:overview', AdminEventType.SYSTEM_METRICS_UPDATE, {
        data: stats,
        priority: 'low'
      });
    } catch (error) {
      logger.error('Error updating system metrics:', error);
    }
  }

  /**
   * Update security events
   */
  private async updateSecurityEvents(): Promise<void> {
    try {
      // Get recent security events
      const recentEvents = await prisma.securityEvent.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      if (recentEvents.length > 0) {
        this.broadcastToChannel('security:events', AdminEventType.SECURITY_EVENT_CREATED, {
          data: { events: recentEvents },
          priority: 'high'
        });
      }
    } catch (error) {
      logger.error('Error updating security events:', error);
    }
  }

  /**
   * Update user activity
   */
  private async updateUserActivity(): Promise<void> {
    try {
      const stats = await this.getUserActivityStats();
      this.broadcastToChannel('users:activity', AdminEventType.USER_ACTIVITY_UPDATE, {
        data: stats,
        priority: 'low'
      });
    } catch (error) {
      logger.error('Error updating user activity:', error);
    }
  }

  /**
   * Get system statistics
   */
  private async getSystemStats(): Promise<any> {
    // This would call the actual system stats API
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get security statistics
   */
  private async getSecurityStats(): Promise<any> {
    try {
      const eventCount = await prisma.securityEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      const criticalEvents = await prisma.securityEvent.count({
        where: {
          severity: 'CRITICAL',
          resolved: false
        }
      });

      return {
        totalEvents24h: eventCount,
        criticalEvents,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting security stats:', error);
      return { totalEvents24h: 0, criticalEvents: 0, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Get user activity statistics
   */
  private async getUserActivityStats(): Promise<any> {
    try {
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      return {
        totalUsers,
        activeUsers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting user activity stats:', error);
      return { totalUsers: 0, activeUsers: 0, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
    
    // Clear connections
    this.connectedAdmins.clear();
    
    logger.info('Admin realtime service destroyed');
  }
}

// Export singleton instance
export const adminRealtimeService = new AdminRealtimeService();