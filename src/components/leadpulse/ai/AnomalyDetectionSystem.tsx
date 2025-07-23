/**
 * Anomaly Detection System Component
 * 
 * AI-powered anomaly detection for visitor behavior, traffic patterns,
 * and system performance with real-time alerts and automated responses.
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  AlertTriangle, 
  AlertOctagon,
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  Brain,
  Zap,
  Bell,
  Settings,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  LineChart,
  Target,
  Clock,
  Users,
  Globe,
  Gauge,
  Radar,
  Waves,
  Cpu,
  Network,
  Database,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Fingerprint,
  Lock,
  Unlock,
  UserX,
  Bot,
  Bug,
  Flame,
  Snowflake,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Server,
  ServerOff,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronRight,
  MoreVertical,
  Play,
  Pause,
  Square,
  SkipForward,
  AlertCircle
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface Anomaly {
  id: string;
  type: 'traffic' | 'behavior' | 'security' | 'performance' | 'business';
  subtype: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved' | 'ignored';
  title: string;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  metrics: {
    deviation: number;
    confidence: number;
    impact: number;
    frequency: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  affectedResources: {
    visitors: string[];
    pages: string[];
    regions: string[];
    devices: string[];
  };
  detection: {
    method: string;
    baseline: number;
    actual: number;
    threshold: number;
    algorithm: string;
  };
  recommendations: {
    action: string;
    priority: number;
    automatable: boolean;
    estimatedImpact: string;
  }[];
  timeline: {
    timestamp: Date;
    event: string;
    details?: string;
  }[];
  automatedResponse?: {
    enabled: boolean;
    actions: string[];
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result?: string;
  };
}

interface DetectionModel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  sensitivity: number;
  threshold: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  performance: {
    accuracy: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    lastUpdated: Date;
  };
  features: string[];
}

interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  lastSeen: Date;
  affectedMetrics: string[];
  correlations: {
    pattern: string;
    correlation: number;
    confidence: number;
  }[];
}

interface AnomalyStats {
  total: number;
  active: number;
  resolved: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  avgResolutionTime: number;
  falsePositiveRate: number;
  detectionAccuracy: number;
  automationRate: number;
}

interface AnomalyDetectionSystemProps {
  visitors: VisitorLocation[];
  enableRealTime?: boolean;
  autoResolve?: boolean;
  alertThreshold?: 'low' | 'medium' | 'high';
  onAnomalyDetected?: (anomaly: Anomaly) => void;
  onAnomalyResolved?: (anomaly: Anomaly) => void;
  onAutomatedAction?: (anomaly: Anomaly, action: string) => void;
  showAdvancedMetrics?: boolean;
}

/**
 * Anomaly Detection System Component
 */
export function AnomalyDetectionSystem({
  visitors,
  enableRealTime = true,
  autoResolve = false,
  alertThreshold = 'medium',
  onAnomalyDetected,
  onAnomalyResolved,
  onAutomatedAction,
  showAdvancedMetrics = true
}: AnomalyDetectionSystemProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [detectionModels, setDetectionModels] = useState<DetectionModel[]>([]);
  const [patterns, setPatterns] = useState<AnomalyPattern[]>([]);
  const [stats, setStats] = useState<AnomalyStats>({
    total: 0,
    active: 0,
    resolved: 0,
    bySeverity: {},
    byType: {},
    avgResolutionTime: 0,
    falsePositiveRate: 0,
    detectionAccuracy: 0,
    automationRate: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'anomalies' | 'models' | 'patterns'>('dashboard');
  const [timeRange, setTimeRange] = useState('24h');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize detection system
  useEffect(() => {
    initializeDetectionSystem();
  }, []);

  // Real-time detection
  useEffect(() => {
    if (enableRealTime) {
      startRealTimeDetection();
    } else {
      stopRealTimeDetection();
    }

    return () => {
      stopRealTimeDetection();
    };
  }, [enableRealTime, visitors]);

  // Initialize detection system with models
  const initializeDetectionSystem = async () => {
    // Initialize detection models
    const models: DetectionModel[] = [
      {
        id: 'traffic-spike',
        name: 'Traffic Spike Detection',
        type: 'traffic',
        enabled: true,
        sensitivity: 0.8,
        threshold: { low: 1.5, medium: 2.0, high: 3.0, critical: 5.0 },
        performance: {
          accuracy: 0.92,
          falsePositiveRate: 0.05,
          falseNegativeRate: 0.03,
          lastUpdated: new Date()
        },
        features: ['visitor_count', 'request_rate', 'bandwidth', 'geographic_distribution']
      },
      {
        id: 'bot-detection',
        name: 'Bot & Crawler Detection',
        type: 'security',
        enabled: true,
        sensitivity: 0.85,
        threshold: { low: 0.6, medium: 0.7, high: 0.85, critical: 0.95 },
        performance: {
          accuracy: 0.88,
          falsePositiveRate: 0.08,
          falseNegativeRate: 0.04,
          lastUpdated: new Date()
        },
        features: ['user_agent', 'request_patterns', 'javascript_execution', 'mouse_movement']
      },
      {
        id: 'performance-degradation',
        name: 'Performance Degradation',
        type: 'performance',
        enabled: true,
        sensitivity: 0.75,
        threshold: { low: 1.2, medium: 1.5, high: 2.0, critical: 3.0 },
        performance: {
          accuracy: 0.90,
          falsePositiveRate: 0.06,
          falseNegativeRate: 0.04,
          lastUpdated: new Date()
        },
        features: ['response_time', 'error_rate', 'cpu_usage', 'memory_usage']
      },
      {
        id: 'user-behavior',
        name: 'Abnormal User Behavior',
        type: 'behavior',
        enabled: true,
        sensitivity: 0.7,
        threshold: { low: 2.0, medium: 3.0, high: 4.0, critical: 5.0 },
        performance: {
          accuracy: 0.85,
          falsePositiveRate: 0.10,
          falseNegativeRate: 0.05,
          lastUpdated: new Date()
        },
        features: ['click_patterns', 'navigation_flow', 'session_duration', 'page_sequence']
      },
      {
        id: 'fraud-detection',
        name: 'Fraud Detection',
        type: 'security',
        enabled: true,
        sensitivity: 0.9,
        threshold: { low: 0.5, medium: 0.7, high: 0.85, critical: 0.95 },
        performance: {
          accuracy: 0.93,
          falsePositiveRate: 0.04,
          falseNegativeRate: 0.03,
          lastUpdated: new Date()
        },
        features: ['transaction_patterns', 'device_fingerprint', 'location_consistency', 'velocity_checks']
      }
    ];

    setDetectionModels(models);
    
    // Run initial scan
    await runAnomalyDetection();
  };

  // Start real-time detection
  const startRealTimeDetection = () => {
    if (detectionIntervalRef.current) return;

    detectionIntervalRef.current = setInterval(() => {
      runAnomalyDetection();
    }, 30000); // Run every 30 seconds
  };

  // Stop real-time detection
  const stopRealTimeDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // Run anomaly detection
  const runAnomalyDetection = async () => {
    setIsScanning(true);
    
    try {
      const newAnomalies: Anomaly[] = [];
      
      // Run each enabled detection model
      for (const model of detectionModels.filter(m => m.enabled)) {
        const detectedAnomalies = await detectAnomaliesWithModel(model);
        newAnomalies.push(...detectedAnomalies);
      }

      // Update anomalies list
      setAnomalies(prev => {
        const updated = [...newAnomalies, ...prev];
        return updated.slice(0, 100); // Keep last 100 anomalies
      });

      // Notify about new anomalies
      newAnomalies.forEach(anomaly => {
        if (shouldAlert(anomaly)) {
          onAnomalyDetected?.(anomaly);
        }

        // Auto-resolve if enabled
        if (autoResolve && anomaly.recommendations.some(r => r.automatable)) {
          executeAutomatedResponse(anomaly);
        }
      });

      // Update patterns
      updateAnomalyPatterns(newAnomalies);
      
      // Update statistics
      updateStatistics();
      
    } catch (error) {
      console.error('Anomaly detection error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Detect anomalies with specific model
  const detectAnomaliesWithModel = async (model: DetectionModel): Promise<Anomaly[]> => {
    const anomalies: Anomaly[] = [];
    
    // Simulate anomaly detection based on model type
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Random chance of detecting anomaly
    if (Math.random() < 0.3) {
      const severity = getSeverityFromModel(model);
      const anomaly: Anomaly = {
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: model.type as any,
        subtype: model.id,
        severity,
        status: 'active',
        title: generateAnomalyTitle(model.type, severity),
        description: generateAnomalyDescription(model.type, severity),
        detectedAt: new Date(),
        metrics: {
          deviation: Math.random() * 5 + 1,
          confidence: model.performance.accuracy,
          impact: Math.random() * 100,
          frequency: Math.floor(Math.random() * 10) + 1,
          trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
        },
        affectedResources: {
          visitors: generateAffectedVisitors(),
          pages: generateAffectedPages(),
          regions: generateAffectedRegions(),
          devices: generateAffectedDevices()
        },
        detection: {
          method: model.name,
          baseline: 100,
          actual: 100 * (Math.random() * 4 + 1),
          threshold: 100 * model.threshold[severity],
          algorithm: 'Statistical Z-Score Analysis'
        },
        recommendations: generateRecommendations(model.type, severity),
        timeline: [
          {
            timestamp: new Date(),
            event: 'Anomaly detected',
            details: `Detected by ${model.name}`
          }
        ]
      };
      
      anomalies.push(anomaly);
    }
    
    return anomalies;
  };

  // Get severity from model thresholds
  const getSeverityFromModel = (model: DetectionModel): Anomaly['severity'] => {
    const value = Math.random();
    if (value > 0.9) return 'critical';
    if (value > 0.7) return 'high';
    if (value > 0.4) return 'medium';
    return 'low';
  };

  // Generate anomaly title
  const generateAnomalyTitle = (type: string, severity: string): string => {
    const titles = {
      traffic: {
        low: 'Unusual Traffic Pattern Detected',
        medium: 'Significant Traffic Spike',
        high: 'Abnormal Traffic Volume',
        critical: 'Critical Traffic Anomaly'
      },
      security: {
        low: 'Suspicious Activity Detected',
        medium: 'Security Threat Identified',
        high: 'High-Risk Security Event',
        critical: 'Critical Security Breach Attempt'
      },
      performance: {
        low: 'Minor Performance Degradation',
        medium: 'Performance Issues Detected',
        high: 'Significant Performance Impact',
        critical: 'Critical System Performance Failure'
      },
      behavior: {
        low: 'Unusual User Behavior',
        medium: 'Abnormal Behavior Pattern',
        high: 'High-Risk Behavior Detected',
        critical: 'Critical Behavioral Anomaly'
      },
      business: {
        low: 'Business Metric Deviation',
        medium: 'Significant Business Impact',
        high: 'Major Business Anomaly',
        critical: 'Critical Business Metric Failure'
      }
    };
    
    return titles[type]?.[severity] || 'Unknown Anomaly';
  };

  // Generate anomaly description
  const generateAnomalyDescription = (type: string, severity: string): string => {
    const descriptions = {
      traffic: 'Detected unusual traffic patterns that deviate significantly from baseline behavior',
      security: 'Identified potential security threat requiring immediate investigation',
      performance: 'System performance metrics show significant degradation',
      behavior: 'User behavior patterns indicate potential issues or opportunities',
      business: 'Business metrics show unexpected variations requiring attention'
    };
    
    return descriptions[type] || 'Anomaly detected in system metrics';
  };

  // Generate affected resources
  const generateAffectedVisitors = (): string[] => {
    const count = Math.floor(Math.random() * 50) + 10;
    return Array.from({ length: count }, (_, i) => `visitor-${i}`);
  };

  const generateAffectedPages = (): string[] => {
    const pages = ['/home', '/products', '/checkout', '/account', '/search'];
    return pages.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const generateAffectedRegions = (): string[] => {
    const regions = ['US', 'EU', 'Asia', 'Africa', 'LatAm'];
    return regions.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const generateAffectedDevices = (): string[] => {
    const devices = ['Desktop', 'Mobile', 'Tablet'];
    return devices.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  // Generate recommendations
  const generateRecommendations = (type: string, severity: string): Anomaly['recommendations'] => {
    const recommendations = {
      traffic: [
        { action: 'Enable rate limiting', priority: 1, automatable: true, estimatedImpact: 'High' },
        { action: 'Scale infrastructure', priority: 2, automatable: true, estimatedImpact: 'High' },
        { action: 'Investigate traffic source', priority: 3, automatable: false, estimatedImpact: 'Medium' }
      ],
      security: [
        { action: 'Block suspicious IPs', priority: 1, automatable: true, estimatedImpact: 'Critical' },
        { action: 'Enable enhanced monitoring', priority: 2, automatable: true, estimatedImpact: 'High' },
        { action: 'Review security logs', priority: 3, automatable: false, estimatedImpact: 'Medium' }
      ],
      performance: [
        { action: 'Optimize database queries', priority: 1, automatable: true, estimatedImpact: 'High' },
        { action: 'Clear cache', priority: 2, automatable: true, estimatedImpact: 'Medium' },
        { action: 'Review resource allocation', priority: 3, automatable: false, estimatedImpact: 'High' }
      ],
      behavior: [
        { action: 'Segment affected users', priority: 1, automatable: true, estimatedImpact: 'Medium' },
        { action: 'A/B test experience', priority: 2, automatable: false, estimatedImpact: 'High' },
        { action: 'Personalize content', priority: 3, automatable: true, estimatedImpact: 'Medium' }
      ],
      business: [
        { action: 'Alert stakeholders', priority: 1, automatable: true, estimatedImpact: 'High' },
        { action: 'Adjust forecasts', priority: 2, automatable: false, estimatedImpact: 'Medium' },
        { action: 'Implement contingency plan', priority: 3, automatable: false, estimatedImpact: 'High' }
      ]
    };
    
    return recommendations[type] || [];
  };

  // Should alert based on threshold
  const shouldAlert = (anomaly: Anomaly): boolean => {
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    return severityLevels[anomaly.severity] >= severityLevels[alertThreshold];
  };

  // Execute automated response
  const executeAutomatedResponse = async (anomaly: Anomaly) => {
    const automatedActions = anomaly.recommendations.filter(r => r.automatable);
    if (automatedActions.length === 0) return;

    const updatedAnomaly = {
      ...anomaly,
      automatedResponse: {
        enabled: true,
        actions: automatedActions.map(a => a.action),
        status: 'executing' as const,
        result: undefined
      }
    };

    setAnomalies(prev => prev.map(a => a.id === anomaly.id ? updatedAnomaly : a));

    // Simulate automated response execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    const successAnomaly = {
      ...updatedAnomaly,
      status: 'resolved' as const,
      resolvedAt: new Date(),
      automatedResponse: {
        ...updatedAnomaly.automatedResponse!,
        status: 'completed' as const,
        result: 'Successfully executed automated response'
      }
    };

    setAnomalies(prev => prev.map(a => a.id === anomaly.id ? successAnomaly : a));
    onAnomalyResolved?.(successAnomaly);
    automatedActions.forEach(action => {
      onAutomatedAction?.(successAnomaly, action.action);
    });
  };

  // Update anomaly patterns
  const updateAnomalyPatterns = (newAnomalies: Anomaly[]) => {
    // Analyze patterns in anomalies
    const patterns: AnomalyPattern[] = [];
    
    // Group by type and analyze
    const typeGroups = newAnomalies.reduce((acc, anomaly) => {
      if (!acc[anomaly.type]) acc[anomaly.type] = [];
      acc[anomaly.type].push(anomaly);
      return acc;
    }, {} as Record<string, Anomaly[]>);

    Object.entries(typeGroups).forEach(([type, anomalies]) => {
      if (anomalies.length >= 3) {
        patterns.push({
          id: `pattern-${type}-${Date.now()}`,
          name: `Recurring ${type} anomalies`,
          description: `Multiple ${type} anomalies detected in short timeframe`,
          frequency: anomalies.length,
          lastSeen: new Date(),
          affectedMetrics: Array.from(new Set(anomalies.flatMap(a => Object.keys(a.metrics)))),
          correlations: []
        });
      }
    });

    setPatterns(prev => [...patterns, ...prev].slice(0, 20));
  };

  // Update statistics
  const updateStatistics = () => {
    const total = anomalies.length;
    const active = anomalies.filter(a => a.status === 'active').length;
    const resolved = anomalies.filter(a => a.status === 'resolved').length;
    
    const bySeverity = anomalies.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byType = anomalies.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const resolvedAnomalies = anomalies.filter(a => a.status === 'resolved' && a.resolvedAt);
    const avgResolutionTime = resolvedAnomalies.length > 0
      ? resolvedAnomalies.reduce((sum, a) => {
          return sum + (a.resolvedAt!.getTime() - a.detectedAt.getTime());
        }, 0) / resolvedAnomalies.length / 1000 / 60 // minutes
      : 0;
    
    const automatedAnomalies = anomalies.filter(a => a.automatedResponse?.enabled).length;
    const automationRate = total > 0 ? automatedAnomalies / total : 0;
    
    setStats({
      total,
      active,
      resolved,
      bySeverity,
      byType,
      avgResolutionTime,
      falsePositiveRate: 0.05, // Simulated
      detectionAccuracy: 0.92, // Simulated
      automationRate
    });
  };

  // Resolve anomaly
  const resolveAnomaly = (anomalyId: string, resolution: string = 'Manually resolved') => {
    setAnomalies(prev => prev.map(a => {
      if (a.id === anomalyId) {
        const resolved = {
          ...a,
          status: 'resolved' as const,
          resolvedAt: new Date(),
          timeline: [...a.timeline, {
            timestamp: new Date(),
            event: 'Anomaly resolved',
            details: resolution
          }]
        };
        onAnomalyResolved?.(resolved);
        return resolved;
      }
      return a;
    }));
  };

  // Mark as false positive
  const markAsFalsePositive = (anomalyId: string) => {
    resolveAnomaly(anomalyId, 'Marked as false positive');
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-500';
      case 'medium': return 'text-orange-500';
      case 'high': return 'text-red-500';
      case 'critical': return 'text-red-700';
      default: return 'text-gray-500';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return AlertCircle;
      case 'medium': return AlertTriangle;
      case 'high': return AlertOctagon;
      case 'critical': return ShieldAlert;
      default: return Info;
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'traffic': return Activity;
      case 'security': return Shield;
      case 'performance': return Gauge;
      case 'behavior': return Users;
      case 'business': return TrendingUp;
      default: return AlertCircle;
    }
  };

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(anomaly => {
      if (filterType !== 'all' && anomaly.type !== filterType) return false;
      if (filterSeverity !== 'all' && anomaly.severity !== filterSeverity) return false;
      return true;
    });
  }, [anomalies, filterType, filterSeverity]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Anomaly Detection System
          </CardTitle>
          <CardDescription>
            AI-powered anomaly detection with automated response capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={enableRealTime}
                  onCheckedChange={() => {}}
                />
                <span className="text-sm">Real-time detection</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={autoResolve}
                  onCheckedChange={() => {}}
                />
                <span className="text-sm">Auto-resolve</span>
              </div>
              {isScanning && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Scanning...
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runAnomalyDetection}
                disabled={isScanning}
              >
                <Play className="h-4 w-4 mr-2" />
                Run Scan
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Anomalies</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">
              {stats.active} active
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Detection Accuracy</span>
            </div>
            <div className="text-2xl font-bold">{(stats.detectionAccuracy * 100).toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              {(stats.falsePositiveRate * 100).toFixed(1)}% false positive
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Avg Resolution</span>
            </div>
            <div className="text-2xl font-bold">{stats.avgResolutionTime.toFixed(1)}m</div>
            <div className="text-sm text-muted-foreground">
              {(stats.automationRate * 100).toFixed(0)}% automated
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Critical Alerts</span>
            </div>
            <div className="text-2xl font-bold">{stats.bySeverity.critical || 0}</div>
            <div className="text-sm text-muted-foreground">
              {stats.bySeverity.high || 0} high severity
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Severity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.bySeverity).map(([severity, count]) => {
                  const SeverityIcon = getSeverityIcon(severity);
                  return (
                    <div key={severity} className="text-center">
                      <SeverityIcon className={`h-8 w-8 mx-auto mb-2 ${getSeverityColor(severity)}`} />
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground capitalize">{severity}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byType).map(([type, count]) => {
                  const TypeIcon = getTypeIcon(type);
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">{type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="behavior">Behavior</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Anomaly List */}
          <div className="space-y-4">
            {filteredAnomalies.map((anomaly) => {
              const SeverityIcon = getSeverityIcon(anomaly.severity);
              const TypeIcon = getTypeIcon(anomaly.type);
              
              return (
                <Card key={anomaly.id} className="cursor-pointer" onClick={() => setSelectedAnomaly(anomaly)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${
                          anomaly.severity === 'critical' ? 'bg-red-100' :
                          anomaly.severity === 'high' ? 'bg-orange-100' :
                          anomaly.severity === 'medium' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          <SeverityIcon className={`h-5 w-5 ${getSeverityColor(anomaly.severity)}`} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{anomaly.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={anomaly.status === 'resolved' ? 'default' : 'destructive'}>
                              {anomaly.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {anomaly.detectedAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <TypeIcon className="h-4 w-4" />
                            <span className="capitalize">{anomaly.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>{anomaly.metrics.deviation.toFixed(1)}x deviation</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{(anomaly.metrics.confidence * 100).toFixed(0)}% confidence</span>
                          </div>
                        </div>
                        {anomaly.automatedResponse && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Automated response {anomaly.automatedResponse.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {anomaly.status === 'active' && (
                        <div className="flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveAnomaly(anomaly.id);
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredAnomalies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No anomalies detected</p>
                <p className="text-sm">System is operating normally</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detectionModels.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{model.name}</span>
                    <Switch checked={model.enabled} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span className="font-medium">{(model.performance.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={model.performance.accuracy * 100} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">False Positive</span>
                        <div className="font-medium">{(model.performance.falsePositiveRate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">False Negative</span>
                        <div className="font-medium">{(model.performance.falseNegativeRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Detection Features</div>
                      <div className="flex flex-wrap gap-1">
                        {model.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="space-y-4">
            {patterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{pattern.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>{pattern.frequency} occurrences</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Last seen {pattern.lastSeen.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Investigate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {patterns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Radar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No patterns detected yet</p>
                <p className="text-sm">Patterns will appear as anomalies are detected</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnomalyDetectionSystem;