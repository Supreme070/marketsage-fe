"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Globe,
  Star,
  Clock,
  Users,
  Zap,
  Target,
  CheckCircle,
  Lightbulb,
  Wand2,
  BarChart3,
  Settings,
  RefreshCw,
  Play,
  Loader2,
  Plus,
  Search
} from "lucide-react";
import { toast } from "sonner";

interface SmartTaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string[];
  template_data: {
    title_pattern: string;
    description_template: string;
    default_priority: string;
    estimated_duration: number;
    suggested_tags: string[];
    checklist_items: string[];
  };
  ai_suggestions: {
    context_triggers: string[];
    optimization_recommendations: string[];
    african_market_adaptations: string[];
  };
  usage_analytics: {
    usage_count: number;
    success_rate: number;
    completion_time_avg: number;
    user_satisfaction: number;
  };
  created_by: string;
}

interface TaskSuggestion {
  id: string;
  template_id: string;
  suggested_title: string;
  suggested_description: string;
  confidence: number;
  reasoning: string;
  context: {
    trigger_event: string;
    african_market_context?: {
      country: string;
      cultural_factors: string[];
      timing_recommendations: string[];
    };
  };
  ai_enhancement: {
    content_optimization: string;
    success_prediction: number;
  };
}

export function SmartTaskTemplates() {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [templates, setTemplates] = useState<{
    trending_templates: SmartTaskTemplate[];
    personalized_suggestions: SmartTaskTemplate[];
    african_market_templates: SmartTaskTemplate[];
    new_templates: SmartTaskTemplate[];
  }>({
    trending_templates: [],
    personalized_suggestions: [],
    african_market_templates: [],
    new_templates: []
  });
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<SmartTaskTemplate | null>(null);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [customizations, setCustomizations] = useState({
    title_override: "",
    description_additions: "",
    priority_override: "",
    due_date: "",
    additional_context: ""
  });

  useEffect(() => {
    fetchTemplateRecommendations();
  }, []);

  const fetchTemplateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/ai/tasks/templates?action=recommendations');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.recommendations);
      } else {
        toast.error('Failed to load template recommendations');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error loading smart templates');
    } finally {
      setLoading(false);
    }
  };

  const generateTaskSuggestions = async (triggerEvent: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/ai/tasks/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_suggestions',
          trigger_event: triggerEvent,
          context: {
            user_role: 'manager',
            industry: 'fintech',
            current_projects: ['customer_onboarding', 'product_launch'],
            team_size: 5,
            african_market_context: {
              country: 'NG',
              business_type: 'fintech',
              local_considerations: ['mobile_first', 'low_bandwidth', 'local_payments']
            }
          },
          options: {
            max_suggestions: 6,
            include_african_optimizations: true
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setTaskSuggestions(data.suggestions);
        toast.success(`Generated ${data.suggestions.length} AI task suggestions`);
      } else {
        toast.error('Failed to generate task suggestions');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Error generating AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (templateId: string, customizationData?: any) => {
    try {
      const response = await fetch('/api/v2/ai/tasks/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_template',
          template_id: templateId,
          customizations: customizationData || customizations
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Task created from template', {
          description: `AI enhanced with ${data.ai_enhancements.success_tips?.length || 0} optimization tips`
        });
        setShowCustomizeDialog(false);
        setCustomizations({
          title_override: "",
          description_additions: "",
          priority_override: "",
          due_date: "",
          additional_context: ""
        });
      } else {
        toast.error('Failed to apply template');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Error creating task from template');
    }
  };

  const analyzeAndImprove = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/ai/tasks/templates?action=analyze');
      const data = await response.json();

      if (data.success) {
        toast.success('Template analysis completed', {
          description: `${data.analysis.templates_updated} templates updated, ${data.analysis.new_templates_created} new templates created`
        });
        fetchTemplateRecommendations(); // Refresh recommendations
      } else {
        toast.error('Failed to analyze templates');
      }
    } catch (error) {
      console.error('Error analyzing templates:', error);
      toast.error('Error analyzing templates');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'marketing': return <Target className="h-4 w-4" />;
      case 'development': return <Zap className="h-4 w-4" />;
      case 'customer_service': return <Users className="h-4 w-4" />;
      case 'african_market': return <Globe className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const filteredTemplates = (templateList: SmartTaskTemplate[]) => {
    return templateList.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderTemplateCard = (template: SmartTaskTemplate, showStats = true) => (
    <Card key={template.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(template.category)}
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="mt-1">
                {template.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="text-xs capitalize">
              {template.category.replace('_', ' ')}
            </Badge>
            {template.created_by === 'ai' && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                <Brain className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Template Preview */}
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Title Pattern:</span>
            <p className="text-muted-foreground mt-1 text-xs bg-muted/50 p-2 rounded">
              {template.template_data.title_pattern}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <Badge className={getPriorityColor(template.template_data.default_priority)}>
                {template.template_data.default_priority}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {template.template_data.estimated_duration}m
              </Badge>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.template_data.suggested_tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.template_data.suggested_tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.template_data.suggested_tags.length - 3} more
            </Badge>
          )}
        </div>

        {/* African Market Adaptations */}
        {template.ai_suggestions.african_market_adaptations.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-400">
                African Market Optimized
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {template.ai_suggestions.african_market_adaptations.slice(0, 2).map((adaptation, index) => (
                <Badge key={index} className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                  {adaptation.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Usage Analytics */}
        {showStats && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">{template.usage_analytics.usage_count}</div>
              <div className="text-xs text-muted-foreground">Uses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {(template.usage_analytics.success_rate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {template.usage_analytics.user_satisfaction.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Customize Template</DialogTitle>
                <DialogDescription>
                  Personalize the template before creating your task
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Custom Title</Label>
                  <Input
                    id="title"
                    value={customizations.title_override}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, title_override: e.target.value }))}
                    placeholder={template.template_data.title_pattern}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Additional Description</Label>
                  <Textarea
                    id="description"
                    value={customizations.description_additions}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, description_additions: e.target.value }))}
                    placeholder="Add specific details or requirements..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="priority">Priority Override</Label>
                    <Select 
                      value={customizations.priority_override} 
                      onValueChange={(value) => setCustomizations(prev => ({ ...prev, priority_override: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={template.template_data.default_priority} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={customizations.due_date}
                      onChange={(e) => setCustomizations(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setCustomizations({
                    title_override: "",
                    description_additions: "",
                    priority_override: "",
                    due_date: "",
                    additional_context: ""
                  })} className="flex-1">
                    Reset
                  </Button>
                  <Button onClick={() => applyTemplate(template.id)} className="flex-1">
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => applyTemplate(template.id)}
          >
            <Play className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Smart Task Templates
          </h2>
          <p className="text-muted-foreground">
            AI-powered templates with personalized suggestions and African market optimizations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={analyzeAndImprove} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
            Analyze & Improve
          </Button>
          <Button variant="outline" onClick={fetchTemplateRecommendations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="personalized">Personalized</TabsTrigger>
            <TabsTrigger value="african">African Market</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate AI Task Suggestions
              </CardTitle>
              <CardDescription>
                Get contextual task suggestions based on your current situation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <Button 
                  variant="outline" 
                  onClick={() => generateTaskSuggestions('project_kickoff')}
                  disabled={loading}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Project Kickoff
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => generateTaskSuggestions('customer_escalation')}
                  disabled={loading}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Customer Issue
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => generateTaskSuggestions('deadline_approaching')}
                  disabled={loading}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Deadline Pressure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task Suggestions Results */}
          {taskSuggestions.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {taskSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{suggestion.suggested_title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.suggested_description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {(suggestion.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <strong>AI Reasoning:</strong> {suggestion.reasoning}
                      </div>

                      {suggestion.context.african_market_context && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <Globe className="h-3 w-3" />
                            <span className="font-medium">African Market Context</span>
                          </div>
                          <div>Country: {suggestion.context.african_market_context.country}</div>
                          <div>Optimizations: {suggestion.context.african_market_context.cultural_factors.join(', ')}</div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Customize
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Wand2 className="h-3 w-3 mr-1" />
                          Create Task
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trending Templates */}
        <TabsContent value="trending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              filteredTemplates(templates.trending_templates).map(template => renderTemplateCard(template))
            )}
          </div>
        </TabsContent>

        {/* Personalized Templates */}
        <TabsContent value="personalized" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates(templates.personalized_suggestions).map(template => renderTemplateCard(template))}
          </div>
        </TabsContent>

        {/* African Market Templates */}
        <TabsContent value="african" className="space-y-4">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-400">
                  African Market Optimized Templates
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                These templates are specifically designed for African markets with cultural timing, 
                mobile optimization, and local business practices in mind.
              </p>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates(templates.african_market_templates).map(template => renderTemplateCard(template))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}