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
    behavior: <BarChart2 className="h-5 w-5" />,
    prediction: <TrendingUp className="h-5 w-5" />,
    opportunity: <DollarSign className="h-5 w-5" />,
    trend: <PieChart className="h-5 w-5" />
  };
  
  // Format metric value
  const formatMetricValue = (value: number, format?: string) => {
    switch (format) {
      case 'percentage':
        return value.toFixed(1) + '%';
      case 'currency':
        return '$' + value.toFixed(2);
      default:
        return value.toLocaleString();
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">AI Insights</CardTitle>
            <CardDescription>
              Intelligent analysis of your visitor behavior
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant={activeTab === 'insights' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </Button>
            <Button 
              variant={activeTab === 'segments' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveTab('segments')}
            >
              Segments
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse">Analyzing visitor data...</div>
          </div>
        ) : (
          <>
            {activeTab === 'insights' ? (
              insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map(insight => (
                    <div 
                      key={insight.id} 
                      className="border rounded-lg overflow-hidden"
                    >
                      {/* Insight Header */}
                      <div 
                        className="p-3 cursor-pointer bg-muted/50 hover:bg-muted flex items-center justify-between"
                        onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`${insight.type === 'opportunity' ? 'text-green-500' : 
                                           insight.type === 'prediction' ? 'text-blue-500' :
                                           insight.type === 'trend' ? 'text-purple-500' : 'text-amber-500'}`}>
                            {insightIcons[insight.type]}
                          </div>
                          <div>
                            <span className="font-medium">{insight.title}</span>
                            <div className="flex items-center mt-0.5">
                              <Badge className={`${
                                insight.importance === 'high' ? 'bg-red-100 text-red-800' :
                                insight.importance === 'medium' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              } text-xs`}>
                                {insight.importance.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(insight.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {expandedInsight === insight.id ? 
                          <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedInsight === insight.id && (
                        <div className="p-3 border-t">
                          <p className="text-sm text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          
                          {insight.metric && (
                            <div className="bg-muted rounded-md p-3 mb-3">
                              <div className="text-xs text-muted-foreground mb-1">
                                {insight.metric.label}
                              </div>
                              <div className="flex items-end">
                                <span className="text-xl font-bold mr-2">
                                  {formatMetricValue(insight.metric.value, insight.metric.format)}
                                </span>
                                {insight.metric.change !== undefined && (
                                  <div className={`flex items-center text-xs ${
                                    insight.metric.change > 0 ? 'text-green-500' : 
                                    insight.metric.change < 0 ? 'text-red-500' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {insight.metric.change > 0 ? 
                                      <ChevronUp className="h-3 w-3 mr-0.5" /> : 
                                      insight.metric.change < 0 ? 
                                      <ChevronDown className="h-3 w-3 mr-0.5" /> : 
                                      null
                                    }
                                    {Math.abs(insight.metric.change).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {insight.recommendation && (
                            <div className="flex items-start space-x-2 p-2 bg-blue-50 text-blue-800 rounded-md">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div className="text-xs">
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
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <PieChart className="h-8 w-8 mb-2" />
                  <p>No insights available yet</p>
                  <p className="text-xs">Collect more visitor data to generate insights</p>
                </div>
              )
            ) : (
              segments.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">
                          Total Visitors
                        </div>
                        <div className="text-2xl font-bold">
                          {segments.reduce((sum, segment) => sum + segment.count, 0)}
                        </div>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                    
                    <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">
                          Segments
                        </div>
                        <div className="text-2xl font-bold">
                          {segments.length}
                        </div>
                      </div>
                      <PieChart className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                    
                    <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">
                          Today's Visitors
                        </div>
                        <div className="text-2xl font-bold">
                          {/* This would be calculated from actual data */}
                          {Math.round(segments.reduce((sum, segment) => sum + segment.count, 0) * 0.12)}
                        </div>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                    
                    <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">
                          Avg. Engagement
                        </div>
                        <div className="text-2xl font-bold">
                          8.2
                        </div>
                      </div>
                      <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                  </div>
                
                  {segments.map(segment => (
                    <div key={segment.id} className="border rounded-lg overflow-hidden">
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{segment.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {segment.count} visitors ({segment.percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                        </div>
                      </div>
                      <div className="px-3 pb-3">
                        <Progress value={segment.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2" />
                  <p>No segments available</p>
                  <p className="text-xs">Collect more visitor data to generate segments</p>
                </div>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 