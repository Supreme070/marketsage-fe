'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Target,
  Users,
  Eye,
  Clock,
  BarChart3,
  PieChart,
  Filter,
  Download,
  RefreshCw,
  Lightbulb,
  Bot,
  Activity,
  MousePointer,
  Globe,
  Star,
  ArrowRight,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation' | 'opportunity' | 'alert';
  category: 'traffic' | 'engagement' | 'conversion' | 'behavior' | 'performance' | 'revenue';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high';
  timeFrame: string;
  metrics: {
    current: number;
    previous: number;
    change: number;
    unit: string;
  };
  recommendation: {
    action: string;
    effort: 'low' | 'medium' | 'high';
    expectedImpact: string;
    timeline: string;
  };
  relatedData: {
    pageUrls?: string[];
    segments?: string[];
    campaigns?: string[];
    timeRange?: string;
  };
  generatedAt: string;
  aiModel: string;
}

interface PredictiveModel {
  id: string;
  name: string;
  type: 'traffic' | 'conversion' | 'churn' | 'ltv' | 'engagement';
  accuracy: number;
  lastTrained: string;
  predictions: {
    metric: string;
    current: number;
    predicted: number;
    timeframe: string;
    confidence: number;
  }[];
  status: 'active' | 'training' | 'error';
}

interface AIInsightsDashboardProps {
  insights?: AIInsight[];
  models?: PredictiveModel[];
  isLoading?: boolean;
}

const AIInsightsDashboard = React.memo<AIInsightsDashboardProps>(({ 
  insights = [], 
  models = [],
  isLoading 
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'models'>('insights');
  const [filterCategory, setFilterCategory] = useState<'all' | 'traffic' | 'engagement' | 'conversion' | 'behavior' | 'performance' | 'revenue'>('all');
  const [filterImpact, setFilterImpact] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'impact' | 'urgency' | 'recent'>('confidence');

  // Demo AI insights data
  const demoInsights: AIInsight[] = useMemo(() => [
    {
      id: 'insight-1',
      type: 'trend',
      category: 'traffic',
      title: 'Significant Traffic Spike from Lagos',
      description: 'Detected 340% increase in organic traffic from Lagos region in the last 3 days',
      confidence: 92,
      impact: 'high',
      urgency: 'medium',
      timeFrame: 'Last 3 days',
      metrics: {
        current: 2450,
        previous: 560,
        change: 337.5,
        unit: 'visitors'
      },
      recommendation: {
        action: 'Create Lagos-specific landing page and targeted campaigns',
        effort: 'medium',
        expectedImpact: '+25% conversion rate from Lagos traffic',
        timeline: '1-2 weeks'
      },
      relatedData: {
        pageUrls: ['/features', '/pricing', '/signup'],
        segments: ['Lagos-Visitors', 'Nigeria-Enterprise'],
        timeRange: '72 hours'
      },
      generatedAt: '2024-07-18T20:30:00Z',
      aiModel: 'MarketSage-TrafficAnalyzer-v2.1'
    },
    {
      id: 'insight-2',
      type: 'anomaly',
      category: 'engagement',
      title: 'Unusual Session Duration Pattern',
      description: 'Mobile users showing 60% longer session durations than desktop users',
      confidence: 87,
      impact: 'medium',
      urgency: 'low',
      timeFrame: 'Last 7 days',
      metrics: {
        current: 4.2,
        previous: 2.6,
        change: 61.5,
        unit: 'minutes'
      },
      recommendation: {
        action: 'Optimize desktop user experience to match mobile engagement',
        effort: 'high',
        expectedImpact: '+40% desktop engagement score',
        timeline: '3-4 weeks'
      },
      relatedData: {
        pageUrls: ['/dashboard', '/analytics', '/campaigns'],
        segments: ['Mobile-Users', 'Desktop-Users']
      },
      generatedAt: '2024-07-18T19:45:00Z',
      aiModel: 'MarketSage-EngagementAnalyzer-v1.8'
    },
    {
      id: 'insight-3',
      type: 'prediction',
      category: 'conversion',
      title: 'Conversion Rate Decline Predicted',
      description: 'ML model predicts 15% conversion rate drop in next 2 weeks without intervention',
      confidence: 84,
      impact: 'critical',
      urgency: 'high',
      timeFrame: 'Next 14 days',
      metrics: {
        current: 4.2,
        previous: 4.9,
        change: -14.3,
        unit: 'percent'
      },
      recommendation: {
        action: 'Implement urgency-based CTAs and optimize checkout flow',
        effort: 'medium',
        expectedImpact: 'Prevent predicted decline, potential +8% lift',
        timeline: '3-5 days'
      },
      relatedData: {
        pageUrls: ['/checkout', '/pricing', '/trial'],
        campaigns: ['Summer-Promo', 'Enterprise-Trial']
      },
      generatedAt: '2024-07-18T21:15:00Z',
      aiModel: 'MarketSage-ConversionPredictor-v3.2'
    },
    {
      id: 'insight-4',
      type: 'opportunity',
      category: 'revenue',
      title: 'High-Value Segment Identified',
      description: 'Nigerian fintech companies show 3x higher LTV potential',
      confidence: 91,
      impact: 'high',
      urgency: 'medium',
      timeFrame: 'Last 30 days',
      metrics: {
        current: 2400,
        previous: 800,
        change: 200,
        unit: 'USD LTV'
      },
      recommendation: {
        action: 'Create dedicated fintech onboarding flow and pricing tier',
        effort: 'high',
        expectedImpact: '+180% revenue from fintech segment',
        timeline: '4-6 weeks'
      },
      relatedData: {
        segments: ['Nigeria-Fintech', 'Enterprise-Tier'],
        campaigns: ['Fintech-Outreach']
      },
      generatedAt: '2024-07-18T18:20:00Z',
      aiModel: 'MarketSage-RevenueOptimizer-v2.5'
    },
    {
      id: 'insight-5',
      type: 'recommendation',
      category: 'behavior',
      title: 'Feature Adoption Optimization',
      description: 'Users who engage with analytics within first week show 75% higher retention',
      confidence: 89,
      impact: 'medium',
      urgency: 'low',
      timeFrame: 'Historical analysis',
      metrics: {
        current: 75,
        previous: 43,
        change: 74.4,
        unit: 'percent retention'
      },
      recommendation: {
        action: 'Add analytics tutorial to onboarding and gamify first interaction',
        effort: 'medium',
        expectedImpact: '+30% overall user retention',
        timeline: '2-3 weeks'
      },
      relatedData: {
        pageUrls: ['/onboarding', '/analytics', '/tutorial'],
        segments: ['New-Users', 'Trial-Users']
      },
      generatedAt: '2024-07-18T17:10:00Z',
      aiModel: 'MarketSage-BehaviorAnalyzer-v1.9'
    },
    {
      id: 'insight-6',
      type: 'alert',
      category: 'performance',
      title: 'Page Load Speed Impact',
      description: 'Pricing page load time increased by 2.3s, correlating with 28% bounce rate increase',
      confidence: 95,
      impact: 'critical',
      urgency: 'high',
      timeFrame: 'Last 48 hours',
      metrics: {
        current: 5.7,
        previous: 3.4,
        change: 67.6,
        unit: 'seconds'
      },
      recommendation: {
        action: 'Immediate performance optimization - compress images and optimize critical CSS',
        effort: 'low',
        expectedImpact: 'Restore bounce rate to baseline levels',
        timeline: '1-2 days'
      },
      relatedData: {
        pageUrls: ['/pricing'],
        timeRange: '48 hours'
      },
      generatedAt: '2024-07-18T22:00:00Z',
      aiModel: 'MarketSage-PerformanceMonitor-v1.4'
    }
  ], []);

  // Demo predictive models data
  const demoModels: PredictiveModel[] = useMemo(() => [
    {
      id: 'model-1',
      name: 'Traffic Volume Predictor',
      type: 'traffic',
      accuracy: 87.3,
      lastTrained: '2024-07-18T06:00:00Z',
      status: 'active',
      predictions: [
        {
          metric: 'Daily Visitors',
          current: 2450,
          predicted: 2890,
          timeframe: 'Next 7 days',
          confidence: 85
        },
        {
          metric: 'Weekly Growth',
          current: 12.5,
          predicted: 18.2,
          timeframe: 'Next 4 weeks',
          confidence: 78
        }
      ]
    },
    {
      id: 'model-2',
      name: 'Conversion Rate Predictor',
      type: 'conversion',
      accuracy: 91.8,
      lastTrained: '2024-07-18T12:00:00Z',
      status: 'active',
      predictions: [
        {
          metric: 'Overall Conversion Rate',
          current: 4.2,
          predicted: 3.6,
          timeframe: 'Next 14 days',
          confidence: 84
        },
        {
          metric: 'Mobile Conversion Rate',
          current: 3.1,
          predicted: 3.8,
          timeframe: 'Next 7 days',
          confidence: 89
        }
      ]
    },
    {
      id: 'model-3',
      name: 'Customer Churn Predictor',
      type: 'churn',
      accuracy: 83.2,
      lastTrained: '2024-07-17T18:00:00Z',
      status: 'training',
      predictions: [
        {
          metric: 'Monthly Churn Rate',
          current: 5.8,
          predicted: 7.2,
          timeframe: 'Next 30 days',
          confidence: 76
        }
      ]
    }
  ], []);

  const activeInsights = insights.length > 0 ? insights : demoInsights;
  const activeModels = models.length > 0 ? models : demoModels;

  // Filter and sort insights
  const filteredInsights = useMemo(() => {
    let filtered = activeInsights;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(insight => insight.category === filterCategory);
    }

    if (filterImpact !== 'all') {
      filtered = filtered.filter(insight => insight.impact === filterImpact);
    }

    // Sort insights
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'impact':
          const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'urgency':
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        case 'recent':
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [activeInsights, filterCategory, filterImpact, sortBy]);

  // Get insight type icon
  const getInsightIcon = useCallback((type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'prediction': return <Brain className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'opportunity': return <Star className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  }, []);

  // Get insight type color
  const getInsightColor = useCallback((type: string) => {
    switch (type) {
      case 'trend': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'anomaly': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'prediction': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'recommendation': return 'text-green-600 bg-green-50 border-green-200';
      case 'opportunity': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'alert': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  // Get impact badge variant
  const getImpactVariant = useCallback((impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'default' as const;
      case 'medium': return 'secondary' as const;
      case 'low': return 'outline' as const;
      default: return 'outline' as const;
    }
  }, []);

  // Format time ago
  const formatTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return `${Math.floor(diffHours / 168)}w ago`;
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-150"></div>
              <span className="ml-2 text-gray-500">Analyzing data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights Dashboard
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Machine learning-powered insights and predictions for your marketing performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { id: 'insights', label: 'Insights', icon: Lightbulb },
              { id: 'predictions', label: 'Predictions', icon: Brain },
              { id: 'models', label: 'Models', icon: Bot }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Insights Overview */}
          {activeTab === 'insights' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Brain className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <div className="text-lg font-semibold">{activeInsights.length}</div>
                <div className="text-xs text-gray-500">Total Insights</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 mx-auto text-red-500 mb-2" />
                <div className="text-lg font-semibold">
                  {activeInsights.filter(i => i.impact === 'critical' || i.urgency === 'high').length}
                </div>
                <div className="text-xs text-gray-500">High Priority</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <div className="text-lg font-semibold">
                  {Math.round(activeInsights.reduce((sum, i) => sum + i.confidence, 0) / activeInsights.length)}%
                </div>
                <div className="text-xs text-gray-500">Avg Confidence</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Zap className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                <div className="text-lg font-semibold">
                  {activeInsights.filter(i => i.type === 'opportunity').length}
                </div>
                <div className="text-xs text-gray-500">Opportunities</div>
              </div>
            </div>
          )}

          {/* Filters for insights */}
          {activeTab === 'insights' && (
            <div className="flex items-center gap-4 mb-6">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="traffic">Traffic</option>
                <option value="engagement">Engagement</option>
                <option value="conversion">Conversion</option>
                <option value="behavior">Behavior</option>
                <option value="performance">Performance</option>
                <option value="revenue">Revenue</option>
              </select>

              <select
                value={filterImpact}
                onChange={(e) => setFilterImpact(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Impact Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="confidence">Sort by Confidence</option>
                <option value="impact">Sort by Impact</option>
                <option value="urgency">Sort by Urgency</option>
                <option value="recent">Sort by Recent</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Tab Content */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInsights.map((insight) => (
            <Card key={insight.id} className={`border ${getInsightColor(insight.type)}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{insight.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={getImpactVariant(insight.impact)}>
                          {insight.impact}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confident
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4">{insight.description}</p>
                    
                    {/* Metrics */}
                    <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Current:</span>
                          <div className="font-semibold">
                            {insight.metrics.current.toLocaleString()} {insight.metrics.unit}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Previous:</span>
                          <div className="font-semibold">
                            {insight.metrics.previous.toLocaleString()} {insight.metrics.unit}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Change:</span>
                          <div className={`font-semibold flex items-center gap-1 ${
                            insight.metrics.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {insight.metrics.change > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(insight.metrics.change).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recommendation */}
                    <div className="bg-white bg-opacity-70 rounded-lg p-3 mb-4">
                      <div className="text-sm font-medium mb-1 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Recommendation:
                      </div>
                      <p className="text-sm mb-2">{insight.recommendation.action}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>Effort: {insight.recommendation.effort}</span>
                        <span>Timeline: {insight.recommendation.timeline}</span>
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        Expected: {insight.recommendation.expectedImpact}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="capitalize">{insight.category}</span>
                        <span>{insight.timeFrame}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(insight.generatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Predictions Tab Content */}
      {activeTab === 'predictions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeModels
            .filter(model => model.status === 'active')
            .map((model) => (
            <Card key={model.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{model.name}</span>
                  <Badge variant="default" className="capitalize">
                    {model.type}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {model.predictions.map((prediction, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{prediction.metric}</h4>
                        <Badge variant="outline">
                          {prediction.confidence}% confidence
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Current</span>
                          <div className="text-lg font-semibold">
                            {prediction.current.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Predicted</span>
                          <div className={`text-lg font-semibold flex items-center gap-1 ${
                            prediction.predicted > prediction.current ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {prediction.predicted > prediction.current ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {prediction.predicted.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Timeframe: {prediction.timeframe}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Models Tab Content */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeModels.map((model) => (
            <Card key={model.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{model.name}</span>
                  <Badge 
                    variant={model.status === 'active' ? 'default' : 
                            model.status === 'training' ? 'secondary' : 'destructive'}
                  >
                    {model.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Model Type</span>
                    <div className="font-semibold capitalize">{model.type}</div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500">Accuracy</span>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold">{model.accuracy}%</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${model.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500">Last Trained</span>
                    <div className="font-semibold">
                      {formatTimeAgo(model.lastTrained)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500">Active Predictions</span>
                    <div className="font-semibold">{model.predictions.length}</div>
                  </div>
                  
                  {model.status === 'active' && (
                    <button className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                      View Details
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

AIInsightsDashboard.displayName = 'AIInsightsDashboard';

export { AIInsightsDashboard };
export default AIInsightsDashboard;