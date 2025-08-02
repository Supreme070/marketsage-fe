"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Settings, Send, TestTube, Zap, Shield } from 'lucide-react';

interface SMSProvider {
  id: string;
  providerType: 'TWILIO' | 'AFRICASTALKING';
  name: string;
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  username?: string;
  fromNumber?: string;
  isActive: boolean;
  isConfigured: boolean;
  lastTested?: Date;
  testStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
}

interface SMSSettings {
  messagingModel: 'customer_managed' | 'platform_managed';
  defaultProvider: 'TWILIO' | 'AFRICASTALKING';
  enableInternationalSMS: boolean;
  enableDeliveryReports: boolean;
  rateLimitPerMinute: number;
  budgetAlert: {
    enabled: boolean;
    monthlyLimit: number;
    alertThreshold: number;
  };
}

export default function SMSSettingsPage() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<SMSProvider[]>([]);
  const [settings, setSettings] = useState<SMSSettings>({
    messagingModel: 'customer_managed',
    defaultProvider: 'TWILIO',
    enableInternationalSMS: false,
    enableDeliveryReports: true,
    rateLimitPerMinute: 60,
    budgetAlert: {
      enabled: true,
      monthlyLimit: 1000,
      alertThreshold: 80
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState({
    providerType: 'TWILIO' as const,
    name: '',
    accountSid: '',
    authToken: '',
    apiKey: '',
    username: '',
    fromNumber: '',
  });
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [activeTab, setActiveTab] = useState('providers');

  // Load SMS providers and settings
  useEffect(() => {
    loadSMSData();
  }, []);

  const loadSMSData = async () => {
    try {
      setLoading(true);
      
      // Load providers
      const providersResponse = await fetch('/api/v2/sms/providers');
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        setProviders(providersData.providers || []);
      }

      // Load settings
      const settingsResponse = await fetch('/api/v2/sms/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(prev => ({ ...prev, ...settingsData.settings }));
      }

    } catch (error) {
      toast.error('Failed to load SMS settings');
      console.error('Error loading SMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProvider = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/v2/sms/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProvider),
      });

      if (response.ok) {
        toast.success('SMS provider saved successfully');
        setShowAddProvider(false);
        setNewProvider({
          providerType: 'TWILIO',
          name: '',
          accountSid: '',
          authToken: '',
          apiKey: '',
          username: '',
          fromNumber: '',
        });
        loadSMSData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save provider');
      }
    } catch (error) {
      toast.error('Failed to save SMS provider');
      console.error('Error saving provider:', error);
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (providerId: string) => {
    try {
      setTesting(providerId);
      
      const response = await fetch(`/api/sms/providers/${providerId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testPhoneNumber: '+2348012345678' // Test number
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('SMS provider test successful');
      } else {
        toast.error(result.error || 'SMS provider test failed');
      }
      
      loadSMSData(); // Refresh to get updated test status
    } catch (error) {
      toast.error('Failed to test SMS provider');
      console.error('Error testing provider:', error);
    } finally {
      setTesting(null);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/v2/sms/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('SMS settings saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save SMS settings');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this SMS provider?')) return;

    try {
      const response = await fetch(`/api/sms/providers/${providerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('SMS provider deleted successfully');
        loadSMSData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete provider');
      }
    } catch (error) {
      toast.error('Failed to delete SMS provider');
      console.error('Error deleting provider:', error);
    }
  };

  const getProviderIcon = (providerType: string) => {
    switch (providerType) {
      case 'TWILIO':
        return <Zap className="h-4 w-4" />;
      case 'AFRICASTALKING':
        return <Shield className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (provider: SMSProvider) => {
    if (!provider.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (provider.testStatus === 'SUCCESS') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
    
    if (provider.testStatus === 'FAILED') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    
    if (!provider.isConfigured) {
      return <Badge variant="outline">Not Configured</Badge>;
    }
    
    return <Badge variant="secondary">Untested</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SMS settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Settings</h1>
          <p className="text-gray-600 mt-1">Configure SMS providers and messaging settings</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {settings.messagingModel === 'customer_managed' ? 'Customer Managed' : 'Platform Managed'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">SMS Providers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  SMS Providers
                </CardTitle>
                <Button 
                  onClick={() => setShowAddProvider(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Provider
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {providers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No SMS providers configured</p>
                  <p className="text-sm">Add your first SMS provider to start sending messages</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {providers.map((provider) => (
                    <div key={provider.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getProviderIcon(provider.providerType)}
                          <div>
                            <h3 className="font-medium">{provider.name}</h3>
                            <p className="text-sm text-gray-600">{provider.providerType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(provider)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testProvider(provider.id)}
                            disabled={testing === provider.id}
                          >
                            {testing === provider.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                Testing...
                              </>
                            ) : (
                              <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Test
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProvider(provider.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <p>From: {provider.fromNumber || 'Not configured'}</p>
                        {provider.lastTested && (
                          <p>Last tested: {new Date(provider.lastTested).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {showAddProvider && (
            <Card>
              <CardHeader>
                <CardTitle>Add SMS Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="providerType">Provider Type</Label>
                  <Select
                    value={newProvider.providerType}
                    onValueChange={(value: 'TWILIO' | 'AFRICASTALKING') => 
                      setNewProvider(prev => ({ ...prev, providerType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWILIO">Twilio</SelectItem>
                      <SelectItem value="AFRICASTALKING">Africa's Talking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Provider Name</Label>
                  <Input
                    id="name"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., My Twilio Account"
                  />
                </div>

                {newProvider.providerType === 'TWILIO' && (
                  <>
                    <div>
                      <Label htmlFor="accountSid">Account SID</Label>
                      <Input
                        id="accountSid"
                        value={newProvider.accountSid}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, accountSid: e.target.value }))}
                        placeholder="AC..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="authToken">Auth Token</Label>
                      <Input
                        id="authToken"
                        type="password"
                        value={newProvider.authToken}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, authToken: e.target.value }))}
                        placeholder="Your Twilio auth token"
                      />
                    </div>
                  </>
                )}

                {newProvider.providerType === 'AFRICASTALKING' && (
                  <>
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={newProvider.apiKey}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Your Africa's Talking API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newProvider.username}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Your Africa's Talking username"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="fromNumber">From Number</Label>
                  <Input
                    id="fromNumber"
                    value={newProvider.fromNumber}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, fromNumber: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={saveProvider}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? 'Saving...' : 'Save Provider'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAddProvider(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMS Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="messagingModel">Messaging Model</Label>
                <Select
                  value={settings.messagingModel}
                  onValueChange={(value: 'customer_managed' | 'platform_managed') => 
                    setSettings(prev => ({ ...prev, messagingModel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_managed">Customer Managed APIs</SelectItem>
                    <SelectItem value="platform_managed">Platform Managed Service</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  {settings.messagingModel === 'customer_managed' 
                    ? 'Use your own SMS provider credentials'
                    : 'Use our unified SMS service with credits'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="defaultProvider">Default Provider</Label>
                <Select
                  value={settings.defaultProvider}
                  onValueChange={(value: 'TWILIO' | 'AFRICASTALKING') => 
                    setSettings(prev => ({ ...prev, defaultProvider: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWILIO">Twilio</SelectItem>
                    <SelectItem value="AFRICASTALKING">Africa's Talking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableInternationalSMS">International SMS</Label>
                  <p className="text-sm text-gray-600">Allow sending to international numbers</p>
                </div>
                <Switch
                  id="enableInternationalSMS"
                  checked={settings.enableInternationalSMS}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableInternationalSMS: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableDeliveryReports">Delivery Reports</Label>
                  <p className="text-sm text-gray-600">Track SMS delivery status</p>
                </div>
                <Switch
                  id="enableDeliveryReports"
                  checked={settings.enableDeliveryReports}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableDeliveryReports: checked }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="rateLimitPerMinute">Rate Limit (per minute)</Label>
                <Input
                  id="rateLimitPerMinute"
                  type="number"
                  value={settings.rateLimitPerMinute}
                  onChange={(e) => setSettings(prev => ({ ...prev, rateLimitPerMinute: Number.parseInt(e.target.value) }))}
                  min="1"
                  max="1000"
                />
              </div>

              <Button 
                onClick={saveSettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage & Budget Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">This Month</h3>
                  <p className="text-2xl font-bold text-blue-600">2,456</p>
                  <p className="text-sm text-blue-600">SMS sent</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900">Success Rate</h3>
                  <p className="text-2xl font-bold text-green-600">98.2%</p>
                  <p className="text-sm text-green-600">Delivered</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900">Estimated Cost</h3>
                  <p className="text-2xl font-bold text-yellow-600">$73.68</p>
                  <p className="text-sm text-yellow-600">This month</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="budgetAlertEnabled">Budget Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified when approaching budget limits</p>
                  </div>
                  <Switch
                    id="budgetAlertEnabled"
                    checked={settings.budgetAlert.enabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        budgetAlert: { ...prev.budgetAlert, enabled: checked }
                      }))
                    }
                  />
                </div>

                {settings.budgetAlert.enabled && (
                  <>
                    <div>
                      <Label htmlFor="monthlyLimit">Monthly Budget Limit ($)</Label>
                      <Input
                        id="monthlyLimit"
                        type="number"
                        value={settings.budgetAlert.monthlyLimit}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          budgetAlert: { 
                            ...prev.budgetAlert, 
                            monthlyLimit: Number.parseInt(e.target.value) 
                          }
                        }))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                      <Input
                        id="alertThreshold"
                        type="number"
                        value={settings.budgetAlert.alertThreshold}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          budgetAlert: { 
                            ...prev.budgetAlert, 
                            alertThreshold: Number.parseInt(e.target.value) 
                          }
                        }))}
                        min="1"
                        max="100"
                      />
                    </div>
                  </>
                )}
              </div>

              <Button 
                onClick={saveSettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Budget Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}