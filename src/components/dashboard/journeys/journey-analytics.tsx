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
  XCircle,
  ArrowRight,
  Filter,
  Download
} from "lucide-react";

export function JourneyAnalytics() {
  const [selectedJourney, setSelectedJourney] = useState("all");
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data for journey analytics
  const journeyPerformance = [
    { name: "Welcome Onboarding", contacts: 1247, completed: 856, rate: 68.6, revenue: 125000 },
    { name: "Product Discovery", contacts: 892, completed: 634, rate: 71.1, revenue: 89000 },
    { name: "Re-engagement", contacts: 567, completed: 234, rate: 41.3, revenue: 45000 },
    { name: "Seasonal Promotion", contacts: 445, completed: 378, rate: 84.9, revenue: 156000 },
    { name: "Retention Campaign", contacts: 334, completed: 267, rate: 79.9, revenue: 78000 }
  ];

  const stepAnalytics = [
    { step: "Welcome Email", entered: 1247, completed: 1198, rate: 96.1, avgTime: "2m" },
    { step: "Wait 1 Day", entered: 1198, completed: 1198, rate: 100, avgTime: "24h" },
    { step: "Follow-up Email", entered: 1198, completed: 967, rate: 80.7, avgTime: "5m" },
    { step: "Condition: Opened?", entered: 967, completed: 856, rate: 88.5, avgTime: "1m" },
    { step: "Product Demo", entered: 856, completed: 634, rate: 74.1, avgTime: "15m" },
    { step: "Final CTA", entered: 634, completed: 456, rate: 71.9, avgTime: "3m" }
  ];

  const engagementTrend = [
    { date: "2024-01-01", engagement: 65, completion: 58 },
    { date: "2024-01-02", engagement: 68, completion: 61 },
    { date: "2024-01-03", engagement: 72, completion: 65 },
    { date: "2024-01-04", engagement: 69, completion: 63 },
    { date: "2024-01-05", engagement: 74, completion: 68 },
    { date: "2024-01-06", engagement: 71, completion: 66 },
    { date: "2024-01-07", engagement: 76, completion: 71 }
  ];

  const channelPerformance = [
    { channel: "Email", value: 45, color: "#3b82f6" },
    { channel: "SMS", value: 30, color: "#10b981" },
    { channel: "WhatsApp", value: 25, color: "#f59e0b" }
  ];

  const getStatusIcon = (rate: number) => {
    if (rate >= 70) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (rate >= 50) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 70) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  // Handle filter action
  const handleFilter = () => {
    console.log("Opening journey filters...");
    // This could open a filter dialog with advanced options
  };

  // Handle export action
  const handleExport = () => {
    console.log("Exporting journey analytics...");
    
    // Create export data
    const exportData = journeyPerformance.map(journey => ({
      'Journey Name': journey.name,
      'Total Contacts': journey.contacts,
      'Completed': journey.completed,
      'Completion Rate (%)': journey.rate,
      'Revenue (₦)': journey.revenue
    }));
    
    console.log("Export data:", exportData);
    alert("Journey analytics would be exported as CSV file with performance data");
  };

  // Handle journey drill-down
  const handleJourneyDrillDown = (journey: any) => {
    console.log("Drilling down into journey:", journey.name);
    setSelectedJourney(journey.name.toLowerCase().replace(' ', ''));
  };

  // Handle step analysis
  const handleStepAnalysis = (step: any, index: number) => {
    console.log("Analyzing step:", step.step, "at position", index + 1);
    // This could open a detailed step analysis dialog
  };

  // Handle AI insight action
  const handleInsightAction = (insight: any) => {
    console.log("Taking action on insight:", insight.title);
    
    switch (insight.type) {
      case "bottleneck":
        console.log("Opening A/B test setup for bottleneck resolution");
        break;
      case "optimization":
        console.log("Opening timing optimization settings");
        break;
      case "segmentation":
        console.log("Opening segment creation tool");
        break;
      case "content":
        console.log("Opening content optimization recommendations");
        break;
      default:
        console.log("Unknown insight type");
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Journey Analytics</CardTitle>
              <CardDescription>
                Comprehensive insights into your customer journey performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFilter}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Journey</label>
              <Select value={selectedJourney} onValueChange={setSelectedJourney}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Journeys</SelectItem>
                  <SelectItem value="welcome">Welcome Onboarding</SelectItem>
                  <SelectItem value="discovery">Product Discovery</SelectItem>
                  <SelectItem value="reengagement">Re-engagement</SelectItem>
                  <SelectItem value="seasonal">Seasonal Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
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
              <label className="text-sm font-medium">Metric</label>
              <Select defaultValue="completion">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completion">Completion Rate</SelectItem>
                  <SelectItem value="engagement">Engagement Rate</SelectItem>
                  <SelectItem value="revenue">Revenue Impact</SelectItem>
                  <SelectItem value="time">Time to Complete</SelectItem>
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
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,485</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">71.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Complete</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2d</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+0.3d</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦493K</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18.7%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Journey Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Journey Performance</CardTitle>
            <CardDescription>Completion rates and revenue by journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journeyPerformance.map((journey, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleJourneyDrillDown(journey)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(journey.rate)}
                      <span className="font-medium">{journey.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{journey.contacts} contacts</span>
                      <span>{journey.completed} completed</span>
                      <span>₦{(journey.revenue / 1000).toFixed(0)}K revenue</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getStatusColor(journey.rate)}`}>
                      {journey.rate}%
                    </div>
                    <Progress value={journey.rate} className="w-16 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Trend</CardTitle>
            <CardDescription>Daily engagement and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementTrend}>
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
                    formatter={(value: number, name: string) => [`${value}%`, name === "engagement" ? "Engagement" : "Completion"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="engagement"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completion" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="completion"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step-by-Step Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step-by-Step Analysis</CardTitle>
          <CardDescription>Detailed breakdown of journey step performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stepAnalytics.map((step, index) => (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < stepAnalytics.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-200"></div>
                )}
                
                <div 
                  className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleStepAnalysis(step, index)}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{step.step}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{step.entered} entered</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{step.completed} completed</span>
                      <span>Avg: {step.avgTime}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getStatusColor(step.rate)}`}>
                      {step.rate}%
                    </div>
                    <Progress value={step.rate} className="w-20 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channel Performance</CardTitle>
            <CardDescription>Engagement by communication channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ channel, value }) => `${channel}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, "Engagement"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Insights & Recommendations</CardTitle>
            <CardDescription>Intelligent suggestions to improve performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  type: "bottleneck",
                  title: "Bottleneck Detected",
                  description: "Step 3 (Follow-up Email) has 19% drop-off rate. Consider A/B testing subject lines.",
                  priority: "high"
                },
                {
                  type: "optimization",
                  title: "Timing Optimization",
                  description: "Contacts engage 35% more between 6-8 PM. Adjust send times for better results.",
                  priority: "medium"
                },
                {
                  type: "segmentation",
                  title: "Segment Opportunity",
                  description: "Lagos-based contacts show 28% higher completion rates. Create targeted variants.",
                  priority: "medium"
                },
                {
                  type: "content",
                  title: "Content Suggestion",
                  description: "WhatsApp messages perform 40% better than email for follow-ups.",
                  priority: "low"
                }
              ].map((insight, index) => (
                <div 
                  key={index} 
                  className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleInsightAction(insight)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {insight.type === "bottleneck" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {insight.type === "optimization" && <TrendingUp className="h-4 w-4 text-blue-500" />}
                      {insight.type === "segmentation" && <Users className="h-4 w-4 text-green-500" />}
                      {insight.type === "content" && <Target className="h-4 w-4 text-purple-500" />}
                      <span className="font-medium text-sm">{insight.title}</span>
                    </div>
                    <Badge 
                      variant={
                        insight.priority === "high" ? "destructive" :
                        insight.priority === "medium" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsightAction(insight);
                      }}
                    >
                      Apply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Dismissing insight:", insight.title);
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 