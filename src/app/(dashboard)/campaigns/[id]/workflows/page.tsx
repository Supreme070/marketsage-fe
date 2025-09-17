"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Play,
  Pause,
  BarChart3,
  Settings,
  Target,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Copy,
  MoreHorizontal,
  Brain,
  Zap,
  Activity,
  Award,
  Calendar,
  Filter,
  Search,
  Workflow,
  Trigger,
  Action,
  Condition,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  StopCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useUnifiedCampaigns, WorkflowStatus, WorkflowExecutionStatus, TriggerType, ActionType } from "@/lib/api/hooks/useUnifiedCampaigns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  triggerConfig: any;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
  executions: WorkflowExecution[];
}

interface WorkflowCondition {
  id: string;
  type: string;
  field: string;
  operator: string;
  value: any;
}

interface WorkflowAction {
  id: string;
  type: ActionType;
  config: any;
  delay?: number;
}

interface WorkflowExecution {
  id: string;
  status: WorkflowExecutionStatus;
  startedAt: string;
  completedAt?: string;
  context: any;
  result?: any;
}

export default function CampaignWorkflowsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow, activateWorkflow, deactivateWorkflow, executeWorkflow } = useUnifiedCampaigns();
  
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  // Create Workflow Form State
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    triggerType: TriggerType.MANUAL,
    triggerConfig: {},
    conditions: [] as WorkflowCondition[],
    actions: [] as WorkflowAction[],
  });

  useEffect(() => {
    fetchWorkflows();
  }, [campaignId]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const workflowList = await getWorkflows(campaignId);
      setWorkflows(workflowList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflows');
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      await createWorkflow(campaignId, createForm);
      toast({
        title: "Workflow Created",
        description: "Your workflow has been created successfully.",
      });
      setShowCreateDialog(false);
      resetForm();
      fetchWorkflows();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create workflow",
        variant: "destructive",
      });
    }
  };

  const handleActivateWorkflow = async (workflowId: string) => {
    try {
      await activateWorkflow(workflowId);
      toast({
        title: "Workflow Activated",
        description: "Your workflow is now active.",
      });
      fetchWorkflows();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to activate workflow",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateWorkflow = async (workflowId: string) => {
    try {
      await deactivateWorkflow(workflowId);
      toast({
        title: "Workflow Deactivated",
        description: "Your workflow has been deactivated.",
      });
      fetchWorkflows();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to deactivate workflow",
        variant: "destructive",
      });
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflow(workflowId);
      toast({
        title: "Workflow Executed",
        description: "Your workflow has been executed.",
      });
      fetchWorkflows();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to execute workflow",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCreateForm({
      name: "",
      description: "",
      triggerType: TriggerType.MANUAL,
      triggerConfig: {},
      conditions: [],
      actions: [],
    });
  };

  const addCondition = () => {
    setCreateForm({
      ...createForm,
      conditions: [...createForm.conditions, {
        id: `condition-${Date.now()}`,
        type: "field",
        field: "",
        operator: "equals",
        value: "",
      }],
    });
  };

  const addAction = () => {
    setCreateForm({
      ...createForm,
      actions: [...createForm.actions, {
        id: `action-${Date.now()}`,
        type: ActionType.SEND_EMAIL,
        config: {},
        delay: 0,
      }],
    });
  };

  const removeCondition = (index: number) => {
    setCreateForm({
      ...createForm,
      conditions: createForm.conditions.filter((_, i) => i !== index),
    });
  };

  const removeAction = (index: number) => {
    setCreateForm({
      ...createForm,
      actions: createForm.actions.filter((_, i) => i !== index),
    });
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.ACTIVE:
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case WorkflowStatus.INACTIVE:
        return <Badge variant="outline">Inactive</Badge>;
      case WorkflowStatus.DRAFT:
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getExecutionStatusBadge = (status: WorkflowExecutionStatus) => {
    switch (status) {
      case WorkflowExecutionStatus.RUNNING:
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Running</Badge>;
      case WorkflowExecutionStatus.COMPLETED:
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case WorkflowExecutionStatus.FAILED:
        return <Badge variant="destructive">Failed</Badge>;
      case WorkflowExecutionStatus.PAUSED:
        return <Badge variant="secondary">Paused</Badge>;
      case WorkflowExecutionStatus.CANCELLED:
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTriggerTypeLabel = (type: TriggerType) => {
    switch (type) {
      case TriggerType.MANUAL:
        return "Manual";
      case TriggerType.SCHEDULED:
        return "Scheduled";
      case TriggerType.EVENT:
        return "Event";
      case TriggerType.WEBHOOK:
        return "Webhook";
      default:
        return type;
    }
  };

  const getActionTypeLabel = (type: ActionType) => {
    switch (type) {
      case ActionType.SEND_EMAIL:
        return "Send Email";
      case ActionType.SEND_SMS:
        return "Send SMS";
      case ActionType.SEND_WHATSAPP:
        return "Send WhatsApp";
      case ActionType.ADD_TAG:
        return "Add Tag";
      case ActionType.REMOVE_TAG:
        return "Remove Tag";
      case ActionType.UPDATE_FIELD:
        return "Update Field";
      case ActionType.CREATE_TASK:
        return "Create Task";
      default:
        return type;
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflows</h2>
          <p className="text-muted-foreground">
            Automate your campaign processes with intelligent workflows
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
              <DialogDescription>
                Set up an automated workflow for your campaign
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Workflow Name</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g., Welcome Series"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Describe what this workflow does..."
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Trigger Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trigger</h3>
                <div>
                  <Label htmlFor="triggerType">Trigger Type</Label>
                  <Select
                    value={createForm.triggerType}
                    onValueChange={(value) => setCreateForm({ ...createForm, triggerType: value as TriggerType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TriggerType.MANUAL}>Manual</SelectItem>
                      <SelectItem value={TriggerType.SCHEDULED}>Scheduled</SelectItem>
                      <SelectItem value={TriggerType.EVENT}>Event</SelectItem>
                      <SelectItem value={TriggerType.WEBHOOK}>Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {createForm.triggerType === TriggerType.SCHEDULED && (
                  <div>
                    <Label htmlFor="schedule">Schedule</Label>
                    <Input
                      id="schedule"
                      type="datetime-local"
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        triggerConfig: { ...createForm.triggerConfig, schedule: e.target.value }
                      })}
                    />
                  </div>
                )}
                
                {createForm.triggerType === TriggerType.EVENT && (
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Input
                      id="eventType"
                      placeholder="e.g., user.signup, campaign.sent"
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        triggerConfig: { ...createForm.triggerConfig, eventType: e.target.value }
                      })}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Conditions</h3>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Condition
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {createForm.conditions.map((condition, index) => (
                    <Card key={condition.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Condition {index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`condition-field-${index}`}>Field</Label>
                            <Input
                              id={`condition-field-${index}`}
                              value={condition.field}
                              onChange={(e) => {
                                const newConditions = [...createForm.conditions];
                                newConditions[index].field = e.target.value;
                                setCreateForm({ ...createForm, conditions: newConditions });
                              }}
                              placeholder="e.g., user.age"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`condition-operator-${index}`}>Operator</Label>
                            <Select
                              value={condition.operator}
                              onValueChange={(value) => {
                                const newConditions = [...createForm.conditions];
                                newConditions[index].operator = value;
                                setCreateForm({ ...createForm, conditions: newConditions });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                <SelectItem value="greater_than">Greater Than</SelectItem>
                                <SelectItem value="less_than">Less Than</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="not_contains">Not Contains</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`condition-value-${index}`}>Value</Label>
                            <Input
                              id={`condition-value-${index}`}
                              value={condition.value}
                              onChange={(e) => {
                                const newConditions = [...createForm.conditions];
                                newConditions[index].value = e.target.value;
                                setCreateForm({ ...createForm, conditions: newConditions });
                              }}
                              placeholder="e.g., 25"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Actions</h3>
                  <Button variant="outline" size="sm" onClick={addAction}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Action
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {createForm.actions.map((action, index) => (
                    <Card key={action.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Action {index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAction(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`action-type-${index}`}>Action Type</Label>
                            <Select
                              value={action.type}
                              onValueChange={(value) => {
                                const newActions = [...createForm.actions];
                                newActions[index].type = value as ActionType;
                                setCreateForm({ ...createForm, actions: newActions });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ActionType.SEND_EMAIL}>Send Email</SelectItem>
                                <SelectItem value={ActionType.SEND_SMS}>Send SMS</SelectItem>
                                <SelectItem value={ActionType.SEND_WHATSAPP}>Send WhatsApp</SelectItem>
                                <SelectItem value={ActionType.ADD_TAG}>Add Tag</SelectItem>
                                <SelectItem value={ActionType.REMOVE_TAG}>Remove Tag</SelectItem>
                                <SelectItem value={ActionType.UPDATE_FIELD}>Update Field</SelectItem>
                                <SelectItem value={ActionType.CREATE_TASK}>Create Task</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`action-delay-${index}`}>Delay (minutes)</Label>
                            <Input
                              id={`action-delay-${index}`}
                              type="number"
                              min="0"
                              value={action.delay || 0}
                              onChange={(e) => {
                                const newActions = [...createForm.actions];
                                newActions[index].delay = parseInt(e.target.value);
                                setCreateForm({ ...createForm, actions: newActions });
                              }}
                            />
                          </div>
                        </div>
                        
                        {action.type === ActionType.SEND_EMAIL && (
                          <div>
                            <Label htmlFor={`action-template-${index}`}>Email Template</Label>
                            <Input
                              id={`action-template-${index}`}
                              placeholder="Template ID or name"
                              onChange={(e) => {
                                const newActions = [...createForm.actions];
                                newActions[index].config = { ...newActions[index].config, template: e.target.value };
                                setCreateForm({ ...createForm, actions: newActions });
                              }}
                            />
                          </div>
                        )}
                        
                        {action.type === ActionType.ADD_TAG && (
                          <div>
                            <Label htmlFor={`action-tag-${index}`}>Tag</Label>
                            <Input
                              id={`action-tag-${index}`}
                              placeholder="Tag name"
                              onChange={(e) => {
                                const newActions = [...createForm.actions];
                                newActions[index].config = { ...newActions[index].config, tag: e.target.value };
                                setCreateForm({ ...createForm, actions: newActions });
                              }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateWorkflow}
                  disabled={!createForm.name || createForm.actions.length === 0}
                >
                  Create Workflow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All workflows
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === WorkflowStatus.ACTIVE).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently running
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((total, workflow) => {
                const today = new Date().toDateString();
                return total + workflow.executions.filter(exec => 
                  new Date(exec.startedAt).toDateString() === today
                ).length;
              }, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Runs today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const totalExecutions = workflows.reduce((total, workflow) => total + workflow.executions.length, 0);
                const successfulExecutions = workflows.reduce((total, workflow) => 
                  total + workflow.executions.filter(exec => exec.status === WorkflowExecutionStatus.COMPLETED).length, 0
                );
                return totalExecutions > 0 ? `${Math.round((successfulExecutions / totalExecutions) * 100)}%` : "0%";
              })()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successful runs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search workflows..."
              className="pl-8 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value={WorkflowStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={WorkflowStatus.INACTIVE}>Inactive</SelectItem>
              <SelectItem value={WorkflowStatus.DRAFT}>Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
          <CardDescription>
            Manage and monitor your campaign workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                        Loading workflows...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-destructive">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No workflows found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{workflow.name}</span>
                          {workflow.description && (
                            <span className="text-xs text-muted-foreground">{workflow.description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Trigger className="mr-2 h-4 w-4 text-muted-foreground" />
                          {getTriggerTypeLabel(workflow.triggerType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Condition className="mr-2 h-4 w-4 text-muted-foreground" />
                          {workflow.conditions.length} conditions
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Action className="mr-2 h-4 w-4 text-muted-foreground" />
                          {workflow.actions.length} actions
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                            {workflow.executions.length} total
                          </div>
                          {workflow.executions.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {workflow.executions.filter(exec => exec.status === WorkflowExecutionStatus.COMPLETED).length} completed
                            </div>
                          )}
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {workflow.status === WorkflowStatus.INACTIVE && (
                              <DropdownMenuItem onClick={() => handleActivateWorkflow(workflow.id)}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Activate
                              </DropdownMenuItem>
                            )}
                            {workflow.status === WorkflowStatus.ACTIVE && (
                              <DropdownMenuItem onClick={() => handleDeactivateWorkflow(workflow.id)}>
                                <PauseCircle className="mr-2 h-4 w-4" /> Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleExecuteWorkflow(workflow.id)}>
                              <Play className="mr-2 h-4 w-4" /> Execute Now
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
