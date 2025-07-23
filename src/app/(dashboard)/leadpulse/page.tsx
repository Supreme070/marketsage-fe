'use client';

import React, { Suspense, useMemo, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, Globe, Brain, Target, Eye } from 'lucide-react';
import { useMCPLeadPulse } from '@/hooks/useMCPLeadPulse';

// Lazy load heavy components for better performance
const BasicVisitorMap = lazy(() => import('@/components/leadpulse/BasicVisitorMap'));
const EngagementMetrics = lazy(() => import('@/components/leadpulse/EngagementMetrics'));
const FormTracker = lazy(() => import('@/components/leadpulse/FormTracker'));
const CoreAnalyticsDashboard = lazy(() => import('@/components/leadpulse/CoreAnalyticsDashboard'));
const CustomerJourneyVisualization = lazy(() => import('@/components/leadpulse/CustomerJourneyVisualization'));
const ConversionFunnelAnalysis = lazy(() => import('@/components/leadpulse/ConversionFunnelAnalysis'));
const BehavioralScoring = lazy(() => import('@/components/leadpulse/BehavioralScoring'));
const AIInsightsDashboard = lazy(() => import('@/components/leadpulse/AIInsightsDashboard'));
const Enhanced3DVisitorMap = lazy(() => import('@/components/leadpulse/Enhanced3DVisitorMap'));

// Loading component for lazy-loaded sections
const ComponentLoader = React.memo(() => (
  <Card className="h-full">
    <CardContent className="p-6">
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
          <span className="ml-2 text-gray-500">Loading component...</span>
        </div>
      </div>
    </CardContent>
  </Card>
));

ComponentLoader.displayName = 'ComponentLoader';

const LeadPulseDashboard = React.memo(() => {
  // Use MCP-enabled hook with proper configuration
  const {
    visitorLocations,
    visitorJourneys,
    insights,
    segments,
    analyticsOverview,
    isLoading,
    error,
    dataSource,
    mcpEnabled,
    mcpConnected
  } = useMCPLeadPulse({
    timeRange: '24h',
    refreshInterval: 60000,
    enableRealtime: false,
    autoRefresh: true,
    maxVisitors: 50
  });

  // Memoize computed values
  const memoizedInsightsCount = useMemo(() => insights.length, [insights.length]);
  
  // Memoize status badge variants
  const statusBadgeProps = useMemo(() => ({
    mcpBadgeVariant: mcpConnected ? "default" : "outline" as const,
    dataBadgeVariant: dataSource === 'mcp' ? "default" : "outline" as const
  }), [mcpConnected, dataSource]);
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LeadPulse Analytics</h1>
        <p className="text-gray-600">Real-time visitor intelligence and behavior analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active Visitors</span>
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : analyticsOverview.activeVisitors}</div>
            <div className="text-sm text-gray-500">Currently online</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Engagement</span>
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${analyticsOverview.engagementScore}%`}</div>
            <div className="text-sm text-gray-500">Average engagement</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Conversion</span>
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${analyticsOverview.conversionRate}%`}</div>
            <div className="text-sm text-gray-500">Conversion rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">AI Insights</span>
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : memoizedInsightsCount}</div>
            <div className="text-sm text-gray-500">New insights</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            LeadPulse Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>System Status</span>
              <Badge variant="default">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Collection</span>
              <Badge variant={statusBadgeProps.mcpBadgeVariant}>{mcpConnected ? 'Active' : 'Using Fallback'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Real-time Updates</span>
              <Badge variant={statusBadgeProps.dataBadgeVariant}>{dataSource === 'mcp' ? 'Connected' : 'Demo Mode'}</Badge>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-yellow-800">{mcpEnabled ? 'MCP System Active' : 'Demo Mode Active'}</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {mcpEnabled 
                      ? 'LeadPulse is running with MCP integration. Data updates every 60 seconds.'
                      : 'Running in demo mode with sample data. Connect database for real tracking.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lazy-loaded Components Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<ComponentLoader />}>
          <BasicVisitorMap 
            locations={visitorLocations}
            isLoading={isLoading}
          />
        </Suspense>
        
        <Suspense fallback={<ComponentLoader />}>
          <EngagementMetrics 
            journeys={visitorJourneys}
            isLoading={isLoading}
          />
        </Suspense>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<ComponentLoader />}>
          <FormTracker isLoading={isLoading} />
        </Suspense>
        
        <Suspense fallback={<ComponentLoader />}>
          <CoreAnalyticsDashboard isLoading={isLoading} />
        </Suspense>
      </div>

      {/* Enhanced Customer Journey Visualization */}
      <Suspense fallback={<ComponentLoader />}>
        <CustomerJourneyVisualization 
          journeys={visitorJourneys}
          isLoading={isLoading}
        />
      </Suspense>

      {/* Conversion Funnel Analysis */}
      <Suspense fallback={<ComponentLoader />}>
        <ConversionFunnelAnalysis isLoading={isLoading} />
      </Suspense>

      {/* Behavioral Scoring */}
      <Suspense fallback={<ComponentLoader />}>
        <BehavioralScoring isLoading={isLoading} />
      </Suspense>

      {/* AI Insights Dashboard */}
      <Suspense fallback={<ComponentLoader />}>
        <AIInsightsDashboard isLoading={isLoading} />
      </Suspense>

      {/* Enhanced 3D Visitor Map */}
      <Suspense fallback={<ComponentLoader />}>
        <Enhanced3DVisitorMap 
          locations={visitorLocations}
          isLoading={isLoading}
        />
      </Suspense>
    </div>
  );
});

LeadPulseDashboard.displayName = 'LeadPulseDashboard';

export default LeadPulseDashboard;