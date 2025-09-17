"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  BarChart,
  Clock,
  Copy,
  Users,
  Calendar,
  CheckCircle,
  RefreshCw,
  FileText,
  AlertCircle,
  TrendingUp,
  Smartphone,
  Settings
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
// Removed quantum functionality - using real analytics instead

// Import SMS types and unified API client
import type { SMSCampaign, SMSCampaignAnalytics } from "@/lib/api/types/sms";
import { useSMS } from "@/lib/api";
import { useSession } from "next-auth/react";

export default function SMSCampaignsPage() {
  const router = useRouter();
  const smsApi = useSMS();
  const { data: session } = useSession();
  
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState<Record<string, SMSCampaignAnalytics>>({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<Record<string, boolean>>({});
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  
  useEffect(() => {
    const fetchCampaigns = async () => {
      // Check if user has an organization
      if (!session?.user?.organizationId) {
        console.warn("User does not have an organization - SMS campaigns may not be available");
        setCampaigns([]);
        setCampaignsLoading(false);
        return;
      }

      setCampaignsLoading(true);
      try {
        // Use unified API client for consistent authentication
        const response = await smsApi.getCampaigns({
          page,
          limit: 10,
          search: searchQuery || undefined,
          status: statusFilter || undefined,
          provider: providerFilter || undefined,
        });
        
        if (response) {
          setCampaigns(response.campaigns || []);
          // Load real analytics for sent campaigns
          await loadCampaignAnalytics(response.campaigns || []);
        }
      } catch (error) {
        console.error("Failed to fetch SMS campaigns:", error);
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          toast.error("Authentication required. Please sign in again.");
        } else {
          toast.error("Failed to load SMS campaigns");
        }
      } finally {
        setCampaignsLoading(false);
      }
    };

    fetchCampaigns();
  }, [page, searchQuery, statusFilter, providerFilter, smsApi, session]);

  // Load real analytics for SMS campaigns
  const loadCampaignAnalytics = async (campaignList: SMSCampaign[]) => {
    const analytics: Record<string, SMSCampaignAnalytics> = {};
    
    const campaigns = Array.isArray(campaignList) ? campaignList : [];
    for (const campaign of campaigns) {
      if (campaign.status === 'SENT' || campaign.status === 'ACTIVE') {
        setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: true }));
        
        try {
          // Use unified API client for analytics
          const analyticsData = await smsApi.getCampaignAnalytics(campaign.id);
          if (analyticsData) {
            analytics[campaign.id] = analyticsData;
          }
        } catch (error) {
          console.warn(`Failed to load analytics for SMS campaign ${campaign.id}:`, error);
        } finally {
          setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: false }));
        }
      }
    }
    
    setCampaignAnalytics(analytics);
  };

  // Refresh analytics for individual SMS campaign
  const handleRefreshAnalytics = async (campaign: SMSCampaign) => {
    setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: true }));
    
    try {
      // Use unified API client for analytics refresh
      const analyticsData = await smsApi.getCampaignAnalytics(campaign.id);
      if (analyticsData) {
        setCampaignAnalytics(prev => ({ ...prev, [campaign.id]: analyticsData }));
        toast.success('Analytics refreshed successfully');
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
      toast.error('Failed to refresh analytics');
    } finally {
      setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: false }));
    }
  };

  const itemsPerPage = 5;
  const filteredCampaigns = (campaigns || []).filter(campaign => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.createdBy?.toLowerCase().includes(searchLower) ||
        campaign.provider?.toLowerCase().includes(searchLower) ||
        (campaign.tags && campaign.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Status filter
    if (statusFilter && campaign.status !== statusFilter) {
      return false;
    }

    // Provider filter
    if (providerFilter && campaign.provider !== providerFilter) {
      return false;
    }

    return true;
  });

  const totalCampaigns = filteredCampaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCampaigns);
  const displayedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Stats by status
  const statusCounts = {
    DRAFT: (campaigns || []).filter(c => c.status === "DRAFT").length,
    SCHEDULED: (campaigns || []).filter(c => c.status === "SCHEDULED").length,
    ACTIVE: (campaigns || []).filter(c => c.status === "ACTIVE").length,
    COMPLETED: (campaigns || []).filter(c => c.status === "COMPLETED").length,
  };

  // Get unique providers
  const providers = [...new Set((campaigns || []).map(c => c.provider))].filter(Boolean) as string[];
  const providerCounts: Record<string, number> = {};
  (campaigns || []).forEach(campaign => {
    if (campaign.provider) {
      providerCounts[campaign.provider] = (providerCounts[campaign.provider] || 0) + 1;
    }
  });

  // Calculate total sent messages
  const totalSentMessages = (campaigns || [])
    .filter(c => c.status === "ACTIVE" || c.status === "COMPLETED")
    .reduce((acc, curr) => acc + (curr.recipients || 0), 0);

  // Get campaign status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      case 'SCHEDULED':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Scheduled</Badge>;
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="default" className="bg-gray-500 hover:bg-gray-600">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get provider badge
  const getProviderBadge = (provider: string) => {
    switch(provider) {
      case 'africastalking':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200">Africa's Talking</Badge>;
      case 'twilio':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">Twilio</Badge>;
      case 'mNotify':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">mNotify</Badge>;
      default:
        return <Badge variant="outline">{provider || "Unknown"}</Badge>;
    }
  };

  // Handle campaign deletion with confirmation
  const handleDeleteCampaign = async (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        // Use unified API client for deletion
        await smsApi.deleteCampaign(id);
        
        toast.success("Campaign deleted successfully");
        // Refresh campaigns list
        const refreshResponse = await smsApi.getCampaigns();
        if (refreshResponse) {
          setCampaigns(refreshResponse.campaigns || []);
        }
      } catch (error) {
        console.error("Error deleting campaign:", error);
        toast.error("Failed to delete campaign");
      }
    }
  };

  // Handle campaign duplication
  const handleDuplicateCampaign = async (id: string) => {
    try {
      // Note: Duplicate functionality would need to be implemented in the backend
      // For now, we'll show a message that this feature is not yet available
      toast.success("Campaign duplication feature coming soon");
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast.error("Failed to duplicate campaign");
    }
  };

  // Get analytics summary
  const getAnalyticsSummary = () => {
    const campaignsWithAnalytics = Object.keys(campaignAnalytics).length;
    const avgDeliveryRate = campaignsWithAnalytics > 0 
      ? Object.values(campaignAnalytics).reduce((sum, analytics: any) => 
          sum + (analytics.deliveryRate || 0), 0) / campaignsWithAnalytics
      : 0;
    return { campaignsWithAnalytics, avgDeliveryRate };
  };
  
  const { campaignsWithAnalytics, avgDeliveryRate } = getAnalyticsSummary();

  // Show message for users without organizations
  if (!session?.user?.organizationId) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">SMS Campaigns</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage SMS campaigns across various African telecom providers with real-time analytics.
            </p>
          </div>
        </div>
        
        <Card className="bg-yellow-950/50 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              Organization Required
            </CardTitle>
            <CardDescription className="text-yellow-300">
              SMS campaigns require an organization to be set up. Please contact your administrator to set up your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings/organization">
                <Settings className="mr-2 h-4 w-4" />
                Set Up Organization
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SMS Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage SMS campaigns across various African telecom providers with real-time analytics.
          </p>
          {campaignsWithAnalytics > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-900/20">
                <BarChart className="h-3 w-3 mr-1" />
                {campaignsWithAnalytics} Campaigns with Analytics
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                {avgDeliveryRate.toFixed(1)}% Avg Delivery Rate
              </Badge>
            </div>
          )}
        </div>
        <Button asChild>
          <Link href="/sms/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* SMS Analytics Overview */}
      {campaignsWithAnalytics > 0 && (
        <Card className="bg-gradient-to-r from-blue-950/50 to-green-950/50 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-400" />
              SMS Campaign Analytics
            </CardTitle>
            <CardDescription>
              Real-time performance data from your SMS campaigns across African networks
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
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-green-300">Delivery Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-100">{avgDeliveryRate.toFixed(1)}%</div>
                <p className="text-xs text-green-200">Average delivery success rate</p>
              </div>
              
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-purple-300">Messages Sent</span>
                </div>
                <div className="text-2xl font-bold text-purple-100">
                  {Object.values(campaignAnalytics).reduce((sum, analytics: any) => 
                    sum + (analytics.sent || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-purple-200">Total messages dispatched</p>
              </div>
              
              <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  <span className="font-medium text-orange-300">Failed Messages</span>
                </div>
                <div className="text-2xl font-bold text-orange-100">
                  {Object.values(campaignAnalytics).reduce((sum, analytics: any) => 
                    sum + (analytics.failed || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-orange-200">Messages that failed delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className={campaignsWithAnalytics > 0 ? 'border-blue-500/30' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Campaigns
              {campaignsWithAnalytics > 0 && (
                <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-900/20 text-xs">
                  <BarChart className="h-3 w-3 mr-1" />
                  Analytics
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaigns || []).length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statusCounts.ACTIVE} active, {statusCounts.SCHEDULED} scheduled
              {campaignsWithAnalytics > 0 && (
                <span className="block text-blue-400">{campaignsWithAnalytics} with analytics</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSentMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="inline mr-1 h-3 w-3" />
              Successfully delivered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SMS Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <RefreshCw className="inline mr-1 h-3 w-3" />
              <Link href="/settings/sms-providers" className="hover:underline">Manage providers</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SMS Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              <FileText className="inline mr-1 h-3 w-3" />
              <Link href="/sms/templates" className="hover:underline">Manage templates</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>SMS Campaigns</CardTitle>
          <CardDescription>
            Create and manage SMS campaigns to reach your audience across Africa.
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1); // Reset to first page on search
                  }}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                    {(statusFilter || providerFilter) && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        {Number(!!statusFilter) + Number(!!providerFilter)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setStatusFilter(statusFilter === "DRAFT" ? null : "DRAFT");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusFilter === "DRAFT" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Draft</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.DRAFT}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setStatusFilter(statusFilter === "SCHEDULED" ? null : "SCHEDULED");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusFilter === "SCHEDULED" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Scheduled</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.SCHEDULED}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setStatusFilter(statusFilter === "ACTIVE" ? null : "ACTIVE");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusFilter === "ACTIVE" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Active</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.ACTIVE}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setStatusFilter(statusFilter === "COMPLETED" ? null : "COMPLETED");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusFilter === "COMPLETED" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Completed</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.COMPLETED}</Badge>
                  </DropdownMenuItem>
                  
                  {providers.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filter by Provider</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {providers.map(provider => (
                        <DropdownMenuItem
                          key={provider}
                          className="flex items-center justify-between"
                          onClick={() => {
                            setProviderFilter(providerFilter === provider ? null : provider);
                            setPage(1);
                          }}
                        >
                          <span className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${providerFilter === provider ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                            <span className="capitalize">{provider === 'africastalking' ? "Africa's Talking" : provider}</span>
                          </span>
                          <Badge variant="outline" className="ml-2">{providerCounts[provider]}</Badge>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <strong>{Math.min(totalCampaigns, 1) === 0 ? 0 : startIndex + 1}-{endIndex}</strong> of <strong>{totalCampaigns}</strong> campaigns
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading campaigns...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p>No SMS campaigns found</p>
                        <Button variant="link" asChild className="mt-2">
                          <Link href="/sms/campaigns/new">
                            Create your first SMS campaign
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedCampaigns.map((campaign) => (
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
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Loading...
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">by {campaign.createdBy || 'Unknown'}</span>
                          {campaignAnalytics[campaign.id] && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-green-400">
                                {campaignAnalytics[campaign.id].deliveryRate}% delivery rate
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{campaign.provider ? getProviderBadge(campaign.provider) : '-'}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          {(campaign.recipients || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaignAnalytics[campaign.id] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Sent:</span>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {campaignAnalytics[campaign.id].sent || 0}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Delivered:</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {campaignAnalytics[campaign.id].deliveryRate || 0}%
                              </Badge>
                            </div>
                            {campaignAnalytics[campaign.id].failed > 0 && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Failed:</span>
                                <Badge variant="outline" className="text-red-400 border-red-400">
                                  {campaignAnalytics[campaign.id].failed}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' ? (
                          <span className="text-xs text-muted-foreground">Not sent yet</span>
                        ) : isLoadingAnalytics[campaign.id] ? (
                          <div className="flex items-center gap-2 text-xs">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span className="text-muted-foreground">Loading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col text-xs">
                            <span>Delivery: {campaign.deliveryRate || '-'}%</span>
                            {campaign.clickRate !== null && campaign.clickRate !== undefined && (
                              <span>Click: {campaign.clickRate || '-'}%</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{formatDate(campaign.scheduledDate)}</span>
                        </div>
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
                            <DropdownMenuItem asChild>
                              <Link href={`/sms/campaigns/${campaign.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            {(campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED') && (
                              <DropdownMenuItem 
                                onClick={() => handleRefreshAnalytics(campaign)}
                                disabled={isLoadingAnalytics[campaign.id]}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" /> 
                                {isLoadingAnalytics[campaign.id] ? 'Loading...' : 'Refresh Analytics'}
                              </DropdownMenuItem>
                            )}
                            {(campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED') && (
                              <DropdownMenuItem asChild>
                                <Link href={`/sms/campaigns/${campaign.id}/stats`}>
                                  <BarChart className="mr-2 h-4 w-4" /> View Stats
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {campaignAnalytics[campaign.id] && (
                              <DropdownMenuItem asChild>
                                <Link href={`/sms/campaigns/${campaign.id}/analytics`}>
                                  <BarChart className="mr-2 h-4 w-4" /> View Analytics
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{totalCampaigns === 0 ? 0 : startIndex + 1}-{endIndex}</strong> of <strong>{totalCampaigns}</strong> campaigns
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                {totalPages > 5 && page < totalPages - 2 && (
                  <span className="px-2">...</span>
                )}
                {totalPages > 5 && page < totalPages && (
                  <Button
                    variant={page === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 