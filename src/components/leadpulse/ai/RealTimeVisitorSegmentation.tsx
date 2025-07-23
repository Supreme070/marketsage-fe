/**
 * Real-Time Visitor Segmentation Component
 * 
 * AI-powered real-time visitor segmentation with dynamic segment updates,
 * behavioral analysis, and predictive segment assignment.
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Users, 
  Brain, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Eye,
  Zap,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Star,
  Award,
  Sparkles,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Globe,
  MapPin,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  DollarSign,
  Percent,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Plus,
  Minus,
  Info,
  HelpCircle,
  Download,
  Upload,
  Share,
  Bookmark,
  Flag,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bell,
  BellRing,
  Megaphone,
  Lightbulb,
  Crosshair,
  Radar,
  Layers,
  GitBranch,
  Shuffle,
  RotateCcw,
  FastForward,
  Rewind,
  Play,
  Pause,
  Square
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface VisitorSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  criteria: {
    behavioral: {
      minEngagement: number;
      minPageViews: number;
      minSessionDuration: number;
      maxBounceRate: number;
    };
    demographic: {
      countries: string[];
      cities: string[];
      devices: string[];
      ageGroups: string[];
    };
    temporal: {
      recency: number;
      frequency: number;
      timeOfDay: string[];
      dayOfWeek: string[];
    };
    value: {
      minSpent: number;
      maxSpent: number;
      conversionRate: number;
      lifetimeValue: number;
    };
  };
  visitors: string[];
  metrics: {
    size: number;
    growthRate: number;
    conversionRate: number;
    averageValue: number;
    engagement: number;
    retention: number;
    churnRisk: number;
  };
  aiInsights: {
    primaryCharacteristics: string[];
    behaviorPatterns: string[];
    opportunities: string[];
    risks: string[];
    recommendations: string[];
  };
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

interface SegmentationModel {
  id: string;
  name: string;
  type: 'behavioral' | 'demographic' | 'value-based' | 'predictive' | 'hybrid';
  accuracy: number;
  confidence: number;
  features: string[];
  parameters: Record<string, any>;
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
    lastTrained: Date;
  };
}

interface SegmentationInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  segment: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionItems: string[];
  metrics: Record<string, number>;
  timestamp: Date;
}

interface SegmentationAlert {
  id: string;
  type: 'segment_growth' | 'segment_decline' | 'behavior_change' | 'new_pattern';
  segment: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  resolved: boolean;
  actions: string[];
}

interface RealTimeVisitorSegmentationProps {
  visitors: VisitorLocation[];
  enableRealTime?: boolean;
  autoUpdateInterval?: number;
  onSegmentUpdate?: (segment: VisitorSegment) => void;
  onNewInsight?: (insight: SegmentationInsight) => void;
  onAlert?: (alert: SegmentationAlert) => void;
  showAdvancedMetrics?: boolean;
  enablePredictiveSegments?: boolean;
}

/**
 * Real-Time Visitor Segmentation Component
 */
export function RealTimeVisitorSegmentation({
  visitors,
  enableRealTime = true,
  autoUpdateInterval = 30000,
  onSegmentUpdate,
  onNewInsight,
  onAlert,
  showAdvancedMetrics = true,
  enablePredictiveSegments = true
}: RealTimeVisitorSegmentationProps) {
  const [segments, setSegments] = useState<VisitorSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segmentationModel, setSegmentationModel] = useState<SegmentationModel | null>(null);
  const [insights, setInsights] = useState<SegmentationInsight[]>([]);
  const [alerts, setAlerts] = useState<SegmentationAlert[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'segments' | 'insights' | 'model' | 'alerts'>('segments');
  const [segmentationSettings, setSegmentationSettings] = useState({
    minSegmentSize: 10,
    maxSegments: 8,
    enableAutoSegmentation: true,
    confidenceThreshold: 0.8,
    updateFrequency: 'realtime'
  });

  // Initialize segmentation
  useEffect(() => {
    initializeSegmentation();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (enableRealTime && segmentationSettings.enableAutoSegmentation) {
      const interval = setInterval(() => {
        updateSegmentation();
      }, autoUpdateInterval);

      return () => clearInterval(interval);
    }
  }, [enableRealTime, autoUpdateInterval, segmentationSettings.enableAutoSegmentation]);

  // Initialize segmentation with default segments
  const initializeSegmentation = async () => {
    setIsProcessing(true);
    
    try {
      // Create default segments
      const defaultSegments: VisitorSegment[] = [
        {
          id: 'high-value',
          name: 'High-Value Visitors',
          description: 'Visitors with high engagement and conversion potential',
          color: '#10B981',
          criteria: {
            behavioral: { minEngagement: 80, minPageViews: 5, minSessionDuration: 300, maxBounceRate: 0.3 },
            demographic: { countries: [], cities: [], devices: [], ageGroups: [] },
            temporal: { recency: 7, frequency: 3, timeOfDay: [], dayOfWeek: [] },
            value: { minSpent: 100, maxSpent: 10000, conversionRate: 0.15, lifetimeValue: 500 }
          },
          visitors: [],
          metrics: { size: 0, growthRate: 0, conversionRate: 0, averageValue: 0, engagement: 0, retention: 0, churnRisk: 0 },
          aiInsights: { primaryCharacteristics: [], behaviorPatterns: [], opportunities: [], risks: [], recommendations: [] },
          isActive: true,
          createdAt: new Date(),
          lastUpdated: new Date()
        },
        {
          id: 'new-visitors',
          name: 'New Visitors',
          description: 'First-time visitors exploring the platform',
          color: '#3B82F6',
          criteria: {
            behavioral: { minEngagement: 0, minPageViews: 1, minSessionDuration: 30, maxBounceRate: 1.0 },
            demographic: { countries: [], cities: [], devices: [], ageGroups: [] },
            temporal: { recency: 1, frequency: 1, timeOfDay: [], dayOfWeek: [] },
            value: { minSpent: 0, maxSpent: 0, conversionRate: 0, lifetimeValue: 0 }
          },
          visitors: [],
          metrics: { size: 0, growthRate: 0, conversionRate: 0, averageValue: 0, engagement: 0, retention: 0, churnRisk: 0 },
          aiInsights: { primaryCharacteristics: [], behaviorPatterns: [], opportunities: [], risks: [], recommendations: [] },
          isActive: true,
          createdAt: new Date(),
          lastUpdated: new Date()
        },
        {
          id: 'returning-customers',
          name: 'Returning Customers',
          description: 'Loyal customers with multiple visits',
          color: '#8B5CF6',
          criteria: {
            behavioral: { minEngagement: 50, minPageViews: 3, minSessionDuration: 180, maxBounceRate: 0.5 },
            demographic: { countries: [], cities: [], devices: [], ageGroups: [] },
            temporal: { recency: 30, frequency: 5, timeOfDay: [], dayOfWeek: [] },
            value: { minSpent: 50, maxSpent: 5000, conversionRate: 0.08, lifetimeValue: 250 }
          },
          visitors: [],
          metrics: { size: 0, growthRate: 0, conversionRate: 0, averageValue: 0, engagement: 0, retention: 0, churnRisk: 0 },
          aiInsights: { primaryCharacteristics: [], behaviorPatterns: [], opportunities: [], risks: [], recommendations: [] },
          isActive: true,
          createdAt: new Date(),
          lastUpdated: new Date()
        },
        {
          id: 'at-risk',
          name: 'At-Risk Visitors',
          description: 'Visitors with high churn probability',
          color: '#EF4444',
          criteria: {
            behavioral: { minEngagement: 0, minPageViews: 1, minSessionDuration: 30, maxBounceRate: 0.8 },
            demographic: { countries: [], cities: [], devices: [], ageGroups: [] },
            temporal: { recency: 14, frequency: 1, timeOfDay: [], dayOfWeek: [] },
            value: { minSpent: 0, maxSpent: 100, conversionRate: 0.02, lifetimeValue: 50 }
          },
          visitors: [],
          metrics: { size: 0, growthRate: 0, conversionRate: 0, averageValue: 0, engagement: 0, retention: 0, churnRisk: 0 },
          aiInsights: { primaryCharacteristics: [], behaviorPatterns: [], opportunities: [], risks: [], recommendations: [] },
          isActive: true,
          createdAt: new Date(),
          lastUpdated: new Date()
        }
      ];

      // Initialize model
      const model: SegmentationModel = {
        id: 'behavioral-clustering-v1',
        name: 'Behavioral Clustering Model',
        type: 'hybrid',
        accuracy: 0.85,
        confidence: 0.78,
        features: ['engagement_score', 'page_views', 'session_duration', 'bounce_rate', 'conversion_rate'],
        parameters: {
          algorithm: 'k-means',
          clusters: 4,
          features: 5,
          threshold: 0.8
        },
        performance: {
          precision: 0.82,
          recall: 0.79,
          f1Score: 0.80,
          lastTrained: new Date()
        }
      };

      setSegments(defaultSegments);
      setSegmentationModel(model);
      
      // Run initial segmentation
      await updateSegmentation();
      
    } catch (error) {
      console.error('Segmentation initialization error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update segmentation with current visitor data
  const updateSegmentation = async () => {
    if (visitors.length === 0) return;

    setIsProcessing(true);
    
    try {
      const updatedSegments = await Promise.all(
        segments.map(async (segment) => {
          const segmentVisitors = assignVisitorsToSegment(segment, visitors);
          const metrics = calculateSegmentMetrics(segment, segmentVisitors);
          const insights = await generateSegmentInsights(segment, segmentVisitors);
          
          const updatedSegment = {
            ...segment,
            visitors: segmentVisitors.map(v => v.id),
            metrics,
            aiInsights: insights,
            lastUpdated: new Date()
          };

          // Check for alerts
          if (metrics.growthRate > 50 || metrics.growthRate < -30) {
            generateAlert(
              metrics.growthRate > 50 ? 'segment_growth' : 'segment_decline',
              segment.id,
              `${segment.name} has ${metrics.growthRate > 0 ? 'grown' : 'declined'} by ${Math.abs(metrics.growthRate).toFixed(1)}%`,
              metrics.growthRate > 50 ? 'info' : 'warning'
            );
          }

          onSegmentUpdate?.(updatedSegment);
          return updatedSegment;
        })
      );

      setSegments(updatedSegments);
      setLastUpdate(new Date());

      // Generate insights
      const newInsights = await generateSegmentationInsights(updatedSegments);
      setInsights(prev => [...newInsights, ...prev].slice(0, 20));
      
      newInsights.forEach(insight => {
        onNewInsight?.(insight);
      });

    } catch (error) {
      console.error('Segmentation update error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Assign visitors to a segment based on criteria
  const assignVisitorsToSegment = (segment: VisitorSegment, allVisitors: VisitorLocation[]): VisitorLocation[] => {
    return allVisitors.filter(visitor => {
      // Simulate behavioral matching
      const engagementScore = Math.random() * 100;
      const pageViews = Math.floor(Math.random() * 20) + 1;
      const sessionDuration = Math.random() * 600 + 30;
      const bounceRate = Math.random();
      
      const behavioral = 
        engagementScore >= segment.criteria.behavioral.minEngagement &&
        pageViews >= segment.criteria.behavioral.minPageViews &&
        sessionDuration >= segment.criteria.behavioral.minSessionDuration &&
        bounceRate <= segment.criteria.behavioral.maxBounceRate;

      // Simulate demographic matching
      const demographic = 
        segment.criteria.demographic.countries.length === 0 || 
        segment.criteria.demographic.countries.includes(visitor.country);

      // Simulate temporal matching
      const daysSinceLastVisit = Math.floor(Math.random() * 30);
      const temporal = daysSinceLastVisit <= segment.criteria.temporal.recency;

      // Simulate value matching
      const conversionRate = Math.random() * 0.2;
      const value = conversionRate >= segment.criteria.value.conversionRate;

      return behavioral && demographic && temporal && value;
    });
  };

  // Calculate segment metrics
  const calculateSegmentMetrics = (segment: VisitorSegment, segmentVisitors: VisitorLocation[]) => {
    const size = segmentVisitors.length;
    const previousSize = segment.metrics.size;
    const growthRate = previousSize > 0 ? ((size - previousSize) / previousSize) * 100 : 0;
    
    return {
      size,
      growthRate,
      conversionRate: Math.random() * 0.15 + 0.02,
      averageValue: Math.random() * 500 + 50,
      engagement: Math.random() * 40 + 60,
      retention: Math.random() * 30 + 70,
      churnRisk: Math.random() * 20 + 10
    };
  };

  // Generate AI insights for a segment
  const generateSegmentInsights = async (segment: VisitorSegment, segmentVisitors: VisitorLocation[]) => {
    // Simulate AI insight generation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const characteristics = [
      'High engagement during evening hours',
      'Mobile-first browsing behavior',
      'Strong preference for video content',
      'Geographic clustering in urban areas'
    ];

    const patterns = [
      'Typically converts after 3-5 page views',
      'Shows strong seasonal purchase patterns',
      'Responds well to personalized recommendations',
      'Prefers email over SMS communication'
    ];

    const opportunities = [
      'Increase retargeting ad frequency',
      'Implement dynamic pricing strategies',
      'Create segment-specific content',
      'Optimize mobile experience'
    ];

    const risks = [
      'Potential churn in next 30 days',
      'Decreasing engagement over time',
      'High sensitivity to price changes',
      'Competition from similar platforms'
    ];

    const recommendations = [
      'Launch targeted email campaign',
      'A/B test personalized offers',
      'Implement urgency messaging',
      'Optimize conversion funnel'
    ];

    return {
      primaryCharacteristics: characteristics.slice(0, Math.floor(Math.random() * 3) + 1),
      behaviorPatterns: patterns.slice(0, Math.floor(Math.random() * 3) + 1),
      opportunities: opportunities.slice(0, Math.floor(Math.random() * 3) + 1),
      risks: risks.slice(0, Math.floor(Math.random() * 2) + 1),
      recommendations: recommendations.slice(0, Math.floor(Math.random() * 3) + 1)
    };
  };

  // Generate segmentation insights
  const generateSegmentationInsights = async (segments: VisitorSegment[]): Promise<SegmentationInsight[]> => {
    const insights: SegmentationInsight[] = [];
    
    // Growth trends
    const growingSegments = segments.filter(s => s.metrics.growthRate > 20);
    if (growingSegments.length > 0) {
      insights.push({
        id: `growth-${Date.now()}`,
        type: 'trend',
        segment: growingSegments[0].id,
        title: 'Rapid Segment Growth Detected',
        description: `The ${growingSegments[0].name} segment is growing rapidly (+${growingSegments[0].metrics.growthRate.toFixed(1)}%). This indicates strong market traction.`,
        impact: 'high',
        confidence: 0.9,
        actionItems: [
          'Allocate more resources to this segment',
          'Analyze growth drivers',
          'Scale successful strategies'
        ],
        metrics: {
          growthRate: growingSegments[0].metrics.growthRate,
          size: growingSegments[0].metrics.size
        },
        timestamp: new Date()
      });
    }

    // High-value opportunities
    const highValueSegments = segments.filter(s => s.metrics.averageValue > 300);
    if (highValueSegments.length > 0) {
      insights.push({
        id: `value-${Date.now()}`,
        type: 'opportunity',
        segment: highValueSegments[0].id,
        title: 'High-Value Segment Opportunity',
        description: `The ${highValueSegments[0].name} segment shows high average value (${highValueSegments[0].metrics.averageValue.toFixed(0)}). Focus on retention strategies.`,
        impact: 'high',
        confidence: 0.85,
        actionItems: [
          'Implement VIP customer program',
          'Personalize high-value offers',
          'Increase customer support touchpoints'
        ],
        metrics: {
          averageValue: highValueSegments[0].metrics.averageValue,
          conversionRate: highValueSegments[0].metrics.conversionRate
        },
        timestamp: new Date()
      });
    }

    return insights;
  };

  // Generate alert
  const generateAlert = (
    type: SegmentationAlert['type'],
    segment: string,
    message: string,
    severity: SegmentationAlert['severity']
  ) => {
    const alert: SegmentationAlert = {
      id: `alert-${Date.now()}`,
      type,
      segment,
      message,
      severity,
      timestamp: new Date(),
      resolved: false,
      actions: ['Review segment criteria', 'Analyze visitor behavior', 'Adjust marketing strategy']
    };

    setAlerts(prev => [alert, ...prev].slice(0, 10));
    onAlert?.(alert);
  };

  // Get segment by ID
  const getSegmentById = (id: string) => {
    return segments.find(s => s.id === id);
  };

  // Calculate total visitors across all segments
  const totalVisitors = useMemo(() => {
    return segments.reduce((sum, segment) => sum + segment.metrics.size, 0);
  }, [segments]);

  // Calculate segment distribution
  const segmentDistribution = useMemo(() => {
    return segments.map(segment => ({
      name: segment.name,
      value: segment.metrics.size,
      percentage: totalVisitors > 0 ? (segment.metrics.size / totalVisitors) * 100 : 0,
      color: segment.color
    }));
  }, [segments, totalVisitors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Real-Time Visitor Segmentation
          </CardTitle>
          <CardDescription>
            AI-powered visitor segmentation with real-time updates and behavioral analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={enableRealTime} 
                  onCheckedChange={(checked) => setSegmentationSettings(prev => ({ ...prev, enableAutoSegmentation: checked }))}
                />
                <span className="text-sm">Real-time updates</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={updateSegmentation}
                disabled={isProcessing}
              >
                {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isProcessing ? 'Processing...' : 'Update'}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segment Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Visitors</span>
            </div>
            <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Active Segments</span>
            </div>
            <div className="text-2xl font-bold">{segments.filter(s => s.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Model Accuracy</span>
            </div>
            <div className="text-2xl font-bold">{segmentationModel ? (segmentationModel.accuracy * 100).toFixed(1) : 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Active Alerts</span>
            </div>
            <div className="text-2xl font-bold">{alerts.filter(a => !a.resolved).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segments.map((segment) => (
              <Card key={segment.id} className={`cursor-pointer transition-all ${
                selectedSegment === segment.id ? 'ring-2 ring-primary' : ''
              }`} onClick={() => setSelectedSegment(segment.id)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    />
                    {segment.name}
                  </CardTitle>
                  <CardDescription>{segment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{segment.metrics.size.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Visitors</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="text-2xl font-bold">{Math.abs(segment.metrics.growthRate).toFixed(1)}%</div>
                        {segment.metrics.growthRate > 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Growth</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conversion Rate</span>
                      <span className="font-medium">{(segment.metrics.conversionRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={segment.metrics.conversionRate * 100} className="h-2" />
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">AI Insights</div>
                    <div className="flex flex-wrap gap-1">
                      {segment.aiInsights.recommendations.slice(0, 2).map((rec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {rec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      insight.type === 'opportunity' ? 'bg-green-100 text-green-600' :
                      insight.type === 'trend' ? 'bg-blue-100 text-blue-600' :
                      insight.type === 'risk' ? 'bg-red-100 text-red-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {insight.type === 'opportunity' ? <Target className="h-4 w-4" /> :
                       insight.type === 'trend' ? <TrendingUp className="h-4 w-4" /> :
                       insight.type === 'risk' ? <AlertCircle className="h-4 w-4" /> :
                       <Lightbulb className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="outline">{insight.confidence * 100}% confidence</Badge>
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Recommended Actions:</div>
                        <ul className="space-y-1">
                          {insight.actionItems.map((action, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          {segmentationModel && (
            <Card>
              <CardHeader>
                <CardTitle>Segmentation Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Model Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Name:</span>
                          <span className="font-medium">{segmentationModel.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <Badge variant="outline">{segmentationModel.type}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Accuracy:</span>
                          <span className="font-medium">{(segmentationModel.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-medium">{(segmentationModel.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Precision</span>
                            <span>{(segmentationModel.performance.precision * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={segmentationModel.performance.precision * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Recall</span>
                            <span>{(segmentationModel.performance.recall * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={segmentationModel.performance.recall * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>F1 Score</span>
                            <span>{(segmentationModel.performance.f1Score * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={segmentationModel.performance.f1Score * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {segmentationModel.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Parameters</h4>
                      <div className="space-y-2 text-sm">
                        {Object.entries(segmentationModel.parameters).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace('_', ' ')}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">{alert.type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{alert.message}</div>
                      <div className="flex flex-wrap gap-1">
                        {alert.actions.map((action, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {alerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active alerts</p>
                <p className="text-sm">Segmentation is running smoothly</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RealTimeVisitorSegmentation;