'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  Star,
  Zap,
  Eye,
  MousePointer,
  Clock,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  RefreshCw,
  Activity,
  BarChart3,
  PieChart,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Award,
  TrendingDown as TrendingDownIcon,
  ArrowRight
} from 'lucide-react';

interface BehaviorScore {
  visitorId: string;
  sessionId: string;
  fingerprint: string;
  location: string;
  device: string;
  browser: string;
  
  // Behavioral Metrics
  engagementScore: number;
  intentScore: number;
  conversionProbability: number;
  riskScore: number;
  loyaltyScore: number;
  
  // AI Predictions
  predictedActions: string[];
  nextPageProbability: { [key: string]: number };
  timeToConversion: number;
  conversionValue: number;
  churnRisk: 'low' | 'medium' | 'high';
  
  // Behavioral Patterns
  behaviorType: 'explorer' | 'researcher' | 'buyer' | 'browser' | 'returner';
  visitPattern: 'first_time' | 'repeat' | 'frequent' | 'loyal';
  engagementPattern: 'passive' | 'active' | 'highly_engaged' | 'power_user';
  
  // Segmentation
  segments: string[];
  personalityTraits: string[];
  interests: string[];
  
  // Real-time Activity
  currentPage: string;
  timeOnCurrentPage: number;
  isActive: boolean;
  lastActivity: string;
  
  // Historical Data
  totalSessions: number;
  totalPageViews: number;
  averageSessionDuration: number;
  lastVisit: string;
  firstVisit: string;
}

interface ScorePrediction {
  id: string;
  type: 'conversion' | 'engagement' | 'churn' | 'value' | 'timing';
  title: string;
  description: string;
  prediction: string | number;
  confidence: number;
  timeframe: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'high' | 'medium' | 'low';
  recommendedAction: string;
  affectedVisitors: number;
}

interface BehaviorInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  affectedSegment: string;
  metrics: {
    before: number;
    after: number;
    improvement: number;
  };
}

interface AIBehavioralScoringProps {
  className?: string;
}

export default function AIBehavioralScoring({ className }: AIBehavioralScoringProps) {
  const [behaviorScores, setBehaviorScores] = useState<BehaviorScore[]>([]);
  const [predictions, setPredictions] = useState<ScorePrediction[]>([]);
  const [insights, setInsights] = useState<BehaviorInsight[]>([]);
  const [selectedScore, setSelectedScore] = useState<BehaviorScore | null>(null);
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'conversionProbability' | 'engagementScore' | 'riskScore'>('conversionProbability');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch behavioral scoring data
  useEffect(() => {
    fetchScoringData();
    const interval = setInterval(fetchScoringData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [sortBy, filterSegment]);

  const fetchScoringData = async () => {
    try {
      setRefreshing(true);
      const [scoresResponse, predictionsResponse, insightsResponse] = await Promise.all([
        fetch(`/api/leadpulse/ai/behavioral-scores?sort=${sortBy}&segment=${filterSegment}`),
        fetch('/api/leadpulse/ai/score-predictions'),
        fetch('/api/leadpulse/ai/behavioral-insights')
      ]);

      // Use mock data for demo
      const mockScores = generateMockBehaviorScores();
      setBehaviorScores(mockScores);
      setPredictions(generateMockPredictions());
      setInsights(generateMockInsights());
      
      if (mockScores.length > 0 && !selectedScore) {
        setSelectedScore(mockScores[0]);
      }
    } catch (error) {
      console.error('Error fetching behavioral scoring data:', error);
      const mockScores = generateMockBehaviorScores();
      setBehaviorScores(mockScores);
      setPredictions(generateMockPredictions());
      setInsights(generateMockInsights());
      
      if (mockScores.length > 0) {
        setSelectedScore(mockScores[0]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Filter and sort behavior scores
  const filteredScores = behaviorScores
    .filter(score => {
      const matchesSearch = !searchQuery || 
        score.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        score.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        score.behaviorType.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSegment = filterSegment === 'all' || 
        score.segments.some(segment => segment.toLowerCase().includes(filterSegment.toLowerCase()));
      
      return matchesSearch && matchesSegment;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get behavior type icon
  const getBehaviorTypeIcon = (type: string) => {
    switch (type) {
      case 'explorer': return Eye;
      case 'researcher': return Brain;
      case 'buyer': return Target;
      case 'browser': return MousePointer;
      case 'returner': return Users;
      default: return Activity;
    }
  };

  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get prediction icon
  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'conversion': return Target;
      case 'engagement': return Activity;
      case 'churn': return TrendingDownIcon;
      case 'value': return Award;
      case 'timing': return Clock;
      default: return Brain;
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Mock data generators
  const generateMockBehaviorScores = (): BehaviorScore[] => {
    const locations = ['Lagos, Nigeria', 'Abuja, Nigeria', 'Accra, Ghana', 'Nairobi, Kenya', 'Cape Town, South Africa'];
    const devices = ['Desktop', 'Mobile', 'Tablet'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const behaviorTypes = ['explorer', 'researcher', 'buyer', 'browser', 'returner'];
    const visitPatterns = ['first_time', 'repeat', 'frequent', 'loyal'];
    const engagementPatterns = ['passive', 'active', 'highly_engaged', 'power_user'];
    
    return Array.from({ length: 25 }, (_, i) => {
      const conversionProb = Math.floor(Math.random() * 95) + 5;
      const engagementScore = Math.floor(Math.random() * 95) + 5;
      const riskScore = Math.floor(Math.random() * 80) + 10;
      
      return {
        visitorId: `visitor_${i}`,
        sessionId: `session_${i}`,
        fingerprint: `fp_${i}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        
        engagementScore,
        intentScore: Math.floor(Math.random() * 90) + 10,
        conversionProbability: conversionProb,
        riskScore,
        loyaltyScore: Math.floor(Math.random() * 85) + 15,
        
        predictedActions: [
          'View pricing page',
          'Download whitepaper',
          'Request demo',
          'Contact sales'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        
        nextPageProbability: {
          '/pricing': 0.45,
          '/demo': 0.32,
          '/contact': 0.28,
          '/solutions': 0.15
        },
        
        timeToConversion: Math.floor(Math.random() * 2880) + 120, // 2 minutes to 48 hours
        conversionValue: Math.floor(Math.random() * 5000) + 500,
        churnRisk: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low',
        
        behaviorType: behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)] as any,
        visitPattern: visitPatterns[Math.floor(Math.random() * visitPatterns.length)] as any,
        engagementPattern: engagementPatterns[Math.floor(Math.random() * engagementPatterns.length)] as any,
        
        segments: ['Nigerian Market', 'Enterprise', 'High Intent'].slice(0, Math.floor(Math.random() * 3) + 1),
        personalityTraits: ['Analytical', 'Detail-oriented', 'Price-sensitive'].slice(0, Math.floor(Math.random() * 3) + 1),
        interests: ['Marketing Automation', 'CRM', 'Analytics'].slice(0, Math.floor(Math.random() * 3) + 1),
        
        currentPage: ['/pricing', '/demo', '/solutions', '/contact'][Math.floor(Math.random() * 4)],
        timeOnCurrentPage: Math.floor(Math.random() * 300) + 30,
        isActive: Math.random() > 0.3,
        lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        
        totalSessions: Math.floor(Math.random() * 15) + 1,
        totalPageViews: Math.floor(Math.random() * 50) + 5,
        averageSessionDuration: Math.floor(Math.random() * 1800) + 300,
        lastVisit: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        firstVisit: new Date(Date.now() - Math.random() * 2592000000).toISOString()
      };
    });
  };

  const generateMockPredictions = (): ScorePrediction[] => {
    return [
      {
        id: 'pred_1',
        type: 'conversion',
        title: 'Conversion Rate Increase',
        description: 'High-intent visitors showing 23% increase in conversion signals',
        prediction: '23%',
        confidence: 87,
        timeframe: 'Next 7 days',
        trend: 'increasing',
        impact: 'high',
        recommendedAction: 'Deploy targeted demo offers to high-intent segments',
        affectedVisitors: 142
      },
      {
        id: 'pred_2',
        type: 'engagement',
        title: 'Mobile Engagement Optimization',
        description: 'Mobile users showing decreased engagement on pricing page',
        prediction: '15%',
        confidence: 74,
        timeframe: 'Current week',
        trend: 'decreasing',
        impact: 'medium',
        recommendedAction: 'Implement mobile-optimized pricing display',
        affectedVisitors: 89
      },
      {
        id: 'pred_3',
        type: 'churn',
        title: 'Early Warning: Visitor Churn',
        description: 'Repeat visitors showing early churn indicators',
        prediction: '34',
        confidence: 91,
        timeframe: 'Next 48 hours',
        trend: 'increasing',
        impact: 'high',
        recommendedAction: 'Trigger re-engagement email campaign',
        affectedVisitors: 34
      },
      {
        id: 'pred_4',
        type: 'value',
        title: 'High-Value Prospect Identification',
        description: 'Enterprise behavior patterns indicate premium segment',
        prediction: '$12,500',
        confidence: 82,
        timeframe: 'Quarterly forecast',
        trend: 'stable',
        impact: 'high',
        recommendedAction: 'Assign dedicated sales representative',
        affectedVisitors: 18
      }
    ];
  };

  const generateMockInsights = (): BehaviorInsight[] => {
    return [
      {
        id: 'insight_1',
        type: 'pattern',
        title: 'Nigerian Enterprise Buying Pattern',
        description: 'Enterprise visitors from Nigeria spend 3x longer on solution pages before converting',
        recommendation: 'Create Nigeria-specific enterprise landing pages with detailed solution breakdowns',
        confidence: 89,
        impact: 'high',
        affectedSegment: 'Nigerian Enterprise',
        metrics: {
          before: 12,
          after: 31,
          improvement: 158
        }
      },
      {
        id: 'insight_2',
        type: 'anomaly',
        title: 'Unusual Mobile Conversion Spike',
        description: 'Mobile conversions increased 45% in Lagos during business hours',
        recommendation: 'Investigate mobile optimization and replicate successful elements',
        confidence: 76,
        impact: 'medium',
        affectedSegment: 'Lagos Mobile Users',
        metrics: {
          before: 8,
          after: 16,
          improvement: 100
        }
      },
      {
        id: 'insight_3',
        type: 'opportunity',
        title: 'Pricing Page Optimization Window',
        description: 'Visitors spending 5+ minutes on pricing show 85% higher conversion intent',
        recommendation: 'Add interactive pricing calculator and comparison tools',
        confidence: 93,
        impact: 'high',
        affectedSegment: 'Price Researchers',
        metrics: {
          before: 15,
          after: 42,
          improvement: 180
        }
      },
      {
        id: 'insight_4',
        type: 'risk',
        title: 'Weekend Visitor Engagement Drop',
        description: 'Weekend visitors show 60% lower engagement and higher churn risk',
        recommendation: 'Implement weekend-specific engagement strategies and content',
        confidence: 81,
        impact: 'medium',
        affectedSegment: 'Weekend Visitors',
        metrics: {
          before: 45,
          after: 18,
          improvement: -60
        }
      }
    ];
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 animate-pulse" />
            <span>Loading AI behavioral scoring...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highConversionVisitors = behaviorScores.filter(s => s.conversionProbability >= 70).length;
  const highRiskVisitors = behaviorScores.filter(s => s.churnRisk === 'high').length;
  const avgEngagement = behaviorScores.reduce((sum, s) => sum + s.engagementScore, 0) / behaviorScores.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Behavioral Scoring & Predictions
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchScoringData} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Conversion Probability</p>
                <p className="text-xl font-semibold">{highConversionVisitors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Churn Risk</p>
                <p className="text-xl font-semibold">{highRiskVisitors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Engagement</p>
                <p className="text-xl font-semibold">{avgEngagement.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tracked Visitors</p>
                <p className="text-xl font-semibold">{behaviorScores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Visitor Scores List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Visitor Behavioral Scores</CardTitle>
              <div className="text-sm text-gray-600">
                {filteredScores.length} visitors
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by location, device, or behavior type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'conversionProbability' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('conversionProbability')}
                >
                  Conversion
                </Button>
                <Button
                  variant={sortBy === 'engagementScore' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('engagementScore')}
                >
                  Engagement
                </Button>
                <Button
                  variant={sortBy === 'riskScore' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('riskScore')}
                >
                  Risk
                </Button>
              </div>
            </div>

            {/* Visitor List */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredScores.map((score) => {
                  const BehaviorIcon = getBehaviorTypeIcon(score.behaviorType);
                  return (
                    <div key={score.visitorId} className="border rounded-lg">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedScore(expandedScore === score.visitorId ? null : score.visitorId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${score.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BehaviorIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{score.location}</span>
                                <Badge variant="outline" className="text-xs">
                                  {score.behaviorType}
                                </Badge>
                                <Badge className={getRiskColor(score.churnRisk) + ' text-xs'}>
                                  {score.churnRisk} risk
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{score.device} • {score.currentPage}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex gap-2 text-xs">
                                <span className={`px-2 py-1 rounded ${getScoreColor(score.conversionProbability)}`}>
                                  {score.conversionProbability}% convert
                                </span>
                                <span className={`px-2 py-1 rounded ${getScoreColor(score.engagementScore)}`}>
                                  {score.engagementScore}% engage
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">${score.conversionValue.toLocaleString()} value</p>
                            </div>
                            {expandedScore === score.visitorId ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedScore === score.visitorId && (
                        <div className="px-4 pb-4 border-t bg-gray-50">
                          <div className="pt-4 space-y-4">
                            {/* Score Breakdown */}
                            <div>
                              <h4 className="font-medium mb-2">Score Breakdown</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span>Intent Score</span>
                                    <span className="font-medium">{score.intentScore}%</span>
                                  </div>
                                  <Progress value={score.intentScore} className="h-2" />
                                </div>
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span>Loyalty Score</span>
                                    <span className="font-medium">{score.loyaltyScore}%</span>
                                  </div>
                                  <Progress value={score.loyaltyScore} className="h-2" />
                                </div>
                              </div>
                            </div>

                            {/* Predicted Actions */}
                            <div>
                              <h4 className="font-medium mb-2">Predicted Next Actions</h4>
                              <div className="space-y-1">
                                {score.predictedActions.map((action, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <ArrowRight className="w-3 h-3 text-gray-400" />
                                    <span>{action}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Segments & Traits */}
                            <div>
                              <h4 className="font-medium mb-2">Segments & Traits</h4>
                              <div className="flex flex-wrap gap-1">
                                {[...score.segments, ...score.personalityTraits].map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Time to Conversion */}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Predicted conversion time:</span>
                              <span className="font-medium">{formatDuration(score.timeToConversion)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Predictions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="predictions" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="predictions" className="space-y-3">
                {predictions.map((prediction) => {
                  const Icon = getPredictionIcon(prediction.type);
                  return (
                    <div key={prediction.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Icon className="w-4 h-4 mt-0.5 text-blue-600" />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{prediction.title}</h3>
                          <p className="text-xs text-gray-600">{prediction.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold text-blue-600">
                          {prediction.prediction}
                        </div>
                        <Badge variant={prediction.impact === 'high' ? 'default' : 'outline'} className="text-xs">
                          {prediction.confidence}% confident
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        {prediction.timeframe} • {prediction.affectedVisitors} visitors
                      </div>
                      
                      <div className="text-xs bg-blue-50 p-2 rounded">
                        💡 {prediction.recommendedAction}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="insights" className="space-y-3">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{insight.title}</h3>
                      <Badge variant={insight.impact === 'high' ? 'default' : 'outline'} className="text-xs">
                        {insight.confidence}% confident
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                    
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className="text-gray-600">Impact:</span>
                      <span className={`font-medium ${
                        insight.metrics.improvement > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insight.metrics.improvement > 0 ? '+' : ''}{insight.metrics.improvement}%
                      </span>
                    </div>
                    
                    <div className="text-xs bg-gray-50 p-2 rounded">
                      🎯 {insight.recommendation}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}