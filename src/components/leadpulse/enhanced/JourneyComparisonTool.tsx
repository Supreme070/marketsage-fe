/**
 * Journey Comparison Tool Component
 * 
 * Allows users to compare multiple visitor journeys side-by-side,
 * analyze patterns, and identify optimization opportunities.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Clock, 
  Eye, 
  MousePointer,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Zap,
  Brain,
  Star,
  Award,
  Activity,
  PieChart,
  Layers,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Minus,
  Maximize,
  Minimize,
  Search,
  Compare
} from 'lucide-react';
import type { VisitorJourney, PulseDataPoint } from '@/lib/leadpulse/dataProvider';

interface JourneyComparison {
  id: string;
  journeys: VisitorJourney[];
  metrics: {
    averageLength: number;
    conversionRate: number;
    engagementScore: number;
    dropOffRate: number;
    averageDuration: number;
  };
  commonPaths: Array<{
    path: string[];
    frequency: number;
    conversionRate: number;
  }>;
  divergencePoints: Array<{
    step: number;
    journeyA: string;
    journeyB: string;
    significance: 'high' | 'medium' | 'low';
  }>;
  insights: Array<{
    type: 'pattern' | 'difference' | 'opportunity';
    title: string;
    description: string;
    confidence: number;
  }>;
}

interface JourneyComparisonToolProps {
  journeys: VisitorJourney[];
  enableAI?: boolean;
  maxComparisons?: number;
  onComparisonUpdate?: (comparison: JourneyComparison) => void;
}

/**
 * Journey Comparison Tool Component
 */
export function JourneyComparisonTool({
  journeys,
  enableAI = true,
  maxComparisons = 4,
  onComparisonUpdate
}: JourneyComparisonToolProps) {
  const [selectedJourneys, setSelectedJourneys] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay' | 'metrics'>('side-by-side');
  const [filterCriteria, setFilterCriteria] = useState<'all' | 'converted' | 'dropped' | 'high-engagement'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filter journeys based on criteria
  const filteredJourneys = useMemo(() => {
    switch (filterCriteria) {
      case 'converted':
        return journeys.filter(j => j.pulseData.some(p => p.type === 'CONVERSION'));
      case 'dropped':
        return journeys.filter(j => !j.pulseData.some(p => p.type === 'CONVERSION'));
      case 'high-engagement':
        return journeys.filter(j => j.engagementScore > 70);
      default:
        return journeys;
    }
  }, [journeys, filterCriteria]);

  // Get selected journey objects
  const selectedJourneyObjects = useMemo(() => {
    return selectedJourneys.map(id => filteredJourneys.find(j => j.id === id)).filter(Boolean) as VisitorJourney[];
  }, [selectedJourneys, filteredJourneys]);

  // Perform journey comparison analysis
  const comparisonAnalysis = useMemo(() => {
    if (selectedJourneyObjects.length < 2) return null;

    const analysis: JourneyComparison = {
      id: `comparison-${Date.now()}`,
      journeys: selectedJourneyObjects,
      metrics: calculateComparisonMetrics(selectedJourneyObjects),
      commonPaths: findCommonPaths(selectedJourneyObjects),
      divergencePoints: findDivergencePoints(selectedJourneyObjects),
      insights: enableAI ? generateComparisonInsights(selectedJourneyObjects) : []
    };

    return analysis;
  }, [selectedJourneyObjects, enableAI]);

  // Update comparison when analysis changes
  useEffect(() => {
    if (comparisonAnalysis) {
      onComparisonUpdate?.(comparisonAnalysis);
    }
  }, [comparisonAnalysis, onComparisonUpdate]);

  // Add journey to comparison
  const addJourney = (journeyId: string) => {
    if (selectedJourneys.length < maxComparisons && !selectedJourneys.includes(journeyId)) {
      setSelectedJourneys([...selectedJourneys, journeyId]);
    }
  };

  // Remove journey from comparison
  const removeJourney = (journeyId: string) => {
    setSelectedJourneys(selectedJourneys.filter(id => id !== journeyId));
  };

  // Clear all comparisons
  const clearComparisons = () => {
    setSelectedJourneys([]);
  };

  // Auto-select interesting journeys
  const autoSelectJourneys = () => {
    const converted = filteredJourneys.filter(j => j.pulseData.some(p => p.type === 'CONVERSION'));
    const dropped = filteredJourneys.filter(j => !j.pulseData.some(p => p.type === 'CONVERSION'));
    const highEngagement = filteredJourneys.filter(j => j.engagementScore > 70);
    const lowEngagement = filteredJourneys.filter(j => j.engagementScore < 40);

    const interesting = [
      ...converted.slice(0, 1),
      ...dropped.slice(0, 1),
      ...highEngagement.slice(0, 1),
      ...lowEngagement.slice(0, 1)
    ].slice(0, maxComparisons);

    setSelectedJourneys(interesting.map(j => j.id));
  };

  // Run advanced AI analysis
  const runAdvancedAnalysis = async () => {
    if (!enableAI || selectedJourneyObjects.length < 2) return;

    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Analysis would update the comparison insights
      // For now, we'll just trigger a re-render
      setShowAdvanced(true);
    } catch (error) {
      console.error('Error running advanced analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export comparison data
  const exportComparison = () => {
    if (!comparisonAnalysis) return;

    const exportData = {
      comparison: comparisonAnalysis,
      selectedJourneys: selectedJourneyObjects,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journey-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Comparison Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Journey Comparison Tool
          </CardTitle>
          <CardDescription>
            Compare multiple visitor journeys to identify patterns and optimization opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filter and Selection */}
            <div className="flex items-center gap-4">
              <Select value={filterCriteria} onValueChange={setFilterCriteria}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter journeys" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Journeys</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="dropped">Dropped Off</SelectItem>
                  <SelectItem value="high-engagement">High Engagement</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={autoSelectJourneys}>
                <Brain className="h-4 w-4 mr-2" />
                Auto-Select
              </Button>
              
              <Button variant="outline" onClick={clearComparisons}>
                <Minus className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              
              {selectedJourneys.length >= 2 && (
                <Button onClick={exportComparison}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>

            {/* Selected Journeys */}
            <div className="flex flex-wrap gap-2">
              {selectedJourneyObjects.map(journey => (
                <Badge key={journey.id} variant="secondary" className="flex items-center gap-1">
                  {journey.id}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeJourney(journey.id)}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {selectedJourneys.length < maxComparisons && (
                <Select value="" onValueChange={addJourney}>
                  <SelectTrigger className="w-32">
                    <Plus className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredJourneys
                      .filter(j => !selectedJourneys.includes(j.id))
                      .map(journey => (
                        <SelectItem key={journey.id} value={journey.id}>
                          {journey.id}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Comparison Mode */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">View Mode:</span>
              <Tabs value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
                <TabsList>
                  <TabsTrigger value="side-by-side">Side-by-Side</TabsTrigger>
                  <TabsTrigger value="overlay">Overlay</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Analysis */}
      {comparisonAnalysis && (
        <>
          {/* Quick Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparison Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{comparisonAnalysis.metrics.averageLength}</div>
                  <div className="text-sm text-muted-foreground">Avg Length</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{comparisonAnalysis.metrics.conversionRate}%</div>
                  <div className="text-sm text-muted-foreground">Conversion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{comparisonAnalysis.metrics.engagementScore}</div>
                  <div className="text-sm text-muted-foreground">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{comparisonAnalysis.metrics.dropOffRate}%</div>
                  <div className="text-sm text-muted-foreground">Drop-off Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round(comparisonAnalysis.metrics.averageDuration / 60)}m</div>
                  <div className="text-sm text-muted-foreground">Avg Duration</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Views */}
          <Tabs value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
            <TabsContent value="side-by-side">
              <Card>
                <CardHeader>
                  <CardTitle>Side-by-Side Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedJourneyObjects.map(journey => (
                      <div key={journey.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Journey {journey.id}</h4>
                          <Badge variant={
                            journey.pulseData.some(p => p.type === 'CONVERSION') ? 'default' : 'secondary'
                          }>
                            {journey.pulseData.some(p => p.type === 'CONVERSION') ? 'Converted' : 'Dropped'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {journey.pulseData.map((pulse, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{pulse.title || pulse.url}</div>
                                <div className="text-xs text-muted-foreground">{pulse.type}</div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {pulse.value}s
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-medium">{journey.pulseData.length}</div>
                            <div className="text-muted-foreground">Steps</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{journey.engagementScore}</div>
                            <div className="text-muted-foreground">Engagement</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">
                              {Math.round(journey.pulseData.reduce((sum, p) => sum + (p.value || 0), 0) / 60)}m
                            </div>
                            <div className="text-muted-foreground">Duration</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overlay">
              <Card>
                <CardHeader>
                  <CardTitle>Overlay Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Journey paths overlaid */}
                    <div className="relative h-64 border rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Overlay visualization</p>
                          <p className="text-sm">Interactive overlay coming soon</p>
                        </div>
                      </div>
                    </div>

                    {/* Common paths */}
                    <div>
                      <h4 className="font-medium mb-3">Common Paths</h4>
                      <div className="space-y-2">
                        {comparisonAnalysis.commonPaths.map((path, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                {path.path.map((step, stepIndex) => (
                                  <React.Fragment key={stepIndex}>
                                    <span>{step}</span>
                                    {stepIndex < path.path.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {path.frequency}% frequency
                            </div>
                            <div className="text-sm text-green-600">
                              {path.conversionRate}% conversion
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Metrics Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Individual journey metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedJourneyObjects.map(journey => (
                        <div key={journey.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Journey {journey.id}</h4>
                            <Badge variant={
                              journey.pulseData.some(p => p.type === 'CONVERSION') ? 'default' : 'secondary'
                            }>
                              {journey.pulseData.some(p => p.type === 'CONVERSION') ? 'Converted' : 'Dropped'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Steps</span>
                              <span className="font-medium">{journey.pulseData.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Duration</span>
                              <span className="font-medium">
                                {Math.round(journey.pulseData.reduce((sum, p) => sum + (p.value || 0), 0) / 60)}m
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Engagement</span>
                              <span className="font-medium">{journey.engagementScore}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Device</span>
                              <span className="font-medium">{journey.device}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Location</span>
                              <span className="font-medium">{journey.location}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Divergence points */}
                    <div>
                      <h4 className="font-medium mb-3">Key Differences</h4>
                      <div className="space-y-2">
                        {comparisonAnalysis.divergencePoints.map((point, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <div className={`w-2 h-2 rounded-full ${
                              point.significance === 'high' ? 'bg-red-500' :
                              point.significance === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                Step {point.step}: {point.journeyA} vs {point.journeyB}
                              </div>
                            </div>
                            <Badge variant={
                              point.significance === 'high' ? 'destructive' :
                              point.significance === 'medium' ? 'default' : 'secondary'
                            }>
                              {point.significance} significance
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* AI Insights */}
          {enableAI && comparisonAnalysis.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Comparison Insights
                </CardTitle>
                <CardDescription>
                  Automated analysis of journey patterns and differences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparisonAnalysis.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        insight.type === 'pattern' ? 'bg-blue-100 text-blue-600' :
                        insight.type === 'difference' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {insight.type === 'pattern' ? <Activity className="h-4 w-4" /> :
                         insight.type === 'difference' ? <GitBranch className="h-4 w-4" /> :
                         <Target className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant="outline">{insight.confidence}% confidence</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {enableAI && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      onClick={runAdvancedAnalysis}
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Running Advanced Analysis...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Run Advanced AI Analysis
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {selectedJourneys.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Select 2 or more journeys to start comparing</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedJourneys.length === 1 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Compare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Select at least one more journey to compare</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Functions
function calculateComparisonMetrics(journeys: VisitorJourney[]) {
  const totalJourneys = journeys.length;
  const averageLength = journeys.reduce((sum, j) => sum + j.pulseData.length, 0) / totalJourneys;
  const conversions = journeys.filter(j => j.pulseData.some(p => p.type === 'CONVERSION')).length;
  const conversionRate = (conversions / totalJourneys) * 100;
  const engagementScore = journeys.reduce((sum, j) => sum + j.engagementScore, 0) / totalJourneys;
  const dropOffRate = ((totalJourneys - conversions) / totalJourneys) * 100;
  const averageDuration = journeys.reduce((sum, j) => 
    sum + j.pulseData.reduce((jSum, p) => jSum + (p.value || 0), 0), 0
  ) / totalJourneys;

  return {
    averageLength: Math.round(averageLength * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
    engagementScore: Math.round(engagementScore),
    dropOffRate: Math.round(dropOffRate * 10) / 10,
    averageDuration: Math.round(averageDuration)
  };
}

function findCommonPaths(journeys: VisitorJourney[]) {
  // Simplified common path detection
  const paths = journeys.map(j => j.pulseData.map(p => p.url || p.title || 'unknown'));
  const pathMap = new Map<string, { count: number; conversions: number }>();
  
  paths.forEach((path, index) => {
    const pathStr = path.join(' → ');
    const existing = pathMap.get(pathStr) || { count: 0, conversions: 0 };
    existing.count++;
    if (journeys[index].pulseData.some(p => p.type === 'CONVERSION')) {
      existing.conversions++;
    }
    pathMap.set(pathStr, existing);
  });

  return Array.from(pathMap.entries())
    .filter(([_, data]) => data.count > 1)
    .map(([path, data]) => ({
      path: path.split(' → '),
      frequency: Math.round((data.count / journeys.length) * 100),
      conversionRate: Math.round((data.conversions / data.count) * 100)
    }))
    .slice(0, 5);
}

function findDivergencePoints(journeys: VisitorJourney[]) {
  // Simplified divergence detection
  const divergences = [];
  const maxLength = Math.max(...journeys.map(j => j.pulseData.length));
  
  for (let step = 0; step < maxLength; step++) {
    const stepData = journeys.map(j => j.pulseData[step]?.url || j.pulseData[step]?.title || 'end');
    const uniqueSteps = new Set(stepData);
    
    if (uniqueSteps.size > 1) {
      divergences.push({
        step: step + 1,
        journeyA: stepData[0],
        journeyB: stepData[1],
        significance: uniqueSteps.size > 2 ? 'high' : 'medium' as 'high' | 'medium' | 'low'
      });
    }
  }
  
  return divergences.slice(0, 5);
}

function generateComparisonInsights(journeys: VisitorJourney[]) {
  const insights = [];
  
  // Pattern insights
  const avgLength = journeys.reduce((sum, j) => sum + j.pulseData.length, 0) / journeys.length;
  if (avgLength > 6) {
    insights.push({
      type: 'pattern' as const,
      title: 'Long Journey Pattern Detected',
      description: `Compared journeys average ${avgLength.toFixed(1)} steps, indicating complex navigation paths.`,
      confidence: 78
    });
  }
  
  // Difference insights
  const engagementRange = Math.max(...journeys.map(j => j.engagementScore)) - Math.min(...journeys.map(j => j.engagementScore));
  if (engagementRange > 30) {
    insights.push({
      type: 'difference' as const,
      title: 'Significant Engagement Variation',
      description: `Engagement scores vary by ${engagementRange} points, suggesting different user experiences.`,
      confidence: 85
    });
  }
  
  // Opportunity insights
  const conversionRate = journeys.filter(j => j.pulseData.some(p => p.type === 'CONVERSION')).length / journeys.length;
  if (conversionRate < 0.5) {
    insights.push({
      type: 'opportunity' as const,
      title: 'Low Conversion Opportunity',
      description: `Only ${Math.round(conversionRate * 100)}% of compared journeys converted. Focus on conversion optimization.`,
      confidence: 92
    });
  }
  
  return insights;
}

export default JourneyComparisonTool;