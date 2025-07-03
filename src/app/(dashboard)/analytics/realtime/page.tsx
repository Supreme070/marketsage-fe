/**
 * Real-Time Analytics Page
 * ========================
 * Production-scale real-time analytics dashboard page
 * Uses existing LeadPulse real-time components
 */

import React from 'react';
import GrafanaStyleCards from '@/components/leadpulse/GrafanaStyleCards';
import LiveVisitorMap from '@/components/leadpulse/LiveVisitorMap';

export default function RealTimeAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Real-Time Analytics</h1>
        <GrafanaStyleCards />
        <LiveVisitorMap />
      </div>
    </div>
  );
}