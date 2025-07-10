"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Timer,
  HardDrive,
  Gauge,
  Settings,
  Play,
  Pause,
  Target,
  Layers
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
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface CacheOptimizationDashboardProps {
  className?: string;
}

interface CacheMetrics {
  hitRatio: number;
  missRatio: number;
  warmingJobs: number;
  invalidationEvents: number;
  totalCacheSize: number;
  hotKeys: Array<{
    key: string;
    hits: number;
    misses: number;
    lastAccess: Date;
    size: number;
  }>;
}

interface WarmingStrategy {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  schedule: {
    frequency: string;
    conditions?: string[];
  };
  keys: string[];
  lastRun?: Date;
  status: 'running' | 'stopped' | 'error';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CacheOptimizationDashboard({ className }: CacheOptimizationDashboardProps) {
  const [metrics, setMetrics] = useState<CacheMetrics>({
    hitRatio: 0,
    missRatio: 0,
    warmingJobs: 0,
    invalidationEvents: 0,
    totalCacheSize: 0,
    hotKeys: []
  });
  
  const [warmingStrategies, setWarmingStrategies] = useState<WarmingStrategy[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const loadData = () => {
      // Mock metrics
      setMetrics({
        hitRatio: 0.85,
        missRatio: 0.15,
        warmingJobs: 5,
        invalidationEvents: 123,
        totalCacheSize: 1024 * 1024 * 50, // 50MB
        hotKeys: [
          { key: 'leadpulse:visitors:active', hits: 1500, misses: 45, lastAccess: new Date(), size: 1024 * 10 },
          { key: 'leadpulse:analytics:overview', hits: 890, misses: 23, lastAccess: new Date(), size: 1024 * 5 },
          { key: 'leadpulse:geo:countries', hits: 720, misses: 18, lastAccess: new Date(), size: 1024 * 3 },
          { key: 'leadpulse:journey:top_visitor', hits: 650, misses: 12, lastAccess: new Date(), size: 1024 * 8 },
          { key: 'leadpulse:count:visitors', hits: 580, misses: 8, lastAccess: new Date(), size: 1024 * 2 }
        ]
      });

      // Mock warming strategies
      setWarmingStrategies([
        {
          id: 'realtime_visitors',
          name: 'Real-time Visitors',
          priority: 10,
          enabled: true,
          schedule: { frequency: 'realtime', conditions: ['visitor_activity'] },
          keys: ['leadpulse:visitors:active'],
          lastRun: new Date(),
          status: 'running'
        },
        {
          id: 'analytics_overview',
          name: 'Analytics Overview',
          priority: 9,
          enabled: true,
          schedule: { frequency: 'every_minute' },
          keys: ['leadpulse:analytics:overview'],
          lastRun: new Date(),
          status: 'running'
        },
        {
          id: 'geographic_data',
          name: 'Geographic Data',
          priority: 7,
          enabled: true,
          schedule: { frequency: 'every_15_minutes' },
          keys: ['leadpulse:geo:countries'],
          lastRun: new Date(),
          status: 'running'
        },
        {
          id: 'visitor_journeys',
          name: 'Visitor Journeys',
          priority: 6,
          enabled: false,
          schedule: { frequency: 'every_5_minutes' },
          keys: ['leadpulse:journey:*'],
          lastRun: new Date(),
          status: 'stopped'
        }
      ]);

      // Mock performance history
      const history = [];
      for (let i = 0; i < 24; i++) {
        history.push({
          time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          hitRatio: 0.8 + Math.random() * 0.15,
          responseTime: 50 + Math.random() * 100,
          cacheSize: 40 + Math.random() * 20,
          invalidations: Math.floor(Math.random() * 10)
        });
      }
      setPerformanceHistory(history);
      
      setLoading(false);
    };

    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleStrategyToggle = (strategyId: string, enabled: boolean) => {
    setWarmingStrategies(prev => 
      prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, enabled, status: enabled ? 'running' : 'stopped' }
          : strategy
      )
    );
  };

  const handleManualWarm = (strategyId: string) => {
    setWarmingStrategies(prev => 
      prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, lastRun: new Date(), status: 'running' }
          : strategy
      )
    );
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cache? This may impact performance temporarily.')) {
      setMetrics(prev => ({ ...prev, totalCacheSize: 0 }));
      alert('Cache cleared successfully');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-3 w-3" />;
      case 'stopped':
        return <Pause className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Optimization</h2>
          <p className="text-muted-foreground">
            Advanced cache warming and invalidation strategies for LeadPulse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">Auto Refresh</Label>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hit Ratio</p>
                <p className="text-2xl font-bold text-green-600">{(metrics.hitRatio * 100).toFixed(1)}%</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <Progress value={metrics.hitRatio * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Size</p>
                <p className="text-2xl font-bold">{formatBytes(metrics.totalCacheSize)}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <HardDrive className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.hotKeys.length} active keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warming Jobs</p>
                <p className="text-2xl font-bold">{metrics.warmingJobs}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {warmingStrategies.filter(s => s.enabled).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invalidations</p>
                <p className="text-2xl font-bold">{metrics.invalidationEvents}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alert */}
      {metrics.hitRatio < 0.8 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cache hit ratio is below 80%. Consider adjusting warming strategies or reviewing cache configuration.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="strategies">Warming Strategies</TabsTrigger>
          <TabsTrigger value="hotkeys">Hot Keys</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Cache performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="hitRatio" stroke="#8884d8" name="Hit Ratio" />
                  <Line type="monotone" dataKey="responseTime" stroke="#82ca9d" name="Response Time (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Size Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cacheSize" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invalidation Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="invalidations" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Warming Strategies</h3>
            <Button size="sm" onClick={() => handleClearCache()}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>

          <div className="grid gap-4">
            {warmingStrategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={strategy.enabled}
                          onCheckedChange={(enabled) => handleStrategyToggle(strategy.id, enabled)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{strategy.name}</span>
                            <Badge className={getStatusColor(strategy.status)}>
                              {getStatusIcon(strategy.status)}
                              {strategy.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Priority: {strategy.priority} • Frequency: {strategy.schedule.frequency}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {strategy.lastRun && `Last run: ${strategy.lastRun.toLocaleTimeString()}`}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualWarm(strategy.id)}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Warm Now
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {strategy.keys.map((key, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hotkeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hot Keys</CardTitle>
              <CardDescription>Most frequently accessed cache keys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.hotKeys.map((key, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{key.key}</div>
                      <div className="text-xs text-muted-foreground">
                        Size: {formatBytes(key.size)} • Last access: {key.lastAccess.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-green-600">
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                        {key.hits} hits
                      </div>
                      <div className="text-red-600">
                        <TrendingDown className="h-4 w-4 inline mr-1" />
                        {key.misses} misses
                      </div>
                      <div className="text-blue-600">
                        {((key.hits / (key.hits + key.misses)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Settings</CardTitle>
              <CardDescription>Configure cache behavior and optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Cache Warming</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically warm cache based on configured strategies
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Smart Invalidation</Label>
                    <p className="text-sm text-muted-foreground">
                      Use intelligent invalidation rules with debouncing
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Metrics Collection</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect detailed cache performance metrics
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable compression for large cache values
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Max Cache Size</Label>
                  <p className="text-sm text-muted-foreground">Maximum cache size before eviction</p>
                  <select className="mt-1 w-full p-2 border rounded">
                    <option value="50">50 MB</option>
                    <option value="100">100 MB</option>
                    <option value="200">200 MB</option>
                    <option value="500">500 MB</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Default TTL</Label>
                  <p className="text-sm text-muted-foreground">Default time-to-live for cache entries</p>
                  <select className="mt-1 w-full p-2 border rounded">
                    <option value="300">5 minutes</option>
                    <option value="600">10 minutes</option>
                    <option value="1800">30 minutes</option>
                    <option value="3600">1 hour</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}