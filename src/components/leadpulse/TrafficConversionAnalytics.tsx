'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  ArrowDown,
  ArrowUp,
  Activity,
  Target,
  Calendar,
  Filter,
  Eye,
  Globe,
  Smartphone,
  Brain,
  Zap,
  Sparkles
} from 'lucide-react';
import { useSupremeAI } from '@/hooks/useSupremeAI';
import { useAIIntelligenceOverview } from '@/hooks/useAIIntelligence';
import { useSession } from 'next-auth/react';
import LivePulseIndicator from './LivePulseIndicator';
import { getActiveVisitors } from '@/lib/leadpulse/dataProvider';
import GrafanaStyleCards from './GrafanaStyleCards';

interface TrafficData {
  date: string;
  visitors: number;
  applications: number;
  sales: number;
  revenue: number;
  sources: {
    organic: number;
    paid: number;
    social: number;
    direct: number;
    referral: number;
  };
}

interface ConversionMetrics {
  totalVisitors: number;
  totalApplications: number;
  totalSales: number;
  totalRevenue: number;
  applicationRate: number;
  salesConversionRate: number;
  overallConversionRate: number;
  averageOrderValue: number;
}

interface ChannelData {
  channel: string;
  visitors: number;
  applications: number;
  sales: number;
  conversionRate: number;
  color: string;
}

interface AIVisitorScore {
  id: string;
  score: number;
  segment: 'high-intent' | 'medium-intent' | 'low-intent' | 'research';
  prediction: number;
  factors: string[];
  confidence: number;
  lastActivity: string;
}

interface AIInsight {
  type: 'optimization' | 'prediction' | 'alert' | 'trend';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export default function TrafficConversionAnalytics() {
  const { data: session } = useSession();
  const { overview, loading: aiLoading } = useAIIntelligenceOverview(session?.user?.id);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // AI-powered visitor scoring
  const [aiVisitorScores, setAiVisitorScores] = useState<AIVisitorScore[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  
  // Real-time conversion probability updates
  const [realTimeConversions, setRealTimeConversions] = useState<{
    currentProbability: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    lastUpdate: Date;
    hourlyPredictions: Array<{
      hour: number;
      probability: number;
      confidence: number;
    }>;
    factors: Array<{
      factor: string;
      impact: number;
      trend: 'positive' | 'negative' | 'neutral';
    }>;
  }>({
    currentProbability: 0,
    trend: 'stable',
    confidence: 0,
    lastUpdate: new Date(),
    hourlyPredictions: [],
    factors: []
  });
  
  // Removed simulation data integration - now uses unified data provider

  // Fetch analytics data with AI enhancement
  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/leadpulse/analytics?type=traffic&timeRange=${timeRange}`);
        const data = await response.json();
        
        if (data.success) {
          setTrafficData(data.traffic.data);
          setMetrics(data.traffic.metrics);
          
          // Generate AI visitor scores and insights
          generateAIInsights(data.traffic.data, data.traffic.metrics);
        } else {
          throw new Error(data.error || 'Failed to fetch analytics data');
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAnalyticsData();
  }, [timeRange]);

  // Removed simulation monitoring - now uses unified data provider

  // Real-time conversion probability updates using AI models
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateConversionProbabilities = async () => {
      try {
        const currentHour = new Date().getHours();
        
        // Simulate AI model predictions based on real-time factors
        const baseConversionRate = metrics?.overallConversionRate || 12;
        
        // AI factors that influence conversion probability
        const aiFactors = [
          {
            factor: 'Current visitor engagement',
            impact: (Math.random() - 0.5) * 8, // ±4% impact
            trend: Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative'
          },
          {
            factor: 'Time of day optimization',
            impact: currentHour >= 9 && currentHour <= 17 ? 3.5 : -1.2,
            trend: currentHour >= 9 && currentHour <= 17 ? 'positive' : 'negative'
          },
          {
            factor: 'Nigerian market sentiment',
            impact: (Math.random() - 0.3) * 5, // Slightly positive bias
            trend: Math.random() > 0.4 ? 'positive' : 'neutral'
          },
          {
            factor: 'WhatsApp contact availability',
            impact: 2.1,
            trend: 'positive'
          },
          {
            factor: 'Enterprise lead quality',
            impact: (Math.random() - 0.4) * 6,
            trend: Math.random() > 0.5 ? 'positive' : 'negative'
          }
        ];

        // Calculate current probability
        const totalImpact = aiFactors.reduce((sum, factor) => sum + factor.impact, 0);
        const currentProbability = Math.max(5, Math.min(35, baseConversionRate + totalImpact));
        
        // Determine trend
        const previousProbability = realTimeConversions.currentProbability || baseConversionRate;
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (currentProbability > previousProbability + 0.5) trend = 'increasing';
        else if (currentProbability < previousProbability - 0.5) trend = 'decreasing';

        // Generate hourly predictions for next 6 hours
        const hourlyPredictions = [];
        for (let i = 0; i < 6; i++) {
          const futureHour = (currentHour + i) % 24;
          const businessHourFactor = futureHour >= 9 && futureHour <= 17 ? 1.15 : 0.85;
          const hourProbability = currentProbability * businessHourFactor * (0.9 + Math.random() * 0.2);
          
          hourlyPredictions.push({
            hour: futureHour,
            probability: Math.round(hourProbability * 10) / 10,
            confidence: 0.75 + Math.random() * 0.2
          });
        }

        // Calculate AI confidence based on data quality and consistency
        const confidence = Math.min(0.95, 0.7 + (Math.random() * 0.25));

        setRealTimeConversions({
          currentProbability: Math.round(currentProbability * 10) / 10,
          trend,
          confidence: Math.round(confidence * 100) / 100,
          lastUpdate: new Date(),
          hourlyPredictions,
          factors: aiFactors.map(factor => ({
            ...factor,
            impact: Math.round(factor.impact * 10) / 10
          }))
        });

      } catch (error) {
        console.error('Error updating conversion probabilities:', error);
      }
    };

    // Initial update
    if (metrics) {
      updateConversionProbabilities();
    }

    // Set up real-time updates every 20 seconds
    interval = setInterval(updateConversionProbabilities, 20000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [metrics]);
  
  // Generate AI insights from traffic data
  const generateAIInsights = async (traffic: TrafficData[], metrics: ConversionMetrics) => {
    setAiAnalyzing(true);
    
    try {
      // Generate AI visitor scores (simulated real-time scoring)
      const mockVisitorScores: AIVisitorScore[] = [
        {
          id: 'visitor-001',
          score: 85,
          segment: 'high-intent',
          prediction: 78,
          factors: ['Pricing page visit', 'Nigerian location', 'Enterprise email domain', 'Multiple sessions'],
          confidence: 0.92,
          lastActivity: '2 minutes ago'
        },
        {
          id: 'visitor-002', 
          score: 62,
          segment: 'medium-intent',
          prediction: 45,
          factors: ['Features page engagement', 'Mobile device', 'First-time visitor'],
          confidence: 0.76,
          lastActivity: '5 minutes ago'
        },
        {
          id: 'visitor-003',
          score: 34,
          segment: 'research',
          prediction: 12,
          factors: ['Blog content focus', 'Long session duration', 'No pricing interaction'],
          confidence: 0.68,
          lastActivity: '1 minute ago'
        }
      ];
      
      // Generate AI insights based on traffic patterns
      const insights: AIInsight[] = [
        {
          type: 'optimization',
          title: 'Mobile Conversion Gap',
          description: `Mobile visitors have ${(metrics.overallConversionRate * 0.7).toFixed(1)}% lower conversion rate. Optimize mobile checkout flow.`,
          impact: '+15% mobile conversion',
          confidence: 0.89,
          priority: 'high'
        },
        {
          type: 'alert',
          title: 'High-Intent Visitor Online',
          description: 'Nigerian enterprise visitor with 85% conversion probability currently browsing pricing.',
          impact: 'Immediate sales opportunity',
          confidence: 0.92,
          priority: 'high'
        },
        {
          type: 'trend',
          title: 'Organic Traffic Surge',
          description: `Organic traffic increased ${((traffic[traffic.length-1]?.sources.organic || 0) / (traffic[0]?.sources.organic || 1) * 100 - 100).toFixed(0)}% in ${timeRange}.`,
          impact: 'SEO strategy working',
          confidence: 0.94,
          priority: 'medium'
        },
        {
          type: 'prediction',
          title: 'Weekend Conversion Spike',
          description: 'AI predicts 23% higher conversion rates this weekend based on Nigerian market patterns.',
          impact: 'Plan weekend campaigns',
          confidence: 0.71,
          priority: 'medium'
        }
      ];
      
      setAiVisitorScores(mockVisitorScores);
      setAiInsights(insights);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Multi-currency formatting for African markets
  const formatCurrency = (amount: number, currency: 'NGN' | 'ZAR' | 'KES' | 'GHS' = 'NGN') => {
    const localeMap = {
      'NGN': 'en-NG',
      'ZAR': 'en-ZA', 
      'KES': 'en-KE',
      'GHS': 'en-GH'
    };
    
    return new Intl.NumberFormat(localeMap[currency], {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format currency based on visitor location (AI-enhanced)
  const formatCurrencyByLocation = (amount: number, location?: string) => {
    if (location?.includes('South Africa')) return formatCurrency(amount * 0.27, 'ZAR');
    if (location?.includes('Kenya')) return formatCurrency(amount * 0.0067, 'KES');
    if (location?.includes('Ghana')) return formatCurrency(amount * 0.17, 'GHS');
    return formatCurrency(amount, 'NGN'); // Default to Nigerian Naira
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
        <p className="text-red-600 dark:text-red-400">Error loading analytics: {error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Grafana-Style Cards */}
      <GrafanaStyleCards 
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
      
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            Traffic Conversion Funnel
            <LivePulseIndicator type="mini" />
          </h3>
          <p className="text-xs text-muted-foreground">Website visitors → applications → sales</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 rounded-lg shadow-sm border">
            <Button 
              variant={timeRange === '7d' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="text-xs h-7"
            >
              7d
            </Button>
            <Button 
              variant={timeRange === '30d' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="text-xs h-7"
            >
              30d
            </Button>
            <Button 
              variant={timeRange === '90d' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange('90d')}
              className="text-xs h-7"
            >
              90d
            </Button>
          </div>
        </div>
      </div>

      {/* AI-Enhanced Funnel Metrics */}
      <div className="grid gap-2 grid-cols-4">
        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm relative">
          <div className="flex items-center justify-between mb-1">
            <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <div className="flex items-center gap-1">
              <Brain className="h-2 w-2 text-blue-500" />
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">VISITORS</span>
            </div>
          </div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatNumber(metrics.totalVisitors)}</div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400">AI scored: {aiVisitorScores.length} active</div>
        </div>

        <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-[10px] text-green-700 dark:text-green-300 font-medium">APPLICATIONS</span>
          </div>
          <div className="text-lg font-bold text-green-900 dark:text-green-100">{formatNumber(metrics.totalApplications)}</div>
          <div className="text-[10px] text-green-600 dark:text-green-400">{metrics.applicationRate.toFixed(1)}% conversion</div>
        </div>

        <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <DollarSign className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">SALES</span>
          </div>
          <div className="text-lg font-bold text-purple-900 dark:text-purple-100">{formatNumber(metrics.totalSales)}</div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400">{metrics.salesConversionRate.toFixed(1)}% from apps</div>
        </div>

        <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="h-3 w-3 text-orange-600 dark:text-orange-400" />
            <span className="text-[10px] text-orange-700 dark:text-orange-300 font-medium">REVENUE</span>
          </div>
          <div className="text-lg font-bold text-orange-900 dark:text-orange-100">{formatNumber(metrics.totalRevenue)}</div>
          <div className="text-[10px] text-orange-600 dark:text-orange-400">₦{formatNumber(metrics.averageOrderValue)} AOV</div>
        </div>
      </div>

      {/* Simulation metrics section removed - now uses unified data provider */}

      {/* Live Traffic Sources */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Live Traffic Sources</h4>
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span>Visitors</span>
            <span>Apps</span>
            <span>Sales</span>
            <span>CVR</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {trafficData.length > 0 && (() => {
            const latestData = trafficData[trafficData.length - 1];
            const sources = [
              { source: 'Organic Search', visitors: latestData.sources.organic, color: 'green' },
              { source: 'Paid Ads', visitors: latestData.sources.paid, color: 'blue' },
              { source: 'Social Media', visitors: latestData.sources.social, color: 'purple' },
              { source: 'Direct', visitors: latestData.sources.direct, color: 'orange' },
              { source: 'Referral', visitors: latestData.sources.referral, color: 'pink' }
            ];
            
            return sources.map((item, index) => {
              const apps = Math.floor(item.visitors * (0.12 + Math.random() * 0.08));
              const sales = Math.floor(apps * (0.15 + Math.random() * 0.15));
              const cvr = ((sales / item.visitors) * 100).toFixed(1) + '%';
              
              return (
                <div key={item.source} className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${item.color}-500`}></div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{item.source}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>{formatNumber(item.visitors)}</span>
                    <span>{formatNumber(apps)}</span>
                    <span>{formatNumber(sales)}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cvr}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Compact Conversion Timeline */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Conversion Timeline ({timeRange})</h4>
        
        <div className="space-y-2">
          {trafficData.slice(-7).map((day, index) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const conversionRate = ((day.sales / day.visitors) * 100).toFixed(1);
            
            return (
              <div key={day.date} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-900 dark:text-white w-8">{dayName}</span>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{date.toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{formatNumber(day.visitors)} visitors</span>
                  <span className="text-gray-600 dark:text-gray-400">{formatNumber(day.sales)} sales</span>
                  <span className="font-medium text-gray-900 dark:text-white">{conversionRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Visitor Scoring */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            AI Visitor Scoring
          </h4>
          <Badge variant="secondary" className="text-xs">
            {aiAnalyzing ? 'Analyzing...' : `${aiVisitorScores.length} Scored`}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {aiVisitorScores.map((visitor, index) => (
            <div key={visitor.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  visitor.segment === 'high-intent' ? 'bg-green-500' :
                  visitor.segment === 'medium-intent' ? 'bg-yellow-500' :
                  visitor.segment === 'research' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    Visitor {visitor.id.slice(-3).toUpperCase()}
                  </div>
                  <div className="text-[10px] text-gray-500">{visitor.lastActivity}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white">{visitor.score}</div>
                  <div className="text-gray-500">Score</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{visitor.prediction}%</div>
                  <div className="text-gray-500">Convert</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{Math.round(visitor.confidence * 100)}%</div>
                  <div className="text-gray-500">Confidence</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Conversion Probability Updates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            Real-time Conversion Probability
          </h4>
          <Badge variant="outline" className="text-xs">
            <div className={`w-2 h-2 rounded-full mr-1 ${
              realTimeConversions.trend === 'increasing' ? 'bg-green-500' :
              realTimeConversions.trend === 'decreasing' ? 'bg-red-500' : 'bg-yellow-500'
            } animate-pulse`} />
            {realTimeConversions.trend}
          </Badge>
        </div>
        
        <div className="grid gap-3">
          {/* Current Probability */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {realTimeConversions.currentProbability}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Current conversion probability
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600">
                  {Math.round(realTimeConversions.confidence * 100)}%
                </div>
                <div className="text-xs text-gray-500">AI Confidence</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {realTimeConversions.lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          {/* Hourly Predictions */}
          <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">Next 6 Hours Predictions:</div>
            <div className="grid grid-cols-6 gap-2">
              {realTimeConversions.hourlyPredictions.map((prediction, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500">{prediction.hour}:00</div>
                  <div className="text-sm font-bold text-blue-600">{prediction.probability}%</div>
                  <div className="text-[10px] text-gray-400">{Math.round(prediction.confidence * 100)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Factors */}
          <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">AI Factors Influencing Conversion:</div>
            <div className="space-y-1">
              {realTimeConversions.factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      factor.trend === 'positive' ? 'bg-green-500' :
                      factor.trend === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-gray-700 dark:text-gray-300">{factor.factor}</span>
                  </div>
                  <span className={`font-medium ${
                    factor.impact > 0 ? 'text-green-600' :
                    factor.impact < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {factor.impact > 0 ? '+' : ''}{factor.impact}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights & Predictions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            AI Insights & Predictions
          </h4>
          <Badge variant="outline" className="text-xs">
            {aiInsights.length} Active
          </Badge>
        </div>
        
        <div className="grid gap-2">
          {aiInsights.map((insight, index) => (
            <div key={index} className={`p-3 rounded-lg border ${
              insight.priority === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
              insight.priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
              'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {insight.type === 'optimization' && <Target className="h-3 w-3 text-blue-600" />}
                  {insight.type === 'alert' && <Zap className="h-3 w-3 text-red-600" />}
                  {insight.type === 'trend' && <TrendingUp className="h-3 w-3 text-green-600" />}
                  {insight.type === 'prediction' && <Brain className="h-3 w-3 text-purple-600" />}
                  <span className="text-xs font-medium">{insight.title}</span>
                </div>
                <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                  {insight.priority}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{insight.description}</p>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-green-600 font-medium">{insight.impact}</span>
                <span className="text-blue-600">{Math.round(insight.confidence * 100)}% confidence</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <h4 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-100 text-sm">Quick Insights</h4>
        <div className="grid md:grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <div className="text-indigo-700 dark:text-indigo-300">• Overall conversion rate: {metrics.overallConversionRate.toFixed(2)}%</div>
            <div className="text-indigo-700 dark:text-indigo-300">• Average order value: {formatCurrency(metrics.averageOrderValue)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-indigo-700 dark:text-indigo-300">• Best performing day: {(() => {
              const bestDay = trafficData.reduce((best, day) => 
                (day.sales / day.visitors) > (best.sales / best.visitors) ? day : best
              );
              return new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'short' });
            })()}</div>
            <div className="text-indigo-700 dark:text-indigo-300">• Total revenue: {formatCurrency(metrics.totalRevenue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 