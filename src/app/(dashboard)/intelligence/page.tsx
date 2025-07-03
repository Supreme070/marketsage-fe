import type { Metadata } from 'next';
import CustomerIntelligenceDashboard from '@/components/dashboard/CustomerIntelligenceDashboard';

export const metadata: Metadata = {
  title: 'Customer Intelligence | MarketSage',
  description: 'AI-powered customer insights across churn prediction, CLV analysis, segmentation, and governance.',
};

export default function IntelligencePage() {
  return <CustomerIntelligenceDashboard />;
}