"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PAYSTACK_PUBLIC_KEY } from "@/lib/paystack";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

interface SubscriptionProps {
  currentPlan?: Plan;
}

export function SubscriptionManagement({ currentPlan }: SubscriptionProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
    fetchTransactionHistory();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch("/api/payments/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // Initialize payment
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: currentPlan?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize payment");
      }

      const data = await response.json();

      // Initialize Paystack
      const paystack = new (window as any).PaystackPop();
      paystack.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: session?.user?.email,
        amount: data.amount,
        ref: data.reference,
        metadata: data.metadata,
        callback: (response: any) => {
          if (response.status === "success") {
            toast.success("Payment successful!");
            fetchSubscriptionData();
            fetchTransactionHistory();
          } else {
            toast.error("Payment failed");
          }
        },
        onClose: () => {
          toast.info("Payment window closed");
        },
      });
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast.success("Subscription canceled successfully");
      setShowCancelDialog(false);
      fetchSubscriptionData();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
        {subscription?.subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">
                  You are currently on the <span className="font-medium">{subscription.subscription.plan.name}</span> plan.
                </p>
                <p className="text-2xl font-bold mt-2">
                  ₦{subscription.subscription.plan.price.toLocaleString()}/{subscription.subscription.plan.interval}
                </p>
              </div>
              <Badge variant={
                subscription.subscription.status === "ACTIVE" 
                  ? "default" 
                  : "secondary"
              }>
                {subscription.subscription.status}
              </Badge>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Billing Information</h4>
              <p className="text-sm text-muted-foreground">
                Email: {subscription.organization.billingEmail}
              </p>
              {subscription.organization.billingName && (
                <p className="text-sm text-muted-foreground">
                  Name: {subscription.organization.billingName}
                </p>
              )}
              {subscription.organization.billingAddress && (
                <p className="text-sm text-muted-foreground">
                  Address: {subscription.organization.billingAddress}
                </p>
              )}
            </div>

            <div className="flex gap-4 mt-4">
              <Button
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : "Change Plan"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={loading}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">No active subscription</p>
            <Button
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Subscribe Now"}
            </Button>
          </div>
        )}
      </Card>

      {/* Payment History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{transaction.subscription?.plan?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ref: {transaction.paystackReference}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₦{transaction.amount.toLocaleString()}</p>
                  <Badge variant={
                    transaction.status === "SUCCESS" 
                      ? "default" 
                      : transaction.status === "FAILED" 
                        ? "destructive" 
                        : "secondary"
                  }>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No payment history available</p>
        )}
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelLoading}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js" async />
    </div>
  );
} 