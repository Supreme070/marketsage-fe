/**
 * Performance Monitor Component
 * 
 * Real-time performance monitoring dashboard for LeadPulse components
 * with metrics visualization, benchmarks, and optimization recommendations.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Database,
  Cpu,
  Memory,
  Network,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  RefreshCw,
  Download,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Gauge,
  Timer,
  Layers,
  Globe,
  Users,
  HardDrive,
  Wifi,
  Battery,
  Thermometer,
  Speedometer,
  MonitorSpeaker,
  Server,
  Shield,
  Optimization,
  Maximize,
  Minimize,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  threshold: {
    warning: number;
    error: number;
  };
  trend: 'up' | 'down' | 'stable';
  history: Array<{
    timestamp: number;
    value: number;
  }>;
}

interface ComponentMetrics {
  name: string;
  renderTime: number;
  memoryUsage: number;
  updateCount: number;
  errorCount: number;
  lastError?: string;
  props: Record<string, any>;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  network: {
    requests: number;
    latency: number;
    errors: number;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
  };
  workers: {
    active: number;
    queue: number;
    errors: number;
  };
}

interface PerformanceBenchmark {
  name: string;
  category: 'rendering' | 'data' | 'network' | 'memory';
  baseline: number;
  current: number;
  target: number;
  improvement: number;
  recommendations: string[];
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  component: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  details?: Record<string, any>;
}

interface PerformanceMonitorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showAlerts?: boolean;
  enableProfiling?: boolean;
  onMetricThresholdExceeded?: (metric: PerformanceMetric) => void;
  onPerformanceAlert?: (alert: PerformanceAlert) => void;
}

/**
 * Performance Monitor Component
 */
export function PerformanceMonitor({
  autoRefresh = true,
  refreshInterval = 5000,
  showAlerts = true,
  enableProfiling = false,
  onMetricThresholdExceeded,
  onPerformanceAlert
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [componentMetrics, setComponentMetrics] = useState<ComponentMetrics[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    network: { requests: 0, latency: 0, errors: 0 },
    cache: { hits: 0, misses: 0, size: 0 },
    workers: { active: 0, queue: 0, errors: 0 }
  });
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(autoRefresh);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Initialize performance monitoring
  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isMonitoring, refreshInterval]);

  // Initialize performance observer
  useEffect(() => {
    if (enableProfiling && 'PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            updateComponentMetrics(entry.name, entry.duration);
          }
        });
      });

      observerRef.current.observe({ 
        entryTypes: ['measure', 'navigation', 'resource'] 
      });

      return () => {
        observerRef.current?.disconnect();
      };
    }
  }, [enableProfiling]);

  // Start monitoring
  const startMonitoring = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      collectMetrics();
    }, refreshInterval);

    // Initial collection
    collectMetrics();
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Collect performance metrics
  const collectMetrics = () => {
    const now = Date.now();
    
    // Memory metrics
    const memoryMetric = collectMemoryMetrics();
    
    // Rendering metrics
    const renderingMetric = collectRenderingMetrics();
    
    // Network metrics
    const networkMetric = collectNetworkMetrics();
    
    // Cache metrics
    const cacheMetric = collectCacheMetrics();
    
    // Worker metrics
    const workerMetric = collectWorkerMetrics();

    const newMetrics = [
      memoryMetric,
      renderingMetric,
      networkMetric,
      cacheMetric,
      workerMetric
    ].filter(Boolean) as PerformanceMetric[];

    setMetrics(prev => {
      return newMetrics.map(metric => {
        const existing = prev.find(m => m.name === metric.name);
        if (existing) {
          return {
            ...metric,
            history: [
              ...existing.history.slice(-99), // Keep last 100 points
              { timestamp: now, value: metric.value }
            ]
          };
        }
        return {
          ...metric,
          history: [{ timestamp: now, value: metric.value }]
        };
      });
    });

    // Check thresholds and generate alerts
    newMetrics.forEach(metric => {
      if (metric.value > metric.threshold.error) {
        generateAlert('error', 'Performance', `${metric.name} exceeded error threshold: ${metric.value}${metric.unit}`);
        onMetricThresholdExceeded?.(metric);
      } else if (metric.value > metric.threshold.warning) {
        generateAlert('warning', 'Performance', `${metric.name} exceeded warning threshold: ${metric.value}${metric.unit}`);
      }
    });

    // Update benchmarks
    updateBenchmarks(newMetrics);
  };

  // Collect memory metrics
  const collectMemoryMetrics = (): PerformanceMetric | null => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize / 1024 / 1024; // MB
      
      return {
        name: 'Memory Usage',
        value: usedMemory,
        unit: 'MB',
        status: usedMemory > 100 ? 'error' : usedMemory > 50 ? 'warning' : 'good',
        threshold: { warning: 50, error: 100 },
        trend: 'stable',
        history: []
      };
    }
    return null;
  };

  // Collect rendering metrics
  const collectRenderingMetrics = (): PerformanceMetric => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const renderTime = navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.navigationStart : 0;
    
    return {
      name: 'Page Load Time',
      value: renderTime,
      unit: 'ms',
      status: renderTime > 3000 ? 'error' : renderTime > 1000 ? 'warning' : 'good',
      threshold: { warning: 1000, error: 3000 },
      trend: 'stable',
      history: []
    };
  };

  // Collect network metrics
  const collectNetworkMetrics = (): PerformanceMetric => {
    const resourceEntries = performance.getEntriesByType('resource');
    const totalLatency = resourceEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const averageLatency = resourceEntries.length > 0 ? totalLatency / resourceEntries.length : 0;
    
    return {
      name: 'Network Latency',
      value: averageLatency,
      unit: 'ms',
      status: averageLatency > 500 ? 'error' : averageLatency > 200 ? 'warning' : 'good',
      threshold: { warning: 200, error: 500 },
      trend: 'stable',
      history: []
    };
  };

  // Collect cache metrics
  const collectCacheMetrics = (): PerformanceMetric => {
    // Simulate cache metrics (in real implementation, get from cache service)
    const cacheHitRate = Math.random() * 100;
    
    return {
      name: 'Cache Hit Rate',
      value: cacheHitRate,
      unit: '%',
      status: cacheHitRate < 70 ? 'error' : cacheHitRate < 85 ? 'warning' : 'good',
      threshold: { warning: 85, error: 70 },
      trend: 'stable',
      history: []
    };
  };

  // Collect worker metrics
  const collectWorkerMetrics = (): PerformanceMetric => {
    // Simulate worker metrics (in real implementation, get from worker service)
    const workerLatency = Math.random() * 1000;
    
    return {
      name: 'Worker Processing Time',
      value: workerLatency,
      unit: 'ms',
      status: workerLatency > 2000 ? 'error' : workerLatency > 1000 ? 'warning' : 'good',
      threshold: { warning: 1000, error: 2000 },
      trend: 'stable',
      history: []
    };
  };

  // Update component metrics
  const updateComponentMetrics = (componentName: string, duration: number) => {
    setComponentMetrics(prev => {
      const existing = prev.find(m => m.name === componentName);
      if (existing) {
        return prev.map(m => m.name === componentName ? {
          ...m,
          renderTime: (m.renderTime + duration) / 2, // Moving average
          updateCount: m.updateCount + 1
        } : m);
      } else {
        return [...prev, {
          name: componentName,
          renderTime: duration,
          memoryUsage: 0,
          updateCount: 1,
          errorCount: 0,
          props: {}
        }];
      }
    });
  };

  // Update benchmarks
  const updateBenchmarks = (currentMetrics: PerformanceMetric[]) => {
    const newBenchmarks: PerformanceBenchmark[] = [
      {
        name: 'Memory Efficiency',
        category: 'memory',
        baseline: 30,
        current: currentMetrics.find(m => m.name === 'Memory Usage')?.value || 0,
        target: 25,
        improvement: 0,
        recommendations: ['Optimize component re-renders', 'Use React.memo for expensive components']
      },
      {
        name: 'Render Performance',
        category: 'rendering',
        baseline: 1200,
        current: currentMetrics.find(m => m.name === 'Page Load Time')?.value || 0,
        target: 800,
        improvement: 0,
        recommendations: ['Implement code splitting', 'Optimize bundle size', 'Use lazy loading']
      },
      {
        name: 'Network Optimization',
        category: 'network',
        baseline: 300,
        current: currentMetrics.find(m => m.name === 'Network Latency')?.value || 0,
        target: 150,
        improvement: 0,
        recommendations: ['Enable compression', 'Use CDN', 'Optimize API calls']
      }
    ];

    newBenchmarks.forEach(benchmark => {
      benchmark.improvement = ((benchmark.baseline - benchmark.current) / benchmark.baseline) * 100;
    });

    setBenchmarks(newBenchmarks);
  };

  // Generate performance alert
  const generateAlert = (type: 'warning' | 'error' | 'info', component: string, message: string) => {
    const alert: PerformanceAlert = {
      id: Date.now().toString(),
      type,
      component,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    onPerformanceAlert?.(alert);
  };

  // Get metric status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get metric status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return Info;
    }
  };

  // Export performance data
  const exportPerformanceData = () => {
    const exportData = {
      metrics,
      componentMetrics,
      systemMetrics,
      benchmarks,
      alerts,
      timestamp: Date.now()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>
            Real-time performance monitoring and optimization recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={isMonitoring ? "default" : "outline"}
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                {isMonitoring ? 'Monitoring active' : 'Monitoring paused'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Refresh:</span>
              <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number.parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1s</SelectItem>
                  <SelectItem value="5000">5s</SelectItem>
                  <SelectItem value="10000">10s</SelectItem>
                  <SelectItem value="30000">30s</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={exportPerformanceData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const StatusIcon = getStatusIcon(metric.status);
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{metric.name}</h3>
                  <StatusIcon className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold">{metric.value.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Warning: {metric.threshold.warning}{metric.unit}</span>
                    <span>Error: {metric.threshold.error}{metric.unit}</span>
                  </div>
                  <Progress 
                    value={Math.min((metric.value / metric.threshold.error) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        metric.status === 'good' ? 'bg-green-500' :
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {metric.value.toFixed(1)}{metric.unit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={metric.status === 'good' ? 'default' : 'destructive'}>
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Component Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {componentMetrics.map((component, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{component.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Renders: {component.updateCount} | Errors: {component.errorCount}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{component.renderTime.toFixed(1)}ms</div>
                      <div className="text-sm text-muted-foreground">Avg render time</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card>
            <CardHeader>
              <CardTitle>Performance Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benchmarks.map((benchmark, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{benchmark.name}</h4>
                      <Badge variant={benchmark.improvement > 0 ? 'default' : 'destructive'}>
                        {benchmark.improvement > 0 ? '+' : ''}{benchmark.improvement.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Baseline:</span>
                        <span className="font-medium ml-2">{benchmark.baseline}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-medium ml-2">{benchmark.current.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <span className="font-medium ml-2">{benchmark.target}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Recommendations:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {benchmark.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'error' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{alert.component}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{alert.message}</div>
                    </div>
                  </div>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance alerts</p>
                    <p className="text-sm">System is running smoothly</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceMonitor;