'use client'

import { useEffect, useState, useCallback } from 'react';
import { visitorTracker, type VisitorIdentity, type TrackingConsent } from '@/lib/leadpulse/visitor-tracking';

interface UseVisitorTrackingReturn {
  visitorIdentity: VisitorIdentity | null;
  trackPageview: (url: string, title?: string, metadata?: any) => Promise<void>;
  trackEvent: (type: string, url: string, metadata?: any) => Promise<void>;
  updateConsent: (consent: Partial<TrackingConsent>) => void;
  isLoading: boolean;
}

export function useVisitorTracking(): UseVisitorTrackingReturn {
  const [visitorIdentity, setVisitorIdentity] = useState<VisitorIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize tracking and get visitor identity
    const initializeTracking = async () => {
      try {
        // Wait a bit for the visitor tracker to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const identity = visitorTracker.getVisitorIdentity();
        setVisitorIdentity(identity);
        
        // Auto-track initial pageview
        if (typeof window !== 'undefined') {
          await visitorTracker.trackPageview(
            window.location.pathname,
            document.title,
            {
              referrer: document.referrer,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          );
        }
      } catch (error) {
        console.error('Failed to initialize visitor tracking:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTracking();
  }, []);

  const trackPageview = useCallback(async (url: string, title?: string, metadata?: any) => {
    try {
      await visitorTracker.trackPageview(url, title, metadata);
      
      // Update visitor identity after tracking
      const updatedIdentity = visitorTracker.getVisitorIdentity();
      setVisitorIdentity(updatedIdentity);
    } catch (error) {
      console.error('Failed to track pageview:', error);
    }
  }, []);

  const trackEvent = useCallback(async (type: string, url: string, metadata?: any) => {
    try {
      await visitorTracker.trackEvent(type, url, metadata);
      
      // Update visitor identity after tracking
      const updatedIdentity = visitorTracker.getVisitorIdentity();
      setVisitorIdentity(updatedIdentity);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, []);

  const updateConsent = useCallback((consent: Partial<TrackingConsent>) => {
    try {
      visitorTracker.updateConsent(consent);
      
      // Update visitor identity after consent change
      const updatedIdentity = visitorTracker.getVisitorIdentity();
      setVisitorIdentity(updatedIdentity);
    } catch (error) {
      console.error('Failed to update consent:', error);
    }
  }, []);

  return {
    visitorIdentity,
    trackPageview,
    trackEvent,
    updateConsent,
    isLoading
  };
}

// Auto-tracking hook for page changes
export function useAutoTracking() {
  const { trackPageview } = useVisitorTracking();
  
  useEffect(() => {
    // Track route changes in Next.js
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        trackPageview(
          window.location.pathname,
          document.title,
          {
            type: 'route_change',
            timestamp: new Date().toISOString()
          }
        );
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [trackPageview]);
}

// Event tracking utilities
export const trackingEvents = {
  // Form interactions
  formView: (formId: string, formName: string) => ({
    type: 'FORM_VIEW',
    url: window.location.pathname,
    metadata: { formId, formName, timestamp: new Date().toISOString() }
  }),
  
  formStart: (formId: string, formName: string) => ({
    type: 'FORM_START', 
    url: window.location.pathname,
    metadata: { formId, formName, timestamp: new Date().toISOString() }
  }),
  
  formSubmit: (formId: string, formName: string, formData?: any) => ({
    type: 'FORM_SUBMIT',
    url: window.location.pathname,
    metadata: { 
      formId, 
      formName, 
      formData: formData ? Object.keys(formData) : [], // Only track field names, not values
      timestamp: new Date().toISOString() 
    }
  }),

  // Click tracking
  buttonClick: (buttonText: string, buttonType: string) => ({
    type: 'CLICK',
    url: window.location.pathname,
    metadata: { 
      buttonText, 
      buttonType, 
      timestamp: new Date().toISOString() 
    }
  }),

  linkClick: (linkText: string, linkUrl: string) => ({
    type: 'CLICK',
    url: window.location.pathname,
    metadata: { 
      linkText, 
      linkUrl, 
      clickType: 'link',
      timestamp: new Date().toISOString() 
    }
  }),

  // Engagement tracking
  scrollDepth: (depth: number) => ({
    type: 'SCROLL',
    url: window.location.pathname,
    metadata: { 
      scrollDepth: depth,
      timestamp: new Date().toISOString()
    }
  }),

  timeOnPage: (duration: number) => ({
    type: 'TIME_ON_PAGE',
    url: window.location.pathname,
    metadata: { 
      duration,
      timestamp: new Date().toISOString()
    }
  }),

  // Conversion tracking
  conversion: (conversionType: string, value?: number) => ({
    type: 'CONVERSION',
    url: window.location.pathname,
    metadata: { 
      conversionType,
      value,
      timestamp: new Date().toISOString()
    }
  })
};