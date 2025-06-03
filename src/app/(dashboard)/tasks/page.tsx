import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TaskManagementDashboard } from "@/components/dashboard/tasks/task-management-dashboard";

export const metadata: Metadata = {
  title: "Task Management | MarketSage",
  description: "Powerful Kanban-style task management for marketing campaigns, sales pipelines, and team collaboration in the African market.",
  keywords: ["task management", "kanban", "marketing tasks", "sales pipeline", "team collaboration", "Nigeria", "Africa"],
};

export default function TaskManagementPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Task Management</h2>
        <div className="flex items-center space-x-2">
          <p className="text-muted-foreground">
            Streamline your marketing & sales workflows
          </p>
        </div>
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <TaskManagementDashboard />
      </Suspense>
    </div>
  );
} 