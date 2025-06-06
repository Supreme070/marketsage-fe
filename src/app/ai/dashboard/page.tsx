import ModelPerformanceDashboard from '@/components/ai/ModelPerformanceDashboard';

export const metadata = {
  title: 'AI Model Performance Dashboard | MarketSage',
  description: 'Real-time monitoring of AI model performance and system metrics'
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ModelPerformanceDashboard />
    </div>
  );
} 