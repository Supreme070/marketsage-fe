import type { Metadata } from 'next';
import AIFeedbackInterface from '@/components/dashboard/AIFeedbackInterface';

export const metadata: Metadata = {
  title: 'AI Feedback Collection | MarketSage',
  description: 'Help improve AI recommendations through feedback and insights on automated actions.',
};

export default function AIFeedbackPage() {
  return <AIFeedbackInterface />;
}