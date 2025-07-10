'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Search,
  Filter,
  Activity,
  Zap,
  Settings,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Mail,
  Phone,
  MessageSquare,
  Workflow,
  Database,
  Network,
  Timer,
  Target,
  Lightbulb
} from 'lucide-react';
import AITaskPreviewModal from './AITaskPreviewModal';
import { useToast } from '@/components/ui/use-toast';

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

const AITaskApprovalInterface: React.FC = () => {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AITask[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockTasks: AITask[] = [
      {
        id: 'task-1',
        name: 'Customer Segmentation Analysis',
        description: 'Analyze customer data to create intelligent segments for targeted marketing',
        type: 'analysis',
        priority: 'high',
        status: 'pending',
        requiredPermissions: ['contacts:read', 'analytics:read'],
        estimatedDuration: 180000, // 3 minutes
        resourceRequirements: {
          cpu: 0.4,
          memory: 0.3,
          network: true,
          database: true
        },
        riskLevel: 'medium',
        impactAssessment: {
          dataAccess: ['Customer contact data', 'Purchase history', 'Engagement metrics'],
          systemChanges: ['Create new customer segments', 'Update segment metadata'],
          userImpact: 'New customer segments will be available for targeting',
          businessImpact: 'Improved campaign targeting and conversion rates'
        },
        parameters: {
          segmentCriteria: 'engagement_level',
          minimumSize: 100,
          includeInactive: false
        },
        expectedOutputs: [
          'Customer segments with descriptions',
          'Segment analytics and insights',
          'Recommended targeting strategies'
        ],
        dependencies: ['Customer data sync', 'Analytics pipeline'],
        rollbackPlan: 'Remove created segments and restore previous configuration',
        confidenceScore: 87,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        requestedBy: 'Marketing Team',
        approvalRequired: true,
        autoApprove: false
      },
      {
        id: 'task-2',
        name: 'Email Campaign Optimization',
        description: 'Optimize email campaign performance using AI-driven insights',
        type: 'campaign',
        priority: 'medium',
        status: 'pending',
        requiredPermissions: ['campaigns:read', 'campaigns:write'],
        estimatedDuration: 240000, // 4 minutes
        resourceRequirements: {
          cpu: 0.3,
          memory: 0.2,
          network: true,
          database: true
        },
        riskLevel: 'low',
        impactAssessment: {
          dataAccess: ['Email campaign data', 'Performance metrics', 'Subscriber behavior'],
          systemChanges: ['Update campaign settings', 'Modify send times'],
          userImpact: 'Email campaigns will be automatically optimized',
          businessImpact: 'Increased open rates and engagement'
        },
        parameters: {
          campaignId: 'camp-123',
          optimizationType: 'send_time',
          testDuration: 7
        },
        expectedOutputs: [
          'Optimized send times',
          'Subject line recommendations',
          'Performance predictions'
        ],
        dependencies: ['Campaign data', 'Performance tracking'],
        rollbackPlan: 'Restore original campaign settings',
        confidenceScore: 92,
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
        requestedBy: 'AI Assistant',
        approvalRequired: false,
        autoApprove: true
      },
      {
        id: 'task-3',
        name: 'Database Performance Optimization',
        description: 'Analyze and optimize database queries for improved performance',
        type: 'optimization',
        priority: 'critical',
        status: 'pending',
        requiredPermissions: ['admin:database', 'system:modify'],
        estimatedDuration: 600000, // 10 minutes
        resourceRequirements: {
          cpu: 0.7,
          memory: 0.5,
          network: false,
          database: true
        },
        riskLevel: 'high',
        impactAssessment: {
          dataAccess: ['Database schema', 'Query performance logs', 'Index statistics'],
          systemChanges: ['Create new indexes', 'Optimize query plans', 'Update database configuration'],
          userImpact: 'Faster application response times',
          businessImpact: 'Reduced server costs and improved user experience'
        },
        parameters: {
          analysisType: 'full_scan',
          optimizationLevel: 'aggressive',
          maintenanceWindow: true
        },
        expectedOutputs: [
          'Performance improvement report',
          'Recommended index changes',
          'Query optimization suggestions'
        ],
        dependencies: ['Database access', 'Maintenance window'],
        rollbackPlan: 'Restore previous database configuration and remove new indexes',
        confidenceScore: 76,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        requestedBy: 'System Administrator',
        approvalRequired: true,
        autoApprove: false
      },
      {
        id: 'task-4',
        name: 'Automated Lead Scoring',
        description: 'Create automated lead scoring system based on visitor behavior',
        type: 'automation',
        priority: 'high',
        status: 'approved',
        requiredPermissions: ['leadpulse:read', 'leadpulse:write'],
        estimatedDuration: 300000, // 5 minutes
        resourceRequirements: {
          cpu: 0.5,
          memory: 0.4,
          network: true,
          database: true
        },
        riskLevel: 'medium',
        impactAssessment: {
          dataAccess: ['Visitor tracking data', 'Engagement metrics', 'Conversion history'],
          systemChanges: ['Create lead scoring rules', 'Update visitor profiles'],
          userImpact: 'Automatic lead qualification and scoring',
          businessImpact: 'Improved sales efficiency and conversion rates'
        },
        parameters: {
          scoringModel: 'behavioral',
          updateFrequency: 'real_time',
          threshold: 75
        },
        expectedOutputs: [
          'Lead scoring algorithm',
          'Automated scoring updates',
          'Performance metrics dashboard'
        ],
        dependencies: ['Visitor tracking', 'Behavioral analytics'],
        rollbackPlan: 'Disable automatic scoring and restore manual process',
        confidenceScore: 89,
        createdAt: new Date(Date.now() - 90 * 60 * 1000),
        requestedBy: 'Sales Team',
        approvalRequired: true,
        autoApprove: false
      },
      {
        id: 'task-5',
        name: 'WhatsApp Integration Setup',
        description: 'Configure WhatsApp Business API integration for automated messaging',
        type: 'integration',
        priority: 'medium',
        status: 'running',
        requiredPermissions: ['integrations:write', 'whatsapp:configure'],
        estimatedDuration: 420000, // 7 minutes
        resourceRequirements: {
          cpu: 0.2,
          memory: 0.1,
          network: true,
          database: true
        },
        riskLevel: 'low',
        impactAssessment: {
          dataAccess: ['WhatsApp credentials', 'Contact phone numbers', 'Message templates'],
          systemChanges: ['Configure API endpoints', 'Set up webhook handlers'],
          userImpact: 'WhatsApp messaging capabilities enabled',
          businessImpact: 'Expanded communication channels and reach'
        },
        parameters: {
          apiToken: '***',
          webhookUrl: 'https://app.marketsage.com/webhooks/whatsapp',
          verifyToken: '***'
        },
        expectedOutputs: [
          'WhatsApp API configuration',
          'Message template validation',
          'Webhook endpoint setup'
        ],
        dependencies: ['WhatsApp Business account', 'API credentials'],
        rollbackPlan: 'Disable WhatsApp integration and remove API configuration',
        confidenceScore: 95,
        createdAt: new Date(Date.now() - 120 * 60 * 1000),
        requestedBy: 'Integration Team',
        approvalRequired: false,
        autoApprove: true
      }
    ];

    setTasks(mockTasks);
    setFilteredTasks(mockTasks);
  }, []);

  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks;

    // Filter by status (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(task => task.status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(task => task.type === filterType);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Filter by risk level
    if (filterRisk !== 'all') {
      filtered = filtered.filter(task => task.riskLevel === filterRisk);
    }

    setFilteredTasks(filtered);
  }, [tasks, activeTab, searchTerm, filterType, filterPriority, filterRisk]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
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

  const handlePreviewTask = (task: AITask) => {
    setSelectedTask(task);
    setIsPreviewOpen(true);
  };

  const handleApproveTask = async (taskId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'approved' } : task
      ));
      
      toast({
        title: "Task Approved",
        description: "The AI task has been approved and will begin execution shortly.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectTask = async (taskId: string, reason: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'rejected' } : task
      ));
      
      toast({
        title: "Task Rejected",
        description: `Task rejected: ${reason}`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyTask = async (taskId: string, modifications: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...modifications } : task
      ));
      
      toast({
        title: "Task Modified",
        description: "The AI task has been successfully modified.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to modify task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTabCount = (status: string) => {
    if (status === 'all') return tasks.length;
    return tasks.filter(task => task.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">AI Task Approval</h1>
          <p className="text-gray-600">Review and approve AI tasks before execution</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTabCount('pending')}</div>
            <p className="text-xs text-gray-600">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Tasks</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTabCount('running')}</div>
            <p className="text-xs text-gray-600">Currently executing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTabCount('completed')}</div>
            <p className="text-xs text-gray-600">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(task => task.riskLevel === 'high' || task.riskLevel === 'critical').length}
            </div>
            <p className="text-xs text-gray-600">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="automation">Automation</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="optimization">Optimization</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Priority</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Risk Level</label>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger>
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({getTabCount('all')})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({getTabCount('pending')})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({getTabCount('approved')})</TabsTrigger>
              <TabsTrigger value="running">Running ({getTabCount('running')})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({getTabCount('completed')})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({getTabCount('rejected')})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tasks found matching your criteria.
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getTaskTypeIcon(task.type)}
                              <h3 className="font-semibold">{task.name}</h3>
                              <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white`}>
                                {task.priority}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                              <Badge variant="outline" className={getRiskLevelColor(task.riskLevel)}>
                                {task.riskLevel} risk
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {formatDuration(task.estimatedDuration)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {task.requestedBy}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.createdAt.toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {task.confidenceScore}% confidence
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewTask(task)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            
                            {task.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectTask(task.id, 'Manual rejection')}
                                  disabled={isLoading}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveTask(task.id)}
                                  disabled={isLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <AITaskPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        task={selectedTask}
        onApprove={handleApproveTask}
        onReject={handleRejectTask}
        onModify={handleModifyTask}
      />
    </div>
  );
};

export default AITaskApprovalInterface;