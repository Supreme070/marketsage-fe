'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown,
  TrendingUp,
  Users,
  Target,
  Filter,
  ArrowDown,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  MousePointer,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Layers,
  Download
} from 'lucide-react';

interface FunnelStep {
  id: string;
  name: string;
  description: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  averageTime: number;
  dropOffRate: number;
  previousStepId?: string;
  nextStepId?: string;
  stepType: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase';
  pageUrls: string[];
  events: string[];
}

interface FunnelInsight {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity' | 'success';
  stepId: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  potentialLift: number;
}

interface ConversionFunnelData {
  funnelId: string;
  name: string;
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  steps: FunnelStep[];
  insights: FunnelInsight[];
  timeRange: string;
  lastUpdated: string;
}

interface ConversionFunnelAnalysisProps {
  funnelData?: ConversionFunnelData[];
  isLoading?: boolean;
}

const ConversionFunnelAnalysis = React.memo<ConversionFunnelAnalysisProps>(({ 
  funnelData = [], 
  isLoading 
}) => {
  const [selectedFunnel, setSelectedFunnel] = useState<ConversionFunnelData | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'insights'>('overview');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Demo funnel data
  const demoFunnelData: ConversionFunnelData[] = useMemo(() => [
    {
      funnelId: 'main-funnel',
      name: 'Main Conversion Funnel',
      totalVisitors: 10000,
      totalConversions: 420,
      overallConversionRate: 4.2,
      timeRange: '7 days',
      lastUpdated: '2024-07-18T22:30:00Z',
      steps: [
        {
          id: 'step-1',
          name: 'Landing Page Visit',
          description: 'Visitors arrive at homepage or campaign landing pages',
          visitors: 10000,
          conversions: 7500,
          conversionRate: 75.0,
          averageTime: 45,
          dropOffRate: 25.0,
          stepType: 'awareness',
          pageUrls: ['/', '/landing/campaign-1', '/landing/social'],
          events: ['page_view', 'session_start']
        },
        {
          id: 'step-2',
          name: 'Feature Exploration',
          description: 'Users explore features and product pages',
          visitors: 7500,
          conversions: 4200,
          conversionRate: 56.0,
          averageTime: 180,
          dropOffRate: 44.0,
          stepType: 'interest',
          pageUrls: ['/features', '/product', '/demo'],
          events: ['feature_view', 'demo_request', 'video_play'],
          previousStepId: 'step-1'
        },
        {
          id: 'step-3',
          name: 'Pricing Review',
          description: 'Users check pricing and plans',
          visitors: 4200,
          conversions: 2100,
          conversionRate: 50.0,
          averageTime: 120,
          dropOffRate: 50.0,
          stepType: 'consideration',
          pageUrls: ['/pricing', '/plans', '/comparison'],
          events: ['pricing_view', 'plan_compare', 'calculator_use'],
          previousStepId: 'step-2'
        },
        {
          id: 'step-4',
          name: 'Trial Signup',
          description: 'Users start free trial or create account',
          visitors: 2100,
          conversions: 1260,
          conversionRate: 60.0,
          averageTime: 240,
          dropOffRate: 40.0,
          stepType: 'intent',
          pageUrls: ['/signup', '/trial', '/register'],
          events: ['signup_start', 'form_submit', 'email_verify'],
          previousStepId: 'step-3'
        },
        {
          id: 'step-5',
          name: 'Product Usage',
          description: 'Users actively use the product during trial',
          visitors: 1260,
          conversions: 630,
          conversionRate: 50.0,
          averageTime: 1800,
          dropOffRate: 50.0,
          stepType: 'evaluation',
          pageUrls: ['/dashboard', '/campaigns', '/analytics'],
          events: ['first_campaign', 'data_import', 'feature_use'],
          previousStepId: 'step-4'
        },
        {
          id: 'step-6',
          name: 'Purchase Decision',
          description: 'Users convert to paid subscription',
          visitors: 630,
          conversions: 420,
          conversionRate: 66.7,
          averageTime: 300,
          dropOffRate: 33.3,
          stepType: 'purchase',
          pageUrls: ['/checkout', '/payment', '/upgrade'],
          events: ['purchase_start', 'payment_success', 'subscription_active'],
          previousStepId: 'step-5'
        }
      ],
      insights: [
        {
          id: 'insight-1',
          type: 'warning',
          stepId: 'step-2',
          title: 'High Drop-off at Feature Exploration',
          description: '44% of users drop off during feature exploration phase',
          impact: 'high',
          recommendation: 'Improve feature onboarding and add interactive demos',
          potentialLift: 15.2
        },
        {
          id: 'insight-2',
          type: 'opportunity',
          stepId: 'step-3',
          title: 'Pricing Page Optimization',
          description: 'Users spend average 2 minutes on pricing but 50% still drop off',
          impact: 'medium',
          recommendation: 'Add social proof, testimonials, and clearer value propositions',
          potentialLift: 8.5
        },
        {
          id: 'insight-3',
          type: 'success',
          stepId: 'step-6',
          title: 'Strong Purchase Conversion',
          description: 'High conversion rate from trial to paid (66.7%)',
          impact: 'low',
          recommendation: 'Maintain current checkout experience and expand successful patterns',
          potentialLift: 2.1
        },
        {
          id: 'insight-4',
          type: 'optimization',
          stepId: 'step-5',
          title: 'Product Adoption Gap',
          description: 'Only 50% of trial users actively engage with core features',
          impact: 'high',
          recommendation: 'Implement guided onboarding and feature activation campaigns',
          potentialLift: 12.8
        }
      ]
    },
    {
      funnelId: 'mobile-funnel',
      name: 'Mobile Conversion Funnel',
      totalVisitors: 3500,
      totalConversions: 105,
      overallConversionRate: 3.0,
      timeRange: '7 days',
      lastUpdated: '2024-07-18T22:30:00Z',
      steps: [
        {
          id: 'mobile-1',
          name: 'Mobile Landing',
          description: 'Mobile visitors arrive',
          visitors: 3500,
          conversions: 2450,
          conversionRate: 70.0,
          averageTime: 30,
          dropOffRate: 30.0,
          stepType: 'awareness',
          pageUrls: ['/', '/m/landing'],
          events: ['mobile_page_view']
        },
        {
          id: 'mobile-2',
          name: 'Mobile Features',
          description: 'Mobile feature exploration',
          visitors: 2450,
          conversions: 980,
          conversionRate: 40.0,
          averageTime: 90,
          dropOffRate: 60.0,
          stepType: 'interest',
          pageUrls: ['/m/features', '/m/demo'],
          events: ['mobile_feature_view'],
          previousStepId: 'mobile-1'
        },
        {
          id: 'mobile-3',
          name: 'Mobile Signup',
          description: 'Mobile registration',
          visitors: 980,
          conversions: 294,
          conversionRate: 30.0,
          averageTime: 180,
          dropOffRate: 70.0,
          stepType: 'intent',
          pageUrls: ['/m/signup'],
          events: ['mobile_signup'],
          previousStepId: 'mobile-2'
        },
        {
          id: 'mobile-4',
          name: 'Mobile Purchase',
          description: 'Mobile conversion',
          visitors: 294,
          conversions: 105,
          conversionRate: 35.7,
          averageTime: 240,
          dropOffRate: 64.3,
          stepType: 'purchase',
          pageUrls: ['/m/checkout'],
          events: ['mobile_purchase'],
          previousStepId: 'mobile-3'
        }
      ],
      insights: [
        {
          id: 'mobile-insight-1',
          type: 'warning',
          stepId: 'mobile-2',
          title: 'Mobile Feature Drop-off',
          description: 'Extremely high mobile drop-off at features (60%)',
          impact: 'high',
          recommendation: 'Optimize mobile feature presentation and reduce load times',
          potentialLift: 25.0
        }
      ]
    }
  ], []);

  const activeFunnelData = funnelData.length > 0 ? funnelData : demoFunnelData;
  const currentFunnel = selectedFunnel || activeFunnelData[0];

  // Calculate funnel statistics
  const funnelStats = useMemo(() => {
    if (!currentFunnel) return null;

    const steps = currentFunnel.steps;
    const totalDropOffs = steps.reduce((sum, step) => sum + (step.visitors - step.conversions), 0);
    const biggestDropOff = steps.reduce((max, step) => 
      step.dropOffRate > max.dropOffRate ? step : max
    );
    const bestConversion = steps.reduce((max, step) => 
      step.conversionRate > max.conversionRate ? step : max
    );
    const averageTime = steps.reduce((sum, step) => sum + step.averageTime, 0) / steps.length;

    return {
      totalDropOffs,
      biggestDropOff,
      bestConversion,
      averageTime: Math.round(averageTime),
      criticalInsights: currentFunnel.insights.filter(i => i.impact === 'high').length
    };
  }, [currentFunnel]);

  const getStepTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'awareness': return 'bg-blue-500';
      case 'interest': return 'bg-green-500';
      case 'consideration': return 'bg-yellow-500';
      case 'intent': return 'bg-orange-500';
      case 'evaluation': return 'bg-purple-500';
      case 'purchase': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getInsightIcon = useCallback((type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  }, []);

  const getInsightColor = useCallback((type: string) => {
    switch (type) {
      case 'warning': return 'text-red-600 bg-red-50 border-red-200';
      case 'opportunity': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'optimization': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Conversion Funnel Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce delay-150"></div>
              <span className="ml-2 text-gray-500">Loading funnel data...</span>
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
                <Layers className="h-5 w-5" />
                Conversion Funnel Analysis
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Analyze customer conversion paths and optimize drop-off points
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedFunnel?.funnelId || activeFunnelData[0]?.funnelId}
                onChange={(e) => setSelectedFunnel(activeFunnelData.find(f => f.funnelId === e.target.value) || null)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {activeFunnelData.map(funnel => (
                  <option key={funnel.funnelId} value={funnel.funnelId}>
                    {funnel.name}
                  </option>
                ))}
              </select>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <div className="text-lg font-semibold">{currentFunnel?.totalVisitors.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Visitors</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Target className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <div className="text-lg font-semibold">{currentFunnel?.totalConversions.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Conversions</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <div className="text-lg font-semibold">{currentFunnel?.overallConversionRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Conversion Rate</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <TrendingDown className="h-6 w-6 mx-auto text-red-500 mb-2" />
              <div className="text-lg font-semibold">{funnelStats?.totalDropOffs.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Drop-offs</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto text-orange-500 mb-2" />
              <div className="text-lg font-semibold">{formatDuration(funnelStats?.averageTime || 0)}</div>
              <div className="text-xs text-gray-500">Avg Time</div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 mb-6">
            {['overview', 'detailed', 'insights'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funnel Visualization */}
      {viewMode === 'overview' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Funnel Flow Visualization</h3>
              
              {/* Funnel Steps */}
              <div className="space-y-4">
                {currentFunnel?.steps.map((step, index) => {
                  const stepWidth = (step.visitors / currentFunnel.totalVisitors) * 100;
                  const conversionWidth = (step.conversions / step.visitors) * 100;
                  
                  return (
                    <div key={step.id} className="relative">
                      <div className="flex items-center gap-4">
                        {/* Step Number */}
                        <div className={`w-8 h-8 rounded-full ${getStepTypeColor(step.stepType)} flex items-center justify-center text-white font-semibold text-sm`}>
                          {index + 1}
                        </div>
                        
                        {/* Step Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{step.name}</h4>
                              <p className="text-sm text-gray-600">{step.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{step.visitors.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">visitors</div>
                            </div>
                          </div>
                          
                          {/* Funnel Bar */}
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-lg h-12 overflow-hidden">
                              <div 
                                className="h-full bg-blue-100 rounded-lg flex items-center transition-all duration-500"
                                style={{ width: `${stepWidth}%` }}
                              >
                                <div 
                                  className={`h-full ${getStepTypeColor(step.stepType)} rounded-lg flex items-center justify-center text-white font-medium transition-all duration-500`}
                                  style={{ width: `${conversionWidth}%` }}
                                >
                                  <span className="text-sm">
                                    {step.conversionRate.toFixed(1)}% convert
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Drop-off indicator */}
                            {step.dropOffRate > 0 && (
                              <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
                                <div className="flex items-center gap-1 text-red-500">
                                  <TrendingDown className="h-4 w-4" />
                                  <span className="text-sm font-medium">{step.dropOffRate.toFixed(1)}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Step Metrics */}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              {step.conversions.toLocaleString()} converted
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(step.averageTime)} avg time
                            </span>
                            <Badge variant="outline" className="capitalize">
                              {step.stepType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Arrow to next step */}
                      {index < currentFunnel.steps.length - 1 && (
                        <div className="flex justify-center my-2">
                          <ArrowDown className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Step Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentFunnel?.steps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${getStepTypeColor(step.stepType)} flex items-center justify-center text-white text-xs font-semibold`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{step.name}</span>
                      </div>
                      <Badge 
                        variant={step.conversionRate > 60 ? "default" : step.conversionRate > 40 ? "secondary" : "destructive"}
                      >
                        {step.conversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Visitors:</span>
                        <div className="font-semibold">{step.visitors.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Conversions:</span>
                        <div className="font-semibold">{step.conversions.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Time:</span>
                        <div className="font-semibold">{formatDuration(step.averageTime)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Drop-off:</span>
                        <div className={`font-semibold ${step.dropOffRate > 50 ? 'text-red-600' : 'text-gray-900'}`}>
                          {step.dropOffRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Key Pages:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {step.pageUrls.slice(0, 2).map(url => (
                          <Badge key={url} variant="outline" className="text-xs">
                            {url}
                          </Badge>
                        ))}
                        {step.pageUrls.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{step.pageUrls.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Biggest Challenges</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-medium text-red-900">Highest Drop-off</div>
                        <div className="text-sm text-red-700">{funnelStats?.biggestDropOff.name}</div>
                      </div>
                      <div className="text-lg font-semibold text-red-600">
                        {funnelStats?.biggestDropOff.dropOffRate.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-medium text-green-900">Best Performance</div>
                        <div className="text-sm text-green-700">{funnelStats?.bestConversion.name}</div>
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {funnelStats?.bestConversion.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Critical Insights</h4>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                    <div className="text-lg font-semibold">{funnelStats?.criticalInsights}</div>
                    <div className="text-sm text-gray-600">High-impact issues found</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Tab */}
      {viewMode === 'insights' && (
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights & Recommendations</CardTitle>
            <p className="text-sm text-gray-600">
              Automated analysis of your funnel performance with actionable recommendations
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentFunnel?.insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            +{insight.potentialLift.toFixed(1)}% lift
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3">{insight.description}</p>
                      
                      <div className="bg-white bg-opacity-50 rounded p-3">
                        <div className="text-sm font-medium mb-1">💡 Recommendation:</div>
                        <p className="text-sm">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

ConversionFunnelAnalysis.displayName = 'ConversionFunnelAnalysis';

export { ConversionFunnelAnalysis };
export default ConversionFunnelAnalysis;