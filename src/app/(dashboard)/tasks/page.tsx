"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, CheckCircle2, Filter, ArrowUpDown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";

// Task type definition
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  dueDate?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  tags?: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    }
  }>;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch tasks from the API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tasks");
        
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter(task => {
    switch (activeTab) {
      case "todo":
        return task.status === "TODO";
      case "in-progress":
        return task.status === "IN_PROGRESS";
      case "completed":
        return task.status === "COMPLETED";
      case "high-priority":
        return task.priority === "HIGH" || task.priority === "URGENT";
      default:
        return true; // "all" tab
    }
  });

  // Get badge color based on task priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "LOW":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low</Badge>;
      case "MEDIUM":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Medium</Badge>;
      case "HIGH":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">High</Badge>;
      case "URGENT":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Urgent</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get badge for task status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "TODO":
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">To Do</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      case "REVIEW":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Review</Badge>;
      case "BLOCKED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Blocked</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Manage and organize your marketing tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="high-priority">High Priority</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>
                {activeTab === "all" ? "All Tasks" : 
                 activeTab === "todo" ? "To Do Tasks" :
                 activeTab === "in-progress" ? "In Progress Tasks" :
                 activeTab === "completed" ? "Completed Tasks" :
                 "High Priority Tasks"}
              </CardTitle>
              <CardDescription>
                {filteredTasks.length} tasks found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No tasks found</p>
                  <Button asChild>
                    <Link href="/tasks/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create a New Task
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="space-y-1">
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Due: {formatDate(task.dueDate)}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">View</Button>
                          {task.status !== "COMPLETED" && (
                            <Button variant="outline" size="sm">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 