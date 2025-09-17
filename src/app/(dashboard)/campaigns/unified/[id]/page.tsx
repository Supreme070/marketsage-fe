"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Target,
  Workflow,
  Layers,
  Mail,
  MessageSquare,
  MessageCircle,
  Users,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Eye,
  ArrowRight,
  Brain,
  Zap,
  Award,
  Calendar,
  DollarSign,
  Percent,
  MousePointer,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useUnifiedCampaigns, ChannelType, CampaignStatus, ABTestStatus, WorkflowStatus } from "@/lib/api/hooks/useUnifiedCampaigns";

interface CampaignOverview {
  id: string;
  name: string;
  description?: string;
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
  abTests: {
    id: string;
    name: string;
    status: ABTestStatus;
    variants: number;
    winnerVariantId?: string;
  }[];
  workflows: {
    id: string;
    name: string;
    status: WorkflowStatus;
    executions: number;
    lastExecution?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function CampaignOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const { getUnifiedCampaignById } = useUnifiedCampaigns();
  
  const [campaign, setCampaign] = useState<CampaignOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const campaignData = await getUnifiedCampaignById(campaignId);
      setCampaign(campaignData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campaign');
      console.error('Failed to fetch campaign:', err);
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

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.DRAFT:
        return <Badge variant="outline">Draft</Badge>;
      case CampaignStatus.SCHEDULED:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Scheduled</Badge>;
      case CampaignStatus.ACTIVE:
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case CampaignStatus.COMPLETED:
        return <Badge variant="default" className="bg-gray-500 hover:bg-gray-600">Completed</Badge>;
      case CampaignStatus.PAUSED:
        return <Badge variant="secondary"><Pause className="mr-1 h-3 w-3" />Paused</Badge>;
      case CampaignStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getABTestStatusBadge = (status: ABTestStatus) => {
    switch (status) {
      case ABTestStatus.DRAFT:
        return <Badge variant="outline">Draft</Badge>;
      case ABTestStatus.RUNNING:
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Running</Badge>;
      case ABTestStatus.PAUSED:
        return <Badge variant="secondary">Paused</Badge>;
      case ABTestStatus.COMPLETED:
        return <Badge variant="default" className="bg-gray-500 hover:bg-gray-600">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getWorkflowStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.ACTIVE:
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case WorkflowStatus.INACTIVE:
        return <Badge variant="outline">Inactive</Badge>;
      case WorkflowStatus.DRAFT:
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          Loading campaign overview...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-500">Error Loading Campaign</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Campaign Not Found</h3>
          <p className="text-muted-foreground">The requested campaign could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{campaign.name}</h2>
          {campaign.description && (
            <p className="text-muted-foreground mt-1">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(campaign.status)}
          <Button variant="outline" asChild>
            <Link href={`/campaigns/unified/${campaign.id}`}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(campaign.totalRecipients)}</div>
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
            <div className="text-2xl font-bold">{formatPercentage(campaign.openRate)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Eye className="mr-1 h-3 w-3" />
              {formatNumber(campaign.opened)} opens
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(campaign.clickRate)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <MousePointer className="mr-1 h-3 w-3" />
              {formatNumber(campaign.clicked)} clicks
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(campaign.roi)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <DollarSign className="mr-1 h-3 w-3" />
              {formatCurrency(campaign.revenue)} revenue
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>
            Multi-channel campaign distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {campaign.channels.map((channel) => (
              <div key={channel} className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${getChannelColor(channel)} text-white`}>
                  {getChannelIcon(channel)}
                </div>
                <span className="font-medium capitalize">{channel}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* A/B Tests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  A/B Tests
                </CardTitle>
                <CardDescription>
                  Test different versions to optimize performance
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/campaigns/unified/${campaign.id}/ab-tests`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaign.abTests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No A/B tests created yet</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/campaigns/unified/${campaign.id}/ab-tests`}>
                      Create A/B Test
                    </Link>
                  </Button>
                </div>
              ) : (
                campaign.abTests.slice(0, 3).map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{test.name}</h4>
                      <p className="text-sm text-muted-foreground">{test.variants} variants</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getABTestStatusBadge(test.status)}
                      {test.winnerVariantId && (
                        <Badge variant="secondary">
                          <Award className="mr-1 h-3 w-3" />
                          Winner Found
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflows */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Workflow className="mr-2 h-5 w-5" />
                  Workflows
                </CardTitle>
                <CardDescription>
                  Automated processes and triggers
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/campaigns/unified/${campaign.id}/workflows`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaign.workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No workflows created yet</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/campaigns/unified/${campaign.id}/workflows`}>
                      Create Workflow
                    </Link>
                  </Button>
                </div>
              ) : (
                campaign.workflows.slice(0, 3).map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{workflow.name}</h4>
                      <p className="text-sm text-muted-foreground">{workflow.executions} executions</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getWorkflowStatusBadge(workflow.status)}
                      {workflow.lastExecution && (
                        <span className="text-xs text-muted-foreground">
                          Last: {new Date(workflow.lastExecution).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Detailed performance breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Delivery Rate</span>
                <span>{formatPercentage((campaign.delivered / campaign.sent) * 100)}</span>
              </div>
              <Progress value={(campaign.delivered / campaign.sent) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Open Rate</span>
                <span>{formatPercentage(campaign.openRate)}</span>
              </div>
              <Progress value={campaign.openRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Click Rate</span>
                <span>{formatPercentage(campaign.clickRate)}</span>
              </div>
              <Progress value={campaign.clickRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span>{formatPercentage(campaign.conversionRate)}</span>
              </div>
              <Progress value={campaign.conversionRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Revenue per Recipient</span>
                <span>{formatCurrency(campaign.revenue / campaign.totalRecipients)}</span>
              </div>
              <Progress value={Math.min((campaign.revenue / campaign.totalRecipients) * 10, 100)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cost per Recipient</span>
                <span>{formatCurrency(campaign.cost / campaign.totalRecipients)}</span>
              </div>
              <Progress value={Math.min((campaign.cost / campaign.totalRecipients) * 10, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href={`/campaigns/unified/${campaign.id}/analytics`}>
                <BarChart3 className="h-6 w-6 mb-2" />
                <span>View Analytics</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href={`/campaigns/unified/${campaign.id}/ab-tests`}>
                <Target className="h-6 w-6 mb-2" />
                <span>A/B Testing</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href={`/campaigns/unified/${campaign.id}/workflows`}>
                <Workflow className="h-6 w-6 mb-2" />
                <span>Workflows</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href={`/campaigns/unified/${campaign.id}`}>
                <Settings className="h-6 w-6 mb-2" />
                <span>Edit Campaign</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
