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
  MessageCircle,
  BarChart,
  Clock,
  Copy,
  Users,
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  TrendingUp,
  Phone
} from "lucide-react";
import Link from "next/link";
import { getWhatsAppCampaigns, getWhatsAppTemplates } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { WhatsAppCampaign, WhatsAppTemplate } from "@/hooks/useWhatsApp";
// Removed quantum functionality - using real analytics instead

export default function WhatsAppCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string | null>(null);
  const [isCreatingSampleData, setIsCreatingSampleData] = useState(false);
  const [campaignAnalytics, setCampaignAnalytics] = useState<Record<string, Record<string, unknown>>>({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  
  // New function to create sample data
  const createSampleData = async () => {
    try {
      setIsCreatingSampleData(true);
      const response = await fetch('/api/v2/seed', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Sample data created successfully!');
        // Refresh campaigns
        const updatedCampaigns = await getWhatsAppCampaigns();
        setCampaigns(updatedCampaigns);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create sample data');
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('An error occurred while creating sample data');
    } finally {
      setIsCreatingSampleData(false);
    }
  };
  
  // Fetch campaigns and templates data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [campaignsData, templatesData] = await Promise.all([
          getWhatsAppCampaigns(),
          getWhatsAppTemplates()
        ]);
        
        console.log("Fetched campaigns:", campaignsData);
        // Handle different response formats with defensive programming
        const campaignList = Array.isArray(campaignsData) ? campaignsData : (campaignsData?.campaigns || []);
        const templateList = Array.isArray(templatesData) ? templatesData : (templatesData?.templates || []);
        
        // Ensure both lists are arrays before setting state
        const safeCampaignList = Array.isArray(campaignList) ? campaignList : [];
        const safeTemplateList = Array.isArray(templateList) ? templateList : [];
        
        setCampaigns(safeCampaignList);
        setTemplates(safeTemplateList);
        
        // Load real analytics for WhatsApp campaigns
        await loadWhatsAppCampaignAnalytics(safeCampaignList);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error instanceof Error && error.message.includes('401')) {
          setIsAuthenticated(false);
          toast.error("Authentication required. Please log in to access campaigns.");
        } else {
          toast.error("Failed to load campaigns");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load real analytics for WhatsApp campaigns
  const loadWhatsAppCampaignAnalytics = async (campaignList: WhatsAppCampaign[]) => {
    const analytics: Record<string, Record<string, unknown>> = {};
    
    const campaigns = Array.isArray(campaignList) ? campaignList : [];
    for (const campaign of campaigns) {
      if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
        setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: true }));
        
        try {
          const response = await fetch(`/api/v2/whatsapp/campaigns/${campaign.id}/analytics`);
          if (response.ok) {
            const data = await response.json();
            analytics[campaign.id] = data;
          }
        } catch (error) {
          console.warn(`Failed to load analytics for WhatsApp campaign ${campaign.id}:`, error);
        } finally {
          setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: false }));
        }
      }
    }
    
    setCampaignAnalytics(analytics);
  };

  // Refresh analytics for individual WhatsApp campaign
  const handleRefreshAnalytics = async (campaign: WhatsAppCampaign) => {
    setIsLoadingAnalytics(prev => ({ ...prev, [campaign.id]: true }));
    
    try {
      const response = await fetch(`/api/v2/whatsapp/campaigns/${campaign.id}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setCampaignAnalytics(prev => ({ ...prev, [campaign.id]: data }));
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

  // Handle campaign deletion
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v2/whatsapp/campaigns/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          toast.success("Campaign deleted successfully");
          // Remove the deleted campaign from state with safety checks
          setCampaigns(prevCampaigns => {
            if (!Array.isArray(prevCampaigns)) {
              console.error('Previous campaigns is not an array:', prevCampaigns);
              return [];
            }
            return prevCampaigns.filter(campaign => campaign.id !== id);
          });
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to delete campaign");
        }
      } catch (error) {
        console.error("Error deleting campaign:", error);
        toast.error("Error deleting campaign");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle campaign duplication
  const handleDuplicate = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v2/whatsapp/campaigns/${id}/duplicate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const duplicatedCampaign = await response.json();
        toast.success("Campaign duplicated successfully");
        // Add the new campaign to state with safety checks
        setCampaigns(prevCampaigns => {
          if (!Array.isArray(prevCampaigns)) {
            console.error('Previous campaigns is not an array:', prevCampaigns);
            return [duplicatedCampaign];
          }
          return [duplicatedCampaign, ...prevCampaigns];
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to duplicate campaign");
      }
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast.error("Failed to duplicate campaign");
    } finally {
      setIsLoading(false);
    }
  };
  
  const itemsPerPage = 5;
  const filteredCampaigns = (campaigns || []).filter(campaign => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(searchLower) ||
        (campaign.createdBy?.name?.toLowerCase().includes(searchLower)) ||
        (campaign.template?.name?.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (statusFilter && campaign.status !== statusFilter) {
      return false;
    }

    // Template filter
    if (templateFilter && campaign.template?.id !== templateFilter) {
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
  const formatDate = (dateString: string | null) => {
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
    SENDING: (campaigns || []).filter(c => c.status === "SENDING").length,
    SENT: (campaigns || []).filter(c => c.status === "SENT").length,
  };

  // Get unique templates
  const uniqueTemplates = templates.length ? templates : [];
  const templateCounts: Record<string, number> = {};
  (campaigns || []).forEach(campaign => {
    if (campaign.templateId) {
      templateCounts[campaign.templateId] = (templateCounts[campaign.templateId] || 0) + 1;
    }
  });

  // Get campaign status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      case 'SCHEDULED':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Scheduled</Badge>;
      case 'SENDING':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Sending</Badge>;
      case 'SENT':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Sent</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'CANCELLED':
        return <Badge variant="default" className="bg-gray-500 hover:bg-gray-600">Cancelled</Badge>;
      case 'PAUSED':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Paused</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Calculate average open rate
  const calculateAverageOpenRate = () => {
    const sentCampaigns = (campaigns || []).filter(c => c.status === "SENT" && (c as WhatsAppCampaign & { statistics?: { openRate?: number } }).statistics?.openRate);
    if (sentCampaigns.length === 0) return 0;
    
    const totalOpenRate = sentCampaigns.reduce((acc, curr) => acc + ((curr as WhatsAppCampaign & { statistics?: { openRate?: number } }).statistics?.openRate || 0), 0);
    return Math.round(totalOpenRate / sentCampaigns.length);
  };

  // Get analytics summary
  const getWhatsAppAnalyticsSummary = () => {
    const campaignsWithAnalytics = Object.keys(campaignAnalytics).length;
    const avgDeliveryRate = campaignsWithAnalytics > 0 
      ? Object.values(campaignAnalytics).reduce((sum, analytics: Record<string, unknown>) => 
          sum + (analytics.deliveryRate as number || 0), 0) / campaignsWithAnalytics
      : 0;
    return { campaignsWithAnalytics, avgDeliveryRate };
  };
  
  const { campaignsWithAnalytics, avgDeliveryRate } = getWhatsAppAnalyticsSummary();

  return (
    <div className="flex flex-col space-y-6">
      {!isAuthenticated ? (
        <Card className="bg-red-950/50 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Phone className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription className="text-red-300">
              You need to be logged in to access WhatsApp campaigns.
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
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your WhatsApp Business message campaigns and templates with real-time analytics.
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
        <div className="flex space-x-2">
          {campaigns.length === 0 && !isLoading && (
            <Button 
              variant="outline" 
              onClick={createSampleData} 
              disabled={isCreatingSampleData}
            >
              {isCreatingSampleData && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Sample Data
            </Button>
          )}
          <Button asChild>
            <Link href="/whatsapp/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* WhatsApp Analytics Overview */}
      {campaignsWithAnalytics > 0 && (
        <Card className="bg-gradient-to-r from-blue-950/50 to-green-950/50 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-400" />
              WhatsApp Campaign Analytics
            </CardTitle>
            <CardDescription>
              Real-time performance data from your WhatsApp Business campaigns
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
                  <MessageCircle className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-purple-300">Messages Sent</span>
                </div>
                <div className="text-2xl font-bold text-purple-100">
                  {Object.values(campaignAnalytics).reduce((sum, analytics: Record<string, unknown>) => 
                    sum + (analytics.sent as number || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-purple-200">Total messages dispatched</p>
              </div>
              
              <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-orange-400" />
                  <span className="font-medium text-orange-300">Response Rate</span>
                </div>
                <div className="text-2xl font-bold text-orange-100">
                  {campaignsWithAnalytics > 0 ? 
                    (Object.values(campaignAnalytics).reduce((sum, analytics: Record<string, unknown>) => 
                      sum + (analytics.responseRate as number || 0), 0) / campaignsWithAnalytics).toFixed(1)
                    : '0.0'}%
                </div>
                <p className="text-xs text-orange-200">Average response rate</p>
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
              {statusCounts.SENDING} sending, {statusCounts.SCHEDULED} scheduled
              {campaignsWithAnalytics > 0 && (
                <span className="block text-blue-400">{campaignsWithAnalytics} with analytics</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.SENT}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="inline mr-1 h-3 w-3" />
              Successfully sent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateAverageOpenRate()}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <BarChart className="inline mr-1 h-3 w-3" />
              Messages opened
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Templates Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueTemplates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <FileText className="inline mr-1 h-3 w-3" />
              <Link href="/whatsapp/templates" className="hover:underline">Manage templates</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>WhatsApp Campaigns</CardTitle>
          <CardDescription>
            Send transactional and promotional messages via WhatsApp Business API.
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
                    {(statusFilter || templateFilter) && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        {Number(!!statusFilter) + Number(!!templateFilter)}
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
                      setStatusFilter(statusFilter === "SENDING" ? null : "SENDING");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusFilter === "SENDING" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Sending</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.SENDING}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setStatusFilter(statusFilter === "SENT" ? null : "SENT");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusFilter === "SENT" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Sent</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.SENT}</Badge>
                  </DropdownMenuItem>
                  
                  {uniqueTemplates.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filter by Template</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {uniqueTemplates.map(template => (
                        <DropdownMenuItem
                          key={template.id}
                          className="flex items-center justify-between"
                          onClick={() => {
                            setTemplateFilter(templateFilter === template.id ? null : template.id);
                            setPage(1);
                          }}
                        >
                          <span className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${templateFilter === template.id ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                            <span>{template.name}</span>
                          </span>
                          <Badge variant="outline" className="ml-2">{templateCounts[template.id] || 0}</Badge>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalCampaigns}</strong> campaigns
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <p>Loading campaigns...</p>
            </div>
          ) : totalCampaigns === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No campaigns found.</p>
              <Button asChild>
                <Link href="/whatsapp/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCampaigns.map((campaign) => (
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
                          <span className="text-xs text-muted-foreground">by {campaign.createdBy?.name || 'Unknown'}</span>
                          {campaignAnalytics[campaign.id] && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-green-400">
                                {(campaignAnalytics[campaign.id].deliveryRate as number) || 0}% delivery rate
                              </span>
                              <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                                {(campaignAnalytics[campaign.id].sent as number) || 0} sent
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.template ? (
                          <Badge variant="outline">
                            <MessageCircle className="mr-1 h-3 w-3" />
                            {campaign.template.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Custom content</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        {campaignAnalytics[campaign.id] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Sent:</span>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {(campaignAnalytics[campaign.id].sent as number) || 0}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Delivered:</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {(campaignAnalytics[campaign.id].deliveryRate as number) || 0}%
                              </Badge>
                            </div>
                            {((campaignAnalytics[campaign.id].failed as number) || 0) > 0 && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Failed:</span>
                                <Badge variant="outline" className="text-red-400 border-red-400">
                                  {(campaignAnalytics[campaign.id].failed as number) || 0}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' ? (
                          <span className="text-xs text-muted-foreground">Not sent yet</span>
                        ) : isLoadingAnalytics[campaign.id] ? (
                          <div className="flex items-center gap-2 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-muted-foreground">Loading...</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            {((campaign as WhatsAppCampaign & { statistics?: { totalRecipients?: number } }).statistics?.totalRecipients || 0).toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{formatDate(campaign.scheduledFor || null)}</span>
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
                            <DropdownMenuItem onClick={() => router.push(`/whatsapp/campaigns/${campaign.id}`)}>
                              <FileText className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/whatsapp/campaigns/${campaign.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
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
                            <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {campaignAnalytics[campaign.id] && (
                              <DropdownMenuItem onClick={() => router.push(`/whatsapp/campaigns/${campaign.id}/analytics`)}>
                                <BarChart className="mr-2 h-4 w-4" /> View Analytics
                              </DropdownMenuItem>
                            )}
                            {campaign.status === "SENT" && (
                              <DropdownMenuItem onClick={() => router.push(`/whatsapp/campaigns/${campaign.id}/statistics`)}>
                                <BarChart className="mr-2 h-4 w-4" /> View Stats
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(campaign.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
} 