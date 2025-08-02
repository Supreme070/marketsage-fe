"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ModernKanbanBoard from "./modern-kanban-board";
import { TaskAnalytics } from "./task-analytics";
import { AdvancedTaskAnalytics } from "./AdvancedTaskAnalytics";
import { TaskTemplates } from "./task-templates";
import { TeamCollaboration } from "./team-collaboration";
import { TaskCalendar } from "./task-calendar";
import IntelligentPriorityPanel from "./IntelligentPriorityPanel";
import { 
  Kanban, 
  BarChart3, 
  Users, 
  Plus,
  TrendingUp,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Calendar,
  Brain,
  Sparkles,
  Zap
} from "lucide-react";

export function TaskManagementDashboard() {
  const [activeTab, setActiveTab] = useState("kanban");
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPriorityPanel, setShowPriorityPanel] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  // Mock data for overview stats
  const stats = {
    activeTasks: 47,
    completedToday: 12,
    overdueTasks: 3,
    teamProductivity: 87.5,
    aiSuggestions: aiSuggestions.length
  };

  const generateAISuggestions = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/v2/ai/tasks/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'demo-customer',
          triggerEvent: 'dashboard_optimization'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Mock tasks data for priority demonstration
  const mockTasks = [
    { id: 'task-1', title: 'Fix customer login issue', status: 'TODO', priority: 'HIGH', assignee: { name: 'John Doe' } },
    { id: 'task-2', title: 'Update campaign analytics dashboard', status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: { name: 'Jane Smith' } },
    { id: 'task-3', title: 'Optimize email delivery performance', status: 'TODO', priority: 'LOW', assignee: { name: 'Bob Johnson' } },
    { id: 'task-4', title: 'Implement SMS retry mechanism', status: 'TODO', priority: 'MEDIUM', assignee: { name: 'Alice Brown' } },
    { id: 'task-5', title: 'Design new user onboarding flow', status: 'REVIEW', priority: 'HIGH', assignee: { name: 'Charlie Wilson' } }
  ];

  const handlePriorityUpdate = (priorities: any[]) => {
    console.log('Priority update received:', priorities);
    // Update task ordering or UI based on new priorities
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              +5 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              +20% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              -2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamProductivity}%</div>
            <p className="text-xs text-muted-foreground">
              +3.2% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiSuggestions}</div>
            <p className="text-xs text-muted-foreground">
              {isGeneratingAI ? 'Generating...' : 'AI-powered insights'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-6 lg:w-[700px]">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="ai-suggestions">AI Tasks</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="collaboration">Teams</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={generateAISuggestions}
              disabled={isGeneratingAI}
            >
              <Brain className="h-4 w-4" />
              {isGeneratingAI ? 'Generating...' : 'AI Suggestions'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowPriorityPanel(true)}
            >
              <TrendingUp className="h-4 w-4" />
              Smart Priority
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setActiveTab("calendar")}
            >
              <Calendar className="h-4 w-4" />
              Calendar View
            </Button>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        <TabsContent value="kanban" className="space-y-4">
          <ModernKanbanBoard />
        </TabsContent>

        <TabsContent value="ai-suggestions" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI-Powered Task Suggestions
                </CardTitle>
                <CardDescription>
                  Intelligent task recommendations based on customer behavior and workflow analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No AI suggestions yet. Generate intelligent task recommendations.
                    </p>
                    <Button onClick={generateAISuggestions} disabled={isGeneratingAI}>
                      <Zap className="h-4 w-4 mr-2" />
                      {isGeneratingAI ? 'Generating...' : 'Generate AI Suggestions'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiSuggestions.map((suggestion, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{suggestion.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {suggestion.description}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <Badge variant={
                                  suggestion.priority === 'HIGH' ? 'destructive' :
                                  suggestion.priority === 'MEDIUM' ? 'default' : 'secondary'
                                }>
                                  {suggestion.priority}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {suggestion.category}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ~{suggestion.estimatedDuration}min
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {(suggestion.confidence * 100).toFixed(0)}% confidence
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button size="sm" variant="outline">
                                Create Task
                              </Button>
                              <Button size="sm">
                                Auto Execute
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <TaskCalendar />
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedTaskAnalytics />
        </TabsContent>

        <TabsContent value="collaboration">
          <TeamCollaboration />
        </TabsContent>

        <TabsContent value="templates">
          <TaskTemplates />
        </TabsContent>
      </Tabs>

      {/* Intelligent Priority Panel */}
      <IntelligentPriorityPanel 
        isOpen={showPriorityPanel}
        onOpenChange={setShowPriorityPanel}
        tasks={mockTasks}
        onPriorityUpdate={handlePriorityUpdate}
      />
    </div>
  );
} 