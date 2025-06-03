"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, TrendingUp, Download, Share2, 
  Calendar, ArrowUpRight, ArrowDownRight, 
  Users, Target, Heart, Activity,
  Clock, MapPin, DollarSign
} from "lucide-react";
import StaticDashboardGrid from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';

export default function MonthlyAudiencePage() {
  const [timeRange, setTimeRange] = useState<'This Month' | 'Last Month' | '3 Months' | '6 Months'>('This Month');

  // Mock data
  const mockTimeSeriesData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(75 + Math.random() * 15 + Math.sin(idx * 0.2) * 10),
  }));

  const mockSparklineData = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(85 + Math.random() * 10),
  }));

  const dashboardPanels = [
    // Top Row - Key Metrics
    {
      id: 'total_audience',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Total Audience"
          value="12,847"
          unit=""
          isLoading={false}
          trendValue="+847 this month"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Users className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'engagement_rate',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Engagement Rate"
          value="32.5"
          unit="%"
          isLoading={false}
          trendValue="+4.2% vs last month"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Heart className="h-5 w-5 text-red-400" />}
        />
      ),
    },
    {
      id: 'avg_session',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Avg. Session Time"
          value="4.8"
          unit="min"
          isLoading={false}
          trendValue="+0.8 min vs last month"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Clock className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'customer_value',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Avg. Customer Value"
          value="₦24.5"
          unit="K"
          isLoading={false}
          trendValue="+₦2.8K vs last month"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<DollarSign className="h-5 w-5 text-green-400" />}
        />
      ),
    },

    // Second Row - Audience Growth & Behavior
    {
      id: 'audience_growth',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Audience Growth Trend"
          data={mockTimeSeriesData}
          yLabel="Total Audience"
          stroke="#3b82f6"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'location_distribution',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="Audience by Location"
          data={[
            { name: 'Lagos', value: 45 },
            { name: 'Abuja', value: 25 },
            { name: 'Port Harcourt', value: 15 },
            { name: 'Others', value: 15 },
          ]}
          colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']}
        />
      ),
    },

    // Third Row - Detailed Analysis
    {
      id: 'segment_analysis',
      x: 0,
      y: 6,
      w: 12,
      h: 4,
      component: (
        <Panel title="Audience Segments">
          <div className="space-y-4">
            {[
              {
                name: "High-Value Customers",
                count: 2847,
                engagement: 85,
                avgValue: "₦45.2K",
                growth: 12.4,
                behavior: ["Frequent purchases", "High email engagement", "Active on WhatsApp"]
              },
              {
                name: "Regular Customers",
                count: 6420,
                engagement: 65,
                avgValue: "₦28.5K",
                growth: 8.2,
                behavior: ["Monthly purchases", "Moderate engagement", "Price sensitive"]
              },
              {
                name: "New Customers",
                count: 3580,
                engagement: 45,
                avgValue: "₦12.8K",
                growth: 24.5,
                behavior: ["First-time buyers", "High browse rate", "Need nurturing"]
              }
            ].map((segment, index) => (
              <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{segment.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {segment.count.toLocaleString()} customers
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-purple-400">Avg. Value: {segment.avgValue}</span>
                      <span className="text-xs text-green-400">+{segment.growth}% growth</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{segment.engagement}%</div>
                    <div className="text-xs text-gray-400">engagement</div>
                  </div>
                </div>
                <Progress value={segment.engagement} className="h-1 mb-3" />
                <div className="flex flex-wrap gap-2">
                  {segment.behavior.map((trait, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
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
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/20">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Audience Behavior Analysis
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-400 border-purple-500/20">
                  Monthly Report
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Comprehensive analysis of audience behavior and engagement patterns</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['This Month', 'Last Month', '3 Months', '6 Months'] as const).map((range) => (
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