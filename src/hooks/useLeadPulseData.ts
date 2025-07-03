/**
 * React Hook for LeadPulse Data
 * 
 * Provides consistent data across all LeadPulse components with automatic
 * fallback to demo data when needed.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getVisitorLocations,
  getVisitorJourneys,
  getInsights,
  getAnalyticsOverview,
  getCurrentDataSource,
  isDemoModeActive
} from '@/lib/leadpulse/unifiedDataProvider';
import type { VisitorLocation, VisitorJourney, InsightItem } from '@/lib/leadpulse/dataProvider';

interface UseLeadPulseDataOptions {
  timeRange?: string;
  refreshInterval?: number; // in milliseconds
  fallbackToDemo?: boolean;
}

interface LeadPulseData {
  visitorLocations: VisitorLocation[];
  visitorJourneys: VisitorJourney[];
  insights: InsightItem[];
  analyticsOverview: any;
  isLoading: boolean;
  error: string | null;
  dataSource: 'demo' | 'production' | 'simulation' | 'fallback';
  isDemoMode: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook to fetch all LeadPulse data with consistent refresh intervals
 */
export function useLeadPulseData(options: UseLeadPulseDataOptions = {}): LeadPulseData {
  const {
    timeRange = '24h',
    refreshInterval = 30000, // 30 seconds instead of 3 seconds for better performance
    fallbackToDemo = true
  } = options;

  const [data, setData] = useState<LeadPulseData>({
    visitorLocations: [],
    visitorJourneys: [],
    insights: [],
    analyticsOverview: null,
    isLoading: true,
    error: null,
    dataSource: 'fallback',
    isDemoMode: false,
    lastUpdated: null
  });

  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

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

      setData({
        visitorLocations,
        visitorJourneys,
        insights,
        analyticsOverview,
        isLoading: false,
        error: null,
        dataSource,
        isDemoMode: isDemoModeActive(),
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching LeadPulse data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      }));
    }
  }, [timeRange, fallbackToDemo]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return data;
}

/**
 * Hook specifically for visitor locations (most commonly used)
 */
export function useVisitorLocations(options: UseLeadPulseDataOptions = {}) {
  const { timeRange = '24h', refreshInterval = 30000, fallbackToDemo = true } = options;
  
  const [state, setState] = useState({
    locations: [] as VisitorLocation[],
    isLoading: true,
    error: null as string | null,
    dataSource: 'fallback' as any,
    lastUpdated: null as Date | null
  });

  const fetchLocations = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [locations, dataSource] = await Promise.all([
        getVisitorLocations(timeRange, { fallbackToDemo }),
        getCurrentDataSource()
      ]);

      setState({
        locations,
        isLoading: false,
        error: null,
        dataSource,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching visitor locations:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch locations'
      }));
    }
  }, [timeRange, fallbackToDemo]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchLocations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchLocations, refreshInterval]);

  return state;
}

/**
 * Hook for analytics overview data
 */
export function useAnalyticsOverview(options: UseLeadPulseDataOptions = {}) {
  const { timeRange = '24h', refreshInterval = 30000, fallbackToDemo = true } = options;
  
  const [state, setState] = useState({
    overview: null as any,
    isLoading: true,
    error: null as string | null,
    dataSource: 'fallback' as any,
    lastUpdated: null as Date | null
  });

  const fetchOverview = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [overview, dataSource] = await Promise.all([
        getAnalyticsOverview(timeRange, { fallbackToDemo }),
        getCurrentDataSource()
      ]);

      setState({
        overview,
        isLoading: false,
        error: null,
        dataSource,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch overview'
      }));
    }
  }, [timeRange, fallbackToDemo]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchOverview, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchOverview, refreshInterval]);

  return state;
}

export default {
  useLeadPulseData,
  useVisitorLocations,
  useAnalyticsOverview
};