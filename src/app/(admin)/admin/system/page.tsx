"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { 
  Server, 
  Database,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  Globe,
  Monitor,
  Gauge,
  BarChart3,
  AlertCircle,
  Wrench,
  Power,
  Thermometer,
  Terminal,
  Network,
  Shield,
  Eye,
  Target
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSystemHealthRealtime } from "@/hooks/useAdminRealtime";

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: {
    warning: number;
    critical: number;
  };
}

interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: string;
  responseTime: string;
  lastCheck: string;
  endpoint?: string;
  version?: string;
  dependencies?: string[];
  issues?: string[];
}

interface InfrastructureMetric {
  category: string;
  metrics: {
    name: string;
    current: number;
    max: number;
    unit: string;
    status: 'healthy' | 'warning' | 'critical';
  }[];
}

export default function AdminSystemPage() {
  const { permissions, staffRole } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureMetric[]>([]);
  
  // Real-time system health updates
  const { isConnected: isRealtimeConnected, systemData } = useSystemHealthRealtime();

  // Real API call to fetch system health data
  useEffect(() => {
    const fetchSystemHealth = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/v2/admin/system/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch system health data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Transform API response to component format
          const apiData = data.data;
          
          // Set system metrics from API
          setSystemMetrics([
            {
              name: 'CPU Usage',
              value: apiData.systemResources?.cpu || 0,
              unit: '%',
              status: apiData.systemResources?.cpu > 80 ? 'critical' : apiData.systemResources?.cpu > 60 ? 'warning' : 'healthy',
              trend: 'stable',
              threshold: { warning: 70, critical: 90 }
            },
            {
              name: 'Memory Usage',
              value: apiData.systemResources?.memory || 0,
              unit: '%',
              status: apiData.systemResources?.memory > 85 ? 'critical' : apiData.systemResources?.memory > 75 ? 'warning' : 'healthy',
              trend: 'stable',
              threshold: { warning: 75, critical: 90 }
            },
            {
              name: 'Disk Usage',
              value: apiData.systemResources?.disk || 0,
              unit: '%',
              status: apiData.systemResources?.disk > 90 ? 'critical' : apiData.systemResources?.disk > 80 ? 'warning' : 'healthy',
              trend: 'stable',
              threshold: { warning: 80, critical: 95 }
            },
            {
              name: 'Network I/O',
              value: apiData.systemResources?.network || 0,
              unit: 'Mbps',
              status: 'healthy',
              trend: 'stable',
              threshold: { warning: 80, critical: 100 }
            }
          ]);

          // Set services from API
          setServices(apiData.services || []);

          // Set infrastructure metrics from API
          setInfrastructure(apiData.infrastructure || []);
        }
      } catch (error) {
        console.error('Error fetching system health:', error);
        // Fallback to empty arrays on error
        setSystemMetrics([]);
        setServices([]);
        setInfrastructure([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemHealth();
  }, []);

  if (!permissions.canAccessSystem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--admin-warning))] mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">ACCESS_DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT_PRIVILEGES.SYSTEM_CORE_ACCESS_REQUIRED
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <span className="admin-badge admin-badge-success">OPERATIONAL</span>;
      case 'degraded':
      case 'warning':
        return <span className="admin-badge admin-badge-warning">DEGRADED</span>;
      case 'down':
      case 'critical':
        return <span className="admin-badge admin-badge-danger">DOWN</span>;
      case 'maintenance':
        return <span className="admin-badge admin-badge-secondary">MAINTENANCE</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-[hsl(var(--admin-success))]" />;
      case 'degraded':
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-[hsl(var(--admin-warning))]" />;
      case 'down':
      case 'critical':
        return <XCircle className="h-4 w-4 text-[hsl(var(--admin-danger))]" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-[hsl(var(--admin-accent))]" />;
      default:
        return <AlertCircle className="h-4 w-4 text-[hsl(var(--admin-text-muted))]" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-[hsl(var(--admin-danger))]" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-[hsl(var(--admin-success))]" />;
      default:
        return <Activity className="h-3 w-3 text-[hsl(var(--admin-text-muted))]" />;
    }
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-[hsl(var(--admin-success))]';
      case 'warning': return 'text-[hsl(var(--admin-warning))]';
      case 'critical': return 'text-[hsl(var(--admin-danger))]';
      default: return 'text-[hsl(var(--admin-text-muted))]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="admin-loading mx-auto mb-4"></div>
          <h2 className="admin-title text-xl mb-2">SYSTEM_CORE_LOADING</h2>
          <p className="admin-subtitle">INITIALIZING_INFRASTRUCTURE_MONITORING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">SYSTEM_CORE</h1>
          <p className="admin-subtitle">INFRASTRUCTURE_MONITORING.REALTIME_HEALTH_ANALYSIS</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-secondary flex items-center gap-2">
            <Terminal className="h-3 w-3" />
            INFRASTRUCTURE_MONITOR
          </div>
          <div className={`admin-badge flex items-center gap-2 ${
            isRealtimeConnected ? 'admin-badge-success' : 'admin-badge-secondary'
          }`}>
            <div className={`admin-pulse h-2 w-2 rounded-full ${
              isRealtimeConnected ? 'bg-[hsl(var(--admin-success))]' : 'bg-[hsl(var(--admin-text-muted))]'
            }`}></div>
            {isRealtimeConnected ? "LIVE_STREAM_ACTIVE" : "OFFLINE_MODE"}
          </div>
          <button className="admin-btn admin-btn-primary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            REFRESH_ALL
          </button>
        </div>
      </div>

      {/* System Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {systemMetrics.map((metric) => (
          <div key={metric.name} className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {metric.name === 'CPU Usage' && <Cpu className="h-5 w-5 text-[hsl(var(--admin-primary))]" />}
                {metric.name === 'Memory Usage' && <MemoryStick className="h-5 w-5 text-[hsl(var(--admin-secondary))]" />}
                {metric.name === 'Disk Usage' && <HardDrive className="h-5 w-5 text-[hsl(var(--admin-accent))]" />}
                {metric.name === 'Network I/O' && <Wifi className="h-5 w-5 text-[hsl(var(--admin-info))]" />}
                <span className="admin-stat-label text-xs">{metric.name.replace(' ', '_').toUpperCase()}</span>
              </div>
              {getTrendIcon(metric.trend)}
            </div>
            <div className={`admin-stat-value mb-3 ${getMetricColor(metric.status)}`}>
              {metric.value}{metric.unit}
            </div>
            <div className="admin-progress-container mb-2">
              <div 
                className="admin-progress-bar"
                style={{
                  width: `${Math.min(metric.value, 100)}%`,
                  backgroundColor: metric.status === 'healthy' ? 'hsl(var(--admin-success))' : 
                                   metric.status === 'warning' ? 'hsl(var(--admin-warning))' : 
                                   'hsl(var(--admin-danger))'
                }}
              ></div>
            </div>
            <div className="admin-stat-change text-xs">
              WARN: {metric.threshold.warning}{metric.unit} • CRIT: {metric.threshold.critical}{metric.unit}
            </div>
          </div>
        ))}
      </div>

      {/* System Monitoring Tabs */}
      <div className="admin-card mb-6">
        <div className="flex overflow-x-auto p-2 gap-2">
          {[
            { value: 'overview', label: 'OVERVIEW', icon: Monitor },
            { value: 'services', label: 'SERVICES', icon: Server },
            { value: 'infrastructure', label: 'INFRASTRUCTURE', icon: Database },
            { value: 'performance', label: 'PERFORMANCE', icon: BarChart3 }
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
            {/* System Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <div className="admin-pulse"></div>
                </div>
                <div className="admin-stat-value">HEALTHY</div>
                <div className="admin-stat-label">OVERALL_STATUS</div>
                <div className="admin-stat-change positive">ALL_SYSTEMS_OPERATIONAL</div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value">99.9%</div>
                <div className="admin-stat-label">SYSTEM_UPTIME</div>
                <div className="admin-stat-change positive">7D_RUNNING</div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Gauge className="h-6 w-6 text-[hsl(var(--admin-secondary))]" />
                  <TrendingDown className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                </div>
                <div className="admin-stat-value">145ms</div>
                <div className="admin-stat-label">RESPONSE_TIME</div>
                <div className="admin-stat-change positive">OPTIMAL_PERFORMANCE</div>
              </div>
            </div>

            {/* System Alert Matrix */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--admin-warning))]" />
                <h2 className="admin-title text-xl">SYSTEM_ALERT_MATRIX</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border border-[hsl(var(--admin-warning))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <AlertTriangle className="h-5 w-5 text-[hsl(var(--admin-warning))] mt-1" />
                  <div className="flex-1">
                    <h4 className="admin-title text-sm mb-1">HIGH_MEMORY_USAGE</h4>
                    <p className="admin-subtitle text-xs mb-2">REDIS_CACHE.MEMORY_89%_UTILIZED</p>
                    <p className="text-xs text-[hsl(var(--admin-text-muted))]">ALERT_TIME: 2_MINUTES_AGO</p>
                  </div>
                  <button className="admin-btn text-xs px-3 py-1">
                    <Eye className="h-3 w-3 mr-1" />
                    INVESTIGATE
                  </button>
                </div>

                <div className="flex items-start gap-4 p-4 border border-[hsl(var(--admin-accent))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <Settings className="h-5 w-5 text-[hsl(var(--admin-accent))] mt-1" />
                  <div className="flex-1">
                    <h4 className="admin-title text-sm mb-1">SCHEDULED_MAINTENANCE</h4>
                    <p className="admin-subtitle text-xs mb-2">WHATSAPP_API.MAINTENANCE_WINDOW_ACTIVE</p>
                    <p className="text-xs text-[hsl(var(--admin-text-muted))]">STARTED: 30_MINUTES_AGO</p>
                  </div>
                  <button className="admin-btn text-xs px-3 py-1">
                    <Clock className="h-3 w-3 mr-1" />
                    DETAILS
                  </button>
                </div>
              </div>
            </div>

            {/* Infrastructure Map */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Network className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">INFRASTRUCTURE_MAP</h2>
              </div>
              <div className="h-64 flex items-center justify-center border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                <div className="text-center">
                  <Server className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                  <p className="admin-title text-lg mb-2">SYSTEM_TOPOLOGY</p>
                  <p className="admin-subtitle">REAL_TIME_INFRASTRUCTURE // NETWORK_MAPPING</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                  <h2 className="admin-title text-xl">SERVICE_HEALTH_MONITORING</h2>
                </div>
                <button className="admin-btn admin-btn-primary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  REFRESH_ALL
                </button>
              </div>

              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <Server className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4" />
                    <div className="admin-subtitle">NO_SERVICES_DETECTED</div>
                    <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">SERVICE_DISCOVERY_IN_PROGRESS</p>
                  </div>
                ) : (
                  services.map((service) => (
                    <div key={service.name} className="admin-card p-4 border border-[hsl(var(--admin-border))]">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <h3 className="admin-title text-sm">{service.name.toUpperCase().replace(' ', '_')}</h3>
                            {service.version && (
                              <p className="admin-subtitle text-xs">VERSION: {service.version}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(service.status)}
                          <button className="admin-btn text-xs px-3 py-1">
                            <Wrench className="h-3 w-3 mr-1" />
                            MANAGE
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="admin-stat-value text-sm text-[hsl(var(--admin-success))]">{service.uptime}</div>
                          <div className="admin-stat-label text-xs">UPTIME</div>
                        </div>
                        <div className="text-center">
                          <div className="admin-stat-value text-sm text-[hsl(var(--admin-accent))]">{service.responseTime}</div>
                          <div className="admin-stat-label text-xs">RESPONSE_TIME</div>
                        </div>
                        <div className="text-center">
                          <div className="admin-stat-value text-sm text-[hsl(var(--admin-text-primary))]">
                            {new Date(service.lastCheck).toLocaleTimeString()}
                          </div>
                          <div className="admin-stat-label text-xs">LAST_CHECK</div>
                        </div>
                        <div className="text-center">
                          <div className="admin-stat-value text-sm text-[hsl(var(--admin-secondary))] truncate">
                            {service.endpoint ? 
                              service.endpoint.replace('https://', '').replace('http://', '').split('/')[0] : 
                              'INTERNAL'
                            }
                          </div>
                          <div className="admin-stat-label text-xs">ENDPOINT</div>
                        </div>
                      </div>

                      {service.dependencies && (
                        <div className="mb-3">
                          <h4 className="admin-subtitle text-xs mb-2">DEPENDENCIES:</h4>
                          <div className="flex flex-wrap gap-1">
                            {service.dependencies.map((dep) => (
                              <span key={dep} className="admin-badge admin-badge-secondary text-xs">{dep.toUpperCase()}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {service.issues && service.issues.length > 0 && (
                        <div className="p-3 border border-[hsl(var(--admin-warning))] rounded-md bg-[hsl(var(--admin-surface-elevated))]">
                          <h4 className="admin-title text-xs mb-2">KNOWN_ISSUES:</h4>
                          <ul className="admin-subtitle text-xs space-y-1">
                            {service.issues.map((issue, index) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Infrastructure Tab */}
        {activeTab === 'infrastructure' && (
          <div className="space-y-6 admin-fade-in">
            {infrastructure.length === 0 ? (
              <div className="admin-card p-6">
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4" />
                  <div className="admin-subtitle">NO_INFRASTRUCTURE_DATA</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">INFRASTRUCTURE_MONITORING_INITIALIZING</p>
                </div>
              </div>
            ) : (
              infrastructure.map((category) => (
                <div key={category.category} className="admin-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {category.category === 'Compute' && <Cpu className="h-5 w-5 text-[hsl(var(--admin-primary))]" />}
                    {category.category === 'Storage' && <HardDrive className="h-5 w-5 text-[hsl(var(--admin-secondary))]" />}
                    {category.category === 'Network' && <Wifi className="h-5 w-5 text-[hsl(var(--admin-accent))]" />}
                    <h2 className="admin-title text-xl">{category.category.toUpperCase()}_RESOURCES</h2>
                  </div>
                  <div className="admin-subtitle text-sm mb-6">
                    CURRENT_UTILIZATION // CAPACITY_ANALYSIS // {category.category.toUpperCase()}_INFRASTRUCTURE
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.metrics.map((metric) => (
                      <div key={metric.name} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="admin-title text-sm">{metric.name.toUpperCase().replace(' ', '_')}</span>
                          <span className={`admin-stat-value text-sm ${getMetricColor(metric.status)}`}>
                            {metric.current}/{metric.max} {metric.unit.toUpperCase()}
                          </span>
                        </div>
                        <div className="admin-progress-container">
                          <div 
                            className="admin-progress-bar"
                            style={{
                              width: `${(metric.current / metric.max) * 100}%`,
                              backgroundColor: metric.status === 'healthy' ? 'hsl(var(--admin-success))' : 
                                               metric.status === 'warning' ? 'hsl(var(--admin-warning))' : 
                                               'hsl(var(--admin-danger))'
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="admin-subtitle">
                            {((metric.current / metric.max) * 100).toFixed(1)}%_UTILIZED
                          </span>
                          {getStatusBadge(metric.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">PERFORMANCE_ANALYTICS</h2>
              </div>
              <div className="admin-subtitle text-sm mb-8">
                HISTORICAL_TRENDS // OPTIMIZATION_INSIGHTS // PREDICTIVE_ANALYSIS
              </div>
              
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                <h3 className="admin-title text-lg mb-2">PERFORMANCE_DASHBOARD</h3>
                <p className="admin-subtitle mb-6">
                  DETAILED_PERFORMANCE_CHARTS // TREND_ANALYSIS // OPTIMIZATION_RECOMMENDATIONS
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="admin-stat-card admin-glow-hover">
                    <div className="flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-[hsl(var(--admin-accent))]" />
                    </div>
                    <div className="admin-stat-value text-sm">RESPONSE_TIMES</div>
                    <div className="admin-stat-label text-xs">TREND_ANALYSIS</div>
                  </div>
                  
                  <div className="admin-stat-card admin-glow-hover">
                    <div className="flex items-center justify-center mb-4">
                      <Gauge className="h-8 w-8 text-[hsl(var(--admin-success))]" />
                    </div>
                    <div className="admin-stat-value text-sm">THROUGHPUT</div>
                    <div className="admin-stat-label text-xs">CAPACITY_PLANNING</div>
                  </div>
                  
                  <div className="admin-stat-card admin-glow-hover">
                    <div className="flex items-center justify-center mb-4">
                      <Thermometer className="h-8 w-8 text-[hsl(var(--admin-secondary))]" />
                    </div>
                    <div className="admin-stat-value text-sm">RESOURCE_USAGE</div>
                    <div className="admin-stat-label text-xs">HISTORICAL_DATA</div>
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
                <h4 className="admin-title text-lg mb-2">SYSTEM_CORE_STATUS</h4>
                <p className="admin-subtitle mb-3">
                  INFRASTRUCTURE_MONITORING // SERVICE_HEALTH_TRACKING // PERFORMANCE_ANALYTICS
                </p>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                  // Advanced monitoring, alerting systems, and automated scaling protocols are being integrated.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}