import { useEffect, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  MessageCircle,
  Paperclip,
  DollarSign,
  Megaphone,
  Target,
  MessageSquare,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: {
    name: string;
    initials: string;
    avatar?: string;
  } | null;
  dueDate?: string;
  campaign?: string | null;
  attachments?: number;
  comments?: number;
  tags?: string[];
  revenue?: number;
}

type TasksByStatus = Record<string, Task[]>;

const STATUS_META: Record<
  string,
  { title: string; color: string }
> = {
  TODO: { title: "To Do", color: "bg-slate-100 dark:bg-slate-800" },
  IN_PROGRESS: { title: "In Progress", color: "bg-blue-100 dark:bg-blue-900/50" },
  REVIEW: { title: "Review", color: "bg-yellow-100 dark:bg-yellow-900/50" },
  DONE: { title: "Done", color: "bg-green-100 dark:bg-green-900/50" },
};

// TaskForm Component
function TaskForm({ 
  task, 
  onSubmit, 
  onCancel 
}: { 
  task?: Task;
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "MEDIUM",
    status: task?.status || "TODO",
    campaign: task?.campaign || "",
    revenue: task?.revenue?.toString() || "",
  });

  // Update form data when task prop changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "MEDIUM",
        status: task.status || "TODO",
        campaign: task.campaign || "",
        revenue: task.revenue?.toString() || "",
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      revenue: formData.revenue ? Number.parseInt(formData.revenue) : undefined,
    };
    
    await onSubmit(submitData);
    
    // Reset form for new tasks
    if (!task) {
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "TODO",
        campaign: "",
        revenue: "",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Task title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>
      <div>
        <Textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="Campaign (optional)"
            value={formData.campaign}
            onChange={(e) => setFormData(prev => ({ ...prev, campaign: e.target.value }))}
          />
        </div>
        <div>
          <Input
            type="number"
            placeholder="Revenue (₦)"
            value={formData.revenue}
            onChange={(e) => setFormData(prev => ({ ...prev, revenue: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? "Update" : "Create"} Task
        </Button>
      </div>
    </form>
  );
}

// ColumnForm Component
function ColumnForm({ 
  onSubmit 
}: { 
  onSubmit: (columnName: string) => void;
}) {
  const [columnName, setColumnName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (columnName.trim()) {
      onSubmit(columnName.trim());
      setColumnName("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Column name"
          value={columnName}
          onChange={(e) => setColumnName(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={!columnName.trim()}>
          Add Column
        </Button>
      </div>
    </form>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  statusKey, 
  meta, 
  tasks, 
  onEditTask, 
  onDeleteTask, 
  onAddTask 
}: {
  statusKey: string;
  meta: { title: string; color: string };
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: () => void;
}) {
  const { setNodeRef } = useDroppable({
    id: statusKey,
  });

  return (
    <Card
      ref={setNodeRef}
      className="flex flex-col bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700"
    >
      <CardHeader className={`${meta.color} rounded-t-lg border-b`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {meta.title}
          </CardTitle>
          <Badge variant="secondary" className="bg-white/80">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[400px]">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            
            {/* Quick Add Button */}
            <Button
              variant="ghost"
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 h-12"
              onClick={onAddTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

// Sortable Task Card Component
function SortableTaskCard({ 
  task, 
  onEdit, 
  onDelete 
}: { 
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
      case "urgent":
        return "bg-red-500 text-white";
      case "HIGH":
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
      case "MEDIUM":
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200";
      case "LOW":
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "marketing":
        return <Megaphone className="h-4 w-4" />;
      case "sales":
        return <DollarSign className="h-4 w-4" />;
      case "content":
        return <MessageSquare className="h-4 w-4" />;
      case "campaign":
        return <Target className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(task.campaign ? "campaign" : undefined)}
            <Badge
              className={getPriorityColor(task.priority)}
              variant="secondary"
            >
              {task.priority.toLowerCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
        )}

        {task.campaign && (
          <Badge variant="outline" className="text-xs">
            {task.campaign}
          </Badge>
        )}

        {task.revenue && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <DollarSign className="h-3 w-3" />
            <span className="text-xs font-medium">
              ₦{(task.revenue / 1000).toFixed(0)}K
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.initials}
                </AvatarFallback>
              </Avatar>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(task.dueDate).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.attachments && task.attachments > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments}</span>
              </div>
            )}
            {task.comments && task.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{task.comments}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ModernKanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch tasks");
        }
        const apiData = await res.json();
        
        // Transform API data to match our Task interface
        const transformedTasks: Task[] = apiData.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          campaign: task.campaign?.name || null,
          assignee: task.assignee ? {
            name: task.assignee.name,
            initials: task.assignee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            avatar: task.assignee.image
          } : null,
          attachments: 0, // Default value, update based on actual data structure
          comments: task._count?.comments || 0,
          tags: [], // Default value, update based on actual data structure
          revenue: task.revenue
        }));
        
        setTasks(transformedTasks);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  // CRUD operations
  const createTask = async (taskData: Partial<Task>) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      
      if (response.ok) {
        const apiTask = await response.json();
        
        // Transform the new task data to match our interface
        const newTask: Task = {
          id: apiTask.id,
          title: apiTask.title,
          description: apiTask.description,
          status: apiTask.status,
          priority: apiTask.priority,
          dueDate: apiTask.dueDate,
          campaign: apiTask.campaign?.name || null,
          assignee: apiTask.assignee ? {
            name: apiTask.assignee.name,
            initials: apiTask.assignee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            avatar: apiTask.assignee.image
          } : null,
          attachments: 0,
          comments: apiTask._count?.comments || 0,
          tags: [],
          revenue: apiTask.revenue
        };
        
        setTasks(prev => [...prev, newTask]);
        setShowCreateModal(false);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to create task:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Error creating task:", error);
      return false;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    console.log("updateTask called:", { taskId, updates });
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      console.log("API response status:", response.status);
      
      if (response.ok) {
        const apiTask = await response.json();
        console.log("Task updated successfully:", apiTask);
        
        // Transform the updated task data to match our interface
        const updatedTask: Task = {
          id: apiTask.id,
          title: apiTask.title,
          description: apiTask.description,
          status: apiTask.status,
          priority: apiTask.priority,
          dueDate: apiTask.dueDate,
          campaign: apiTask.campaign?.name || null,
          assignee: apiTask.assignee ? {
            name: apiTask.assignee.name,
            initials: apiTask.assignee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            avatar: apiTask.assignee.image
          } : null,
          attachments: 0,
          comments: apiTask._count?.comments || 0,
          tags: [],
          revenue: apiTask.revenue
        };
        
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        setEditingTask(null);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to update task:", { status: response.status, errorData });
        return false;
      }
    } catch (error) {
      console.error("Error updating task:", error);
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setEditingTask(null);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to delete task:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      return false;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
    console.log("Drag started:", { taskId: event.active.id, task });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    console.log("Drag ended:", { activeId: active.id, overId: over?.id });

    if (!over) {
      console.log("No drop target, drag cancelled");
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find(t => t.id === taskId);

    console.log("Drag details:", { taskId, newStatus, currentStatus: task?.status });

    if (task && task.status !== newStatus) {
      console.log("Updating task status from", task.status, "to", newStatus);
      
      // Optimistically update the UI first
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
      
      // Then update the backend
      updateTask(taskId, { status: newStatus });
    } else {
      console.log("No status change needed or task not found");
    }
  };

  const tasksByStatus: TasksByStatus = tasks.reduce((acc, task) => {
    const key = task.status || "TODO";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as TasksByStatus);

  // Add custom column
  const addCustomColumn = (columnName: string) => {
    const columnId = `CUSTOM_${columnName.toUpperCase().replace(/\s+/g, '_')}`;
    
    // Check if column already exists in STATUS_META (prevent duplicates)
    if (STATUS_META[columnId]) {
      console.log("Column already exists:", columnId);
      return;
    }
    
    // Add to both customColumns array and STATUS_META
    setCustomColumns(prev => [...prev, columnId]);
    STATUS_META[columnId] = {
      title: columnName,
      color: "bg-purple-100 dark:bg-purple-900/50"
    };
    
    // Close the modal
    setShowAddColumnModal(false);
    
    console.log("Added custom column:", { columnId, title: columnName });
  };

  // Get all available columns
  const getAllColumns = () => {
    // STATUS_META already includes custom columns when they're added
    return Object.keys(STATUS_META);
  };

  if (loading) {
    return <p className="text-center text-muted-foreground">Loading tasks…</p>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-2">Error: {error}</p>
        <p className="text-sm text-muted-foreground">
          Make sure the database is running. If using Docker, run: 
          <code className="bg-gray-100 px-2 py-1 rounded ml-2">docker-compose -f docker-compose.prod.yml up db</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Task and Add Column buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Task Board
        </h2>
        <div className="flex gap-2">
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <TaskForm
                onSubmit={createTask}
                onCancel={() => setShowCreateModal(false)}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddColumnModal} onOpenChange={setShowAddColumnModal}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Column</DialogTitle>
              </DialogHeader>
              <ColumnForm onSubmit={addCustomColumn} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
          {getAllColumns().map((statusKey) => {
            const meta = STATUS_META[statusKey];
            if (!meta) return null;
            
            return (
              <DroppableColumn
                key={statusKey}
                statusKey={statusKey}
                meta={meta}
                tasks={tasksByStatus[statusKey] || []}
                onEditTask={setEditingTask}
                onDeleteTask={deleteTask}
                onAddTask={() => setShowCreateModal(true)}
              />
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <SortableTaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit Task Modal */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              task={editingTask}
              onSubmit={(data) => updateTask(editingTask.id, data)}
              onCancel={() => setEditingTask(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 