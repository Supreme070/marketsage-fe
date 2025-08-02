"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings, Brain, Activity, AlertTriangle, CheckCircle, Clock,
  Play, Pause, RotateCcw, Zap, Target, BarChart3, Shield,
  Cpu, TrendingUp, Users, MessageSquare, Database, ArrowUpRight
} from "lucide-react";

interface OperationalMetrics {
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgResponseTime: number;
  systemUptime: number;
}

interface AITask {
  id: string;
  name: string;
  type: string;
  status: string;
  progress: number;
  eta: string;
  priority: string;
}

interface SystemComponent {
  component: string;
  status: string;
  uptime: number;
  load: number;
}

interface SystemAlert {
  type: string;
  message: string;
  timestamp: string;
  severity: string;
}

export default function AIOperationsHub() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics>({
    activeAgents: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    avgResponseTime: 0,
    systemUptime: 0
  });
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemComponent[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch AI operations data
  useEffect(() => {
    const fetchOperationsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch operational metrics and system health
        const [metricsRes, tasksRes, healthRes, alertsRes] = await Promise.all([
          fetch('/api/v2/ai/performance-monitoring', { credentials: 'include' }),
          fetch('/api/v2/ai/task-monitoring', { credentials: 'include' }),
          fetch('/api/v2/ai/health-check', { credentials: 'include' }),
          fetch('/api/v2/monitoring/alerts', { credentials: 'include' })
        ]);

        // Process metrics data
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          if (metricsData.success) {
            setOperationalMetrics({
              activeAgents: metricsData.activeAgents || 0,
              totalTasks: metricsData.totalTasks || 0,
              completedTasks: metricsData.completedTasks || 0,
              failedTasks: metricsData.failedTasks || 0,
              avgResponseTime: metricsData.avgResponseTime || 0,
              systemUptime: metricsData.systemUptime || 0
            });
          }
        }

        // Process tasks data
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (tasksData.success && tasksData.tasks) {
            const formattedTasks = tasksData.tasks.map((task: any) => ({
              id: task.id,
              name: task.name || task.description,
              type: task.type,
              status: task.status,
              progress: task.progress || 0,
              eta: task.estimatedCompletion || 'Unknown',
              priority: task.priority || 'medium'
            }));
            setTasks(formattedTasks);
          }
        }

        // Process health data
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          if (healthData.success && healthData.components) {
            const formattedHealth = healthData.components.map((comp: any) => ({
              component: comp.name,
              status: comp.status,
              uptime: comp.uptime || 0,
              load: comp.load || 0
            }));
            setSystemHealth(formattedHealth);
          }
        }

        // Process alerts data
        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          if (alertsData.success && alertsData.alerts) {
            const formattedAlerts = alertsData.alerts.slice(0, 10).map((alert: any) => ({
              type: alert.type,
              message: alert.message,
              timestamp: alert.timestamp || alert.createdAt,
              severity: alert.severity || 'medium'
            }));
            setRecentAlerts(formattedAlerts);
          }
        }

      } catch (err) {
        console.error('Error fetching AI operations data:', err);
        setError('Failed to load AI operations data');
        
        // Set fallback empty data on error
        setOperationalMetrics({
          activeAgents: 0,
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          avgResponseTime: 0,
          systemUptime: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOperationsData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Play className="h-4 w-4 text-green-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "failed": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-500";
      case "warning": return "text-yellow-500";
      case "critical": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Operations</h1>
          <p className="text-muted-foreground">
            Operational AI management including task monitoring, approvals, and performance optimization
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/ai-intelligence/operations/tasks">
              <Target className="mr-2 h-4 w-4" />
              View Tasks
            </Link>
          </Button>
          <Button asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configure AI
            </Link>
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
              ) : (
                operationalMetrics.activeAgents
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Loading...' : 'AI agents currently running'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                operationalMetrics.totalTasks > 0
                  ? `${((operationalMetrics.completedTasks / operationalMetrics.totalTasks) * 100).toFixed(1)}%`
                  : '0%'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Loading...' : 
                `${operationalMetrics.completedTasks} of ${operationalMetrics.totalTasks} tasks`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationalMetrics.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                15% faster this week
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationalMetrics.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days average
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
                <CardDescription>Current AI task workload by type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Segmentation</span>
                  <Badge variant="secondary">35%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">ML Training</span>
                  <Badge variant="secondary">28%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Analytics</span>
                  <Badge variant="secondary">22%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Optimization</span>
                  <Badge variant="secondary">15%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common operational tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Target className="mr-2 h-4 w-4" />
                  Run Customer Segmentation
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Brain className="mr-2 h-4 w-4" />
                  Retrain Prediction Models
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Performance Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Review Pending Approvals
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>Currently running AI operations and their progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">{task.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{task.progress}%</div>
                      <div className="text-xs text-muted-foreground">ETA: {task.eta}</div>
                    </div>
                    <Progress value={task.progress} className="w-20" />
                    <Badge variant={task.priority === 'high' ? 'destructive' : 
                                  task.priority === 'medium' ? 'default' : 'secondary'}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              
              <Button asChild className="w-full" variant="outline">
                <Link href="/ai-intelligence/operations/tasks">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  View All Tasks
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>AI system components status and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      component.status === 'healthy' ? 'bg-green-500' :
                      component.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="font-medium">{component.component}</div>
                      <div className="text-sm text-muted-foreground">
                        Uptime: {component.uptime}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">Load: {component.load}%</div>
                      <Progress value={component.load} className="w-20 mt-1" />
                    </div>
                    <Badge variant={component.status === 'healthy' ? 'secondary' : 'destructive'}>
                      {component.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAlerts.map((alert, index) => (
                <div key={index} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 
                                  alert.severity === 'medium' ? 'default' : 'secondary'}>
                      {alert.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}