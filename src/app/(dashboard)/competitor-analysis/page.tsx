"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Eye, Search, Shield, Target, 
  Zap, BarChart3, PieChart, Activity, Users, DollarSign, Globe, Clock,
  RefreshCw, Bell, Settings, Download, Upload, Plus, Minus, CheckCircle,
  XCircle, ArrowUpRight, ArrowDownRight, Brain, Sparkles, MonitorSpeaker,
  Radar, Binoculars, Crosshair, Award, Map, Calendar, Filter, Star,
  ChevronRight, ChevronDown, PlayCircle, PauseCircle, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface Competitor {
  id: string;
  name: string;
  domain: string;
  industry: string;
  marketShare: number;
  monthlyVisitors: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  priceRange: string;
  features: string[];
  strengths: string[];
  weaknesses: string[];
  recentActivity: string[];
  socialFollowers: {
    twitter: number;
    linkedin: number;
    facebook: number;
    instagram: number;
  };
  fundingStatus: string;
  keyPersonnel: string[];
  marketPosition: string;
  lastUpdated: string;
}

interface CompetitorIntelligence {
  marketTrends: {
    trend: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
    source: string;
  }[];
  pricingIntelligence: {
    competitor: string;
    pricing: string;
    change: number;
    timeframe: string;
  }[];
  featureUpdates: {
    competitor: string;
    feature: string;
    impact: 'threat' | 'opportunity' | 'neutral';
    description: string;
  }[];
  marketMovements: {
    competitor: string;
    movement: string;
    significance: 'high' | 'medium' | 'low';
    implications: string;
  }[];
}

export default function CompetitorAnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes

  // Competitor Analysis Engine
  const competitorAnalyticsEngine = {
    analyzeCompetitorLandscape: async (industry: string, market: string) => {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'competitive_analysis',
            type: 'landscape_analysis',
            data: {
              industry,
              market,
              analysisDepth: 'comprehensive',
              includeFinancials: true,
              includeSocialMedia: true,
              includeProductFeatures: true,
              timeframe: '12_months'
            }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          setAnalysisResults(result.data);
          toast.success('Competitor landscape analysis completed');
          return result.data;
        }
      } catch (error) {
        console.error('Analysis failed:', error);
        toast.error('Failed to analyze competitor landscape');
      } finally {
        setIsAnalyzing(false);
      }
    },

    performThreatAssessment: async (competitorId: string) => {
      try {
        const response = await fetch('/api/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'threat_assessment',
            type: 'competitor_threat',
            data: {
              competitorId,
              assessmentCriteria: ['market_share', 'feature_parity', 'pricing', 'growth_rate'],
              timeframe: '6_months',
              includeAfrican: true
            }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.error('Threat assessment failed:', error);
      }
    },

    generateCompetitiveStrategy: async (competitorData: any) => {
      try {
        const response = await fetch('/api/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'strategy_generation',
            type: 'competitive_strategy',
            data: {
              competitorData,
              marketContext: 'african_fintech',
              strategicGoals: ['market_expansion', 'feature_differentiation', 'pricing_optimization'],
              timeframe: '12_months'
            }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.error('Strategy generation failed:', error);
      }
    },

    monitorRealTimeChanges: async () => {
      try {
        const response = await fetch('/api/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'real_time_monitoring',
            type: 'competitor_changes',
            data: {
              monitoringTypes: ['pricing', 'features', 'marketing', 'social_media'],
              alertThreshold: 'medium',
              includeAfrican: true,
              updateFrequency: '1_hour'
            }
          })
        });
        
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.error('Real-time monitoring failed:', error);
      }
    }
  };

  // Mock data for demonstration
  const [competitors, setCompetitors] = useState<Competitor[]>([
    {
      id: '1',
      name: 'Paystack',
      domain: 'paystack.com',
      industry: 'Fintech Payments',
      marketShare: 35.2,
      monthlyVisitors: 2500000,
      threatLevel: 'high',
      priceRange: '1.5% - 3.9%',
      features: ['Payment Processing', 'Subscriptions', 'Invoicing', 'Analytics'],
      strengths: ['Developer-friendly', 'Strong API', 'Local partnerships'],
      weaknesses: ['Limited to payments', 'No marketing automation'],
      recentActivity: ['New terminal product launch', 'Partnership with banks'],
      socialFollowers: {
        twitter: 125000,
        linkedin: 85000,
        facebook: 60000,
        instagram: 45000
      },
      fundingStatus: 'Series B - $200M',
      keyPersonnel: ['Shola Akinlade', 'Ezra Olubi'],
      marketPosition: 'Market Leader',
      lastUpdated: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Flutterwave',
      domain: 'flutterwave.com',
      industry: 'Fintech Payments',
      marketShare: 28.7,
      monthlyVisitors: 1800000,
      threatLevel: 'high',
      priceRange: '1.4% - 3.8%',
      features: ['Payment Gateway', 'Remittances', 'FX Trading', 'Banking'],
      strengths: ['Pan-African reach', 'Multi-currency', 'Strong brand'],
      weaknesses: ['Complex pricing', 'Limited marketing tools'],
      recentActivity: ['Expansion to new markets', 'New partnership deals'],
      socialFollowers: {
        twitter: 95000,
        linkedin: 72000,
        facebook: 88000,
        instagram: 52000
      },
      fundingStatus: 'Series C - $250M',
      keyPersonnel: ['Olugbenga Agboola', 'Iyinoluwa Aboyeji'],
      marketPosition: 'Strong Challenger',
      lastUpdated: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Mailchimp',
      domain: 'mailchimp.com',
      industry: 'Email Marketing',
      marketShare: 42.1,
      monthlyVisitors: 15000000,
      threatLevel: 'medium',
      priceRange: '$10 - $299/month',
      features: ['Email Marketing', 'Automation', 'Landing Pages', 'Analytics'],
      strengths: ['Market leader', 'Easy to use', 'Great templates'],
      weaknesses: ['Expensive', 'Limited African focus', 'No SMS/WhatsApp'],
      recentActivity: ['AI features launch', 'Pricing adjustments'],
      socialFollowers: {
        twitter: 180000,
        linkedin: 120000,
        facebook: 250000,
        instagram: 85000
      },
      fundingStatus: 'Public Company',
      keyPersonnel: ['Ben Chestnut', 'Dan Kurzius'],
      marketPosition: 'Global Leader',
      lastUpdated: new Date().toISOString()
    }
  ]);

  const [intelligence, setIntelligence] = useState<CompetitorIntelligence>({
    marketTrends: [
      {
        trend: 'Increased adoption of WhatsApp Business API in Africa',
        impact: 'positive',
        confidence: 89,
        source: 'Market Research'
      },
      {
        trend: 'Rising demand for multi-channel marketing automation',
        impact: 'positive',
        confidence: 92,
        source: 'Industry Reports'
      },
      {
        trend: 'Regulatory changes in data privacy across Africa',
        impact: 'neutral',
        confidence: 76,
        source: 'Legal Analysis'
      }
    ],
    pricingIntelligence: [
      {
        competitor: 'Paystack',
        pricing: '1.5% - 3.9%',
        change: 0.2,
        timeframe: 'Last 30 days'
      },
      {
        competitor: 'Mailchimp',
        pricing: '$10 - $299/month',
        change: 15,
        timeframe: 'Last 60 days'
      }
    ],
    featureUpdates: [
      {
        competitor: 'Paystack',
        feature: 'Terminal Hardware',
        impact: 'opportunity',
        description: 'New POS terminal could indicate expansion beyond online payments'
      },
      {
        competitor: 'Flutterwave',
        feature: 'FX Trading Platform',
        impact: 'threat',
        description: 'Direct competition with our multi-currency features'
      }
    ],
    marketMovements: [
      {
        competitor: 'Paystack',
        movement: 'Partnership with First Bank Nigeria',
        significance: 'high',
        implications: 'Strengthens their banking relationships and market position'
      },
      {
        competitor: 'Mailchimp',
        movement: 'African market expansion initiative',
        significance: 'medium',
        implications: 'Potential direct competition in our primary market'
      }
    ]
  });

  // Real-time updates
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        competitorAnalyticsEngine.monitorRealTimeChanges();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleAnalyzeCompetitor = async (competitorId: string) => {
    const threatAssessment = await competitorAnalyticsEngine.performThreatAssessment(competitorId);
    const strategy = await competitorAnalyticsEngine.generateCompetitiveStrategy(threatAssessment);
    
    toast.success('Competitor analysis completed with AI insights');
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getThreatTextColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredCompetitors = competitors.filter(competitor =>
    competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    competitor.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Radar className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Competitor Analysis Intelligence
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              AI-powered competitive intelligence and threat assessment
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => competitorAnalyticsEngine.analyzeCompetitorLandscape('fintech', 'africa')}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            AI Analysis
          </Button>
          
          <Dialog open={showAddCompetitor} onOpenChange={setShowAddCompetitor}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Competitor</DialogTitle>
                <DialogDescription>
                  Add a new competitor to monitor and analyze
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Company Name</Label>
                    <Input id="name" placeholder="Enter company name" />
                  </div>
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input id="domain" placeholder="company.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" placeholder="e.g., Fintech, SaaS" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the competitor" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddCompetitor(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowAddCompetitor(false)}>
                    Add Competitor
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={realTimeAlerts}
              onCheckedChange={setRealTimeAlerts}
              id="real-time-alerts"
            />
            <Label htmlFor="real-time-alerts" className="text-sm">Real-time Alerts</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <Label htmlFor="auto-refresh" className="text-sm">Auto Refresh</Label>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search competitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Market Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tracked Competitors
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {competitors.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      High Threat Level
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {competitors.filter(c => c.threatLevel === 'high').length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Market Coverage
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {competitors.reduce((sum, c) => sum + c.marketShare, 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <PieChart className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Monitoring
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      24/7
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <Activity className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Share Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Market Share Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getThreatColor(competitor.threatLevel)}`} />
                      <span className="font-medium">{competitor.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {competitor.industry}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={competitor.marketShare} className="h-2" />
                      </div>
                      <span className="text-sm font-medium min-w-[50px]">
                        {competitor.marketShare}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Recent Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {intelligence.marketTrends.slice(0, 3).map((trend, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      trend.impact === 'positive' ? 'bg-green-500' :
                      trend.impact === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{trend.trend}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {trend.confidence}% confidence
                        </Badge>
                        <span className="text-xs text-gray-500">{trend.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompetitors.map((competitor) => (
              <Card key={competitor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getThreatColor(competitor.threatLevel)}`} />
                      <div>
                        <CardTitle className="text-lg">{competitor.name}</CardTitle>
                        <CardDescription>{competitor.domain}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={getThreatTextColor(competitor.threatLevel)}>
                      {competitor.threatLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Market Share</p>
                      <p className="text-lg font-semibold">{competitor.marketShare}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Visitors</p>
                      <p className="text-lg font-semibold">
                        {(competitor.monthlyVisitors / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Key Features</p>
                    <div className="flex flex-wrap gap-1">
                      {competitor.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {competitor.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{competitor.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recent Activity</p>
                    <div className="space-y-1">
                      {competitor.recentActivity.slice(0, 2).map((activity, index) => (
                        <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          • {activity}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyzeCompetitor(competitor.id)}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCompetitor(competitor)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {intelligence.marketTrends.map((trend, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        trend.impact === 'positive' ? 'bg-green-500' :
                        trend.impact === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{trend.trend}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {trend.confidence}% confidence
                          </Badge>
                          <span className="text-xs text-gray-500">{trend.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pricing Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {intelligence.pricingIntelligence.map((pricing, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pricing.competitor}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pricing.pricing}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center ${
                          pricing.change > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {pricing.change > 0 ? (
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-sm font-medium">
                            {Math.abs(pricing.change)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{pricing.timeframe}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Feature Updates & Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Recent Feature Updates</h4>
                  <div className="space-y-3">
                    {intelligence.featureUpdates.map((update, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{update.competitor}</span>
                          <Badge variant="outline" className={
                            update.impact === 'threat' ? 'text-red-600' :
                            update.impact === 'opportunity' ? 'text-green-600' : 'text-gray-600'
                          }>
                            {update.impact}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{update.feature}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {update.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Market Movements</h4>
                  <div className="space-y-3">
                    {intelligence.marketMovements.map((movement, index) => (
                      <div key={index} className="border-l-4 border-orange-500 pl-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{movement.competitor}</span>
                          <Badge variant="outline" className={
                            movement.significance === 'high' ? 'text-red-600' :
                            movement.significance === 'medium' ? 'text-orange-600' : 'text-gray-600'
                          }>
                            {movement.significance}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{movement.movement}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {movement.implications}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {competitors.map((competitor) => (
              <Card key={competitor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getThreatColor(competitor.threatLevel)}`} />
                      <div>
                        <CardTitle className="text-lg">{competitor.name}</CardTitle>
                        <CardDescription>{competitor.marketPosition}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={getThreatTextColor(competitor.threatLevel)}>
                      {competitor.threatLevel.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Threat Level</p>
                    <Progress 
                      value={
                        competitor.threatLevel === 'critical' ? 100 :
                        competitor.threatLevel === 'high' ? 75 :
                        competitor.threatLevel === 'medium' ? 50 : 25
                      } 
                      className="h-2"
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Key Strengths</p>
                    <div className="space-y-1">
                      {competitor.strengths.slice(0, 3).map((strength, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Weaknesses</p>
                    <div className="space-y-1">
                      {competitor.weaknesses.slice(0, 3).map((weakness, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span className="text-sm">{weakness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleAnalyzeCompetitor(competitor.id)}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Assess Threat
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI-Generated Strategic Recommendations
              </CardTitle>
              <CardDescription>
                Competitive strategies powered by Supreme-AI v3 analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Immediate Actions</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                        <div>
                          <p className="font-medium text-sm">Enhance WhatsApp Integration</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Competitors are gaining traction with WhatsApp Business API
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                        <div>
                          <p className="font-medium text-sm">Pricing Strategy Review</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Paystack's recent pricing changes create opportunity
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Long-term Strategy</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        <div>
                          <p className="font-medium text-sm">African Market Expansion</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Focus on underserved markets before competitors
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                        <div>
                          <p className="font-medium text-sm">AI-First Features</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Leverage AI capabilities for competitive advantage
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Button
                    onClick={() => competitorAnalyticsEngine.generateCompetitiveStrategy(competitors)}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate New Strategy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MonitorSpeaker className="h-5 w-5 mr-2" />
                  Monitoring Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="real-time-monitoring">Real-time Monitoring</Label>
                  <Switch
                    id="real-time-monitoring"
                    checked={realTimeAlerts}
                    onCheckedChange={setRealTimeAlerts}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-refresh-monitoring">Auto Refresh</Label>
                  <Switch
                    id="auto-refresh-monitoring"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Refresh Interval</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={refreshInterval / 60000}
                      onChange={(e) => setRefreshInterval(Number(e.target.value) * 60000)}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => competitorAnalyticsEngine.monitorRealTimeChanges()}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Alert History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Paystack pricing increase</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">New Flutterwave feature launch</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Market expansion announcement</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Monitoring Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Sources Active</span>
                  <Badge variant="outline">24/7</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Full Scan</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">15 minutes ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Competitors Tracked</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{competitors.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alerts This Week</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">12</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}