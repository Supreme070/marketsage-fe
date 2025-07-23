import type { Metadata } from 'next';
import AITaskApprovalInterface from '@/components/ai/AITaskApprovalInterface';

export const metadata: Metadata = {
  title: 'AI Task Approval - MarketSage',
  description: 'Review and approve AI tasks before execution',
};

export default function AITasksPage() {
  return (
    <div className="container mx-auto p-6">
      <AITaskApprovalInterface />
    </div>
  );
}