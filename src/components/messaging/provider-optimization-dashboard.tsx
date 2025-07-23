"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { 
  Zap, 
  Target, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  MessageSquare,
  Mail,
  Phone,
  Lightbulb,
  Award,
  Activity,
  BarChart3
} from 'lucide-react';

interface ProviderMetrics {
  provider: string;
  channel: string;
  deliveryRate: number;
  averageDeliveryTime: number;
  errorRate: number;
  totalMessagesSent: number;
  totalSuccessful: number;
  totalFailed: number;
  lastUpdated: string;
}

interface ProviderStatus {
  channel: string;
  recommendedProvider: string;
  estimatedCost: number;
  expectedDeliveryRate: number;
  metrics: {
    costScore: number;
    deliveryScore: number;
    reliabilityScore: number;
    overallScore: number;
  };
}

interface OptimizationRecommendation {
  channel: string;
  currentProvider: string;
  recommendedProvider: string;
  potentialSavings: number;
  improvementArea: string;
}

export function ProviderOptimizationDashboard() {
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [totalPotentialSavings, setTotalPotentialSavings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  useEffect(() => {
    loadOptimizationData();
  }, [timeframe]);

  const loadOptimizationData = async () => {
    setIsLoading(true);
    try {
      // Load provider status
      const statusResponse = await fetch('/api/messaging/optimization');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setProviderStatus(statusData.providerStatus);
      }

      // Load metrics
      const metricsResponse = await fetch(`/api/messaging/optimization/metrics?timeframe=${timeframe}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics);
      }

      // Load recommendations
      const recommendationsResponse = await fetch('/api/messaging/optimization?type=recommendations');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.recommendations);
        setTotalPotentialSavings(recommendationsData.totalPotentialSavings);
      }
    } catch (error) {
      console.error('Failed to load optimization data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeProvider = async (channel: string, messageCount = 1000) => {
    try {
      const response = await fetch('/api/messaging/optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel,
          messageCount,
          priority: 'balanced'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Optimization result:', data.optimization);
        // Refresh data
        loadOptimizationData();
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const filteredMetrics = selectedChannel === 'all' 
    ? metrics 
    : metrics.filter(m => m.channel === selectedChannel);

  const chartData = filteredMetrics.reduce((acc, metric) => {
    const existing = acc.find(item => item.provider === metric.provider);
    if (existing) {
      existing.deliveryRate = (existing.deliveryRate + metric.deliveryRate) / 2;
      existing.averageDeliveryTime = (existing.averageDeliveryTime + metric.averageDeliveryTime) / 2;
      existing.totalMessages += metric.totalMessagesSent;
    } else {
      acc.push({
        provider: metric.provider,
        deliveryRate: metric.deliveryRate * 100,
        averageDeliveryTime: metric.averageDeliveryTime,
        totalMessages: metric.totalMessagesSent
      });
    }
    return acc;
  }, [] as any[]);

  const radarData = providerStatus.map(status => ({
    channel: status.channel.toUpperCase(),
    cost: status.metrics.costScore,
    delivery: status.metrics.deliveryScore,
    reliability: status.metrics.reliabilityScore,
    overall: status.metrics.overallScore
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Provider Optimization</h1>
          <p className="text-muted-foreground">Optimize your messaging providers for cost and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadOptimizationData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Optimization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalPotentialSavings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Providers</p>
                <p className="text-2xl font-bold">{new Set(metrics.map(m => m.provider)).size}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Delivery Rate</p>
                <p className="text-2xl font-bold">
                  {metrics.length > 0 ? 
                    `${(metrics.reduce((sum, m) => sum + m.deliveryRate, 0) / metrics.length * 100).toFixed(1)}%` : 
                    '0%'
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recommendations</p>
                <p className="text-2xl font-bold">{recommendations.length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Alert */}
      {recommendations.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Optimization Opportunities Found</div>
            <p className="text-sm mt-1">
              You could save ${totalPotentialSavings.toFixed(2)} by optimizing your provider selection across {recommendations.length} channels.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Provider Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providerStatus.map((status) => (
              <Card key={status.channel}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getChannelIcon(status.channel)}
                      {status.channel.toUpperCase()}
                    </CardTitle>
                    <Badge variant={getScoreBadgeVariant(status.metrics.overallScore)}>
                      {status.metrics.overallScore.toFixed(0)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Recommended Provider</p>
                      <p className="text-lg font-bold capitalize">{status.recommendedProvider}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cost Score</p>
                        <p className={`font-medium ${getScoreColor(status.metrics.costScore)}`}>
                          {status.metrics.costScore.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Delivery Score</p>
                        <p className={`font-medium ${getScoreColor(status.metrics.deliveryScore)}`}>
                          {status.metrics.deliveryScore.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reliability</p>
                        <p className={`font-medium ${getScoreColor(status.metrics.reliabilityScore)}`}>
                          {status.metrics.reliabilityScore.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Est. Rate</p>
                        <p className="font-medium">{(status.expectedDeliveryRate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleOptimizeProvider(status.channel)}
                      size="sm" 
                      className="w-full"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Optimize
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Multi-dimensional performance analysis across channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="channel" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Cost" dataKey="cost" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Delivery" dataKey="delivery" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Radar name="Reliability" dataKey="reliability" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Provider Performance Analytics</h3>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Rate by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="provider" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deliveryRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Delivery Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="provider" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="averageDeliveryTime" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Optimized!</h3>
                  <p className="text-muted-foreground">
                    Your provider selection is already optimized. Keep monitoring for future opportunities.
                  </p>
                </CardContent>
              </Card>
            ) : (
              recommendations.map((recommendation, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(recommendation.channel)}
                        <div>
                          <h3 className="font-semibold capitalize">{recommendation.channel}</h3>
                          <p className="text-sm text-muted-foreground">
                            Switch from {recommendation.currentProvider} to {recommendation.recommendedProvider}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${recommendation.potentialSavings.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">potential savings</div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {recommendation.improvementArea} optimization
                      </Badge>
                      <Button onClick={() => handleOptimizeProvider(recommendation.channel)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Apply Optimization
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Metrics</CardTitle>
              <CardDescription>Detailed performance metrics for all providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Provider</th>
                      <th className="text-left p-2">Channel</th>
                      <th className="text-right p-2">Delivery Rate</th>
                      <th className="text-right p-2">Avg Delivery Time</th>
                      <th className="text-right p-2">Error Rate</th>
                      <th className="text-right p-2">Messages Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMetrics.map((metric, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium capitalize">{metric.provider}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(metric.channel)}
                            <span className="capitalize">{metric.channel}</span>
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <span className={getScoreColor(metric.deliveryRate * 100)}>
                            {(metric.deliveryRate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-right">{metric.averageDeliveryTime}s</td>
                        <td className="p-2 text-right">
                          <span className={metric.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}>
                            {(metric.errorRate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-right">{metric.totalMessagesSent.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}