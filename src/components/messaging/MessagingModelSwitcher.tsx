"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Settings, 
  CreditCard, 
  User, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  TestTube,
  DollarSign,
  Calendar,
  BarChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessagingConfiguration {
  messagingModel: 'customer_managed' | 'platform_managed';
  creditBalance: number;
  autoTopUp: boolean;
  autoTopUpAmount: number;
  autoTopUpThreshold: number;
  preferredProviders: Record<string, string>;
  region: string;
}

interface ProviderInfo {
  id: string;
  providerType?: string;
  fromNumber?: string;
  fromEmail?: string;
  fromName?: string;
  phoneNumber?: string;
  displayName?: string;
  verificationStatus?: string;
  isActive: boolean;
  createdAt: string;
}

interface MessagingData {
  configuration: MessagingConfiguration;
  providers: {
    sms: ProviderInfo[];
    email: ProviderInfo[];
    whatsapp: ProviderInfo[];
  };
  usage: {
    summary: Record<string, { messages: number; credits: number }>;
    recent: Array<{
      channel: string;
      messageCount: number;
      credits: number;
      provider: string;
      timestamp: string;
    }>;
  };
  capabilities: {
    canSwitchToCustomerManaged: boolean;
    canSwitchToPlatformManaged: boolean;
    configuredChannels: {
      sms: boolean;
      email: boolean;
      whatsapp: boolean;
    };
  };
}

export default function MessagingModelSwitcher() {
  const [data, setData] = useState<MessagingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [reason, setReason] = useState('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/messaging/model');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        throw new Error('Failed to fetch messaging configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messaging configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchMessagingModel = async (newModel: 'customer_managed' | 'platform_managed') => {
    setSwitching(true);
    try {
      const response = await fetch('/api/messaging/model', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messagingModel: newModel,
          notifyUsers,
          reason: reason.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        });
        setReason('');
        await fetchData(); // Refresh data
      } else {
        throw new Error(result.error || 'Failed to switch messaging model');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to switch messaging model',
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  const testConfiguration = async () => {
    if (!testPhone || !testEmail) {
      toast({
        title: "Error",
        description: "Please enter both test phone and email",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const channels = [];
      if (data?.capabilities.configuredChannels.sms) channels.push('sms');
      if (data?.capabilities.configuredChannels.email) channels.push('email');
      if (data?.capabilities.configuredChannels.whatsapp) channels.push('whatsapp');

      const response = await fetch('/api/messaging/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-configuration',
          testPhone,
          testEmail,
          channels,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResults(result);
        toast({
          title: "Test Complete",
          description: `${result.summary.successful}/${result.summary.total} channels tested successfully`,
        });
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Test failed',
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading messaging configuration...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load messaging configuration. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { configuration, providers, usage, capabilities } = data;
  const isCustomerManaged = configuration.messagingModel === 'customer_managed';

  return (
    <div className="space-y-6">
      {/* Current Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Messaging Configuration
          </CardTitle>
          <CardDescription>
            Manage how your organization sends messages through MarketSage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Model:</span>
                <Badge variant={isCustomerManaged ? "default" : "secondary"}>
                  {isCustomerManaged ? "Customer-Managed" : "Platform-Managed"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Credit Balance:</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-mono">{configuration.creditBalance}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-medium">Configured Providers:</span>
                <div className="flex gap-2">
                  <Badge variant={capabilities.configuredChannels.sms ? "default" : "outline"}>
                    <Phone className="h-3 w-3 mr-1" />
                    SMS ({providers.sms.length})
                  </Badge>
                  <Badge variant={capabilities.configuredChannels.email ? "default" : "outline"}>
                    <Mail className="h-3 w-3 mr-1" />
                    Email ({providers.email.length})
                  </Badge>
                  <Badge variant={capabilities.configuredChannels.whatsapp ? "default" : "outline"}>
                    <MessageSquare className="h-3 w-3 mr-1" />
                    WhatsApp ({providers.whatsapp.length})
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-medium">Recent Usage (30 days):</span>
                <div className="mt-2 space-y-1">
                  {Object.entries(usage.summary).map(([channel, stats]) => (
                    <div key={channel} className="flex justify-between text-sm">
                      <span className="capitalize">{channel}:</span>
                      <span>{stats.messages} messages ({stats.credits} credits)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Switching */}
      <Card>
        <CardHeader>
          <CardTitle>Switch Messaging Model</CardTitle>
          <CardDescription>
            Choose between customer-managed (your providers) or platform-managed (MarketSage providers)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="switch" className="w-full">
            <TabsList>
              <TabsTrigger value="switch">Switch Model</TabsTrigger>
              <TabsTrigger value="test">Test Configuration</TabsTrigger>
              <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="switch" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Customer-Managed */}
                <Card className={`border-2 ${isCustomerManaged ? 'border-primary' : 'border-muted'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer-Managed
                      {isCustomerManaged && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </CardTitle>
                    <CardDescription>Use your own provider API keys</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        ✓ Use your own SMS, Email, and WhatsApp providers<br/>
                        ✓ No credits charged per message<br/>
                        ✓ Full control over sending infrastructure<br/>
                        ✓ Direct billing with your providers
                      </p>
                      {!isCustomerManaged && (
                        <Button 
                          onClick={() => switchMessagingModel('customer_managed')}
                          disabled={!capabilities.canSwitchToCustomerManaged || switching}
                          className="w-full"
                        >
                          {switching ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                          Switch to Customer-Managed
                        </Button>
                      )}
                      {!capabilities.canSwitchToCustomerManaged && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Configure at least one provider to enable customer-managed mode.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Platform-Managed */}
                <Card className={`border-2 ${!isCustomerManaged ? 'border-primary' : 'border-muted'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Platform-Managed
                      {!isCustomerManaged && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </CardTitle>
                    <CardDescription>Use MarketSage's provider infrastructure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        ✓ No provider setup required<br/>
                        ✓ Credit-based billing system<br/>
                        ✓ Automatic provider optimization<br/>
                        ✓ Enterprise-grade reliability
                      </p>
                      {isCustomerManaged && (
                        <Button 
                          onClick={() => switchMessagingModel('platform_managed')}
                          disabled={switching}
                          className="w-full"
                          variant="outline"
                        >
                          {switching ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                          Switch to Platform-Managed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Switch Options */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="notify-users" 
                    checked={notifyUsers}
                    onCheckedChange={setNotifyUsers}
                  />
                  <Label htmlFor="notify-users">Notify organization admins</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for switch (optional):</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for switching messaging models..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="test-phone">Test Phone Number</Label>
                    <Input
                      id="test-phone"
                      placeholder="+2348012345678"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="test-email">Test Email Address</Label>
                    <Input
                      id="test-email"
                      type="email"
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={testConfiguration}
                    disabled={testing}
                    className="w-full"
                  >
                    {testing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                    Test All Configured Channels
                  </Button>
                </div>

                {testResults && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Test Results:</h4>
                    {testResults.testResults.map((result: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {result.channel === 'sms' && <Phone className="h-4 w-4" />}
                          {result.channel === 'email' && <Mail className="h-4 w-4" />}
                          {result.channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                          <span className="capitalize">{result.channel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">{result.duration}ms</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 p-2 bg-muted rounded">
                      <span className="text-sm">
                        {testResults.summary.successful}/{testResults.summary.total} channels tested successfully
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      Channel Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(usage.summary).map(([channel, stats]) => (
                      <div key={channel} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="capitalize">{channel}</span>
                          <span>{stats.messages} messages</span>
                        </div>
                        <Progress 
                          value={(stats.messages / Math.max(...Object.values(usage.summary).map(s => s.messages))) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {usage.recent.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="capitalize">{activity.channel}</span>
                          <span>{activity.messageCount} msg</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}