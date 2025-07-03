import type { Metadata } from 'next';
import AIActionApprovalInterface from '@/components/dashboard/AIActionApprovalInterface';

export const metadata: Metadata = {
  title: 'AI Action Approvals | MarketSage',
  description: 'Review and approve AI-recommended customer actions with comprehensive governance oversight.',
};

export default function ApprovalsPage() {
  return <AIActionApprovalInterface />;
}