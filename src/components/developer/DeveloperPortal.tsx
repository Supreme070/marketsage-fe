'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Key, 
  Webhook, 
  Code, 
  Download, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Settings, 
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Book,
  Zap
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  scopes: Array<{
    resource: string;
    actions: string[];
  }>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  usage?: {
    totalRequests: number;
    errorRate: number;
  };
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  stats: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
  };
  createdAt: string;
}

interface SDKLanguage {
  id: string;
  name: string;
  description: string;
  features: string[];
  example: string;
}

export default function DeveloperPortal() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [sdkLanguages, setSdkLanguages] = useState<SDKLanguage[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // API Keys state
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['contacts:read']);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Webhooks state
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['contact.created']);

  // SDK Generation state
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [sdkPackageName, setSdkPackageName] = useState('marketsage-sdk');
  const [sdkVersion, setSdkVersion] = useState('1.0.0');
  const [generatingSDK, setGeneratingSDK] = useState(false);

  const availableScopes = [
    { id: 'contacts:read', name: 'Read Contacts', description: 'View contact information' },
    { id: 'contacts:write', name: 'Write Contacts', description: 'Create and update contacts' },
    { id: 'campaigns:read', name: 'Read Campaigns', description: 'View campaign data' },
    { id: 'campaigns:write', name: 'Write Campaigns', description: 'Create and manage campaigns' },
    { id: 'analytics:read', name: 'Read Analytics', description: 'Access analytics data' },
    { id: 'webhooks:write', name: 'Manage Webhooks', description: 'Create and manage webhooks' }
  ];

  const availableEvents = [
    'contact.created', 'contact.updated', 'contact.deleted',
    'campaign.created', 'campaign.sent', 'campaign.opened',
    'conversion.completed', 'analytics.updated'
  ];

  useEffect(() => {
    loadDeveloperData();
  }, []);

  const loadDeveloperData = async () => {
    try {
      setLoading(true);
      
      // Load API keys
      const keysResponse = await fetch('/api/v1/keys', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData.data?.apiKeys || []);
      }

      // Load webhooks
      const webhooksResponse = await fetch('/api/v1/webhooks?includeStats=true', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (webhooksResponse.ok) {
        const webhooksData = await webhooksResponse.json();
        setWebhooks(webhooksData.data?.webhooks || []);
      }

      // Load SDK languages
      const sdkResponse = await fetch('/api/v1/sdk/generate');
      if (sdkResponse.ok) {
        const sdkData = await sdkResponse.json();
        setSdkLanguages(sdkData.data?.languages || []);
      }

    } catch (error) {
      console.error('Error loading developer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async () => {
    try {
      const scopes = selectedScopes.map(scope => {
        const [resource, action] = scope.split(':');
        return { resource, actions: [action] };
      });

      const response = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newKeyName,
          scopes,
          metadata: {
            description: 'Created via Developer Portal',
            environment: 'development'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedKey(data.data.key);
        setApiKeys(prev => [...prev, data.data.apiKey]);
        setShowCreateKey(false);
        setNewKeyName('');
        setSelectedScopes(['contacts:read']);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const createWebhook = async () => {
    try {
      const response = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newWebhookName,
          url: newWebhookUrl,
          events: selectedEvents,
          metadata: {
            description: 'Created via Developer Portal',
            environment: 'development'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(prev => [...prev, data.data.webhook]);
        setShowCreateWebhook(false);
        setNewWebhookName('');
        setNewWebhookUrl('');
        setSelectedEvents(['contact.created']);
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
    }
  };

  const generateSDK = async () => {
    try {
      setGeneratingSDK(true);
      
      const response = await fetch('/api/v1/sdk/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          language: selectedLanguage,
          packageName: sdkPackageName,
          version: sdkVersion,
          includeExamples: true,
          includeAuth: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create and download ZIP file
        const downloadUrl = data.data.downloadUrl;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${sdkPackageName}-${selectedLanguage}-${sdkVersion}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error generating SDK:', error);
    } finally {
      setGeneratingSDK(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Developer Portal</h1>
          <p className="text-gray-600 mt-1">Manage API keys, webhooks, and generate SDKs</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.open('/api/v1/docs/swagger', '_blank')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Book className="h-4 w-4" />
            API Docs
          </Button>
          <Badge variant="secondary">API v1</Badge>
        </div>
      </div>

      {/* Generated API Key Modal */}
      {generatedKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              API Key Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-green-700">
                Your new API key has been generated. Copy it now as it won't be shown again.
              </p>
              <div className="flex items-center gap-2 p-3 bg-white rounded border">
                <code className="flex-1 text-sm font-mono">{generatedKey}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => setGeneratedKey(null)}
                variant="outline"
                size="sm"
              >
                I've saved the key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Keys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiKeys.length}</div>
                <p className="text-xs text-muted-foreground">
                  {apiKeys.filter(k => k.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
                <Webhook className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{webhooks.length}</div>
                <p className="text-xs text-muted-foreground">
                  {webhooks.filter(w => w.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {apiKeys.reduce((sum, key) => sum + (key.usage?.totalRequests || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => {
                    setActiveTab('api-keys');
                    setShowCreateKey(true);
                  }}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Key className="h-6 w-6" />
                  <span>Create API Key</span>
                </Button>
                <Button
                  onClick={() => {
                    setActiveTab('webhooks');
                    setShowCreateWebhook(true);
                  }}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Webhook className="h-6 w-6" />
                  <span>Add Webhook</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('sdks')}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Code className="h-6 w-6" />
                  <span>Generate SDK</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Create an API Key</h4>
                    <p className="text-sm text-gray-600">Generate your first API key to start making requests</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Read the Documentation</h4>
                    <p className="text-sm text-gray-600">
                      Explore our API endpoints and examples
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 ml-2"
                        onClick={() => window.open('/api/v1/docs/swagger', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Download an SDK</h4>
                    <p className="text-sm text-gray-600">Get started quickly with our auto-generated SDKs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <Button onClick={() => setShowCreateKey(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>

          {showCreateKey && (
            <Card>
              <CardHeader>
                <CardTitle>Create New API Key</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="My API Key"
                  />
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableScopes.map(scope => (
                      <div key={scope.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={scope.id}
                          checked={selectedScopes.includes(scope.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScopes(prev => [...prev, scope.id]);
                            } else {
                              setSelectedScopes(prev => prev.filter(s => s !== scope.id));
                            }
                          }}
                        />
                        <label htmlFor={scope.id} className="text-sm">
                          {scope.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createAPIKey} disabled={!newKeyName}>
                    Create Key
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateKey(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {apiKeys.map(key => (
              <Card key={key.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{key.name}</h3>
                        <Badge variant={key.isActive ? "default" : "secondary"}>
                          {key.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {showApiKey === key.id ? `${key.prefix}...` : `${key.prefix}...****`}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowApiKey(showApiKey === key.id ? null : key.id)}
                        >
                          {showApiKey === key.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {key.scopes.map((scope, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {scope.resource}:{scope.actions.join(',')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-gray-600">
                        {key.usage?.totalRequests || 0} requests
                      </p>
                      <p className="text-xs text-gray-500">
                        Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                      </p>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Webhooks</h2>
            <Button onClick={() => setShowCreateWebhook(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          {showCreateWebhook && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Webhook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhookName">Webhook Name</Label>
                  <Input
                    id="webhookName"
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                    placeholder="My Webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="webhookUrl">Endpoint URL</Label>
                  <Input
                    id="webhookUrl"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="https://myapp.com/webhooks/marketsage"
                  />
                </div>
                <div>
                  <Label>Events</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableEvents.map(event => (
                      <div key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event}
                          checked={selectedEvents.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvents(prev => [...prev, event]);
                            } else {
                              setSelectedEvents(prev => prev.filter(s => s !== event));
                            }
                          }}
                        />
                        <label htmlFor={event} className="text-sm">
                          {event}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createWebhook} disabled={!newWebhookName || !newWebhookUrl}>
                    Create Webhook
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateWebhook(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{webhook.name}</h3>
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{webhook.url}</p>
                      <div className="flex gap-2">
                        {webhook.events.map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-gray-600">
                        {webhook.stats.successfulDeliveries}/{webhook.stats.totalDeliveries} delivered
                      </p>
                      <p className="text-xs text-gray-500">
                        {((webhook.stats.successfulDeliveries / webhook.stats.totalDeliveries) * 100 || 0).toFixed(1)}% success rate
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Zap className="h-4 w-4" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SDKs Tab */}
        <TabsContent value="sdks" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">SDK Generator</h2>
            <p className="text-gray-600">Generate client libraries for your preferred programming language.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate SDK</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sdkLanguages.map(lang => (
                        <SelectItem key={lang.id} value={lang.id}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="packageName">Package Name</Label>
                  <Input
                    id="packageName"
                    value={sdkPackageName}
                    onChange={(e) => setSdkPackageName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={sdkVersion}
                    onChange={(e) => setSdkVersion(e.target.value)}
                    pattern="\\d+\\.\\d+\\.\\d+"
                  />
                </div>
                <Button 
                  onClick={generateSDK} 
                  disabled={generatingSDK}
                  className="w-full"
                >
                  {generatingSDK ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate & Download SDK
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {sdkLanguages.find(l => l.id === selectedLanguage) && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">
                        {sdkLanguages.find(l => l.id === selectedLanguage)?.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {sdkLanguages.find(l => l.id === selectedLanguage)?.description}
                      </p>
                      <div className="space-y-2">
                        {sdkLanguages.find(l => l.id === selectedLanguage)?.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Example Usage</h5>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        <code>{sdkLanguages.find(l => l.id === selectedLanguage)?.example}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}