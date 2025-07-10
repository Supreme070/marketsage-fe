'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Server,
  Database,
  Cpu,
  Memory,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface QueueHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  metrics: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
    throughput: number;
    avgProcessingTime: number;
    errorRate: number;
  };
  lastUpdate: Date;
}

interface WorkflowSystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'down';
  queues: QueueHealth[];
  database: {
    status: 'healthy' | 'warning' | 'critical' | 'down';
    executionsRunning: number;
    executionsPending: number;
    executionsFailed: number;
    avgExecutionTime: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    redisConnections: number;
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    source: string;
  }>;
  performance: {
    totalWorkflowsToday: number;
    successRate: number;
    avgCompletionTime: number;
    bottlenecks: string[];
  };
  lastCheck: Date;
}

interface WorkflowStats {
  workflowId: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  executions: {
    total: number;
    successful: number;
    failed: number;
    running: number;
    pending: number;
  };
  performance: {
    avgExecutionTime: number;
    successRate: number;
    throughput: number;
  };
  errors: Array<{
    count: number;
    message: string;
    lastOccurrence: Date;
  }>;
  lastExecution: Date;
}

export default function WorkflowMonitoringDashboard() {
  const [systemHealth, setSystemHealth] = useState<WorkflowSystemHealth | null>(null);
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/workflows/monitoring/health?detailed=true');
      if (!response.ok) throw new Error('Failed to fetch system health');
      
      const result = await response.json();
      setSystemHealth(result.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
      toast.error('Failed to fetch system health');
    }
  };

  // Fetch workflow statistics
  const fetchWorkflowStats = async () => {
    try {
      const response = await fetch(`/api/workflows/monitoring/stats?timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch workflow stats');
      
      const result = await response.json();
      setWorkflowStats(result.data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      toast.error('Failed to fetch workflow statistics');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSystemHealth(), fetchWorkflowStats()]);
      setLoading(false);
    };

    fetchData();
  }, [selectedTimeRange]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      setRefreshing(true);
      await Promise.all([fetchSystemHealth(), fetchWorkflowStats()]);
      setRefreshing(false);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedTimeRange]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSystemHealth(), fetchWorkflowStats()]);
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  // Queue actions
  const handleQueueAction = async (action: string, queueName: string) => {
    try {
      const response = await fetch('/api/workflows/monitoring/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, queueName }),
      });

      if (!response.ok) throw new Error('Queue action failed');

      const result = await response.json();
      toast.success(result.message);
      
      // Refresh data after action
      await fetchSystemHealth();
    } catch (error) {
      console.error('Queue action error:', error);
      toast.error('Queue action failed');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      case 'down': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'down': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading workflow monitoring data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of workflow execution and queue health
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Status
              </CardTitle>
              <Badge className={getStatusColor(systemHealth.overall)}>
                {getStatusIcon(systemHealth.overall)}
                <span className="ml-1 capitalize">{systemHealth.overall}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Workflows Today</div>
                <div className="text-2xl font-bold">{systemHealth.performance.totalWorkflowsToday}</div>
                <div className="text-xs text-muted-foreground">
                  {systemHealth.performance.successRate.toFixed(1)}% success rate
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Queue Health</div>
                <div className="text-2xl font-bold">
                  {systemHealth.queues.filter(q => q.status === 'healthy').length}/{systemHealth.queues.length}
                </div>
                <div className="text-xs text-muted-foreground">Queues healthy</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Running Executions</div>
                <div className="text-2xl font-bold">{systemHealth.database.executionsRunning}</div>
                <div className="text-xs text-muted-foreground">
                  {systemHealth.database.executionsPending} pending
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Avg Completion Time</div>
                <div className="text-2xl font-bold">
                  {Math.round(systemHealth.performance.avgCompletionTime / 1000)}s
                </div>
                <div className="text-xs text-muted-foreground">Processing time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {systemHealth && systemHealth.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Active Alerts ({systemHealth.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemHealth.alerts.slice(0, 5).map((alert, index) => (
                <Alert key={index} className={`${
                  alert.level === 'critical' ? 'border-red-200 bg-red-50' :
                  alert.level === 'error' ? 'border-orange-200 bg-orange-50' :
                  alert.level === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  <AlertDescription className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    <div className="text-xs text-muted-foreground">
                      {alert.source} • {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queues">Queue Details</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Metrics */}
          {systemHealth && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge className={getStatusColor(systemHealth.database.status)}>
                        {systemHealth.database.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Running</span>
                      <span className="font-medium">{systemHealth.database.executionsRunning}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Failed (24h)</span>
                      <span className="font-medium">{systemHealth.database.executionsFailed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Memory className="h-4 w-4" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="font-medium">
                        {(systemHealth.resources.memoryUsage * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Redis Connections</span>
                      <span className="font-medium">{systemHealth.resources.redisConnections}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Bottlenecks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {systemHealth.performance.bottlenecks.length > 0 ? (
                      systemHealth.performance.bottlenecks.map((bottleneck, index) => (
                        <div key={index} className="text-sm text-orange-600">
                          • {bottleneck}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-green-600">No bottlenecks detected</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="queues" className="space-y-4">
          {/* Queue Health Details */}
          {systemHealth && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemHealth.queues.map((queue) => (
                <Card key={queue.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="capitalize">{queue.name} Queue</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(queue.status)}>
                          {getStatusIcon(queue.status)}
                          <span className="ml-1 capitalize">{queue.status}</span>
                        </Badge>
                        {queue.metrics.paused && (
                          <Badge variant="secondary">Paused</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Waiting</div>
                          <div className="text-xl font-bold">{queue.metrics.waiting}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Active</div>
                          <div className="text-xl font-bold">{queue.metrics.active}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                          <div className="text-xl font-bold">{queue.metrics.completed}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Failed</div>
                          <div className="text-xl font-bold text-red-600">{queue.metrics.failed}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <div className="text-sm text-muted-foreground">Throughput/hour</div>
                          <div className="font-medium">{queue.metrics.throughput}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Error Rate</div>
                          <div className="font-medium">{queue.metrics.errorRate.toFixed(1)}%</div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQueueAction(
                            queue.metrics.paused ? 'resume_queue' : 'pause_queue',
                            queue.name
                          )}
                        >
                          {queue.metrics.paused ? (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQueueAction('clean_failed_jobs', queue.name)}
                          disabled={queue.metrics.failed === 0}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clean Failed
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          {/* Workflow Statistics */}
          <div className="grid gap-4">
            {workflowStats.slice(0, 10).map((workflow) => (
              <Card key={workflow.workflowId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{workflow.name}</CardTitle>
                      <CardDescription>ID: {workflow.workflowId}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(workflow.status)}>
                      {getStatusIcon(workflow.status)}
                      <span className="ml-1 capitalize">{workflow.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-lg font-bold">{workflow.executions.total}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                      <div className="text-lg font-bold text-green-600">{workflow.executions.successful}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                      <div className="text-lg font-bold text-red-600">{workflow.executions.failed}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <div className="text-lg font-bold">{workflow.performance.successRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Time</div>
                      <div className="text-lg font-bold">
                        {Math.round(workflow.performance.avgExecutionTime / 1000)}s
                      </div>
                    </div>
                  </div>
                  
                  {workflow.errors.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Recent Errors:</div>
                      <div className="space-y-1">
                        {workflow.errors.slice(0, 3).map((error, index) => (
                          <div key={index} className="text-sm">
                            <span className="text-red-600 font-medium">{error.count}x</span>{' '}
                            <span className="text-gray-600">{error.message.substring(0, 80)}...</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key metrics and recommendations for optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance charts and detailed analytics will be displayed here.
                <br />
                <span className="text-sm">Coming soon: Real-time charts, trend analysis, and recommendations.</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}