'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, Plus, Edit, Trash2, Play, MoreVertical, Settings, 
  Globe, Lock, Activity, Calendar, Users, TrendingUp,
  Zap, Brain, MessageSquare, BarChart3, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useAITools, type AITool } from '@/hooks/useAIIntelligence';

export default function AIToolsPage() {
  const { tools, loading, createTool, update, remove, useTool } = useAITools('dashboard-user');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Tool categories
  const categories = [
    { value: 'all', label: 'All Tools', icon: Wrench },
    { value: 'content', label: 'Content AI', icon: MessageSquare },
    { value: 'customer', label: 'Customer Intelligence', icon: Users },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
    { value: 'automation', label: 'Automation', icon: Zap },
    { value: 'prediction', label: 'Prediction', icon: TrendingUp },
    { value: 'optimization', label: 'Optimization', icon: Target }
  ];

  // Filter tools by category
  const filteredTools = selectedCategory === 'all' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory);

  const handleCreateTool = async (formData: FormData) => {
    try {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const isPublic = formData.get('isPublic') === 'on';
      
      const config = {
        type: formData.get('toolType') as string,
        parameters: {},
        version: '1.0.0'
      };

      await createTool(name, description, category, config, isPublic);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create tool:', error);
    }
  };

  const handleUpdateTool = async (formData: FormData) => {
    if (!editingTool?.id) return;

    try {
      const updates = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        isPublic: formData.get('isPublic') === 'on',
        config: {
          ...editingTool.config,
          type: formData.get('toolType') as string
        }
      };

      await update(editingTool.id, updates);
      setEditingTool(null);
    } catch (error) {
      console.error('Failed to update tool:', error);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this AI tool?')) return;
    
    try {
      await remove(toolId);
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const handleUseTool = async (toolId: string) => {
    try {
      await useTool(toolId);
      toast.success('Tool executed successfully!');
    } catch (error) {
      console.error('Failed to use tool:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    const Icon = categoryData?.icon || Wrench;
    return <Icon className="h-4 w-4" />;
  };

  const formatUsageStats = (usage: any) => {
    if (!usage) return { count: 0, lastUsed: 'Never' };
    
    return {
      count: usage.count || 0,
      lastUsed: usage.lastUsed 
        ? new Date(usage.lastUsed).toLocaleDateString()
        : 'Never'
    };
  };

  return (
    <div className="space-y-6">
      {/* AI Tools Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
              <Wrench className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  AI Tools
                </span>
                Management
              </h1>
              <p className="text-muted-foreground">Create, manage, and deploy custom AI tools • {tools.length} tools configured</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New AI Tool</DialogTitle>
                <DialogDescription>
                  Build a custom AI tool for your specific use case
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateTool} className="space-y-4">
                <div>
                  <Label htmlFor="name">Tool Name</Label>
                  <Input id="name" name="name" placeholder="My Custom AI Tool" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="What does this tool do?" />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toolType">Tool Type</Label>
                  <Select name="toolType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tool type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analyzer">Content Analyzer</SelectItem>
                      <SelectItem value="generator">Content Generator</SelectItem>
                      <SelectItem value="predictor">Predictor</SelectItem>
                      <SelectItem value="optimizer">Optimizer</SelectItem>
                      <SelectItem value="classifier">Classifier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublic">Make Public</Label>
                  <Switch id="isPublic" name="isPublic" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">Create Tool</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className="flex items-center gap-2"
          >
            <category.icon className="h-4 w-4" />
            {category.label}
            {category.value !== 'all' && (
              <Badge variant="secondary" className="ml-1">
                {tools.filter(t => t.category === category.value).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredTools.map((tool) => {
            const usage = formatUsageStats(tool.usage);
            
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          {getCategoryIcon(tool.category)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{tool.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {tool.category}
                            </Badge>
                            {tool.isPublic ? (
                              <Badge variant="secondary" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTool(tool)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Tool
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUseTool(tool.id!)}>
                            <Play className="h-4 w-4 mr-2" />
                            Run Tool
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTool(tool.id!)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="mb-4">
                      {tool.description || 'No description provided'}
                    </CardDescription>
                    
                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                          <Activity className="h-3 w-3" />
                          Used
                        </div>
                        <div className="font-semibold">{usage.count}x</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          Last Used
                        </div>
                        <div className="font-semibold text-xs">{usage.lastUsed}</div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleUseTool(tool.id!)} 
                      className="w-full"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Tool
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTools.length === 0 && !loading && (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No AI Tools Found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedCategory === 'all' 
              ? 'Create your first AI tool to get started'
              : `No tools found in the ${categories.find(c => c.value === selectedCategory)?.label} category`
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Tool
          </Button>
        </div>
      )}

      {/* Edit Tool Dialog */}
      {editingTool && (
        <Dialog open={!!editingTool} onOpenChange={() => setEditingTool(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit AI Tool</DialogTitle>
              <DialogDescription>
                Update your AI tool configuration
              </DialogDescription>
            </DialogHeader>
            <form action={handleUpdateTool} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Tool Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  defaultValue={editingTool.name}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  defaultValue={editingTool.description}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select name="category" defaultValue={editingTool.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-toolType">Tool Type</Label>
                <Select name="toolType" defaultValue={editingTool.config?.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analyzer">Content Analyzer</SelectItem>
                    <SelectItem value="generator">Content Generator</SelectItem>
                    <SelectItem value="predictor">Predictor</SelectItem>
                    <SelectItem value="optimizer">Optimizer</SelectItem>
                    <SelectItem value="classifier">Classifier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isPublic">Make Public</Label>
                <Switch 
                  id="edit-isPublic" 
                  name="isPublic" 
                  defaultChecked={editingTool.isPublic}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingTool(null)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Update Tool</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 