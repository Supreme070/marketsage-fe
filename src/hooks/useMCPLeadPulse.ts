/**
 * MCP-Integrated LeadPulse Hook
 * 
 * This hook integrates with MCP servers to provide real-time visitor data
 * while maintaining backward compatibility with fallback mechanisms.
 * 
 * Data Sources (in order of preference):
 * 1. 'mcp' - Real data from MCP LeadPulse server
 * 2. 'fallback' - Real data from direct database queries
 * 3. 'demo' - Demo data (removed - now returns empty arrays)
 * 
 * Features:
 * - Real visitor segmentation based on actual behavior data
 * - Live insights calculated from visitor patterns
 * - Database fallback when MCP server unavailable
 * - No demo data fallbacks (returns empty/real data only)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getMCPVisitorData,
  getMCPVisitorInsights,
  getMCPVisitorLocations,
  type MCPLeadPulseDataProvider
} from '@/lib/leadpulse/mcp-data-provider';
import type { 
  VisitorLocation, 
  VisitorJourney, 
  InsightItem,
  VisitorSegment 
} from '@/lib/leadpulse/dataProvider';
import type { 
  MCPAuthContext
} from '../mcp/types/mcp-types';

interface UseMCPLeadPulseOptions {
  timeRange?: string;
  refreshInterval?: number;
  enableRealtime?: boolean;
  autoRefresh?: boolean;
  maxVisitors?: number;
}

interface MCPLeadPulseData {
  // Core data
  visitorLocations: VisitorLocation[];
  visitorJourneys: VisitorJourney[];
  insights: InsightItem[];
  segments: VisitorSegment[];
  
  // Analytics overview
  analyticsOverview: {
    activeVisitors: number;
    totalVisitors: number;
    conversionRate: number;
    engagementScore: number;
    bounceRate: number;
    averageSessionTime: number;
  };
  
  // State management
  isLoading: boolean;
  error: string | null;
  dataSource: 'mcp' | 'fallback' | 'demo';
  lastUpdated: Date | null;
  
  // MCP specific
  mcpEnabled: boolean;
  mcpConnected: boolean;
  
  // Methods
  refresh: () => Promise<void>;
  refreshVisitors: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  refreshLocations: () => Promise<void>;
}

/**
 * MCP-integrated LeadPulse data hook
 */
export function useMCPLeadPulse(options: UseMCPLeadPulseOptions = {}): MCPLeadPulseData {
  const { data: session } = useSession();
  const {
    timeRange = '24h',
    refreshInterval = 60000, // 60 seconds - Reduced frequency for performance
    enableRealtime = false, // Disabled by default for stability
    autoRefresh = true,
    maxVisitors = 50
  } = options;

  // State
  const [visitorLocations, setVisitorLocations] = useState<VisitorLocation[]>([]);
  const [visitorJourneys, setVisitorJourneys] = useState<VisitorJourney[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [segments, setSegments] = useState<VisitorSegment[]>([]);
  const [analyticsOverview, setAnalyticsOverview] = useState({
    activeVisitors: 0,
    totalVisitors: 0,
    conversionRate: 0,
    engagementScore: 0,
    bounceRate: 0,
    averageSessionTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mcp' | 'fallback' | 'demo'>('fallback');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [mcpConnected, setMcpConnected] = useState(false);

  // Refs for preventing race conditions
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create MCP auth context from session
  const createAuthContext = useCallback((): MCPAuthContext | undefined => {
    if (!session?.user) return undefined;
    
    return {
      userId: session.user.id || '',
      organizationId: (session.user as any).organizationId || '',
      permissions: ['read:org', 'read:leadpulse'],
      role: (session.user as any).role || 'user'
    };
  }, [session]);

  /**
   * Fetch visitor data from MCP
   */
  const fetchVisitorData = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;
    
    // Prevent too frequent fetches
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      setError(null);
      
      const authContext = createAuthContext();
      
      // Fetch visitor journeys (main visitor data)
      const journeys = await getMCPVisitorData({
        limit: maxVisitors,
        includeLocation: true,
        includeDevice: true,
        authContext
      });

      if (isMountedRef.current) {
        setVisitorJourneys(journeys);
        setDataSource(authContext ? 'mcp' : 'fallback');
        setMcpEnabled(!!authContext);
        setMcpConnected(!!authContext);
        
        // Calculate analytics overview from visitor data
        const overview = calculateAnalyticsOverview(journeys);
        setAnalyticsOverview(overview);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch visitor data');
        setDataSource('fallback');
        setMcpConnected(false);
      }
    }
  }, [createAuthContext, maxVisitors]);

  /**
   * Fetch visitor locations from MCP
   */
  const fetchLocations = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const authContext = createAuthContext();
      const locations = await getMCPVisitorLocations(authContext);
      
      if (isMountedRef.current) {
        setVisitorLocations(locations);
      }
    } catch (err) {
      console.error('Failed to fetch visitor locations:', err);
    }
  }, [createAuthContext]);

  /**
   * Fetch insights from MCP
   */
  const fetchInsights = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const authContext = createAuthContext();
      const insightsData = await getMCPVisitorInsights(authContext);
      
      if (isMountedRef.current) {
        setInsights(insightsData);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  }, [createAuthContext]);

  /**
   * Fetch segments from real MCP visitor data
   */
  const fetchSegments = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const authContext = createAuthContext();
      
      // Get visitor data to calculate real segments
      const visitors = await getMCPVisitorData({
        limit: 200, // Get more data for accurate segmentation
        includeLocation: true,
        includeDevice: true,
        authContext
      });
      
      if (visitors.length === 0) {
        // Fallback to empty segments if no data
        setSegments([]);
        return;
      }

      // Calculate real segments from visitor data
      const totalVisitors = visitors.length;
      
      // High Intent: Visitors with engagement score > 70
      const highIntent = visitors.filter(v => v.engagementScore > 70);
      
      // New Visitors: Visitors with only 1-2 pulse data points
      const newVisitors = visitors.filter(v => v.pulseData.length <= 2);
      
      // Returning Visitors: Visitors with multiple sessions indicated by pulse data
      const returningVisitors = visitors.filter(v => v.pulseData.length > 5);
      
      // Mobile Users: Determine from device info in visitor data
      const mobileUsers = visitors.filter(v => 
        v.device.toLowerCase().includes('mobile') || 
        v.device.toLowerCase().includes('iphone') ||
        v.device.toLowerCase().includes('android')
      );

      const realSegments: VisitorSegment[] = [
        { 
          id: '1', 
          name: 'High Intent', 
          count: highIntent.length, 
          percentage: Math.round((highIntent.length / totalVisitors) * 100), 
          key: 'high_intent' 
        },
        { 
          id: '2', 
          name: 'New Visitors', 
          count: newVisitors.length, 
          percentage: Math.round((newVisitors.length / totalVisitors) * 100), 
          key: 'new_visitors' 
        },
        { 
          id: '3', 
          name: 'Returning', 
          count: returningVisitors.length, 
          percentage: Math.round((returningVisitors.length / totalVisitors) * 100), 
          key: 'returning' 
        },
        { 
          id: '4', 
          name: 'Mobile Users', 
          count: mobileUsers.length, 
          percentage: Math.round((mobileUsers.length / totalVisitors) * 100), 
          key: 'mobile_users' 
        }
      ];
      
      if (isMountedRef.current) {
        setSegments(realSegments);
        setDataSource(authContext ? 'mcp' : 'fallback');
      }
    } catch (err) {
      console.error('Failed to fetch segments:', err);
      // Set empty segments on error instead of demo data
      if (isMountedRef.current) {
        setSegments([]);
        setDataSource('fallback');
      }
    }
  }, [createAuthContext]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    
    try {
      await Promise.all([
        fetchVisitorData(true),
        fetchLocations(),
        fetchInsights(),
        fetchSegments()
      ]);
      
      if (isMountedRef.current) {
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchVisitorData, fetchLocations, fetchInsights, fetchSegments]);

  /**
   * Individual refresh methods
   */
  const refreshVisitors = useCallback(async () => {
    await fetchVisitorData(true);
  }, [fetchVisitorData]);

  const refreshInsights = useCallback(async () => {
    await fetchInsights();
  }, [fetchInsights]);

  const refreshLocations = useCallback(async () => {
    await fetchLocations();
  }, [fetchLocations]);

  // Initial data fetch - Fixed to prevent infinite loops
  useEffect(() => {
    if (session !== undefined) { // Wait for session to be determined
      refresh();
    }
  }, [session]); // Removed 'refresh' from dependencies

  // Auto-refresh setup - Fixed to prevent infinite loops
  useEffect(() => {
    if (!autoRefresh || !enableRealtime) return;

    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        refresh();
      }
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, enableRealtime, refreshInterval]); // Removed 'refresh' from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Core data
    visitorLocations,
    visitorJourneys,
    insights,
    segments,
    analyticsOverview,
    
    // State
    isLoading,
    error,
    dataSource,
    lastUpdated,
    
    // MCP specific
    mcpEnabled,
    mcpConnected,
    
    // Methods
    refresh,
    refreshVisitors,
    refreshInsights,
    refreshLocations
  };
}

/**
 * Calculate analytics overview from visitor data
 */
function calculateAnalyticsOverview(journeys: VisitorJourney[]) {
  if (journeys.length === 0) {
    return {
      activeVisitors: 0,
      totalVisitors: 0,
      conversionRate: 0,
      engagementScore: 0,
      bounceRate: 0,
      averageSessionTime: 0
    };
  }

  const activeVisitors = journeys.filter(v => 
    v.lastActive === 'just now' || v.lastActive.includes('min ago')
  ).length;

  const totalVisitors = journeys.length;
  
  const avgEngagement = journeys.reduce((sum, v) => sum + v.engagementScore, 0) / totalVisitors;
  
  // Calculate conversion rate based on pulse data
  const conversions = journeys.filter(v => 
    v.pulseData.some(p => p.type === 'CONVERSION')
  ).length;
  const conversionRate = (conversions / totalVisitors) * 100;
  
  // Calculate bounce rate (visitors with only one pulse data point)
  const bounces = journeys.filter(v => v.pulseData.length <= 1).length;
  const bounceRate = (bounces / totalVisitors) * 100;
  
  // Estimate average session time from pulse data
  const avgSessionTime = journeys.reduce((sum, v) => {
    const sessionTime = v.pulseData.reduce((time, p) => time + (p.value || 60), 0);
    return sum + sessionTime;
  }, 0) / totalVisitors;

  return {
    activeVisitors,
    totalVisitors,
    conversionRate: Math.round(conversionRate * 10) / 10,
    engagementScore: Math.round(avgEngagement),
    bounceRate: Math.round(bounceRate * 10) / 10,
    averageSessionTime: Math.round(avgSessionTime)
  };
}

export default useMCPLeadPulse;