"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Zap,
  RefreshCw,
  Gauge,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface SystemHealthMetrics {
  timestamp: Date;
  queueDepth: number;
  activeExecutions: number;
  completedLastHour: number;
  failedLastHour: number;
  avgResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  redisConnections: number;
  databaseConnections: number;
}

interface WorkflowPerformanceMetrics {
  workflowId: string;
  timestamp: Date;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  successRate: number;
  throughput: number;
  errorRate: number;
  avgStepTime: number;
  nodeBottlenecks: NodeBottleneck[];
}

interface NodeBottleneck {
  nodeId: string;
  nodeType: string;
  avgExecutionTime: number;
  errorCount: number;
  bottleneckScore: number;
}

interface PerformanceAlert {
  id: string;
  workflowId?: string;
  alertType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
}

interface DashboardData {
  systemHealth: SystemHealthMetrics;
  workflowMetrics: WorkflowPerformanceMetrics[];
  activeAlerts: PerformanceAlert[];
  bottlenecks: string[];
}

export default function WorkflowPerformanceDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      const response = await fetch("/api/v2/workflows/performance");
      if (!response.ok) {
        throw new Error("Failed to fetch performance data");
      }
      
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching performance data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "destructive";
      case "HIGH": return "destructive";
      case "MEDIUM": return "default";
      case "LOW": return "secondary";
      default: return "outline";
    }
  };

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: "good", color: "text-green-600" };
    if (value <= thresholds.warning) return { status: "warning", color: "text-yellow-600" };
    return { status: "critical", color: "text-red-600" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading performance metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Performance Data</AlertTitle>
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" className="ml-4" onClick={fetchPerformanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Performance monitoring data is not available.</AlertDescription>
      </Alert>
    );
  }

  const { systemHealth, workflowMetrics, activeAlerts, bottlenecks } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">Real-time workflow system monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? "On" : "Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPerformanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          {activeAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4"
            >
              <Alert variant={alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>{alert.alertType.replace(/_/g, " ")}</span>
                  <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                </AlertTitle>
                <AlertDescription>
                  {alert.message}
                  <br />
                  <small className="text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </small>
                </AlertDescription>
              </Alert>
            </motion.div>
          ))}
        </div>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Depth</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.queueDepth}</div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.queueDepth > 50 ? "High queue load" : "Normal queue load"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.activeExecutions}</div>
            <p className="text-xs text-muted-foreground">
              Currently running workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.completedLastHour + systemHealth.failedLastHour > 0
                ? Math.round((systemHealth.completedLastHour / (systemHealth.completedLastHour + systemHealth.failedLastHour)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last hour performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(systemHealth.avgResponseTime / 1000)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average execution time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gauge className="h-4 w-4 mr-2" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current</span>
                <span className={getHealthStatus(systemHealth.memoryUsage, { good: 0.7, warning: 0.85 }).color}>
                  {Math.round(systemHealth.memoryUsage * 100)}%
                </span>
              </div>
              <Progress value={systemHealth.memoryUsage * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-4 w-4 mr-2" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current</span>
                <span className={getHealthStatus(systemHealth.cpuUsage, { good: 0.7, warning: 0.85 }).color}>
                  {Math.round(systemHealth.cpuUsage * 100)}%
                </span>
              </div>
              <Progress value={systemHealth.cpuUsage * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Database</span>
                <span>{systemHealth.databaseConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Redis</span>
                <span>{systemHealth.redisConnections}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Performance</CardTitle>
          <CardDescription>Performance metrics for active workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {workflowMetrics.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active workflow metrics available</p>
          ) : (
            <div className="space-y-4">
              {workflowMetrics.slice(0, 5).map((workflow) => (
                <div key={workflow.workflowId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Workflow {workflow.workflowId.slice(0, 8)}...</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={workflow.successRate > 0.9 ? "default" : workflow.successRate > 0.7 ? "secondary" : "destructive"}>
                        {Math.round(workflow.successRate * 100)}% Success
                      </Badge>
                      <Badge variant="outline">
                        {workflow.throughput.toFixed(1)}/min
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Execution Time</span>
                      <div className="font-medium">{Math.round(workflow.executionTime / 1000)}s</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Error Rate</span>
                      <div className="font-medium">{Math.round(workflow.errorRate * 100)}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Step Time</span>
                      <div className="font-medium">{Math.round(workflow.avgStepTime / 1000)}s</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bottlenecks</span>
                      <div className="font-medium">{workflow.nodeBottlenecks.length}</div>
                    </div>
                  </div>

                  {workflow.nodeBottlenecks.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-sm font-medium mb-2">Node Bottlenecks</h5>
                      <div className="space-y-1">
                        {workflow.nodeBottlenecks.slice(0, 3).map((bottleneck) => (
                          <div key={bottleneck.nodeId} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {bottleneck.nodeType} ({bottleneck.nodeId.slice(0, 8)}...)
                            </span>
                            <span className="font-medium">
                              {Math.round(bottleneck.avgExecutionTime / 1000)}s
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Bottlenecks */}
      {bottlenecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              System Bottlenecks
            </CardTitle>
            <CardDescription>Detected performance bottlenecks requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bottlenecks.map((bottleneck, index) => (
                <Alert key={index}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{bottleneck}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}