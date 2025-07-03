import type { Metadata } from 'next';
import BirthdayCampaignDashboard from '@/components/dashboard/BirthdayCampaignDashboard';

export const metadata: Metadata = {
  title: 'Birthday Campaigns | MarketSage',
  description: 'Automated birthday campaign management and analytics with AI-powered optimization.',
};

export default function BirthdayCampaignsPage() {
  return <BirthdayCampaignDashboard />;
}