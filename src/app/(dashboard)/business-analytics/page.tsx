import React from 'react';
import BusinessAnalyticsDashboard from '@/components/analytics/BusinessAnalyticsDashboard';

export const metadata = {
  title: 'Business Analytics – MarketSage',
  description: 'Comprehensive traffic, hotspot, ad attribution and engagement analytics dashboard.'
};

export default function BusinessAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Analytics</h1>
        <p className="text-muted-foreground">Unified dashboard for traffic, engagement and ROI insights</p>
      </div>
      <BusinessAnalyticsDashboard />
    </div>
  );
} 