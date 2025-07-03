/**
 * Advanced Analytics Hook
 * ======================
 * React hook for easy integration of scroll depth tracking, 
 * click heat mapping, and behavioral analytics.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  initializeAnalytics, 
  getAnalyticsManager, 
  trackEvent, 
  trackConversion, 
  trackError, 
  getUnifiedAnalytics,
  destroyAnalytics,
  type UnifiedAnalytics
} from '@/lib/analytics/analytics-manager';

interface AnalyticsConfig {
  sessionId?: string;
  visitorId?: string;
  enableScrollTracking?: boolean;
  enableClickTracking?: boolean;
  enableErrorTracking?: boolean;
  autoTrackPageViews?: boolean;
  debugMode?: boolean;
}

interface AnalyticsHookReturn {
  analytics: UnifiedAnalytics | null;
  isInitialized: boolean;
  trackEvent: (eventType: string, data: any) => void;
  trackConversion: (conversionType: string, value?: number, metadata?: any) => void;
  trackError: (error: Error, context?: any) => void;
  getEngagementScore: () => number;
  getUserIntent: () => string;
  getConversionProbability: () => number;
  getFrustrationSignals: () => string[];
  getRecommendations: () => string[];
}

export function useAdvancedAnalytics(config: AnalyticsConfig = {}): AnalyticsHookReturn {
  const {
    sessionId = generateSessionId(),
    visitorId = generateVisitorId(),
    enableScrollTracking = true,
    enableClickTracking = true,
    enableErrorTracking = true,
    autoTrackPageViews = true,
    debugMode = false
  } = config;

  const router = useRouter();
  const [analytics, setAnalytics] = useState<UnifiedAnalytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastPageRef = useRef<string>('');
  const managerRef = useRef<any>(null);

  // Initialize analytics on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const currentPage = window.location.pathname;
      const isNewVisitor = !localStorage.getItem('marketsage_visitor_id');
      
      // Store visitor ID for future sessions
      localStorage.setItem('marketsage_visitor_id', visitorId);
      localStorage.setItem('marketsage_session_id', sessionId);

      // Initialize analytics manager
      managerRef.current = initializeAnalytics(sessionId, visitorId, currentPage, isNewVisitor);
      setIsInitialized(true);
      lastPageRef.current = currentPage;

      if (debugMode) {
        console.log('Advanced Analytics initialized:', {
          sessionId,
          visitorId,
          page: currentPage,
          isNewVisitor
        });
      }

      // Set up periodic analytics updates
      const interval = setInterval(() => {
        const currentAnalytics = getUnifiedAnalytics();
        if (currentAnalytics) {
          setAnalytics(currentAnalytics);
        }
      }, 5000); // Update every 5 seconds

      return () => {
        clearInterval(interval);
      };
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      if (enableErrorTracking) {
        trackError(error as Error, { context: 'analytics_initialization' });
      }
    }
  }, [sessionId, visitorId, debugMode, enableErrorTracking]);

  // Track page changes (using pathname for Next.js 13+ App Router)
  useEffect(() => {
    if (!autoTrackPageViews || !isInitialized || typeof window === 'undefined') return;

    const handlePageChange = () => {
      try {
        const currentPath = window.location.pathname;
        if (lastPageRef.current !== currentPath) {
          // Update analytics manager for new page
          const manager = getAnalyticsManager();
          manager?.updatePage(currentPath);
          
          // Track page view event
          trackEvent('page_view', {
            previousPage: lastPageRef.current,
            currentPage: currentPath,
            timestamp: Date.now()
          });

          if (debugMode) {
            console.log('Page change tracked:', {
              from: lastPageRef.current,
              to: currentPath
            });
          }

          lastPageRef.current = currentPath;
        }
      } catch (error) {
        console.error('Error tracking page change:', error);
        if (enableErrorTracking) {
          trackError(error as Error, { context: 'page_change_tracking' });
        }
      }
    };

    // Set up MutationObserver to detect navigation changes
    const observer = new MutationObserver(() => {
      handlePageChange();
    });

    observer.observe(document, {
      subtree: true,
      childList: true
    });

    // Also listen to popstate for back/forward navigation
    window.addEventListener('popstate', handlePageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', handlePageChange);
    };
  }, [autoTrackPageViews, isInitialized, debugMode, enableErrorTracking]);

  // Set up global error tracking
  useEffect(() => {
    if (!enableErrorTracking || typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        reason: event.reason,
        type: 'promise_rejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enableErrorTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        destroyAnalytics();
        if (debugMode) {
          console.log('Analytics destroyed');
        }
      } catch (error) {
        console.error('Error destroying analytics:', error);
      }
    };
  }, [debugMode]);

  // Helper functions
  const getEngagementScore = (): number => {
    return analytics?.behavioralInsights?.engagementScore || 0;
  };

  const getUserIntent = (): string => {
    return analytics?.behavioralInsights?.userIntent || 'browse';
  };

  const getConversionProbability = (): number => {
    return analytics?.behavioralInsights?.conversionProbability || 0;
  };

  const getFrustrationSignals = (): string[] => {
    return analytics?.behavioralInsights?.frustrationSignals || [];
  };

  const getRecommendations = (): string[] => {
    return analytics?.behavioralInsights?.recommendedActions || [];
  };

  return {
    analytics,
    isInitialized,
    trackEvent,
    trackConversion,
    trackError,
    getEngagementScore,
    getUserIntent,
    getConversionProbability,
    getFrustrationSignals,
    getRecommendations
  };
}

// Helper functions
function generateSessionId(): string {
  // Try to get existing session ID from storage
  if (typeof window !== 'undefined') {
    const existingSessionId = sessionStorage.getItem('marketsage_session_id');
    if (existingSessionId) {
      return existingSessionId;
    }
  }

  // Generate new session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('marketsage_session_id', sessionId);
  }
  
  return sessionId;
}

function generateVisitorId(): string {
  // Try to get existing visitor ID from storage
  if (typeof window !== 'undefined') {
    const existingVisitorId = localStorage.getItem('marketsage_visitor_id');
    if (existingVisitorId) {
      return existingVisitorId;
    }
  }

  // Generate new visitor ID based on browser fingerprint
  const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('marketsage_visitor_id', visitorId);
  }
  
  return visitorId;
}

// Specialized hooks for specific use cases
export function useScrollDepthTracking() {
  const { analytics } = useAdvancedAnalytics();
  
  return {
    averageDepth: analytics?.scrollAnalytics?.averageDepth || 0,
    maxDepth: analytics?.scrollAnalytics?.maxDepth || 0,
    readingPattern: analytics?.scrollAnalytics?.readingPattern || 'bouncer',
    engagementZones: analytics?.scrollAnalytics?.engagementZones || [],
    attentionMap: analytics?.scrollAnalytics?.attentionMap || []
  };
}

export function useClickHeatmap() {
  const { analytics } = useAdvancedAnalytics();
  
  return {
    totalClicks: analytics?.clickHeatmap?.totalClicks || 0,
    hotspots: analytics?.clickHeatmap?.hotspots || [],
    clicksByElement: analytics?.clickHeatmap?.clicksByElement || [],
    clickPatterns: analytics?.clickHeatmap?.clickPatterns || {
      rageClicks: 0,
      deadClicks: 0,
      navigationClicks: 0,
      interactionClicks: 0
    }
  };
}

export function useBehavioralInsights() {
  const { analytics } = useAdvancedAnalytics();
  
  return {
    engagementScore: analytics?.behavioralInsights?.engagementScore || 0,
    userIntent: analytics?.behavioralInsights?.userIntent || 'browse',
    conversionProbability: analytics?.behavioralInsights?.conversionProbability || 0,
    frustrationSignals: analytics?.behavioralInsights?.frustrationSignals || [],
    recommendations: analytics?.behavioralInsights?.recommendedActions || []
  };
}