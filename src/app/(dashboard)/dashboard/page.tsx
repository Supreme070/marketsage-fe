"use client";

import { useSession } from "next-auth/react";
import RoleGate from "@/components/auth/role-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomCard } from "@/components/ui/custom-card";
import { BarChart4, Users, Mail, MessageSquare, Zap, Activity, Server, Database, Shield, Settings } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "USER";
  const userName = session?.user?.name || "User";

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {userName}</h2>
        <p className="text-muted-foreground">
          You are logged in as: <span className="font-medium text-primary">{userRole}</span>
        </p>
      </div>

      {/* Super Admin Dashboard */}
      <RoleGate allowedRoles={["SUPER_ADMIN"]}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CustomCard
            icon={<Users className="h-5 w-5" />}
            title="Total Users"
            value="124"
            trend="+5.4%"
            trendType="up"
            description="Total registered users"
          />
          <CustomCard
            icon={<Mail className="h-5 w-5" />}
            title="Email Campaigns"
            value="48"
            trend="+12.2%"
            trendType="up"
            description="Active email campaigns"
          />
          <CustomCard
            icon={<Activity className="h-5 w-5" />}
            title="System Health"
            value="98.5%"
            trend="+0.5%"
            trendType="up"
            description="Overall system uptime"
          />
          <CustomCard
            icon={<BarChart4 className="h-5 w-5" />}
            title="Monthly Revenue"
            value="$28,450"
            trend="+8.2%"
            trendType="up"
            description="Current month revenue"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>Key system performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Server Load</span>
                  </div>
                  <span className="text-sm font-medium">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Database Size</span>
                  </div>
                  <span className="text-sm font-medium">4.2 GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Security Status</span>
                  </div>
                  <span className="text-sm font-medium">Secure</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">System Updates</span>
                  </div>
                  <span className="text-sm font-medium">Up to date</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Recent Admin Activity</CardTitle>
              <CardDescription>Latest system changes and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System update deployed</span>
                    <span className="text-xs text-muted-foreground">Today, 10:30 AM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Version 2.4.0 deployed successfully to production
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New admin user created</span>
                    <span className="text-xs text-muted-foreground">Yesterday, 2:45 PM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Admin account for Jane Smith was created
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database optimization</span>
                    <span className="text-xs text-muted-foreground">May 3, 2025</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Scheduled maintenance completed successfully
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGate>

      {/* Admin Dashboard */}
      <RoleGate allowedRoles={["ADMIN"]}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CustomCard
            icon={<Users className="h-5 w-5" />}
            title="Active Users"
            value="98"
            trend="+3.1%"
            trendType="up"
            description="Active users this month"
          />
          <CustomCard
            icon={<Mail className="h-5 w-5" />}
            title="Email Campaigns"
            value="32"
            trend="+5.4%"
            trendType="up"
            description="Active email campaigns"
          />
          <CustomCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="SMS Campaigns"
            value="14"
            trend="+2.0%"
            trendType="up"
            description="Active SMS campaigns"
          />
          <CustomCard
            icon={<Zap className="h-5 w-5" />}
            title="Automations"
            value="12"
            trend="+8.2%"
            trendType="up"
            description="Active workflow automations"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Marketing team performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email Open Rate</span>
                  </div>
                  <span className="text-sm font-medium">24.8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Click-through Rate</span>
                  </div>
                  <span className="text-sm font-medium">3.6%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">New Contacts</span>
                  </div>
                  <span className="text-sm font-medium">156 this month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest team activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Newsletter sent</span>
                    <span className="text-xs text-muted-foreground">Today, 9:30 AM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sent to 2,450 subscribers with 24.5% open rate
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New contacts imported</span>
                    <span className="text-xs text-muted-foreground">Yesterday, 3:20 PM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    45 new contacts imported from CSV file
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Promo campaign created</span>
                    <span className="text-xs text-muted-foreground">May 3, 2025</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Summer promotion campaign scheduled for next week
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGate>

      {/* IT Admin Dashboard */}
      <RoleGate allowedRoles={["IT_ADMIN"]}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CustomCard
            icon={<Server className="h-5 w-5" />}
            title="Server Uptime"
            value="99.98%"
            trend="+0.2%"
            trendType="up"
            description="30-day average"
          />
          <CustomCard
            icon={<Database className="h-5 w-5" />}
            title="DB Performance"
            value="28ms"
            trend="-3.5%"
            trendType="down"
            description="Average query time"
          />
          <CustomCard
            icon={<Shield className="h-5 w-5" />}
            title="Security Status"
            value="Secure"
            trend="0%"
            trendType="neutral"
            description="No issues detected"
          />
          <CustomCard
            icon={<Activity className="h-5 w-5" />}
            title="API Requests"
            value="2.4M"
            trend="+12.4%"
            trendType="up"
            description="Monthly API calls"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>System Health</CardTitle>
              <CardDescription>Technical system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm font-medium">32%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disk Space</span>
                  </div>
                  <span className="text-sm font-medium">48% used</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Network Traffic</span>
                  </div>
                  <span className="text-sm font-medium">3.8 Mbps</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Issues</CardTitle>
              <CardDescription>Latest system alerts and issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API rate limit reached</span>
                    <span className="text-xs text-muted-foreground">Today, 11:45 AM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rate limit exceeded for payment API - auto-resolved
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Backup completed</span>
                    <span className="text-xs text-muted-foreground">Today, 3:30 AM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Daily database backup completed successfully
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Security scan completed</span>
                    <span className="text-xs text-muted-foreground">Yesterday, 8:00 PM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    No vulnerabilities detected
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGate>

      {/* Regular User Dashboard */}
      <RoleGate allowedRoles={["USER"]}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CustomCard
            icon={<Mail className="h-5 w-5" />}
            title="My Campaigns"
            value="8"
            trend="+2"
            trendType="up"
            description="Active campaigns"
          />
          <CustomCard
            icon={<Users className="h-5 w-5" />}
            title="My Contacts"
            value="342"
            trend="+12"
            trendType="up"
            description="Total contacts"
          />
          <CustomCard
            icon={<Zap className="h-5 w-5" />}
            title="My Automations"
            value="5"
            trend="+1"
            trendType="up"
            description="Active workflows"
          />
          <CustomCard
            icon={<Activity className="h-5 w-5" />}
            title="Performance"
            value="22.4%"
            trend="+1.2%"
            trendType="up"
            description="Avg. open rate"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest marketing activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weekly Newsletter sent</span>
                    <span className="text-xs text-muted-foreground">Today, 9:30 AM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sent to 342 contacts with 22.5% open rate
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contact list updated</span>
                    <span className="text-xs text-muted-foreground">Yesterday, 3:20 PM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Added 12 new contacts to "Prospects" list
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Workflow triggered</span>
                    <span className="text-xs text-muted-foreground">May 3, 2025</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    "Welcome Sequence" workflow triggered for 5 contacts
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Commonly used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/email/campaigns/new"
                  className="flex flex-col items-center justify-center rounded-md border border-border p-4 hover:bg-accent"
                >
                  <Mail className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">New Campaign</span>
                </a>
                <a
                  href="/contacts/import"
                  className="flex flex-col items-center justify-center rounded-md border border-border p-4 hover:bg-accent"
                >
                  <Users className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Import Contacts</span>
                </a>
                <a
                  href="/workflows/new"
                  className="flex flex-col items-center justify-center rounded-md border border-border p-4 hover:bg-accent"
                >
                  <Zap className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">New Workflow</span>
                </a>
                <a
                  href="/email/templates/editor"
                  className="flex flex-col items-center justify-center rounded-md border border-border p-4 hover:bg-accent"
                >
                  <Settings className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">New Template</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGate>
    </div>
  );
}
