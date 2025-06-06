'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { aiModelCache } from '@/lib/ai/model-cache';
import { batchPredictor } from '@/lib/ai/batch-predictor';
import { aiWorkerManager } from '@/lib/ai/worker-manager';

interface ModelMetrics {
  timestamp: number;
  accuracy: number;
  latency: number;
  throughput: number;
  memoryUsage: number;
  cacheHitRate: number;
}

interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export default function ModelPerformanceDashboard() {
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  
  // Fetch metrics periodically
  useEffect(() => {
    if (!isAutoRefresh) return;
    
    const fetchMetrics = async () => {
      try {
        // Get cache stats
        const cacheStats = aiModelCache.getStats();
        
        // Get batch prediction stats
        const predictionStats = batchPredictor.getStats();
        
        // Get worker stats
        const workerStats = aiWorkerManager.getStatus();
        
        // Combine metrics
        const newMetric: ModelMetrics = {
          timestamp: Date.now(),
          accuracy: predictionStats.totalRequests > 0 ? 
            1 - predictionStats.errorRate : 0,
          latency: predictionStats.avgLatency,
          throughput: predictionStats.throughputPerSecond,
          memoryUsage: cacheStats.memoryUsage / (1024 * 1024), // Convert to MB
          cacheHitRate: cacheStats.hitRate
        };
        
        setMetrics(prev => {
          const newMetrics = [...prev, newMetric];
          // Keep last 1000 data points
          return newMetrics.slice(-1000);
        });
        
        // Check for alerts
        checkAlerts(newMetric, cacheStats, predictionStats, workerStats);
        
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        addAlert('error', 'Failed to fetch performance metrics');
      }
    };
    
    // Initial fetch
    fetchMetrics();
    
    // Set up polling
    const intervalId = setInterval(fetchMetrics, 5000); // Every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [isAutoRefresh]);
  
  // Filter metrics based on selected time range
  const filteredMetrics = React.useMemo(() => {
    const now = Date.now();
    const ranges = {
      '1h': now - 3600000,
      '24h': now - 86400000,
      '7d': now - 604800000
    };
    
    return metrics.filter(m => m.timestamp >= ranges[selectedTimeRange]);
  }, [metrics, selectedTimeRange]);
  
  // Add new alert
  const addAlert = (level: Alert['level'], message: string) => {
    const newAlert: Alert = {
      id: `alert_${Date.now()}`,
      level,
      message,
      timestamp: Date.now()
    };
    
    setAlerts(prev => [...prev, newAlert].slice(-100)); // Keep last 100 alerts
  };
  
  // Check for alert conditions
  const checkAlerts = (
    metric: ModelMetrics,
    cacheStats: any,
    predictionStats: any,
    workerStats: any
  ) => {
    // Performance alerts
    if (metric.latency > 1000) {
      addAlert('warning', 'High latency detected (>1s)');
    }
    
    if (metric.accuracy < 0.9) {
      addAlert('warning', 'Model accuracy below threshold (<90%)');
    }
    
    // Resource alerts
    if (metric.memoryUsage > 180) { // >180MB
      addAlert('warning', 'High memory usage (>90% of limit)');
    }
    
    // Cache alerts
    if (cacheStats.hitRate < 0.5) {
      addAlert('info', 'Low cache hit rate (<50%)');
    }
    
    // Worker alerts
    if (workerStats.queuedTasks > 100) {
      addAlert('warning', 'High number of queued tasks (>100)');
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Model Performance Dashboard</h1>
        
        <div className="flex gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-4 py-2 rounded-md ${
              isAutoRefresh ? 'bg-green-500 text-white' : 'bg-gray-200'
            }`}
          >
            {isAutoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </button>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Accuracy & Latency Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Model Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#4CAF50"
                  name="Accuracy"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="#2196F3"
                  name="Latency (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Throughput & Memory Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">System Resources</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="throughput"
                  stroke="#FF9800"
                  name="Throughput (req/s)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="memoryUsage"
                  stroke="#9C27B0"
                  name="Memory Usage (MB)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Cache Performance */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Cache Performance</h2>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
              />
              <Legend />
              <Bar
                dataKey="cacheHitRate"
                fill="#00BCD4"
                name="Cache Hit Rate"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Alerts */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">System Alerts</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {alerts.slice().reverse().map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-md ${
                alert.level === 'error' ? 'bg-red-100 text-red-800' :
                alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              <div className="flex justify-between">
                <span className="font-medium">{alert.message}</span>
                <span className="text-sm">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          
          {alerts.length === 0 && (
            <div className="text-gray-500 text-center py-4">
              No alerts to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 