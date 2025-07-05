/**
 * Real-time Collaboration WebSocket System
 * =======================================
 * Provides real-time multi-user AI assistance and collaboration features:
 * - Multi-user AI chat sessions
 * - User presence indicators  
 * - Collaborative AI workspaces
 * - Real-time AI response sharing
 * - Live activity notifications
 */

import type { Server as SocketServer, Socket } from 'socket.io';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
  currentWorkspace?: string;
  currentAISession?: string;
}

export interface AISessionUpdate {
  sessionId: string;
  type: 'message_added' | 'user_joined' | 'user_left' | 'response_streaming' | 'task_executed' | 'session_shared';
  userId: string;
  message?: {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    metadata?: any;
  };
  participants?: string[];
  aiResponse?: {
    id: string;
    content: string;
    streaming: boolean;
    completed: boolean;
    taskExecution?: any;
  };
  timestamp: Date;
}

export interface WorkspaceUpdate {
  workspaceId: string;
  type: 'user_joined' | 'user_left' | 'activity_update' | 'ai_suggestion' | 'document_changed';
  userId: string;
  activity?: {
    type: string;
    description: string;
    metadata?: any;
  };
  aiSuggestion?: {
    id: string;
    type: string;
    content: string;
    confidence: number;
  };
  timestamp: Date;
}

export interface UserPresenceUpdate {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
  currentContext?: {
    page: string;
    workspace?: string;
    aiSession?: string;
    activity?: string;
  };
  cursor?: {
    x: number;
    y: number;
    element?: string;
  };
}

export interface CollaborationNotification {
  id: string;
  type: 'mention' | 'ai_response' | 'task_completed' | 'workspace_invite' | 'ai_suggestion';
  fromUserId: string;
  toUserId: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

class CollaborationRealtimeService extends EventEmitter {
  private io: SocketServer | null = null;
  private activeUsers = new Map<string, CollaborationUser>();
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketUsers = new Map<string, string>(); // socketId -> userId
  private aiSessions = new Map<string, Set<string>>(); // sessionId -> Set of userIds
  private workspaces = new Map<string, Set<string>>(); // workspaceId -> Set of userIds
  private userPresenceTimeout = new Map<string, NodeJS.Timeout>();

  initialize(io: SocketServer) {
    this.io = io;
    this.setupEventHandlers();
    this.startPresenceMonitoring();
    logger.info('Collaboration realtime service initialized');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Collaboration client connected: ${socket.id}`);

      // Handle user authentication and registration
      socket.on('authenticate', async (userData: any) => {
        await this.authenticateUser(socket, userData);
      });

      // Handle AI session events
      socket.on('join_ai_session', async (data: { sessionId: string; userId: string }) => {
        await this.handleJoinAISession(socket, data);
      });

      socket.on('leave_ai_session', async (data: { sessionId: string; userId: string }) => {
        await this.handleLeaveAISession(socket, data);
      });

      socket.on('ai_message_sent', async (data: any) => {
        await this.handleAIMessageSent(socket, data);
      });

      socket.on('ai_response_streaming', async (data: any) => {
        await this.handleAIResponseStreaming(socket, data);
      });

      // Handle workspace events
      socket.on('join_workspace', async (data: { workspaceId: string; userId: string }) => {
        await this.handleJoinWorkspace(socket, data);
      });

      socket.on('leave_workspace', async (data: { workspaceId: string; userId: string }) => {
        await this.handleLeaveWorkspace(socket, data);
      });

      socket.on('workspace_activity', async (data: any) => {
        await this.handleWorkspaceActivity(socket, data);
      });

      // Handle user presence events
      socket.on('presence_update', async (data: UserPresenceUpdate) => {
        await this.handlePresenceUpdate(socket, data);
      });

      socket.on('cursor_move', async (data: any) => {
        await this.handleCursorMove(socket, data);
      });

      // Handle collaboration features
      socket.on('send_notification', async (data: any) => {
        await this.handleSendNotification(socket, data);
      });

      socket.on('mention_user', async (data: any) => {
        await this.handleMentionUser(socket, data);
      });

      socket.on('share_ai_response', async (data: any) => {
        await this.handleShareAIResponse(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', async (data: { sessionId: string; userId: string }) => {
        await this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', async (data: { sessionId: string; userId: string }) => {
        await this.handleTypingStop(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        await this.handleUserDisconnect(socket);
      });

      // Health check
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
  }

  private async authenticateUser(socket: Socket, userData: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userData.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true
        }
      });

      if (!user) {
        socket.emit('auth_error', { message: 'User not found' });
        return;
      }

      const collaborationUser: CollaborationUser = {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || '',
        status: 'online',
        lastActivity: new Date()
      };

      // Store user connection
      this.activeUsers.set(user.id, collaborationUser);
      this.socketUsers.set(socket.id, user.id);

      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(socket.id);

      // Join organization room
      socket.join(`org:${user.organizationId}`);

      // Emit authentication success
      socket.emit('authenticated', { user: collaborationUser });

      // Broadcast user online status
      await this.broadcastUserPresence(user.id, 'online');

      // Send initial collaboration data
      await this.sendInitialCollaborationData(socket, user.id);

      logger.info(`User authenticated for collaboration: ${user.id}`);

    } catch (error) {
      logger.error('Error authenticating user for collaboration:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  }

  private async handleJoinAISession(socket: Socket, data: { sessionId: string; userId: string }) {
    try {
      const { sessionId, userId } = data;

      // Add user to AI session
      if (!this.aiSessions.has(sessionId)) {
        this.aiSessions.set(sessionId, new Set());
      }
      this.aiSessions.get(sessionId)!.add(userId);

      // Join socket room
      socket.join(`ai-session:${sessionId}`);

      // Update user's current AI session
      const user = this.activeUsers.get(userId);
      if (user) {
        user.currentAISession = sessionId;
        this.activeUsers.set(userId, user);
      }

      // Broadcast user joined session
      const update: AISessionUpdate = {
        sessionId,
        type: 'user_joined',
        userId,
        participants: Array.from(this.aiSessions.get(sessionId)!),
        timestamp: new Date()
      };

      this.io!.to(`ai-session:${sessionId}`).emit('ai_session_update', update);

      logger.info(`User ${userId} joined AI session: ${sessionId}`);

    } catch (error) {
      logger.error('Error handling join AI session:', error);
    }
  }

  private async handleLeaveAISession(socket: Socket, data: { sessionId: string; userId: string }) {
    try {
      const { sessionId, userId } = data;

      // Remove user from AI session
      if (this.aiSessions.has(sessionId)) {
        this.aiSessions.get(sessionId)!.delete(userId);
        if (this.aiSessions.get(sessionId)!.size === 0) {
          this.aiSessions.delete(sessionId);
        }
      }

      // Leave socket room
      socket.leave(`ai-session:${sessionId}`);

      // Update user's current AI session
      const user = this.activeUsers.get(userId);
      if (user) {
        user.currentAISession = undefined;
        this.activeUsers.set(userId, user);
      }

      // Broadcast user left session
      const update: AISessionUpdate = {
        sessionId,
        type: 'user_left',
        userId,
        participants: this.aiSessions.has(sessionId) ? Array.from(this.aiSessions.get(sessionId)!) : [],
        timestamp: new Date()
      };

      this.io!.to(`ai-session:${sessionId}`).emit('ai_session_update', update);

      logger.info(`User ${userId} left AI session: ${sessionId}`);

    } catch (error) {
      logger.error('Error handling leave AI session:', error);
    }
  }

  private async handleAIMessageSent(socket: Socket, data: any) {
    try {
      const { sessionId, userId, message } = data;

      const update: AISessionUpdate = {
        sessionId,
        type: 'message_added',
        userId,
        message: {
          id: message.id || `msg_${Date.now()}`,
          content: message.content,
          sender: 'user',
          timestamp: new Date(),
          metadata: message.metadata
        },
        timestamp: new Date()
      };

      // Broadcast to all session participants except sender
      socket.to(`ai-session:${sessionId}`).emit('ai_session_update', update);

      logger.info(`AI message sent in session ${sessionId} by user ${userId}`);

    } catch (error) {
      logger.error('Error handling AI message sent:', error);
    }
  }

  private async handleAIResponseStreaming(socket: Socket, data: any) {
    try {
      const { sessionId, aiResponse } = data;

      const update: AISessionUpdate = {
        sessionId,
        type: 'response_streaming',
        userId: 'ai',
        aiResponse: {
          id: aiResponse.id,
          content: aiResponse.content,
          streaming: aiResponse.streaming,
          completed: aiResponse.completed,
          taskExecution: aiResponse.taskExecution
        },
        timestamp: new Date()
      };

      // Broadcast to all session participants
      this.io!.to(`ai-session:${sessionId}`).emit('ai_session_update', update);

      logger.info(`AI response streaming in session: ${sessionId}`);

    } catch (error) {
      logger.error('Error handling AI response streaming:', error);
    }
  }

  private async handleJoinWorkspace(socket: Socket, data: { workspaceId: string; userId: string }) {
    try {
      const { workspaceId, userId } = data;

      // Add user to workspace
      if (!this.workspaces.has(workspaceId)) {
        this.workspaces.set(workspaceId, new Set());
      }
      this.workspaces.get(workspaceId)!.add(userId);

      // Join socket room
      socket.join(`workspace:${workspaceId}`);

      // Update user's current workspace
      const user = this.activeUsers.get(userId);
      if (user) {
        user.currentWorkspace = workspaceId;
        this.activeUsers.set(userId, user);
      }

      // Broadcast user joined workspace
      const update: WorkspaceUpdate = {
        workspaceId,
        type: 'user_joined',
        userId,
        timestamp: new Date()
      };

      this.io!.to(`workspace:${workspaceId}`).emit('workspace_update', update);

      logger.info(`User ${userId} joined workspace: ${workspaceId}`);

    } catch (error) {
      logger.error('Error handling join workspace:', error);
    }
  }

  private async handleLeaveWorkspace(socket: Socket, data: { workspaceId: string; userId: string }) {
    try {
      const { workspaceId, userId } = data;

      // Remove user from workspace
      if (this.workspaces.has(workspaceId)) {
        this.workspaces.get(workspaceId)!.delete(userId);
        if (this.workspaces.get(workspaceId)!.size === 0) {
          this.workspaces.delete(workspaceId);
        }
      }

      // Leave socket room
      socket.leave(`workspace:${workspaceId}`);

      // Update user's current workspace
      const user = this.activeUsers.get(userId);
      if (user) {
        user.currentWorkspace = undefined;
        this.activeUsers.set(userId, user);
      }

      // Broadcast user left workspace
      const update: WorkspaceUpdate = {
        workspaceId,
        type: 'user_left',
        userId,
        timestamp: new Date()
      };

      this.io!.to(`workspace:${workspaceId}`).emit('workspace_update', update);

      logger.info(`User ${userId} left workspace: ${workspaceId}`);

    } catch (error) {
      logger.error('Error handling leave workspace:', error);
    }
  }

  private async handleWorkspaceActivity(socket: Socket, data: any) {
    try {
      const { workspaceId, userId, activity } = data;

      const update: WorkspaceUpdate = {
        workspaceId,
        type: 'activity_update',
        userId,
        activity: {
          type: activity.type,
          description: activity.description,
          metadata: activity.metadata
        },
        timestamp: new Date()
      };

      // Broadcast to workspace participants except sender
      socket.to(`workspace:${workspaceId}`).emit('workspace_update', update);

      logger.info(`Workspace activity in ${workspaceId} by user ${userId}: ${activity.type}`);

    } catch (error) {
      logger.error('Error handling workspace activity:', error);
    }
  }

  private async handlePresenceUpdate(socket: Socket, data: UserPresenceUpdate) {
    try {
      const { userId, status, currentContext, cursor } = data;

      const user = this.activeUsers.get(userId);
      if (user) {
        user.status = status;
        user.lastActivity = new Date();
        this.activeUsers.set(userId, user);

        // Reset presence timeout
        if (this.userPresenceTimeout.has(userId)) {
          clearTimeout(this.userPresenceTimeout.get(userId)!);
        }

        // Set new timeout for auto-away
        this.userPresenceTimeout.set(userId, setTimeout(() => {
          this.setUserAway(userId);
        }, 5 * 60 * 1000)); // 5 minutes

        // Broadcast presence update
        await this.broadcastUserPresence(userId, status, currentContext, cursor);
      }

    } catch (error) {
      logger.error('Error handling presence update:', error);
    }
  }

  private async handleCursorMove(socket: Socket, data: any) {
    try {
      const { userId, workspaceId, cursor } = data;

      // Broadcast cursor movement to workspace participants except sender
      socket.to(`workspace:${workspaceId}`).emit('cursor_update', {
        userId,
        cursor,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error handling cursor move:', error);
    }
  }

  private async handleTypingStart(socket: Socket, data: { sessionId: string; userId: string }) {
    try {
      const { sessionId, userId } = data;

      socket.to(`ai-session:${sessionId}`).emit('typing_indicator', {
        userId,
        typing: true,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error handling typing start:', error);
    }
  }

  private async handleTypingStop(socket: Socket, data: { sessionId: string; userId: string }) {
    try {
      const { sessionId, userId } = data;

      socket.to(`ai-session:${sessionId}`).emit('typing_indicator', {
        userId,
        typing: false,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error handling typing stop:', error);
    }
  }

  private async handleSendNotification(socket: Socket, data: any) {
    try {
      const notification: CollaborationNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: data.type,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        title: data.title,
        message: data.message,
        data: data.data,
        timestamp: new Date(),
        read: false
      };

      // Send notification to target user
      await this.sendNotificationToUser(data.toUserId, notification);

      logger.info(`Notification sent from ${data.fromUserId} to ${data.toUserId}`);

    } catch (error) {
      logger.error('Error handling send notification:', error);
    }
  }

  private async handleMentionUser(socket: Socket, data: any) {
    try {
      const { sessionId, mentionedUserId, mentionedByUserId, message } = data;

      const notification: CollaborationNotification = {
        id: `mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'mention',
        fromUserId: mentionedByUserId,
        toUserId: mentionedUserId,
        title: 'You were mentioned in an AI session',
        message: `${message.substring(0, 100)}...`,
        data: { sessionId, message },
        timestamp: new Date(),
        read: false
      };

      await this.sendNotificationToUser(mentionedUserId, notification);

      logger.info(`User ${mentionedUserId} mentioned by ${mentionedByUserId} in session ${sessionId}`);

    } catch (error) {
      logger.error('Error handling mention user:', error);
    }
  }

  private async handleShareAIResponse(socket: Socket, data: any) {
    try {
      const { fromUserId, toUserIds, aiResponse, sessionId } = data;

      for (const toUserId of toUserIds) {
        const notification: CollaborationNotification = {
          id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'ai_response',
          fromUserId,
          toUserId,
          title: 'AI response shared with you',
          message: `${aiResponse.content.substring(0, 100)}...`,
          data: { sessionId, aiResponse },
          timestamp: new Date(),
          read: false
        };

        await this.sendNotificationToUser(toUserId, notification);
      }

      logger.info(`AI response shared from ${fromUserId} to ${toUserIds.length} users`);

    } catch (error) {
      logger.error('Error handling share AI response:', error);
    }
  }

  private async handleUserDisconnect(socket: Socket) {
    try {
      const userId = this.socketUsers.get(socket.id);
      if (!userId) return;

      // Remove socket from user's socket set
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          // User completely disconnected
          this.userSockets.delete(userId);
          await this.setUserOffline(userId);
        }
      }

      this.socketUsers.delete(socket.id);

      logger.info(`Collaboration client disconnected: ${socket.id} (User: ${userId})`);

    } catch (error) {
      logger.error('Error handling user disconnect:', error);
    }
  }

  // Utility methods

  private async broadcastUserPresence(userId: string, status: string, currentContext?: any, cursor?: any) {
    if (!this.io) return;

    const user = this.activeUsers.get(userId);
    if (!user) return;

    const presenceUpdate: UserPresenceUpdate = {
      userId,
      status: status as any,
      lastActivity: new Date(),
      currentContext,
      cursor
    };

    // Broadcast to organization
    this.io.to(`org:${user.organizationId}`).emit('presence_update', presenceUpdate);
  }

  private async setUserAway(userId: string) {
    const user = this.activeUsers.get(userId);
    if (user && user.status === 'online') {
      user.status = 'away';
      this.activeUsers.set(userId, user);
      await this.broadcastUserPresence(userId, 'away');
    }
  }

  private async setUserOffline(userId: string) {
    const user = this.activeUsers.get(userId);
    if (user) {
      user.status = 'offline';
      this.activeUsers.set(userId, user);
      await this.broadcastUserPresence(userId, 'offline');

      // Clean up user from sessions and workspaces
      this.cleanupUserSessions(userId);
    }

    // Clear presence timeout
    if (this.userPresenceTimeout.has(userId)) {
      clearTimeout(this.userPresenceTimeout.get(userId)!);
      this.userPresenceTimeout.delete(userId);
    }
  }

  private cleanupUserSessions(userId: string) {
    // Remove from AI sessions
    for (const [sessionId, participants] of this.aiSessions.entries()) {
      if (participants.has(userId)) {
        participants.delete(userId);
        if (participants.size === 0) {
          this.aiSessions.delete(sessionId);
        }
      }
    }

    // Remove from workspaces
    for (const [workspaceId, participants] of this.workspaces.entries()) {
      if (participants.has(userId)) {
        participants.delete(userId);
        if (participants.size === 0) {
          this.workspaces.delete(workspaceId);
        }
      }
    }
  }

  private async sendNotificationToUser(userId: string, notification: CollaborationNotification) {
    if (!this.io) return;

    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        this.io.to(socketId).emit('notification', notification);
      }
    }

    // Store notification in database for persistence
    try {
      await prisma.notification.create({
        data: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data as any,
          userId: notification.toUserId,
          fromUserId: notification.fromUserId,
          read: false,
          createdAt: notification.timestamp
        }
      });
    } catch (error) {
      logger.error('Error storing notification in database:', error);
    }
  }

  private async sendInitialCollaborationData(socket: Socket, userId: string) {
    try {
      const user = this.activeUsers.get(userId);
      if (!user) return;

      // Send active users in organization
      const orgUsers = Array.from(this.activeUsers.values())
        .filter(u => u.organizationId === user.organizationId && u.status !== 'offline');

      socket.emit('active_users', orgUsers);

      // Send recent notifications
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          read: false
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      socket.emit('recent_notifications', notifications);

    } catch (error) {
      logger.error('Error sending initial collaboration data:', error);
    }
  }

  private startPresenceMonitoring() {
    // Clean up inactive users every 2 minutes
    setInterval(() => {
      this.cleanupInactiveUsers();
    }, 2 * 60 * 1000);
  }

  private async cleanupInactiveUsers() {
    const inactiveThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes

    for (const [userId, user] of this.activeUsers.entries()) {
      if (user.lastActivity < inactiveThreshold && user.status !== 'offline') {
        await this.setUserOffline(userId);
      }
    }
  }

  // Public API methods

  async shareAIResponseToUsers(fromUserId: string, toUserIds: string[], aiResponse: any, sessionId: string) {
    for (const toUserId of toUserIds) {
      const notification: CollaborationNotification = {
        id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai_response',
        fromUserId,
        toUserId,
        title: 'AI response shared with you',
        message: `${aiResponse.content.substring(0, 100)}...`,
        data: { sessionId, aiResponse },
        timestamp: new Date(),
        read: false
      };

      await this.sendNotificationToUser(toUserId, notification);
    }
  }

  async broadcastAITaskCompletion(sessionId: string, taskResult: any) {
    if (!this.io) return;

    const update: AISessionUpdate = {
      sessionId,
      type: 'task_executed',
      userId: 'ai',
      aiResponse: {
        id: `task_${Date.now()}`,
        content: `Task completed: ${taskResult.message}`,
        streaming: false,
        completed: true,
        taskExecution: taskResult
      },
      timestamp: new Date()
    };

    this.io.to(`ai-session:${sessionId}`).emit('ai_session_update', update);
  }

  getActiveUsers(organizationId?: string): CollaborationUser[] {
    const users = Array.from(this.activeUsers.values())
      .filter(user => user.status !== 'offline');

    if (organizationId) {
      return users.filter(user => user.organizationId === organizationId);
    }

    return users;
  }

  getConnectionCount(): number {
    return this.socketUsers.size;
  }

  getActiveSessionCount(): number {
    return this.aiSessions.size;
  }

  getActiveWorkspaceCount(): number {
    return this.workspaces.size;
  }
}

// Singleton instance
export const collaborationRealtimeService = new CollaborationRealtimeService();