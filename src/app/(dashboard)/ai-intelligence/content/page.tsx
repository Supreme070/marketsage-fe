"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, TrendingUp, Eye, Heart, Sparkles, 
  Brain, BarChart3, MessageSquare, Target, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useContentAnalytics } from '@/hooks/useContentAnalytics';
import StaticDashboardGrid, { DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';

export default function ContentIntelligencePage() {
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
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

  const quickPrompts = [
    "Revolutionary fintech platform launching in Nigeria! Transform your banking experience with our AI-powered mobile app. Join thousands of satisfied customers today!",
    "Dear valued customer, we're excited to announce our new digital banking features. Experience seamless transactions with enhanced security.",
    "🚀 New Feature Alert! Send money instantly to any bank account in Nigeria. Zero fees for the first month. Download our app now!",
    "Unlock financial freedom with our comprehensive suite of banking solutions designed specifically for Nigerian entrepreneurs and businesses."
  ];

  // Grafana-style Content Intelligence Panels
  const contentPanels: DashboardPanelConfig[] = [
    {
      id: 'content_performance_overview',
      x: 0,
      y: 0,
      w: 12,
      h: 2,
      component: (
        <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border border-purple-500/30 rounded-lg p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-2xl backdrop-blur-sm shadow-lg">
                <MessageSquare className="h-10 w-10 text-purple-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  Content Intelligence Analytics
                  <Badge className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border-purple-500/30 backdrop-blur-sm">
                    Supreme-AI Powered
                  </Badge>
                </h2>
                <p className="text-gray-400 mt-1">Advanced content analysis • Sentiment • Engagement • Performance Metrics</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {contentAnalytics.data?.overview.avgSupremeScore.toFixed(1) || '87.3'}%
              </div>
              <div className="text-sm text-gray-400 mt-1">Average Content Score</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'content_supreme_score',
      x: 0,
      y: 2,
      w: 3,
      h: 3,
      component: (
        <SingleStatPanel
          title="Supreme Score"
          value={contentAnalytics.data?.overview.avgSupremeScore.toFixed(0) || '87'}
          unit="/100"
          icon={<Target className="h-8 w-8 text-purple-400" />}
          isLoading={contentAnalytics.loading}
          trend={contentAnalytics.data?.overview.trend?.supremeScore && contentAnalytics.data.overview.trend.supremeScore > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(contentAnalytics.data?.overview.trend?.supremeScore || 5.2).toFixed(1)}%`}
        />
      ),
    },
    {
      id: 'content_engagement',
      x: 3,
      y: 2,
      w: 3,
      h: 3,
      component: (
        <SingleStatPanel
          title="Engagement Rate"
          value={contentAnalytics.data?.overview.avgEngagement.toFixed(0) || '76'}
          unit="%"
          icon={<Heart className="h-8 w-8 text-pink-400" />}
          isLoading={contentAnalytics.loading}
          trend={contentAnalytics.data?.overview.trend?.engagement && contentAnalytics.data.overview.trend.engagement > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(contentAnalytics.data?.overview.trend?.engagement || -2.1).toFixed(1)}%`}
        />
      ),
    },
    {
      id: 'content_sentiment',
      x: 6,
      y: 2,
      w: 3,
      h: 3,
      component: (
        <SingleStatPanel
          title="Sentiment Score"
          value={contentAnalytics.data?.overview.avgSentiment.toFixed(2) || '0.82'}
          unit=""
          icon={<TrendingUp className="h-8 w-8 text-green-400" />}
          isLoading={contentAnalytics.loading}
          trend={contentAnalytics.data?.overview.trend?.sentiment && contentAnalytics.data.overview.trend.sentiment > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(contentAnalytics.data?.overview.trend?.sentiment || 8.7).toFixed(1)}%`}
        />
      ),
    },
    {
      id: 'content_readability',
      x: 9,
      y: 2,
      w: 3,
      h: 3,
      component: (
        <SingleStatPanel
          title="Readability"
          value={contentAnalytics.data?.overview.avgReadability.toFixed(0) || '84'}
          unit="%"
          icon={<Eye className="h-8 w-8 text-blue-400" />}
          isLoading={contentAnalytics.loading}
          trend={contentAnalytics.data?.overview.trend?.readability && contentAnalytics.data.overview.trend.readability > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(contentAnalytics.data?.overview.trend?.readability || 3.4).toFixed(1)}%`}
        />
      ),
    },
    {
      id: 'content_performance_trend',
      x: 0,
      y: 5,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Content Performance Over Time"
          data={contentAnalytics.data?.performance.timeSeries.map(item => ({
            x: item.date,
            y: item.supremeScore,
          })) || Array.from({ length: 30 }).map((_, idx) => ({
            x: `Day ${idx + 1}`,
            y: Math.round(60 + Math.random() * 40),
          }))}
          yLabel="Supreme Score"
          stroke="#8b5cf6"
          isLoading={contentAnalytics.loading}
        />
      ),
    },
    {
      id: 'content_types_distribution',
      x: 8,
      y: 5,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="Content Types"
          data={contentAnalytics.data?.performance.contentTypes.map(item => ({
            name: item.name,
            value: item.value,
          })) || [
            { name: 'Email', value: 35 },
            { name: 'Social Media', value: 28 },
            { name: 'Blog Posts', value: 22 },
            { name: 'Ads', value: 15 },
          ]}
          colors={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']}
          isLoading={contentAnalytics.loading}
        />
      ),
    },
    {
      id: 'content_keywords_performance',
      x: 0,
      y: 9,
      w: 6,
      h: 3,
      component: (
        <BarPanel
          title="Top Keywords Performance"
          data={contentAnalytics.data?.performance.topKeywords.map(item => ({
            keyword: item.keyword,
            score: item.avgScore,
          })) || [
            { keyword: 'fintech', score: 94 },
            { keyword: 'banking', score: 87 },
            { keyword: 'digital', score: 82 },
            { keyword: 'payments', score: 78 },
            { keyword: 'mobile', score: 75 },
          ]}
          xKey="keyword"
          dataKey="score"
          name="Score"
          isLoading={contentAnalytics.loading}
        />
      ),
    },
    {
      id: 'content_optimization_tips',
      x: 6,
      y: 9,
      w: 6,
      h: 3,
      component: (
        <div className="p-6 bg-gray-900/70 border border-gray-700/50 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-100">
            <Sparkles className="h-5 w-5 text-purple-400" />
            AI Optimization Tips
          </h3>
          <div className="space-y-3">
            {(contentAnalytics.data?.recommendations.slice(0, 3) || [
              {
                priority: 'high',
                category: 'engagement',
                title: 'Add Call-to-Action Phrases',
                description: 'Content with clear CTAs shows +15% engagement',
                estimatedImpact: '+12% engagement'
              },
              {
                priority: 'medium',
                category: 'readability',
                title: 'Simplify Complex Sentences',
                description: 'Break down sentences over 20 words',
                estimatedImpact: '+6% readability'
              },
              {
                priority: 'medium',
                category: 'cultural',
                title: 'Cultural Localization',
                description: 'Include local Nigerian expressions',
                estimatedImpact: '+8% sentiment'
              }
            ]).map((recommendation, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm transition-all hover:scale-[1.02] ${
                recommendation.priority === 'high' ? 'bg-purple-500/20 border border-purple-500/30' :
                recommendation.priority === 'medium' ? 'bg-blue-500/20 border border-blue-500/30' : 
                'bg-green-500/20 border border-green-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full mt-2 animate-pulse ${
                  recommendation.priority === 'high' ? 'bg-purple-400' :
                  recommendation.priority === 'medium' ? 'bg-blue-400' : 'bg-green-400'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-100">{recommendation.title}</p>
                  <p className="text-xs text-gray-400">{recommendation.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Impact: <span className={`font-semibold ${
                    recommendation.priority === 'high' ? 'text-purple-400' :
                    recommendation.priority === 'medium' ? 'text-blue-400' : 'text-green-400'
                  }`}>{recommendation.estimatedImpact}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'content_analyzer_tool',
      x: 0,
      y: 12,
      w: 12,
      h: 4,
      component: (
        <Card className="bg-gray-900/70 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Brain className="h-5 w-5 text-purple-400" />
              Content Analyzer Tool
            </CardTitle>
            <CardDescription className="text-gray-400">
              Analyze new content with Supreme-AI engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Textarea
              placeholder="Enter your email copy, social media post, landing page content, or any marketing material..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-purple-500/50"
            />
            
            <div className="flex items-center gap-2 mb-4">
              <Button 
                onClick={analyzeContent}
                disabled={analyzing || !content.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Content
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setContent('')} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                Clear
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={contentAnalytics.refresh}
                disabled={contentAnalytics.loading}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${contentAnalytics.loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400">Quick Examples:</p>
              <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3 text-xs bg-gray-800/30 hover:bg-gray-800/50 text-gray-300 border border-gray-700/50"
                    onClick={() => setContent(prompt)}
                  >
                    <span className="truncate">{prompt.substring(0, 80)}...</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6 bg-gray-950 min-h-screen p-6">
      {/* Header */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30">
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Content Intelligence
              </h1>
              <p className="text-sm text-gray-400 mt-1">AI-powered content analysis and optimization • Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="text-xs bg-purple-600/20 text-purple-300 border-purple-500/30">Supreme-AI Enabled</Badge>
            <Badge className="text-xs bg-gray-800 text-gray-300 border-gray-700">{contentAnalytics.data?.overview.totalContent || 1247} Analyses</Badge>
          </div>
        </div>
      </div>

      {/* Grafana-style Dashboard Grid */}
      <StaticDashboardGrid panels={contentPanels} />

      {/* Recent Analyses */}
      {contentAnalytics.data?.recentAnalyses && (
        <Card className="bg-gray-900/70 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {contentAnalytics.data.recentAnalyses.slice(0, 5).map((analysis, index) => (
                <div key={analysis.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:bg-gray-800/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-100">{analysis.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(analysis.createdAt).toLocaleDateString()} • {analysis.contentType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        {analysis.supremeScore}/100
                      </p>
                      <p className="text-xs text-gray-500">Supreme Score</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">{analysis.engagement}%</p>
                      <p className="text-xs text-gray-500">Engagement</p>
                    </div>
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