'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  Target, 
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  LineChart
} from 'lucide-react';
import { getActiveVisitors } from '@/lib/leadpulse/dataProvider';

interface BehavioralPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  conversionRate: number;
  avgValue: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  associatedActions: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface VisitorScore {
  visitorId: string;
  overallScore: number;
  subscores: {
    engagement: number;
    intentSignals: number;
    valueIndicators: number;
    riskFactors: number;
  };
  patterns: string[];
  predictions: {
    conversionProbability: number;
    timeToConvert: string;
    predictedValue: number;
    nextLikelyAction: string;
  };
  segments: string[];
  confidence: number;
  lastUpdated: Date;
}

interface AIInsight {
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  impact: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  affectedVisitors: number;
}

interface Props {
  updateInterval?: number;
  maxVisitors?: number;
}

export default function AIBehavioralScoring({ 
  updateInterval = 5000,
  maxVisitors = 20 
}: Props) {
  const [behavioralPatterns, setBehavioralPatterns] = useState<BehavioralPattern[]>([]);
  const [visitorScores, setVisitorScores] = useState<VisitorScore[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);

  // Real-time behavioral scoring and pattern recognition
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const performBehavioralAnalysis = async () => {
      setIsAnalyzing(true);
      
      try {
        // Fetch active visitors with AI data
        const visitors = await getActiveVisitors('30m');
        
        // Filter for visitors with sufficient data for analysis
        const analysisReadyVisitors = visitors.filter(visitor => 
          visitor.pulseData && visitor.pulseData.length > 0
        );

        // Perform AI pattern recognition
        const patterns = recognizeBehavioralPatterns(analysisReadyVisitors);
        setBehavioralPatterns(patterns);

        // Calculate behavioral scores for each visitor
        const scores = calculateBehavioralScores(analysisReadyVisitors, patterns);
        setVisitorScores(scores.slice(0, maxVisitors));

        // Generate AI insights from patterns and scores
        const insights = generateAIInsights(patterns, scores);
        setAiInsights(insights);

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error performing behavioral analysis:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Initial analysis
    performBehavioralAnalysis();

    // Set up real-time updates
    interval = setInterval(performBehavioralAnalysis, updateInterval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [updateInterval, maxVisitors]);

  const recognizeBehavioralPatterns = (visitors: any[]): BehavioralPattern[] => {
    const patterns: BehavioralPattern[] = [];

    // Pattern 1: High-intent pricing focus
    const pricingFocusedVisitors = visitors.filter(visitor => {
      const pulseData = visitor.pulseData || [];
      const pricingInteractions = pulseData.filter((pulse: any) => 
        pulse.url?.includes('pricing') || pulse.title?.toLowerCase().includes('pricing')
      );
      return pricingInteractions.length >= 2;
    });

    if (pricingFocusedVisitors.length > 0) {
      const conversionRate = pricingFocusedVisitors.filter(v => 
        v.metadata?.aiPrediction?.behaviorPrediction === 'convert'
      ).length / pricingFocusedVisitors.length;

      patterns.push({
        id: 'pricing-focus',
        name: 'Pricing-Focused Exploration',
        description: 'Visitors spending significant time on pricing pages',
        frequency: pricingFocusedVisitors.length,
        conversionRate: conversionRate * 100,
        avgValue: calculateAvgValue(pricingFocusedVisitors),
        confidence: 0.87,
        trend: conversionRate > 0.6 ? 'increasing' : 'stable',
        associatedActions: ['Show enterprise plans', 'Trigger pricing call', 'Display testimonials'],
        riskLevel: conversionRate > 0.7 ? 'low' : 'medium'
      });
    }

    // Pattern 2: Feature exploration behavior
    const featureExplorers = visitors.filter(visitor => {
      const pulseData = visitor.pulseData || [];
      const featurePages = pulseData.filter((pulse: any) => 
        pulse.url?.includes('features') || pulse.url?.includes('solutions')
      );
      return featurePages.length >= 3;
    });

    if (featureExplorers.length > 0) {
      patterns.push({
        id: 'feature-exploration',
        name: 'Deep Feature Analysis',
        description: 'Visitors thoroughly exploring product capabilities',
        frequency: featureExplorers.length,
        conversionRate: calculatePatternConversionRate(featureExplorers),
        avgValue: calculateAvgValue(featureExplorers),
        confidence: 0.82,
        trend: 'increasing',
        associatedActions: ['Offer feature demo', 'Show use cases', 'Connect with sales'],
        riskLevel: 'low'
      });
    }

    // Pattern 3: Quick abandonment risk
    const quickAbandonRisk = visitors.filter(visitor => {
      const pulseData = visitor.pulseData || [];
      const engagementScore = visitor.engagementScore || 0;
      return pulseData.length <= 2 && engagementScore < 40;
    });

    if (quickAbandonRisk.length > 0) {
      patterns.push({
        id: 'quick-abandon',
        name: 'Quick Abandon Risk',
        description: 'Low engagement visitors at risk of immediate departure',
        frequency: quickAbandonRisk.length,
        conversionRate: calculatePatternConversionRate(quickAbandonRisk),
        avgValue: calculateAvgValue(quickAbandonRisk),
        confidence: 0.91,
        trend: 'stable',
        associatedActions: ['Immediate engagement prompt', 'Show value proposition', 'Offer assistance'],
        riskLevel: 'high'
      });
    }

    // Pattern 4: Enterprise decision-making
    const enterpriseDecisionMakers = visitors.filter(visitor => {
      const location = visitor.location || '';
      const metadata = visitor.metadata;
      const isEnterprise = metadata?.aiEnhancement?.segmentPrediction === 'enterprise';
      const hasHighEngagement = visitor.engagementScore > 70;
      return isEnterprise && hasHighEngagement && location.includes('Nigeria');
    });

    if (enterpriseDecisionMakers.length > 0) {
      patterns.push({
        id: 'enterprise-decision',
        name: 'Enterprise Decision Process',
        description: 'High-value Nigerian enterprise visitors in evaluation phase',
        frequency: enterpriseDecisionMakers.length,
        conversionRate: calculatePatternConversionRate(enterpriseDecisionMakers),
        avgValue: calculateAvgValue(enterpriseDecisionMakers),
        confidence: 0.94,
        trend: 'increasing',
        associatedActions: ['Priority sales contact', 'Enterprise demo', 'Case study sharing'],
        riskLevel: 'low'
      });
    }

    // Pattern 5: Mobile optimization needs
    const mobileUsers = visitors.filter(visitor => 
      visitor.device?.toLowerCase().includes('mobile')
    );

    if (mobileUsers.length > 0) {
      const mobileConversionRate = calculatePatternConversionRate(mobileUsers);
      patterns.push({
        id: 'mobile-behavior',
        name: 'Mobile User Behavior',
        description: 'Mobile visitor interaction patterns and conversion rates',
        frequency: mobileUsers.length,
        conversionRate: mobileConversionRate,
        avgValue: calculateAvgValue(mobileUsers),
        confidence: 0.78,
        trend: mobileConversionRate < 50 ? 'decreasing' : 'stable',
        associatedActions: ['Optimize mobile UX', 'WhatsApp integration', 'Mobile-first CTAs'],
        riskLevel: mobileConversionRate < 50 ? 'high' : 'medium'
      });
    }

    return patterns;
  };

  const calculateBehavioralScores = (visitors: any[], patterns: BehavioralPattern[]): VisitorScore[] => {
    return visitors.map(visitor => {
      const pulseData = visitor.pulseData || [];
      const aiPrediction = visitor.metadata?.aiPrediction;
      const aiEnhancement = visitor.metadata?.aiEnhancement;

      // Calculate engagement score
      const engagementScore = calculateEngagementScore(visitor, pulseData);
      
      // Calculate intent signals
      const intentScore = calculateIntentSignals(visitor, pulseData, patterns);
      
      // Calculate value indicators
      const valueScore = calculateValueIndicators(visitor, aiEnhancement);
      
      // Calculate risk factors
      const riskScore = calculateRiskFactors(visitor, patterns);

      // Overall behavioral score (weighted average)
      const overallScore = Math.round(
        (engagementScore * 0.3) + 
        (intentScore * 0.3) + 
        (valueScore * 0.25) + 
        ((100 - riskScore) * 0.15)
      );

      // Identify matching patterns
      const matchingPatterns = patterns.filter(pattern => 
        visitorMatchesPattern(visitor, pattern)
      ).map(p => p.name);

      // Generate predictions
      const predictions = {
        conversionProbability: aiPrediction?.conversionProbability || (overallScore / 100),
        timeToConvert: estimateTimeToConvert(overallScore, intentScore),
        predictedValue: aiEnhancement?.predictedValue || (overallScore * 5000),
        nextLikelyAction: predictNextAction(visitor, overallScore, intentScore)
      };

      return {
        visitorId: visitor.id,
        overallScore,
        subscores: {
          engagement: engagementScore,
          intentSignals: intentScore,
          valueIndicators: valueScore,
          riskFactors: riskScore
        },
        patterns: matchingPatterns,
        predictions,
        segments: determineSegments(visitor, overallScore),
        confidence: aiPrediction?.confidence || (overallScore / 100),
        lastUpdated: new Date()
      };
    });
  };

  const calculateEngagementScore = (visitor: any, pulseData: any[]): number => {
    const baseEngagement = visitor.engagementScore || 0;
    const pulseBonus = Math.min(30, pulseData.length * 5); // Up to 30 bonus points
    const timeBonus = pulseData.reduce((sum, pulse) => {
      const timeOnPage = pulse.metadata?.timeOnPage || 30;
      return sum + Math.min(10, timeOnPage / 10);
    }, 0);
    
    return Math.min(100, baseEngagement + pulseBonus + timeBonus);
  };

  const calculateIntentSignals = (visitor: any, pulseData: any[], patterns: BehavioralPattern[]): number => {
    let intentScore = 40; // Base score
    
    // High-intent page visits
    const highIntentPages = ['pricing', 'contact', 'demo', 'enterprise'];
    const highIntentVisits = pulseData.filter(pulse => 
      highIntentPages.some(page => pulse.url?.includes(page))
    ).length;
    intentScore += highIntentVisits * 15;
    
    // Form interactions
    const formInteractions = pulseData.filter(pulse => 
      pulse.type === 'FORM_VIEW' || pulse.type === 'FORM_START'
    ).length;
    intentScore += formInteractions * 20;
    
    // Pattern matching bonus
    const matchingHighIntentPatterns = patterns.filter(pattern => 
      pattern.riskLevel === 'low' && visitorMatchesPattern(visitor, pattern)
    ).length;
    intentScore += matchingHighIntentPatterns * 10;
    
    return Math.min(100, intentScore);
  };

  const calculateValueIndicators = (visitor: any, aiEnhancement: any): number => {
    let valueScore = 30; // Base score
    
    if (aiEnhancement) {
      // Segment-based scoring
      if (aiEnhancement.segmentPrediction === 'enterprise') valueScore += 40;
      else if (aiEnhancement.segmentPrediction === 'startup') valueScore += 25;
      else valueScore += 10;
      
      // Predicted value scoring
      if (aiEnhancement.predictedValue > 400000) valueScore += 30;
      else if (aiEnhancement.predictedValue > 200000) valueScore += 20;
      else if (aiEnhancement.predictedValue > 100000) valueScore += 10;
    }
    
    // Location-based value (Nigerian market focus)
    if (visitor.location?.includes('Lagos') || visitor.location?.includes('Abuja')) {
      valueScore += 20;
    } else if (visitor.location?.includes('Nigeria')) {
      valueScore += 15;
    }
    
    return Math.min(100, valueScore);
  };

  const calculateRiskFactors = (visitor: any, patterns: BehavioralPattern[]): number => {
    let riskScore = 0; // Lower is better
    
    // Low engagement risk
    const engagementScore = visitor.engagementScore || 0;
    if (engagementScore < 30) riskScore += 40;
    else if (engagementScore < 50) riskScore += 20;
    
    // Quick abandon pattern
    const matchingRiskPatterns = patterns.filter(pattern => 
      pattern.riskLevel === 'high' && visitorMatchesPattern(visitor, pattern)
    ).length;
    riskScore += matchingRiskPatterns * 30;
    
    // Device risk (mobile conversion typically lower)
    if (visitor.device?.toLowerCase().includes('mobile')) {
      riskScore += 15;
    }
    
    // Limited activity risk
    const pulseCount = visitor.pulseData?.length || 0;
    if (pulseCount <= 1) riskScore += 25;
    else if (pulseCount <= 2) riskScore += 15;
    
    return Math.min(100, riskScore);
  };

  const visitorMatchesPattern = (visitor: any, pattern: BehavioralPattern): boolean => {
    const pulseData = visitor.pulseData || [];
    
    switch (pattern.id) {
      case 'pricing-focus':
        return pulseData.filter((pulse: any) => 
          pulse.url?.includes('pricing')).length >= 2;
      case 'feature-exploration':
        return pulseData.filter((pulse: any) => 
          pulse.url?.includes('features') || pulse.url?.includes('solutions')).length >= 3;
      case 'quick-abandon':
        return pulseData.length <= 2 && (visitor.engagementScore || 0) < 40;
      case 'enterprise-decision':
        return visitor.metadata?.aiEnhancement?.segmentPrediction === 'enterprise' &&
               (visitor.engagementScore || 0) > 70;
      case 'mobile-behavior':
        return visitor.device?.toLowerCase().includes('mobile');
      default:
        return false;
    }
  };

  const calculatePatternConversionRate = (visitors: any[]): number => {
    if (visitors.length === 0) return 0;
    
    const converters = visitors.filter(visitor => 
      visitor.metadata?.aiPrediction?.behaviorPrediction === 'convert' ||
      visitor.metadata?.aiPrediction?.conversionProbability > 0.6
    ).length;
    
    return (converters / visitors.length) * 100;
  };

  const calculateAvgValue = (visitors: any[]): number => {
    if (visitors.length === 0) return 0;
    
    const totalValue = visitors.reduce((sum, visitor) => {
      return sum + (visitor.metadata?.aiEnhancement?.predictedValue || 100000);
    }, 0);
    
    return Math.round(totalValue / visitors.length);
  };

  const estimateTimeToConvert = (overallScore: number, intentScore: number): string => {
    const combinedScore = (overallScore + intentScore) / 2;
    
    if (combinedScore > 80) return '5-15 minutes';
    if (combinedScore > 60) return '15-60 minutes';
    if (combinedScore > 40) return '1-6 hours';
    if (combinedScore > 20) return '6-24 hours';
    return '1-7 days';
  };

  const predictNextAction = (visitor: any, overallScore: number, intentScore: number): string => {
    if (intentScore > 80) return 'Submit contact form';
    if (intentScore > 60) return 'Request pricing information';
    if (overallScore > 70) return 'Explore enterprise features';
    if (overallScore > 50) return 'Compare pricing plans';
    return 'Continue browsing features';
  };

  const determineSegments = (visitor: any, overallScore: number): string[] => {
    const segments = [];
    
    if (overallScore > 80) segments.push('High-value prospect');
    if (overallScore > 60) segments.push('Qualified lead');
    if (visitor.metadata?.aiEnhancement?.segmentPrediction === 'enterprise') segments.push('Enterprise');
    if (visitor.location?.includes('Nigeria')) segments.push('Nigerian market');
    if (visitor.device?.toLowerCase().includes('mobile')) segments.push('Mobile user');
    
    return segments;
  };

  const generateAIInsights = (patterns: BehavioralPattern[], scores: VisitorScore[]): AIInsight[] => {
    const insights: AIInsight[] = [];
    
    // High-risk pattern insight
    const highRiskPatterns = patterns.filter(p => p.riskLevel === 'high');
    if (highRiskPatterns.length > 0) {
      insights.push({
        type: 'risk',
        title: 'High Abandon Risk Detected',
        description: `${highRiskPatterns[0].frequency} visitors showing quick abandon patterns`,
        impact: 'Immediate intervention required to prevent loss',
        actionable: true,
        priority: 'high',
        confidence: 0.91,
        affectedVisitors: highRiskPatterns[0].frequency
      });
    }
    
    // High-value opportunity insight
    const highValueVisitors = scores.filter(s => s.overallScore > 80).length;
    if (highValueVisitors > 0) {
      insights.push({
        type: 'opportunity',
        title: 'High-Value Prospects Active',
        description: `${highValueVisitors} visitors with 80+ behavioral scores`,
        impact: 'Priority sales engagement recommended',
        actionable: true,
        priority: 'high',
        confidence: 0.88,
        affectedVisitors: highValueVisitors
      });
    }
    
    // Pattern anomaly insight
    const enterprisePattern = patterns.find(p => p.id === 'enterprise-decision');
    if (enterprisePattern && enterprisePattern.trend === 'increasing') {
      insights.push({
        type: 'pattern',
        title: 'Enterprise Interest Surge',
        description: 'Increased enterprise visitor engagement detected',
        impact: 'Scale enterprise marketing efforts',
        actionable: true,
        priority: 'medium',
        confidence: 0.85,
        affectedVisitors: enterprisePattern.frequency
      });
    }
    
    return insights;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPatternIcon = (patternId: string) => {
    switch (patternId) {
      case 'pricing-focus': return <Target className="h-4 w-4" />;
      case 'feature-exploration': return <BarChart3 className="h-4 w-4" />;
      case 'quick-abandon': return <AlertTriangle className="h-4 w-4" />;
      case 'enterprise-decision': return <Users className="h-4 w-4" />;
      case 'mobile-behavior': return <Activity className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Behavioral Patterns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Behavioral Patterns
              <Badge variant="outline" className="ml-2">
                {behavioralPatterns.length} Detected
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAnalyzing(true)}
                disabled={isAnalyzing}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Refresh'}
              </Button>
              <div className="text-xs text-muted-foreground">
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {behavioralPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPattern === pattern.id ? 'ring-2 ring-purple-500' : ''
                } ${pattern.riskLevel === 'high' ? 'border-red-200 bg-red-50/50' : 
                    pattern.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50/50' : 
                    'border-green-200 bg-green-50/50'}`}
                onClick={() => setSelectedPattern(selectedPattern === pattern.id ? null : pattern.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPatternIcon(pattern.id)}
                    <span className="font-medium text-sm">{pattern.name}</span>
                  </div>
                  <Badge variant={pattern.trend === 'increasing' ? 'default' : 'secondary'} className="text-xs">
                    {pattern.trend}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-3">{pattern.description}</p>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{pattern.frequency}</div>
                    <div className="text-gray-500">Visitors</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">{pattern.conversionRate.toFixed(1)}%</div>
                    <div className="text-gray-500">Convert</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">{Math.round(pattern.confidence * 100)}%</div>
                    <div className="text-gray-500">Confidence</div>
                  </div>
                </div>
                
                {selectedPattern === pattern.id && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-700 mb-2">
                      <strong>Recommended Actions:</strong>
                    </div>
                    <div className="space-y-1">
                      {pattern.associatedActions.map((action, index) => (
                        <div key={index} className="text-xs text-blue-600 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visitor Behavioral Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            Real-time Behavioral Scores
            <Badge variant="outline" className="ml-2">
              {visitorScores.length} Scored
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {visitorScores.map((score) => (
              <div key={score.visitorId} className={`p-4 border rounded-lg ${getScoreColor(score.overallScore)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-sm">
                      Visitor {score.visitorId.slice(-4).toUpperCase()}
                    </div>
                    <div className="text-xs opacity-75">
                      {score.segments.join(' • ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{score.overallScore}</div>
                    <div className="text-xs">Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3 mb-3 text-xs">
                  <div className="text-center">
                    <div className="font-bold">{score.subscores.engagement}</div>
                    <div className="opacity-75">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{score.subscores.intentSignals}</div>
                    <div className="opacity-75">Intent</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{score.subscores.valueIndicators}</div>
                    <div className="opacity-75">Value</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{100 - score.subscores.riskFactors}</div>
                    <div className="opacity-75">Safety</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Predictions:</strong> {Math.round(score.predictions.conversionProbability * 100)}% convert in {score.predictions.timeToConvert}
                  </div>
                  <div>
                    <strong>Next Action:</strong> {score.predictions.nextLikelyAction}
                  </div>
                  <div>
                    <strong>Value:</strong> ₦{(score.predictions.predictedValue / 1000).toFixed(0)}k predicted
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              AI Behavioral Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${
                    insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                    insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {insight.type === 'opportunity' && <Target className="h-4 w-4 text-green-600" />}
                      {insight.type === 'pattern' && <TrendingUp className="h-4 w-4 text-blue-600" />}
                      {insight.type === 'anomaly' && <Activity className="h-4 w-4 text-purple-600" />}
                      <span className="font-medium text-sm">{insight.title}</span>
                    </div>
                    <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {insight.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-2">{insight.description}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-600 font-medium">{insight.impact}</span>
                    <span>
                      {insight.affectedVisitors} visitors • {Math.round(insight.confidence * 100)}% confidence
                    </span>
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