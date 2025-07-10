"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Bell,
  Settings,
  Cloud,
  CloudOff,
  Zap,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { useMobileTaskSync, type OfflineTask } from '@/hooks/useMobileTaskSync';

interface MobileTaskInterfaceProps {
  africanMarketMode?: boolean;
  lowBandwidthMode?: boolean;
}

export function MobileTaskInterface({ 
  africanMarketMode = true, 
  lowBandwidthMode = true 
}: MobileTaskInterfaceProps) {
  const {
    tasks,
    syncStatus,
    isLoading,
    deviceId,
    syncWithServer,
    createTask,
    updateTask,
    deleteTask,
    registerForNotifications,
    clearOfflineData,
    offlineTasksCount,
    conflictTasksCount,
    totalPendingChanges
  } = useMobileTaskSync({
    enableOfflineMode: true,
    autoSync: true,
    syncInterval: africanMarketMode ? 60000 : 30000, // Longer interval for African markets
    lowBandwidthMode,
    africaMarketOptimizations: africanMarketMode
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OfflineTask | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    category: 'general',
    dueDate: ''
  });

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission === 'default') {
        // Will prompt when user enables notifications
      }
    }
  }, []);

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    const task = createTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      category: newTask.category,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined
    });

    if (task) {
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        category: 'general',
        dueDate: ''
      });
      setShowCreateDialog(false);
      toast.success('Task created offline', {
        description: syncStatus.isOnline ? 'Syncing with server...' : 'Will sync when online'
      });
    }
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: OfflineTask['status']) => {
    updateTask(taskId, { status: newStatus });
  };

  const handleEnableNotifications = async () => {
    try {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Generate a mock device token (in real app, this would come from FCM/APNS)
          const deviceToken = `mobile-token-${Date.now()}`;
          const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'android';
          
          const deviceIdResult = await registerForNotifications(deviceToken, platform);
          
          if (deviceIdResult) {
            setNotificationsEnabled(true);
            toast.success('Push notifications enabled', {
              description: 'Optimized for African markets'
            });
          }
        } else {
          toast.error('Notification permission denied');
        }
      } else {
        toast.error('Notifications not supported on this device');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'REVIEW': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'TODO': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Smartphone className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Tasks</h1>
              <p className="text-xs text-muted-foreground">
                {tasks.length} tasks • {offlineTasksCount} offline
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              {syncStatus.isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              {africanMarketMode && (
                <Globe className="h-3 w-3 text-orange-600" />
              )}
            </div>

            {/* Sync Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={syncWithServer}
              disabled={!syncStatus.isOnline || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>

            {/* Settings Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Mobile Settings
                  </SheetTitle>
                  <SheetDescription>
                    Configure offline sync and notifications
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Connection Status */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Connection Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-3">
                        <div className="flex items-center gap-2">
                          {syncStatus.isOnline ? (
                            <Cloud className="h-4 w-4 text-green-600" />
                          ) : (
                            <CloudOff className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {syncStatus.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">
                            {syncStatus.lastSync ? 'Synced' : 'Never'}
                          </span>
                        </div>
                      </Card>
                    </div>
                    
                    {syncStatus.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {syncStatus.lastSync.toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  {/* Pending Changes */}
                  {totalPendingChanges > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">Pending Changes</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Offline tasks</span>
                          <Badge variant="outline">{offlineTasksCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Conflicts</span>
                          <Badge variant="outline">{conflictTasksCount}</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* African Market Optimizations */}
                  {africanMarketMode && (
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        African Market Features
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Low bandwidth mode</span>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Compressed sync</span>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Enabled
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Prayer time awareness</span>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            Enabled
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Push Notifications</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Enable notifications</Label>
                      <Switch
                        id="notifications"
                        checked={notificationsEnabled}
                        onCheckedChange={(checked) => {
                          if (checked && !notificationsEnabled) {
                            handleEnableNotifications();
                          } else if (!checked) {
                            setNotificationsEnabled(false);
                          }
                        }}
                      />
                    </div>
                    {notificationsEnabled && (
                      <p className="text-xs text-muted-foreground">
                        Optimized for African time zones and cultural preferences
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Actions</h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={syncWithServer}
                        disabled={!syncStatus.isOnline || isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Force Sync
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearOfflineData}
                        className="w-full text-red-600 hover:text-red-700"
                      >
                        Clear Offline Data
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Status Bar */}
        {(totalPendingChanges > 0 || !syncStatus.isOnline) && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 text-xs">
              {!syncStatus.isOnline && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline Mode
                </Badge>
              )}
              {totalPendingChanges > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Clock className="h-3 w-3 mr-1" />
                  {totalPendingChanges} pending
                </Badge>
              )}
              {africanMarketMode && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Africa optimized
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="p-4 space-y-3">
        {tasks.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first task to get started
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {tasks.map((task) => (
              <Card 
                key={task.id} 
                className={`transition-all ${
                  task.offline_metadata.created_offline ? 'border-orange-200 bg-orange-50/50' : ''
                } ${
                  task.offline_metadata.conflict_indicators.length > 0 ? 'border-red-200 bg-red-50/50' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Task Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 ml-3">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        {task.offline_metadata.created_offline && (
                          <Badge variant="outline" className="text-xs">
                            <CloudOff className="h-3 w-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Task Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {task.category}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.offline_metadata.last_modified.toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Status Selector */}
                    <div className="flex items-center gap-2">
                      <Select 
                        value={task.status} 
                        onValueChange={(value) => handleUpdateTaskStatus(task.id, value as OfflineTask['status'])}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="REVIEW">Review</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>

                      {task.offline_metadata.conflict_indicators.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Conflict
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Floating Create Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Task will be created offline and synced when connection is available
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title..."
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={newTask.priority} 
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newTask.category} 
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateTask} className="flex-1">
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}