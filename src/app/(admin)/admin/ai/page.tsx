"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { 
  Brain, 
  Bot,
  Zap,
  DollarSign,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Play,
  Pause,
  BarChart3,
  Users,
  MessageSquare,
  Database,
  Cpu,
  MemoryStick,
  Network,
  Target,
  Gauge,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Wrench,
  RotateCcw
} from "lucide-react";
import { useState, useEffect } from "react";

interface AIUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  totalCost: number;
  costToday: number;
  costThisMonth: number;
  averageResponseTime: number;
  successRate: number;
  activeModels: number;
  safetyIncidents: number;
}

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  version: string;
  requests: number;
  cost: number;
  averageResponseTime: number;
  errorRate: number;
  accuracy: number;
  lastUsed: string;
  capabilities: string[];
}

interface CostBreakdown {
  provider: string;
  model: string;
  requests: number;
  cost: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface SafetyIncident {
  id: string;
  type: 'content_violation' | 'safety_filter' | 'unauthorized_access' | 'data_leak' | 'model_misuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  model: string;
  user?: string;
  organization?: string;
  timestamp: string;
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  action: string;
  details: any;
}

interface AIOperation {
  id: string;
  type: 'chat' | 'task_execution' | 'content_generation' | 'analysis' | 'prediction';
  model: string;
  organization: string;
  user: string;
  prompt: string;
  response: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  safetyChecks: {
    passed: boolean;
    flags: string[];
  };
}

export default function AdminAIPage() {
  const { permissions, staffRole } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [costs, setCosts] = useState<CostBreakdown[]>([]);
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [operations, setOperations] = useState<AIOperation[]>([]);
  const [filterDate, setFilterDate] = useState("today");
  const [filterModel, setFilterModel] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/v2/admin/ai');
        if (!response.ok) {
          throw new Error('Failed to fetch AI data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Set real AI usage stats
          setStats(data.data.stats);
          
          // Set real AI models
          setModels(data.data.models);
          
          // Set real cost breakdown
          setCosts(data.data.costs);
          
          // Set real AI operations
          setOperations(data.data.operations);
          
          // Set real safety incidents
          setSafetyIncidents(data.data.safetyIncidents || []);
        }
      } catch (error) {
        console.error('Error fetching AI data:', error);
        // Fallback to empty arrays on error
        setStats({
          totalRequests: 0,
          requestsToday: 0,
          requestsThisMonth: 0,
          totalCost: 0,
          costToday: 0,
          costThisMonth: 0,
          averageResponseTime: 0,
          successRate: 0,
          activeModels: 0,
          safetyIncidents: 0
        });
        setModels([]);
        setCosts([]);
        setOperations([]);
        setSafetyIncidents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="admin-loading mx-auto mb-4"></div>
          <h2 className="admin-title text-xl mb-2">AI_NEXUS_LOADING</h2>
          <p className="admin-subtitle">INITIALIZING_ARTIFICIAL_INTELLIGENCE_SYSTEMS...</p>
        </div>
      </div>
    );
  }

  if (!permissions.canAccessAI) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--admin-warning))] mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">ACCESS_DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT_PRIVILEGES.AI_NEXUS_ACCESS_REQUIRED
          </p>
        </div>
      </div>
    );
  }

  const getModelStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="admin-badge admin-badge-success">ACTIVE</span>;
      case 'maintenance':
        return <span className="admin-badge admin-badge-warning">MAINTENANCE</span>;
      case 'inactive':
        return <span className="admin-badge admin-badge-secondary">INACTIVE</span>;
      case 'error':
        return <span className="admin-badge admin-badge-danger">ERROR</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="admin-badge admin-badge-danger">CRITICAL</span>;
      case 'high':
        return <span className="admin-badge admin-badge-warning">HIGH</span>;
      case 'medium':
        return <span className="admin-badge admin-badge-secondary">MEDIUM</span>;
      case 'low':
        return <span className="admin-badge admin-badge-success">LOW</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{severity.toUpperCase()}</span>;
    }
  };

  const getIncidentStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="admin-badge admin-badge-success">RESOLVED</span>;
      case 'investigating':
        return <span className="admin-badge admin-badge-warning">INVESTIGATING</span>;
      case 'detected':
        return <span className="admin-badge admin-badge-danger">DETECTED</span>;
      case 'false_positive':
        return <span className="admin-badge admin-badge-secondary">FALSE_POSITIVE</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getOperationStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="admin-badge admin-badge-success">COMPLETED</span>;
      case 'running':
        return <span className="admin-badge admin-badge-accent">RUNNING</span>;
      case 'pending':
        return <span className="admin-badge admin-badge-secondary">PENDING</span>;
      case 'failed':
        return <span className="admin-badge admin-badge-danger">FAILED</span>;
      case 'cancelled':
        return <span className="admin-badge admin-badge-secondary">CANCELLED</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-3 w-3 text-[hsl(var(--admin-danger))]" />;
      case 'down':
        return <ArrowDownRight className="h-3 w-3 text-[hsl(var(--admin-success))]" />;
      default:
        return <Minus className="h-3 w-3 text-[hsl(var(--admin-text-muted))]" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">AI_NEXUS</h1>
          <p className="admin-subtitle">ARTIFICIAL_INTELLIGENCE.MONITORING.CONTROL_CENTER</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-secondary flex items-center gap-2">
            <Brain className="h-3 w-3" />
            AI_OPERATIONS
          </div>
          <button className="admin-btn admin-btn-primary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            REFRESH_ALL
          </button>
          <button className="admin-btn flex items-center gap-2">
            <Download className="h-4 w-4" />
            EXPORT_REPORT
          </button>
        </div>
      </div>

      {/* AI Intelligence Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <Bot className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
              <Activity className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
            </div>
            <div className="admin-stat-value">{formatNumber(stats.totalRequests)}</div>
            <div className="admin-stat-label">TOTAL_REQUESTS</div>
            <div className="admin-stat-change positive">+{formatNumber(stats.requestsToday)}_TODAY</div>
          </div>

          <div className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
              <TrendingUp className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
            </div>
            <div className="admin-stat-value">{formatCurrency(stats.totalCost)}</div>
            <div className="admin-stat-label">TOTAL_COST</div>
            <div className="admin-stat-change">{formatCurrency(stats.costToday)}_TODAY</div>
          </div>

          <div className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--admin-success))]" />
              <Gauge className="h-4 w-4 text-[hsl(var(--admin-success))]" />
            </div>
            <div className="admin-stat-value text-[hsl(var(--admin-success))]">{stats.successRate}%</div>
            <div className="admin-stat-label">SUCCESS_RATE</div>
            <div className="admin-stat-change">AVG_RESPONSE: {stats.averageResponseTime}S</div>
          </div>

          <div className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
            </div>
            <div className="admin-stat-value text-[hsl(var(--admin-danger))]">{stats.safetyIncidents}</div>
            <div className="admin-stat-label">SAFETY_INCIDENTS</div>
            <div className="admin-stat-change">{stats.activeModels}_ACTIVE_MODELS</div>
          </div>
        </div>
      )}

        {/* AI Control Tabs */}
        <div className="admin-card mb-6">
          <div className="flex overflow-x-auto p-2 gap-2">
            {[
              { value: 'overview', label: 'OVERVIEW', icon: BarChart3 },
              { value: 'usage', label: 'USAGE', icon: Activity },
              { value: 'costs', label: 'COSTS', icon: DollarSign },
              { value: 'safety', label: 'SAFETY', icon: Shield },
              { value: 'models', label: 'MODELS', icon: Bot },
              { value: 'monitoring', label: 'MONITORING', icon: Eye }
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 admin-fade-in">
            {/* AI System Health */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">AI_SYSTEM_HEALTH</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="admin-stat-card admin-glow-hover">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                    <div className="admin-pulse"></div>
                  </div>
                  <div className="admin-stat-value">HEALTHY</div>
                  <div className="admin-stat-label">OVERALL_STATUS</div>
                  <div className="admin-stat-change positive">ALL_SYSTEMS_OPERATIONAL</div>
                </div>

                <div className="admin-stat-card admin-glow-hover">
                  <div className="flex items-center justify-between mb-4">
                    <Gauge className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                    <Activity className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                  </div>
                  <div className="admin-stat-value">92%</div>
                  <div className="admin-stat-label">MODEL_AVAILABILITY</div>
                  <div className="admin-stat-change positive">OPERATIONAL_CAPACITY</div>
                </div>

                <div className="admin-stat-card admin-glow-hover">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="h-6 w-6 text-[hsl(var(--admin-secondary))]" />
                    <Database className="h-4 w-4 text-[hsl(var(--admin-secondary))]" />
                  </div>
                  <div className="admin-stat-value">23</div>
                  <div className="admin-stat-label">QUEUE_STATUS</div>
                  <div className="admin-stat-change">JOBS_PROCESSING</div>
                </div>
              </div>
            </div>

            {/* Recent AI Activity */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Database className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
                <h2 className="admin-title text-xl">RECENT_AI_ACTIVITY</h2>
              </div>
              <div className="space-y-4">
                {operations.slice(0, 3).map((operation) => (
                  <div key={operation.id} className="admin-card p-4 border border-[hsl(var(--admin-border))]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Bot className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
                          <span className="admin-title text-sm">{operation.type.replace('_', ' ').toUpperCase()}</span>
                          {getOperationStatusBadge(operation.status)}
                          <span className="admin-badge admin-badge-secondary">{operation.model}</span>
                        </div>
                        <div className="admin-subtitle text-xs space-y-1">
                          <div>ORGANIZATION: {operation.organization}</div>
                          <div>USER: {operation.user}</div>
                          <div>COST: {formatCurrency(operation.cost)}</div>
                          <div>TIME: {new Date(operation.startTime).toLocaleString()}</div>
                        </div>
                      </div>
                      <button className="admin-btn text-xs px-3 py-1">
                        <Eye className="h-3 w-3 mr-1" />
                        DETAILS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost and Usage Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="admin-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <DollarSign className="h-5 w-5 text-[hsl(var(--admin-warning))]" />
                  <h2 className="admin-title text-xl">COST_BREAKDOWN</h2>
                </div>
                <div className="space-y-3">
                  {costs.slice(0, 4).map((cost) => (
                    <div key={cost.model} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="admin-title text-sm">{cost.model}</span>
                        {getTrendIcon(cost.trend)}
                      </div>
                      <div className="text-right">
                        <div className="admin-stat-value text-sm">{formatCurrency(cost.cost)}</div>
                        <div className="admin-stat-label text-xs">{cost.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Gauge className="h-5 w-5 text-[hsl(var(--admin-success))]" />
                  <h2 className="admin-title text-xl">MODEL_PERFORMANCE</h2>
                </div>
                <div className="space-y-3">
                  {models.filter(m => m.status === 'active').slice(0, 4).map((model) => (
                    <div key={model.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="admin-title text-sm">{model.name}</span>
                        {getModelStatusBadge(model.status)}
                      </div>
                      <div className="text-right">
                        <div className="admin-stat-value text-sm">{model.accuracy}%</div>
                        <div className="admin-stat-label text-xs">{model.averageResponseTime}S</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
                  <h2 className="admin-title text-xl">AI_USAGE_ANALYTICS</h2>
                </div>
                <div className="relative">
                  <select className="admin-input w-32 text-xs">
                    <option value="today">TODAY</option>
                    <option value="week">THIS_WEEK</option>
                    <option value="month">THIS_MONTH</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="admin-title text-sm">BY_MODEL</h4>
                  {models.map((model) => (
                    <div key={model.id} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="admin-subtitle">{model.name}</span>
                        <span className="admin-title">{formatNumber(model.requests)}</span>
                      </div>
                      <div className="admin-progress-container">
                        <div 
                          className="admin-progress-bar"
                          style={{
                            width: `${Math.min((model.requests / 50000) * 100, 100)}%`,
                            backgroundColor: 'hsl(var(--admin-primary))'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="admin-title text-sm">BY_TYPE</h4>
                  {[
                    { type: 'CHAT', requests: 8430, percentage: 45 },
                    { type: 'TASK_EXECUTION', requests: 6240, percentage: 33 },
                    { type: 'CONTENT_GENERATION', requests: 2890, percentage: 15 },
                    { type: 'ANALYSIS', requests: 1340, percentage: 7 }
                  ].map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="admin-subtitle">{item.type}</span>
                        <span className="admin-title">{formatNumber(item.requests)}</span>
                      </div>
                      <div className="admin-progress-container">
                        <div 
                          className="admin-progress-bar"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: 'hsl(var(--admin-accent))'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="admin-title text-sm">PEAK_USAGE</h4>
                  <div className="admin-card p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="admin-subtitle text-xs">PEAK_HOUR:</span>
                      <span className="admin-title text-xs">2:00_PM_-_3:00_PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="admin-subtitle text-xs">PEAK_DAY:</span>
                      <span className="admin-title text-xs">WEDNESDAY</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="admin-subtitle text-xs">AVG_QUEUE_TIME:</span>
                      <span className="admin-title text-xs">0.8S</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="admin-subtitle text-xs">CAPACITY_USED:</span>
                      <span className="admin-title text-xs text-[hsl(var(--admin-warning))]">78%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}





        {/* Placeholder for other tabs */}
        {['costs', 'safety', 'models', 'monitoring'].includes(activeTab) && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                <h3 className="admin-title text-lg mb-2">{activeTab.toUpperCase()}_MODULE</h3>
                <p className="admin-subtitle">
                  {activeTab.toUpperCase()}_INTERFACE // AI_MONITORING // INTELLIGENCE_SYSTEMS
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Development Notice */}
        {staffRole === 'SUPER_ADMIN' && (
          <div className="admin-card p-6 mt-8 border-l-4 border-l-[hsl(var(--admin-primary))]">
            <div className="flex items-start gap-4">
              <Brain className="h-6 w-6 text-[hsl(var(--admin-primary))] mt-1" />
              <div>
                <h4 className="admin-title text-lg mb-2">AI_NEXUS_STATUS</h4>
                <p className="admin-subtitle mb-3">
                  ARTIFICIAL_INTELLIGENCE // MODEL_MONITORING // USAGE_ANALYTICS
                </p>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                  // Advanced AI governance, automated optimization, and predictive scaling systems active.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}