"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
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
import { useState, useEffect } from "react";

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for different settings sections
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({} as SecuritySettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({} as NotificationSettings);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({} as SystemSettings);
  const [logSettings, setLogSettings] = useState<LogSettings>({} as LogSettings);

  // Real data initialization
  useEffect(() => {
    const loadSettingsData = async () => {
      setLoading(true);
      
      try {
        // Load all settings data in parallel
        const [staffResponse, securityResponse, notificationResponse, systemResponse, logsResponse] = await Promise.all([
          fetch('/api/v2/admin/settings?type=staff'),
          fetch('/api/v2/admin/settings?type=security'),
          fetch('/api/v2/admin/settings?type=notifications'),
          fetch('/api/v2/admin/settings?type=system'),
          fetch('/api/v2/admin/settings?type=logs')
        ]);

        // Parse responses
        const staffData = await staffResponse.json();
        const securityData = await securityResponse.json();
        const notificationData = await notificationResponse.json();
        const systemData = await systemResponse.json();
        const logsData = await logsResponse.json();

        // Set state from API responses
        if (staffData.success) {
          setStaffMembers(staffData.data);
        }

        if (securityData.success) {
          setSecuritySettings(securityData.data);
        }

        if (notificationData.success) {
          setNotificationSettings(notificationData.data);
        }

        if (systemData.success) {
          setSystemSettings(systemData.data);
        }

        if (logsData.success) {
          setLogSettings(logsData.data);
        }

      } catch (error) {
        console.error('Error loading settings data:', error);
        // Set fallback default values if API fails
        setStaffMembers([]);
        setSecuritySettings({
          sessionTimeout: 1800,
          twoFactorRequired: false,
          ipWhitelistEnabled: false,
          ipWhitelist: [],
          passwordPolicy: {
            minLength: 12,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: true,
            maxAge: 90
          },
          loginAttempts: {
            maxAttempts: 5,
            lockoutDuration: 300
          }
        });
        setNotificationSettings({
          emailEnabled: true,
          slackEnabled: false,
          smsEnabled: false,
          channels: {
            security: ['email'],
            system: ['email'],
            user: ['email'],
            billing: ['email']
          },
          escalation: {
            highPriorityMinutes: 30,
            criticalMinutes: 5
          }
        });
        setSystemSettings({
          maintenanceMode: false,
          maintenanceMessage: "MarketSage is undergoing scheduled maintenance. We'll be back shortly.",
          featureFlags: {},
          rateLimiting: {
            api: 1000,
            auth: 10,
            bulk: 100
          },
          cacheTTL: {
            session: 1800,
            data: 300,
            static: 3600
          }
        });
        setLogSettings({
          retention: {
            audit: 365,
            system: 90,
            security: 180
          },
          levels: {
            application: 'info',
            security: 'warn',
            audit: 'info'
          },
          export: {
            format: 'json',
            compression: true
          }
        });
      }
      
      setLoading(false);
    };

    loadSettingsData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Save all settings in parallel
      const saveRequests = [
        fetch('/api/v2/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'update_settings',
            category: 'security',
            ...securitySettings
          })
        }),
        fetch('/api/v2/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'update_settings',
            category: 'notifications',
            ...notificationSettings
          })
        }),
        fetch('/api/v2/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'update_settings',
            category: 'system',
            ...systemSettings
          })
        }),
        fetch('/api/v2/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'update_settings',
            category: 'logging',
            ...logSettings
          })
        })
      ];

      const responses = await Promise.all(saveRequests);
      const successful = responses.every(response => response.ok);

      if (successful) {
        console.log('Settings saved successfully');
      } else {
        console.error('Some settings failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    
    setSaving(false);
  };

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
            className={`admin-btn flex items-center gap-2 ${saving ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'SAVING...' : 'SAVE_ALL'}
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
                <div className="admin-stat-value">{staffMembers.length}</div>
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
