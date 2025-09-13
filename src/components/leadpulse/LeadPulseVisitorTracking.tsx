/**
 * LeadPulse Visitor Tracking Component
 * 
 * Demonstrates how to use the new LeadPulse service for visitor tracking
 * with proper API key authentication for public endpoints.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, MapPin, Clock, Eye } from 'lucide-react';
import { useLeadPulse } from '@/hooks/useLeadPulse';
import type { CreateVisitorDto, CreateTouchpointDto } from '@/lib/api/types/leadpulse';

interface VisitorTrackingProps {
  apiKey?: string;
  domain?: string;
  onVisitorCreated?: (visitor: any) => void;
  onTouchpointCreated?: (touchpoint: any) => void;
}

export function LeadPulseVisitorTracking({
  apiKey,
  domain,
  onVisitorCreated,
  onTouchpointCreated
}: VisitorTrackingProps) {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [pageViews, setPageViews] = useState(0);

  const { 
    createVisitor, 
    createTouchpoint, 
    configurePublicAccess, 
    clearPublicAccess 
  } = useLeadPulse({
    apiKey,
    domain
  });

  // Generate a unique fingerprint for this visitor
  const generateFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('LeadPulse Visitor Tracking', 10, 10);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  };

  const startTracking = async () => {
    if (!apiKey || !domain) {
      setTrackingError('API key and domain are required for visitor tracking');
      return;
    }

    setIsTracking(true);
    setTrackingError(null);

    try {
      // Configure public access
      configurePublicAccess(apiKey, domain);

      // Create visitor
      const visitorData: CreateVisitorDto = {
        fingerprint: generateFingerprint(),
        ipAddress: '127.0.0.1', // In real implementation, get from server
        userAgent: navigator.userAgent,
        country: 'US', // In real implementation, get from IP geolocation
        city: 'San Francisco',
        referrer: document.referrer || undefined
      };

      const visitor = await createVisitor(visitorData);
      setVisitorId(visitor.id);
      onVisitorCreated?.(visitor);

      // Track initial page view
      await trackPageView(visitor.id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start tracking';
      setTrackingError(errorMessage);
    } finally {
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    setVisitorId(null);
    setPageViews(0);
    clearPublicAccess();
  };

  const trackPageView = async (visitorId: string) => {
    try {
      const touchpointData: CreateTouchpointDto = {
        visitorId,
        type: 'PAGEVIEW',
        url: window.location.href,
        metadata: {
          title: document.title,
          timestamp: new Date().toISOString()
        }
      };

      const touchpoint = await createTouchpoint(touchpointData);
      setPageViews(prev => prev + 1);
      onTouchpointCreated?.(touchpoint);

    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  const trackClick = async (element: string) => {
    if (!visitorId) return;

    try {
      const touchpointData: CreateTouchpointDto = {
        visitorId,
        type: 'CLICK',
        element,
        url: window.location.href,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const touchpoint = await createTouchpoint(touchpointData);
      onTouchpointCreated?.(touchpoint);

    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  const trackScroll = async (depth: number) => {
    if (!visitorId) return;

    try {
      const touchpointData: CreateTouchpointDto = {
        visitorId,
        type: 'SCROLL',
        value: depth,
        url: window.location.href,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const touchpoint = await createTouchpoint(touchpointData);
      onTouchpointCreated?.(touchpoint);

    } catch (error) {
      console.error('Failed to track scroll:', error);
    }
  };

  // Track page views when visitor is created
  useEffect(() => {
    if (visitorId) {
      const handlePageView = () => trackPageView(visitorId);
      window.addEventListener('popstate', handlePageView);
      return () => window.removeEventListener('popstate', handlePageView);
    }
  }, [visitorId]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Visitor Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!visitorId ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Start tracking visitor behavior with LeadPulse
              </p>
              <Button
                onClick={startTracking}
                disabled={isTracking || !apiKey || !domain}
                className="w-full"
              >
                {isTracking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Tracking'
                )}
              </Button>
            </div>

            {trackingError && (
              <Alert className="border-red-500">
                <AlertDescription>{trackingError}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="default" className="mb-2">
                Tracking Active
              </Badge>
              <p className="text-sm text-gray-600">
                Visitor ID: {visitorId.substring(0, 8)}...
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-lg font-semibold text-blue-600">1</div>
                <div className="text-xs text-gray-600">Visitor</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Eye className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-lg font-semibold text-green-600">{pageViews}</div>
                <div className="text-xs text-gray-600">Page Views</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => trackClick('demo-button')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Track Button Click
              </Button>
              <Button
                onClick={() => trackScroll(50)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Track Scroll (50%)
              </Button>
            </div>

            <Button
              onClick={stopTracking}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Stop Tracking
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>This demo shows how to integrate LeadPulse visitor tracking</p>
          <p>with API key authentication for public endpoints.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage component
export function LeadPulseTrackingExample() {
  const [apiKey, setApiKey] = useState('');
  const [domain, setDomain] = useState('');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">LeadPulse Visitor Tracking</h1>
        <p className="text-gray-600">
          Example of using the new LeadPulse service for visitor tracking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key (for public endpoints)</label>
            <input
              type="password"
              placeholder="ms_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Domain</label>
            <input
              type="text"
              placeholder="https://example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <LeadPulseVisitorTracking
        apiKey={apiKey}
        domain={domain}
        onVisitorCreated={(visitor) => {
          console.log('Visitor created:', visitor);
        }}
        onTouchpointCreated={(touchpoint) => {
          console.log('Touchpoint created:', touchpoint);
        }}
      />
    </div>
  );
}
