'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Zap,
  Brain,
  Settings,
  Database,
  Network,
  Timer,
  Target,
  Info,
  Lightbulb,
  TrendingUp,
  Users,
  MessageSquare,
  Mail,
  Phone,
  Workflow
} from 'lucide-react';

interface AITaskPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: AITask | null;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string, reason: string) => void;
  onModify: (taskId: string, modifications: any) => void;
}

interface AITask {
  id: string;
  name: string;
  description: string;
  type: 'analysis' | 'automation' | 'campaign' | 'optimization' | 'integration' | 'workflow';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'running' | 'completed' | 'failed';
  requiredPermissions: string[];
  estimatedDuration: number;
  resourceRequirements: {
    cpu: number;
    memory: number;
    network: boolean;
    database: boolean;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impactAssessment: {
    dataAccess: string[];
    systemChanges: string[];
    userImpact: string;
    businessImpact: string;
  };
  parameters: Record<string, any>;
  expectedOutputs: string[];
  dependencies: string[];
  rollbackPlan: string;
  confidenceScore: number;
  createdAt: Date;
  requestedBy: string;
  approvalRequired: boolean;
  autoApprove: boolean;
  schedule?: {
    type: 'immediate' | 'scheduled' | 'recurring';
    scheduledAt?: Date;
    recurrence?: string;
  };
}

const AITaskPreviewModal: React.FC<AITaskPreviewModalProps> = ({
  isOpen,
  onClose,
  task,
  onApprove,
  onReject,
  onModify
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [modifications, setModifications] = useState<any>({});
  const [isModifying, setIsModifying] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setActiveTab('overview');
      setRejectionReason('');
      setShowRejectionForm(false);
      setModifications({});
      setIsModifying(false);
    }
  }, [isOpen, task]);

  if (!task) return null;

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'automation': return <Zap className="h-4 w-4" />;
      case 'campaign': return <Mail className="h-4 w-4" />;
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      case 'integration': return <Network className="h-4 w-4" />;
      case 'workflow': return <Workflow className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleApprove = () => {
    onApprove(task.id);
    onClose();
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(task.id, rejectionReason);
      onClose();
    }
  };

  const handleModify = () => {
    onModify(task.id, modifications);
    setIsModifying(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTaskTypeIcon(task.type)}
            <span>AI Task Preview</span>
            <Badge variant="secondary" className="ml-2">
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </Badge>
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="overview" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Task Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Task Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-600">Name</h4>
                            <p className="text-sm">{task.name}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-600">Description</h4>
                            <p className="text-sm">{task.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm text-gray-600">Priority</h4>
                              <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-gray-600">Risk Level</h4>
                              <Badge variant="outline" className={getRiskLevelColor(task.riskLevel)}>
                                {task.riskLevel.charAt(0).toUpperCase() + task.riskLevel.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Confidence Score */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Confidence Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Confidence Score</span>
                            <span className="font-medium">{task.confidenceScore}%</span>
                          </div>
                          <Progress value={task.confidenceScore} className="h-2" />
                          <p className="text-xs text-gray-600">
                            {task.confidenceScore >= 90 ? 'Very High' :
                             task.confidenceScore >= 75 ? 'High' :
                             task.confidenceScore >= 60 ? 'Medium' :
                             task.confidenceScore >= 40 ? 'Low' : 'Very Low'} confidence in successful execution
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsModifying(true)}
                            className="flex items-center gap-2"
                          >
                            <Settings className="h-3 w-3" />
                            Modify Task
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('details')}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-3 w-3" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommendation:</strong> This task has {task.confidenceScore >= 75 ? 'high' : 'medium'} confidence and {task.riskLevel} risk. 
                        {task.approvalRequired ? ' Manual approval is required.' : ' Auto-approval is enabled.'}
                      </AlertDescription>
                    </Alert>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="details" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Parameters */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Task Parameters
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(task.parameters).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-sm font-medium">{key}</span>
                              <span className="text-sm text-gray-600 max-w-48 truncate">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expected Outputs */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Expected Outputs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {task.expectedOutputs.map((output, index) => (
                            <li key={index} className="text-sm flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {output}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Dependencies */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          Dependencies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {task.dependencies.length > 0 ? (
                          <ul className="space-y-1">
                            {task.dependencies.map((dep, index) => (
                              <li key={index} className="text-sm flex items-center gap-2">
                                <Activity className="h-3 w-3 text-blue-500" />
                                {dep}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600">No dependencies</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Rollback Plan */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4" />
                          Rollback Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{task.rollbackPlan}</p>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="security" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Required Permissions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Required Permissions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {task.requiredPermissions.map((permission, index) => (
                            <Badge key={index} variant="outline">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risk Assessment */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Risk Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Risk Level:</span>
                            <Badge className={getRiskLevelColor(task.riskLevel)}>
                              {task.riskLevel.charAt(0).toUpperCase() + task.riskLevel.slice(1)}
                            </Badge>
                          </div>
                          
                          {task.riskLevel === 'high' || task.riskLevel === 'critical' ? (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                This task has been classified as {task.riskLevel} risk. Additional review is recommended.
                              </AlertDescription>
                            </Alert>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Approval Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Approval Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Approval Required</span>
                            <Badge variant={task.approvalRequired ? "destructive" : "secondary"}>
                              {task.approvalRequired ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Auto-approve Enabled</span>
                            <Badge variant={task.autoApprove ? "default" : "secondary"}>
                              {task.autoApprove ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Requested By</span>
                            <span className="text-sm text-gray-600">{task.requestedBy}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="impact" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Data Access */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Data Access
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {task.impactAssessment.dataAccess.map((access, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Database className="h-3 w-3 text-blue-500" />
                              <span className="text-sm">{access}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* System Changes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          System Changes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {task.impactAssessment.systemChanges.map((change, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Settings className="h-3 w-3 text-orange-500" />
                              <span className="text-sm">{change}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* User Impact */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User Impact
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{task.impactAssessment.userImpact}</p>
                      </CardContent>
                    </Card>

                    {/* Business Impact */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Business Impact
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{task.impactAssessment.businessImpact}</p>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="resources" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Resource Requirements */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Resource Requirements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">CPU Usage</span>
                            <div className="flex items-center gap-2">
                              <Progress value={task.resourceRequirements.cpu * 100} className="w-20 h-2" />
                              <span className="text-sm font-medium">{task.resourceRequirements.cpu * 100}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Memory Usage</span>
                            <div className="flex items-center gap-2">
                              <Progress value={task.resourceRequirements.memory * 100} className="w-20 h-2" />
                              <span className="text-sm font-medium">{task.resourceRequirements.memory * 100}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Network Required</span>
                            <Badge variant={task.resourceRequirements.network ? "default" : "secondary"}>
                              {task.resourceRequirements.network ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Database Access</span>
                            <Badge variant={task.resourceRequirements.database ? "default" : "secondary"}>
                              {task.resourceRequirements.database ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Execution Time */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          Estimated Execution Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatDuration(task.estimatedDuration)}
                          </div>
                          <p className="text-sm text-gray-600">Estimated completion time</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="schedule" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Schedule Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Schedule Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Schedule Type</span>
                            <Badge variant="outline">
                              {task.schedule?.type || 'immediate'}
                            </Badge>
                          </div>
                          {task.schedule?.scheduledAt && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Scheduled At</span>
                              <span className="text-sm text-gray-600">
                                {task.schedule.scheduledAt.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {task.schedule?.recurrence && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Recurrence</span>
                              <span className="text-sm text-gray-600">
                                {task.schedule.recurrence}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Created At</span>
                            <span className="text-sm text-gray-600">
                              {task.createdAt.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timing Recommendations */}
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Timing Recommendation:</strong> This task is scheduled for {task.schedule?.type || 'immediate'} execution.
                        {task.schedule?.type === 'scheduled' && task.schedule.scheduledAt && 
                          task.schedule.scheduledAt > new Date() 
                          ? ` It will run in ${formatDuration(task.schedule.scheduledAt.getTime() - new Date().getTime())}.`
                          : ' It will run immediately upon approval.'
                        }
                      </AlertDescription>
                    </Alert>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <Separator />

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {isModifying ? (
              <Button onClick={handleModify}>
                Save Modifications
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsModifying(true)}
              >
                Modify Task
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {!showRejectionForm ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectionForm(true)}
                >
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve & Execute
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </>
            )}
          </div>
        </DialogFooter>

        {showRejectionForm && (
          <div className="mt-4 p-4 border rounded-lg bg-red-50">
            <label className="block text-sm font-medium text-red-700 mb-2">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border border-red-300 rounded-md text-sm"
              rows={3}
              placeholder="Please provide a reason for rejecting this task..."
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AITaskPreviewModal;