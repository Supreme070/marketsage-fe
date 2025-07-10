"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  MessageSquare, 
  Mail, 
  Phone, 
  Users, 
  Activity,
  Target,
  Wallet,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Plus
} from 'lucide-react';
import { CreditPurchaseModal } from '@/components/messaging/credit-purchase-modal';

interface MessagingAnalytics {
  organization: {
    creditBalance: number;
    messagingModel: string;
    autoTopUp: boolean;
    region: string;
  };
  summary: {
    sms: { messages: number; credits: number };
    email: { messages: number; credits: number };
    whatsapp: { messages: number; credits: number };
  };
  dailyBreakdown: Record<string, { sms: number; email: number; whatsapp: number; totalCredits: number }>;
  providerBreakdown: Record<string, { 
    messages: number; 
    credits: number; 
    channels: Record<string, { messages: number; credits: number }> 
  }>;
  costAnalysis: {
    totalCreditsUsed: number;
    totalCreditsSpent: number;
    costPerMessage: number;
    costPerChannel: {
      sms: number;
      email: number;
      whatsapp: number;
    };
  };
  roiMetrics: {
    totalSpent: number;
    messagesDelivered: number;
    estimatedReach: number;
    costEfficiency: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
    paymentMethod: string;
  }>;
  timeframe: {
    start: string;
    end: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function MessagingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<MessagingAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/messaging/analytics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Analytics Unavailable</h1>
            <p className="text-muted-foreground">Unable to load messaging analytics at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalMessages = analytics.summary.sms.messages + analytics.summary.email.messages + analytics.summary.whatsapp.messages;
  const totalCredits = analytics.summary.sms.credits + analytics.summary.email.credits + analytics.summary.whatsapp.credits;

  // Prepare chart data
  const dailyData = Object.entries(analytics.dailyBreakdown)
    .map(([date, data]) => ({
      date,
      sms: data.sms,
      email: data.email,
      whatsapp: data.whatsapp,
      totalCredits: data.totalCredits
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const channelData = [
    { name: 'SMS', value: analytics.summary.sms.messages, color: '#0088FE' },
    { name: 'Email', value: analytics.summary.email.messages, color: '#00C49F' },
    { name: 'WhatsApp', value: analytics.summary.whatsapp.messages, color: '#FFBB28' }
  ].filter(item => item.value > 0);

  const providerData = Object.entries(analytics.providerBreakdown).map(([name, data]) => ({
    name,
    messages: data.messages,
    credits: data.credits
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Messaging Analytics</h1>
              <p className="text-muted-foreground">Track your messaging costs, usage, and ROI</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadAnalytics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                        <p className="text-2xl font-bold">{totalMessages.toLocaleString()}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalCredits)}</p>
                      </div>
                      <Wallet className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cost per Message</p>
                        <p className="text-2xl font-bold">{formatCurrency(analytics.costAnalysis.costPerMessage)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Credit Balance</p>
                        <p className="text-2xl font-bold">{formatCurrency(analytics.organization.creditBalance)}</p>
                        <CreditPurchaseModal 
                          currentBalance={analytics.organization.creditBalance}
                          onPurchaseComplete={() => loadAnalytics()}
                          region={analytics.organization.region}
                        >
                          <Button size="sm" variant="outline" className="mt-2">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Credits
                          </Button>
                        </CreditPurchaseModal>
                      </div>
                      <Activity className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Message Distribution</CardTitle>
                    <CardDescription>Messages by channel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Daily Usage Trend</CardTitle>
                    <CardDescription>Messages sent over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="sms" stackId="1" stroke="#0088FE" fill="#0088FE" />
                        <Area type="monotone" dataKey="email" stackId="1" stroke="#00C49F" fill="#00C49F" />
                        <Area type="monotone" dataKey="whatsapp" stackId="1" stroke="#FFBB28" fill="#FFBB28" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* ROI Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>ROI Metrics</CardTitle>
                  <CardDescription>Return on investment analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(analytics.roiMetrics.totalSpent)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.roiMetrics.messagesDelivered.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Messages Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(analytics.roiMetrics.estimatedReach).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Estimated Reach</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(analytics.roiMetrics.costEfficiency)}
                      </div>
                      <div className="text-sm text-muted-foreground">Cost Efficiency</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage by Channel</CardTitle>
                  <CardDescription>Message volume across all channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sms" fill="#0088FE" name="SMS" />
                      <Bar dataKey="email" fill="#00C49F" name="Email" />
                      <Bar dataKey="whatsapp" fill="#FFBB28" name="WhatsApp" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">SMS Messages</p>
                        <p className="text-2xl font-bold text-blue-600">{analytics.summary.sms.messages.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Cost: {formatCurrency(analytics.summary.sms.credits)}</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">Email Messages</p>
                        <p className="text-2xl font-bold text-green-600">{analytics.summary.email.messages.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Cost: {formatCurrency(analytics.summary.email.credits)}</p>
                      </div>
                      <Mail className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">WhatsApp Messages</p>
                        <p className="text-2xl font-bold text-yellow-600">{analytics.summary.whatsapp.messages.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Cost: {formatCurrency(analytics.summary.whatsapp.credits)}</p>
                      </div>
                      <Phone className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="costs">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Analysis</CardTitle>
                  <CardDescription>Detailed breakdown of messaging costs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(analytics.costAnalysis.costPerChannel.sms)}
                      </div>
                      <div className="text-sm text-muted-foreground">Cost per SMS</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(analytics.costAnalysis.costPerChannel.email)}
                      </div>
                      <div className="text-sm text-muted-foreground">Cost per Email</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(analytics.costAnalysis.costPerChannel.whatsapp)}
                      </div>
                      <div className="text-sm text-muted-foreground">Cost per WhatsApp</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(analytics.costAnalysis.costPerMessage)}
                      </div>
                      <div className="text-sm text-muted-foreground">Average Cost</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Credit purchases and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="providers">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Provider Performance</CardTitle>
                  <CardDescription>Usage and cost breakdown by provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={providerData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="messages" fill="#0088FE" name="Messages" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(analytics.providerBreakdown).map(([provider, data]) => (
                  <Card key={provider}>
                    <CardHeader>
                      <CardTitle className="capitalize">{provider}</CardTitle>
                      <CardDescription>Provider performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Total Messages</span>
                          <span className="text-sm">{data.messages.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Total Credits</span>
                          <span className="text-sm">{formatCurrency(data.credits)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Cost per Message</span>
                          <span className="text-sm">{formatCurrency(data.credits / data.messages)}</span>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">By Channel</h4>
                          {Object.entries(data.channels).map(([channel, channelData]) => (
                            <div key={channel} className="flex justify-between text-sm">
                              <span className="capitalize">{channel}</span>
                              <span>{channelData.messages} messages</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}