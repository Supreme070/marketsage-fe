"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  Heart,
  ShoppingCart,
  Gift,
  Zap,
  TrendingUp
} from "lucide-react";

interface JourneyTemplate {
  id: string;
  name: string;
  description: string;
  category: "onboarding" | "engagement" | "retention" | "conversion" | "reactivation";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  steps: number;
  channels: string[];
  rating: number;
  usageCount: number;
  tags: string[];
  preview: {
    steps: Array<{
      name: string;
      type: "email" | "sms" | "whatsapp" | "delay" | "condition";
      description: string;
    }>;
  };
}

export function JourneyTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<JourneyTemplate | null>(null);

  // Mock data for journey templates
  const templates: JourneyTemplate[] = [
    {
      id: "1",
      name: "Welcome Onboarding Series",
      description: "A comprehensive 7-day onboarding journey for new customers in the Nigerian market",
      category: "onboarding",
      difficulty: "beginner",
      estimatedTime: "7 days",
      steps: 6,
      channels: ["Email", "SMS", "WhatsApp"],
      rating: 4.8,
      usageCount: 1247,
      tags: ["welcome", "onboarding", "new-customer", "nigeria"],
      preview: {
        steps: [
          { name: "Welcome Email", type: "email", description: "Warm welcome with company introduction" },
          { name: "Wait 1 Day", type: "delay", description: "Give time to explore" },
          { name: "Getting Started Guide", type: "email", description: "Step-by-step setup instructions" },
          { name: "Check Engagement", type: "condition", description: "Did they open the email?" },
          { name: "WhatsApp Follow-up", type: "whatsapp", description: "Personal touch via WhatsApp" },
          { name: "Completion Survey", type: "email", description: "Gather feedback on onboarding" }
        ]
      }
    },
    {
      id: "2",
      name: "Product Discovery Journey",
      description: "Guide prospects through your product features with interactive demos and trials",
      category: "engagement",
      difficulty: "intermediate",
      estimatedTime: "14 days",
      steps: 8,
      channels: ["Email", "SMS"],
      rating: 4.6,
      usageCount: 892,
      tags: ["product-demo", "trial", "features", "education"],
      preview: {
        steps: [
          { name: "Product Introduction", type: "email", description: "Overview of key features" },
          { name: "Feature Spotlight #1", type: "email", description: "Deep dive into main feature" },
          { name: "Wait 2 Days", type: "delay", description: "Allow time to explore" },
          { name: "Usage Check", type: "condition", description: "Have they used the feature?" },
          { name: "Feature Spotlight #2", type: "email", description: "Second key feature" },
          { name: "SMS Reminder", type: "sms", description: "Quick reminder about trial" },
          { name: "Demo Booking", type: "email", description: "Invite to personal demo" },
          { name: "Trial Extension Offer", type: "email", description: "Extend trial if needed" }
        ]
      }
    },
    {
      id: "3",
      name: "Customer Retention Campaign",
      description: "Re-engage existing customers with personalized offers and content",
      category: "retention",
      difficulty: "advanced",
      estimatedTime: "21 days",
      steps: 10,
      channels: ["Email", "SMS", "WhatsApp"],
      rating: 4.9,
      usageCount: 567,
      tags: ["retention", "loyalty", "personalization", "offers"],
      preview: {
        steps: [
          { name: "Account Health Check", type: "condition", description: "Assess customer activity" },
          { name: "Personalized Offer", type: "email", description: "Tailored to their usage" },
          { name: "Wait 3 Days", type: "delay", description: "Give time to consider" },
          { name: "SMS Follow-up", type: "sms", description: "Gentle reminder about offer" },
          { name: "Success Stories", type: "email", description: "Show how others benefit" },
          { name: "WhatsApp Check-in", type: "whatsapp", description: "Personal touch from account manager" },
          { name: "Exclusive Content", type: "email", description: "Premium tips and insights" },
          { name: "Loyalty Reward", type: "email", description: "Special recognition" },
          { name: "Feedback Request", type: "email", description: "Ask for improvement suggestions" },
          { name: "Renewal Reminder", type: "email", description: "Gentle renewal nudge" }
        ]
      }
    },
    {
      id: "4",
      name: "Abandoned Cart Recovery",
      description: "Win back customers who left items in their cart with strategic follow-ups",
      category: "conversion",
      difficulty: "intermediate",
      estimatedTime: "5 days",
      steps: 5,
      channels: ["Email", "SMS"],
      rating: 4.7,
      usageCount: 1156,
      tags: ["ecommerce", "cart-abandonment", "conversion", "recovery"],
      preview: {
        steps: [
          { name: "Gentle Reminder", type: "email", description: "Remind about items in cart" },
          { name: "Wait 4 Hours", type: "delay", description: "Give immediate chance to return" },
          { name: "Incentive Offer", type: "email", description: "Small discount to encourage purchase" },
          { name: "Wait 1 Day", type: "delay", description: "Allow time to consider" },
          { name: "SMS Urgency", type: "sms", description: "Limited time offer reminder" },
          { name: "Final Attempt", type: "email", description: "Last chance with stronger incentive" }
        ]
      }
    },
    {
      id: "5",
      name: "Seasonal Promotion Campaign",
      description: "Leverage Nigerian holidays and seasons for targeted promotional campaigns",
      category: "conversion",
      difficulty: "beginner",
      estimatedTime: "10 days",
      steps: 7,
      channels: ["Email", "SMS", "WhatsApp"],
      rating: 4.5,
      usageCount: 2134,
      tags: ["seasonal", "promotion", "holidays", "nigeria", "sales"],
      preview: {
        steps: [
          { name: "Season Announcement", type: "email", description: "Build excitement for upcoming sale" },
          { name: "Early Bird Offer", type: "email", description: "Exclusive preview for loyal customers" },
          { name: "Wait 2 Days", type: "delay", description: "Create anticipation" },
          { name: "SMS Flash Sale", type: "sms", description: "Quick 24-hour flash sale" },
          { name: "WhatsApp Exclusive", type: "whatsapp", description: "Special offer for WhatsApp subscribers" },
          { name: "Final Hours", type: "email", description: "Last chance urgency message" },
          { name: "Thank You & Next", type: "email", description: "Appreciation and preview next season" }
        ]
      }
    },
    {
      id: "6",
      name: "Win-Back Inactive Users",
      description: "Re-engage users who haven't been active for 30+ days",
      category: "reactivation",
      difficulty: "advanced",
      estimatedTime: "30 days",
      steps: 12,
      channels: ["Email", "SMS", "WhatsApp"],
      rating: 4.4,
      usageCount: 445,
      tags: ["reactivation", "inactive", "win-back", "engagement"],
      preview: {
        steps: [
          { name: "We Miss You", type: "email", description: "Emotional reconnection message" },
          { name: "Wait 3 Days", type: "delay", description: "Give time to respond" },
          { name: "What's New", type: "email", description: "Show new features and improvements" },
          { name: "Engagement Check", type: "condition", description: "Did they engage?" },
          { name: "Special Comeback Offer", type: "email", description: "Incentive to return" },
          { name: "SMS Personal Touch", type: "sms", description: "Personal message from team" },
          { name: "Success Stories", type: "email", description: "Show what they're missing" },
          { name: "WhatsApp Outreach", type: "whatsapp", description: "Direct personal contact" },
          { name: "Final Attempt", type: "email", description: "Last chance to re-engage" },
          { name: "Feedback Survey", type: "email", description: "Understand why they left" },
          { name: "Graceful Goodbye", type: "email", description: "Respectful farewell if no response" },
          { name: "Future Opportunity", type: "email", description: "Leave door open for future" }
        ]
      }
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "onboarding": return <Users className="h-4 w-4" />;
      case "engagement": return <Heart className="h-4 w-4" />;
      case "retention": return <Target className="h-4 w-4" />;
      case "conversion": return <ShoppingCart className="h-4 w-4" />;
      case "reactivation": return <Zap className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "onboarding": return "bg-blue-100 text-blue-800 border-blue-200";
      case "engagement": return "bg-pink-100 text-pink-800 border-pink-200";
      case "retention": return "bg-green-100 text-green-800 border-green-200";
      case "conversion": return "bg-purple-100 text-purple-800 border-purple-200";
      case "reactivation": return "bg-orange-100 text-orange-800 border-orange-200";
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

  const getStepIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-3 w-3" />;
      case "sms": return <MessageSquare className="h-3 w-3" />;
      case "whatsapp": return <MessageSquare className="h-3 w-3 text-green-600" />;
      case "delay": return <Clock className="h-3 w-3" />;
      case "condition": return <Target className="h-3 w-3" />;
      default: return <Star className="h-3 w-3" />;
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Handle template actions
  const handleMoreFilters = () => {
    console.log("Opening advanced filters");
    alert("Advanced filters would open here with options for tags, channels, rating, etc.");
  };

  const handlePreviewTemplate = (template: JourneyTemplate, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    console.log("Previewing template:", template.name);
    alert(`Preview for "${template.name}" would open in a modal showing the complete journey flow.`);
  };

  const handleUseTemplate = (template: JourneyTemplate, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    console.log("Using template:", template.name);
    alert(`Template "${template.name}" would be loaded into the journey builder for customization.`);
  };

  const handleFullPreview = () => {
    if (!selectedTemplate) return;
    console.log("Opening full preview for:", selectedTemplate.name);
    alert(`Full preview for "${selectedTemplate.name}" would open showing detailed journey visualization.`);
  };

  const handleFavoriteTemplate = () => {
    if (!selectedTemplate) return;
    console.log("Adding template to favorites:", selectedTemplate.name);
    alert(`Template "${selectedTemplate.name}" added to your favorites!`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Journey Templates</CardTitle>
          <CardDescription>
            Pre-built journey templates optimized for the African market
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
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="retention">Retention</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                  <SelectItem value="reactivation">Reactivation</SelectItem>
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
              <Button variant="outline" size="sm" className="flex-1" onClick={handleMoreFilters}>
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
                          <Target className="h-3 w-3" />
                          {template.steps} steps
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
                      <Button size="sm" variant="outline" onClick={(e) => handlePreviewTemplate(template, e)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" onClick={(e) => handleUseTemplate(template, e)}>
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
                ? "Journey steps and configuration"
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
                      <span className="text-muted-foreground">Steps:</span>
                      <p className="font-medium">{selectedTemplate.steps}</p>
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
                      <p className="font-medium">{selectedTemplate.usageCount} marketers</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Journey Steps Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium">Journey Steps</h4>
                  {selectedTemplate.preview.steps.map((step, index) => (
                    <div key={index} className="relative">
                      {/* Connection Line */}
                      {index < selectedTemplate.preview.steps.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            {getStepIcon(step.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{step.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {step.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleFullPreview}>
                    <Copy className="h-4 w-4 mr-2" />
                    Use This Template
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={handleFullPreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Full Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleFavoriteTemplate}>
                      <Star className="h-4 w-4 mr-2" />
                      Save to Favorites
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a template to view its details and preview the journey steps</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 