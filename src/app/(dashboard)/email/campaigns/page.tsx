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

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
        <Button onClick={handleCreateCampaign}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            View and manage your email marketing campaigns.
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
                  <TableHead>Lists</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
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
                          <span>{campaign.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {campaign.subject}
                          </span>
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
                        {campaign.lists.length > 0
                          ? campaign.lists.map(list => list.name).join(", ")
                          : "-"}
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
