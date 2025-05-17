/**
 * LeadPulse Visitor Tracking Utilities
 * 
 * This module provides functionality for anonymous visitor tracking,
 * browser fingerprinting, and user behavior analysis.
 */

import { randomUUID } from 'crypto';
import prisma from '@/lib/db/prisma';

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
  const existingVisitor = await prisma.anonymousVisitor.findUnique({
    where: { fingerprint }
  });
  
  if (existingVisitor) {
    // Update existing visitor
    return prisma.anonymousVisitor.update({
      where: { id: existingVisitor.id },
      data: {
        lastVisitedAt: new Date(),
        visits: { increment: 1 },
        ipAddress,
        ...metadata
      }
    });
  } else {
    // Create new visitor
    return prisma.anonymousVisitor.create({
      data: {
        id: randomUUID(),
        fingerprint,
        ipAddress,
        conversionStatus: ConversionStatus.ANONYMOUS,
        engagementScore: 0,
        ...metadata,
        metadata: metadata
      }
    });
  }
}

/**
 * Record a visitor touchpoint (page view, interaction, etc.)
 * 
 * @param visitorId - Anonymous visitor ID
 * @param pageUrl - URL of the page
 * @param touchpointData - Additional data about the interaction
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
    [key: string]: any;
  } = {}
) {
  return prisma.leadPulseTouchpoint.create({
    data: {
      id: randomUUID(),
      visitorId,
      pageUrl,
      timestamp: new Date(),
      ...touchpointData
    }
  });
}

/**
 * Update a visitor's engagement score based on behavior
 * 
 * @param visitorId - Anonymous visitor ID
 * @param action - The action taken by the visitor
 * @param weight - Importance weight of the action
 * @returns The updated visitor record
 */
export async function updateVisitorEngagement(
  visitorId: string,
  action: 'PAGE_VIEW' | 'FORM_VIEW' | 'FORM_START' | 'FORM_SUBMIT' | 'CTA_CLICK' | 'RETURN_VISIT' | 'TIME_ON_PAGE' | 'SCROLL_DEPTH',
  weight: number = 1
) {
  // Define base scores for different actions
  const actionScores: Record<string, number> = {
    PAGE_VIEW: 1,
    FORM_VIEW: 2,
    FORM_START: 5,
    FORM_SUBMIT: 10,
    CTA_CLICK: 3,
    RETURN_VISIT: 2,
    TIME_ON_PAGE: 0.1, // Per minute
    SCROLL_DEPTH: 0.05 // Per percentage point
  };
  
  // Calculate score increment
  const scoreIncrement = actionScores[action] * weight;
  
  // Update visitor engagement score
  return prisma.anonymousVisitor.update({
    where: { id: visitorId },
    data: {
      engagementScore: {
        increment: scoreIncrement
      },
      // If score is high enough, update conversion status
      ...(scoreIncrement >= 5 && {
        conversionStatus: ConversionStatus.ENGAGED
      })
    }
  });
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
  const visitor = await prisma.anonymousVisitor.findUnique({
    where: { id: visitorId }
  });
  
  if (!visitor) {
    throw new Error(`Visitor not found: ${visitorId}`);
  }
  
  // Create or update contact
  const contactId = randomUUID();
  const contact = await prisma.contact.create({
    data: {
      id: contactId,
      email: contactData.email,
      phone: contactData.phone,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      company: contactData.company,
      source: 'LeadPulse',
      createdAt: new Date(),
      updatedAt: new Date(),
      // This assumes a system user or requires a user ID to be provided
      createdById: process.env.SYSTEM_USER_ID || 'default-user-id',
    }
  });
  
  // Update visitor with contact ID and conversion status
  const updatedVisitor = await prisma.anonymousVisitor.update({
    where: { id: visitorId },
    data: {
      contactId: contact.id,
      conversionStatus: ConversionStatus.CONVERTED,
      convertedAt: new Date()
    }
  });
  
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
  const visitor = await prisma.anonymousVisitor.findUnique({
    where: { id: visitorId }
  });
  
  if (!visitor) {
    throw new Error(`Visitor not found: ${visitorId}`);
  }
  
  // Get all touchpoints for this visitor
  const touchpoints = await prisma.leadPulseTouchpoint.findMany({
    where: { visitorId },
    orderBy: { timestamp: 'asc' }
  });
  
  // Get contact data if visitor has been converted
  const contact = visitor.contactId ? await prisma.contact.findUnique({
    where: { id: visitor.contactId }
  }) : null;
  
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
  const visitCountFactor = Math.min(visitor.visits / 10, 0.2);
  
  // Touchpoint analysis
  const touchpointCount = touchpoints.length;
  const touchpointFactor = Math.min(touchpointCount / 20, 0.15);
  
  // Time-based factors
  const daysSinceFirstVisit = Math.max(0, (Date.now() - visitor.firstVisitedAt.getTime()) / (1000 * 60 * 60 * 24));
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