'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Activity } from 'lucide-react';
import { lazy } from 'react';

// Lazy load the heavy components
const JourneyVisualization = lazy(() => import('@/components/leadpulse/JourneyVisualization'));
const VisitorJourneyFlow = lazy(() => import('@/components/leadpulse/VisitorJourneyFlow'));

interface VisitorJourneyModuleProps {
  selectedVisitorId: string | null;
  journeyData: any[];
  syncedJourneyData: any[];
  syncLoading: boolean;
  handleExport: (type: string, format: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function VisitorJourneyModule({
  selectedVisitorId,
  journeyData,
  syncedJourneyData,
  syncLoading,
  handleExport,
  setActiveTab
}: VisitorJourneyModuleProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Visitor Journey Visualization</CardTitle>
              <CardDescription>
                {selectedVisitorId 
                  ? `Journey for visitor ${selectedVisitorId.substring(0, 8)}...`
                  : "Select a visitor from the Visitor Activity tab to view their detailed journey"
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('journeys', 'csv')}
                disabled={journeyData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('journeys', 'json')}
                disabled={journeyData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedVisitorId ? (
            <div className="space-y-6">
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                    <p className="text-sm text-gray-600">Loading journey visualization...</p>
                  </div>
                </div>
              }>
                <JourneyVisualization
                  data={syncedJourneyData}
                  selectedVisitorId={selectedVisitorId}
                  isLoading={syncLoading}
                />
                <VisitorJourneyFlow
                  visitorId={selectedVisitorId}
                  isRealTime={false} // Disable real-time to prevent performance issues
                />
              </Suspense>
            </div>
          ) : (
            <div className="flex items-center justify-center p-12 border rounded-md">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Please select a visitor to see their detailed journey</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('visitors')}
                >
                  Go to Visitor Activity
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}