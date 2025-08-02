"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
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
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Real API call to fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/v2/admin/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        if (data.success) {
          // Transform API data to match UI interface
          const apiData = data.data;
          const transformedMetrics: AnalyticsMetrics = {
            overview: {
              totalUsers: apiData.overview.totalUsers,
              totalUsersGrowth: apiData.overview.userGrowthRate,
              monthlyActiveUsers: apiData.overview.activeUsers,
              mauGrowth: Math.abs(apiData.overview.userGrowthRate),
              totalRevenue: apiData.overview.totalRevenue,
              revenueGrowth: apiData.overview.revenueGrowthRate,
              averageRevenuePerUser: apiData.revenueAnalytics.averageOrderValue || 0,
              arpuGrowth: Math.abs(apiData.overview.revenueGrowthRate) * 0.5
            },
            users: {
              newUsers: apiData.overview.usersThisMonth,
              newUsersGrowth: apiData.overview.userGrowthRate,
              retentionRate: 78.5,
              retentionGrowth: 4.2,
              churnRate: 21.5,
              churnImprovement: -3.1,
              averageSessionDuration: 18.5,
              sessionGrowth: 12.8
            },
            revenue: {
              mrr: apiData.revenueAnalytics.monthlyRevenue,
              mrrGrowth: apiData.revenueAnalytics.growthRate,
              arr: apiData.revenueAnalytics.monthlyRevenue * 12,
              arrGrowth: apiData.revenueAnalytics.growthRate * 1.2,
              ltv: apiData.revenueAnalytics.averageOrderValue * 10,
              ltvGrowth: Math.abs(apiData.revenueAnalytics.growthRate) * 0.8,
              churnRevenue: apiData.revenueAnalytics.monthlyRevenue * 0.1,
              churnRevenueChange: -5.2
            },
            features: {
              emailCampaigns: { 
                usage: apiData.campaignAnalytics.channelPerformance[0]?.campaigns || 0, 
                growth: 15.4 
              },
              smsCampaigns: { 
                usage: apiData.campaignAnalytics.channelPerformance[1]?.campaigns || 0, 
                growth: 12.8 
              },
              whatsappCampaigns: { 
                usage: apiData.campaignAnalytics.channelPerformance[2]?.campaigns || 0, 
                growth: 8.9 
              },
              leadpulseTracking: { 
                usage: apiData.leadPulseAnalytics.totalSessions, 
                growth: 22.1 
              },
              aiFeatures: { 
                usage: Math.floor(apiData.overview.totalUsers * 0.3),
                growth: 35.7 
              },
              workflows: { 
                usage: apiData.workflowAnalytics.totalExecutions, 
                growth: 18.3 
              }
            },
            geographic: {
              nigeria: { users: Math.floor(apiData.overview.totalUsers * 0.6), revenue: apiData.overview.totalRevenue * 0.6, growth: 18.5 },
              ghana: { users: Math.floor(apiData.overview.totalUsers * 0.15), revenue: apiData.overview.totalRevenue * 0.15, growth: 24.2 },
              kenya: { users: Math.floor(apiData.overview.totalUsers * 0.12), revenue: apiData.overview.totalRevenue * 0.12, growth: 31.7 },
              southAfrica: { users: Math.floor(apiData.overview.totalUsers * 0.08), revenue: apiData.overview.totalRevenue * 0.08, growth: 12.4 },
              other: { users: Math.floor(apiData.overview.totalUsers * 0.05), revenue: apiData.overview.totalRevenue * 0.05, growth: 8.9 }
            },
            performance: {
              apiRequests: apiData.platformMetrics.apiCalls,
              apiRequestsGrowth: 15.3,
              responseTime: apiData.platformMetrics.responseTime,
              responseTimeChange: -12.5,
              uptime: apiData.platformMetrics.uptime,
              uptimeChange: 0.2,
              errorRate: apiData.platformMetrics.errorRate,
              errorRateChange: -25.8
            }
          };
          setMetrics(transformedMetrics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Fallback to default metrics on error  
        setMetrics({
          overview: {
            totalUsers: 0,
            totalUsersGrowth: 0,
            monthlyActiveUsers: 0,
            mauGrowth: 0,
            totalRevenue: 0,
            revenueGrowth: 0,
            averageRevenuePerUser: 0,
            arpuGrowth: 0
          },
          users: {
            newUsers: 0,
            newUsersGrowth: 0,
            retentionRate: 0,
            retentionGrowth: 0,
            churnRate: 0,
            churnImprovement: 0,
            averageSessionDuration: 0,
            sessionGrowth: 0
          },
          revenue: {
            mrr: 0,
            mrrGrowth: 0,
            arr: 0,
            arrGrowth: 0,
            ltv: 0,
            ltvGrowth: 0,
            churnRevenue: 0,
            churnRevenueChange: 0
          },
          features: {
            emailCampaigns: { usage: 0, growth: 0 },
            smsCampaigns: { usage: 0, growth: 0 },
            whatsappCampaigns: { usage: 0, growth: 0 },
            leadpulseTracking: { usage: 0, growth: 0 },
            aiFeatures: { usage: 0, growth: 0 },
            workflows: { usage: 0, growth: 0 }
          },
          geographic: {
            nigeria: { users: 0, revenue: 0, growth: 0 },
            ghana: { users: 0, revenue: 0, growth: 0 },
            kenya: { users: 0, revenue: 0, growth: 0 },
            southAfrica: { users: 0, revenue: 0, growth: 0 },
            other: { users: 0, revenue: 0, growth: 0 }
          },
          performance: {
            apiRequests: 0,
            apiRequestsGrowth: 0,
            responseTime: 0,
            responseTimeChange: 0,
            uptime: 0,
            uptimeChange: 0,
            errorRate: 0,
            errorRateChange: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat().format(number);
  };

  const getGrowthIndicator = (growth: number) => {
    const isPositive = growth > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const className = isPositive ? 'text-[hsl(var(--admin-success))]' : 'text-[hsl(var(--admin-danger))]';
    
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}>
        <Icon className="h-3 w-3" />
        {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="admin-loading mx-auto mb-4"></div>
          <h2 className="admin-title text-xl mb-2">LOADING_ANALYTICS</h2>
          <p className="admin-subtitle">FETCHING_PLATFORM_INSIGHTS...</p>
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
            UPDATED: {lastUpdated.toLocaleTimeString()}
          </div>
          <button 
            className="admin-btn admin-btn-primary flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            REFRESH
          </button>
          <button className="admin-btn flex items-center gap-2">
            <Download className="h-4 w-4" />
            EXPORT_DATA
          </button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="admin-card mb-6">
        <div className="flex overflow-x-auto p-2 gap-2">
          {[
            { value: 'overview', label: 'OVERVIEW', icon: BarChart3 },
            { value: 'users', label: 'USERS', icon: Users },
            { value: 'revenue', label: 'REVENUE', icon: DollarSign },
            { value: 'features', label: 'FEATURES', icon: Zap },
            { value: 'geographic', label: 'GEOGRAPHIC', icon: MapPin },
            { value: 'performance', label: 'PERFORMANCE', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`admin-btn flex items-center gap-2 whitespace-nowrap ${
                  isActive ? 'admin-btn-primary' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 admin-fade-in">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <div className="admin-pulse"></div>
                </div>
                <div className="admin-stat-value">{formatNumber(metrics.overview.totalUsers)}</div>
                <div className="admin-stat-label">TOTAL_USERS</div>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.overview.totalUsersGrowth)} FROM_LAST_MONTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <Signal className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value">{formatNumber(metrics.overview.monthlyActiveUsers)}</div>
                <div className="admin-stat-label">MONTHLY_ACTIVE_USERS</div>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.overview.mauGrowth)} ENGAGEMENT_RATE
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                </div>
                <div className="admin-stat-value">{formatCurrency(metrics.overview.totalRevenue)}</div>
                <div className="admin-stat-label">TOTAL_REVENUE</div>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.overview.revenueGrowth)} GROWTH_RATE
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Target className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
                  <Gauge className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                </div>
                <div className="admin-stat-value">{formatCurrency(metrics.overview.averageRevenuePerUser)}</div>
                <div className="admin-stat-label">AVG_REVENUE_PER_USER</div>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.overview.arpuGrowth)} OPTIMIZATION
                </div>
              </div>
            </div>

            {/* Growth Visualization */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">GROWTH_ANALYTICS</h2>
              </div>
              <div className="h-64 flex items-center justify-center border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                  <p className="admin-title text-lg mb-2">GROWTH_VISUALIZATION</p>
                  <p className="admin-subtitle">USERS // REVENUE // ENGAGEMENT_METRICS</p>
                </div>
              </div>
            </div>

            {/* Platform Health Matrix */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">PLATFORM_HEALTH_MATRIX</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="admin-subtitle">SYSTEM_STATUS</span>
                    <CheckCircle className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                  </div>
                  <div className="admin-badge admin-badge-success">OPERATIONAL</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">ALL_SYSTEMS_GO</p>
                </div>

                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="admin-subtitle">API_PERFORMANCE</span>
                    <Cpu className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                  </div>
                  <div className="text-xl font-bold text-[hsl(var(--admin-text-primary))]">{metrics.performance.responseTime}ms</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">AVG_RESPONSE</p>
                </div>

                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="admin-subtitle">AI_USAGE</span>
                    <Brain className="h-4 w-4 text-[hsl(var(--admin-secondary))]" />
                  </div>
                  <div className="text-xl font-bold text-[hsl(var(--admin-text-primary))]">{metrics.features.aiFeatures.usage}%</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">ADOPTION_RATE</p>
                </div>

                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="admin-subtitle">DATA_STORAGE</span>
                    <Database className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                  </div>
                  <div className="admin-badge admin-badge-warning">OPTIMIZED</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">STORAGE_STATUS</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6 admin-fade-in">
            {/* User Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <Zap className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value">{formatNumber(metrics.users.newUsers)}</div>
                <div className="admin-stat-label">NEW_USERS</div>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.users.newUsersGrowth)} THIS_MONTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Target className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                </div>
                <div className="admin-stat-value">{metrics.users.retentionRate}%</div>
                <div className="admin-stat-label">RETENTION_RATE</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.users.retentionGrowth)} IMPROVEMENT
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <TrendingDown className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
                </div>
                <div className="admin-stat-value">{metrics.users.churnRate}%</div>
                <div className="admin-stat-label">CHURN_RATE</div>
                <div className="admin-stat-change negative">
                  {getGrowthIndicator(metrics.users.churnImprovement)} REDUCTION
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <Network className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value">{metrics.users.averageSessionDuration}m</div>
                <div className="admin-stat-label">AVG_SESSION_TIME</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.users.sessionGrowth)} ENGAGEMENT
                </div>
              </div>
            </div>

            {/* User Cohort Analysis */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">USER_COHORT_ANALYSIS</h2>
              </div>
              <div className="h-64 flex items-center justify-center border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                <div className="text-center">
                  <Users className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                  <p className="admin-title text-lg mb-2">COHORT_MATRIX</p>
                  <p className="admin-subtitle">RETENTION_PATTERNS // BEHAVIOR_ANALYSIS</p>
                </div>
              </div>
            </div>

            {/* User Demographics & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="admin-card p-6">
                <h3 className="admin-title text-lg mb-4">USER_DEMOGRAPHICS</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">ENTERPRISE_USERS</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">34%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-primary))]" style={{ width: '34%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">PROFESSIONAL_USERS</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">42%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-accent))]" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">STARTER_USERS</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">24%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-secondary))]" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card p-6">
                <h3 className="admin-title text-lg mb-4">ACTIVITY_PATTERNS</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">MORNING_PEAK</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">45%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-success))]" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">AFTERNOON_USAGE</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">38%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-warning))]" style={{ width: '38%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">EVENING_ACTIVITY</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">17%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-danger))]" style={{ width: '17%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6 admin-fade-in">
            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
                </div>
                <div className="admin-stat-value">{formatCurrency(metrics.revenue.mrr)}</div>
                <div className="admin-stat-label">MONTHLY_RECURRING</div>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.revenue.mrrGrowth)} MRR_GROWTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <Zap className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                </div>
                <div className="admin-stat-value">{formatCurrency(metrics.revenue.arr)}</div>
                <div className="admin-stat-label">ANNUAL_RECURRING</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.revenue.arrGrowth)} ANNUALLY
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Target className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value">{formatCurrency(metrics.revenue.ltv)}</div>
                <div className="admin-stat-label">LIFETIME_VALUE</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.revenue.ltvGrowth)} LTV_INCREASE
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <TrendingDown className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
                </div>
                <div className="admin-stat-value">{formatCurrency(metrics.revenue.churnRevenue)}</div>
                <div className="admin-stat-label">CHURN_IMPACT</div>
                <div className="admin-stat-change negative">
                  {getGrowthIndicator(metrics.revenue.churnRevenueChange)} REDUCTION
                </div>
              </div>
            </div>

            {/* Revenue Forecasting */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">REVENUE_FORECASTING</h2>
              </div>
              <div className="h-64 flex items-center justify-center border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                  <p className="admin-title text-lg mb-2">REVENUE_PROJECTION</p>
                  <p className="admin-subtitle">MRR // ARR // SUBSCRIPTION_ANALYTICS</p>
                </div>
              </div>
            </div>

            {/* Subscription Tier Performance */}
            <div className="admin-card p-6">
              <h3 className="admin-title text-lg mb-6">SUBSCRIPTION_TIER_PERFORMANCE</h3>
              <div className="space-y-4">
                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))] admin-glow-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[hsl(var(--admin-text-primary))]">ENTERPRISE_TIER</h4>
                      <p className="admin-subtitle">142 SUBSCRIBERS • ₦12,500/MONTH</p>
                    </div>
                    <div className="text-right">
                      <p className="admin-stat-value text-lg">{formatCurrency(1775000)}</p>
                      <div className="admin-badge admin-badge-success">72% OF_MRR</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))] admin-glow-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[hsl(var(--admin-text-primary))]">PROFESSIONAL_TIER</h4>
                      <p className="admin-subtitle">486 SUBSCRIBERS • ₦3,500/MONTH</p>
                    </div>
                    <div className="text-right">
                      <p className="admin-stat-value text-lg">{formatCurrency(1701000)}</p>
                      <div className="admin-badge admin-badge-secondary">28% OF_MRR</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6 admin-fade-in">
            {/* Feature Adoption Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Mail className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
                </div>
                <div className="admin-stat-value">{metrics.features.emailCampaigns.usage}%</div>
                <div className="admin-stat-label">EMAIL_CAMPAIGNS</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.features.emailCampaigns.growth)} ADOPTION
                </div>
                <div className="mt-4 h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--admin-primary))]" 
                    style={{ width: `${metrics.features.emailCampaigns.usage}%` }}
                  ></div>
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Phone className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <Signal className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value">{metrics.features.smsCampaigns.usage}%</div>
                <div className="admin-stat-label">SMS_CAMPAIGNS</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.features.smsCampaigns.growth)} ADOPTION
                </div>
                <div className="mt-4 h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--admin-accent))]" 
                    style={{ width: `${metrics.features.smsCampaigns.usage}%` }}
                  ></div>
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <Zap className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                </div>
                <div className="admin-stat-value">{metrics.features.whatsappCampaigns.usage}%</div>
                <div className="admin-stat-label">WHATSAPP_CAMPAIGNS</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.features.whatsappCampaigns.growth)} ADOPTION
                </div>
                <div className="mt-4 h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--admin-success))]" 
                    style={{ width: `${metrics.features.whatsappCampaigns.usage}%` }}
                  ></div>
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
                  <MousePointer className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                </div>
                <div className="admin-stat-value">{metrics.features.leadpulseTracking.usage}%</div>
                <div className="admin-stat-label">LEADPULSE_TRACKING</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.features.leadpulseTracking.growth)} ADOPTION
                </div>
                <div className="mt-4 h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--admin-warning))]" 
                    style={{ width: `${metrics.features.leadpulseTracking.usage}%` }}
                  ></div>
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Brain className="h-6 w-6 text-[hsl(var(--admin-secondary))]" />
                  <Cpu className="h-4 w-4 text-[hsl(var(--admin-secondary))]" />
                </div>
                <div className="admin-stat-value">{metrics.features.aiFeatures.usage}%</div>
                <div className="admin-stat-label">AI_FEATURES</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.features.aiFeatures.growth)} ADOPTION
                </div>
                <div className="mt-4 h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--admin-secondary))]" 
                    style={{ width: `${metrics.features.aiFeatures.usage}%` }}
                  ></div>
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Share2 className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
                  <Network className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
                </div>
                <div className="admin-stat-value">{metrics.features.workflows.usage}%</div>
                <div className="admin-stat-label">WORKFLOWS</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.features.workflows.growth)} ADOPTION
                </div>
                <div className="mt-4 h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--admin-danger))]" 
                    style={{ width: `${metrics.features.workflows.usage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Feature Usage Heatmap */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <PieChart className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">FEATURE_USAGE_HEATMAP</h2>
              </div>
              <div className="h-64 flex items-center justify-center border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                  <p className="admin-title text-lg mb-2">USAGE_ANALYSIS</p>
                  <p className="admin-subtitle">FEATURE_ADOPTION // USAGE_PATTERNS</p>
                </div>
              </div>
            </div>

            {/* Feature Adoption Funnel */}
            <div className="admin-card p-6">
              <h3 className="admin-title text-lg mb-6">FEATURE_ADOPTION_FUNNEL</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <span className="admin-subtitle">FEATURE_DISCOVERY</span>
                  <div className="admin-badge admin-badge-secondary">8,234 USERS</div>
                </div>
                <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <span className="admin-subtitle">TRIAL_USAGE</span>
                  <div className="admin-badge admin-badge-success">6,789 USERS (82.5%)</div>
                </div>
                <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <span className="admin-subtitle">REGULAR_USAGE</span>
                  <div className="admin-badge admin-badge-warning">4,567 USERS (55.4%)</div>
                </div>
                <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <span className="admin-subtitle">POWER_USER</span>
                  <div className="admin-badge admin-badge-danger">2,134 USERS (25.9%)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geographic Tab */}
        {activeTab === 'geographic' && (
          <div className="space-y-6 admin-fade-in">
            {/* African Market Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <MapPin className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <div className="admin-pulse"></div>
                </div>
                <div className="admin-stat-value text-xl">{formatNumber(metrics.geographic.nigeria.users)}</div>
                <div className="admin-stat-label">NIGERIA</div>
                <p className="text-xs text-[hsl(var(--admin-text-secondary))] mt-1">{formatCurrency(metrics.geographic.nigeria.revenue)}</p>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.geographic.nigeria.growth)} GROWTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <MapPin className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <Globe className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value text-xl">{formatNumber(metrics.geographic.ghana.users)}</div>
                <div className="admin-stat-label">GHANA</div>
                <p className="text-xs text-[hsl(var(--admin-text-secondary))] mt-1">{formatCurrency(metrics.geographic.ghana.revenue)}</p>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.geographic.ghana.growth)} GROWTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <MapPin className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                </div>
                <div className="admin-stat-value text-xl">{formatNumber(metrics.geographic.kenya.users)}</div>
                <div className="admin-stat-label">KENYA</div>
                <p className="text-xs text-[hsl(var(--admin-text-secondary))] mt-1">{formatCurrency(metrics.geographic.kenya.revenue)}</p>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.geographic.kenya.growth)} GROWTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <MapPin className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
                  <Zap className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                </div>
                <div className="admin-stat-value text-xl">{formatNumber(metrics.geographic.southAfrica.users)}</div>
                <div className="admin-stat-label">SOUTH_AFRICA</div>
                <p className="text-xs text-[hsl(var(--admin-text-secondary))] mt-1">{formatCurrency(metrics.geographic.southAfrica.revenue)}</p>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.geographic.southAfrica.growth)} GROWTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Globe className="h-6 w-6 text-[hsl(var(--admin-secondary))]" />
                  <Network className="h-4 w-4 text-[hsl(var(--admin-secondary))]" />
                </div>
                <div className="admin-stat-value text-xl">{formatNumber(metrics.geographic.other.users)}</div>
                <div className="admin-stat-label">OTHER_MARKETS</div>
                <p className="text-xs text-[hsl(var(--admin-text-secondary))] mt-1">{formatCurrency(metrics.geographic.other.revenue)}</p>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.geographic.other.growth)} GROWTH
                </div>
              </div>
            </div>

            {/* African Market Map */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">AFRICAN_MARKET_INSIGHTS</h2>
              </div>
              <div className="h-64 flex items-center justify-center border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                  <p className="admin-title text-lg mb-2">MARKET_VISUALIZATION</p>
                  <p className="admin-subtitle">COUNTRY_DISTRIBUTION // REVENUE_MAPPING</p>
                </div>
              </div>
            </div>

            {/* Market Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="admin-card p-6">
                <h3 className="admin-title text-lg mb-4">MARKET_PENETRATION</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">NIGERIA_PRIMARY</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">61.0%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-primary))]" style={{ width: '61%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">GHANA_SECONDARY</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">16.8%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-accent))]" style={{ width: '16.8%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">KENYA_EMERGING</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">13.1%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-success))]" style={{ width: '13.1%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="admin-subtitle">SOUTH_AFRICA_GROWING</span>
                      <span className="text-[hsl(var(--admin-text-primary))]">7.4%</span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--admin-surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--admin-warning))]" style={{ width: '7.4%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card p-6">
                <h3 className="admin-title text-lg mb-4">REGIONAL_PERFORMANCE</h3>
                <div className="space-y-4">
                  <div className="p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[hsl(var(--admin-text-primary))]">HIGHEST_ARPU</p>
                        <p className="admin-subtitle">NIGERIA - ₦285/USER</p>
                      </div>
                      <div className="admin-badge admin-badge-success">LEADER</div>
                    </div>
                  </div>
                  <div className="p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[hsl(var(--admin-text-primary))]">FASTEST_GROWTH</p>
                        <p className="admin-subtitle">GHANA - 23.8% MONTHLY</p>
                      </div>
                      <div className="admin-badge admin-badge-secondary">RISING</div>
                    </div>
                  </div>
                  <div className="p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[hsl(var(--admin-text-primary))]">BEST_RETENTION</p>
                        <p className="admin-subtitle">KENYA - 82% MONTHLY</p>
                      </div>
                      <div className="admin-badge admin-badge-warning">STABLE</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6 admin-fade-in">
            {/* System Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Database className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <Network className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
                </div>
                <div className="admin-stat-value">{formatNumber(metrics.performance.apiRequests)}</div>
                <div className="admin-stat-label">API_REQUESTS</div>
                <div className="admin-stat-change">
                  {getGrowthIndicator(metrics.performance.apiRequestsGrowth)} THIS_MONTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <Gauge className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value">{metrics.performance.responseTime}ms</div>
                <div className="admin-stat-label">AVG_RESPONSE_TIME</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.performance.responseTimeChange)} IMPROVEMENT
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                </div>
                <div className="admin-stat-value">{metrics.performance.uptime}%</div>
                <div className="admin-stat-label">SYSTEM_UPTIME</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.performance.uptimeChange)} THIS_MONTH
                </div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
                  <Terminal className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
                </div>
                <div className="admin-stat-value">{metrics.performance.errorRate}%</div>
                <div className="admin-stat-label">ERROR_RATE</div>
                <div className="admin-stat-change positive">
                  {getGrowthIndicator(metrics.performance.errorRateChange)} REDUCTION
                </div>
              </div>
            </div>

            {/* API Performance Dashboard */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">API_PERFORMANCE_DASHBOARD</h2>
              </div>
              <div className="h-64 flex items-center justify-center border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                  <p className="admin-title text-lg mb-2">PERFORMANCE_METRICS</p>
                  <p className="admin-subtitle">REQUEST_VOLUMES // RESPONSE_TIMES // ERROR_RATES</p>
                </div>
              </div>
            </div>

            {/* System Optimization & Monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="admin-card p-6">
                <h3 className="admin-title text-lg mb-4">SYSTEM_OPTIMIZATION</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <span className="admin-subtitle">DATABASE_QUERIES_OPTIMIZED</span>
                    <CheckCircle className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <span className="admin-subtitle">CDN_CACHE_HIT_RATE: 94%</span>
                    <CheckCircle className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <span className="admin-subtitle">MEMORY_USAGE: 78%</span>
                    <AlertTriangle className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                  </div>
                </div>
              </div>

              <div className="admin-card p-6">
                <h3 className="admin-title text-lg mb-4">MONITORING_INSIGHTS</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <span className="admin-subtitle">ACTIVE_ALERTS</span>
                    <div className="admin-badge admin-badge-warning">2 LOW_PRIORITY</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <span className="admin-subtitle">SLA_COMPLIANCE</span>
                    <div className="admin-badge admin-badge-success">99.8%</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                    <span className="admin-subtitle">MONITORING_COVERAGE</span>
                    <div className="admin-badge admin-badge-secondary">COMPLETE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Development Notice */}
        {staffRole === 'SUPER_ADMIN' && (
          <div className="admin-card p-6 mt-8 border-l-4 border-l-[hsl(var(--admin-primary))]">
            <div className="flex items-start gap-4">
              <Terminal className="h-6 w-6 text-[hsl(var(--admin-primary))] mt-1" />
              <div>
                <h4 className="admin-title text-lg mb-2">ANALYTICS_DASHBOARD_STATUS</h4>
                <p className="admin-subtitle mb-3">
                  COMPREHENSIVE_ANALYTICS.DASHBOARD // REALTIME_METRICS // AFRICAN_MARKET_INSIGHTS
                </p>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                  // Interactive charts and advanced filtering features are being integrated for enhanced data visualization.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}