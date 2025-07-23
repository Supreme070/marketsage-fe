import type { Metadata } from 'next';
import AIDelegationInterface from '@/components/ai/AIDelegationInterface';

export const metadata: Metadata = {
  title: 'AI Delegation - MarketSage',
  description: 'Grant AI specific permissions for autonomous task execution',
};

export default function AIDelegationPage() {
  return (
    <div className="container mx-auto p-6">
      <AIDelegationInterface />
    </div>
  );
}