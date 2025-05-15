"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CopyIcon, Key, Trash2, Plus, Globe, Clock, ShieldCheck, Loader2, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ApiSettingsPage() {
  // States
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState([
    {
      id: "api_key_1",
      name: "Production API Key",
      key: "ms_prod_1a2b3c4d5e6f7g8h9i0j",
      created: "2025-05-01T10:30:00Z",
      lastUsed: "2025-05-06T15:23:12Z",
      status: "active",
    },
    {
      id: "api_key_2",
      name: "Testing API Key",
      key: "ms_test_9i8h7g6f5e4d3c2b1a0",
      created: "2025-04-15T08:45:00Z",
      lastUsed: "2025-05-05T12:10:05Z",
      status: "active",
    },
  ]);

  const [webhooks, setWebhooks] = useState([
    {
      id: "webhook_1",
      name: "Order Notification",
      url: "https://example.com/webhook/orders",
      events: ["order.created", "order.updated", "order.completed"],
      active: true,
      created: "2025-04-10T14:20:00Z",
    },
    {
      id: "webhook_2",
      name: "Customer Events",
      url: "https://example.com/webhook/customers",
      events: ["customer.created", "customer.updated"],
      active: true,
      created: "2025-04-22T09:15:00Z",
    },
  ]);

  // Dialog states
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [showDeleteKeyDialog, setShowDeleteKeyDialog] = useState(false);
  const [showDeleteWebhookDialog, setShowDeleteWebhookDialog] = useState(false);
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  
  // Form states
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    description: "",
    events: [] as string[]
  });
  const [copiedKey, setCopiedKey] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState("");

  // Action states
  const [regeneratingKey, setRegeneratingKey] = useState("");
  const [deletingKey, setDeletingKey] = useState("");
  const [deletingWebhook, setDeletingWebhook] = useState("");
  const [submittingWebhook, setSubmittingWebhook] = useState(false);

  // Event handlers for API keys
  const handleCreateNewKey = () => {
    setShowNewKeyDialog(true);
    setNewKeyName("");
  };

  const confirmCreateNewKey = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newKey = {
        id: `api_key_${Date.now()}`,
        name: newKeyName,
        key: `ms_prod_${Math.random().toString(36).substring(2, 15)}`,
        created: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        status: "active",
      };
      setApiKeys([newKey, ...apiKeys]);
      setShowNewKeyDialog(false);
      setLoading(false);
      setNewlyCreatedKey(newKey.key);
      toast.success("New API key created successfully");
    }, 1000);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
    toast.success("API key copied to clipboard");
  };

  const handleRegenerateKey = (id: string) => {
    setRegeneratingKey(id);
    // Simulate API call
    setTimeout(() => {
      setApiKeys(
        apiKeys.map((key) =>
          key.id === id
            ? {
                ...key,
                key: `ms_prod_${Math.random().toString(36).substring(2, 15)}`,
                created: new Date().toISOString(),
              }
            : key
        )
      );
      setRegeneratingKey("");
      toast.success("API key regenerated successfully");
    }, 1500);
  };

  const handleDeleteKey = (id: string) => {
    setTargetItemId(id);
    setShowDeleteKeyDialog(true);
  };

  const confirmDeleteKey = () => {
    if (!targetItemId) return;
    
    setDeletingKey(targetItemId);
    // Simulate API call
    setTimeout(() => {
      setApiKeys(apiKeys.filter((key) => key.id !== targetItemId));
      setShowDeleteKeyDialog(false);
      setDeletingKey("");
      setTargetItemId(null);
      toast.success("API key deleted successfully");
    }, 1000);
  };

  // Event handlers for webhooks
  const handleAddWebhook = () => {
    setSubmittingWebhook(true);
    // Simulate API call
    setTimeout(() => {
      if (newWebhook.name && newWebhook.url && newWebhook.events.length > 0) {
        const webhook = {
          id: `webhook_${Date.now()}`,
          name: newWebhook.name,
          url: newWebhook.url,
          events: newWebhook.events,
          active: true,
          created: new Date().toISOString(),
        };
        setWebhooks([webhook, ...webhooks]);
        setNewWebhook({
          name: "",
          url: "",
          description: "",
          events: [],
        });
        toast.success("Webhook added successfully");
      } else {
        toast.error("Please fill in all required fields");
      }
      setSubmittingWebhook(false);
    }, 1000);
  };

  const handleWebhookEvent = (event: string) => {
    setNewWebhook((prev) => {
      const eventExists = prev.events.includes(event);
      return {
        ...prev,
        events: eventExists
          ? prev.events.filter((e) => e !== event)
          : [...prev.events, event],
      };
    });
  };

  const handleToggleWebhook = (id: string, active: boolean) => {
    setWebhooks(
      webhooks.map((webhook) =>
        webhook.id === id ? { ...webhook, active } : webhook
      )
    );
    toast.success(`Webhook ${active ? "activated" : "deactivated"}`);
  };

  const handleDeleteWebhook = (id: string) => {
    setTargetItemId(id);
    setShowDeleteWebhookDialog(true);
  };

  const confirmDeleteWebhook = () => {
    if (!targetItemId) return;
    
    setDeletingWebhook(targetItemId);
    // Simulate API call
    setTimeout(() => {
      setWebhooks(webhooks.filter((webhook) => webhook.id !== targetItemId));
      setShowDeleteWebhookDialog(false);
      setDeletingWebhook("");
      setTargetItemId(null);
      toast.success("Webhook deleted successfully");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">API Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage API keys and webhooks for integrating with MarketSage.
        </p>
      </div>
      <Separator />
      
      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold">Your API Keys</h4>
            <Button size="sm" onClick={handleCreateNewKey}>
              <Plus className="mr-2 h-4 w-4" />
              Create New API Key
            </Button>
          </div>
          
          {newlyCreatedKey && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-800">New API Key Created</h3>
                    <p className="text-sm text-green-700 mb-2">
                      Make sure to copy your API key now. For security, it won't be shown again.
                    </p>
                    <div className="flex items-center p-2 bg-white rounded border border-green-200">
                      <code className="text-sm mr-2 flex-1 break-all">{newlyCreatedKey}</code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopyKey(newlyCreatedKey)}
                        className="shrink-0"
                      >
                        {copiedKey === newlyCreatedKey ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <CopyIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setNewlyCreatedKey("")}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for authenticated API access.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {apiKeys.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No API keys found. Create your first API key to get started.
                  </div>
                ) : (
                  apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 border-b">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                          <h4 className="font-medium">{apiKey.name}</h4>
                          <Badge variant="outline" className="ml-2">
                            {apiKey.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <code className="bg-secondary/20 px-1 py-0.5 rounded text-xs mr-2">
                            {apiKey.key.slice(0, 8)}...{apiKey.key.slice(-4)}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5"
                            onClick={() => handleCopyKey(apiKey.key)}
                          >
                            {copiedKey === apiKey.key ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <CopyIcon className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center space-x-4">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Created: {new Date(apiKey.created).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRegenerateKey(apiKey.id)}
                          disabled={regeneratingKey === apiKey.id}
                        >
                          {regeneratingKey === apiKey.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Regenerating...
                            </>
                          ) : "Regenerate"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDeleteKey(apiKey.id)}
                          disabled={deletingKey === apiKey.id}
                        >
                          {deletingKey === apiKey.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground pt-6">
              <div className="flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                API keys provide full access to your account. Keep them secure!
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold">Your Webhooks</h4>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Receive real-time updates when events happen in your MarketSage account.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="flex items-center justify-between p-4 border-b">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <h4 className="font-medium">{webhook.name}</h4>
                        <Badge variant={webhook.active ? "outline" : "secondary"} className="ml-2">
                          {webhook.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <code className="bg-secondary/20 px-1 py-0.5 rounded text-xs">
                          {webhook.url}
                        </code>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Label htmlFor={`webhook-${webhook.id}`} className="text-sm">
                          Active
                        </Label>
                        <Switch id={`webhook-${webhook.id}`} defaultChecked={webhook.active} />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Add New Webhook</CardTitle>
              <CardDescription>
                Configure a new webhook endpoint to receive event notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Webhook Name</Label>
                <Input id="webhook-name" placeholder="Enter webhook name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input id="webhook-url" placeholder="https://example.com/webhook" />
              </div>
              
              <div className="space-y-2">
                <Label>Select Events</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="event-customer-created" className="rounded" />
                    <Label htmlFor="event-customer-created" className="text-sm">customer.created</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="event-customer-updated" className="rounded" />
                    <Label htmlFor="event-customer-updated" className="text-sm">customer.updated</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="event-campaign-sent" className="rounded" />
                    <Label htmlFor="event-campaign-sent" className="text-sm">campaign.sent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="event-campaign-opened" className="rounded" />
                    <Label htmlFor="event-campaign-opened" className="text-sm">campaign.opened</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-description">Description (Optional)</Label>
                <Textarea id="webhook-description" placeholder="Enter a description for this webhook" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Webhook</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Learn how to integrate with MarketSage API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Getting Started</h4>
                <p className="text-sm text-muted-foreground">
                  Our API allows you to programmatically access and manage your MarketSage data.
                  Refer to our comprehensive documentation to get started.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.open("https://docs.marketsage.com/api", "_blank")}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  View API Documentation
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">API Base URL</h4>
                <div className="flex">
                  <code className="block bg-secondary/20 p-2 rounded text-sm break-all flex-1">
                    https://api.marketsage.com/v1
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText("https://api.marketsage.com/v1");
                      toast.success("API URL copied to clipboard");
                    }}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  All API requests require authentication using your API key. 
                  Pass your API key in the Authorization header:
                </p>
                <div className="flex">
                  <code className="block bg-secondary/20 p-2 rounded text-sm flex-1">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText("Authorization: Bearer YOUR_API_KEY");
                      toast.success("Header format copied to clipboard");
                    }}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Rate Limits</h4>
                <p className="text-sm text-muted-foreground">
                  The API is rate-limited to 100 requests per minute. If you exceed this limit,
                  requests will be throttled and return a 429 status code.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Example Request</h4>
                <p className="text-sm text-muted-foreground">
                  Here's an example of how to fetch customer data using cURL:
                </p>
                <div className="flex">
                  <code className="block bg-secondary/20 p-2 rounded text-sm flex-1 whitespace-pre overflow-x-auto">
{`curl -X GET \\
  https://api.marketsage.com/v1/customers \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2"
                    onClick={() => {
                      const curlRequest = `curl -X GET \\
  https://api.marketsage.com/v1/customers \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`;
                      navigator.clipboard.writeText(curlRequest);
                      toast.success("cURL command copied to clipboard");
                    }}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">SDKs & Libraries</h4>
                <p className="text-sm text-muted-foreground">
                  We provide client libraries for popular programming languages to make integration easier:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <Button variant="outline" className="justify-start">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="currentColor" d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076
c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0
L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392
c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021
c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921
c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603
v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993
c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233
c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081
c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833
c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402
c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253
c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z"/>
                    </svg>
                    Node.js SDK
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="currentColor" d="M16.634 16.504c.87-.075 1.543-.84 1.5-1.754-.047-.914-.796-1.648-1.709-1.648h-.061a1.71 1.71 0 00-1.648 1.769c.03.479.226.869.494 1.153-1.048 2.038-2.621 3.536-5.005 4.795-1.603.838-3.296 1.154-4.944.93-1.378-.195-2.456-.81-3.116-1.799-.988-1.499-1.078-3.116-.255-4.734.6-1.17 1.499-2.023 2.099-2.443a9.96 9.96 0 01-.42-1.543C-.868 14.408-.416 18.752.932 20.805c1.004 1.498 3.057 2.456 5.304 2.456.6 0 1.23-.044 1.843-.194 3.897-.749 6.848-3.086 8.541-6.532zm5.348-3.746c-2.32-2.728-5.738-4.226-9.634-4.226h-.51c-.253-.554-.837-.899-1.498-.899h-.045c-.943 0-1.678.81-1.647 1.753.03.898.794 1.648 1.708 1.648h.074a1.69 1.69 0 001.499-1.049h.555c2.309 0 4.495.674 6.488 1.992 1.527 1.005 2.622 2.323 3.237 3.897.538 1.288.509 2.547-.045 3.597-.855 1.647-2.294 2.517-4.196 2.517-1.199 0-2.367-.375-2.967-.644-.36.298-.96.793-1.394 1.093 1.318.598 2.652.943 3.94.943 2.922 0 5.094-1.647 5.919-3.236.898-1.798.824-4.824-1.47-7.416zM6.49 17.042c.03.899.793 1.648 1.708 1.648h.06a1.688 1.688 0 001.648-1.768c0-.9-.779-1.647-1.693-1.647h-.06c-.06 0-.15 0-.226.029-1.243-2.098-1.768-4.347-1.572-6.772.12-1.828.72-3.417 1.797-4.735.9-1.124 2.593-1.68 3.747-1.708 3.236-.061 4.585 3.971 4.689 5.574l1.498.45C17.741 3.197 14.686.62 11.764.62 9.02.62 6.49 2.613 5.47 5.535 4.077 9.43 4.991 13.177 6.7 16.174c-.15.195-.24.539-.21.868z"/>
                    </svg>
                    React SDK
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="currentColor" d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
                    </svg>
                    Python SDK
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="currentColor" d="M9.537 13.345c-.518-.273-1.25-.597-2.201-.597-2.938 0-5.164 2.253-5.164 5.287 0 3.01 2.195 4.967 5.413 4.967 1.079 0 2.126-.259 2.854-.934.685-.597.738-1.326.738-1.922v-6.801h-1.64v-.001zm0 6.035c0 .763-.436 1.688-1.922 1.688-1.697 0-2.295-1.364-2.295-2.487 0-1.604.675-3.091 2.411-3.091.484 0 .988.177 1.329.366l.477.249v3.274h-.001l.1.001zM12.694 13.481h1.686v8.215c0 1.441-.108 3.167-1.642 4.132-.74.461-1.714.697-2.734.697-1.483 0-2.474-.309-3.072-.93l1.37-.841c.362.388.979.549 1.641.549.842 0 1.438-.233 1.797-.627.391-.424.559-1.042.559-1.923v-.648h-.047c-.436.607-1.327.994-2.342.994-2.374 0-3.894-1.742-3.894-4.014 0-2.319 1.606-4.2 3.894-4.2 1.208 0 1.995.481 2.463.962h.047l.26-.366h.001zm3.338-6.215C15 1.428 10.038.75 6.512.75 3.16.75.106 2.327.106 7.173c0 2.233 1.003 4.763 3.455 5.487l3.93 1.16c1.681.497 3.544.653 3.544 2.175 0 1.331-1.808 1.639-3.419 1.639-1.979 0-4.526-.622-4.526-3.019h-3.16c0 5.934 5.68 6.139 7.711 6.139 3.651 0 6.612-1.639 6.612-5.313 0-3.771-3.474-4.659-6.213-5.313l-2.799-.809C3.384 8.826 3.32 7.615 3.32 7.225c0-1.651 2.129-1.858 3.368-1.858 3.059 0 3.686 1.274 3.686 2.198h2.974l-.001-.001"/>
                    </svg>
                    Java SDK
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New API Key Dialog */}
      <AlertDialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new API key for accessing the MarketSage API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="api-key-name" className="mb-2 block">API Key Name</Label>
            <Input 
              id="api-key-name" 
              placeholder="e.g., Production API Key" 
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Give your API key a descriptive name to remember where it's being used.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCreateNewKey} 
              disabled={loading || !newKeyName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create API Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete API Key Dialog */}
      <AlertDialog open={showDeleteKeyDialog} onOpenChange={setShowDeleteKeyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Delete API Key
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
              
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Any applications or services using this API key will no longer be able to access the MarketSage API.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteKey} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete API Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Webhook Dialog */}
      <AlertDialog open={showDeleteWebhookDialog} onOpenChange={setShowDeleteWebhookDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Delete Webhook
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
              
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Your application will no longer receive notifications for the selected events.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteWebhook} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete Webhook"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 