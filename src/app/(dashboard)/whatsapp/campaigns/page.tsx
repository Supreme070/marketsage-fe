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
} from "lucide-react";
import Link from "next/link";
import { getWhatsAppCampaigns, getWhatsAppTemplates } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function WhatsAppCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string | null>(null);
  const [isCreatingSampleData, setIsCreatingSampleData] = useState(false);
  
  // New function to create sample data
  const createSampleData = async () => {
    try {
      setIsCreatingSampleData(true);
      const response = await fetch('/api/seed', {
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
        setCampaigns(campaignsData || []);
        setTemplates(templatesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle campaign deletion
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/whatsapp/campaigns/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          toast.success("Campaign deleted successfully");
          // Remove the deleted campaign from state
          setCampaigns(campaigns.filter(campaign => campaign.id !== id));
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
      const response = await fetch(`/api/whatsapp/campaigns/${id}/duplicate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const duplicatedCampaign = await response.json();
        toast.success("Campaign duplicated successfully");
        // Add the new campaign to state
        setCampaigns([duplicatedCampaign, ...campaigns]);
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
  const filteredCampaigns = campaigns.filter(campaign => {
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
    DRAFT: campaigns.filter(c => c.status === "DRAFT").length,
    SCHEDULED: campaigns.filter(c => c.status === "SCHEDULED").length,
    SENDING: campaigns.filter(c => c.status === "SENDING").length,
    SENT: campaigns.filter(c => c.status === "SENT").length,
  };

  // Get unique templates
  const uniqueTemplates = templates.length ? templates : [];
  const templateCounts: Record<string, number> = {};
  campaigns.forEach(campaign => {
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
    const sentCampaigns = campaigns.filter(c => c.status === "SENT" && c.statistics?.openRate);
    if (sentCampaigns.length === 0) return 0;
    
    const totalOpenRate = sentCampaigns.reduce((acc, curr) => acc + (curr.statistics?.openRate || 0), 0);
    return Math.round(totalOpenRate / sentCampaigns.length);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your WhatsApp Business message campaigns and templates.
          </p>
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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statusCounts.SENDING} sending, {statusCounts.SCHEDULED} scheduled
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
                    <TableHead>Recipients</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{campaign.name}</span>
                          <span className="text-xs text-muted-foreground">by {campaign.createdBy?.name || 'Unknown'}</span>
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
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          {(campaign.statistics?.totalRecipients || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{formatDate(campaign.scheduledFor)}</span>
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
                            <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
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
    </div>
  );
} 