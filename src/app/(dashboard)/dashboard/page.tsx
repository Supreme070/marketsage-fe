"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
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
  AlertTriangle, Clock, ArrowRight, BarChart, PieChart, LineChart
} from "lucide-react";
import Link from "next/link";

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

// Upcoming tasks component
function UpcomingTasks() {
  const tasks = [
    { id: 1, title: "Review campaign performance", due: "Today", priority: "high" },
    { id: 2, title: "Approve email templates", due: "Tomorrow", priority: "medium" },
    { id: 3, title: "Update contact segments", due: "In 2 days", priority: "low" },
    { id: 4, title: "Schedule monthly newsletter", due: "Next week", priority: "medium" },
  ];

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-md hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${
              task.priority === 'high' ? 'bg-red-500' : 
              task.priority === 'medium' ? 'bg-amber-500' : 
              'bg-green-500'
            }`}></div>
            <span className="text-sm font-medium">{task.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{task.due}</Badge>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <CheckCircle className="h-4 w-4" />
              <span className="sr-only">Complete</span>
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>
    </div>
  );
}

// Recent activity component
function RecentActivity() {
  const activities = [
    { id: 1, type: "campaign", title: "Email campaign sent", description: "Monthly Newsletter", time: "2 hours ago" },
    { id: 2, type: "contact", title: "New contacts added", description: "12 contacts imported", time: "Yesterday" },
    { id: 3, type: "automation", title: "Workflow triggered", description: "Welcome sequence", time: "2 days ago" },
    { id: 4, type: "journey", title: "Journey milestone", description: "50% completion rate", time: "3 days ago" },
  ];

  const getIcon = (type) => {
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
        <div key={activity.id} className="flex gap-3">
          <div className="mt-0.5 p-1.5 rounded-full bg-muted/50">
            {getIcon(activity.type)}
          </div>
          <div>
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="w-full text-xs">
        View All Activity
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}

// Campaign performance component
function CampaignPerformance() {
  const campaigns = [
    { id: 1, name: "Monthly Newsletter", type: "email", openRate: 24.8, clickRate: 3.2, status: "active" },
    { id: 2, name: "Product Announcement", type: "email", openRate: 32.5, clickRate: 5.7, status: "completed" },
    { id: 3, name: "Promo Discount", type: "sms", openRate: null, clickRate: 12.3, status: "active" },
  ];

  return (
    <div className="space-y-4">
      {campaigns.map(campaign => (
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
              <p className="font-medium">{campaign.openRate !== null ? `${campaign.openRate}%` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Click Rate</p>
              <p className="font-medium">{campaign.clickRate}%</p>
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
    { id: 1, title: "New Campaign", icon: <Mail className="h-5 w-5" />, href: "/email/campaigns/new" },
    { id: 2, title: "Add Contacts", icon: <Users className="h-5 w-5" />, href: "/contacts/import" },
    { id: 3, title: "Create Workflow", icon: <Zap className="h-5 w-5" />, href: "/workflows/new" },
    { id: 4, title: "View Analytics", icon: <BarChart className="h-5 w-5" />, href: "/analytics" },
    { id: 5, title: "New Template", icon: <Settings className="h-5 w-5" />, href: "/email/templates/editor" },
    { id: 6, title: "Schedule SMS", icon: <MessageSquare className="h-5 w-5" />, href: "/sms/campaigns/new" },
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
      action: "Review Subject Lines"
    },
    { 
      id: 2, 
      title: "Segment Growth", 
      description: "Your 'High Value' segment grew by 15% this month.",
      type: "success",
      action: "View Segment"
    },
    { 
      id: 3, 
      title: "Workflow Optimization", 
      description: "Simplifying your welcome sequence could improve conversion.",
      type: "info",
      action: "Edit Workflow"
    },
  ];

  const getIcon = (type) => {
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
              <Button variant="link" size="sm" className="h-6 p-0 mt-1 text-xs">
                {insight.action}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Import the missing components
import { Info, Plus } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "USER";
  const userName = session?.user?.name || "User";
  const [activeTab, setActiveTab] = useState("overview");

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
          <Button variant="outline" className="hidden md:flex">
            <Calendar className="mr-2 h-4 w-4" />
            Select Date Range
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
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
              value="32"
              trend="+5.4%"
              trendType="up"
              description="Active campaigns"
            />
            <CustomCardMetric
              icon={<Users className="h-5 w-5 text-primary" />}
              title="Total Contacts"
              value="2,845"
              trend="+12.2%"
              trendType="up"
              description="Across all segments"
            />
            <CustomCardMetric
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              title="Open Rate"
              value="24.8%"
              trend="+2.1%"
              trendType="up"
              description="Last 30 days avg."
            />
            <CustomCardMetric
              icon={<Zap className="h-5 w-5 text-primary" />}
              title="Automations"
              value="12"
              trend="+3"
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
                    <Button variant="outline" size="sm" className="h-8">
                      <BarChart className="h-3.5 w-3.5 mr-1" />
                      Opens
                    </Button>
                    <Button variant="outline" size="sm" className="h-8">
                      <LineChart className="h-3.5 w-3.5 mr-1" />
                      Clicks
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MockLineChart />
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground flex justify-between">
                <span>Last 12 months</span>
                <Button variant="link" size="sm" className="h-auto p-0">
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
                <CampaignPerformance />
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <MockPieChart />
                    <div className="text-center">
                      <p className="text-sm font-medium">Email Engagement</p>
                      <p className="text-xs text-muted-foreground">75% of contacts engaged</p>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Open Rate</span>
                          <span className="text-sm font-medium">24.8%</span>
                        </div>
                        <Progress value={24.8} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Click Rate</span>
                          <span className="text-sm font-medium">3.6%</span>
                        </div>
                        <Progress value={3.6} className="h-2" />
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                Create and manage your marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Campaign content will appear here</p>
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
              <p>Contact management content will appear here</p>
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
              <p>Analytics content will appear here</p>
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
              <Button variant="outline" className="h-auto flex flex-col py-4 px-2 space-y-2">
                <Users className="h-5 w-5" />
                <span className="text-xs">User Management</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col py-4 px-2 space-y-2">
                <Shield className="h-5 w-5" />
                <span className="text-xs">Security Settings</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col py-4 px-2 space-y-2">
                <Server className="h-5 w-5" />
                <span className="text-xs">System Health</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col py-4 px-2 space-y-2">
                <Database className="h-5 w-5" />
                <span className="text-xs">Data Management</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  );
}
