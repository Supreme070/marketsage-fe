"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  BarChart3,
  TrendingUp,
  Zap,
  Globe,
  Users,
  DollarSign,
  Target,
  Map
} from "lucide-react";
import { toast } from "sonner";
import { techFlowEngine, type SimulationConfig, type SimulationMetrics, type SimulationEvent } from '@/lib/simulation/techflow-engine';
// Quantum integration replaced with mock implementation
const quantumIntegration = {
  isActive: () => false,
  getStatus: () => ({ status: 'inactive' }),
  getAdvantage: () => 0.15
};

interface TechFlowSimulationPanelProps {
  className?: string;
}

export default function TechFlowSimulationPanel({ className }: TechFlowSimulationPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<SimulationMetrics | null>(null);
  const [currentConfig, setCurrentConfig] = useState<SimulationConfig>({
    market: 'NGN',
    duration: 5,
    intensity: 'medium',
    scenario: 'normal',
    enableQuantum: true,
    realTimeUpdates: true
  });
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<SimulationEvent[]>([]);
  const [quantumAdvantage, setQuantumAdvantage] = useState(0);
  const eventBufferRef = useRef<SimulationEvent[]>([]);

  // Real-time event handler
  useEffect(() => {
    const handleEvent = (event: SimulationEvent) => {
      eventBufferRef.current = [event, ...eventBufferRef.current].slice(0, 10);
      setLiveEvents([...eventBufferRef.current]);
      
      // Update metrics when we get real-time updates
      if (event.type === 'system' && event.data.liveMetrics) {
        const liveMetrics = event.data.liveMetrics;
        setMetrics(prev => prev ? {
          ...prev,
          ...liveMetrics
        } : null);
      }
      
      // Track quantum advantage
      if (event.quantumPredicted) {
        setQuantumAdvantage(prev => Math.min(0.95, prev + 0.02));
      }
    };

    techFlowEngine.onEvent(handleEvent);

    return () => {
      // No cleanup method available in the engine, but we clear local state
      eventBufferRef.current = [];
    };
  }, []);

  // Metrics polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        const currentMetrics = techFlowEngine.getMetrics();
        setMetrics(currentMetrics);
      }, 2000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  const startSimulation = async () => {
    try {
      setIsRunning(true);
      const id = await techFlowEngine.startSimulation(currentConfig);
      setSimulationId(id);
      setLiveEvents([]);
      eventBufferRef.current = [];
      
      toast.success(`TechFlow simulation started: ${currentConfig.market} market`);
      
      // Initialize metrics
      const initialMetrics = techFlowEngine.getMetrics();
      setMetrics(initialMetrics);
      
    } catch (error) {
      console.error('Failed to start simulation:', error);
      toast.error('Failed to start TechFlow simulation');
      setIsRunning(false);
    }
  };

  const stopSimulation = () => {
    techFlowEngine.stopSimulation();
    setIsRunning(false);
    setSimulationId(null);
    toast.info('TechFlow simulation stopped');
  };

  const formatCurrency = (amount: number, market = 'NGN') => {
    const symbols = { NGN: '₦', KES: 'KSh', GHS: 'GH₵', ZAR: 'R', EGP: '£E' };
    const symbol = symbols[market as keyof typeof symbols] || '₦';
    
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'transaction': return <DollarSign className="h-3 w-3 text-green-400" />;
      case 'conversion': return <Target className="h-3 w-3 text-blue-400" />;
      case 'engagement': return <Users className="h-3 w-3 text-purple-400" />;
      case 'market': return <Globe className="h-3 w-3 text-amber-400" />;
      default: return <Activity className="h-3 w-3 text-gray-400" />;
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-orange-500';
      case 'extreme': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={`border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/20">
              <BarChart3 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                TechFlow Simulation
                {isRunning && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Real-time African fintech market simulation with quantum optimization
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Market Selector */}
            <select 
              className="px-2 py-1 text-xs border rounded bg-background"
              value={currentConfig.market}
              onChange={(e) => setCurrentConfig(prev => ({ ...prev, market: e.target.value as any }))}
              disabled={isRunning}
            >
              <option value="NGN">Nigeria (₦)</option>
              <option value="KES">Kenya (KSh)</option>
              <option value="GHS">Ghana (GH₵)</option>
              <option value="ZAR">South Africa (R)</option>
              <option value="EGP">Egypt (£E)</option>
              <option value="ALL">All Markets</option>
            </select>
            
            {/* Intensity Selector */}
            <select 
              className="px-2 py-1 text-xs border rounded bg-background"
              value={currentConfig.intensity}
              onChange={(e) => setCurrentConfig(prev => ({ ...prev, intensity: e.target.value as any }))}
              disabled={isRunning}
            >
              <option value="low">Low Intensity</option>
              <option value="medium">Medium Intensity</option>
              <option value="high">High Intensity</option>
              <option value="extreme">Extreme Intensity</option>
            </select>
            
            {!isRunning ? (
              <Button size="sm" onClick={startSimulation} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            ) : (
              <Button size="sm" onClick={stopSimulation} variant="outline">
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Real-time Metrics */}
        {metrics && (
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <div className="text-lg font-bold text-white">{metrics.totalTransactions}</div>
              <div className="text-xs text-gray-400">Transactions</div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <div className="text-lg font-bold text-green-400">{(metrics.conversionRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Conversion Rate</div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <div className="text-lg font-bold text-purple-400">{formatCurrency(metrics.revenueGenerated, currentConfig.market)}</div>
              <div className="text-xs text-gray-400">Revenue</div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <div className="text-lg font-bold text-blue-400">{metrics.customerAcquisition}</div>
              <div className="text-xs text-gray-400">New Customers</div>
            </div>
          </div>
        )}
        
        {/* Quantum Advantage Indicator */}
        {isRunning && (
          <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                Quantum Enhancement
              </span>
              <span className="text-xs text-purple-400">{(quantumAdvantage * 100).toFixed(1)}% advantage</span>
            </div>
            <Progress value={quantumAdvantage * 100} className="h-2" />
          </div>
        )}
        
        {/* Live Events Feed */}
        {isRunning && liveEvents.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Live Events</h4>
              <Badge variant="outline" className="text-xs">
                {liveEvents.length} recent
              </Badge>
            </div>
            
            <div className="max-h-32 overflow-y-auto space-y-1">
              {liveEvents.slice(0, 5).map((event, index) => (
                <div key={event.id} className="flex items-center gap-2 p-2 bg-gray-800/20 rounded text-xs">
                  {getEventIcon(event.type)}
                  <span className="flex-1 text-gray-300">
                    {event.type === 'transaction' && `${formatCurrency(event.data.value, event.market)} transaction in ${event.market}`}
                    {event.type === 'conversion' && `New conversion via ${event.channel} in ${event.market}`}
                    {event.type === 'engagement' && `${event.data.customersEngaged} users engaged via ${event.channel}`}
                    {event.type === 'market' && `Market conditions updated in ${event.market}`}
                    {event.type === 'system' && event.data.liveMetrics && `Live metrics update: ${Object.keys(event.data.liveMetrics).length} indicators`}
                  </span>
                  {event.quantumPredicted && (
                    <Zap className="h-3 w-3 text-purple-400" title="Quantum predicted" />
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString('en-US', { 
                      hour12: false, 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Simulation Status */}
        <div className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg border border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-300">
              {isRunning ? `Simulating ${currentConfig.market} market` : 'Simulation stopped'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isRunning && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getIntensityColor(currentConfig.intensity)}`}></div>
                <span className="text-xs text-gray-400 capitalize">{currentConfig.intensity}</span>
              </div>
            )}
            
            {currentConfig.enableQuantum && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                <Zap className="h-3 w-3 mr-1" />
                Quantum
              </Badge>
            )}
          </div>
        </div>
        
        {/* Quick Configuration */}
        {!isRunning && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Quick Configuration</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Scenario</label>
                <select 
                  className="w-full px-2 py-1 text-xs border rounded bg-background"
                  value={currentConfig.scenario}
                  onChange={(e) => setCurrentConfig(prev => ({ ...prev, scenario: e.target.value as any }))}
                >
                  <option value="normal">Normal Operations</option>
                  <option value="peak-hours">Peak Hours</option>
                  <option value="market-shock">Market Shock</option>
                  <option value="festival-season">Festival Season</option>
                  <option value="regulatory-change">Regulatory Change</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Duration (minutes)</label>
                <select 
                  className="w-full px-2 py-1 text-xs border rounded bg-background"
                  value={currentConfig.duration}
                  onChange={(e) => setCurrentConfig(prev => ({ ...prev, duration: Number.parseInt(e.target.value) }))}
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input 
                  type="checkbox" 
                  checked={currentConfig.enableQuantum}
                  onChange={(e) => setCurrentConfig(prev => ({ ...prev, enableQuantum: e.target.checked }))}
                  className="rounded"
                />
                Enable Quantum Optimization
              </label>
              
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input 
                  type="checkbox" 
                  checked={currentConfig.realTimeUpdates}
                  onChange={(e) => setCurrentConfig(prev => ({ ...prev, realTimeUpdates: e.target.checked }))}
                  className="rounded"
                />
                Real-time Updates
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}