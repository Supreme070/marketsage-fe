"use client";

import { useState, useEffect, useCallback } from "react";
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
import { signIn, useSession } from "next-auth/react";

// Import unified API client and types
import { useEmail } from "@/lib/api/hooks";
import type { EmailCampaign, EmailCampaignAnalytics } from "@/lib/api/types/email";

export default function EmailCampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const emailApi = useEmail();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  
  // Ensure campaigns is always an array - defensive programming
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState<Record<string, EmailCampaignAnalytics>>({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Load real analytics for email campaigns
  const loadEmailCampaignAnalytics = useCallback(async (campaignList: EmailCampaign[]) => {
    console.log('loadEmailCampaignAnalytics called with:', campaignList);
    console.log('campaignList type:', typeof campaignList);
    console.log('campaignList isArray:', Array.isArray(campaignList));
    console.log('campaignList length:', campaignList?.length);
    
    // Ensure campaignList is iterable
    if (!Array.isArray(campaignList)) {
      console.error('campaignList is not an array:', campaignList);
      return;
    }
    
    const analytics: Record<string, EmailCampaignAnalytics> = {};
    
    try {
      for (const campaign of campaignList) {
        if (campaign && campaign.status === 'SENT' || campaign.status === 'SENDING') {
          setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: true }));
          
        try {
          // Use unified API client for analytics
          const analyticsData = await emailApi.getCampaignAnalytics(campaign.id);
          if (analyticsData && typeof analyticsData === 'object' && 'analytics' in analyticsData) {
            analytics[campaign.id] = analyticsData as EmailCampaignAnalytics;
          }
        } catch (error) {
          console.warn(`Failed to load analytics for email campaign ${campaign.id}:`, error);
        } finally {
          setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: false }));
        }
        }
      }
      
      setCampaignAnalytics(analytics);
    } catch (error) {
      console.error('Error in loadEmailCampaignAnalytics:', error);
    }
  }, [emailApi]);

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!session?.user || status !== 'authenticated') {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    setIsAuthenticated(true);
    setIsLoading(true);
    try {
      // Use unified API client for consistent authentication
      const response = await emailApi.getCampaigns({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      
      if (response && typeof response === 'object' && 'campaigns' in response) {
        const campaigns = Array.isArray(response.campaigns) ? response.campaigns : [];
        setCampaigns(campaigns);
        // Load analytics for sent campaigns
        await loadEmailCampaignAnalytics(campaigns);
      }
    } catch (error) {
      console.error('Failed to fetch email campaigns:', error);
      setError('Failed to load email campaigns');
      toast({
        title: "Error",
        description: "Failed to load email campaigns",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, status, statusFilter, searchQuery, emailApi, loadEmailCampaignAnalytics, toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Refresh analytics for individual email campaign
  const handleRefreshAnalytics = async (campaign: EmailCampaign) => {
    setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: true }));
    
    try {
      // Use unified API client for analytics refresh
      const analyticsData = await emailApi.getCampaignAnalytics(campaign.id);
      if (analyticsData && typeof analyticsData === 'object' && 'analytics' in analyticsData) {
        setCampaignAnalytics(prev => ({ ...prev, [campaign.id]: analyticsData as EmailCampaignAnalytics }));
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

  // Calculate status counts for filter - with additional safety checks
  console.log('=== STATUS COUNTS DEBUG ===');
  console.log('campaigns state:', campaigns);
  console.log('safeCampaigns:', safeCampaigns);
  console.log('campaigns type:', typeof campaigns);
  console.log('campaigns isArray:', Array.isArray(campaigns));
  console.log('campaigns length:', campaigns?.length);
  console.log('=== END STATUS COUNTS DEBUG ===');
  
  // Ensure safeCampaigns is always an array before filtering
  const statusCounts = {
    DRAFT: Array.isArray(safeCampaigns) ? safeCampaigns.filter((c) => c && c.status === "DRAFT").length : 0,
    SCHEDULED: Array.isArray(safeCampaigns) ? safeCampaigns.filter((c) => c && c.status === "SCHEDULED").length : 0,
    SENDING: Array.isArray(safeCampaigns) ? safeCampaigns.filter((c) => c && c.status === "SENDING").length : 0,
    SENT: Array.isArray(safeCampaigns) ? safeCampaigns.filter((c) => c && c.status === "SENT").length : 0,
    PAUSED: Array.isArray(safeCampaigns) ? safeCampaigns.filter((c) => c && c.status === "PAUSED").length : 0,
  };

  // Filter campaigns based on search query and filters - with additional safety checks
  console.log('Filtering campaigns. Current campaigns state:', campaigns);
  console.log('campaigns type:', typeof campaigns);
  console.log('campaigns isArray:', Array.isArray(campaigns));
  console.log('campaigns length:', campaigns?.length);
  
  const filteredCampaigns = Array.isArray(safeCampaigns) ? safeCampaigns.filter((campaign) => {
    // Additional safety check for campaign object
    if (!campaign || typeof campaign !== 'object') {
      console.warn('Invalid campaign object:', campaign);
      return false;
    }
    
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
  }) : [];
  
  console.log('Filtered campaigns result:', filteredCampaigns);

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
        // Use unified API client for deletion
        await emailApi.deleteCampaign(id);
        
        // Remove campaign from state with safety checks
        setCampaigns(prevCampaigns => {
          if (!Array.isArray(prevCampaigns)) {
            console.error('Previous campaigns is not an array:', prevCampaigns);
            return [];
          }
          return prevCampaigns.filter(campaign => campaign.id !== id);
        });
        
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
      // Note: Duplicate functionality would need to be implemented in the backend
      // For now, we'll show a message that this feature is not yet available
      toast({
        title: "Feature Coming Soon",
        description: "Campaign duplication will be available in a future update",
      });
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
      ? Object.values(campaignAnalytics).reduce((sum, analytics: EmailCampaignAnalytics) => 
          sum + (analytics?.analytics?.openRate || 0), 0) / campaignsWithAnalytics
      : 0;
    const avgClickRate = campaignsWithAnalytics > 0 
      ? Object.values(campaignAnalytics).reduce((sum, analytics: EmailCampaignAnalytics) => 
          sum + (analytics?.analytics?.clickRate || 0), 0) / campaignsWithAnalytics
      : 0;
    return { campaignsWithAnalytics, avgOpenRate, avgClickRate };
  };
  
  const { campaignsWithAnalytics, avgOpenRate, avgClickRate } = getAnalyticsSummary();

  return (
    <div className="flex flex-col space-y-6">
      {!isAuthenticated ? (
        <Card className="bg-red-950/50 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Target className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription className="text-red-300">
              You need to be logged in to access email campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => signIn()} 
              className="bg-red-600 hover:bg-red-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                  {Object.values(campaignAnalytics).reduce((sum, analytics: EmailCampaignAnalytics) => 
                    sum + (analytics.analytics.totalSent || 0), 0).toLocaleString()}
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
                                {campaignAnalytics[campaign.id]?.analytics?.openRate || 0}% open rate
                              </span>
                              <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                                {campaignAnalytics[campaign.id]?.analytics?.totalSent || 0} sent
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
                        {(campaignAnalytics[campaign.id]?.analytics?.totalSent || 0) > 0
                          ? (campaignAnalytics[campaign.id]?.analytics?.totalSent || 0).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {campaignAnalytics[campaign.id] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Open Rate:</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {campaignAnalytics[campaign.id]?.analytics?.openRate || 0}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Click Rate:</span>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {campaignAnalytics[campaign.id]?.analytics?.clickRate || 0}%
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
                            {campaign.lists && campaign.lists.length > 0
                              ? `${campaign.lists.length} list${campaign.lists.length > 1 ? 's' : ''}`
                              : "-"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.status === "SENT" 
                          ? getFormattedDate(campaign.sentAt || null)
                          : campaign.status === "SCHEDULED"
                          ? `Scheduled for ${getFormattedDate(campaign.scheduledFor || null)}`
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
        </>
      )}
    </div>
  );
}
