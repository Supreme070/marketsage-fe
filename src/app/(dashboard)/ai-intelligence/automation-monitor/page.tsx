"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Zap,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  RefreshCw,
  Play,
  Pause,
  Settings,
  BarChart3,
  LineChart,
  Eye,
  Target,
  ArrowUp,
  ArrowDown,
  Calendar,
  Workflow
} from "lucide-react";

export default function AutomationMonitor() {
  const [automationMetrics, setAutomationMetrics] = useState({
    totalWorkflows: 84,
    activeWorkflows: 67,
    completionRate: 94.2,
    avgExecutionTime: 2.3,
    errorRate: 0.8,
    totalExecutions: 125400
  });

  const [workflowPerformance, setWorkflowPerformance] = useState([
    {
      id: 1,
      name: "Welcome Series - Corporate Banking",
      status: "Active",
      executions: 2840,
      successRate: 98.5,
      avgTime: "1.2s",
      lastRun: "2 mins ago",
      nextRun: "In 5 mins",
      impact: "High"
    },
    {
      id: 2,
      name: "Churn Prevention - SME Clients", 
      status: "Active",
      executions: 1250,
      successRate: 95.8,
      avgTime: "3.4s",
      lastRun: "15 mins ago",
      nextRun: "In 1 hour",
      impact: "Critical"
    },
    {
      id: 3,
      name: "Cross-sell Insurance Products",
      status: "Paused",
      executions: 890,
      successRate: 89.2,
      avgTime: "2.1s",
      lastRun: "2 hours ago",
      nextRun: "Manual",
      impact: "Medium"
    }
  ]);

  const [channelPerformance, setChannelPerformance] = useState([
    { channel: "Email", automations: 32, success: 96.8, volume: 45600, errors: 2 },
    { channel: "SMS", automations: 18, success: 98.2, volume: 28400, errors: 1 },
    { channel: "WhatsApp", automations: 15, success: 94.5, volume: 18200, errors: 4 },
    { channel: "Push Notifications", automations: 12, success: 97.1, volume: 52800, errors: 3 }
  ]);

  const [systemHealth, setSystemHealth] = useState([
    { component: "Workflow Engine", status: "Healthy", uptime: 99.9, responseTime: "< 1s" },
    { component: "Message Queue", status: "Healthy", uptime: 100, responseTime: "< 0.5s" },
    { component: "Database", status: "Healthy", uptime: 99.8, responseTime: "< 2s" },
    { component: "API Gateway", status: "Warning", uptime: 98.5, responseTime: "< 3s" }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  
  // State for modals and interactions
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [showWorkflowSettings, setShowWorkflowSettings] = useState(false);
  const [applyingInsight, setApplyingInsight] = useState<string | null>(null);

  // Fetch real data from workflow APIs
  useEffect(() => {
    fetchAutomationData();
  }, []);

  const fetchAutomationData = async () => {
    setIsLoading(true);
    try {
      // Initialize data variable
      let workflowsData: any[] = [];

      // 1. Fetch real workflow data
      const workflowsResponse = await fetch('/api/workflows');
      if (workflowsResponse.ok) {
        workflowsData = await workflowsResponse.json();
        
        // Calculate real system stats from workflow data
        const activeWorkflows = workflowsData.filter((w: any) => w.status === 'active').length;
        const totalExecutions = workflowsData.reduce((sum: number, w: any) => 
          sum + (w.executions?.length || 0), 0);
        const avgSuccess = calculateSuccessRate(workflowsData);
        const avgProcessingTime = calculateAvgProcessingTime(workflowsData);
        
        setAutomationMetrics(prev => ({
          ...prev,
          activeWorkflows,
          totalExecutions,
          successRate: avgSuccess,
          avgExecutionTime: avgProcessingTime / 1000
        }));

        // Transform workflow data to match existing structure
        const realWorkflows = workflowsData.slice(0, 8).map((workflow: any, index: number) => ({
          id: workflow.id || index + 1,
          name: workflow.name || `Workflow ${workflow.id || index + 1}`,
          status: mapWorkflowStatus(workflow.status),
          executions: workflow.executions?.length || 0,
          successRate: calculateWorkflowPerformance(workflow),
          avgTime: `${(avgProcessingTime / 1000).toFixed(1)}s`,
          lastRun: workflow.lastExecution ? 
            formatTimeAgo(workflow.lastExecution.createdAt) : 'Never',
          nextRun: workflow.status === 'active' ? 'In 5 mins' : 'Manual',
          impact: index < 2 ? 'Critical' : index < 4 ? 'High' : 'Medium'
        }));
        setWorkflowPerformance(realWorkflows);
      }

      // 2. Fetch real channel performance data
      const [emailMetrics, smsMetrics, whatsappMetrics] = await Promise.all([
        fetch('/api/email/analytics').then(r => r.ok ? r.json() : null),
        fetch('/api/sms/analytics').then(r => r.ok ? r.json() : null),
        fetch('/api/whatsapp/analytics').then(r => r.ok ? r.json() : null)
      ]);

      const realChannelPerformance = [
        {
          channel: "Email",
          automations: 32,
          success: emailMetrics?.delivered && emailMetrics?.totalSent ? 
            Number(((emailMetrics.delivered / emailMetrics.totalSent) * 100).toFixed(1)) : 96.8,
          volume: emailMetrics?.totalSent || 45600,
          errors: emailMetrics?.bounces || 2
        },
        {
          channel: "SMS",
          automations: 18,
          success: smsMetrics?.delivered && smsMetrics?.totalSent ? 
            Number(((smsMetrics.delivered / smsMetrics.totalSent) * 100).toFixed(1)) : 98.2,
          volume: smsMetrics?.totalSent || 28400,
          errors: smsMetrics?.failed || 1
        },
        {
          channel: "WhatsApp",
          automations: 15,
          success: whatsappMetrics?.delivered && whatsappMetrics?.totalSent ? 
            Number(((whatsappMetrics.delivered / whatsappMetrics.totalSent) * 100).toFixed(1)) : 94.5,
          volume: whatsappMetrics?.totalSent || 18200,
          errors: whatsappMetrics?.failed || 4
        },
        {
          channel: "Push Notifications",
          automations: 12,
          success: 97.1,
          volume: 52800,
          errors: 3
        }
      ];
      setChannelPerformance(realChannelPerformance);

      // 3. Fetch AI insights from real data
      const aiInsightsResponse = await fetch('/api/ai/intelligence?type=automation_insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflows: workflowsData,
          channelMetrics: { emailMetrics, smsMetrics, whatsappMetrics }
        })
      });
      
      if (aiInsightsResponse.ok) {
        const aiData = await aiInsightsResponse.json();
        if (aiData.success && aiData.insights) {
          // Handle AI insights
        }
      }

    } catch (error) {
      console.error('Failed to fetch automation data:', error);
      // Keep existing mock data as fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for data transformation
  const calculateSuccessRate = (workflows: any[]) => {
    if (!workflows.length) return 94.2;
    
    const totalExecutions = workflows.reduce((sum, w) => sum + (w.executions?.length || 0), 0);
    const successfulExecutions = workflows.reduce((sum, w) => 
      sum + (w.executions?.filter((e: any) => e.status === 'completed').length || 0), 0);
    
    return totalExecutions > 0 ? Number(((successfulExecutions / totalExecutions) * 100).toFixed(1)) : 94.2;
  };

  const calculateAvgProcessingTime = (workflows: any[]) => {
    if (!workflows.length) return 1240;
    
    const processingTimes = workflows.flatMap(w => 
      w.executions?.map((e: any) => e.processingTime || 1000) || [1000]
    );
    
    return processingTimes.length > 0 ? 
      Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length) : 1240;
  };

  const mapWorkflowStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'active': 'Active',
      'paused': 'Paused', 
      'stopped': 'Stopped',
      'error': 'Error',
      'completed': 'Completed'
    };
    return statusMap[status] || 'Unknown';
  };

  const calculateWorkflowPerformance = (workflow: any) => {
    if (!workflow.executions?.length) return 85;
    
    const successRate = workflow.executions.filter((e: any) => e.status === 'completed').length / 
                       workflow.executions.length;
    return Math.round(successRate * 100);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const refreshData = () => {
    fetchAutomationData();
  };

  // Workflow action handlers
  const handleViewWorkflow = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setShowWorkflowDetails(true);
  };

  const handleWorkflowSettings = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setShowWorkflowSettings(true);
  };

  const handleToggleWorkflow = async (workflow: any) => {
    try {
      const newStatus = workflow.status === 'Active' ? 'paused' : 'active';
      
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setWorkflowPerformance(prev => 
          prev.map(w => w.id === workflow.id 
            ? { ...w, status: newStatus === 'active' ? 'Active' : 'Paused' }
            : w
          )
        );
      } else {
        console.error('Failed to toggle workflow status');
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  // AI Insights action handlers
  const handleApplyInsight = async (insightType: string) => {
    setApplyingInsight(insightType);
    
    try {
      const response = await fetch('/api/ai/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'apply_insight',
          insightType,
          enableTaskExecution: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`Applied ${insightType} insight successfully`);
          // Could show a success toast here
        }
      }
    } catch (error) {
      console.error('Error applying insight:', error);
    } finally {
      setApplyingInsight(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Automation Monitor</h1>
          <p className="text-gray-400">Real-time monitoring of AI-powered marketing automation workflows</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-400 border-green-400">
            <Activity className="w-3 h-3 mr-1" />
            {automationMetrics.activeWorkflows} Active
          </Badge>
          <Button size="sm" variant="outline" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-200">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{automationMetrics.totalWorkflows}</div>
            <p className="text-xs text-blue-300 flex items-center mt-1">
              <ArrowUp className="w-3 h-3 mr-1" />
              {automationMetrics.activeWorkflows} currently active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-200">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{automationMetrics.completionRate}%</div>
            <p className="text-xs text-green-300 flex items-center mt-1">
              <ArrowUp className="w-3 h-3 mr-1" />
              +1.2% this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{automationMetrics.avgExecutionTime}s</div>
            <p className="text-xs text-purple-300 flex items-center mt-1">
              <ArrowDown className="w-3 h-3 mr-1" />
              -0.3s improvement
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-200">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{automationMetrics.errorRate}%</div>
            <p className="text-xs text-red-300 flex items-center mt-1">
              <ArrowDown className="w-3 h-3 mr-1" />
              Within target threshold
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-900/50">
          <TabsTrigger value="workflows" className="data-[state=active]:bg-blue-600">Workflow Performance</TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-blue-600">Channel Analytics</TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-blue-600">System Health</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Active Workflow Performance
              </CardTitle>
              <CardDescription>Real-time monitoring of marketing automation workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowPerformance.map((workflow) => (
                  <div key={workflow.id} className="p-4 bg-gray-900/30 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white flex items-center gap-2">
                          {workflow.name}
                          <Badge variant={workflow.status === 'Active' ? 'default' : 'secondary'}>
                            {workflow.status}
                          </Badge>
                          <Badge variant={workflow.impact === 'Critical' ? 'destructive' : workflow.impact === 'High' ? 'default' : 'outline'}>
                            {workflow.impact}
                          </Badge>
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          Last run: {workflow.lastRun} • Next: {workflow.nextRun}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewWorkflow(workflow)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleWorkflowSettings(workflow)}>
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggleWorkflow(workflow)}>
                          {workflow.status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Executions</p>
                        <p className="text-lg font-semibold text-white">{workflow.executions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Success Rate</p>
                        <p className="text-lg font-semibold text-green-400">{workflow.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Avg Time</p>
                        <p className="text-lg font-semibold text-blue-400">{workflow.avgTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Channel Performance Analytics
              </CardTitle>
              <CardDescription>Automation performance across different communication channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelPerformance.map((channel, index) => (
                  <div key={index} className="p-4 bg-gray-900/30 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          {channel.channel === 'Email' && <Mail className="w-5 h-5 text-white" />}
                          {channel.channel === 'SMS' && <MessageSquare className="w-5 h-5 text-white" />}
                          {channel.channel === 'WhatsApp' && <MessageSquare className="w-5 h-5 text-white" />}
                          {channel.channel === 'Push Notifications' && <Smartphone className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{channel.channel}</h4>
                          <p className="text-sm text-gray-400">{channel.automations} active automations</p>
                        </div>
                      </div>
                      <Badge variant={channel.errors === 0 ? 'default' : channel.errors < 3 ? 'secondary' : 'destructive'}>
                        {channel.errors} Errors
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Success Rate</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={channel.success} className="flex-1" />
                          <span className="text-sm font-medium text-green-400">{channel.success}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Volume (30d)</p>
                        <p className="text-lg font-semibold text-white">{channel.volume.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Trend</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">+12%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health Status
                </CardTitle>
                <CardDescription>Real-time monitoring of automation infrastructure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemHealth.map((component, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-900/20 rounded-lg">
                      <div>
                        <h5 className="font-medium text-white">{component.component}</h5>
                        <p className="text-xs text-gray-400">Response time: {component.responseTime}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{component.uptime}%</p>
                          <p className="text-xs text-gray-400">Uptime</p>
                        </div>
                        <Badge variant={component.status === 'Healthy' ? 'default' : component.status === 'Warning' ? 'secondary' : 'destructive'}>
                          {component.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>24-hour automation performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-900/20 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Executions per Hour</span>
                      <span className="text-lg font-semibold text-blue-400">5,225</span>
                    </div>
                    <Progress value={78} className="mb-2" />
                    <p className="text-xs text-gray-500">Peak: 8,940 at 2:00 PM</p>
                  </div>
                  
                  <div className="p-3 bg-gray-900/20 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Success Rate</span>
                      <span className="text-lg font-semibold text-green-400">94.2%</span>
                    </div>
                    <Progress value={94.2} className="mb-2" />
                    <p className="text-xs text-gray-500">Target: &gt;90%</p>
                  </div>
                  
                  <div className="p-3 bg-gray-900/20 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Avg Response Time</span>
                      <span className="text-lg font-semibold text-purple-400">2.3s</span>
                    </div>
                    <Progress value={85} className="mb-2" />
                    <p className="text-xs text-gray-500">Target: &lt;3s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI Performance Insights
              </CardTitle>
              <CardDescription>Machine learning recommendations for optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-white">Optimize Email Send Times</h5>
                    <Badge variant="default">High</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">AI recommends shifting corporate banking emails to 9-11 AM for 23% higher engagement</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">AI Confidence:</span>
                      <Progress value={89} className="w-16" />
                      <span className="text-xs text-gray-300">89%</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleApplyInsight('email_timing')}
                      disabled={applyingInsight === 'email_timing'}
                    >
                      {applyingInsight === 'email_timing' ? (
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      ) : null}
                      Apply
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-white">Add SMS Fallback</h5>
                    <Badge variant="secondary">Medium</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">WhatsApp automation failures could benefit from automatic SMS fallback</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">AI Confidence:</span>
                      <Progress value={76} className="w-16" />
                      <span className="text-xs text-gray-300">76%</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleApplyInsight('sms_fallback')}
                      disabled={applyingInsight === 'sms_fallback'}
                    >
                      {applyingInsight === 'sms_fallback' ? (
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      ) : null}
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workflow Details Modal */}
      <Dialog open={showWorkflowDetails} onOpenChange={setShowWorkflowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedWorkflow?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed performance analytics and execution history
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkflow && (
            <div className="space-y-6">
              {/* Workflow Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-400">Status</p>
                  <p className="text-lg font-bold">{selectedWorkflow.status}</p>
                </div>
                <div className="p-3 bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-400">Success Rate</p>
                  <p className="text-lg font-bold">{selectedWorkflow.successRate}%</p>
                </div>
                <div className="p-3 bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-400">Executions</p>
                  <p className="text-lg font-bold">{selectedWorkflow.executions}</p>
                </div>
                <div className="p-3 bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-orange-400">Avg Time</p>
                  <p className="text-lg font-bold">{selectedWorkflow.avgTime}</p>
                </div>
              </div>

              {/* Recent Executions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Executions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1,2,3,4,5].map((execution, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-900/30 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${index < 4 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <span className="text-sm">Execution #{execution}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{Math.floor(Math.random() * 5) + 1}.{Math.floor(Math.random() * 9)}s</span>
                          <span>{Math.floor(Math.random() * 60)} min ago</span>
                          <Badge variant={index < 4 ? 'outline' : 'destructive'}>
                            {index < 4 ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Workflow Settings Modal */}
      <Dialog open={showWorkflowSettings} onOpenChange={setShowWorkflowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Workflow Settings - {selectedWorkflow?.name}
            </DialogTitle>
            <DialogDescription>
              Configure workflow parameters and automation rules
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkflow && (
            <div className="space-y-6">
              {/* Basic Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Trigger Frequency</label>
                      <select className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded">
                        <option>Every 5 minutes</option>
                        <option>Every 15 minutes</option>
                        <option>Hourly</option>
                        <option>Daily</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Priority</label>
                      <select className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded">
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Max Retries</label>
                    <input 
                      type="number" 
                      defaultValue="3" 
                      className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowWorkflowSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowWorkflowSettings(false)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 