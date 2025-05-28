"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Mail, 
  MessageSquare, 
  DollarSign,
  Target,
  Megaphone,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Paperclip,
  MessageCircle
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  type: "marketing" | "sales" | "content" | "campaign";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: {
    name: string;
    avatar?: string;
    initials: string;
  };
  dueDate: string;
  campaign?: string;
  deal?: string;
  attachments: number;
  comments: number;
  tags: string[];
  revenue?: number;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

export function KanbanBoard() {
  const [selectedBoard, setSelectedBoard] = useState("marketing");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for Kanban columns and tasks
  const marketingColumns: Column[] = [
    {
      id: "todo",
      title: "To Do",
      color: "bg-gray-100",
      tasks: [
        {
          id: "1",
          title: "Q1 Email Campaign Strategy",
          description: "Develop comprehensive email marketing strategy for Q1 targeting Nigerian SMEs",
          type: "campaign",
          priority: "high",
          assignee: { name: "Adebayo Ogundimu", initials: "AO" },
          dueDate: "2024-02-15",
          campaign: "Q1 Growth Campaign",
          attachments: 3,
          comments: 5,
          tags: ["email", "strategy", "Q1"],
          revenue: 150000
        },
        {
          id: "2",
          title: "Social Media Content Calendar",
          description: "Create February content calendar for Instagram and LinkedIn",
          type: "content",
          priority: "medium",
          assignee: { name: "Fatima Abdullahi", initials: "FA" },
          dueDate: "2024-02-10",
          campaign: "Brand Awareness",
          attachments: 1,
          comments: 2,
          tags: ["social", "content", "calendar"]
        }
      ]
    },
    {
      id: "inprogress",
      title: "In Progress",
      color: "bg-blue-100",
      tasks: [
        {
          id: "3",
          title: "WhatsApp Campaign Setup",
          description: "Configure WhatsApp Business API for customer engagement",
          type: "campaign",
          priority: "high",
          assignee: { name: "Chinedu Okwu", initials: "CO" },
          dueDate: "2024-02-12",
          campaign: "Customer Engagement",
          attachments: 2,
          comments: 8,
          tags: ["whatsapp", "setup", "api"],
          revenue: 75000
        },
        {
          id: "4",
          title: "Landing Page Optimization",
          description: "A/B test landing page for Lagos market segment",
          type: "marketing",
          priority: "medium",
          assignee: { name: "Aisha Mohammed", initials: "AM" },
          dueDate: "2024-02-14",
          campaign: "Conversion Optimization",
          attachments: 4,
          comments: 3,
          tags: ["landing-page", "ab-test", "lagos"]
        }
      ]
    },
    {
      id: "review",
      title: "Review",
      color: "bg-yellow-100",
      tasks: [
        {
          id: "5",
          title: "Campaign Performance Report",
          description: "Analyze January campaign performance and ROI",
          type: "marketing",
          priority: "medium",
          assignee: { name: "Emeka Nwankwo", initials: "EN" },
          dueDate: "2024-02-08",
          campaign: "January Campaigns",
          attachments: 6,
          comments: 12,
          tags: ["analytics", "report", "roi"]
        }
      ]
    },
    {
      id: "done",
      title: "Done",
      color: "bg-green-100",
      tasks: [
        {
          id: "6",
          title: "Email Template Design",
          description: "Design responsive email templates for Nigerian market",
          type: "content",
          priority: "low",
          assignee: { name: "Kemi Adebayo", initials: "KA" },
          dueDate: "2024-02-05",
          campaign: "Template Library",
          attachments: 8,
          comments: 4,
          tags: ["email", "design", "templates"]
        }
      ]
    }
  ];

  const salesColumns: Column[] = [
    {
      id: "leads",
      title: "New Leads",
      color: "bg-purple-100",
      tasks: [
        {
          id: "s1",
          title: "Follow up with Lagos Tech Startup",
          description: "Initial discovery call scheduled for enterprise package",
          type: "sales",
          priority: "high",
          assignee: { name: "Tunde Bakare", initials: "TB" },
          dueDate: "2024-02-09",
          deal: "Lagos Tech - Enterprise",
          attachments: 2,
          comments: 3,
          tags: ["enterprise", "lagos", "tech"],
          revenue: 500000
        }
      ]
    },
    {
      id: "qualified",
      title: "Qualified",
      color: "bg-blue-100",
      tasks: [
        {
          id: "s2",
          title: "Proposal for Abuja SME",
          description: "Prepare custom proposal for manufacturing company",
          type: "sales",
          priority: "high",
          assignee: { name: "Ngozi Okafor", initials: "NO" },
          dueDate: "2024-02-11",
          deal: "Abuja Manufacturing - Custom",
          attachments: 5,
          comments: 7,
          tags: ["proposal", "manufacturing", "abuja"],
          revenue: 250000
        }
      ]
    },
    {
      id: "negotiation",
      title: "Negotiation",
      color: "bg-orange-100",
      tasks: [
        {
          id: "s3",
          title: "Contract Review - Kano Retail",
          description: "Legal review and final negotiations",
          type: "sales",
          priority: "urgent",
          assignee: { name: "Ibrahim Musa", initials: "IM" },
          dueDate: "2024-02-10",
          deal: "Kano Retail Chain",
          attachments: 3,
          comments: 15,
          tags: ["contract", "legal", "kano"],
          revenue: 800000
        }
      ]
    },
    {
      id: "closed",
      title: "Closed Won",
      color: "bg-green-100",
      tasks: [
        {
          id: "s4",
          title: "Onboard Port Harcourt Client",
          description: "Setup and training for new enterprise client",
          type: "sales",
          priority: "medium",
          assignee: { name: "Grace Eze", initials: "GE" },
          dueDate: "2024-02-15",
          deal: "Port Harcourt Oil & Gas",
          attachments: 4,
          comments: 6,
          tags: ["onboarding", "enterprise", "port-harcourt"],
          revenue: 1200000
        }
      ]
    }
  ];

  const currentColumns = selectedBoard === "marketing" ? marketingColumns : salesColumns;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 text-white";
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "marketing": return <Megaphone className="h-4 w-4" />;
      case "sales": return <DollarSign className="h-4 w-4" />;
      case "content": return <MessageSquare className="h-4 w-4" />;
      case "campaign": return <Target className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Board Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Task Boards</CardTitle>
              <CardDescription>
                Manage your marketing campaigns and sales pipeline with ease
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Board Type</label>
              <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing Campaigns</SelectItem>
                  <SelectItem value="sales">Sales Pipeline</SelectItem>
                  <SelectItem value="content">Content Production</SelectItem>
                  <SelectItem value="cross-team">Cross-Team Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Search Tasks</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Quick Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
        {currentColumns.map((column) => (
          <Card key={column.id} className="flex flex-col">
            <CardHeader className={`${column.color} rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{column.title}</CardTitle>
                <Badge variant="secondary">{column.tasks.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-4">
              {column.tasks.map((task) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(task.type)}
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                          {task.priority}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Task Title & Description */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    </div>

                    {/* Campaign/Deal Info */}
                    {(task.campaign || task.deal) && (
                      <div className="mb-3">
                        <Badge variant="outline" className="text-xs">
                          {task.campaign || task.deal}
                        </Badge>
                      </div>
                    )}

                    {/* Revenue */}
                    {task.revenue && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            ₦{(task.revenue / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {task.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{task.tags.length - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Task Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.dueDate).toLocaleDateString('en-NG', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.attachments > 0 && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            <span>{task.attachments}</span>
                          </div>
                        )}
                        {task.comments > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{task.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Task Button */}
              <Button 
                variant="outline" 
                className="w-full border-2 border-dashed border-gray-300 bg-transparent hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 