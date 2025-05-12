"use client";

import { useState, useEffect } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Save,
  Play,
  PauseCircle,
  ArrowLeft,
  Settings,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowEditorProvider } from "@/components/workflow-editor/WorkflowEditor";
import { toast } from "sonner";

export default function WorkflowEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState("Welcome Sequence");
  const [workflowDescription, setWorkflowDescription] = useState("New subscriber onboarding series");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch workflow data
  useEffect(() => {
    const fetchWorkflow = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/workflows/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Workflow not found");
            router.push("/workflows");
            return;
          }
          throw new Error("Failed to fetch workflow");
        }
        
        const workflow = await response.json();
        
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || "");
        setIsActive(workflow.status === "ACTIVE");
        
        // Ensure we have a valid definition
        if (!workflow.definition || !workflow.definition.nodes) {
          console.warn("Workflow has invalid or empty definition");
        }
      } catch (error) {
        console.error("Error fetching workflow:", error);
        toast.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflow();
  }, [params.id, router]);

  // Update workflow status
  const updateWorkflowStatus = async (status: "ACTIVE" | "INACTIVE" | "PAUSED" | "ARCHIVED") => {
    try {
      const response = await fetch(`/api/workflows/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update workflow status");
      }
      
      setIsActive(status === "ACTIVE");
      toast.success(`Workflow ${status === "ACTIVE" ? "activated" : "paused"}`);
    } catch (error) {
      console.error("Error updating workflow status:", error);
      toast.error("Failed to update workflow status");
    }
  };

  // Save workflow settings
  const saveWorkflowSettings = async () => {
    try {
      const response = await fetch(`/api/workflows/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update workflow settings");
      }
      
      toast.success("Workflow settings updated");
    } catch (error) {
      console.error("Error updating workflow settings:", error);
      toast.error("Failed to update workflow settings");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading workflow...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <a href="/workflows">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{workflowName}</h2>
            <p className="text-muted-foreground">{workflowDescription}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={saveWorkflowSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
          <Button 
            variant="outline" 
            onClick={() => updateWorkflowStatus(isActive ? "INACTIVE" : "ACTIVE")}
          >
            {isActive ? (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <WorkflowEditorProvider workflowId={params.id} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
              <CardDescription>
                Configure the basic settings for your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isActive ? "default" : "outline"}
                    onClick={() => updateWorkflowStatus("ACTIVE")}
                  >
                    Active
                  </Button>
                  <Button
                    variant={!isActive ? "default" : "outline"}
                    onClick={() => updateWorkflowStatus("INACTIVE")}
                  >
                    Inactive
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Analytics</CardTitle>
              <CardDescription>
                Performance metrics for your workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <div className="text-center space-y-4">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-medium">No analytics data available</p>
                    <p className="text-sm text-muted-foreground">
                      Analytics will be displayed here once your workflow is active and has processed contacts
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
