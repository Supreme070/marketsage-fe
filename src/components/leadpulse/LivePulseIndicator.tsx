'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Brain, 
  Zap, 
  Target,
  TrendingUp,
  Users,
  AlertCircle
} from 'lucide-react';

interface SimulatorStatus {
  isRunning: boolean;
  activeVisitors: number;
  totalEvents: number;
  uptime: number;
  config: {
    intensity: 'low' | 'medium' | 'high';
    aiEnabled: boolean;
  };
}

interface AIBehaviorData {
  highValueVisitors: number;
  avgAiScore: number;
  avgConversionProb: number;
  urgentVisitors: number;
  enterpriseVisitors: number;
  recentActivity: Array<{
    type: string;
    aiScore: number;
    urgency: 'high' | 'medium' | 'low';
    timestamp: number;
  }>;
}

interface Props {
  type?: 'compact' | 'detailed' | 'mini';
  showBehaviorAnalysis?: boolean;
  updateInterval?: number;
  className?: string;
}

export default function LivePulseIndicator({ 
  type = 'compact',
  showBehaviorAnalysis = true,
  updateInterval = 3000,
  className = ''
}: Props) {
  const [simulatorStatus, setSimulatorStatus] = useState<SimulatorStatus | null>(null);
  const [aiBehaviorData, setAiBehaviorData] = useState<AIBehaviorData | null>(null);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Monitor simulator status and AI behavior
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    let behaviorInterval: NodeJS.Timeout;

    const fetchSimulatorStatus = async () => {
      try {
        const response = await fetch('/api/leadpulse/simulator?action=status');
        if (response.ok) {
          const status = await response.json();
          setSimulatorStatus(status);
          
          // Adjust pulse intensity based on simulator activity
          if (status.isRunning) {
            const intensity = status.config.intensity === 'high' ? 1.5 : 
                            status.config.intensity === 'medium' ? 1.2 : 1.0;
            setPulseIntensity(intensity);
            setLastActivity(new Date());
          }
        }
      } catch (error) {
        console.error('Error fetching simulator status:', error);
        setSimulatorStatus(null);
      }
    };

    const fetchAIBehaviorData = async () => {
      if (!simulatorStatus?.isRunning) return;
      
      try {
        // Import getActiveVisitors dynamically
        const { getActiveVisitors } = await import('@/lib/leadpulse/dataProvider');
        const visitors = await getActiveVisitors('10m');
        
        // Filter for simulator-generated visitors with AI data
        const aiVisitors = visitors.filter(visitor => 
          visitor.metadata?.simulatorGenerated && 
          visitor.metadata?.aiPrediction &&
          visitor.metadata?.aiEnhancement
        );
        
        if (aiVisitors.length > 0) {
          const behaviorData: AIBehaviorData = {
            highValueVisitors: aiVisitors.filter(v => v.metadata.aiEnhancement.predictedValue > 300000).length,
            avgAiScore: Math.round(aiVisitors.reduce((sum, v) => sum + v.metadata.aiEnhancement.aiScore, 0) / aiVisitors.length),
            avgConversionProb: Math.round(aiVisitors.reduce((sum, v) => sum + v.metadata.aiPrediction.conversionProbability, 0) / aiVisitors.length * 100),
            urgentVisitors: aiVisitors.filter(v => v.metadata.aiEnhancement.urgencyLevel === 'high').length,
            enterpriseVisitors: aiVisitors.filter(v => v.metadata.aiEnhancement.segmentPrediction === 'enterprise').length,
            recentActivity: aiVisitors.slice(-3).map(visitor => ({
              type: visitor.metadata.aiEnhancement.segmentPrediction,
              aiScore: visitor.metadata.aiEnhancement.aiScore,
              urgency: visitor.metadata.aiEnhancement.urgencyLevel,
              timestamp: Date.now()
            }))
          };
          
          setAiBehaviorData(behaviorData);
        }
      } catch (error) {
        console.error('Error fetching AI behavior data:', error);
      }
    };

    // Start monitoring
    fetchSimulatorStatus();
    statusInterval = setInterval(fetchSimulatorStatus, updateInterval);
    
    if (showBehaviorAnalysis) {
      behaviorInterval = setInterval(fetchAIBehaviorData, updateInterval + 1000);
    }

    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (behaviorInterval) clearInterval(behaviorInterval);
    };
  }, [simulatorStatus?.isRunning, updateInterval, showBehaviorAnalysis]);

  // Generate pulse styles based on intensity and activity
  const getPulseStyles = () => {
    if (!simulatorStatus?.isRunning) return '';
    
    const baseStyles = 'animate-pulse';
    const intensityClass = pulseIntensity > 1.4 ? 'animate-bounce' : 
                          pulseIntensity > 1.1 ? 'animate-pulse' : '';
    
    return `${baseStyles} ${intensityClass}`;
  };

  const getActivityColor = () => {
    if (!simulatorStatus?.isRunning) return 'bg-gray-400';
    
    if (aiBehaviorData?.urgentVisitors > 0) return 'bg-red-500';
    if (aiBehaviorData?.avgAiScore > 70) return 'bg-green-500';
    if (aiBehaviorData?.avgConversionProb > 60) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getIntensityBadge = () => {
    if (!simulatorStatus?.isRunning) return null;
    
    const intensity = simulatorStatus.config.intensity;
    const badgeClass = intensity === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                      intensity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-green-100 text-green-800 border-green-200';
    
    return (
      <Badge variant="outline" className={`text-xs ${badgeClass}`}>
        {intensity.toUpperCase()}
      </Badge>
    );
  };

  // Mini indicator (just a pulse dot)
  if (type === 'mini') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getActivityColor()} ${getPulseStyles()}`} />
        {simulatorStatus?.isRunning && (
          <span className="text-xs text-green-600 font-medium">LIVE</span>
        )}
      </div>
    );
  }

  // Compact indicator
  if (type === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-3 h-3 rounded-full ${getActivityColor()} ${getPulseStyles()}`} />
        <div className="flex items-center gap-2">
          {simulatorStatus?.isRunning ? (
            <>
              <span className="text-sm font-medium text-green-600">AI SIMULATOR</span>
              {getIntensityBadge()}
              {aiBehaviorData && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Users className="h-3 w-3" />
                  <span>{simulatorStatus.activeVisitors}</span>
                  <Brain className="h-3 w-3 ml-1" />
                  <span>{aiBehaviorData.avgAiScore}</span>
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-500">Simulator Inactive</span>
          )}
        </div>
      </div>
    );
  }

  // Detailed indicator with full AI behavior analysis
  if (type === 'detailed' && simulatorStatus?.isRunning) {
    return (
      <div className={`p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getActivityColor()} ${getPulseStyles()}`} />
            <span className="font-medium text-blue-900 dark:text-blue-100">Live AI Simulator</span>
            {getIntensityBadge()}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Uptime: {Math.floor(simulatorStatus.uptime / 60000)}m
          </div>
        </div>
        
        {showBehaviorAnalysis && aiBehaviorData && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-blue-600" />
                <span>{simulatorStatus.activeVisitors} Active</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3 text-purple-600" />
                <span>AI Score: {aiBehaviorData.avgAiScore}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-green-600" />
                <span>{aiBehaviorData.avgConversionProb}% Convert</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-orange-600" />
                <span>{aiBehaviorData.enterpriseVisitors} Enterprise</span>
              </div>
            </div>
            
            {aiBehaviorData.urgentVisitors > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <span className="text-red-700 dark:text-red-300">
                  {aiBehaviorData.urgentVisitors} high-priority visitors detected
                </span>
              </div>
            )}
            
            {aiBehaviorData.recentActivity.length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Recent: {aiBehaviorData.recentActivity.map(activity => 
                  `${activity.type} (${activity.aiScore})`
                ).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}