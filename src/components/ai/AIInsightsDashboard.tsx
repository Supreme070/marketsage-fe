"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Target, 
  DollarSign,
  Users,
  MessageSquare,
  BarChart3,
  Eye,
  ThumbsUp,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AIInsight {
  id: string;
  type: 'churn_risk' | 'ltv_prediction' | 'content_optimization' | 'engagement_opportunity';
  title: string;
  description: string;
  score: number;
  confidence: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionable: boolean;
  timestamp: Date;
}

interface CustomerPrediction {
  contactId: string;
  name: string;
  churnRisk: number;
  predictedLTV: number;
  nextBestAction: string;
  confidence: number;
}

interface ContentPerformance {
  contentId: string;
  title: string;
  type: 'email' | 'sms' | 'whatsapp';
  engagementScore: number;
  predictedPerformance: number;
  actualPerformance?: number;
  improvements: string[];
}

export default function AIInsightsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<CustomerPrediction[]>([]);
  const [contentAnalysis, setContentAnalysis] = useState<ContentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time AI metrics
  const [aiMetrics, setAIMetrics] = useState({
    totalPredictions: 0,
    accuracyRate: 0,
    activeModels: 0,
    processingSpeed: 0
  });

  useEffect(() => {
    fetchAIInsights();
    fetchCustomerPredictions();
    fetchContentAnalysis();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      updateRealTimeMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchAIInsights = async () => {
    try {
      // Simulate AI insights data
      const mockInsights: AIInsight[] = [
        {
          id: '1',
          type: 'churn_risk',
          title: 'High Churn Risk Detected',
          description: '23 customers showing critical churn signals in the UK market',
          score: 0.85,
          confidence: 0.92,
          priority: 'HIGH',
          actionable: true,
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'ltv_prediction',
          title: 'High-Value Customer Segment Identified',
          description: 'Nigerian diaspora in Canada showing 3x higher LTV potential',
          score: 0.78,
          confidence: 0.87,
          priority: 'MEDIUM',
          actionable: true,
          timestamp: new Date()
        },
        {
          id: '3',
          type: 'content_optimization',
          title: 'WhatsApp Content Optimization',
          description: 'Adding urgency words could improve engagement by 34%',
          score: 0.67,
          confidence: 0.91,
          priority: 'MEDIUM',
          actionable: true,
          timestamp: new Date()
        }
      ];
      
      setInsights(mockInsights);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    }
  };

  const fetchCustomerPredictions = async () => {
    try {
      // Simulate customer prediction data
      const mockPredictions: CustomerPrediction[] = [
        {
          contactId: '1',
          name: 'Adaora Okafor',
          churnRisk: 0.87,
          predictedLTV: 2400,
          nextBestAction: 'Send personalized WhatsApp message',
          confidence: 0.94
        },
        {
          contactId: '2',
          name: 'Chukwudi Nnamdi',
          churnRisk: 0.23,
          predictedLTV: 3200,
          nextBestAction: 'Offer premium service upgrade',
          confidence: 0.89
        },
        {
          contactId: '3',
          name: 'Amina Hassan',
          churnRisk: 0.65,
          predictedLTV: 1800,
          nextBestAction: 'Provide transaction tutorial',
          confidence: 0.76
        }
      ];
      
      setPredictions(mockPredictions);
    } catch (error) {
      console.error('Failed to fetch customer predictions:', error);
    }
  };

  const fetchContentAnalysis = async () => {
    try {
      // Simulate content analysis data
      const mockContent: ContentPerformance[] = [
        {
          contentId: '1',
          title: 'Send Money to Nigeria - Fast & Secure',
          type: 'email',
          engagementScore: 87,
          predictedPerformance: 0.34,
          actualPerformance: 0.31,
          improvements: ['Add personalization', 'Include urgency words', 'Shorten subject line']
        },
        {
          contentId: '2',
          title: 'Transfer Alert: Your money has arrived!',
          type: 'whatsapp',
          engagementScore: 92,
          predictedPerformance: 0.78,
          actualPerformance: 0.82,
          improvements: ['Perfect performance', 'Consider A/B testing variations']
        }
      ];
      
      setContentAnalysis(mockContent);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch content analysis:', error);
      setIsLoading(false);
    }
  };

  const updateRealTimeMetrics = () => {
    setAIMetrics(prev => ({
      totalPredictions: prev.totalPredictions + Math.floor(Math.random() * 5),
      accuracyRate: 0.87 + Math.random() * 0.1,
      activeModels: 8,
      processingSpeed: 150 + Math.random() * 50
    }));
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.8) return 'text-red-500';
    if (risk >= 0.6) return 'text-orange-500';
    if (risk >= 0.3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Sample data for charts
  const predictionAccuracyData = [
    { month: 'Jan', accuracy: 82 },
    { month: 'Feb', accuracy: 85 },
    { month: 'Mar', accuracy: 87 },
    { month: 'Apr', accuracy: 89 },
    { month: 'May', accuracy: 91 },
    { month: 'Jun', accuracy: 93 }
  ];

  const aiProcessingData = [
    { time: '00:00', predictions: 45, insights: 12 },
    { time: '04:00', predictions: 38, insights: 8 },
    { time: '08:00', predictions: 127, insights: 34 },
    { time: '12:00', predictions: 156, insights: 42 },
    { time: '16:00', predictions: 134, insights: 38 },
    { time: '20:00', predictions: 98, insights: 25 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Predictions Today</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiMetrics.totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(aiMetrics.accuracyRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active AI Models</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiMetrics.activeModels}</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Speed</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(aiMetrics.processingSpeed)}ms</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main AI Dashboard */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Marketing Intelligence Center
          </CardTitle>
          <CardDescription>
            Real-time insights and predictions powered by advanced machine learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="predictions">Customer Predictions</TabsTrigger>
              <TabsTrigger value="content">Content Intelligence</TabsTrigger>
              <TabsTrigger value="performance">AI Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Latest AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {insights.map((insight) => (
                      <div key={insight.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Score:</span>
                            <span className="text-sm font-medium">{(insight.score * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Confidence:</span>
                            <span className="text-sm font-medium">{(insight.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Processing Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Processing Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={aiProcessingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="predictions" 
                          stackId="1"
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="insights" 
                          stackId="1"
                          stroke="#10B981" 
                          fill="#10B981" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {predictions.map((prediction) => (
                  <Card key={prediction.contactId}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{prediction.name}</h3>
                            <p className="text-sm text-gray-500">Customer ID: {prediction.contactId}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Churn Risk</p>
                            <p className={`text-lg font-bold ${getRiskColor(prediction.churnRisk)}`}>
                              {(prediction.churnRisk * 100).toFixed(0)}%
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Predicted LTV</p>
                            <p className="text-lg font-bold text-green-600">
                              ${prediction.predictedLTV.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Confidence</p>
                            <p className="text-lg font-bold">
                              {(prediction.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">
                          <strong>Next Best Action:</strong> {prediction.nextBestAction}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {contentAnalysis.map((content) => (
                  <Card key={content.contentId}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium">{content.title}</h3>
                            <Badge variant="outline" className="mt-1">
                              {content.type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Engagement Score</p>
                          <p className="text-2xl font-bold text-blue-600">{content.engagementScore}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Predicted Performance</p>
                          <p className="text-lg font-semibold">{(content.predictedPerformance * 100).toFixed(1)}%</p>
                        </div>
                        {content.actualPerformance && (
                          <div>
                            <p className="text-sm text-gray-500">Actual Performance</p>
                            <p className="text-lg font-semibold text-green-600">
                              {(content.actualPerformance * 100).toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">AI Recommendations:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {content.improvements.map((improvement, index) => (
                            <li key={index} className="text-sm text-gray-600">{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Prediction Accuracy Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={predictionAccuracyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[75, 95]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="accuracy" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Model Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Churn Prediction Model</span>
                        <span className="text-sm font-medium">94% Accuracy</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">LTV Prediction Model</span>
                        <span className="text-sm font-medium">89% Accuracy</span>
                      </div>
                      <Progress value={89} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Content Optimization</span>
                        <span className="text-sm font-medium">91% Accuracy</span>
                      </div>
                      <Progress value={91} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Send Time Optimization</span>
                        <span className="text-sm font-medium">87% Accuracy</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 