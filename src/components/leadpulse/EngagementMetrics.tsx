'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, MousePointer, Eye, Target } from 'lucide-react';
import type { VisitorJourney } from '@/lib/leadpulse/dataProvider';

interface EngagementMetricsProps {
  journeys: VisitorJourney[];
  isLoading?: boolean;
}

const EngagementMetrics = React.memo<EngagementMetricsProps>(({ journeys, isLoading }) => {
  const metrics = useMemo(() => {
    if (journeys.length === 0) {
      return {
        averageEngagement: 0,
        highEngagement: 0,
        mediumEngagement: 0,
        lowEngagement: 0,
        averageSessionTime: 0,
        averagePageViews: 0,
        bounceRate: 0,
        interactions: 0,
        trend: 'stable' as 'up' | 'down' | 'stable'
      };
    }

    const totalVisitors = journeys.length;
    const totalEngagement = journeys.reduce((sum, j) => sum + j.engagementScore, 0);
    const averageEngagement = Math.round(totalEngagement / totalVisitors);

    const highEngagement = journeys.filter(j => j.engagementScore >= 70).length;
    const mediumEngagement = journeys.filter(j => j.engagementScore >= 40 && j.engagementScore < 70).length;
    const lowEngagement = journeys.filter(j => j.engagementScore < 40).length;

    const totalSessionTime = journeys.reduce((sum, j) => {
      const sessionTime = j.pulseData.reduce((time, p) => time + (p.value || 60), 0);
      return sum + sessionTime;
    }, 0);
    const averageSessionTime = Math.round(totalSessionTime / totalVisitors);

    const averagePageViews = journeys.reduce((sum, j) => sum + j.totalPages, 0) / totalVisitors;
    const bounces = journeys.filter(j => j.pulseData.length <= 1).length;
    const bounceRate = Math.round((bounces / totalVisitors) * 100);

    const interactions = journeys.reduce((sum, j) => {
      return sum + j.pulseData.filter(p => p.type === 'INTERACTION').length;
    }, 0);

    const trend = averageEngagement > 60 ? 'up' : averageEngagement < 40 ? 'down' : 'stable';

    return {
      averageEngagement,
      highEngagement,
      mediumEngagement,
      lowEngagement,
      averageSessionTime,
      averagePageViews: Math.round(averagePageViews * 10) / 10,
      bounceRate,
      interactions,
      trend
    };
  }, [journeys]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500">Loading engagement data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Engagement Metrics
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={metrics.trend === 'up' ? 'default' : metrics.trend === 'down' ? 'destructive' : 'secondary'}>
            {metrics.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
            {metrics.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
            {metrics.trend === 'stable' && <Target className="h-3 w-3 mr-1" />}
            {metrics.trend === 'up' ? 'High' : metrics.trend === 'down' ? 'Low' : 'Stable'}
          </Badge>
          <span className="text-sm text-gray-600">
            {metrics.averageEngagement}% average engagement
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Engagement Score Distribution */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Engagement Distribution</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm">High Engagement (70%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{metrics.highEngagement}</span>
                <span className="text-xs text-gray-500">
                  ({journeys.length > 0 ? Math.round((metrics.highEngagement / journeys.length) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all" 
                style={{ width: `${journeys.length > 0 ? (metrics.highEngagement / journeys.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm">Medium Engagement (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{metrics.mediumEngagement}</span>
                <span className="text-xs text-gray-500">
                  ({journeys.length > 0 ? Math.round((metrics.mediumEngagement / journeys.length) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all" 
                style={{ width: `${journeys.length > 0 ? (metrics.mediumEngagement / journeys.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm">Low Engagement (&lt;40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{metrics.lowEngagement}</span>
                <span className="text-xs text-gray-500">
                  ({journeys.length > 0 ? Math.round((metrics.lowEngagement / journeys.length) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all" 
                style={{ width: `${journeys.length > 0 ? (metrics.lowEngagement / journeys.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <div className="text-lg font-semibold">{Math.floor(metrics.averageSessionTime / 60)}m {metrics.averageSessionTime % 60}s</div>
            <div className="text-xs text-gray-500">Avg Session Time</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Eye className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <div className="text-lg font-semibold">{metrics.averagePageViews}</div>
            <div className="text-xs text-gray-500">Pages per Session</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Target className="h-6 w-6 mx-auto text-orange-500 mb-2" />
            <div className="text-lg font-semibold">{metrics.bounceRate}%</div>
            <div className="text-xs text-gray-500">Bounce Rate</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MousePointer className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <div className="text-lg font-semibold">{metrics.interactions}</div>
            <div className="text-xs text-gray-500">Total Interactions</div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Quick Insights</h4>
          <div className="space-y-2 text-sm text-gray-600">
            {metrics.averageEngagement > 60 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Strong visitor engagement across the board</span>
              </div>
            )}
            {metrics.bounceRate > 50 && (
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>High bounce rate - consider improving landing pages</span>
              </div>
            )}
            {metrics.averageSessionTime > 180 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Visitors are spending quality time on your site</span>
              </div>
            )}
            {metrics.interactions > journeys.length && (
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-purple-500" />
                <span>High interaction rate indicates engaging content</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

EngagementMetrics.displayName = 'EngagementMetrics';

export { EngagementMetrics };
export default EngagementMetrics;