'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  ChevronUp, 
  ChevronDown, 
  BarChart2, 
  PieChart, 
  Users, 
  Calendar,
  Clock,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface InsightItem {
  id: string;
  type: 'behavior' | 'prediction' | 'opportunity' | 'trend';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  metric?: {
    label: string;
    value: number;
    format?: 'percentage' | 'currency' | 'number';
    change?: number;
  };
  recommendation?: string;
  createdAt: string;
}

interface VisitorSegment {
  id: string;
  name: string;
  count: number;
  percentage: number;
  key: string;
}

interface Props {
  insights?: InsightItem[];
  segments?: VisitorSegment[];
  isLoading?: boolean;
}

export default function VisitorInsights({
  insights = [],
  segments = [],
  isLoading = false
}: Props) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'segments'>('insights');
  
  // Importance colors
  const importanceColors = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-blue-500'
  };
  
  // Insight type icons
  const insightIcons = {
    behavior: <BarChart2 className="h-3.5 w-3.5" />,
    prediction: <TrendingUp className="h-3.5 w-3.5" />,
    opportunity: <DollarSign className="h-3.5 w-3.5" />,
    trend: <PieChart className="h-3.5 w-3.5" />
  };
  
  // Format metric value
  const formatMetricValue = (value: number, format?: string) => {
    switch (format) {
      case 'percentage':
        return value.toFixed(1) + '%';
      case 'currency':
        return '₦' + (value >= 1000000 ? (value/1000000).toFixed(1) + 'M' : 
                      value >= 1000 ? (value/1000).toFixed(1) + 'K' : 
                      value.toFixed(0));
      default:
        return value >= 1000000 ? (value/1000000).toFixed(1) + 'M' : 
              value >= 1000 ? (value/1000).toFixed(1) + 'K' : 
              value.toLocaleString();
    }
  };
  
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/3 to-purple-500/3"></div>
      <div className="relative">
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-md font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Insights
            </h3>
            <p className="text-xs text-muted-foreground">
              Smart analysis of visitor behavior
            </p>
          </div>
          <div className="flex gap-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 rounded-lg shadow-sm border">
            <Button 
              variant={activeTab === 'insights' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab('insights')}
              className="text-xs h-7"
            >
              Insights
            </Button>
            <Button 
              variant={activeTab === 'segments' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab('segments')}
              className="text-xs h-7"
            >
              Segments
            </Button>
          </div>
        </div>
        
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-xs animate-pulse">Analyzing visitor data...</div>
            </div>
          ) : (
            <>
              {activeTab === 'insights' ? (
                insights.length > 0 ? (
                  <div className="space-y-2">
                    {insights.map(insight => (
                      <div 
                        key={insight.id} 
                        className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                      >
                        {/* Insight Header */}
                        <div 
                          className="p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                          onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`${insight.type === 'opportunity' ? 'text-green-500' : 
                                            insight.type === 'prediction' ? 'text-blue-500' :
                                            insight.type === 'trend' ? 'text-purple-500' : 'text-amber-500'}`}>
                              {insightIcons[insight.type]}
                            </div>
                            <div>
                              <span className="text-xs font-medium">{insight.title}</span>
                              <div className="flex items-center mt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  insight.importance === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                  insight.importance === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                  {insight.importance.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-2">
                                  {new Date(insight.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {expandedInsight === insight.id ? 
                            <ChevronUp className="h-3 w-3 text-muted-foreground" /> : 
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          }
                        </div>
                        
                        {/* Expanded Details */}
                        {expandedInsight === insight.id && (
                          <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-[11px] text-muted-foreground mb-2">
                              {insight.description}
                            </p>
                            
                            {insight.metric && (
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2 mb-2">
                                <div className="text-[10px] text-muted-foreground mb-0.5">
                                  {insight.metric.label}
                                </div>
                                <div className="flex items-end">
                                  <span className="text-sm font-bold mr-2">
                                    {formatMetricValue(insight.metric.value, insight.metric.format)}
                                  </span>
                                  {insight.metric.change !== undefined && (
                                    <div className={`flex items-center text-[10px] ${
                                      insight.metric.change > 0 ? 'text-green-500' : 
                                      insight.metric.change < 0 ? 'text-red-500' : 
                                      'text-muted-foreground'
                                    }`}>
                                      {insight.metric.change > 0 ? 
                                        <ChevronUp className="h-2.5 w-2.5 mr-0.5" /> : 
                                        insight.metric.change < 0 ? 
                                        <ChevronDown className="h-2.5 w-2.5 mr-0.5" /> : 
                                        null
                                      }
                                      {Math.abs(insight.metric.change).toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {insight.recommendation && (
                              <div className="flex items-start space-x-1.5 p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md">
                                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <div className="text-[10px]">
                                  <span className="font-medium">Recommendation: </span>
                                  {insight.recommendation}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <PieChart className="h-6 w-6 mb-2" />
                    <p className="text-xs">No insights available yet</p>
                    <p className="text-[10px]">Collect more visitor data to generate insights</p>
                  </div>
                )
              ) : (
                segments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/20 dark:via-gray-900 dark:to-blue-950/20 p-2 shadow-sm border border-blue-100 dark:border-blue-900/30">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-muted-foreground">Total Visitors</span>
                            <Users className="h-3 w-3 text-blue-500" />
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatMetricValue(segments.reduce((sum, segment) => sum + segment.count, 0))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-gray-900 dark:to-purple-950/20 p-2 shadow-sm border border-purple-100 dark:border-purple-900/30">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-muted-foreground">Segments</span>
                            <PieChart className="h-3 w-3 text-purple-500" />
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {segments.length}
                          </div>
                        </div>
                      </div>
                      
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/20 dark:via-gray-900 dark:to-green-950/20 p-2 shadow-sm border border-green-100 dark:border-green-900/30">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-muted-foreground">Today</span>
                            <Calendar className="h-3 w-3 text-green-500" />
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatMetricValue(Math.floor(segments.reduce((sum, segment) => sum + segment.count, 0) * 0.15))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-amber-950/20 dark:via-gray-900 dark:to-amber-950/20 p-2 shadow-sm border border-amber-100 dark:border-amber-900/30">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-muted-foreground">Avg Time</span>
                            <Clock className="h-3 w-3 text-amber-500" />
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            3:24
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      {segments.map(segment => (
                        <div key={segment.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md p-2 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{segment.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                              {segment.count.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={segment.percentage} className="h-1.5" />
                            <span className="text-[10px] text-muted-foreground">
                              {segment.percentage}%
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="text-[10px] text-muted-foreground">{segment.key}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Users className="h-6 w-6 mb-2" />
                    <p className="text-xs">No segments available</p>
                    <p className="text-[10px]">Create visitor segments to see data here</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 