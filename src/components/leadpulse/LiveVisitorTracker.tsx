'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Activity, 
  Brain, 
  Zap, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Users,
  Target,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { getActiveVisitors } from '@/lib/leadpulse/dataProvider';

interface LiveVisitor {
  id: string;
  location: string;
  device: string;
  lastActive: string;
  aiScore: number;
  conversionProbability: number;
  behaviorPrediction: 'convert' | 'browse' | 'abandon';
  segmentPrediction: 'enterprise' | 'startup' | 'individual';
  urgencyLevel: 'high' | 'medium' | 'low';
  predictedValue: number;
  confidence: number;
  recommendedActions: string[];
  currentPage?: string;
  timeOnSite?: number;
  pageViews?: number;
  realTimeBehavior?: {
    action: string;
    timestamp: Date;
    confidence: number;
  }[];
}

interface Props {
  updateInterval?: number; // milliseconds
  maxVisitors?: number;
}

export default function LiveVisitorTracker({ 
  updateInterval = 10000, // 10 seconds default
  maxVisitors = 15 
}: Props) {
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [isTracking, setIsTracking] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [updateCount, setUpdateCount] = useState(0);

  // Simulate real-time behavior predictions
  const [behaviorPredictions, setBehaviorPredictions] = useState<Record<string, any>>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchLiveVisitors = async () => {
      try {
        const visitors = await getActiveVisitors('1h');
        
        const enhancedVisitors = visitors
          .filter(visitor => visitor.aiPrediction && visitor.aiEnhancement)
          .map(visitor => {
            const currentBehavior = generateRealTimeBehavior(visitor);
            
            return {
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
              recommendedActions: visitor.aiPrediction.recommendedActions,
              currentPage: getCurrentPage(visitor),
              timeOnSite: getTimeOnSite(visitor),
              pageViews: visitor.pulseData?.length || 0,
              realTimeBehavior: currentBehavior
            };
          })
          .sort((a, b) => {
            // Sort by urgency first, then by AI score
            const urgencyOrder = { high: 3, medium: 2, low: 1 };
            const urgencyDiff = urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
            if (urgencyDiff !== 0) return urgencyDiff;
            return b.aiScore - a.aiScore;
          })
          .slice(0, maxVisitors);

        setLiveVisitors(enhancedVisitors);
        setLastUpdate(new Date());
        setUpdateCount(prev => prev + 1);

        // Update behavior predictions
        const newPredictions: Record<string, any> = {};
        enhancedVisitors.forEach(visitor => {
          newPredictions[visitor.id] = generateBehaviorPrediction(visitor);
        });
        setBehaviorPredictions(newPredictions);

      } catch (error) {
        console.error('Error fetching live visitors:', error);
      }
    };

    if (isTracking) {
      fetchLiveVisitors(); // Initial load
      interval = setInterval(fetchLiveVisitors, updateInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, updateInterval, maxVisitors]);

  const generateRealTimeBehavior = (visitor: any) => {
    const behaviors = [
      { action: 'Viewing pricing section', confidence: 0.92 },
      { action: 'Clicked WhatsApp contact', confidence: 0.88 },
      { action: 'Downloaded enterprise guide', confidence: 0.95 },
      { action: 'Watching demo video', confidence: 0.85 },
      { action: 'Comparing plans', confidence: 0.78 },
      { action: 'Reading testimonials', confidence: 0.72 },
      { action: 'Browsing feature details', confidence: 0.81 }
    ];

    const recentBehaviors = [];
    const behaviorCount = Math.random() > 0.7 ? 2 : 1;
    
    for (let i = 0; i < behaviorCount; i++) {
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      recentBehaviors.push({
        ...behavior,
        timestamp: new Date(Date.now() - Math.random() * 300000) // Last 5 minutes
      });
    }

    return recentBehaviors;
  };

  const generateBehaviorPrediction = (visitor: LiveVisitor) => {
    const now = new Date();
    const predictions = [];

    // Next likely action prediction
    if (visitor.conversionProbability > 0.7) {
      predictions.push({
        action: 'Contact/Demo Request',
        probability: 0.85,
        timeframe: '5-10 minutes',
        reasoning: 'High engagement, viewed pricing'
      });
    } else if (visitor.conversionProbability > 0.4) {
      predictions.push({
        action: 'Request More Information',
        probability: 0.65,
        timeframe: '10-20 minutes',
        reasoning: 'Moderate interest, comparing solutions'
      });
    } else {
      predictions.push({
        action: 'Continue Browsing',
        probability: 0.55,
        timeframe: '2-5 minutes',
        reasoning: 'Research phase, information gathering'
      });
    }

    return {
      nextAction: predictions[0],
      conversionWindow: visitor.urgencyLevel === 'high' ? '0-15 minutes' : 
                       visitor.urgencyLevel === 'medium' ? '15-60 minutes' : '1-24 hours',
      riskLevel: visitor.conversionProbability < 0.3 ? 'High abandon risk' : 
                visitor.conversionProbability > 0.7 ? 'High convert potential' : 'Moderate engagement'
    };
  };

  const getCurrentPage = (visitor: any) => {
    const pages = ['/pricing', '/solutions/ai-intelligence', '/enterprise', '/contact', '/demo'];
    return pages[Math.floor(Math.random() * pages.length)];
  };

  const getTimeOnSite = (visitor: any) => {
    // Generate realistic time on site (in minutes)
    return Math.floor(Math.random() * 45) + 2; // 2-47 minutes
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Live Visitor Tracking
            <Badge variant="outline" className="ml-2">
              {liveVisitors.length} Active
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTracking(!isTracking)}
              className="h-8"
            >
              {isTracking ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {liveVisitors.length > 0 ? (
            liveVisitors.map((visitor) => {
              const prediction = behaviorPredictions[visitor.id];
              
              return (
                <div 
                  key={visitor.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    visitor.urgencyLevel === 'high' 
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-md' 
                      : visitor.urgencyLevel === 'medium'
                      ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Visitor Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        visitor.behaviorPrediction === 'convert' ? 'bg-green-500' :
                        visitor.behaviorPrediction === 'browse' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium text-sm">
                          {visitor.location?.split(',')[0] || 'Unknown'} • {visitor.device?.split(',')[0] || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {visitor.timeOnSite}m on site • {visitor.pageViews} pages
                        </div>
                      </div>
                    </div>
                    <Badge variant={visitor.urgencyLevel === 'high' ? 'destructive' : 'secondary'}>
                      {visitor.urgencyLevel.toUpperCase()}
                    </Badge>
                  </div>

                  {/* AI Metrics */}
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{visitor.aiScore}</div>
                      <div className="text-xs text-muted-foreground">AI Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {Math.round(visitor.conversionProbability * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Convert</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        ₦{(visitor.predictedValue / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-muted-foreground">Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {Math.round(visitor.confidence * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                    </div>
                  </div>

                  {/* Real-time Behavior */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Real-time Activity:</div>
                    {visitor.realTimeBehavior && visitor.realTimeBehavior.length > 0 ? (
                      <div className="space-y-1">
                        {visitor.realTimeBehavior.map((behavior, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <Eye className="h-3 w-3 text-blue-500" />
                            <span className="text-blue-600">{behavior.action}</span>
                            <span className="text-muted-foreground">
                              ({Math.round(behavior.confidence * 100)}% confidence)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Currently browsing...</div>
                    )}
                  </div>

                  {/* AI Prediction */}
                  {prediction && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                        <Brain className="h-3 w-3 inline mr-1" />
                        AI Prediction:
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <div>• Next action: {prediction.nextAction?.action} ({prediction.nextAction?.probability * 100}%)</div>
                        <div>• Window: {prediction.conversionWindow}</div>
                        <div>• Status: {prediction.riskLevel}</div>
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {visitor.recommendedActions.length > 0 && (
                    <div className="mt-2 text-xs">
                      <div className="font-medium text-muted-foreground mb-1">Recommended:</div>
                      <div className="text-green-600">
                        💡 {visitor.recommendedActions[0]}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active visitors currently being tracked</p>
              <p className="text-xs">Live tracking will resume when visitors arrive</p>
            </div>
          )}
        </div>
        
        {/* Live Tracking Stats */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-bold text-green-600">
                {liveVisitors.filter(v => v.urgencyLevel === 'high').length}
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div>
              <div className="text-sm font-bold text-blue-600">
                {Math.round(liveVisitors.reduce((acc, v) => acc + v.conversionProbability, 0) / liveVisitors.length * 100) || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Convert Rate</div>
            </div>
            <div>
              <div className="text-sm font-bold text-purple-600">
                {updateCount}
              </div>
              <div className="text-xs text-muted-foreground">Updates</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}