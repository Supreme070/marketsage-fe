/**
 * Funnel Analytics Page
 * =====================
 * Main page for advanced funnel analytics with micro-conversion tracking
 * Uses existing TrafficConversionFunnels component
 */

import React from 'react';
import TrafficConversionFunnels from '@/components/leadpulse/TrafficConversionFunnels';

export default function FunnelAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TrafficConversionFunnels />
      </div>
    </div>
  );
}