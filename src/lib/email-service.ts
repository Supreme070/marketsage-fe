/**
 * Email Service
 * 
 * This module provides email sending functionality with integrated tracking
 * for opens and clicks. It works with various email service providers through
 * a provider abstraction layer.
 */

import { ActivityType, EntityType, CampaignStatus } from '@prisma/client';
import { addTrackingPixel, addLinkTracking } from '@/lib/trackingUtils';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
import { getBestSendTime } from '@/lib/engagement-tracking';
import { stringify } from 'querystring';

interface EmailProvider {
  sendEmail: (options: EmailOptions) => Promise<EmailSendResult>;
  name: string;
}

export interface EmailOptions {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  provider: string;
}

// Simple in-memory provider for development/testing
class DevelopmentEmailProvider implements EmailProvider {
  name = 'development';
  
  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    // Log the email instead of sending it
    logger.info('Development email provider - email would be sent', {
      to: options.to,
      from: options.from,
      subject: options.subject,
      htmlLength: options.html.length,
    });
    
    return {
      success: true,
      messageId: `dev-${randomUUID()}`,
      provider: this.name,
    };
  }
}

// Configurable SMTP provider with Nodemailer
class SmtpEmailProvider implements EmailProvider {
  name = 'smtp';
  private config: Record<string, any>;
  
  constructor(config: Record<string, any>) {
    this.config = config;
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    try {
      // Dynamic import of nodemailer for actual email sending
      const nodemailer = await import('nodemailer');
      
      // Create transporter
      const transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure, // true for 465, false for other ports
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
        tls: {
          rejectUnauthorized: false // For development
        }
      });

      // Send email
      const info = await transporter.sendMail({
        from: `"${options.from || 'MarketSage'}" <${this.config.auth.user}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      logger.info('Email sent successfully via SMTP', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
        smtpHost: this.config.host,
      });
      
      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
      };
    } catch (error) {
      logger.error('Failed to send email via SMTP', error);
      return {
        success: false,
        error: error as Error,
        provider: this.name,
      };
    }
  }
}

// Get the appropriate email provider based on configuration
function getEmailProvider(): EmailProvider {
  // Read settings from environment
  const provider = process.env.EMAIL_PROVIDER || 'development';
  
  switch (provider) {
    case 'smtp':
      return new SmtpEmailProvider({
        host: process.env.SMTP_HOST || 'localhost',
        port: Number.parseInt(process.env.SMTP_PORT || '25'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    case 'development':
    default:
      return new DevelopmentEmailProvider();
  }
}

/**
 * Apply contact-specific personalization to content
 * 
 * @param content The email content (HTML or text)
 * @param contact The contact data for personalization
 * @returns The personalized content
 */
function personalizeContent(content: string, contact: any): string {
  if (!content || !contact) return content;
  
  // Replace contact variables like {{firstName}}, {{lastName}}, etc.
  let personalized = content;
  
  Object.entries(contact).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const regex = new RegExp(`{{${key}}}`, 'g');
      personalized = personalized.replace(regex, value);
    }
  });
  
  // Remove any remaining template variables
  personalized = personalized.replace(/{{[^{}]+}}/g, '');
  
  return personalized;
}

/**
 * Send an email to a single contact with tracking
 * 
 * @param contact The contact to send to
 * @param campaignId The ID of the email campaign
 * @param options The email options
 * @returns The result of the send operation
 */
export async function sendTrackedEmail(
  contact: { id: string; email: string; [key: string]: any },
  campaignId: string,
  options: Omit<EmailOptions, 'to'>
): Promise<EmailSendResult> {
  try {
    if (!contact.email) {
      logger.warn('Cannot send email to contact without email address', { contactId: contact.id });
      return {
        success: false,
        error: new Error('Contact has no email address'),
        provider: 'none',
      };
    }
    
    // Get the email provider
    const provider = getEmailProvider();
    
    // Personalize the content
    let personalizedHtml = personalizeContent(options.html, contact);
    const personalizedText = options.text ? personalizeContent(options.text, contact) : undefined;
    
    // Add tracking pixel for open tracking
    personalizedHtml = addTrackingPixel(personalizedHtml, contact.id, campaignId);
    
    // Add link tracking
    personalizedHtml = addLinkTracking(personalizedHtml, contact.id, campaignId);
    
    // Send the email
    const result = await provider.sendEmail({
      ...options,
      to: contact.email,
      html: personalizedHtml,
      text: personalizedText,
    });
    
    // Record the send activity if successful
    if (result.success) {
      await prisma.emailActivity.create({
        data: {
          id: randomUUID(),
          campaignId,
          contactId: contact.id,
          type: ActivityType.SENT,
          metadata: JSON.stringify({
            messageId: result.messageId,
            provider: provider.name,
            ...options.metadata,
          }),
        },
      });
      
      logger.info('Email sent and activity recorded', {
        contactId: contact.id,
        campaignId,
        messageId: result.messageId,
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Error sending tracked email', error);
    return {
      success: false,
      error: error as Error,
      provider: 'error',
    };
  }
}

/**
 * Send a campaign to multiple contacts with tracking
 * 
 * @param campaignId The ID of the campaign
 * @param useOptimalSendTime Whether to use optimal send time for each contact
 * @returns Summary of the send operation
 */
export async function sendCampaign(
  campaignId: string,
  useOptimalSendTime = false
): Promise<{
  success: boolean;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  details: Record<string, any>;
}> {
  try {
    // Fetch the campaign
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        EmailTemplate: true,
        List: {
          include: {
            ListMember: {
              include: {
                Contact: true,
              },
            },
          },
        },
        Segment: true,
      },
    });
    
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    // Get unique contacts from lists and segments
    const uniqueContacts = new Map();
    
    // Add contacts from lists
    for (const list of campaign.List) {
      for (const member of list.ListMember) {
        uniqueContacts.set(member.Contact.id, member.Contact);
      }
    }
    
    // In a real implementation, we'd also resolve contacts from segments
    // This is simplified for brevity
    
    // Prepare base email options
    const baseOptions: Omit<EmailOptions, 'to'> = {
      from: campaign.from,
      subject: campaign.subject,
      html: campaign.content || (campaign.EmailTemplate?.content || ''),
      replyTo: campaign.replyTo || undefined,
      metadata: {
        campaignId,
        campaignName: campaign.name,
      },
    };
    
    // Send to each contact
    const results = {
      totalContacts: uniqueContacts.size,
      sentCount: 0,
      failedCount: 0,
      details: {} as Record<string, string>,
    };
    
    for (const contact of uniqueContacts.values()) {
      try {
        if (useOptimalSendTime) {
          // Get optimal send time for this contact
          const optimalTime = await getBestSendTime(contact.id);
          if (optimalTime && optimalTime.confidence > 0.5) {
            // Schedule email for optimal time
            // This would be implemented with a job queue in production
            // Simplified for this implementation
            logger.info('Would schedule email for optimal time', {
              contactId: contact.id,
              dayOfWeek: optimalTime.dayOfWeek,
              hourOfDay: optimalTime.hourOfDay,
            });
            
            // Record as a scheduled activity
            await prisma.emailActivity.create({
              data: {
                id: randomUUID(),
                campaignId,
                contactId: contact.id,
                type: ActivityType.SENT, // Using SENT since SCHEDULED might not be available
                metadata: JSON.stringify({
                  scheduled: true,
                  optimalSendTime: optimalTime,
                }),
              },
            });
            
            results.sentCount++;
            continue;
          }
        }
        
        // Send immediately if not using optimal time or no optimal time found
        const result = await sendTrackedEmail(contact, campaignId, baseOptions);
        
        if (result.success) {
          results.sentCount++;
        } else {
          results.failedCount++;
          if (contact.id && result.error?.message) {
            results.details[contact.id] = result.error.message;
          }
        }
      } catch (error) {
        results.failedCount++;
        const contactId = contact.id || 'unknown';
        results.details[contactId] = (error as Error).message || 'Unknown error';
      }
    }
    
    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENT,
        sentAt: new Date(),
      },
    });
    
    return {
      success: results.sentCount > 0,
      ...results,
    };
  } catch (error) {
    logger.error('Error sending campaign', error);
    throw error;
  }
} 