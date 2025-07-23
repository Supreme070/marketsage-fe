'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Activity } from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface BasicVisitorMapProps {
  locations: VisitorLocation[];
  isLoading?: boolean;
}

const BasicVisitorMap = React.memo<BasicVisitorMapProps>(({ locations, isLoading }) => {
  // Calculate totals and sort locations
  const processedData = useMemo(() => {
    const totalVisitors = locations.reduce((sum, loc) => sum + loc.visitors, 0);
    const sortedLocations = [...locations].sort((a, b) => b.visitors - a.visitors);
    const topLocations = sortedLocations.slice(0, 10);
    
    return {
      totalVisitors,
      topLocations,
      countries: new Set(locations.map(l => l.country)).size
    };
  }, [locations]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Visitor Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500">Loading visitor data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Visitor Locations
        </CardTitle>
        <div className="text-sm text-gray-600 mt-1">
          {processedData.totalVisitors} visitors from {processedData.countries} countries
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Visual Map Representation */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 h-48 overflow-hidden">
            {/* Simple dot visualization for locations */}
            <div className="absolute inset-0">
              {processedData.topLocations.map((location, index) => {
                // Simple positioning based on index
                const positions = [
                  { top: '20%', left: '30%' },
                  { top: '40%', left: '60%' },
                  { top: '60%', left: '25%' },
                  { top: '30%', left: '75%' },
                  { top: '70%', left: '50%' },
                  { top: '25%', left: '45%' },
                  { top: '50%', left: '70%' },
                  { top: '45%', left: '35%' },
                  { top: '35%', left: '55%' },
                  { top: '55%', left: '40%' }
                ];
                const pos = positions[index % positions.length];
                const size = Math.max(8, Math.min(24, location.visitors));
                
                return (
                  <div
                    key={location.id}
                    className="absolute group cursor-pointer"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <div
                      className="bg-blue-500 rounded-full animate-pulse opacity-60"
                      style={{ width: `${size}px`, height: `${size}px` }}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {location.city}: {location.visitors} visitors
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Map overlay text */}
            <div className="relative z-10 text-center">
              <h3 className="text-lg font-semibold text-gray-800">Live Visitor Map</h3>
              <p className="text-sm text-gray-600">Hover over dots to see details</p>
            </div>
          </div>

          {/* Location List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Top Locations
            </h4>
            <div className="space-y-1">
              {processedData.topLocations.slice(0, 5).map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-sm">{location.city}</div>
                      <div className="text-xs text-gray-500">{location.country}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm">{location.visitors}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{processedData.countries}</div>
              <div className="text-xs text-gray-500">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{processedData.topLocations.length}</div>
              <div className="text-xs text-gray-500">Cities</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{processedData.totalVisitors}</div>
              <div className="text-xs text-gray-500">Total Visitors</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BasicVisitorMap.displayName = 'BasicVisitorMap';

export { BasicVisitorMap };
export default BasicVisitorMap;