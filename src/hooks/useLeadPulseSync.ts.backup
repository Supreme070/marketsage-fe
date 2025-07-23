/**
 * Enhanced LeadPulse Data Hook with State Synchronization
 * 
 * Prevents race conditions between real-time WebSocket updates and API polling
 * by using the state synchronization manager.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { stateSynchronizationManager } from '@/lib/leadpulse/state-synchronization-manager';
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
 * Enhanced hook with state synchronization to prevent race conditions
 */
export function useLeadPulseSync(options: UseLeadPulseSyncOptions = {}): LeadPulseSyncData {
  const {
    timeRange = '24h',
    refreshInterval = 30000,
    fallbackToDemo = true,
    enableRealtime = true,
    syncStrategy = 'priority_based',
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

  const subscriberId = useRef(`leadpulse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const webSocketRef = useRef<WebSocket | null>(null);
  const isUnmountedRef = useRef(false);

  // Data keys for synchronization
  const dataKeys = {
    visitorLocations: `visitor-locations-${timeRange}`,
    visitorJourneys: `visitor-journeys-${timeRange}`,
    insights: `insights-${timeRange}`,
    analyticsOverview: `analytics-overview-${timeRange}`
  };

  // Initialize synchronization manager
  useEffect(() => {
    const syncManager = stateSynchronizationManager;
    
    // Register data keys with conflict resolution strategies
    Object.values(dataKeys).forEach(key => {
      syncManager.registerDataKey(key, {
        strategy: syncStrategy,
        resolver: syncStrategy === 'merge' ? (existing, incoming) => {
          // Custom merge logic for different data types
          if (Array.isArray(existing) && Array.isArray(incoming)) {
            // For arrays, merge unique items by id
            const existingIds = new Set(existing.map(item => item.id));
            const newItems = incoming.filter(item => !existingIds.has(item.id));
            return [...existing, ...newItems];
          }
          return { ...existing, ...incoming };
        } : undefined
      });
    });

    // Subscribe to data updates
    const handleDataUpdate = (key: string) => (syncData: any) => {
      if (isUnmountedRef.current) return;
      
      setData(prevData => {
        const updates: Partial<LeadPulseSyncData> = {
          lastUpdated: syncData.lastUpdated,
          isStale: syncData.isStale,
          dataSource: syncData.source?.type || prevData.dataSource,
          syncStats: syncManager.getStats()
        };

        // Update specific data based on key
        if (key === dataKeys.visitorLocations) {
          updates.visitorLocations = syncData.data || [];
        } else if (key === dataKeys.visitorJourneys) {
          updates.visitorJourneys = syncData.data || [];
        } else if (key === dataKeys.insights) {
          updates.insights = syncData.data || [];
        } else if (key === dataKeys.analyticsOverview) {
          updates.analyticsOverview = syncData.data;
        }

        return { ...prevData, ...updates };
      });
    };

    // Subscribe to all data keys
    Object.entries(dataKeys).forEach(([dataType, key]) => {
      syncManager.subscribe(key, subscriberId.current);
      syncManager.on(`data_${key}`, handleDataUpdate(key));
    });

    // Listen for conflict notifications
    syncManager.on('conflict_detected', (conflictData) => {
      logger.warn('Data conflict detected:', conflictData);
      setData(prev => ({
        ...prev,
        error: `Data conflict detected for ${conflictData.key}. Using latest available data.`
      }));
    });

    return () => {
      // Cleanup subscriptions
      Object.values(dataKeys).forEach(key => {
        syncManager.unsubscribe(key, subscriberId.current);
        syncManager.removeAllListeners(`data_${key}`);
      });
      syncManager.removeAllListeners('conflict_detected');
    };
  }, [timeRange, syncStrategy]);

  // Fetch data from API with synchronization
  const fetchData = useCallback(async (force = false) => {
    if (isUnmountedRef.current) return;
    
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const syncManager = stateSynchronizationManager;
      const apiSource = syncManager.createDataSource('api');

      // Check if we need to fetch (not stale or forced)
      const needsFetch = force || Object.values(dataKeys).some(key => 
        syncManager.isDataStale(key)
      );

      if (!needsFetch) {
        // Use cached data
        const cachedData = {
          visitorLocations: syncManager.getData(dataKeys.visitorLocations)?.data || [],
          visitorJourneys: syncManager.getData(dataKeys.visitorJourneys)?.data || [],
          insights: syncManager.getData(dataKeys.insights)?.data || [],
          analyticsOverview: syncManager.getData(dataKeys.analyticsOverview)?.data || null
        };

        setData(prev => ({
          ...prev,
          ...cachedData,
          isLoading: false,
          syncStats: syncManager.getStats()
        }));
        return;
      }

      // Fetch fresh data
      const [
        visitorLocations,
        visitorJourneys,
        insights,
        analyticsOverview,
        dataSource
      ] = await Promise.all([
        getVisitorLocations(timeRange, { fallbackToDemo }),
        getVisitorJourneys(timeRange, { fallbackToDemo }),
        getInsights(timeRange, { fallbackToDemo }),
        getAnalyticsOverview(timeRange, { fallbackToDemo }),
        getCurrentDataSource()
      ]);

      // Update synchronized data
      await Promise.all([
        syncManager.updateData({
          key: dataKeys.visitorLocations,
          data: visitorLocations,
          source: apiSource,
          mergeStrategy: 'replace'
        }),
        syncManager.updateData({
          key: dataKeys.visitorJourneys,
          data: visitorJourneys,
          source: apiSource,
          mergeStrategy: 'replace'
        }),
        syncManager.updateData({
          key: dataKeys.insights,
          data: insights,
          source: apiSource,
          mergeStrategy: 'replace'
        }),
        syncManager.updateData({
          key: dataKeys.analyticsOverview,
          data: analyticsOverview,
          source: apiSource,
          mergeStrategy: 'replace'
        })
      ]);

      if (!isUnmountedRef.current) {
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
          syncStats: syncManager.getStats()
        }));
      }

    } catch (error) {
      logger.error('Error fetching LeadPulse data:', error);
      if (!isUnmountedRef.current) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data'
        }));
      }
    }
  }, [timeRange, fallbackToDemo, dataKeys]);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!enableRealtime) return;

    const setupWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/socket/leadpulse`;
        
        webSocketRef.current = new WebSocket(wsUrl);

        webSocketRef.current.onopen = () => {
          logger.info('LeadPulse WebSocket connected');
          // Subscribe to real-time updates
          webSocketRef.current?.send(JSON.stringify({
            type: 'subscribe',
            data: { dataType: 'leadpulse', timeRange }
          }));
        };

        webSocketRef.current.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            if (update.type === 'leadpulse_update') {
              handleRealtimeUpdate(update.data);
            }
          } catch (error) {
            logger.error('Error processing WebSocket message:', error);
          }
        };

        webSocketRef.current.onerror = (error) => {
          logger.error('WebSocket error:', error);
        };

        webSocketRef.current.onclose = () => {
          logger.info('WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (!isUnmountedRef.current) {
              setupWebSocket();
            }
          }, 5000);
        };

      } catch (error) {
        logger.error('Failed to setup WebSocket:', error);
      }
    };

    setupWebSocket();

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [enableRealtime, timeRange]);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((update: any) => {
    if (isUnmountedRef.current) return;

    const syncManager = stateSynchronizationManager;
    const realtimeSource = syncManager.createDataSource('realtime');

    // Queue the update to prevent race conditions
    if (update.visitorLocations) {
      syncManager.queueUpdate({
        key: dataKeys.visitorLocations,
        data: update.visitorLocations,
        source: realtimeSource,
        mergeStrategy: 'merge'
      });
    }

    if (update.visitorJourneys) {
      syncManager.queueUpdate({
        key: dataKeys.visitorJourneys,
        data: update.visitorJourneys,
        source: realtimeSource,
        mergeStrategy: 'append'
      });
    }

    if (update.insights) {
      syncManager.queueUpdate({
        key: dataKeys.insights,
        data: update.insights,
        source: realtimeSource,
        mergeStrategy: 'replace'
      });
    }

    if (update.analyticsOverview) {
      syncManager.queueUpdate({
        key: dataKeys.analyticsOverview,
        data: update.analyticsOverview,
        source: realtimeSource,
        mergeStrategy: 'merge'
      });
    }
  }, [dataKeys]);

  // Initial data fetch
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Setup refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const scheduleRefresh = () => {
        refreshTimeoutRef.current = setTimeout(() => {
          fetchData();
          scheduleRefresh();
        }, refreshInterval);
      };

      scheduleRefresh();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return data;
}

/**
 * Hook for specific data types with synchronization
 */
export function useLeadPulseLocationSync(options: UseLeadPulseSyncOptions = {}) {
  const { timeRange = '24h', refreshInterval = 30000, fallbackToDemo = true } = options;
  
  const [state, setState] = useState({
    locations: [] as VisitorLocation[],
    isLoading: true,
    error: null as string | null,
    dataSource: 'fallback' as any,
    lastUpdated: null as Date | null,
    isStale: false
  });

  const subscriberId = useRef(`locations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const dataKey = `visitor-locations-${timeRange}`;

  useEffect(() => {
    const syncManager = stateSynchronizationManager;
    
    // Register data key
    syncManager.registerDataKey(dataKey, {
      strategy: 'priority_based'
    });

    // Subscribe to updates
    const handleUpdate = (syncData: any) => {
      setState(prev => ({
        ...prev,
        locations: syncData.data || [],
        isLoading: false,
        error: null,
        lastUpdated: syncData.lastUpdated,
        isStale: syncData.isStale,
        dataSource: syncData.source?.type || prev.dataSource
      }));
    };

    syncManager.subscribe(dataKey, subscriberId.current);
    syncManager.on(`data_${dataKey}`, handleUpdate);

    // Initial fetch
    const fetchLocations = async () => {
      try {
        const locations = await getVisitorLocations(timeRange, { fallbackToDemo });
        const source = syncManager.createDataSource('api');
        
        await syncManager.updateData({
          key: dataKey,
          data: locations,
          source,
          mergeStrategy: 'replace'
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch locations'
        }));
      }
    };

    fetchLocations();

    return () => {
      syncManager.unsubscribe(dataKey, subscriberId.current);
      syncManager.removeAllListeners(`data_${dataKey}`);
    };
  }, [timeRange, fallbackToDemo, dataKey]);

  return state;
}

export default {
  useLeadPulseSync,
  useLeadPulseLocationSync
};