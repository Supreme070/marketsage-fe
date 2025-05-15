import DashboardShell from '@/components/dashboard/dashboard-shell';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import EngagementDashboard from '@/components/analytics/EngagementDashboard';
import { Activity } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Engagement Analytics" 
        description="Track and analyze engagement across all marketing channels"
        icon={<Activity className="h-5 w-5 text-primary" />}
      />
      <EngagementDashboard />
    </DashboardShell>
  );
} 