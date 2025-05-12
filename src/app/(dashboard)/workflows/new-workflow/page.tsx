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
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface TemplateCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

// Template IDs for using predefined detailed templates
const PREDEFINED_TEMPLATE_IDS = {
  WELCOME_SEQUENCE: "simple-welcome-sequence",
  LEAD_NURTURING: "lead-nurturing-sequence",
  RE_ENGAGEMENT: "advanced-re-engagement"
};

export default function NewWorkflowPage() {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [creating, setCreating] = useState(false);

  const templates: TemplateCard[] = [
    {
      id: PREDEFINED_TEMPLATE_IDS.WELCOME_SEQUENCE,
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
      id: PREDEFINED_TEMPLATE_IDS.RE_ENGAGEMENT,
      title: "Re-Engagement Campaign",
      description: "Win back inactive subscribers",
      icon: <ThumbsUp className="h-10 w-10" />,
      category: "email",
    },
    {
      id: PREDEFINED_TEMPLATE_IDS.LEAD_NURTURING,
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

  const handleCreateWorkflow = async (selectedTemplateId = selectedTemplate) => {
    if (!workflowName) {
      toast.error("Please enter a workflow name");
      return;
    }

    setCreating(true);

    try {
      // Get the selected template or use blank workflow
      const template = selectedTemplateId ? 
        templates.find(t => t.id === selectedTemplateId) : 
        { id: 'blank', title: 'Blank Workflow' };

      // Create a basic definition based on the selected template
      let definition: { 
        nodes: Array<any>; 
        edges: Array<any>; 
      } = {
        nodes: [],
        edges: []
      };

      // Check if this is a predefined detailed template
      if (selectedTemplateId === PREDEFINED_TEMPLATE_IDS.WELCOME_SEQUENCE) {
        // Use the "Simple Welcome Sequence" template from seedWorkflows
        definition = {
          nodes: [
            {
              id: "trigger-1",
              type: "triggerNode",
              position: { x: 250, y: 100 },
              data: {
                label: "Contact added to list",
                description: "When a contact is added to a specified list",
                icon: "List",
                properties: {
                  listId: "list-1",
                  listName: "Newsletter Subscribers"
                }
              }
            },
            {
              id: "action-1",
              type: "actionNode",
              position: { x: 250, y: 220 },
              data: {
                label: "Send Email",
                description: "Send the welcome email immediately",
                icon: "Mail",
                properties: {
                  templateId: "template-1",
                  templateName: "Welcome Email",
                  subject: "Welcome to our newsletter!",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            },
            {
              id: "delay-1",
              type: "actionNode",
              position: { x: 250, y: 340 },
              data: {
                label: "Wait",
                description: "Wait for 2 days",
                icon: "Clock",
                properties: {
                  waitAmount: 2,
                  waitUnit: "days"
                }
              }
            },
            {
              id: "action-2",
              type: "actionNode",
              position: { x: 250, y: 460 },
              data: {
                label: "Send Email",
                description: "Send follow-up resources email",
                icon: "Mail",
                properties: {
                  templateId: "template-2",
                  templateName: "Resources Email",
                  subject: "Useful resources to get started",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            }
          ],
          edges: [
            {
              id: "edge-1",
              source: "trigger-1",
              target: "action-1",
              type: "custom"
            },
            {
              id: "edge-2",
              source: "action-1",
              target: "delay-1",
              type: "custom"
            },
            {
              id: "edge-3",
              source: "delay-1",
              target: "action-2",
              type: "custom"
            }
          ]
        };
      } else if (selectedTemplateId === PREDEFINED_TEMPLATE_IDS.LEAD_NURTURING) {
        // Use the "Lead Nurturing Sequence" template from seedWorkflows
        definition = {
          nodes: [
            {
              id: "trigger-1",
              type: "triggerNode",
              position: { x: 250, y: 100 },
              data: {
                label: "Form submission",
                description: "When a lead submits a form",
                icon: "PlusCircle",
                properties: {
                  formId: "form-1",
                  formName: "Lead Magnet Download"
                }
              }
            },
            {
              id: "action-1",
              type: "actionNode",
              position: { x: 250, y: 220 },
              data: {
                label: "Send Email",
                description: "Send the lead magnet email",
                icon: "Mail",
                properties: {
                  templateId: "template-3",
                  templateName: "Lead Magnet Delivery",
                  subject: "Your requested download is here!",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            },
            {
              id: "delay-1",
              type: "actionNode",
              position: { x: 250, y: 340 },
              data: {
                label: "Wait",
                description: "Wait for 3 days",
                icon: "Clock",
                properties: {
                  waitAmount: 3,
                  waitUnit: "days"
                }
              }
            },
            {
              id: "condition-1",
              type: "conditionNode",
              position: { x: 250, y: 460 },
              data: {
                label: "If/Else",
                description: "Check if lead magnet was downloaded",
                icon: "GitBranch",
                properties: {
                  conditionType: "custom",
                  customCondition: "contact.events.includes('download_completed')"
                }
              }
            },
            {
              id: "action-2",
              type: "actionNode",
              position: { x: 100, y: 580 },
              data: {
                label: "Send Email",
                description: "Send follow-up case study",
                icon: "Mail",
                properties: {
                  templateId: "template-4",
                  templateName: "Case Study",
                  subject: "See how others achieved success",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            },
            {
              id: "action-3",
              type: "actionNode",
              position: { x: 400, y: 580 },
              data: {
                label: "Send Email",
                description: "Send reminder to download",
                icon: "Mail",
                properties: {
                  templateId: "template-5",
                  templateName: "Download Reminder",
                  subject: "Don't forget your download",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            },
            {
              id: "delay-2",
              type: "actionNode",
              position: { x: 100, y: 700 },
              data: {
                label: "Wait",
                description: "Wait for 4 days",
                icon: "Clock",
                properties: {
                  waitAmount: 4,
                  waitUnit: "days"
                }
              }
            },
            {
              id: "action-4",
              type: "actionNode",
              position: { x: 100, y: 820 },
              data: {
                label: "Send Email",
                description: "Send product introduction",
                icon: "Mail",
                properties: {
                  templateId: "template-6",
                  templateName: "Product Introduction",
                  subject: "A solution you might be interested in",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            },
            {
              id: "tag-1",
              type: "actionNode",
              position: { x: 400, y: 700 },
              data: {
                label: "Add tag",
                description: "Tag as 'Needs Follow-up'",
                icon: "Tag",
                properties: {
                  tagId: "tag-1",
                  tagName: "Needs Follow-up"
                }
              }
            }
          ],
          edges: [
            {
              id: "edge-1",
              source: "trigger-1",
              target: "action-1",
              type: "custom"
            },
            {
              id: "edge-2",
              source: "action-1",
              target: "delay-1",
              type: "custom"
            },
            {
              id: "edge-3",
              source: "delay-1",
              target: "condition-1",
              type: "custom"
            },
            {
              id: "edge-4",
              source: "condition-1",
              target: "action-2",
              type: "custom",
              label: "Yes",
              sourceHandle: "true",
              targetHandle: "in"
            },
            {
              id: "edge-5",
              source: "condition-1",
              target: "action-3",
              type: "custom",
              label: "No",
              sourceHandle: "false",
              targetHandle: "in"
            },
            {
              id: "edge-6",
              source: "action-2",
              target: "delay-2",
              type: "custom",
              sourceHandle: "out",
              targetHandle: "in"
            },
            {
              id: "edge-7",
              source: "delay-2",
              target: "action-4",
              type: "custom",
              sourceHandle: "out",
              targetHandle: "in"
            },
            {
              id: "edge-8",
              source: "action-3",
              target: "tag-1",
              type: "custom",
              sourceHandle: "out",
              targetHandle: "in"
            }
          ]
        };
      } else if (selectedTemplateId === PREDEFINED_TEMPLATE_IDS.RE_ENGAGEMENT) {
        // Use the "Advanced Re-Engagement Campaign" template from seedWorkflows
        definition = {
          nodes: [
            {
              id: "trigger-1",
              type: "triggerNode",
              position: { x: 250, y: 100 },
              data: {
                label: "No activity for 30 days",
                description: "When a contact has been inactive for 30 days",
                icon: "Clock",
                properties: {
                  days: 30
                }
              }
            },
            {
              id: "condition-pre",
              type: "conditionNode",
              position: { x: 250, y: 220 },
              data: {
                label: "If/Else",
                description: "Check if customer has purchased before",
                icon: "GitBranch",
                properties: {
                  conditionType: "custom",
                  customCondition: "contact.metrics.lifetime_value > 0"
                }
              }
            },
            {
              id: "action-1",
              type: "actionNode",
              position: { x: 250, y: 340 },
              data: {
                label: "Send Email",
                description: "Send we miss you email",
                icon: "Mail",
                properties: {
                  templateId: "template-7",
                  templateName: "We Miss You",
                  subject: "We haven't seen you in a while",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            },
            {
              id: "delay-1",
              type: "actionNode",
              position: { x: 250, y: 460 },
              data: {
                label: "Wait",
                description: "Wait for 2 days",
                icon: "Clock",
                properties: {
                  waitAmount: 2,
                  waitUnit: "days"
                }
              }
            },
            {
              id: "condition-1",
              type: "conditionNode",
              position: { x: 250, y: 580 },
              data: {
                label: "If/Else",
                description: "Check if email was opened",
                icon: "GitBranch",
                properties: {
                  conditionType: "email",
                  property: "opened",
                  value: true
                }
              }
            },
            {
              id: "action-2",
              type: "actionNode",
              position: { x: 100, y: 700 },
              data: {
                label: "Send Email",
                description: "Send discount offer",
                icon: "Mail",
                properties: {
                  templateId: "template-8",
                  templateName: "Special Discount",
                  subject: "Special offer just for you: 15% off",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            },
            {
              id: "action-3",
              type: "actionNode",
              position: { x: 400, y: 700 },
              data: {
                label: "Send SMS",
                description: "Send SMS reminder",
                icon: "MessageSquare",
                properties: {
                  templateId: "sms-template-1",
                  templateName: "Re-engagement SMS"
                }
              }
            },
            {
              id: "delay-2",
              type: "actionNode",
              position: { x: 400, y: 820 },
              data: {
                label: "Wait",
                description: "Wait for 3 days",
                icon: "Clock",
                properties: {
                  waitAmount: 3,
                  waitUnit: "days"
                }
              }
            },
            {
              id: "action-4",
              type: "actionNode",
              position: { x: 400, y: 940 },
              data: {
                label: "Send Email",
                description: "Send final attempt email",
                icon: "Mail",
                properties: {
                  templateId: "template-9",
                  templateName: "Final Attempt",
                  subject: "Last chance to stay connected",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            },
            {
              id: "delay-3",
              type: "actionNode",
              position: { x: 100, y: 820 },
              data: {
                label: "Wait",
                description: "Wait for 5 days",
                icon: "Clock",
                properties: {
                  waitAmount: 5,
                  waitUnit: "days"
                }
              }
            },
            {
              id: "condition-2",
              type: "conditionNode",
              position: { x: 100, y: 940 },
              data: {
                label: "If/Else",
                description: "Check if customer made a purchase",
                icon: "GitBranch",
                properties: {
                  conditionType: "custom",
                  customCondition: "contact.events.includes('purchase')"
                }
              }
            },
            {
              id: "action-5",
              type: "actionNode",
              position: { x: 0, y: 1060 },
              data: {
                label: "Add tag",
                description: "Tag as 'Reactivated'",
                icon: "Tag",
                properties: {
                  tagId: "tag-2",
                  tagName: "Reactivated Customer"
                }
              }
            },
            {
              id: "action-6",
              type: "actionNode",
              position: { x: 200, y: 1060 },
              data: {
                label: "Send Email",
                description: "Send survey email",
                icon: "Mail",
                properties: {
                  templateId: "template-10",
                  templateName: "Feedback Survey",
                  subject: "We'd like your feedback",
                  trackOpens: true,
                  trackClicks: true
                }
              }
            }
          ],
          edges: [
            {
              id: "edge-1",
              source: "trigger-1",
              target: "condition-pre",
              type: "custom"
            },
            {
              id: "edge-2",
              source: "condition-pre",
              target: "action-1",
              type: "custom",
              label: "Yes",
              sourceHandle: "true"
            },
            {
              id: "edge-3",
              source: "action-1",
              target: "delay-1",
              type: "custom"
            },
            {
              id: "edge-4",
              source: "delay-1",
              target: "condition-1",
              type: "custom"
            },
            {
              id: "edge-5",
              source: "condition-1",
              target: "action-2",
              type: "custom",
              label: "Yes",
              sourceHandle: "true"
            },
            {
              id: "edge-6",
              source: "condition-1",
              target: "action-3",
              type: "custom",
              label: "No",
              sourceHandle: "false"
            },
            {
              id: "edge-7",
              source: "action-2",
              target: "delay-3",
              type: "custom"
            },
            {
              id: "edge-8",
              source: "action-3",
              target: "delay-2",
              type: "custom"
            },
            {
              id: "edge-9",
              source: "delay-2",
              target: "action-4",
              type: "custom"
            },
            {
              id: "edge-10",
              source: "delay-3",
              target: "condition-2",
              type: "custom"
            },
            {
              id: "edge-11",
              source: "condition-2",
              target: "action-5",
              type: "custom",
              label: "Yes",
              sourceHandle: "true"
            },
            {
              id: "edge-12",
              source: "condition-2",
              target: "action-6",
              type: "custom",
              label: "No",
              sourceHandle: "false"
            }
          ]
        };
      } else if (template && template.id !== 'blank') {
        // For other templates or backup, add a simple trigger node
        let triggerNode = {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 250, y: 100 },
          data: {
            label: template.id === 'welcome-sequence' ? 'Contact added to list' : 
                  template.id === 'abandoned-cart' ? 'Cart abandoned' :
                  'Workflow started',
            description: `Trigger for ${template.title}`,
            icon: 'List',
            properties: {}
          }
        };
        definition.nodes.push(triggerNode);
      }

      // Create the workflow
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          status: 'INACTIVE',
          definition: JSON.stringify(definition)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }

      const workflow = await response.json();
      toast.success('Workflow created successfully');
      
      // Redirect to the workflow editor
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Auto-generate workflow name if empty
    if (!workflowName) {
      if (templateId === 'blank') {
        setWorkflowName('Blank Workflow');
      } else {
        const template = templates.find(t => t.id === templateId);
        if (template) {
          setWorkflowName(template.title);
        }
      }
    }
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
        <Button 
          onClick={() => handleCreateWorkflow()} 
          disabled={!workflowName || creating}
        >
          {creating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Workflow
            </>
          )}
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
                  onClick={() => handleTemplateSelect("blank")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto mb-2">
                    <GitMerge className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium">Blank Workflow</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start from scratch
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateWorkflow("blank");
                    }}
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Use Template
                  </Button>
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
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto mb-2">
                        {template.icon}
                      </div>
                      <h3 className="font-medium">{template.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateWorkflow(template.id);
                        }}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
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
