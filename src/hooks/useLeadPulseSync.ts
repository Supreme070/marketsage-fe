/**
 * Enhanced LeadPulse Data Hook - Simplified Version
 * 
 * This version eliminates infinite loops and complex state synchronization
 * while maintaining the same interface for backwards compatibility.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getVisitorLocations,
  getVisitorJourneys,
  getInsights,
  getAnalyticsOverview,
  getCurrentDataSource,
  isDemoModeActive
} from '@/lib/leadpulse/unifiedDataProvider';
import type { VisitorLocation, VisitorJourney, InsightItem } from '@/lib/leadpulse/dataProvider';
import { logger } from '@/lib/logger';

interface UseLeadPulseSyncOptions {
  timeRange?: string;
  refreshInterval?: number;
  fallbackToDemo?: boolean;
  enableRealtime?: boolean;
  syncStrategy?: 'priority_based' | 'latest_wins' | 'merge';
  staleThreshold?: number;
}

interface LeadPulseSyncData {
  visitorLocations: VisitorLocation[];
  visitorJourneys: VisitorJourney[];
  insights: InsightItem[];
  analyticsOverview: any;
  isLoading: boolean;
  error: string | null;
  dataSource: 'demo' | 'production' | 'simulation' | 'fallback';
  isDemoMode: boolean;
  lastUpdated: Date | null;
  isStale: boolean;
  syncStats: {
    totalKeys: number;
    staleKeys: number;
    pendingUpdates: number;
    conflicts: number;
  };
}

/**
 * Simplified hook that eliminates race conditions and infinite loops
 */
export function useLeadPulseSync(options: UseLeadPulseSyncOptions = {}): LeadPulseSyncData {
  const {
    timeRange = '24h',
    refreshInterval = 60000, // Increased for better performance
    fallbackToDemo = true,
    enableRealtime = false, // Disabled by default for stability
    syncStrategy = 'latest_wins',
    staleThreshold = 30000
  } = options;

  const [data, setData] = useState<LeadPulseSyncData>({
    visitorLocations: [],
    visitorJourneys: [],
    insights: [],
    analyticsOverview: null,
    isLoading: true,
    error: null,
    dataSource: 'fallback',
    isDemoMode: false,
    lastUpdated: null,
    isStale: false,
    syncStats: {
      totalKeys: 0,
      staleKeys: 0,
      pendingUpdates: 0,
      conflicts: 0
    }
  });

  // Use refs to prevent unnecessary re-renders
  const isMountedRef = useRef(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);

  // Stable fetch function that doesn't change on every render
  const fetchData = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;
    
    // Prevent too frequent fetches
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const [
        visitorLocations,
        visitorJourneys,
        insights,
        analyticsOverview,
        dataSource
      ] = await Promise.all([
        getVisitorLocations(timeRange, { fallbackToDemo }).catch(() => []),
        getVisitorJourneys(timeRange, { fallbackToDemo }).catch(() => []),
        getInsights(timeRange, { fallbackToDemo }).catch(() => []),
        getAnalyticsOverview(timeRange, { fallbackToDemo }).catch(() => null),
        getCurrentDataSource().catch(() => 'fallback')
      ]);

      if (isMountedRef.current) {
        setData(prev => ({
          ...prev,
          visitorLocations,
          visitorJourneys,
          insights,
          analyticsOverview,
          isLoading: false,
          error: null,
          dataSource,
          isDemoMode: isDemoModeActive(),
          lastUpdated: new Date(),
          isStale: false,
          syncStats: {
            totalKeys: 4,
            staleKeys: 0,
            pendingUpdates: 0,
            conflicts: 0
          }
        }));
      }

    } catch (error) {
      logger.error('Error fetching LeadPulse data:', error);
      if (isMountedRef.current) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data'
        }));
      }
    }
  }, [timeRange, fallbackToDemo]);

  // Initial data fetch
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Setup refresh interval with proper cleanup - Fixed recursive scheduling
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        if (isMountedRef.current) {
          fetchData();
        }
      }, refreshInterval);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [refreshInterval]); // Removed fetchData from dependencies

  // Real-time WebSocket connection (optional and simplified)
  useEffect(() => {
    if (!enableRealtime) return;

    let webSocket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/api/socket/leadpulse`;
        
        webSocket = new WebSocket(wsUrl);

        webSocket.onopen = () => {
          logger.info('LeadPulse WebSocket connected');
          // Simple subscription without complex logic
          webSocket?.send(JSON.stringify({
            type: 'subscribe',
            timeRange
          }));
        };

        webSocket.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            if (update.type === 'leadpulse_update' && isMountedRef.current) {
              // Simple update without complex synchronization
              setData(prev => ({
                ...prev,
                ...update.data,
                lastUpdated: new Date()
              }));
            }
          } catch (error) {
            logger.error('Error processing WebSocket message:', error);
          }
        };

        webSocket.onerror = (error) => {
          logger.error('WebSocket error:', error);
        };

        webSocket.onclose = () => {
          logger.info('WebSocket disconnected');
          // Simple reconnection logic
          if (isMountedRef.current) {
            reconnectTimeout = setTimeout(connectWebSocket, 5000);
          }
        };

      } catch (error) {
        logger.error('Failed to setup WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (webSocket) {
        webSocket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [enableRealtime, timeRange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return data;
}

/**
 * Simplified location-specific hook
 */
export function useLeadPulseLocationSync(options: UseLeadPulseSyncOptions = {}) {
  const { timeRange = '24h', fallbackToDemo = true } = options;
  
  const [state, setState] = useState({
    locations: [] as VisitorLocation[],
    isLoading: true,
    error: null as string | null,
    dataSource: 'fallback' as any,
    lastUpdated: null as Date | null,
    isStale: false
  });

  const isMountedRef = useRef(true);

  const fetchLocations = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const locations = await getVisitorLocations(timeRange, { fallbackToDemo });
      const dataSource = await getCurrentDataSource();
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          locations,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
          isStale: false,
          dataSource
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch locations'
        }));
      }
    }
  }, [timeRange, fallbackToDemo]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return state;
}

export default {
  useLeadPulseSync,
  useLeadPulseLocationSync
};