"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Filter, Plus, Users, Calendar, Tag, Info, Pencil, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  contactId?: string;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  campaignId?: string;
  campaign?: {
    id: string;
    name: string;
  };
  segmentId?: string;
  segment?: {
    id: string;
    name: string;
  };
  tags?: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    }
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [filterCampaign, setFilterCampaign] = useState<string>("");

  // Define the columns
  const columns = [
    { id: "TODO", title: "To Do" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "REVIEW", title: "Review" },
    { id: "BLOCKED", title: "Blocked" },
    { id: "COMPLETED", title: "Completed" }
  ];

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
        setTasks(data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter(task => {
    let passesFilter = true;
    
    if (filterPriority && task.priority !== filterPriority) {
      passesFilter = false;
    }
    
    if (filterAssignee && (!task.assignee || task.assignee.id !== filterAssignee)) {
      passesFilter = false;
    }
    
    if (filterCampaign && (!task.campaignId || task.campaignId !== filterCampaign)) {
      passesFilter = false;
    }
    
    return passesFilter;
  });

  // Group tasks by status for the columns
  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  // Handle drag and drop
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back to its original place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Update the task's status in the UI first (optimistic update)
    const updatedTasks = tasks.map(task => {
      if (task.id === draggableId) {
        return { ...task, status: destination.droppableId };
      }
      return task;
    });
    
    setTasks(updatedTasks);

    // Then update in the backend
    try {
      const response = await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: destination.droppableId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }
      
      toast.success("Task status updated");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task status");
      
      // Revert the optimistic update if the API call fails
      setTasks(tasks);
    }
  };

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

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Today</Badge>;
    } else if (isTomorrow) {
      return <Badge variant="secondary" className="bg-purple-50 text-purple-700">Tomorrow</Badge>;
    } else if (date < now) {
      return <Badge variant="secondary" className="bg-red-50 text-red-700">Overdue</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-slate-50 text-slate-700">
        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </Badge>;
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string = "User") => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing Task Board</h2>
          <p className="text-muted-foreground">
            Manage your marketing tasks with drag and drop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCampaign} onValueChange={setFilterCampaign}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Campaigns</SelectItem>
                {/* Normally you'd fetch and map through campaigns */}
                <SelectItem value="campaign-1">Email Campaign 1</SelectItem>
                <SelectItem value="campaign-2">SMS Campaign 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button asChild className="ml-2">
            <Link href="/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-5 gap-4">
            {columns.map(column => (
              <div key={column.id} className="flex flex-col">
                <div className="bg-background border rounded-t-lg p-3 font-medium flex justify-between items-center">
                  <div className="flex items-center">
                    {column.title}
                    <Badge className="ml-2 bg-primary/10 text-xs" variant="secondary">
                      {getTasksByStatus(column.id).length}
                    </Badge>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-muted/10 rounded-b-lg border-x border-b min-h-[calc(100vh-240px)] p-2 flex flex-col gap-2 ${snapshot.isDraggingOver ? 'bg-muted/20' : ''}`}
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-background rounded-md border p-3 shadow-sm ${snapshot.isDragging ? 'shadow-md' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex-1">
                                  <Link href={`/tasks/${task.id}`} className="font-medium hover:text-primary transition-colors">
                                    {task.title}
                                  </Link>
                                </div>
                                <div>
                                  {getPriorityBadge(task.priority)}
                                </div>
                              </div>
                              
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                                <div className="flex items-center gap-1">
                                  {task.assignee ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={task.assignee.image || ""} />
                                            <AvatarFallback className="text-xs">
                                              {getInitials(task.assignee.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>{task.assignee.name}</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : null}
                                  
                                  {task.campaign?.name && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Badge variant="outline" className="h-6 text-xs">
                                            {task.campaign.name.substring(0, 10)}...
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>{task.campaign.name}</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  {formatDate(task.dueDate)}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
} 