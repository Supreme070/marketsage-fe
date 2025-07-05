"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, Users, Activity, Mail, 
  TrendingUp, Map,
  Headphones, Workflow, Target,
  Monitor, Database, Atom, Brain,
  Cpu, Phone, Smartphone
} from "lucide-react";
import Link from "next/link";
import ConversionSubSidebar from "@/components/dashboard/ConversionSubSidebar";

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
  
  const [loading, setLoading] = useState(false);
  const [demoData, setDemoData] = useState({
    dashboard: {
      revenueToday: 125000,
      activeVisitors: 847,
      conversionRate: 12.4,
      activeCampaigns: 8,
      aiAdvantage: 0.23
    },
    campaigns: {
      email: { sent: 2340, opened: 1872, conversions: 234 },
      sms: { sent: 1890, delivered: 1823, conversions: 145 },
      whatsapp: { sent: 567, replied: 445, conversions: 89 },
      workflows: { active: 12, triggered: 156, completed: 142 }
    },
    leadpulse: { totalVisitors: 847, insights: 23 },
    ai: { tasksProcessed: 1240, successRate: 0.94, aiAdvantage: 0.23, chatInteractions: 156 },
    isRunning: false
  });
  const [timeRange, setTimeRange] = useState('24h');
  const [liveUpdates, setLiveUpdates] = useState<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    href: string;
  }>>([]);
  const [conversionSidebarExpanded, setConversionSidebarExpanded] = useState(false);

  // Load sample activity data
  useEffect(() => {
    const sampleActivities = [
      {
        id: 'email_1',
        type: 'campaign',
        title: 'Email Campaign Completed',
        description: '2,340 emails sent, 234 conversions',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        href: '/email/campaigns'
      },
      {
        id: 'leadpulse_1',
        type: 'leadpulse',
        title: 'LeadPulse Analytics',
        description: '847 visitors tracked, 23 insights generated',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        href: '/leadpulse'
      },
      {
        id: 'workflow_1',
        type: 'workflow',
        title: 'Workflow Automation',
        description: '156 workflows triggered, 142 completed',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        href: '/workflows'
      }
    ];
    setLiveUpdates(sampleActivities);
  }, []);

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

  // No loading states needed - we always have simulation data available

  return (
    <>
      <ConversionSubSidebar 
        isExpanded={conversionSidebarExpanded}
        onToggle={() => setConversionSidebarExpanded(!conversionSidebarExpanded)}
      />
      
      <div className={`space-y-6 transition-all duration-300 ${conversionSidebarExpanded ? 'mr-80' : 'mr-16'}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Marketing Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your marketing campaigns and performance
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
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(demoData.dashboard.revenueToday)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +12% from last period
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
            <div className="text-2xl font-bold">{demoData.dashboard.activeVisitors}</div>
            <div className="text-xs text-muted-foreground flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Currently online
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
            <div className="text-2xl font-bold">{demoData.dashboard.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              Real-time optimization
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
            <div className="text-2xl font-bold">{demoData.dashboard.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Across all channels
            </p>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-blue-500/5 to-green-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Enhancement
            </CardTitle>
            <Atom className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {(demoData.dashboard.aiAdvantage * 100).toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              operational
            </div>
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
          <CardDescription>
            Live multi-channel engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Campaigns</span>
                <span className="text-sm font-medium">{demoData.campaigns.email.sent} sent</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ 
                    width: demoData.campaigns.email.sent > 0 
                      ? `${Math.min(100, (demoData.campaigns.email.opened / demoData.campaigns.email.sent) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {demoData.campaigns.email.sent > 0 
                  ? `${((demoData.campaigns.email.opened / demoData.campaigns.email.sent) * 100).toFixed(1)}% open rate`
                  : 'No activity yet'
                }
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SMS Campaigns</span>
                <span className="text-sm font-medium">{demoData.campaigns.sms.sent} sent</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500" 
                  style={{ 
                    width: demoData.campaigns.sms.sent > 0 
                      ? `${Math.min(100, (demoData.campaigns.sms.delivered / demoData.campaigns.sms.sent) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {demoData.campaigns.sms.sent > 0 
                  ? `${((demoData.campaigns.sms.delivered / demoData.campaigns.sms.sent) * 100).toFixed(1)}% delivery rate`
                  : 'No activity yet'
                }
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">WhatsApp</span>
                <span className="text-sm font-medium">{demoData.campaigns.whatsapp.sent} sent</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                  style={{ 
                    width: demoData.campaigns.whatsapp.sent > 0 
                      ? `${Math.min(100, (demoData.campaigns.whatsapp.replied / demoData.campaigns.whatsapp.sent) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {demoData.campaigns.whatsapp.sent > 0 
                  ? `${((demoData.campaigns.whatsapp.replied / demoData.campaigns.whatsapp.sent) * 100).toFixed(1)}% response rate`
                  : 'No activity yet'
                }
              </div>
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
                  <div className="text-xs text-muted-foreground">{demoData.campaigns.workflows.active} active</div>
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
                  <div className="text-xs text-muted-foreground">{demoData.leadpulse.insights} insights</div>
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
                  <div className="text-xs text-muted-foreground">{demoData.dashboard.activeCampaigns} running</div>
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
                  <div className="text-xs text-muted-foreground">
                    Live targeting
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* AI Intelligence Panel */}
      <Card className="border bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Atom className="h-5 w-5 text-purple-400" />
              AI Intelligence
            </CardTitle>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              AI Enhanced
            </Badge>
          </div>
          <CardDescription>
            Real-time AI optimization across all MarketSage components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Campaign Optimization</span>
                <span className="text-sm font-medium text-green-400">
                  +{(demoData.ai.aiAdvantage * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${demoData.ai.aiAdvantage * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">Email, SMS, WhatsApp enhanced</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contact Intelligence</span>
                <span className="text-sm font-medium text-blue-400">
                  +{(Math.min(1, demoData.ai.aiAdvantage + 0.12) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(1, demoData.ai.aiAdvantage + 0.12) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">Lead scoring & behavioral prediction</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Chat Enhancement</span>
                <span className="text-sm font-medium text-amber-400">
                  {(demoData.ai.successRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500" 
                  style={{ width: `${demoData.ai.successRate * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">Response & intent optimization</div>
            </div>
          </div>

          {/* AI Performance Monitoring Cards */}
          <div className="mt-6 grid gap-4 grid-cols-2">
            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-purple-300">AI Processing</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Tasks Processed</span>
                  <span className="font-medium text-purple-400">{demoData.ai.tasksProcessed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Success Rate</span>
                  <span className="font-medium text-green-400">{(demoData.ai.successRate * 100).toFixed(1)}%</span>
                </div>
                {demoData.ai.chatInteractions > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">AI Interactions</span>
                    <span className="font-medium text-blue-400">{demoData.ai.chatInteractions}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-cyan-400" />
                <span className="font-medium text-cyan-300">Multi-Channel Intelligence</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email Optimization
                  </span>
                  <span className="font-medium text-blue-400">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> SMS Enhancement
                  </span>
                  <span className="font-medium text-green-400">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> WhatsApp Intelligence
                  </span>
                  <span className="font-medium text-purple-400">Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-800/20 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Overall AI Advantage</span>
              <span className="font-medium text-emerald-400">+{(demoData.ai.aiAdvantage * 100).toFixed(1)}% performance boost</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-300">Components Enhanced</span>
              <span className="font-medium text-cyan-400">Email • SMS • WhatsApp • AI Chat • Contacts • Workflows</span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
