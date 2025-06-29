"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink, Info, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConfiguration {
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookUrl: string;
  verifyToken: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  lastTested?: Date;
  phoneNumber?: string;
  displayName?: string;
}

interface WebhookValidation {
  isValid: boolean;
  url: string;
  verifyToken: string;
  error?: string;
}

export function WhatsAppBusinessSetup() {
  const [configuration, setConfiguration] = useState<WhatsAppConfiguration>({
    businessAccountId: '',
    phoneNumberId: '',
    accessToken: '',
    webhookUrl: '',
    verifyToken: '',
    isActive: false,
    verificationStatus: 'pending'
  });
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isValidatingWebhook, setIsValidatingWebhook] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [webhookValidation, setWebhookValidation] = useState<WebhookValidation | null>(null);
  const { toast } = useToast();

  // Generate webhook URL and verify token
  useEffect(() => {
    if (!configuration.webhookUrl) {
      const baseUrl = window.location.origin;
      const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;
      const verifyToken = `verify_${Math.random().toString(36).substring(2, 15)}`;
      
      setConfiguration(prev => ({
        ...prev,
        webhookUrl,
        verifyToken
      }));
    }
  }, []);

  const updateField = (field: keyof WhatsAppConfiguration, value: string) => {
    setConfiguration(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const validateWebhook = async () => {
    if (!configuration.webhookUrl || !configuration.verifyToken) {
      toast({
        title: "Webhook details required",
        description: "Webhook URL and verify token are required",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingWebhook(true);

    try {
      const response = await fetch('/api/onboarding/validate-whatsapp-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: configuration.webhookUrl,
          verifyToken: configuration.verifyToken
        })
      });

      if (!response.ok) {
        throw new Error('Webhook validation failed');
      }

      const result = await response.json();
      setWebhookValidation(result);

      if (result.isValid) {
        toast({
          title: "Webhook validated!",
          description: "Your webhook endpoint is correctly configured",
        });
      } else {
        toast({
          title: "Webhook validation failed",
          description: result.error || "Please check your webhook configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Failed to validate webhook endpoint",
        variant: "destructive",
      });
    } finally {
      setIsValidatingWebhook(false);
    }
  };

  const saveConfiguration = async () => {
    // Validate required fields
    const requiredFields = ['businessAccountId', 'phoneNumberId', 'accessToken'];
    const missingFields = requiredFields.filter(field => !configuration[field as keyof WhatsAppConfiguration]);

    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please provide: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsConfiguring(true);

    try {
      const response = await fetch('/api/onboarding/configure-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuration)
      });

      if (!response.ok) {
        throw new Error('Configuration failed');
      }

      const result = await response.json();
      setConfiguration(prev => ({
        ...prev,
        isActive: true,
        verificationStatus: result.verificationStatus || 'verified',
        phoneNumber: result.phoneNumber,
        displayName: result.displayName
      }));

      toast({
        title: "WhatsApp Business configured!",
        description: "Your WhatsApp Business API has been configured successfully",
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

  const testWhatsApp = async () => {
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
      const response = await fetch('/api/onboarding/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber
        })
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      toast({
        title: "Test message sent!",
        description: `Test WhatsApp message sent to ${testPhoneNumber}`,
      });

      setConfiguration(prev => ({
        ...prev,
        lastTested: new Date()
      }));
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Failed to send test WhatsApp message. Please check your configuration.",
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
            <span>WhatsApp Business API Configuration</span>
            {configuration.isActive && getStatusBadge(configuration.verificationStatus)}
          </CardTitle>
          <CardDescription>
            Connect your WhatsApp Business Account to send marketing messages and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need a WhatsApp Business Account and access to the WhatsApp Business API. 
              <Button variant="link" className="p-0 h-auto ml-2" asChild>
                <a href="https://developers.facebook.com/docs/whatsapp/getting-started" target="_blank" rel="noopener noreferrer">
                  Get Started Guide <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>

          {configuration.isActive && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Current Configuration</h4>
              <div className="space-y-1 text-sm">
                {configuration.phoneNumber && (
                  <div>Phone Number: <span className="font-mono">{configuration.phoneNumber}</span></div>
                )}
                {configuration.displayName && (
                  <div>Display Name: <span className="font-mono">{configuration.displayName}</span></div>
                )}
                <div className="flex items-center gap-2">
                  {getStatusIcon(configuration.verificationStatus)}
                  <span>Status: {configuration.verificationStatus}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Enter your WhatsApp Business API credentials from Meta Developers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessAccountId">
              Business Account ID <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="businessAccountId"
              placeholder="123456789012345"
              value={configuration.businessAccountId}
              onChange={(e) => updateField('businessAccountId', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Found in your Meta Business Account under WhatsApp API setup
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumberId">
              Phone Number ID <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="phoneNumberId"
              placeholder="987654321098765"
              value={configuration.phoneNumberId}
              onChange={(e) => updateField('phoneNumberId', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The ID of your verified WhatsApp Business phone number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessToken">
              Access Token <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="accessToken"
                type={showAccessToken ? 'text' : 'password'}
                placeholder="EAAxxxxxxxxxxxxxxxxx"
                value={configuration.accessToken}
                onChange={(e) => updateField('accessToken', e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowAccessToken(!showAccessToken)}
              >
                {showAccessToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate from your App Dashboard in Meta Developers
            </p>
          </div>

          <Button onClick={saveConfiguration} disabled={isConfiguring} className="w-full">
            {isConfiguring ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure webhooks to receive message events and delivery confirmations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhookUrl"
                value={configuration.webhookUrl}
                onChange={(e) => updateField('webhookUrl', e.target.value)}
                className="flex-1 font-mono text-xs"
                readOnly
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(configuration.webhookUrl, 'Webhook URL')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verifyToken">Verify Token</Label>
            <div className="flex gap-2">
              <Input
                id="verifyToken"
                value={configuration.verifyToken}
                onChange={(e) => updateField('verifyToken', e.target.value)}
                className="flex-1 font-mono text-xs"
                readOnly
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(configuration.verifyToken, 'Verify Token')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Button 
            onClick={validateWebhook} 
            disabled={isValidatingWebhook}
            variant="outline"
            className="w-full"
          >
            {isValidatingWebhook ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Validate Webhook
          </Button>

          {webhookValidation && (
            <div className={`p-3 rounded-lg ${webhookValidation.isValid ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              <div className="flex items-center gap-2">
                {webhookValidation.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">
                  {webhookValidation.isValid ? 'Webhook Valid' : 'Webhook Invalid'}
                </span>
              </div>
              {webhookValidation.error && (
                <p className="text-sm text-red-600 mt-1">{webhookValidation.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {configuration.isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Test WhatsApp Configuration</CardTitle>
            <CardDescription>
              Send a test message to verify your WhatsApp Business API is working correctly
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
                Must be registered with WhatsApp and include country code
              </p>
            </div>

            <Button 
              onClick={testWhatsApp} 
              disabled={!testPhoneNumber || isTesting}
              variant="outline"
              className="w-full"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Test Message
            </Button>

            {configuration.lastTested && (
              <p className="text-xs text-muted-foreground">
                Last tested: {configuration.lastTested.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account" className="w-full">
            <TabsList>
              <TabsTrigger value="account">1. Account Setup</TabsTrigger>
              <TabsTrigger value="app">2. Create App</TabsTrigger>
              <TabsTrigger value="webhook">3. Configure Webhook</TabsTrigger>
              <TabsTrigger value="test">4. Test & Go Live</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account" className="space-y-3">
              <h4 className="font-medium">Create WhatsApp Business Account</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Visit <a href="https://business.whatsapp.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">WhatsApp Business</a> and create an account</li>
                <li>Verify your business phone number</li>
                <li>Complete business verification process</li>
                <li>Apply for WhatsApp Business API access</li>
              </ol>
            </TabsContent>
            
            <TabsContent value="app" className="space-y-3">
              <h4 className="font-medium">Create Meta App & Get Credentials</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Developers</a></li>
                <li>Create a new app and add WhatsApp product</li>
                <li>Link your WhatsApp Business Account</li>
                <li>Get your Business Account ID and Phone Number ID</li>
                <li>Generate a long-lived access token</li>
              </ol>
            </TabsContent>
            
            <TabsContent value="webhook" className="space-y-3">
              <h4 className="font-medium">Configure Webhook in Meta Developers</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>In your Meta app, go to WhatsApp → Configuration</li>
                <li>Enter the webhook URL: <code className="bg-muted px-1 rounded text-xs">{configuration.webhookUrl}</code></li>
                <li>Enter the verify token: <code className="bg-muted px-1 rounded text-xs">{configuration.verifyToken}</code></li>
                <li>Subscribe to webhook fields: messages, message_deliveries, message_reads</li>
                <li>Verify and save webhook configuration</li>
              </ol>
            </TabsContent>
            
            <TabsContent value="test" className="space-y-3">
              <h4 className="font-medium">Test and Go Live</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Test sending messages using the test function above</li>
                <li>Review and accept WhatsApp Business Platform terms</li>
                <li>Submit your app for review (if required)</li>
                <li>Once approved, your integration is ready for production use</li>
              </ol>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}