'use client';

import { useEffect, useState } from 'react';

interface EmailTrackingPixelProps {
  campaignId: string;
  contactId: string;
  onLoad?: () => void;
}

/**
 * Tracking pixel component for emails
 * Renders a 1x1 transparent pixel that pings the API when loaded
 */
export default function EmailTrackingPixel({ 
  campaignId, 
  contactId,
  onLoad 
}: EmailTrackingPixelProps) {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    if (!loaded) {
      // Track the open event
      fetch('/api/engagements/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          entityType: 'EMAIL_CAMPAIGN',
          entityId: campaignId,
          activityType: 'OPENED',
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }
        }),
      }).then(() => {
        setLoaded(true);
        if (onLoad) onLoad();
      }).catch(error => {
        console.error('Failed to track email open:', error);
      });
    }
  }, [campaignId, contactId, loaded, onLoad]);
  
  // Render a tiny transparent image
  return (
    <img 
      src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
      alt=""
      width="1"
      height="1"
      style={{ 
        display: 'block', 
        position: 'absolute', 
        bottom: 0, 
        right: 0,
        opacity: 0.01 
      }}
    />
  );
} 