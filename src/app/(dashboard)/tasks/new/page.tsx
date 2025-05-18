"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskFormValues } from "@/lib/validations/task";

export default function NewTaskPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Form state
  const [formData, setFormData] = useState<TaskFormValues>({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle date selection
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      dueDate: date ? date.toISOString() : "",
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }
      
      toast.success("Task created successfully");
      router.push("/tasks");
      router.refresh();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>
              Add a new task for your marketing team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Task Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input 
                id="title"
                name="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {/* Task Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                name="description"
                placeholder="Enter task description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleSelectChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/tasks")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 