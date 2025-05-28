"use client";

import { useState, useMemo, useEffect } from "react";
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
  Zap,
  RefreshCw
} from "lucide-react";

interface TaskData {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  team: string;
  assignee: string;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  revenue?: number;
  campaign?: string;
  timeSpent?: number; // in hours
}

export function TaskAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("productivity");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Enhanced mock data with more realistic task information
  const [allTasks] = useState<TaskData[]>([
    {
      id: "1",
      title: "Email Campaign - Lagos SMEs",
      status: "DONE",
      priority: "HIGH",
      team: "Marketing",
      assignee: "Adebayo Ogundimu",
      createdAt: "2024-01-15",
      completedAt: "2024-01-20",
      dueDate: "2024-01-22",
      revenue: 450000,
      campaign: "Q1 Email Campaign",
      timeSpent: 12
    },
    {
      id: "2",
      title: "WhatsApp Integration Setup",
      status: "IN_PROGRESS",
      priority: "URGENT",
      team: "Technical",
      assignee: "Chinedu Okwu",
      createdAt: "2024-01-18",
      dueDate: "2024-02-15",
      revenue: 280000,
      campaign: "WhatsApp Engagement",
      timeSpent: 8
    },
    {
      id: "3",
      title: "Sales Follow-up - Abuja Leads",
      status: "DONE",
      priority: "HIGH",
      team: "Sales",
      assignee: "Tunde Bakare",
      createdAt: "2024-01-10",
      completedAt: "2024-01-25",
      dueDate: "2024-01-30",
      revenue: 650000,
      campaign: "Lagos Market Expansion",
      timeSpent: 16
    },
    {
      id: "4",
      title: "Content Creation - Case Study",
      status: "REVIEW",
      priority: "MEDIUM",
      team: "Content",
      assignee: "Fatima Abdullahi",
      createdAt: "2024-01-20",
      dueDate: "2024-02-10",
      revenue: 180000,
      campaign: "Social Media Push",
      timeSpent: 6
    },
    {
      id: "5",
      title: "Lead Qualification Automation",
      status: "TODO",
      priority: "HIGH",
      team: "Marketing",
      assignee: "Adebayo Ogundimu",
      createdAt: "2024-01-25",
      dueDate: "2024-02-20",
      revenue: 320000,
      timeSpent: 0
    },
    {
      id: "6",
      title: "Customer Onboarding - Enterprise",
      status: "IN_PROGRESS",
      priority: "URGENT",
      team: "Sales",
      assignee: "Ngozi Okafor",
      createdAt: "2024-01-22",
      dueDate: "2024-02-05",
      revenue: 780000,
      timeSpent: 10
    },
    {
      id: "7",
      title: "Analytics Dashboard Update",
      status: "DONE",
      priority: "MEDIUM",
      team: "Technical",
      assignee: "Chinedu Okwu",
      createdAt: "2024-01-12",
      completedAt: "2024-01-28",
      dueDate: "2024-02-01",
      timeSpent: 14
    },
    {
      id: "8",
      title: "Social Media Campaign",
      status: "REVIEW",
      priority: "MEDIUM",
      team: "Content",
      assignee: "Fatima Abdullahi",
      createdAt: "2024-01-16",
      dueDate: "2024-02-12",
      revenue: 220000,
      timeSpent: 8
    }
  ]);

  // Filter tasks based on selected criteria
  const filteredTasks = useMemo(() => {
    let filtered = allTasks;

    // Filter by team
    if (selectedTeam !== "all") {
      filtered = filtered.filter(task => task.team.toLowerCase() === selectedTeam);
    }

    // Filter by period
    const now = new Date();
    const periodDays = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : selectedPeriod === "90d" ? 90 : 365;
    const cutoffDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    filtered = filtered.filter(task => new Date(task.createdAt) >= cutoffDate);

    return filtered;
  }, [allTasks, selectedTeam, selectedPeriod]);

  // Calculate dynamic metrics
  const metrics = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'DONE').length;
    const overdueTasks = filteredTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
    ).length;
    const inProgressTasks = filteredTasks.filter(task => task.status === 'IN_PROGRESS').length;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate average task duration for completed tasks
    const completedTasksWithTime = filteredTasks.filter(task => 
      task.status === 'DONE' && task.createdAt && task.completedAt
    );
    
    const avgDuration = completedTasksWithTime.length > 0 
      ? completedTasksWithTime.reduce((acc, task) => {
          const start = new Date(task.createdAt);
          const end = new Date(task.completedAt!);
          return acc + ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / completedTasksWithTime.length
      : 0;

    // Calculate total revenue
    const totalRevenue = filteredTasks.reduce((acc, task) => 
      acc + (task.status === 'DONE' ? (task.revenue || 0) : 0), 0
    );

    // Calculate team efficiency (completed vs total * 100)
    const teamEfficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      completionRate: Math.round(completionRate * 10) / 10,
      avgDuration: Math.round(avgDuration * 10) / 10,
      totalRevenue,
      teamEfficiency: Math.round(teamEfficiency * 10) / 10,
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks
    };
  }, [filteredTasks]);

  // Generate task completion trend data
  const taskCompletionTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const tasksCreated = filteredTasks.filter(task => 
        task.createdAt.split('T')[0] === date
      ).length;
      
      const tasksCompleted = filteredTasks.filter(task => 
        task.completedAt && task.completedAt.split('T')[0] === date
      ).length;

      return {
        date,
        created: tasksCreated,
        completed: tasksCompleted
      };
    });
  }, [filteredTasks]);

  // Generate team performance data
  const teamPerformance = useMemo(() => {
    const teams = ['Marketing', 'Sales', 'Content', 'Technical'];
    
    return teams.map(team => {
      const teamTasks = filteredTasks.filter(task => task.team === team);
      const completed = teamTasks.filter(task => task.status === 'DONE').length;
      const total = teamTasks.length;
      const efficiency = total > 0 ? (completed / total) * 100 : 0;
      const revenue = teamTasks
        .filter(task => task.status === 'DONE')
        .reduce((acc, task) => acc + (task.revenue || 0), 0);

      return {
        team,
        completed,
        total,
        efficiency: Math.round(efficiency * 10) / 10,
        revenue
      };
    });
  }, [filteredTasks]);

  // Generate task type distribution
  const taskTypeDistribution = useMemo(() => {
    const types = {
      'Campaign Tasks': filteredTasks.filter(task => task.campaign?.includes('Campaign')).length,
      'Sales Follow-ups': filteredTasks.filter(task => task.title.toLowerCase().includes('sales') || task.title.toLowerCase().includes('follow')).length,
      'Content Creation': filteredTasks.filter(task => task.title.toLowerCase().includes('content') || task.team === 'Content').length,
      'Technical Tasks': filteredTasks.filter(task => task.team === 'Technical').length
    };

    return Object.entries(types).map(([type, value], index) => ({
      type,
      value,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index]
    }));
  }, [filteredTasks]);

  // Generate priority breakdown
  const priorityBreakdown = useMemo(() => {
    const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    
    return priorities.map(priority => {
      const priorityTasks = filteredTasks.filter(task => task.priority === priority);
      const completed = priorityTasks.filter(task => task.status === 'DONE').length;
      const overdue = priorityTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
      ).length;

      return {
        priority: priority.charAt(0) + priority.slice(1).toLowerCase(),
        count: priorityTasks.length,
        completed,
        overdue
      };
    });
  }, [filteredTasks]);

  // Generate campaign ROI data
  const campaignROI = useMemo(() => {
    const campaigns = [...new Set(filteredTasks.map(task => task.campaign).filter(Boolean))];
    
    return campaigns.map(campaign => {
      const campaignTasks = filteredTasks.filter(task => task.campaign === campaign);
      const completed = campaignTasks.filter(task => task.status === 'DONE').length;
      const total = campaignTasks.length;
      const revenue = campaignTasks
        .filter(task => task.status === 'DONE')
        .reduce((acc, task) => acc + (task.revenue || 0), 0);
      
      // Calculate ROI as percentage (simplified calculation)
      const roi = revenue > 0 ? Math.round((revenue / 100000) * 100) : 0;

      return {
        campaign: campaign!,
        tasks: total,
        completed,
        revenue,
        roi
      };
    });
  }, [filteredTasks]);

  // Simulate data refresh
  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent": return "text-red-600";
      case "high": return "text-orange-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
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
                <span className="ml-2 text-xs text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Metric Focus</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
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
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedTasks} of {metrics.totalTasks} tasks completed
            </p>
            <Progress value={metrics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Task Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgDuration}d</div>
            <p className="text-xs text-muted-foreground">
              Average time to completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(metrics.totalRevenue / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">
              From completed tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.teamEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              Overall productivity score
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