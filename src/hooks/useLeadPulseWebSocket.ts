/**
 * LeadPulse WebSocket Hook
 * 
 * Provides real-time visitor updates through WebSocket connections
 * with automatic fallback to MCP polling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { leadPulseWebSocketService } from '@/lib/websocket/leadpulse-websocket-service';
import type { MCPAuthContext } from '@/mcp/types/mcp-types';
import type { VisitorLocation, VisitorJourney, InsightItem } from '@/lib/leadpulse/dataProvider';

interface UseLeadPulseWebSocketOptions {
  timeRange?: string;
  includeLocation?: boolean;
  includeDevice?: boolean;
  maxVisitors?: number;
  updateInterval?: number;
  autoConnect?: boolean;
  enableFallback?: boolean;
}

interface LeadPulseWebSocketData {
  visitorLocations: VisitorLocation[];
  visitorJourneys: VisitorJourney[];
  insights: InsightItem[];
  analyticsOverview: {
    activeVisitors: number;
    totalVisitors: number;
    conversionRate: number;
    engagementScore: number;
    bounceRate: number;
    averageSessionTime: number;
  };
  connectionStatus: {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
    lastUpdateTime: number;
    dataSource: 'websocket' | 'mcp' | 'fallback';
  };
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Hook for real-time LeadPulse data through WebSocket
 */
export function useLeadPulseWebSocket(options: UseLeadPulseWebSocketOptions = {}): LeadPulseWebSocketData {
  const { data: session } = useSession();
  const {
    timeRange = '24h',
    includeLocation = true,
    includeDevice = true,
    maxVisitors = 50,
    updateInterval = 60000, // Increased for better performance
    autoConnect = false, // Disabled by default for performance
    enableFallback = true
  } = options;

  // State
  const [data, setData] = useState<LeadPulseWebSocketData>({
    visitorLocations: [],
    visitorJourneys: [],
    insights: [],
    analyticsOverview: {
      activeVisitors: 0,
      totalVisitors: 0,
      conversionRate: 0,
      engagementScore: 0,
      bounceRate: 0,
      averageSessionTime: 0
    },
    connectionStatus: {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      lastUpdateTime: 0,
      dataSource: 'fallback'
    },
    error: null,
    lastUpdated: null
  });

  // Refs
  const isMountedRef = useRef(true);
  const lastUpdateRef = useRef<number>(0);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  // Create auth context from session
  const createAuthContext = useCallback((): MCPAuthContext | undefined => {
    if (!session?.user) return undefined;
    
    return {
      userId: (session.user as any).id || '',
      organizationId: (session.user as any).organizationId || '',
      permissions: ['read:org', 'read:leadpulse'],
      role: (session.user as any).role || 'user'
    };
  }, [session]);

  // Handle WebSocket data updates
  const handleDataUpdate = useCallback((wsData: any) => {
    if (!isMountedRef.current) return;

    const now = Date.now();
    // Prevent too frequent updates - Increased threshold
    if (now - lastUpdateRef.current < 3000) return;
    lastUpdateRef.current = now;

    setData(prev => {
      const newData = { ...prev };
      
      switch (wsData.type) {
        case 'visitor_update':
          if (wsData.data.locations) {
            newData.visitorLocations = wsData.data.locations;
          }
          if (wsData.data.journeys) {
            newData.visitorJourneys = wsData.data.journeys;
          }
          if (wsData.data.analytics) {
            newData.analyticsOverview = { ...newData.analyticsOverview, ...wsData.data.analytics };
          }
          break;
          
        case 'analytics_update':
          if (wsData.data.overview) {
            newData.analyticsOverview = { ...newData.analyticsOverview, ...wsData.data.overview };
          }
          if (wsData.data.insights) {
            newData.insights = wsData.data.insights;
          }
          break;
          
        case 'new_visitor':
          if (wsData.data.journey) {
            newData.visitorJourneys = [wsData.data.journey, ...newData.visitorJourneys.slice(0, maxVisitors - 1)];
          }
          if (wsData.data.location) {
            const existingIndex = newData.visitorLocations.findIndex(loc => loc.id === wsData.data.location.id);
            if (existingIndex >= 0) {
              newData.visitorLocations[existingIndex] = wsData.data.location;
            } else {
              newData.visitorLocations = [wsData.data.location, ...newData.visitorLocations];
            }
          }
          break;
          
        case 'visitor_offline':
          if (wsData.data.visitorId) {
            newData.visitorJourneys = newData.visitorJourneys.filter(j => j.id !== wsData.data.visitorId);
          }
          break;
          
        case 'touchpoint_added':
          if (wsData.data.visitorId && wsData.data.touchpoint) {
            const journeyIndex = newData.visitorJourneys.findIndex(j => j.id === wsData.data.visitorId);
            if (journeyIndex >= 0) {
              newData.visitorJourneys[journeyIndex].pulseData.push(wsData.data.touchpoint);
            }
          }
          break;
      }
      
      newData.connectionStatus.dataSource = wsData.source === 'websocket' ? 'websocket' : 'mcp';
      newData.lastUpdated = new Date();
      newData.error = null;
      
      return newData;
    });
  }, [maxVisitors]);

  // Handle connection status updates
  const handleConnectionStatus = useCallback(() => {
    if (!isMountedRef.current) return;

    const status = leadPulseWebSocketService.getStatus();
    
    setData(prev => ({
      ...prev,
      connectionStatus: {
        ...prev.connectionStatus,
        isConnected: status.isConnected,
        isConnecting: status.isConnecting,
        reconnectAttempts: status.reconnectAttempts,
        lastUpdateTime: status.lastUpdateTime
      }
    }));
  }, []);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    if (!isMountedRef.current) return;

    setData(prev => ({
      ...prev,
      error: error.message,
      connectionStatus: {
        ...prev.connectionStatus,
        dataSource: 'fallback'
      }
    }));
  }, []);

  // Setup WebSocket connection and event listeners - Optimized dependencies
  useEffect(() => {
    if (!autoConnect) return;

    const authContext = createAuthContext();
    if (authContext) {
      leadPulseWebSocketService.setAuthContext(authContext);
    }

    // Event listeners
    leadPulseWebSocketService.on('data', handleDataUpdate);
    leadPulseWebSocketService.on('connected', handleConnectionStatus);
    leadPulseWebSocketService.on('disconnected', handleConnectionStatus);
    leadPulseWebSocketService.on('error', handleError);

    // Connect if not already connected
    if (!leadPulseWebSocketService.getStatus().isConnected) {
      leadPulseWebSocketService.connect();
    }

    return () => {
      leadPulseWebSocketService.off('data', handleDataUpdate);
      leadPulseWebSocketService.off('connected', handleConnectionStatus);
      leadPulseWebSocketService.off('disconnected', handleConnectionStatus);
      leadPulseWebSocketService.off('error', handleError);
    };
  }, [autoConnect]); // Removed function dependencies to prevent re-connection loops

  // Subscribe to data types
  useEffect(() => {
    const subscriptions = ['visitor_locations', 'visitor_journeys', 'insights'];
    const subscriptionOptions = {
      timeRange,
      includeLocation,
      includeDevice,
      maxVisitors,
      updateInterval
    };

    subscriptions.forEach(subscription => {
      if (!subscriptionsRef.current.has(subscription)) {
        leadPulseWebSocketService.subscribe(subscription, subscriptionOptions);
        subscriptionsRef.current.add(subscription);
      }
    });

    return () => {
      subscriptions.forEach(subscription => {
        if (subscriptionsRef.current.has(subscription)) {
          leadPulseWebSocketService.unsubscribe(subscription);
          subscriptionsRef.current.delete(subscription);
        }
      });
    };
  }, [timeRange, includeLocation, includeDevice, maxVisitors, updateInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up subscriptions
      subscriptionsRef.current.forEach(subscription => {
        leadPulseWebSocketService.unsubscribe(subscription);
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  return data;
}

/**
 * Hook for connection status only
 */
export function useLeadPulseWebSocketStatus() {
  const [status, setStatus] = useState(leadPulseWebSocketService.getStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(leadPulseWebSocketService.getStatus());
    };

    leadPulseWebSocketService.on('connected', updateStatus);
    leadPulseWebSocketService.on('disconnected', updateStatus);
    leadPulseWebSocketService.on('error', updateStatus);

    // Initial status update
    updateStatus();

    return () => {
      leadPulseWebSocketService.off('connected', updateStatus);
      leadPulseWebSocketService.off('disconnected', updateStatus);
      leadPulseWebSocketService.off('error', updateStatus);
    };
  }, []);

  return status;
}

export default useLeadPulseWebSocket;