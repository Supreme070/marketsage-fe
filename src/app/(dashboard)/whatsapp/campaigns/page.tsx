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
  MessageCircle,
  BarChart,
  Clock,
  Copy,
  Users,
  Calendar,
  CheckCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

// Sample WhatsApp campaign data
const whatsappCampaigns = [
  {
    id: "1",
    name: "Order Confirmation Template",
    status: "ACTIVE",
    recipients: 1892,
    openRate: 98.7,
    responseRate: 24.3,
    scheduledDate: "2024-04-15T00:00:00Z",
    lastUpdated: "2024-05-01T10:40:00Z",
    createdBy: "John Doe",
    template: "order_confirmation",
    tags: ["transactional", "orders"]
  },
  {
    id: "2",
    name: "Service Disruption Alert",
    status: "COMPLETED",
    recipients: 567,
    openRate: 94.2,
    responseRate: 15.5,
    scheduledDate: "2024-04-25T06:30:00Z",
    lastUpdated: "2024-04-25T06:45:00Z",
    createdBy: "System",
    template: "service_alert",
    tags: ["alerts", "service"]
  },
  {
    id: "3",
    name: "Appointment Reminder - Lagos Clinic",
    status: "SCHEDULED",
    recipients: 143,
    openRate: null,
    responseRate: null,
    scheduledDate: "2024-05-12T09:00:00Z",
    lastUpdated: "2024-05-04T08:20:00Z",
    createdBy: "Jane Smith",
    template: "appointment_reminder",
    tags: ["healthcare", "reminders", "lagos"]
  },
  {
    id: "4",
    name: "Product Restock Notification",
    status: "ACTIVE",
    recipients: 452,
    openRate: 92.1,
    responseRate: 18.7,
    scheduledDate: "2024-04-30T12:00:00Z",
    lastUpdated: "2024-04-30T12:05:00Z",
    createdBy: "John Doe",
    template: "restock_notification",
    tags: ["ecommerce", "notifications"]
  },
  {
    id: "5",
    name: "Payment Confirmation",
    status: "ACTIVE",
    recipients: 876,
    openRate: 96.5,
    responseRate: 12.8,
    scheduledDate: "2024-05-01T00:00:00Z",
    lastUpdated: "2024-05-01T00:10:00Z",
    createdBy: "System",
    template: "payment_confirmation",
    tags: ["transactional", "payments"]
  },
  {
    id: "6",
    name: "Customer Feedback Request",
    status: "DRAFT",
    recipients: 0,
    openRate: null,
    responseRate: null,
    scheduledDate: null,
    lastUpdated: "2024-05-03T11:45:00Z",
    createdBy: "Jane Smith",
    template: "feedback_request",
    tags: ["feedback", "customer-service"]
  },
  {
    id: "7",
    name: "Shipment Tracking Update",
    status: "ACTIVE",
    recipients: 328,
    openRate: 97.2,
    responseRate: 8.5,
    scheduledDate: "2024-05-04T09:00:00Z",
    lastUpdated: "2024-05-04T09:05:00Z",
    createdBy: "John Doe",
    template: "shipment_tracking",
    tags: ["logistics", "notifications"]
  },
  {
    id: "8",
    name: "Nairobi Event Reminder",
    status: "SCHEDULED",
    recipients: 215,
    openRate: null,
    responseRate: null,
    scheduledDate: "2024-05-20T08:00:00Z",
    lastUpdated: "2024-05-05T14:30:00Z",
    createdBy: "Jane Smith",
    template: "event_reminder",
    tags: ["events", "kenya", "nairobi"]
  }
];

export default function WhatsAppCampaignsPage() {
  const [campaigns] = useState(whatsappCampaigns);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string | null>(null);
  
  const itemsPerPage = 5;
  const filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.createdBy.toLowerCase().includes(searchLower) ||
        campaign.template.toLowerCase().includes(searchLower) ||
        (campaign.tags && campaign.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Status filter
    if (statusFilter && campaign.status !== statusFilter) {
      return false;
    }

    // Template filter
    if (templateFilter && campaign.template !== templateFilter) {
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

  // Get unique templates
  const templates = [...new Set(campaigns.map(c => c.template))];
  const templateCounts: Record<string, number> = {};
  campaigns.forEach(campaign => {
    templateCounts[campaign.template] = (templateCounts[campaign.template] || 0) + 1;
  });

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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your WhatsApp Business message campaigns and templates.
          </p>
        </div>
        <Button asChild>
          <Link href="/whatsapp/campaigns/new">
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
            <CardTitle className="text-sm font-medium">Delivered Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.COMPLETED}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="inline mr-1 h-3 w-3" />
              Successfully completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Read Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                campaigns
                  .filter(c => c.openRate !== null)
                  .reduce((acc, curr) => acc + (curr.openRate || 0), 0) / 
                campaigns.filter(c => c.openRate !== null).length
              )}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <BarChart className="inline mr-1 h-3 w-3" />
              Messages opened
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Templates Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
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
                  <DropdownMenuLabel>Filter by Template</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {templates.map(template => (
                    <DropdownMenuItem
                      key={template}
                      className="flex items-center justify-between"
                      onClick={() => {
                        setTemplateFilter(templateFilter === template ? null : template);
                        setPage(1);
                      }}
                    >
                      <span className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${templateFilter === template ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                        <span>{template.replace(/_/g, ' ')}</span>
                      </span>
                      <Badge variant="outline" className="ml-2">{templateCounts[template]}</Badge>
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
                  <TableHead>Template</TableHead>
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
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        {campaign.template.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
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
                          <span>Read: {campaign.openRate}%</span>
                          {campaign.responseRate !== null && (
                            <span>Response: {campaign.responseRate}%</span>
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
                            <Link href={`/whatsapp/campaigns/${campaign.id}`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {(campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED') && (
                            <DropdownMenuItem asChild>
                              <Link href={`/whatsapp/campaigns/${campaign.id}/stats`}>
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