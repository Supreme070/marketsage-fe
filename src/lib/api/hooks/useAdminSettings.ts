/**
 * Admin Settings API Hooks
 * React hooks for admin settings management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface StaffMember {
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

export interface SecuritySettings {
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

export interface NotificationSettings {
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

export interface SystemSettings {
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

export interface LogSettings {
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

// Staff Members Hook
export function useAdminStaffMembers() {
  const apiClient = useApiClient();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<StaffMember[]>('/admin/settings?type=staff');
      setStaffMembers(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  const addStaffMember = useCallback(async (staffData: Partial<StaffMember>) => {
    try {
      await apiClient.post('/admin/settings/staff', staffData);
      await fetchStaffMembers(); // Refresh staff members
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add staff member');
      throw err;
    }
  }, [apiClient, fetchStaffMembers]);

  const updateStaffMember = useCallback(async (id: string, staffData: Partial<StaffMember>) => {
    try {
      await apiClient.post(`/admin/settings/staff/${id}`, staffData);
      await fetchStaffMembers(); // Refresh staff members
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff member');
      throw err;
    }
  }, [apiClient, fetchStaffMembers]);

  const removeStaffMember = useCallback(async (id: string) => {
    try {
      await apiClient.post(`/admin/settings/staff/${id}/remove`);
      await fetchStaffMembers(); // Refresh staff members
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove staff member');
      throw err;
    }
  }, [apiClient, fetchStaffMembers]);

  return {
    staffMembers,
    loading,
    error,
    fetchStaffMembers,
    addStaffMember,
    updateStaffMember,
    removeStaffMember
  };
}

// Security Settings Hook
export function useAdminSecuritySettings() {
  const apiClient = useApiClient();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SecuritySettings>('/admin/settings?type=security');
      setSettings(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<SecuritySettings>) => {
    try {
      await apiClient.post('/admin/settings', {
        type: 'update_settings',
        category: 'security',
        ...newSettings
      });
      await fetchSettings(); // Refresh settings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update security settings');
      throw err;
    }
  }, [apiClient, fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings
  };
}

// Notification Settings Hook
export function useAdminNotificationSettings() {
  const apiClient = useApiClient();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<NotificationSettings>('/admin/settings?type=notifications');
      setSettings(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      await apiClient.post('/admin/settings', {
        type: 'update_settings',
        category: 'notifications',
        ...newSettings
      });
      await fetchSettings(); // Refresh settings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
      throw err;
    }
  }, [apiClient, fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings
  };
}

// System Settings Hook
export function useAdminSystemSettings() {
  const apiClient = useApiClient();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SystemSettings>('/admin/settings?type=system');
      setSettings(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<SystemSettings>) => {
    try {
      await apiClient.post('/admin/settings', {
        type: 'update_settings',
        category: 'system',
        ...newSettings
      });
      await fetchSettings(); // Refresh settings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update system settings');
      throw err;
    }
  }, [apiClient, fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings
  };
}

// Log Settings Hook
export function useAdminLogSettings() {
  const apiClient = useApiClient();
  const [settings, setSettings] = useState<LogSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<LogSettings>('/admin/settings?type=logs');
      setSettings(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<LogSettings>) => {
    try {
      await apiClient.post('/admin/settings', {
        type: 'update_settings',
        category: 'logging',
        ...newSettings
      });
      await fetchSettings(); // Refresh settings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update log settings');
      throw err;
    }
  }, [apiClient, fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings
  };
}

// Combined Admin Settings Dashboard Hook
export function useAdminSettingsDashboard() {
  const staff = useAdminStaffMembers();
  const security = useAdminSecuritySettings();
  const notifications = useAdminNotificationSettings();
  const system = useAdminSystemSettings();
  const logs = useAdminLogSettings();

  const refreshAll = useCallback(() => {
    staff.fetchStaffMembers();
    security.fetchSettings();
    notifications.fetchSettings();
    system.fetchSettings();
    logs.fetchSettings();
  }, [staff, security, notifications, system, logs]);

  const saveAll = useCallback(async () => {
    try {
      await Promise.all([
        security.updateSettings(security.settings || {}),
        notifications.updateSettings(notifications.settings || {}),
        system.updateSettings(system.settings || {}),
        logs.updateSettings(logs.settings || {}),
      ]);
    } catch (err) {
      throw err;
    }
  }, [security, notifications, system, logs]);

  return {
    staffMembers: staff.staffMembers,
    securitySettings: security.settings,
    notificationSettings: notifications.settings,
    systemSettings: system.settings,
    logSettings: logs.settings,
    loading: staff.loading || security.loading || notifications.loading || system.loading || logs.loading,
    error: staff.error || security.error || notifications.error || system.error || logs.error,
    refreshAll,
    saveAll,
    addStaffMember: staff.addStaffMember,
    updateStaffMember: staff.updateStaffMember,
    removeStaffMember: staff.removeStaffMember,
    updateSecuritySettings: security.updateSettings,
    updateNotificationSettings: notifications.updateSettings,
    updateSystemSettings: system.updateSettings,
    updateLogSettings: logs.updateSettings,
  };
}
