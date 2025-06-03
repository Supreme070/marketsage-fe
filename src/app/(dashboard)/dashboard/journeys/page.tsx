import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { JourneyManagementDashboard } from "@/components/dashboard/journeys/journey-management-dashboard";

export const metadata: Metadata = {
  title: "Customer Journey Management | MarketSage",
  description: "Design, automate, and optimize customer journeys with AI-powered insights and real-time analytics for the African market.",
  keywords: ["customer journey", "marketing automation", "journey builder", "customer experience", "Nigeria", "Africa"],
};

export default function JourneyManagementPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Customer Journey Management</h2>
        <div className="flex items-center space-x-2">
          <p className="text-muted-foreground">
            Design and optimize customer experiences
          </p>
        </div>
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <JourneyManagementDashboard />
      </Suspense>
    </div>
  );
} 