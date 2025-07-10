"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Link2,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Globe,
  Zap,
  TrendingUp,
  Settings,
  Search,
  RefreshCw,
  Loader2,
  Target,
  Users,
  BarChart3,
  Activity,
  ArrowRight,
  ArrowDown,
  Workflow,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";

interface DependencyAnalysis {
  task_id: string;
  detected_dependencies: DetectedDependency[];
  suggested_dependencies: SuggestedDependency[];
  potential_conflicts: DependencyConflict[];
  optimization_recommendations: DependencyOptimization[];
  african_market_insights: AfricanMarketDependencyInsights;
}

interface DetectedDependency {
  prerequisite_task_id: string;
  confidence: number;
  detection_method: string;
  reasoning: string;
  dependency_type: string;
}

interface SuggestedDependency {
  suggested_task_title: string;
  suggested_task_description: string;
  priority: string;
  estimated_duration: number;
  reasoning: string;
  ai_confidence: number;
}

interface DependencyConflict {
  conflict_type: string;
  severity: string;
  affected_tasks: string[];
  description: string;
  suggested_resolution: string;
  auto_resolvable: boolean;
}

interface DependencyOptimization {
  optimization_type: string;
  expected_time_savings: number;
  implementation_complexity: string;
  description: string;
  affects_african_market_timing: boolean;
}

interface AfricanMarketDependencyInsights {
  timezone_conflicts: boolean;
  business_hours_alignment: boolean;
  cultural_dependency_considerations: string[];
  recommended_scheduling_adjustments: string[];
  cross_country_coordination_needs: boolean;
}

interface DependencyChain {
  chain_id: string;
  root_task_id: string;
  chain_tasks: ChainTask[];
  total_estimated_duration: number;
  critical_path: string[];
  bottleneck_tasks: string[];
  parallelizable_segments: ParallelSegment[];
  african_market_optimized: boolean;
}

interface ChainTask {
  task_id: string;
  depth_level: number;
  can_parallelize: boolean;
  estimated_duration: number;
  dependencies: string[];
  dependents: string[];
}

interface ParallelSegment {
  segment_id: string;
  parallel_tasks: string[];
  estimated_duration: number;
  resource_requirements: string[];
}

interface HealthMetrics {
  total_dependencies: number;
  healthy_dependencies: number;
  violated_dependencies: number;
  circular_dependencies: number;
  optimization_opportunities: number;
  african_market_issues: number;
}

export function TaskDependencyManager() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [analysis, setAnalysis] = useState<DependencyAnalysis | null>(null);
  const [dependencyChain, setDependencyChain] = useState<DependencyChain | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [africanOptimization, setAfricanOptimization] = useState(true);
  const [autoCreateDependencies, setAutoCreateDependencies] = useState(false);
  const [dependencyDepth, setDependencyDepth] = useState(3);

  useEffect(() => {
    fetchHealthMetrics();
  }, []);

  const fetchHealthMetrics = async () => {
    try {
      const response = await fetch('/api/tasks/dependencies?action=health');
      const data = await response.json();

      if (data.success) {
        setHealthMetrics(data.health_metrics);
      }
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    }
  };

  const analyzeTaskDependencies = async () => {
    if (!selectedTaskId) {
      toast.error('Please enter a task ID');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'analyze',
        task_id: selectedTaskId,
        african_optimization: africanOptimization.toString(),
        auto_create: autoCreateDependencies.toString(),
        depth: dependencyDepth.toString()
      });

      const response = await fetch(`/api/tasks/dependencies?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        toast.success('Task dependency analysis completed', {
          description: `Found ${data.analysis.detected_dependencies.length} dependencies, ${data.analysis.potential_conflicts.length} conflicts`
        });
      } else {
        toast.error('Failed to analyze task dependencies');
      }
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
      toast.error('Error analyzing task dependencies');
    } finally {
      setLoading(false);
    }
  };

  const buildDependencyChain = async () => {
    if (!selectedTaskId) {
      toast.error('Please enter a task ID');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'chain',
        task_id: selectedTaskId,
        max_depth: '5',
        include_parallel: 'true',
        african_optimization: africanOptimization.toString()
      });

      const response = await fetch(`/api/tasks/dependencies?${params}`);
      const data = await response.json();

      if (data.success) {
        setDependencyChain(data.dependency_chain);
        toast.success('Dependency chain built successfully', {
          description: `Chain contains ${data.dependency_chain.chain_tasks.length} tasks`
        });
      } else {
        toast.error('Failed to build dependency chain');
      }
    } catch (error) {
      console.error('Error building dependency chain:', error);
      toast.error('Error building dependency chain');
    } finally {
      setLoading(false);
    }
  };

  const resolveConflicts = async (conflictIds: string[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_conflicts',
          conflict_ids: conflictIds,
          resolution_strategy: 'ai_guided'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Resolved ${data.resolved_conflicts} conflicts`, {
          description: `${data.pending_conflicts} conflicts still pending`
        });
        // Refresh analysis
        if (selectedTaskId) {
          analyzeTaskDependencies();
        }
      } else {
        toast.error('Failed to resolve conflicts');
      }
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      toast.error('Error resolving conflicts');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'content_analysis': return <Search className="h-4 w-4" />;
      case 'pattern_matching': return <Target className="h-4 w-4" />;
      case 'ai_inference': return <Brain className="h-4 w-4" />;
      case 'user_behavior': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getDependencyTypeColor = (type: string) => {
    switch (type) {
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'soft': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'preferential': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'MEDIUM': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            Task Dependency Manager
          </h2>
          <p className="text-muted-foreground">
            AI-powered dependency detection, analysis, and optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchHealthMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      {healthMetrics && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dependencies</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthMetrics.total_dependencies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{healthMetrics.healthy_dependencies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Violated</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{healthMetrics.violated_dependencies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Circular</CardTitle>
              <GitBranch className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{healthMetrics.circular_dependencies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimization</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{healthMetrics.optimization_opportunities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">African Issues</CardTitle>
              <Globe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{healthMetrics.african_market_issues}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze">Analyze Dependencies</TabsTrigger>
          <TabsTrigger value="chain">Dependency Chain</TabsTrigger>
          <TabsTrigger value="optimize">Optimize & Resolve</TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Dependency Analysis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="taskId">Task ID</Label>
                  <Input
                    id="taskId"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    placeholder="Enter task ID to analyze..."
                  />
                </div>
                <div>
                  <Label htmlFor="depth">Dependency Depth</Label>
                  <Select value={dependencyDepth.toString()} onValueChange={(value) => setDependencyDepth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Level</SelectItem>
                      <SelectItem value="2">2 Levels</SelectItem>
                      <SelectItem value="3">3 Levels</SelectItem>
                      <SelectItem value="5">5 Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={analyzeTaskDependencies} 
                    disabled={loading || !selectedTaskId}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Analyze
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="african"
                    checked={africanOptimization}
                    onCheckedChange={setAfricanOptimization}
                  />
                  <Label htmlFor="african" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    African Market Optimization
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoCreate"
                    checked={autoCreateDependencies}
                    onCheckedChange={setAutoCreateDependencies}
                  />
                  <Label htmlFor="autoCreate">Auto-create Dependencies</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Detected Dependencies */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detected Dependencies</CardTitle>
                  <CardDescription>
                    {analysis.detected_dependencies.length} dependencies found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.detected_dependencies.map((dep, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(dep.detection_method)}
                            <span className="font-medium text-sm">Task {dep.prerequisite_task_id}</span>
                          </div>
                          <div className="flex gap-1">
                            <Badge className={getDependencyTypeColor(dep.dependency_type)}>
                              {dep.dependency_type}
                            </Badge>
                            <Badge variant="outline">
                              {(dep.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{dep.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Dependencies */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Suggestions</CardTitle>
                  <CardDescription>
                    {analysis.suggested_dependencies.length} missing tasks suggested
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.suggested_dependencies.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{suggestion.suggested_task_title}</h4>
                          <div className="flex gap-1">
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {suggestion.estimated_duration}m
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {suggestion.suggested_task_description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>AI Reasoning:</strong> {suggestion.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Conflicts */}
              {analysis.potential_conflicts.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Potential Conflicts
                    </CardTitle>
                    <CardDescription>
                      {analysis.potential_conflicts.length} conflicts detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.potential_conflicts.map((conflict, index) => (
                        <Alert key={index} className="border-red-200">
                          <ShieldAlert className="h-4 w-4" />
                          <AlertTitle className="flex items-center justify-between">
                            <span>{conflict.conflict_type.toUpperCase()} Conflict</span>
                            <div className="flex gap-2">
                              <Badge className={getConflictSeverityColor(conflict.severity)}>
                                {conflict.severity}
                              </Badge>
                              {conflict.auto_resolvable && (
                                <Badge variant="outline" className="text-green-600">
                                  Auto-resolvable
                                </Badge>
                              )}
                            </div>
                          </AlertTitle>
                          <AlertDescription className="mt-2">
                            <p className="mb-2">{conflict.description}</p>
                            <p className="text-sm"><strong>Resolution:</strong> {conflict.suggested_resolution}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Affects tasks: {conflict.affected_tasks.join(', ')}
                            </p>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>

                    {analysis.potential_conflicts.some(c => c.auto_resolvable) && (
                      <Button 
                        className="mt-4"
                        onClick={() => resolveConflicts(
                          analysis.potential_conflicts
                            .filter(c => c.auto_resolvable)
                            .map((_, index) => `conflict-${index}`)
                        )}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                        Auto-Resolve Conflicts
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* African Market Insights */}
              {africanOptimization && analysis.african_market_insights && (
                <Card className="md:col-span-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-green-600" />
                      African Market Dependency Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">Status Indicators</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={analysis.african_market_insights.timezone_conflicts ? "destructive" : "default"}>
                              {analysis.african_market_insights.timezone_conflicts ? 'Timezone Conflicts' : 'Timezone OK'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={analysis.african_market_insights.business_hours_alignment ? "default" : "destructive"}>
                              {analysis.african_market_insights.business_hours_alignment ? 'Business Hours Aligned' : 'Hours Misaligned'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={analysis.african_market_insights.cross_country_coordination_needs ? "secondary" : "outline"}>
                              {analysis.african_market_insights.cross_country_coordination_needs ? 'Cross-Country Coordination' : 'Single Country'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <div className="space-y-1">
                          {analysis.african_market_insights.recommended_scheduling_adjustments.map((rec, index) => (
                            <p key={index} className="text-sm text-muted-foreground">• {rec}</p>
                          ))}
                          {analysis.african_market_insights.cultural_dependency_considerations.map((consideration, index) => (
                            <p key={index} className="text-sm text-muted-foreground">• {consideration}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Dependency Chain Tab */}
        <TabsContent value="chain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Build Dependency Chain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="chainTaskId">Root Task ID</Label>
                  <Input
                    id="chainTaskId"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    placeholder="Enter root task ID..."
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={buildDependencyChain}
                    disabled={loading || !selectedTaskId}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="h-4 w-4 mr-2" />}
                    Build Chain
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chain Results */}
          {dependencyChain && (
            <div className="grid gap-4">
              {/* Chain Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Chain Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{dependencyChain.chain_tasks.length}</div>
                      <div className="text-sm text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{dependencyChain.total_estimated_duration}</div>
                      <div className="text-sm text-muted-foreground">Total Duration (min)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{dependencyChain.critical_path.length}</div>
                      <div className="text-sm text-muted-foreground">Critical Path</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{dependencyChain.parallelizable_segments.length}</div>
                      <div className="text-sm text-muted-foreground">Parallel Segments</div>
                    </div>
                  </div>

                  {dependencyChain.african_market_optimized && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-400">
                          African Market Optimized
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chain Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Chain Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dependencyChain.chain_tasks.map((task, index) => (
                      <div key={task.task_id} className="flex items-center gap-3">
                        <div className="flex items-center gap-2" style={{ marginLeft: `${task.depth_level * 20}px` }}>
                          {task.depth_level > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                          <div className="flex items-center gap-2 p-2 border rounded">
                            <span className="font-mono text-sm">{task.task_id}</span>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.estimated_duration}m
                            </Badge>
                            {task.can_parallelize && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Parallel
                              </Badge>
                            )}
                            {dependencyChain.bottleneck_tasks.includes(task.task_id) && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                Bottleneck
                              </Badge>
                            )}
                            {dependencyChain.critical_path.includes(task.task_id) && (
                              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                Critical
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis?.optimization_recommendations.length ? (
                <div className="space-y-3">
                  {analysis.optimization_recommendations.map((opt, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium capitalize">{opt.optimization_type.replace('_', ' ')}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {opt.expected_time_savings}% savings
                          </Badge>
                          <Badge variant={opt.implementation_complexity === 'low' ? 'default' : 'secondary'}>
                            {opt.implementation_complexity} complexity
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{opt.description}</p>
                      {opt.affects_african_market_timing && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Affects African market timing</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Analyze task dependencies first to see optimization recommendations
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}