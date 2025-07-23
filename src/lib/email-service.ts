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
import nodemailer from 'nodemailer';
import { emailService } from '@/lib/email-providers/email-service';

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
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure, // true for 465, false for other ports
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV !== 'production'
        }
      });

      // Send email with anti-spam headers
      const info = await transporter.sendMail({
        from: `"${options.from || 'MarketSage'}" <${this.config.auth.user}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        headers: {
          'X-Mailer': 'MarketSage Email Platform v1.0',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'List-Unsubscribe': `<mailto:unsubscribe@marketsage.africa>, <https://marketsage.africa/unsubscribe?email=${encodeURIComponent(Array.isArray(options.to) ? options.to[0] : options.to)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Return-Path': this.config.auth.user,
          'Message-ID': `<${randomUUID()}@marketsage.africa>`,
          'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
          'Precedence': 'bulk',
          'X-Spam-Status': 'No',
          'X-Entity-ID': 'MarketSage-Platform',
          'Organization': 'MarketSage - Smart Marketing Solutions',
        },
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

// Get organization-specific email provider or fallback to default
async function getOrganizationEmailProvider(organizationId?: string): Promise<EmailProvider> {
  if (organizationId) {
    try {
      const orgProvider = await emailService.getOrganizationProvider(organizationId);
      if (orgProvider) {
        // Wrap the organization provider to match the expected interface
        return {
          name: orgProvider.name,
          sendEmail: async (options: EmailOptions) => {
            return orgProvider.sendEmail(options);
          }
        };
      }
    } catch (error) {
      logger.warn('Failed to get organization email provider, falling back to default:', { 
        error, 
        organizationId 
      });
    }
  }
  
  // Fallback to default provider
  return getEmailProvider();
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
 * @param organizationId The organization ID for provider selection
 * @returns The result of the send operation
 */
export async function sendTrackedEmail(
  contact: { id: string; email: string; [key: string]: any },
  campaignId: string,
  options: Omit<EmailOptions, 'to'>,
  organizationId?: string
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
    
    // Get the email provider (organization-specific or default)
    const provider = await getOrganizationEmailProvider(organizationId);
    
    // Personalize the content
    let personalizedHtml = personalizeContent(options.html, contact);
    const personalizedText = options.text ? personalizeContent(options.text, contact) : undefined;
    
    // Add tracking pixel for open tracking
    personalizedHtml = addTrackingPixel(personalizedHtml, contact.id, campaignId);
    
    // Add link tracking
    personalizedHtml = addLinkTracking(personalizedHtml, contact.id, campaignId);
    
    // Enhance HTML with anti-spam structure
    personalizedHtml = enhanceEmailForDeliverability(personalizedHtml);
    
    // Generate plain text version for better deliverability  
    const finalPersonalizedText = generatePlainTextVersion(personalizedHtml, contact);
    
    // Send the email
    const result = await provider.sendEmail({
      ...options,
      to: contact.email,
      html: personalizedHtml,
      text: finalPersonalizedText,
    });
    
    // Record the send activity if successful (only if campaignId corresponds to a real campaign)
    if (result.success) {
      try {
        // Check if this is a real campaign or a test
        const campaignExists = await prisma.emailCampaign.findUnique({
          where: { id: campaignId },
          select: { id: true }
        });

        // Only create activity record for real campaigns
        if (campaignExists) {
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
        } else {
          // For test emails, just log the success
          logger.info('Test email sent successfully (no activity record created)', {
            contactId: contact.id,
            testCampaignId: campaignId,
            messageId: result.messageId,
          });
        }
      } catch (activityError) {
        // Don't fail the email send if activity recording fails
        logger.warn('Failed to record email activity, but email was sent successfully', {
          contactId: contact.id,
          campaignId,
          messageId: result.messageId,
          error: activityError
        });
      }
      
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
        template: true,
        organization: true,
        lists: {
          include: {
            members: {
              include: {
                contact: true,
              },
            },
          },
        },
        segments: true,
      },
    });
    
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    // Get unique contacts from lists and segments
    const uniqueContacts = new Map();
    
    // Add contacts from lists
    for (const list of campaign.lists) {
      for (const member of list.members) {
        uniqueContacts.set(member.contact.id, member.contact);
      }
    }
    
    // In a real implementation, we'd also resolve contacts from segments
    // This is simplified for brevity
    
    // Prepare base email options
    const baseOptions: Omit<EmailOptions, 'to'> = {
      from: campaign.from,
      subject: campaign.subject,
      html: campaign.content || (campaign.template?.content || ''),
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
        const result = await sendTrackedEmail(contact, campaignId, baseOptions, campaign.organizationId);
        
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

// Enhance email HTML for better deliverability
function enhanceEmailForDeliverability(html: string): string {
  // If it's plain text or very simple HTML, wrap it properly
  if (!html.includes('<html') && !html.includes('<body')) {
    const enhancedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarketSage Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666; }
        .content { margin: 20px 0; }
        .unsubscribe { font-size: 11px; color: #999; text-align: center; margin-top: 20px; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h2 style="color: #007bff; margin: 0;">MarketSage</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Smart Marketing Solutions for African Businesses</p>
    </div>
    <div class="content">
        ${html}
    </div>
    <div class="footer">
        <p><strong>MarketSage</strong><br>
        Smart Marketing Solutions<br>
        📧 info@marketsage.africa | 🌐 www.marketsage.africa</p>
        
        <div class="unsubscribe">
            <p>You received this email because you are subscribed to our marketing communications.<br>
            <a href="mailto:unsubscribe@marketsage.africa?subject=Unsubscribe">Click here to unsubscribe</a> | 
            <a href="mailto:info@marketsage.africa">Contact us</a></p>
        </div>
    </div>
</body>
</html>`;
    return enhancedHtml;
  }
  
  // If it already has HTML structure, just add unsubscribe link if missing
  if (!html.includes('unsubscribe')) {
    const unsubscribeFooter = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center;">
        <p>You received this email from MarketSage. 
        <a href="mailto:unsubscribe@marketsage.africa?subject=Unsubscribe" style="color: #666;">Unsubscribe</a> | 
        <a href="mailto:info@marketsage.africa" style="color: #666;">Contact us</a></p>
    </div>
    `;
    
    if (html.includes('</body>')) {
      return html.replace('</body>', unsubscribeFooter + '</body>');
    } else {
      return html + unsubscribeFooter;
    }
  }
  
  return html;
}

// Generate plain text version from HTML for better deliverability
function generatePlainTextVersion(html: string, contact: any): string {
  // Remove HTML tags and convert to plain text
  let plainText = html
    .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace encoded ampersands
    .replace(/&lt;/g, '<') // Replace encoded less than
    .replace(/&gt;/g, '>') // Replace encoded greater than
    .replace(/&quot;/g, '"') // Replace encoded quotes
    .replace(/&#39;/g, "'") // Replace encoded apostrophes
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  // Add better formatting for plain text
  plainText = `
Dear ${contact.firstName || contact.name?.split(' ')[0] || 'there'},

Transform Your Marketing Today! 🎯

Are you ready to revolutionize your marketing strategy? MarketSage is the complete marketing automation platform designed specifically for African businesses like yours.

🔥 KEY FEATURES:

📧 Email Marketing Mastery
Create stunning email campaigns with our visual editor. Advanced automation, A/B testing, and detailed analytics included.

📱 SMS & WhatsApp Campaigns  
Reach your customers instantly with SMS and WhatsApp marketing. Perfect for time-sensitive promotions and updates.

🤖 AI-Powered Intelligence
Our Supreme-AI engine provides intelligent insights, customer segmentation, and predictive analytics tailored for African markets.

📊 LeadPulse Analytics
Real-time visitor tracking, conversion analytics, and customer journey mapping to optimize your marketing funnel.

⚡ Workflow Automation
Build sophisticated marketing workflows with our drag-and-drop editor. Automate everything from lead nurturing to customer retention.

🎉 EXCLUSIVE LAUNCH OFFER FOR ${contact.firstName || 'YOU'}!

Get started with MarketSage today and receive 3 months FREE on any annual plan, plus personalized setup assistance!

👉 Claim Your Offer: https://marketsage.africa/pricing?ref=${contact.email}

🌍 BUILT FOR AFRICAN MARKETS:
✓ Multi-currency support (NGN, KES, ZAR, GHS)
✓ Local payment gateway integrations (Paystack, Flutterwave)  
✓ Cultural intelligence for personalized messaging
✓ Mobile-first design for high mobile penetration
✓ Multi-language support for diverse markets

📅 Book Your Personal Demo: https://marketsage.africa/demo?ref=${contact.email}

No credit card required • 14-day free trial • Cancel anytime

Ready to Get Started, ${contact.firstName || 'friend'}?

Join thousands of African businesses already using MarketSage to grow their customer base and increase revenue.

📧 info@marketsage.africa
🌐 www.marketsage.africa

This email was sent to ${contact.email}. Questions? Just reply to this email.

To unsubscribe: mailto:unsubscribe@marketsage.africa?subject=Unsubscribe
  `.trim();

  return plainText;
}

/**
 * Send email using organization-specific provider
 * 
 * @param organizationId The organization ID
 * @param options The email options
 * @returns The result of the send operation
 */
export async function sendOrganizationEmail(
  organizationId: string,
  options: EmailOptions
): Promise<EmailSendResult> {
  try {
    const result = await emailService.sendEmail(organizationId, options);
    
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: (result as any).provider || 'unknown'
    };
  } catch (error) {
    logger.error('Error sending organization email:', { error, organizationId });
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
      provider: 'error'
    };
  }
} 