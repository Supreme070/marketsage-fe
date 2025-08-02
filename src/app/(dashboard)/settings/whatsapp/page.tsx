"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, 
  Settings, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Webhook,
  Phone,
  Building,
  Shield,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface WhatsAppConfig {
  isConfigured: boolean;
  config?: {
    id: string;
    businessAccountId: string;
    phoneNumberId: string;
    phoneNumber?: string;
    displayName?: string;
    isActive: boolean;
    verificationStatus: 'pending' | 'verified' | 'failed';
    webhookUrl: string;
    verifyToken: string;
    createdAt: string;
    updatedAt: string;
  };
  webhookUrl?: string;
  verifyToken?: string;
}

export default function WhatsAppSettingsPage() {
  const [config, setConfig] = useState<WhatsAppConfig>({ isConfigured: false });
  const [formData, setFormData] = useState({
    businessAccountId: '',
    phoneNumberId: '',
    accessToken: '',
    phoneNumber: '',
    displayName: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [testData, setTestData] = useState({
    phoneNumber: '',
    message: 'Hello! This is a test message from MarketSage WhatsApp Business API integration. If you receive this message, the integration is working correctly! 🚀',
  });
  const [activeTab, setActiveTab] = useState('setup');
  const { toast } = useToast();

  useEffect(() => {
    loadWhatsAppConfig();
  }, []);

  const loadWhatsAppConfig = async () => {
    try {
      const response = await fetch('/api/v2/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        
        if (data.isConfigured && data.config) {
          setFormData({
            businessAccountId: data.config.businessAccountId,
            phoneNumberId: data.config.phoneNumberId,
            accessToken: '••••••••••••••••', // Masked token
            phoneNumber: data.config.phoneNumber || '',
            displayName: data.config.displayName || '',
            isActive: data.config.isActive,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load WhatsApp config:', error);
      toast({
        title: "Failed to load configuration",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!formData.businessAccountId || !formData.phoneNumberId || !formData.accessToken) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const method = config.isConfigured ? 'PUT' : 'POST';
      const response = await fetch('/api/v2/whatsapp/config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        await loadWhatsAppConfig();
        toast({
          title: "Configuration saved",
          description: "WhatsApp Business API configuration updated successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to save configuration",
          description: error.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: "Failed to save configuration",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testData.phoneNumber || !testData.message) {
      toast({
        title: "Missing test data",
        description: "Please provide phone number and message",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/v2/whatsapp/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          phoneNumber: testData.phoneNumber,
          message: testData.message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "Test message sent",
            description: "WhatsApp test message sent successfully",
          });
          await loadWhatsAppConfig();
        } else {
          toast({
            title: "Test failed",
            description: data.error || "Failed to send test message",
            variant: "destructive",
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: "Test failed",
          description: error.error || "Failed to send test message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to test WhatsApp:', error);
      toast({
        title: "Test failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const webhookUrl = config.config?.webhookUrl || config.webhookUrl || '';
  const verifyToken = config.config?.verifyToken || config.verifyToken || '';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">WhatsApp Business Settings</h1>
          <p className="text-muted-foreground">
            Configure your WhatsApp Business API integration for customer communications
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhook
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    WhatsApp Business API Configuration
                  </CardTitle>
                  <CardDescription>
                    Connect your WhatsApp Business account to enable messaging campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {config.isConfigured && (
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          {getStatusBadge(config.config?.verificationStatus || 'pending')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={config.config?.isActive}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                          />
                          <Label>Active</Label>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessAccountId">Business Account ID</Label>
                        <Input
                          id="businessAccountId"
                          value={formData.businessAccountId}
                          onChange={(e) => setFormData(prev => ({ ...prev, businessAccountId: e.target.value }))}
                          placeholder="Enter your WhatsApp Business Account ID"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                        <Input
                          id="phoneNumberId"
                          value={formData.phoneNumberId}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                          placeholder="Enter your WhatsApp Phone Number ID"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="e.g., +234XXXXXXXXX"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          placeholder="Your business name"
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="accessToken">Access Token</Label>
                        <div className="relative mt-1">
                          <Input
                            id="accessToken"
                            type={showAccessToken ? "text" : "password"}
                            value={formData.accessToken}
                            onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                            placeholder="Enter your WhatsApp Business API Access Token"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2"
                            onClick={() => setShowAccessToken(!showAccessToken)}
                          >
                            {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSave}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Saving...' : config.isConfigured ? 'Update Configuration' : 'Save Configuration'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Getting Started
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                      <div>
                        <p className="font-medium">Create WhatsApp Business Account</p>
                        <p className="text-sm text-muted-foreground">Visit Meta Business and create your WhatsApp Business account</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <p className="font-medium">Get API Access</p>
                        <p className="text-sm text-muted-foreground">Generate access token and get your Business Account ID and Phone Number ID</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <p className="font-medium">Configure Webhook</p>
                        <p className="text-sm text-muted-foreground">Set up webhook URL in your WhatsApp Business settings</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webhook">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Configuration
                </CardTitle>
                <CardDescription>
                  Configure webhook settings in your WhatsApp Business account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Configure these webhook settings in your WhatsApp Business account to receive message events and delivery confirmations.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="webhookUrl"
                          value={webhookUrl}
                          readOnly
                          className="bg-muted"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="verifyToken">Verify Token</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="verifyToken"
                          value={verifyToken}
                          readOnly
                          className="bg-muted"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(verifyToken, 'Verify Token')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Webhook Events</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">messages</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">message_deliveries</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">message_reads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">message_reactions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open('https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    WhatsApp Webhook Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test WhatsApp Integration
                </CardTitle>
                <CardDescription>
                  Send a test message to verify your WhatsApp Business API configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {!config.isConfigured ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please configure your WhatsApp Business API settings first before testing.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="testPhoneNumber">Test Phone Number</Label>
                        <Input
                          id="testPhoneNumber"
                          value={testData.phoneNumber}
                          onChange={(e) => setTestData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="Enter phone number (e.g., +234XXXXXXXXX)"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="testMessage">Test Message</Label>
                        <Textarea
                          id="testMessage"
                          value={testData.message}
                          onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter test message"
                          className="mt-1"
                          rows={4}
                        />
                      </div>

                      <Button 
                        onClick={handleTest}
                        disabled={isTesting || !config.isConfigured}
                        className="w-full"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {isTesting ? 'Sending Test Message...' : 'Send Test Message'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}