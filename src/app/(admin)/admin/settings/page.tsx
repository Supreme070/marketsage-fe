"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { useAdminSettingsDashboard } from "@/lib/api/hooks/useAdminSettings";
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  Server,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  UserPlus,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Clock,
  Globe,
  Database,
  Flag,
  Activity,
  Mail,
  Smartphone,
  Slack,
  Key,
  Archive,
  Download,
  Upload,
  Zap
} from "lucide-react";
import { useState } from "react";

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'IT_ADMIN';
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
  lastActive: string;
  createdAt: string;
  ipWhitelist?: string[];
  twoFactorEnabled: boolean;
}

interface SecuritySettings {
  sessionTimeout: number;
  twoFactorRequired: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxAge: number;
  };
  loginAttempts: {
    maxAttempts: number;
    lockoutDuration: number;
  };
}

interface NotificationSettings {
  emailEnabled: boolean;
  slackEnabled: boolean;
  smsEnabled: boolean;
  channels: {
    security: string[];
    system: string[];
    user: string[];
    billing: string[];
  };
  escalation: {
    highPriorityMinutes: number;
    criticalMinutes: number;
  };
}

interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  featureFlags: {
    [key: string]: boolean;
  };
  rateLimiting: {
    api: number;
    auth: number;
    bulk: number;
  };
  cacheTTL: {
    session: number;
    data: number;
    static: number;
  };
}

interface LogSettings {
  retention: {
    audit: number;
    system: number;
    security: number;
  };
  levels: {
    application: string;
    security: string;
    audit: string;
  };
  export: {
    format: string;
    compression: boolean;
  };
}

export default function AdminSettingsPage() {
  const { permissions, staffRole } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { 
    staffMembers, 
    securitySettings, 
    notificationSettings, 
    systemSettings, 
    logSettings, 
    loading, 
    error, 
    refreshAll, 
    saveAll 
  } = useAdminSettingsDashboard();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="admin-badge admin-badge-success">ACTIVE</span>;
      case 'inactive':
        return <span className="admin-badge admin-badge-secondary">INACTIVE</span>;
      case 'pending':
        return <span className="admin-badge admin-badge-warning">PENDING</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="admin-badge admin-badge-danger">SUPER_ADMIN</span>;
      case 'IT_ADMIN':
        return <span className="admin-badge admin-badge-secondary">IT_ADMIN</span>;
      case 'ADMIN':
        return <span className="admin-badge admin-badge-accent">ADMIN</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{role.toUpperCase()}</span>;
    }
  };

  if (!permissions.canManageStaff && staffRole !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--admin-warning))] mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">ACCESS_DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT_PRIVILEGES.CONFIG_PANEL_ACCESS_REQUIRED
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="admin-loading mx-auto mb-4"></div>
          <h2 className="admin-title text-xl mb-2">CONFIG_PANEL_LOADING</h2>
          <p className="admin-subtitle">INITIALIZING_SYSTEM_CONFIGURATION...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">Config_Panel_Error</h2>
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
          <h1 className="admin-title text-2xl mb-1">CONFIG_PANEL</h1>
          <p className="admin-subtitle">SYSTEM_CONFIGURATION.SECURITY_CONTROLS.ADMIN_MANAGEMENT</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-secondary flex items-center gap-2">
            <Settings className="h-3 w-3" />
            CONFIGURATION_CENTER
          </div>
          <button 
            className={`admin-btn flex items-center gap-2 ${loading ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
            onClick={saveAll}
            disabled={loading}
          >
            <Save className="h-4 w-4" />
            {loading ? 'SAVING...' : 'SAVE_ALL'}
          </button>
        </div>
      </div>

      {/* Configuration Control Tabs */}
      <div className="admin-card mb-6">
        <div className="flex overflow-x-auto p-2 gap-2">
          {[
            { value: 'overview', label: 'OVERVIEW', icon: Activity },
            { value: 'staff', label: 'STAFF_CONTROL', icon: Users },
            { value: 'security', label: 'SECURITY', icon: Shield },
            { value: 'notifications', label: 'NOTIFICATIONS', icon: Bell },
            { value: 'system', label: 'SYSTEM', icon: Server },
            { value: 'logs', label: 'LOG_ARCHIVE', icon: FileText }
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
            {/* Configuration Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
                </div>
                <div className="admin-stat-value">{staffMembers?.length || 0}</div>
                <div className="admin-stat-label">STAFF_MEMBERS</div>
                <div className="admin-stat-change positive">ACTIVE_PERSONNEL</div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--admin-success))]" />
                </div>
                <div className="admin-stat-value">SECURE</div>
                <div className="admin-stat-label">SECURITY_STATUS</div>
                <div className="admin-stat-change positive">ALL_PROTOCOLS_ACTIVE</div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Bell className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                  <div className="admin-pulse"></div>
                </div>
                <div className="admin-stat-value">ONLINE</div>
                <div className="admin-stat-label">NOTIFICATION_SYSTEM</div>
                <div className="admin-stat-change">REAL_TIME_ALERTS</div>
              </div>

              <div className="admin-stat-card admin-glow-hover">
                <div className="flex items-center justify-between mb-4">
                  <Server className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
                  <Activity className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                </div>
                <div className="admin-stat-value">OPTIMAL</div>
                <div className="admin-stat-label">SYSTEM_PERFORMANCE</div>
                <div className="admin-stat-change positive">RESOURCES_AVAILABLE</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="h-5 w-5 text-[hsl(var(--admin-warning))]" />
                <h2 className="admin-title text-xl">QUICK_ACTIONS</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="admin-btn admin-btn-primary text-left p-4">
                  <UserPlus className="h-5 w-5 mb-2" />
                  <div className="admin-title text-sm">ADD_STAFF_MEMBER</div>
                  <div className="admin-subtitle text-xs">PERSONNEL_MANAGEMENT</div>
                </button>
                <button className="admin-btn text-left p-4">
                  <Download className="h-5 w-5 mb-2" />
                  <div className="admin-title text-sm">EXPORT_CONFIGS</div>
                  <div className="admin-subtitle text-xs">BACKUP_SETTINGS</div>
                </button>
                <button className="admin-btn text-left p-4">
                  <Upload className="h-5 w-5 mb-2" />
                  <div className="admin-title text-sm">IMPORT_SETTINGS</div>
                  <div className="admin-subtitle text-xs">RESTORE_CONFIGURATION</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {['staff', 'security', 'notifications', 'system', 'logs'].includes(activeTab) && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                <h3 className="admin-title text-lg mb-2">{activeTab.toUpperCase().replace('-', '_')}_MODULE</h3>
                <p className="admin-subtitle">
                  {activeTab.toUpperCase().replace('-', '_')}_CONFIGURATION // SYSTEM_CONTROL // ADVANCED_SETTINGS
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Development Notice */}
      {staffRole === 'SUPER_ADMIN' && (
        <div className="admin-card p-6 mt-8 border-l-4 border-l-[hsl(var(--admin-primary))]">
          <div className="flex items-start gap-4">
            <Settings className="h-6 w-6 text-[hsl(var(--admin-primary))] mt-1" />
            <div>
              <h4 className="admin-title text-lg mb-2">CONFIG_PANEL_STATUS</h4>
              <p className="admin-subtitle mb-3">
                SYSTEM_CONFIGURATION // SECURITY_CONTROLS // ADMINISTRATIVE_MANAGEMENT
              </p>
              <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                Advanced configuration management system with real-time settings synchronization active.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
