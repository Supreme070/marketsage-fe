"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Copy,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  BarChart,
  Clock,
  Send,
  Pause,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  Target
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

// Define campaign type
interface EmailCampaign {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  from: string;
  replyTo: string | null;
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
  } | null;
  lists: {
    id: string;
    name: string;
  }[];
  segments: {
    id: string;
    name: string;
  }[];
  statistics: {
    totalRecipients: number;
  };
  aiOptimization?: {
    subjectOptimization: number;
    contentOptimization: number;
    timingOptimization: number;
    overallAIAdvantage: number;
    predictedPerformance: {
      openRate: number;
      clickRate: number;
      conversionRate: number;
    };
  };
}

export default function EmailCampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState<Record<string, any>>({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<Record<string, boolean>>({});

  // Fetch campaigns from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        // Include status and search query as parameters if they exist
        let url = "/api/email/campaigns";
        const params = new URLSearchParams();
        
        if (statusFilter) {
          params.append("status", statusFilter);
        }
        
        if (searchQuery) {
          params.append("search", searchQuery);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCampaigns(data);
        setError(null);
        
        // Load real analytics for email campaigns
        await loadEmailCampaignAnalytics(data);
        
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
        setError("Failed to load campaigns. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load campaigns. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [statusFilter, searchQuery, toast]);

  // Load real analytics for email campaigns
  const loadEmailCampaignAnalytics = async (campaignList: EmailCampaign[]) => {
    const analytics: Record<string, any> = {};
    
    for (const campaign of campaignList) {
      if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
        setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: true }));
        
        try {
          const response = await fetch(`/api/email/campaigns/${campaign.id}/analytics`);
          if (response.ok) {
            const data = await response.json();
            analytics[campaign.id] = data;
          }
        } catch (error) {
          console.warn(`Failed to load analytics for email campaign ${campaign.id}:`, error);
        } finally {
          setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: false }));
        }
      }
    }
    
    setCampaignAnalytics(analytics);
  };

  // Refresh analytics for individual email campaign
  const handleRefreshAnalytics = async (campaign: EmailCampaign) => {
    setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: true }));
    
    try {
      const response = await fetch(`/api/email/campaigns/${campaign.id}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setCampaignAnalytics(prev => ({ ...prev, [campaign.id]: data }));
        toast({
          title: "Analytics Refreshed",
          description: "Campaign analytics updated successfully",
        });
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
      toast({
        title: "Error",
        description: "Failed to refresh analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: false }));
    }
  };

  // Calculate status counts for filter
  const statusCounts = {
    DRAFT: campaigns.filter((c) => c.status === "DRAFT").length,
    SCHEDULED: campaigns.filter((c) => c.status === "SCHEDULED").length,
    SENDING: campaigns.filter((c) => c.status === "SENDING").length,
    SENT: campaigns.filter((c) => c.status === "SENT").length,
    PAUSED: campaigns.filter((c) => c.status === "PAUSED").length,
  };

  // Filter campaigns based on search query and filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Only filter by status locally if it wasn't already filtered on the server
    if (statusFilter && campaign.status !== statusFilter) {
      return false;
    }

    // Only filter by search locally if it wasn't already filtered on the server
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (!campaign.name.toLowerCase().includes(searchLower) && 
          !campaign.subject.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const handleCreateCampaign = () => {
    router.push("/email/campaigns/create");
  };

  const handleViewCampaign = (id: string) => {
    router.push(`/email/campaigns/${id}`);
  };

  const handleEditCampaign = (id: string) => {
    router.push(`/email/campaigns/edit/${id}`);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        const response = await fetch(`/api/email/campaigns/${id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        // Remove campaign from state
        setCampaigns(campaigns.filter(campaign => campaign.id !== id));
        
        toast({
          title: "Success",
          description: "Campaign deleted successfully",
        });
      } catch (err) {
        console.error("Failed to delete campaign:", err);
        toast({
          title: "Error",
          description: "Failed to delete campaign. Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDuplicateCampaign = async (id: string) => {
    try {
      const response = await fetch(`/api/v2/email/campaigns/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: result.message,
        });
        // Refresh campaigns list
        fetchCampaigns();
      } else {
        throw new Error(`Error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate campaign",
        variant: "destructive",
      });
    }
  };

  const getFormattedDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Get analytics summary
  const getAnalyticsSummary = () => {
    const campaignsWithAnalytics = Object.keys(campaignAnalytics).length;
    const avgOpenRate = campaignsWithAnalytics > 0 
      ? Object.values(campaignAnalytics).reduce((sum, analytics: any) => 
          sum + (analytics.openRate || 0), 0) / campaignsWithAnalytics
      : 0;
    const avgClickRate = campaignsWithAnalytics > 0 
      ? Object.values(campaignAnalytics).reduce((sum, analytics: any) => 
          sum + (analytics.clickRate || 0), 0) / campaignsWithAnalytics
      : 0;
    return { campaignsWithAnalytics, avgOpenRate, avgClickRate };
  };
  
  const { campaignsWithAnalytics, avgOpenRate, avgClickRate } = getAnalyticsSummary();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage email marketing campaigns with real-time analytics and performance tracking.
          </p>
          {campaignsWithAnalytics > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-900/20">
                <BarChart className="h-3 w-3 mr-1" />
                {campaignsWithAnalytics} Campaigns with Analytics
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                {avgOpenRate.toFixed(1)}% Avg Open Rate
              </Badge>
            </div>
          )}
        </div>
        <Button onClick={handleCreateCampaign}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Email Analytics Overview */}
      {campaignsWithAnalytics > 0 && (
        <Card className="bg-gradient-to-r from-blue-950/50 to-green-950/50 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-400" />
              Email Campaign Analytics
            </CardTitle>
            <CardDescription>
              Real-time performance data from your email marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-blue-300">Active Campaigns</span>
                </div>
                <div className="text-2xl font-bold text-blue-100">{campaignsWithAnalytics}</div>
                <p className="text-xs text-blue-200">Campaigns with analytics data</p>
              </div>
              
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-green-300">Open Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-100">{avgOpenRate.toFixed(1)}%</div>
                <p className="text-xs text-green-200">Average email open rate</p>
              </div>
              
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-purple-300">Click Rate</span>
                </div>
                <div className="text-2xl font-bold text-purple-100">{avgClickRate.toFixed(1)}%</div>
                <p className="text-xs text-purple-200">Average click-through rate</p>
              </div>
              
              <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="h-4 w-4 text-orange-400" />
                  <span className="font-medium text-orange-300">Total Sent</span>
                </div>
                <div className="text-2xl font-bold text-orange-100">
                  {Object.values(campaignAnalytics).reduce((sum, analytics: any) => 
                    sum + (analytics.sent || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-orange-200">Total emails delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            View and manage your email marketing campaigns with real-time analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search campaigns..."
                  className="pl-8 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                    {statusFilter && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <DropdownMenuItem
                      key={status}
                      className="flex items-center justify-between"
                      onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                    >
                      <span className="flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            statusFilter === status
                              ? "bg-primary"
                              : "bg-transparent border border-muted"
                          }`}
                        ></div>
                        <span>{status.toLowerCase()}</span>
                      </span>
                      <Badge variant="outline" className="ml-2">
                        {count}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredCampaigns.length}</strong> of{" "}
              <strong>{campaigns.length}</strong> campaigns
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading campaigns...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No campaigns found. {searchQuery || statusFilter ? "Try adjusting your filters." : "Create your first campaign!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>{campaign.name}</span>
                            {campaignAnalytics[campaign.id] && (
                              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20 text-xs">
                                <BarChart className="h-3 w-3 mr-1" />
                                Analytics
                              </Badge>
                            )}
                            {isLoadingAnalytics[campaign.id] && (
                              <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-900/20 text-xs">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Loading...
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{campaign.subject}</span>
                          {campaignAnalytics[campaign.id] && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-green-400">
                                {campaignAnalytics[campaign.id].openRate}% open rate
                              </span>
                              <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                                {campaignAnalytics[campaign.id].sent || 0} sent
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            campaign.status === "SENT"
                              ? "default"
                              : campaign.status === "SCHEDULED"
                              ? "secondary"
                              : campaign.status === "SENDING"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {campaign.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.statistics.totalRecipients > 0
                          ? campaign.statistics.totalRecipients.toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {campaignAnalytics[campaign.id] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Open Rate:</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {campaignAnalytics[campaign.id].openRate || 0}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Click Rate:</span>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {campaignAnalytics[campaign.id].clickRate || 0}%
                              </Badge>
                            </div>
                          </div>
                        ) : campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' ? (
                          <span className="text-xs text-muted-foreground">Not sent yet</span>
                        ) : isLoadingAnalytics[campaign.id] ? (
                          <div className="flex items-center gap-2 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-muted-foreground">Loading...</span>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {campaign.lists.length > 0
                              ? `${campaign.lists.length} list${campaign.lists.length > 1 ? 's' : ''}`
                              : "-"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.status === "SENT" 
                          ? getFormattedDate(campaign.sentAt)
                          : campaign.status === "SCHEDULED"
                          ? `Scheduled for ${getFormattedDate(campaign.scheduledFor)}`
                          : campaign.status === "SENDING"
                          ? "In progress"
                          : getFormattedDate(campaign.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewCampaign(campaign.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            {(campaign.status === 'SENT' || campaign.status === 'SENDING') && (
                              <DropdownMenuItem 
                                onClick={() => handleRefreshAnalytics(campaign)}
                                disabled={isLoadingAnalytics[campaign.id]}
                              >
                                <BarChart className="mr-2 h-4 w-4" /> 
                                {isLoadingAnalytics[campaign.id] ? 'Loading...' : 'Refresh Analytics'}
                              </DropdownMenuItem>
                            )}
                            {campaign.status === "DRAFT" && (
                              <DropdownMenuItem onClick={() => handleEditCampaign(campaign.id)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {campaign.status === "SENDING" && (
                              <DropdownMenuItem>
                                <Pause className="mr-2 h-4 w-4" /> Pause
                              </DropdownMenuItem>
                            )}
                            {campaign.status === "DRAFT" && (
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" /> Send
                              </DropdownMenuItem>
                            )}
                            {campaign.status === "SCHEDULED" && (
                              <DropdownMenuItem>
                                <Clock className="mr-2 h-4 w-4" /> Reschedule
                              </DropdownMenuItem>
                            )}
                            {(campaign.status === "SENT" ||
                              campaign.status === "SENDING") && (
                              <DropdownMenuItem>
                                <BarChart className="mr-2 h-4 w-4" /> Reports
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {campaignAnalytics[campaign.id] && (
                              <DropdownMenuItem onClick={() => router.push(`/email/campaigns/${campaign.id}/analytics`)}>
                                <BarChart className="mr-2 h-4 w-4" /> View Analytics
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {campaign.status !== "SENT" && campaign.status !== "SENDING" && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteCampaign(campaign.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
