"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, TrendingUp, Download, Share2, 
  Calendar, ArrowUpRight, ArrowDownRight, 
  Mail, MessageSquare, Target, Users,
  Eye, MousePointer, DollarSign
} from "lucide-react";
import StaticDashboardGrid from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';

export default function WeeklyCampaignPage() {
  const [timeRange, setTimeRange] = useState<'This Week' | 'Last Week' | '2 Weeks Ago' | '3 Weeks Ago'>('This Week');

  // Mock data
  const mockTimeSeriesData = Array.from({ length: 7 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(75 + Math.random() * 15 + Math.sin(idx * 0.5) * 10),
  }));

  const mockSparklineData = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(85 + Math.random() * 10),
  }));

  const dashboardPanels = [
    // Top Row - Campaign Performance
    {
      id: 'open_rate',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Open Rate"
          value="24.8"
          unit="%"
          isLoading={false}
          trendValue="+2.3% vs last week"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Eye className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'click_rate',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Click Rate"
          value="4.2"
          unit="%"
          isLoading={false}
          trendValue="+0.8% vs last week"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<MousePointer className="h-5 w-5 text-green-400" />}
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
          title="Conversion Rate"
          value="2.8"
          unit="%"
          isLoading={false}
          trendValue="+0.4% vs last week"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Target className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'revenue',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Revenue Generated"
          value="₦485"
          unit="K"
          isLoading={false}
          trendValue="+₦85K vs last week"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<DollarSign className="h-5 w-5 text-amber-400" />}
        />
      ),
    },

    // Second Row - Campaign Analysis
    {
      id: 'engagement_trend',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Daily Engagement Trend"
          data={mockTimeSeriesData}
          yLabel="Engagement Rate %"
          stroke="#3b82f6"
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
          title="Channel Distribution"
          data={[
            { name: 'Email', value: 45 },
            { name: 'WhatsApp', value: 35 },
            { name: 'SMS', value: 20 },
          ]}
          colors={['#3b82f6', '#10b981', '#f59e0b']}
        />
      ),
    },

    // Third Row - Campaign Details
    {
      id: 'campaign_list',
      x: 0,
      y: 6,
      w: 12,
      h: 4,
      component: (
        <Panel title="Campaign Performance">
          <div className="space-y-3">
            {[
              {
                name: "Product Launch Email",
                type: "Email",
                sent: 12450,
                opens: 3245,
                clicks: 845,
                conversions: 124,
                revenue: "₦185K"
              },
              {
                name: "Weekend Flash Sale",
                type: "WhatsApp",
                sent: 8450,
                opens: 2845,
                clicks: 745,
                conversions: 156,
                revenue: "₦210K"
              },
              {
                name: "Re-engagement Campaign",
                type: "SMS",
                sent: 5240,
                opens: 1845,
                clicks: 425,
                conversions: 85,
                revenue: "₦90K"
              }
            ].map((campaign, index) => (
              <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{campaign.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {campaign.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{campaign.sent.toLocaleString()} sent</span>
                      <span className="text-xs text-blue-400">{campaign.opens.toLocaleString()} opens</span>
                      <span className="text-xs text-green-400">{campaign.clicks.toLocaleString()} clicks</span>
                      <span className="text-xs text-purple-400">{campaign.conversions} conversions</span>
                      <span className="text-xs text-amber-400">{campaign.revenue} revenue</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-blue-400">
                    View Details
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Open Rate</span>
                    <span className="text-blue-400">{((campaign.opens / campaign.sent) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(campaign.opens / campaign.sent) * 100} className="h-1 bg-blue-950" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Click Rate</span>
                    <span className="text-green-400">{((campaign.clicks / campaign.opens) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(campaign.clicks / campaign.opens) * 100} className="h-1 bg-green-950" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Conversion Rate</span>
                    <span className="text-purple-400">{((campaign.conversions / campaign.clicks) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(campaign.conversions / campaign.clicks) * 100} className="h-1 bg-purple-950" />
                </div>
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
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg border border-blue-500/20">
              <Mail className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Campaign Performance Report
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-green-500/10 text-blue-400 border-blue-500/20">
                  Weekly Report
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Detailed analysis of campaign performance and engagement metrics</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Week Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago'] as const).map((week) => (
              <Button
                key={week}
                variant={timeRange === week ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(week)}
                className={`h-7 px-3 text-xs ${
                  timeRange === week 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {week}
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