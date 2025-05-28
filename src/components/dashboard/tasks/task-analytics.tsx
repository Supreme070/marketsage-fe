"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Clock, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Zap
} from "lucide-react";

export function TaskAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedTeam, setSelectedTeam] = useState("all");

  // Mock data for analytics
  const taskCompletionTrend = [
    { date: "2024-01-01", completed: 12, created: 15 },
    { date: "2024-01-02", completed: 18, created: 20 },
    { date: "2024-01-03", completed: 15, created: 18 },
    { date: "2024-01-04", completed: 22, created: 25 },
    { date: "2024-01-05", completed: 19, created: 22 },
    { date: "2024-01-06", completed: 25, created: 28 },
    { date: "2024-01-07", completed: 21, created: 24 }
  ];

  const teamPerformance = [
    { team: "Marketing", completed: 45, total: 52, efficiency: 86.5, revenue: 450000 },
    { team: "Sales", completed: 38, total: 41, efficiency: 92.7, revenue: 1200000 },
    { team: "Content", completed: 28, total: 35, efficiency: 80.0, revenue: 180000 },
    { team: "Cross-Team", completed: 15, total: 20, efficiency: 75.0, revenue: 320000 }
  ];

  const taskTypeDistribution = [
    { type: "Campaign Tasks", value: 35, color: "#3b82f6" },
    { type: "Sales Follow-ups", value: 28, color: "#10b981" },
    { type: "Content Creation", value: 22, color: "#f59e0b" },
    { type: "Analytics & Reports", value: 15, color: "#8b5cf6" }
  ];

  const priorityBreakdown = [
    { priority: "Urgent", count: 8, completed: 6, overdue: 2 },
    { priority: "High", count: 24, completed: 18, overdue: 3 },
    { priority: "Medium", count: 35, completed: 28, overdue: 2 },
    { priority: "Low", count: 18, completed: 15, overdue: 0 }
  ];

  const campaignROI = [
    { campaign: "Q1 Email Campaign", tasks: 12, completed: 10, revenue: 450000, roi: 340 },
    { campaign: "WhatsApp Engagement", tasks: 8, completed: 7, revenue: 280000, roi: 250 },
    { campaign: "Social Media Push", tasks: 15, completed: 12, revenue: 180000, roi: 180 },
    { campaign: "Lagos Market Expansion", tasks: 20, completed: 16, revenue: 650000, roi: 420 }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "text-red-600";
      case "High": return "text-orange-600";
      case "Medium": return "text-yellow-600";
      case "Low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Task Analytics & Insights</CardTitle>
              <CardDescription>
                Track team productivity, campaign performance, and revenue impact
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Team</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Metric Focus</label>
              <Select defaultValue="productivity">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="revenue">Revenue Impact</SelectItem>
                  <SelectItem value="efficiency">Efficiency</SelectItem>
                  <SelectItem value="bottlenecks">Bottlenecks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Task Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3d</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.5d</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦2.15M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18.7%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3.2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Completion Trend</CardTitle>
            <CardDescription>Daily task creation vs completion over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taskCompletionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-NG', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-NG')}
                    formatter={(value: number, name: string) => [value, name === "completed" ? "Completed" : "Created"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="completed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="created"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Type Distribution</CardTitle>
            <CardDescription>Breakdown of tasks by type and focus area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, value }) => `${type}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, "Tasks"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Performance Overview</CardTitle>
          <CardDescription>Task completion rates and revenue impact by team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamPerformance.map((team, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{team.team}</h4>
                    <Badge variant="outline">
                      {team.completed}/{team.total} tasks
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Efficiency: {team.efficiency}%</span>
                    <span>Revenue: ₦{(team.revenue / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{team.efficiency}%</div>
                  <Progress value={team.efficiency} className="w-24 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Priority Analysis</CardTitle>
            <CardDescription>Task distribution and completion by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityBreakdown.map((priority, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`font-medium ${getPriorityColor(priority.priority)}`}>
                      {priority.priority}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {priority.count} total
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-green-600">{priority.completed} done</span>
                      {priority.overdue > 0 && (
                        <span className="text-red-600 ml-2">{priority.overdue} overdue</span>
                      )}
                    </div>
                    <Progress 
                      value={(priority.completed / priority.count) * 100} 
                      className="w-20" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign ROI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign ROI Analysis</CardTitle>
            <CardDescription>Revenue impact and task efficiency by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignROI.map((campaign, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{campaign.campaign}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{campaign.completed}/{campaign.tasks} tasks</span>
                        <span>•</span>
                        <span>₦{(campaign.revenue / 1000).toFixed(0)}K revenue</span>
                      </div>
                    </div>
                    <Badge 
                      variant={campaign.roi > 300 ? "default" : campaign.roi > 200 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {campaign.roi}% ROI
                    </Badge>
                  </div>
                  <Progress 
                    value={(campaign.completed / campaign.tasks) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
          <CardDescription>Smart recommendations to improve team productivity and campaign performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                type: "productivity",
                title: "Peak Productivity Hours",
                description: "Your team completes 40% more tasks between 10 AM - 12 PM. Consider scheduling important tasks during this window.",
                priority: "medium",
                action: "Optimize Scheduling"
              },
              {
                type: "bottleneck",
                title: "Content Review Bottleneck",
                description: "Content tasks spend 60% longer in review stage. Consider adding more reviewers or streamlining approval process.",
                priority: "high",
                action: "Address Bottleneck"
              },
              {
                type: "revenue",
                title: "High-ROI Task Pattern",
                description: "Sales follow-up tasks completed within 24 hours show 45% higher conversion rates.",
                priority: "high",
                action: "Implement Best Practice"
              },
              {
                type: "efficiency",
                title: "Cross-Team Collaboration",
                description: "Marketing-Sales collaborative tasks have 25% higher success rates. Increase cross-team projects.",
                priority: "medium",
                action: "Enhance Collaboration"
              }
            ].map((insight, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-sm">{insight.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={insight.priority === "high" ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {insight.priority}
                    </Badge>
                    <Button variant="outline" size="sm" className="text-xs">
                      {insight.action}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 