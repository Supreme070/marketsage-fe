import type { Metadata } from 'next';
import AITaskMonitoringDashboard from '@/components/ai/AITaskMonitoringDashboard';

export const metadata: Metadata = {
  title: 'AI Task Monitoring - MarketSage',
  description: 'Real-time monitoring of AI task execution and system health',
};

export default function AIMonitoringPage() {
  return (
    <div className="container mx-auto p-6">
      <AITaskMonitoringDashboard />
    </div>
  );
}