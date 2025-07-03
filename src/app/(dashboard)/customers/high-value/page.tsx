import type { Metadata } from 'next';
import HighValueCustomerDashboard from '@/components/dashboard/HighValueCustomerDashboard';

export const metadata: Metadata = {
  title: 'High-Value Customers | MarketSage',
  description: 'Automated detection and management of high-value customer segments with AI-powered insights.',
};

export default function HighValueCustomersPage() {
  return <HighValueCustomerDashboard />;
}