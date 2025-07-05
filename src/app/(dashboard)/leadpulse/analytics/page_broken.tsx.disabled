'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, TrendingUp, Users, Target, RefreshCw, Sparkles } from 'lucide-react';
import TrafficConversionAnalytics from '@/components/leadpulse/TrafficConversionAnalytics';
import HeatmapHotspots from '@/components/leadpulse/HeatmapHotspots';
import ABTestingOptimizer from '@/components/leadpulse/ABTestingOptimizer';
import ThirdPartyAdTracker from '@/components/leadpulse/ThirdPartyAdTracker';
import LiveVisitorTracker from '@/components/leadpulse/LiveVisitorTracker';
import AIJourneyPredictor from '@/components/leadpulse/AIJourneyPredictor';
import RealTimeSimulator from '@/components/leadpulse/RealTimeSimulator';
import LivePulseIndicator from '@/components/leadpulse/LivePulseIndicator';
import AIBehavioralScoring from '@/components/leadpulse/AIBehavioralScoring';
import { useSupremeAI } from '@/hooks/useSupremeAI';
import { useAIIntelligenceOverview } from '@/hooks/useAIIntelligence';
import { useSession } from 'next-auth/react';
import { getActiveVisitors } from '@/lib/leadpulse/dataProvider';

export default function LeadPulseAnalytics() {
  const { data: session } = useSession();
  const { overview, loading: aiLoading, refresh: refreshAI } = useAIIntelligenceOverview(session?.user?.id);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real-time AI visitor data streaming
  const [aiScoredVisitors, setAiScoredVisitors] = useState<any[]>([]);
  const [streamingActive, setStreamingActive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Generate AI insights for analytics
  useEffect(() => {
    if (overview?.aiInsights) {
      setAiInsights(overview.aiInsights);
    }
  }, [overview]);

  // Real-time AI visitor data streaming
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const streamAIVisitorData = async () => {
      try {
        const visitors = await getActiveVisitors('1h');
        
        // Filter for visitors with AI data and high scores
        const aiEnhancedVisitors = visitors
          .filter(visitor => visitor.aiPrediction && visitor.aiEnhancement)
          .map(visitor => ({
            id: visitor.id,
            location: visitor.location,
            device: visitor.device,
            lastActive: visitor.lastActive,
            aiScore: visitor.aiEnhancement.aiScore,
            conversionProbability: visitor.aiPrediction.conversionProbability,
            behaviorPrediction: visitor.aiPrediction.behaviorPrediction,
            segmentPrediction: visitor.aiEnhancement.segmentPrediction,
            urgencyLevel: visitor.aiEnhancement.urgencyLevel,
            predictedValue: visitor.aiEnhancement.predictedValue,
            confidence: visitor.aiPrediction.confidence,
            recommendedActions: visitor.aiPrediction.recommendedActions
          }))
          .sort((a, b) => b.aiScore - a.aiScore) // Sort by AI score
          .slice(0, 10); // Top 10 AI-scored visitors
        
        setAiScoredVisitors(aiEnhancedVisitors);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error streaming AI visitor data:', error);
      }
    };

    if (streamingActive) {
      streamAIVisitorData(); // Initial load
      interval = setInterval(streamAIVisitorData, 15000); // Update every 15 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [streamingActive]);

  const handleRefreshAI = async () => {
    setRefreshing(true);
    await refreshAI();
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LeadPulse Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered analytics for traffic conversion, user behavior, and campaign performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LivePulseIndicator type="compact" showBehaviorAnalysis={true} />
          <Badge variant="outline" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI-Enhanced
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAI}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh AI
          </Button>
        </div>
      </div>

      {/* AI Insights Overview */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Intelligence Overview
            <LivePulseIndicator type="mini" className="ml-auto" />
          </CardTitle>
          <CardDescription>
            Real-time AI insights and predictions for your TechFlow Solutions analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">AI Confidence</div>
                <div className="text-lg font-bold">{Math.round((overview?.confidence || 0.75) * 100)}%</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Visitor Segments</div>
                <div className="text-lg font-bold">4 Active</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Predictions</div>
                <div className="text-lg font-bold">{aiInsights.length} Active</div>
              </div>
            </div>
          </div>
          
          {/* Live AI Behavior Analysis */}
          <LivePulseIndicator type="detailed" showBehaviorAnalysis={true} className="mb-4" />
          
          {aiInsights.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Current AI Insights:</h4>
              {aiInsights.slice(0, 2).map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.priority === 'high' ? 'bg-red-500' :
                    insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{insight.title}</div>
                    <div className="text-xs text-muted-foreground">{insight.description}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Confidence: {Math.round((insight.confidence || 0.85) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Real-Time Simulator Control */}
          <RealTimeSimulator 
            onStatusChange={(status) => {
              // Optional: Handle status changes for other components
              console.log('Simulator status changed:', status);
            }}
            updateInterval={2000}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Traffic Conversion Analytics
                <Badge variant="secondary" className="ml-auto">AI-Enhanced</Badge>
              </CardTitle>
              <CardDescription>
                AI-powered traffic conversion analysis with predictive insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficConversionAnalytics />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Heatmap & Hotspot Analysis
                <Badge variant="secondary" className="ml-auto">AI-Enhanced</Badge>
              </CardTitle>
              <CardDescription>
                AI-driven heatmap analysis with conversion influence scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapHotspots />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing & Optimization</CardTitle>
              <CardDescription>
                Compare variants and optimize for African markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ABTestingOptimizer />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Ad Attribution</CardTitle>
              <CardDescription>
                Track and analyze cross-platform ad performance and attribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThirdPartyAdTracker />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Behavioral Pattern Recognition
                </CardTitle>
                <CardDescription>
                  AI-identified visitor behavior patterns and segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Enterprise Visitors</div>
                      <div className="text-xl font-bold">15%</div>
                      <div className="text-xs text-green-600">+5% vs last month</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Conversion Probability</div>
                      <div className="text-xl font-bold">78%</div>
                      <div className="text-xs text-blue-600">AI Confidence</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Top Behavioral Patterns:</h4>
                    {[
                      { pattern: "Price page → Demo request", likelihood: 85, segment: "Enterprise" },
                      { pattern: "Features → Trial signup", likelihood: 72, segment: "Mid-market" },
                      { pattern: "Blog → Pricing → Contact", likelihood: 68, segment: "Small Business" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <div className="text-sm font-medium">{item.pattern}</div>
                          <div className="text-xs text-muted-foreground">{item.segment} segment</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">{item.likelihood}%</div>
                          <div className="text-xs text-muted-foreground">convert</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time AI Visitor Streaming */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Live AI Visitor Stream
                  <Badge variant="outline" className="ml-auto">
                    {streamingActive ? 'LIVE' : 'PAUSED'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Real-time AI-scored visitors with conversion predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStreamingActive(!streamingActive)}
                      className="h-6 px-2"
                    >
                      {streamingActive ? 'Pause' : 'Resume'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {aiScoredVisitors.length > 0 ? (
                      aiScoredVisitors.map((visitor, index) => (
                        <div 
                          key={visitor.id} 
                          className={`p-3 rounded-lg border transition-all duration-300 ${
                            visitor.urgencyLevel === 'high' 
                              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                              : visitor.urgencyLevel === 'medium'
                              ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                visitor.behaviorPrediction === 'convert' ? 'bg-green-500' :
                                visitor.behaviorPrediction === 'browse' ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <span className="text-sm font-medium">
                                {visitor.location?.split(',')[0] || 'Unknown'} • {visitor.device?.split(',')[0] || 'Unknown'}
                              </span>
                              <Badge variant={visitor.urgencyLevel === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                {visitor.urgencyLevel}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{visitor.lastActive}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-lg font-bold text-purple-600">{visitor.aiScore}</div>
                              <div className="text-xs text-muted-foreground">AI Score</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-600">
                                {Math.round(visitor.conversionProbability * 100)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Convert</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-blue-600">
                                ₦{(visitor.predictedValue / 1000).toFixed(0)}k
                              </div>
                              <div className="text-xs text-muted-foreground">Value</div>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {visitor.segmentPrediction.charAt(0).toUpperCase() + visitor.segmentPrediction.slice(1)} • 
                              {Math.round(visitor.confidence * 100)}% confidence
                            </div>
                            {visitor.recommendedActions.length > 0 && (
                              <div className="text-xs text-blue-600">
                                💡 {visitor.recommendedActions[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No AI-scored visitors currently active</p>
                        <p className="text-xs">Stream will update automatically</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Visitor Tracking with AI Behavior Prediction */}
          <LiveVisitorTracker updateInterval={10000} maxVisitors={12} />

          {/* AI-powered Visitor Journey Prediction and Optimization Alerts */}
          <AIJourneyPredictor updateInterval={15000} maxPredictions={8} enableAlerts={true} />

          {/* AI Behavioral Scoring with Pattern Recognition */}
          <AIBehavioralScoring updateInterval={5000} maxVisitors={20} />

          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Conversion Predictions
                </CardTitle>
                <CardDescription>
                  Real-time AI predictions for visitor conversion likelihood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Live Prediction</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">42%</div>
                    <div className="text-sm text-muted-foreground">
                      Current visitor conversion probability
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Prediction Factors:</h4>
                    {[
                      { factor: "Pricing page visit", impact: "+25%", type: "positive" },
                      { factor: "Mobile device", impact: "-8%", type: "negative" },
                      { factor: "Nigerian location", impact: "+15%", type: "positive" },
                      { factor: "Return visitor", impact: "+12%", type: "positive" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{item.factor}</span>
                        <span className={`text-sm font-bold ${
                          item.type === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
