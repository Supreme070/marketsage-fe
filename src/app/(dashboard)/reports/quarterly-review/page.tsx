"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, TrendingUp, Download, Share2, 
  Calendar, ArrowUpRight, ArrowDownRight, 
  DollarSign, Users, Target, Mail 
} from "lucide-react";
import StaticDashboardGrid from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';

interface QuarterlyData {
  revenue: { value: string; trend: number };
  customerGrowth: { value: number; trend: number };
  conversionRate: { value: number; trend: number };
  engagementScore: { value: number; trend: number };
  channelData: Array<{ name: string; value: number }>;
  campaignData: Array<{ name: string; value: number }>;
  insights: Array<{
    title: string;
    insight: string;
    impact: string;
    type: string;
  }>;
}

const quarterlyData: Record<string, QuarterlyData> = {
  'Q1': {
    revenue: { value: '8.4', trend: 15.8 },
    customerGrowth: { value: 624, trend: 8.4 },
    conversionRate: { value: 2.8, trend: 0.4 },
    engagementScore: { value: 72.5, trend: 4.2 },
    channelData: [
      { name: 'Email', value: 52 },
      { name: 'WhatsApp', value: 23 },
      { name: 'SMS', value: 15 },
      { name: 'Web', value: 10 },
    ],
    campaignData: [
      { name: 'New Year Special', value: 88 },
      { name: 'Welcome Series', value: 82 },
      { name: 'Re-engagement', value: 74 },
      { name: 'Newsletter', value: 78 },
      { name: 'Valentine Promo', value: 92 },
    ],
    insights: [
      {
        title: "Q1 Performance",
        insight: "Strong start with New Year campaigns",
        impact: "₦1.8M additional revenue",
        type: "positive"
      },
      {
        title: "Customer Growth",
        insight: "624 new customers from seasonal promotions",
        impact: "Exceeded Q1 target by 15%",
        type: "positive"
      },
      {
        title: "Channel Mix",
        insight: "Email dominates Q1 performance",
        impact: "Recommend 50% email focus",
        type: "insight"
      }
    ]
  },
  'Q2': {
    revenue: { value: '10.5', trend: 25.0 },
    customerGrowth: { value: 735, trend: 17.8 },
    conversionRate: { value: 3.2, trend: 0.8 },
    engagementScore: { value: 75.8, trend: 4.8 },
    channelData: [
      { name: 'Email', value: 48 },
      { name: 'WhatsApp', value: 27 },
      { name: 'SMS', value: 15 },
      { name: 'Web', value: 10 },
    ],
    campaignData: [
      { name: 'Easter Special', value: 94 },
      { name: 'Welcome Series', value: 85 },
      { name: 'Re-engagement', value: 78 },
      { name: 'Newsletter', value: 82 },
      { name: 'Mid-Year Sale', value: 88 },
    ],
    insights: [
      {
        title: "Revenue Growth",
        insight: "25% growth driven by Easter campaigns",
        impact: "₦2.1M above target",
        type: "positive"
      },
      {
        title: "WhatsApp Growth",
        insight: "WhatsApp share increased to 27%",
        impact: "Recommend increased investment",
        type: "positive"
      },
      {
        title: "Campaign Success",
        insight: "Easter campaign hit 94% effectiveness",
        impact: "Template for future holidays",
        type: "insight"
      }
    ]
  },
  'Q3': {
    revenue: { value: '12.8', trend: 18.2 },
    customerGrowth: { value: 847, trend: 12.4 },
    conversionRate: { value: 3.8, trend: 0.6 },
    engagementScore: { value: 78.5, trend: 5.2 },
    channelData: [
      { name: 'Email', value: 45 },
      { name: 'WhatsApp', value: 28 },
      { name: 'SMS', value: 17 },
      { name: 'Web', value: 10 },
    ],
    campaignData: [
      { name: 'Product Launch', value: 92 },
      { name: 'Welcome Series', value: 88 },
      { name: 'Re-engagement', value: 76 },
      { name: 'Newsletter', value: 82 },
      { name: 'Summer Sale', value: 85 },
    ],
    insights: [
      {
        title: "Revenue Growth",
        insight: "18.2% increase driven by WhatsApp campaigns",
        impact: "₦2.3M additional revenue",
        type: "positive"
      },
      {
        title: "Customer Acquisition",
        insight: "847 new customers, 12.4% growth rate",
        impact: "Exceeded Q3 target by 24%",
        type: "positive"
      },
      {
        title: "Channel Performance",
        insight: "WhatsApp shows highest ROI at 3.8x",
        impact: "Recommend 40% budget allocation",
        type: "insight"
      }
    ]
  },
  'Q4': {
    revenue: { value: '15.2', trend: 22.5 },
    customerGrowth: { value: 982, trend: 15.9 },
    conversionRate: { value: 4.2, trend: 0.9 },
    engagementScore: { value: 82.4, trend: 6.8 },
    channelData: [
      { name: 'Email', value: 42 },
      { name: 'WhatsApp', value: 32 },
      { name: 'SMS', value: 18 },
      { name: 'Web', value: 8 },
    ],
    campaignData: [
      { name: 'Black Friday', value: 96 },
      { name: 'Welcome Series', value: 85 },
      { name: 'Re-engagement', value: 82 },
      { name: 'Newsletter', value: 88 },
      { name: 'Holiday Special', value: 94 },
    ],
    insights: [
      {
        title: "Peak Performance",
        insight: "Record revenue from Black Friday campaign",
        impact: "₦3.2M above Q4 target",
        type: "positive"
      },
      {
        title: "Channel Evolution",
        insight: "WhatsApp now 32% of revenue",
        impact: "Platform maturity achieved",
        type: "positive"
      },
      {
        title: "Year-End Success",
        insight: "Holiday campaigns exceeded all metrics",
        impact: "Template for next year",
        type: "insight"
      }
    ]
  }
};

export default function QuarterlyReviewPage() {
  const [timeRange, setTimeRange] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q3');
  const currentQuarter = quarterlyData[timeRange];

  // Mock data with quarter-specific trends
  const mockTimeSeriesData = Array.from({ length: 90 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(75 + Math.random() * 15 + Math.sin(idx * 0.1) * 10 * (Number(timeRange.charAt(1)) / 2)),
  }));

  const mockSparklineData = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(85 + Math.random() * 10 * (Number(timeRange.charAt(1)) / 2)),
  }));

  const dashboardPanels = [
    // Top Row - Key Metrics
    {
      id: 'revenue',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title={`${timeRange} Revenue`}
          value={currentQuarter.revenue.value}
          unit="M"
          isLoading={false}
          trendValue={`+${currentQuarter.revenue.trend}% vs ${timeRange === 'Q1' ? 'last year' : `Q${Number(timeRange.charAt(1)) - 1}`}`}
          trend="up"
          sparklineData={mockSparklineData}
          icon={<DollarSign className="h-5 w-5 text-green-400" />}
        />
      ),
    },
    {
      id: 'growth',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Customer Growth"
          value={currentQuarter.customerGrowth.value.toString()}
          unit=""
          isLoading={false}
          trendValue={`+${currentQuarter.customerGrowth.trend}% vs ${timeRange === 'Q1' ? 'last year' : `Q${Number(timeRange.charAt(1)) - 1}`}`}
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Users className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'conversion',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Avg. Conversion Rate"
          value={currentQuarter.conversionRate.value.toString()}
          unit="%"
          isLoading={false}
          trendValue={`+${currentQuarter.conversionRate.trend}% vs ${timeRange === 'Q1' ? 'last year' : `Q${Number(timeRange.charAt(1)) - 1}`}`}
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Target className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'engagement',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Engagement Score"
          value={currentQuarter.engagementScore.value.toString()}
          unit=""
          isLoading={false}
          trendValue={`+${currentQuarter.engagementScore.trend} points`}
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Mail className="h-5 w-5 text-amber-400" />}
        />
      ),
    },

    // Second Row - Performance Trends
    {
      id: 'revenue_trend',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title={`${timeRange} Revenue Trend`}
          data={mockTimeSeriesData}
          yLabel="Revenue (₦M)"
          stroke="#10b981"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'channel_performance',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="Revenue by Channel"
          data={currentQuarter.channelData}
          colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']}
        />
      ),
    },

    // Third Row - Detailed Analysis
    {
      id: 'campaign_performance',
      x: 0,
      y: 6,
      w: 6,
      h: 4,
      component: (
        <BarPanel
          title="Campaign Performance"
          data={currentQuarter.campaignData}
          dataKey="value"
          xKey="name"
        />
      ),
    },
    {
      id: 'key_insights',
      x: 6,
      y: 6,
      w: 6,
      h: 4,
      component: (
        <Panel title={`Key ${timeRange} Insights`}>
          <div className="space-y-3">
            {currentQuarter.insights.map((item, index) => (
              <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{item.title}</span>
                  <Badge 
                    variant="outline" 
                    className={
                      item.type === 'positive' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }
                  >
                    {item.type === 'positive' ? 'Growth' : 'Insight'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300">{item.insight}</p>
                <p className="text-xs text-purple-400 mt-1">{item.impact}</p>
              </div>
            ))}
          </div>
        </Panel>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/20">
              <BarChart3 className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Q3 2023 Performance Review
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500/10 to-blue-500/10 text-green-400 border-green-500/20">
                  Quarterly Report
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Comprehensive analysis of Q3 2023 performance metrics and insights</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quarter Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
              <Button
                key={quarter}
                variant={timeRange === quarter ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(quarter)}
                className={`h-7 px-3 text-xs ${
                  timeRange === quarter 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {quarter}
              </Button>
            ))}
          </div>
          
          <Button variant="outline" size="sm" className="text-blue-400">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          
          <Button variant="outline" size="sm" className="text-purple-400">
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <StaticDashboardGrid panels={dashboardPanels} />
    </div>
  );
} 