"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink, Info, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SMSProvider {
  id: string;
  name: string;
  description: string;
  regions: string[];
  credentials: {
    [key: string]: {
      label: string;
      type: 'text' | 'password' | 'url';
      placeholder: string;
      required: boolean;
    };
  };
  senderIdRequired: boolean;
  testingSupported: boolean;
  documentationUrl: string;
}

interface SMSConfiguration {
  provider: string;
  credentials: Record<string, string>;
  senderId: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  lastTested?: Date;
}

const SMS_PROVIDERS: SMSProvider[] = [
  {
    id: 'africastalking',
    name: 'Africa\'s Talking',
    description: 'Leading SMS provider for African markets with excellent coverage in Nigeria, Kenya, Ghana',
    regions: ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Uganda', 'Tanzania'],
    credentials: {
      username: {
        label: 'Username',
        type: 'text',
        placeholder: 'your-username',
        required: true
      },
      apiKey: {
        label: 'API Key',
        type: 'password',
        placeholder: 'Your API key from Africa\'s Talking dashboard',
        required: true
      }
    },
    senderIdRequired: true,
    testingSupported: true,
    documentationUrl: 'https://developers.africastalking.com/docs/sms/overview'
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Global SMS provider with reliable delivery and comprehensive features',
    regions: ['Global', 'Nigeria', 'Kenya', 'Ghana', 'South Africa'],
    credentials: {
      accountSid: {
        label: 'Account SID',
        type: 'text',
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      },
      authToken: {
        label: 'Auth Token',
        type: 'password',
        placeholder: 'Your Twilio Auth Token',
        required: true
      },
      phoneNumber: {
        label: 'Phone Number',
        type: 'text',
        placeholder: '+1234567890',
        required: true
      }
    },
    senderIdRequired: false,
    testingSupported: true,
    documentationUrl: 'https://www.twilio.com/docs/sms'
  },
  {
    id: 'termii',
    name: 'Termii',
    description: 'Nigerian-focused SMS provider with local expertise and competitive rates',
    regions: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
    credentials: {
      apiKey: {
        label: 'API Key',
        type: 'password',
        placeholder: 'Your Termii API key',
        required: true
      },
      senderId: {
        label: 'Sender ID',
        type: 'text',
        placeholder: 'Your approved sender ID',
        required: true
      }
    },
    senderIdRequired: true,
    testingSupported: true,
    documentationUrl: 'https://developers.termii.com/'
  },
  {
    id: 'nexmo',
    name: 'Vonage (Nexmo)',
    description: 'Enterprise-grade SMS API with global coverage and advanced features',
    regions: ['Global', 'Nigeria', 'Kenya', 'Ghana', 'South Africa'],
    credentials: {
      apiKey: {
        label: 'API Key',
        type: 'text',
        placeholder: 'Your Vonage API key',
        required: true
      },
      apiSecret: {
        label: 'API Secret',
        type: 'password',
        placeholder: 'Your Vonage API secret',
        required: true
      }
    },
    senderIdRequired: true,
    testingSupported: true,
    documentationUrl: 'https://developer.vonage.com/messaging/sms/overview'
  }
];

export function SMSProviderSetup() {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [configuration, setConfiguration] = useState<SMSConfiguration>({
    provider: '',
    credentials: {},
    senderId: '',
    isActive: false,
    verificationStatus: 'pending'
  });
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const { toast } = useToast();

  const currentProvider = SMS_PROVIDERS.find(p => p.id === selectedProvider);

  const updateCredential = (key: string, value: string) => {
    setConfiguration(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value
      }
    }));
  };

  const toggleCredentialVisibility = (key: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveConfiguration = async () => {
    if (!selectedProvider || !currentProvider) {
      toast({
        title: "Provider required",
        description: "Please select an SMS provider",
        variant: "destructive",
      });
      return;
    }

    // Validate required credentials
    const missingCredentials = Object.entries(currentProvider.credentials)
      .filter(([key, config]) => config.required && !configuration.credentials[key])
      .map(([key]) => key);

    if (missingCredentials.length > 0) {
      toast({
        title: "Missing credentials",
        description: `Please provide: ${missingCredentials.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    if (currentProvider.senderIdRequired && !configuration.senderId) {
      toast({
        title: "Sender ID required",
        description: "Please provide a sender ID for this provider",
        variant: "destructive",
      });
      return;
    }

    setIsConfiguring(true);

    try {
      const response = await fetch('/api/v2/onboarding/configure-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          credentials: configuration.credentials,
          senderId: configuration.senderId
        })
      });

      if (!response.ok) {
        throw new Error('Configuration failed');
      }

      const result = await response.json();
      setConfiguration(prev => ({
        ...prev,
        provider: selectedProvider,
        isActive: true,
        verificationStatus: result.verificationStatus || 'verified'
      }));

      toast({
        title: "SMS provider configured!",
        description: "Your SMS configuration has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Configuration failed",
        description: "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const testSMS = async () => {
    if (!testPhoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number to test",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const response = await fetch('/api/v2/onboarding/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber,
          provider: selectedProvider
        })
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      toast({
        title: "Test SMS sent!",
        description: `Test message sent to ${testPhoneNumber}`,
      });

      setConfiguration(prev => ({
        ...prev,
        lastTested: new Date()
      }));
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Failed to send test SMS. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      verified: { variant: 'default' as const, label: 'Verified' },
      failed: { variant: 'destructive' as const, label: 'Failed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>SMS Provider Configuration</span>
            {configuration.isActive && getStatusBadge(configuration.verificationStatus)}
          </CardTitle>
          <CardDescription>
            Configure your SMS provider for sending marketing messages and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Select SMS Provider</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an SMS provider" />
              </SelectTrigger>
              <SelectContent>
                {SMS_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{provider.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {provider.regions.slice(0, 3).join(', ')}
                        {provider.regions.length > 3 && ` +${provider.regions.length - 3} more`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentProvider && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {currentProvider.description}
                <Button variant="link" className="p-0 h-auto ml-2" asChild>
                  <a href={currentProvider.documentationUrl} target="_blank" rel="noopener noreferrer">
                    View Documentation <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {currentProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Provider Configuration</CardTitle>
            <CardDescription>
              Enter your {currentProvider.name} credentials and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Credentials */}
            {Object.entries(currentProvider.credentials).map(([key, config]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {config.label}
                  {config.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id={key}
                    type={config.type === 'password' && !showCredentials[key] ? 'password' : 'text'}
                    placeholder={config.placeholder}
                    value={configuration.credentials[key] || ''}
                    onChange={(e) => updateCredential(key, e.target.value)}
                    className={config.type === 'password' ? 'pr-10' : ''}
                  />
                  {config.type === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => toggleCredentialVisibility(key)}
                    >
                      {showCredentials[key] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Sender ID */}
            {currentProvider.senderIdRequired && (
              <div className="space-y-2">
                <Label htmlFor="senderId">
                  Sender ID <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="senderId"
                  placeholder="YourBrand (11 characters max, alphanumeric)"
                  value={configuration.senderId}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, senderId: e.target.value }))}
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground">
                  This will appear as the sender name on SMS messages. Must be registered with your provider.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={saveConfiguration} disabled={isConfiguring} className="flex-1">
                {isConfiguring ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {configuration.isActive && currentProvider?.testingSupported && (
        <Card>
          <CardHeader>
            <CardTitle>Test SMS Configuration</CardTitle>
            <CardDescription>
              Send a test SMS to verify your configuration is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Test Phone Number</Label>
              <Input
                id="testPhone"
                type="tel"
                placeholder="+234XXXXXXXXXX"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +234 for Nigeria, +254 for Kenya)
              </p>
            </div>

            <Button 
              onClick={testSMS} 
              disabled={!testPhoneNumber || isTesting}
              variant="outline"
              className="w-full"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Test SMS
            </Button>

            {configuration.lastTested && (
              <p className="text-xs text-muted-foreground">
                Last tested: {configuration.lastTested.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Getting Started Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signup" className="w-full">
              <TabsList>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="credentials">Get Credentials</TabsTrigger>
                <TabsTrigger value="senderid">Sender ID</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signup" className="space-y-2">
                <h4 className="font-medium">1. Create Account</h4>
                <p className="text-sm text-muted-foreground">
                  Visit {currentProvider?.name} website and create an account for your country/region.
                </p>
                <Button variant="outline" asChild>
                  <a href={currentProvider?.documentationUrl} target="_blank" rel="noopener noreferrer">
                    Visit {currentProvider?.name} <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </TabsContent>
              
              <TabsContent value="credentials" className="space-y-2">
                <h4 className="font-medium">2. Get API Credentials</h4>
                <p className="text-sm text-muted-foreground">
                  Once registered, navigate to your dashboard/API section to find your credentials.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  {currentProvider && Object.values(currentProvider.credentials).map((cred, index) => (
                    <li key={index}>Look for: {cred.label}</li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="senderid" className="space-y-2">
                <h4 className="font-medium">3. Register Sender ID</h4>
                <p className="text-sm text-muted-foreground">
                  {currentProvider?.senderIdRequired 
                    ? "Register your brand name as a sender ID. This process may take 1-7 business days for approval."
                    : "Sender ID registration is not required for this provider."
                  }
                </p>
                {currentProvider?.senderIdRequired && (
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Choose a short, memorable brand name (max 11 characters)</li>
                    <li>Submit for approval through your provider's dashboard</li>
                    <li>Wait for approval before using in live campaigns</li>
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}