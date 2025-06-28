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
  Cpu,
  Zap,
  TrendingUp,
  Target,
  Phone
} from "lucide-react";
import Link from "next/link";
import { getWhatsAppCampaigns, getWhatsAppTemplates } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { quantumWhatsAppOptimizer } from '@/lib/ai/quantum-whatsapp-optimizer';

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
  const [quantumOptimizations, setQuantumOptimizations] = useState<Record<string, any>>({});
  const [isOptimizing, setIsOptimizing] = useState<Record<string, boolean>>({});
  
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
        
        // Apply quantum optimizations to WhatsApp campaigns
        await applyWhatsAppQuantumOptimizations(campaignsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply quantum optimizations to WhatsApp campaigns
  const applyWhatsAppQuantumOptimizations = async (campaignList: any[]) => {
    const optimizations: Record<string, any> = {};
    
    for (const campaign of campaignList.slice(0, 3)) { // Optimize first 3 WhatsApp campaigns
      if (campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') {
        setIsOptimizing(prev => ({ ...prev, [campaign.id]: true }));
        
        try {
          const quantum = await quantumWhatsAppOptimizer.optimizeWhatsAppCampaign({
            id: campaign.id,
            name: campaign.name,
            templateId: campaign.templateId,
            template: campaign.template,
            businessPhoneNumberId: campaign.businessPhoneNumberId || 'default',
            status: campaign.status as any,
            scheduledDate: campaign.scheduledFor ? new Date(campaign.scheduledFor) : undefined,
            recipients: [], // Would normally get from API
            segments: [],
            market: 'NGN' // Default to Nigerian market
          });
          
          optimizations[campaign.id] = quantum;
        } catch (error) {
          console.warn(`Quantum WhatsApp optimization failed for campaign ${campaign.id}:`, error);
        } finally {
          setIsOptimizing(prev => ({ ...prev, [campaign.id]: false }));
        }
      }
    }
    
    setQuantumOptimizations(optimizations);
  };

  // Handle quantum optimization for individual WhatsApp campaign
  const handleOptimizeWhatsAppCampaign = async (campaign: any) => {
    setIsOptimizing(prev => ({ ...prev, [campaign.id]: true }));
    
    try {
      const quantum = await quantumWhatsAppOptimizer.optimizeWhatsAppCampaign({
        id: campaign.id,
        name: campaign.name,
        templateId: campaign.templateId,
        template: campaign.template,
        businessPhoneNumberId: campaign.businessPhoneNumberId || 'default',
        status: campaign.status as any,
        scheduledDate: campaign.scheduledFor ? new Date(campaign.scheduledFor) : undefined,
        recipients: [],
        segments: [],
        market: 'NGN'
      });
      
      setQuantumOptimizations(prev => ({ ...prev, [campaign.id]: quantum }));
      
      toast.success(`⚡ WhatsApp Quantum Optimization Complete - +${(quantum.templateOptimization.quantumAdvantage * 100).toFixed(1)}% quantum advantage`);
    } catch (error) {
      console.error('Quantum WhatsApp optimization failed:', error);
      toast.error('WhatsApp Quantum optimization failed. Using classical methods.');
    } finally {
      setIsOptimizing(prev => ({ ...prev, [campaign.id]: false }));
    }
  };

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

  // Get quantum optimization summary
  const getWhatsAppQuantumSummary = () => {
    const optimizedCampaigns = Object.keys(quantumOptimizations).length;
    const avgQuantumAdvantage = optimizedCampaigns > 0 
      ? Object.values(quantumOptimizations).reduce((sum, opt: any) => 
          sum + opt.templateOptimization.quantumAdvantage, 0) / optimizedCampaigns
      : 0;
    return { optimizedCampaigns, avgQuantumAdvantage };
  };
  
  const { optimizedCampaigns, avgQuantumAdvantage } = getWhatsAppQuantumSummary();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your WhatsApp Business message campaigns and templates with quantum optimization.
          </p>
          {optimizedCampaigns > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-cyan-400 border-cyan-400 bg-cyan-900/20">
                <Phone className="h-3 w-3 mr-1" />
                ⚡ {optimizedCampaigns} Quantum Optimized
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{(avgQuantumAdvantage * 100).toFixed(1)}% Avg Improvement
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

      {/* Quantum WhatsApp Optimization Overview */}
      {optimizedCampaigns > 0 && (
        <Card className="bg-gradient-to-r from-green-950/50 to-emerald-950/50 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-400" />
              ⚡ Quantum WhatsApp Intelligence
            </CardTitle>
            <CardDescription>
              Advanced quantum optimizations for WhatsApp Business messaging and template approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-green-300">WhatsApp Optimized</span>
                </div>
                <div className="text-2xl font-bold text-green-100">{optimizedCampaigns}</div>
                <p className="text-xs text-green-200">Quantum-enhanced campaigns</p>
              </div>
              
              <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium text-emerald-300">Open Rate</span>
                </div>
                <div className="text-2xl font-bold text-emerald-100">
                  {optimizedCampaigns > 0 ? 
                    (Object.values(quantumOptimizations).reduce((sum, opt: any) => 
                      sum + opt.performancePrediction.estimatedOpenRate, 0) / optimizedCampaigns * 100).toFixed(1)
                    : '78.0'}%
                </div>
                <p className="text-xs text-emerald-200">Predicted open rate</p>
              </div>
              
              <div className="p-3 bg-teal-900/20 border border-teal-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-teal-400" />
                  <span className="font-medium text-teal-300">Response Rate</span>
                </div>
                <div className="text-2xl font-bold text-teal-100">
                  {optimizedCampaigns > 0 ? 
                    (Object.values(quantumOptimizations).reduce((sum, opt: any) => 
                      sum + opt.performancePrediction.estimatedResponseRate, 0) / optimizedCampaigns * 100).toFixed(1)
                    : '35.0'}%
                </div>
                <p className="text-xs text-teal-200">Expected response rate</p>
              </div>
              
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium text-cyan-300">Compliance</span>
                </div>
                <div className="text-2xl font-bold text-cyan-100">
                  {optimizedCampaigns > 0 ? 
                    (Object.values(quantumOptimizations).reduce((sum, opt: any) => 
                      sum + opt.templateOptimization.businessMessagingCompliance.complianceScore, 0) / optimizedCampaigns * 100).toFixed(0)
                    : '90'}%
                </div>
                <p className="text-xs text-cyan-200">Business messaging compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className={optimizedCampaigns > 0 ? 'border-green-500/30' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Campaigns
              {optimizedCampaigns > 0 && (
                <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20 text-xs">
                  ⚡ Enhanced
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statusCounts.SENDING} sending, {statusCounts.SCHEDULED} scheduled
              {optimizedCampaigns > 0 && (
                <span className="block text-green-400">⚡ {optimizedCampaigns} quantum optimized</span>
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
                            {quantumOptimizations[campaign.id] && (
                              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20 text-xs">
                                <Phone className="h-3 w-3 mr-1" />
                                ⚡ Optimized
                              </Badge>
                            )}
                            {isOptimizing[campaign.id] && (
                              <Badge variant="outline" className="text-orange-400 border-orange-400 bg-orange-900/20 text-xs">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Optimizing...
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">by {campaign.createdBy?.name || 'Unknown'}</span>
                          {quantumOptimizations[campaign.id] && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-green-400">
                                +{(quantumOptimizations[campaign.id].templateOptimization.quantumAdvantage * 100).toFixed(1)}% quantum boost
                              </span>
                              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400">
                                {(quantumOptimizations[campaign.id].templateOptimization.businessMessagingCompliance.complianceScore * 100).toFixed(0)}% compliant
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
                        {quantumOptimizations[campaign.id] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Open Rate:</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {(quantumOptimizations[campaign.id].performancePrediction.estimatedOpenRate * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Response:</span>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {(quantumOptimizations[campaign.id].performancePrediction.estimatedResponseRate * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Recipients:</span>
                              <span className="text-muted-foreground">
                                {(campaign.statistics?.totalRecipients || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            {(campaign.statistics?.totalRecipients || 0).toLocaleString()}
                          </div>
                        )}
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
                            {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && !quantumOptimizations[campaign.id] && (
                              <DropdownMenuItem 
                                onClick={() => handleOptimizeWhatsAppCampaign(campaign)}
                                disabled={isOptimizing[campaign.id]}
                              >
                                <Cpu className="mr-2 h-4 w-4" /> 
                                {isOptimizing[campaign.id] ? 'Optimizing...' : '⚡ Quantum Optimize'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {quantumOptimizations[campaign.id] && (
                              <DropdownMenuItem>
                                <Target className="mr-2 h-4 w-4" /> View WhatsApp Optimization
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
    </div>
  );
} 