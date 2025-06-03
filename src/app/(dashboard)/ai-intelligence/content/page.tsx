"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, TrendingUp, Eye, Heart, Sparkles, 
  Brain, BarChart3, MessageSquare, Target, RefreshCw,
  Settings, Download, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useContentAnalytics } from '@/hooks/useContentAnalytics';
import StaticDashboardGrid, { type DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';

export default function ContentIntelligencePage() {
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const contentAnalytics = useContentAnalytics('dashboard-user');

  const analyzeContent = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      await contentAnalytics.analyzeContent(content, 'User Content Analysis');
      toast.success('Content analysis completed');
      setContent('');
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Content analytics refreshed');
  };

  const quickPrompts = [
    "Revolutionary fintech platform launching in Nigeria! Transform your banking experience with our AI-powered mobile app. Join thousands of satisfied customers today!",
    "Dear valued customer, we're excited to announce our new digital banking features. Experience seamless transactions with enhanced security.",
    "🚀 New Feature Alert! Send money instantly to any bank account in Nigeria. Zero fees for the first month. Download our app now!",
    "Unlock financial freedom with our comprehensive suite of banking solutions designed specifically for Nigerian entrepreneurs and businesses."
  ];

  // Mock time series data for charts
  const performanceData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(60 + Math.random() * 40 + Math.sin(idx * 0.2) * 10),
  }));

  const engagementData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(50 + Math.random() * 30 + Math.cos(idx * 0.15) * 8),
  }));

  // Sparkline data for stat panels
  const supremeScoreSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(80 + idx * 0.8 + Math.random() * 5),
  }));

  const engagementSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(70 + idx * 0.6 + Math.random() * 5),
  }));

  const sentimentSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(75 + idx * 0.5 + Math.random() * 4),
  }));

  const readabilitySparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(78 + idx * 0.7 + Math.random() * 6),
  }));

  // Content Analyzer Panel
  const ContentAnalyzerPanel = () => (
    <Panel 
      title="AI Content Analyzer" 
      toolbar={
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            Supreme-AI Powered
          </Badge>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            Enter content to analyze
          </label>
          <Textarea
            placeholder="Paste your marketing content here for AI analysis..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-24 bg-gray-800/50 border-gray-700 text-white"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={analyzeContent}
            disabled={analyzing || !content.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {analyzing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Content
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-xs text-gray-400 mb-2">Quick test samples:</p>
          <div className="space-y-2">
            {quickPrompts.slice(0, 2).map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setContent(prompt)}
                className="text-xs h-auto p-2 border-gray-700 text-gray-300 hover:bg-gray-800 text-left justify-start"
              >
                {prompt.substring(0, 60)}...
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );

  // Keywords Performance Panel
  const KeywordsPanel = () => (
    <Panel title="Top Keywords Performance">
      <div className="space-y-3 flex-1">
        {[
          { keyword: 'fintech', score: 94, trend: 'up' },
          { keyword: 'banking', score: 87, trend: 'up' },
          { keyword: 'digital', score: 82, trend: 'stable' },
          { keyword: 'payments', score: 78, trend: 'down' },
          { keyword: 'mobile', score: 75, trend: 'up' }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{item.keyword}</span>
              <Badge variant="outline" className="text-xs">
                {item.score}
              </Badge>
            </div>
            <div className={`text-xs ${item.trend === 'up' ? 'text-green-400' : item.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
              {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Define dashboard panels following successful pattern
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key Metrics
    {
      id: 'supreme_score',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Supreme Score"
          value={contentAnalytics.data?.overview.avgSupremeScore.toFixed(0) || '87'}
          unit="/100"
          isLoading={contentAnalytics.loading}
          trendValue="+5.2% improvement"
          trend="up"
          sparklineData={supremeScoreSparkline}
          icon={<Target className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'engagement_rate',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Engagement Rate"
          value={contentAnalytics.data?.overview.avgEngagement.toFixed(0) || '76'}
          unit="%"
          isLoading={contentAnalytics.loading}
          trendValue="-2.1% vs last week"
          trend="down"
          sparklineData={engagementSparkline}
          icon={<Heart className="h-5 w-5 text-pink-400" />}
        />
      ),
    },
    {
      id: 'sentiment_score',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Sentiment Score"
          value={contentAnalytics.data?.overview.avgSentiment.toFixed(2) || '0.82'}
          unit=""
          isLoading={contentAnalytics.loading}
          trendValue="+8.7% positive"
          trend="up"
          sparklineData={sentimentSparkline}
          icon={<TrendingUp className="h-5 w-5 text-green-400" />}
        />
      ),
    },
    {
      id: 'readability',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Readability"
          value={contentAnalytics.data?.overview.avgReadability.toFixed(0) || '84'}
          unit="%"
          isLoading={contentAnalytics.loading}
          trendValue="+3.4% easier"
          trend="up"
          sparklineData={readabilitySparkline}
          icon={<Eye className="h-5 w-5 text-blue-400" />}
        />
      ),
    },

    // Second Row - Performance Charts
    {
      id: 'performance_trend',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Content Performance Over Time"
          data={performanceData}
          yLabel="Supreme Score"
          stroke="#8b5cf6"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'content_analyzer',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: <ContentAnalyzerPanel />,
    },

    // Third Row - Detailed Analytics
    {
      id: 'engagement_trend',
      x: 0,
      y: 6,
      w: 6,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Engagement Trend"
          data={engagementData}
          yLabel="Engagement %"
          stroke="#ec4899"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'content_types',
      x: 6,
      y: 6,
      w: 3,
      h: 4,
      component: (
        <PiePanel
          title="Content Types"
          data={[
            { name: 'Email', value: 35 },
            { name: 'Social Media', value: 28 },
            { name: 'Blog Posts', value: 22 },
            { name: 'Ads', value: 15 },
          ]}
          isLoading={contentAnalytics.loading}
        />
      ),
    },
    {
      id: 'keywords_performance',
      x: 9,
      y: 6,
      w: 3,
      h: 4,
      component: <KeywordsPanel />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Grafana-style controls matching successful dashboards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/20">
              <MessageSquare className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Content Intelligence
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/20">
                  AI-Powered
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Advanced content analysis and optimization insights</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={`h-7 px-3 text-xs ${
                  timeRange === range 
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </Button>
            ))}
          </div>
          
          <Button variant="ghost" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grafana-style Dashboard Grid */}
      <StaticDashboardGrid panels={dashboardPanels} />
    </div>
  );
} 