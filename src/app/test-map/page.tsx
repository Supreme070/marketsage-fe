'use client';

import React from 'react';
import LiveVisitorMap from '@/components/leadpulse/LiveVisitorMap';
import SimpleGeoMap from '@/components/leadpulse/SimpleGeoMap';

export default function TestMapPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8 space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Geographic Map Testing</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original Complex Map */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Original LiveVisitorMap</h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <LiveVisitorMap 
                visitorData={[
                  {
                    id: '1',
                    city: 'Lagos',
                    country: 'Nigeria',
                    latitude: 6.5244,
                    longitude: 3.3792,
                    isActive: true,
                    count: 5
                  },
                  {
                    id: '2', 
                    city: 'Accra',
                    country: 'Ghana',
                    latitude: 5.6037,
                    longitude: -0.1870,
                    isActive: false,
                    count: 2
                  }
                ]}
                onSelectLocation={(location) => console.log('Selected:', location)}
                timeRange="24h"
              />
            </div>
          </div>
          
          {/* Simplified Test Map */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Simplified Test Map</h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <SimpleGeoMap 
                onRegionClick={(regionId) => console.log('Clicked region:', regionId)}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg text-white">
          <h3 className="text-lg font-semibold mb-2">Testing Instructions:</h3>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Left side</strong>: Original complex map with all the logic</li>
            <li>• <strong>Right side</strong>: Simplified test map with basic zoom</li>
            <li>• Try clicking Africa on both maps to see zoom behavior</li>
            <li>• Check if the simplified version works better for alignment</li>
            <li>• Use browser dev tools to see console logs for debugging</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 