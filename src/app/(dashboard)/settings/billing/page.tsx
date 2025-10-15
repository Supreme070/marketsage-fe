"use client";

import { SubscriptionDashboard } from "@/components/billing/SubscriptionDashboard";

export default function BillingSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, payment methods, and billing information
        </p>
      </div>

      <SubscriptionDashboard />
    </div>
  );
}
