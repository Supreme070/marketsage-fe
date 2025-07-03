import DashboardShell from '@/components/dashboard/dashboard-shell';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import GrafanaStyleCards from '@/components/leadpulse/GrafanaStyleCards';
import TrafficConversionFunnels from '@/components/leadpulse/TrafficConversionFunnels';
import { Activity } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Engagement Analytics" 
        description="Track and analyze engagement across all marketing channels"
        icon={<Activity className="h-5 w-5 text-primary" />}
      />
      <div className="space-y-6">
        <GrafanaStyleCards />
        <TrafficConversionFunnels />
      </div>
    </DashboardShell>
  );
} 