"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, TrendingUp, FileText, Brain, 
  AlertCircle, Target, DollarSign, Users,
  Calendar, ArrowUpRight, Zap, Settings,
  Download, Filter, RefreshCw, ChevronRight,
  Sparkles, Activity, LineChart, PieChart
} from "lucide-react";
import { toast } from "sonner";
import { WhatIfAnalysis } from "./what-if-analysis";
import { PredictiveForecasting } from "./predictive-forecasting";
import { AutomatedReports } from "./automated-reports";
import type { DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import StaticDashboardGrid from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';
import { useRouter } from "next/navigation";

export function DecisionSupportDashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const refreshData = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Decision support data refreshed');
  };

  // Mock data for visualizations
  const mockTimeSeriesData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(75 + Math.random() * 15 + Math.sin(idx * 0.5) * 10),
  }));

  const mockSparklineData = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(85 + Math.random() * 10),
  }));

  // Action handlers
  const handleViewReport = (reportType: string) => {
    switch (reportType) {
      case "Quarterly Review":
        router.push("/reports/quarterly-review");
        break;
      case "Weekly Report":
        router.push("/reports/weekly-campaign");
        break;
      case "Monthly Analysis":
        router.push("/reports/monthly-audience");
        break;
      default:
        router.push("/reports");
    }
    toast.success(`Opening ${reportType}...`);
  };

  const handleRecommendationAction = (action: string, title: string) => {
    switch (action) {
      case "Review timing analysis":
        router.push("/analytics/timing-analysis");
        break;
      case "View segments":
        router.push("/analytics/audience-segments");
        break;
      case "See details":
        router.push("/analytics/content-strategy");
        break;
      default:
        router.push("/analytics");
    }
    toast.success(`Opening ${title} analysis...`);
  };

  // Define dashboard panels
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key Decision Metrics
    {
      id: 'decision_accuracy',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Decision Accuracy"
          value="94.5"
          unit="%"
          isLoading={false}
          trendValue="+2.3% vs last period"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Target className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'revenue_impact',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Revenue Impact"
          value="₦4.8"
          unit="M"
          isLoading={false}
          trendValue="+18.2% from AI decisions"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<DollarSign className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'active_scenarios',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Active Scenarios"
          value="15"
          unit=""
          isLoading={false}
          trendValue="8 pending analysis"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Brain className="h-5 w-5 text-amber-400" />}
        />
      ),
    },
    {
      id: 'ai_recommendations',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="AI Recommendations"
          value="23"
          unit=""
          isLoading={false}
          trendValue="5 high priority"
          trend="up"
          sparklineData={mockSparklineData}
          icon={<Zap className="h-5 w-5 text-green-400" />}
        />
      ),
    },

    // Second Row - What-If Analysis & Predictions
    {
      id: 'what_if_analysis',
      x: 0,
      y: 2,
      w: 8,
      h: 4,
      component: (
        <Panel title="Real-Time What-If Analysis">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  Live Analysis
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  AI-Powered
                </Badge>
              </div>
              <Button size="sm" className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
                <Activity className="h-4 w-4 mr-1" />
                Run Scenario
              </Button>
            </div>
            <WhatIfAnalysis />
          </div>
        </Panel>
      ),
    },
    {
      id: 'predictive_insights',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: (
        <Panel title="Predictive Insights">
          <div className="space-y-2">
            {[
              {
                title: "Revenue Growth",
                prediction: "+₦2.4M",
                confidence: 92,
                timeframe: "Next 30 days",
                trend: "up"
              },
              {
                title: "Customer Churn",
                prediction: "-2.3%",
                confidence: 88,
                timeframe: "Next quarter",
                trend: "down"
              },
              {
                title: "Campaign ROI",
                prediction: "+24%",
                confidence: 85,
                timeframe: "Next campaign",
                trend: "up"
              }
            ].map((insight, index) => (
              <div key={index} className="p-2 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{insight.title}</span>
                  <Badge 
                    variant="outline" 
                    className={insight.trend === 'up' ? 'text-green-400' : 'text-red-400'}
                  >
                    {insight.prediction}
                  </Badge>
                </div>
                <div className="mt-1">
                  <Progress value={insight.confidence} className="h-1" />
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-400">{insight.timeframe}</span>
                    <span className="text-blue-400">{insight.confidence}% confidence</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ),
    },

    // Third Row - Performance Analysis
    {
      id: 'decision_performance',
      x: 0,
      y: 7,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Decision Performance Trend"
          data={mockTimeSeriesData}
          yLabel="Accuracy Score"
          stroke="#3b82f6"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'decision_distribution',
      x: 8,
      y: 7,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="Decision Distribution"
          data={[
            { name: 'Marketing', value: 35 },
            { name: 'Audience', value: 28 },
            { name: 'Content', value: 22 },
            { name: 'Pricing', value: 15 },
          ]}
          colors={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']}
        />
      ),
    },

    // Fourth Row - Automated Reports & Recommendations
    {
      id: 'automated_reports',
      x: 0,
      y: 11,
      w: 6,
      h: 4,
      component: (
        <Panel title="Latest Reports">
          <div className="space-y-3">
            {[
              {
                title: "Q3 Performance Analysis",
                type: "Quarterly Review",
                date: "Generated today",
                insights: 12,
                path: "/reports/quarterly-review"
              },
              {
                title: "Campaign Effectiveness",
                type: "Weekly Report",
                date: "Generated yesterday",
                insights: 8,
                path: "/reports/weekly-campaign"
              },
              {
                title: "Audience Behavior",
                type: "Monthly Analysis",
                date: "Generated 2 days ago",
                insights: 15,
                path: "/reports/monthly-audience"
              }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:bg-gray-800/50 hover:border-gray-600/50 transition-colors group">
                <div>
                  <div className="text-sm font-medium text-white">{report.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {report.type}
                    </Badge>
                    <span className="text-xs text-gray-400">{report.date}</span>
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                      {report.insights} insights
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleViewReport(report.type)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  View Report
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      ),
    },
    {
      id: 'ai_recommendations',
      x: 6,
      y: 11,
      w: 6,
      h: 4,
      component: (
        <Panel title="AI Recommendations">
          <div className="space-y-3">
            {[
              {
                title: "Optimize Campaign Timing",
                impact: "Potential +18% engagement",
                priority: "high",
                action: "Review timing analysis",
                path: "/analytics/timing-analysis",
                description: "Best send times and frequency optimization"
              },
              {
                title: "Audience Segmentation",
                impact: "₦1.2M revenue opportunity",
                priority: "high",
                action: "View segments",
                path: "/analytics/audience-segments",
                description: "High-value segment analysis and targeting"
              },
              {
                title: "Content Strategy Adjustment",
                impact: "Improve conversion by 12%",
                priority: "medium",
                action: "See details",
                path: "/analytics/content-strategy",
                description: "Content performance and optimization"
              }
            ].map((rec, index) => (
              <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:bg-gray-800/50 hover:border-gray-600/50 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{rec.title}</span>
                    <Badge 
                      variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                      className={rec.priority === 'high' ? 'bg-red-500/20 text-red-400' : ''}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-2">{rec.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-400">{rec.impact}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRecommendationAction(rec.action, rec.title)}
                  >
                    {rec.action}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
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
      {/* Header with Grafana-style controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/20">
              <Brain className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Decision Support Dashboard
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 border-blue-500/20">
                  AI-Powered
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Advanced decision support with AI-driven insights and recommendations</p>
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