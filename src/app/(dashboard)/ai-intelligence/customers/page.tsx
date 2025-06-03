"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, TrendingUp, TrendingDown, Target, AlertTriangle, 
  Crown, Heart, DollarSign, Calendar, Brain, BarChart3, 
  ArrowUpRight, ArrowDownRight, CheckCircle, Filter,
  RefreshCw, Settings, Download, Clock, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCustomerIntelligence } from '@/hooks/useSupremeAI';
import SupremeCustomerPanel from '@/components/ai/SupremeCustomerPanel';
import StaticDashboardGrid from '@/components/panels/StaticDashboardGrid';
import type { DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';
import { toast } from 'sonner';

export default function CustomerIntelligencePage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);
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

  // Mock time series data for customer analytics
  const customerGrowthData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.floor(800 + Math.random() * 100 + idx * 2),
  }));

  const churnPredictionData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.floor(30 + Math.random() * 20 - idx * 0.3),
  }));

  const ltvTrendData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.floor(4000 + Math.random() * 1000 + idx * 25),
  }));

  // Sparkline data for stat panels
  const customerGrowthSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.floor(800 + idx * 5 + Math.random() * 20),
  }));

  const ltvSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.floor(4500 + idx * 25 + Math.random() * 200),
  }));

  const churnSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.floor(40 - idx * 0.8 + Math.random() * 5),
  }));

  const mlAccuracySparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.floor(80 + idx * 0.4 + Math.random() * 3),
  }));

  const segmentDistributionData = mockSegments.map(segment => ({
    name: segment.name,
    value: segment.count,
    color: segment.color
  }));

  const customerJourneyData = [
    { stage: 'Discovery', count: 1200, conversion: 85 },
    { stage: 'Trial', count: 1020, conversion: 72 },
    { stage: 'Purchase', count: 734, conversion: 68 },
    { stage: 'Onboarding', count: 499, conversion: 84 },
    { stage: 'Active', count: 419, conversion: 92 },
    { stage: 'Advocate', count: 385, conversion: 78 }
  ];

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Customer data refreshed');
  };

  const getSegmentIcon = (name: string) => {
    switch (name) {
      case "VIP Champions": return <Crown className="h-4 w-4" />;
      case "Growth Potential": return <TrendingUp className="h-4 w-4" />;
      case "At Risk": return <AlertTriangle className="h-4 w-4" />;
      case "New Users": return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  // Customer Segments Panel Component
  const CustomerSegmentsPanel = () => (
    <Panel 
      title="Customer Segments" 
      toolbar={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-3 flex-1 overflow-y-auto">
        {(customerAnalysis.segments || mockSegments).map((segment: any, index: number) => (
          <div key={index} className={`${segment.bgColor} ${segment.borderColor} border rounded-lg p-3`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={segment.color}>
                  {getSegmentIcon(segment.name)}
                </div>
                <h4 className="font-medium text-white text-sm">{segment.name}</h4>
              </div>
              <Badge variant="outline" className={`${segment.color} border-current text-xs`}>
                {segment.count}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">LTV</p>
                <p className="font-medium text-white">${(segment.ltv / 1000).toFixed(1)}K</p>
              </div>
              <div>
                <p className="text-muted-foreground">Risk</p>
                <p className={`font-medium ${segment.churnRisk > 60 ? 'text-red-400' : segment.churnRisk > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {segment.churnRisk}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Trend</p>
                <div className="flex items-center gap-1">
                  {segment.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-400" />
                  )}
                  <span className={`text-xs ${segment.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {segment.trend === 'up' ? 'Up' : 'Down'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Customer Journey Funnel Panel
  const CustomerJourneyPanel = () => (
    <Panel title="Customer Journey Funnel">
      <div className="space-y-3 flex-1">
        {customerJourneyData.map((stage, index) => (
          <div key={stage.stage} className="flex items-center justify-between p-2 bg-gray-800/30 rounded border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-gray-300 w-20">{stage.stage}</div>
              <div className="flex-1 max-w-32">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${stage.conversion}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{stage.count.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{stage.conversion}%</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // AI Insights Panel
  const AIInsightsPanel = () => (
    <Panel title="AI-Powered Insights" toolbar={
      <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
        ML Active
      </Badge>
    }>
      <div className="space-y-4 flex-1">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">High Churn Risk Alert</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">89 customers predicted to churn within 30 days</p>
          <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-6">
            Create Retention Campaign
          </Button>
        </div>
        
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Upsell Opportunity</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">142 VIP customers showing upgrade signals</p>
          <Button size="sm" variant="outline" className="border-green-500/20 text-green-400 hover:bg-green-500/10 text-xs h-6">
            Launch Premium Offer
          </Button>
        </div>
        
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Engagement Drop</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">234 users showing decreased activity</p>
          <Button size="sm" variant="outline" className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 text-xs h-6">
            Send Re-engagement
          </Button>
        </div>
      </div>
    </Panel>
  );

  // Customer Risk Matrix Panel
  const CustomerRiskMatrixPanel = () => {
    const riskMatrix = [
      { segment: 'VIP Champions', ltv: 'High', risk: 'Low', urgency: 'Low', color: 'bg-green-500/20 border-green-500/40' },
      { segment: 'Growth Potential', ltv: 'Medium', risk: 'Low', urgency: 'Medium', color: 'bg-blue-500/20 border-blue-500/40' },
      { segment: 'At Risk', ltv: 'Medium', risk: 'High', urgency: 'High', color: 'bg-red-500/20 border-red-500/40' },
      { segment: 'New Users', ltv: 'Low', risk: 'Medium', urgency: 'Medium', color: 'bg-purple-500/20 border-purple-500/40' },
    ];

    return (
      <Panel title="Customer Risk Matrix" toolbar={
        <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
          Risk Analysis
        </Badge>
      }>
        <div className="space-y-2 flex-1">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-400 pb-2 border-b border-gray-700/50">
            <div>Segment</div>
            <div>LTV</div>
            <div>Risk</div>
            <div>Urgency</div>
          </div>
          {riskMatrix.map((item, index) => (
            <div key={index} className={`grid grid-cols-4 gap-2 p-2 rounded border ${item.color} text-xs`}>
              <div className="font-medium text-white truncate">{item.segment}</div>
              <div className={`font-medium ${item.ltv === 'High' ? 'text-green-400' : item.ltv === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                {item.ltv}
              </div>
              <div className={`font-medium ${item.risk === 'Low' ? 'text-green-400' : item.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                {item.risk}
              </div>
              <div className={`font-medium ${item.urgency === 'Low' ? 'text-green-400' : item.urgency === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                {item.urgency}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    );
  };

  // Define Grafana-style dashboard panels
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key Metrics
    {
      id: 'total_customers',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Total Customers"
          value={customerAnalysis.segments?.reduce((acc: number, seg: any) => acc + (seg.count || 0), 0) || 852}
          isLoading={false}
          trendValue="+12% vs last month"
          trend="up"
          sparklineData={customerGrowthSparkline}
          icon={<Users className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'avg_ltv',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Average LTV"
          value="$4,750"
          isLoading={false}
          trendValue="+8% improvement"
          trend="up"
          sparklineData={ltvSparkline}
          icon={<DollarSign className="h-5 w-5 text-green-400" />}
        />
      ),
    },
    {
      id: 'churn_risk',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Avg Churn Risk"
          value="34%"
          isLoading={false}
          trendValue="-5% reduction"
          trend="down"
          sparklineData={churnSparkline}
          icon={<AlertTriangle className="h-5 w-5 text-yellow-400" />}
        />
      ),
    },
    {
      id: 'ml_accuracy',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="ML Accuracy"
          value="84%"
          isLoading={false}
          trendValue="Ensemble Model"
          trend="stable"
          sparklineData={mlAccuracySparkline}
          icon={<Brain className="h-5 w-5 text-purple-400" />}
        />
      ),
    },

    // Second Row - Time Series Charts
    {
      id: 'customer_growth',
      x: 0,
      y: 2,
      w: 6,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Customer Growth Trend"
          data={customerGrowthData}
          yLabel="Customers"
          stroke="#3b82f6"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'ltv_trend',
      x: 6,
      y: 2,
      w: 6,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Average LTV Trend"
          data={ltvTrendData}
          yLabel="LTV ($)"
          stroke="#10b981"
          fillGradient={true}
        />
      ),
    },

    // Third Row - Detailed Analytics
    {
      id: 'churn_prediction',
      x: 0,
      y: 6,
      w: 6,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Churn Risk Prediction"
          data={churnPredictionData}
          yLabel="Risk %"
          stroke="#ef4444"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'segment_distribution',
      x: 6,
      y: 6,
      w: 3,
      h: 4,
      component: (
        <PiePanel
          title="Segment Distribution"
          data={segmentDistributionData}
          isLoading={false}
        />
      ),
    },
    {
      id: 'customer_segments',
      x: 9,
      y: 6,
      w: 3,
      h: 4,
      component: <CustomerSegmentsPanel />,
    },

    // Fourth Row - Journey and Insights
    {
      id: 'customer_journey',
      x: 0,
      y: 10,
      w: 4,
      h: 4,
      component: <CustomerJourneyPanel />,
    },
    {
      id: 'ai_insights',
      x: 4,
      y: 10,
      w: 4,
      h: 4,
      component: <AIInsightsPanel />,
    },
    {
      id: 'risk_matrix',
      x: 8,
      y: 10,
      w: 4,
      h: 4,
      component: <CustomerRiskMatrixPanel />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Grafana-style controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg border border-blue-500/20">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Customer Intelligence
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-green-500/10 text-blue-400 border-blue-500/20">
                  Real-time
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">AI-powered customer analytics and predictive insights</p>
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
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
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