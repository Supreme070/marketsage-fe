/**
 * LeadPulse Real-time WebSocket System
 * 
 * Provides real-time updates for:
 * - Live visitor activity
 * - New visitor notifications
 * - Real-time analytics updates
 * - Live map updates
 */

import type { Server as SocketServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export interface VisitorUpdate {
  id: string;
  type: 'new_visitor' | 'visitor_update' | 'visitor_offline' | 'touchpoint_added';
  visitor: any;
  touchpoint?: any;
  timestamp: Date;
}

export interface AnalyticsUpdate {
  totalVisitors: number;
  activeVisitors: number;
  conversionRate: number;
  topCountries: Array<{ country: string; count: number }>;
  recentActivity: any[];
}

class LeadPulseRealtimeService {
  private io: SocketServer | null = null;
  private activeConnections = new Set<string>();
  
  initialize(io: SocketServer) {
    this.io = io;
    this.setupEventHandlers();
    logger.info('LeadPulse realtime service initialized');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.activeConnections.add(socket.id);
      logger.info(`LeadPulse client connected: ${socket.id}`);

      // Send initial data to new connection
      this.sendInitialData(socket);

      // Handle client subscription to specific data types
      socket.on('subscribe', (dataType: string) => {
        socket.join(dataType);
        logger.info(`Client ${socket.id} subscribed to ${dataType}`);
      });

      socket.on('unsubscribe', (dataType: string) => {
        socket.leave(dataType);
        logger.info(`Client ${socket.id} unsubscribed from ${dataType}`);
      });

      socket.on('disconnect', () => {
        this.activeConnections.delete(socket.id);
        logger.info(`LeadPulse client disconnected: ${socket.id}`);
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
  }

  private async sendInitialData(socket: any) {
    try {
      // Send current analytics overview
      const analytics = await this.getCurrentAnalytics();
      socket.emit('analytics_update', analytics);

      // Send recent visitors
      const recentVisitors = await this.getRecentVisitors();
      socket.emit('recent_visitors', recentVisitors);

      // Send active visitors
      const activeVisitors = await this.getActiveVisitors();
      socket.emit('active_visitors', activeVisitors);

    } catch (error) {
      logger.error('Error sending initial data to client:', error);
    }
  }

  // Broadcast new visitor to all connected clients
  async broadcastNewVisitor(visitor: any) {
    if (!this.io) return;

    const update: VisitorUpdate = {
      id: visitor.id,
      type: 'new_visitor',
      visitor,
      timestamp: new Date()
    };

    this.io.emit('visitor_update', update);
    this.io.to('visitors').emit('new_visitor', visitor);
    
    // Update analytics
    const analytics = await this.getCurrentAnalytics();
    this.io.emit('analytics_update', analytics);

    logger.info(`Broadcasted new visitor: ${visitor.id}`);
  }

  // Broadcast visitor activity update
  async broadcastVisitorActivity(visitorId: string, touchpoint: any) {
    if (!this.io) return;

    try {
      const visitor = await prisma.leadPulseVisitor.findUnique({
        where: { id: visitorId },
        include: {
          touchpoints: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });

      if (!visitor) return;

      const update: VisitorUpdate = {
        id: visitorId,
        type: 'touchpoint_added',
        visitor,
        touchpoint,
        timestamp: new Date()
      };

      this.io.emit('visitor_activity', update);
      this.io.to('activity').emit('touchpoint_added', { visitor, touchpoint });

      logger.info(`Broadcasted visitor activity: ${visitorId}`);
    } catch (error) {
      logger.error('Error broadcasting visitor activity:', error);
    }
  }

  // Broadcast analytics updates
  async broadcastAnalyticsUpdate() {
    if (!this.io) return;

    try {
      const analytics = await this.getCurrentAnalytics();
      this.io.emit('analytics_update', analytics);
      this.io.to('analytics').emit('analytics_data', analytics);

      logger.info('Broadcasted analytics update');
    } catch (error) {
      logger.error('Error broadcasting analytics:', error);
    }
  }

  // Broadcast visitor going offline
  async broadcastVisitorOffline(visitorId: string) {
    if (!this.io) return;

    const update: VisitorUpdate = {
      id: visitorId,
      type: 'visitor_offline',
      visitor: { id: visitorId },
      timestamp: new Date()
    };

    this.io.emit('visitor_offline', update);
    this.io.to('visitors').emit('visitor_offline', { visitorId });

    logger.info(`Broadcasted visitor offline: ${visitorId}`);
  }

  // Get current analytics data
  private async getCurrentAnalytics(): Promise<AnalyticsUpdate> {
    const [totalVisitors, activeVisitors, recentTouchpoints] = await Promise.all([
      prisma.leadPulseVisitor.count(),
      prisma.leadPulseVisitor.count({
        where: { isActive: true }
      }),
      prisma.leadPulseTouchpoint.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: { visitor: true },
        orderBy: { timestamp: 'desc' },
        take: 10
      })
    ]);

    // Calculate conversion rate
    const conversions = await prisma.leadPulseTouchpoint.count({
      where: {
        type: 'CONVERSION',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const conversionRate = totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;

    // Get top countries
    const countryData = await prisma.leadPulseVisitor.groupBy({
      by: ['country'],
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 5
    });

    const topCountries = countryData.map(item => ({
      country: item.country || 'Unknown',
      count: item._count.country
    }));

    return {
      totalVisitors,
      activeVisitors,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topCountries,
      recentActivity: recentTouchpoints
    };
  }

  // Get recent visitors
  private async getRecentVisitors() {
    return await prisma.leadPulseVisitor.findMany({
      orderBy: { lastVisit: 'desc' },
      take: 20,
      include: {
        touchpoints: {
          orderBy: { timestamp: 'desc' },
          take: 3
        }
      }
    });
  }

  // Get active visitors
  private async getActiveVisitors() {
    return await prisma.leadPulseVisitor.findMany({
      where: { isActive: true },
      include: {
        touchpoints: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    });
  }

  // Health check
  getConnectionCount(): number {
    return this.activeConnections.size;
  }

  // Cleanup inactive visitors (run periodically)
  async cleanupInactiveVisitors() {
    const inactiveThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

    try {
      const result = await prisma.leadPulseVisitor.updateMany({
        where: {
          isActive: true,
          lastVisit: { lt: inactiveThreshold }
        },
        data: { isActive: false }
      });

      if (result.count > 0) {
        logger.info(`Marked ${result.count} visitors as inactive`);
        await this.broadcastAnalyticsUpdate();
      }
    } catch (error) {
      logger.error('Error cleaning up inactive visitors:', error);
    }
  }
}

// Singleton instance
export const leadPulseRealtimeService = new LeadPulseRealtimeService();

// Periodic cleanup (every 5 minutes)
setInterval(() => {
  leadPulseRealtimeService.cleanupInactiveVisitors();
}, 5 * 60 * 1000);