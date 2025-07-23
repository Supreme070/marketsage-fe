'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Eye,
  MousePointer,
  Heart,
  Star,
  Zap,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface BehaviorMetric {
  id: string;
  name: string;
  description: string;
  weight: number;
  currentValue: number;
  maxValue: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
}

interface ScoringFactor {
  category: 'engagement' | 'intent' | 'activity' | 'recency' | 'frequency' | 'value';
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
  metrics: BehaviorMetric[];
}

interface VisitorBehaviorScore {
  visitorId: string;
  sessionId?: string;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  tier: 'hot' | 'warm' | 'cold' | 'new';
  lastUpdated: string;
  factors: ScoringFactor[];
  insights: string[];
  predictedActions: {
    action: string;
    probability: number;
    timeframe: string;
  }[];
}

interface BehavioralScoringProps {
  visitorScores?: VisitorBehaviorScore[];
  isLoading?: boolean;
}

const BehavioralScoring = React.memo<BehavioralScoringProps>(({ 
  visitorScores = [], 
  isLoading 
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'algorithm'>('overview');
  const [tierFilter, setTierFilter] = useState<'all' | 'hot' | 'warm' | 'cold' | 'new'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'recency' | 'engagement'>('score');

  // Demo behavioral scoring data
  const demoScores: VisitorBehaviorScore[] = useMemo(() => [
    {
      visitorId: 'visitor_001',
      sessionId: 'session_abc123',
      totalScore: 850,
      maxScore: 1000,
      scorePercentage: 85.0,
      tier: 'hot',
      lastUpdated: '2024-07-18T23:45:00Z',
      factors: [
        {
          category: 'engagement',
          name: 'Page Engagement',
          score: 180,
          maxScore: 200,
          weight: 0.25,
          description: 'Time spent on pages, scroll depth, interactions',
          metrics: [
            {
              id: 'time_on_page',
              name: 'Avg Time on Page',
              description: 'Average time spent on each page',
              weight: 0.4,
              currentValue: 145,
              maxValue: 180,
              trend: 'up',
              impact: 'high'
            },
            {
              id: 'scroll_depth',
              name: 'Scroll Depth',
              description: 'How far user scrolls on pages',
              weight: 0.3,
              currentValue: 85,
              maxValue: 100,
              trend: 'stable',
              impact: 'medium'
            },
            {
              id: 'clicks_per_page',
              name: 'Interactions per Page',
              description: 'Number of clicks and interactions',
              weight: 0.3,
              currentValue: 8,
              maxValue: 10,
              trend: 'up',
              impact: 'medium'
            }
          ]
        },
        {
          category: 'intent',
          name: 'Purchase Intent',
          score: 160,
          maxScore: 200,
          weight: 0.3,
          description: 'Actions indicating buying intention',
          metrics: [
            {
              id: 'pricing_views',
              name: 'Pricing Page Views',
              description: 'Number of times user viewed pricing',
              weight: 0.5,
              currentValue: 3,
              maxValue: 5,
              trend: 'up',
              impact: 'high'
            },
            {
              id: 'demo_requests',
              name: 'Demo Requests',
              description: 'Requested product demonstrations',
              weight: 0.3,
              currentValue: 1,
              maxValue: 2,
              trend: 'stable',
              impact: 'high'
            },
            {
              id: 'feature_exploration',
              name: 'Feature Pages Visited',
              description: 'Explored product features in detail',
              weight: 0.2,
              currentValue: 5,
              maxValue: 8,
              trend: 'up',
              impact: 'medium'
            }
          ]
        },
        {
          category: 'activity',
          name: 'Activity Level',
          score: 170,
          maxScore: 200,
          weight: 0.2,
          description: 'Overall activity and interaction frequency',
          metrics: [
            {
              id: 'session_frequency',
              name: 'Session Frequency',
              description: 'How often user visits',
              weight: 0.4,
              currentValue: 8,
              maxValue: 10,
              trend: 'up',
              impact: 'high'
            },
            {
              id: 'pages_per_session',
              name: 'Pages per Session',
              description: 'Average pages viewed per visit',
              weight: 0.3,
              currentValue: 6,
              maxValue: 8,
              trend: 'stable',
              impact: 'medium'
            },
            {
              id: 'return_visits',
              name: 'Return Visits',
              description: 'Number of times user returned',
              weight: 0.3,
              currentValue: 5,
              maxValue: 7,
              trend: 'up',
              impact: 'medium'
            }
          ]
        },
        {
          category: 'recency',
          name: 'Recency Score',
          score: 190,
          maxScore: 200,
          weight: 0.15,
          description: 'How recently user was active',
          metrics: [
            {
              id: 'last_visit',
              name: 'Last Visit',
              description: 'Time since last activity',
              weight: 1.0,
              currentValue: 95,
              maxValue: 100,
              trend: 'stable',
              impact: 'high'
            }
          ]
        },
        {
          category: 'value',
          name: 'Value Alignment',
          score: 150,
          maxScore: 200,
          weight: 0.1,
          description: 'Alignment with high-value customer profile',
          metrics: [
            {
              id: 'company_size',
              name: 'Company Size Match',
              description: 'Matches target company size',
              weight: 0.5,
              currentValue: 80,
              maxValue: 100,
              trend: 'stable',
              impact: 'medium'
            },
            {
              id: 'industry_fit',
              name: 'Industry Fit',
              description: 'Matches target industry',
              weight: 0.5,
              currentValue: 70,
              maxValue: 100,
              trend: 'stable',
              impact: 'medium'
            }
          ]
        }
      ],
      insights: [
        'High engagement with pricing and feature pages indicates strong purchase intent',
        'Frequent return visits show sustained interest',
        'Above-average time on pages suggests genuine evaluation',
        'Recent activity indicates hot lead status'
      ],
      predictedActions: [
        {
          action: 'Request Demo',
          probability: 78,
          timeframe: 'Next 2-3 days'
        },
        {
          action: 'Start Free Trial',
          probability: 65,
          timeframe: 'Next week'
        },
        {
          action: 'Make Purchase',
          probability: 45,
          timeframe: 'Next 2 weeks'
        }
      ]
    },
    {
      visitorId: 'visitor_002',
      sessionId: 'session_def456',
      totalScore: 420,
      maxScore: 1000,
      scorePercentage: 42.0,
      tier: 'warm',
      lastUpdated: '2024-07-18T22:30:00Z',
      factors: [
        {
          category: 'engagement',
          name: 'Page Engagement',
          score: 90,
          maxScore: 200,
          weight: 0.25,
          description: 'Time spent on pages, scroll depth, interactions',
          metrics: [
            {
              id: 'time_on_page',
              name: 'Avg Time on Page',
              description: 'Average time spent on each page',
              weight: 0.4,
              currentValue: 65,
              maxValue: 180,
              trend: 'down',
              impact: 'medium'
            }
          ]
        },
        {
          category: 'intent',
          name: 'Purchase Intent',
          score: 80,
          maxScore: 200,
          weight: 0.3,
          description: 'Actions indicating buying intention',
          metrics: [
            {
              id: 'pricing_views',
              name: 'Pricing Page Views',
              description: 'Number of times user viewed pricing',
              weight: 0.5,
              currentValue: 1,
              maxValue: 5,
              trend: 'stable',
              impact: 'medium'
            }
          ]
        },
        {
          category: 'activity',
          name: 'Activity Level',
          score: 100,
          maxScore: 200,
          weight: 0.2,
          description: 'Overall activity and interaction frequency',
          metrics: [
            {
              id: 'session_frequency',
              name: 'Session Frequency',
              description: 'How often user visits',
              weight: 0.4,
              currentValue: 3,
              maxValue: 10,
              trend: 'stable',
              impact: 'medium'
            }
          ]
        },
        {
          category: 'recency',
          name: 'Recency Score',
          score: 120,
          maxScore: 200,
          weight: 0.15,
          description: 'How recently user was active',
          metrics: [
            {
              id: 'last_visit',
              name: 'Last Visit',
              description: 'Time since last activity',
              weight: 1.0,
              currentValue: 60,
              maxValue: 100,
              trend: 'down',
              impact: 'high'
            }
          ]
        },
        {
          category: 'value',
          name: 'Value Alignment',
          score: 30,
          maxScore: 200,
          weight: 0.1,
          description: 'Alignment with high-value customer profile',
          metrics: [
            {
              id: 'company_size',
              name: 'Company Size Match',
              description: 'Matches target company size',
              weight: 0.5,
              currentValue: 30,
              maxValue: 100,
              trend: 'stable',
              impact: 'low'
            }
          ]
        }
      ],
      insights: [
        'Moderate engagement suggests casual interest',
        'Limited pricing page views indicate early evaluation stage',
        'Infrequent visits may require nurturing campaign',
        'Lower value alignment suggests different use case'
      ],
      predictedActions: [
        {
          action: 'Download Content',
          probability: 45,
          timeframe: 'Next week'
        },
        {
          action: 'Subscribe to Newsletter',
          probability: 35,
          timeframe: 'Next few days'
        },
        {
          action: 'Request Information',
          probability: 25,
          timeframe: 'Next 2 weeks'
        }
      ]
    },
    {
      visitorId: 'visitor_003',
      sessionId: 'session_ghi789',
      totalScore: 180,
      maxScore: 1000,
      scorePercentage: 18.0,
      tier: 'cold',
      lastUpdated: '2024-07-17T14:20:00Z',
      factors: [
        {
          category: 'engagement',
          name: 'Page Engagement',
          score: 40,
          maxScore: 200,
          weight: 0.25,
          description: 'Time spent on pages, scroll depth, interactions',
          metrics: [
            {
              id: 'time_on_page',
              name: 'Avg Time on Page',
              description: 'Average time spent on each page',
              weight: 0.4,
              currentValue: 25,
              maxValue: 180,
              trend: 'down',
              impact: 'low'
            }
          ]
        },
        {
          category: 'intent',
          name: 'Purchase Intent',
          score: 20,
          maxScore: 200,
          weight: 0.3,
          description: 'Actions indicating buying intention',
          metrics: [
            {
              id: 'pricing_views',
              name: 'Pricing Page Views',
              description: 'Number of times user viewed pricing',
              weight: 0.5,
              currentValue: 0,
              maxValue: 5,
              trend: 'stable',
              impact: 'low'
            }
          ]
        },
        {
          category: 'activity',
          name: 'Activity Level',
          score: 30,
          maxScore: 200,
          weight: 0.2,
          description: 'Overall activity and interaction frequency',
          metrics: [
            {
              id: 'session_frequency',
              name: 'Session Frequency',
              description: 'How often user visits',
              weight: 0.4,
              currentValue: 1,
              maxValue: 10,
              trend: 'stable',
              impact: 'low'
            }
          ]
        },
        {
          category: 'recency',
          name: 'Recency Score',
          score: 50,
          maxScore: 200,
          weight: 0.15,
          description: 'How recently user was active',
          metrics: [
            {
              id: 'last_visit',
              name: 'Last Visit',
              description: 'Time since last activity',
              weight: 1.0,
              currentValue: 25,
              maxValue: 100,
              trend: 'down',
              impact: 'high'
            }
          ]
        },
        {
          category: 'value',
          name: 'Value Alignment',
          score: 40,
          maxScore: 200,
          weight: 0.1,
          description: 'Alignment with high-value customer profile',
          metrics: [
            {
              id: 'company_size',
              name: 'Company Size Match',
              description: 'Matches target company size',
              weight: 0.5,
              currentValue: 40,
              maxValue: 100,
              trend: 'stable',
              impact: 'low'
            }
          ]
        }
      ],
      insights: [
        'Very low engagement indicates minimal interest',
        'Single visit suggests bounce or accidental traffic',
        'No pricing exploration indicates early awareness stage',
        'Needs re-engagement campaign to reactivate interest'
      ],
      predictedActions: [
        {
          action: 'Return Visit',
          probability: 15,
          timeframe: 'Next month'
        },
        {
          action: 'Email Engagement',
          probability: 8,
          timeframe: 'Next 2 weeks'
        }
      ]
    }
  ], []);

  const activeScores = visitorScores.length > 0 ? visitorScores : demoScores;

  // Filter and sort scores
  const filteredScores = useMemo(() => {
    let filtered = activeScores;
    
    if (tierFilter !== 'all') {
      filtered = filtered.filter(score => score.tier === tierFilter);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.totalScore - a.totalScore;
        case 'recency':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'engagement':
          const aEngagement = a.factors.find(f => f.category === 'engagement')?.score || 0;
          const bEngagement = b.factors.find(f => f.category === 'engagement')?.score || 0;
          return bEngagement - aEngagement;
        default:
          return 0;
      }
    });
  }, [activeScores, tierFilter, sortBy]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = activeScores.length;
    const hot = activeScores.filter(s => s.tier === 'hot').length;
    const warm = activeScores.filter(s => s.tier === 'warm').length;
    const cold = activeScores.filter(s => s.tier === 'cold').length;
    const avgScore = activeScores.reduce((sum, s) => sum + s.scorePercentage, 0) / total;
    
    return {
      total,
      hot,
      warm,
      cold,
      avgScore: Math.round(avgScore * 10) / 10,
      hotPercentage: (hot / total) * 100,
      warmPercentage: (warm / total) * 100,
      coldPercentage: (cold / total) * 100
    };
  }, [activeScores]);

  const getTierColor = useCallback((tier: string) => {
    switch (tier) {
      case 'hot': return 'text-red-600 bg-red-100 border-red-300';
      case 'warm': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'cold': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'new': return 'text-gray-600 bg-gray-100 border-gray-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  }, []);

  const getTierIcon = useCallback((tier: string) => {
    switch (tier) {
      case 'hot': return <TrendingUp className="h-4 w-4" />;
      case 'warm': return <Activity className="h-4 w-4" />;
      case 'cold': return <TrendingDown className="h-4 w-4" />;
      case 'new': return <Eye className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  }, []);

  const getScoreColor = useCallback((percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  const formatTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Behavioral Scoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-150"></div>
              <span className="ml-2 text-gray-500">Analyzing visitor behavior...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Behavioral Scoring Engine
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered visitor behavior analysis and lead scoring
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Tiers</option>
                <option value="hot">Hot Leads</option>
                <option value="warm">Warm Leads</option>
                <option value="cold">Cold Leads</option>
                <option value="new">New Visitors</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="score">Sort by Score</option>
                <option value="recency">Sort by Recency</option>
                <option value="engagement">Sort by Engagement</option>
              </select>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto text-gray-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.total}</div>
              <div className="text-xs text-gray-500">Total Visitors</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto text-red-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.hot}</div>
              <div className="text-xs text-gray-500">Hot Leads</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Activity className="h-6 w-6 mx-auto text-orange-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.warm}</div>
              <div className="text-xs text-gray-500">Warm Leads</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <TrendingDown className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.cold}</div>
              <div className="text-xs text-gray-500">Cold Leads</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.avgScore}%</div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 mb-6">
            {['overview', 'detailed', 'algorithm'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visitor Scores List */}
          <Card>
            <CardHeader>
              <CardTitle>Visitor Scores</CardTitle>
              <p className="text-sm text-gray-600">
                Showing {filteredScores.length} of {summaryStats.total} visitors
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredScores.slice(0, 10).map((score) => (
                  <div
                    key={score.visitorId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getTierColor(score.tier).replace('text-', 'bg-').replace('-600', '-100')}`}>
                        {getTierIcon(score.tier)}
                      </div>
                      <div>
                        <div className="font-medium">Visitor {score.visitorId.slice(-6)}</div>
                        <div className="text-sm text-gray-500">{formatTimeAgo(score.lastUpdated)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getScoreColor(score.scorePercentage)}`}>
                        {score.scorePercentage.toFixed(1)}%
                      </div>
                      <Badge className={getTierColor(score.tier)}>
                        {score.tier.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Hot Leads (80-100%)
                    </span>
                    <span className="font-medium">{summaryStats.hotPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all" 
                      style={{ width: `${summaryStats.hotPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      Warm Leads (50-79%)
                    </span>
                    <span className="font-medium">{summaryStats.warmPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all" 
                      style={{ width: `${summaryStats.warmPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Cold Leads (0-49%)
                    </span>
                    <span className="font-medium">{summaryStats.coldPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all" 
                      style={{ width: `${summaryStats.coldPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-3">Top Predicted Actions</h4>
                <div className="space-y-2">
                  {demoScores[0]?.predictedActions.slice(0, 3).map((action, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{action.action}</span>
                      <span className="font-medium text-green-600">{action.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Mode */}
      {viewMode === 'detailed' && filteredScores[0] && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Score Analysis - Visitor {filteredScores[0].visitorId.slice(-6)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Factors */}
              <div className="space-y-4">
                <h3 className="font-medium">Scoring Factors</h3>
                {filteredScores[0].factors.map((factor) => (
                  <div key={factor.category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{factor.name}</h4>
                      <div className="text-right">
                        <div className="font-semibold">{factor.score}/{factor.maxScore}</div>
                        <div className="text-sm text-gray-500">Weight: {(factor.weight * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{factor.description}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Insights and Predictions */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">AI Insights</h3>
                  <div className="space-y-2">
                    {filteredScores[0].insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Predicted Actions</h3>
                  <div className="space-y-3">
                    {filteredScores[0].predictedActions.map((prediction, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{prediction.action}</span>
                          <Badge variant={prediction.probability > 60 ? "default" : "secondary"}>
                            {prediction.probability}%
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Expected: {prediction.timeframe}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div 
                            className="bg-green-500 h-1 rounded-full transition-all" 
                            style={{ width: `${prediction.probability}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Algorithm Mode */}
      {viewMode === 'algorithm' && (
        <Card>
          <CardHeader>
            <CardTitle>Scoring Algorithm</CardTitle>
            <p className="text-sm text-gray-600">
              Understanding how behavioral scores are calculated
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Scoring Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Engagement', weight: 25, description: 'Time on page, scroll depth, interactions', icon: <Eye className="h-5 w-5" /> },
                    { name: 'Intent', weight: 30, description: 'Pricing views, demo requests, feature exploration', icon: <Target className="h-5 w-5" /> },
                    { name: 'Activity', weight: 20, description: 'Session frequency, pages per session, return visits', icon: <Activity className="h-5 w-5" /> },
                    { name: 'Recency', weight: 15, description: 'How recently user was active', icon: <Clock className="h-5 w-5" /> },
                    { name: 'Frequency', weight: 5, description: 'Consistency of engagement over time', icon: <RefreshCw className="h-5 w-5" /> },
                    { name: 'Value', weight: 5, description: 'Alignment with ideal customer profile', icon: <Star className="h-5 w-5" /> }
                  ].map((component) => (
                    <div key={component.name} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-blue-500">{component.icon}</div>
                        <h4 className="font-medium">{component.name}</h4>
                      </div>
                      <div className="text-lg font-semibold mb-1">{component.weight}%</div>
                      <p className="text-sm text-gray-600">{component.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Tier Classification</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="font-medium text-red-900">Hot Leads (80-100%)</div>
                      <div className="text-sm text-red-700">High intent, frequent engagement, recent activity</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="font-medium text-orange-900">Warm Leads (50-79%)</div>
                      <div className="text-sm text-orange-700">Moderate engagement, some intent signals</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-blue-900">Cold Leads (20-49%)</div>
                      <div className="text-sm text-blue-700">Low engagement, minimal intent, needs nurturing</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Eye className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">New Visitors (0-19%)</div>
                      <div className="text-sm text-gray-700">Insufficient data for proper scoring</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

BehavioralScoring.displayName = 'BehavioralScoring';

export { BehavioralScoring };
export default BehavioralScoring;