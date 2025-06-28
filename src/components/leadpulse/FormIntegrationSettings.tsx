'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Link,
  Globe,
  Webhook,
  Mail,
  Slack,
  Database,
  Shield,
  Key,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Code,
  Zap,
  Building,
  Phone,
  MessageSquare,
  Upload,
  Download,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';

interface IntegrationEndpoint {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'email' | 'crm' | 'marketing' | 'analytics';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  payload: Record<string, any>;
  authentication: {
    type: 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth';
    credentials: Record<string, string>;
  };
  enabled: boolean;
  triggers: string[];
  lastTriggered?: string;
  status: 'active' | 'inactive' | 'error';
  errorCount: number;
}

interface FormIntegration {
  id: string;
  formId: string;
  formName: string;
  integrations: IntegrationEndpoint[];
  settings: {
    enableRealTimeSync: boolean;
    enableBatchSync: boolean;
    batchInterval: number; // minutes
    retryAttempts: number;
    retryDelay: number; // seconds
    enableErrorNotifications: boolean;
    enableSuccessNotifications: boolean;
  };
}

interface ThirdPartyService {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'crm' | 'email' | 'marketing' | 'analytics' | 'communication';
  authMethod: 'api_key' | 'oauth' | 'webhook';
  setupUrl?: string;
  documentationUrl: string;
  isPopular: boolean;
  isConfigured: boolean;
}

const POPULAR_SERVICES: ThirdPartyService[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync leads directly to Salesforce CRM',
    icon: '☁️',
    category: 'crm',
    authMethod: 'oauth',
    documentationUrl: 'https://developer.salesforce.com/docs',
    isPopular: true,
    isConfigured: false
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Connect with HubSpot for lead management',
    icon: '🧡',
    category: 'crm',
    authMethod: 'api_key',
    documentationUrl: 'https://developers.hubspot.com',
    isPopular: true,
    isConfigured: false
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Add leads to Mailchimp email lists',
    icon: '🐵',
    category: 'email',
    authMethod: 'api_key',
    documentationUrl: 'https://mailchimp.com/developer',
    isPopular: true,
    isConfigured: false
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send form submissions to Slack channels',
    icon: '💬',
    category: 'communication',
    authMethod: 'webhook',
    documentationUrl: 'https://api.slack.com/messaging/webhooks',
    isPopular: true,
    isConfigured: false
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5000+ apps via Zapier',
    icon: '⚡',
    category: 'marketing',
    authMethod: 'webhook',
    documentationUrl: 'https://zapier.com/developer',
    isPopular: true,
    isConfigured: false
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Save submissions to Google Sheets',
    icon: '📊',
    category: 'analytics',
    authMethod: 'oauth',
    documentationUrl: 'https://developers.google.com/sheets/api',
    isPopular: true,
    isConfigured: false
  }
];

export default function FormIntegrationSettings() {
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [integrations, setIntegrations] = useState<FormIntegration[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ThirdPartyService | null>(null);
  const [newIntegration, setNewIntegration] = useState<Partial<IntegrationEndpoint>>({
    name: '',
    type: 'webhook',
    url: '',
    method: 'POST',
    headers: {},
    payload: {},
    authentication: { type: 'none', credentials: {} },
    enabled: true,
    triggers: []
  });
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Mock data for demonstration
  useEffect(() => {
    const mockIntegrations: FormIntegration[] = [
      {
        id: 'form_integration_1',
        formId: 'contact_form',
        formName: 'Contact Form',
        integrations: [
          {
            id: 'webhook_1',
            name: 'CRM Webhook',
            type: 'webhook',
            url: 'https://crm.example.com/api/leads',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            payload: { source: 'marketsage_form' },
            authentication: { type: 'api_key', credentials: { api_key: 'sk_live_xxx' } },
            enabled: true,
            triggers: ['form_submission'],
            lastTriggered: '2024-01-15T10:30:00Z',
            status: 'active',
            errorCount: 0
          },
          {
            id: 'slack_1',
            name: 'Slack Notifications',
            type: 'webhook',
            url: 'https://hooks.slack.com/services/xxx',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            payload: {},
            authentication: { type: 'none', credentials: {} },
            enabled: true,
            triggers: ['form_submission', 'lead_qualified'],
            lastTriggered: '2024-01-15T11:45:00Z',
            status: 'active',
            errorCount: 0
          }
        ],
        settings: {
          enableRealTimeSync: true,
          enableBatchSync: false,
          batchInterval: 60,
          retryAttempts: 3,
          retryDelay: 30,
          enableErrorNotifications: true,
          enableSuccessNotifications: false
        }
      }
    ];
    setIntegrations(mockIntegrations);
    if (mockIntegrations.length > 0) {
      setSelectedForm(mockIntegrations[0].formId);
    }
  }, []);

  const currentIntegration = integrations.find(int => int.formId === selectedForm);

  const handleCreateIntegration = () => {
    if (!newIntegration.name || !newIntegration.url) return;

    const integration: IntegrationEndpoint = {
      id: `integration_${Date.now()}`,
      name: newIntegration.name!,
      type: newIntegration.type || 'webhook',
      url: newIntegration.url!,
      method: newIntegration.method || 'POST',
      headers: newIntegration.headers || {},
      payload: newIntegration.payload || {},
      authentication: newIntegration.authentication || { type: 'none', credentials: {} },
      enabled: true,
      triggers: newIntegration.triggers || ['form_submission'],
      status: 'inactive',
      errorCount: 0
    };

    setIntegrations(prev => 
      prev.map(int => 
        int.formId === selectedForm 
          ? { ...int, integrations: [...int.integrations, integration] }
          : int
      )
    );

    setNewIntegration({
      name: '',
      type: 'webhook',
      url: '',
      method: 'POST',
      headers: {},
      payload: {},
      authentication: { type: 'none', credentials: {} },
      enabled: true,
      triggers: []
    });
    setShowCreateDialog(false);
  };

  const handleTestEndpoint = async (integrationId: string) => {
    setTestingEndpoint(integrationId);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTestingEndpoint(null);
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusIcon = (status: 'active' | 'inactive' | 'error') => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Integrations</h1>
          <p className="text-gray-600">Connect your forms to external services and APIs</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowServiceDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Browse Services
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Create Integration
          </Button>
        </div>
      </div>

      {/* Form Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Select Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedForm} onValueChange={setSelectedForm}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a form to configure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contact_form">Contact Form</SelectItem>
              <SelectItem value="newsletter_form">Newsletter Signup</SelectItem>
              <SelectItem value="demo_request">Demo Request Form</SelectItem>
              <SelectItem value="pricing_inquiry">Pricing Inquiry</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {currentIntegration && (
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="integrations">Active Integrations</TabsTrigger>
            <TabsTrigger value="settings">Sync Settings</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            {currentIntegration.integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(integration.status)}
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {integration.type.toUpperCase()} • {integration.method} • 
                          {integration.lastTriggered && ` Last: ${new Date(integration.lastTriggered).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.enabled ? "default" : "secondary"}>
                        {integration.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestEndpoint(integration.id)}
                        disabled={testingEndpoint === integration.id}
                      >
                        {testingEndpoint === integration.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Endpoint URL</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                          {integration.url}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(integration.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Triggers</Label>
                      <div className="flex gap-1 mt-1">
                        {integration.triggers.map((trigger) => (
                          <Badge key={trigger} variant="outline" className="text-xs">
                            {trigger.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {integration.authentication.type !== 'none' && (
                    <div>
                      <Label className="text-sm font-medium">Authentication</Label>
                      <div className="mt-1 space-y-2">
                        <Badge variant="outline">{integration.authentication.type.toUpperCase()}</Badge>
                        {Object.entries(integration.authentication.credentials).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Label className="text-xs w-20">{key}:</Label>
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                type={showSecrets[`${integration.id}_${key}`] ? "text" : "password"}
                                value={value}
                                readOnly
                                className="text-sm font-mono"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleSecret(`${integration.id}_${key}`)}
                              >
                                {showSecrets[`${integration.id}_${key}`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Error Count: {integration.errorCount}</span>
                      <span>•</span>
                      <span>Success Rate: 98.5%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this integration? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {currentIntegration.integrations.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations configured</h3>
                  <p className="text-gray-500 mb-4">
                    Connect your form to external services to automatically process submissions.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Integration
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
                <p className="text-sm text-gray-500">
                  Configure how and when form data is synced to external services.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Real-time Sync</Label>
                    <p className="text-xs text-gray-500">Send data immediately on form submission</p>
                  </div>
                  <Switch 
                    checked={currentIntegration.settings.enableRealTimeSync}
                    onCheckedChange={(checked) => {
                      setIntegrations(prev =>
                        prev.map(int =>
                          int.formId === selectedForm
                            ? { ...int, settings: { ...int.settings, enableRealTimeSync: checked } }
                            : int
                        )
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Batch Sync</Label>
                    <p className="text-xs text-gray-500">Process submissions in batches</p>
                  </div>
                  <Switch 
                    checked={currentIntegration.settings.enableBatchSync}
                    onCheckedChange={(checked) => {
                      setIntegrations(prev =>
                        prev.map(int =>
                          int.formId === selectedForm
                            ? { ...int, settings: { ...int.settings, enableBatchSync: checked } }
                            : int
                        )
                      );
                    }}
                  />
                </div>

                {currentIntegration.settings.enableBatchSync && (
                  <div>
                    <Label className="text-sm font-medium">Batch Interval (minutes)</Label>
                    <Input
                      type="number"
                      value={currentIntegration.settings.batchInterval}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 60;
                        setIntegrations(prev =>
                          prev.map(int =>
                            int.formId === selectedForm
                              ? { ...int, settings: { ...int.settings, batchInterval: value } }
                              : int
                          )
                        );
                      }}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Retry Attempts</Label>
                  <Input
                    type="number"
                    value={currentIntegration.settings.retryAttempts}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 3;
                      setIntegrations(prev =>
                        prev.map(int =>
                          int.formId === selectedForm
                            ? { ...int, settings: { ...int.settings, retryAttempts: value } }
                            : int
                        )
                      );
                    }}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of retry attempts for failed requests</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Retry Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={currentIntegration.settings.retryDelay}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 30;
                      setIntegrations(prev =>
                        prev.map(int =>
                          int.formId === selectedForm
                            ? { ...int, settings: { ...int.settings, retryDelay: value } }
                            : int
                        )
                      );
                    }}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Notifications</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Error Notifications</Label>
                      <Switch 
                        checked={currentIntegration.settings.enableErrorNotifications}
                        onCheckedChange={(checked) => {
                          setIntegrations(prev =>
                            prev.map(int =>
                              int.formId === selectedForm
                                ? { ...int, settings: { ...int.settings, enableErrorNotifications: checked } }
                                : int
                            )
                          );
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Success Notifications</Label>
                      <Switch 
                        checked={currentIntegration.settings.enableSuccessNotifications}
                        onCheckedChange={(checked) => {
                          setIntegrations(prev =>
                            prev.map(int =>
                              int.formId === selectedForm
                                ? { ...int, settings: { ...int.settings, enableSuccessNotifications: checked } }
                                : int
                            )
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Logs
                </CardTitle>
                <p className="text-sm text-gray-500">Recent integration activity and events</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {[
                      { time: '2024-01-15 11:45:23', event: 'Form submission sent to CRM', status: 'success', integration: 'CRM Webhook' },
                      { time: '2024-01-15 11:45:24', event: 'Slack notification sent', status: 'success', integration: 'Slack Notifications' },
                      { time: '2024-01-15 10:30:15', event: 'Form submission sent to CRM', status: 'success', integration: 'CRM Webhook' },
                      { time: '2024-01-15 09:22:10', event: 'Batch sync completed (5 submissions)', status: 'success', integration: 'Email Marketing' },
                      { time: '2024-01-15 08:15:30', event: 'Integration test - CRM endpoint', status: 'success', integration: 'CRM Webhook' },
                      { time: '2024-01-14 16:45:22', event: 'Form submission failed - timeout', status: 'error', integration: 'Analytics Service' }
                    ].map((log, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          {log.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{log.event}</p>
                          <p className="text-xs text-gray-500">{log.integration} • {log.time}</p>
                        </div>
                        <Badge 
                          variant={log.status === 'success' ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Integration Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Integration</DialogTitle>
            <DialogDescription>
              Connect your form to an external service or API endpoint.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Integration Name</Label>
                <Input
                  value={newIntegration.name || ''}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My CRM Integration"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newIntegration.type}
                  onValueChange={(value) => setNewIntegration(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="api">REST API</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label>Method</Label>
                <Select
                  value={newIntegration.method}
                  onValueChange={(value) => setNewIntegration(prev => ({ ...prev, method: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label>Endpoint URL</Label>
                <Input
                  value={newIntegration.url || ''}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.example.com/webhooks/leads"
                />
              </div>
            </div>

            <div>
              <Label>Authentication Type</Label>
              <Select
                value={newIntegration.authentication?.type}
                onValueChange={(value) => setNewIntegration(prev => ({ 
                  ...prev, 
                  authentication: { type: value as any, credentials: {} }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newIntegration.authentication?.type === 'api_key' && (
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  onChange={(e) => setNewIntegration(prev => ({
                    ...prev,
                    authentication: {
                      ...prev.authentication!,
                      credentials: { api_key: e.target.value }
                    }
                  }))}
                />
              </div>
            )}

            {newIntegration.authentication?.type === 'bearer' && (
              <div>
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  placeholder="Enter your bearer token"
                  onChange={(e) => setNewIntegration(prev => ({
                    ...prev,
                    authentication: {
                      ...prev.authentication!,
                      credentials: { token: e.target.value }
                    }
                  }))}
                />
              </div>
            )}

            <div>
              <Label>Custom Headers (JSON)</Label>
              <Textarea
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value || '{}');
                    setNewIntegration(prev => ({ ...prev, headers }));
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateIntegration}>
              Create Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popular Services Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Popular Integration Services</DialogTitle>
            <DialogDescription>
              Quick setup for popular third-party services and tools.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {POPULAR_SERVICES.map((service) => (
              <Card key={service.id} className="cursor-pointer hover:bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{service.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{service.name}</h4>
                        {service.isPopular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                        {service.isConfigured && (
                          <Badge variant="default" className="text-xs">Configured</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                        <span>•</span>
                        <span>{service.authMethod.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      Setup
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Globe className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}