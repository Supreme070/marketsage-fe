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
                  <SelectItem value="none">Select a list</SelectItem>
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
                  <SelectItem value="none">Select a tag</SelectItem>
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
                      <SelectItem value="none">Select a template</SelectItem>
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
                    <SelectItem value="none">Select a property</SelectItem>
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
                  >
                    <SelectTrigger className="w-1/3">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select operator</SelectItem>
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
                    <SelectItem value="none">Select a tag</SelectItem>
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
    } else if (nodeType === "apiCallNode") {
      return (
        <div className="space-y-4">
          <Tabs defaultValue="endpoint" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="endpoint">Endpoint</TabsTrigger>
              <TabsTrigger value="auth">Auth</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoint" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  value={properties.url || ""}
                  onChange={(e) => handleChange("url", e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="httpMethod">HTTP Method</Label>
                <Select
                  value={properties.method || "POST"}
                  onValueChange={(value) => handleChange("method", value)}
                >
                  <SelectTrigger id="httpMethod">
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="auth" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="authType">Authentication Type</Label>
                <Select
                  value={properties.authType || "none"}
                  onValueChange={(value) => handleChange("authType", value)}
                >
                  <SelectTrigger id="authType">
                    <SelectValue placeholder="Select auth type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {properties.authType === "bearer" && (
                <div className="space-y-2">
                  <Label htmlFor="bearerToken">Bearer Token</Label>
                  <Input
                    id="bearerToken"
                    type="password"
                    value={properties.bearerToken || ""}
                    onChange={(e) => handleChange("bearerToken", e.target.value)}
                    placeholder="Enter bearer token..."
                  />
                </div>
              )}
              {properties.authType === "api_key" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="apiKeyHeader">Header Name</Label>
                    <Input
                      id="apiKeyHeader"
                      value={properties.apiKeyHeader || "X-API-Key"}
                      onChange={(e) => handleChange("apiKeyHeader", e.target.value)}
                      placeholder="X-API-Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={properties.apiKey || ""}
                      onChange={(e) => handleChange("apiKey", e.target.value)}
                      placeholder="Enter API key..."
                    />
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="body" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bodyTemplate">Request Body Template</Label>
                <Textarea
                  id="bodyTemplate"
                  value={properties.bodyTemplate || ""}
                  onChange={(e) => handleChange("bodyTemplate", e.target.value)}
                  placeholder='{"contact": {"email": "{{contact.email}}", "name": "{{contact.firstName}} {{contact.lastName}}"}}'
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Use variables like &#123;&#123;contact.email&#125;&#125;, &#123;&#123;contact.firstName&#125;&#125;, &#123;&#123;workflow.name&#125;&#125;
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={properties.timeout || 30000}
                  onChange={(e) => handleChange("timeout", Number(e.target.value))}
                  min={1000}
                  max={60000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryCount">Retry Count</Label>
                <Input
                  id="retryCount"
                  type="number"
                  value={properties.retryCount || 3}
                  onChange={(e) => handleChange("retryCount", Number(e.target.value))}
                  min={0}
                  max={10}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );
    } else if (nodeType === "crmActionNode") {
      return (
        <div className="space-y-4">
          <Tabs defaultValue="action" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="action">Action</TabsTrigger>
              <TabsTrigger value="mapping">Mapping</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
            </TabsList>
            
            <TabsContent value="action" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="crmProvider">CRM Provider</Label>
                <Select
                  value={properties.provider || ""}
                  onValueChange={(value) => handleChange("provider", value)}
                >
                  <SelectTrigger id="crmProvider">
                    <SelectValue placeholder="Select CRM provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hubspot">HubSpot</SelectItem>
                    <SelectItem value="salesforce">Salesforce</SelectItem>
                    <SelectItem value="pipedrive">Pipedrive</SelectItem>
                    <SelectItem value="zoho">Zoho CRM</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crmAction">Action Type</Label>
                <Select
                  value={properties.actionType || ""}
                  onValueChange={(value) => handleChange("actionType", value)}
                >
                  <SelectTrigger id="crmAction">
                    <SelectValue placeholder="Select action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_contact">Create Contact</SelectItem>
                    <SelectItem value="update_contact">Update Contact</SelectItem>
                    <SelectItem value="add_to_list">Add to List</SelectItem>
                    <SelectItem value="remove_from_list">Remove from List</SelectItem>
                    <SelectItem value="add_tag">Add Tag</SelectItem>
                    <SelectItem value="remove_tag">Remove Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {properties.provider === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customApiUrl">Custom API URL</Label>
                  <Input
                    id="customApiUrl"
                    value={properties.url || ""}
                    onChange={(e) => handleChange("url", e.target.value)}
                    placeholder="https://your-crm-api.com/contacts"
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="mapping" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Field Mapping</Label>
                <p className="text-xs text-muted-foreground">Map contact fields to CRM fields</p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Label className="text-xs">CRM Field</Label>
                  <Label className="text-xs">Contact Field</Label>
                </div>
                {(properties.fieldMapping || []).map((mapping: any, index: number) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <Input
                      value={mapping.crmField || ""}
                      onChange={(e) => {
                        const newMapping = [...(properties.fieldMapping || [])];
                        newMapping[index] = { ...mapping, crmField: e.target.value };
                        handleChange("fieldMapping", newMapping);
                      }}
                      placeholder="email"
                    />
                    <Input
                      value={mapping.contactField || ""}
                      onChange={(e) => {
                        const newMapping = [...(properties.fieldMapping || [])];
                        newMapping[index] = { ...mapping, contactField: e.target.value };
                        handleChange("fieldMapping", newMapping);
                      }}
                      placeholder="contact.email"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMapping = [...(properties.fieldMapping || []), { crmField: "", contactField: "" }];
                    handleChange("fieldMapping", newMapping);
                  }}
                >
                  Add Mapping
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="connection" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="crmApiKey">API Key/Token</Label>
                <Input
                  id="crmApiKey"
                  type="password"
                  value={properties.apiKey || ""}
                  onChange={(e) => handleChange("apiKey", e.target.value)}
                  placeholder="Enter API key..."
                />
              </div>
              {properties.provider === "salesforce" && (
                <div className="space-y-2">
                  <Label htmlFor="salesforceInstance">Salesforce Instance</Label>
                  <Input
                    id="salesforceInstance"
                    value={properties.salesforceInstance || ""}
                    onChange={(e) => handleChange("salesforceInstance", e.target.value)}
                    placeholder="your-company.salesforce.com"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      );
    } else if (nodeType === "paymentWebhookNode") {
      return (
        <div className="space-y-4">
          <Tabs defaultValue="webhook" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="webhook">Webhook</TabsTrigger>
              <TabsTrigger value="payload">Payload</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="webhook" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="paymentProvider">Payment Provider</Label>
                <Select
                  value={properties.provider || ""}
                  onValueChange={(value) => handleChange("provider", value)}
                >
                  <SelectTrigger id="paymentProvider">
                    <SelectValue placeholder="Select payment provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="flutterwave">Flutterwave</SelectItem>
                    <SelectItem value="custom">Custom Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookType">Webhook Type</Label>
                <Select
                  value={properties.webhookType || ""}
                  onValueChange={(value) => handleChange("webhookType", value)}
                >
                  <SelectTrigger id="webhookType">
                    <SelectValue placeholder="Select webhook type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment_success">Payment Success</SelectItem>
                    <SelectItem value="payment_failed">Payment Failed</SelectItem>
                    <SelectItem value="subscription_created">Subscription Created</SelectItem>
                    <SelectItem value="subscription_cancelled">Subscription Cancelled</SelectItem>
                    <SelectItem value="refund_processed">Refund Processed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={properties.url || ""}
                  onChange={(e) => handleChange("url", e.target.value)}
                  placeholder="https://your-app.com/webhooks/payment"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="payload" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="eventData">Event Data (JSON)</Label>
                <Textarea
                  id="eventData"
                  value={properties.eventDataJson || ""}
                  onChange={(e) => handleChange("eventDataJson", e.target.value)}
                  placeholder='{"amount": 1000, "currency": "USD", "customer_id": "{{contact.id}}"}'
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Additional event data to include in the webhook payload
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={properties.secretKey || ""}
                  onChange={(e) => handleChange("secretKey", e.target.value)}
                  placeholder="Webhook signing secret..."
                />
                <p className="text-xs text-muted-foreground">
                  Secret key for webhook signature verification
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );
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
            : node.type === "conditionNode"
            ? "Condition"
            : node.type === "apiCallNode"
            ? "API Call"
            : node.type === "crmActionNode"
            ? "CRM Action"
            : node.type === "paymentWebhookNode"
            ? "Payment Webhook"
            : "Unknown"}
        </span>
      </div>
      {renderProperties()}
    </div>
  );
}
