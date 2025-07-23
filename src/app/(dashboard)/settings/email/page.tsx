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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Settings, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Server,
  Shield,
  Info,
  Zap,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface EmailProviderConfig {
  id?: string;
  providerType: string;
  name: string;
  fromEmail: string;
  fromName?: string;
  replyToEmail?: string;
  
  // API-based provider fields
  apiKey?: string;
  apiSecret?: string;
  domain?: string;
  
  // SMTP fields
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  
  // Tracking
  trackingDomain?: string;
  enableTracking?: boolean;
  
  // Status
  isActive?: boolean;
  verificationStatus?: string;
  lastTested?: string;
  testStatus?: string;
  isConfigured?: boolean;
}

export default function EmailSettingsPage() {
  const [provider, setProvider] = useState<EmailProviderConfig | null>(null);
  const [formData, setFormData] = useState<EmailProviderConfig>({
    providerType: 'mailgun',
    name: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    enableTracking: true,
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testData, setTestData] = useState({
    testEmail: '',
    subject: 'MarketSage Email Provider Test',
    message: '',
  });
  const [activeTab, setActiveTab] = useState('setup');
  const { toast } = useToast();

  useEffect(() => {
    loadEmailProvider();
  }, []);

  const loadEmailProvider = async () => {
    try {
      const response = await fetch('/api/email/providers');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.providers && data.providers.length > 0) {
          const emailProvider = data.providers[0];
          setProvider(emailProvider);
          setFormData({
            ...emailProvider,
            apiKey: '••••••••••••••••', // Masked
            apiSecret: emailProvider.apiSecret ? '••••••••••••••••' : '',
            smtpPassword: emailProvider.smtpPassword ? '••••••••••••••••' : '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load email provider:', error);
      toast({
        title: "Failed to load configuration",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!formData.fromEmail || !formData.name) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name and from email",
        variant: "destructive",
      });
      return;
    }

    // Validate provider-specific fields
    if (formData.providerType === 'smtp') {
      if (!formData.smtpHost || !formData.smtpUsername || !formData.smtpPassword || formData.smtpPassword === '••••••••••••••••') {
        toast({
          title: "Missing SMTP configuration",
          description: "Please provide SMTP host, username, and password",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.apiKey || formData.apiKey === '••••••••••••••••') {
        toast({
          title: "Missing API configuration",
          description: "Please provide API key",
          variant: "destructive",
        });
        return;
      }
      if (formData.providerType === 'mailgun' && !formData.domain) {
        toast({
          title: "Missing domain",
          description: "Mailgun requires a domain",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const method = provider ? 'PUT' : 'POST';
      const url = provider ? `/api/email/providers/${provider.id}` : '/api/email/providers';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadEmailProvider();
        toast({
          title: "Configuration saved",
          description: "Email provider configuration updated successfully",
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
    if (!testData.testEmail) {
      toast({
        title: "Missing test email",
        description: "Please provide a test email address",
        variant: "destructive",
      });
      return;
    }

    if (!provider?.id) {
      toast({
        title: "No provider configured",
        description: "Please save your configuration first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(`/api/email/providers/${provider.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Test email sent",
          description: "Email sent successfully! Check your inbox.",
        });
        await loadEmailProvider();
      } else {
        toast({
          title: "Test failed",
          description: data.message || "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to test email:', error);
      toast({
        title: "Test failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'mailgun':
        return <Zap className="h-4 w-4" />;
      case 'sendgrid':
        return <BarChart3 className="h-4 w-4" />;
      case 'smtp':
        return <Server className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Email Provider Settings</h1>
          <p className="text-muted-foreground">
            Configure your email provider for sending campaigns and transactional emails
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Provider Configuration
                  </CardTitle>
                  <CardDescription>
                    Connect your email service provider to send campaigns and transactional emails
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {provider && (
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          {getStatusBadge(provider.verificationStatus)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={provider.isActive}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                          />
                          <Label>Active</Label>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="providerType">Provider Type</Label>
                        <Select
                          value={formData.providerType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, providerType: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mailgun">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Mailgun
                              </div>
                            </SelectItem>
                            <SelectItem value="sendgrid">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                SendGrid
                              </div>
                            </SelectItem>
                            <SelectItem value="smtp">
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                SMTP
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="name">Provider Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="My Email Provider"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                          id="fromEmail"
                          type="email"
                          value={formData.fromEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, fromEmail: e.target.value }))}
                          placeholder="noreply@yourdomain.com"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                          id="fromName"
                          value={formData.fromName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, fromName: e.target.value }))}
                          placeholder="Your Company Name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="replyToEmail">Reply-To Email</Label>
                        <Input
                          id="replyToEmail"
                          type="email"
                          value={formData.replyToEmail || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, replyToEmail: e.target.value }))}
                          placeholder="support@yourdomain.com"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Provider-specific configuration */}
                    {formData.providerType === 'smtp' ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          SMTP Configuration
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="smtpHost">SMTP Host</Label>
                            <Input
                              id="smtpHost"
                              value={formData.smtpHost || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, smtpHost: e.target.value }))}
                              placeholder="smtp.gmail.com"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="smtpPort">SMTP Port</Label>
                            <Input
                              id="smtpPort"
                              type="number"
                              value={formData.smtpPort || 587}
                              onChange={(e) => setFormData(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                              placeholder="587"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="smtpUsername">Username</Label>
                            <Input
                              id="smtpUsername"
                              value={formData.smtpUsername || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, smtpUsername: e.target.value }))}
                              placeholder="your-username"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="smtpPassword">Password</Label>
                            <div className="relative mt-1">
                              <Input
                                id="smtpPassword"
                                type={showPassword ? "text" : "password"}
                                value={formData.smtpPassword || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, smtpPassword: e.target.value }))}
                                placeholder="your-password"
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="smtpSecure"
                            checked={formData.smtpSecure !== false}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smtpSecure: checked }))}
                          />
                          <Label htmlFor="smtpSecure">Use TLS/SSL</Label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {getProviderIcon(formData.providerType)}
                          API Configuration
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="apiKey">API Key</Label>
                            <div className="relative mt-1">
                              <Input
                                id="apiKey"
                                type={showApiKey ? "text" : "password"}
                                value={formData.apiKey || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                                placeholder="Your API Key"
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {formData.providerType === 'mailgun' && (
                            <div>
                              <Label htmlFor="domain">Domain</Label>
                              <Input
                                id="domain"
                                value={formData.domain || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                                placeholder="mg.yourdomain.com"
                                className="mt-1"
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor="trackingDomain">Tracking Domain (Optional)</Label>
                            <Input
                              id="trackingDomain"
                              value={formData.trackingDomain || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, trackingDomain: e.target.value }))}
                              placeholder="track.yourdomain.com"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableTracking"
                        checked={formData.enableTracking !== false}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableTracking: checked }))}
                      />
                      <Label htmlFor="enableTracking">Enable Email Tracking</Label>
                    </div>

                    <Button 
                      onClick={handleSave}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Saving...' : provider ? 'Update Configuration' : 'Save Configuration'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test Email Provider
                </CardTitle>
                <CardDescription>
                  Send a test email to verify your email provider configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {!provider ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please configure your email provider first before testing.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="testEmail">Test Email Address</Label>
                        <Input
                          id="testEmail"
                          type="email"
                          value={testData.testEmail}
                          onChange={(e) => setTestData(prev => ({ ...prev, testEmail: e.target.value }))}
                          placeholder="test@example.com"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="testSubject">Subject</Label>
                        <Input
                          id="testSubject"
                          value={testData.subject}
                          onChange={(e) => setTestData(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Test Email Subject"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="testMessage">Message (Optional)</Label>
                        <Textarea
                          id="testMessage"
                          value={testData.message}
                          onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Custom test message..."
                          className="mt-1"
                          rows={4}
                        />
                      </div>

                      <Button 
                        onClick={handleTest}
                        disabled={isTesting || !provider}
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {isTesting ? 'Sending Test Email...' : 'Send Test Email'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Email Statistics
                </CardTitle>
                <CardDescription>
                  View your email provider performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Email statistics will be available after you start sending emails.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}