"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, TrendingUp, Eye, Heart, Clock, Sparkles, 
  ArrowUpRight, Brain, BarChart3, MessageSquare, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useContentAnalysis } from '@/hooks/useSupremeAI';
import SupremeContentPanel from '@/components/ai/SupremeContentPanel';

export default function ContentIntelligencePage() {
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const contentAnalysis = useContentAnalysis("dashboard-user");

  const analyzeContent = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      await contentAnalysis.analyze(content);
      toast.success('Content analysis completed');
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const quickPrompts = [
    "Analyze this email campaign for Nigerian fintech customers",
    "Review this WhatsApp message for cultural sensitivity",
    "Check this landing page copy for conversion optimization",
    "Evaluate this social media post for engagement potential"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
            <FileText className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Content Intelligence
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-400 border-purple-500/20">
                AI-Powered
              </Badge>
            </h1>
            <p className="text-muted-foreground">Advanced content analysis with Supreme-AI • Sentiment • Engagement • Cultural Context</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              Content Analyzer
            </CardTitle>
            <CardDescription>
              Paste your marketing content below for AI-powered analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your email copy, social media post, landing page content, or any marketing material..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={analyzeContent}
                disabled={analyzing || !content.trim()}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
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
              <Button variant="outline" size="sm" onClick={() => setContent('')}>
                Clear
              </Button>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quick Examples:</p>
              <div className="grid gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3 text-xs"
                    onClick={() => setContent(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <div className="space-y-4">
          {/* Supreme Content Panel */}
          <SupremeContentPanel userId="dashboard-user" />
          
          {/* Quick Metrics */}
          <div className="grid gap-4 grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Supreme Score</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {contentAnalysis.supremeScore || '--'}
                    </p>
                  </div>
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Engagement</p>
                    <p className="text-2xl font-bold text-green-400">
                      {contentAnalysis.lastAnalysis?.engagement || '--'}%
                    </p>
                  </div>
                  <Heart className="h-6 w-6 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Readability</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {contentAnalysis.lastAnalysis?.readability || '--'}%
                    </p>
                  </div>
                  <Eye className="h-6 w-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sentiment</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {contentAnalysis.lastAnalysis?.sentiment || '--'}
                    </p>
                  </div>
                  <MessageSquare className="h-6 w-6 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Recent Analysis History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contentAnalysis.lastAnalysis ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Last analyzed content</p>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleString()}</p>
                </div>
                <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                  Score: {contentAnalysis.supremeScore}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content analyzed yet. Start by analyzing some content above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 