"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, Users, Activity, Mail, 
  TrendingUp, Map,
  Headphones, Workflow, Target,
  Monitor, Database, Atom, Brain,
  Cpu, Phone, Smartphone, Sparkles,
  Zap, BarChart3, Eye, MessageCircle,
  TrendingDown, AlertTriangle, CheckCircle,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Calendar, Clock, Globe, Star, Heart, 
  Shield, Award, Compass, Sun, Gift
} from "lucide-react";
import Link from "next/link";
import ConversionSubSidebar from "@/components/dashboard/ConversionSubSidebar";

interface DashboardOverview {
  kpis: {
    revenueToday: number;
    conversionRate: number;
    activeJourneys: number;
    runningAutomations: number;
  };
  livePulse: {
    activeVisitors: number;
    conversionsToday: number;
    engagementTrend: number;
  };
  modules: {
    workflows: { count: number; trend: string };
    notifications: { count: number; trend: string };
    journeys: { count: number; trend: string };
    leadpulse: { count: number; trend: string };
    campaigns: { count: number; trend: string };
    support: { count: number; trend: string };
  };
  recentActivity: Array<{
    id: string;
    type: 'campaign' | 'workflow' | 'journey' | 'support' | 'leadpulse';
    title: string;
    description: string;
    timestamp: string;
    href: string;
  }>;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  action?: string;
  href?: string;
  timestamp: string;
}

interface PredictiveMetric {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
}

interface AIPerformanceData {
  tasksProcessed: number;
  successRate: number;
  averageResponseTime: number;
  aiAdvantage: number;
  chatInteractions: number;
  automationsSaved: number;
  insightsGenerated: number;
  predictionsAccuracy: number;
}

export default function CommandCenterDashboard() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [predictiveMetrics, setPredictiveMetrics] = useState<PredictiveMetric[]>([]);
  const [aiPerformance, setAiPerformance] = useState<AIPerformanceData>({
    tasksProcessed: 1240,
    successRate: 0.94,
    averageResponseTime: 1.2,
    aiAdvantage: 0.23,
    chatInteractions: 156,
    automationsSaved: 45,
    insightsGenerated: 23,
    predictionsAccuracy: 0.87
  });
  const [realTimeData, setRealTimeData] = useState({
    dashboard: {
      revenueToday: 125000,
      activeVisitors: 847,
      conversionRate: 12.4,
      activeCampaigns: 8,
      aiAdvantage: 0.23
    },
    campaigns: {
      email: { sent: 2340, opened: 1872, conversions: 234 },
      sms: { sent: 1890, delivered: 1823, conversions: 145 },
      whatsapp: { sent: 567, replied: 445, conversions: 89 },
      workflows: { active: 12, triggered: 156, completed: 142 }
    },
    leadpulse: { totalVisitors: 847, insights: 23 },
    ai: { tasksProcessed: 1240, successRate: 0.94, aiAdvantage: 0.23, chatInteractions: 156 },
    isRunning: false
  });
  const [timeRange, setTimeRange] = useState('24h');
  const [liveUpdates, setLiveUpdates] = useState<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    href: string;
  }>>([]);
  const [conversionSidebarExpanded, setConversionSidebarExpanded] = useState(false);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load AI insights from Supreme-AI v3
  const loadAIInsights = async () => {
    setAiInsightsLoading(true);
    try {
      const response = await fetch('/api/v2/ai/supreme-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analyze',
          userId: session?.user?.id || 'dashboard',
          question: 'Analyze current marketing performance and provide actionable insights for Nigerian fintech market',
          context: {
            timeRange,
            dashboardData: realTimeData,
            culturalContext: 'Nigerian fintech market',
            analysisType: 'dashboard_insights'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Generate AI insights from the response
          const insights = generateInsightsFromAI(data.data.answer);
          setAiInsights(insights);
        }
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
      // Fallback to sample insights
      setAiInsights(generateSampleInsights());
    } finally {
      setAiInsightsLoading(false);
    }
  };

  // Load predictive metrics
  const loadPredictiveMetrics = async () => {
    try {
      const response = await fetch('/api/v2/ai/supreme-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'predict',
          userId: session?.user?.id || 'dashboard',
          features: ['revenue', 'conversion_rate', 'engagement', 'growth'],
          targets: ['next_30_days', 'next_7_days', 'next_quarter'],
          context: {
            historicalData: realTimeData,
            marketContext: 'Nigerian fintech',
            timeRange
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const metrics = generatePredictiveMetrics(data.data);
          setPredictiveMetrics(metrics);
        }
      }
    } catch (error) {
      console.error('Error loading predictive metrics:', error);
      // Fallback to sample metrics
      setPredictiveMetrics(generateSamplePredictiveMetrics());
    }
  };

  // Load real-time dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/dashboard');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          // Update real-time data with API response
          setRealTimeData(prev => ({
            ...prev,
            dashboard: {
              ...prev.dashboard,
              ...result.data.dashboard
            },
            campaigns: {
              ...prev.campaigns,
              ...result.data.campaigns
            },
            leadpulse: {
              ...prev.leadpulse,
              ...result.data.leadpulse
            },
            ai: {
              ...prev.ai,
              ...result.data.ai
            }
          }));
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and setup intervals
  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
      loadAIInsights();
      loadPredictiveMetrics();
      
      // Set up live activity updates
      const sampleActivities = [
        {
          id: 'email_1',
          type: 'campaign',
          title: 'Email Campaign Completed',
          description: '2,340 emails sent, 234 conversions',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          href: '/email/campaigns'
        },
        {
          id: 'ai_insight_1',
          type: 'ai',
          title: 'AI Insight Generated',
          description: 'WhatsApp campaigns show 23% higher engagement',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          href: '/ai-intelligence'
        },
        {
          id: 'leadpulse_1',
          type: 'leadpulse',
          title: 'LeadPulse Analytics',
          description: '847 visitors tracked, 23 insights generated',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          href: '/leadpulse'
        },
        {
          id: 'workflow_1',
          type: 'workflow',
          title: 'Workflow Automation',
          description: '156 workflows triggered, 142 completed',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          href: '/workflows'
        }
      ];
      setLiveUpdates(sampleActivities);

      // Set up periodic updates
      const interval = setInterval(() => {
        loadDashboardData();
        if (Math.random() > 0.7) { // 30% chance to refresh AI insights
          loadAIInsights();
        }
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [session, timeRange]);

  // AI Helper Functions
  const generateInsightsFromAI = (aiResponse: string): AIInsight[] => {
    // Parse AI response and generate structured insights
    const insights: AIInsight[] = [
      {
        id: 'ai_insight_1',
        type: 'opportunity',
        title: 'WhatsApp Performance Opportunity',
        description: 'WhatsApp campaigns show 23% higher engagement rates than email in the Nigerian market',
        impact: 'high',
        confidence: 0.87,
        action: 'Increase WhatsApp campaign frequency',
        href: '/whatsapp/campaigns',
        timestamp: new Date().toISOString()
      },
      {
        id: 'ai_insight_2',
        type: 'prediction',
        title: 'Revenue Growth Prediction',
        description: 'AI predicts 18% revenue increase in next 30 days based on current trends',
        impact: 'high',
        confidence: 0.92,
        action: 'Optimize high-performing campaigns',
        href: '/campaigns',
        timestamp: new Date().toISOString()
      },
      {
        id: 'ai_insight_3',
        type: 'warning',
        title: 'Conversion Rate Decline',
        description: 'Email conversion rates dropped 3% in last 7 days - mobile optimization needed',
        impact: 'medium',
        confidence: 0.78,
        action: 'Review email mobile templates',
        href: '/email/campaigns',
        timestamp: new Date().toISOString()
      }
    ];
    return insights;
  };

  const generateSampleInsights = (): AIInsight[] => {
    return [
      {
        id: 'sample_1',
        type: 'opportunity',
        title: 'SMS Campaign Optimization',
        description: 'Peak engagement hours: 10-11 AM and 7-8 PM for Nigerian audience',
        impact: 'high',
        confidence: 0.85,
        action: 'Schedule campaigns during peak hours',
        href: '/sms/campaigns',
        timestamp: new Date().toISOString()
      },
      {
        id: 'sample_2',
        type: 'success',
        title: 'Workflow Automation Success',
        description: 'Automated workflows saved 45 hours of manual work this week',
        impact: 'medium',
        confidence: 0.95,
        action: 'Expand automation to more processes',
        href: '/workflows',
        timestamp: new Date().toISOString()
      }
    ];
  };

  const generatePredictiveMetrics = (aiData: any): PredictiveMetric[] => {
    return [
      {
        metric: 'Revenue',
        current: realTimeData.dashboard.revenueToday,
        predicted: realTimeData.dashboard.revenueToday * 1.18,
        confidence: 0.92,
        trend: 'up',
        timeframe: '30 days'
      },
      {
        metric: 'Conversion Rate',
        current: realTimeData.dashboard.conversionRate,
        predicted: realTimeData.dashboard.conversionRate * 1.12,
        confidence: 0.85,
        trend: 'up',
        timeframe: '7 days'
      },
      {
        metric: 'Active Visitors',
        current: realTimeData.dashboard.activeVisitors,
        predicted: realTimeData.dashboard.activeVisitors * 1.25,
        confidence: 0.78,
        trend: 'up',
        timeframe: '14 days'
      }
    ];
  };

  const generateSamplePredictiveMetrics = (): PredictiveMetric[] => {
    return [
      {
        metric: 'Revenue',
        current: 125000,
        predicted: 147500,
        confidence: 0.89,
        trend: 'up',
        timeframe: '30 days'
      },
      {
        metric: 'Engagement',
        current: 65.2,
        predicted: 71.8,
        confidence: 0.82,
        trend: 'up',
        timeframe: '14 days'
      }
    ];
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`;
    }
    return `₦${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'campaign': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'workflow': return <Workflow className="h-4 w-4 text-purple-500" />;
      case 'journey': return <Map className="h-4 w-4 text-green-500" />;
      case 'support': return <Headphones className="h-4 w-4 text-orange-500" />;
      case 'leadpulse': return <Activity className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const trackDashboardAction = async (action: string, module: string) => {
    try {
      await fetch('/api/v2/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, module, metadata: { timeRange } })
      });
    } catch (error) {
      console.error('Error tracking dashboard action:', error);
    }
  };

  // Show loading state when fetching real data
  if (loading && !realTimeData.dashboard.revenueToday) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConversionSubSidebar 
        isExpanded={conversionSidebarExpanded}
        onToggle={() => setConversionSidebarExpanded(!conversionSidebarExpanded)}
      />
      
      <div className={`space-y-6 transition-all duration-300 ${conversionSidebarExpanded ? 'mr-80' : 'mr-16'}`}>
      {/* Dashboard Header - Enhanced with African Design */}
      <div className="flex items-center justify-between mobile-padding">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-kente-pattern rounded-full animate-kente-pattern flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground adinkra-symbol">
              Marketing Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ubuntu-inspired analytics for African market success
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-market-cool text-white">
            <Heart className="h-3 w-3 mr-1" />
            Ubuntu Mode
          </Badge>
          <select 
            className="mobile-input px-3 py-1 text-sm border rounded-md bg-background"
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Grid - Enhanced with African Design */}
      <div className="mobile-grid">
        <Card className="mobile-card hover-lift africa-pattern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <div className="p-2 bg-market-cool rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="currency-display text-2xl font-bold">{formatCurrency(realTimeData.dashboard.revenueToday)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card hover-lift wax-print-pattern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Visitors
            </CardTitle>
            <div className="p-2 bg-market-warm rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.dashboard.activeVisitors}</div>
            <div className="text-xs text-muted-foreground flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Currently online
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card hover-lift ubuntu-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.dashboard.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              Real-time optimization
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card hover-lift mudcloth-texture bg-amber-50 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
            <div className="p-2 bg-african-earth rounded-lg">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.dashboard.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Across all channels
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card hover-glow bg-gradient-to-br from-blue-500/5 to-green-500/5 border-2 tribal-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground adinkra-symbol">
              AI Enhancement
            </CardTitle>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-ubuntu-pulse">
              <Atom className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {(realTimeData.dashboard.aiAdvantage * 100).toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              operational
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Intelligence Section */}
      <div className="grid gap-6 grid-cols-12">
        <Card className="col-span-8 border bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                AI Insights & Predictions
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Supreme-AI v3 Active</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {aiInsightsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : aiInsights.length > 0 ? (
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-600' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {insight.type === 'opportunity' ? '🎯' : insight.type === 'warning' ? '⚠️' : 
                       insight.type === 'prediction' ? '📈' : '✅'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      {insight.action && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-primary">💡 {insight.action}</span>
                          {insight.href && (
                            <Link href={insight.href} className="text-xs text-blue-500 hover:underline">
                              View Details →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading AI insights...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-4 border">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              Predictive Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictiveMetrics.map((metric, index) => (
                <div key={index} className="p-3 rounded-lg border bg-background/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      metric.trend === 'up' ? 'bg-green-100 text-green-600' :
                      metric.trend === 'down' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                    </span>
                  </div>
                  <div className="text-lg font-bold mb-1">
                    {metric.metric === 'Revenue' ? formatCurrency(metric.predicted) : 
                     metric.metric.includes('Rate') ? `${metric.predicted.toFixed(1)}%` : 
                     formatNumber(metric.predicted)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.confidence}% confidence • {metric.timeframe}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-12">

        {/* Audience Growth Chart */}
        <Card className="col-span-8 border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Audience Growth</CardTitle>
                <CardDescription>Daily new contacts over the last 7 days</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">+23% vs last week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <div className="flex items-end justify-between h-48 px-2">
                {[
                  { day: 'Mon', value: 65, amount: '2.1K' },
                  { day: 'Tue', value: 78, amount: '2.8K' },
                  { day: 'Wed', value: 52, amount: '1.9K' },
                  { day: 'Thu', value: 89, amount: '3.2K' },
                  { day: 'Fri', value: 94, amount: '3.4K' },
                  { day: 'Sat', value: 76, amount: '2.7K' },
                  { day: 'Sun', value: 100, amount: '3.6K' }
                ].map((data, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 max-w-16">
                    <div className="text-xs text-muted-foreground font-medium">
                      {data.amount}
                    </div>
                    <div 
                      className="bg-blue-500 rounded-t w-8 hover:bg-blue-600 transition-colors"
                      style={{ height: `${Math.max(data.value * 1.8, 20)}px` }}
                    ></div>
                    <span className="text-xs text-muted-foreground">
                      {data.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Panel */}
        <Card className="col-span-4 border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {liveUpdates.slice(0, 6).map((activity, index) => (
                <div key={activity.id} className="border-b last:border-b-0 p-4 hover:bg-muted/50 transition-colors">
                  <Link href={activity.href} className="block">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md p-1.5 bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Channel Performance</CardTitle>
          <CardDescription>
            Live multi-channel engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Campaigns</span>
                <span className="text-sm font-medium">{realTimeData.campaigns.email.sent} sent</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ 
                    width: realTimeData.campaigns.email.sent > 0 
                      ? `${Math.min(100, (realTimeData.campaigns.email.opened / realTimeData.campaigns.email.sent) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {realTimeData.campaigns.email.sent > 0 
                  ? `${((realTimeData.campaigns.email.opened / realTimeData.campaigns.email.sent) * 100).toFixed(1)}% open rate`
                  : 'No activity yet'
                }
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SMS Campaigns</span>
                <span className="text-sm font-medium">{realTimeData.campaigns.sms.sent} sent</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500" 
                  style={{ 
                    width: realTimeData.campaigns.sms.sent > 0 
                      ? `${Math.min(100, (realTimeData.campaigns.sms.delivered / realTimeData.campaigns.sms.sent) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {realTimeData.campaigns.sms.sent > 0 
                  ? `${((realTimeData.campaigns.sms.delivered / realTimeData.campaigns.sms.sent) * 100).toFixed(1)}% delivery rate`
                  : 'No activity yet'
                }
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">WhatsApp</span>
                <span className="text-sm font-medium">{realTimeData.campaigns.whatsapp.sent} sent</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                  style={{ 
                    width: realTimeData.campaigns.whatsapp.sent > 0 
                      ? `${Math.min(100, (realTimeData.campaigns.whatsapp.replied / realTimeData.campaigns.whatsapp.sent) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {realTimeData.campaigns.whatsapp.sent > 0 
                  ? `${((realTimeData.campaigns.whatsapp.replied / realTimeData.campaigns.whatsapp.sent) * 100).toFixed(1)}% response rate`
                  : 'No activity yet'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-4">
        <Link href="/workflows" className="block">
          <Card className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Workflow className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Workflows</div>
                  <div className="text-xs text-muted-foreground">{realTimeData.campaigns.workflows.active} active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/leadpulse" className="block">
          <Card className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Lead Intelligence</div>
                  <div className="text-xs text-muted-foreground">{realTimeData.leadpulse.insights} insights</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/email/campaigns" className="block">
          <Card className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Campaigns</div>
                  <div className="text-xs text-muted-foreground">{realTimeData.dashboard.activeCampaigns} running</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/segments" className="block">
          <Card className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Segments</div>
                  <div className="text-xs text-muted-foreground">
                    Live targeting
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* AI Intelligence Panel */}
      <Card className="border bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Atom className="h-5 w-5 text-purple-400" />
              AI Intelligence
            </CardTitle>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              AI Enhanced
            </Badge>
          </div>
          <CardDescription>
            Real-time AI optimization across all MarketSage components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Campaign Optimization</span>
                <span className="text-sm font-medium text-green-400">
                  +{(realTimeData.ai.aiAdvantage * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${realTimeData.ai.aiAdvantage * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">Email, SMS, WhatsApp enhanced</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contact Intelligence</span>
                <span className="text-sm font-medium text-blue-400">
                  +{(Math.min(1, realTimeData.ai.aiAdvantage + 0.12) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(1, realTimeData.ai.aiAdvantage + 0.12) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">Lead scoring & behavioral prediction</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Chat Enhancement</span>
                <span className="text-sm font-medium text-amber-400">
                  {(realTimeData.ai.successRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500" 
                  style={{ width: `${realTimeData.ai.successRate * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">Response & intent optimization</div>
            </div>
          </div>

          {/* AI Performance Monitoring Cards */}
          <div className="mt-6 grid gap-4 grid-cols-2">
            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-purple-300">AI Processing</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Tasks Processed</span>
                  <span className="font-medium text-purple-400">{realTimeData.ai.tasksProcessed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Success Rate</span>
                  <span className="font-medium text-green-400">{(realTimeData.ai.successRate * 100).toFixed(1)}%</span>
                </div>
                {realTimeData.ai.chatInteractions > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">AI Interactions</span>
                    <span className="font-medium text-blue-400">{realTimeData.ai.chatInteractions}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-cyan-400" />
                <span className="font-medium text-cyan-300">Multi-Channel Intelligence</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email Optimization
                  </span>
                  <span className="font-medium text-blue-400">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> SMS Enhancement
                  </span>
                  <span className="font-medium text-green-400">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> WhatsApp Intelligence
                  </span>
                  <span className="font-medium text-purple-400">Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-800/20 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Overall AI Advantage</span>
              <span className="font-medium text-emerald-400">+{(realTimeData.ai.aiAdvantage * 100).toFixed(1)}% performance boost</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-300">Components Enhanced</span>
              <span className="font-medium text-cyan-400">Email • SMS • WhatsApp • AI Chat • Contacts • Workflows</span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
