/**
 * React Hook for LeadPulse Real-time Data
 * 
 * Provides real-time updates for LeadPulse dashboard components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

interface VisitorUpdate {
  id: string;
  type: 'new_visitor' | 'visitor_update' | 'visitor_offline' | 'touchpoint_added';
  visitor: any;
  touchpoint?: any;
  timestamp: Date;
}

interface AnalyticsUpdate {
  totalVisitors: number;
  activeVisitors: number;
  conversionRate: number;
  topCountries: Array<{ country: string; count: number }>;
  recentActivity: any[];
}

interface UseLeadPulseRealtimeOptions {
  autoConnect?: boolean;
  subscriptions?: string[];
}

export function useLeadPulseRealtime(options: UseLeadPulseRealtimeOptions = {}) {
  const { autoConnect = true, subscriptions = [] } = options;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time data states
  const [analytics, setAnalytics] = useState<AnalyticsUpdate | null>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socket?.connected) return;

    try {
      const newSocket = io(process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SOCKET_URL || ''
        : 'http://localhost:3000', {
        path: '/api/socket/io',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      newSocket.on('connect', () => {
        logger.info('LeadPulse realtime connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Subscribe to requested data types
        subscriptions.forEach(subscription => {
          newSocket.emit('subscribe', subscription);
        });
      });

      newSocket.on('disconnect', (reason) => {
        logger.warn('LeadPulse realtime disconnected:', reason);
        setIsConnected(false);
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // Don't auto-reconnect for intentional disconnects
          return;
        }
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, Math.pow(2, reconnectAttempts.current) * 1000); // Exponential backoff
        }
      });

      newSocket.on('connect_error', (error) => {
        logger.error('LeadPulse realtime connection error:', error);
        setError('Connection failed. Retrying...');
        setIsConnected(false);
      });

      // LeadPulse event handlers
      newSocket.on('analytics_update', (data: AnalyticsUpdate) => {
        setAnalytics(data);
        setRecentActivity(data.recentActivity);
      });

      newSocket.on('recent_visitors', (data: any[]) => {
        setVisitors(data);
      });

      newSocket.on('active_visitors', (data: any[]) => {
        setActiveVisitors(data);
      });

      newSocket.on('new_visitor', (visitor: any) => {
        setVisitors(prev => [visitor, ...prev.slice(0, 19)]); // Keep last 20
        if (visitor.isActive) {
          setActiveVisitors(prev => [visitor, ...prev]);
        }
      });

      newSocket.on('visitor_update', (update: VisitorUpdate) => {
        switch (update.type) {
          case 'new_visitor':
            // Already handled by new_visitor event
            break;
          case 'touchpoint_added':
            setRecentActivity(prev => [
              { ...update.touchpoint, visitor: update.visitor },
              ...prev.slice(0, 9)
            ]);
            break;
          case 'visitor_offline':
            setActiveVisitors(prev => 
              prev.filter(v => v.id !== update.id)
            );
            break;
        }
      });

      newSocket.on('visitor_offline', ({ visitorId }: { visitorId: string }) => {
        setActiveVisitors(prev => prev.filter(v => v.id !== visitorId));
      });

      // Heartbeat
      const pingInterval = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit('ping');
        }
      }, 30000);

      newSocket.on('pong', ({ timestamp }: { timestamp: string }) => {
        // Connection is healthy
      });

      // Cleanup interval on disconnect
      newSocket.on('disconnect', () => {
        clearInterval(pingInterval);
      });

      setSocket(newSocket);
    } catch (error) {
      logger.error('Error initializing socket:', error);
      setError('Failed to initialize connection');
    }
  }, [socket, subscriptions]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Subscribe to additional data types
  const subscribe = useCallback((dataType: string) => {
    if (socket?.connected) {
      socket.emit('subscribe', dataType);
    }
  }, [socket]);

  // Unsubscribe from data types
  const unsubscribe = useCallback((dataType: string) => {
    if (socket?.connected) {
      socket.emit('unsubscribe', dataType);
    }
  }, [socket]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return {
    // Connection state
    isConnected,
    error,
    socket,
    
    // Connection methods
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    
    // Real-time data
    analytics,
    visitors,
    activeVisitors,
    recentActivity,
    
    // Computed values
    connectionStatus: isConnected ? 'connected' : error ? 'error' : 'connecting'
  };
}