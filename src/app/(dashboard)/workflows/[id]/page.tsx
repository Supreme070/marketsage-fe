"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowEditorProvider } from "@/components/workflow-editor/WorkflowEditor";

export default function WorkflowEditorPage({ params }: { params: { id: string } }) {
  const [workflowName, setWorkflowName] = useState("Welcome Sequence");
  const [workflowDescription, setWorkflowDescription] = useState("New subscriber onboarding series");
  const [isActive, setIsActive] = useState(true);

  // This would be a real workflow in a full implementation
  const workflow = {
    id: params.id,
    name: workflowName,
    description: workflowDescription,
    status: isActive ? "ACTIVE" : "INACTIVE",
    nodes: [],
    connections: [],
  };

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
            <h2 className="text-3xl font-bold tracking-tight">{workflow.name}</h2>
            <p className="text-muted-foreground">{workflow.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" onClick={() => setIsActive(!isActive)}>
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
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save
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
          <WorkflowEditorProvider />
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
                    onClick={() => setIsActive(true)}
                  >
                    Active
                  </Button>
                  <Button
                    variant={!isActive ? "default" : "outline"}
                    onClick={() => setIsActive(false)}
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
