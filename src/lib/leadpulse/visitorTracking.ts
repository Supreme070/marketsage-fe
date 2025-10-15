/**
 * LeadPulse Visitor Tracking Utilities
 * 
 * This module provides functionality for anonymous visitor tracking,
 * browser fingerprinting, and user behavior analysis.
 */

// NOTE: Prisma removed - using backend API (AnonymousVisitor, LeadPulseTouchpoint, Contact exist in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

import { randomUUID } from 'crypto';
import { engagementScoringEngine } from './engagement-scoring-engine';

// Import enums directly since the Prisma client may not have generated them yet
enum ConversionStatus {
  ANONYMOUS = 'ANONYMOUS',
  ENGAGED = 'ENGAGED',
  QUALIFIED = 'QUALIFIED',
  CONVERTED = 'CONVERTED'
}

enum FormType {
  STANDARD = 'STANDARD',
  EXIT_INTENT = 'EXIT_INTENT',
  EMBEDDED = 'EMBEDDED',
  POPUP = 'POPUP',
  CHATBOT = 'CHATBOT',
  PROGRESSIVE = 'PROGRESSIVE'
}

/**
 * Generate a visitor fingerprint based on browser and device characteristics
 * 
 * @param userAgent - Browser user agent string
 * @param ip - IP address
 * @param additionalData - Optional additional identifying data
 * @returns A unique fingerprint string
 */
export async function generateVisitorFingerprint(
  userAgent: string,
  ip: string,
  additionalData?: Record<string, any>
): Promise<string> {
  // Create a hash of user data to identify the visitor
  const dataToHash = JSON.stringify({
    userAgent,
    ip,
    additional: additionalData,
    // Add randomized component to avoid fingerprint collisions
    random: randomUUID().slice(0, 8)
  });
  
  // Use Web Crypto API equivalent for Node.js
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Create or update an anonymous visitor record
 * 
 * @param fingerprint - Visitor fingerprint
 * @param ipAddress - IP address
 * @param metadata - Additional visitor data
 * @returns The visitor record
 */
export async function trackAnonymousVisitor(
  fingerprint: string,
  ipAddress: string,
  metadata: {
    userAgent?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    country?: string;
    region?: string;
    city?: string;
    device?: string;
    browser?: string;
    os?: string;
    [key: string]: any;
  } = {}
) {
  // Check if visitor already exists
  const checkResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors?fingerprint=${fingerprint}&limit=1`);
  if (!checkResponse.ok) {
    throw new Error(`Failed to check visitor: ${checkResponse.status}`);
  }
  const existingVisitors = await checkResponse.json();
  const existingVisitor = existingVisitors[0];

  if (existingVisitor) {
    // Update existing visitor with correct field names
    const updateResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors/${existingVisitor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastVisit: new Date(),
        totalVisits: existingVisitor.totalVisits + 1,
        visitCount: existingVisitor.visitCount + 1,
        ipAddress,
        userAgent: metadata.userAgent,
        referrer: metadata.referrer,
        city: metadata.city,
        country: metadata.country,
        region: metadata.region,
      })
    });
    if (!updateResponse.ok) {
      throw new Error(`Failed to update visitor: ${updateResponse.status}`);
    }
    return updateResponse.json();
  } else {
    // Create new visitor with correct field names
    const createResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: randomUUID(),
        fingerprint,
        ipAddress,
        userAgent: metadata.userAgent,
        referrer: metadata.referrer,
        firstVisit: new Date(),
        lastVisit: new Date(),
        totalVisits: 1,
        visitCount: 1,
        isActive: true,
        engagementScore: 0,
        score: 0,
        city: metadata.city,
        country: metadata.country,
        region: metadata.region,
      })
    });
    if (!createResponse.ok) {
      throw new Error(`Failed to create visitor: ${createResponse.status}`);
    }
    return createResponse.json();
  }
}

/**
 * Record a visitor touchpoint (page view, interaction, etc.)
 * 
 * @param visitorId - Anonymous visitor ID
 * @param pageUrl - URL of the page
 * @param touchpointData - Additional data about the interaction
 * @param touchpointType - Type of touchpoint
 * @returns The created touchpoint record
 */
export async function recordTouchpoint(
  visitorId: string,
  pageUrl: string,
  touchpointData: {
    pageTitle?: string;
    duration?: number;
    clickData?: Record<string, any>;
    scrollDepth?: number;
    exitIntent?: boolean;
    formId?: string;
    [key: string]: any;
  } = {},
  touchpointType: 'PAGEVIEW' | 'CLICK' | 'FORM_VIEW' | 'FORM_START' | 'FORM_SUBMIT' | 'CONVERSION' = 'PAGEVIEW'
) {
  const response = await fetch(`${BACKEND_URL}/api/v2/touchpoints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: randomUUID(),
      anonymousVisitorId: visitorId, // Use correct field name
      url: pageUrl, // Use correct field name
      type: touchpointType, // Add required type field
      timestamp: new Date(),
      duration: touchpointData.duration,
      value: 1,
      score: 1,
      metadata: touchpointData,
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create touchpoint: ${response.status}`);
  }

  return response.json();
}

/**
 * Update a visitor's engagement score based on behavior
 * Uses the new enhanced engagement scoring engine for accurate scoring
 * 
 * @param visitorId - Anonymous visitor ID
 * @param action - The action taken by the visitor
 * @param weight - Importance weight of the action
 * @returns The updated visitor record
 */
export async function updateVisitorEngagement(
  visitorId: string,
  action: 'PAGE_VIEW' | 'FORM_VIEW' | 'FORM_START' | 'FORM_SUBMIT' | 'CTA_CLICK' | 'RETURN_VISIT' | 'TIME_ON_PAGE' | 'SCROLL_DEPTH',
  weight = 1
) {
  try {
    // Use the new engagement scoring engine for accurate scoring
    await engagementScoringEngine.updateVisitorScore(visitorId);

    // Get the updated visitor record
    const response = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors/${visitorId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch visitor: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    // Fallback to simple scoring if new engine fails
    const actionScores: Record<string, number> = {
      PAGE_VIEW: 1,
      FORM_VIEW: 2,
      FORM_START: 5,
      FORM_SUBMIT: 10,
      CTA_CLICK: 3,
      RETURN_VISIT: 2,
      TIME_ON_PAGE: 0.1,
      SCROLL_DEPTH: 0.05
    };
    
    const scoreIncrement = actionScores[action] * weight;

    // Get current visitor data
    const visitorResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors/${visitorId}`);
    if (!visitorResponse.ok) {
      throw new Error(`Failed to fetch visitor: ${visitorResponse.status}`);
    }
    const visitor = await visitorResponse.json();

    const updateResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors/${visitorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engagementScore: visitor.engagementScore + scoreIncrement,
        score: visitor.score + scoreIncrement,
        lastVisit: new Date(),
      })
    });
    if (!updateResponse.ok) {
      throw new Error(`Failed to update visitor engagement: ${updateResponse.status}`);
    }
    return updateResponse.json();
  }
}

/**
 * Convert an anonymous visitor to a known contact
 * 
 * @param visitorId - Anonymous visitor ID
 * @param contactData - Contact information
 * @returns The updated visitor and created/updated contact
 */
export async function convertVisitorToContact(
  visitorId: string,
  contactData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    [key: string]: any;
  }
) {
  // Get the visitor
  const visitorResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors/${visitorId}`);
  if (!visitorResponse.ok) {
    throw new Error(`Failed to fetch visitor: ${visitorResponse.status}`);
  }
  const visitor = await visitorResponse.json();

  if (!visitor) {
    throw new Error(`Visitor not found: ${visitorId}`);
  }

  // Create or update contact
  const contactId = randomUUID();
  const contactResponse = await fetch(`${BACKEND_URL}/api/v2/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: contactId,
      email: contactData.email || '',
      phone: contactData.phone,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      company: contactData.company,
      source: 'LeadPulse',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: process.env.SYSTEM_USER_ID || 'default-user-id',
    })
  });
  if (!contactResponse.ok) {
    throw new Error(`Failed to create contact: ${contactResponse.status}`);
  }
  const contact = await contactResponse.json();

  // Update visitor with contact ID (removed conversionStatus and convertedAt)
  const updateResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors/${visitorId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId: contact.id,
      lastVisit: new Date(),
    })
  });
  if (!updateResponse.ok) {
    throw new Error(`Failed to update visitor: ${updateResponse.status}`);
  }
  const updatedVisitor = await updateResponse.json();
  
  // Return both entities
  return {
    visitor: updatedVisitor,
    contact
  };
}

/**
 * Get visitor journey data with touchpoints
 * 
 * @param visitorId - Anonymous visitor ID
 * @returns Complete visitor journey information
 */
export async function getVisitorJourney(visitorId: string) {
  const visitorResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors/${visitorId}`);
  if (!visitorResponse.ok) {
    throw new Error(`Failed to fetch visitor: ${visitorResponse.status}`);
  }
  const visitor = await visitorResponse.json();

  if (!visitor) {
    throw new Error(`Visitor not found: ${visitorId}`);
  }

  // Get all touchpoints for this visitor (use correct field name)
  const touchpointsResponse = await fetch(`${BACKEND_URL}/api/v2/touchpoints?anonymousVisitorId=${visitorId}&sortBy=timestamp&order=asc`);
  if (!touchpointsResponse.ok) {
    throw new Error(`Failed to fetch touchpoints: ${touchpointsResponse.status}`);
  }
  const touchpoints = await touchpointsResponse.json();

  // Get contact data if visitor has been converted
  let contact = null;
  if (visitor.contactId) {
    const contactResponse = await fetch(`${BACKEND_URL}/api/v2/contacts/${visitor.contactId}`);
    if (contactResponse.ok) {
      contact = await contactResponse.json();
    }
  }
  
  return {
    visitor,
    touchpoints,
    contact
  };
}

/**
 * Predict visitor conversion likelihood using engagement data
 * 
 * @param visitorId - Anonymous visitor ID
 * @returns Prediction score between 0-1
 */
export async function predictVisitorConversion(visitorId: string): Promise<number> {
  // Get visitor with touchpoints
  const { visitor, touchpoints } = await getVisitorJourney(visitorId);
  
  // Simple predictive model based on engagement signals
  // In a production system, this would use a trained ML model
  
  // Base factors that influence conversion
  const engagementFactor = Math.min(visitor.engagementScore / 100, 0.5);
  const visitCountFactor = Math.min(visitor.totalVisits / 10, 0.2);
  
  // Touchpoint analysis
  const touchpointCount = touchpoints.length;
  const touchpointFactor = Math.min(touchpointCount / 20, 0.15);
  
  // Time-based factors (use correct field name)
  const daysSinceFirstVisit = Math.max(0, (Date.now() - visitor.firstVisit.getTime()) / (1000 * 60 * 60 * 24));
  const recencyFactor = Math.min(1 / (daysSinceFirstVisit + 1), 0.15);
  
  // Combine factors for final prediction
  const conversionProbability = 
    engagementFactor + 
    visitCountFactor + 
    touchpointFactor + 
    recencyFactor;
  
  // Ensure probability is between 0-1
  return Math.min(Math.max(conversionProbability, 0), 1);
} 