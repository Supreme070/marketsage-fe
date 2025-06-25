'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Route, 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Clock, 
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  Lightbulb,
  Zap,
  Bell,
  BellOff
} from 'lucide-react';
import { getActiveVisitors, getVisitorJourneys } from '@/lib/leadpulse/dataProvider';

interface JourneyPrediction {
  id: string;
  visitorId: string;
  currentStage: string;
  nextProbableStage: string;
  conversionProbability: number;
  timeToConversion: string;
  confidence: number;
  riskFactors: string[];
  optimizationOpportunities: string[];
  journeyPath: Array<{
    stage: string;
    probability: number;
    timeEstimate: string;
    isCurrentStage: boolean;
  }>;
}

interface OptimizationAlert {
  id: string;
  type: 'critical' | 'warning' | 'opportunity' | 'insight';
  title: string;
  description: string;
  impact: string;
  urgency: 'immediate' | 'within_hour' | 'within_day' | 'monitoring';
  actionable: boolean;
  recommendedActions: string[];
  affectedVisitors: number;
  potentialValue: number;
  confidence: number;
  timestamp: Date;
}

interface Props {
  updateInterval?: number;
  maxPredictions?: number;
  enableAlerts?: boolean;
}

export default function AIJourneyPredictor({ 
  updateInterval = 15000, // 15 seconds
  maxPredictions = 8,
  enableAlerts = true 
}: Props) {
  const [journeyPredictions, setJourneyPredictions] = useState<JourneyPrediction[]>([]);
  const [optimizationAlerts, setOptimizationAlerts] = useState<OptimizationAlert[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(enableAlerts);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Journey stages for TechFlow Solutions
  const journeyStages = [
    'Landing → Browse',
    'Browse → Features',
    'Features → Pricing',
    'Pricing → Demo Request',
    'Demo → Enterprise Contact',
    'Contact → Conversion'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateJourneyPredictions = async () => {
      setIsUpdating(true);
      
      try {
        const [visitors, journeys] = await Promise.all([
          getActiveVisitors('2h'),
          getVisitorJourneys()
        ]);

        // Generate journey predictions
        const predictions = generateJourneyPredictions(visitors);
        setJourneyPredictions(predictions);

        // Generate optimization alerts
        if (alertsEnabled) {
          const alerts = generateOptimizationAlerts(visitors, predictions);
          setOptimizationAlerts(prev => {
            // Merge new alerts with existing ones, removing duplicates
            const mergedAlerts = [...prev];
            alerts.forEach(newAlert => {
              const existingIndex = mergedAlerts.findIndex(alert => 
                alert.title === newAlert.title && alert.type === newAlert.type
              );
              if (existingIndex >= 0) {
                mergedAlerts[existingIndex] = newAlert; // Update existing
              } else {
                mergedAlerts.push(newAlert); // Add new
              }
            });
            // Keep only the last 10 alerts
            return mergedAlerts.slice(-10);
          });
        }

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error updating journey predictions:', error);
      } finally {
        setIsUpdating(false);
      }
    };

    updateJourneyPredictions(); // Initial load
    interval = setInterval(updateJourneyPredictions, updateInterval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [alertsEnabled, updateInterval]);

  const generateJourneyPredictions = (visitors: any[]): JourneyPrediction[] => {
    return visitors
      .filter(visitor => visitor.aiPrediction && visitor.aiEnhancement)
      .slice(0, maxPredictions)
      .map((visitor, index) => {
        const aiScore = visitor.aiEnhancement.aiScore;
        const conversionProb = visitor.aiPrediction.conversionProbability;
        
        // Determine current stage based on visitor behavior
        const currentStage = determineCurrentStage(visitor);
        const nextStage = determineNextStage(currentStage, conversionProb);
        
        // Generate journey path
        const journeyPath = generateJourneyPath(currentStage, conversionProb);
        
        // Estimate time to conversion
        const timeToConversion = estimateTimeToConversion(conversionProb, aiScore);
        
        // Identify risk factors and opportunities
        const riskFactors = identifyRiskFactors(visitor);
        const optimizationOpportunities = identifyOptimizationOpportunities(visitor);

        return {
          id: `prediction_${visitor.id}`,
          visitorId: visitor.id,
          currentStage,
          nextProbableStage: nextStage,
          conversionProbability: Math.round(conversionProb * 100),
          timeToConversion,
          confidence: Math.round(visitor.aiPrediction.confidence * 100),
          riskFactors,
          optimizationOpportunities,
          journeyPath
        };
      });
  };

  const generateOptimizationAlerts = (visitors: any[], predictions: JourneyPrediction[]): OptimizationAlert[] => {
    const alerts: OptimizationAlert[] = [];
    const now = new Date();

    // High-value visitor about to abandon
    const highValueRisk = visitors.filter(v => 
      v.aiEnhancement?.predictedValue > 400000 && 
      v.aiPrediction?.behaviorPrediction === 'abandon'
    );
    
    if (highValueRisk.length > 0) {
      alerts.push({
        id: `alert_high_value_${now.getTime()}`,
        type: 'critical',
        title: 'High-Value Visitors at Risk',
        description: `${highValueRisk.length} enterprise-level visitors showing abandon signals`,
        impact: `Potential revenue loss: ₦${(highValueRisk.reduce((sum, v) => sum + v.aiEnhancement.predictedValue, 0) / 1000000).toFixed(1)}M`,
        urgency: 'immediate',
        actionable: true,
        recommendedActions: [
          'Trigger immediate WhatsApp outreach',
          'Show enterprise pricing incentive',
          'Offer priority demo scheduling'
        ],
        affectedVisitors: highValueRisk.length,
        potentialValue: highValueRisk.reduce((sum, v) => sum + v.aiEnhancement.predictedValue, 0),
        confidence: 0.89,
        timestamp: now
      });
    }

    // Conversion opportunity spike
    const highConversionVisitors = visitors.filter(v => 
      v.aiPrediction?.conversionProbability > 0.7
    );
    
    if (highConversionVisitors.length >= 3) {
      alerts.push({
        id: `alert_conversion_spike_${now.getTime()}`,
        type: 'opportunity',
        title: 'Conversion Opportunity Spike',
        description: `${highConversionVisitors.length} visitors with >70% conversion probability online`,
        impact: `Potential immediate revenue: ₦${(highConversionVisitors.reduce((sum, v) => sum + (v.aiEnhancement?.predictedValue || 0), 0) / 1000).toFixed(0)}k`,
        urgency: 'within_hour',
        actionable: true,
        recommendedActions: [
          'Activate live chat proactively',
          'Show limited-time pricing offers',
          'Fast-track demo booking system'
        ],
        affectedVisitors: highConversionVisitors.length,
        potentialValue: highConversionVisitors.reduce((sum, v) => sum + (v.aiEnhancement?.predictedValue || 0), 0),
        confidence: 0.82,
        timestamp: now
      });
    }

    // Journey bottleneck detected
    const pricingStuckVisitors = predictions.filter(p => 
      p.currentStage === 'Features → Pricing' && 
      p.conversionProbability < 40
    );
    
    if (pricingStuckVisitors.length >= 2) {
      alerts.push({
        id: `alert_pricing_bottleneck_${now.getTime()}`,
        type: 'warning',
        title: 'Pricing Page Bottleneck',
        description: `${pricingStuckVisitors.length} visitors stuck at pricing stage with low conversion probability`,
        impact: 'Pricing page optimization needed',
        urgency: 'within_day',
        actionable: true,
        recommendedActions: [
          'A/B test Nigerian Naira vs USD pricing display',
          'Add WhatsApp instant quote feature',
          'Show customer success stories for enterprises'
        ],
        affectedVisitors: pricingStuckVisitors.length,
        potentialValue: pricingStuckVisitors.reduce((sum, p) => sum + (predictions.find(pred => pred.id === p.id)?.conversionProbability || 0) * 300000, 0),
        confidence: 0.76,
        timestamp: now
      });
    }

    // AI insight: Business hours optimization
    const currentHour = now.getHours();
    if (currentHour >= 17 && visitors.length > 5) {
      alerts.push({
        id: `alert_after_hours_${now.getTime()}`,
        type: 'insight',
        title: 'After-Hours Traffic Opportunity',
        description: `${visitors.length} visitors active outside business hours`,
        impact: 'Extended support hours could increase conversions by 15%',
        urgency: 'monitoring',
        actionable: true,
        recommendedActions: [
          'Enable after-hours WhatsApp auto-responses',
          'Schedule follow-up for next business day',
          'Show timezone-aware contact options'
        ],
        affectedVisitors: visitors.length,
        potentialValue: visitors.length * 150000 * 0.15,
        confidence: 0.68,
        timestamp: now
      });
    }

    return alerts;
  };

  const determineCurrentStage = (visitor: any): string => {
    const stages = [
      'Landing → Browse',
      'Browse → Features', 
      'Features → Pricing',
      'Pricing → Demo Request',
      'Demo → Enterprise Contact',
      'Contact → Conversion'
    ];
    
    // Simple logic based on engagement and behavior
    const engagement = visitor.engagementScore || 50;
    const pulseCount = visitor.pulseData?.length || 0;
    
    if (engagement > 80 && pulseCount > 4) return stages[4]; // Demo → Enterprise Contact
    if (engagement > 70 && pulseCount > 3) return stages[3]; // Pricing → Demo Request
    if (engagement > 55 && pulseCount > 2) return stages[2]; // Features → Pricing
    if (engagement > 40 && pulseCount > 1) return stages[1]; // Browse → Features
    return stages[0]; // Landing → Browse
  };

  const determineNextStage = (currentStage: string, conversionProb: number): string => {
    const stageIndex = journeyStages.indexOf(currentStage);
    if (stageIndex >= 0 && stageIndex < journeyStages.length - 1) {
      return journeyStages[stageIndex + 1];
    }
    return 'Conversion Complete';
  };

  const generateJourneyPath = (currentStage: string, conversionProb: number) => {
    const currentIndex = journeyStages.indexOf(currentStage);
    return journeyStages.map((stage, index) => ({
      stage,
      probability: index <= currentIndex ? 100 : Math.max(10, conversionProb * 100 - (index - currentIndex) * 15),
      timeEstimate: index <= currentIndex ? 'Completed' : `${(index - currentIndex) * 5}-${(index - currentIndex) * 10}min`,
      isCurrentStage: index === currentIndex
    }));
  };

  const estimateTimeToConversion = (conversionProb: number, aiScore: number): string => {
    if (conversionProb > 0.8) return '5-15 minutes';
    if (conversionProb > 0.6) return '15-45 minutes';
    if (conversionProb > 0.4) return '1-3 hours';
    if (conversionProb > 0.2) return '3-24 hours';
    return '1-7 days';
  };

  const identifyRiskFactors = (visitor: any): string[] => {
    const risks = [];
    if (visitor.device?.toLowerCase().includes('mobile')) risks.push('Mobile experience optimization needed');
    if (visitor.engagementScore < 50) risks.push('Low engagement score');
    if (!visitor.location?.includes('Nigeria')) risks.push('International visitor - localization required');
    if ((visitor.pulseData?.length || 0) < 2) risks.push('Limited page interactions');
    return risks;
  };

  const identifyOptimizationOpportunities = (visitor: any): string[] => {
    const opportunities = [];
    if (visitor.location?.includes('Lagos') || visitor.location?.includes('Abuja')) {
      opportunities.push('Show Nigerian enterprise case studies');
    }
    if (visitor.aiEnhancement?.segmentPrediction === 'enterprise') {
      opportunities.push('Offer priority enterprise demo');
    }
    if (visitor.engagementScore > 70) {
      opportunities.push('Trigger immediate contact opportunity');
    }
    if (visitor.device?.toLowerCase().includes('mobile')) {
      opportunities.push('Enable WhatsApp quick contact');
    }
    return opportunities;
  };

  const getAlertIcon = (type: OptimizationAlert['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'opportunity': return <Target className="h-4 w-4 text-green-600" />;
      case 'insight': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: OptimizationAlert['urgency']) => {
    switch (urgency) {
      case 'immediate': return 'text-red-600 bg-red-50 border-red-200';
      case 'within_hour': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'within_day': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'monitoring': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimization Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Optimization Alerts
              <Badge variant="outline">{optimizationAlerts.length} Active</Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className="h-8"
            >
              {alertsEnabled ? (
                <>
                  <Bell className="h-3 w-3 mr-1" />
                  Enabled
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3 mr-1" />
                  Disabled
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {optimizationAlerts.length > 0 ? (
              optimizationAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getUrgencyColor(alert.urgency)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type)}
                      <span className="font-medium text-sm">{alert.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.urgency.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {alert.description}
                  </p>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Impact:</strong> {alert.impact} • 
                    <strong> Confidence:</strong> {Math.round(alert.confidence * 100)}%
                  </div>
                  
                  {alert.recommendedActions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Recommended Actions:
                      </div>
                      <div className="space-y-1">
                        {alert.recommendedActions.map((action, index) => (
                          <div key={index} className="text-xs text-blue-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No optimization alerts currently</p>
                <p className="text-xs">AI is monitoring visitor behavior for opportunities</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Journey Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-green-600" />
            Visitor Journey Predictions
            <Badge variant="outline">{journeyPredictions.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {journeyPredictions.length > 0 ? (
              journeyPredictions.map((prediction) => (
                <div key={prediction.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-sm">
                        Visitor {prediction.visitorId.slice(-4).toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {prediction.conversionProbability}% conversion probability
                      </div>
                    </div>
                    <Badge variant={prediction.conversionProbability > 70 ? 'default' : 'secondary'}>
                      {prediction.timeToConversion}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Journey Progress:
                    </div>
                    <div className="space-y-1">
                      {prediction.journeyPath.map((step, index) => (
                        <div key={index} className={`flex items-center gap-2 text-xs ${
                          step.isCurrentStage ? 'font-medium text-blue-600' : 'text-gray-600'
                        }`}>
                          {step.isCurrentStage ? (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          )}
                          <span>{step.stage}</span>
                          <span className="text-gray-500">({step.probability}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {prediction.optimizationOpportunities.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                      <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                        🎯 Optimization Opportunities:
                      </div>
                      <div className="space-y-1">
                        {prediction.optimizationOpportunities.slice(0, 2).map((opportunity, index) => (
                          <div key={index} className="text-xs text-green-700 dark:text-green-300">
                            • {opportunity}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active journey predictions</p>
                <p className="text-xs">Predictions will appear when visitors engage</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-muted-foreground text-center">
            Last updated: {lastUpdate.toLocaleTimeString()} • 
            Next update: {isUpdating ? 'Updating...' : `${updateInterval / 1000}s`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}