"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Users, MessageSquare, BarChart3, Sparkles, RefreshCw, ArrowUpRight,
  Activity, TrendingUp, Target, Heart, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import LocalAIWidget from '@/components/ai/LocalAIWidget';
import {
  useSupremeChat, usePredictiveAnalytics
} from '@/hooks/useSupremeAI';
import {
  useAIIntelligenceOverview
} from '@/hooks/useAIIntelligence';
import { useContentAnalytics } from '@/hooks/useContentAnalytics';
import SupremeContentPanel from '@/components/ai/SupremeContentPanel';
import SupremeCustomerPanel from '@/components/ai/SupremeCustomerPanel';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import StaticDashboardGrid from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';

export default function AIIntelligencePage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [gridError, setGridError] = useState(false);

  // Hooks
  const chat = useSupremeChat('dashboard-user');
  const predict = usePredictiveAnalytics('dashboard-user');
  const { overview, loading: overviewLoading, refresh: refreshOverview } = useAIIntelligenceOverview('dashboard-user', timeRange);
  const contentAnalytics = useContentAnalytics('dashboard-user');

  const refreshInsights = async () => {
    setRefreshing(true);
    await Promise.all([refreshOverview()]);
    setRefreshing(false);
    toast.success('AI insights refreshed');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    try {
      await chat.ask(chatInput);
      setChatInput('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleQuickQuestion = async (question: string) => {
    try {
      await chat.ask(question);
    } catch (error) {
      toast.error('Failed to send question');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // --------------------
  // Grafana-style Overview Panels
  // --------------------
  const mockSeries = Array.from({ length: 20 }).map((_, idx) => ({
    x: idx,
    y: Math.round(Math.random() * 100),
  }));

  const overviewPanels: DashboardPanelConfig[] = [
    {
      id: 'stat_content',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Content Analyses"
          value={overview.counts.contentCount}
          isLoading={overviewLoading}
        />
      ),
    },
    {
      id: 'stat_segments',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Customer Segments"
          value={overview.counts.customerCount}
          isLoading={overviewLoading}
        />
      ),
    },
    {
      id: 'stat_chats',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Chat Sessions"
          value={overview.counts.chatCount}
          isLoading={overviewLoading}
        />
      ),
    },
    {
      id: 'stat_tools',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="AI Tools"
          value={overview.counts.toolCount}
          isLoading={overviewLoading}
        />
      ),
    },
    {
      id: 'timeseries_engagement',
      x: 0,
      y: 2,
      w: 12,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Engagement Score – Last Activity"
          data={mockSeries}
          yLabel="Score"
        />
      ),
    },
    {
      id: 'pie_distribution',
      x: 0,
      y: 6,
      w: 4,
      h: 3,
      component: (
        <PiePanel
          title="Insights Distribution"
          data={[
            { name: 'Content', value: overview.counts.contentCount },
            { name: 'Segments', value: overview.counts.customerCount },
            { name: 'Chats', value: overview.counts.chatCount },
            { name: 'Tools', value: overview.counts.toolCount },
          ]}
          isLoading={overviewLoading}
        />
      ),
    },
    {
      id: 'bar_tools',
      x: 4,
      y: 6,
      w: 8,
      h: 3,
      component: (
        <BarPanel
          title="AI Tools Usage (Mock)"
          data={[
            { tool: 'Predictor', uses: 120 },
            { tool: 'Chat', uses: 300 },
            { tool: 'Optimizer', uses: 80 },
            { tool: 'Recommender', uses: 150 },
          ]}
          xKey="tool"
          dataKey="uses"
          name="Uses"
        />
      ),
    },
  ];

  // Content Intelligence Panels
  const contentPanels: DashboardPanelConfig[] = [
    {
      id: 'content_performance_overview',
      x: 0,
      y: 0,
      w: 12,
      h: 2,
      component: (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Content Intelligence Analytics
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-400 border-purple-500/20">
                    Supreme-AI Powered
                  </Badge>
                </h2>
                <p className="text-muted-foreground">Advanced content analysis • Sentiment • Engagement • Performance Metrics</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-400">
                {contentAnalytics.data?.overview.avgSupremeScore.toFixed(1) || '94.2'}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Content Score</div>
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
          icon={<Target className="h-6 w-6" />}
          isLoading={contentAnalytics.loading}
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
          icon={<Heart className="h-6 w-6" />}
          isLoading={contentAnalytics.loading}
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
          value={contentAnalytics.data?.overview.avgSentiment.toFixed(2) || '0.85'}
          unit=""
          icon={<TrendingUp className="h-6 w-6" />}
          isLoading={contentAnalytics.loading}
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
          value={contentAnalytics.data?.overview.avgReadability.toFixed(0) || '82'}
          unit="%"
          icon={<Eye className="h-6 w-6" />}
          isLoading={contentAnalytics.loading}
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
        <div className="p-6 bg-card border rounded-lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            AI Optimization Tips
          </h3>
          <div className="space-y-3">
            {(contentAnalytics.data?.recommendations.slice(0, 3) || [
              {
                priority: 'high',
                category: 'engagement',
                title: 'Boost Engagement',
                description: 'Add more call-to-action phrases (+12% engagement)',
                estimatedImpact: '+12% engagement'
              },
              {
                priority: 'medium',
                category: 'readability',
                title: 'Improve Readability',
                description: 'Use shorter sentences for better comprehension',
                estimatedImpact: '+6% readability'
              },
              {
                priority: 'medium',
                category: 'cultural',
                title: 'Cultural Optimization',
                description: 'Consider local Nigerian expressions',
                estimatedImpact: '+8% sentiment'
              }
            ]).map((recommendation, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                recommendation.priority === 'high' ? 'bg-purple-500/10' :
                recommendation.priority === 'medium' ? 'bg-blue-500/10' : 'bg-green-500/10'
              }`}>
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  recommendation.priority === 'high' ? 'bg-purple-400' :
                  recommendation.priority === 'medium' ? 'bg-blue-400' : 'bg-green-400'
                }`}></div>
                <div>
                  <p className="text-sm font-medium">{recommendation.title}</p>
                  <p className="text-xs text-muted-foreground">{recommendation.description} ({recommendation.estimatedImpact})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  // Grid wrapper with fallback
  const GridWrapper = ({ panels }: { panels: DashboardPanelConfig[] }) => {
    return <StaticDashboardGrid panels={panels} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border rounded-lg p-6 bg-card/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl border bg-background">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">AI Intelligence Dashboard</h1>
              <p className="text-sm text-muted-foreground">Advanced ML-powered insights • Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="px-3 py-1 text-sm border rounded-md bg-background" 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <Badge variant="secondary" className="text-xs">Supreme-AI v3</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshInsights}
            disabled={refreshing}
            className="border-muted hover:bg-muted/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Content Analyses</p>
              <p className="text-2xl font-bold">{overview.counts.contentCount}</p>
            </div>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Customer Segments</p>
              <p className="text-2xl font-bold">{overview.counts.customerCount}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chat Sessions</p>
              <p className="text-2xl font-bold">{overview.counts.chatCount}</p>
            </div>
            <Brain className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">AI Tools</p>
              <p className="text-2xl font-bold">{overview.counts.toolCount}</p>
            </div>
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Main Intelligence Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Content Intelligence
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Intelligence
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Supreme-AI Chat
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <GridWrapper panels={overviewPanels} />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <GridWrapper panels={contentPanels} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <SupremeCustomerPanel userId={"dashboard-user"} />
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400" />
                Supreme-AI Chat
                <Badge variant="secondary" className="ml-2">v3.0</Badge>
              </CardTitle>
              <CardDescription>
                Chat with Supreme-AI using Memory, RAG, and AutoML capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-muted/20">
                {chat.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Welcome to Supreme-AI Chat</p>
                    <p className="text-sm">Ask me anything about your business, customers, or marketing!</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuickQuestion("Analyze my customer segments")}
                        className="text-xs"
                      >
                        Analyze customer segments
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuickQuestion("What's my content performance?")}
                        className="text-xs"
                      >
                        Content performance
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuickQuestion("Predict revenue for next month")}
                        className="text-xs"
                      >
                        Revenue predictions
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuickQuestion("How can I reduce churn?")}
                        className="text-xs"
                      >
                        Reduce churn
                      </Button>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {chat.messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        {message.role === 'user' ? (
                          <div className="flex justify-end">
                            <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start">
                            <div className="bg-card border p-3 rounded-lg max-w-[80%]">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-blue-400" />
                                <span className="text-xs font-medium text-blue-400">Supreme-AI</span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                
                {chat.loading && (
                  <div className="flex justify-start">
                    <div className="bg-card border p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-400 animate-pulse" />
                        <span className="text-sm text-muted-foreground">Supreme-AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask Supreme-AI anything..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={chat.loading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={chat.loading || !chatInput.trim()}
                  className="px-4"
                >
                  {chat.loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </Button>
                {chat.messages.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={chat.clear}
                    className="px-4"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {chat.error && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                  Error: {chat.error}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <LocalAIWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
} 