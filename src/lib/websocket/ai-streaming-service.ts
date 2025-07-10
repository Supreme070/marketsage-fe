/**
 * AI Real-time Streaming Service
 * ==============================
 * 
 * Provides real-time streaming for AI operations and responses:
 * - Real-time AI task execution progress
 * - Live AI decision-making streams
 * - AI response streaming with typing indicators
 * - Task completion notifications
 * - Error and warning streams
 * - Performance metrics streaming
 */

import type { Server as SocketServer } from 'socket.io';
import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import { redisCache } from '@/lib/cache/redis-client';
import { aiAuditTrailSystem } from '@/lib/ai/ai-audit-trail-system';
import { aiOperationRollbackSystem } from '@/lib/ai/ai-operation-rollback-system';
import { universalTaskExecutionEngine } from '@/lib/ai/universal-task-execution-engine';
import { UserRole } from '@prisma/client';

// AI streaming event types
export enum AIStreamEventType {
  TASK_STARTED = 'task_started',
  TASK_PROGRESS = 'task_progress',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  TASK_CANCELLED = 'task_cancelled',
  DECISION_STARTED = 'decision_started',
  DECISION_PROGRESS = 'decision_progress',
  DECISION_COMPLETED = 'decision_completed',
  RESPONSE_CHUNK = 'response_chunk',
  RESPONSE_COMPLETE = 'response_complete',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  ERROR_OCCURRED = 'error_occurred',
  WARNING_ISSUED = 'warning_issued',
  ROLLBACK_INITIATED = 'rollback_initiated',
  ROLLBACK_COMPLETED = 'rollback_completed',
  PERFORMANCE_UPDATE = 'performance_update',
  SYSTEM_STATUS = 'system_status'
}

// AI streaming priority levels
export enum AIStreamPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// AI stream message interface
export interface AIStreamMessage {
  id: string;
  type: AIStreamEventType;
  priority: AIStreamPriority;
  timestamp: Date;
  userId: string;
  sessionId: string;
  requestId: string;
  operationId?: string;
  data: any;
  metadata?: {
    progress?: number;
    duration?: number;
    confidence?: number;
    riskLevel?: string;
    context?: Record<string, any>;
  };
}

// AI task progress interface
export interface AITaskProgress {
  taskId: string;
  operationId: string;
  operation: string;
  stage: string;
  progress: number;
  message: string;
  estimatedTimeRemaining: number;
  performance: {
    executionTime: number;
    memoryUsage: number;
    processingRate: number;
  };
  subTasks?: {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
  }[];
}

// AI decision progress interface
export interface AIDecisionProgress {
  decisionId: string;
  type: string;
  stage: string;
  progress: number;
  message: string;
  reasoning: {
    currentStep: string;
    completedSteps: string[];
    remainingSteps: string[];
    evidence: any[];
    confidence: number;
  };
  alternatives: {
    id: string;
    description: string;
    probability: number;
    confidence: number;
  }[];
}

// AI response chunk interface
export interface AIResponseChunk {
  id: string;
  requestId: string;
  chunkIndex: number;
  totalChunks: number;
  content: string;
  isComplete: boolean;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    context?: Record<string, any>;
  };
}

// AI client subscription interface
export interface AIClientSubscription {
  socketId: string;
  userId: string;
  userRole: UserRole;
  organizationId: string;
  subscriptions: Set<string>;
  filters: Map<string, any>;
  lastActivity: Date;
  rateLimiting: {
    messagesPerSecond: number;
    lastMessageTime: number;
    messageCount: number;
  };
  permissions: Set<string>;
}

class AIStreamingService {
  private io: SocketServer | null = null;
  private activeStreams: Map<string, AIStreamMessage[]> = new Map();
  private clientSubscriptions: Map<string, AIClientSubscription> = new Map();
  private streamBuffer: Map<string, AIStreamMessage[]> = new Map();
  private performanceMetrics: Map<string, any> = new Map();
  private tracer = trace.getTracer('ai-streaming-service');

  // Rate limiting constants
  private readonly MAX_MESSAGES_PER_SECOND = 10;
  private readonly BUFFER_FLUSH_INTERVAL = 100; // ms
  private readonly STREAM_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.startPeriodicCleanup();
    this.startBufferFlush();
  }

  /**
   * Initialize the AI streaming service with Socket.IO
   */
  initialize(io: SocketServer) {
    this.io = io;
    this.setupEventHandlers();
    logger.info('AI Streaming Service initialized');
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info(`AI streaming client connected: ${socket.id}`);

      // Handle client authentication and subscription
      socket.on('ai_auth', async (authData) => {
        await this.handleClientAuth(socket, authData);
      });

      // Handle subscription to AI streams
      socket.on('ai_subscribe', (subscriptionData) => {
        this.handleClientSubscription(socket, subscriptionData);
      });

      // Handle unsubscription
      socket.on('ai_unsubscribe', (subscriptionData) => {
        this.handleClientUnsubscription(socket, subscriptionData);
      });

      // Handle client typing indicators
      socket.on('ai_typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('ai_typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Handle client disconnection
      socket.on('disconnect', (reason) => {
        this.handleClientDisconnect(socket.id, reason);
      });

      // Handle errors
      socket.on('error', (error) => {
        this.handleSocketError(socket.id, error);
      });

      // Handle ping/pong for connection health
      socket.on('ai_ping', () => {
        socket.emit('ai_pong', { timestamp: Date.now() });
        this.updateClientActivity(socket.id);
      });
    });
  }

  /**
   * Handle client authentication
   */
  private async handleClientAuth(socket: any, authData: any) {
    try {
      const { userId, userRole, organizationId, permissions } = authData;
      
      // Validate authentication (would integrate with your auth system)
      if (!userId || !userRole || !organizationId) {
        socket.emit('ai_auth_error', { message: 'Invalid authentication data' });
        return;
      }

      // Create client subscription
      const subscription: AIClientSubscription = {
        socketId: socket.id,
        userId,
        userRole,
        organizationId,
        subscriptions: new Set(),
        filters: new Map(),
        lastActivity: new Date(),
        rateLimiting: {
          messagesPerSecond: this.MAX_MESSAGES_PER_SECOND,
          lastMessageTime: 0,
          messageCount: 0
        },
        permissions: new Set(permissions || [])
      };

      this.clientSubscriptions.set(socket.id, subscription);
      
      // Join organization-specific room
      socket.join(`org_${organizationId}`);
      socket.join(`user_${userId}`);

      socket.emit('ai_auth_success', {
        subscriptionId: socket.id,
        permissions: Array.from(subscription.permissions),
        rateLimits: subscription.rateLimiting
      });

      logger.info(`AI client authenticated: ${socket.id} (user: ${userId}, org: ${organizationId})`);
    } catch (error) {
      socket.emit('ai_auth_error', { message: 'Authentication failed' });
      logger.error('AI client authentication failed:', error);
    }
  }

  /**
   * Handle client subscription to AI streams
   */
  private handleClientSubscription(socket: any, subscriptionData: any) {
    const client = this.clientSubscriptions.get(socket.id);
    if (!client) {
      socket.emit('ai_subscription_error', { message: 'Client not authenticated' });
      return;
    }

    const { streamTypes, filters } = subscriptionData;
    
    // Add subscriptions
    if (Array.isArray(streamTypes)) {
      streamTypes.forEach(streamType => {
        if (this.hasPermissionForStream(client, streamType)) {
          client.subscriptions.add(streamType);
          if (filters && filters[streamType]) {
            client.filters.set(streamType, filters[streamType]);
          }
        }
      });
    }

    // Join relevant rooms
    client.subscriptions.forEach(streamType => {
      socket.join(`ai_${streamType}`);
      socket.join(`ai_${streamType}_${client.organizationId}`);
    });

    socket.emit('ai_subscription_success', {
      subscriptions: Array.from(client.subscriptions),
      filters: Object.fromEntries(client.filters)
    });

    logger.info(`AI client subscribed: ${socket.id} to ${Array.from(client.subscriptions).join(', ')}`);
  }

  /**
   * Handle client unsubscription
   */
  private handleClientUnsubscription(socket: any, subscriptionData: any) {
    const client = this.clientSubscriptions.get(socket.id);
    if (!client) return;

    const { streamTypes } = subscriptionData;
    
    if (Array.isArray(streamTypes)) {
      streamTypes.forEach(streamType => {
        client.subscriptions.delete(streamType);
        client.filters.delete(streamType);
        socket.leave(`ai_${streamType}`);
        socket.leave(`ai_${streamType}_${client.organizationId}`);
      });
    }

    socket.emit('ai_unsubscription_success', {
      subscriptions: Array.from(client.subscriptions)
    });

    logger.info(`AI client unsubscribed: ${socket.id} from ${streamTypes.join(', ')}`);
  }

  /**
   * Stream AI task progress
   */
  async streamTaskProgress(
    userId: string,
    sessionId: string,
    requestId: string,
    operationId: string,
    progress: AITaskProgress
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.TASK_PROGRESS,
      priority: AIStreamPriority.MEDIUM,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      operationId,
      data: progress,
      metadata: {
        progress: progress.progress,
        duration: progress.performance.executionTime
      }
    };

    await this.sendStreamMessage(message);
    
    // Record in audit trail
    await aiAuditTrailSystem.recordOperation(
      userId,
      'USER' as UserRole,
      progress.taskId,
      sessionId,
      requestId,
      operationId,
      'task_progress',
      'ai_task',
      'stream_update',
      { progress: progress.progress, stage: progress.stage },
      progress,
      0,
      'success'
    );
  }

  /**
   * Stream AI decision progress
   */
  async streamDecisionProgress(
    userId: string,
    sessionId: string,
    requestId: string,
    operationId: string,
    decisionProgress: AIDecisionProgress
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.DECISION_PROGRESS,
      priority: AIStreamPriority.HIGH,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      operationId,
      data: decisionProgress,
      metadata: {
        progress: decisionProgress.progress,
        confidence: decisionProgress.reasoning.confidence
      }
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Stream AI response in chunks
   */
  async streamResponseChunk(
    userId: string,
    sessionId: string,
    requestId: string,
    chunk: AIResponseChunk
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.RESPONSE_CHUNK,
      priority: AIStreamPriority.HIGH,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      data: chunk,
      metadata: {
        progress: chunk.chunkIndex / chunk.totalChunks,
        confidence: chunk.metadata?.confidence
      }
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Stream complete AI response
   */
  async streamResponseComplete(
    userId: string,
    sessionId: string,
    requestId: string,
    response: any
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.RESPONSE_COMPLETE,
      priority: AIStreamPriority.HIGH,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      data: response,
      metadata: {
        progress: 100,
        duration: response.executionTime || 0
      }
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Stream typing indicators
   */
  async streamTypingStart(
    userId: string,
    sessionId: string,
    requestId: string,
    context: any
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.TYPING_START,
      priority: AIStreamPriority.LOW,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      data: context,
      metadata: {
        context
      }
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Stream typing stop
   */
  async streamTypingStop(
    userId: string,
    sessionId: string,
    requestId: string
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.TYPING_STOP,
      priority: AIStreamPriority.LOW,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      data: {},
      metadata: {}
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Stream error events
   */
  async streamError(
    userId: string,
    sessionId: string,
    requestId: string,
    error: Error,
    context: any
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.ERROR_OCCURRED,
      priority: AIStreamPriority.CRITICAL,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      data: {
        error: error.message,
        stack: error.stack,
        context
      },
      metadata: {
        context
      }
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Stream warning events
   */
  async streamWarning(
    userId: string,
    sessionId: string,
    requestId: string,
    warning: string,
    context: any
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.WARNING_ISSUED,
      priority: AIStreamPriority.MEDIUM,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      data: {
        warning,
        context
      },
      metadata: {
        context
      }
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Stream rollback events
   */
  async streamRollbackInitiated(
    userId: string,
    sessionId: string,
    requestId: string,
    operationId: string,
    rollbackPlan: any
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.ROLLBACK_INITIATED,
      priority: AIStreamPriority.HIGH,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      operationId,
      data: {
        operationId,
        rollbackPlan
      },
      metadata: {
        riskLevel: rollbackPlan.riskLevel
      }
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Stream performance metrics
   */
  async streamPerformanceUpdate(
    userId: string,
    sessionId: string,
    requestId: string,
    metrics: any
  ) {
    const message: AIStreamMessage = {
      id: this.generateMessageId(),
      type: AIStreamEventType.PERFORMANCE_UPDATE,
      priority: AIStreamPriority.LOW,
      timestamp: new Date(),
      userId,
      sessionId,
      requestId,
      data: metrics,
      metadata: {
        context: metrics
      }
    };

    await this.sendStreamMessage(message);
  }

  /**
   * Send stream message to connected clients
   */
  private async sendStreamMessage(message: AIStreamMessage) {
    if (!this.io) return;

    const span = this.tracer.startSpan('send-stream-message');
    
    try {
      // Add to stream buffer
      this.addToStreamBuffer(message);
      
      // Determine target clients
      const targetClients = this.getTargetClients(message);
      
      // Send to each target client with rate limiting
      for (const client of targetClients) {
        if (this.canSendToClient(client, message)) {
          this.io.to(client.socketId).emit('ai_stream_message', message);
          this.updateClientRateLimit(client);
        }
      }

      // Store in active streams
      this.addToActiveStreams(message);

      span.setAttributes({
        messageId: message.id,
        messageType: message.type,
        priority: message.priority,
        userId: message.userId,
        targetClients: targetClients.length
      });

      // Cache message for replay
      await this.cacheMessage(message);

    } catch (error) {
      span.recordException(error as Error);
      logger.error('Failed to send stream message:', error);
    } finally {
      span.end();
    }
  }

  /**
   * Get target clients for a message
   */
  private getTargetClients(message: AIStreamMessage): AIClientSubscription[] {
    const targetClients: AIClientSubscription[] = [];
    
    this.clientSubscriptions.forEach(client => {
      // Check if client is subscribed to this message type
      if (client.subscriptions.has(message.type)) {
        // Check if client has permission for this message
        if (this.hasPermissionForMessage(client, message)) {
          // Check if message matches client filters
          if (this.matchesClientFilters(client, message)) {
            targetClients.push(client);
          }
        }
      }
    });

    return targetClients;
  }

  /**
   * Check if client has permission for a message
   */
  private hasPermissionForMessage(client: AIClientSubscription, message: AIStreamMessage): boolean {
    // Check organization access
    if (message.userId !== client.userId && !client.permissions.has('view_all_ai_streams')) {
      return false;
    }

    // Check message type permissions
    const requiredPermissions = {
      [AIStreamEventType.TASK_PROGRESS]: 'view_ai_tasks',
      [AIStreamEventType.DECISION_PROGRESS]: 'view_ai_decisions',
      [AIStreamEventType.RESPONSE_CHUNK]: 'view_ai_responses',
      [AIStreamEventType.ERROR_OCCURRED]: 'view_ai_errors',
      [AIStreamEventType.ROLLBACK_INITIATED]: 'view_ai_rollbacks'
    };

    const required = requiredPermissions[message.type];
    if (required && !client.permissions.has(required)) {
      return false;
    }

    return true;
  }

  /**
   * Check if message matches client filters
   */
  private matchesClientFilters(client: AIClientSubscription, message: AIStreamMessage): boolean {
    const filters = client.filters.get(message.type);
    if (!filters) return true;

    // Apply filters based on message type
    if (filters.operationTypes && message.operationId) {
      const operationType = message.data.operation || message.data.type;
      if (filters.operationTypes.length > 0 && !filters.operationTypes.includes(operationType)) {
        return false;
      }
    }

    if (filters.priorities && filters.priorities.length > 0) {
      if (!filters.priorities.includes(message.priority)) {
        return false;
      }
    }

    if (filters.minConfidence && message.metadata?.confidence) {
      if (message.metadata.confidence < filters.minConfidence) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if client can receive message (rate limiting)
   */
  private canSendToClient(client: AIClientSubscription, message: AIStreamMessage): boolean {
    const now = Date.now();
    const timeSinceLastMessage = now - client.rateLimiting.lastMessageTime;
    
    // Reset counter if more than 1 second has passed
    if (timeSinceLastMessage > 1000) {
      client.rateLimiting.messageCount = 0;
    }
    
    // Check rate limit
    if (client.rateLimiting.messageCount >= client.rateLimiting.messagesPerSecond) {
      // Priority messages bypass rate limiting
      if (message.priority !== AIStreamPriority.CRITICAL) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update client rate limit
   */
  private updateClientRateLimit(client: AIClientSubscription) {
    const now = Date.now();
    client.rateLimiting.lastMessageTime = now;
    client.rateLimiting.messageCount++;
    client.lastActivity = new Date();
  }

  /**
   * Check if client has permission for stream type
   */
  private hasPermissionForStream(client: AIClientSubscription, streamType: string): boolean {
    const permissionMap = {
      [AIStreamEventType.TASK_PROGRESS]: 'view_ai_tasks',
      [AIStreamEventType.DECISION_PROGRESS]: 'view_ai_decisions',
      [AIStreamEventType.RESPONSE_CHUNK]: 'view_ai_responses',
      [AIStreamEventType.ERROR_OCCURRED]: 'view_ai_errors',
      [AIStreamEventType.ROLLBACK_INITIATED]: 'view_ai_rollbacks'
    };

    const requiredPermission = permissionMap[streamType as AIStreamEventType];
    if (requiredPermission && !client.permissions.has(requiredPermission)) {
      return false;
    }

    return true;
  }

  /**
   * Add message to stream buffer
   */
  private addToStreamBuffer(message: AIStreamMessage) {
    const key = `${message.userId}:${message.sessionId}`;
    const buffer = this.streamBuffer.get(key) || [];
    buffer.push(message);
    
    // Keep only last 100 messages per stream
    if (buffer.length > 100) {
      buffer.shift();
    }
    
    this.streamBuffer.set(key, buffer);
  }

  /**
   * Add message to active streams
   */
  private addToActiveStreams(message: AIStreamMessage) {
    const key = `${message.userId}:${message.sessionId}:${message.requestId}`;
    const stream = this.activeStreams.get(key) || [];
    stream.push(message);
    
    // Keep only last 50 messages per request
    if (stream.length > 50) {
      stream.shift();
    }
    
    this.activeStreams.set(key, stream);
  }

  /**
   * Cache message for replay
   */
  private async cacheMessage(message: AIStreamMessage) {
    try {
      const key = `ai_stream:${message.userId}:${message.sessionId}:${message.requestId}`;
      await redisCache.lpush(key, JSON.stringify(message));
      await redisCache.ltrim(key, 0, 99); // Keep last 100 messages
      await redisCache.expire(key, 3600); // 1 hour TTL
    } catch (error) {
      logger.error('Failed to cache stream message:', error);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(socketId: string, reason: string) {
    this.clientSubscriptions.delete(socketId);
    logger.info(`AI streaming client disconnected: ${socketId}, reason: ${reason}`);
  }

  /**
   * Handle socket error
   */
  private handleSocketError(socketId: string, error: any) {
    logger.error(`AI streaming socket error for ${socketId}:`, error);
    this.clientSubscriptions.delete(socketId);
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(socket: any, data: any) {
    const client = this.clientSubscriptions.get(socket.id);
    if (!client) return;

    // Broadcast typing indicator to other clients in the same session
    socket.broadcast.to(`session_${data.sessionId}`).emit('ai_typing_start', {
      userId: client.userId,
      sessionId: data.sessionId,
      context: data.context
    });
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(socket: any, data: any) {
    const client = this.clientSubscriptions.get(socket.id);
    if (!client) return;

    // Broadcast typing stop to other clients in the same session
    socket.broadcast.to(`session_${data.sessionId}`).emit('ai_typing_stop', {
      userId: client.userId,
      sessionId: data.sessionId
    });
  }

  /**
   * Update client activity
   */
  private updateClientActivity(socketId: string) {
    const client = this.clientSubscriptions.get(socketId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  /**
   * Get stream history for a request
   */
  async getStreamHistory(
    userId: string,
    sessionId: string,
    requestId: string,
    limit: number = 50
  ): Promise<AIStreamMessage[]> {
    try {
      const key = `ai_stream:${userId}:${sessionId}:${requestId}`;
      const cached = await redisCache.lrange(key, 0, limit - 1);
      
      return cached.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('Failed to get stream history:', error);
      return [];
    }
  }

  /**
   * Get active stream statistics
   */
  getStreamStats() {
    return {
      activeStreams: this.activeStreams.size,
      connectedClients: this.clientSubscriptions.size,
      bufferedMessages: Array.from(this.streamBuffer.values()).reduce((sum, buffer) => sum + buffer.length, 0),
      subscriptionsByType: this.getSubscriptionsByType(),
      performanceMetrics: this.getPerformanceMetrics()
    };
  }

  /**
   * Get subscriptions by type
   */
  private getSubscriptionsByType(): Record<string, number> {
    const subscriptions: Record<string, number> = {};
    
    this.clientSubscriptions.forEach(client => {
      client.subscriptions.forEach(subscription => {
        subscriptions[subscription] = (subscriptions[subscription] || 0) + 1;
      });
    });

    return subscriptions;
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics() {
    const metrics = {
      avgMessagesPerSecond: 0,
      avgResponseTime: 0,
      errorRate: 0,
      throughput: 0
    };

    // Calculate performance metrics from stored data
    // This would be implemented based on your specific requirements

    return metrics;
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupInactiveClients();
      this.cleanupOldStreams();
    }, this.STREAM_CLEANUP_INTERVAL);
  }

  /**
   * Start buffer flush
   */
  private startBufferFlush() {
    setInterval(() => {
      this.flushStreamBuffers();
    }, this.BUFFER_FLUSH_INTERVAL);
  }

  /**
   * Clean up inactive clients
   */
  private cleanupInactiveClients() {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    
    this.clientSubscriptions.forEach((client, socketId) => {
      if (now.getTime() - client.lastActivity.getTime() > inactiveThreshold) {
        this.clientSubscriptions.delete(socketId);
        logger.info(`Cleaned up inactive AI streaming client: ${socketId}`);
      }
    });
  }

  /**
   * Clean up old streams
   */
  private cleanupOldStreams() {
    const now = new Date();
    const oldStreamThreshold = 60 * 60 * 1000; // 1 hour
    
    this.activeStreams.forEach((stream, key) => {
      if (stream.length > 0) {
        const lastMessage = stream[stream.length - 1];
        if (now.getTime() - lastMessage.timestamp.getTime() > oldStreamThreshold) {
          this.activeStreams.delete(key);
          logger.info(`Cleaned up old AI stream: ${key}`);
        }
      }
    });
  }

  /**
   * Flush stream buffers
   */
  private flushStreamBuffers() {
    // This would implement any buffering logic needed for performance
    // For now, it's a placeholder
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `ai_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown the streaming service
   */
  shutdown() {
    this.activeStreams.clear();
    this.clientSubscriptions.clear();
    this.streamBuffer.clear();
    this.performanceMetrics.clear();
    logger.info('AI Streaming Service shut down');
  }
}

// Export singleton instance
export const aiStreamingService = new AIStreamingService();

// Export types
export type { AIStreamingService };