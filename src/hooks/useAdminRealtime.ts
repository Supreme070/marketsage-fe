/**
 * Admin Realtime Hook
 * ===================
 * 
 * React hook for connecting admin components to real-time updates
 */

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAdmin } from '@/components/admin/AdminProvider';
import { AdminEventType } from '@/lib/websocket/admin-realtime-service';

interface AdminRealtimeData {
  timestamp: string;
  type: AdminEventType;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  adminOnly: boolean;
}

interface UseAdminRealtimeOptions {
  channels?: string[];
  autoConnect?: boolean;
}

interface UseAdminRealtimeReturn {
  isConnected: boolean;
  lastUpdate: AdminRealtimeData | null;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  disconnect: () => void;
}

export function useAdminRealtime(options: UseAdminRealtimeOptions = {}): UseAdminRealtimeReturn {
  const { channels = [], autoConnect = true } = options;
  const { user, staffRole, permissions } = useAdmin();
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<AdminRealtimeData | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect || !user || !staffRole) return;

    // Initialize socket connection to admin namespace
    const socket = io('/admin', {
      path: '/api/socket/io',
      auth: {
        userId: user.id,
        staffRole: staffRole
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Admin realtime connected');
      
      // Subscribe to initial channels
      if (channels.length > 0) {
        socket.emit('admin:subscribe', channels);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Admin realtime disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Admin realtime connection error:', error);
      setIsConnected(false);
    });

    // Listen to all admin events
    Object.values(AdminEventType).forEach(eventType => {
      socket.on(eventType, (data: AdminRealtimeData) => {
        setLastUpdate(data);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, staffRole, autoConnect]);

  // Subscribe to channels
  const subscribe = (newChannels: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('admin:subscribe', newChannels);
    }
  };

  // Unsubscribe from channels
  const unsubscribe = (channelsToRemove: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('admin:unsubscribe', channelsToRemove);
    }
  };

  // Disconnect socket
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  return {
    isConnected,
    lastUpdate,
    subscribe,
    unsubscribe,
    disconnect
  };
}

/**
 * Hook specifically for system health updates
 */
export function useSystemHealthRealtime() {
  const { lastUpdate, isConnected, subscribe, unsubscribe } = useAdminRealtime({
    channels: ['system:overview', 'system:metrics'],
    autoConnect: true
  });

  const [systemData, setSystemData] = useState<any>(null);

  useEffect(() => {
    if (lastUpdate?.type === AdminEventType.SYSTEM_METRICS_UPDATE) {
      setSystemData(lastUpdate.data);
    }
  }, [lastUpdate]);

  return {
    isConnected,
    systemData,
    subscribe,
    unsubscribe
  };
}

/**
 * Hook specifically for security events
 */
export function useSecurityRealtime() {
  const { lastUpdate, isConnected, subscribe, unsubscribe } = useAdminRealtime({
    channels: ['security:events', 'security:threats'],
    autoConnect: true
  });

  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (lastUpdate?.type === AdminEventType.SECURITY_EVENT_CREATED) {
      setSecurityEvents(prev => [lastUpdate.data, ...prev.slice(0, 49)]); // Keep last 50
    }
    
    if (lastUpdate?.type === AdminEventType.THREAT_DETECTED && lastUpdate.priority === 'critical') {
      setCriticalAlerts(prev => [lastUpdate.data, ...prev.slice(0, 9)]); // Keep last 10
    }
  }, [lastUpdate]);

  return {
    isConnected,
    securityEvents,
    criticalAlerts,
    subscribe,
    unsubscribe
  };
}

/**
 * Hook specifically for user activity updates
 */
export function useUserActivityRealtime() {
  const { lastUpdate, isConnected, subscribe, unsubscribe } = useAdminRealtime({
    channels: ['users:activity', 'users:status'],
    autoConnect: true
  });

  const [userActivity, setUserActivity] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    if (lastUpdate?.type === AdminEventType.USER_ACTIVITY_UPDATE) {
      setUserActivity(lastUpdate.data);
    }
    
    if (lastUpdate?.type === AdminEventType.NEW_USER_REGISTERED) {
      setRecentUsers(prev => [lastUpdate.data, ...prev.slice(0, 19)]); // Keep last 20
    }
  }, [lastUpdate]);

  return {
    isConnected,
    userActivity,
    recentUsers,
    subscribe,
    unsubscribe
  };
}