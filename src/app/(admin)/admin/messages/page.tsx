"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { useAdminMessagesDashboard } from "@/lib/api/hooks/useAdminMessages";
import { 
  MessageSquare, 
  Mail, 
  Phone,
  Search, 
  AlertTriangle,
  RefreshCw,
  Download,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Server,
  Database,
  Wifi,
  RotateCcw,
  Trash2,
  Play,
  Pause,
  Settings,
  Terminal,
  Radio,
  Satellite,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";

interface QueueStats {
  name: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'WEBHOOK';
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  stuck: number;
  averageProcessTime: string;
  status: 'healthy' | 'degraded' | 'error';
}

interface FailedMessage {
  id: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  recipient: string;
  subject?: string;
  error: string;
  retryCount: number;
  failedAt: string;
  campaignName?: string;
  organizationName: string;
}

interface ProviderHealth {
  name: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  status: 'operational' | 'degraded' | 'down';
  responseTime: string;
  successRate: number;
  lastChecked: string;
  issues?: string[];
}

export default function AdminMessagesPage() {
  const { permissions, staffRole } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");

  const { 
    queueStats, 
    queueStatsLoading, 
    queueStatsError, 
    failedMessages, 
    failedMessagesLoading, 
    failedMessagesError, 
    providerHealth, 
    providerHealthLoading, 
    providerHealthError, 
    metrics, 
    metricsLoading, 
    metricsError, 
    refreshAll,
    retryMessage,
    clearQueue,
    pauseQueue,
    resumeQueue
  } = useAdminMessagesDashboard();

  if (!permissions.canAccessSystem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--admin-warning))] mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">ACCESS_DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT_PRIVILEGES.COMM_CHANNEL_ACCESS_REQUIRED
          </p>
        </div>
      </div>
    );
  }

  const getQueueStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <span className="admin-badge admin-badge-success">HEALTHY</span>;
      case 'degraded':
        return <span className="admin-badge admin-badge-warning">DEGRADED</span>;
      case 'error':
        return <span className="admin-badge admin-badge-danger">ERROR</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getProviderStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <span className="admin-badge admin-badge-success">OPERATIONAL</span>;
      case 'degraded':
        return <span className="admin-badge admin-badge-warning">DEGRADED</span>;
      case 'down':
        return <span className="admin-badge admin-badge-danger">DOWN</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <Phone className="h-4 w-4" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4" />;
      case 'WEBHOOK':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    try {
      await retryMessage(messageId);
    } catch (error) {
      console.error('Failed to retry message:', error);
    }
  };

  const handleClearQueue = async (queueName: string) => {
    try {
      await clearQueue(queueName);
    } catch (error) {
      console.error('Failed to clear queue:', error);
    }
  };

  const handlePauseQueue = async (queueName: string) => {
    try {
      await pauseQueue(queueName);
    } catch (error) {
      console.error('Failed to pause queue:', error);
    }
  };

  const handleResumeQueue = async (queueName: string) => {
    try {
      await resumeQueue(queueName);
    } catch (error) {
      console.error('Failed to resume queue:', error);
    }
  };

  const loading = queueStatsLoading || failedMessagesLoading || providerHealthLoading || metricsLoading;
  const error = queueStatsError || failedMessagesError || providerHealthError || metricsError;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="admin-loading mx-auto mb-4"></div>
          <h2 className="admin-title text-xl mb-2">COMM_CHANNEL_LOADING</h2>
          <p className="admin-subtitle">INITIALIZING_MESSAGE_ROUTING_PROTOCOLS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">Comm_Channel_Error</h2>
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

  if (!permissions.canAccessSystem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--admin-warning))] mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">ACCESS_DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT_PRIVILEGES.COMM_CHANNEL_ACCESS_REQUIRED
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
          <h1 className="admin-title text-2xl mb-1">COMM_CHANNEL</h1>
          <p className="admin-subtitle">MESSAGE_ROUTING.QUEUE_MONITORING.PROVIDER_HEALTH</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-secondary flex items-center gap-2">
            <Radio className="h-3 w-3" />
            SYSTEM_MONITORING
          </div>
          <button className="admin-btn admin-btn-primary flex items-center gap-2" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" />
            REFRESH_ALL
          </button>
        </div>
      </div>

      {/* Communication Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
            <Database className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
          </div>
          <div className="admin-stat-value">{metrics?.totalQueued.toLocaleString() || '0'}</div>
          <div className="admin-stat-label">TOTAL_QUEUED</div>
          <div className="admin-stat-change">MESSAGES_PENDING_PROCESSING</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
            <div className="admin-pulse"></div>
          </div>
          <div className="admin-stat-value">{metrics?.totalProcessing || '0'}</div>
          <div className="admin-stat-label">PROCESSING</div>
          <div className="admin-stat-change positive">CURRENTLY_TRANSMITTING</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
            <TrendingUp className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
          </div>
          <div className="admin-stat-value">{metrics?.failedToday || '0'}</div>
          <div className="admin-stat-label">FAILED_TODAY</div>
          <div className="admin-stat-change negative">+{metrics?.failedSinceLastHour || '0'}_SINCE_LAST_HOUR</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="h-6 w-6 text-[hsl(var(--admin-success))]" />
            <TrendingUp className="h-4 w-4 text-[hsl(var(--admin-success))]" />
          </div>
          <div className="admin-stat-value">{metrics?.successRate || '0'}%</div>
          <div className="admin-stat-label">SUCCESS_RATE</div>
          <div className="admin-stat-change positive">+{metrics?.successRateImprovement || '0'}%_IMPROVEMENT</div>
        </div>
      </div>

      {/* Message Center Tabs */}
      <div className="admin-card mb-6">
        <div className="flex overflow-x-auto p-2 gap-2">
          {[
            { value: 'overview', label: 'OVERVIEW', icon: Activity },
            { value: 'queues', label: 'MESSAGE_QUEUES', icon: Database },
            { value: 'failed', label: 'FAILED_MESSAGES', icon: XCircle },
            { value: 'providers', label: 'PROVIDERS', icon: Server }
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
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">COMMUNICATION_OVERVIEW</h2>
              </div>
              <div className="text-center py-12">
                <Radio className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                <h3 className="admin-title text-lg mb-2">MESSAGE_ROUTING_CENTER</h3>
                <p className="admin-subtitle">
                  REAL_TIME_PROCESSING // QUEUE_MONITORING // PROVIDER_STATUS
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Queues Tab */}
        {activeTab === 'queues' && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
                  <h2 className="admin-title text-xl">MESSAGE_QUEUE_STATUS</h2>
                </div>
                <button className="admin-btn admin-btn-primary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  REFRESH_STATUS
                </button>
              </div>
              
              {queueStats.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4" />
                  <div className="admin-subtitle">NO_QUEUE_DATA</div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-2">QUEUE_MONITORING_INITIALIZING</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queueStats.map((queue) => (
                    <div key={queue.name} className="admin-card p-4 border border-[hsl(var(--admin-border))]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(queue.type)}
                          <div>
                            <h3 className="admin-title text-sm">{queue.name.toUpperCase()}</h3>
                            <p className="admin-subtitle text-xs">AVG_PROCESSING: {queue.averageProcessTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getQueueStatusBadge(queue.status)}
                          <div className="flex gap-2">
                            <button 
                              className="admin-btn text-xs px-3 py-1"
                              onClick={() => handlePauseQueue(queue.name)}
                            >
                              <Pause className="h-3 w-3 mr-1" />
                              PAUSE
                            </button>
                            <button 
                              className="admin-btn text-xs px-3 py-1" 
                              onClick={() => handleClearQueue(queue.name)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              CLEAR
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className="admin-stat-value text-sm text-[hsl(var(--admin-warning))]">{queue.pending.toLocaleString()}</div>
                          <div className="admin-stat-label text-xs">PENDING</div>
                        </div>
                        <div className="text-center">
                          <div className="admin-stat-value text-sm text-[hsl(var(--admin-accent))]">{queue.processing}</div>
                          <div className="admin-stat-label text-xs">PROCESSING</div>
                        </div>
                        <div className="text-center">
                          <div className="admin-stat-value text-sm text-[hsl(var(--admin-success))]">{queue.completed.toLocaleString()}</div>
                          <div className="admin-stat-label text-xs">COMPLETED</div>
                        </div>
                        <div className="text-center">
                          <div className="admin-stat-value text-sm text-[hsl(var(--admin-danger))]">{queue.failed}</div>
                          <div className="admin-stat-label text-xs">FAILED</div>
                        </div>
                        {queue.stuck > 0 && (
                          <div className="text-center">
                            <div className="admin-stat-value text-sm text-[hsl(var(--admin-warning))]">{queue.stuck}</div>
                            <div className="admin-stat-label text-xs">STUCK</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder for Failed Messages and Providers tabs */}
        {['failed', 'providers'].includes(activeTab) && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="text-center py-12">
                <Terminal className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4" />
                <h3 className="admin-title text-lg mb-2">{activeTab.toUpperCase()}_MODULE</h3>
                <p className="admin-subtitle">
                  {activeTab.toUpperCase()}_INTERFACE // MESSAGE_ROUTING // COMMUNICATION_PROTOCOLS
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
                <h4 className="admin-title text-lg mb-2">COMM_CHANNEL_STATUS</h4>
                <p className="admin-subtitle mb-3">
                  MESSAGE_ROUTING // QUEUE_MONITORING // PROVIDER_HEALTH_TRACKING
                </p>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                  // Real-time monitoring protocols, automated failover systems, and queue optimization algorithms active.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
