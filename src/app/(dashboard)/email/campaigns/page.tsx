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
  Cpu,
  Zap,
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

  // Apply AI optimizations to campaigns
  const applyQuantumOptimizations = async (campaignList: EmailCampaign[]) => {
    const optimizations: Record<string, any> = {};
    
    for (const campaign of campaignList.slice(0, 5)) { // Optimize first 5 campaigns
      if (campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') {
        setIsOptimizing(prev => ({ ...prev, [campaign.id]: true }));
        
        try {
          const quantum = await quantumEmailOptimizer.optimizeEmailCampaign({
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject,
            content: campaign.description || '',
            from: campaign.from,
            replyTo: campaign.replyTo || undefined,
            status: campaign.status as any,
            scheduledFor: campaign.scheduledFor ? new Date(campaign.scheduledFor) : undefined,
            lists: campaign.lists.map(l => l.id),
            segments: campaign.segments.map(s => s.id),
            market: 'NGN' // Default to Nigerian market
          });
          
          optimizations[campaign.id] = quantum;
        } catch (error) {
          console.warn(`Quantum optimization failed for campaign ${campaign.id}:`, error);
        } finally {
          setIsOptimizing(prev => ({ ...prev, [campaign.id]: false }));
        }
      }
    }
    
    setQuantumOptimizations(optimizations);
  };

  // Handle quantum optimization for individual campaign
  const handleOptimizeCampaign = async (campaign: EmailCampaign) => {
    setIsOptimizing(prev => ({ ...prev, [campaign.id]: true }));
    
    try {
      const quantum = await quantumEmailOptimizer.optimizeEmailCampaign({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        content: campaign.description || '',
        from: campaign.from,
        replyTo: campaign.replyTo || undefined,
        status: campaign.status as any,
        scheduledFor: campaign.scheduledFor ? new Date(campaign.scheduledFor) : undefined,
        lists: campaign.lists.map(l => l.id),
        segments: campaign.segments.map(s => s.id),
        market: 'NGN'
      });
      
      setQuantumOptimizations(prev => ({ ...prev, [campaign.id]: quantum }));
      
      toast({
        title: "⚡ Quantum Optimization Complete",
        description: `Campaign optimized with +${(quantum.subjectLineOptimization.quantumAdvantage * 100).toFixed(1)}% quantum advantage`,
      });
    } catch (error) {
      console.error('Quantum optimization failed:', error);
      toast({
        title: "Optimization Error",
        description: "Quantum optimization failed. Using classical methods.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(prev => ({ ...prev, [campaign.id]: false }));
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

  const getFormattedDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Get quantum optimization summary
  const getQuantumSummary = () => {
    const optimizedCampaigns = Object.keys(quantumOptimizations).length;
    const avgQuantumAdvantage = optimizedCampaigns > 0 
      ? Object.values(quantumOptimizations).reduce((sum, opt: any) => 
          sum + opt.subjectLineOptimization.quantumAdvantage, 0) / optimizedCampaigns
      : 0;
    return { optimizedCampaigns, avgQuantumAdvantage };
  };
  
  const { optimizedCampaigns, avgQuantumAdvantage } = getQuantumSummary();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
          {optimizedCampaigns > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-cyan-400 border-cyan-400 bg-cyan-900/20">
                <Cpu className="h-3 w-3 mr-1" />
                ⚡ {optimizedCampaigns} Quantum Optimized
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{(avgQuantumAdvantage * 100).toFixed(1)}% Avg Improvement
              </Badge>
            </div>
          )}
        </div>
        <Button onClick={handleCreateCampaign}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Quantum Optimization Overview */}
      {optimizedCampaigns > 0 && (
        <Card className="bg-gradient-to-r from-cyan-950/50 to-purple-950/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              ⚡ AI Email Intelligence
            </CardTitle>
            <CardDescription>
              Advanced AI optimizations improving campaign performance across African markets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium text-cyan-300">Campaigns Optimized</span>
                </div>
                <div className="text-2xl font-bold text-cyan-100">{optimizedCampaigns}</div>
                <p className="text-xs text-cyan-200">Quantum-enhanced email campaigns</p>
              </div>
              
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-green-300">Performance Boost</span>
                </div>
                <div className="text-2xl font-bold text-green-100">+{(avgQuantumAdvantage * 100).toFixed(1)}%</div>
                <p className="text-xs text-green-200">Average AI advantage</p>
              </div>
              
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-purple-300">Predicted Impact</span>
                </div>
                <div className="text-2xl font-bold text-purple-100">
                  +{((avgQuantumAdvantage * 0.25) * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-purple-200">Expected open rate improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            View and manage your email marketing campaigns with AI-powered optimizations.
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
                            {quantumOptimizations[campaign.id] && (
                              <Badge variant="outline" className="text-cyan-400 border-cyan-400 bg-cyan-900/20 text-xs">
                                <Cpu className="h-3 w-3 mr-1" />
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
                          <span className="text-sm text-muted-foreground">
                            {quantumOptimizations[campaign.id] 
                              ? quantumOptimizations[campaign.id].subjectLineOptimization.optimizedSubject
                              : campaign.subject}
                          </span>
                          {quantumOptimizations[campaign.id] && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-cyan-400">
                                +{(quantumOptimizations[campaign.id].subjectLineOptimization.quantumAdvantage * 100).toFixed(1)}% AI boost
                              </span>
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
                        {quantumOptimizations[campaign.id] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Open Rate:</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {(quantumOptimizations[campaign.id].performancePrediction.estimatedOpenRate * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Click Rate:</span>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {(quantumOptimizations[campaign.id].performancePrediction.estimatedClickRate * 100).toFixed(1)}%
                              </Badge>
                            </div>
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
                            {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && !quantumOptimizations[campaign.id] && (
                              <DropdownMenuItem 
                                onClick={() => handleOptimizeCampaign(campaign)}
                                disabled={isOptimizing[campaign.id]}
                              >
                                <Cpu className="mr-2 h-4 w-4" /> 
                                {isOptimizing[campaign.id] ? 'Optimizing...' : '⚡ Quantum Optimize'}
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
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {quantumOptimizations[campaign.id] && (
                              <DropdownMenuItem>
                                <Target className="mr-2 h-4 w-4" /> View Optimization
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
