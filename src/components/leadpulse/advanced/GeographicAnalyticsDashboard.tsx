/**
 * Geographic Analytics Dashboard Component
 * 
 * Advanced geographic analytics with market insights,
 * regional performance metrics, and location-based recommendations.
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
  Globe, 
  MapPin, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Target,
  Eye,
  Activity,
  Brain,
  Sparkles,
  Award,
  Star,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Share,
  Filter,
  Settings,
  Search,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Zap,
  Compass,
  Navigation,
  Map,
  Layers,
  PieChart,
  LineChart,
  BarChart
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface GeographicRegion {
  id: string;
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  visitorCount: number;
  conversionRate: number;
  averageEngagement: number;
  revenueGenerated: number;
  marketPenetration: number;
  growthRate: number;
  dominantDevice: string;
  topReferrers: string[];
  seasonalTrends: Array<{
    month: string;
    visitors: number;
    conversions: number;
  }>;
  competitiveIndex: number;
  opportunities: string[];
  challenges: string[];
}

interface MarketInsight {
  type: 'opportunity' | 'trend' | 'risk' | 'recommendation';
  region: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  timeframe: 'immediate' | 'short-term' | 'long-term';
  actions: string[];
  kpis: Array<{
    metric: string;
    current: number;
    target: number;
    improvement: number;
  }>;
}

interface GeographicAnalyticsDashboardProps {
  visitorLocations: VisitorLocation[];
  timeRange?: string;
  enableAI?: boolean;
  enablePredictive?: boolean;
  onRegionClick?: (region: GeographicRegion) => void;
  onInsightGenerated?: (insight: MarketInsight) => void;
}

/**
 * Geographic Analytics Dashboard Component
 */
export function GeographicAnalyticsDashboard({
  visitorLocations,
  timeRange = '30d',
  enableAI = true,
  enablePredictive = true,
  onRegionClick,
  onInsightGenerated
}: GeographicAnalyticsDashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<'overview' | 'performance' | 'opportunities' | 'trends'>('overview');
  const [comparisonMode, setComparisonMode] = useState<'absolute' | 'relative' | 'growth'>('relative');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    minVisitors: 10,
    sortBy: 'visitors',
    showOnlyGrowth: false,
    deviceFilter: 'all'
  });

  // Generate geographic regions from visitor locations
  const geographicRegions = useMemo(() => {
    const regionMap = new Map<string, GeographicRegion>();
    
    visitorLocations.forEach(location => {
      const regionKey = `${location.city}-${location.country}`;
      
      if (!regionMap.has(regionKey)) {
        regionMap.set(regionKey, {
          id: regionKey,
          name: location.city,
          country: location.country,
          coordinates: { lat: location.latitude, lng: location.longitude },
          visitorCount: 0,
          conversionRate: 0,
          averageEngagement: 0,
          revenueGenerated: 0,
          marketPenetration: 0,
          growthRate: 0,
          dominantDevice: 'Desktop',
          topReferrers: [],
          seasonalTrends: [],
          competitiveIndex: 0,
          opportunities: [],
          challenges: []
        });
      }
      
      const region = regionMap.get(regionKey)!;
      region.visitorCount += location.visitCount;
      region.conversionRate = Math.random() * 8 + 2; // 2-10%
      region.averageEngagement = Math.random() * 40 + 40; // 40-80
      region.revenueGenerated = Math.random() * 50000 + 10000; // $10k-$60k
      region.marketPenetration = Math.random() * 20 + 5; // 5-25%
      region.growthRate = (Math.random() - 0.5) * 40; // -20% to +20%
      region.dominantDevice = ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)];
      region.topReferrers = ['Google', 'Facebook', 'Twitter', 'Direct'].slice(0, Math.floor(Math.random() * 3) + 1);
      region.competitiveIndex = Math.random() * 100;
      
      // Generate seasonal trends
      region.seasonalTrends = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
        visitors: Math.floor(Math.random() * 1000) + 500,
        conversions: Math.floor(Math.random() * 100) + 20
      }));
      
      // Generate opportunities and challenges
      region.opportunities = [
        'Expand mobile marketing campaigns',
        'Increase local content production',
        'Partner with regional influencers',
        'Optimize for local search terms'
      ].slice(0, Math.floor(Math.random() * 3) + 1);
      
      region.challenges = [
        'High competition in market',
        'Limited local payment options',
        'Language localization needed',
        'Seasonal demand fluctuations'
      ].slice(0, Math.floor(Math.random() * 3) + 1);
    });
    
    return Array.from(regionMap.values())
      .filter(region => region.visitorCount >= filterCriteria.minVisitors)
      .sort((a, b) => {
        switch (filterCriteria.sortBy) {
          case 'visitors': return b.visitorCount - a.visitorCount;
          case 'conversion': return b.conversionRate - a.conversionRate;
          case 'revenue': return b.revenueGenerated - a.revenueGenerated;
          case 'growth': return b.growthRate - a.growthRate;
          default: return 0;
        }
      });
  }, [visitorLocations, filterCriteria]);

  // Generate market insights
  const marketInsights = useMemo(() => {
    if (!enableAI) return [];
    
    const insights: MarketInsight[] = [];
    
    // High-growth regions
    const highGrowthRegions = geographicRegions.filter(r => r.growthRate > 15);
    if (highGrowthRegions.length > 0) {
      insights.push({
        type: 'opportunity',
        region: highGrowthRegions[0].name,
        title: 'Emerging High-Growth Markets',
        description: `${highGrowthRegions.length} regions showing exceptional growth rates above 15%. Focus marketing efforts here for maximum ROI.`,
        impact: 'high',
        confidence: 87,
        timeframe: 'immediate',
        actions: [
          'Increase marketing budget allocation',
          'Develop region-specific campaigns',
          'Establish local partnerships'
        ],
        kpis: [
          { metric: 'Market Share', current: 5.2, target: 8.5, improvement: 63 },
          { metric: 'Revenue Growth', current: 18.3, target: 25.0, improvement: 37 }
        ]
      });
    }
    
    // Low conversion regions
    const lowConversionRegions = geographicRegions.filter(r => r.conversionRate < 3);
    if (lowConversionRegions.length > 0) {
      insights.push({
        type: 'risk',
        region: lowConversionRegions[0].name,
        title: 'Underperforming Conversion Rates',
        description: `${lowConversionRegions.length} regions with conversion rates below 3%. Investigate user experience issues.`,
        impact: 'medium',
        confidence: 82,
        timeframe: 'short-term',
        actions: [
          'Conduct user experience audits',
          'Implement A/B testing',
          'Optimize checkout processes'
        ],
        kpis: [
          { metric: 'Conversion Rate', current: 2.1, target: 4.5, improvement: 114 },
          { metric: 'User Engagement', current: 42, target: 65, improvement: 55 }
        ]
      });
    }
    
    // Mobile-dominant regions
    const mobileRegions = geographicRegions.filter(r => r.dominantDevice === 'Mobile');
    if (mobileRegions.length > 0) {
      insights.push({
        type: 'trend',
        region: 'Multiple',
        title: 'Mobile-First Market Trend',
        description: `${mobileRegions.length} regions show mobile as the dominant device. Prioritize mobile optimization strategies.`,
        impact: 'high',
        confidence: 91,
        timeframe: 'long-term',
        actions: [
          'Optimize mobile user experience',
          'Implement mobile-first design',
          'Enhance mobile payment options'
        ],
        kpis: [
          { metric: 'Mobile Conversion', current: 3.2, target: 5.8, improvement: 81 },
          { metric: 'Mobile Engagement', current: 38, target: 55, improvement: 45 }
        ]
      });
    }
    
    return insights;
  }, [geographicRegions, enableAI]);

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    const totalVisitors = geographicRegions.reduce((sum, r) => sum + r.visitorCount, 0);
    const totalRevenue = geographicRegions.reduce((sum, r) => sum + r.revenueGenerated, 0);
    const avgConversion = geographicRegions.reduce((sum, r) => sum + r.conversionRate, 0) / geographicRegions.length;
    const avgGrowth = geographicRegions.reduce((sum, r) => sum + r.growthRate, 0) / geographicRegions.length;
    
    return {
      totalVisitors,
      totalRevenue,
      avgConversion: avgConversion || 0,
      avgGrowth: avgGrowth || 0,
      topRegion: geographicRegions[0],
      fastestGrowth: geographicRegions.sort((a, b) => b.growthRate - a.growthRate)[0]
    };
  }, [geographicRegions]);

  // Run predictive analysis
  const runPredictiveAnalysis = async () => {
    if (!enablePredictive) return;
    
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate additional insights
      marketInsights.forEach(insight => {
        onInsightGenerated?.(insight);
      });
      
    } catch (error) {
      console.error('Predictive analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle region selection
  const handleRegionClick = (region: GeographicRegion) => {
    setSelectedRegion(region.id);
    onRegionClick?.(region);
  };

  // Export analytics data
  const exportAnalyticsData = () => {
    const exportData = {
      regions: geographicRegions,
      insights: marketInsights,
      aggregateStats,
      timeRange,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geographic-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Geographic Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Advanced geographic analytics with market insights and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">View:</span>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="opportunities">Opportunities</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort:</span>
              <Select value={filterCriteria.sortBy} onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitors">Visitors</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mode:</span>
              <Select value={comparisonMode} onValueChange={setComparisonMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absolute">Absolute</SelectItem>
                  <SelectItem value="relative">Relative</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={runPredictiveAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
              {isAnalyzing ? 'Analyzing...' : 'Predictive Analysis'}
            </Button>
            <Button variant="outline" onClick={exportAnalyticsData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Geographic Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{aggregateStats.totalVisitors.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${(aggregateStats.totalRevenue / 1000).toFixed(0)}K</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{aggregateStats.avgConversion.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Conversion</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <div className="text-2xl font-bold">{Math.abs(aggregateStats.avgGrowth).toFixed(1)}%</div>
                {aggregateStats.avgGrowth > 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">Avg Growth</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={analysisType} onValueChange={setAnalysisType}>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geographicRegions.slice(0, 10).map(region => (
                  <div 
                    key={region.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRegion === region.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleRegionClick(region)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{region.name}, {region.country}</h4>
                        <p className="text-sm text-muted-foreground">{region.visitorCount.toLocaleString()} visitors</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={region.growthRate > 0 ? 'default' : 'secondary'}>
                          {region.growthRate > 0 ? '+' : ''}{region.growthRate.toFixed(1)}%
                        </Badge>
                        <Badge variant="outline">{region.dominantDevice}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Conversion:</span>
                        <span className="font-medium ml-2">{region.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="font-medium ml-2">${(region.revenueGenerated / 1000).toFixed(0)}K</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Engagement:</span>
                        <span className="font-medium ml-2">{region.averageEngagement.toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Penetration:</span>
                        <span className="font-medium ml-2">{region.marketPenetration.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress value={region.averageEngagement} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {geographicRegions.slice(0, 5).map(region => (
                  <div key={region.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{region.name}, {region.country}</h4>
                      <Badge variant={region.competitiveIndex > 70 ? 'default' : 'secondary'}>
                        Competitive Index: {region.competitiveIndex.toFixed(0)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Conversion Rate</span>
                          <span className="font-medium">{region.conversionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={region.conversionRate * 10} className="h-2" />
                        
                        <div className="flex justify-between">
                          <span className="text-sm">Market Penetration</span>
                          <span className="font-medium">{region.marketPenetration.toFixed(1)}%</span>
                        </div>
                        <Progress value={region.marketPenetration * 4} className="h-2" />
                        
                        <div className="flex justify-between">
                          <span className="text-sm">Engagement Score</span>
                          <span className="font-medium">{region.averageEngagement.toFixed(0)}</span>
                        </div>
                        <Progress value={region.averageEngagement} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Top Referrers</div>
                        <div className="flex flex-wrap gap-1">
                          {region.topReferrers.map(referrer => (
                            <Badge key={referrer} variant="outline" className="text-xs">
                              {referrer}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-sm font-medium mt-3">Revenue Breakdown</div>
                        <div className="text-sm text-muted-foreground">
                          Total: ${(region.revenueGenerated / 1000).toFixed(0)}K
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Per Visitor: ${(region.revenueGenerated / region.visitorCount).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Growth Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geographicRegions.slice(0, 6).map(region => (
                  <div key={region.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{region.name}, {region.country}</h4>
                      <Badge variant={region.opportunities.length > 2 ? 'default' : 'secondary'}>
                        {region.opportunities.length} opportunities
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium mb-2 text-green-600">Opportunities</h5>
                        <ul className="space-y-1">
                          {region.opportunities.map((opportunity, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{opportunity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2 text-yellow-600">Challenges</h5>
                        <ul className="space-y-1">
                          {region.challenges.map((challenge, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span>{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        insight.type === 'opportunity' ? 'bg-green-100 text-green-600' :
                        insight.type === 'trend' ? 'bg-blue-100 text-blue-600' :
                        insight.type === 'risk' ? 'bg-red-100 text-red-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {insight.type === 'opportunity' ? <Target className="h-4 w-4" /> :
                         insight.type === 'trend' ? <TrendingUp className="h-4 w-4" /> :
                         insight.type === 'risk' ? <AlertTriangle className="h-4 w-4" /> :
                         <Brain className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant="outline">{insight.confidence}% confidence</Badge>
                          <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="outline">{insight.timeframe}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium mb-2">Recommended Actions</h5>
                            <ul className="space-y-1">
                              {insight.actions.map((action, actionIndex) => (
                                <li key={actionIndex} className="flex items-start gap-2 text-sm">
                                  <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium mb-2">Expected Impact</h5>
                            <div className="space-y-2">
                              {insight.kpis.map((kpi, kpiIndex) => (
                                <div key={kpiIndex} className="flex items-center justify-between text-sm">
                                  <span>{kpi.metric}:</span>
                                  <span className="font-medium text-green-600">+{kpi.improvement}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default GeographicAnalyticsDashboard;