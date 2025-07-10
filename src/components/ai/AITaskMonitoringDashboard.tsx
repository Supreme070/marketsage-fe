'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play,
  Pause,
  Zap,
  Brain,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Settings,
  Bell,
  BarChart3,
  PieChart,
  LineChart,
  Monitor,
  Server,
  Database,
  Wifi,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Timer,
  Target,
  Users,
  Mail,
  MessageSquare,
  Phone,
  Eye,
  Filter,
  Search,
  Calendar,
  FileText,
  Lightbulb,
  Shield,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TaskMonitoringMetrics {
  taskId: string;
  taskName: string;
  taskType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    networkIO: number;
    diskIO: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    successRate: number;
  };
  errors: {
    count: number;
    lastError?: string;
    errorTypes: Record<string, number>;
  };
  metadata: Record<string, any>;
  organizationId: string;
  userId: string;
}

interface SystemHealthMetrics {
  timestamp: Date;
  systemStatus: 'healthy' | 'degraded' | 'critical';
  overallHealth: number;
  components: {
    aiEngine: { status: string; health: number; lastCheck: Date };
    database: { status: string; health: number; lastCheck: Date };
    cache: { status: string; health: number; lastCheck: Date };
    queue: { status: string; health: number; lastCheck: Date };
    streaming: { status: string; health: number; lastCheck: Date };
  };
  resources: {
    cpu: { usage: number; limit: number; status: string };
    memory: { usage: number; limit: number; status: string };
    storage: { usage: number; limit: number; status: string };
    network: { usage: number; limit: number; status: string };
  };
  performance: {
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    activeConnections: number;
  };
}

interface DashboardData {
  overview: {
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    systemHealth: number;
  };
  activeTasks: TaskMonitoringMetrics[];
  recentMetrics: TaskMonitoringMetrics[];
  systemHealth: SystemHealthMetrics;
  alerts: any[];
  performance: {
    throughput: number;
    errorRate: number;
    successRate: number;
  };
}

const AITaskMonitoringDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isRealTime, setIsRealTime] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai/task-monitoring?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch monitoring data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval, isRealTime]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'automation': return <Zap className="h-4 w-4" />;
      case 'campaign': return <Mail className="h-4 w-4" />;
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      case 'integration': return <Network className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    if (health >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/ai/task-monitoring?format=export&exportFormat=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monitoring-data.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export monitoring data",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading monitoring dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-gray-600">Failed to load monitoring data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            AI Task Monitoring Dashboard
          </h1>
          <p className="text-gray-600">Real-time monitoring of AI task execution and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5 minutes</SelectItem>
              <SelectItem value="15m">15 minutes</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
          >
            {isRealTime ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.totalTasks}</div>
            <p className="text-xs text-gray-600">Active tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.runningTasks}</div>
            <p className="text-xs text-gray-600">Currently executing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.completedTasks}</div>
            <p className="text-xs text-gray-600">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.failedTasks}</div>
            <p className="text-xs text-gray-600">With errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Timer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(dashboardData.overview.averageResponseTime)}</div>
            <p className="text-xs text-gray-600">Response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(dashboardData.overview.systemHealth)}`}>
              {dashboardData.overview.systemHealth.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">Overall health</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Throughput</span>
                    <span className="font-medium">{dashboardData.performance.throughput.toFixed(1)} tasks/min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium text-green-600">{dashboardData.performance.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-medium text-red-600">{dashboardData.performance.errorRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Status</span>
                    <Badge className={`${dashboardData.systemHealth.systemStatus === 'healthy' ? 'bg-green-100 text-green-800' : 
                      dashboardData.systemHealth.systemStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                      {dashboardData.systemHealth.systemStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Connections</span>
                    <span className="font-medium">{dashboardData.systemHealth.performance.activeConnections}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Requests/sec</span>
                    <span className="font-medium">{dashboardData.systemHealth.performance.requestsPerSecond.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {dashboardData.recentMetrics.slice(-10).map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getTaskTypeIcon(metric.taskType)}
                        <span className="text-sm font-medium">{metric.taskName}</span>
                        <Badge variant="outline" className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDuration(metric.duration || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>Currently running and queued AI tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {dashboardData.activeTasks.map((task) => (
                    <Card key={task.taskId} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTaskTypeIcon(task.taskType)}
                            <h3 className="font-semibold">{task.taskName}</h3>
                            <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white`}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Started: {task.startTime.toLocaleString()}</span>
                              <span>Duration: {formatDuration(task.duration || Date.now() - task.startTime.getTime())}</span>
                            </div>
                            
                            {task.status === 'running' && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Progress</span>
                                  <span>{task.progress}%</span>
                                </div>
                                <Progress value={task.progress} className="h-2" />
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">CPU:</span>
                                <span className="ml-1">{task.resourceUsage.cpu.toFixed(1)}%</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Memory:</span>
                                <span className="ml-1">{task.resourceUsage.memory.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {/* Resource Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Usage</span>
                    <span>{dashboardData.systemHealth.resources.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboardData.systemHealth.resources.cpu.usage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Limit: {dashboardData.systemHealth.resources.cpu.limit}%</span>
                    <span className={`${dashboardData.systemHealth.resources.cpu.usage > dashboardData.systemHealth.resources.cpu.limit * 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                      {dashboardData.systemHealth.resources.cpu.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Usage</span>
                    <span>{dashboardData.systemHealth.resources.memory.usage.toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboardData.systemHealth.resources.memory.usage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Limit: {dashboardData.systemHealth.resources.memory.limit}%</span>
                    <span className={`${dashboardData.systemHealth.resources.memory.usage > dashboardData.systemHealth.resources.memory.limit * 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                      {dashboardData.systemHealth.resources.memory.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Component Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Component Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(dashboardData.systemHealth.components).map(([name, component]) => (
                  <div key={name} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Badge variant={component.status === 'healthy' ? 'default' : 'destructive'}>
                        {component.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Health</span>
                        <span className={getHealthColor(component.health)}>{component.health}%</span>
                      </div>
                      <Progress value={component.health} className="h-1" />
                      <div className="text-xs text-gray-500">
                        Last check: {component.lastCheck.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.alerts.map((alert) => (
                  <Alert key={alert.id} className={`${alert.type === 'warning' ? 'border-yellow-200' : alert.type === 'error' ? 'border-red-200' : 'border-blue-200'}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {alert.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={alert.resolved ? 'default' : 'destructive'}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {dashboardData.alerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AITaskMonitoringDashboard;