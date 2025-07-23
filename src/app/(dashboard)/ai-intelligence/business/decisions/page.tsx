import { Suspense } from "react";
import type { Metadata } from "next";
import { DecisionSupportDashboard } from "@/components/dashboard/decision-support/decision-support-dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata: Metadata = {
  title: "Decision Support Dashboard | MarketSage",
  description: "AI-powered decision support with what-if analysis, predictive forecasting, and automated reports",
};

export default function DecisionSupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Decision Support Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered insights to enhance your marketing decision-making with scenario modeling, predictions, and automated reports.
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <DecisionSupportDashboard />
      </Suspense>
    </div>
  );
} 