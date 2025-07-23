'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, MapPin, Globe, Loader2, Users, Activity, Eye } from 'lucide-react';
import { lazy } from 'react';

// Lazy load the heavy map component
const LiveVisitorMap = lazy(() => import('@/components/leadpulse/LiveVisitorMap'));

interface LiveMapModuleProps {
  visitorLocations: any[];
  visitorCount: number;
  uniqueVisitors: number;
  totalPageViews: number;
  handleExport: (type: string, format: string) => void;
}

export default function LiveMapModule({
  visitorLocations,
  visitorCount,
  uniqueVisitors,
  totalPageViews,
  handleExport
}: LiveMapModuleProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Visitor Map
              </CardTitle>
              <CardDescription>
                Real-time visitor locations and activity tracking
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {visitorLocations.length} locations
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('locations', 'csv')}
                disabled={visitorLocations.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Active Visitors</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{visitorCount}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Unique Visitors</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{uniqueVisitors}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Page Views</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">{totalPageViews}</div>
            </div>
          </div>

          {/* Live Map */}
          <Suspense fallback={
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Loading live visitor map...</p>
                  <p className="text-xs text-gray-500">This may take a moment for the first load</p>
                </div>
              </div>
            </div>
          }>
            <div className="h-96 border rounded-lg overflow-hidden">
              <LiveVisitorMap />
            </div>
          </Suspense>

          {/* Location Summary */}
          {visitorLocations.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Top Locations
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {visitorLocations.slice(0, 8).map((location, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {location.country || 'Unknown'}
                    </Badge>
                    <span className="text-gray-600">{location.city || 'Unknown'}</span>
                  </div>
                ))}
              </div>
              {visitorLocations.length > 8 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{visitorLocations.length - 8} more locations
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}