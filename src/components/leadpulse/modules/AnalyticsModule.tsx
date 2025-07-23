'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, BarChart3, TrendingUp, Users, Eye, Loader2, Brain, Target, Zap } from 'lucide-react';
import { lazy } from 'react';

// Lazy load the heavy analytics components
const VisitorInsights = lazy(() => import('@/components/leadpulse/VisitorInsights'));
const VisitorPulseVisualization = lazy(() => import('@/components/leadpulse/VisitorPulseVisualization'));

interface AnalyticsModuleProps {
  visitorInsights: any[];
  visitorSegments: any[];
  engagementScore: number;
  conversionRate: number;
  bounceRate: number;
  averageSessionTime: number;
  handleExport: (type: string, format: string) => void;
}

export default function AnalyticsModule({
  visitorInsights,
  visitorSegments,
  engagementScore,
  conversionRate,
  bounceRate,
  averageSessionTime,
  handleExport
}: AnalyticsModuleProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Visitor Analytics & Intelligence
              </CardTitle>
              <CardDescription>
                AI-powered insights and behavioral analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                {visitorInsights.length} insights
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('analytics', 'pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Engagement</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{engagementScore}%</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Conversion</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{conversionRate}%</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">Bounce Rate</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{bounceRate}%</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Avg. Session</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">{averageSessionTime}s</div>
            </div>
          </div>

          {/* Visitor Segments */}
          {visitorSegments.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Visitor Segments
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {visitorSegments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{segment.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {segment.count || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="space-y-4">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Loading AI insights...</p>
                    <p className="text-xs text-gray-500">Analyzing visitor behavior patterns</p>
                  </div>
                </div>
              </div>
            }>
              <VisitorInsights />
            </Suspense>

            <Suspense fallback={
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Loading pulse visualization...</p>
                    <p className="text-xs text-gray-500">Preparing real-time analytics</p>
                  </div>
                </div>
              </div>
            }>
              <VisitorPulseVisualization />
            </Suspense>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('insights', 'csv')}>
                Export Insights
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('segments', 'json')}>
                Export Segments
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('metrics', 'xlsx')}>
                Export Metrics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}