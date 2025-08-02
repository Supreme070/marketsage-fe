"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface OfflineTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  dueDate?: Date;
  assigneeId?: string;
  category: string;
  estimatedDuration?: number;
  tags: string[];
  offline_metadata: {
    created_offline: boolean;
    last_modified: Date;
    sync_hash: string;
    conflict_indicators: string[];
  };
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync?: Date;
  pendingChanges: number;
  conflictsDetected: number;
  bandwidthOptimized: boolean;
  africaMarketOptimizations: {
    lowBandwidthMode: boolean;
    compressedPayload: boolean;
    criticalOnly: boolean;
  };
}

export interface MobileTaskSyncOptions {
  enableOfflineMode?: boolean;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
  lowBandwidthMode?: boolean;
  africaMarketOptimizations?: boolean;
}

export function useMobileTaskSync(options: MobileTaskSyncOptions = {}) {
  const {
    enableOfflineMode = true,
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    lowBandwidthMode = true,
    africaMarketOptimizations = true
  } = options;

  const [tasks, setTasks] = useState<OfflineTask[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingChanges: 0,
    conflictsDetected: 0,
    bandwidthOptimized: lowBandwidthMode,
    africaMarketOptimizations: {
      lowBandwidthMode,
      compressedPayload: africaMarketOptimizations,
      criticalOnly: africaMarketOptimizations
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deviceId] = useState(() => 
    `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (autoSync) {
        syncWithServer();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      toast.info('You\'re offline. Changes will sync when connection is restored.', {
        description: 'Offline mode enabled for African markets'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync || !syncStatus.isOnline) return;

    const interval = setInterval(() => {
      if (syncStatus.pendingChanges > 0) {
        syncWithServer();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncStatus.isOnline, syncStatus.pendingChanges, syncInterval]);

  // Load tasks from localStorage on mount
  useEffect(() => {
    loadOfflineTasks();
  }, []);

  const loadOfflineTasks = useCallback(() => {
    try {
      const savedTasks = localStorage.getItem(`tasks_${deviceId}`);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
        
        const pendingCount = parsedTasks.filter((task: OfflineTask) => 
          task.offline_metadata.created_offline || 
          task.offline_metadata.conflict_indicators.length > 0
        ).length;
        
        setSyncStatus(prev => ({
          ...prev,
          pendingChanges: pendingCount
        }));
      }
    } catch (error) {
      console.error('Failed to load offline tasks:', error);
    }
  }, [deviceId]);

  const saveOfflineTasks = useCallback((updatedTasks: OfflineTask[]) => {
    try {
      localStorage.setItem(`tasks_${deviceId}`, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      
      const pendingCount = updatedTasks.filter(task => 
        task.offline_metadata.created_offline || 
        task.offline_metadata.conflict_indicators.length > 0
      ).length;
      
      setSyncStatus(prev => ({
        ...prev,
        pendingChanges: pendingCount
      }));
    } catch (error) {
      console.error('Failed to save offline tasks:', error);
      toast.error('Failed to save tasks offline');
    }
  }, [deviceId]);

  const syncWithServer = useCallback(async () => {
    if (!syncStatus.isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare sync data
      const offlineTasks = tasks.filter(task => 
        task.offline_metadata.created_offline || 
        task.offline_metadata.conflict_indicators.length > 0
      );

      const syncData = {
        device_id: deviceId,
        client_sync_data: {
          id: `sync-${Date.now()}`,
          userId: 'current-user', // Would get from auth
          device_id: deviceId,
          sync_version: 1,
          tasks: {
            created: offlineTasks.filter(t => t.offline_metadata.created_offline),
            updated: offlineTasks.filter(t => !t.offline_metadata.created_offline),
            deleted: []
          },
          last_sync: syncStatus.lastSync || new Date(0),
          conflict_resolution: 'server_wins',
          sync_status: 'pending',
          bandwidth_optimization: {
            compressed_payload: syncStatus.africaMarketOptimizations.compressedPayload,
            delta_sync: true,
            critical_only: syncStatus.africaMarketOptimizations.criticalOnly
          }
        }
      };

      const response = await fetch('/api/v2/mobile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_tasks',
          ...syncData
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update tasks with server data
        const serverTasks = result.sync_data.tasks.updated || [];
        const mergedTasks = mergeTasksWithServer(tasks, serverTasks);
        saveOfflineTasks(mergedTasks);
        
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          pendingChanges: 0,
          conflictsDetected: result.conflicts_resolved || 0
        }));

        if (result.bandwidth_saved > 0) {
          toast.success(`Sync completed! Saved ${Math.round(result.bandwidth_saved / 1024)}KB bandwidth`, {
            description: 'African market optimization applied'
          });
        } else {
          toast.success('Tasks synced successfully');
        }
      } else {
        throw new Error(result.error || 'Sync failed');
      }

    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed. Changes saved offline.');
    } finally {
      setIsLoading(false);
    }
  }, [syncStatus.isOnline, tasks, deviceId, syncStatus.lastSync, syncStatus.africaMarketOptimizations]);

  const createTask = useCallback((taskData: Partial<OfflineTask>) => {
    const newTask: OfflineTask = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      priority: taskData.priority || 'MEDIUM',
      status: taskData.status || 'TODO',
      dueDate: taskData.dueDate,
      assigneeId: taskData.assigneeId,
      category: taskData.category || 'general',
      estimatedDuration: taskData.estimatedDuration,
      tags: taskData.tags || [],
      offline_metadata: {
        created_offline: true,
        last_modified: new Date(),
        sync_hash: '',
        conflict_indicators: []
      }
    };

    const updatedTasks = [...tasks, newTask];
    saveOfflineTasks(updatedTasks);

    toast.success('Task created offline', {
      description: syncStatus.isOnline ? 'Will sync automatically' : 'Will sync when connection is restored'
    });

    return newTask;
  }, [tasks, saveOfflineTasks, syncStatus.isOnline]);

  const updateTask = useCallback((taskId: string, updates: Partial<OfflineTask>) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          ...updates,
          offline_metadata: {
            ...task.offline_metadata,
            last_modified: new Date(),
            conflict_indicators: syncStatus.isOnline ? [] : ['updated_offline']
          }
        };
      }
      return task;
    });

    saveOfflineTasks(updatedTasks);

    toast.success('Task updated', {
      description: syncStatus.isOnline ? 'Syncing...' : 'Saved offline'
    });

    if (syncStatus.isOnline && autoSync) {
      setTimeout(syncWithServer, 1000); // Debounced sync
    }
  }, [tasks, saveOfflineTasks, syncStatus.isOnline, autoSync, syncWithServer]);

  const deleteTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveOfflineTasks(updatedTasks);

    toast.success('Task deleted', {
      description: syncStatus.isOnline ? 'Syncing...' : 'Will sync when connection is restored'
    });

    if (syncStatus.isOnline && autoSync) {
      setTimeout(syncWithServer, 1000);
    }
  }, [tasks, saveOfflineTasks, syncStatus.isOnline, autoSync, syncWithServer]);

  const registerForNotifications = useCallback(async (deviceToken: string, platform: 'ios' | 'android' | 'web') => {
    try {
      const response = await fetch('/api/v2/mobile/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_device',
          device_token: deviceToken,
          platform,
          preferences: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            quiet_hours: { start: 22, end: 7 },
            african_market_settings: {
              respect_prayer_times: true,
              low_bandwidth_mode: lowBandwidthMode,
              local_language_notifications: true
            }
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Push notifications enabled', {
          description: result.optimization_profile
        });
        return result.device_id;
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Failed to register for notifications:', error);
      toast.error('Failed to enable push notifications');
    }
  }, [lowBandwidthMode]);

  const mergeTasksWithServer = useCallback((localTasks: OfflineTask[], serverTasks: any[]) => {
    const merged = [...localTasks];
    
    serverTasks.forEach(serverTask => {
      const localIndex = merged.findIndex(t => t.id === serverTask.id);
      
      if (localIndex >= 0) {
        // Update existing task if server version is newer
        const localTask = merged[localIndex];
        if (new Date(serverTask.offline_metadata.last_modified) > localTask.offline_metadata.last_modified) {
          merged[localIndex] = {
            ...serverTask,
            offline_metadata: {
              ...serverTask.offline_metadata,
              created_offline: false,
              conflict_indicators: []
            }
          };
        }
      } else {
        // Add new task from server
        merged.push({
          ...serverTask,
          offline_metadata: {
            ...serverTask.offline_metadata,
            created_offline: false,
            conflict_indicators: []
          }
        });
      }
    });

    return merged;
  }, []);

  const clearOfflineData = useCallback(() => {
    localStorage.removeItem(`tasks_${deviceId}`);
    setTasks([]);
    setSyncStatus(prev => ({
      ...prev,
      pendingChanges: 0,
      conflictsDetected: 0,
      lastSync: undefined
    }));
    toast.info('Offline data cleared');
  }, [deviceId]);

  return {
    // Data
    tasks,
    syncStatus,
    isLoading,
    deviceId,
    
    // Actions
    syncWithServer,
    createTask,
    updateTask,
    deleteTask,
    registerForNotifications,
    clearOfflineData,
    
    // Utils
    offlineTasksCount: tasks.filter(t => t.offline_metadata.created_offline).length,
    conflictTasksCount: tasks.filter(t => t.offline_metadata.conflict_indicators.length > 0).length,
    totalPendingChanges: syncStatus.pendingChanges
  };
}