"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Users, MessageSquare, BarChart3, Sparkles, RefreshCw, ArrowUpRight,
  Activity, TrendingUp, Target, Heart, Eye, Filter, Download, Settings
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
import type { DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
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

  // --------------------
  // Grafana-style Overview Panels
  // --------------------
  const mockSeries = Array.from({ length: 20 }).map((_, idx) => ({
    x: idx,
    y: Math.round(Math.random() * 100),
  }));

  const overviewPanels: DashboardPanelConfig[] = [
    // Top Row - Key Metrics (no big header panel, just clean stats)
    {
      id: 'stat_content',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Content Analyses"
          value={(overview.counts?.contentCount || 0).toString()}
          unit=""
          icon={<MessageSquare className="h-5 w-5 text-purple-400" />}
          isLoading={overviewLoading}
          trend="up"
          trendValue="12%"
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
          value={(overview.counts?.customerCount || 0).toString()}
          unit=""
          icon={<Users className="h-5 w-5 text-blue-400" />}
          isLoading={overviewLoading}
          trend="up"
          trendValue="8%"
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
          value={(overview.counts?.chatCount || 0).toString()}
          unit=""
          icon={<Brain className="h-5 w-5 text-green-400" />}
          isLoading={overviewLoading}
          trend="up"
          trendValue="24%"
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
          value={(overview.counts?.toolCount || 0).toString()}
          unit=""
          icon={<Sparkles className="h-5 w-5 text-orange-400" />}
          isLoading={overviewLoading}
          trend="up"
          trendValue="16%"
        />
      ),
    },

    // Second Row - Charts
    {
      id: 'timeseries_engagement',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="AI Intelligence Activity"
          data={mockSeries}
          yLabel="Activity Score"
          stroke="#8b5cf6"
          fillGradient={true}
          isLoading={overviewLoading}
        />
      ),
    },
    {
      id: 'pie_distribution',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="Intelligence Distribution"
          data={[
            { name: 'Content', value: overview.counts?.contentCount || 0 },
            { name: 'Segments', value: overview.counts?.customerCount || 0 },
            { name: 'Chats', value: overview.counts?.chatCount || 0 },
            { name: 'Tools', value: overview.counts?.toolCount || 0 },
          ]}
          colors={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']}
          isLoading={overviewLoading}
        />
      ),
    },

    // Third Row - Detailed Analytics
    {
      id: 'bar_tools',
      x: 0,
      y: 6,
      w: 12,
      h: 3,
      component: (
        <BarPanel
          title="AI Tools Usage Analytics"
          data={[
            { tool: 'Content Predictor', uses: 156 },
            { tool: 'Supreme Chat', uses: overview.counts?.chatCount || 0 },
            { tool: 'Customer Optimizer', uses: 89 },
            { tool: 'Insight Recommender', uses: 134 },
            { tool: 'Sentiment Analyzer', uses: 78 },
          ]}
          xKey="tool"
          dataKey="uses"
          name="Usage Count"
          isLoading={overviewLoading}
        />
      ),
    },
  ];

  // Content Intelligence Panels - simplified
  const contentPanels: DashboardPanelConfig[] = [
    {
      id: 'content_supreme_score',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Supreme Score"
          value={contentAnalytics.data?.overview.avgSupremeScore.toFixed(0) || '87'}
          unit="/100"
          icon={<Target className="h-5 w-5 text-purple-400" />}
          isLoading={contentAnalytics.loading}
          trend={contentAnalytics.data?.overview.trend?.supremeScore && contentAnalytics.data.overview.trend.supremeScore > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(contentAnalytics.data?.overview.trend?.supremeScore || 5.2).toFixed(1)}%`}
        />
      ),
    },
    {
      id: 'content_engagement',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Engagement Rate"
          value={contentAnalytics.data?.overview.avgEngagement.toFixed(0) || '76'}
          unit="%"
          icon={<Heart className="h-5 w-5 text-pink-400" />}
          isLoading={contentAnalytics.loading}
          trend={contentAnalytics.data?.overview.trend?.engagement && contentAnalytics.data.overview.trend.engagement > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(contentAnalytics.data?.overview.trend?.engagement || -2.1).toFixed(1)}%`}
        />
      ),
    },
    {
      id: 'content_sentiment',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Sentiment Score"
          value={contentAnalytics.data?.overview.avgSentiment.toFixed(2) || '0.82'}
          unit=""
          icon={<TrendingUp className="h-5 w-5 text-green-400" />}
          isLoading={contentAnalytics.loading}
          trend={contentAnalytics.data?.overview.trend?.sentiment && contentAnalytics.data.overview.trend.sentiment > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(contentAnalytics.data?.overview.trend?.sentiment || 8.7).toFixed(1)}%`}
        />
      ),
    },
    {
      id: 'content_readability',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Readability"
          value={contentAnalytics.data?.overview.avgReadability.toFixed(0) || '84'}
          unit="%"
          icon={<Eye className="h-5 w-5 text-blue-400" />}
          isLoading={contentAnalytics.loading}
          trend={contentAnalytics.data?.overview.trend?.readability && contentAnalytics.data.overview.trend.readability > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(contentAnalytics.data?.overview.trend?.readability || 3.4).toFixed(1)}%`}
        />
      ),
    },
    {
      id: 'content_performance_trend',
      x: 0,
      y: 2,
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
          fillGradient={true}
          isLoading={contentAnalytics.loading}
        />
      ),
    },
    {
      id: 'content_types_distribution',
      x: 8,
      y: 2,
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
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Grafana-style controls matching successful dashboards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/20">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                AI Intelligence Dashboard
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-400 border-purple-500/20">
                  Supreme-AI v3.0
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Advanced ML-powered insights and analytics</p>
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
          
          <Button variant="ghost" size="sm" onClick={refreshInsights} disabled={refreshing}>
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

      {/* Main Intelligence Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 backdrop-blur-sm">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              <MessageSquare className="h-4 w-4" />
              Content Intelligence
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              <Users className="h-4 w-4" />
              Customer Intelligence
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              <Brain className="h-4 w-4" />
              Supreme-AI Chat
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
              <Sparkles className="h-4 w-4" />
              AI Tools
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <StaticDashboardGrid panels={overviewPanels} />
        </TabsContent>

        <TabsContent value="content">
          <StaticDashboardGrid panels={contentPanels} />
        </TabsContent>

        <TabsContent value="customers">
          <SupremeCustomerPanel userId={"dashboard-user"} />
        </TabsContent>

        <TabsContent value="chat">
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

        <TabsContent value="tools">
          <LocalAIWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
} 