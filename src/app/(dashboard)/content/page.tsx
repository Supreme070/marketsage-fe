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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Copy,
  Eye,
  FileText,
  Calendar,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

// Sample email templates data
const emailTemplates = [
  {
    id: "1",
    name: "Welcome Email",
    category: "Onboarding",
    type: "EMAIL",
    lastUpdated: "2024-05-01T10:30:00Z",
    createdBy: "John Doe",
    status: "ACTIVE",
    usageCount: 2450,
    tags: ["welcome", "onboarding"]
  },
  {
    id: "2",
    name: "Monthly Newsletter",
    category: "Newsletter",
    type: "EMAIL",
    lastUpdated: "2024-05-04T14:20:00Z",
    createdBy: "Jane Smith",
    status: "ACTIVE",
    usageCount: 8750,
    tags: ["newsletter", "monthly"]
  },
  {
    id: "3",
    name: "Order Confirmation",
    category: "Transactional",
    type: "EMAIL",
    lastUpdated: "2024-04-28T09:15:00Z",
    createdBy: "John Doe",
    status: "ACTIVE",
    usageCount: 12340,
    tags: ["order", "transactional"]
  },
  {
    id: "4",
    name: "Abandoned Cart",
    category: "Recovery",
    type: "EMAIL",
    lastUpdated: "2024-04-25T11:45:00Z",
    createdBy: "Jane Smith",
    status: "ACTIVE",
    usageCount: 5680,
    tags: ["cart", "recovery"]
  },
  {
    id: "5",
    name: "Product Recommendation",
    category: "Marketing",
    type: "EMAIL",
    lastUpdated: "2024-05-02T16:30:00Z",
    createdBy: "John Doe",
    status: "DRAFT",
    usageCount: 0,
    tags: ["products", "recommendation"]
  }
];

// Sample SMS templates data
const smsTemplates = [
  {
    id: "1",
    name: "Order Delivery Update",
    category: "Transactional",
    type: "SMS",
    lastUpdated: "2024-04-29T10:15:00Z",
    createdBy: "John Doe",
    status: "ACTIVE",
    usageCount: 3650,
    tags: ["delivery", "order"]
  },
  {
    id: "2",
    name: "Appointment Reminder",
    category: "Reminder",
    type: "SMS",
    lastUpdated: "2024-05-03T15:30:00Z",
    createdBy: "Jane Smith",
    status: "ACTIVE",
    usageCount: 4280,
    tags: ["appointment", "reminder"]
  },
  {
    id: "3",
    name: "Flash Sale Alert",
    category: "Marketing",
    type: "SMS",
    lastUpdated: "2024-05-01T09:45:00Z",
    createdBy: "John Doe",
    status: "ACTIVE",
    usageCount: 7890,
    tags: ["sale", "marketing"]
  },
  {
    id: "4",
    name: "Payment Confirmation",
    category: "Transactional",
    type: "SMS",
    lastUpdated: "2024-04-28T14:20:00Z",
    createdBy: "System",
    status: "ACTIVE",
    usageCount: 9240,
    tags: ["payment", "transactional"]
  }
];

// Sample WhatsApp templates data
const whatsappTemplates = [
  {
    id: "1",
    name: "Order Confirmation",
    category: "Transactional",
    type: "WHATSAPP",
    lastUpdated: "2024-04-30T11:20:00Z",
    createdBy: "John Doe",
    status: "ACTIVE",
    usageCount: 2870,
    tags: ["order", "confirmation"]
  },
  {
    id: "2",
    name: "Shipping Update",
    category: "Transactional",
    type: "WHATSAPP",
    lastUpdated: "2024-05-02T13:45:00Z",
    createdBy: "System",
    status: "ACTIVE",
    usageCount: 3450,
    tags: ["shipping", "tracking"]
  },
  {
    id: "3",
    name: "Service Appointment",
    category: "Reminder",
    type: "WHATSAPP",
    lastUpdated: "2024-05-04T09:30:00Z",
    createdBy: "Jane Smith",
    status: "ACTIVE",
    usageCount: 1890,
    tags: ["appointment", "service"]
  },
  {
    id: "4",
    name: "Welcome Message",
    category: "Onboarding",
    type: "WHATSAPP",
    lastUpdated: "2024-04-27T16:15:00Z",
    createdBy: "John Doe",
    status: "DRAFT",
    usageCount: 0,
    tags: ["welcome", "onboarding"]
  }
];

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("email");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to get unique categories
  const getCategories = (templates: any[]) => {
    const categories = [...new Set(templates.map(t => t.category))];
    const counts: Record<string, number> = {};
    
    templates.forEach(template => {
      counts[template.category] = (counts[template.category] || 0) + 1;
    });
    
    return { categories, counts };
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get template icon based on type
  const getTemplateIcon = (type: string) => {
    switch(type) {
      case 'EMAIL':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'WHATSAPP':
        return <MessageCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Filter templates based on active tab and filters
  const filteredTemplates = () => {
    let templates: any[] = [];
    
    switch(activeTab) {
      case 'email':
        templates = emailTemplates;
        break;
      case 'sms':
        templates = smsTemplates;
        break;
      case 'whatsapp':
        templates = whatsappTemplates;
        break;
      default:
        templates = [...emailTemplates, ...smsTemplates, ...whatsappTemplates];
    }
    
    return templates.filter(template => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !template.name.toLowerCase().includes(searchLower) &&
          !template.category.toLowerCase().includes(searchLower) &&
          !template.createdBy.toLowerCase().includes(searchLower) &&
          !template.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }
      
      // Category filter
      if (categoryFilter && template.category !== categoryFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter && template.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  };

  const templates = filteredTemplates();
  const { categories, counts } = getCategories(
    activeTab === 'email' ? emailTemplates : 
    activeTab === 'sms' ? smsTemplates : 
    activeTab === 'whatsapp' ? whatsappTemplates :
    [...emailTemplates, ...smsTemplates, ...whatsappTemplates]
  );

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Content</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/email/templates/new">
                <Mail className="mr-2 h-4 w-4" /> Email Template
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/sms/templates/new">
                <MessageSquare className="mr-2 h-4 w-4" /> SMS Template
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/whatsapp/templates/new">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Template
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailTemplates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Mail className="inline mr-1 h-3 w-3" />
              <Link href="/email/templates" className="hover:underline">View all</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SMS Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smsTemplates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <MessageSquare className="inline mr-1 h-3 w-3" />
              <Link href="/sms/templates" className="hover:underline">View all</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whatsappTemplates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <MessageCircle className="inline mr-1 h-3 w-3" />
              <Link href="/whatsapp/templates" className="hover:underline">View all</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Manage your email, SMS, and WhatsApp templates for campaigns and automations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full" onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="email" className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  All
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search templates..."
                    className="pl-8 w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                      {(categoryFilter || statusFilter) && (
                        <Badge variant="secondary" className="ml-2 px-1">
                          {Number(!!categoryFilter) + Number(!!statusFilter)}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.map(category => (
                      <DropdownMenuItem
                        key={category}
                        className="flex items-center justify-between"
                        onClick={() => setCategoryFilter(categoryFilter === category ? null : category)}
                      >
                        <span className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${categoryFilter === category ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                          <span>{category}</span>
                        </span>
                        <Badge variant="outline" className="ml-2">{counts[category]}</Badge>
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      className="flex items-center justify-between"
                      onClick={() => setStatusFilter(statusFilter === "ACTIVE" ? null : "ACTIVE")}
                    >
                      <span className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${statusFilter === "ACTIVE" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                        <span>Active</span>
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center justify-between"
                      onClick={() => setStatusFilter(statusFilter === "DRAFT" ? null : "DRAFT")}
                    >
                      <span className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${statusFilter === "DRAFT" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                        <span>Draft</span>
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="email" className="mt-0">
              <TemplateTable templates={templates} formatDate={formatDate} getStatusBadge={getStatusBadge} getTemplateIcon={getTemplateIcon} />
            </TabsContent>
            
            <TabsContent value="sms" className="mt-0">
              <TemplateTable templates={templates} formatDate={formatDate} getStatusBadge={getStatusBadge} getTemplateIcon={getTemplateIcon} />
            </TabsContent>
            
            <TabsContent value="whatsapp" className="mt-0">
              <TemplateTable templates={templates} formatDate={formatDate} getStatusBadge={getStatusBadge} getTemplateIcon={getTemplateIcon} />
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <TemplateTable templates={templates} formatDate={formatDate} getStatusBadge={getStatusBadge} getTemplateIcon={getTemplateIcon} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Template table component to avoid repetition
function TemplateTable({ 
  templates, 
  formatDate, 
  getStatusBadge, 
  getTemplateIcon 
}: { 
  templates: any[],
  formatDate: (date: string) => string,
  getStatusBadge: (status: string) => JSX.Element,
  getTemplateIcon: (type: string) => JSX.Element
}) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No templates found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filter to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Template</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id + "-" + template.type}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {getTemplateIcon(template.type)}
                  <div className="ml-2 flex flex-col">
                    <span>{template.name}</span>
                    <span className="text-xs text-muted-foreground">by {template.createdBy}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{template.category}</TableCell>
              <TableCell>{getStatusBadge(template.status)}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(template.lastUpdated)}</span>
                </div>
              </TableCell>
              <TableCell>
                {template.usageCount.toLocaleString()} 
                {template.usageCount > 0 && <span className="text-xs text-muted-foreground ml-1">sends</span>}
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
                      <Link href={`/${template.type.toLowerCase()}/templates/${template.id}`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${template.type.toLowerCase()}/templates/${template.id}/preview`}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </Link>
                    </DropdownMenuItem>
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
  );
} 