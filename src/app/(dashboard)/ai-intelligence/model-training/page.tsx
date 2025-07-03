import type { Metadata } from 'next';
import ModelTrainingInterface from '@/components/dashboard/ModelTrainingInterface';

export const metadata: Metadata = {
  title: 'Model Training | MarketSage',
  description: 'Manage ML model training operations, schedules, and performance monitoring.',
};

export default function ModelTrainingPage() {
  return <ModelTrainingInterface />;
}