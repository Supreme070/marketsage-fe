'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Monitor, 
  Smartphone, 
  Globe, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MousePointer,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';

interface CoreAnalyticsDashboardProps {
  isLoading?: boolean;
}

interface AnalyticsData {
  trafficSources: Array<{
    source: string;
    visitors: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  devices: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
    uniqueVisitors: number;
    avgTime: number;
  }>;
  hourlyTraffic: Array<{
    hour: number;
    visitors: number;
  }>;
  realTimeStats: {
    onlineNow: number;
    pageViews: number;
    newVsReturning: {
      new: number;
      returning: number;
    };
  };
}

const CoreAnalyticsDashboard = React.memo<CoreAnalyticsDashboardProps>(({ isLoading }) => {
  // Demo analytics data - in real implementation, this would come from MCP
  const analyticsData: AnalyticsData = useMemo(() => ({
    trafficSources: [
      { source: 'Direct', visitors: 456, percentage: 38.2, trend: 'up' },
      { source: 'Organic Search', visitors: 342, percentage: 28.6, trend: 'up' },
      { source: 'Social Media', visitors: 198, percentage: 16.5, trend: 'stable' },
      { source: 'Referral', visitors: 134, percentage: 11.2, trend: 'down' },
      { source: 'Email', visitors: 66, percentage: 5.5, trend: 'up' }
    ],
    devices: [
      { type: 'Mobile', count: 678, percentage: 68.2 },
      { type: 'Desktop', count: 234, percentage: 23.5 },
      { type: 'Tablet', count: 83, percentage: 8.3 }
    ],
    topPages: [
      { path: '/', views: 1248, uniqueVisitors: 892, avgTime: 145 },
      { path: '/features', views: 567, uniqueVisitors: 445, avgTime: 298 },
      { path: '/pricing', views: 334, uniqueVisitors: 289, avgTime: 189 },
      { path: '/contact', views: 178, uniqueVisitors: 156, avgTime: 234 },
      { path: '/blog', views: 134, uniqueVisitors: 98, avgTime: 456 }
    ],
    hourlyTraffic: [
      { hour: 0, visitors: 12 }, { hour: 1, visitors: 8 }, { hour: 2, visitors: 5 },
      { hour: 3, visitors: 4 }, { hour: 4, visitors: 6 }, { hour: 5, visitors: 9 },
      { hour: 6, visitors: 15 }, { hour: 7, visitors: 23 }, { hour: 8, visitors: 45 },
      { hour: 9, visitors: 67 }, { hour: 10, visitors: 78 }, { hour: 11, visitors: 89 },
      { hour: 12, visitors: 95 }, { hour: 13, visitors: 88 }, { hour: 14, visitors: 92 },
      { hour: 15, visitors: 87 }, { hour: 16, visitors: 76 }, { hour: 17, visitors: 69 },
      { hour: 18, visitors: 58 }, { hour: 19, visitors: 45 }, { hour: 20, visitors: 34 },
      { hour: 21, visitors: 28 }, { hour: 22, visitors: 21 }, { hour: 23, visitors: 16 }
    ],
    realTimeStats: {
      onlineNow: 23,
      pageViews: 1547,
      newVsReturning: {
        new: 67,
        returning: 33
      }
    }
  }), []);

  const maxHourlyTraffic = useMemo(() => 
    Math.max(...analyticsData.hourlyTraffic.map(h => h.visitors)),
    [analyticsData.hourlyTraffic]
  );

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Core Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500">Loading analytics data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Core Analytics
        </CardTitle>
        <div className="text-sm text-gray-600 mt-1">
          Comprehensive visitor and traffic analytics
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Real-time Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Wifi className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <div className="text-lg font-semibold">{analyticsData.realTimeStats.onlineNow}</div>
            <div className="text-xs text-gray-500">Online Now</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <ExternalLink className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <div className="text-lg font-semibold">{analyticsData.realTimeStats.pageViews.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Page Views Today</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Users className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <div className="text-lg font-semibold">{analyticsData.realTimeStats.newVsReturning.new}%</div>
            <div className="text-xs text-gray-500">New Visitors</div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Traffic Sources</h4>
          <div className="space-y-2">
            {analyticsData.trafficSources.map((source) => (
              <div
                key={source.source}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{source.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">{source.visitors}</div>
                    <div className="text-xs text-gray-500">{source.percentage}%</div>
                  </div>
                  <div className="w-2">
                    {source.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {source.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Device Distribution</h4>
          <div className="space-y-3">
            {analyticsData.devices.map((device) => (
              <div key={device.type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {device.type === 'Mobile' && <Smartphone className="h-4 w-4" />}
                    {device.type === 'Desktop' && <Monitor className="h-4 w-4" />}
                    {device.type === 'Tablet' && <Monitor className="h-4 w-4" />}
                    <span>{device.type}</span>
                  </div>
                  <span className="font-medium">{device.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      device.type === 'Mobile' ? 'bg-blue-500' :
                      device.type === 'Desktop' ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Pages */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Top Pages</h4>
          <div className="space-y-2">
            {analyticsData.topPages.slice(0, 4).map((page) => (
              <div
                key={page.path}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{page.path}</div>
                    <div className="text-xs text-gray-500">
                      {Math.floor(page.avgTime / 60)}m {page.avgTime % 60}s avg
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium">{page.views}</div>
                  <div className="text-xs text-gray-500">{page.uniqueVisitors} unique</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Traffic Pattern */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">24-Hour Traffic Pattern</h4>
          <div className="flex items-end justify-between h-16 gap-1">
            {analyticsData.hourlyTraffic.map((hour) => (
              <div
                key={hour.hour}
                className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity relative group"
                style={{ 
                  height: `${(hour.visitors / maxHourlyTraffic) * 100}%`,
                  minHeight: '2px'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {hour.hour}:00 - {hour.visitors} visitors
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Quick Insights</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Peak traffic hours: 12:00-15:00</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <span>Mobile dominates with {analyticsData.devices[0].percentage}% of traffic</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <span>Direct traffic shows strong brand recognition</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CoreAnalyticsDashboard.displayName = 'CoreAnalyticsDashboard';

export { CoreAnalyticsDashboard };
export default CoreAnalyticsDashboard;