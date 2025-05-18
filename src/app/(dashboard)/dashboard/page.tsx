"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import RoleGate from "@/components/auth/role-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CustomCardMetric } from "@/components/ui/custom-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart4, Users, Mail, MessageSquare, Zap, Activity, Server, 
  Database, Shield, Settings, TrendingUp, Calendar, CheckCircle, 
  AlertTriangle, Clock, ArrowRight, BarChart, PieChart, LineChart, Loader2, Info, Plus, RefreshCw, Undo
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

// Mock chart component - in a real app, use a proper chart library like Recharts
function MockBarChart() {
  return (
    <div className="w-full h-48 flex items-end justify-between gap-2 pt-6">
      {[65, 45, 80, 72, 55, 40, 92, 60, 70, 82, 75, 58].map((value, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full bg-primary/80 hover:bg-primary transition-all rounded-sm" 
            style={{ height: `${value}%` }}
          ></div>
          <span className="text-xs text-muted-foreground">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

function MockLineChart() {
  return (
    <div className="w-full h-48 relative flex items-end">
      <div className="absolute inset-0 flex items-center">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-full h-px bg-border"></div>
        ))}
      </div>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M0,50 L10,45 L20,60 L30,40 L40,45 L50,30 L60,35 L70,20 L80,30 L90,15 L100,25"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M0,70 L10,65 L20,75 L30,60 L40,70 L50,65 L60,60 L70,50 L80,55 L90,45 L100,50"
          fill="none"
          stroke="hsl(var(--primary) / 0.5)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function MockPieChart() {
  return (
    <div className="w-full flex justify-center py-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="hsl(var(--primary) / 0.2)" strokeWidth="20" />
          <circle 
            cx="50" 
            cy="50" 
            r="40" 
            fill="transparent" 
            stroke="hsl(var(--primary))" 
            strokeWidth="20" 
            strokeDasharray="188.5 251.3" 
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
          75%
        </div>
      </div>
    </div>
  );
}

// Default dashboard data for fallback
const defaultDashboardData = {
  emailStats: {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
  },
  contactStats: {
    total: 0,
    new: 0,
    growthRate: 0,
  },
  opensByHour: Array(24).fill(0).map((_, hour) => ({ 
    hour: hour.toString().padStart(2, '0'), 
    count: 0 
  })),
  campaignPerformance: [],
  workflowStats: {
    active: 0,
  },
};

// Upcoming tasks component
function UpcomingTasks() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review campaign performance", due: "Today", priority: "high", completed: false },
    { id: 2, title: "Approve email templates", due: "Tomorrow", priority: "medium", completed: false },
    { id: 3, title: "Update contact segments", due: "In 2 days", priority: "low", completed: false },
    { id: 4, title: "Schedule monthly newsletter", due: "Next week", priority: "medium", completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className={`flex items-center justify-between p-3 bg-muted/20 rounded-md hover:bg-muted/40 transition-colors ${task.completed ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${
              task.priority === 'high' ? 'bg-red-500' : 
              task.priority === 'medium' ? 'bg-amber-500' : 
              'bg-green-500'
            }`}></div>
            <span className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{task.due}</Badge>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggleTask(task.id)}>
              {task.completed ? (
                <Undo className="h-4 w-4 text-muted-foreground" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span className="sr-only">{task.completed ? 'Mark as incomplete' : 'Complete'}</span>
            </Button>
          </div>
        </div>
      ))}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setTasks(tasks.filter(task => !task.completed))}>
          Clear Completed
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/tasks/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Recent activity component
function RecentActivity() {
  const activities = [
    { id: 1, type: "campaign", title: "Email campaign sent", description: "Monthly Newsletter", time: "2 hours ago", href: "/email/campaigns" },
    { id: 2, type: "contact", title: "New contacts added", description: "12 contacts imported", time: "Yesterday", href: "/contacts" },
    { id: 3, type: "automation", title: "Workflow triggered", description: "Welcome sequence", time: "2 days ago", href: "/workflows" },
    { id: 4, type: "journey", title: "Journey milestone", description: "50% completion rate", time: "3 days ago", href: "/journeys" },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case "campaign": return <Mail className="h-4 w-4 text-blue-500" />;
      case "contact": return <Users className="h-4 w-4 text-green-500" />;
      case "automation": return <Zap className="h-4 w-4 text-amber-500" />;
      case "journey": return <Activity className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <Link key={activity.id} href={activity.href} className="flex gap-3 hover:bg-muted/10 p-2 rounded-md transition-colors">
          <div className="mt-0.5 p-1.5 rounded-full bg-muted/50">
            {getIcon(activity.type)}
          </div>
          <div>
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
          </div>
        </Link>
      ))}
      <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
        <Link href="/dashboard">
          View All Activity
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </Button>
    </div>
  );
}

// Campaign performance component
function CampaignPerformance({ campaigns = [] }) {
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Use real campaigns if available, otherwise fallback to static data
  const displayCampaigns = campaigns.length > 0 ? campaigns : [
    { id: 1, name: "Monthly Newsletter", type: "email", openRate: 0.248, clickRate: 0.032, status: "active" },
    { id: 2, name: "Product Announcement", type: "email", openRate: 0.325, clickRate: 0.057, status: "completed" },
    { id: 3, name: "Promo Discount", type: "sms", openRate: null, clickRate: 0.123, status: "active" },
  ];

  return (
    <div className="space-y-4">
      {displayCampaigns.map(campaign => (
        <div key={campaign.id} className="p-3 border rounded-md hover:bg-muted/10 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {campaign.type === "email" ? 
                <Mail className="h-4 w-4 text-blue-500" /> : 
                <MessageSquare className="h-4 w-4 text-green-500" />
              }
              <span className="font-medium text-sm">{campaign.name}</span>
            </div>
            <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
              {campaign.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-muted-foreground">Open Rate</p>
              <p className="font-medium">{campaign.openRate !== null ? formatPercent(campaign.openRate) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Click Rate</p>
              <p className="font-medium">{formatPercent(campaign.clickRate)}</p>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link href="/email/campaigns">View All Campaigns</Link>
      </Button>
    </div>
  );
}

// Quick actions component
function QuickActions() {
  const actions = [
    { id: 1, title: "New Campaign", icon: <Mail className="h-5 w-5" />, href: "/email/campaigns" },
    { id: 2, title: "Add Contacts", icon: <Users className="h-5 w-5" />, href: "/contacts" },
    { id: 3, title: "Create Workflow", icon: <Zap className="h-5 w-5" />, href: "/workflows" },
    { id: 4, title: "View Analytics", icon: <BarChart className="h-5 w-5" />, href: "/dashboard" },
    { id: 5, title: "Email Templates", icon: <Settings className="h-5 w-5" />, href: "/email/templates" },
    { id: 6, title: "SMS Campaigns", icon: <MessageSquare className="h-5 w-5" />, href: "/sms/campaigns" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map(action => (
        <Link
          key={action.id}
          href={action.href}
          className="flex flex-col items-center justify-center rounded-md border border-border p-4 hover:bg-accent transition-colors"
        >
          <div className="p-2 rounded-full bg-primary/10 mb-2">
            {action.icon}
          </div>
          <span className="text-xs font-medium text-center">{action.title}</span>
        </Link>
      ))}
    </div>
  );
}

// Insights component
function Insights() {
  const insights = [
    { 
      id: 1, 
      title: "Email Performance Declining", 
      description: "Your last 3 campaigns had lower open rates than usual.",
      type: "warning",
      action: "Review Campaigns",
      href: "/email/campaigns"
    },
    { 
      id: 2, 
      title: "Segment Growth", 
      description: "Your 'High Value' segment grew by 15% this month.",
      type: "success",
      action: "View Segment",
      href: "/segments"
    },
    { 
      id: 3, 
      title: "Workflow Optimization", 
      description: "Simplifying your welcome sequence could improve conversion.",
      type: "info",
      action: "View Workflows",
      href: "/workflows"
    },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3">
      {insights.map(insight => (
        <div key={insight.id} className="p-3 border rounded-md bg-muted/10">
          <div className="flex gap-3">
            <div className="mt-0.5">
              {getIcon(insight.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{insight.title}</p>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
              <Button variant="link" size="sm" className="h-6 p-0 mt-1 text-xs" asChild>
                <Link href={insight.href}>{insight.action}</Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "USER";
  const userName = session?.user?.name || "User";
  const [activeTab, setActiveTab] = useState("overview");
  
  // Add state for dashboard data
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30"); // Default 30 days
  const [chartView, setChartView] = useState("opens"); // Add state for chart view

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard?period=${period}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [period]);

  // Format numbers for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Format percentages
  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  // Function to refresh dashboard data
  const refreshDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
      toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {userName}</h2>
        <p className="text-muted-foreground">
            Here's what's happening with your marketing today
          </p>
        </div>
        <div className="flex gap-2">
          <div className="hidden md:block">
            <Select value={period} onValueChange={(value) => setPeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                {loading ? 'Loading...' : `Last ${period} days`}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" disabled={loading} onClick={refreshDashboard}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="sr-only">Refresh dashboard</span>
          </Button>
          <Button asChild>
            <Link href="/email/campaigns">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CustomCardMetric
            icon={<Mail className="h-5 w-5 text-primary" />}
            title="Email Campaigns"
            value={loading ? "..." : formatNumber(dashboardData.emailStats.sent)}
            trend={loading ? "..." : "+5.4%"}
            trendType="up"
            description="Active campaigns"
            />
            <CustomCardMetric
              icon={<Users className="h-5 w-5 text-primary" />}
              title="Total Contacts"
              value={loading ? "..." : formatNumber(dashboardData.contactStats.total)}
              trend={loading ? "..." : `+${formatPercent(dashboardData.contactStats.growthRate)}`}
              trendType="up"
              description="Across all segments"
          />
          <CustomCardMetric
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              title="Open Rate"
              value={loading ? "..." : formatPercent(dashboardData.emailStats.openRate)}
              trend={loading ? "..." : "+2.1%"}
            trendType="up"
              description="Last 30 days avg."
          />
          <CustomCardMetric
            icon={<Zap className="h-5 w-5 text-primary" />}
            title="Automations"
            value={loading ? "..." : formatNumber(dashboardData.workflowStats.active)}
              trend={loading ? "..." : "+3"}
            trendType="up"
              description="Active workflows"
          />
        </div>

          {/* Charts and Activity */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>Campaign performance over time</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={chartView === "opens" ? "default" : "outline"} 
                      size="sm" 
                      className="h-8"
                      onClick={() => setChartView("opens")}
                    >
                      <BarChart className="h-3.5 w-3.5 mr-1" />
                      Opens
                    </Button>
                    <Button 
                      variant={chartView === "clicks" ? "default" : "outline"} 
                      size="sm" 
                      className="h-8"
                      onClick={() => setChartView("clicks")}
                    >
                      <LineChart className="h-3.5 w-3.5 mr-1" />
                      Clicks
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-48 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  chartView === "opens" ? <MockLineChart /> : <MockBarChart />
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground flex justify-between">
                <span>Last {period} days</span>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setActiveTab("analytics")}>
                  View detailed analytics
                </Button>
              </CardFooter>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions on your account</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
                  </div>

          {/* Tasks, Insights and Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Tasks requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingTasks />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <Insights />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Commonly used features</CardDescription>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance and Engagement */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Recent campaign metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CampaignPerformance campaigns={dashboardData.campaignPerformance} />
              )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Audience Engagement</CardTitle>
                    <CardDescription>Engagement by channel</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <PieChart className="h-3.5 w-3.5 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <MockPieChart />
                      <div className="text-center">
                        <p className="text-sm font-medium">Email Engagement</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(dashboardData.emailStats.openRate)} of contacts engaged
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Open Rate</span>
                            <span className="text-sm font-medium">{formatPercent(dashboardData.emailStats.openRate)}</span>
                          </div>
                          <Progress value={dashboardData.emailStats.openRate * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Click Rate</span>
                            <span className="text-sm font-medium">{formatPercent(dashboardData.emailStats.clickRate)}</span>
                          </div>
                          <Progress value={dashboardData.emailStats.clickRate * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Conversion</span>
                            <span className="text-sm font-medium">1.2%</span>
                          </div>
                          <Progress value={1.2} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
          </Card>
        </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                View and manage your marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <h3 className="text-lg font-medium mb-2">Campaign management coming soon</h3>
                <p className="text-muted-foreground mb-4">This feature is currently under development.</p>
                <Button asChild>
                  <Link href="/email/campaigns">View Email Campaigns</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>
                Manage your contacts and segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <h3 className="text-lg font-medium mb-2">Contact management coming soon</h3>
                <p className="text-muted-foreground mb-4">This feature is currently under development.</p>
                <Button asChild>
                  <Link href="/contacts">View Contacts</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reporting</CardTitle>
              <CardDescription>
                View detailed analytics and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <h3 className="text-lg font-medium mb-2">Analytics coming soon</h3>
                <p className="text-muted-foreground mb-4">This feature is currently under development.</p>
                <Button onClick={() => setActiveTab("overview")}>
                  Return to Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role-specific content can still be included if needed */}
      <RoleGate allowedRoles={["SUPER_ADMIN"]}>
          <Card>
            <CardHeader className="pb-2">
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>System-wide settings and controls</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto flex flex-col py-4 px-2 space-y-2" asChild>
                <Link href="/settings">
                <Users className="h-5 w-5" />
                <span className="text-xs">User Management</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col py-4 px-2 space-y-2" asChild>
                <Link href="/settings">
                <Shield className="h-5 w-5" />
                <span className="text-xs">Security Settings</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col py-4 px-2 space-y-2" asChild>
                <Link href="/settings">
                <Server className="h-5 w-5" />
                <span className="text-xs">System Health</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col py-4 px-2 space-y-2" asChild>
                <Link href="/settings">
                <Database className="h-5 w-5" />
                <span className="text-xs">Data Management</span>
                </Link>
              </Button>
              </div>
            </CardContent>
          </Card>
      </RoleGate>
    </div>
  );
}
