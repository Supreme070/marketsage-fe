/**
 * Multi-Agent AI Coordination Dashboard
 * ====================================
 * Monitor and manage AI agent collaborations and performance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Brain, 
  Activity, 
  Settings, 
  Play, 
  Pause, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AIAgent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'busy' | 'offline' | 'collaborating';
  capabilities: string[];
  specialization: string[];
  currentTasks: any[];
  performance: {
    tasksCompleted: number;
    tasksSuccessful: number;
    averageResponseTime: number;
    collaborationScore: number;
    specialtyEfficiency: number;
    lastUpdate: Date;
  };
  lastHeartbeat: Date;
}

interface CollaborationSession {
  id: string;
  participants: string[];
  coordinator: string;
  objective: string;
  type: 'consensus' | 'delegation' | 'parallel' | 'sequential';
  status: 'planning' | 'active' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

export default function MultiAgentDashboard() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [collaborations, setCollaborations] = useState<CollaborationSession[]>([]);
  const [performance, setPerformance] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/ai/agents?action=status');
      const result = await response.json();
      
      if (result.success) {
        setAgents(result.data.agents || []);
        setCollaborations(result.data.activeCollaborations || []);
        setPerformance(result.data.performance || {});
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch agent status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'collaborating': return 'bg-blue-100 text-blue-800';
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <Activity className="w-4 h-4" />;
      case 'collaborating': return <Users className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'offline': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const createCollaboration = async () => {
    try {
      const response = await fetch('/api/ai/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_collaboration',
          objective: 'General data analysis and insights',
          capabilities: ['analytics', 'strategy'],
          priority: 'medium'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        fetchAgentStatus(); // Refresh data
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collaboration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Brain className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading agent status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Multi-Agent System Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAgentStatus} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-Agent AI System</h2>
          <p className="text-muted-foreground">Monitor and coordinate AI agent collaborations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createCollaboration} className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Create Collaboration
          </Button>
          <Button onClick={fetchAgentStatus} variant="outline">
            <Activity className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">
              {agents.filter(a => a.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collaborations.length}</div>
            <p className="text-xs text-muted-foreground">
              {collaborations.filter(c => c.status === 'active').length} running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <Progress value={98} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, agent) => sum + agent.performance.tasksCompleted, 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>
                        {agent.type} • {agent.capabilities.join(', ')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(agent.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(agent.status)}
                        {agent.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Tasks Completed</p>
                      <p className="text-muted-foreground">{agent.performance.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="font-medium">Success Rate</p>
                      <p className="text-muted-foreground">
                        {agent.performance.tasksCompleted > 0 
                          ? Math.round((agent.performance.tasksSuccessful / agent.performance.tasksCompleted) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Collaboration Score</p>
                      <p className="text-muted-foreground">
                        {Math.round(agent.performance.collaborationScore * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Current Tasks</p>
                      <p className="text-muted-foreground">{agent.currentTasks.length}</p>
                    </div>
                  </div>
                  
                  {agent.currentTasks.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Current Tasks:</p>
                      <div className="space-y-1">
                        {agent.currentTasks.slice(0, 2).map((task, index) => (
                          <div key={index} className="text-xs p-2 bg-muted rounded">
                            {task.description || task.type}
                          </div>
                        ))}
                        {agent.currentTasks.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{agent.currentTasks.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="collaborations" className="space-y-4">
          <div className="grid gap-4">
            {collaborations.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.objective}</CardTitle>
                      <CardDescription>
                        {session.type} collaboration • {session.participants.length} participants
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Started</p>
                      <p className="text-muted-foreground">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Coordinator</p>
                      <p className="text-muted-foreground">
                        {agents.find(a => a.id === session.coordinator)?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-muted-foreground">
                        {Math.round((Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60))} min
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {collaborations.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Active Collaborations</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a collaboration to see agents working together on complex tasks.
                  </p>
                  <Button onClick={createCollaboration}>
                    Start Collaboration
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(performance).map(([agentName, perf]: [string, any]) => (
              <Card key={agentName}>
                <CardHeader>
                  <CardTitle className="text-lg">{agentName}</CardTitle>
                  <CardDescription>Performance Metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Collaboration Score</span>
                        <span>{Math.round(perf.collaborationScore * 100)}%</span>
                      </div>
                      <Progress value={perf.collaborationScore * 100} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Specialty Efficiency</span>
                        <span>{Math.round(perf.specialtyEfficiency * 100)}%</span>
                      </div>
                      <Progress value={perf.specialtyEfficiency * 100} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Tasks Completed</p>
                        <p className="text-muted-foreground">{perf.tasksCompleted}</p>
                      </div>
                      <div>
                        <p className="font-medium">Success Rate</p>
                        <p className="text-muted-foreground">
                          {perf.tasksCompleted > 0 
                            ? Math.round((perf.tasksSuccessful / perf.tasksCompleted) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}