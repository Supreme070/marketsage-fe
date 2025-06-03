"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target,
  RefreshCw,
  Settings,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Brain
} from "lucide-react";
import { toast } from "sonner";
import StaticDashboardGrid, { type DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';

export default function LTVPredictionDashboard() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '180d' | '12m'>('90d');
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('LTV predictions refreshed');
  };

  // Mock time series data for LTV trends
  const ltvTrendData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(254.82 + Math.random() * 50 + Math.sin(idx * 0.1) * 25),
  }));

  const retentionData = Array.from({ length: 12 }).map((_, idx) => ({
    x: `Month ${idx + 1}`,
    y: Math.round(100 - (idx * 8) - Math.random() * 5),
  }));

  // Sparkline data for stat panels
  const avgLTVSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(254.82 + idx * 2.5 + Math.random() * 15),
  }));

  const predictedRevenueSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(125000 + idx * 5000 + Math.random() * 8000),
  }));

  const retentionSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(68.5 - idx * 0.8 + Math.random() * 3),
  }));

  // Customer Segments Panel
  const CustomerSegmentsPanel = () => (
    <Panel title="Customer Value Segments">
      <div className="space-y-4 flex-1">
        {[
          { segment: 'High Value Champions', count: 124, avgLTV: 485, color: 'text-green-400', growth: '+12%' },
          { segment: 'Loyal Customers', count: 387, avgLTV: 298, color: 'text-blue-400', growth: '+8%' },
          { segment: 'Potential Loyalists', count: 156, avgLTV: 185, color: 'text-amber-400', growth: '+15%' },
          { segment: 'At Risk', count: 89, avgLTV: 125, color: 'text-red-400', growth: '-5%' }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div>
              <span className="text-sm font-medium text-white">{item.segment}</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-400">{item.count} customers</span>
                <Badge variant="outline" className="text-xs">
                  ₦{item.avgLTV.toLocaleString()} LTV
                </Badge>
              </div>
            </div>
            <div className={`text-xs ${item.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {item.growth.startsWith('+') ? <ArrowUpRight className="h-3 w-3 inline mr-1" /> : <ArrowDownRight className="h-3 w-3 inline mr-1" />}
              {item.growth}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // LTV Factors Panel
  const LTVFactorsPanel = () => (
    <Panel title="Key LTV Factors">
      <div className="space-y-4 flex-1">
        {[
          { factor: 'Purchase Frequency', impact: 85, trend: 'up' },
          { factor: 'Average Order Value', impact: 72, trend: 'up' },
          { factor: 'Customer Lifespan', impact: 68, trend: 'stable' },
          { factor: 'Retention Rate', impact: 61, trend: 'down' },
          { factor: 'Referral Activity', impact: 45, trend: 'up' }
        ].map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">{item.factor}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{item.impact}%</span>
                <div className={`text-xs ${item.trend === 'up' ? 'text-green-400' : item.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                  {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  item.impact >= 70 ? 'bg-green-500' :
                  item.impact >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${item.impact}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // LTV Predictions Panel
  const LTVPredictionsPanel = () => (
    <Panel title="LTV Predictions">
      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-xs text-gray-400 mb-1">30-Day Forecast</div>
            <div className="text-xl font-bold text-white">₦285.40</div>
            <div className="text-xs text-green-400">+12% confidence</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-xs text-gray-400 mb-1">90-Day Forecast</div>
            <div className="text-xl font-bold text-white">₦312.75</div>
            <div className="text-xs text-green-400">+22% confidence</div>
          </div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-2">Revenue Impact</div>
          <div className="text-lg font-bold text-purple-400">+₦1.2M</div>
          <div className="text-xs text-gray-400">Predicted 12-month revenue increase</div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-2">Model Accuracy</div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold text-green-400">89.7%</div>
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
              High Confidence
            </Badge>
          </div>
        </div>
      </div>
    </Panel>
  );

  // Define dashboard panels
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key LTV Metrics
    {
      id: 'avg_ltv',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Average LTV"
          value="₦254.82"
          unit=""
          isLoading={false}
          trendValue="+₦12.40 vs last month"
          trend="up"
          sparklineData={avgLTVSparkline}
          icon={<DollarSign className="h-5 w-5 text-green-400" />}
        />
      ),
    },
    {
      id: 'predicted_revenue',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Predicted Revenue"
          value="₦1.25"
          unit="M"
          isLoading={false}
          trendValue="+18.5% next quarter"
          trend="up"
          sparklineData={predictedRevenueSparkline}
          icon={<Target className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'retention_rate',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Retention Rate"
          value="68.5"
          unit="%"
          isLoading={false}
          trendValue="-2.1% vs last month"
          trend="down"
          sparklineData={retentionSparkline}
          icon={<Users className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'total_customers',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Total Customers"
          value="756"
          unit=""
          isLoading={false}
          trendValue="+47 new this month"
          trend="up"
          sparklineData={[]}
          icon={<Users className="h-5 w-5 text-amber-400" />}
        />
      ),
    },

    // Second Row - LTV Trend Analysis
    {
      id: 'ltv_trend',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="LTV Trend Over Time"
          data={ltvTrendData}
          yLabel="LTV (₦)"
          stroke="#10b981"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'customer_segments',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: <CustomerSegmentsPanel />,
    },

    // Third Row - Retention & Behavior
    {
      id: 'retention_trend',
      x: 0,
      y: 6,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Customer Retention by Cohort"
          data={retentionData}
          yLabel="Retention %"
          stroke="#8b5cf6"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'ltv_factors',
      x: 8,
      y: 6,
      w: 4,
      h: 4,
      component: <LTVFactorsPanel />,
    },

    // Fourth Row - Detailed Analysis
    {
      id: 'ltv_distribution',
      x: 0,
      y: 10,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="LTV Distribution"
          data={[
            { name: 'High Value (₦400+)', value: 124 },
            { name: 'Medium Value (₦200-399)', value: 298 },
            { name: 'Low Value (₦100-199)', value: 234 },
            { name: 'New Customers (<₦100)', value: 100 },
          ]}
          isLoading={false}
        />
      ),
    },
    {
      id: 'customer_value_trends',
      x: 4,
      y: 10,
      w: 4,
      h: 4,
      component: (
        <BarPanel
          title="Customer Value by Channel"
          data={[
            { name: 'Email', value: 289 },
            { name: 'WhatsApp', value: 234 },
            { name: 'SMS', value: 198 },
            { name: 'Social', value: 156 },
          ]}
          dataKey="value"
          xKey="name"
          isLoading={false}
        />
      ),
    },
    {
      id: 'ltv_predictions',
      x: 8,
      y: 10,
      w: 4,
      h: 4,
      component: <LTVPredictionsPanel />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Grafana-style controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-purple-500/20 rounded-lg border border-green-500/20">
              <Brain className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Lifetime Value Prediction
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500/10 to-purple-500/10 text-green-400 border-green-500/20">
                  AI-Powered
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Predict customer lifetime value and revenue potential</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['30d', '90d', '180d', '12m'] as const).map((range) => (
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