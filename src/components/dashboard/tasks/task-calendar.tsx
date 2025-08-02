"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignee?: {
    name: string;
    image?: string;
  };
  creator: {
    name: string;
  };
}

export function TaskCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/v2/tasks');
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Get tasks for selected date
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    let filtered = tasks.filter(task => {
      if (!task.dueDate) return false;
      return task.dueDate.split('T')[0] === dateStr;
    });

    // Apply filters
    if (selectedStatus !== "all") {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }
    if (selectedPriority !== "all") {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    return filtered.sort((a, b) => {
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [selectedDate, tasks, selectedStatus, selectedPriority]);

  // Get dates that have tasks for calendar highlighting
  const datesWithTasks = useMemo(() => {
    const dates = new Set<string>();
    tasks.forEach(task => {
      if (task.dueDate) {
        dates.add(task.dueDate.split('T')[0]);
      }
    });
    return dates;
  }, [tasks]);

  // Get monthly task summary
  const monthlyTaskSummary = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= monthStart && taskDate <= monthEnd;
    });

    const summary = {
      total: monthTasks.length,
      todo: monthTasks.filter(t => t.status === 'TODO').length,
      inProgress: monthTasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: monthTasks.filter(t => t.status === 'REVIEW').length,
      done: monthTasks.filter(t => t.status === 'DONE').length,
      overdue: monthTasks.filter(t => 
        new Date(t.dueDate!) < new Date() && t.status !== 'DONE'
      ).length,
      urgent: monthTasks.filter(t => t.priority === 'URGENT').length
    };

    return summary;
  }, [currentMonth, tasks]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEW': return 'bg-purple-100 text-purple-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Clock className="h-3 w-3" />;
      case 'IN_PROGRESS': return <Clock className="h-3 w-3 text-blue-600" />;
      case 'REVIEW': return <AlertCircle className="h-3 w-3 text-purple-600" />;
      case 'DONE': return <CheckCircle className="h-3 w-3 text-green-600" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Handle task actions
  const handleAddTask = () => {
    console.log("Add task for date:", selectedDate);
    // This could open a task creation dialog or navigate to task creation
  };

  const handleEditTask = (task: Task) => {
    console.log("Edit task:", task.title);
    // This could open an edit dialog
  };

  const handleAddComment = (task: Task) => {
    console.log("Add comment to task:", task.title);
    // This could open a comment dialog
  };

  const handleViewDetails = (task: Task) => {
    console.log("View details for task:", task.title);
    // This could navigate to task details page or open expanded dialog
  };

  const handleNewTask = () => {
    console.log("Create new task");
    // This could open a task creation dialog
  };

  const handleMoreFilters = () => {
    console.log("Open more filters");
    // This could open advanced filter options
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Task Calendar</CardTitle>
              <CardDescription>
                View and manage tasks by date
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleNewTask}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Status Filter</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority Filter</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={handleMoreFilters}>
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {currentMonth.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border"
              modifiers={{
                hasTask: (date) => datesWithTasks.has(date.toISOString().split('T')[0])
              }}
              modifiersStyles={{
                hasTask: { 
                  backgroundColor: '#3b82f6', 
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
            />
            
            {/* Month Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Month Overview</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Tasks:</span>
                  <span className="font-medium">{monthlyTaskSummary.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-medium text-green-600">{monthlyTaskSummary.done}</span>
                </div>
                <div className="flex justify-between">
                  <span>In Progress:</span>
                  <span className="font-medium text-blue-600">{monthlyTaskSummary.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue:</span>
                  <span className="font-medium text-red-600">{monthlyTaskSummary.overdue}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? 
                `Tasks for ${selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric' 
                })}` : 
                'Select a Date'
              }
            </CardTitle>
            <CardDescription>
              {tasksForSelectedDate.length} task{tasksForSelectedDate.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksForSelectedDate.length > 0 ? (
              <div className="space-y-3">
                {tasksForSelectedDate.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1">{task.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{task.assignee?.name || task.creator.name}</span>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tasks scheduled for this date</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleAddTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(selectedTask.priority)}>
                  {selectedTask.priority}
                </Badge>
                <Badge variant="outline" className={getStatusColor(selectedTask.status)}>
                  {getStatusIcon(selectedTask.status)}
                  <span className="ml-1">{selectedTask.status.replace('_', ' ')}</span>
                </Badge>
              </div>
              
              {selectedTask.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium">Assigned to</h4>
                  <p className="text-muted-foreground">{selectedTask.assignee?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Created by</h4>
                  <p className="text-muted-foreground">{selectedTask.creator.name}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEditTask(selectedTask)}>
                  Edit Task
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAddComment(selectedTask)}>
                  Add Comment
                </Button>
                <Button size="sm" onClick={() => handleViewDetails(selectedTask)}>
                  View Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 