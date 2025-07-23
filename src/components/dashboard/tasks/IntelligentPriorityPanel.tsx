"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Brain,
  TrendingUp,
  AlertCircle,
  Users,
  DollarSign,
  Clock,
  Target,
  Zap,
  Settings,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  BarChart3,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import type { TaskPriorityScore, PriorityFactors } from "@/lib/ai/intelligent-task-prioritizer";

interface IntelligentPriorityPanelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  tasks?: any[];
  onPriorityUpdate?: (priorities: TaskPriorityScore[]) => void;
}

// Factor configurations for UI
const PRIORITY_FACTORS = {
  urgency: {
    icon: Clock,
    name: "Urgency",
    description: "Deadline pressure and time sensitivity",
    color: "text-red-600"
  },
  importance: {
    icon: Target,
    name: "Importance", 
    description: "Business impact and strategic value",
    color: "text-blue-600"
  },
  complexity: {
    icon: Settings,
    name: "Complexity",
    description: "Effort required and technical difficulty",
    color: "text-purple-600"
  },
  dependencies: {
    icon: Users,
    name: "Dependencies",
    description: "Impact on other tasks and team members",
    color: "text-orange-600"
  },
  customer_impact: {
    icon: Users,
    name: "Customer Impact",
    description: "Direct impact on customer experience",
    color: "text-green-600"
  },
  revenue_impact: {
    icon: DollarSign,
    name: "Revenue Impact",
    description: "Potential financial impact",
    color: "text-emerald-600"
  },
  team_capacity: {
    icon: Users,
    name: "Team Capacity",
    description: "Team availability and workload",
    color: "text-cyan-600"
  },
  market_timing: {
    icon: Globe,
    name: "Market Timing",
    description: "Market conditions and timing",
    color: "text-indigo-600"
  }
};

const TRIGGER_EVENTS = [
  { value: 'deadline_approaching', label: 'Deadline Approaching', description: 'Tasks with approaching deadlines' },
  { value: 'customer_escalation', label: 'Customer Escalation', description: 'Customer-related urgent issues' },
  { value: 'team_capacity_change', label: 'Team Capacity Change', description: 'Changes in team availability' },
  { value: 'market_change', label: 'Market Change', description: 'Market conditions or opportunities' }
];

export default function IntelligentPriorityPanel({
  isOpen = false,
  onOpenChange,
  tasks = [],
  onPriorityUpdate
}: IntelligentPriorityPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [priorities, setPriorities] = useState<TaskPriorityScore[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [config, setConfig] = useState({
    factor_weights: {
      urgency: 0.25,
      importance: 0.20,
      complexity: 0.10,
      dependencies: 0.15,
      customer_impact: 0.15,
      revenue_impact: 0.10,
      team_capacity: 0.05,
      market_timing: 0.05
    },
    african_market_emphasis: true,
    team_capacity_consideration: true,
    customer_priority_boost: true,
    deadline_urgency_multiplier: 1.5
  });
  const [triggerEvent, setTriggerEvent] = useState('deadline_approaching');

  // Initialize with all tasks selected
  useEffect(() => {
    if (tasks.length > 0) {
      setSelectedTasks(tasks.map(t => t.id));
    }
  }, [tasks]);

  // Calculate priorities for selected tasks
  const calculatePriorities = async () => {
    if (selectedTasks.length === 0) {
      toast.error("Please select at least one task");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/tasks/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prioritize_list',
          taskIds: selectedTasks,
          config
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate priorities');
      }

      const data = await response.json();
      setPriorities(data.priorities);
      
      if (onPriorityUpdate) {
        onPriorityUpdate(data.priorities);
      }
      
      toast.success(`Calculated priorities for ${data.priorities.length} tasks`, {
        description: `${data.priorities.filter((p: any) => p.priority_tier === 'HIGH' || p.priority_tier === 'CRITICAL').length} high priority tasks identified`
      });

    } catch (error) {
      console.error('Priority calculation failed:', error);
      toast.error('Failed to calculate task priorities');
    } finally {
      setIsLoading(false);
    }
  };

  // Update priorities based on trigger event
  const updatePriorities = async () => {
    if (selectedTasks.length === 0) {
      toast.error("Please select at least one task");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/tasks/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_priorities',
          taskIds: selectedTasks,
          triggerEvent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update priorities');
      }

      const data = await response.json();
      setPriorities(data.updatedPriorities);
      
      if (onPriorityUpdate) {
        onPriorityUpdate(data.updatedPriorities);
      }
      
      toast.success(`Updated priorities for ${data.totalUpdated} tasks`, {
        description: `Trigger: ${triggerEvent.replace('_', ' ')}`
      });

    } catch (error) {
      console.error('Priority update failed:', error);
      toast.error('Failed to update task priorities');
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk recalculate all active tasks
  const bulkRecalculate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/tasks/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_recalculate',
          filters: {
            status: ['TODO', 'IN_PROGRESS']
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk recalculate');
      }

      const data = await response.json();
      
      toast.success(data.message, {
        description: `${data.highPriorityTasks} high priority tasks found`
      });

    } catch (error) {
      console.error('Bulk recalculate failed:', error);
      toast.error('Failed to recalculate priorities');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Update factor weight
  const updateFactorWeight = (factor: keyof PriorityFactors, weight: number) => {
    setConfig(prev => ({
      ...prev,
      factor_weights: {
        ...prev.factor_weights,
        [factor]: weight
      }
    }));
  };

  // Get priority tier color
  const getPriorityTierColor = (tier: string) => {
    switch (tier) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:w-[800px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Intelligent Task Prioritization
          </SheetTitle>
          <SheetDescription>
            ML-powered task prioritization with African market intelligence
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pb-6">
          {/* Task Selection */}
          <div className="px-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Task Selection ({selectedTasks.length} of {tasks.length})</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTasks(tasks.map(t => t.id))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTasks([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-3 p-2 rounded border hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleTaskSelection(task.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.status} • {task.priority || 'No priority'}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {task.assignee?.name || 'Unassigned'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration */}
          <div className="px-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Prioritization Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Factor Weights */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="factor-weights">
                    <AccordionTrigger className="text-sm">Factor Weights</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {Object.entries(PRIORITY_FACTORS).map(([key, factorConfig]) => {
                        const Icon = factorConfig.icon;
                        const weight = config.factor_weights[key as keyof PriorityFactors];
                        
                        return (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${factorConfig.color}`} />
                                <Label className="text-sm">{factorConfig.name}</Label>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {(weight * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <Slider
                              value={[weight]}
                              onValueChange={([value]) => updateFactorWeight(key as keyof PriorityFactors, value)}
                              min={0}
                              max={0.5}
                              step={0.05}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              {factorConfig.description}
                            </p>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Configuration Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="african-market"
                      checked={config.african_market_emphasis}
                      onCheckedChange={(checked) =>
                        setConfig(prev => ({ ...prev, african_market_emphasis: checked }))
                      }
                    />
                    <Label htmlFor="african-market" className="text-sm">
                      African Market Emphasis
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="team-capacity"
                      checked={config.team_capacity_consideration}
                      onCheckedChange={(checked) =>
                        setConfig(prev => ({ ...prev, team_capacity_consideration: checked }))
                      }
                    />
                    <Label htmlFor="team-capacity" className="text-sm">
                      Team Capacity Consideration
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="customer-boost"
                      checked={config.customer_priority_boost}
                      onCheckedChange={(checked) =>
                        setConfig(prev => ({ ...prev, customer_priority_boost: checked }))
                      }
                    />
                    <Label htmlFor="customer-boost" className="text-sm">
                      Customer Priority Boost
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Deadline Urgency Multiplier</Label>
                    <Slider
                      value={[config.deadline_urgency_multiplier]}
                      onValueChange={([value]) =>
                        setConfig(prev => ({ ...prev, deadline_urgency_multiplier: value }))
                      }
                      min={1.0}
                      max={3.0}
                      step={0.1}
                      className="w-full"
                    />
                    <Badge variant="outline" className="text-xs">
                      {config.deadline_urgency_multiplier.toFixed(1)}x
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="px-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Priority Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={calculatePriorities}
                    disabled={isLoading || selectedTasks.length === 0}
                    className="w-full"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                    Calculate Priorities
                  </Button>

                  <div className="flex gap-2">
                    <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_EVENTS.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            <div>
                              <div className="font-medium">{event.label}</div>
                              <div className="text-xs text-muted-foreground">{event.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={updatePriorities}
                      disabled={isLoading || selectedTasks.length === 0}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={bulkRecalculate}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                    Bulk Recalculate All Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Results */}
          {priorities.length > 0 && (
            <div className="px-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Priority Results ({priorities.length} tasks)</span>
                    <Badge variant="outline">
                      Avg Confidence: {(priorities.reduce((sum, p) => sum + p.confidence, 0) / priorities.length * 100).toFixed(0)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {priorities.map((priority, index) => {
                      const task = tasks.find(t => t.id === priority.taskId);
                      if (!task) return null;
                      
                      return (
                        <div key={priority.taskId} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                                <span className="font-medium text-sm">{task.title}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {priority.reasoning}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <Badge className={getPriorityTierColor(priority.priority_tier)}>
                                {priority.priority_tier}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {priority.priority_score}/100
                              </Badge>
                            </div>
                          </div>

                          {/* Factor Breakdown */}
                          <div className="grid grid-cols-4 gap-2 mt-3">
                            {Object.entries(priority.factors).slice(0, 4).map(([factor, value]) => {
                              const factorConfig = PRIORITY_FACTORS[factor as keyof typeof PRIORITY_FACTORS];
                              if (!factorConfig) return null;
                              
                              const Icon = factorConfig.icon;
                              return (
                                <div key={factor} className="text-center">
                                  <Icon className={`h-3 w-3 mx-auto mb-1 ${factorConfig.color}`} />
                                  <div className="text-xs">{(value * 100).toFixed(0)}%</div>
                                </div>
                              );
                            })}
                          </div>

                          {/* African Market Context */}
                          {priority.african_market_context && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <Globe className="h-3 w-3" />
                                <span className="font-medium">African Market Context</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>Business: {(priority.african_market_context.business_hours_factor * 100).toFixed(0)}%</div>
                                <div>Cultural: {(priority.african_market_context.cultural_timing_factor * 100).toFixed(0)}%</div>
                                <div>Confidence: {(priority.confidence * 100).toFixed(0)}%</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}