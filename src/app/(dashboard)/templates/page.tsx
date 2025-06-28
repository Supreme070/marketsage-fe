"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  Mail,
  MessageSquare,
  MessageCircle,
  Eye,
  Loader2,
  Download,
  Upload,
  LayoutTemplate,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

// Unified template interface
interface Template {
  id: string;
  name: string;
  subject?: string; // For email
  content: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  category: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  tags?: string[];
  preview_url?: string;
}

export default function UnifiedTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<'ALL' | 'EMAIL' | 'SMS' | 'WHATSAPP'>('ALL');
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();
  const { toast } = useToast();

  // Mock data - replace with API calls
  useEffect(() => {
    const mockTemplates: Template[] = [
      // Email Templates
      {
        id: "email-1",
        name: "Welcome Email",
        subject: "Welcome to MarketSage - Let's Get Started!",
        content: "Welcome to our platform! We're excited to have you on board...",
        type: "EMAIL",
        category: "Welcome",
        status: "ACTIVE",
        usage_count: 45,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T14:30:00Z",
        created_by: "Admin",
        tags: ["welcome", "onboarding"],
        preview_url: "/templates/preview/email-1"
      },
      {
        id: "email-2",
        name: "Newsletter Template",
        subject: "Weekly Market Insights from MarketSage",
        content: "Here are this week's top marketing insights...",
        type: "EMAIL",
        category: "Newsletter",
        status: "ACTIVE",
        usage_count: 123,
        created_at: "2024-01-10T09:00:00Z",
        updated_at: "2024-01-25T16:45:00Z",
        created_by: "Marketing Team",
        tags: ["newsletter", "insights"]
      },
      // SMS Templates
      {
        id: "sms-1",
        name: "Order Confirmation",
        content: "Hi {{name}}! Your order #{{order_id}} has been confirmed. Track it here: {{tracking_url}}",
        type: "SMS",
        category: "Transactional",
        status: "ACTIVE",
        usage_count: 67,
        created_at: "2024-01-12T11:30:00Z",
        updated_at: "2024-01-22T09:15:00Z",
        created_by: "Sales Team",
        tags: ["order", "confirmation"]
      },
      {
        id: "sms-2",
        name: "Appointment Reminder",
        content: "Reminder: You have an appointment tomorrow at {{time}}. Reply CONFIRM to confirm or CANCEL to reschedule.",
        type: "SMS",
        category: "Reminder",
        status: "ACTIVE",
        usage_count: 89,
        created_at: "2024-01-08T14:20:00Z",
        updated_at: "2024-01-28T11:10:00Z",
        created_by: "Support Team",
        tags: ["appointment", "reminder"]
      },
      // WhatsApp Templates
      {
        id: "whatsapp-1",
        name: "Payment Confirmation",
        content: "✅ Payment received! Thank you {{name}} for your payment of {{amount}}. Your receipt: {{receipt_url}}",
        type: "WHATSAPP",
        category: "Payment",
        status: "ACTIVE",
        usage_count: 234,
        created_at: "2024-01-05T16:45:00Z",
        updated_at: "2024-01-30T10:20:00Z",
        created_by: "Finance Team",
        tags: ["payment", "receipt"]
      },
      {
        id: "whatsapp-2",
        name: "Support Follow-up",
        content: "Hi {{name}}! 👋 How was your experience with our support team? We'd love your feedback: {{feedback_url}}",
        type: "WHATSAPP",
        category: "Support",
        status: "ACTIVE",
        usage_count: 156,
        created_at: "2024-01-03T12:00:00Z",
        updated_at: "2024-01-26T15:30:00Z",
        created_by: "Support Team",
        tags: ["support", "feedback"]
      }
    ];

    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter templates based on search and type
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.subject?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = activeTab === 'all' || template.type.toLowerCase() === activeTab;
    
    return matchesSearch && matchesType;
  });

  // Get template counts by type
  const getTemplateCount = (type: string) => {
    if (type === 'all') return templates.length;
    return templates.filter(t => t.type.toLowerCase() === type).length;
  };

  const handleCreateTemplate = (type: string) => {
    const routes = {
      email: '/email/templates/new',
      sms: '/sms/templates/new', 
      whatsapp: '/whatsapp/templates/new'
    };
    
    if (type === 'all') {
      // Show selection modal or default to email
      router.push(routes.email);
    } else {
      router.push(routes[type as keyof typeof routes]);
    }
  };

  const handleEditTemplate = (template: Template) => {
    const routes = {
      EMAIL: `/email/templates/${template.id}/edit`,
      SMS: `/sms/templates/${template.id}/edit`,
      WHATSAPP: `/whatsapp/templates/${template.id}/edit`
    };
    
    router.push(routes[template.type]);
  };

  const handleDuplicateTemplate = (template: Template) => {
    toast({
      title: "Template Duplicated",
      description: `Created a copy of "${template.name}"`,
    });
  };

  const handleDeleteTemplate = (template: Template) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      toast({
        title: "Template Deleted",
        description: `"${template.name}" has been deleted`,
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'SMS': return <MessageSquare className="h-4 w-4" />;
      case 'WHATSAPP': return <MessageCircle className="h-4 w-4" />;
      default: return <LayoutTemplate className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SMS': return 'bg-green-100 text-green-800 border-green-200';
      case 'WHATSAPP': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
          <p className="text-muted-foreground">
            Manage all your email, SMS, and WhatsApp templates in one place
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Choose Template Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleCreateTemplate('email')}>
                <Mail className="mr-2 h-4 w-4" />
                Email Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateTemplate('sms')}>
                <MessageSquare className="mr-2 h-4 w-4" />
                SMS Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateTemplate('whatsapp')}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all channels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTemplateCount('email')}</div>
            <p className="text-xs text-muted-foreground">
              Email campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTemplateCount('sms')}</div>
            <p className="text-xs text-muted-foreground">
              Text messages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Templates</CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTemplateCount('whatsapp')}</div>
            <p className="text-xs text-muted-foreground">
              WhatsApp messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Templates</CardTitle>
              <CardDescription>
                View and manage templates across all communication channels
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({templates.length})</TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="mr-2 h-4 w-4" />
                Email ({getTemplateCount('email')})
              </TabsTrigger>
              <TabsTrigger value="sms">
                <MessageSquare className="mr-2 h-4 w-4" />
                SMS ({getTemplateCount('sms')})
              </TabsTrigger>
              <TabsTrigger value="whatsapp">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp ({getTemplateCount('whatsapp')})
              </TabsTrigger>
            </TabsList>

            {/* Templates Table */}
            <div className="rounded-md border">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading templates...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{template.name}</div>
                              {template.subject && (
                                <div className="text-sm text-muted-foreground">
                                  Subject: {template.subject}
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {template.content}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeBadgeColor(template.type)}>
                              <span className="mr-1">{getTypeIcon(template.type)}</span>
                              {template.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{template.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={template.status === 'ACTIVE' ? 'default' : 'secondary'}
                            >
                              {template.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {template.usage_count} times
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(template.updated_at), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                {template.preview_url && (
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTemplate(template)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center p-8">
                          <div className="space-y-2">
                            <LayoutTemplate className="h-8 w-8 mx-auto text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">
                              {searchTerm ? 'No templates found matching your search.' : 'No templates found.'}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCreateTemplate('email')}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create Your First Template
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}