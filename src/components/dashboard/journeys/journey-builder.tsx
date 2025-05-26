"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  Users, 
  Zap, 
  Play, 
  Save, 
  Eye,
  Plus,
  Settings,
  ArrowRight,
  ArrowDown,
  Diamond,
  Circle,
  Square
} from "lucide-react";

interface JourneyNode {
  id: string;
  type: "trigger" | "action" | "condition" | "delay";
  title: string;
  description: string;
  config: any;
  position: { x: number; y: number };
  connections: string[];
}

export function JourneyBuilder() {
  const [journeyName, setJourneyName] = useState("New Customer Journey");
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [nodes, setNodes] = useState<JourneyNode[]>([
    {
      id: "start",
      type: "trigger",
      title: "Journey Start",
      description: "Contact enters journey",
      config: { trigger: "contact_created" },
      position: { x: 100, y: 100 },
      connections: []
    }
  ]);

  const nodeTypes = [
    {
      type: "trigger",
      icon: Play,
      title: "Trigger",
      description: "Start point for the journey",
      color: "bg-green-100 border-green-300 text-green-800"
    },
    {
      type: "action",
      icon: Mail,
      title: "Send Message",
      description: "Email, SMS, or WhatsApp",
      color: "bg-blue-100 border-blue-300 text-blue-800"
    },
    {
      type: "condition",
      icon: Diamond,
      title: "Condition",
      description: "Branch based on criteria",
      color: "bg-yellow-100 border-yellow-300 text-yellow-800"
    },
    {
      type: "delay",
      icon: Clock,
      title: "Wait",
      description: "Add time delay",
      color: "bg-purple-100 border-purple-300 text-purple-800"
    }
  ];

  const addNode = useCallback((type: string) => {
    const newNode: JourneyNode = {
      id: `node_${Date.now()}`,
      type: type as any,
      title: `New ${type}`,
      description: `Configure this ${type}`,
      config: {},
      position: { x: 200 + nodes.length * 150, y: 200 },
      connections: []
    };
    setNodes([...nodes, newNode]);
  }, [nodes]);

  const updateNode = useCallback((nodeId: string, updates: Partial<JourneyNode>) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, [nodes]);

  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.type === type);
    return nodeType?.icon || Circle;
  };

  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.type === type);
    return nodeType?.color || "bg-gray-100 border-gray-300 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Journey Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">Journey Builder</CardTitle>
              <CardDescription>
                Design your customer journey with drag-and-drop simplicity
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button size="sm">
                <Play className="h-4 w-4 mr-2" />
                Activate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="journey-name">Journey Name</Label>
              <Input
                id="journey-name"
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                placeholder="Enter journey name"
              />
            </div>
            <div>
              <Label htmlFor="journey-trigger">Trigger</Label>
              <Select defaultValue="contact_created">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact_created">Contact Created</SelectItem>
                  <SelectItem value="form_submitted">Form Submitted</SelectItem>
                  <SelectItem value="email_opened">Email Opened</SelectItem>
                  <SelectItem value="link_clicked">Link Clicked</SelectItem>
                  <SelectItem value="date_based">Date/Time Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="journey-status">Status</Label>
              <Select defaultValue="draft">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Node Palette */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Journey Elements</CardTitle>
            <CardDescription>Drag elements to build your journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nodeTypes.map((nodeType) => {
                const Icon = nodeType.icon;
                return (
                  <div
                    key={nodeType.type}
                    className={`p-3 rounded-lg border-2 border-dashed cursor-pointer hover:shadow-md transition-all ${nodeType.color}`}
                    onClick={() => addNode(nodeType.type)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{nodeType.title}</span>
                    </div>
                    <p className="text-xs opacity-80">{nodeType.description}</p>
                  </div>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Quick Actions</h4>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Zap className="h-4 w-4 mr-2" />
                AI Suggest
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Journey Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Journey Flow</CardTitle>
            <CardDescription>Visual representation of your customer journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative min-h-[500px] bg-gray-50 rounded-lg p-4 overflow-auto">
              {/* Journey Nodes */}
              {nodes.map((node, index) => {
                const Icon = getNodeIcon(node.type);
                return (
                  <div key={node.id} className="relative">
                    {/* Connection Line */}
                    {index > 0 && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                        <ArrowDown className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Node */}
                    <div
                      className={`relative mb-8 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedNode?.id === node.id 
                          ? "ring-2 ring-blue-500 " + getNodeColor(node.type)
                          : getNodeColor(node.type)
                      }`}
                      onClick={() => setSelectedNode(node)}
                      style={{
                        marginLeft: `${index * 20}px`,
                        maxWidth: "250px"
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{node.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(node);
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs opacity-80">{node.description}</p>
                      
                      {/* Node Status */}
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {node.type}
                        </Badge>
                        {node.type === "condition" && (
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Node Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="border-2 border-dashed border-gray-300 bg-transparent hover:bg-gray-100"
                  onClick={() => addNode("action")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Node Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedNode ? "Configure Step" : "Select a Step"}
            </CardTitle>
            <CardDescription>
              {selectedNode ? "Customize the selected journey step" : "Click on a step to configure it"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="node-title">Step Title</Label>
                  <Input
                    id="node-title"
                    value={selectedNode.title}
                    onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="node-description">Description</Label>
                  <Textarea
                    id="node-description"
                    value={selectedNode.description}
                    onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                    rows={3}
                  />
                </div>

                {selectedNode.type === "action" && (
                  <>
                    <div>
                      <Label htmlFor="action-type">Action Type</Label>
                      <Select defaultValue="email">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Send Email</SelectItem>
                          <SelectItem value="sms">Send SMS</SelectItem>
                          <SelectItem value="whatsapp">Send WhatsApp</SelectItem>
                          <SelectItem value="notification">Send Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="template">Template</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome Email</SelectItem>
                          <SelectItem value="followup">Follow-up Email</SelectItem>
                          <SelectItem value="promotion">Promotional Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {selectedNode.type === "delay" && (
                  <div>
                    <Label htmlFor="delay-duration">Wait Duration</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="1"
                        className="flex-1"
                      />
                      <Select defaultValue="days">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedNode.type === "condition" && (
                  <>
                    <div>
                      <Label htmlFor="condition-type">Condition Type</Label>
                      <Select defaultValue="engagement">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement">Email Engagement</SelectItem>
                          <SelectItem value="behavior">User Behavior</SelectItem>
                          <SelectItem value="attribute">Contact Attribute</SelectItem>
                          <SelectItem value="time">Time-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="condition-rule">Rule</Label>
                      <Select defaultValue="opened">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="opened">Opened Email</SelectItem>
                          <SelectItem value="clicked">Clicked Link</SelectItem>
                          <SelectItem value="not_opened">Did Not Open</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm">
                    Test
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a journey step to configure its settings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 