'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  PieChart,
  Pie,
  Cell,
  Sankey,
  TreeMap
} from 'recharts';
import {
  TrendingUp,
  MapPin,
  Users,
  Target,
  DollarSign,
  Clock,
  Eye,
  MousePointer,
  Link,
  Share2,
  Smartphone,
  Monitor,
  Tablet,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  Search,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Award,
  ArrowRight,
  ChevronRight,
  Calendar,
  Building,
  FileText
} from 'lucide-react';

interface AttributionTouchpoint {
  id: string;
  timestamp: string;
  channel: string;
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
  term?: string;
  page: string;
  sessionId: string;
  visitorId: string;
  customerId?: string;
  value: number;
  position: number; // Position in customer journey (1 = first touch, etc.)
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: string;
}

interface AttributionModel {
  id: string;
  name: string;
  description: string;
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';
  active: boolean;
  attributionRules: {
    firstTouchWeight?: number;
    lastTouchWeight?: number;
    middleTouchWeight?: number;
    decayHalfLife?: number; // days
    conversionWindow?: number; // days
  };
}

interface ChannelPerformance {
  channel: string;
  source: string;
  medium: string;
  
  // Volume Metrics
  sessions: number;
  users: number;
  newUsers: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  
  // Conversion Metrics
  conversions: number;
  conversionRate: number;
  conversionValue: number;
  avgOrderValue: number;
  
  // Attribution Metrics (based on selected model)
  firstTouchConversions: number;
  lastTouchConversions: number;
  assistedConversions: number;
  attributedRevenue: number;
  attributedConversions: number;
  
  // ROI Metrics
  cost?: number;
  roi?: number;
  costPerConversion?: number;
  roas?: number; // Return on Ad Spend
  
  // Time-based Metrics
  avgTimeToConversion: number; // days
  
  // Quality Metrics
  leadQualityScore: number;
  customerLifetimeValue?: number;
  churnRate?: number;
}

interface CustomerJourney {
  customerId: string;
  customerName: string;
  customerEmail: string;
  conversionDate: string;
  conversionValue: number;
  journeyDuration: number; // days
  touchpointCount: number;
  touchpoints: AttributionTouchpoint[];
  
  // Journey Analysis
  firstTouchChannel: string;
  lastTouchChannel: string;
  assistingChannels: string[];
  dominantChannel: string;
  journeyType: 'direct' | 'simple' | 'complex' | 'multi_device';
  
  // Attribution by Model
  attribution: {
    [modelId: string]: {
      [channelId: string]: number; // attribution percentage
    };
  };
}

interface AttributionInsight {
  id: string;
  type: 'opportunity' | 'underperforming' | 'trending' | 'anomaly';
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  channels: string[];
  metrics: {
    current: number;
    benchmark: number;
    change: number;
  };
  timeframe: string;
}

interface AttributionAnalysisProps {
  className?: string;
}

export default function AttributionAnalysis({ className }: AttributionAnalysisProps) {
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [customerJourneys, setCustomerJourneys] = useState<CustomerJourney[]>([]);
  const [attributionModels, setAttributionModels] = useState<AttributionModel[]>([]);
  const [insights, setInsights] = useState<AttributionInsight[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('last_touch');
  const [selectedJourney, setSelectedJourney] = useState<CustomerJourney | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  useEffect(() => {
    fetchAttributionData();
  }, [selectedModel, timeRange, filterChannel]);

  const fetchAttributionData = async () => {
    try {
      setIsLoading(true);
      const [channelsRes, journeysRes, modelsRes, insightsRes] = await Promise.all([
        fetch(`/api/v2/leadpulse/attribution/channels?model=${selectedModel}&timeRange=${timeRange}&channel=${filterChannel}`),
        fetch(`/api/v2/leadpulse/attribution/journeys?model=${selectedModel}&timeRange=${timeRange}`),
        fetch('/api/v2/leadpulse/attribution/models'),
        fetch('/api/v2/leadpulse/attribution/insights')
      ]);

      if (channelsRes.ok && journeysRes.ok && modelsRes.ok && insightsRes.ok) {
        const channelsData = await channelsRes.json();
        const journeysData = await journeysRes.json();
        const modelsData = await modelsRes.json();
        const insightsData = await insightsRes.json();
        
        setChannelPerformance(channelsData.channels);
        setCustomerJourneys(journeysData.journeys);
        setAttributionModels(modelsData.models);
        setInsights(insightsData.insights);
        
        if (journeysData.journeys.length > 0 && !selectedJourney) {
          setSelectedJourney(journeysData.journeys[0]);
        }
      } else {
        // Use mock data for demo
        const mockChannels = generateMockChannels();
        const mockJourneys = generateMockJourneys();
        const mockModels = generateMockModels();
        const mockInsights = generateMockInsights();
        
        setChannelPerformance(mockChannels);
        setCustomerJourneys(mockJourneys);
        setAttributionModels(mockModels);
        setInsights(mockInsights);
        
        if (mockJourneys.length > 0) {
          setSelectedJourney(mockJourneys[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching attribution data:', error);
      const mockChannels = generateMockChannels();
      const mockJourneys = generateMockJourneys();
      const mockModels = generateMockModels();
      const mockInsights = generateMockInsights();
      
      setChannelPerformance(mockChannels);
      setCustomerJourneys(mockJourneys);
      setAttributionModels(mockModels);
      setInsights(mockInsights);
      
      if (mockJourneys.length > 0) {
        setSelectedJourney(mockJourneys[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockModels = (): AttributionModel[] => {
    return [
      {
        id: 'first_touch',
        name: 'First Touch',
        description: '100% credit to the first touchpoint',
        type: 'first_touch',
        active: true,
        attributionRules: {
          firstTouchWeight: 1.0,
          conversionWindow: 30
        }
      },
      {
        id: 'last_touch',
        name: 'Last Touch',
        description: '100% credit to the last touchpoint',
        type: 'last_touch',
        active: true,
        attributionRules: {
          lastTouchWeight: 1.0,
          conversionWindow: 30
        }
      },
      {
        id: 'linear',
        name: 'Linear',
        description: 'Equal credit to all touchpoints',
        type: 'linear',
        active: true,
        attributionRules: {
          conversionWindow: 30
        }
      },
      {
        id: 'time_decay',
        name: 'Time Decay',
        description: 'More credit to recent touchpoints',
        type: 'time_decay',
        active: true,
        attributionRules: {
          decayHalfLife: 7,
          conversionWindow: 30
        }
      },
      {
        id: 'position_based',
        name: 'Position Based',
        description: '40% first, 40% last, 20% middle',
        type: 'position_based',
        active: true,
        attributionRules: {
          firstTouchWeight: 0.4,
          lastTouchWeight: 0.4,
          middleTouchWeight: 0.2,
          conversionWindow: 30
        }
      }
    ];
  };

  const generateMockChannels = (): ChannelPerformance[] => {
    const channels = [
      { channel: 'Organic Search', source: 'google', medium: 'organic' },
      { channel: 'Direct', source: '(direct)', medium: '(none)' },
      { channel: 'Email Marketing', source: 'email', medium: 'email' },
      { channel: 'Social Media', source: 'facebook', medium: 'social' },
      { channel: 'LinkedIn Ads', source: 'linkedin', medium: 'cpc' },
      { channel: 'Google Ads', source: 'google', medium: 'cpc' },
      { channel: 'Referral', source: 'techcrunch', medium: 'referral' },
      { channel: 'Content Marketing', source: 'blog', medium: 'content' }
    ];

    return channels.map((channel, index) => {
      const sessions = Math.floor(Math.random() * 5000) + 100;
      const conversions = Math.floor(sessions * (Math.random() * 0.1 + 0.01));
      const conversionValue = conversions * (Math.floor(Math.random() * 2000) + 500);
      
      return {
        ...channel,
        sessions,
        users: Math.floor(sessions * 0.8),
        newUsers: Math.floor(sessions * 0.6),
        pageViews: Math.floor(sessions * (Math.random() * 5 + 2)),
        bounceRate: Math.floor(Math.random() * 40) + 30,
        avgSessionDuration: Math.floor(Math.random() * 300) + 60,
        conversions,
        conversionRate: (conversions / sessions) * 100,
        conversionValue,
        avgOrderValue: conversionValue / Math.max(conversions, 1),
        firstTouchConversions: Math.floor(conversions * (Math.random() * 0.4 + 0.1)),
        lastTouchConversions: Math.floor(conversions * (Math.random() * 0.6 + 0.2)),
        assistedConversions: Math.floor(conversions * (Math.random() * 0.5 + 0.1)),
        attributedRevenue: conversionValue * (Math.random() * 0.5 + 0.5),
        attributedConversions: conversions * (Math.random() * 0.3 + 0.7),
        cost: index < 4 ? Math.floor(Math.random() * 10000) + 1000 : undefined,
        roi: index < 4 ? Math.floor(Math.random() * 300) + 100 : undefined,
        costPerConversion: index < 4 ? Math.floor(Math.random() * 200) + 50 : undefined,
        roas: index < 4 ? Math.floor(Math.random() * 400) + 200 : undefined,
        avgTimeToConversion: Math.floor(Math.random() * 14) + 1,
        leadQualityScore: Math.floor(Math.random() * 40) + 60,
        customerLifetimeValue: Math.floor(Math.random() * 10000) + 2000,
        churnRate: Math.floor(Math.random() * 20) + 5
      };
    });
  };

  const generateMockJourneys = (): CustomerJourney[] => {
    const channels = ['Organic Search', 'Direct', 'Email Marketing', 'Social Media', 'LinkedIn Ads', 'Google Ads'];
    
    return Array.from({ length: 20 }, (_, i) => {
      const touchpointCount = Math.floor(Math.random() * 8) + 1;
      const journeyDuration = Math.floor(Math.random() * 30) + 1;
      const conversionValue = Math.floor(Math.random() * 5000) + 500;
      
      const touchpoints = Array.from({ length: touchpointCount }, (_, j) => ({
        id: `tp_${i}_${j}`,
        timestamp: new Date(Date.now() - (touchpointCount - j) * 2 * 24 * 60 * 60 * 1000).toISOString(),
        channel: channels[Math.floor(Math.random() * channels.length)],
        source: 'google',
        medium: 'organic',
        page: ['/pricing', '/demo', '/contact', '/solutions'][Math.floor(Math.random() * 4)],
        sessionId: `session_${i}_${j}`,
        visitorId: `visitor_${i}`,
        customerId: `customer_${i}`,
        value: Math.floor(Math.random() * 100) + 10,
        position: j + 1,
        deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
        location: 'Lagos, Nigeria'
      }));
      
      const firstTouchChannel = touchpoints[0]?.channel || 'Direct';
      const lastTouchChannel = touchpoints[touchpoints.length - 1]?.channel || 'Direct';
      
      return {
        customerId: `customer_${i}`,
        customerName: `Customer ${i + 1}`,
        customerEmail: `customer${i + 1}@example.com`,
        conversionDate: new Date().toISOString(),
        conversionValue,
        journeyDuration,
        touchpointCount,
        touchpoints,
        firstTouchChannel,
        lastTouchChannel,
        assistingChannels: [...new Set(touchpoints.slice(1, -1).map(tp => tp.channel))],
        dominantChannel: touchpoints.reduce((acc, tp) => {
          acc[tp.channel] = (acc[tp.channel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        journeyType: touchpointCount === 1 ? 'direct' : 
                    touchpointCount <= 3 ? 'simple' : 
                    touchpointCount <= 6 ? 'complex' : 'multi_device',
        attribution: {
          first_touch: { [firstTouchChannel]: 1.0 },
          last_touch: { [lastTouchChannel]: 1.0 },
          linear: touchpoints.reduce((acc, tp) => {
            acc[tp.channel] = (acc[tp.channel] || 0) + (1 / touchpointCount);
            return acc;
          }, {} as Record<string, number>)
        }
      };
    });
  };

  const generateMockInsights = (): AttributionInsight[] => {
    return [
      {
        id: 'insight_1',
        type: 'opportunity',
        title: 'LinkedIn Ads Underutilized',
        description: 'LinkedIn ads show highest lead quality (85 score) but receive only 12% of budget allocation.',
        recommendation: 'Increase LinkedIn ad spend by 30% and reallocate from lower-performing channels.',
        impact: 'high',
        channels: ['LinkedIn Ads'],
        metrics: {
          current: 85,
          benchmark: 70,
          change: 21.4
        },
        timeframe: 'Last 30 days'
      },
      {
        id: 'insight_2',
        type: 'trending',
        title: 'Organic Search Attribution Rising',
        description: 'Organic search attribution has increased 34% month-over-month, indicating strong SEO performance.',
        recommendation: 'Continue content marketing efforts and consider increasing blog publishing frequency.',
        impact: 'medium',
        channels: ['Organic Search'],
        metrics: {
          current: 134,
          benchmark: 100,
          change: 34
        },
        timeframe: 'Last 30 days'
      },
      {
        id: 'insight_3',
        type: 'underperforming',
        title: 'Email Marketing Low First-Touch Attribution',
        description: 'Email marketing excels at nurturing but rarely initiates customer journeys (3% first-touch).',
        recommendation: 'Develop top-of-funnel email campaigns to attract new prospects.',
        impact: 'medium',
        channels: ['Email Marketing'],
        metrics: {
          current: 3,
          benchmark: 15,
          change: -80
        },
        timeframe: 'Last 90 days'
      },
      {
        id: 'insight_4',
        type: 'anomaly',
        title: 'Direct Traffic Spike in Lagos',
        description: 'Direct traffic from Lagos increased 156% this week, suggesting strong word-of-mouth or brand recall.',
        recommendation: 'Investigate potential viral content or PR coverage driving brand awareness.',
        impact: 'high',
        channels: ['Direct'],
        metrics: {
          current: 256,
          benchmark: 100,
          change: 156
        },
        timeframe: 'Last 7 days'
      }
    ];
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      'Organic Search': Search,
      'Direct': Globe,
      'Email Marketing': Mail,
      'Social Media': Share2,
      'LinkedIn Ads': Building,
      'Google Ads': Target,
      'Referral': Link,
      'Content Marketing': FileText
    };
    return icons[channel as keyof typeof icons] || Activity;
  };

  const getInsightColor = (type: string) => {
    const colors = {
      opportunity: 'border-green-200 bg-green-50 text-green-800',
      underperforming: 'border-red-200 bg-red-50 text-red-800',
      trending: 'border-blue-200 bg-blue-50 text-blue-800',
      anomaly: 'border-yellow-200 bg-yellow-50 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'border-gray-200 bg-gray-50 text-gray-800';
  };

  const getJourneyTypeColor = (type: string) => {
    const colors = {
      direct: 'bg-green-100 text-green-800',
      simple: 'bg-blue-100 text-blue-800',
      complex: 'bg-yellow-100 text-yellow-800',
      multi_device: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  // Filter channels based on search and filters
  const filteredChannels = channelPerformance
    .filter(channel => {
      const matchesSearch = !searchQuery || 
        channel.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.source.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterChannel === 'all' || channel.channel === filterChannel;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => b.attributedRevenue - a.attributedRevenue);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 animate-pulse" />
            <span>Loading attribution analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAttributedRevenue = channelPerformance.reduce((sum, channel) => sum + channel.attributedRevenue, 0);
  const totalAttributedConversions = channelPerformance.reduce((sum, channel) => sum + channel.attributedConversions, 0);
  const avgConversionValue = totalAttributedRevenue / Math.max(totalAttributedConversions, 1);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Marketing Attribution Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attributionModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button variant="outline" size="sm" onClick={fetchAttributionData}>
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
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Attributed Revenue</p>
                <p className="text-xl font-semibold text-green-600">{formatCurrency(totalAttributedRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Attributed Conversions</p>
                <p className="text-xl font-semibold">{totalAttributedConversions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Conversion Value</p>
                <p className="text-xl font-semibold">{formatCurrency(avgConversionValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Channels</p>
                <p className="text-xl font-semibold">{channelPerformance.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Channel Overview</TabsTrigger>
          <TabsTrigger value="journeys">Customer Journeys</TabsTrigger>
          <TabsTrigger value="models">Attribution Models</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Channel Performance Chart */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Attribution by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredChannels.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="channel" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="attributedRevenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={filteredChannels.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ channel, value }) => `${channel}: ${formatCurrency(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="attributedRevenue"
                    >
                      {filteredChannels.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Channel Performance Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Channel Performance Details</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search channels..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Channel</th>
                      <th className="text-right p-3">Sessions</th>
                      <th className="text-right p-3">Conversions</th>
                      <th className="text-right p-3">Conv. Rate</th>
                      <th className="text-right p-3">Attributed Revenue</th>
                      <th className="text-right p-3">Avg Order Value</th>
                      <th className="text-right p-3">Lead Quality</th>
                      <th className="text-right p-3">Time to Convert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChannels.map((channel) => {
                      const Icon = getChannelIcon(channel.channel);
                      return (
                        <tr key={`${channel.channel}-${channel.source}`} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-gray-500" />
                              <div>
                                <div className="font-medium">{channel.channel}</div>
                                <div className="text-xs text-gray-500">{channel.source} / {channel.medium}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right p-3">{channel.sessions.toLocaleString()}</td>
                          <td className="text-right p-3">{channel.attributedConversions.toFixed(1)}</td>
                          <td className="text-right p-3">{formatPercentage(channel.conversionRate)}</td>
                          <td className="text-right p-3 font-medium text-green-600">
                            {formatCurrency(channel.attributedRevenue)}
                          </td>
                          <td className="text-right p-3">{formatCurrency(channel.avgOrderValue)}</td>
                          <td className="text-right p-3">
                            <div className="flex items-center justify-end gap-1">
                              <span>{channel.leadQualityScore}</span>
                              <div className="w-12 h-1 bg-gray-200 rounded">
                                <div
                                  className="h-full bg-blue-500 rounded"
                                  style={{ width: `${channel.leadQualityScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="text-right p-3">{channel.avgTimeToConversion}d</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Journey List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Customer Journeys ({customerJourneys.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {customerJourneys.map((journey) => (
                      <div
                        key={journey.customerId}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedJourney?.customerId === journey.customerId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedJourney(journey)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">{journey.customerName}</h3>
                          <Badge className={getJourneyTypeColor(journey.journeyType)}>
                            {journey.journeyType.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Value:</span>
                            <span className="font-medium text-green-600">{formatCurrency(journey.conversionValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Touchpoints:</span>
                            <span className="font-medium">{journey.touchpointCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{journey.journeyDuration}d</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">First Touch:</span>
                            <span className="font-medium">{journey.firstTouchChannel}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Journey Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedJourney ? (
                    <>
                      <Activity className="w-5 h-5" />
                      {selectedJourney.customerName} Journey
                    </>
                  ) : (
                    'Select a journey to view details'
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedJourney ? (
                  <div className="space-y-6">
                    {/* Journey Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedJourney.conversionValue)}</div>
                        <div className="text-sm text-gray-600">Conversion Value</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedJourney.touchpointCount}</div>
                        <div className="text-sm text-gray-600">Touchpoints</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedJourney.journeyDuration}</div>
                        <div className="text-sm text-gray-600">Days</div>
                      </div>
                      <div className="text-center">
                        <Badge className={getJourneyTypeColor(selectedJourney.journeyType)}>
                          {selectedJourney.journeyType.replace('_', ' ')}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">Journey Type</div>
                      </div>
                    </div>

                    {/* Journey Visualization */}
                    <div>
                      <h3 className="font-medium mb-3">Customer Touchpoints</h3>
                      <div className="space-y-3">
                        {selectedJourney.touchpoints.map((touchpoint, index) => {
                          const Icon = getChannelIcon(touchpoint.channel);
                          const isFirst = index === 0;
                          const isLast = index === selectedJourney.touchpoints.length - 1;
                          
                          return (
                            <div key={touchpoint.id} className="flex items-center gap-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isFirst ? 'bg-green-100 border-2 border-green-500' :
                                  isLast ? 'bg-red-100 border-2 border-red-500' :
                                  'bg-blue-100 border-2 border-blue-300'
                                }`}>
                                  <Icon className={`w-4 h-4 ${
                                    isFirst ? 'text-green-600' :
                                    isLast ? 'text-red-600' :
                                    'text-blue-600'
                                  }`} />
                                </div>
                                {index < selectedJourney.touchpoints.length - 1 && (
                                  <div className="w-0.5 h-6 bg-gray-300 mt-1" />
                                )}
                              </div>
                              
                              <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-sm">{touchpoint.channel}</h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{formatTimeAgo(touchpoint.timestamp)}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {touchpoint.deviceType}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="text-gray-600">Page:</span>
                                    <span className="font-medium ml-1">{touchpoint.page}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Value:</span>
                                    <span className="font-medium ml-1">{touchpoint.value} pts</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Attribution Breakdown */}
                    <div>
                      <h3 className="font-medium mb-3">Attribution by Model</h3>
                      <div className="space-y-3">
                        {attributionModels.filter(m => selectedJourney.attribution[m.id]).map((model) => (
                          <Card key={model.id} className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{model.name}</h4>
                              <Badge variant="outline">{model.type.replace('_', ' ')}</Badge>
                            </div>
                            <div className="space-y-2">
                              {Object.entries(selectedJourney.attribution[model.id] || {}).map(([channel, attribution]) => (
                                <div key={channel} className="flex items-center justify-between">
                                  <span className="text-sm">{channel}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 rounded">
                                      <div
                                        className="h-full bg-blue-500 rounded"
                                        style={{ width: `${attribution * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium">{formatPercentage(attribution * 100)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-gray-500">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a customer journey from the left to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attributionModels.map((model) => (
              <Card key={model.id} className={`${model.id === selectedModel ? 'border-blue-500 bg-blue-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Button
                      variant={model.id === selectedModel ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedModel(model.id)}
                    >
                      {model.id === selectedModel ? 'Active' : 'Select'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{model.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline">{model.type.replace('_', ' ')}</Badge>
                    </div>
                    
                    {model.attributionRules.conversionWindow && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Window:</span>
                        <span className="font-medium">{model.attributionRules.conversionWindow} days</span>
                      </div>
                    )}
                    
                    {model.attributionRules.firstTouchWeight && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">First Touch:</span>
                        <span className="font-medium">{formatPercentage(model.attributionRules.firstTouchWeight * 100)}</span>
                      </div>
                    )}
                    
                    {model.attributionRules.lastTouchWeight && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Touch:</span>
                        <span className="font-medium">{formatPercentage(model.attributionRules.lastTouchWeight * 100)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id} className={`border-2 ${getInsightColor(insight.type)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                        {insight.impact} impact
                      </Badge>
                      <Badge variant="outline">{insight.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{insight.description}</p>
                  
                  <div className="bg-white/50 p-3 rounded text-sm mb-4">
                    <p className="font-medium text-xs mb-1">💡 Recommendation:</p>
                    <p>{insight.recommendation}</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current Value:</span>
                      <span className="font-medium ml-1">{insight.metrics.current}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Benchmark:</span>
                      <span className="font-medium ml-1">{insight.metrics.benchmark}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Change:</span>
                      <span className={`font-medium ml-1 ${
                        insight.metrics.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insight.metrics.change > 0 ? '+' : ''}{insight.metrics.change}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                    <span>Channels: {insight.channels.join(', ')}</span>
                    <span>{insight.timeframe}</span>
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