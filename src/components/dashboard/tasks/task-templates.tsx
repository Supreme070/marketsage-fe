"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Filter, 
  Play, 
  Copy, 
  Eye, 
  Star,
  Users,
  Mail,
  MessageSquare,
  Clock,
  Target,
  DollarSign,
  Megaphone,
  TrendingUp,
  Calendar,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Heart,
  Bookmark
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: "marketing" | "sales" | "content" | "onboarding" | "campaign";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  tasks: number;
  channels: string[];
  rating: number;
  usageCount: number;
  tags: string[];
  isFavorite?: boolean;
  createdBy: string;
  lastUsed?: string;
  preview: {
    tasks: Array<{
      name: string;
      type: "email" | "sms" | "whatsapp" | "call" | "meeting" | "analysis";
      description: string;
      duration: string;
    }>;
  };
}

export function TaskTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "marketing" as const,
    difficulty: "beginner" as const,
    estimatedTime: "",
    channels: [] as string[],
    tags: "",
    tasks: [] as any[]
  });

  // Enhanced mock data with more templates
  const [templates, setTemplates] = useState<TaskTemplate[]>([
    {
      id: "1",
      name: "Email Campaign Launch",
      description: "Complete workflow for launching email marketing campaigns targeting Nigerian SMEs",
      category: "marketing",
      difficulty: "intermediate",
      estimatedTime: "5 days",
      tasks: 8,
      channels: ["Email", "Analytics"],
      rating: 4.8,
      usageCount: 342,
      tags: ["email", "campaign", "sme", "nigeria"],
      isFavorite: true,
      createdBy: "MarketSage Team",
      lastUsed: "2024-02-01",
      preview: {
        tasks: [
          { name: "Campaign Strategy Planning", type: "analysis", description: "Define target audience and campaign objectives", duration: "2h" },
          { name: "Content Creation", type: "email", description: "Write compelling email copy and subject lines", duration: "4h" },
          { name: "Design Email Template", type: "email", description: "Create responsive email design", duration: "3h" },
          { name: "Audience Segmentation", type: "analysis", description: "Segment contacts based on demographics", duration: "1h" },
          { name: "A/B Test Setup", type: "email", description: "Configure split testing for subject lines", duration: "30m" },
          { name: "Campaign Launch", type: "email", description: "Send campaign to target segments", duration: "15m" },
          { name: "Performance Monitoring", type: "analysis", description: "Track open rates and engagement", duration: "1h" },
          { name: "Results Analysis", type: "analysis", description: "Analyze campaign performance and ROI", duration: "2h" }
        ]
      }
    },
    {
      id: "2",
      name: "Sales Lead Follow-up",
      description: "Systematic approach to following up with qualified leads through multiple touchpoints",
      category: "sales",
      difficulty: "beginner",
      estimatedTime: "7 days",
      tasks: 6,
      channels: ["Email", "Phone", "WhatsApp"],
      rating: 4.9,
      usageCount: 567,
      tags: ["sales", "follow-up", "leads", "conversion"],
      isFavorite: false,
      createdBy: "Tunde Bakare",
      lastUsed: "2024-01-28",
      preview: {
        tasks: [
          { name: "Initial Contact Email", type: "email", description: "Send personalized introduction email", duration: "15m" },
          { name: "Wait 2 Days", type: "analysis", description: "Allow time for prospect to respond", duration: "2d" },
          { name: "Follow-up Call", type: "call", description: "Make discovery call to understand needs", duration: "30m" },
          { name: "Send Proposal", type: "email", description: "Email customized proposal based on call", duration: "1h" },
          { name: "WhatsApp Check-in", type: "whatsapp", description: "Casual follow-up via WhatsApp", duration: "5m" },
          { name: "Closing Call", type: "call", description: "Final call to close the deal", duration: "45m" }
        ]
      }
    },
    {
      id: "3",
      name: "Content Marketing Series",
      description: "Create and distribute valuable content to attract and engage Nigerian business audience",
      category: "content",
      difficulty: "advanced",
      estimatedTime: "14 days",
      tasks: 12,
      channels: ["Social Media", "Email", "Blog"],
      rating: 4.7,
      usageCount: 234,
      tags: ["content", "social-media", "blog", "engagement"],
      isFavorite: true,
      createdBy: "Fatima Abdullahi",
      lastUsed: "2024-01-30",
      preview: {
        tasks: [
          { name: "Content Strategy Planning", type: "analysis", description: "Plan content themes and calendar", duration: "3h" },
          { name: "Blog Post Writing", type: "email", description: "Write educational blog post", duration: "4h" },
          { name: "Social Media Graphics", type: "analysis", description: "Create visual content for posts", duration: "2h" },
          { name: "LinkedIn Article", type: "email", description: "Write thought leadership article", duration: "2h" },
          { name: "Instagram Content", type: "analysis", description: "Create Instagram posts and stories", duration: "1h" },
          { name: "Email Newsletter", type: "email", description: "Compile content into newsletter", duration: "1h" },
          { name: "Content Distribution", type: "analysis", description: "Share across all channels", duration: "30m" },
          { name: "Engagement Monitoring", type: "analysis", description: "Track likes, shares, comments", duration: "30m" },
          { name: "Community Management", type: "analysis", description: "Respond to comments and messages", duration: "1h" },
          { name: "Performance Analysis", type: "analysis", description: "Analyze content performance", duration: "1h" },
          { name: "Content Optimization", type: "analysis", description: "Optimize based on insights", duration: "1h" },
          { name: "Next Week Planning", type: "analysis", description: "Plan content for following week", duration: "2h" }
        ]
      }
    },
    {
      id: "4",
      name: "Customer Onboarding",
      description: "Comprehensive onboarding process for new enterprise clients in Nigeria",
      category: "onboarding",
      difficulty: "intermediate",
      estimatedTime: "10 days",
      tasks: 9,
      channels: ["Email", "Phone", "WhatsApp", "Meeting"],
      rating: 4.6,
      usageCount: 189,
      tags: ["onboarding", "enterprise", "training", "setup"],
      isFavorite: false,
      createdBy: "Ngozi Okafor",
      lastUsed: "2024-02-02",
      preview: {
        tasks: [
          { name: "Welcome Email", type: "email", description: "Send welcome package and next steps", duration: "20m" },
          { name: "Kickoff Call", type: "call", description: "Introduction call with key stakeholders", duration: "1h" },
          { name: "Account Setup", type: "analysis", description: "Configure client account and permissions", duration: "2h" },
          { name: "Training Session 1", type: "meeting", description: "Basic platform training", duration: "2h" },
          { name: "Check-in Call", type: "call", description: "Address questions and concerns", duration: "30m" },
          { name: "Training Session 2", type: "meeting", description: "Advanced features training", duration: "2h" },
          { name: "WhatsApp Support", type: "whatsapp", description: "Provide ongoing support via WhatsApp", duration: "ongoing" },
          { name: "Success Metrics Review", type: "meeting", description: "Review goals and success metrics", duration: "1h" },
          { name: "Onboarding Survey", type: "email", description: "Collect feedback on onboarding experience", duration: "10m" }
        ]
      }
    },
    {
      id: "5",
      name: "Product Launch Campaign",
      description: "Multi-channel campaign for launching new products in the Nigerian market",
      category: "campaign",
      difficulty: "advanced",
      estimatedTime: "21 days",
      tasks: 15,
      channels: ["Email", "SMS", "WhatsApp", "Social Media"],
      rating: 4.8,
      usageCount: 156,
      tags: ["product-launch", "multi-channel", "nigeria", "awareness"],
      isFavorite: true,
      createdBy: "Adebayo Ogundimu",
      lastUsed: "2024-01-25",
      preview: {
        tasks: [
          { name: "Launch Strategy", type: "analysis", description: "Develop comprehensive launch strategy", duration: "4h" },
          { name: "Market Research", type: "analysis", description: "Research Nigerian market preferences", duration: "6h" },
          { name: "Messaging Framework", type: "analysis", description: "Create key messages and positioning", duration: "3h" },
          { name: "Email Sequence", type: "email", description: "Create pre-launch email sequence", duration: "4h" },
          { name: "Social Media Content", type: "analysis", description: "Develop social media content calendar", duration: "3h" },
          { name: "Influencer Outreach", type: "email", description: "Contact Nigerian influencers", duration: "2h" },
          { name: "Press Release", type: "email", description: "Write and distribute press release", duration: "2h" },
          { name: "Launch Day Coordination", type: "analysis", description: "Coordinate all launch activities", duration: "8h" },
          { name: "WhatsApp Broadcast", type: "whatsapp", description: "Send launch announcement via WhatsApp", duration: "30m" },
          { name: "SMS Campaign", type: "sms", description: "Send SMS to customer database", duration: "30m" },
          { name: "Social Media Blitz", type: "analysis", description: "Execute social media campaign", duration: "2h" },
          { name: "Media Monitoring", type: "analysis", description: "Monitor mentions and coverage", duration: "2h" },
          { name: "Customer Feedback", type: "analysis", description: "Collect and analyze customer feedback", duration: "2h" },
          { name: "Performance Review", type: "analysis", description: "Analyze launch performance", duration: "3h" },
          { name: "Post-Launch Optimization", type: "analysis", description: "Optimize based on results", duration: "2h" }
        ]
      }
    }
  ]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Apply filters
    if (selectedCategory !== "all") {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "popular":
        filtered = filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "rating":
        filtered = filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "recent":
        filtered = filtered.sort((a, b) => 
          new Date(b.lastUsed || "2024-01-01").getTime() - 
          new Date(a.lastUsed || "2024-01-01").getTime()
        );
        break;
      case "name":
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [templates, selectedCategory, selectedDifficulty, searchTerm, sortBy]);

  // Toggle favorite
  const toggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(template =>
      template.id === templateId 
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    ));
  };

  // Use template (create tasks from template)
  const useTemplate = (template: TaskTemplate) => {
    // This would typically create actual tasks in the Kanban board
    console.log("Using template:", template.name);
    
    // Update usage count
    setTemplates(prev => prev.map(t =>
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString().split('T')[0] }
        : t
    ));
    
    // Close dialog if open
    setSelectedTemplate(null);
    
    // In a real app, you'd navigate to the Kanban board with the new tasks
    alert(`Created ${template.tasks} tasks from "${template.name}" template!`);
  };

  // Create new template
  const createTemplate = () => {
    if (!newTemplate.name || !newTemplate.description) return;

    const template: TaskTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category,
      difficulty: newTemplate.difficulty,
      estimatedTime: newTemplate.estimatedTime || "1 day",
      tasks: newTemplate.tasks.length || 1,
      channels: newTemplate.channels,
      rating: 0,
      usageCount: 0,
      tags: newTemplate.tags.split(",").map(tag => tag.trim()),
      isFavorite: false,
      createdBy: "You",
      preview: {
        tasks: newTemplate.tasks.length > 0 ? newTemplate.tasks : [
          { name: "Template Task", type: "analysis", description: "Complete this task", duration: "1h" }
        ]
      }
    };

    setTemplates(prev => [template, ...prev]);
    setNewTemplate({
      name: "",
      description: "",
      category: "marketing",
      difficulty: "beginner",
      estimatedTime: "",
      channels: [],
      tags: "",
      tasks: []
    });
    setShowCreateDialog(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "marketing": return <Megaphone className="h-4 w-4" />;
      case "sales": return <DollarSign className="h-4 w-4" />;
      case "content": return <MessageSquare className="h-4 w-4" />;
      case "onboarding": return <Users className="h-4 w-4" />;
      case "campaign": return <Target className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "marketing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "sales": return "bg-green-100 text-green-800 border-green-200";
      case "content": return "bg-purple-100 text-purple-800 border-purple-200";
      case "onboarding": return "bg-orange-100 text-orange-800 border-orange-200";
      case "campaign": return "bg-pink-100 text-pink-800 border-pink-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-3 w-3" />;
      case "sms": return <MessageSquare className="h-3 w-3" />;
      case "whatsapp": return <MessageSquare className="h-3 w-3 text-green-600" />;
      case "call": return <MessageSquare className="h-3 w-3 text-blue-600" />;
      case "meeting": return <Users className="h-3 w-3" />;
      case "analysis": return <TrendingUp className="h-3 w-3" />;
      default: return <Star className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Task Templates</CardTitle>
          <CardDescription>
            Pre-built task workflows optimized for marketing and sales teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Templates List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Templates ({filteredTemplates.length})</CardTitle>
            <CardDescription>Click on a template to view details and preview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge className={`text-xs ${getCategoryColor(template.category)}`}>
                          {getCategoryIcon(template.category)}
                          <span className="ml-1">{template.category}</span>
                        </Badge>
                        <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                          {template.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.estimatedTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {template.tasks} tasks
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {template.usageCount} uses
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {template.rating}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Channels:</span>
                    {template.channels.map((channel, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">Tags:</span>
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{template.tags.length - 3} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedTemplate ? "Template Preview" : "Select Template"}
            </CardTitle>
            <CardDescription>
              {selectedTemplate 
                ? "Task breakdown and workflow details"
                : "Click on a template to view its details"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="space-y-4">
                {/* Template Summary */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedTemplate.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{selectedTemplate.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{selectedTemplate.estimatedTime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tasks:</span>
                      <p className="font-medium">{selectedTemplate.tasks}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rating:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {selectedTemplate.rating}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Used by:</span>
                      <p className="font-medium">{selectedTemplate.usageCount} teams</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Task Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Task Breakdown</h4>
                  {selectedTemplate.preview.tasks.map((task, index) => (
                    <div key={index} className="relative">
                      {/* Connection Line */}
                      {index < selectedTemplate.preview.tasks.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            {getTaskIcon(task.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{task.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {task.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{task.description}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{task.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Use This Template
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Full Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4 mr-2" />
                      Save to Favorites
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a template to view its details and task breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 