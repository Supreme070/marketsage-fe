"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ModernKanbanBoard from "./modern-kanban-board";
import { TaskAnalytics } from "./task-analytics";
import { TaskTemplates } from "./task-templates";
import { TeamCollaboration } from "./team-collaboration";
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
  Calendar
} from "lucide-react";

export function TaskManagementDashboard() {
  const [activeTab, setActiveTab] = useState("kanban");

  // Mock data for overview stats
  const stats = {
    activeTasks: 47,
    completedToday: 12,
    overdueTasks: 3,
    teamProductivity: 87.5
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="collaboration">Teams</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-2">
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

        <TabsContent value="analytics">
          <TaskAnalytics />
        </TabsContent>

        <TabsContent value="collaboration">
          <TeamCollaboration />
        </TabsContent>

        <TabsContent value="templates">
          <TaskTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
} 