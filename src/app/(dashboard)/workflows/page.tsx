"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Copy,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Play,
  PauseCircle,
  BarChart,
  Workflow,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE" | "PAUSED" | "ARCHIVED";
  definition: any;
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workflows
  useEffect(() => {
    if (status === "loading") {
      return; // Wait for session to load
    }

    if (status === "unauthenticated") {
      setError("Please log in to view workflows");
      setLoading(false);
      return;
    }

    const fetchWorkflows = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/workflows");
        
        if (response.status === 401) {
          setError("Authentication required. Please log in again.");
          router.push("/login");
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch workflows");
        }
        
        const data = await response.json();
        setWorkflows(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching workflows:", error);
        setError(error instanceof Error ? error.message : "Failed to load workflows");
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchWorkflows();
    }
  }, [status, router]);

  const handleCreateWorkflow = () => {
    router.push(`/workflows/new-workflow`);
  };

  const handleEdit = (id: string) => {
    router.push(`/workflows/${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/workflows/${id}`);
  };

  // Update workflow status
  const updateWorkflowStatus = async (id: string, status: "ACTIVE" | "INACTIVE" | "PAUSED" | "ARCHIVED") => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update workflow status");
      }
      
      // Update local state
      setWorkflows(prevWorkflows => 
        prevWorkflows.map(workflow => 
          workflow.id === id ? { ...workflow, status } : workflow
        )
      );
      
      toast.success(`Workflow ${status === "ACTIVE" ? "activated" : "paused"}`);
    } catch (error) {
      console.error("Error updating workflow status:", error);
      toast.error("Failed to update workflow status");
    }
  };

  // Delete workflow
  const deleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete workflow");
      }
      
      // Remove from local state
      setWorkflows(prevWorkflows => 
        prevWorkflows.filter(workflow => workflow.id !== id)
      );
      
      toast.success("Workflow deleted successfully");
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    }
  };

  // Duplicate workflow
  const duplicateWorkflow = async (id: string) => {
    try {
      // First, get the workflow to duplicate
      const response = await fetch(`/api/workflows/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch workflow for duplication");
      }
      
      const workflowToDuplicate = await response.json();
      
      // Create a new workflow based on the existing one
      const newWorkflow = {
        name: `${workflowToDuplicate.name} (Copy)`,
        description: workflowToDuplicate.description,
        status: "INACTIVE", // Always start as inactive
        definition: JSON.stringify(workflowToDuplicate.definition)
      };
      
      // Create the duplicate
      const createResponse = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWorkflow),
      });
      
      if (!createResponse.ok) {
        throw new Error("Failed to duplicate workflow");
      }
      
      const createdWorkflow = await createResponse.json();
      
      // Add to local state
      setWorkflows(prevWorkflows => [createdWorkflow, ...prevWorkflows]);
      
      toast.success("Workflow duplicated successfully");
    } catch (error) {
      console.error("Error duplicating workflow:", error);
      toast.error("Failed to duplicate workflow");
    }
  };

  // Determine workflow metrics from definition
  const getWorkflowMetrics = (workflow: WorkflowData) => {
    const definition = workflow.definition;
    const nodes = definition.nodes || [];
    const activeContacts = Math.floor(Math.random() * 500); // Mock data - would come from analytics in real app
    
    return {
      steps: nodes.length,
      contacts: activeContacts,
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Workflows</h2>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
        
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading workflows...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Workflows</h2>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-medium mb-2">Failed to load workflows</h3>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Workflows</h2>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Workflows</CardTitle>
          <CardDescription>
            Automate your marketing processes with visual workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Workflow className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No workflows yet</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Create your first workflow to automate your marketing processes.
              </p>
              <Button onClick={handleCreateWorkflow}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Workflow
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Active Contacts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => {
                    const metrics = getWorkflowMetrics(workflow);
                    return (
                      <TableRow key={workflow.id}>
                        <TableCell className="font-medium">
                          <div 
                            className="flex flex-col cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleView(workflow.id)}
                          >
                            <span className="hover:underline">{workflow.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {workflow.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              workflow.status === "ACTIVE"
                                ? "default"
                                : workflow.status === "PAUSED"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {workflow.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{metrics.steps}</TableCell>
                        <TableCell>{metrics.contacts.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(workflow.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleView(workflow.id)}
                              title="View Workflow"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(workflow.id)}
                              title="Edit Workflow"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {workflow.status === "INACTIVE" ||
                                workflow.status === "PAUSED" ? (
                                  <DropdownMenuItem onClick={() => updateWorkflowStatus(workflow.id, "ACTIVE")}>
                                    <Play className="mr-2 h-4 w-4" /> Activate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => updateWorkflowStatus(workflow.id, "PAUSED")}>
                                    <PauseCircle className="mr-2 h-4 w-4" /> Pause
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow.id}?tab=analytics`)}>
                                  <BarChart className="mr-2 h-4 w-4" /> Statistics
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicateWorkflow(workflow.id)}>
                                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => deleteWorkflow(workflow.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
