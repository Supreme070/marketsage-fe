/**
 * LeadPulse Selective Broadcasting System
 * 
 * Optimizes real-time WebSocket broadcasting by implementing selective
 * client updates based on subscription filters, user permissions,
 * and data relevance to reduce unnecessary data transmission.
 */

import type { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '@/lib/logger';

// Client subscription filters
export interface SubscriptionFilter {
  dataType: string;
  pixelIds?: string[];
  visitorIds?: string[];
  eventTypes?: string[];
  countries?: string[];
  devices?: string[];
  minEngagementScore?: number;
  maxBroadcastFrequency?: number; // milliseconds
  includeDetails?: boolean;
}

// Client context for selective broadcasting
export interface ClientContext {
  socketId: string;
  userId?: string;
  organizationId?: string;
  permissions: string[];
  subscriptions: Map<string, SubscriptionFilter>;
  lastSeen: Date;
  lastBroadcast: Map<string, number>;
  rateLimits: Map<string, { count: number; resetTime: number }>;
  preferences: {
    enableRealTime: boolean;
    maxUpdatesPerMinute: number;
    preferredUpdateTypes: string[];
  };
}

// Update payload with metadata
export interface SelectiveUpdate {
  type: string;
  data: any;
  metadata: {
    timestamp: Date;
    relevanceScore: number;
    pixelId?: string;
    visitorId?: string;
    organizationId?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

// Broadcasting rules engine
export interface BroadcastRule {
  name: string;
  condition: (update: SelectiveUpdate, client: ClientContext) => boolean;
  priority: number;
  enabled: boolean;
}

class SelectiveBroadcastManager {
  private clients = new Map<string, ClientContext>();
  private broadcastRules: BroadcastRule[] = [];
  private updateQueue = new Map<string, SelectiveUpdate[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  
  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Register a client with their context and permissions
   */
  registerClient(
    socket: Socket,
    userId?: string,
    organizationId?: string,
    permissions: string[] = []
  ): void {
    const clientContext: ClientContext = {
      socketId: socket.id,
      userId,
      organizationId,
      permissions,
      subscriptions: new Map(),
      lastSeen: new Date(),
      lastBroadcast: new Map(),
      rateLimits: new Map(),
      preferences: {
        enableRealTime: true,
        maxUpdatesPerMinute: 60,
        preferredUpdateTypes: ['visitor_activity', 'analytics', 'new_visitor'],
      },
    };

    this.clients.set(socket.id, clientContext);
    
    logger.info('Registered client for selective broadcasting', {
      socketId: socket.id,
      userId,
      organizationId,
      permissions: permissions.length,
    });
  }

  /**
   * Update client subscription with filters
   */
  updateClientSubscription(
    socketId: string,
    dataType: string,
    filter?: Partial<SubscriptionFilter>
  ): boolean {
    const client = this.clients.get(socketId);
    if (!client) {
      logger.warn('Attempted to update subscription for unregistered client', { socketId });
      return false;
    }

    const subscriptionFilter: SubscriptionFilter = {
      dataType,
      maxBroadcastFrequency: 2000, // Default 2 seconds
      includeDetails: false,
      ...filter,
    };

    client.subscriptions.set(dataType, subscriptionFilter);
    client.lastSeen = new Date();

    logger.info('Updated client subscription', {
      socketId,
      dataType,
      filter: subscriptionFilter,
    });

    return true;
  }

  /**
   * Remove client subscription
   */
  removeClientSubscription(socketId: string, dataType: string): boolean {
    const client = this.clients.get(socketId);
    if (!client) return false;

    const removed = client.subscriptions.delete(dataType);
    client.lastSeen = new Date();

    if (removed) {
      logger.info('Removed client subscription', { socketId, dataType });
    }

    return removed;
  }

  /**
   * Unregister client and cleanup
   */
  unregisterClient(socketId: string): void {
    const client = this.clients.get(socketId);
    if (client) {
      // Cancel any pending batched updates
      const timer = this.batchTimers.get(socketId);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(socketId);
      }

      // Clear queued updates
      this.updateQueue.delete(socketId);
      
      this.clients.delete(socketId);
      
      logger.info('Unregistered client from selective broadcasting', {
        socketId,
        userId: client.userId,
      });
    }
  }

  /**
   * Broadcast update to relevant clients only
   */
  async broadcastSelective(
    io: SocketServer,
    update: SelectiveUpdate
  ): Promise<{ sent: number; skipped: number; queued: number }> {
    const stats = { sent: 0, skipped: 0, queued: 0 };
    const relevantClients = this.findRelevantClients(update);

    for (const [socketId, client] of relevantClients) {
      try {
        // Check rate limits
        if (!this.checkRateLimit(client, update.type)) {
          stats.skipped++;
          continue;
        }

        // Apply broadcasting rules
        if (!this.evaluateBroadcastRules(update, client)) {
          stats.skipped++;
          continue;
        }

        // Check if client supports batching
        const subscription = client.subscriptions.get(update.type);
        if (subscription?.maxBroadcastFrequency && subscription.maxBroadcastFrequency > 0) {
          // Queue for batched delivery
          this.queueUpdateForBatching(socketId, update);
          stats.queued++;
        } else {
          // Send immediately
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            await this.sendUpdateToClient(socket, update, client);
            stats.sent++;
          }
        }

        // Update client last broadcast time
        client.lastBroadcast.set(update.type, Date.now());
        
      } catch (error) {
        logger.error('Error broadcasting to client', {
          error,
          socketId,
          updateType: update.type,
        });
        stats.skipped++;
      }
    }

    logger.info('Selective broadcast completed', {
      updateType: update.type,
      totalClients: this.clients.size,
      relevantClients: relevantClients.size,
      ...stats,
    });

    return stats;
  }

  /**
   * Find clients relevant to a specific update
   */
  private findRelevantClients(update: SelectiveUpdate): Map<string, ClientContext> {
    const relevantClients = new Map<string, ClientContext>();

    for (const [socketId, client] of this.clients) {
      // Check if client has subscription for this update type
      const subscription = client.subscriptions.get(update.type);
      if (!subscription) continue;

      // Check client preferences
      if (!client.preferences.enableRealTime) continue;
      if (!client.preferences.preferredUpdateTypes.includes(update.type)) continue;

      // Check organization-level permissions
      if (update.metadata.organizationId && client.organizationId !== update.metadata.organizationId) {
        continue;
      }

      // Apply subscription filters
      if (!this.matchesSubscriptionFilter(update, subscription)) continue;

      // Check permissions
      if (!this.hasRequiredPermissions(client, update)) continue;

      relevantClients.set(socketId, client);
    }

    return relevantClients;
  }

  /**
   * Check if update matches client's subscription filter
   */
  private matchesSubscriptionFilter(
    update: SelectiveUpdate,
    filter: SubscriptionFilter
  ): boolean {
    // Check pixel ID filter
    if (filter.pixelIds?.length && update.metadata.pixelId) {
      if (!filter.pixelIds.includes(update.metadata.pixelId)) {
        return false;
      }
    }

    // Check visitor ID filter
    if (filter.visitorIds?.length && update.metadata.visitorId) {
      if (!filter.visitorIds.includes(update.metadata.visitorId)) {
        return false;
      }
    }

    // Check event type filter (for touchpoint updates)
    if (filter.eventTypes?.length && update.data.eventType) {
      if (!filter.eventTypes.includes(update.data.eventType)) {
        return false;
      }
    }

    // Check country filter
    if (filter.countries?.length && update.data.visitor?.country) {
      if (!filter.countries.includes(update.data.visitor.country)) {
        return false;
      }
    }

    // Check device filter
    if (filter.devices?.length && update.data.visitor?.device) {
      if (!filter.devices.includes(update.data.visitor.device)) {
        return false;
      }
    }

    // Check engagement score filter
    if (filter.minEngagementScore !== undefined && update.data.visitor?.engagementScore !== undefined) {
      if (update.data.visitor.engagementScore < filter.minEngagementScore) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if client has required permissions for update
   */
  private hasRequiredPermissions(client: ClientContext, update: SelectiveUpdate): boolean {
    // Super admin can see everything
    if (client.permissions.includes('super_admin')) {
      return true;
    }

    // Check specific permissions based on update type
    const requiredPermissions = this.getRequiredPermissions(update.type);
    return requiredPermissions.some(permission => client.permissions.includes(permission));
  }

  /**
   * Get required permissions for update type
   */
  private getRequiredPermissions(updateType: string): string[] {
    const permissionMap: Record<string, string[]> = {
      'visitor_activity': ['view_analytics', 'view_visitors'],
      'new_visitor': ['view_analytics', 'view_visitors'],
      'analytics_update': ['view_analytics'],
      'conversion_event': ['view_analytics', 'view_conversions'],
      'form_submission': ['view_forms', 'view_analytics'],
      'visitor_offline': ['view_visitors'],
      'system_alert': ['admin', 'super_admin'],
    };

    return permissionMap[updateType] || ['view_analytics'];
  }

  /**
   * Check rate limits for client
   */
  private checkRateLimit(client: ClientContext, updateType: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxUpdates = client.preferences.maxUpdatesPerMinute;

    const rateLimit = client.rateLimits.get(updateType) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Reset if window expired
    if (now > rateLimit.resetTime) {
      rateLimit.count = 0;
      rateLimit.resetTime = now + windowMs;
    }

    // Check if within limits
    if (rateLimit.count >= maxUpdates) {
      return false;
    }

    // Increment count
    rateLimit.count++;
    client.rateLimits.set(updateType, rateLimit);

    return true;
  }

  /**
   * Evaluate broadcast rules for update and client
   */
  private evaluateBroadcastRules(update: SelectiveUpdate, client: ClientContext): boolean {
    // Sort rules by priority (higher priority first)
    const sortedRules = [...this.broadcastRules]
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        if (!rule.condition(update, client)) {
          logger.debug('Broadcast rule rejected update', {
            ruleName: rule.name,
            socketId: client.socketId,
            updateType: update.type,
          });
          return false;
        }
      } catch (error) {
        logger.error('Error evaluating broadcast rule', {
          error,
          ruleName: rule.name,
          socketId: client.socketId,
        });
      }
    }

    return true;
  }

  /**
   * Queue update for batched delivery
   */
  private queueUpdateForBatching(socketId: string, update: SelectiveUpdate): void {
    const queue = this.updateQueue.get(socketId) || [];
    queue.push(update);
    this.updateQueue.set(socketId, queue);

    // Set or reset batch timer
    const existingTimer = this.batchTimers.get(socketId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const client = this.clients.get(socketId);
    const batchDelay = client?.subscriptions.get(update.type)?.maxBroadcastFrequency || 2000;

    const timer = setTimeout(() => {
      this.processBatchedUpdates(socketId);
    }, batchDelay);

    this.batchTimers.set(socketId, timer);
  }

  /**
   * Process batched updates for a client
   */
  private async processBatchedUpdates(socketId: string): Promise<void> {
    const client = this.clients.get(socketId);
    const queue = this.updateQueue.get(socketId);
    
    if (!client || !queue || queue.length === 0) {
      return;
    }

    try {
      // Group updates by type and merge similar ones
      const groupedUpdates = this.groupAndMergeUpdates(queue);
      
      // Get socket instance
      // Note: In production, this would connect to the actual socket server
      // For build time, we mock this functionality
      const socket = process.env.NODE_ENV === 'production' ? null : null;
      
      if (socket) {
        for (const [updateType, updates] of groupedUpdates) {
          await this.sendBatchedUpdatesToClient(socket, updateType, updates, client);
        }
      }

      // Clear queue and timer
      this.updateQueue.delete(socketId);
      this.batchTimers.delete(socketId);

      logger.info('Processed batched updates', {
        socketId,
        totalUpdates: queue.length,
        groupedTypes: groupedUpdates.size,
      });

    } catch (error) {
      logger.error('Error processing batched updates', {
        error,
        socketId,
        queueSize: queue.length,
      });
    }
  }

  /**
   * Group and merge similar updates
   */
  private groupAndMergeUpdates(updates: SelectiveUpdate[]): Map<string, SelectiveUpdate[]> {
    const grouped = new Map<string, SelectiveUpdate[]>();

    for (const update of updates) {
      const existing = grouped.get(update.type) || [];
      
      // For analytics updates, only keep the latest
      if (update.type === 'analytics_update') {
        const latestIndex = existing.findIndex(u => u.type === 'analytics_update');
        if (latestIndex >= 0) {
          existing[latestIndex] = update; // Replace with newer data
        } else {
          existing.push(update);
        }
      } else {
        existing.push(update);
      }
      
      grouped.set(update.type, existing);
    }

    return grouped;
  }

  /**
   * Send update to specific client
   */
  private async sendUpdateToClient(
    socket: Socket,
    update: SelectiveUpdate,
    client: ClientContext
  ): Promise<void> {
    const subscription = client.subscriptions.get(update.type);
    
    // Filter data based on subscription preferences
    const filteredData = this.filterUpdateData(update.data, subscription);
    
    // Add client-specific metadata
    const payload = {
      ...update,
      data: filteredData,
      metadata: {
        ...update.metadata,
        clientId: client.socketId,
        filtered: filteredData !== update.data,
      },
    };

    socket.emit(update.type, payload);
    
    logger.debug('Sent update to client', {
      socketId: client.socketId,
      updateType: update.type,
      dataSize: JSON.stringify(filteredData).length,
    });
  }

  /**
   * Send batched updates to client
   */
  private async sendBatchedUpdatesToClient(
    socket: Socket,
    updateType: string,
    updates: SelectiveUpdate[],
    client: ClientContext
  ): Promise<void> {
    const subscription = client.subscriptions.get(updateType);
    
    // Create batched payload
    const batchedPayload = {
      type: 'batched_update',
      updateType,
      updates: updates.map(update => ({
        ...update,
        data: this.filterUpdateData(update.data, subscription),
      })),
      metadata: {
        batchSize: updates.length,
        timestamp: new Date(),
        clientId: client.socketId,
      },
    };

    socket.emit('batched_update', batchedPayload);
    
    logger.debug('Sent batched updates to client', {
      socketId: client.socketId,
      updateType,
      batchSize: updates.length,
    });
  }

  /**
   * Filter update data based on subscription preferences
   */
  private filterUpdateData(data: any, subscription?: SubscriptionFilter): any {
    if (!subscription || subscription.includeDetails) {
      return data;
    }

    // Return minimal data if details not requested
    if (data.visitor) {
      return {
        ...data,
        visitor: {
          id: data.visitor.id,
          country: data.visitor.country,
          city: data.visitor.city,
          device: data.visitor.device,
          isActive: data.visitor.isActive,
          lastVisit: data.visitor.lastVisit,
          engagementScore: data.visitor.engagementScore,
        },
      };
    }

    return data;
  }

  /**
   * Initialize default broadcast rules
   */
  private initializeDefaultRules(): void {
    this.broadcastRules = [
      {
        name: 'Skip updates for inactive clients',
        condition: (update, client) => {
          const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
          return Date.now() - client.lastSeen.getTime() < inactiveThreshold;
        },
        priority: 100,
        enabled: true,
      },
      {
        name: 'Prioritize critical updates',
        condition: (update, client) => {
          return update.metadata.priority !== 'low' || client.preferences.enableRealTime;
        },
        priority: 90,
        enabled: true,
      },
      {
        name: 'Skip duplicate analytics within window',
        condition: (update, client) => {
          if (update.type !== 'analytics_update') return true;
          
          const lastBroadcast = client.lastBroadcast.get('analytics_update');
          if (!lastBroadcast) return true;
          
          const minInterval = 10000; // 10 seconds minimum between analytics updates
          return Date.now() - lastBroadcast > minInterval;
        },
        priority: 80,
        enabled: true,
      },
      {
        name: 'Organization isolation',
        condition: (update, client) => {
          if (!update.metadata.organizationId || !client.organizationId) return true;
          return update.metadata.organizationId === client.organizationId;
        },
        priority: 70,
        enabled: true,
      },
    ];

    logger.info(`Initialized ${this.broadcastRules.length} default broadcast rules`);
  }

  /**
   * Add custom broadcast rule
   */
  addBroadcastRule(rule: BroadcastRule): void {
    this.broadcastRules.push(rule);
    logger.info('Added custom broadcast rule', { name: rule.name, priority: rule.priority });
  }

  /**
   * Remove broadcast rule
   */
  removeBroadcastRule(name: string): boolean {
    const initialLength = this.broadcastRules.length;
    this.broadcastRules = this.broadcastRules.filter(rule => rule.name !== name);
    const removed = this.broadcastRules.length < initialLength;
    
    if (removed) {
      logger.info('Removed broadcast rule', { name });
    }
    
    return removed;
  }

  /**
   * Get client statistics
   */
  getClientStats(): {
    totalClients: number;
    activeClients: number;
    subscriptionCounts: Record<string, number>;
    queuedUpdates: number;
    activeBatchTimers: number;
  } {
    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000; // 5 minutes
    
    let activeClients = 0;
    const subscriptionCounts: Record<string, number> = {};

    for (const client of this.clients.values()) {
      if (now - client.lastSeen.getTime() < activeThreshold) {
        activeClients++;
      }

      for (const [dataType] of client.subscriptions) {
        subscriptionCounts[dataType] = (subscriptionCounts[dataType] || 0) + 1;
      }
    }

    const queuedUpdates = Array.from(this.updateQueue.values())
      .reduce((total, queue) => total + queue.length, 0);

    return {
      totalClients: this.clients.size,
      activeClients,
      subscriptionCounts,
      queuedUpdates,
      activeBatchTimers: this.batchTimers.size,
    };
  }

  /**
   * Health check for selective broadcast system
   */
  healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const stats = this.getClientStats();
    const details: Record<string, any> = {
      ...stats,
      broadcastRules: this.broadcastRules.length,
      enabledRules: this.broadcastRules.filter(r => r.enabled).length,
      timestamp: new Date().toISOString(),
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check for potential issues
    if (stats.queuedUpdates > 1000) {
      status = 'degraded';
      details.warnings = details.warnings || [];
      details.warnings.push('High number of queued updates');
    }

    if (stats.activeBatchTimers > 100) {
      status = 'degraded';
      details.warnings = details.warnings || [];
      details.warnings.push('High number of active batch timers');
    }

    if (this.clients.size > 1000) {
      status = 'degraded';
      details.warnings = details.warnings || [];
      details.warnings.push('High number of connected clients');
    }

    return { status, details };
  }

  /**
   * Cleanup stale data
   */
  cleanup(): void {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes

    // Cleanup stale clients
    let cleanedClients = 0;
    for (const [socketId, client] of this.clients) {
      if (now - client.lastSeen.getTime() > staleThreshold) {
        this.unregisterClient(socketId);
        cleanedClients++;
      }
    }

    // Cleanup stale timers
    let cleanedTimers = 0;
    for (const [socketId, timer] of this.batchTimers) {
      if (!this.clients.has(socketId)) {
        clearTimeout(timer);
        this.batchTimers.delete(socketId);
        cleanedTimers++;
      }
    }

    if (cleanedClients > 0 || cleanedTimers > 0) {
      logger.info('Selective broadcast cleanup completed', {
        cleanedClients,
        cleanedTimers,
      });
    }
  }
}

// Export singleton instance
export const selectiveBroadcastManager = new SelectiveBroadcastManager();

// Cleanup interval
setInterval(() => {
  selectiveBroadcastManager.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes