"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  ShoppingCart,
  RefreshCw,
  Settings,
  Download,
  Filter,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import StaticDashboardGrid, { type DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';

export default function ConversionsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);


  const refreshData = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Conversion data refreshed');
  };

  // Demo time series data for charts
  const conversionTrendData = Array.from({ length: 30 }).map((_, idx) => {
    const baseConversions = 3.2;
    const dayVariation = Math.sin(idx * 0.2) * 2 + Math.random() * 1.5;
    return {
      x: `Day ${idx + 1}`,
      y: Math.max(0, Math.round(baseConversions + dayVariation)),
    };
  });

  const revenueTrendData = Array.from({ length: 30 }).map((_, idx) => {
    const baseRevenue = 45000;
    const dayVariation = Math.cos(idx * 0.15) * 8000 + Math.random() * 15000;
    return {
      x: `Day ${idx + 1}`,
      y: Math.max(0, Math.round(baseRevenue + dayVariation)),
    };
  });

  // Demo sparkline data for stat panels
  const currentConversionRate = 3.2;
  const currentRevenue = 580000;
  const currentConversions = 45;

  const conversionRateSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.max(0, Math.round(currentConversionRate + idx * 0.1 + Math.random() * 0.8)),
  }));

  const revenueSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.max(0, Math.round(currentRevenue + idx * 12000 + Math.random() * 50000)),
  }));

  const costSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.max(0, Math.round(1200 - idx * 15 + Math.random() * 100)),
  }));

  const conversionsSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.max(0, Math.round(currentConversions + idx * 2 + Math.random() * 5)),
  }));

  // Simulation-based Conversion Funnel Panel
  const ConversionFunnelPanel = () => {
    const totalVisitors = simulationState.isRunning ? simulationState.leadpulse.totalVisitors : 1245;
    const leads = Math.round(totalVisitors * 0.424);
    const opportunities = Math.round(totalVisitors * 0.149);
    const customers = Math.round(totalVisitors * (currentConversionRate / 100));

    const funnelData = [
      { stage: 'Visitors', count: totalVisitors, percentage: 100, color: 'bg-blue-500' },
      { stage: 'Leads', count: leads, percentage: Math.round((leads / totalVisitors) * 100 * 10) / 10, color: 'bg-green-500' },
      { stage: 'Opportunities', count: opportunities, percentage: Math.round((opportunities / totalVisitors) * 100 * 10) / 10, color: 'bg-amber-500' },
      { stage: 'Customers', count: customers, percentage: Math.round((customers / totalVisitors) * 100 * 10) / 10, color: 'bg-purple-500' }
    ];

    return (
      <Panel title="Conversion Funnel">
        <div className="flex flex-col space-y-4 h-full justify-center">
          {funnelData.map((item, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{item.stage}</span>
              <span className="text-xs text-gray-400">{item.percentage}%</span>
                  </div>
                  <div className="relative">
              <div className="h-12 bg-gray-800 rounded-lg overflow-hidden">
                <div 
                  className={`h-full ${item.color} transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
                    </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {item.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                      </div>
          ))}
        </div>
      </Panel>
    );
  };

  // Top Converting Channels Panel
  const TopChannelsPanel = () => (
    <Panel title="Top Converting Channels">
      <div className="space-y-3 flex-1">
        {[
          { channel: 'Email Marketing', conversions: 186, rate: 12.4, trend: 'up' },
          { channel: 'WhatsApp Business', conversions: 142, rate: 9.7, trend: 'up' },
          { channel: 'SMS Campaigns', conversions: 89, rate: 6.2, trend: 'down' },
          { channel: 'Automation Workflows', conversions: 66, rate: 4.1, trend: 'up' }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div>
              <span className="text-sm font-medium text-white">{item.channel}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{item.conversions} conversions</span>
                <Badge variant="outline" className="text-xs">
                  {item.rate}%
                </Badge>
              </div>
                        </div>
            <div className={`text-sm ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {item.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                      </div>
        ))}
      </div>
    </Panel>
  );

  // Goals Progress Panel
  const GoalsProgressPanel = () => (
    <Panel title="Conversion Goals">
      <div className="space-y-4 flex-1">
        {[
          { goal: 'Monthly Conversions', target: 600, actual: 483, percentage: 80.5 },
          { goal: 'Revenue Target', target: 8000000, actual: 5800000, percentage: 72.5 },
          { goal: 'Email Conversion Rate', target: 15, actual: 12.4, percentage: 82.7 },
          { goal: 'Cost Per Acquisition', target: 1000, actual: 1200, percentage: 83.3, inverse: true }
        ].map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">{item.goal}</span>
              <span className="text-xs text-gray-400">
                {item.goal.includes('Revenue') ? `₦${(item.actual/1000000).toFixed(1)}M / ₦${(item.target/1000000).toFixed(1)}M` :
                 item.goal.includes('Rate') ? `${item.actual}% / ${item.target}%` :
                 item.goal.includes('Cost') ? `₦${item.actual.toLocaleString()} / ₦${item.target.toLocaleString()}` :
                 `${item.actual} / ${item.target}`}
              </span>
                        </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  item.percentage >= 90 ? 'bg-green-500' :
                  item.percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
                        </div>
            <div className="flex justify-between items-center">
              <Badge 
                variant={item.percentage >= 90 ? 'default' : item.percentage >= 70 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {item.percentage.toFixed(1)}%
              </Badge>
              <span className={`text-xs ${item.percentage >= 90 ? 'text-green-400' : item.percentage >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                {item.percentage >= 90 ? 'On track' : item.percentage >= 70 ? 'Behind' : 'Critical'}
              </span>
                        </div>
                      </div>
        ))}
      </div>
    </Panel>
  );

  // Define dashboard panels with professional Grafana-like layout
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key Conversion Metrics
    {
      id: 'conversion_rate',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Conversion Rate"
          value={currentConversionRate.toFixed(1)}
          unit="%"
          isLoading={false}
          trendValue="+1.2% vs last month"
          trend="up"
          sparklineData={conversionRateSparkline}
          icon={<Target className="h-5 w-5 text-green-400" />}
        />
      ),
    },
    {
      id: 'total_conversions',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Total Conversions"
          value={currentConversions.toString()}
          unit=""
          isLoading={false}
          trendValue="+67 vs last month"
          trend="up"
          sparklineData={conversionsSparkline}
          icon={<CheckCircle2 className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'revenue',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Revenue"
          value={`₦${(currentRevenue / 1000000).toFixed(1)}`}
          unit="M"
          isLoading={false}
          trendValue="+₦890K vs last month"
          trend="up"
          sparklineData={revenueSparkline}
          icon={<DollarSign className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'cost_per_conversion',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Cost Per Conversion"
          value="₦1,200"
          unit=""
          isLoading={false}
          trendValue="-₦180 vs last month"
          trend="up"
          sparklineData={costSparkline}
          icon={<ShoppingCart className="h-5 w-5 text-amber-400" />}
        />
      ),
    },

    // Second Row - Trend Charts
    {
      id: 'conversion_trend',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Conversion Trend Over Time"
          data={conversionTrendData}
          yLabel="Conversions"
          stroke="#10b981"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'conversion_funnel',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: <ConversionFunnelPanel />,
    },

    // Third Row - Revenue Analysis
    {
      id: 'revenue_trend',
      x: 0,
      y: 6,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Revenue Trend"
          data={revenueTrendData}
          yLabel="Revenue (₦)"
          stroke="#8b5cf6"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'top_channels',
      x: 8,
      y: 6,
      w: 4,
      h: 4,
      component: <TopChannelsPanel />,
    },

    // Fourth Row - Detailed Analysis
    {
      id: 'conversion_types',
      x: 0,
      y: 10,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="Conversion Types"
          data={[
            { name: 'Lead Generation', value: 186 },
            { name: 'Purchases', value: 142 },
            { name: 'Sign-ups', value: 89 },
            { name: 'Form Submissions', value: 66 },
          ]}
          isLoading={false}
        />
      ),
    },
    {
      id: 'channel_performance',
      x: 4,
      y: 10,
      w: 4,
      h: 4,
      component: (
        <BarPanel
          title="Channel Performance"
          data={[
            { name: 'Email', value: 186 },
            { name: 'WhatsApp', value: 142 },
            { name: 'SMS', value: 89 },
            { name: 'Automation', value: 66 },
          ]}
          dataKey="value"
          xKey="name"
          isLoading={false}
        />
      ),
    },
    {
      id: 'goals_progress',
      x: 8,
      y: 10,
      w: 4,
      h: 4,
      component: <GoalsProgressPanel />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Grafana-style controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/20">
              <BarChart3 className="h-6 w-6 text-green-400" />
                </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Conversion Tracking
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500/10 to-blue-500/10 text-green-400 border-green-500/20">
                  Real-time
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Advanced conversion analytics and performance insights</p>
                </div>
        </div>
      </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={`h-7 px-3 text-xs ${
                  timeRange === range 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
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
