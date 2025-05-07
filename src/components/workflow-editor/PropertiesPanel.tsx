"use client";

import { useState, useEffect } from "react";
import type { Node } from "reactflow";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data for dropdowns
const contactLists = [
  { id: "list-1", name: "Newsletter Subscribers" },
  { id: "list-2", name: "New Customers" },
  { id: "list-3", name: "Lead Magnet Downloads" },
  { id: "list-4", name: "Webinar Registrants" },
  { id: "list-5", name: "Product Announcements" },
];

const emailTemplates = [
  { id: "template-1", name: "Welcome Email" },
  { id: "template-2", name: "Weekly Newsletter" },
  { id: "template-3", name: "Product Announcement" },
  { id: "template-4", name: "Promotional Offer" },
  { id: "template-5", name: "Webinar Invitation" },
];

const tags = [
  { id: "tag-1", name: "VIP" },
  { id: "tag-2", name: "New Customer" },
  { id: "tag-3", name: "Active" },
  { id: "tag-4", name: "Abandoned Cart" },
  { id: "tag-5", name: "High Value" },
];

interface PropertiesPanelProps {
  node: Node;
  onChange: (properties: any) => void;
}

export default function PropertiesPanel({
  node,
  onChange,
}: PropertiesPanelProps) {
  const [properties, setProperties] = useState<any>(node.data.properties || {});

  // Update properties when node changes
  useEffect(() => {
    setProperties(node.data.properties || {});
  }, [node.id, node.data.properties]);

  // Handle property changes
  const handleChange = (key: string, value: any) => {
    const updatedProperties = {
      ...properties,
      [key]: value,
    };
    setProperties(updatedProperties);
    onChange(updatedProperties);
  };

  // Render properties based on node type and label
  const renderProperties = () => {
    const nodeType = node.type;
    const nodeLabel = node.data.label;

    if (nodeType === "triggerNode") {
      if (nodeLabel === "Contact added to list") {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listId">Contact List</Label>
              <Select
                value={properties.listId || ""}
                onValueChange={(value) => {
                  const selectedList = contactLists.find(
                    (list) => list.id === value
                  );
                  handleChange("listId", value);
                  handleChange("listName", selectedList?.name || "");
                }}
              >
                <SelectTrigger id="listId">
                  <SelectValue placeholder="Select a list..." />
                </SelectTrigger>
                <SelectContent>
                  {contactLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="triggerDescription">Description</Label>
              <Textarea
                id="triggerDescription"
                value={properties.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter a description..."
                rows={3}
              />
            </div>
          </div>
        );
      } else if (nodeLabel === "Tag added to contact") {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagId">Select Tag</Label>
              <Select
                value={properties.tagId || ""}
                onValueChange={(value) => {
                  const selectedTag = tags.find((tag) => tag.id === value);
                  handleChange("tagId", value);
                  handleChange("tagName", selectedTag?.name || "");
                }}
              >
                <SelectTrigger id="tagId">
                  <SelectValue placeholder="Select a tag..." />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      }
    } else if (nodeType === "actionNode") {
      if (nodeLabel === "Send Email") {
        return (
          <div className="space-y-4">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="emailTemplate">Email Template</Label>
                  <Select
                    value={properties.templateId || ""}
                    onValueChange={(value) => {
                      const selectedTemplate = emailTemplates.find(
                        (template) => template.id === value
                      );
                      handleChange("templateId", value);
                      handleChange("templateName", selectedTemplate?.name || "");
                    }}
                  >
                    <SelectTrigger id="emailTemplate">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSubject">Subject</Label>
                  <Input
                    id="emailSubject"
                    value={properties.subject || ""}
                    onChange={(e) => handleChange("subject", e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="trackOpens">Track Opens</Label>
                  <Switch
                    id="trackOpens"
                    checked={properties.trackOpens || false}
                    onCheckedChange={(checked) =>
                      handleChange("trackOpens", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="trackClicks">Track Clicks</Label>
                  <Switch
                    id="trackClicks"
                    checked={properties.trackClicks || false}
                    onCheckedChange={(checked) =>
                      handleChange("trackClicks", checked)
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      } else if (nodeLabel === "Wait") {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="waitAmount">Wait for</Label>
              <div className="flex space-x-2">
                <Input
                  id="waitAmount"
                  type="number"
                  value={properties.waitAmount || "1"}
                  onChange={(e) =>
                    handleChange("waitAmount", Number.parseInt(e.target.value))
                  }
                  min={1}
                  className="w-20"
                />
                <Select
                  value={properties.waitUnit || "days"}
                  onValueChange={(value) => handleChange("waitUnit", value)}
                >
                  <SelectTrigger>
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
          </div>
        );
      }
    } else if (nodeType === "conditionNode") {
      if (nodeLabel === "If/Else") {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Condition Type</Label>
              <RadioGroup
                value={properties.conditionType || "contact"}
                onValueChange={(value) => handleChange("conditionType", value)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contact" id="contact" />
                  <Label htmlFor="contact">Contact property</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tag" id="tag" />
                  <Label htmlFor="tag">Contact has tag</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Custom condition</Label>
                </div>
              </RadioGroup>
            </div>

            {properties.conditionType === "contact" && (
              <div className="space-y-2">
                <Label htmlFor="contactProperty">Contact Property</Label>
                <Select
                  value={properties.contactProperty || ""}
                  onValueChange={(value) =>
                    handleChange("contactProperty", value)
                  }
                >
                  <SelectTrigger id="contactProperty">
                    <SelectValue placeholder="Select property..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="firstName">First Name</SelectItem>
                    <SelectItem value="lastName">Last Name</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex space-x-2 mt-2">
                  <Select
                    value={properties.operator || ""}
                    onValueChange={(value) => handleChange("operator", value)}
                    className="w-1/3"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="startsWith">Starts with</SelectItem>
                      <SelectItem value="endsWith">Ends with</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    value={properties.value || ""}
                    onChange={(e) => handleChange("value", e.target.value)}
                    placeholder="Value"
                    className="w-2/3"
                  />
                </div>
              </div>
            )}

            {properties.conditionType === "tag" && (
              <div className="space-y-2">
                <Label htmlFor="tagId">Has Tag</Label>
                <Select
                  value={properties.tagId || ""}
                  onValueChange={(value) => handleChange("tagId", value)}
                >
                  <SelectTrigger id="tagId">
                    <SelectValue placeholder="Select tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {properties.conditionType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customCondition">Custom Condition</Label>
                <Textarea
                  id="customCondition"
                  value={properties.customCondition || ""}
                  onChange={(e) =>
                    handleChange("customCondition", e.target.value)
                  }
                  placeholder="Enter your condition logic..."
                  rows={3}
                />
              </div>
            )}
          </div>
        );
      }
    }

    // Generic properties for any node type
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nodeName">Node Name</Label>
          <Input
            id="nodeName"
            value={properties.name || node.data.label}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nodeDescription">Description</Label>
          <Textarea
            id="nodeDescription"
            value={properties.description || node.data.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Node Properties</h3>
        <span className="text-sm text-muted-foreground">
          {node.type === "triggerNode"
            ? "Trigger"
            : node.type === "actionNode"
            ? "Action"
            : "Condition"}
        </span>
      </div>
      {renderProperties()}
    </div>
  );
}
