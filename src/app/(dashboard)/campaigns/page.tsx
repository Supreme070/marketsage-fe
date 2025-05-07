"use client";

import { useState } from "react";
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
  Mail,
  MessageSquare,
  MessageCircle,
  BarChart,
  Clock,
  Copy,
  Users,
  Calendar,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

// Sample campaign data
const sampleCampaigns = [
  {
    id: "1",
    name: "Nigeria Q2 Product Launch",
    type: "EMAIL",
    status: "SCHEDULED",
    recipients: 1250,
    openRate: null,
    clickRate: null,
    scheduledDate: "2024-05-15T09:00:00Z",
    lastUpdated: "2024-05-05T16:40:00Z",
    createdBy: "John Doe",
    tags: ["product-launch", "nigeria"]
  },
  {
    id: "2",
    name: "Welcome Series - Kenya",
    type: "EMAIL",
    status: "ACTIVE",
    recipients: 835,
    openRate: 32.4,
    clickRate: 12.8,
    scheduledDate: "2024-04-20T08:00:00Z",
    lastUpdated: "2024-05-04T12:30:00Z",
    createdBy: "Jane Smith",
    tags: ["automation", "kenya", "welcome"]
  },
  {
    id: "3",
    name: "Ramadan Sale Reminder",
    type: "SMS",
    status: "COMPLETED",
    recipients: 2130,
    openRate: null,
    clickRate: 8.9,
    scheduledDate: "2024-04-01T12:00:00Z",
    lastUpdated: "2024-04-01T12:15:00Z",
    createdBy: "John Doe",
    tags: ["promotion", "seasonal"]
  },
  {
    id: "4",
    name: "Service Disruption Alert",
    type: "WHATSAPP",
    status: "COMPLETED",
    recipients: 567,
    openRate: 94.2,
    clickRate: null,
    scheduledDate: "2024-04-25T06:30:00Z",
    lastUpdated: "2024-04-25T06:45:00Z",
    createdBy: "System",
    tags: ["alerts", "service"]
  },
  {
    id: "5",
    name: "South Africa Newsletter - May",
    type: "EMAIL",
    status: "DRAFT",
    recipients: 0,
    openRate: null,
    clickRate: null,
    scheduledDate: null,
    lastUpdated: "2024-05-03T14:20:00Z",
    createdBy: "Jane Smith",
    tags: ["newsletter", "southafrica"]
  },
  {
    id: "6",
    name: "Ghana Webinar Invitation",
    type: "EMAIL",
    status: "ACTIVE",
    recipients: 478,
    openRate: 45.6,
    clickRate: 18.2,
    scheduledDate: "2024-04-28T09:00:00Z",
    lastUpdated: "2024-04-28T09:05:00Z",
    createdBy: "John Doe",
    tags: ["webinar", "ghana", "invitation"]
  },
  {
    id: "7",
    name: "Flash Sale - 24 Hours Only",
    type: "SMS",
    status: "SCHEDULED",
    recipients: 3750,
    openRate: null,
    clickRate: null,
    scheduledDate: "2024-05-10T08:00:00Z",
    lastUpdated: "2024-05-02T11:15:00Z",
    createdBy: "Jane Smith",
    tags: ["promotion", "flash-sale"]
  },
  {
    id: "8",
    name: "Order Confirmation Template",
    type: "WHATSAPP",
    status: "ACTIVE",
    recipients: 1892,
    openRate: 98.7,
    clickRate: 24.3,
    scheduledDate: "2024-04-15T00:00:00Z",
    lastUpdated: "2024-05-01T10:40:00Z",
    createdBy: "John Doe",
    tags: ["transactional", "orders"]
  }
];

export default function CampaignsPage() {
  const [campaigns] = useState(sampleCampaigns);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const itemsPerPage = 5;
  const filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.createdBy.toLowerCase().includes(searchLower) ||
        (campaign.tags && campaign.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Type filter
    if (typeFilter && campaign.type !== typeFilter) {
      return false;
    }

    // Status filter
    if (statusFilter && campaign.status !== statusFilter) {
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

  // Stats by type
  const typeCounts = {
    EMAIL: campaigns.filter(c => c.type === "EMAIL").length,
    SMS: campaigns.filter(c => c.type === "SMS").length,
    WHATSAPP: campaigns.filter(c => c.type === "WHATSAPP").length,
  };

  // Stats by status
  const statusCounts = {
    DRAFT: campaigns.filter(c => c.status === "DRAFT").length,
    SCHEDULED: campaigns.filter(c => c.status === "SCHEDULED").length,
    ACTIVE: campaigns.filter(c => c.status === "ACTIVE").length,
    COMPLETED: campaigns.filter(c => c.status === "COMPLETED").length,
  };

  // Get campaign type badge
  const getCampaignTypeBadge = (type: string) => {
    switch(type) {
      case 'EMAIL':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Mail className="mr-1 h-3 w-3" />
            Email
          </Badge>
        );
      case 'SMS':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <MessageSquare className="mr-1 h-3 w-3" />
            SMS
          </Badge>
        );
      case 'WHATSAPP':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            <MessageCircle className="mr-1 h-3 w-3" />
            WhatsApp
          </Badge>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

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

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/email/campaigns/new">
                <Mail className="mr-2 h-4 w-4" /> Email Campaign
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/sms/campaigns/new">
                <MessageSquare className="mr-2 h-4 w-4" /> SMS Campaign
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/whatsapp/campaigns/new">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Campaign
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statusCounts.ACTIVE} active, {statusCounts.SCHEDULED} scheduled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeCounts.EMAIL}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Mail className="inline mr-1 h-3 w-3" />
              <Link href="/email/campaigns" className="hover:underline">View all <ArrowUpRight className="inline h-3 w-3" /></Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SMS Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeCounts.SMS}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <MessageSquare className="inline mr-1 h-3 w-3" />
              <Link href="/sms/campaigns" className="hover:underline">View all <ArrowUpRight className="inline h-3 w-3" /></Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeCounts.WHATSAPP}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <MessageCircle className="inline mr-1 h-3 w-3" />
              <Link href="/whatsapp/campaigns" className="hover:underline">View all <ArrowUpRight className="inline h-3 w-3" /></Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            Manage all your email, SMS, and WhatsApp campaigns.
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
                    {(typeFilter || statusFilter) && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        {Number(!!typeFilter) + Number(!!statusFilter)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setTypeFilter(typeFilter === "EMAIL" ? null : "EMAIL");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${typeFilter === "EMAIL" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Email</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{typeCounts.EMAIL}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setTypeFilter(typeFilter === "SMS" ? null : "SMS");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${typeFilter === "SMS" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>SMS</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{typeCounts.SMS}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setTypeFilter(typeFilter === "WHATSAPP" ? null : "WHATSAPP");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${typeFilter === "WHATSAPP" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>WhatsApp</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{typeCounts.WHATSAPP}</Badge>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalCampaigns}</strong> campaigns
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{campaign.name}</span>
                        <span className="text-xs text-muted-foreground">by {campaign.createdBy}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getCampaignTypeBadge(campaign.type)}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        {campaign.recipients.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' ? (
                        <span className="text-xs text-muted-foreground">Not sent yet</span>
                      ) : (
                        <div className="flex flex-col text-xs">
                          {campaign.openRate !== null && (
                            <span>Opens: {campaign.openRate}%</span>
                          )}
                          {campaign.clickRate !== null && (
                            <span>Clicks: {campaign.clickRate}%</span>
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
                            <Link href={`/${campaign.type.toLowerCase()}/campaigns/${campaign.id}`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {(campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED') && (
                            <DropdownMenuItem asChild>
                              <Link href={`/${campaign.type.toLowerCase()}/campaigns/${campaign.id}/stats`}>
                                <BarChart className="mr-2 h-4 w-4" /> View Stats
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
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

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalCampaigns}</strong> campaigns
            </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 