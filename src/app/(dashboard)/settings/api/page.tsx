import { Metadata } from "next";
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
import { CopyIcon, Key, Trash2, Plus, Globe, Clock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "API Settings | MarketSage",
  description: "Manage API keys and webhooks for MarketSage",
};

export default function ApiSettingsPage() {
  const apiKeys = [
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
  ];

  const webhooks = [
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
  ];

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
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create New API Key
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for authenticated API access.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {apiKeys.map((apiKey) => (
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
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <CopyIcon className="h-3 w-3" />
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
                      <Button variant="outline" size="sm">
                        Regenerate
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                <Button variant="outline" className="mt-2">
                  <Globe className="mr-2 h-4 w-4" />
                  View API Documentation
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">API Base URL</h4>
                <code className="block bg-secondary/20 p-2 rounded text-sm break-all">
                  https://api.marketsage.com/v1
                </code>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  All API requests require authentication using your API key. 
                  Pass your API key in the Authorization header:
                </p>
                <code className="block bg-secondary/20 p-2 rounded text-sm">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Rate Limits</h4>
                <p className="text-sm text-muted-foreground">
                  The API is rate-limited to 100 requests per minute. If you exceed this limit,
                  requests will be throttled and return a 429 status code.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 