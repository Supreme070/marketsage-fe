/**
 * LeadPulse AI Intelligence Dashboard
 * 
 * Advanced AI-powered business intelligence interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Users,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Activity,
  Eye,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useSupremeAI } from '@/hooks/useSupremeAI';
import { useAIIntelligenceOverview } from '@/hooks/useAIIntelligence';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface AIInsight {
  id: string;
  type: 'PERFORMANCE' | 'OPPORTUNITY' | 'PREDICTION' | 'OPTIMIZATION' | 'ALERT';
  title: string;
  description: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  metrics?: Record<string, any>;
  createdAt: string;
}

interface VisitorProfile {
  id: string;
  behaviorPattern: string;
  engagementLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  conversionProbability: number;
  recommendedActions: string[];
  segments: string[];
  riskFactors: string[];
}

interface IntelligenceData {
  insights: AIInsight[];
  predictions: any[];
  recommendations: string[];
  score: number;
  generatedAt: string;
}

export function AIIntelligenceDashboard() {
  const { data: session } = useSession();
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceData | null>(null);
  const [visitorProfiles, setVisitorProfiles] = useState<VisitorProfile[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  // Use existing hooks
  const { overview, loading: overviewLoading, refresh: refreshOverview } = useAIIntelligenceOverview(
    session?.user?.id,
    timeRange as '24h' | '7d' | '30d' | 'all'
  );
  
  const loading = overviewLoading;

  // Fetch LeadPulse-specific data using Phase 4 AI endpoints
  const fetchLeadPulseData = async () => {
    if (!session?.user?.id) return;
    
    try {
      setRefreshing(true);
      
      // Use new Phase 4 AI endpoints
      const [intelligenceRes, visitorsRes] = await Promise.all([
        fetch('/api/ai/autonomous-segmentation', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            criteria: { timeRange, includeBehavioral: true },
            minSegmentSize: 10,
            features: ['engagement', 'conversion', 'demographics']
          })
        }),
        fetch('/api/ai/customer-journey-optimization', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            customerId: 'all',
            touchpoints: ['landing', 'form', 'email', 'conversion'],
            goals: { optimize: 'conversion', target: 'engagement' }
          })
        })
      ]);
      
      const [intelligenceData, visitorsData] = await Promise.all([
        intelligenceRes.json(),
        visitorsRes.json()
      ]);
      
      if (intelligenceData.success && visitorsData.success) {
        setIntelligenceData({
          insights: intelligenceData.data.insights || [],
          predictions: intelligenceData.data.predictions || [],
          recommendations: intelligenceData.data.recommendations || [],
          score: intelligenceData.data.score || 85,
          generatedAt: new Date().toISOString()
        });
        
        setVisitorProfiles(visitorsData.data.profiles || []);
        toast.success('AI Intelligence data updated');
      }
    } catch (error) {
      console.error('Failed to fetch LeadPulse AI data:', error);
      toast.error('Failed to load AI intelligence data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeadPulseData();
    }
  }, [timeRange, session?.user?.id]);

  const refreshData = async () => {
    await Promise.all([
      refreshOverview(),
      fetchLeadPulseData()
    ]);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'PERFORMANCE': return <BarChart3 className="w-4 h-4" />;
      case 'OPPORTUNITY': return <Lightbulb className="w-4 h-4" />;
      case 'PREDICTION': return <TrendingUp className="w-4 h-4" />;
      case 'OPTIMIZATION': return <Target className="w-4 h-4" />;
      case 'ALERT': return <AlertTriangle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'secondary';
      case 'MEDIUM': return 'outline';
      default: return 'outline';
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'VERY_HIGH': return 'text-green-600';
      case 'HIGH': return 'text-blue-600';
      case 'MEDIUM': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">AI Intelligence</h2>
            <p className="text-gray-600">Loading AI-powered insights...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Merge data from both sources - AI Intelligence Overview and LeadPulse specific data
  const mergedIntelligenceData = intelligenceData || {
    insights: overview.aiInsights.map(insight => ({
      id: `ai-${Date.now()}-${Math.random()}`,
      type: insight.type.toUpperCase() as 'PERFORMANCE' | 'OPPORTUNITY' | 'PREDICTION' | 'OPTIMIZATION' | 'ALERT',
      title: insight.title,
      description: insight.description,
      importance: insight.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      confidence: insight.confidence * 100,
      actionable: insight.actionable,
      recommendations: [insight.description],
      createdAt: new Date().toISOString()
    })),
    predictions: [],
    recommendations: ['Leverage Supreme AI v3 for enhanced insights', 'Integrate RAG engine for knowledge-grounded analysis'],
    score: overview.confidence * 100,
    generatedAt: overview.lastUpdated
  };

  if (!mergedIntelligenceData && !loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Intelligence Unavailable</h3>
          <p className="text-gray-600 mb-4">
            Unable to load AI insights. Please try again later.
          </p>
          <Button onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Intelligence
          </h2>
          <p className="text-gray-600">
            AI-powered insights to optimize your business performance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Intelligence Score */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Intelligence Score
          </CardTitle>
          <CardDescription>
            Overall business intelligence health score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Score</span>
                <span className="text-2xl font-bold text-purple-600">
                  {Math.round(mergedIntelligenceData?.score || overview.confidence * 100)}/100
                </span>
              </div>
              <Progress 
                value={mergedIntelligenceData?.score || overview.confidence * 100} 
                className="h-3"
              />
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {(mergedIntelligenceData?.score || overview.confidence * 100) >= 80 ? 'Excellent' :
                 (mergedIntelligenceData?.score || overview.confidence * 100) >= 60 ? 'Good' :
                 (mergedIntelligenceData?.score || overview.confidence * 100) >= 40 ? 'Fair' : 'Needs Improvement'}
              </div>
              <div className="text-xs text-gray-500">
                {mergedIntelligenceData?.insights?.length || overview.aiInsights.length} insights found
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Critical Issues</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {mergedIntelligenceData?.insights?.filter(i => i.importance === 'CRITICAL').length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Opportunities</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {mergedIntelligenceData?.insights?.filter(i => i.type === 'OPPORTUNITY').length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">High-Value Visitors</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {visitorProfiles.filter(v => v.conversionProbability > 0.7).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Actionable Items</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {mergedIntelligenceData?.insights?.filter(i => i.actionable).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Top AI Recommendations</CardTitle>
              <CardDescription>
                Prioritized actions to improve your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(mergedIntelligenceData?.recommendations || []).slice(0, 5).map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{recommendation}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {(mergedIntelligenceData?.insights || []).map((insight) => (
            <Card key={insight.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getImportanceColor(insight.importance) as any}>
                      {insight.importance}
                    </Badge>
                    <Badge variant="outline">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                <CardDescription>{insight.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {insight.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommendations:</h4>
                    <ul className="space-y-1">
                      {insight.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {insight.metrics && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Metrics:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(insight.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4">
          <div className="grid gap-4">
            {visitorProfiles.slice(0, 10).map((visitor) => (
              <Card key={visitor.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Visitor {visitor.id.slice(-8)}</div>
                        <div className="text-sm text-gray-600">{visitor.behaviorPattern}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getEngagementColor(visitor.engagementLevel)}`}>
                        {visitor.engagementLevel} Engagement
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {(visitor.conversionProbability * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Conversion Probability</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium mb-1">Segments:</div>
                      <div className="flex flex-wrap gap-1">
                        {visitor.segments.map((segment, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {segment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Recommended Actions:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {visitor.recommendedActions.slice(0, 2).map((action, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4">
            {(mergedIntelligenceData?.predictions || []).map((prediction, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{prediction.metric}</div>
                        <div className="text-sm text-gray-600">{prediction.timeframe} forecast</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {typeof prediction.prediction === 'number' 
                          ? prediction.prediction.toLocaleString()
                          : prediction.prediction
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {prediction.confidence}% confidence
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={prediction.trend === 'INCREASING' ? 'default' : 
                              prediction.trend === 'DECREASING' ? 'destructive' : 'outline'}
                    >
                      {prediction.trend === 'INCREASING' && <TrendingUp className="w-3 h-3 mr-1" />}
                      {prediction.trend === 'DECREASING' && <TrendingDown className="w-3 h-3 mr-1" />}
                      {prediction.trend}
                    </Badge>
                    <span className="text-sm text-gray-600">trend</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}