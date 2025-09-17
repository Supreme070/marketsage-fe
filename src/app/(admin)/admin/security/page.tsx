"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { useAdminSecurityDashboard } from "@/lib/api/hooks/useAdminSecurity";
import { 
  Shield, 
  AlertTriangle,
  Eye,
  Key,
  Users,
  Search, 
  RefreshCw,
  Download,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Lock,
  Unlock,
  Ban,
  UserCheck,
  Settings,
  FileText,
  Zap,
  Terminal,
  Database,
  Cpu,
  HardDrive,
  Network,
  Gauge,
  Target,
  Radar,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'api_abuse' | 'data_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  user?: {
    email: string;
    name: string;
    ip: string;
  };
  timestamp: string;
  status: 'resolved' | 'investigating' | 'open';
  details: any;
}

interface AccessLog {
  id: string;
  user: {
    email: string;
    name: string;
    role: string;
  };
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  organization: string;
  keyPreview: string;
  permissions: string[];
  lastUsed: string;
  createdAt: string;
  status: 'active' | 'expired' | 'revoked';
  usageCount: number;
}

interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'sql_injection' | 'xss' | 'ddos' | 'malware';
  source: string;
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
  timestamp: string;
  details: string;
}

export default function AdminSecurityPage() {
  const { permissions, staffRole } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const { 
    stats, 
    events, 
    logs, 
    apiKeys, 
    threats, 
    loading, 
    error, 
    refreshAll, 
    resolveEvent, 
    revokeApiKey, 
    blockThreat 
  } = useAdminSecurityDashboard();

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="admin-badge admin-badge-success">RESOLVED</span>;
      case 'investigating':
        return <span className="admin-badge admin-badge-warning">INVESTIGATING</span>;
      case 'open':
        return <span className="admin-badge admin-badge-danger">OPEN</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getApiKeyStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="admin-badge admin-badge-success">ACTIVE</span>;
      case 'expired':
        return <span className="admin-badge admin-badge-warning">EXPIRED</span>;
      case 'revoked':
        return <span className="admin-badge admin-badge-danger">REVOKED</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="admin-loading mx-auto mb-4"></div>
          <h2 className="admin-title text-xl mb-2">Loading_Security_Grid</h2>
          <p className="admin-subtitle">ACCESSING_SECURITY_PROTOCOLS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">Security_Grid_Error</h2>
          <p className="admin-subtitle mb-4">{error}</p>
          <button 
            className="admin-btn admin-btn-primary flex items-center gap-2"
            onClick={refreshAll}
          >
            <RefreshCw className="h-4 w-4" />
            RETRY_CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">SECURITY_GRID</h1>
          <p className="admin-subtitle">THREAT_MONITORING.REALTIME_PROTECTION</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-secondary flex items-center gap-2">
            <Clock className="h-3 w-3" />
            UPDATED: {lastUpdated.toLocaleTimeString()}
          </div>
          <button 
            className="admin-btn admin-btn-primary flex items-center gap-2"
            onClick={refreshAll}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            SCAN_NOW
          </button>
          <button className="admin-btn flex items-center gap-2">
            <Download className="h-4 w-4" />
            EXPORT_LOGS
          </button>
        </div>
      </div>

      {/* Security Tabs */}
      <div className="admin-card mb-6">
        <div className="flex overflow-x-auto p-2 gap-2">
          {[
            { value: 'overview', label: 'OVERVIEW', icon: Shield },
            { value: 'events', label: 'EVENTS', icon: AlertTriangle },
            { value: 'threats', label: 'THREATS', icon: Target },
            { value: 'access', label: 'ACCESS_LOGS', icon: Eye },
            { value: 'api', label: 'API_KEYS', icon: Key }
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
            {/* Security Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <div className="admin-pulse"></div>
                </div>
                <div className="admin-stat-value">SECURE</div>
                <div className="admin-stat-label">SYSTEM_STATUS</div>
                <div className="admin-stat-change positive">ALL_SHIELDS_UP</div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
                  <Radar className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                </div>
                <div className="admin-stat-value">{threats?.length || 0}</div>
                <div className="admin-stat-label">ACTIVE_THREATS</div>
                <div className="admin-stat-change negative">{threats?.filter(t => t.blocked).length || 0} BLOCKED</div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
                </div>
                <div className="admin-stat-value">{events?.length || 0}</div>
                <div className="admin-stat-label">SECURITY_EVENTS</div>
                <div className="admin-stat-change">LAST_24H</div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Key className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <Database className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                </div>
                <div className="admin-stat-value">{apiKeys?.length || 0}</div>
                <div className="admin-stat-label">API_KEYS</div>
                <div className="admin-stat-change positive">{apiKeys?.filter(k => k.status === 'active').length || 0} ACTIVE</div>
              </div>
            </div>

            {/* Security Monitoring Matrix */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">SECURITY_MONITORING_MATRIX</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="admin-subtitle">FIREWALL</span>
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                  </div>
                  <div className="admin-badge admin-badge-success">ACTIVE</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">BLOCKING_THREATS</p>
                </div>

                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="admin-subtitle">DDoS_PROTECTION</span>
                    <Shield className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                  </div>
                  <div className="admin-badge admin-badge-success">ONLINE</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">TRAFFIC_FILTERED</p>
                </div>

                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="admin-subtitle">INTRUSION_DETECTION</span>
                    <Radar className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                  </div>
                  <div className="admin-badge admin-badge-warning">MONITORING</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">ACTIVE_SCANNING</p>
                </div>

                <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="admin-subtitle">VULNERABILITY_SCAN</span>
                    <Target className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                  </div>
                  <div className="admin-badge admin-badge-secondary">SCHEDULED</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">NEXT_SCAN: 03:00</p>
                </div>
              </div>
            </div>

            {/* Threat Intelligence */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-5 w-5 text-[hsl(var(--admin-danger))]" />
                <h2 className="admin-title text-xl">THREAT_INTELLIGENCE</h2>
              </div>
              <div className="h-64 flex items-center justify-center border border-[hsl(var(--admin-border))] rounded-lg bg-[hsl(var(--admin-surface-elevated))]">
                <div className="text-center">
                  <Radar className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                  <p className="admin-title text-lg mb-2">THREAT_MAP</p>
                  <p className="admin-subtitle">GLOBAL_ATTACK_VECTORS // REAL_TIME_ANALYSIS</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-[hsl(var(--admin-warning))]" />
                  <h2 className="admin-title text-xl">SECURITY_EVENTS</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--admin-text-muted))] h-4 w-4" />
                    <input className="admin-input pl-10" placeholder="SEARCH_EVENTS..." />
                  </div>
                  <button className="admin-btn">
                    <Settings className="h-4 w-4 mr-2" />
                    FILTER
                  </button>
                </div>
              </div>

              <div className="admin-table">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>EVENT_TYPE</th>
                        <th>SEVERITY</th>
                        <th>DESCRIPTION</th>
                        <th>SOURCE</th>
                        <th>TIMESTAMP</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8">
                            <div className="admin-subtitle">NO_SECURITY_EVENTS_DETECTED</div>
                            <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">SYSTEM_SECURE</p>
                          </td>
                        </tr>
                      ) : (
                        events?.map((event) => (
                          <tr key={event.id} className="admin-slide-in">
                            <td>
                              <span className="font-medium text-[hsl(var(--admin-text-primary))]">
                                {event.eventType.toUpperCase().replace('_', '_')}
                              </span>
                            </td>
                            <td>{getSeverityBadge(event.severity)}</td>
                            <td>
                              <div className="text-[hsl(var(--admin-text-primary))]">{event.description}</div>
                            </td>
                            <td>
                              {event.ipAddress ? (
                                <div>
                                  <div className="text-[hsl(var(--admin-text-primary))]">{event.ipAddress}</div>
                                  <div className="text-xs text-[hsl(var(--admin-text-muted))]">{event.userId || 'Unknown'}</div>
                                </div>
                              ) : (
                                <span className="text-[hsl(var(--admin-text-muted))]">SYSTEM</span>
                              )}
                            </td>
                            <td>
                              <div className="text-[hsl(var(--admin-text-secondary))]">
                                {new Date(event.timestamp).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-[hsl(var(--admin-text-muted))]">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </div>
                            </td>
                            <td>{getStatusBadge(event.resolved ? 'resolved' : 'open')}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button className="admin-btn text-xs px-3 py-1">
                                  <Eye className="h-3 w-3 mr-1" />
                                  VIEW
                                </button>
                                {!event.resolved && (
                                  <button 
                                    className="admin-btn admin-btn-primary text-xs px-3 py-1"
                                    onClick={() => resolveEvent(event.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    RESOLVE
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threats Tab */}
        {activeTab === 'threats' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-[hsl(var(--admin-danger))]" />
                  <h2 className="admin-title text-xl">THREAT_DETECTION</h2>
                </div>
                <button className="admin-btn admin-btn-primary">
                  <Radar className="h-4 w-4 mr-2" />
                  SCAN_THREATS
                </button>
              </div>

              <div className="admin-table">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>THREAT_TYPE</th>
                        <th>SOURCE</th>
                        <th>TARGET</th>
                        <th>SEVERITY</th>
                        <th>STATUS</th>
                        <th>TIMESTAMP</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {threats?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8">
                            <div className="admin-subtitle">NO_ACTIVE_THREATS</div>
                            <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">PERIMETER_SECURE</p>
                          </td>
                        </tr>
                      ) : (
                        threats?.map((threat) => (
                          <tr key={threat.id} className="admin-slide-in">
                            <td>
                              <span className="font-medium text-[hsl(var(--admin-text-primary))]">
                                {threat.type.toUpperCase().replace('_', '_')}
                              </span>
                            </td>
                            <td>
                              <div className="text-[hsl(var(--admin-text-primary))]">{threat.source}</div>
                            </td>
                            <td>
                              <div className="text-[hsl(var(--admin-text-primary))]">{threat.target}</div>
                            </td>
                            <td>{getSeverityBadge(threat.severity)}</td>
                            <td>
                              {threat.blocked ? (
                                <span className="admin-badge admin-badge-success">BLOCKED</span>
                              ) : (
                                <span className="admin-badge admin-badge-danger">ACTIVE</span>
                              )}
                            </td>
                            <td>
                              <div className="text-[hsl(var(--admin-text-secondary))]">
                                {new Date(threat.timestamp).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-[hsl(var(--admin-text-muted))]">
                                {new Date(threat.timestamp).toLocaleTimeString()}
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                {!threat.blocked && (
                                  <button 
                                    className="admin-btn admin-btn-danger text-xs px-3 py-1"
                                    onClick={() => blockThreat(threat.id)}
                                  >
                                    <Ban className="h-3 w-3 mr-1" />
                                    BLOCK
                                  </button>
                                )}
                                <button className="admin-btn text-xs px-3 py-1">
                                  <FileText className="h-3 w-3 mr-1" />
                                  DETAILS
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Logs Tab */}
        {activeTab === 'access' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                  <h2 className="admin-title text-xl">ACCESS_LOGS</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--admin-text-muted))] h-4 w-4" />
                    <input className="admin-input pl-10" placeholder="SEARCH_LOGS..." />
                  </div>
                  <button className="admin-btn">
                    <Clock className="h-4 w-4 mr-2" />
                    TIME_RANGE
                  </button>
                </div>
              </div>

              <div className="admin-table">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>USER</th>
                        <th>ACTION</th>
                        <th>RESOURCE</th>
                        <th>IP_ADDRESS</th>
                        <th>TIMESTAMP</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs?.map((log) => (
                        <tr key={log.id} className="admin-slide-in">
                          <td>
                            <div>
                              <div className="font-medium text-[hsl(var(--admin-text-primary))]">
                                {log.userId || 'System'}
                              </div>
                              <div className="text-xs text-[hsl(var(--admin-text-muted))]">
                                {log.userId ? `user-${log.userId}` : 'System User'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="font-medium text-[hsl(var(--admin-text-primary))]">
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <span className="text-[hsl(var(--admin-text-primary))]">{log.resource}</span>
                          </td>
                          <td>
                            <span className="text-[hsl(var(--admin-text-primary))]">{log.ipAddress}</span>
                          </td>
                          <td>
                            <div className="text-[hsl(var(--admin-text-secondary))]">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-[hsl(var(--admin-text-muted))]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </td>
                          <td>
                            {log.success ? (
                              <span className="admin-badge admin-badge-success">SUCCESS</span>
                            ) : (
                              <span className="admin-badge admin-badge-danger">FAILED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
                  <h2 className="admin-title text-xl">API_KEY_MANAGEMENT</h2>
                </div>
                <button className="admin-btn admin-btn-primary">
                  <Key className="h-4 w-4 mr-2" />
                  GENERATE_KEY
                </button>
              </div>

              <div className="admin-table">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>KEY_NAME</th>
                        <th>ORGANIZATION</th>
                        <th>KEY_PREVIEW</th>
                        <th>PERMISSIONS</th>
                        <th>USAGE</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys?.map((key) => (
                        <tr key={key.id} className="admin-slide-in">
                          <td>
                            <div className="font-medium text-[hsl(var(--admin-text-primary))]">
                              {key.name}
                            </div>
                            <div className="text-xs text-[hsl(var(--admin-text-muted))]">
                              Created: {new Date(key.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <span className="text-[hsl(var(--admin-text-primary))]">{key.organization}</span>
                          </td>
                          <td>
                            <code className="text-[hsl(var(--admin-text-primary))] font-mono text-xs bg-[hsl(var(--admin-surface-elevated))] px-2 py-1 rounded">
                              {key.keyPreview}
                            </code>
                          </td>
                          <td>
                            <div className="space-x-1">
                              {key.permissions.map((perm, idx) => (
                                <span key={idx} className="admin-badge admin-badge-secondary text-xs">
                                  {perm.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="text-[hsl(var(--admin-text-primary))]">
                              {key.usageCount.toLocaleString()} calls
                            </div>
                            <div className="text-xs text-[hsl(var(--admin-text-muted))]">
                              Last used: {new Date(key.lastUsed).toLocaleDateString()}
                            </div>
                          </td>
                          <td>{getApiKeyStatusBadge(key.status)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button className="admin-btn text-xs px-3 py-1">
                                <Eye className="h-3 w-3 mr-1" />
                                VIEW
                              </button>
                              {key.status === 'active' && (
                                <button 
                                  className="admin-btn admin-btn-danger text-xs px-3 py-1"
                                  onClick={() => revokeApiKey(key.id)}
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  REVOKE
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <h4 className="admin-title text-lg mb-2">SECURITY_GRID_STATUS</h4>
                <p className="admin-subtitle mb-3">
                  COMPREHENSIVE_SECURITY.MONITORING // THREAT_DETECTION // ACCESS_CONTROL
                </p>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                  // Real-time threat intelligence and advanced security analytics are being integrated.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}