"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Target,
  Settings,
  Eye,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { raceConditionDetector } from '@/lib/leadpulse/race-condition-detector';
import { stateSynchronizationManager } from '@/lib/leadpulse/state-synchronization-manager';
import type { RaceCondition, OperationTrace } from '@/lib/leadpulse/race-condition-detector';

interface RaceConditionMonitorProps {
  className?: string;
}

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const OPERATION_COLORS = {
  api_fetch: '#8884d8',
  websocket_update: '#82ca9d',
  cache_read: '#ffc658',
  cache_write: '#ff7c7c'
};

export function RaceConditionMonitor({ className }: RaceConditionMonitorProps) {
  const [raceConditions, setRaceConditions] = useState<RaceCondition[]>([]);
  const [operationStats, setOperationStats] = useState({
    active: 0,
    completed: 0,
    failed: 0,
    avgDuration: 0,
    raceConditions: 0
  });
  const [syncStats, setSyncStats] = useState({
    totalKeys: 0,
    staleKeys: 0,
    pendingUpdates: 0,
    conflicts: 0,
    subscribers: 0
  });
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedRaceCondition, setSelectedRaceCondition] = useState<RaceCondition | null>(null);

  // Update data every 2 seconds
  useEffect(() => {
    const updateData = () => {
      const newRaceConditions = raceConditionDetector.getDetectedRaceConditions();
      const newOperationStats = raceConditionDetector.getOperationStats();
      const newSyncStats = stateSynchronizationManager.getStats();
      
      setRaceConditions(newRaceConditions);
      setOperationStats(newOperationStats);
      setSyncStats(newSyncStats);
      
      // Update performance history
      setPerformanceHistory(prev => {
        const newEntry = {
          timestamp: new Date().toISOString(),
          activeOperations: newOperationStats.active,
          avgDuration: newOperationStats.avgDuration,
          raceConditions: newOperationStats.raceConditions,
          conflicts: newSyncStats.conflicts,
          staleKeys: newSyncStats.staleKeys
        };
        
        const updated = [...prev, newEntry];
        return updated.slice(-30); // Keep last 30 entries
      });
    };

    updateData();
    const interval = setInterval(updateData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen for race condition events
  useEffect(() => {
    const handleRaceConditionDetected = (raceCondition: RaceCondition) => {
      setRaceConditions(prev => [...prev, raceCondition]);
    };

    const handleOperationCompleted = (operation: OperationTrace) => {
      // Update stats will be handled by the interval
    };

    raceConditionDetector.on('race_condition_detected', handleRaceConditionDetected);
    raceConditionDetector.on('operation_completed', handleOperationCompleted);

    return () => {
      raceConditionDetector.off('race_condition_detected', handleRaceConditionDetected);
      raceConditionDetector.off('operation_completed', handleOperationCompleted);
    };
  }, []);

  const handleToggleDetection = () => {
    raceConditionDetector.setEnabled(!isEnabled);
    setIsEnabled(!isEnabled);
  };

  const handleResolveRaceCondition = (raceConditionId: string) => {
    raceConditionDetector.resolveRaceCondition(raceConditionId, 'manual');
    setSelectedRaceCondition(null);
  };

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const unresolvedRaceConditions = raceConditions.filter(rc => rc.resolution === 'manual');
  const resolvedRaceConditions = raceConditions.filter(rc => rc.resolution !== 'manual');

  const operationTypeData = Object.entries(OPERATION_COLORS).map(([type, color]) => ({
    name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: Math.floor(Math.random() * 50) + 10, // Mock data
    color
  }));

  const severityData = Object.entries(SEVERITY_COLORS).map(([severity, _]) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: raceConditions.filter(rc => rc.severity === severity).length
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Race Condition Monitor</h2>
          <p className="text-muted-foreground">Monitor and prevent data race conditions in LeadPulse</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Active' : 'Disabled'}
          </Badge>
          <Button
            onClick={handleToggleDetection}
            variant="outline"
            size="sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Operations</p>
                <p className="text-2xl font-bold">{operationStats.active}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Race Conditions</p>
                <p className="text-2xl font-bold text-red-600">{unresolvedRaceConditions.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{operationStats.avgDuration.toFixed(0)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold">{syncStats.conflicts}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stale Keys</p>
                <p className="text-2xl font-bold">{syncStats.staleKeys}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {unresolvedRaceConditions.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">
              {unresolvedRaceConditions.length} unresolved race condition{unresolvedRaceConditions.length > 1 ? 's' : ''} detected
            </div>
            <p className="text-sm mt-1">
              Review and resolve these conflicts to ensure data consistency.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conditions">Race Conditions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="synchronization">Synchronization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="conditions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Race Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Race Conditions
                </CardTitle>
                <CardDescription>
                  Unresolved conflicts requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unresolvedRaceConditions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>No active race conditions detected</p>
                    </div>
                  ) : (
                    unresolvedRaceConditions.map((rc) => (
                      <div
                        key={rc.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedRaceCondition(rc)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(rc.severity)}
                            <span className="font-medium">{rc.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={SEVERITY_COLORS[rc.severity]}>
                              {rc.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(rc.detectedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rc.description}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {rc.operations.length} operations involved
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resolved Race Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Recently Resolved
                </CardTitle>
                <CardDescription>
                  Conflicts that have been resolved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resolvedRaceConditions.slice(-5).map((rc) => (
                    <div key={rc.id} className="p-3 border rounded-lg opacity-75">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{rc.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600">
                            {rc.resolution}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rc.detectedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rc.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Timeline</CardTitle>
              <CardDescription>Operation performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="activeOperations" stroke="#8884d8" name="Active Operations" />
                  <Line type="monotone" dataKey="avgDuration" stroke="#82ca9d" name="Avg Duration (ms)" />
                  <Line type="monotone" dataKey="raceConditions" stroke="#ff7c7c" name="Race Conditions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synchronization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Synchronization Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Keys</span>
                    <span className="text-2xl font-bold">{syncStats.totalKeys}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Stale Keys</span>
                    <span className="text-xl font-bold text-orange-600">{syncStats.staleKeys}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pending Updates</span>
                    <span className="text-xl font-bold text-blue-600">{syncStats.pendingUpdates}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Subscribers</span>
                    <span className="text-xl font-bold text-green-600">{syncStats.subscribers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operation Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={operationTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {operationTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Race Condition Detail Modal */}
      {selectedRaceCondition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(selectedRaceCondition.severity)}
                  Race Condition Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRaceCondition(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Type</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedRaceCondition.type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedRaceCondition.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Severity</h4>
                  <Badge className={SEVERITY_COLORS[selectedRaceCondition.severity]}>
                    {selectedRaceCondition.severity}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Detected At</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRaceCondition.detectedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Operations Involved</h4>
                  <div className="space-y-2 mt-2">
                    {selectedRaceCondition.operations.map((op, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex justify-between">
                          <span>{op.type.replace('_', ' ')}</span>
                          <span className="text-muted-foreground">{op.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {op.key} • {new Date(op.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRaceCondition(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleResolveRaceCondition(selectedRaceCondition.id)}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}