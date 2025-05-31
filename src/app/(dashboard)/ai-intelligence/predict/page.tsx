"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, Brain, BarChart3, Target, Zap, Calendar,
  DollarSign, Users, Mail, MessageSquare, ArrowUpRight
} from 'lucide-react';
import { usePredictiveAnalytics } from '@/hooks/useSupremeAI';

export default function PredictiveAnalyticsPage() {
  const predict = usePredictiveAnalytics("dashboard-user");

  const mockPredictions = [
    {
      metric: "Revenue",
      current: 45000,
      predicted: 52000,
      change: "+15.6%",
      confidence: 87,
      timeframe: "Next 30 days",
      color: "text-green-400"
    },
    {
      metric: "Conversion Rate",
      current: 3.2,
      predicted: 3.8,
      change: "+18.8%", 
      confidence: 84,
      timeframe: "Next 30 days",
      color: "text-blue-400"
    },
    {
      metric: "Customer Churn",
      current: 8.5,
      predicted: 6.2,
      change: "-27.1%",
      confidence: 92,
      timeframe: "Next 30 days",
      color: "text-purple-400"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl">
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Predictive Analytics
              <Badge variant="secondary" className="bg-gradient-to-r from-green-500/10 to-blue-500/10 text-green-400 border-green-500/20">
                AutoML
              </Badge>
            </h1>
            <p className="text-muted-foreground">Machine learning forecasts • Revenue predictions • Trend analysis</p>
          </div>
        </div>
      </div>

      {/* ML Model Performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Model Accuracy</p>
                <p className="text-3xl font-bold text-green-400">
                  {Math.round((predict.confidence || 0.84) * 100)}%
                </p>
              </div>
              <Brain className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{predict.bestModel || 'Ensemble'} Algorithm</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predictions Made</p>
                <p className="text-3xl font-bold text-blue-400">1,247</p>
              </div>
              <Target className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forecast Range</p>
                <p className="text-3xl font-bold text-purple-400">90</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Days ahead</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Key Predictions
          </CardTitle>
          <CardDescription>
            AI-powered forecasts for your most important metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {mockPredictions.map((prediction, index) => (
              <Card key={index} className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700/50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="font-medium text-white mb-2">{prediction.metric}</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="text-xl font-bold text-white">
                          {prediction.metric === "Revenue" ? `$${prediction.current.toLocaleString()}` : 
                           prediction.metric === "Conversion Rate" ? `${prediction.current}%` :
                           `${prediction.current}%`}
                        </p>
                      </div>
                      <ArrowUpRight className="h-6 w-6 text-green-400 mx-auto" />
                      <div>
                        <p className="text-sm text-muted-foreground">Predicted</p>
                        <p className={`text-2xl font-bold ${prediction.color}`}>
                          {prediction.metric === "Revenue" ? `$${prediction.predicted.toLocaleString()}` : 
                           prediction.metric === "Conversion Rate" ? `${prediction.predicted}%` :
                           `${prediction.predicted}%`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Badge variant="outline" className={`${prediction.color} border-current`}>
                        {prediction.change}
                      </Badge>
                      <Progress value={prediction.confidence} className="h-2" />
                      <p className="text-xs text-muted-foreground">{prediction.confidence}% confidence • {prediction.timeframe}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Model Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-3">Top Factors Driving Growth</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">WhatsApp engagement</span>
                  <span className="text-green-400 font-medium">+34%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email open rates</span>
                  <span className="text-green-400 font-medium">+28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customer onboarding</span>
                  <span className="text-green-400 font-medium">+22%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mobile app usage</span>
                  <span className="text-green-400 font-medium">+18%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Risk Factors</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Seasonal trends</span>
                  <span className="text-yellow-400 font-medium">Medium</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Market competition</span>
                  <span className="text-yellow-400 font-medium">Medium</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Economic factors</span>
                  <span className="text-red-400 font-medium">High</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Regulatory changes</span>
                  <span className="text-green-400 font-medium">Low</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="font-medium text-green-400 mb-2">Optimize WhatsApp Campaigns</h4>
              <p className="text-sm text-muted-foreground">Model predicts 23% revenue increase by focusing on WhatsApp engagement during peak hours (6-9 PM WAT).</p>
            </div>
            
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="font-medium text-blue-400 mb-2">Enhance Onboarding Flow</h4>
              <p className="text-sm text-muted-foreground">Improving first-week user experience could reduce churn by 31% based on behavioral patterns.</p>
            </div>
            
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="font-medium text-purple-400 mb-2">Target High-Value Segments</h4>
              <p className="text-sm text-muted-foreground">Focus marketing spend on users with 78%+ conversion probability for maximum ROI.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 