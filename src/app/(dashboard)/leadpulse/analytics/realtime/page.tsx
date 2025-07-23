/**
 * Real-Time Analytics Page
 * ========================
 * Production-scale real-time analytics dashboard page
 * Performance optimized to prevent freezing while keeping Grafana cards
 */

'use client';

import React, { useState, lazy, Suspense } from 'react';
import GrafanaStyleCards from '@/components/leadpulse/GrafanaStyleCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Activity, Loader2, Settings } from 'lucide-react';

// Lazy load the map component to prevent initial performance issues
const LiveVisitorMap = lazy(() => import('@/components/leadpulse/LiveVisitorMap'));

export default function RealTimeAnalyticsPage() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');

  const handleLoadMap = () => {
    setMapLoaded(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Real-Time Analytics</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Live Data</span>
          </div>
        </div>
        
        {/* Keep the Grafana cards - they work well */}
        <GrafanaStyleCards 
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
        
        {/* Performance-optimized map section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Live Visitor Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!mapLoaded ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Map className="h-16 w-16 text-gray-400" />
                <h3 className="text-lg font-semibold">Visitor Map Available</h3>
                <p className="text-gray-600 text-center max-w-md">
                  The live visitor map component is available but loads on-demand to prevent performance issues.
                  Click below to load the interactive map.
                </p>
                <Button onClick={handleLoadMap} className="mt-4">
                  <Activity className="h-4 w-4 mr-2" />
                  Load Interactive Map
                </Button>
              </div>
            ) : (
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    <p className="text-sm text-gray-600">Loading map component...</p>
                    <div className="text-xs text-gray-500 max-w-sm">
                      Loading interactive visitor map with real-time data...
                    </div>
                  </div>
                </div>
              }>
                <LiveVisitorMap 
                  timeRange={timeRange}
                  isLoading={false}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}