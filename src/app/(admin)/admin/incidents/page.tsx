"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  FileText,
  Bell,
  Users,
  Zap,
  Database,
  Server,
  Globe,
  MessageSquare,
  Mail,
  Phone,
  Shield,
  Eye,
  Edit,
  Plus,
  Filter,
  RefreshCw,
  BarChart3,
  AlertCircle,
  Timer,
  Calendar,
  Search,
  Archive,
  BookOpen,
  Target,
  Layers,
  CircuitBoard,
  Cpu,
  HardDrive,
  Wifi,
  PowerCircle,
  Terminal,
  Radar
} from "lucide-react";
import { useState, useEffect } from "react";

// Types for incident management
interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affectedSystems: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo: string;
  reporter: string;
  impactDescription: string;
  resolutionNotes?: string;
  escalationLevel: number;
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  rootCause?: string;
  followUpActions?: string[];
}

interface SystemComponent {
  name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  description: string;
  lastIncident?: string;
  uptime: string;
  dependencies: string[];
}

interface PostMortem {
  id: string;
  incidentId: string;
  incidentTitle: string;
  createdAt: string;
  duration: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rootCause: string;
  timeline: {
    time: string;
    event: string;
    action?: string;
  }[];
  lessonsLearned: string[];
  actionItems: {
    description: string;
    assignee: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  affectedUsers: number;
  financialImpact?: string;
}

interface EscalationRule {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggerConditions: string[];
  escalationPath: {
    level: number;
    role: string;
    timeoutMinutes: number;
    notificationMethods: ('email' | 'sms' | 'slack')[];
  }[];
  isActive: boolean;
}

interface Alert {
  id: string;
  name: string;
  description: string;
  metric: string;
  threshold: {
    warning: number;
    critical: number;
  };
  currentValue: number;
  status: 'normal' | 'warning' | 'critical';
  lastTriggered?: string;
  isEnabled: boolean;
}

export default function AdminIncidentsPage() {
  const { permissions, staffRole } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [systemComponents, setSystemComponents] = useState<SystemComponent[]>([]);
  const [postMortems, setPostMortems] = useState<PostMortem[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all incident data from real APIs in parallel
        const [
          incidentsResponse,
          componentsResponse,
          postMortemsResponse,
          escalationResponse,
          alertsResponse
        ] = await Promise.allSettled([
          fetch('/api/v2/admin/incidents?type=incidents'),
          fetch('/api/v2/admin/incidents?type=components'),
          fetch('/api/v2/admin/incidents?type=postmortems'),
          fetch('/api/v2/admin/incidents?type=escalation'),
          fetch('/api/v2/admin/incidents?type=alerts')
        ]);

        // Process incidents data
        if (incidentsResponse.status === 'fulfilled' && incidentsResponse.value.ok) {
          const incidentsData = await incidentsResponse.value.json();
          if (incidentsData.success) {
            setIncidents(incidentsData.data || []);
          }
        }

        // Process system components data
        if (componentsResponse.status === 'fulfilled' && componentsResponse.value.ok) {
          const componentsData = await componentsResponse.value.json();
          if (componentsData.success) {
            setSystemComponents(componentsData.data || []);
          }
        }

        // Process post-mortems data
        if (postMortemsResponse.status === 'fulfilled' && postMortemsResponse.value.ok) {
          const postMortemsData = await postMortemsResponse.value.json();
          if (postMortemsData.success) {
            setPostMortems(postMortemsData.data || []);
          }
        }

        // Process escalation rules data
        if (escalationResponse.status === 'fulfilled' && escalationResponse.value.ok) {
          const escalationData = await escalationResponse.value.json();
          if (escalationData.success) {
            setEscalationRules(escalationData.data || []);
          }
        }

        // Process alerts data
        if (alertsResponse.status === 'fulfilled' && alertsResponse.value.ok) {
          const alertsData = await alertsResponse.value.json();
          if (alertsData.success) {
            setAlerts(alertsData.data || []);
          }
        }

      } catch (error) {
        console.error('Error fetching incidents data:', error);
        // Fallback to empty arrays on error
        setIncidents([]);
        setSystemComponents([]);
        setPostMortems([]);
        setEscalationRules([]);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!permissions.canManageIncidents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--admin-warning))] mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">ACCESS_DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT_PRIVILEGES.THREAT_MONITOR_ACCESS_REQUIRED
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <span className="admin-badge admin-badge-success">OPERATIONAL</span>;
      case 'degraded':
        return <span className="admin-badge admin-badge-warning">DEGRADED</span>;
      case 'partial_outage':
        return <span className="admin-badge admin-badge-warning">PARTIAL_OUTAGE</span>;
      case 'major_outage':
        return <span className="admin-badge admin-badge-danger">MAJOR_OUTAGE</span>;
      case 'investigating':
        return <span className="admin-badge admin-badge-secondary">INVESTIGATING</span>;
      case 'identified':
        return <span className="admin-badge admin-badge-accent">IDENTIFIED</span>;
      case 'monitoring':
        return <span className="admin-badge admin-badge-warning">MONITORING</span>;
      case 'resolved':
        return <span className="admin-badge admin-badge-success">RESOLVED</span>;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-[hsl(var(--admin-success))]" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-[hsl(var(--admin-warning))]" />;
      case 'partial_outage':
        return <AlertTriangle className="h-4 w-4 text-[hsl(var(--admin-warning))]" />;
      case 'major_outage':
        return <XCircle className="h-4 w-4 text-[hsl(var(--admin-danger))]" />;
      case 'investigating':
        return <Search className="h-4 w-4 text-[hsl(var(--admin-accent))]" />;
      case 'identified':
        return <Eye className="h-4 w-4 text-[hsl(var(--admin-secondary))]" />;
      case 'monitoring':
        return <Activity className="h-4 w-4 text-[hsl(var(--admin-warning))]" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-[hsl(var(--admin-success))]" />;
      default:
        return <AlertCircle className="h-4 w-4 text-[hsl(var(--admin-text-muted))]" />;
    }
  };

  const getSystemIcon = (systemName: string) => {
    switch (systemName.toLowerCase()) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <CircuitBoard className="h-4 w-4" />;
      case 'web application':
        return <Globe className="h-4 w-4" />;
      case 'sms service':
        return <MessageSquare className="h-4 w-4" />;
      case 'email service':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp api':
        return <MessageSquare className="h-4 w-4" />;
      case 'redis cache':
        return <Layers className="h-4 w-4" />;
      case 'message queue':
        return <Layers className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const criticalIncidents = incidents.filter(i => i.severity === 'critical');
  const avgResolutionTime = "2.5 hours"; // Mock data
  const systemHealth = Math.round((systemComponents.filter(c => c.status === 'operational').length / systemComponents.length) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="admin-loading mx-auto mb-4"></div>
          <h2 className="admin-title text-xl mb-2">THREAT_MONITOR_LOADING</h2>
          <p className="admin-subtitle">INITIALIZING_INCIDENT_RESPONSE_PROTOCOLS...</p>
        </div>
      </div>
    );
  }

  if (!permissions.canManageIncidents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--admin-warning))] mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">ACCESS_DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT_PRIVILEGES.THREAT_MONITOR_ACCESS_REQUIRED
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">THREAT_MONITOR</h1>
          <p className="admin-subtitle">INCIDENT_RESPONSE.SYSTEM_STATUS.THREAT_ANALYSIS</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-secondary flex items-center gap-2">
            <Shield className="h-3 w-3" />
            INCIDENT_RESPONSE_CENTER
          </div>
          <button 
            className="admin-btn admin-btn-primary flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            NEW_INCIDENT
          </button>
          <button className="admin-btn flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            REFRESH_ALL
          </button>
        </div>
      </div>

      {/* Threat Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
            <Target className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
          </div>
          <div className="admin-stat-value">{activeIncidents.length}</div>
          <div className="admin-stat-label">ACTIVE_INCIDENTS</div>
          <div className="admin-stat-change negative">{criticalIncidents.length}_CRITICAL</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-6 w-6 text-[hsl(var(--admin-success))]" />
            <div className="admin-pulse"></div>
          </div>
          <div className="admin-stat-value">{systemHealth || 0}%</div>
          <div className="admin-stat-label">SYSTEM_HEALTH</div>
          <div className="admin-stat-change positive">OPERATIONAL_STATUS</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Timer className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
            <Clock className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
          </div>
          <div className="admin-stat-value">{avgResolutionTime}</div>
          <div className="admin-stat-label">MTTR</div>
          <div className="admin-stat-change">MEAN_TIME_TO_RESOLUTION</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Bell className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
            <Radar className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
          </div>
          <div className="admin-stat-value">
            {alerts.filter(a => a.status !== 'normal').length}
          </div>
          <div className="admin-stat-label">ACTIVE_ALERTS</div>
          <div className="admin-stat-change negative">MONITORING_TRIGGERED</div>
        </div>
      </div>

      {/* Incident Management Tabs */}
      <div className="admin-card mb-6">
        <div className="flex overflow-x-auto p-2 gap-2">
          {[
            { value: 'overview', label: 'OVERVIEW', icon: BarChart3 },
            { value: 'active', label: 'ACTIVE_INCIDENTS', icon: AlertTriangle },
            { value: 'history', label: 'HISTORY', icon: Archive },
            { value: 'postmortems', label: 'POST_MORTEMS', icon: BookOpen },
            { value: 'alerts', label: 'ALERTS', icon: Bell },
            { value: 'escalation', label: 'ESCALATION', icon: Users }
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
            {/* System Status Overview */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">SYSTEM_STATUS_MATRIX</h2>
              </div>
              <div className="space-y-4">
                {systemComponents.map((component) => (
                  <div key={component.name} className="admin-card p-4 border border-[hsl(var(--admin-border))]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSystemIcon(component.name)}
                        <div>
                          <h4 className="admin-title text-sm">{component.name.toUpperCase()}</h4>
                          <p className="admin-subtitle text-xs">{component.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="admin-stat-value text-xs">UPTIME: {component.uptime}</div>
                          {component.lastIncident && (
                            <div className="admin-stat-label text-xs">LAST_INCIDENT: {component.lastIncident}</div>
                          )}
                        </div>
                        {getStatusBadge(component.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--admin-warning))]" />
                <h2 className="admin-title text-xl">RECENT_INCIDENT_ACTIVITY</h2>
              </div>
              <div className="space-y-4">
                {incidents.slice(0, 3).map((incident) => (
                  <div key={incident.id} className="admin-card p-4 border border-[hsl(var(--admin-border))]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(incident.status)}
                        <h4 className="admin-title text-sm">{incident.title}</h4>
                        {getSeverityBadge(incident.severity)}
                      </div>
                      <div className="admin-badge admin-badge-secondary text-xs">{incident.id}</div>
                    </div>
                    <div className="admin-subtitle text-xs">{incident.description}</div>
                    <div className="flex justify-between mt-2">
                      <span className="admin-stat-label text-xs">CREATED: {incident.createdAt}</span>
                      <span className="admin-stat-label text-xs">SYSTEMS: {incident.affectedSystems.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Incidents Tab */}
        {activeTab === 'active' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-[hsl(var(--admin-danger))]" />
                  <h2 className="admin-title text-xl">ACTIVE_INCIDENTS</h2>
                </div>
                <button className="admin-btn admin-btn-primary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  REFRESH_STATUS
                </button>
              </div>
              
              {activeIncidents.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-[hsl(var(--admin-success))] mx-auto mb-4" />
                  <div className="admin-title">NO_ACTIVE_INCIDENTS</div>
                  <p className="admin-subtitle mt-2">ALL_SYSTEMS_OPERATIONAL</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeIncidents.map((incident) => (
                    <div key={incident.id} className="admin-card p-4 border border-[hsl(var(--admin-border))]">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="admin-title text-sm">{incident.title}</h3>
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(incident.severity)}
                              <span className="admin-badge admin-badge-secondary text-xs">{incident.id}</span>
                            </div>
                          </div>
                          <p className="admin-subtitle text-xs mb-3">{incident.description}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusBadge(incident.status)}
                          <button className="admin-btn text-xs px-3 py-1">
                            <Edit className="h-3 w-3 mr-1" />
                            UPDATE
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="admin-stat-label text-xs">STARTED</div>
                          <div className="admin-stat-value text-xs">{incident.createdAt}</div>
                        </div>
                        <div>
                          <div className="admin-stat-label text-xs">DURATION</div>
                          <div className="admin-stat-value text-xs">
                            {Math.round((new Date().getTime() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60))}h
                          </div>
                        </div>
                        <div>
                          <div className="admin-stat-label text-xs">ASSIGNEE</div>
                          <div className="admin-stat-value text-xs">{incident.assignedTo || 'UNASSIGNED'}</div>
                        </div>
                      </div>

                      <div className="border-t border-[hsl(var(--admin-border))] pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="admin-stat-label text-xs mb-1">AFFECTED_SYSTEMS</div>
                            <div className="flex flex-wrap gap-1">
                              {incident.affectedSystems.slice(0, 3).map((system) => (
                                <span key={system} className="admin-badge admin-badge-secondary text-xs">{system}</span>
                              ))}
                              {incident.affectedSystems.length > 3 && (
                                <span className="admin-subtitle text-xs">+{incident.affectedSystems.length - 3}_MORE</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="admin-subtitle text-xs">LAST_UPDATE: {incident.updatedAt}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {['history', 'postmortems', 'alerts', 'escalation'].includes(activeTab) && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                <h3 className="admin-title text-lg mb-2">{activeTab.toUpperCase()}_MODULE</h3>
                <p className="admin-subtitle">
                  {activeTab.toUpperCase()}_INTERFACE // THREAT_MONITORING // INCIDENT_RESPONSE
                </p>
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
                <h4 className="admin-title text-lg mb-2">THREAT_MONITOR_STATUS</h4>
                <p className="admin-subtitle mb-3">
                  INCIDENT_MANAGEMENT // ESCALATION_WORKFLOWS // POST_MORTEM_ANALYSIS
                </p>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                  // Advanced threat detection, automated incident response, and comprehensive monitoring systems active.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

