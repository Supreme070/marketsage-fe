"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Sparkles, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface AIAnalysis {
  sentimentScore: number;
  sentimentLabel: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  topics: string[];
  readingEase: number;
  readingGrade: number;
  insights: string[];
}

interface AIGeneration {
  content: string;
  originalSeed: string;
  suggestions: string[];
}

export default function LocalAIWidget() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [isLoading, setIsLoading] = useState(false);
  
  // Analysis state
  const [analyzeContent, setAnalyzeContent] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  
  // Generation state
  const [seedText, setSeedText] = useState('');
  const [generated, setGenerated] = useState<AIGeneration | null>(null);

  const handleAnalyze = async () => {
    if (!analyzeContent.trim()) {
      toast.error('Please enter content to analyze');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          content: analyzeContent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        toast.success('Content analyzed successfully!');
      } else {
        toast.error(data.error || 'Analysis failed');
      }
    } catch (error) {
      toast.error('Failed to analyze content');
      console.error('AI Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!seedText.trim()) {
      toast.error('Please enter seed text to generate content');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          seedText: seedText
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGenerated(data.generated);
        toast.success('Content generated successfully!');
      } else {
        toast.error(data.error || 'Generation failed');
      }
    } catch (error) {
      toast.error('Failed to generate content');
      console.error('AI Generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReadabilityLevel = (ease: number) => {
    if (ease > 90) return { level: 'Very Easy', color: 'bg-green-100 text-green-800' };
    if (ease > 80) return { level: 'Easy', color: 'bg-green-100 text-green-800' };
    if (ease > 70) return { level: 'Fairly Easy', color: 'bg-blue-100 text-blue-800' };
    if (ease > 60) return { level: 'Standard', color: 'bg-yellow-100 text-yellow-800' };
    if (ease > 50) return { level: 'Fairly Difficult', color: 'bg-orange-100 text-orange-800' };
    if (ease > 30) return { level: 'Difficult', color: 'bg-red-100 text-red-800' };
    return { level: 'Very Difficult', color: 'bg-red-100 text-red-800' };
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Local AI Assistant
        </CardTitle>
        <CardDescription>
          Analyze content and generate marketing copy without external APIs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Content Analysis
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Content Generation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content to Analyze</label>
              <Textarea
                placeholder="Enter your marketing content, email subject, or WhatsApp message..."
                value={analyzeContent}
                onChange={(e) => setAnalyzeContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            
            <Button 
              onClick={handleAnalyze}
              disabled={isLoading || !analyzeContent.trim()}
              className="w-full"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Content'}
            </Button>

            {analysis && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Badge className={getSentimentColor(analysis.sentimentLabel)}>
                          {analysis.sentimentLabel}
                        </Badge>
                        <p className="text-2xl font-bold mt-2">
                          {analysis.sentimentScore.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">Sentiment Score</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Badge className={getReadabilityLevel(analysis.readingEase).color}>
                          {getReadabilityLevel(analysis.readingEase).level}
                        </Badge>
                        <p className="text-2xl font-bold mt-2">
                          {analysis.readingEase.toFixed(0)}
                        </p>
                        <p className="text-sm text-gray-600">Reading Ease</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Badge variant="outline">
                          Grade {analysis.readingGrade.toFixed(1)}
                        </Badge>
                        <p className="text-2xl font-bold mt-2">
                          {analysis.readingGrade.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600">Reading Grade</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords.slice(0, 8).map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AI Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {analysis.insights.map((insight, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            • {insight}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seed Text</label>
              <Textarea
                placeholder="Enter a sample message or description of your service..."
                value={seedText}
                onChange={(e) => setSeedText(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            
            <Button 
              onClick={handleGenerate}
              disabled={isLoading || !seedText.trim()}
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Generate Content'}
            </Button>

            {generated && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Generated Content</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Generated Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                      {generated.content}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {generated.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 