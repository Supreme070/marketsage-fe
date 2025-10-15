"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PaymentHistory } from "./PaymentHistory";
import {
  CreditCard,
  Loader2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  MessageSquare,
  PhoneCall,
  Users,
  Zap,
  Info,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Plus,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "monthly" | "annually";
  features: string;
  isActive: boolean;
}

interface Subscription {
  id: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | "TRIALING";
  startDate: string;
  endDate: string;
  canceledAt?: string;
  plan: Plan;
  organization: {
    id: string;
    name: string;
    email: string;
    billingEmail?: string;
    billingName?: string;
    billingAddress?: string;
  };
}

interface UsageData {
  organizationId: string;
  period: {
    start: string;
    end: string;
  };
  usage: {
    email_sent?: number;
    sms_sent?: number;
    whatsapp_sent?: number;
    api_call?: number;
    contact_created?: number;
    workflow_executed?: number;
  };
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
}

export function SubscriptionDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Billing form states
  const [billingEmail, setBillingEmail] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSubscription(),
        fetchPlans(),
        fetchUsage(),
        fetchPaymentMethods(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubscription(data.data.subscription);
          setBillingEmail(data.data.subscription.organization.billingEmail || "");
          setBillingName(data.data.subscription.organization.billingName || "");
          setBillingAddress(data.data.subscription.organization.billingAddress || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/billing/plans");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlans(data.data.plans);
        }
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/billing/usage");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsage(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payments/methods");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentMethods(data.data.paymentMethods);
        }
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/subscriptions/${subscription?.id}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error("Failed to upgrade subscription");
      }

      const data = await response.json();
      toast.success("Subscription upgraded successfully");
      setShowUpgradeDialog(false);
      await fetchData();

      if (data.data.proratedAmount > 0) {
        toast.info(
          `Prorated charge: ₦${data.data.proratedAmount.toLocaleString()} for ${data.data.daysRemaining} days`
        );
      }
    } catch (error) {
      console.error("Failed to upgrade:", error);
      toast.error("Failed to upgrade subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDowngrade = async (planId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/subscriptions/${subscription?.id}/downgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error("Failed to downgrade subscription");
      }

      toast.success("Subscription will be downgraded at the end of the current period");
      setShowUpgradeDialog(false);
      await fetchData();
    } catch (error) {
      console.error("Failed to downgrade:", error);
      toast.error("Failed to downgrade subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/subscriptions/${subscription?.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReason,
          immediate: cancelImmediate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      const data = await response.json();
      toast.success(data.message);
      setShowCancelDialog(false);
      await fetchData();
    } catch (error) {
      console.error("Failed to cancel:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/subscriptions/${subscription?.id}/reactivate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reactivate subscription");
      }

      toast.success("Subscription reactivated successfully");
      await fetchData();
    } catch (error) {
      console.error("Failed to reactivate:", error);
      toast.error("Failed to reactivate subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBilling = async () => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/billing/information", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingEmail,
          billingName,
          billingAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update billing information");
      }

      toast.success("Billing information updated successfully");
      setShowBillingDialog(false);
      await fetchSubscription();
    } catch (error) {
      console.error("Failed to update billing:", error);
      toast.error("Failed to update billing information");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { variant: "default" | "destructive" | "secondary"; icon: any }
    > = {
      ACTIVE: { variant: "default", icon: CheckCircle },
      TRIALING: { variant: "secondary", icon: Info },
      PAST_DUE: { variant: "destructive", icon: AlertCircle },
      CANCELED: { variant: "destructive", icon: XCircle },
      EXPIRED: { variant: "destructive", icon: XCircle },
    };

    const { variant, icon: Icon } = config[status] || config.ACTIVE;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getPlanLimits = (features: string) => {
    try {
      const parsed = JSON.parse(features);
      return parsed.limits || {};
    } catch {
      return {};
    }
  };

  const calculateUsagePercentage = (used: number, limit: number) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageIcon = (type: string) => {
    const icons: Record<string, any> = {
      email_sent: Mail,
      sms_sent: MessageSquare,
      whatsapp_sent: PhoneCall,
      contact_created: Users,
      workflow_executed: Zap,
    };
    return icons[type] || Mail;
  };

  const formatUsageLabel = (type: string) => {
    const labels: Record<string, string> = {
      email_sent: "Emails Sent",
      sms_sent: "SMS Sent",
      whatsapp_sent: "WhatsApp Sent",
      contact_created: "Contacts Created",
      workflow_executed: "Workflows Executed",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
        <p className="text-muted-foreground mb-4">
          Get started by choosing a plan that fits your needs
        </p>
        <Button onClick={() => setShowUpgradeDialog(true)}>
          View Plans
        </Button>
      </Card>
    );
  }

  const limits = getPlanLimits(subscription.plan.features);
  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 md:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{subscription.plan.name}</h2>
              <p className="text-muted-foreground mt-1">
                {subscription.plan.description}
              </p>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold">
              ₦{subscription.plan.price.toLocaleString()}
            </span>
            <span className="text-muted-foreground">
              / {subscription.plan.interval}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {subscription.status === "ACTIVE" && (
              <>
                <Button onClick={() => setShowUpgradeDialog(true)} variant="default">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Change Plan
                </Button>
                <Button onClick={() => setShowCancelDialog(true)} variant="outline">
                  Cancel Subscription
                </Button>
              </>
            )}
            {subscription.status === "CANCELED" && daysUntilRenewal > 0 && (
              <Button onClick={handleReactivate} disabled={actionLoading}>
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Reactivate Subscription
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Billing Cycle</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <p className="font-medium">
                {new Date(subscription.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {subscription.status === "CANCELED" ? "Ends" : "Renews"}
              </p>
              <p className="font-medium">
                {new Date(subscription.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {daysUntilRenewal > 0
                  ? `${daysUntilRenewal} days remaining`
                  : "Expired"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage Metrics */}
      {usage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Usage This Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(usage.usage).map(([type, used]) => {
              const limit = limits[type] || 0;
              const percentage = calculateUsagePercentage(used, limit);
              const Icon = getUsageIcon(type);
              const isWarning = percentage >= 80;
              const isDanger = percentage >= 100;

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatUsageLabel(type)}
                      </span>
                    </div>
                    {isWarning && (
                      <AlertCircle
                        className={`h-4 w-4 ${
                          isDanger ? "text-destructive" : "text-yellow-500"
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-bold">{used.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">
                        / {limit.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={
                        isDanger
                          ? "bg-destructive/20"
                          : isWarning
                          ? "bg-yellow-500/20"
                          : ""
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {percentage.toFixed(1)}% used
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="payment-methods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="billing">Billing Information</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Payment Methods</h3>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>

            {paymentMethods.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No payment methods saved
              </p>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {method.brand} •••• {method.last4}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      </div>
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <PaymentHistory limit={10} />
        </TabsContent>

        <TabsContent value="billing">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Billing Information</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBillingDialog(true)}
              >
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">
                  {subscription.organization.billingEmail ||
                    subscription.organization.email}
                </p>
              </div>
              {subscription.organization.billingName && (
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">
                    {subscription.organization.billingName}
                  </p>
                </div>
              )}
              {subscription.organization.billingAddress && (
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">
                    {subscription.organization.billingAddress}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              We're sorry to see you go. Please let us know why you're canceling.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for cancellation</Label>
              <Textarea
                id="reason"
                placeholder="Help us improve by sharing your feedback..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="immediate"
                checked={cancelImmediate}
                onChange={(e) => setCancelImmediate(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="immediate" className="font-normal">
                Cancel immediately (you will lose access right away)
              </Label>
            </div>

            {!cancelImmediate && (
              <p className="text-sm text-muted-foreground">
                Your subscription will remain active until{" "}
                {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={actionLoading}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade/Downgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Choose a plan that best fits your needs
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === subscription.plan.id;
              const isUpgrade = plan.price > subscription.plan.price;
              const isDowngrade = plan.price < subscription.plan.price;

              return (
                <Card
                  key={plan.id}
                  className={`p-6 ${
                    isCurrent ? "border-2 border-primary" : ""
                  }`}
                >
                  {isCurrent && (
                    <Badge className="mb-2">Current Plan</Badge>
                  )}
                  <h4 className="text-xl font-bold">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      ₦{plan.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.interval}
                    </span>
                  </div>

                  {!isCurrent && (
                    <Button
                      className="w-full"
                      variant={isUpgrade ? "default" : "outline"}
                      onClick={() => {
                        if (isUpgrade) {
                          handleUpgrade(plan.id);
                        } else {
                          handleDowngrade(plan.id);
                        }
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : isUpgrade ? (
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <ArrowDownCircle className="mr-2 h-4 w-4" />
                      )}
                      {isUpgrade ? "Upgrade" : "Downgrade"}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Billing Information Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Billing Information</DialogTitle>
            <DialogDescription>
              Update your billing details for invoices and receipts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="billing-email">Billing Email</Label>
              <Input
                id="billing-email"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@example.com"
              />
            </div>

            <div>
              <Label htmlFor="billing-name">Billing Name</Label>
              <Input
                id="billing-name"
                value={billingName}
                onChange={(e) => setBillingName(e.target.value)}
                placeholder="Company or Individual Name"
              />
            </div>

            <div>
              <Label htmlFor="billing-address">Billing Address</Label>
              <Textarea
                id="billing-address"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Street Address, City, State, Postal Code"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBillingDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBilling} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
