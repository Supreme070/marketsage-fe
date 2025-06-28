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
  DollarSign,
  Brain
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
  
  // Insight type icons
  const insightIcons = {
    behavior: <BarChart2 className="h-4 w-4" />,
    prediction: <TrendingUp className="h-4 w-4" />,
    opportunity: <DollarSign className="h-4 w-4" />,
    trend: <PieChart className="h-4 w-4" />
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/20">
              <Brain className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">AI Insights</CardTitle>
              <CardDescription className="text-gray-400">
                Smart analysis of visitor behavior
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1 bg-gray-800/50 p-1 rounded-md border border-gray-700/50">
            <Button 
              variant={activeTab === 'insights' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab('insights')}
              className="h-7 text-xs bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30"
            >
              Insights
            </Button>
            <Button 
              variant={activeTab === 'segments' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab('segments')}
              className="h-7 text-xs bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30"
            >
              Segments
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm animate-pulse text-gray-400">Analyzing visitor data...</div>
          </div>
        ) : (
          <>
            {activeTab === 'insights' ? (
              insights.length > 0 ? (
                <div className="space-y-3">
                  {insights.map(insight => (
                    <div 
                      key={insight.id} 
                      className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/30"
                    >
                      {/* Insight Header */}
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-700/30 flex items-center justify-between transition-colors"
                        onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`${insight.type === 'opportunity' ? 'text-green-400' : 
                                          insight.type === 'prediction' ? 'text-blue-400' :
                                          insight.type === 'trend' ? 'text-purple-400' : 'text-amber-400'}`}>
                            {insightIcons[insight.type]}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white">{insight.title}</span>
                            <div className="flex items-center mt-1 gap-2">
                              <Badge 
                                variant={insight.importance === 'high' ? 'destructive' : 
                                        insight.importance === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {insight.importance?.toUpperCase() || 'LOW'}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(insight.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {expandedInsight === insight.id ? 
                          <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        }
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedInsight === insight.id && (
                        <div className="p-3 border-t border-gray-700/50 bg-gray-900/30">
                          <p className="text-sm text-gray-300 mb-3">
                            {insight.description}
                          </p>
                          
                          {insight.metric && (
                            <div className="bg-gray-800/50 rounded-md p-3 mb-3">
                              <div className="text-xs text-gray-400 mb-1">
                                {insight.metric.label}
                              </div>
                              <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-white">
                                  {formatMetricValue(insight.metric.value, insight.metric.format)}
                                </span>
                                {insight.metric.change !== undefined && (
                                  <div className={`flex items-center text-sm ${
                                    insight.metric.change > 0 ? 'text-green-400' : 
                                    insight.metric.change < 0 ? 'text-red-400' : 
                                    'text-gray-400'
                                  }`}>
                                    {insight.metric.change > 0 ? 
                                      <ChevronUp className="h-3 w-3 mr-1" /> : 
                                      insight.metric.change < 0 ? 
                                      <ChevronDown className="h-3 w-3 mr-1" /> : 
                                      null
                                    }
                                    {Math.abs(insight.metric.change).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {insight.recommendation && (
                            <div className="flex items-start space-x-2 p-3 bg-blue-600/10 border border-blue-500/20 text-blue-300 rounded-md">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
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
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <PieChart className="h-8 w-8 mb-3" />
                  <p className="text-sm font-medium">No insights available yet</p>
                  <p className="text-xs">Collect more visitor data to generate insights</p>
                </div>
              )
            ) : (
              segments.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Total Visitors</span>
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="text-xl font-bold text-white">
                        {formatMetricValue(segments.reduce((sum, segment) => sum + segment.count, 0))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Segments</span>
                        <PieChart className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="text-xl font-bold text-white">
                        {segments.length}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Today</span>
                        <Calendar className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="text-xl font-bold text-white">
                        {formatMetricValue(Math.floor(segments.reduce((sum, segment) => sum + segment.count, 0) * 0.15))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Avg Time</span>
                        <Clock className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="text-xl font-bold text-white">
                        3:24
                      </div>
                    </div>
                  </div>
                  
                  {/* Segments List */}
                  <div className="space-y-3">
                    {segments.map(segment => (
                      <div key={segment.id} className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{segment.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {segment.count.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <Progress value={segment.percentage} className="h-2 flex-1" />
                          <span className="text-sm text-gray-400 min-w-[3rem]">
                            {segment.percentage}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{segment.key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <Users className="h-8 w-8 mb-3" />
                  <p className="text-sm font-medium">No segments available</p>
                  <p className="text-xs">Create visitor segments to see data here</p>
                </div>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 