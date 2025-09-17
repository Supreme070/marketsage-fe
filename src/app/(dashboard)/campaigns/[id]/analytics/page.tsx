"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  MessageSquare,
  MessageCircle,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Clock,
  Target,
  Zap,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Layers,
  Brain,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useUnifiedCampaigns, ChannelType, CampaignStatus } from "@/lib/api/hooks/useUnifiedCampaigns";

interface CampaignAnalytics {
  id: string;
  name: string;
  channels: ChannelType[];
  status: CampaignStatus;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  cost: number;
  roi: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  channelBreakdown: {
    channel: ChannelType;
    recipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
    cost: number;
  }[];
  timeline: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  }[];
  topPerformingSegments: {
    segmentId: string;
    segmentName: string;
    recipients: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }[];
  deviceBreakdown: {
    device: string;
    opens: number;
    clicks: number;
    conversions: number;
  }[];
  locationBreakdown: {
    country: string;
    opens: number;
    clicks: number;
    conversions: number;
  }[];
}

interface UnifiedAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalRevenue: number;
  totalCost: number;
  overallROI: number;
  overallOpenRate: number;
  overallClickRate: number;
  overallConversionRate: number;
  channelPerformance: {
    channel: ChannelType;
    campaigns: number;
    recipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
    cost: number;
    roi: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }[];
  topPerformingCampaigns: CampaignAnalytics[];
  recentActivity: {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    status: string;
  }[];
}

export default function UnifiedAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const { getUnifiedCampaignAnalytics } = useUnifiedCampaigns();
  
  const [analytics, setAnalytics] = useState<UnifiedAnalytics | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId, dateRange, selectedChannel]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const analyticsData = await getUnifiedCampaignAnalytics(campaignId, {
        dateRange,
        channel: selectedChannel === "all" ? undefined : selectedChannel as ChannelType,
      });
      setAnalytics(analyticsData.unified);
      setCampaignAnalytics(analyticsData.campaign);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: ChannelType) => {
    switch (channel) {
      case ChannelType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case ChannelType.SMS:
        return <MessageSquare className="h-4 w-4" />;
      case ChannelType.WHATSAPP:
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: ChannelType) => {
    switch (channel) {
      case ChannelType.EMAIL:
        return "bg-blue-500";
      case ChannelType.SMS:
        return "bg-green-500";
      case ChannelType.WHATSAPP:
        return "bg-emerald-500";
      default:
        return "bg-purple-500";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) {
      return "text-green-500";
    } else if (current < previous) {
      return "text-red-500";
    }
    return "text-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-500">Error Loading Analytics</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaign Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your multi-channel campaign performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value={ChannelType.EMAIL}>Email</SelectItem>
              <SelectItem value={ChannelType.SMS}>SMS</SelectItem>
              <SelectItem value={ChannelType.WHATSAPP}>WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics?.totalRecipients || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Users className="mr-1 h-3 w-3" />
              Across all channels
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analytics?.overallOpenRate || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getTrendIcon(analytics?.overallOpenRate || 0, 0)}
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analytics?.overallClickRate || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getTrendIcon(analytics?.overallClickRate || 0, 0)}
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analytics?.overallConversionRate || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getTrendIcon(analytics?.overallConversionRate || 0, 0)}
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & ROI */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <DollarSign className="mr-1 h-3 w-3" />
              Generated revenue
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.totalCost || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <DollarSign className="mr-1 h-3 w-3" />
              Campaign costs
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analytics?.overallROI || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Target className="mr-1 h-3 w-3" />
              Return on investment
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>
            Performance breakdown by communication channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.channelPerformance.map((channel) => (
              <div key={channel.channel} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${getChannelColor(channel.channel)} text-white`}>
                      {getChannelIcon(channel.channel)}
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{channel.channel}</h3>
                      <p className="text-sm text-muted-foreground">{channel.campaigns} campaigns</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(channel.revenue)}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatNumber(channel.recipients)}</div>
                    <div className="text-xs text-muted-foreground">Recipients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatPercentage(channel.openRate)}</div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatPercentage(channel.clickRate)}</div>
                    <div className="text-xs text-muted-foreground">Click Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatPercentage(channel.conversionRate)}</div>
                    <div className="text-xs text-muted-foreground">Conversion Rate</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Open Rate</span>
                    <span>{formatPercentage(channel.openRate)}</span>
                  </div>
                  <Progress value={channel.openRate} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Click Rate</span>
                    <span>{formatPercentage(channel.clickRate)}</span>
                  </div>
                  <Progress value={channel.clickRate} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Conversion Rate</span>
                    <span>{formatPercentage(channel.conversionRate)}</span>
                  </div>
                  <Progress value={channel.conversionRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
          <CardDescription>
            Your best-performing campaigns ranked by ROI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.topPerformingCampaigns.slice(0, 5).map((campaign, index) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {campaign.channels.map((channel) => (
                        <div key={channel} className="flex items-center space-x-1">
                          {getChannelIcon(channel)}
                          <span className="capitalize">{channel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{formatPercentage(campaign.roi)}</div>
                  <div className="text-sm text-muted-foreground">ROI</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{formatCurrency(campaign.revenue)}</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{formatNumber(campaign.totalRecipients)}</div>
                  <div className="text-sm text-muted-foreground">Recipients</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and events from your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {activity.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : activity.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Activity className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{activity.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
