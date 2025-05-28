'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TrafficConversionAnalytics from '@/components/leadpulse/TrafficConversionAnalytics';
import HotspotAnalytics from '@/components/leadpulse/HotspotAnalytics';
import AdAttributionTracker from '@/components/leadpulse/AdAttributionTracker';
import EngagementAutomation from '@/components/leadpulse/EngagementAutomation';

export default function BusinessAnalyticsDashboard() {
  const [tab, setTab] = useState('traffic');

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traffic">Traffic & Conversions</TabsTrigger>
          <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
          <TabsTrigger value="ads">Ad Attribution</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="mt-6">
          <TrafficConversionAnalytics />
        </TabsContent>

        <TabsContent value="hotspots" className="mt-6">
          <HotspotAnalytics />
        </TabsContent>

        <TabsContent value="ads" className="mt-6">
          <AdAttributionTracker />
        </TabsContent>

        <TabsContent value="engagement" className="mt-6">
          <EngagementAutomation />
        </TabsContent>
      </Tabs>
    </div>
  );
} 