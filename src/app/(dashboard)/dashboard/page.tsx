"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, Users, Activity, Zap, Mail, MessageSquare, 
  Settings, TrendingUp, Calendar, RefreshCw, Plus, 
  ArrowUpRight, ArrowDownRight, Bell, Map, BarChart3,
  Headphones, Workflow, Target, Clock, ChevronRight,
  Monitor, Database, Globe
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardOverview {
  kpis: {
    revenueToday: number;
    conversionRate: number;
    activeJourneys: number;
    runningAutomations: number;
  };
  livePulse: {
    activeVisitors: number;
    conversionsToday: number;
    engagementTrend: number;
  };
  modules: {
    workflows: { count: number; trend: string };
    notifications: { count: number; trend: string };
    journeys: { count: number; trend: string };
    leadpulse: { count: number; trend: string };
    campaigns: { count: number; trend: string };
    support: { count: number; trend: string };
  };
  recentActivity: Array<{
    id: string;
    type: 'campaign' | 'workflow' | 'journey' | 'support' | 'leadpulse';
    title: string;
    description: string;
    timestamp: string;
    href: string;
  }>;
}

export default function CommandCenterDashboard() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [liveUpdates, setLiveUpdates] = useState<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    href: string;
  }>>([]);

  // Initial fetch and polling for dashboard overview
  useEffect(() => {
    let overviewInterval: NodeJS.Timeout;
    async function fetchDashboardOverview() {
      try {
        const response = await fetch(`/api/dashboard/overview?timeRange=${timeRange}`);
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data as DashboardOverview);
          
          // Initialize live updates with first 6 items from recentActivity
          if (data.data.recentActivity && liveUpdates.length === 0) {
            const initialUpdates = data.data.recentActivity.slice(0, 6).map((item: any, index: number) => ({
              ...item,
              id: `init_${index}_${Date.now()}`
            }));
            setLiveUpdates(initialUpdates);
          }
        }
      } catch (error) {
        console.error('Error polling dashboard overview:', error);
      } finally {
        setLoading(false);
      }
    }

    // initial fetch
    fetchDashboardOverview();
    // polling every 7 seconds
    overviewInterval = setInterval(fetchDashboardOverview, 7000);

    return () => clearInterval(overviewInterval);
  }, [timeRange]);

  // Simple live updates simulation with proper state management
  useEffect(() => {
    let updatesInterval: NodeJS.Timeout;
    
    const simulateUpdate = () => {
      const updateTypes = ['campaign', 'workflow', 'journey', 'leadpulse', 'support'];
      const titles = {
        campaign: 'Email Campaign Sent',
        workflow: 'Workflow Triggered',
        journey: 'Customer Journey Started',
        leadpulse: 'New Visitor Detected',
        support: 'Support Ticket Created'
      };
      const descriptions = {
        campaign: 'Newsletter to subscribers',
        workflow: 'Welcome sequence activated',
        journey: 'Onboarding journey initiated',
        leadpulse: 'High-intent visitor from Lagos',
        support: 'Integration help request'
      };
      
      const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
      const newUpdate = {
        id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: randomType,
        title: titles[randomType as keyof typeof titles],
        description: descriptions[randomType as keyof typeof descriptions],
        timestamp: new Date().toISOString(),
        href: `/${randomType}`
      };
      
      // Properly manage exactly 6 items with smooth transitions
      setLiveUpdates(prev => {
        const newList = [newUpdate, ...prev];
        // Always return exactly 6 items, no more
        return newList.slice(0, 6);
      });
      
      // Update KPIs based on update type
      if (dashboardData) {
        setDashboardData(prevData => prevData ? ({
          ...prevData,
          livePulse: {
            ...prevData.livePulse,
            activeVisitors: randomType === 'leadpulse' ? 
              prevData.livePulse.activeVisitors + 1 : 
              prevData.livePulse.activeVisitors
          }
        }) : prevData);
      }
    };

    // Start simulating updates after 3 seconds, then every 8 seconds
    const startDelay = setTimeout(() => {
      simulateUpdate();
      updatesInterval = setInterval(simulateUpdate, 8000);
    }, 3000);

    return () => {
      clearTimeout(startDelay);
      clearInterval(updatesInterval);
    };
  }, [dashboardData]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`;
    }
    return `₦${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'campaign': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'workflow': return <Workflow className="h-4 w-4 text-purple-500" />;
      case 'journey': return <Map className="h-4 w-4 text-green-500" />;
      case 'support': return <Headphones className="h-4 w-4 text-orange-500" />;
      case 'leadpulse': return <Activity className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const trackDashboardAction = async (action: string, module: string) => {
    try {
      await fetch('/api/dashboard/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, module, metadata: { timeRange } })
      });
    } catch (error) {
      console.error('Error tracking dashboard action:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="grid gap-4 md:grid-cols-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Marketing Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of your marketing performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="px-3 py-1 text-sm border rounded-md bg-background"
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{formatNumber(dashboardData.kpis.revenueToday)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +12.5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.livePulse.activeVisitors}</div>
            <div className="text-xs text-muted-foreground flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live count
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.kpis.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +0.3% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.kpis.runningAutomations}</div>
            <p className="text-xs text-muted-foreground">
              Across all channels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-12">
        {/* Audience Growth Chart */}
        <Card className="col-span-8 border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Audience Growth</CardTitle>
                <CardDescription>Daily new contacts over the last 7 days</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">+23% vs last week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <div className="flex items-end justify-between h-48 px-2">
                {[
                  { day: 'Mon', value: 65, amount: '2.1K' },
                  { day: 'Tue', value: 78, amount: '2.8K' },
                  { day: 'Wed', value: 52, amount: '1.9K' },
                  { day: 'Thu', value: 89, amount: '3.2K' },
                  { day: 'Fri', value: 94, amount: '3.4K' },
                  { day: 'Sat', value: 76, amount: '2.7K' },
                  { day: 'Sun', value: 100, amount: '3.6K' }
                ].map((data, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 max-w-16">
                    <div className="text-xs text-muted-foreground font-medium">
                      {data.amount}
                    </div>
                    <div 
                      className="bg-blue-500 rounded-t w-8 hover:bg-blue-600 transition-colors"
                      style={{ height: `${Math.max(data.value * 1.8, 20)}px` }}
                    ></div>
                    <span className="text-xs text-muted-foreground">
                      {data.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Panel */}
        <Card className="col-span-4 border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {liveUpdates.slice(0, 6).map((activity, index) => (
                <div key={activity.id} className="border-b last:border-b-0 p-4 hover:bg-muted/50 transition-colors">
                  <Link href={activity.href} className="block">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md p-1.5 bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Channel Performance</CardTitle>
          <CardDescription>Multi-channel engagement metrics and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Campaigns</span>
                <span className="text-sm font-medium">{dashboardData.modules.campaigns.count} active</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '67%' }}></div>
              </div>
              <div className="text-xs text-muted-foreground">67% engagement rate</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SMS Campaigns</span>
                <span className="text-sm font-medium">{dashboardData.livePulse.conversionsToday} sent today</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="text-xs text-muted-foreground">45% open rate</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">WhatsApp</span>
                <span className="text-sm font-medium">{dashboardData.livePulse.engagementTrend.toFixed(0)}% response</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <div className="text-xs text-muted-foreground">87% response rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-4">
        <Link href="/workflows" className="block">
          <Card className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Workflow className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Workflows</div>
                  <div className="text-xs text-muted-foreground">{dashboardData.modules.workflows.count} active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/leadpulse" className="block">
          <Card className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Lead Intelligence</div>
                  <div className="text-xs text-muted-foreground">{dashboardData.modules.leadpulse.count} insights</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/email/campaigns" className="block">
          <Card className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Campaigns</div>
                  <div className="text-xs text-muted-foreground">{dashboardData.modules.campaigns.count} running</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/segments" className="block">
          <Card className="border hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Segments</div>
                  <div className="text-xs text-muted-foreground">Audience management</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
