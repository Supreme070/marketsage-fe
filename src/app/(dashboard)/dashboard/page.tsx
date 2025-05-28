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
  Headphones, Workflow, Target, Clock, ChevronRight
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
    <div className="space-y-4">
      {/* Command Center Header */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h1 className="text-xl font-bold text-white tracking-wider">
                MARKETSAGE COMMAND CENTER
              </h1>
              <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">ONLINE</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div>LAGOS • {new Date().toLocaleTimeString()}</div>
            <div>USER: {userName.toUpperCase()}</div>
            <div className="text-green-400">SYS: OPERATIONAL</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Row - Industry Agnostic */}
      <div className="grid gap-4 grid-cols-4">
        {/* Growth/ROI */}
        <div className="bg-slate-900 border border-green-600/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span className="text-sm text-green-400">+18%</span>
          </div>
          <div className="text-2xl font-bold text-green-100">
            247%
          </div>
          <div className="text-sm text-green-300/60">GROWTH RATE</div>
        </div>

        {/* Active Audience */}
        <div className="bg-slate-900 border border-red-600/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-red-400" />
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-red-100">
            {dashboardData.livePulse.activeVisitors}
          </div>
          <div className="text-sm text-red-300/60">ACTIVE AUDIENCE</div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-slate-900 border border-blue-600/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-blue-400">+12%</span>
          </div>
          <div className="text-2xl font-bold text-blue-100">
            {dashboardData.livePulse.engagementTrend.toFixed(0)}%
          </div>
          <div className="text-sm text-blue-300/60">ENGAGEMENT</div>
        </div>

        {/* Campaign Performance */}
        <div className="bg-slate-900 border border-orange-600/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-orange-400" />
            <span className="text-sm text-orange-400">ACTIVE</span>
          </div>
          <div className="text-2xl font-bold text-orange-100">
            {dashboardData.kpis.runningAutomations}
          </div>
          <div className="text-sm text-orange-300/60">CAMPAIGNS</div>
        </div>
      </div>

      {/* Main Content: Analytics + Live Operations */}
      <div className="grid gap-6 grid-cols-12">
        {/* Left Side - Analytics Charts */}
        <div className="col-span-8 space-y-6">
          
          {/* Audience Growth Trend */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">AUDIENCE GROWTH</h3>
                <p className="text-sm text-slate-400">Last 7 days performance</p>
              </div>
              <div className="text-green-400 text-sm">↗ +23% vs last week</div>
            </div>
            <div className="h-40 flex items-end justify-between gap-2 bg-slate-800/20 rounded p-3">
              {[
                { day: 'Mon', value: 65, amount: '2.1K' },
                { day: 'Tue', value: 78, amount: '2.8K' },
                { day: 'Wed', value: 52, amount: '1.9K' },
                { day: 'Thu', value: 89, amount: '3.2K' },
                { day: 'Fri', value: 94, amount: '3.4K' },
                { day: 'Sat', value: 76, amount: '2.7K' },
                { day: 'Sun', value: 100, amount: '3.6K' }
              ].map((data, index) => (
                <div key={index} className="flex flex-col items-center gap-1 group relative">
                  {/* Amount above bar */}
                  <div className="text-xs text-green-400 font-medium mb-1">
                    {data.amount}
                  </div>
                  <div 
                    className="bg-gradient-to-t from-green-600 to-green-400 rounded-t w-8 transition-all hover:from-green-500 hover:to-green-300"
                    style={{ height: `${Math.max(data.value * 0.8, 12)}px` }}
                  ></div>
                  <span className="text-xs text-slate-500 font-medium">
                    {data.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-500 text-center">
              7-day audience acquisition overview
            </div>
          </div>

          {/* Communication & Engagement Analytics */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">COMMUNICATION PERFORMANCE</h3>
                <p className="text-sm text-slate-400">Multi-channel engagement metrics</p>
              </div>
              <div className="text-blue-400 text-sm">87% response rate</div>
            </div>
            <div className="grid gap-4 grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{dashboardData.livePulse.activeVisitors}</div>
                <div className="text-xs text-slate-500">ACTIVE CONTACTS</div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">{dashboardData.livePulse.conversionsToday}</div>
                <div className="text-xs text-slate-500">RESPONSES</div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">{dashboardData.livePulse.engagementTrend.toFixed(0)}%</div>
                <div className="text-xs text-slate-500">ENGAGEMENT</div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Module Status Grid - Universal */}
          <div className="grid gap-4 grid-cols-3">
            {/* Automation */}
            <Link href="/workflows" className="group">
              <div className="bg-slate-900 border border-slate-700 hover:border-purple-500/50 rounded-lg p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <Workflow className="h-5 w-5 text-purple-400" />
                  <div className="text-sm text-purple-400">{dashboardData.modules.workflows.trend}</div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{dashboardData.modules.workflows.count}</div>
                <div className="text-sm text-slate-500">Automation Flows</div>
              </div>
            </Link>

            {/* Outreach */}
            <Link href="/email/campaigns" className="group">
              <div className="bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-lg p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <MessageSquare className="h-5 w-5 text-indigo-400" />
                  <div className="text-sm text-indigo-400">{dashboardData.modules.campaigns.trend}</div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{dashboardData.modules.campaigns.count}</div>
                <div className="text-sm text-slate-500">Outreach Campaigns</div>
              </div>
            </Link>

            {/* Audience Intelligence */}
            <Link href="/leadpulse" className="group">
              <div className="bg-slate-900 border border-slate-700 hover:border-red-500/50 rounded-lg p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <Target className="h-5 w-5 text-red-400" />
                  <div className="text-sm text-red-400">{dashboardData.modules.leadpulse.trend}</div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{dashboardData.modules.leadpulse.count}</div>
                <div className="text-sm text-slate-500">Audience Intelligence</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Side - Live Operations */}
        <div className="col-span-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg h-full">
            <div className="border-b border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-bold text-green-400">LIVE OPERATIONS</span>
                </div>
                <div className="text-xs text-slate-500">REAL-TIME</div>
              </div>
              <div className="text-sm text-slate-400 mt-1">System events and operations</div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {liveUpdates.slice(0, 6).map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border border-slate-700/50 rounded-lg p-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <Link 
                        href={activity.href}
                        className="flex items-start gap-3 group"
                        onClick={() => trackDashboardAction('click_activity', activity.type)}
                      >
                        <div className="rounded-lg p-2 bg-slate-700/50 border border-slate-600/50 flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight text-slate-200 group-hover:text-blue-400 transition-colors">
                            {activity.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-green-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                            <span className="text-xs text-slate-600 uppercase font-medium">{activity.type}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {liveUpdates.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">MONITORING SYSTEM...</p>
                    <p className="text-xs">Awaiting operations data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
