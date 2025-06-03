/**
 * Tracking Utilities
 * 
 * This module provides utility functions for tracking user interactions
 * with emails, SMS, WhatsApp messages, and other content.
 */

import type { ActivityType, EntityType } from '@prisma/client';

/**
 * Get a tracking URL for email links
 * 
 * @param originalUrl The original URL to redirect to
 * @param contactId The ID of the contact clicking the link
 * @param campaignId The ID of the campaign containing the link
 * @param metadata Optional additional data to track
 * @returns A URL that tracks the click and then redirects
 */
export function getTrackingUrl(
  originalUrl: string,
  contactId: string,
  entityId: string,
  entityType: EntityType = 'EMAIL_CAMPAIGN',
  metadata?: Record<string, any>
): string {
  // Create a base URL for the tracking endpoint
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const trackingUrl = new URL(`${baseUrl}/api/redirect`);
  
  // Add tracking parameters
  trackingUrl.searchParams.append('url', encodeURIComponent(originalUrl));
  trackingUrl.searchParams.append('cid', contactId);
  trackingUrl.searchParams.append('eid', entityId);
  trackingUrl.searchParams.append('type', entityType);
  
  // Add optional metadata
  if (metadata) {
    trackingUrl.searchParams.append('meta', encodeURIComponent(JSON.stringify(metadata)));
  }
  
  return trackingUrl.toString();
}

/**
 * Process email content to add tracking to all links
 * 
 * @param content The original email HTML content
 * @param contactId The ID of the contact receiving the email
 * @param campaignId The ID of the campaign
 * @returns The HTML content with tracking added to all links
 */
export function addLinkTracking(
  content: string,
  contactId: string,
  campaignId: string
): string {
  // Simple regex to find all links in the HTML
  const linkPattern = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi;
  
  // Replace all links with tracking links
  return content.replace(linkPattern, (match, url, rest) => {
    // Skip tracking for certain links
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return match;
    }
    
    const trackingUrl = getTrackingUrl(url, contactId, campaignId);
    return `<a href="${trackingUrl}"${rest}>`;
  });
}

/**
 * Add a tracking pixel to email HTML content
 * 
 * @param content The original email HTML content
 * @param contactId The ID of the contact receiving the email
 * @param campaignId The ID of the campaign
 * @returns The HTML content with a tracking pixel added
 */
export function addTrackingPixel(
  content: string,
  contactId: string,
  campaignId: string
): string {
  // Create the tracking pixel URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const trackingUrl = `${baseUrl}/api/pixel.gif?cid=${contactId}&eid=${campaignId}&type=EMAIL_CAMPAIGN&t=${Date.now()}`;
  
  // Add the pixel before the closing body tag
  const pixelHtml = `<img src="${trackingUrl}" alt="" width="1" height="1" style="display:none !important;" />`;
  
  if (content.includes('</body>')) {
    return content.replace('</body>', `${pixelHtml}</body>`);
  } else {
    return `${content}${pixelHtml}`;
  }
}

/**
 * Record a client-side engagement event
 * 
 * @param contactId The ID of the contact
 * @param entityId The ID of the entity being interacted with
 * @param entityType The type of entity
 * @param activityType The type of activity
 * @param metadata Optional additional data
 */
export async function trackEngagement(
  contactId: string,
  entityId: string,
  entityType: EntityType,
  activityType: ActivityType,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch('/api/engagements/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactId,
        entityType,
        entityId,
        activityType,
        metadata: {
          ...metadata,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to track engagement:', error);
    return false;
  }
} 