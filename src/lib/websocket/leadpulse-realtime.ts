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
// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';
import { logger } from '@/lib/logger';
import { selectiveBroadcastManager, type SelectiveUpdate } from './selective-broadcast';

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
  private activeConnections = new Map<string, { lastSeen: Date; subscriptions: Set<string> }>();
  private broadcastThrottle = new Map<string, number>();
  private analyticsCache: AnalyticsUpdate | null = null;
  private analyticsCacheExpiry = 0;
  private selectiveBroadcastEnabled = true; // Feature flag for selective broadcasting
  
  initialize(io: SocketServer) {
    this.io = io;
    this.setupEventHandlers();
    logger.info('LeadPulse realtime service initialized');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.activeConnections.set(socket.id, {
        lastSeen: new Date(),
        subscriptions: new Set()
      });
      logger.info(`LeadPulse client connected: ${socket.id}`);

      // Register client with selective broadcast manager
      if (this.selectiveBroadcastEnabled) {
        // Extract user context from socket handshake or auth
        const userId = socket.handshake.auth?.userId;
        const organizationId = socket.handshake.auth?.organizationId;
        const permissions = socket.handshake.auth?.permissions || ['view_analytics'];
        
        selectiveBroadcastManager.registerClient(socket, userId, organizationId, permissions);
      }

      // Send initial data to new connection (throttled)
      this.sendInitialDataThrottled(socket);

      // Handle client subscription to specific data types with selective filtering
      socket.on('subscribe', (data: { dataType: string; filter?: any }) => {
        const { dataType, filter } = typeof data === 'string' ? { dataType: data, filter: undefined } : data;
        
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          connection.subscriptions.add(dataType);
          connection.lastSeen = new Date();
        }
        socket.join(dataType);
        
        // Register selective subscription if enabled
        if (this.selectiveBroadcastEnabled) {
          selectiveBroadcastManager.updateClientSubscription(socket.id, dataType, filter);
        }
        
        logger.info(`Client ${socket.id} subscribed to ${dataType}`, { filter });
      });

      socket.on('unsubscribe', (dataType: string) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          connection.subscriptions.delete(dataType);
          connection.lastSeen = new Date();
        }
        socket.leave(dataType);
        
        // Remove selective subscription if enabled
        if (this.selectiveBroadcastEnabled) {
          selectiveBroadcastManager.removeClientSubscription(socket.id, dataType);
        }
        
        logger.info(`Client ${socket.id} unsubscribed from ${dataType}`);
      });

      socket.on('disconnect', (reason) => {
        this.activeConnections.delete(socket.id);
        
        // Unregister from selective broadcast manager
        if (this.selectiveBroadcastEnabled) {
          selectiveBroadcastManager.unregisterClient(socket.id);
        }
        
        logger.info(`LeadPulse client disconnected: ${socket.id}, reason: ${reason}`);
        this.cleanupConnectionResources(socket.id);
      });

      // Handle ping for connection health with heartbeat
      socket.on('ping', () => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          connection.lastSeen = new Date();
        }
        socket.emit('pong', { 
          timestamp: new Date().toISOString(),
          connectionCount: this.activeConnections.size
        });
      });

      // Handle client errors to prevent connection leaks
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
        this.handleSocketError(socket.id, error);
      });
    });
  }

  private async sendInitialDataThrottled(socket: any) {
    try {
      // Use cached analytics if available and fresh
      let analytics = this.getCachedAnalytics();
      if (!analytics) {
        analytics = await this.getCurrentAnalyticsOptimized();
      }
      socket.emit('analytics_update', analytics);

      // Send optimized recent visitors (limited data)
      const recentVisitors = await this.getRecentVisitorsOptimized();
      socket.emit('recent_visitors', recentVisitors);

      // Send optimized active visitors
      const activeVisitors = await this.getActiveVisitorsOptimized();
      socket.emit('active_visitors', activeVisitors);

    } catch (error) {
      logger.error('Error sending initial data to client:', error);
      // Send fallback minimal data to prevent client hanging
      socket.emit('analytics_update', this.getFallbackAnalytics());
    }
  }

  // Broadcast new visitor using selective broadcasting
  async broadcastNewVisitor(visitor: any) {
    if (!this.io) return;

    const update: VisitorUpdate = {
      id: visitor.id,
      type: 'new_visitor',
      visitor,
      timestamp: new Date()
    };

    if (this.selectiveBroadcastEnabled) {
      // Use selective broadcasting
      const selectiveUpdate: SelectiveUpdate = {
        type: 'new_visitor',
        data: { visitor },
        metadata: {
          timestamp: new Date(),
          relevanceScore: this.calculateRelevanceScore(visitor),
          visitorId: visitor.id,
          pixelId: visitor.metadata?.pixelId,
          organizationId: visitor.metadata?.organizationId,
          priority: 'medium',
        },
      };
      
      await selectiveBroadcastManager.broadcastSelective(this.io, selectiveUpdate);
    } else {
      // Fallback to traditional broadcasting
      this.io.emit('visitor_update', update);
      this.io.to('visitors').emit('new_visitor', visitor);
    }
    
    // Update analytics with selective broadcasting
    await this.broadcastAnalyticsUpdateSelective();

    logger.info(`Broadcasted new visitor: ${visitor.id}`);
  }

  // Broadcast visitor activity update using selective broadcasting
  async broadcastVisitorActivity(visitorId: string, touchpoint: any) {
    if (!this.io) return;

    // Throttle broadcasts per visitor (max 1 per 2 seconds)
    const throttleKey = `activity_${visitorId}`;
    const now = Date.now();
    const lastBroadcast = this.broadcastThrottle.get(throttleKey) || 0;
    
    if (now - lastBroadcast < 2000) {
      return; // Skip if too frequent
    }
    this.broadcastThrottle.set(throttleKey, now);

    try {
      // Optimized: Get visitor without includes to avoid N+1
      const response = await fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors/${visitorId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const visitor = response.ok ? await response.json() : null;

      if (!visitor) return;

      if (this.selectiveBroadcastEnabled) {
        // Use selective broadcasting for visitor activity
        const selectiveUpdate: SelectiveUpdate = {
          type: 'visitor_activity',
          data: { visitor, touchpoint },
          metadata: {
            timestamp: new Date(),
            relevanceScore: this.calculateActivityRelevanceScore(visitor, touchpoint),
            visitorId: visitor.id,
            pixelId: visitor.metadata?.pixelId,
            organizationId: visitor.metadata?.organizationId,
            priority: this.getActivityPriority(touchpoint.type),
          },
        };
        
        await selectiveBroadcastManager.broadcastSelective(this.io, selectiveUpdate);
      } else {
        // Fallback to traditional broadcasting
        const update: VisitorUpdate = {
          id: visitorId,
          type: 'touchpoint_added',
          visitor,
          touchpoint,
          timestamp: new Date()
        };

        this.io.to('activity').emit('touchpoint_added', { visitor, touchpoint });
        this.io.to('visitors').emit('visitor_activity', update);
      }

      logger.info(`Broadcasted visitor activity: ${visitorId}`);
    } catch (error) {
      logger.error('Error broadcasting visitor activity:', error);
    }
  }

  // Broadcast analytics updates using selective broadcasting
  async broadcastAnalyticsUpdate() {
    if (!this.io) return;

    // Throttle analytics broadcasts (max 1 per 10 seconds)
    const throttleKey = 'analytics_broadcast';
    const now = Date.now();
    const lastBroadcast = this.broadcastThrottle.get(throttleKey) || 0;
    
    if (now - lastBroadcast < 10000) {
      return; // Skip if too frequent
    }
    this.broadcastThrottle.set(throttleKey, now);

    await this.broadcastAnalyticsUpdateSelective();
  }

  // Selective analytics broadcasting
  private async broadcastAnalyticsUpdateSelective() {
    if (!this.io) return;

    try {
      const analytics = await this.getCurrentAnalyticsOptimized();
      
      if (this.selectiveBroadcastEnabled) {
        // Use selective broadcasting for analytics
        const selectiveUpdate: SelectiveUpdate = {
          type: 'analytics_update',
          data: analytics,
          metadata: {
            timestamp: new Date(),
            relevanceScore: 80, // Analytics are generally high relevance
            priority: 'medium',
          },
        };
        
        await selectiveBroadcastManager.broadcastSelective(this.io, selectiveUpdate);
      } else {
        // Fallback to traditional broadcasting
        const analyticsRoom = this.io.sockets.adapter.rooms.get('analytics');
        if (analyticsRoom && analyticsRoom.size > 0) {
          this.io.to('analytics').emit('analytics_data', analytics);
        }
        
        this.io.emit('analytics_update', analytics);
      }

      logger.info('Broadcasted analytics update');
    } catch (error) {
      logger.error('Error broadcasting analytics:', error);
    }
  }

  // Broadcast visitor going offline using selective broadcasting
  async broadcastVisitorOffline(visitorId: string) {
    if (!this.io) return;

    if (this.selectiveBroadcastEnabled) {
      // Use selective broadcasting
      const selectiveUpdate: SelectiveUpdate = {
        type: 'visitor_offline',
        data: { visitorId },
        metadata: {
          timestamp: new Date(),
          relevanceScore: 30, // Lower relevance for offline events
          visitorId,
          priority: 'low',
        },
      };
      
      await selectiveBroadcastManager.broadcastSelective(this.io, selectiveUpdate);
    } else {
      // Fallback to traditional broadcasting
      const update: VisitorUpdate = {
        id: visitorId,
        type: 'visitor_offline',
        visitor: { id: visitorId },
        timestamp: new Date()
      };

      this.io.emit('visitor_offline', update);
      this.io.to('visitors').emit('visitor_offline', { visitorId });
    }

    logger.info(`Broadcasted visitor offline: ${visitorId}`);
  }

  // Get current analytics data (optimized to avoid N+1 queries)
  private async getCurrentAnalyticsOptimized(): Promise<AnalyticsUpdate> {
    const cacheKey = 'analytics';
    const now = Date.now();
    
    // Return cached data if still fresh (30 seconds)
    if (this.analyticsCache && now < this.analyticsCacheExpiry) {
      return this.analyticsCache;
    }

    try {
      // Use parallel queries but avoid includes
      const [totalVisitorsResp, activeVisitorsResp, conversionsResp, countryDataResp, recentTouchpointsResp] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors/count`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors/count?isActive=true`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${BACKEND_URL}/api/v2/leadpulse/touchpoints/count?type=CONVERSION&timestamp_gte=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors/group-by-country?limit=5`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${BACKEND_URL}/api/v2/leadpulse/touchpoints?timestamp_gte=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}&orderBy=timestamp&order=desc&limit=10`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      const totalVisitors = totalVisitorsResp.ok ? await totalVisitorsResp.json() : 0;
      const activeVisitors = activeVisitorsResp.ok ? await activeVisitorsResp.json() : 0;
      const conversions = conversionsResp.ok ? await conversionsResp.json() : 0;
      const countryData = countryDataResp.ok ? await countryDataResp.json() : [];
      const recentTouchpoints = recentTouchpointsResp.ok ? await recentTouchpointsResp.json() : [];

      const conversionRate = totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;

      const topCountries = countryData.map((item: any) => ({
        country: item.country || 'Unknown',
        count: item.count || item._count?.country || 0
      }));

      const analytics: AnalyticsUpdate = {
        totalVisitors,
        activeVisitors,
        conversionRate: Math.round(conversionRate * 100) / 100,
        topCountries,
        recentActivity: recentTouchpoints
      };

      // Cache the result for 30 seconds
      this.analyticsCache = analytics;
      this.analyticsCacheExpiry = now + 30000;

      return analytics;
    } catch (error) {
      logger.error('Error in getCurrentAnalyticsOptimized:', error);
      return this.getFallbackAnalytics();
    }
  }

  // Get recent visitors (optimized)
  private async getRecentVisitorsOptimized() {
    try {
      // First get visitors without includes
      const visitorsResp = await fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors?orderBy=lastVisit&order=desc&limit=20`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const visitors = visitorsResp.ok ? await visitorsResp.json() : [];

      // Get touchpoints separately to avoid N+1
      if (visitors.length > 0) {
        const visitorIds = visitors.map((v: any) => v.id);
        const touchpointsResp = await fetch(`${BACKEND_URL}/api/v2/leadpulse/touchpoints?visitorIds=${visitorIds.join(',')}&orderBy=timestamp&order=desc`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const touchpoints = touchpointsResp.ok ? await touchpointsResp.json() : [];

        // Group touchpoints by visitor ID (limit 3 per visitor)
        const touchpointsMap = new Map();
        touchpoints.forEach((tp: any) => {
          if (!touchpointsMap.has(tp.visitorId)) {
            touchpointsMap.set(tp.visitorId, []);
          }
          const visitorTouchpoints = touchpointsMap.get(tp.visitorId);
          if (visitorTouchpoints.length < 3) {
            visitorTouchpoints.push(tp);
          }
        });

        // Add touchpoints to visitors
        return visitors.map((visitor: any) => ({
          ...visitor,
          touchpoints: touchpointsMap.get(visitor.id) || []
        }));
      }

      return visitors;
    } catch (error) {
      logger.error('Error in getRecentVisitorsOptimized:', error);
      return [];
    }
  }

  // Get active visitors (optimized)
  private async getActiveVisitorsOptimized() {
    try {
      // Limit active visitors to prevent overwhelming real-time updates
      const lastVisitGte = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const visitorsResp = await fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors?isActive=true&lastVisit_gte=${lastVisitGte}&orderBy=lastVisit&order=desc&limit=50`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const visitors = visitorsResp.ok ? await visitorsResp.json() : [];

      return visitors;
    } catch (error) {
      logger.error('Error in getActiveVisitorsOptimized:', error);
      return [];
    }
  }

  // Calculate relevance score for visitor updates
  private calculateRelevanceScore(visitor: any): number {
    let score = 50; // Base score
    
    // Higher score for engaged visitors
    if (visitor.engagementScore > 10) score += 20;
    if (visitor.engagementScore > 50) score += 15;
    
    // Higher score for new visitors
    if (visitor.isNew) score += 25;
    
    // Higher score for visitors with location data
    if (visitor.country && visitor.city) score += 10;
    
    return Math.min(100, score);
  }

  // Calculate relevance score for activity updates
  private calculateActivityRelevanceScore(visitor: any, touchpoint: any): number {
    let score = 40; // Base score for activity
    
    // Higher score for important touchpoint types
    const highValueTypes = ['FORM_SUBMIT', 'CONVERSION', 'CTA_CLICK'];
    if (highValueTypes.includes(touchpoint.type)) score += 30;
    
    // Higher score for engaged visitors
    if (visitor.engagementScore > 20) score += 15;
    
    // Higher score for form-related activities
    if (touchpoint.type.includes('FORM')) score += 10;
    
    return Math.min(100, score);
  }

  // Get activity priority based on touchpoint type
  private getActivityPriority(touchpointType: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'CONVERSION': 'critical',
      'FORM_SUBMIT': 'high',
      'CTA_CLICK': 'high',
      'FORM_START': 'medium',
      'FORM_VIEW': 'medium',
      'CLICK': 'low',
      'PAGEVIEW': 'low',
    };
    
    return priorityMap[touchpointType] || 'low';
  }

  // Enable or disable selective broadcasting
  setSelectiveBroadcastEnabled(enabled: boolean): void {
    this.selectiveBroadcastEnabled = enabled;
    logger.info(`Selective broadcasting ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get selective broadcast statistics
  getSelectiveBroadcastStats() {
    if (!this.selectiveBroadcastEnabled) {
      return { enabled: false };
    }
    
    return {
      enabled: true,
      ...selectiveBroadcastManager.getClientStats(),
      healthCheck: selectiveBroadcastManager.healthCheck(),
    };
  }

  // Health check and connection management
  getConnectionCount(): number {
    return this.activeConnections.size;
  }

  getConnectionStats() {
    const stats = {
      totalConnections: this.activeConnections.size,
      subscriptions: {} as Record<string, number>,
      oldestConnection: null as Date | null,
      newestConnection: null as Date | null,
      selectiveBroadcast: this.getSelectiveBroadcastStats(),
    };

    let oldest: Date | null = null;
    let newest: Date | null = null;

    this.activeConnections.forEach((connection) => {
      connection.subscriptions.forEach(sub => {
        stats.subscriptions[sub] = (stats.subscriptions[sub] || 0) + 1;
      });

      if (!oldest || connection.lastSeen < oldest) {
        oldest = connection.lastSeen;
      }
      if (!newest || connection.lastSeen > newest) {
        newest = connection.lastSeen;
      }
    });

    stats.oldestConnection = oldest;
    stats.newestConnection = newest;

    return stats;
  }

  // Clean up resources for a specific connection
  private cleanupConnectionResources(socketId: string) {
    // Remove from throttle maps to prevent memory leaks
    this.broadcastThrottle.forEach((timestamp, key) => {
      if (key.includes(socketId)) {
        this.broadcastThrottle.delete(key);
      }
    });
  }

  // Clean up stale connections
  private cleanupStaleConnections() {
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    let cleaned = 0;

    this.activeConnections.forEach((connection, socketId) => {
      if (connection.lastSeen < staleThreshold) {
        this.activeConnections.delete(socketId);
        this.cleanupConnectionResources(socketId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} stale WebSocket connections`);
    }
  }

  // Handle socket errors
  private handleSocketError(socketId: string, error: any) {
    logger.error(`Socket ${socketId} error:`, error);
    this.activeConnections.delete(socketId);
    this.cleanupConnectionResources(socketId);
  }

  // Get cached analytics or fallback
  private getCachedAnalytics(): AnalyticsUpdate | null {
    if (this.analyticsCache && Date.now() < this.analyticsCacheExpiry) {
      return this.analyticsCache;
    }
    return null;
  }

  // Fallback analytics data when database is unavailable
  private getFallbackAnalytics(): AnalyticsUpdate {
    return {
      totalVisitors: 0,
      activeVisitors: 0,
      conversionRate: 0,
      topCountries: [],
      recentActivity: []
    };
  }

  // Clean up throttle maps periodically
  private cleanupThrottleMaps() {
    const now = Date.now();
    const expiry = 5 * 60 * 1000; // 5 minutes

    this.broadcastThrottle.forEach((timestamp, key) => {
      if (now - timestamp > expiry) {
        this.broadcastThrottle.delete(key);
      }
    });
  }

  // Cleanup inactive visitors (run periodically) - optimized
  async cleanupInactiveVisitors() {
    const inactiveThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

    try {
      const response = await fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors/bulk-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            isActive: true,
            lastVisit_lt: inactiveThreshold.toISOString()
          },
          data: { isActive: false }
        })
      });
      const result = response.ok ? await response.json() : { count: 0 };

      if (result.count > 0) {
        logger.info(`Marked ${result.count} visitors as inactive`);
        // Invalidate analytics cache to force refresh
        this.analyticsCache = null;
        this.analyticsCacheExpiry = 0;
        // Throttled broadcast
        await this.broadcastAnalyticsUpdate();
      }

      // Also cleanup stale connections and throttle maps
      this.cleanupStaleConnections();
      this.cleanupThrottleMaps();
    } catch (error) {
      logger.error('Error cleaning up inactive visitors:', error);
    }
  }

  // Shutdown cleanup
  shutdown() {
    if (this.io) {
      this.io.close();
    }
    this.activeConnections.clear();
    this.broadcastThrottle.clear();
    this.analyticsCache = null;
    
    // Cleanup selective broadcast manager
    if (this.selectiveBroadcastEnabled) {
      selectiveBroadcastManager.cleanup();
    }
    
    logger.info('LeadPulse realtime service shut down');
  }
}

// Singleton instance
export const leadPulseRealtimeService = new LeadPulseRealtimeService();

// Enhanced periodic cleanup with error handling (every 5 minutes)
let cleanupInterval: NodeJS.Timeout | null = null;

function startPeriodicCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(async () => {
    try {
      await leadPulseRealtimeService.cleanupInactiveVisitors();
    } catch (error) {
      logger.error('Periodic cleanup failed:', error);
    }
  }, 5 * 60 * 1000);
  
  logger.info('LeadPulse periodic cleanup started');
}

function stopPeriodicCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('LeadPulse periodic cleanup stopped');
  }
}

// Start cleanup when module loads
startPeriodicCleanup();

// Export cleanup controls
export { startPeriodicCleanup, stopPeriodicCleanup };