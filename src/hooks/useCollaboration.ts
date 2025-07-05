/**
 * Real-time Collaboration Hook
 * ===========================
 * React hook for multi-user AI assistance and real-time collaboration features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';

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

export interface AISessionParticipant {
  userId: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
  typing: boolean;
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

export interface WorkspaceActivity {
  id: string;
  userId: string;
  userName: string;
  type: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

interface UseCollaborationState {
  isConnected: boolean;
  activeUsers: CollaborationUser[];
  currentAISession?: string;
  aiSessionParticipants: AISessionParticipant[];
  currentWorkspace?: string;
  workspaceParticipants: string[];
  notifications: CollaborationNotification[];
  unreadCount: number;
  workspaceActivity: WorkspaceActivity[];
  typingUsers: Set<string>;
  userCursors: Map<string, { x: number; y: number; element?: string }>;
  isLoading: boolean;
  error: string | null;
}

export function useCollaboration() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const [state, setState] = useState<UseCollaborationState>({
    isConnected: false,
    activeUsers: [],
    aiSessionParticipants: [],
    workspaceParticipants: [],
    notifications: [],
    unreadCount: 0,
    workspaceActivity: [],
    typingUsers: new Set(),
    userCursors: new Map(),
    isLoading: false,
    error: null
  });

  /**
   * Initialize socket connection
   */
  const initializeSocket = useCallback(() => {
    if (!session?.user?.id || socketRef.current?.connected) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const socket = io(process.env.NODE_ENV === 'production' ? 
        process.env.NEXTAUTH_URL || '' : 'http://localhost:3000', {
        path: '/api/socket/io',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        setState(prev => ({ ...prev, isConnected: true, isLoading: false, error: null }));
        reconnectAttempts.current = 0;
        
        // Authenticate user
        socket.emit('authenticate', {
          userId: session.user.id,
          organizationId: session.user.organizationId
        });
      });

      socket.on('disconnect', (reason) => {
        setState(prev => ({ ...prev, isConnected: false }));
        console.warn('Collaboration socket disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        setState(prev => ({ ...prev, error: error.message, isLoading: false }));
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          toast.error('Unable to connect to collaboration service');
        }
      });

      // Authentication events
      socket.on('authenticated', (data) => {
        console.log('Collaboration authenticated:', data.user);
        toast.success('Connected to collaboration service');
      });

      socket.on('auth_error', (error) => {
        setState(prev => ({ ...prev, error: error.message }));
        toast.error(`Authentication failed: ${error.message}`);
      });

      // User presence events
      socket.on('active_users', (users: CollaborationUser[]) => {
        setState(prev => ({ ...prev, activeUsers: users }));
      });

      socket.on('presence_update', (update) => {
        setState(prev => ({
          ...prev,
          activeUsers: prev.activeUsers.map(user => 
            user.id === update.userId 
              ? { ...user, status: update.status, lastActivity: new Date(update.lastActivity) }
              : user
          )
        }));
      });

      // AI session events
      socket.on('ai_session_update', (update) => {
        handleAISessionUpdate(update);
      });

      socket.on('typing_indicator', (data) => {
        setState(prev => {
          const newTypingUsers = new Set(prev.typingUsers);
          if (data.typing) {
            newTypingUsers.add(data.userId);
          } else {
            newTypingUsers.delete(data.userId);
          }
          return { ...prev, typingUsers: newTypingUsers };
        });

        // Auto-clear typing indicator after 3 seconds
        if (data.typing) {
          setTimeout(() => {
            setState(prev => {
              const newTypingUsers = new Set(prev.typingUsers);
              newTypingUsers.delete(data.userId);
              return { ...prev, typingUsers: newTypingUsers };
            });
          }, 3000);
        }
      });

      // Workspace events
      socket.on('workspace_update', (update) => {
        handleWorkspaceUpdate(update);
      });

      socket.on('cursor_update', (data) => {
        setState(prev => {
          const newCursors = new Map(prev.userCursors);
          newCursors.set(data.userId, data.cursor);
          return { ...prev, userCursors: newCursors };
        });
      });

      // Notification events
      socket.on('notification', (notification: CollaborationNotification) => {
        setState(prev => ({
          ...prev,
          notifications: [notification, ...prev.notifications].slice(0, 50),
          unreadCount: prev.unreadCount + 1
        }));

        // Show toast for important notifications
        if (notification.type === 'mention') {
          toast.info(notification.title, {
            description: notification.message
          });
        }
      });

      socket.on('recent_notifications', (notifications: CollaborationNotification[]) => {
        setState(prev => ({
          ...prev,
          notifications,
          unreadCount: notifications.filter(n => !n.read).length
        }));
      });

      // Health check
      socket.on('pong', (data) => {
        console.log('Collaboration pong received:', data.timestamp);
      });

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Connection failed',
        isLoading: false 
      }));
      console.error('Error initializing collaboration socket:', error);
    }
  }, [session?.user?.id, session?.user?.organizationId]);

  /**
   * Handle AI session updates
   */
  const handleAISessionUpdate = useCallback((update: any) => {
    switch (update.type) {
      case 'user_joined':
        setState(prev => {
          const newParticipant: AISessionParticipant = {
            userId: update.userId,
            name: prev.activeUsers.find(u => u.id === update.userId)?.name || 'Unknown',
            joinedAt: new Date(update.timestamp),
            typing: false
          };
          return {
            ...prev,
            aiSessionParticipants: [...prev.aiSessionParticipants.filter(p => p.userId !== update.userId), newParticipant]
          };
        });
        break;

      case 'user_left':
        setState(prev => ({
          ...prev,
          aiSessionParticipants: prev.aiSessionParticipants.filter(p => p.userId !== update.userId)
        }));
        break;

      case 'message_added':
        // Handle message added (could trigger UI updates)
        break;

      case 'response_streaming':
        // Handle AI response streaming (could show live typing indicator)
        break;

      case 'task_executed':
        toast.success('AI task completed', {
          description: update.aiResponse?.content || 'Task execution finished'
        });
        break;
    }
  }, []);

  /**
   * Handle workspace updates
   */
  const handleWorkspaceUpdate = useCallback((update: any) => {
    switch (update.type) {
      case 'user_joined':
        setState(prev => ({
          ...prev,
          workspaceParticipants: [...prev.workspaceParticipants.filter(id => id !== update.userId), update.userId]
        }));
        break;

      case 'user_left':
        setState(prev => ({
          ...prev,
          workspaceParticipants: prev.workspaceParticipants.filter(id => id !== update.userId)
        }));
        break;

      case 'activity_update':
        const activity: WorkspaceActivity = {
          id: `activity_${Date.now()}`,
          userId: update.userId,
          userName: state.activeUsers.find(u => u.id === update.userId)?.name || 'Unknown',
          type: update.activity.type,
          description: update.activity.description,
          timestamp: new Date(update.timestamp),
          metadata: update.activity.metadata
        };

        setState(prev => ({
          ...prev,
          workspaceActivity: [activity, ...prev.workspaceActivity].slice(0, 20)
        }));
        break;
    }
  }, [state.activeUsers]);

  /**
   * Join AI session
   */
  const joinAISession = useCallback((sessionId: string) => {
    if (!socketRef.current || !session?.user?.id) return;

    socketRef.current.emit('join_ai_session', {
      sessionId,
      userId: session.user.id
    });

    setState(prev => ({ ...prev, currentAISession: sessionId }));
  }, [session?.user?.id]);

  /**
   * Leave AI session
   */
  const leaveAISession = useCallback(() => {
    if (!socketRef.current || !session?.user?.id || !state.currentAISession) return;

    socketRef.current.emit('leave_ai_session', {
      sessionId: state.currentAISession,
      userId: session.user.id
    });

    setState(prev => ({ 
      ...prev, 
      currentAISession: undefined,
      aiSessionParticipants: [],
      typingUsers: new Set()
    }));
  }, [session?.user?.id, state.currentAISession]);

  /**
   * Send AI message
   */
  const sendAIMessage = useCallback((sessionId: string, message: any) => {
    if (!socketRef.current) return;

    socketRef.current.emit('ai_message_sent', {
      sessionId,
      userId: session?.user?.id,
      message
    });
  }, [session?.user?.id]);

  /**
   * Share AI response with users
   */
  const shareAIResponse = useCallback((toUserIds: string[], aiResponse: any) => {
    if (!socketRef.current || !session?.user?.id || !state.currentAISession) return;

    socketRef.current.emit('share_ai_response', {
      fromUserId: session.user.id,
      toUserIds,
      aiResponse,
      sessionId: state.currentAISession
    });

    toast.success(`Shared AI response with ${toUserIds.length} user(s)`);
  }, [session?.user?.id, state.currentAISession]);

  /**
   * Join workspace
   */
  const joinWorkspace = useCallback((workspaceId: string) => {
    if (!socketRef.current || !session?.user?.id) return;

    socketRef.current.emit('join_workspace', {
      workspaceId,
      userId: session.user.id
    });

    setState(prev => ({ ...prev, currentWorkspace: workspaceId }));
  }, [session?.user?.id]);

  /**
   * Leave workspace
   */
  const leaveWorkspace = useCallback(() => {
    if (!socketRef.current || !session?.user?.id || !state.currentWorkspace) return;

    socketRef.current.emit('leave_workspace', {
      workspaceId: state.currentWorkspace,
      userId: session.user.id
    });

    setState(prev => ({ 
      ...prev, 
      currentWorkspace: undefined,
      workspaceParticipants: [],
      workspaceActivity: [],
      userCursors: new Map()
    }));
  }, [session?.user?.id, state.currentWorkspace]);

  /**
   * Send workspace activity
   */
  const sendWorkspaceActivity = useCallback((activity: { type: string; description: string; metadata?: any }) => {
    if (!socketRef.current || !state.currentWorkspace) return;

    socketRef.current.emit('workspace_activity', {
      workspaceId: state.currentWorkspace,
      userId: session?.user?.id,
      activity
    });
  }, [session?.user?.id, state.currentWorkspace]);

  /**
   * Update user presence
   */
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy', currentContext?: any) => {
    if (!socketRef.current || !session?.user?.id) return;

    socketRef.current.emit('presence_update', {
      userId: session.user.id,
      status,
      lastActivity: new Date(),
      currentContext
    });
  }, [session?.user?.id]);

  /**
   * Send cursor movement
   */
  const sendCursorMove = useCallback((cursor: { x: number; y: number; element?: string }) => {
    if (!socketRef.current || !state.currentWorkspace) return;

    socketRef.current.emit('cursor_move', {
      userId: session?.user?.id,
      workspaceId: state.currentWorkspace,
      cursor
    });
  }, [session?.user?.id, state.currentWorkspace]);

  /**
   * Start typing indicator
   */
  const startTyping = useCallback(() => {
    if (!socketRef.current || !state.currentAISession) return;

    socketRef.current.emit('typing_start', {
      sessionId: state.currentAISession,
      userId: session?.user?.id
    });
  }, [session?.user?.id, state.currentAISession]);

  /**
   * Stop typing indicator
   */
  const stopTyping = useCallback(() => {
    if (!socketRef.current || !state.currentAISession) return;

    socketRef.current.emit('typing_stop', {
      sessionId: state.currentAISession,
      userId: session?.user?.id
    });
  }, [session?.user?.id, state.currentAISession]);

  /**
   * Mention user in AI session
   */
  const mentionUser = useCallback((mentionedUserId: string, message: string) => {
    if (!socketRef.current || !state.currentAISession) return;

    socketRef.current.emit('mention_user', {
      sessionId: state.currentAISession,
      mentionedUserId,
      mentionedByUserId: session?.user?.id,
      message
    });
  }, [session?.user?.id, state.currentAISession]);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1)
    }));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0
    }));
  }, []);

  /**
   * Get online users in organization
   */
  const getOnlineUsers = useCallback(() => {
    return state.activeUsers.filter(user => user.status === 'online');
  }, [state.activeUsers]);

  /**
   * Get user by ID
   */
  const getUserById = useCallback((userId: string) => {
    return state.activeUsers.find(user => user.id === userId);
  }, [state.activeUsers]);

  /**
   * Send health check ping
   */
  const sendPing = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  }, []);

  // Initialize socket on mount
  useEffect(() => {
    if (session?.user?.id) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [session?.user?.id, initializeSocket]);

  // Health check interval
  useEffect(() => {
    const healthInterval = setInterval(() => {
      sendPing();
    }, 30000); // Every 30 seconds

    return () => clearInterval(healthInterval);
  }, [sendPing]);

  // Auto-update presence
  useEffect(() => {
    const presenceInterval = setInterval(() => {
      if (state.isConnected) {
        updatePresence('online', {
          page: window.location.pathname,
          workspace: state.currentWorkspace,
          aiSession: state.currentAISession
        });
      }
    }, 60000); // Every minute

    return () => clearInterval(presenceInterval);
  }, [state.isConnected, state.currentWorkspace, state.currentAISession, updatePresence]);

  return {
    // Connection state
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,

    // Users and presence
    activeUsers: state.activeUsers,
    onlineUsers: getOnlineUsers(),
    getUserById,

    // AI sessions
    currentAISession: state.currentAISession,
    aiSessionParticipants: state.aiSessionParticipants,
    typingUsers: Array.from(state.typingUsers),
    joinAISession,
    leaveAISession,
    sendAIMessage,
    shareAIResponse,
    startTyping,
    stopTyping,
    mentionUser,

    // Workspaces
    currentWorkspace: state.currentWorkspace,
    workspaceParticipants: state.workspaceParticipants,
    workspaceActivity: state.workspaceActivity,
    userCursors: state.userCursors,
    joinWorkspace,
    leaveWorkspace,
    sendWorkspaceActivity,
    sendCursorMove,

    // Notifications
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    markNotificationAsRead,
    clearAllNotifications,

    // Presence
    updatePresence,

    // Utilities
    sendPing
  };
}

export default useCollaboration;