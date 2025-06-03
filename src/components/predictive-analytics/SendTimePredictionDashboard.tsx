"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  RefreshCw,
  Settings,
  Download,
  Filter,
  Sun,
  Moon,
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

export default function SendTimePredictionDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '6m'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Send time predictions refreshed');
  };

  // Mock time series data for hourly engagement
  const hourlyEngagementData = Array.from({ length: 24 }).map((_, idx) => ({
    x: `${idx}:00`,
    y: Math.round(15 + Math.sin((idx - 10) * 0.3) * 12 + Math.random() * 5),
  }));

  const weeklyEngagementData = Array.from({ length: 7 }).map((_, idx) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      x: days[idx],
      y: Math.round(25 + Math.cos(idx * 0.5) * 8 + Math.random() * 6),
    };
  });

  // Sparkline data for stat panels
  const bestTimeSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(32 + idx * 0.5 + Math.random() * 3),
  }));

  const engagementLiftSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(28 + idx * 1.2 + Math.random() * 4),
  }));

  // Optimal Times Panel
  const OptimalTimesPanel = () => (
    <Panel title="Optimal Send Times">
      <div className="space-y-4 flex-1">
        {[
          { 
            timeSlot: 'Tuesday 10:30 AM', 
            engagement: 34.2, 
            confidence: 'High',
            audience: 'All Subscribers',
            lift: '+28%'
          },
          { 
            timeSlot: 'Wednesday 2:15 PM', 
            engagement: 31.8, 
            confidence: 'High',
            audience: 'Business Professionals',
            lift: '+25%'
          },
          { 
            timeSlot: 'Thursday 6:45 PM', 
            engagement: 29.5, 
            confidence: 'Medium',
            audience: 'Young Adults',
            lift: '+22%'
          },
          { 
            timeSlot: 'Friday 11:00 AM', 
            engagement: 27.3, 
            confidence: 'Medium',
            audience: 'General Audience',
            lift: '+18%'
          }
        ].map((item, index) => (
          <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{item.timeSlot}</span>
              <Badge 
                variant={item.confidence === 'High' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {item.confidence}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{item.audience}</span>
              <span className="text-xs text-green-400">{item.lift}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-purple-400 font-medium">{item.engagement}%</div>
              <div className="text-xs text-gray-400">engagement rate</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Time Zone Analysis Panel
  const TimeZonePanel = () => (
    <Panel title="Time Zone Analysis">
      <div className="space-y-3 flex-1">
        {[
          { timezone: 'WAT (Lagos)', percentage: 45, engagement: 28.5, bestTime: '10:30 AM' },
          { timezone: 'GMT (London)', percentage: 25, engagement: 24.2, bestTime: '2:15 PM' },
          { timezone: 'EST (New York)', percentage: 18, engagement: 22.8, bestTime: '9:00 AM' },
          { timezone: 'PST (Los Angeles)', percentage: 12, engagement: 26.1, bestTime: '11:45 AM' }
        ].map((item, index) => (
          <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{item.timezone}</span>
              <span className="text-xs text-gray-400">{item.percentage}% of audience</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs">
                <span className="text-purple-400">{item.engagement}%</span>
                <span className="text-gray-400 ml-1">engagement</span>
              </div>
              <div className="text-xs text-blue-400">{item.bestTime}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Channel Timing Panel
  const ChannelTimingPanel = () => (
    <Panel title="Channel-Specific Timing">
      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Email</span>
            </div>
            <div className="text-lg font-bold text-blue-400">Tue 10:30 AM</div>
            <div className="text-xs text-gray-400">+32% vs random timing</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">WhatsApp</span>
            </div>
            <div className="text-lg font-bold text-green-400">Thu 6:45 PM</div>
            <div className="text-xs text-gray-400">+28% vs random timing</div>
          </div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-2">Weekly Pattern</div>
          <div className="text-sm text-white mb-1">
            Weekdays: <span className="text-purple-400">10 AM - 3 PM</span>
          </div>
          <div className="text-sm text-white">
            Weekends: <span className="text-amber-400">7 PM - 9 PM</span>
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-2">Avoid These Times</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">Early Morning (5-7 AM)</Badge>
            <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">Late Night (11 PM+)</Badge>
          </div>
        </div>
      </div>
    </Panel>
  );

  // Define dashboard panels
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key Timing Metrics
    {
      id: 'best_time',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Best Overall Time"
          value="10:30 AM"
          unit="Tue"
          isLoading={false}
          trendValue="+32% engagement lift"
          trend="up"
          sparklineData={bestTimeSparkline}
          icon={<Clock className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'engagement_lift',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Engagement Lift"
          value="32"
          unit="%"
          isLoading={false}
          trendValue="+4% vs last month"
          trend="up"
          sparklineData={engagementLiftSparkline}
          icon={<TrendingUp className="h-5 w-5 text-green-400" />}
        />
      ),
    },
    {
      id: 'active_hours',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Peak Active Hours"
          value="10-14"
          unit="hrs"
          isLoading={false}
          trendValue="4-hour window"
          trend="stable"
          sparklineData={[]}
          icon={<Sun className="h-5 w-5 text-amber-400" />}
        />
      ),
    },
    {
      id: 'time_zones',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Time Zones Covered"
          value="4"
          unit=""
          isLoading={false}
          trendValue="WAT, GMT, EST, PST"
          trend="stable"
          sparklineData={[]}
          icon={<Users className="h-5 w-5 text-blue-400" />}
        />
      ),
    },

    // Second Row - Timing Analysis
    {
      id: 'hourly_engagement',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Hourly Engagement Pattern"
          data={hourlyEngagementData}
          yLabel="Engagement %"
          stroke="#8b5cf6"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'optimal_times',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: <OptimalTimesPanel />,
    },

    // Third Row - Weekly & Channel Analysis
    {
      id: 'weekly_pattern',
      x: 0,
      y: 6,
      w: 6,
      h: 4,
      component: (
        <BarPanel
          title="Weekly Engagement Pattern"
          data={weeklyEngagementData}
          dataKey="y"
          xKey="x"
          isLoading={false}
        />
      ),
    },
    {
      id: 'timezone_analysis',
      x: 6,
      y: 6,
      w: 3,
      h: 4,
      component: <TimeZonePanel />,
    },
    {
      id: 'channel_timing',
      x: 9,
      y: 6,
      w: 3,
      h: 4,
      component: <ChannelTimingPanel />,
    },

    // Fourth Row - Detailed Analysis
    {
      id: 'audience_segments',
      x: 0,
      y: 10,
      w: 6,
      h: 4,
      component: (
        <BarPanel
          title="Best Times by Audience Segment"
          data={[
            { name: 'Business Professionals', value: 32.5 },
            { name: 'Young Adults', value: 28.7 },
            { name: 'Parents', value: 25.3 },
            { name: 'Seniors', value: 22.1 },
          ]}
          dataKey="value"
          xKey="name"
          isLoading={false}
        />
      ),
    },
    {
      id: 'engagement_distribution',
      x: 6,
      y: 10,
      w: 6,
      h: 4,
      component: (
        <PiePanel
          title="Engagement by Time Period"
          data={[
            { name: 'Morning (6-12)', value: 35 },
            { name: 'Afternoon (12-18)', value: 42 },
            { name: 'Evening (18-22)', value: 18 },
            { name: 'Night (22-6)', value: 5 },
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
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/20">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Optimal Send Time Prediction
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-400 border-purple-500/20">
                  AI-Optimized
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Maximize engagement with AI-powered send time optimization</p>
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
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
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