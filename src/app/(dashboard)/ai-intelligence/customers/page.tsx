"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, TrendingUp, TrendingDown, Target, AlertTriangle, 
  Crown, Heart, DollarSign, Calendar, Brain, BarChart3, 
  ArrowUpRight, ArrowDownRight, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCustomerIntelligence } from '@/hooks/useSupremeAI';
import SupremeCustomerPanel from '@/components/ai/SupremeCustomerPanel';

export default function CustomerIntelligencePage() {
  const customerAnalysis = useCustomerIntelligence("dashboard-user");

  const mockSegments = [
    {
      name: "VIP Champions",
      count: 142,
      ltv: 12500,
      churnRisk: 15,
      trend: "up",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      name: "Growth Potential",
      count: 387,
      ltv: 3200,
      churnRisk: 35,
      trend: "up",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      name: "At Risk",
      count: 89,
      ltv: 1800,
      churnRisk: 78,
      trend: "down",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20"
    },
    {
      name: "New Users",
      count: 234,
      ltv: 850,
      churnRisk: 45,
      trend: "up",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    }
  ];

  const getSegmentIcon = (name: string) => {
    switch (name) {
      case "VIP Champions": return <Crown className="h-5 w-5" />;
      case "Growth Potential": return <TrendingUp className="h-5 w-5" />;
      case "At Risk": return <AlertTriangle className="h-5 w-5" />;
      case "New Users": return <Users className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-xl">
            <Users className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Customer Intelligence
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-green-500/10 text-blue-400 border-blue-500/20">
                ML-Powered
              </Badge>
            </h1>
            <p className="text-muted-foreground">AI-driven customer behavior analysis • Segmentation • Churn Prediction • LTV Forecasting</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-3xl font-bold text-blue-400">
                  {customerAnalysis.segments?.reduce((acc: number, seg: any) => acc + (seg.count || 0), 0) || '852'}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. LTV</p>
                <p className="text-3xl font-bold text-green-400">$4,750</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">+8% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Churn Risk</p>
                <p className="text-3xl font-bold text-yellow-400">34%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">-5% reduction</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ML Accuracy</p>
                <p className="text-3xl font-bold text-purple-400">
                  84%
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ensemble Model</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              AI Customer Segments
            </CardTitle>
            <CardDescription>
              Machine learning-powered customer segmentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(customerAnalysis.segments || mockSegments).map((segment: any, index: number) => (
                <Card key={index} className={`${segment.bgColor} ${segment.borderColor} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={segment.color}>
                          {getSegmentIcon(segment.name)}
                        </div>
                        <h3 className="font-medium text-white">{segment.name}</h3>
                      </div>
                      <Badge variant="outline" className={`${segment.color} border-current`}>
                        {segment.count} customers
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Avg. LTV</p>
                        <p className="font-medium text-white">${segment.ltv?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Churn Risk</p>
                        <p className={`font-medium ${segment.churnRisk > 60 ? 'text-red-400' : segment.churnRisk > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {segment.churnRisk}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trend</p>
                        <div className="flex items-center gap-1">
                          {segment.trend === 'up' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-400" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-400" />
                          )}
                          <span className={segment.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                            {segment.trend === 'up' ? 'Growing' : 'Declining'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supreme Customer Panel */}
        <div className="space-y-4">
          <SupremeCustomerPanel userId="dashboard-user" />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div>
                    <p className="font-medium text-red-400">High Churn Risk Alert</p>
                    <p className="text-sm text-muted-foreground">89 customers at risk</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                    Send Campaign
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div>
                    <p className="font-medium text-green-400">Upsell Opportunity</p>
                    <p className="text-sm text-muted-foreground">142 VIP customers ready</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-green-500/20 text-green-400 hover:bg-green-500/10">
                    Create Offer
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-400">Onboarding Focus</p>
                    <p className="text-sm text-muted-foreground">234 new users need guidance</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
                    Start Workflow
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Journey Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Customer Journey Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                <Calendar className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-400">14 days</p>
                <p className="text-sm text-muted-foreground">Avg. Time to First Transaction</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                <Heart className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-400">67%</p>
                <p className="text-sm text-muted-foreground">Customer Satisfaction Score</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
                <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-400">3.2x</p>
                <p className="text-sm text-muted-foreground">Revenue Growth from AI Segments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 