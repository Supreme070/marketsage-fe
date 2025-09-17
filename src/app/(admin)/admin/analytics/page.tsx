"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { usePhase5Analytics, usePhase5Performance } from "@/hooks/usePhase4Phase5AI";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Globe,
  MessageSquare,
  Mail,
  Phone,
  Zap,
  Activity,
  RefreshCw,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Target,
  Eye,
  MousePointer,
  Share2,
  Brain,
  Database,
  Clock,
  MapPin,
  PieChart,
  Terminal,
  Cpu,
  HardDrive,
  Network,
  Signal,
  Gauge
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AnalyticsMetrics {
  overview: {
    totalUsers: number;
    totalUsersGrowth: number;
    monthlyActiveUsers: number;
    mauGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    averageRevenuePerUser: number;
    arpuGrowth: number;
  };
  users: {
    newUsers: number;
    newUsersGrowth: number;
    retentionRate: number;
    retentionGrowth: number;
    churnRate: number;
    churnImprovement: number;
    averageSessionDuration: number;
    sessionGrowth: number;
  };
  revenue: {
    mrr: number;
    mrrGrowth: number;
    arr: number;
    arrGrowth: number;
    ltv: number;
    ltvGrowth: number;
    churnRevenue: number;
    churnRevenueChange: number;
  };
  features: {
    emailCampaigns: { usage: number; growth: number; };
    smsCampaigns: { usage: number; growth: number; };
    whatsappCampaigns: { usage: number; growth: number; };
    leadpulseTracking: { usage: number; growth: number; };
    aiFeatures: { usage: number; growth: number; };
    workflows: { usage: number; growth: number; };
  };
  geographic: {
    nigeria: { users: number; revenue: number; growth: number; };
    ghana: { users: number; revenue: number; growth: number; };
    kenya: { users: number; revenue: number; growth: number; };
    southAfrica: { users: number; revenue: number; growth: number; };
    other: { users: number; revenue: number; growth: number; };
  };
  performance: {
    apiRequests: number;
    apiRequestsGrowth: number;
    responseTime: number;
    responseTimeChange: number;
    uptime: number;
    uptimeChange: number;
    errorRate: number;
    errorRateChange: number;
  };
}

export default function AdminAnalyticsPage() {
  const { permissions, staffRole } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use Phase 5 hooks
  const { executeAnalyticsQuery, isLoading: analyticsLoading } = usePhase5Analytics();
  const { getPerformanceMetrics, isLoading: performanceLoading } = usePhase5Performance();

  // Fetch analytics data using Phase 5 endpoints
  const fetchAnalyticsData = async () => {
    setIsRefreshing(true);
    try {
      // Get organization analytics
      const orgAnalytics = await executeAnalyticsQuery({
        startDate: new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString(),
        endDate: new Date().toISOString(),
        granularity: getGranularity(timeRange),
        metrics: ['users', 'revenue', 'campaigns', 'performance'],
        filters: { includeAfrican: true, includePredictive: true }
      });

      // Get performance metrics
      const perfMetrics = await getPerformanceMetrics(timeRange);

      if (orgAnalytics && perfMetrics) {
        setAnalyticsData(transformAnalyticsData(orgAnalytics));
        setPerformanceData(perfMetrics);
        toast.success('Analytics data updated');
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper functions
  const getTimeRangeMs = (timeRange: string): number => {
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    };
    return ranges[timeRange] || ranges['30d'];
  };

  const getGranularity = (timeRange: string): string => {
    const granularities = {
      '7d': 'day',
      '30d': 'day',
      '90d': 'week',
      '1y': 'month',
    };
    return granularities[timeRange] || 'day';
  };

  const transformAnalyticsData = (data: any): AnalyticsMetrics => {
    // Transform Phase 5 analytics data to match the expected interface
    return {
      overview: {
        totalUsers: data.metrics?.totalUsers || 0,
        totalUsersGrowth: data.metrics?.userGrowthRate || 0,
        monthlyActiveUsers: data.metrics?.activeUsers || 0,
        mauGrowth: data.metrics?.activeUserGrowth || 0,
        totalRevenue: data.metrics?.totalRevenue || 0,
        revenueGrowth: data.metrics?.revenueGrowthRate || 0,
        averageRevenuePerUser: data.metrics?.averageRevenuePerUser || 0,
        arpuGrowth: data.metrics?.arpuGrowth || 0,
      },
      users: {
        newUsers: data.metrics?.newUsers || 0,
        newUsersGrowth: data.metrics?.newUserGrowth || 0,
        retentionRate: data.metrics?.retentionRate || 0,
        retentionGrowth: data.metrics?.retentionGrowth || 0,
        churnRate: data.metrics?.churnRate || 0,
        churnImprovement: data.metrics?.churnImprovement || 0,
        averageSessionDuration: data.metrics?.averageSessionDuration || 0,
        sessionGrowth: data.metrics?.sessionGrowth || 0,
      },
      revenue: {
        mrr: data.metrics?.mrr || 0,
        mrrGrowth: data.metrics?.mrrGrowth || 0,
        arr: data.metrics?.arr || 0,
        arrGrowth: data.metrics?.arrGrowth || 0,
        ltv: data.metrics?.ltv || 0,
        ltvGrowth: data.metrics?.ltvGrowth || 0,
        churnRevenue: data.metrics?.churnRevenue || 0,
        churnRevenueChange: data.metrics?.churnRevenueChange || 0,
      },
      features: {
        emailCampaigns: { usage: data.metrics?.emailCampaigns || 0, growth: data.metrics?.emailGrowth || 0 },
        smsCampaigns: { usage: data.metrics?.smsCampaigns || 0, growth: data.metrics?.smsGrowth || 0 },
        whatsappCampaigns: { usage: data.metrics?.whatsappCampaigns || 0, growth: data.metrics?.whatsappGrowth || 0 },
        leadpulseTracking: { usage: data.metrics?.leadpulseTracking || 0, growth: data.metrics?.leadpulseGrowth || 0 },
        aiFeatures: { usage: data.metrics?.aiFeatures || 0, growth: data.metrics?.aiGrowth || 0 },
        workflows: { usage: data.metrics?.workflows || 0, growth: data.metrics?.workflowGrowth || 0 },
      },
      geographic: {
        nigeria: { users: data.metrics?.nigeriaUsers || 0, revenue: data.metrics?.nigeriaRevenue || 0, growth: data.metrics?.nigeriaGrowth || 0 },
        ghana: { users: data.metrics?.ghanaUsers || 0, revenue: data.metrics?.ghanaRevenue || 0, growth: data.metrics?.ghanaGrowth || 0 },
        kenya: { users: data.metrics?.kenyaUsers || 0, revenue: data.metrics?.kenyaRevenue || 0, growth: data.metrics?.kenyaGrowth || 0 },
        southAfrica: { users: data.metrics?.southAfricaUsers || 0, revenue: data.metrics?.southAfricaRevenue || 0, growth: data.metrics?.southAfricaGrowth || 0 },
        other: { users: data.metrics?.otherUsers || 0, revenue: data.metrics?.otherRevenue || 0, growth: data.metrics?.otherGrowth || 0 },
      },
      performance: {
        apiRequests: data.metrics?.apiRequests || 0,
        apiRequestsGrowth: data.metrics?.apiRequestsGrowth || 0,
        responseTime: data.metrics?.responseTime || 0,
        responseTimeChange: data.metrics?.responseTimeChange || 0,
        uptime: data.metrics?.uptime || 0,
        uptimeChange: data.metrics?.uptimeChange || 0,
        errorRate: data.metrics?.errorRate || 0,
        errorRateChange: data.metrics?.errorRateChange || 0,
      },
    };
  };

  // Load data on component mount
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const isLoading = analyticsLoading || performanceLoading;

  // Use analyticsData from Phase 5 endpoints
  const metrics = analyticsData;

  // Helper functions for formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat().format(number);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading analytics data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p>No analytics data available</p>
            <button 
              onClick={fetchAnalyticsData}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">DATA_STREAM</h1>
          <p className="admin-subtitle">PLATFORM_ANALYTICS.REALTIME_INSIGHTS</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-secondary flex items-center gap-2">
            <Clock className="h-3 w-3" />
            UPDATED: {new Date().toLocaleTimeString()}
          </div>
          <button 
            className="admin-btn admin-btn-primary flex items-center gap-2"
            onClick={fetchAnalyticsData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium">Time Range:</span>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1 border rounded text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Analytics Tabs */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overview Cards */}
          <div className="admin-card">
            <div className="admin-card-header">
              <Users className="h-4 w-4" />
              <span>Total Users</span>
            </div>
            <div className="admin-card-content">
              <div className="text-2xl font-bold">{formatNumber(metrics.overview.totalUsers)}</div>
              <div className={`text-sm ${metrics.overview.totalUsersGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercentage(metrics.overview.totalUsersGrowth)}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <Activity className="h-4 w-4" />
              <span>Active Users</span>
            </div>
            <div className="admin-card-content">
              <div className="text-2xl font-bold">{formatNumber(metrics.overview.monthlyActiveUsers)}</div>
              <div className={`text-sm ${metrics.overview.mauGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercentage(metrics.overview.mauGrowth)}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <DollarSign className="h-4 w-4" />
              <span>Total Revenue</span>
            </div>
            <div className="admin-card-content">
              <div className="text-2xl font-bold">{formatCurrency(metrics.overview.totalRevenue)}</div>
              <div className={`text-sm ${metrics.overview.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercentage(metrics.overview.revenueGrowth)}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <Target className="h-4 w-4" />
              <span>ARPU</span>
            </div>
            <div className="admin-card-content">
              <div className="text-2xl font-bold">{formatCurrency(metrics.overview.averageRevenuePerUser)}</div>
              <div className={`text-sm ${metrics.overview.arpuGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercentage(metrics.overview.arpuGrowth)}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {performanceData && (
          <div className="admin-card">
            <div className="admin-card-header">
              <Gauge className="h-4 w-4" />
              <span>System Performance</span>
            </div>
            <div className="admin-card-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Response Time</div>
                  <div className="text-lg font-semibold">{performanceData.system?.responseTime || 0}ms</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Uptime</div>
                  <div className="text-lg font-semibold">{performanceData.system?.uptime || 0}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Error Rate</div>
                  <div className="text-lg font-semibold">{performanceData.system?.errorRate || 0}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Features Usage */}
        <div className="admin-card">
          <div className="admin-card-header">
            <Brain className="h-4 w-4" />
            <span>AI Features Usage</span>
          </div>
          <div className="admin-card-content">
            <div className="text-2xl font-bold">{formatNumber(metrics.features.aiFeatures.usage)}</div>
            <div className={`text-sm ${metrics.features.aiFeatures.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercentage(metrics.features.aiFeatures.growth)} growth
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}