'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TrafficConversionAnalytics from '@/components/leadpulse/TrafficConversionAnalytics';
import HeatmapHotspots from '@/components/leadpulse/HeatmapHotspots';
import ABTestingOptimizer from '@/components/leadpulse/ABTestingOptimizer';
import ThirdPartyAdTracker from '@/components/leadpulse/ThirdPartyAdTracker';

export default function LeadPulseAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LeadPulse Analytics</h1>
        <p className="text-muted-foreground">
          Advanced analytics for traffic conversion, user behavior, and campaign performance
        </p>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Conversion Analytics</CardTitle>
            <CardDescription>
              Analyze traffic conversion rates and optimize your website performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficConversionAnalytics />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Heatmap & Hotspot Analysis</CardTitle>
            <CardDescription>
              Visualize user interactions and engagement patterns on your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HeatmapHotspots />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>A/B Testing & Optimization</CardTitle>
            <CardDescription>
              Compare variants and optimize for Nigerian markets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ABTestingOptimizer />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Third-Party Ad Attribution</CardTitle>
            <CardDescription>
              Track and analyze cross-platform ad performance and attribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThirdPartyAdTracker />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 