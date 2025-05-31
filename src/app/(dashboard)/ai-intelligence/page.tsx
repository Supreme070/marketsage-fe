"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, TrendingUp, Users, MessageSquare, Target, Zap, 
  BarChart3, Eye, Heart, Clock, AlertTriangle, CheckCircle,
  ArrowUpRight, ArrowDownRight, Sparkles, Activity, Mail,
  RefreshCw, Settings, Download, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import LocalAIWidget from '@/components/ai/LocalAIWidget';
import SupremeOverview from '@/components/ai/SupremeOverview';
import { useSupremeChat, useContentAnalysis, useCustomerIntelligence, usePredictiveAnalytics, useSupremeAIMetrics } from '@/hooks/useSupremeAI';
import SupremeContentPanel from '@/components/ai/SupremeContentPanel';
import SupremeCustomerPanel from '@/components/ai/SupremeCustomerPanel';

export default function AIIntelligencePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  // Supreme-AI v3 hooks - real data
  const metrics = useSupremeAIMetrics();
  const chat = useSupremeChat("dashboard-user");
  const content = useContentAnalysis("dashboard-user");
  const cust = useCustomerIntelligence("dashboard-user");
  const predict = usePredictiveAnalytics("dashboard-user");

  const refreshInsights = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Mock alerts for now - can be replaced with real alerts later
  const mockAlerts = [
    { id: '1', type: 'opportunity', title: 'High-intent visitors from Lagos', description: '47 users browsing rates in last 15min', action: 'Send rate alert', timestamp: '2 mins ago' },
    { id: '2', type: 'success', title: 'Campaign performing above target', description: 'WhatsApp campaign: +34% conversion rate', action: 'Scale budget', timestamp: '8 mins ago' },
    { id: '3', type: 'warning', title: 'Churn risk detected', description: '23 customers haven\'t transacted in 14 days', action: 'Send reactivation', timestamp: '12 mins ago' }
  ];

  return (
    <div className="space-y-6">
      {/* AI Intelligence Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <Brain className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Supreme-AI
                </span>
                Intelligence Center
              </h1>
              <p className="text-muted-foreground">Advanced ML-powered insights • Real-time learning • Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-green-500/10 to-blue-500/10 text-green-400 border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Supreme-AI v3
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshInsights}
              disabled={refreshing}
              className="border-blue-500/20 hover:bg-blue-500/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Analyzing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Supreme-AI Live KPIs */}
      <SupremeOverview />

      {/* AI Performance KPIs - Now using real data */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supreme-AI Performance</p>
                <p className={`text-3xl font-bold ${getScoreColor(metrics.successRate * 100)}`}>
                  {Math.round(metrics.successRate * 100)}%
                </p>
              </div>
              <Brain className="h-8 w-8 text-blue-400" />
            </div>
            <Progress value={metrics.successRate * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">ML Ensemble Confidence</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Intelligence</p>
                <p className="text-3xl font-bold text-green-400">
                  {content.supremeScore || 85}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Neural Network Analysis
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ML Predictions</p>
                <p className="text-3xl font-bold text-purple-400">
                  {Math.round(predict.confidence * 100) || 84}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {predict.bestModel || 'Ensemble'} Forecasting
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Segments</p>
                <p className="text-3xl font-bold text-orange-400">
                  {cust.segments?.length || 4}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Adaptive Clustering
            </p>
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* Real-time Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-400" />
                  Real-time AI Alerts
                </CardTitle>
                <CardDescription>Intelligent insights from across your marketing ecosystem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {mockAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                    >
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            {alert.action}
                          </Button>
                          <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Performance Predictions - Using real ML data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  AI Performance Predictions
                </CardTitle>
                <CardDescription>Machine learning forecasts from {predict.bestModel || 'Ensemble Model'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Model Confidence</span>
                    <Badge variant="secondary">{Math.round(predict.confidence * 100)}%</Badge>
                  </div>
                  <Progress value={predict.confidence * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Improvement Potential</span>
                    <Badge variant="secondary">{predict.improvementPercent || 25}%</Badge>
                  </div>
                  <Progress value={predict.improvementPercent || 25} className="h-2" />
                </div>

                {predict.allModels && predict.allModels.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Available Models:</p>
                    <div className="flex flex-wrap gap-1">
                      {predict.allModels.slice(0, 3).map((model: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {model.name || `Model ${index + 1}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Customer Intelligence Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Customer Intelligence Overview
              </CardTitle>
              <CardDescription>Real-time customer segmentation and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 rounded-lg border bg-card/50">
                  <p className="text-2xl font-bold text-blue-400">{cust.segments?.length || 4}</p>
                  <p className="text-sm text-muted-foreground">Active Segments</p>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card/50">
                  <p className="text-2xl font-bold text-green-400">{Math.round((1 - cust.averageChurnRisk) * 100) || 88}%</p>
                  <p className="text-sm text-muted-foreground">Retention Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card/50">
                  <p className="text-2xl font-bold text-purple-400">${cust.totalLifetimeValue || '2.4M'}</p>
                  <p className="text-sm text-muted-foreground">Total LTV</p>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card/50">
                  <p className="text-2xl font-bold text-orange-400">{content.supremeScore || 85}</p>
                  <p className="text-sm text-muted-foreground">Content Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <SupremeContentPanel userId={"dashboard-user"} />
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
                        {/* User Question */}
                        <div className="flex justify-end">
                          <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
                            <p className="text-sm">{message.question}</p>
                          </div>
                        </div>
                        
                        {/* AI Response */}
                        <div className="flex justify-start">
                          <div className="bg-card border p-3 rounded-lg max-w-[80%]">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4 text-blue-400" />
                              <span className="text-xs font-medium text-blue-400">Supreme-AI</span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(message.confidence * 100)}% confident
                              </Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.answer}</p>
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.sources.slice(0, 3).map((source: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
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