/**
 * Advanced Journey Timeline Component
 * 
 * Enhanced visitor journey visualization with AI insights,
 * interactive elements, and performance optimization recommendations.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Target, 
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  BarChart3,
  Lightbulb,
  Star,
  Award,
  Timer,
  Activity,
  MapPin,
  Smartphone,
  Monitor,
  Globe,
  Filter,
  Download,
  Share,
  Maximize,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react';
import type { VisitorJourney, PulseDataPoint } from '@/lib/leadpulse/dataProvider';

interface JourneyInsight {
  id: string;
  type: 'optimization' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  confidence: number;
  aiGenerated: boolean;
}

interface JourneyMetrics {
  totalDuration: number;
  averagePageTime: number;
  bounceRate: number;
  conversionRate: number;
  engagementScore: number;
  dropOffPoints: Array<{
    step: string;
    percentage: number;
    reason: string;
  }>;
  optimizationOpportunities: Array<{
    area: string;
    potential: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface AdvancedJourneyTimelineProps {
  journey: VisitorJourney;
  journeyData?: VisitorJourney[];
  enableAI?: boolean;
  showMetrics?: boolean;
  showInsights?: boolean;
  enableExport?: boolean;
  enableComparison?: boolean;
  onJourneyUpdate?: (journey: VisitorJourney) => void;
}

/**
 * Advanced Journey Timeline Component
 */
export function AdvancedJourneyTimeline({
  journey,
  journeyData = [],
  enableAI = true,
  showMetrics = true,
  showInsights = true,
  enableExport = true,
  enableComparison = true,
  onJourneyUpdate
}: AdvancedJourneyTimelineProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [playbackMode, setPlaybackMode] = useState<'paused' | 'playing'>('paused');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [viewMode, setViewMode] = useState<'timeline' | 'flow' | 'heatmap'>('timeline');
  const [showAIInsights, setShowAIInsights] = useState(enableAI);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Process journey data for visualization
  const processedJourney = useMemo(() => {
    if (!journey.pulseData || journey.pulseData.length === 0) {
      return {
        steps: [],
        totalDuration: 0,
        insights: [],
        metrics: null as JourneyMetrics | null
      };
    }

    const steps = journey.pulseData.map((pulse, index) => ({
      ...pulse,
      stepNumber: index + 1,
      duration: pulse.value || 0,
      isConversion: pulse.type === 'CONVERSION',
      isDropOff: index === journey.pulseData.length - 1 && pulse.type !== 'CONVERSION',
      engagementLevel: calculateEngagementLevel(pulse, journey.pulseData),
      aiInsights: enableAI ? generateStepInsights(pulse, journey.pulseData, index) : []
    }));

    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    const insights = enableAI ? generateJourneyInsights(steps, journey) : [];
    const metrics = calculateJourneyMetrics(steps, journey);

    return {
      steps,
      totalDuration,
      insights,
      metrics
    };
  }, [journey, enableAI]);

  // Auto-playback for journey replay
  useEffect(() => {
    if (playbackMode === 'playing' && processedJourney.steps.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrame(prev => {
          const next = prev + 1;
          if (next >= processedJourney.steps.length) {
            setPlaybackMode('paused');
            return 0;
          }
          return next;
        });
      }, 1000 / playbackSpeed);

      return () => clearInterval(interval);
    }
  }, [playbackMode, playbackSpeed, processedJourney.steps.length]);

  // Generate AI insights for journey optimization
  const generateOptimizationInsights = async () => {
    if (!enableAI) return;

    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call the AI API
      const insights: JourneyInsight[] = [
        {
          id: '1',
          type: 'optimization',
          title: 'Page Load Time Optimization',
          description: 'Visitor spent 15 seconds on initial page load, indicating potential performance issues.',
          impact: 'high',
          recommendation: 'Optimize page load time to under 3 seconds to improve engagement.',
          confidence: 85,
          aiGenerated: true
        },
        {
          id: '2',
          type: 'warning',
          title: 'High Exit Rate on Pricing Page',
          description: 'Visitor exited after viewing pricing page for only 8 seconds.',
          impact: 'medium',
          recommendation: 'Consider A/B testing pricing page layout and value proposition.',
          confidence: 78,
          aiGenerated: true
        },
        {
          id: '3',
          type: 'success',
          title: 'Strong Product Page Engagement',
          description: 'Visitor showed high engagement on product pages with 2.5 minutes average time.',
          impact: 'low',
          recommendation: 'Leverage similar content strategy for other pages.',
          confidence: 92,
          aiGenerated: true
        }
      ];

      // Update journey with AI insights
      const updatedJourney = { ...journey, aiInsights: insights };
      onJourneyUpdate?.(updatedJourney);
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setSelectedStep(stepIndex);
    setCurrentFrame(stepIndex);
  };

  const handlePlaybackToggle = () => {
    setPlaybackMode(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const handleExportJourney = () => {
    // Export journey data
    const exportData = {
      journey: processedJourney,
      metrics: processedJourney.metrics,
      insights: processedJourney.insights,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journey-${journey.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Journey Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Journey Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Visitor {journey.id} • {processedJourney.steps.length} steps • {formatDuration(processedJourney.totalDuration)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlaybackToggle}
            disabled={processedJourney.steps.length === 0}
          >
            {playbackMode === 'playing' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            {playbackMode === 'playing' ? 'Pause' : 'Play'}
          </Button>
          {enableAI && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateOptimizationInsights}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              AI Insights
            </Button>
          )}
          {enableExport && (
            <Button variant="outline" size="sm" onClick={handleExportJourney}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Journey Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="flow">Flow Diagram</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Timeline View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Journey Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline Track */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
                
                {/* Timeline Steps */}
                <div className="space-y-4">
                  {processedJourney.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`relative flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedStep === index
                          ? 'border-primary bg-primary/5'
                          : currentFrame === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleStepClick(index)}
                    >
                      {/* Step Number */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.isConversion 
                          ? 'bg-green-500 text-white'
                          : step.isDropOff
                            ? 'bg-red-500 text-white'
                            : 'bg-primary text-primary-foreground'
                      }`}>
                        {step.stepNumber}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{step.title || step.url}</h4>
                            <p className="text-sm text-muted-foreground">
                              {step.type} • {formatDuration(step.duration)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Engagement Level */}
                            <Badge variant={
                              step.engagementLevel === 'high' ? 'default' :
                              step.engagementLevel === 'medium' ? 'secondary' : 'outline'
                            }>
                              {step.engagementLevel} engagement
                            </Badge>
                            {step.isConversion && (
                              <Badge variant="default" className="bg-green-500">
                                <Target className="h-3 w-3 mr-1" />
                                Conversion
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* AI Insights for Step */}
                        {showAIInsights && step.aiInsights && step.aiInsights.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border">
                            <div className="flex items-center gap-1 text-sm font-medium text-blue-700">
                              <Brain className="h-3 w-3" />
                              AI Insight
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                              {step.aiInsights[0].description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Arrow to Next Step */}
                      {index < processedJourney.steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Playback Progress */}
                {playbackMode === 'playing' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-full transition-all duration-1000"
                       style={{ width: `${(currentFrame / processedJourney.steps.length) * 100}%` }} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          {/* Flow Diagram View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Journey Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Flow diagram visualization</p>
                  <p className="text-sm">Interactive flow chart coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          {/* Heatmap View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Engagement Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Engagement heatmap visualization</p>
                  <p className="text-sm">Visual engagement analysis coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Journey Metrics */}
      {showMetrics && processedJourney.metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Journey Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatDuration(processedJourney.metrics.totalDuration)}</div>
                <div className="text-sm text-muted-foreground">Total Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{processedJourney.metrics.engagementScore}</div>
                <div className="text-sm text-muted-foreground">Engagement Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{processedJourney.metrics.bounceRate}%</div>
                <div className="text-sm text-muted-foreground">Bounce Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{processedJourney.metrics.conversionRate}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {showInsights && processedJourney.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedJourney.insights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    insight.type === 'optimization' ? 'bg-blue-100 text-blue-600' :
                    insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    insight.type === 'success' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {insight.type === 'optimization' ? <Lightbulb className="h-4 w-4" /> :
                     insight.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                     insight.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
                     <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {insight.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    <p className="text-sm font-medium text-green-600">{insight.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Functions
function calculateEngagementLevel(pulse: PulseDataPoint, allPulses: PulseDataPoint[]): 'high' | 'medium' | 'low' {
  const avgDuration = allPulses.reduce((sum, p) => sum + (p.value || 0), 0) / allPulses.length;
  const pulseDuration = pulse.value || 0;
  
  if (pulseDuration > avgDuration * 1.5) return 'high';
  if (pulseDuration > avgDuration * 0.8) return 'medium';
  return 'low';
}

function generateStepInsights(pulse: PulseDataPoint, allPulses: PulseDataPoint[], index: number): JourneyInsight[] {
  // Simulate AI-generated insights for individual steps
  const insights: JourneyInsight[] = [];
  
  if (pulse.value && pulse.value > 300) { // More than 5 minutes
    insights.push({
      id: `step-${index}-1`,
      type: 'optimization',
      title: 'Extended page time detected',
      description: `Visitor spent ${Math.round(pulse.value / 60)} minutes on this page`,
      impact: 'medium',
      recommendation: 'Consider adding more interactive elements or call-to-actions',
      confidence: 75,
      aiGenerated: true
    });
  }
  
  return insights;
}

function generateJourneyInsights(steps: any[], journey: VisitorJourney): JourneyInsight[] {
  const insights: JourneyInsight[] = [];
  
  // Add some sample insights based on journey patterns
  if (steps.length > 10) {
    insights.push({
      id: 'journey-1',
      type: 'warning',
      title: 'Long journey detected',
      description: `Visitor took ${steps.length} steps, indicating potential navigation issues`,
      impact: 'high',
      recommendation: 'Simplify navigation and reduce steps to conversion',
      confidence: 82,
      aiGenerated: true
    });
  }
  
  return insights;
}

function calculateJourneyMetrics(steps: any[], journey: VisitorJourney): JourneyMetrics {
  const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
  const averagePageTime = totalDuration / steps.length;
  
  return {
    totalDuration,
    averagePageTime,
    bounceRate: steps.length === 1 ? 100 : 0,
    conversionRate: steps.some(s => s.isConversion) ? 100 : 0,
    engagementScore: journey.engagementScore || 0,
    dropOffPoints: [],
    optimizationOpportunities: []
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default AdvancedJourneyTimeline;