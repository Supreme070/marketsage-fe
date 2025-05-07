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
  MessageSquare,
  BarChart,
  Clock,
  Copy,
  Users,
  Calendar,
  CheckCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import Link from "next/link";

// Sample SMS campaign data
const smsCampaigns = [
  {
    id: "1",
    name: "Ramadan Sale Reminder",
    status: "COMPLETED",
    recipients: 2130,
    deliveryRate: 98.2,
    clickRate: 8.9,
    scheduledDate: "2024-04-01T12:00:00Z",
    lastUpdated: "2024-04-01T12:15:00Z",
    createdBy: "John Doe",
    provider: "africastalking",
    tags: ["promotion", "seasonal"]
  },
  {
    id: "2",
    name: "Flash Sale - 24 Hours Only",
    status: "SCHEDULED",
    recipients: 3750,
    deliveryRate: null,
    clickRate: null,
    scheduledDate: "2024-05-10T08:00:00Z",
    lastUpdated: "2024-05-02T11:15:00Z",
    createdBy: "Jane Smith",
    provider: "twilio",
    tags: ["promotion", "flash-sale"]
  },
  {
    id: "3",
    name: "Lagos Conference Reminder",
    status: "ACTIVE",
    recipients: 156,
    deliveryRate: 97.4,
    clickRate: 12.3,
    scheduledDate: "2024-05-01T09:00:00Z",
    lastUpdated: "2024-05-01T09:05:00Z",
    createdBy: "John Doe",
    provider: "africastalking",
    tags: ["events", "lagos", "reminders"]
  },
  {
    id: "4",
    name: "Account Security Alert",
    status: "COMPLETED",
    recipients: 427,
    deliveryRate: 99.1,
    clickRate: 32.6,
    scheduledDate: "2024-04-15T10:30:00Z",
    lastUpdated: "2024-04-15T10:35:00Z",
    createdBy: "System",
    provider: "mNotify",
    tags: ["security", "alerts"]
  },
  {
    id: "5",
    name: "May Newsletter Opt-in",
    status: "DRAFT",
    recipients: 0,
    deliveryRate: null,
    clickRate: null,
    scheduledDate: null,
    lastUpdated: "2024-05-03T16:20:00Z",
    createdBy: "Jane Smith",
    provider: "africastalking",
    tags: ["newsletter", "opt-in"]
  },
  {
    id: "6",
    name: "Order Delivery Update",
    status: "ACTIVE",
    recipients: 528,
    deliveryRate: 96.8,
    clickRate: 15.2,
    scheduledDate: "2024-05-02T08:00:00Z",
    lastUpdated: "2024-05-02T08:10:00Z",
    createdBy: "System",
    provider: "twilio",
    tags: ["transactional", "delivery"]
  },
  {
    id: "7",
    name: "Kenya Independence Day Offer",
    status: "SCHEDULED",
    recipients: 1850,
    deliveryRate: null,
    clickRate: null,
    scheduledDate: "2024-06-01T09:00:00Z",
    lastUpdated: "2024-05-04T13:30:00Z",
    createdBy: "John Doe",
    provider: "mNotify",
    tags: ["promotion", "kenya", "holiday"]
  },
  {
    id: "8",
    name: "Account Balance Notification",
    status: "ACTIVE",
    recipients: 765,
    deliveryRate: 98.5,
    clickRate: 5.7,
    scheduledDate: "2024-04-28T00:00:00Z",
    lastUpdated: "2024-04-28T00:10:00Z",
    createdBy: "System",
    provider: "africastalking",
    tags: ["transactional", "banking"]
  }
];

export default function SMSCampaignsPage() {
  const [campaigns] = useState(smsCampaigns);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  
  const itemsPerPage = 5;
  const filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.createdBy.toLowerCase().includes(searchLower) ||
        campaign.provider.toLowerCase().includes(searchLower) ||
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
    ACTIVE: campaigns.filter(c => c.status === "ACTIVE").length,
    COMPLETED: campaigns.filter(c => c.status === "COMPLETED").length,
  };

  // Get unique providers
  const providers = [...new Set(campaigns.map(c => c.provider))];
  const providerCounts: Record<string, number> = {};
  campaigns.forEach(campaign => {
    providerCounts[campaign.provider] = (providerCounts[campaign.provider] || 0) + 1;
  });

  // Calculate total sent messages
  const totalSentMessages = campaigns
    .filter(c => c.status === "ACTIVE" || c.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.recipients, 0);

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
        return <Badge variant="outline">{provider}</Badge>;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SMS Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage SMS campaigns across various African telecom providers.
          </p>
        </div>
        <Button asChild>
          <Link href="/sms/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
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
            <div className="text-2xl font-bold">12</div>
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
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Delivery Date</TableHead>
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
                    <TableCell>{getProviderBadge(campaign.provider)}</TableCell>
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
                          <span>Delivery: {campaign.deliveryRate}%</span>
                          {campaign.clickRate !== null && (
                            <span>Click: {campaign.clickRate}%</span>
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
                            <Link href={`/sms/campaigns/${campaign.id}`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {(campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED') && (
                            <DropdownMenuItem asChild>
                              <Link href={`/sms/campaigns/${campaign.id}/stats`}>
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