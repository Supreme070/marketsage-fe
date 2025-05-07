"use client";

import { useState } from "react";
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
  ArrowLeft,
  Save,
  Mail,
  MessageSquare,
  List,
  Tag,
  ArrowRight,
  Users,
  Clock,
  HandCoins,
  GitMerge,
  ThumbsUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TemplateCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const templates: TemplateCard[] = [
    {
      id: "welcome-sequence",
      title: "Welcome Sequence",
      description: "Introduce new subscribers to your business",
      icon: <Mail className="h-10 w-10" />,
      category: "email",
    },
    {
      id: "abandoned-cart",
      title: "Abandoned Cart Recovery",
      description: "Follow up on abandoned shopping carts",
      icon: <HandCoins className="h-10 w-10" />,
      category: "sales",
    },
    {
      id: "re-engagement",
      title: "Re-Engagement Campaign",
      description: "Win back inactive subscribers",
      icon: <ThumbsUp className="h-10 w-10" />,
      category: "email",
    },
    {
      id: "lead-nurturing",
      title: "Lead Nurturing",
      description: "Nurture leads through your sales funnel",
      icon: <Users className="h-10 w-10" />,
      category: "sales",
    },
    {
      id: "post-purchase",
      title: "Post-Purchase Follow-up",
      description: "Gather feedback after purchase completion",
      icon: <MessageSquare className="h-10 w-10" />,
      category: "sales",
    },
    {
      id: "webinar-promotion",
      title: "Webinar Promotion",
      description: "Promote and follow up for webinars",
      icon: <Users className="h-10 w-10" />,
      category: "events",
    },
  ];

  const handleCreateWorkflow = () => {
    // For now, just redirect to a new workflow ID
    // In a real app, we would create the workflow on the server
    router.push(`/workflows/new-workflow-${Date.now()}`);
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
          <h2 className="text-3xl font-bold tracking-tight">Create Workflow</h2>
        </div>
        <Button onClick={handleCreateWorkflow} disabled={!workflowName}>
          <Save className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Workflow Details</CardTitle>
            <CardDescription>
              Provide basic information about your workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., Welcome Sequence"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe the purpose of this workflow..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Workflow Template</CardTitle>
            <CardDescription>
              Start with a pre-built template or create from scratch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="all"
              className="space-y-4"
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="all">All Templates</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  className={`cursor-pointer rounded-lg border-2 p-4 text-center hover:border-primary/50 hover:bg-accent transition-colors ${
                    selectedTemplate === "blank" ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setSelectedTemplate("blank")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto mb-2">
                    <GitMerge className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium">Blank Workflow</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start from scratch
                  </p>
                </div>

                {templates
                  .filter(
                    (template) =>
                      activeTab === "all" || template.category === activeTab
                  )
                  .map((template) => (
                    <div
                      key={template.id}
                      className={`cursor-pointer rounded-lg border-2 p-4 text-center hover:border-primary/50 hover:bg-accent transition-colors ${
                        selectedTemplate === template.id
                          ? "border-primary bg-accent"
                          : ""
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto mb-2">
                        {template.icon}
                      </div>
                      <h3 className="font-medium">{template.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  ))}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
