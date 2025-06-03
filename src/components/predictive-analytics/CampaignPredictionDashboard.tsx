"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Eye,
  MousePointer,
  RefreshCw,
  Settings,
  Download,
  Filter,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { toast } from "sonner";
import StaticDashboardGrid, { type DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';

export default function CampaignPredictionDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '6m'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Campaign predictions refreshed');
  };

  // Mock time series data for campaign trends
  const openRateTrendData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(21.6 + Math.random() * 8 + Math.sin(idx * 0.2) * 3),
  }));

  const clickRateTrendData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(4.2 + Math.random() * 2 + Math.cos(idx * 0.15) * 1),
  }));

  // Sparkline data for stat panels
  const openRateSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(21.6 + idx * 0.3 + Math.random() * 2),
  }));

  const clickRateSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(4.2 + idx * 0.1 + Math.random() * 0.5),
  }));

  const conversionSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(2.8 + idx * 0.05 + Math.random() * 0.3),
  }));

  // Campaign Performance Predictions Panel
  const CampaignPredictionsPanel = () => (
    <Panel title="Performance Predictions">
      <div className="space-y-4 flex-1">
        {[
          { 
            campaign: 'Newsletter #245', 
            predicted: { open: 24.5, click: 4.8, conversion: 3.2 },
            confidence: 'High',
            status: 'scheduled'
          },
          { 
            campaign: 'Product Launch', 
            predicted: { open: 28.2, click: 5.9, conversion: 4.1 },
            confidence: 'Medium',
            status: 'draft'
          },
          { 
            campaign: 'Welcome Series #3', 
            predicted: { open: 31.8, click: 7.2, conversion: 5.5 },
            confidence: 'High',
            status: 'draft'
          }
        ].map((item, index) => (
          <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{item.campaign}</span>
              <Badge 
                variant={item.confidence === 'High' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {item.confidence}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-blue-400 font-medium">{item.predicted.open}%</div>
                <div className="text-gray-400">Open Rate</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-medium">{item.predicted.click}%</div>
                <div className="text-gray-400">Click Rate</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-medium">{item.predicted.conversion}%</div>
                <div className="text-gray-400">Conversion</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Channel Performance Panel
  const ChannelPerformancePanel = () => (
    <Panel title="Channel Performance Forecast">
      <div className="space-y-3 flex-1">
        {[
          { channel: 'Email Marketing', predicted: 24.5, current: 21.6, trend: 'up' },
          { channel: 'WhatsApp Business', predicted: 18.2, current: 16.8, trend: 'up' },
          { channel: 'SMS Campaigns', predicted: 15.7, current: 17.2, trend: 'down' },
          { channel: 'Push Notifications', predicted: 12.4, current: 11.9, trend: 'up' }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div>
              <span className="text-sm font-medium text-white">{item.channel}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">Current: {item.current}%</span>
                <span className="text-xs text-blue-400">Predicted: {item.predicted}%</span>
              </div>
            </div>
            <div className={`text-sm ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {item.trend === 'up' ? 
                <ArrowUpRight className="h-4 w-4" /> : 
                <ArrowDownRight className="h-4 w-4" />
              }
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Optimization Recommendations Panel
  const OptimizationPanel = () => (
    <Panel title="AI Recommendations">
      <div className="space-y-3 flex-1">
        {[
          {
            type: 'Subject Line',
            recommendation: 'Use action words and personalization',
            impact: '+12% open rate',
            confidence: 89
          },
          {
            type: 'Send Time',
            recommendation: 'Send on Tuesday at 10:30 AM',
            impact: '+8% engagement',
            confidence: 92
          },
          {
            type: 'Content Length',
            recommendation: 'Keep content under 150 words',
            impact: '+15% click rate',
            confidence: 76
          },
          {
            type: 'Call to Action',
            recommendation: 'Use contrasting button colors',
            impact: '+22% conversion',
            confidence: 85
          }
        ].map((item, index) => (
          <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{item.type}</span>
              <Badge variant="outline" className="text-xs">
                {item.confidence}% confidence
              </Badge>
            </div>
            <div className="text-xs text-gray-300 mb-1">{item.recommendation}</div>
            <div className="text-xs text-green-400">{item.impact}</div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Define dashboard panels
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key Performance Metrics
    {
      id: 'predicted_open_rate',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Predicted Open Rate"
          value="24.3"
          unit="%"
          isLoading={false}
          trendValue="+2.7% vs current average"
          trend="up"
          sparklineData={openRateSparkline}
          icon={<Eye className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'predicted_click_rate',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Predicted Click Rate"
          value="4.8"
          unit="%"
          isLoading={false}
          trendValue="+0.6% improvement"
          trend="up"
          sparklineData={clickRateSparkline}
          icon={<MousePointer className="h-5 w-5 text-green-400" />}
        />
      ),
    },
    {
      id: 'predicted_conversion',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Predicted Conversion"
          value="3.2"
          unit="%"
          isLoading={false}
          trendValue="+0.4% vs baseline"
          trend="up"
          sparklineData={conversionSparkline}
          icon={<Target className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'campaign_score',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Campaign Score"
          value="87"
          unit="/100"
          isLoading={false}
          trendValue="+5 points optimized"
          trend="up"
          sparklineData={[]}
          icon={<Zap className="h-5 w-5 text-amber-400" />}
        />
      ),
    },

    // Second Row - Performance Trends
    {
      id: 'open_rate_trend',
      x: 0,
      y: 2,
      w: 6,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Open Rate Prediction Trend"
          data={openRateTrendData}
          yLabel="Open Rate %"
          stroke="#3b82f6"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'click_rate_trend',
      x: 6,
      y: 2,
      w: 6,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Click Rate Prediction Trend"
          data={clickRateTrendData}
          yLabel="Click Rate %"
          stroke="#10b981"
          fillGradient={true}
        />
      ),
    },

    // Third Row - Campaign Analysis
    {
      id: 'campaign_predictions',
      x: 0,
      y: 6,
      w: 4,
      h: 4,
      component: <CampaignPredictionsPanel />,
    },
    {
      id: 'channel_performance',
      x: 4,
      y: 6,
      w: 4,
      h: 4,
      component: <ChannelPerformancePanel />,
    },
    {
      id: 'optimization_tips',
      x: 8,
      y: 6,
      w: 4,
      h: 4,
      component: <OptimizationPanel />,
    },

    // Fourth Row - Detailed Analysis
    {
      id: 'performance_by_segment',
      x: 0,
      y: 10,
      w: 6,
      h: 4,
      component: (
        <BarPanel
          title="Performance by Audience Segment"
          data={[
            { name: 'VIP Customers', value: 28.5 },
            { name: 'Regular Subscribers', value: 21.3 },
            { name: 'New Prospects', value: 18.7 },
            { name: 'Re-engagement', value: 15.2 },
          ]}
          dataKey="value"
          xKey="name"
          isLoading={false}
        />
      ),
    },
    {
      id: 'campaign_types',
      x: 6,
      y: 10,
      w: 6,
      h: 4,
      component: (
        <PiePanel
          title="Predicted Performance by Campaign Type"
          data={[
            { name: 'Newsletter', value: 35 },
            { name: 'Promotional', value: 28 },
            { name: 'Educational', value: 22 },
            { name: 'Transactional', value: 15 },
          ]}
          isLoading={false}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Grafana-style controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg border border-blue-500/20">
              <BarChart2 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Campaign Performance Prediction
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-green-500/10 text-blue-400 border-blue-500/20">
                  AI-Optimized
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Predict and optimize campaign performance before sending</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['7d', '30d', '90d', '6m'] as const).map((range) => (
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