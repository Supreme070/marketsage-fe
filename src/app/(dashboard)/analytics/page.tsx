"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, LineChart, Activity, 
  Users, Mail, MessageSquare, Phone, Calendar, Clock, Target, Zap,
  Filter, Download, Upload, RefreshCw, Settings, Eye, Share2, Star,
  Globe, MapPin, DollarSign, ShoppingCart, CreditCard, Percent,
  Brain, Sparkles, AlertTriangle, CheckCircle, XCircle, ArrowUpRight,
  ArrowDownRight, ChevronRight, ChevronDown, PlayCircle, PauseCircle,
  MoreHorizontal, Maximize2, Minimize2, Grid, List, Search, Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    conversionRate: number;
    campaignsSent: number;
    emailsSent: number;
    smsSent: number;
    whatsappSent: number;
  };
  trends: {
    period: string;
    users: number;
    revenue: number;
    conversions: number;
    engagement: number;
  }[];
  channels: {
    name: string;
    users: number;
    revenue: number;
    conversions: number;
    roi: number;
    growth: number;
  }[];
  campaigns: {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'whatsapp';
    status: 'active' | 'completed' | 'paused';
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
    roi: number;
  }[];
  geography: {
    country: string;
    users: number;
    revenue: number;
    growth: number;
  }[];
  devices: {
    type: string;
    users: number;
    percentage: number;
  }[];
}

export default function AdvancedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showCustomReport, setShowCustomReport] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['users', 'revenue', 'conversions']);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Advanced Analytics Engine
  const advancedAnalyticsEngine = {
    generateBusinessIntelligence: async (timeRange: string, metrics: string[]) => {
      setIsRefreshing(true);
      try {
        const response = await fetch('/api/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'business_intelligence',
            type: 'comprehensive_analysis',
            data: {
              timeRange,
              metrics,
              includeAfrican: true,
              includePredictive: true,
              includeCompetitive: true,
              depth: 'detailed'
            }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.data);
          toast.success('Business intelligence updated with AI insights');
          return result.data;
        }
      } catch (error) {
        console.error('Analytics generation failed:', error);
        toast.error('Failed to generate business intelligence');
      } finally {
        setIsRefreshing(false);
      }
    },

    generatePredictiveAnalytics: async (baseData: any) => {
      try {
        const response = await fetch('/api/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'predictive_analytics',
            type: 'business_forecasting',
            data: {
              baseData,
              predictionPeriod: '30_days',
              includeSeasonality: true,
              includeMarketFactors: true,
              confidence: 0.85
            }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.error('Predictive analytics failed:', error);
      }
    },

    generateCustomReport: async (reportConfig: any) => {
      setIsGeneratingReport(true);
      try {
        const response = await fetch('/api/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'custom_report',
            type: 'business_report',
            data: {
              config: reportConfig,
              includeVisualizations: true,
              includeRecommendations: true,
              format: 'comprehensive'
            }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          toast.success('Custom report generated successfully');
          return result.data;
        }
      } catch (error) {
        console.error('Custom report generation failed:', error);
        toast.error('Failed to generate custom report');
      } finally {
        setIsGeneratingReport(false);
      }
    },

    performCohortAnalysis: async (userSegments: any) => {
      try {
        const response = await fetch('/api/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'cohort_analysis',
            type: 'user_retention',
            data: {
              segments: userSegments,
              timeframe: '12_months',
              includeRevenue: true,
              includeAfrican: true
            }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.error('Cohort analysis failed:', error);
      }
    }
  };

  // Mock data for demonstration
  const mockAnalyticsData: AnalyticsData = {
    overview: {
      totalUsers: 125847,
      activeUsers: 89432,
      totalRevenue: 2847392,
      conversionRate: 12.4,
      campaignsSent: 1247,
      emailsSent: 234567,
      smsSent: 45678,
      whatsappSent: 12345
    },
    trends: [
      { period: '7 days ago', users: 15642, revenue: 342567, conversions: 1896, engagement: 78.4 },
      { period: '6 days ago', users: 16234, revenue: 367891, conversions: 2034, engagement: 79.2 },
      { period: '5 days ago', users: 17456, revenue: 389234, conversions: 2187, engagement: 80.1 },
      { period: '4 days ago', users: 18123, revenue: 412678, conversions: 2298, engagement: 81.3 },
      { period: '3 days ago', users: 19567, revenue: 445892, conversions: 2456, engagement: 82.7 },
      { period: '2 days ago', users: 20234, revenue: 467234, conversions: 2587, engagement: 83.4 },
      { period: '1 day ago', users: 21456, revenue: 489567, conversions: 2689, engagement: 84.2 }
    ],
    channels: [
      { name: 'Email', users: 45678, revenue: 1234567, conversions: 5678, roi: 245.7, growth: 12.4 },
      { name: 'SMS', users: 23456, revenue: 567890, conversions: 2345, roi: 189.3, growth: 8.7 },
      { name: 'WhatsApp', users: 12345, revenue: 345678, conversions: 1234, roi: 156.2, growth: 23.1 },
      { name: 'Social Media', users: 34567, revenue: 789012, conversions: 3456, roi: 198.4, growth: 15.6 },
      { name: 'Website', users: 56789, revenue: 1456789, conversions: 6789, roi: 267.8, growth: 18.9 }
    ],
    campaigns: [
      {
        id: '1',
        name: 'Welcome Series',
        type: 'email',
        status: 'active',
        sent: 12345,
        opened: 8765,
        clicked: 2345,
        converted: 456,
        revenue: 123456,
        roi: 234.5
      },
      {
        id: '2',
        name: 'Product Launch',
        type: 'whatsapp',
        status: 'completed',
        sent: 5678,
        opened: 4567,
        clicked: 1234,
        converted: 234,
        revenue: 56789,
        roi: 189.3
      },
      {
        id: '3',
        name: 'Seasonal Promotion',
        type: 'sms',
        status: 'active',
        sent: 8901,
        opened: 7890,
        clicked: 1890,
        converted: 345,
        revenue: 78901,
        roi: 156.7
      }
    ],
    geography: [
      { country: 'Nigeria', users: 45678, revenue: 1234567, growth: 15.2 },
      { country: 'Kenya', users: 23456, revenue: 567890, growth: 12.8 },
      { country: 'South Africa', users: 34567, revenue: 789012, growth: 18.4 },
      { country: 'Ghana', users: 12345, revenue: 345678, growth: 22.1 },
      { country: 'Uganda', users: 9876, revenue: 234567, growth: 19.6 }
    ],
    devices: [
      { type: 'Mobile', users: 89432, percentage: 71.2 },
      { type: 'Desktop', users: 25647, percentage: 20.4 },
      { type: 'Tablet', users: 10768, percentage: 8.4 }
    ]
  };

  useEffect(() => {
    setAnalyticsData(mockAnalyticsData);
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        advancedAnalyticsEngine.generateBusinessIntelligence(timeRange, selectedMetrics);
      }, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange, selectedMetrics]);

  const handleRefreshData = async () => {
    await advancedAnalyticsEngine.generateBusinessIntelligence(timeRange, selectedMetrics);
  };

  const handleGenerateReport = async () => {
    const reportConfig = {
      timeRange,
      metrics: selectedMetrics,
      includeChannels: true,
      includeGeography: true,
      includeDevices: true,
      includePredictions: true
    };
    
    await advancedAnalyticsEngine.generateCustomReport(reportConfig);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <Phone className="h-4 w-4" />;
      case 'social media': return <Share2 className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Advanced Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive business intelligence and AI-powered insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            >
              {viewMode === 'cards' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          
          <Dialog open={showCustomReport} onOpenChange={setShowCustomReport}>
            <DialogTrigger asChild>
              <Button>
                <Brain className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Custom Analytics Report</DialogTitle>
                <DialogDescription>
                  Create a comprehensive AI-powered business intelligence report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="report-metrics">Select Metrics</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['users', 'revenue', 'conversions', 'engagement', 'roi', 'growth'].map((metric) => (
                      <div key={metric} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={metric}
                          checked={selectedMetrics.includes(metric)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMetrics([...selectedMetrics, metric]);
                            } else {
                              setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                            }
                          }}
                        />
                        <Label htmlFor={metric} className="text-sm capitalize">{metric}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomReport(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(analyticsData.overview.totalUsers)}
                    </p>
                    <p className="text-sm text-green-600 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      +15.2% vs last period
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(analyticsData.overview.totalRevenue)}
                    </p>
                    <p className="text-sm text-green-600 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      +23.7% vs last period
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Conversion Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData.overview.conversionRate}%
                    </p>
                    <p className="text-sm text-green-600 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      +2.4% vs last period
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <Target className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(analyticsData.overview.activeUsers)}
                    </p>
                    <p className="text-sm text-green-600 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      +12.8% vs last period
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Interactive chart showing trends for {timeRange}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Chart visualization would be rendered here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/analytics/realtime">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Activity className="h-6 w-6 mb-2" />
                    <span>Real-time Analytics</span>
                  </Button>
                </Link>
                <Link href="/analytics/funnels">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <TrendingDown className="h-6 w-6 mb-2" />
                    <span>Funnel Analysis</span>
                  </Button>
                </Link>
                <Link href="/analytics/messaging">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span>Messaging Analytics</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analyticsData.channels.map((channel, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        {getChannelIcon(channel.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{channel.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(channel.users)} users
                        </p>
                      </div>
                    </div>
                    <Badge variant={channel.growth > 0 ? "default" : "secondary"}>
                      {channel.growth > 0 ? '+' : ''}{channel.growth}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                      <span className="font-semibold">{formatCurrency(channel.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Conversions</span>
                      <span className="font-semibold">{formatNumber(channel.conversions)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">ROI</span>
                      <span className="font-semibold text-green-600">{channel.roi}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.channels.map((channel, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {getChannelIcon(channel.name)}
                      </div>
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(channel.users)} users
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={(channel.revenue / Math.max(...analyticsData.channels.map(c => c.revenue))) * 100} />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(channel.revenue)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {channel.roi}% ROI
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {analyticsData.campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        {campaign.type === 'email' ? <Mail className="h-4 w-4" /> :
                         campaign.type === 'sms' ? <MessageSquare className="h-4 w-4" /> :
                         <Phone className="h-4 w-4" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {campaign.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
                      <Badge variant="outline" className="text-xs capitalize">
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
                      <span className="font-semibold">{formatNumber(campaign.sent)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Opened</span>
                      <span className="font-semibold">{formatNumber(campaign.opened)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Clicked</span>
                      <span className="font-semibold">{formatNumber(campaign.clicked)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Converted</span>
                      <span className="font-semibold">{formatNumber(campaign.converted)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                      <span className="font-semibold text-green-600">{formatCurrency(campaign.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">ROI</span>
                      <span className="font-semibold text-green-600">{campaign.roi}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.geography.map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Globe className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">{country.country}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatNumber(country.users)} users
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(country.revenue)}</p>
                        <p className="text-sm text-green-600 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +{country.growth}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Device Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.devices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Activity className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">{device.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatNumber(device.users)} users
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{device.percentage}%</p>
                        <div className="w-16 mt-1">
                          <Progress value={device.percentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Cohort Analysis
              </CardTitle>
              <CardDescription>
                User retention and revenue cohorts by acquisition period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Cohort Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Generate comprehensive cohort analysis with AI insights
                  </p>
                  <Button
                    onClick={() => advancedAnalyticsEngine.performCohortAnalysis(analyticsData.overview)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Cohort Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>
                AI-powered forecasting and predictive insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Future Performance Predictions</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Generate predictive analytics for the next 30 days
                  </p>
                  <Button
                    onClick={() => advancedAnalyticsEngine.generatePredictiveAnalytics(analyticsData)}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Predictions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}