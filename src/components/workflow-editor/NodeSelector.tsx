"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  List,
  TrendingUp,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  Tag,
  Users,
  PlusCircle,
  Zap,
  SendHorizontal,
  BadgeCheck,
  Paperclip,
  Code,
  Calendar,
  Link,
  Search,
  X,
  Globe,
  Database,
  CreditCard,
  Settings,
  Building,
  DollarSign,
  ShoppingCart,
  Webhook,
} from "lucide-react";

interface NodeSelectorProps {
  onSelect: (
    type: string,
    label: string,
    description: string,
    icon: string
  ) => void;
}

interface NodeOption {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconName: string;
  color: string;
  category: string;
}

export default function NodeSelector({ onSelect }: NodeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const triggerNodes: NodeOption[] = [
    {
      type: "trigger",
      label: "Contact added to list",
      description: "When a contact is added to a specified list",
      icon: <List className="h-4 w-4" />,
      iconName: "List",
      color: "bg-primary/10 text-primary",
      category: "contacts",
    },
    {
      type: "trigger",
      label: "Contact updated",
      description: "When a contact's information is updated",
      icon: <TrendingUp className="h-4 w-4" />,
      iconName: "TrendingUp",
      color: "bg-primary/10 text-primary",
      category: "contacts",
    },
    {
      type: "trigger",
      label: "Tag added to contact",
      description: "When a tag is added to a contact",
      icon: <Tag className="h-4 w-4" />,
      iconName: "Tag",
      color: "bg-primary/10 text-primary",
      category: "contacts",
    },
    {
      type: "trigger",
      label: "Form submission",
      description: "When a form is submitted",
      icon: <PlusCircle className="h-4 w-4" />,
      iconName: "PlusCircle",
      color: "bg-primary/10 text-primary",
      category: "forms",
    },
    {
      type: "trigger",
      label: "Email opened",
      description: "When a contact opens an email",
      icon: <Mail className="h-4 w-4" />,
      iconName: "Mail",
      color: "bg-primary/10 text-primary",
      category: "emails",
    },
    {
      type: "trigger",
      label: "Link clicked",
      description: "When a contact clicks a link in an email",
      icon: <Link className="h-4 w-4" />,
      iconName: "Link",
      color: "bg-primary/10 text-primary",
      category: "emails",
    },
    {
      type: "trigger",
      label: "Scheduled event",
      description: "Trigger at a specific time or recurring schedule",
      icon: <Calendar className="h-4 w-4" />,
      iconName: "Calendar",
      color: "bg-primary/10 text-primary",
      category: "events",
    },
  ];

  const actionNodes: NodeOption[] = [
    {
      type: "action",
      label: "Send Email",
      description: "Send an email to the contact",
      icon: <Mail className="h-4 w-4" />,
      iconName: "Mail",
      color: "bg-blue-500/10 text-blue-500",
      category: "messages",
    },
    {
      type: "action",
      label: "Send SMS",
      description: "Send an SMS message to the contact",
      icon: <MessageSquare className="h-4 w-4" />,
      iconName: "MessageSquare",
      color: "bg-blue-500/10 text-blue-500",
      category: "messages",
    },
    {
      type: "action",
      label: "Send WhatsApp",
      description: "Send a WhatsApp message to the contact",
      icon: <SendHorizontal className="h-4 w-4" />,
      iconName: "SendHorizontal",
      color: "bg-blue-500/10 text-blue-500",
      category: "messages",
    },
    {
      type: "action",
      label: "Wait",
      description: "Wait for a specific amount of time",
      icon: <Clock className="h-4 w-4" />,
      iconName: "Clock",
      color: "bg-blue-500/10 text-blue-500",
      category: "flow",
    },
    {
      type: "action",
      label: "Update contact",
      description: "Update contact information",
      icon: <Users className="h-4 w-4" />,
      iconName: "Users",
      color: "bg-blue-500/10 text-blue-500",
      category: "contacts",
    },
    {
      type: "action",
      label: "Add tag",
      description: "Add a tag to the contact",
      icon: <Tag className="h-4 w-4" />,
      iconName: "Tag",
      color: "bg-blue-500/10 text-blue-500",
      category: "contacts",
    },
    {
      type: "action",
      label: "Remove tag",
      description: "Remove a tag from the contact",
      icon: <X className="h-4 w-4" />,
      iconName: "X",
      color: "bg-blue-500/10 text-blue-500",
      category: "contacts",
    },
    {
      type: "action",
      label: "Run webhook",
      description: "Trigger a webhook",
      icon: <Zap className="h-4 w-4" />,
      iconName: "Zap",
      color: "bg-blue-500/10 text-blue-500",
      category: "integrations",
    },
    // API Integration Nodes
    {
      type: "apiCallNode",
      label: "API Call",
      description: "Make a generic HTTP API call",
      icon: <Globe className="h-4 w-4" />,
      iconName: "Globe",
      color: "bg-purple-500/10 text-purple-500",
      category: "integrations",
    },
    {
      type: "crmActionNode",
      label: "CRM Action",
      description: "Perform CRM operations (HubSpot, Salesforce, etc.)",
      icon: <Building className="h-4 w-4" />,
      iconName: "Building",
      color: "bg-purple-500/10 text-purple-500",
      category: "integrations",
    },
    {
      type: "paymentWebhookNode",
      label: "Payment Webhook",
      description: "Send payment webhooks (Stripe, PayPal, Paystack)",
      icon: <CreditCard className="h-4 w-4" />,
      iconName: "CreditCard",
      color: "bg-purple-500/10 text-purple-500",
      category: "integrations",
    },
    {
      type: "crmActionNode",
      label: "Create Contact",
      description: "Create a new contact in your CRM",
      icon: <Users className="h-4 w-4" />,
      iconName: "Users",
      color: "bg-green-500/10 text-green-500",
      category: "crm",
    },
    {
      type: "crmActionNode",
      label: "Update Contact",
      description: "Update existing contact in your CRM",
      icon: <Settings className="h-4 w-4" />,
      iconName: "Settings",
      color: "bg-green-500/10 text-green-500",
      category: "crm",
    },
    {
      type: "crmActionNode",
      label: "Add to List",
      description: "Add contact to a CRM list or segment",
      icon: <List className="h-4 w-4" />,
      iconName: "List",
      color: "bg-green-500/10 text-green-500",
      category: "crm",
    },
    {
      type: "paymentWebhookNode",
      label: "Payment Success",
      description: "Send payment success webhook",
      icon: <DollarSign className="h-4 w-4" />,
      iconName: "DollarSign",
      color: "bg-emerald-500/10 text-emerald-500",
      category: "payments",
    },
    {
      type: "paymentWebhookNode",
      label: "Subscription Created",
      description: "Send subscription created webhook",
      icon: <ShoppingCart className="h-4 w-4" />,
      iconName: "ShoppingCart",
      color: "bg-emerald-500/10 text-emerald-500",
      category: "payments",
    },
    {
      type: "apiCallNode",
      label: "Custom Webhook",
      description: "Send custom webhook to any endpoint",
      icon: <Webhook className="h-4 w-4" />,
      iconName: "Webhook",
      color: "bg-indigo-500/10 text-indigo-500",
      category: "integrations",
    },
  ];

  const conditionNodes: NodeOption[] = [
    {
      type: "condition",
      label: "If/Else",
      description: "Branch based on a condition",
      icon: <GitBranch className="h-4 w-4" />,
      iconName: "GitBranch",
      color: "bg-orange-500/10 text-orange-500",
      category: "flow",
    },
    {
      type: "condition",
      label: "Split Path",
      description: "Split into multiple paths",
      icon: <GitBranch className="h-4 w-4" />,
      iconName: "GitBranch",
      color: "bg-orange-500/10 text-orange-500",
      category: "flow",
    },
    {
      type: "condition",
      label: "Condition",
      description: "Evaluate a condition",
      icon: <Code className="h-4 w-4" />,
      iconName: "Code",
      color: "bg-orange-500/10 text-orange-500",
      category: "flow",
    },
  ];

  // Combine all nodes and filter them based on search query
  const allNodes: NodeOption[] = [...triggerNodes, ...actionNodes, ...conditionNodes];

  const categories = [
    { id: "all", name: "All Nodes", count: allNodes.length },
    { id: "contacts", name: "Contacts", count: allNodes.filter(n => n.category === "contacts").length },
    { id: "messages", name: "Messages", count: allNodes.filter(n => n.category === "messages").length },
    { id: "flow", name: "Flow Control", count: allNodes.filter(n => n.category === "flow").length },
    { id: "emails", name: "Emails", count: allNodes.filter(n => n.category === "emails").length },
    { id: "forms", name: "Forms", count: allNodes.filter(n => n.category === "forms").length },
    { id: "events", name: "Events", count: allNodes.filter(n => n.category === "events").length },
    { id: "integrations", name: "Integrations", count: allNodes.filter(n => n.category === "integrations").length },
    { id: "crm", name: "CRM", count: allNodes.filter(n => n.category === "crm").length },
    { id: "payments", name: "Payments", count: allNodes.filter(n => n.category === "payments").length },
  ];

  // Filter nodes based on search and active tab
  const filteredNodes = allNodes.filter(node => {
    const matchesSearch = searchQuery === "" ||
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "all" || node.category === activeTab;

    return matchesSearch && matchesTab;
  });

  // Filter nodes by type
  const filteredTriggers = filteredNodes.filter(node => node.type === "trigger");
  const filteredActions = filteredNodes.filter(node => node.type === "action");
  const filteredConditions = filteredNodes.filter(node => node.type === "condition");

  return (
    <Card className="w-[450px] shadow-md">
      <CardContent className="p-0">
        {/* Search */}
        <div className="p-4 pb-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search nodes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-5">
          {/* Categories */}
          <div className="col-span-1 border-r px-2 py-3">
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeTab === category.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-xs h-8 px-2"
                  onClick={() => setActiveTab(category.id)}
                >
                  {category.name}
                  <Badge variant="outline" className="ml-auto">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Node list */}
          <div className="col-span-4">
            <Tabs defaultValue="triggers" className="w-full">
              <TabsList className="w-full rounded-none grid grid-cols-3">
                <TabsTrigger value="triggers">
                  Triggers {filteredTriggers.length > 0 && `(${filteredTriggers.length})`}
                </TabsTrigger>
                <TabsTrigger value="actions">
                  Actions {filteredActions.length > 0 && `(${filteredActions.length})`}
                </TabsTrigger>
                <TabsTrigger value="conditions">
                  Logic {filteredConditions.length > 0 && `(${filteredConditions.length})`}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[300px]">
                <div className="p-4">
                  <TabsContent value="triggers" className="space-y-2 mt-0">
                    {filteredTriggers.length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-muted-foreground">
                        No trigger nodes match your criteria
                      </div>
                    ) : (
                      filteredTriggers.map((node, index) => (
                        <NodeItem
                          key={`trigger-${index}`}
                          node={node}
                          onClick={() =>
                            onSelect(
                              node.type,
                              node.label,
                              node.description,
                              node.iconName
                            )
                          }
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-2 mt-0">
                    {filteredActions.length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-muted-foreground">
                        No action nodes match your criteria
                      </div>
                    ) : (
                      filteredActions.map((node, index) => (
                        <NodeItem
                          key={`action-${index}`}
                          node={node}
                          onClick={() =>
                            onSelect(
                              node.type,
                              node.label,
                              node.description,
                              node.iconName
                            )
                          }
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="conditions" className="space-y-2 mt-0">
                    {filteredConditions.length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-muted-foreground">
                        No logic nodes match your criteria
                      </div>
                    ) : (
                      filteredConditions.map((node, index) => (
                        <NodeItem
                          key={`condition-${index}`}
                          node={node}
                          onClick={() =>
                            onSelect(
                              node.type,
                              node.label,
                              node.description,
                              node.iconName
                            )
                          }
                        />
                      ))
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NodeItem({
  node,
  onClick,
}: {
  node: NodeOption;
  onClick: () => void;
}) {
  return (
    <div
      className="flex cursor-pointer items-center rounded-md border p-2 hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <div className={`mr-2 rounded-md ${node.color} p-2 flex-shrink-0`}>{node.icon}</div>
      <div className="flex flex-col">
        <span className="font-medium">{node.label}</span>
        <span className="text-xs text-muted-foreground">
          {node.description}
        </span>
      </div>
      <Badge
        variant="outline"
        className="ml-auto text-xs capitalize"
      >
        {node.category}
      </Badge>
    </div>
  );
}
