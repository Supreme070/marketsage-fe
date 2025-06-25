'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Settings, 
  Activity, 
  Users, 
  Zap, 
  Clock,
  BarChart3,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SimulatorStatus {
  isRunning: boolean;
  startTime: string | null;
  currentSession: string | null;
  activeVisitors: number;
  totalEvents: number;
  uptime: number;
  config: {
    intensity: 'low' | 'medium' | 'high';
    duration: number;
    visitorRate: number;
    eventRate: number;
    aiEnabled: boolean;
    marketFocus: 'nigeria' | 'africa' | 'global';
  };
}

interface Props {
  onStatusChange?: (status: SimulatorStatus) => void;
  updateInterval?: number;
}

export default function RealTimeSimulator({ 
  onStatusChange, 
  updateInterval = 2000 
}: Props) {
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState(false);

  // Configuration state
  const [config, setConfig] = useState({
    intensity: 'medium' as 'low' | 'medium' | 'high',
    duration: 300000, // 5 minutes
    aiEnabled: true,
    marketFocus: 'nigeria' as 'nigeria' | 'africa' | 'global'
  });

  // Fetch simulator status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/leadpulse/simulator?action=status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        onStatusChange?.(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch status');
      }
    } catch (error) {
      console.error('Error fetching simulator status:', error);
      setError('Failed to fetch simulator status');
    }
  };

  // Start simulator
  const startSimulator = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/leadpulse/simulator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          config
        })
      });
      
      if (response.ok) {
        await fetchStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start simulator');
      }
    } catch (error) {
      console.error('Error starting simulator:', error);
      setError(error instanceof Error ? error.message : 'Failed to start simulator');
    } finally {
      setLoading(false);
    }
  };

  // Stop simulator
  const stopSimulator = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/leadpulse/simulator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stop'
        })
      });
      
      if (response.ok) {
        await fetchStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop simulator');
      }
    } catch (error) {
      console.error('Error stopping simulator:', error);
      setError(error instanceof Error ? error.message : 'Failed to stop simulator');
    } finally {
      setLoading(false);
    }
  };

  // Update configuration
  const updateConfig = async () => {
    setConfiguring(true);
    setError(null);
    
    try {
      const response = await fetch('/api/leadpulse/simulator', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      });
      
      if (response.ok) {
        await fetchStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      setError(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setConfiguring(false);
    }
  };

  // Format uptime
  const formatUptime = (uptime: number): string => {
    if (uptime < 60000) return `${Math.floor(uptime / 1000)}s`;
    if (uptime < 3600000) return `${Math.floor(uptime / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`;
    return `${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m`;
  };

  // Format duration
  const formatDuration = (duration: number): string => {
    if (duration < 60000) return `${duration / 1000}s`;
    return `${duration / 60000}m`;
  };

  // Get intensity color
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Periodic status updates
  useEffect(() => {
    fetchStatus(); // Initial fetch
    
    const interval = setInterval(fetchStatus, updateInterval);
    return () => clearInterval(interval);
  }, [updateInterval]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Real-Time Simulator
            {status?.isRunning && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={status?.isRunning ? 'default' : 'secondary'}>
              {status?.isRunning ? 'RUNNING' : 'STOPPED'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatus}
              disabled={loading}
              className="h-8"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Status Overview */}
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{status.activeVisitors}</div>
              <div className="text-xs text-muted-foreground">Active Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{status.totalEvents}</div>
              <div className="text-xs text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {status.isRunning ? formatUptime(status.uptime) : '--'}
              </div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className={`inline-block px-2 py-1 rounded border text-xs font-medium ${
                getIntensityColor(status.config.intensity)
              }`}>
                {status.config.intensity.toUpperCase()}
              </div>
              <div className="text-xs text-muted-foreground">Intensity</div>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm">Configuration</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Simulation Intensity
              </label>
              <Select
                value={config.intensity}
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setConfig(prev => ({ ...prev, intensity: value }))
                }
                disabled={status?.isRunning}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (1 visitor/4s)</SelectItem>
                  <SelectItem value="medium">Medium (1 visitor/2s)</SelectItem>
                  <SelectItem value="high">High (1 visitor/1s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Duration
              </label>
              <Select
                value={config.duration.toString()}
                onValueChange={(value: string) => 
                  setConfig(prev => ({ ...prev, duration: Number.parseInt(value) }))
                }
                disabled={status?.isRunning}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60000">1 minute</SelectItem>
                  <SelectItem value="300000">5 minutes</SelectItem>
                  <SelectItem value="600000">10 minutes</SelectItem>
                  <SelectItem value="1800000">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Market Focus
              </label>
              <Select
                value={config.marketFocus}
                onValueChange={(value: 'nigeria' | 'africa' | 'global') => 
                  setConfig(prev => ({ ...prev, marketFocus: value }))
                }
                disabled={status?.isRunning}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nigeria">Nigeria Focus</SelectItem>
                  <SelectItem value="africa">Africa Wide</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ai-enabled"
                checked={config.aiEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, aiEnabled: e.target.checked }))}
                disabled={status?.isRunning}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="ai-enabled" className="text-xs font-medium text-gray-700">
                AI Enhancement
              </label>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {!status?.isRunning ? (
            <Button
              onClick={startSimulator}
              disabled={loading}
              className="flex items-center gap-2"
              size="sm"
            >
              <Play className="h-4 w-4" />
              Start Simulation
            </Button>
          ) : (
            <Button
              onClick={stopSimulator}
              disabled={loading}
              variant="destructive"
              className="flex items-center gap-2"
              size="sm"
            >
              <Square className="h-4 w-4" />
              Stop Simulation
            </Button>
          )}
          
          <Button
            onClick={updateConfig}
            disabled={configuring || status?.isRunning}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <Settings className="h-4 w-4" />
            Update Config
          </Button>
        </div>

        {/* Current Session Info */}
        {status?.isRunning && status.currentSession && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Active Session</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>Session ID: {status.currentSession}</div>
              <div>Started: {status.startTime ? new Date(status.startTime).toLocaleTimeString() : '--'}</div>
              <div>Duration: {formatDuration(config.duration)}</div>
              <div>Remaining: {status.startTime ? 
                formatDuration(Math.max(0, config.duration - status.uptime)) : '--'
              }</div>
            </div>
          </div>
        )}

        {/* Real-time Metrics */}
        {status?.isRunning && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Live Metrics</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>Visitor Rate:</span>
                <span className="font-medium">{(60000 / status.config.visitorRate).toFixed(1)}/min</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>Event Rate:</span>
                <span className="font-medium">{(60000 / status.config.eventRate).toFixed(1)}/min</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}