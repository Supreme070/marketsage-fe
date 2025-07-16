"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  CreditCard, 
  Settings, 
  MessageSquare, 
  Mail, 
  Phone, 
  Wallet, 
  BarChart3,
  AlertCircle,
  Check,
  X,
  Zap,
  Shield,
  Globe,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  Plus,
  AlertTriangle,
  PieChart,
  Activity,
  Target,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  Brain,
  Gauge,
  LineChart,
  TrendingDown
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CreditPurchaseModal } from "@/components/messaging/credit-purchase-modal";

interface MessagingConfig {
  messagingModel: 'customer_managed' | 'platform_managed';
  creditBalance: number;
  autoTopUp: boolean;
  autoTopUpAmount: number;
  autoTopUpThreshold: number;
  preferredProviders: {
    sms?: string;
    email?: string;
    whatsapp?: string;
  };
  region: string;
  budgetSettings: {
    monthlyBudget: number;
    budgetAlerts: boolean;
    budgetThreshold: number;
    budgetPeriod: 'monthly' | 'weekly' | 'daily';
  };
  costOptimization: {
    enableSmartRouting: boolean;
    optimizeForCost: boolean;
    optimizeForDelivery: boolean;
    allowFallbackProviders: boolean;
  };
}

interface UsageAnalytics {
  sms: { messages: number; credits: number; cost: number };
  email: { messages: number; credits: number; cost: number };
  whatsapp: { messages: number; credits: number; cost: number };
  totalCost: number;
  averageCostPerMessage: number;
  costTrend: number;
  projectedMonthlyCost: number;
}

interface CostAnalytics {
  dailyCosts: Array<{
    date: string;
    sms: number;
    email: number;
    whatsapp: number;
    total: number;
  }>;
  providerCosts: Array<{
    provider: string;
    cost: number;
    messages: number;
    efficiency: number;
  }>;
  budgetStatus: {
    used: number;
    remaining: number;
    percentage: number;
    projectedOverage: number;
  };
}

export default function MessagingSettingsPage() {
  const [config, setConfig] = useState<MessagingConfig>({
    messagingModel: 'customer_managed',
    creditBalance: 0,
    autoTopUp: false,
    autoTopUpAmount: 100,
    autoTopUpThreshold: 10,
    preferredProviders: {},
    region: 'us',
    budgetSettings: {
      monthlyBudget: 500,
      budgetAlerts: true,
      budgetThreshold: 80,
      budgetPeriod: 'monthly'
    },
    costOptimization: {
      enableSmartRouting: true,
      optimizeForCost: true,
      optimizeForDelivery: false,
      allowFallbackProviders: true
    }
  });

  const [usage, setUsage] = useState<UsageAnalytics>({
    sms: { messages: 0, credits: 0, cost: 0 },
    email: { messages: 0, credits: 0, cost: 0 },
    whatsapp: { messages: 0, credits: 0, cost: 0 },
    totalCost: 0,
    averageCostPerMessage: 0,
    costTrend: 0,
    projectedMonthlyCost: 0
  });

  const [costAnalytics, setCostAnalytics] = useState<CostAnalytics>({
    dailyCosts: [],
    providerCosts: [],
    budgetStatus: {
      used: 0,
      remaining: 0,
      percentage: 0,
      projectedOverage: 0
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('model');

  useEffect(() => {
    loadMessagingConfig();
    loadUsageAnalytics();
  }, []);

  const loadMessagingConfig = async () => {
    try {
      const response = await fetch('/api/messaging/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to load messaging config:', error);
    }
  };

  const loadUsageAnalytics = async () => {
    try {
      const response = await fetch('/api/messaging/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.summary);
      }
    } catch (error) {
      console.error('Failed to load usage analytics:', error);
    }
  };

  const handleModelChange = async (newModel: 'customer_managed' | 'platform_managed') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/messaging/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messagingModel: newModel })
      });

      if (response.ok) {
        setConfig(prev => ({ ...prev, messagingModel: newModel }));
      }
    } catch (error) {
      console.error('Failed to update messaging model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreditSettings = async (settings: Partial<MessagingConfig>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/messaging/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setConfig(prev => ({ ...prev, ...settings }));
      }
    } catch (error) {
      console.error('Failed to update credit settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUpCredits = async (amount: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/messaging/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod: 'paystack' })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.paymentUrl) {
          // Redirect to Paystack payment page
          window.location.href = data.paymentUrl;
        } else if (data.newBalance) {
          // Manual/test payment completed
          setConfig(prev => ({ ...prev, creditBalance: data.newBalance }));
        }
      }
    } catch (error) {
      console.error('Failed to top up credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTopUp = async (amount: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/messaging/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod: 'manual' })
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, creditBalance: data.newBalance }));
      }
    } catch (error) {
      console.error('Failed to top up credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for payment success/failure in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Refresh the config to get updated balance
      loadMessagingConfig();
      // Remove query parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const totalMessages = usage.sms.messages + usage.email.messages + usage.whatsapp.messages;
  const totalCredits = usage.sms.credits + usage.email.credits + usage.whatsapp.credits;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Messaging Settings</h1>
          <p className="text-muted-foreground">
            Configure your messaging preferences and manage your communication channels
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="model" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Model
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="model">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Choose Your Messaging Model
                  </CardTitle>
                  <CardDescription>
                    Select how you want to manage your messaging infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={config.messagingModel} 
                    onValueChange={handleModelChange}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-2 p-4 rounded-lg border">
                      <RadioGroupItem value="customer_managed" id="customer_managed" />
                      <div className="flex-1">
                        <Label htmlFor="customer_managed" className="text-base font-medium">
                          Customer-Managed APIs
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use your own API keys and manage provider relationships directly
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Full Control</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Direct Pricing</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Custom Limits</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Free</Badge>
                    </div>

                    <div className="flex items-center space-x-2 p-4 rounded-lg border">
                      <RadioGroupItem value="platform_managed" id="platform_managed" />
                      <div className="flex-1">
                        <Label htmlFor="platform_managed" className="text-base font-medium">
                          Platform-Managed Service
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use our managed infrastructure with unified billing and credits
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Unified Billing</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Auto-Scaling</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm">24/7 Support</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Pay-as-you-go</Badge>
                    </div>
                  </RadioGroup>

                  {config.messagingModel === 'platform_managed' && (
                    <Alert className="mt-6">
                      <Sparkles className="h-4 w-4" />
                      <AlertDescription>
                        You're using our managed service. Credits will be consumed based on your usage.
                        Current balance: <strong>{config.creditBalance.toFixed(2)} credits</strong>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Regional Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your primary market region for optimized delivery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="region">Primary Region</Label>
                      <Select value={config.region} onValueChange={(value) => handleCreditSettings({ region: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="africa">Africa</SelectItem>
                          <SelectItem value="nigeria">Nigeria</SelectItem>
                          <SelectItem value="kenya">Kenya</SelectItem>
                          <SelectItem value="south-africa">South Africa</SelectItem>
                          <SelectItem value="ghana">Ghana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="credits">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Credit Balance
                  </CardTitle>
                  <CardDescription>
                    Manage your messaging credits and auto-top-up settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <div className="text-3xl font-bold text-foreground mb-2">
                        {config.creditBalance.toFixed(2)}
                      </div>
                      <p className="text-muted-foreground">Available Credits</p>
                    </div>

                    <div className="flex justify-center">
                      <CreditPurchaseModal 
                        currentBalance={config.creditBalance}
                        onPurchaseComplete={(newBalance) => setConfig(prev => ({ ...prev, creditBalance: newBalance }))}
                        region={config.region}
                      >
                        <Button size="lg" className="px-8">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Credits
                        </Button>
                      </CreditPurchaseModal>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Development Only - Manual Top-up</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Button 
                            onClick={() => handleManualTopUp(50)}
                            disabled={isLoading}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Zap className="h-4 w-4" />
                            Test $50
                          </Button>
                          <Button 
                            onClick={() => handleManualTopUp(100)}
                            disabled={isLoading}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Zap className="h-4 w-4" />
                            Test $100
                          </Button>
                          <Button 
                            onClick={() => handleManualTopUp(250)}
                            disabled={isLoading}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Zap className="h-4 w-4" />
                            Test $250
                          </Button>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Auto Top-Up Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="auto-topup">Enable Auto Top-Up</Label>
                            <p className="text-sm text-muted-foreground">
                              Automatically purchase credits when balance is low
                            </p>
                          </div>
                          <Switch
                            id="auto-topup"
                            checked={config.autoTopUp}
                            onCheckedChange={(checked) => handleCreditSettings({ autoTopUp: checked })}
                          />
                        </div>

                        {config.autoTopUp && (
                          <div className="space-y-4 pl-4 border-l-2 border-muted">
                            <div>
                              <Label htmlFor="topup-threshold">Top-up Threshold</Label>
                              <Input
                                id="topup-threshold"
                                type="number"
                                value={config.autoTopUpThreshold}
                                onChange={(e) => handleCreditSettings({ autoTopUpThreshold: Number(e.target.value) })}
                                placeholder="10"
                                className="mt-1"
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Trigger auto top-up when balance falls below this amount
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="topup-amount">Top-up Amount</Label>
                              <Input
                                id="topup-amount"
                                type="number"
                                value={config.autoTopUpAmount}
                                onChange={(e) => handleCreditSettings({ autoTopUpAmount: Number(e.target.value) })}
                                placeholder="100"
                                className="mt-1"
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Amount to add when auto top-up is triggered
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing Information
                  </CardTitle>
                  <CardDescription>
                    Current pricing for platform-managed messaging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">SMS</span>
                      </div>
                      <div className="text-2xl font-bold">$0.10</div>
                      <p className="text-sm text-muted-foreground">per message</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Email</span>
                      </div>
                      <div className="text-2xl font-bold">$0.01</div>
                      <p className="text-sm text-muted-foreground">per message</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">WhatsApp</span>
                      </div>
                      <div className="text-2xl font-bold">$0.08</div>
                      <p className="text-sm text-muted-foreground">per message</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="providers">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Provider Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure your preferred providers for each channel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {config.messagingModel === 'customer_managed' ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You're using customer-managed APIs. Configure individual providers in their respective settings pages.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="sms-provider">SMS Provider</Label>
                        <Select 
                          value={config.preferredProviders.sms} 
                          onValueChange={(value) => handleCreditSettings({ 
                            preferredProviders: { ...config.preferredProviders, sms: value } 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Auto-select best provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-select (Recommended)</SelectItem>
                            <SelectItem value="twilio">Twilio</SelectItem>
                            <SelectItem value="africas-talking">Africa's Talking</SelectItem>
                            <SelectItem value="termii">Termii</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="email-provider">Email Provider</Label>
                        <Select 
                          value={config.preferredProviders.email} 
                          onValueChange={(value) => handleCreditSettings({ 
                            preferredProviders: { ...config.preferredProviders, email: value } 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Auto-select best provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-select (Recommended)</SelectItem>
                            <SelectItem value="sendgrid">SendGrid</SelectItem>
                            <SelectItem value="mailgun">Mailgun</SelectItem>
                            <SelectItem value="postmark">Postmark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="whatsapp-provider">WhatsApp Provider</Label>
                        <Select 
                          value={config.preferredProviders.whatsapp} 
                          onValueChange={(value) => handleCreditSettings({ 
                            preferredProviders: { ...config.preferredProviders, whatsapp: value } 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Auto-select best provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-select (Recommended)</SelectItem>
                            <SelectItem value="twilio-whatsapp">Twilio WhatsApp</SelectItem>
                            <SelectItem value="whatsapp-business">WhatsApp Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="budget">
            <div className="space-y-6">
              {/* Budget Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Budget Overview
                  </CardTitle>
                  <CardDescription>
                    Monitor your messaging spending and budget usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ${config.budgetSettings.monthlyBudget - costAnalytics.budgetStatus.used}
                      </div>
                      <p className="text-sm text-muted-foreground">Budget Remaining</p>
                    </div>
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        ${costAnalytics.budgetStatus.used}
                      </div>
                      <p className="text-sm text-muted-foreground">Spent This Month</p>
                    </div>
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {costAnalytics.budgetStatus.percentage.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Budget Used</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Monthly Budget Usage</span>
                      <span className="text-sm text-muted-foreground">
                        ${costAnalytics.budgetStatus.used} / ${config.budgetSettings.monthlyBudget}
                      </span>
                    </div>
                    <Progress value={costAnalytics.budgetStatus.percentage} className="h-3" />
                    
                    {costAnalytics.budgetStatus.percentage > config.budgetSettings.budgetThreshold && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You've exceeded {config.budgetSettings.budgetThreshold}% of your monthly budget. 
                          Consider reviewing your usage or increasing your budget.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Budget Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Budget Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your spending limits and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="monthly-budget">Monthly Budget ($)</Label>
                      <Input
                        id="monthly-budget"
                        type="number"
                        value={config.budgetSettings.monthlyBudget}
                        onChange={(e) => handleCreditSettings({ 
                          budgetSettings: { 
                            ...config.budgetSettings, 
                            monthlyBudget: Number(e.target.value) 
                          } 
                        })}
                        placeholder="500"
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Set your maximum monthly spending limit
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="budget-period">Budget Period</Label>
                      <Select 
                        value={config.budgetSettings.budgetPeriod} 
                        onValueChange={(value: 'monthly' | 'weekly' | 'daily') => 
                          handleCreditSettings({ 
                            budgetSettings: { 
                              ...config.budgetSettings, 
                              budgetPeriod: value 
                            } 
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="budget-alerts">Budget Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when approaching budget limits
                        </p>
                      </div>
                      <Switch
                        id="budget-alerts"
                        checked={config.budgetSettings.budgetAlerts}
                        onCheckedChange={(checked) => handleCreditSettings({ 
                          budgetSettings: { 
                            ...config.budgetSettings, 
                            budgetAlerts: checked 
                          } 
                        })}
                      />
                    </div>

                    {config.budgetSettings.budgetAlerts && (
                      <div className="pl-4 border-l-2 border-muted">
                        <Label htmlFor="budget-threshold">Alert Threshold (%)</Label>
                        <Input
                          id="budget-threshold"
                          type="number"
                          value={config.budgetSettings.budgetThreshold}
                          onChange={(e) => handleCreditSettings({ 
                            budgetSettings: { 
                              ...config.budgetSettings, 
                              budgetThreshold: Number(e.target.value) 
                            } 
                          })}
                          placeholder="80"
                          className="mt-1"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Alert when budget usage exceeds this percentage
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cost Projections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Cost Projections
                  </CardTitle>
                  <CardDescription>
                    Projected spending based on current usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Projected Monthly Cost</p>
                        <p className="text-sm text-muted-foreground">Based on current usage</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${usage.projectedMonthlyCost.toFixed(2)}</p>
                        <div className="flex items-center gap-1">
                          {usage.costTrend > 0 ? (
                            <>
                              <TrendingUp className="h-3 w-3 text-red-500" />
                              <span className="text-sm text-red-500">+{usage.costTrend.toFixed(1)}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 text-green-500" />
                              <span className="text-sm text-green-500">{usage.costTrend.toFixed(1)}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {costAnalytics.budgetStatus.projectedOverage > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Current usage trends suggest you may exceed your budget by 
                          <strong> ${costAnalytics.budgetStatus.projectedOverage.toFixed(2)}</strong> this month.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimization">
            <div className="space-y-6">
              {/* Smart Routing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Smart Cost Optimization
                  </CardTitle>
                  <CardDescription>
                    AI-powered routing and cost optimization settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="smart-routing">Enable Smart Routing</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically select the best provider based on cost and delivery rates
                        </p>
                      </div>
                      <Switch
                        id="smart-routing"
                        checked={config.costOptimization.enableSmartRouting}
                        onCheckedChange={(checked) => handleCreditSettings({ 
                          costOptimization: { 
                            ...config.costOptimization, 
                            enableSmartRouting: checked 
                          } 
                        })}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label>Optimization Priority</Label>
                      <RadioGroup 
                        value={config.costOptimization.optimizeForCost ? 'cost' : 'delivery'}
                        onValueChange={(value) => handleCreditSettings({ 
                          costOptimization: { 
                            ...config.costOptimization, 
                            optimizeForCost: value === 'cost',
                            optimizeForDelivery: value === 'delivery'
                          } 
                        })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cost" id="optimize-cost" />
                          <Label htmlFor="optimize-cost">Optimize for Cost</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delivery" id="optimize-delivery" />
                          <Label htmlFor="optimize-delivery">Optimize for Delivery Rate</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="fallback-providers">Allow Fallback Providers</Label>
                        <p className="text-sm text-muted-foreground">
                          Use alternative providers when primary provider fails
                        </p>
                      </div>
                      <Switch
                        id="fallback-providers"
                        checked={config.costOptimization.allowFallbackProviders}
                        onCheckedChange={(checked) => handleCreditSettings({ 
                          costOptimization: { 
                            ...config.costOptimization, 
                            allowFallbackProviders: checked 
                          } 
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Provider Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Provider Performance
                  </CardTitle>
                  <CardDescription>
                    Cost efficiency and delivery performance by provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {costAnalytics.providerCosts.map((provider, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                            <Activity className="h-4 w-4 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium">{provider.provider}</p>
                            <p className="text-sm text-muted-foreground">
                              {provider.messages} messages sent
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${provider.cost.toFixed(2)}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">
                              {provider.efficiency.toFixed(1)}% efficiency
                            </span>
                            <div className={`w-2 h-2 rounded-full ${
                              provider.efficiency > 85 ? 'bg-green-500' :
                              provider.efficiency > 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cost Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Cost Recommendations
                  </CardTitle>
                  <CardDescription>
                    Personalized suggestions to optimize your messaging costs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Potential Savings: $127/month
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Switch to Africa's Talking for SMS in Nigerian market - 15% cost reduction
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          Optimization Opportunity
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Enable batch sending for email campaigns - reduce costs by 23%
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800 dark:text-orange-200">
                          Budget Alert
                        </span>
                      </div>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Current spending pace may exceed budget by $89 this month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                        <p className="text-2xl font-bold">{totalMessages.toLocaleString()}</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold">${usage.totalCost.toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Cost/Message</p>
                        <p className="text-2xl font-bold">${usage.averageCostPerMessage.toFixed(3)}</p>
                      </div>
                      <PieChart className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
                        <p className="text-2xl font-bold">{totalCredits.toFixed(2)}</p>
                      </div>
                      <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cost Trend</p>
                        <div className="flex items-center gap-1">
                          <p className="text-2xl font-bold">{Math.abs(usage.costTrend).toFixed(1)}%</p>
                          {usage.costTrend > 0 ? (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <LineChart className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Usage Breakdown
                  </CardTitle>
                  <CardDescription>
                    Monthly usage statistics by channel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">SMS</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.sms.messages} messages • {usage.sms.credits.toFixed(2)} credits
                        </span>
                      </div>
                      <Progress value={totalMessages > 0 ? (usage.sms.messages / totalMessages) * 100 : 0} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Email</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.email.messages} messages • {usage.email.credits.toFixed(2)} credits
                        </span>
                      </div>
                      <Progress value={totalMessages > 0 ? (usage.email.messages / totalMessages) * 100 : 0} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">WhatsApp</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.whatsapp.messages} messages • {usage.whatsapp.credits.toFixed(2)} credits
                        </span>
                      </div>
                      <Progress value={totalMessages > 0 ? (usage.whatsapp.messages / totalMessages) * 100 : 0} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}