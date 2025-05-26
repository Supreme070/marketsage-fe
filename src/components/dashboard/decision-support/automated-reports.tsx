"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { FileText, Download, Mail, MessageSquare, Users, Clock, TrendingUp, Star, AlertCircle } from "lucide-react";

interface ReportData {
  performanceMetrics: {
    totalCampaigns: number;
    totalRevenue: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
    totalContacts: number;
    newContacts: number;
    unsubscribeRate: number;
  };
  channelPerformance: Array<{
    channel: string;
    campaigns: number;
    openRate: number;
    clickRate: number;
    revenue: number;
    color: string;
  }>;
  audienceBehavior: Array<{
    segment: string;
    size: number;
    engagement: number;
    revenue: number;
  }>;
  contentEffectiveness: Array<{
    type: string;
    count: number;
    avgPerformance: number;
    topPerformer: string;
  }>;
  timeBasedTrends: Array<{
    date: string;
    emails: number;
    sms: number;
    whatsapp: number;
    engagement: number;
  }>;
  insights: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    title: string;
    description: string;
    impact: string;
    recommendation: string;
  }>;
}

export function AutomatedReports() {
  const [reportPeriod, setReportPeriod] = useState("last30days");
  const [reportType, setReportType] = useState("comprehensive");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateReport();
  }, [reportPeriod, reportType]);

  const generateReport = async () => {
    setIsGenerating(true);
    
    // Simulate API call to generate report
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockData: ReportData = {
      performanceMetrics: {
        totalCampaigns: 47,
        totalRevenue: 2450000,
        avgOpenRate: 24.8,
        avgClickRate: 4.2,
        avgConversionRate: 2.1,
        totalContacts: 12847,
        newContacts: 1235,
        unsubscribeRate: 0.8
      },
      channelPerformance: [
        { channel: "Email", campaigns: 28, openRate: 22.5, clickRate: 3.8, revenue: 1200000, color: "#3b82f6" },
        { channel: "SMS", campaigns: 12, openRate: 32.1, clickRate: 8.2, revenue: 680000, color: "#10b981" },
        { channel: "WhatsApp", campaigns: 7, openRate: 45.6, clickRate: 12.4, revenue: 570000, color: "#f59e0b" }
      ],
      audienceBehavior: [
        { segment: "High Engaged", size: 2847, engagement: 89, revenue: 1200000 },
        { segment: "Medium Engaged", size: 6420, engagement: 54, revenue: 850000 },
        { segment: "Low Engaged", size: 3580, engagement: 23, revenue: 400000 }
      ],
      contentEffectiveness: [
        { type: "Promotional", count: 15, avgPerformance: 78, topPerformer: "Black Friday Sale" },
        { type: "Educational", count: 18, avgPerformance: 65, topPerformer: "Marketing Tips Series" },
        { type: "Newsletter", count: 12, avgPerformance: 58, topPerformer: "Weekly Digest #47" },
        { type: "Transactional", count: 8, avgPerformance: 85, topPerformer: "Order Confirmation" }
      ],
      timeBasedTrends: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          emails: Math.floor(Math.random() * 50) + 20,
          sms: Math.floor(Math.random() * 30) + 10,
          whatsapp: Math.floor(Math.random() * 20) + 5,
          engagement: Math.floor(Math.random() * 40) + 50
        };
      }),
      insights: [
        {
          priority: "high",
          category: "Performance",
          title: "WhatsApp Shows Exceptional ROI",
          description: "WhatsApp campaigns have 35% higher engagement and 28% better conversion rates compared to other channels.",
          impact: "₦570,000 revenue from just 7 campaigns",
          recommendation: "Increase WhatsApp campaign frequency and budget allocation by 40%"
        },
        {
          priority: "high",
          category: "Audience",
          title: "High-Engaged Segment Underutilized",
          description: "Your most engaged audience segment (2,847 contacts) generated 49% of total revenue but received only 23% of campaigns.",
          impact: "Potential revenue increase of ₦400,000",
          recommendation: "Create dedicated campaigns for high-engaged segment with premium offers"
        },
        {
          priority: "medium",
          category: "Content",
          title: "Promotional Content Outperforms Educational",
          description: "Promotional content has 20% higher engagement rates than educational content in the Nigerian market.",
          impact: "12% increase in overall engagement",
          recommendation: "Shift content mix to 60% promotional, 40% educational for optimal results"
        },
        {
          priority: "medium",
          category: "Timing",
          title: "Tuesday-Wednesday Peak Performance",
          description: "Campaigns sent on Tuesday and Wednesday show 25% higher open rates and 18% better click-through rates.",
          impact: "Improved campaign effectiveness",
          recommendation: "Schedule important campaigns for Tuesday 10 AM and Wednesday 2 PM"
        },
        {
          priority: "low",
          category: "Technical",
          title: "Mobile Optimization Opportunity",
          description: "78% of your audience opens emails on mobile devices, but current templates may not be fully optimized.",
          impact: "Potential 15% improvement in engagement",
          recommendation: "Audit and optimize all email templates for mobile viewing"
        }
      ]
    };

    setReportData(mockData);
    setIsGenerating(false);
  };

  const downloadReport = (format: string) => {
    // In a real app, this would generate and download the actual report
    const reportContent = {
      period: reportPeriod,
      type: reportType,
      data: reportData,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketsage-report-${reportPeriod}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <FileText className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-medium mb-2">Generating Your Report</h3>
          <p className="text-muted-foreground">AI is analyzing your marketing data...</p>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Period:</label>
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Type:</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
                <SelectItem value="performance">Performance Only</SelectItem>
                <SelectItem value="audience">Audience Insights</SelectItem>
                <SelectItem value="content">Content Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => downloadReport('json')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => downloadReport('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button 
            size="sm"
            onClick={generateReport}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Overview</CardTitle>
          <CardDescription>Key metrics for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{reportData.performanceMetrics.totalCampaigns}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">₦{reportData.performanceMetrics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg. Open Rate</p>
              <p className="text-2xl font-bold">{reportData.performanceMetrics.avgOpenRate}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg. Conversion</p>
              <p className="text-2xl font-bold">{reportData.performanceMetrics.avgConversionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channel Performance</CardTitle>
            <CardDescription>Revenue distribution by marketing channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.channelPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ channel, value }) => `${channel}: ₦${(value / 1000).toFixed(0)}K`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {reportData.channelPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₦${value.toLocaleString()}`, "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audience Segments</CardTitle>
            <CardDescription>Performance by engagement level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.audienceBehavior}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === "revenue" ? `₦${value.toLocaleString()}` : value.toLocaleString(),
                      name === "revenue" ? "Revenue" : name === "size" ? "Contacts" : "Engagement %"
                    ]}
                  />
                  <Bar dataKey="size" fill="#94a3b8" name="size" />
                  <Bar dataKey="engagement" fill="#3b82f6" name="engagement" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Effectiveness</CardTitle>
          <CardDescription>Performance analysis by content type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.contentEffectiveness.map((content, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{content.type}</h4>
                    <Badge variant="secondary">{content.count} campaigns</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Top performer: {content.topPerformer}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{content.avgPerformance}%</span>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Avg. performance</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Trends</CardTitle>
          <CardDescription>Daily campaign volume and engagement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.timeBasedTrends}>
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
                />
                <Line type="monotone" dataKey="emails" stroke="#3b82f6" name="Email Campaigns" />
                <Line type="monotone" dataKey="sms" stroke="#10b981" name="SMS Campaigns" />
                <Line type="monotone" dataKey="whatsapp" stroke="#f59e0b" name="WhatsApp Campaigns" />
                <Line type="monotone" dataKey="engagement" stroke="#ef4444" name="Engagement %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI-Generated Insights
          </CardTitle>
          <CardDescription>
            Prioritized recommendations based on data analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.insights.map((insight, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {insight.category}
                    </Badge>
                    <Badge 
                      variant={insight.priority === "high" ? "destructive" : insight.priority === "medium" ? "default" : "secondary"}
                    >
                      {insight.priority} priority
                    </Badge>
                  </div>
                  {insight.priority === "high" && <AlertCircle className="h-5 w-5 text-red-600" />}
                </div>
                
                <h4 className="font-semibold mb-2">{insight.title}</h4>
                <p className="text-sm mb-2">{insight.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Impact:</span>
                    <span className="text-xs">{insight.impact}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium">Action:</span>
                    <span className="text-xs">{insight.recommendation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Report generated:</strong> {new Date().toLocaleString('en-NG')}
            </p>
            <p>
              <strong>Data period:</strong> {reportPeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </p>
            <p>
              <strong>Analysis type:</strong> {reportType}
            </p>
            <p>
              <strong>AI insights:</strong> {reportData.insights.length} recommendations identified
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 