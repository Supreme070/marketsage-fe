"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Target,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Globe,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter
} from "lucide-react";

// Mock data for demonstration
const performanceData = [
  { month: 'Jan', completed: 45, created: 52, efficiency: 86.5 },
  { month: 'Feb', completed: 62, created: 68, efficiency: 91.2 },
  { month: 'Mar', completed: 58, created: 71, efficiency: 81.7 },
  { month: 'Apr', completed: 74, created: 83, efficiency: 89.2 },
  { month: 'May', completed: 69, created: 78, efficiency: 88.5 },
  { month: 'Jun', completed: 81, created: 89, efficiency: 91.0 }
];

const priorityDistribution = [
  { name: 'Critical', value: 8, color: '#ef4444' },
  { name: 'High', value: 23, color: '#f97316' },
  { name: 'Medium', value: 45, color: '#3b82f6' },
  { name: 'Low', value: 24, color: '#6b7280' }
];

const teamPerformance = [
  { member: 'Alice Johnson', completed: 28, efficiency: 94, avgTime: 4.2 },
  { member: 'Bob Smith', completed: 24, efficiency: 89, avgTime: 5.1 },
  { member: 'Carol Davis', completed: 31, efficiency: 97, avgTime: 3.8 },
  { member: 'David Wilson', completed: 19, efficiency: 82, avgTime: 6.3 },
  { member: 'Emma Brown', completed: 26, efficiency: 91, avgTime: 4.7 }
];

const workflowIntegrationData = [
  { workflow: 'Lead Nurturing', tasks: 34, completion: 91, avgDuration: 2.4 },
  { workflow: 'Customer Onboarding', tasks: 28, completion: 87, avgDuration: 3.1 },
  { workflow: 'Email Campaigns', tasks: 45, completion: 94, avgDuration: 1.8 },
  { workflow: 'Support Tickets', tasks: 52, completion: 78, avgDuration: 4.7 },
  { workflow: 'Product Updates', tasks: 19, completion: 89, avgDuration: 2.9 }
];

const africanMarketInsights = [
  { country: 'Nigeria', tasks: 67, completion: 89, culturalScore: 94 },
  { country: 'Kenya', tasks: 42, completion: 92, culturalScore: 88 },
  { country: 'South Africa', tasks: 38, completion: 85, culturalScore: 91 },
  { country: 'Ghana', tasks: 29, completion: 87, culturalScore: 89 },
  { country: 'Egypt', tasks: 24, completion: 83, culturalScore: 86 }
];

const aiInsights = [
  {
    id: 1,
    type: 'optimization',
    title: 'Peak Performance Hours Identified',
    description: 'Tasks completed between 9-11 AM show 23% higher efficiency',
    impact: 'high',
    confidence: 92,
    actionable: true
  },
  {
    id: 2,
    type: 'prediction',
    title: 'Workload Spike Predicted',
    description: 'Expected 35% increase in tasks next week based on campaign schedules',
    impact: 'medium',
    confidence: 87,
    actionable: true
  },
  {
    id: 3,
    type: 'alert',
    title: 'Team Capacity Alert',
    description: 'David Wilson showing signs of overload - recommend task redistribution',
    impact: 'high',
    confidence: 94,
    actionable: true
  },
  {
    id: 4,
    type: 'cultural',
    title: 'Ramadan Timing Optimization',
    description: 'Adjust task scheduling for Nigerian team during Ramadan for 18% better performance',
    impact: 'medium',
    confidence: 89,
    actionable: true
  }
];

export function AdvancedTaskAnalytics() {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('efficiency');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleExport = () => {
    // Simulate export functionality
    console.log('Exporting analytics data...');
  };

  // Calculate key metrics
  const totalTasks = performanceData.reduce((sum, month) => sum + month.created, 0);
  const totalCompleted = performanceData.reduce((sum, month) => sum + month.completed, 0);
  const avgEfficiency = performanceData.reduce((sum, month) => sum + month.efficiency, 0) / performanceData.length;
  const completionRate = (totalCompleted / totalTasks) * 100;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      case 'prediction': return <Brain className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'cultural': return <Globe className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Task Analytics</h2>
          <p className="text-muted-foreground">
            AI-powered insights and performance optimization for African markets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +3.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +5.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.length}</div>
            <p className="text-xs text-muted-foreground">
              {aiInsights.filter(i => i.actionable).length} actionable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="team">Team Analytics</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Integration</TabsTrigger>
          <TabsTrigger value="african">African Markets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Task Completion Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Created"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Machine learning insights for task optimization and team performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {aiInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${getImpactColor(insight.impact)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confidence
                          </Badge>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      {insight.actionable && (
                        <Button size="sm" variant="outline" className="mt-2">
                          <Zap className="h-3 w-3 mr-1" />
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Trends</CardTitle>
              <CardDescription>
                Track team efficiency and identify optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                    name="Efficiency %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Analytics Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {member.member.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{member.member}</h4>
                        <p className="text-sm text-muted-foreground">
                          {member.completed} tasks completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-sm font-medium">{member.efficiency}%</div>
                        <div className="text-xs text-muted-foreground">Efficiency</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{member.avgTime}h</div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                      </div>
                      <Badge variant={member.efficiency > 90 ? "default" : member.efficiency > 80 ? "secondary" : "destructive"}>
                        {member.efficiency > 90 ? "Excellent" : member.efficiency > 80 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Integration Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Integration Performance</CardTitle>
              <CardDescription>
                How tasks integrate with your marketing workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={workflowIntegrationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="workflow" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="tasks" fill="#3b82f6" name="Total Tasks" />
                  <Bar yAxisId="right" dataKey="completion" fill="#10b981" name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* African Markets Tab */}
        <TabsContent value="african" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                African Market Performance
              </CardTitle>
              <CardDescription>
                Task performance optimized for African markets and cultural contexts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Country Performance</h4>
                  {africanMarketInsights.map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {country.country.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-medium">{country.country}</h5>
                          <p className="text-sm text-muted-foreground">
                            {country.tasks} tasks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-sm font-medium">{country.completion}%</div>
                          <div className="text-xs text-muted-foreground">Completion</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{country.culturalScore}%</div>
                          <div className="text-xs text-muted-foreground">Cultural Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={africanMarketInsights}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completion" fill="#f59e0b" name="Completion Rate %" />
                      <Bar dataKey="culturalScore" fill="#8b5cf6" name="Cultural Optimization %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cultural Insights */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Cultural Intelligence Insights
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="text-sm">
                    <strong>Best Performance:</strong> Kenya (92% completion during 9-11 AM WAT)
                  </div>
                  <div className="text-sm">
                    <strong>Optimization Opportunity:</strong> Egypt (adjust for Ramadan timing)
                  </div>
                  <div className="text-sm">
                    <strong>Mobile Focus:</strong> 94% of tasks accessed via mobile in Nigeria
                  </div>
                  <div className="text-sm">
                    <strong>Language Impact:</strong> Local language tasks show 23% higher engagement
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}