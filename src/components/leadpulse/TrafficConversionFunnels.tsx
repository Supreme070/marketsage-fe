'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingDown,
  TrendingUp,
  Users,
  Target,
  ArrowDown,
  ArrowRight,
  Funnel,
  AlertTriangle,
  CheckCircle,
  Clock,
  MousePointer,
  Eye,
  FileText,
  Zap,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';

interface FunnelStep {
  id: string;
  name: string;
  description: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeSpent: number;
  topSources: string[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

interface ConversionFunnel {
  id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  avgTimeToConvert: number;
  lastUpdated: string;
}

interface FunnelInsight {
  id: string;
  type: 'bottleneck' | 'opportunity' | 'success' | 'optimization';
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  affectedStep: string;
  metrics: {
    potential_improvement: number;
    affected_visitors: number;
  };
}

interface TrafficSource {
  source: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  change: number;
}

interface TrafficConversionFunnelsProps {
  className?: string;
}

export default function TrafficConversionFunnels({ className }: TrafficConversionFunnelsProps) {
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [insights, setInsights] = useState<FunnelInsight[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<ConversionFunnel | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch funnel data
  useEffect(() => {
    fetchFunnelData();
    const interval = setInterval(fetchFunnelData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchFunnelData = async () => {
    try {
      const [funnelsResponse, insightsResponse, sourcesResponse] = await Promise.all([
        fetch(`/api/leadpulse/conversion-funnels?timeRange=${timeRange}`),
        fetch('/api/leadpulse/funnel-insights'),
        fetch(`/api/leadpulse/traffic-sources?timeRange=${timeRange}`)
      ]);

      // Use mock data for demo
      const mockFunnels = generateMockFunnels();
      setFunnels(mockFunnels);
      setInsights(generateMockInsights());
      setTrafficSources(generateMockTrafficSources());
      
      if (mockFunnels.length > 0 && !selectedFunnel) {
        setSelectedFunnel(mockFunnels[0]);
      }
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      const mockFunnels = generateMockFunnels();
      setFunnels(mockFunnels);
      setInsights(generateMockInsights());
      setTrafficSources(generateMockTrafficSources());
      
      if (mockFunnels.length > 0) {
        setSelectedFunnel(mockFunnels[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get insight color
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'bottleneck': return 'border-red-200 bg-red-50 text-red-800';
      case 'opportunity': return 'border-green-200 bg-green-50 text-green-800';
      case 'success': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'optimization': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  // Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'bottleneck': return AlertTriangle;
      case 'opportunity': return Target;
      case 'success': return CheckCircle;
      case 'optimization': return Zap;
      default: return Activity;
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Mock data generators
  const generateMockFunnels = (): ConversionFunnel[] => {
    return [
      {
        id: 'main_funnel',
        name: 'Main Conversion Funnel',
        description: 'Primary visitor-to-customer journey',
        steps: [
          {
            id: 'step_1',
            name: 'Landing Page Visit',
            description: 'Visitors arrive on homepage or landing pages',
            visitors: 1500,
            conversions: 1200,
            conversionRate: 80,
            dropoffRate: 20,
            avgTimeSpent: 45,
            topSources: ['Google Organic', 'Direct', 'Social Media'],
            deviceBreakdown: { desktop: 55, mobile: 35, tablet: 10 }
          },
          {
            id: 'step_2',
            name: 'Product/Solution View',
            description: 'Visitors explore solutions or product pages',
            visitors: 1200,
            conversions: 720,
            conversionRate: 60,
            dropoffRate: 40,
            avgTimeSpent: 120,
            topSources: ['Google Organic', 'Direct', 'Referral'],
            deviceBreakdown: { desktop: 65, mobile: 28, tablet: 7 }
          },
          {
            id: 'step_3',
            name: 'Pricing Page',
            description: 'Visitors check pricing information',
            visitors: 720,
            conversions: 432,
            conversionRate: 60,
            dropoffRate: 40,
            avgTimeSpent: 180,
            topSources: ['Google Organic', 'Direct', 'Email'],
            deviceBreakdown: { desktop: 70, mobile: 25, tablet: 5 }
          },
          {
            id: 'step_4',
            name: 'Contact/Demo Form',
            description: 'Visitors fill out contact or demo request form',
            visitors: 432,
            conversions: 259,
            conversionRate: 60,
            dropoffRate: 40,
            avgTimeSpent: 300,
            topSources: ['Direct', 'Google Organic', 'Email'],
            deviceBreakdown: { desktop: 75, mobile: 20, tablet: 5 }
          },
          {
            id: 'step_5',
            name: 'Conversion',
            description: 'Successful conversion to lead/customer',
            visitors: 259,
            conversions: 259,
            conversionRate: 100,
            dropoffRate: 0,
            avgTimeSpent: 0,
            topSources: ['Direct', 'Google Organic', 'Email'],
            deviceBreakdown: { desktop: 80, mobile: 15, tablet: 5 }
          }
        ],
        totalVisitors: 1500,
        totalConversions: 259,
        overallConversionRate: 17.3,
        avgTimeToConvert: 645,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mobile_funnel',
        name: 'Mobile-Optimized Funnel',
        description: 'Conversion path optimized for mobile users',
        steps: [
          {
            id: 'mobile_step_1',
            name: 'Mobile Landing',
            description: 'Mobile-specific landing page',
            visitors: 800,
            conversions: 680,
            conversionRate: 85,
            dropoffRate: 15,
            avgTimeSpent: 35,
            topSources: ['Google Ads', 'Social Media', 'Direct'],
            deviceBreakdown: { desktop: 0, mobile: 90, tablet: 10 }
          },
          {
            id: 'mobile_step_2',
            name: 'Quick Feature View',
            description: 'Simplified feature overview for mobile',
            visitors: 680,
            conversions: 408,
            conversionRate: 60,
            dropoffRate: 40,
            avgTimeSpent: 90,
            topSources: ['Google Ads', 'Social Media', 'Direct'],
            deviceBreakdown: { desktop: 0, mobile: 92, tablet: 8 }
          },
          {
            id: 'mobile_step_3',
            name: 'Mobile Contact Form',
            description: 'Streamlined mobile contact form',
            visitors: 408,
            conversions: 163,
            conversionRate: 40,
            dropoffRate: 60,
            avgTimeSpent: 180,
            topSources: ['Google Ads', 'Social Media', 'WhatsApp'],
            deviceBreakdown: { desktop: 0, mobile: 95, tablet: 5 }
          }
        ],
        totalVisitors: 800,
        totalConversions: 163,
        overallConversionRate: 20.4,
        avgTimeToConvert: 305,
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  const generateMockInsights = (): FunnelInsight[] => {
    return [
      {
        id: 'insight_1',
        type: 'bottleneck',
        title: 'Pricing Page Drop-off',
        description: 'High drop-off rate (40%) on pricing page indicates potential pricing concerns or lack of value clarity.',
        recommendation: 'Add social proof, testimonials, and clearer value proposition on pricing page.',
        impact: 'high',
        affectedStep: 'step_3',
        metrics: {
          potential_improvement: 15,
          affected_visitors: 288
        }
      },
      {
        id: 'insight_2',
        type: 'opportunity',
        title: 'Mobile Conversion Success',
        description: 'Mobile-optimized funnel shows 18% higher conversion rate than main funnel.',
        recommendation: 'Apply mobile optimization strategies to desktop experience.',
        impact: 'medium',
        affectedStep: 'step_2',
        metrics: {
          potential_improvement: 12,
          affected_visitors: 480
        }
      },
      {
        id: 'insight_3',
        type: 'optimization',
        title: 'Form Completion Rate',
        description: 'Contact form has 60% completion rate, which can be improved with progressive disclosure.',
        recommendation: 'Implement multi-step form with progress indicator.',
        impact: 'medium',
        affectedStep: 'step_4',
        metrics: {
          potential_improvement: 20,
          affected_visitors: 173
        }
      },
      {
        id: 'insight_4',
        type: 'success',
        title: 'Strong Landing Page Performance',
        description: 'Landing page maintains 80% progression rate, indicating effective initial engagement.',
        recommendation: 'Replicate successful elements across other entry points.',
        impact: 'low',
        affectedStep: 'step_1',
        metrics: {
          potential_improvement: 5,
          affected_visitors: 300
        }
      }
    ];
  };

  const generateMockTrafficSources = (): TrafficSource[] => {
    return [
      { source: 'Google Organic', visitors: 650, conversions: 124, conversionRate: 19.1, change: 12 },
      { source: 'Direct', visitors: 420, conversions: 92, conversionRate: 21.9, change: 8 },
      { source: 'Google Ads', visitors: 380, conversions: 68, conversionRate: 17.9, change: -5 },
      { source: 'Social Media', visitors: 290, conversions: 41, conversionRate: 14.1, change: 15 },
      { source: 'Email', visitors: 180, conversions: 47, conversionRate: 26.1, change: 22 },
      { source: 'Referral', visitors: 150, conversions: 23, conversionRate: 15.3, change: -2 },
      { source: 'WhatsApp', visitors: 130, conversions: 19, conversionRate: 14.6, change: 35 }
    ];
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Funnel className="w-5 h-5 animate-pulse" />
            <span>Loading conversion funnel data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Funnel className="w-5 h-5" />
              Traffic Conversion Funnels
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={timeRange === '24h' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('24h')}
                >
                  24h
                </Button>
                <Button
                  variant={timeRange === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('7d')}
                >
                  7d
                </Button>
                <Button
                  variant={timeRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('30d')}
                >
                  30d
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={fetchFunnelData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Visitors</p>
                <p className="text-xl font-semibold">
                  {funnels.reduce((sum, f) => sum + f.totalVisitors, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-xl font-semibold">
                  {funnels.reduce((sum, f) => sum + f.totalConversions, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Conversion Rate</p>
                <p className="text-xl font-semibold">
                  {(funnels.reduce((sum, f) => sum + f.overallConversionRate, 0) / funnels.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Time to Convert</p>
                <p className="text-xl font-semibold">
                  {formatTime(Math.round(funnels.reduce((sum, f) => sum + f.avgTimeToConvert, 0) / funnels.length))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Funnel Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversion Funnels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnels.map((funnel) => (
                <div
                  key={funnel.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedFunnel?.id === funnel.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFunnel(funnel)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{funnel.name}</h3>
                    <Badge variant="outline">{funnel.steps.length} steps</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{funnel.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Visitors:</span>
                      <span className="font-medium ml-1">{funnel.totalVisitors}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Conversions:</span>
                      <span className="font-medium ml-1">{funnel.totalConversions}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Rate:</span>
                      <span className="font-medium ml-1 text-green-600">{funnel.overallConversionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedFunnel ? (
                <>
                  <Funnel className="w-5 h-5" />
                  {selectedFunnel.name}
                </>
              ) : (
                'Select a funnel to view details'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFunnel ? (
              <div className="space-y-4">
                {selectedFunnel.steps.map((step, index) => {
                  const isLast = index === selectedFunnel.steps.length - 1;
                  const widthPercentage = (step.visitors / selectedFunnel.totalVisitors) * 100;
                  
                  return (
                    <div key={step.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium">{step.name}</h3>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{step.visitors.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">visitors</div>
                        </div>
                      </div>
                      
                      {/* Funnel Bar */}
                      <div className="relative">
                        <div className="bg-gray-200 rounded-lg h-8 flex items-center">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg h-full flex items-center justify-between px-4 text-white text-sm font-medium"
                            style={{ width: `${widthPercentage}%` }}
                          >
                            <span>{step.visitors.toLocaleString()} visitors</span>
                            {!isLast && (
                              <span>{step.conversionRate}% continue</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Step Details */}
                      <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">Avg Time:</span>
                          </div>
                          <p className="font-medium">{formatTime(step.avgTimeSpent)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Target className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">Conversion:</span>
                          </div>
                          <p className="font-medium text-green-600">{step.conversionRate}%</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingDown className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">Drop-off:</span>
                          </div>
                          <p className="font-medium text-red-600">{step.dropoffRate}%</p>
                        </div>
                      </div>
                      
                      {/* Arrow between steps */}
                      {!isLast && (
                        <div className="flex justify-center">
                          <ArrowDown className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <Funnel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a funnel from the left to view its conversion flow</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Traffic Sources Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trafficSources.map((source) => (
              <div key={source.source} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{source.source}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    {source.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={source.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(source.change)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Visitors:</span>
                    <span className="font-medium">{source.visitors.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conversions:</span>
                    <span className="font-medium">{source.conversions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium text-green-600">{source.conversionRate}%</span>
                  </div>
                  <Progress value={source.conversionRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI Funnel Optimization Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div key={insight.id} className={`p-4 border-2 rounded-lg ${getInsightColor(insight.type)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" />
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                      {insight.impact}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">{insight.description}</p>
                  <div className="bg-white/50 p-3 rounded text-sm mb-3">
                    <p className="font-medium text-xs mb-1">💡 Recommendation:</p>
                    <p>{insight.recommendation}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Potential Improvement:</span>
                      <span className="font-medium ml-1 text-green-600">+{insight.metrics.potential_improvement}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Affected Visitors:</span>
                      <span className="font-medium ml-1">{insight.metrics.affected_visitors}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}