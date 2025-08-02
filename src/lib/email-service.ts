/**
 * Email Service
 * 
 * This module provides email sending functionality with integrated tracking
 * for opens and clicks. It works with the API client to communicate with
 * the backend email service.
 */

import { apiClient } from '@/lib/api-client';
import type {
  EmailOptions,
  EmailSendResult,
  CampaignSendResult,
  ContactInfo,
} from '@/lib/api/types/communications';
import { logger } from '@/lib/logger';
import { addTrackingPixel, addLinkTracking } from '@/lib/trackingUtils';
import { randomUUID } from 'crypto';

// Re-export types from API client for backward compatibility
export type {
  EmailOptions,
  EmailAttachment,
  EmailSendResult,
  CampaignSendResult,
} from '@/lib/api/types/communications';

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
  contact: ContactInfo,
  campaignId: string,
  options: Omit<EmailOptions, 'to'>,
  organizationId?: string
): Promise<EmailSendResult> {
  try {
    if (!contact.email) {
      logger.warn('Cannot send email to contact without email address', { 
        contactId: contact.id 
      });
      return {
        success: false,
        error: new Error('Contact has no email address'),
        provider: 'none',
      };
    }
    
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
    const finalPersonalizedText = personalizedText || generatePlainTextVersion(personalizedHtml, contact);
    
    // Send the email via API client
    const result = await apiClient.communications.sendEmail(
      contact,
      campaignId,
      {
        ...options,
        html: personalizedHtml,
        text: finalPersonalizedText,
      },
      organizationId
    );
    
    if (result.success) {
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
): Promise<CampaignSendResult> {
  try {
    // Send the campaign via API client
    const result = await apiClient.communications.sendCampaign({
      campaignId,
      useOptimalSendTime,
    });
    
    return result;
  } catch (error) {
    logger.error('Error sending campaign', error);
    throw error;
  }
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
    const result = await apiClient.communications.sendOrganizationEmail(
      organizationId,
      options
    );
    
    return result;
  } catch (error) {
    logger.error('Error sending organization email:', { error, organizationId });
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
      provider: 'error'
    };
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