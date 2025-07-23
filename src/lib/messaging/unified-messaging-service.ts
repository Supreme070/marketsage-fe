/**
 * Unified Messaging Service
 * 
 * Handles both customer-managed and platform-managed messaging across all channels
 */

import prisma from '@/lib/db/prisma';
import { smsService } from '@/lib/sms-providers/sms-service';
import { emailService } from '@/lib/email-providers/email-service';
import { whatsappService } from '@/lib/whatsapp-service';
import { MasterAccountManager, masterAccountsConfig } from '@/lib/config/master-accounts';
import { providerOptimizationEngine } from '@/lib/messaging/provider-optimization-engine';
import { logger } from '@/lib/logger';

export interface UnifiedMessageResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  cost?: number;
  credits?: number;
  error?: {
    message: string;
    code?: string;
  };
}

export interface MessageRequest {
  to: string;
  content: string;
  channel: 'sms' | 'email' | 'whatsapp';
  organizationId: string;
  campaignId?: string;
  contactId?: string;
  metadata?: Record<string, any>;
}

export interface OrganizationMessagingConfig {
  messagingModel: 'customer_managed' | 'platform_managed';
  creditBalance: number;
  autoTopUp: boolean;
  autoTopUpAmount: number;
  autoTopUpThreshold: number;
  preferredProviders: {
    sms?: string;
    email?: string;
    whatsapp?: string;
  };
  region: string;
}

export class UnifiedMessagingService {
  
  /**
   * Send a message through the unified service
   */
  async sendMessage(request: MessageRequest): Promise<UnifiedMessageResult> {
    try {
      // Get organization's messaging configuration
      const orgConfig = await this.getOrganizationConfig(request.organizationId);
      
      if (orgConfig.messagingModel === 'customer_managed') {
        return await this.sendViaCustomerManagedAPI(request);
      } else {
        return await this.sendViaPlatformManagedAPI(request, orgConfig);
      }
    } catch (error) {
      logger.error('Unified messaging service error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'UNIFIED_MESSAGING_ERROR'
        }
      };
    }
  }
  
  /**
   * Send message using customer's own API credentials
   */
  private async sendViaCustomerManagedAPI(request: MessageRequest): Promise<UnifiedMessageResult> {
    const { channel, to, content, organizationId } = request;
    
    switch (channel) {
      case 'sms':
        const smsResult = await smsService.sendSMS(to, content, organizationId);
        return {
          success: smsResult.success,
          messageId: smsResult.messageId,
          provider: smsService.getProviderName(),
          cost: 0, // Customer pays provider directly
          credits: 0,
          error: smsResult.error
        };
        
      case 'email':
        const emailResult = await emailService.sendEmail(organizationId, {
          to: to,
          from: 'noreply@marketsage.africa',
          subject: 'Message from MarketSage',
          html: content,
          text: content.replace(/<[^>]*>/g, '') // Strip HTML for text version
        });
        return {
          success: emailResult.success,
          messageId: emailResult.messageId,
          provider: (emailResult as any).provider || 'email',
          cost: 0, // Customer pays provider directly
          credits: 0,
          error: emailResult.error
        };
        
      case 'whatsapp':
        const whatsappResult = await whatsappService.sendTextMessage(to, content, organizationId);
        return {
          success: whatsappResult.success,
          messageId: whatsappResult.messageId,
          provider: 'whatsapp-business',
          cost: 0, // Customer pays provider directly
          credits: 0,
          error: whatsappResult.error
        };
        
      default:
        return {
          success: false,
          error: { message: 'Unsupported channel', code: 'UNSUPPORTED_CHANNEL' }
        };
    }
  }
  
  /**
   * Send message using platform's master API accounts
   */
  private async sendViaPlatformManagedAPI(
    request: MessageRequest,
    orgConfig: OrganizationMessagingConfig
  ): Promise<UnifiedMessageResult> {
    const { channel, to, content, organizationId } = request;
    
    // Check if organization has enough credits
    const creditCost = await this.calculateCreditCost(channel, 1, orgConfig.region);
    
    if (orgConfig.creditBalance < creditCost) {
      // Try auto top-up if enabled
      if (orgConfig.autoTopUp && orgConfig.creditBalance < orgConfig.autoTopUpThreshold) {
        const topUpSuccess = await this.autoTopUpCredits(organizationId, orgConfig.autoTopUpAmount);
        if (!topUpSuccess) {
          return {
            success: false,
            error: {
              message: 'Insufficient credits and auto top-up failed',
              code: 'INSUFFICIENT_CREDITS'
            }
          };
        }
      } else {
        return {
          success: false,
          error: {
            message: 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS'
          }
        };
      }
    }
    
    // Use provider optimization engine to get the best provider
    let masterAccount;
    try {
      const optimization = await providerOptimizationEngine.optimizeProvider({
        channel,
        messageCount: 1,
        region: orgConfig.region,
        priority: 'balanced',
        organizationId
      });
      
      // Get the master account for the recommended provider
      const channelAccounts = masterAccountsConfig[channel];
      const recommendedProvider = channelAccounts[optimization.recommendedProvider as keyof typeof channelAccounts];
      
      if (recommendedProvider?.isActive) {
        masterAccount = recommendedProvider;
      } else {
        // Fallback to default selection
        masterAccount = MasterAccountManager.getBestMasterAccount(channel, orgConfig.region);
      }
    } catch (error) {
      logger.warn('Provider optimization failed, using fallback:', error);
      masterAccount = MasterAccountManager.getBestMasterAccount(channel, orgConfig.region);
    }
    
    if (!masterAccount) {
      return {
        success: false,
        error: {
          message: 'No master account available for this channel',
          code: 'NO_MASTER_ACCOUNT'
        }
      };
    }
    
    // Send the message
    const result = await this.sendViaMasterAccount(masterAccount, request);
    
    if (result.success) {
      // Deduct credits from organization
      await this.deductCredits(organizationId, creditCost);
      
      // Log usage for analytics
      await this.logUsage(organizationId, channel, 1, creditCost, masterAccount.provider);
      
      return {
        ...result,
        cost: creditCost,
        credits: creditCost
      };
    }
    
    return result;
  }
  

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    try {
      const crypto = require('crypto');
      const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      return encryptedText; // Return as-is if decryption fails
    }
  }

  /**
   * Send message using a specific master account
   */
  private async sendViaMasterAccount(
    masterAccount: any,
    request: MessageRequest
  ): Promise<UnifiedMessageResult> {
    const { channel, to, content } = request;
    
    try {
      switch (channel) {
        case 'sms':
          return await this.sendSMSViaMaster(masterAccount, to, content);
          
        case 'email':
          return await this.sendEmailViaMaster(masterAccount, to, content);
          
        case 'whatsapp':
          return await this.sendWhatsAppViaMaster(masterAccount, to, content);
          
        default:
          return {
            success: false,
            error: { message: 'Unsupported channel', code: 'UNSUPPORTED_CHANNEL' }
          };
      }
    } catch (error) {
      logger.error(`Master account send error (${masterAccount.provider}):`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Master account send failed',
          code: 'MASTER_ACCOUNT_ERROR'
        }
      };
    }
  }
  
  /**
   * Send SMS via master account
   */
  private async sendSMSViaMaster(masterAccount: any, to: string, content: string): Promise<UnifiedMessageResult> {
    const { provider } = masterAccount;
    
    switch (provider) {
      case 'twilio':
        const TwilioSMSProvider = (await import('@/lib/sms-providers/twilio-provider')).TwilioSMSProvider;
        const twilioProvider = new TwilioSMSProvider({
          accountSid: masterAccount.accountId,
          authToken: masterAccount.apiKey,
          fromNumber: masterAccount.fromNumber
        });
        
        const result = await twilioProvider.sendSMS(to, content);
        return {
          success: result.success,
          messageId: result.messageId,
          provider: 'twilio',
          error: result.error
        };
        
      case 'africas-talking':
        // TODO: Implement Africa's Talking master account
        return {
          success: false,
          error: { message: 'Africa\'s Talking master account not implemented', code: 'NOT_IMPLEMENTED' }
        };
        
      case 'termii':
        // TODO: Implement Termii master account
        return {
          success: false,
          error: { message: 'Termii master account not implemented', code: 'NOT_IMPLEMENTED' }
        };
        
      default:
        return {
          success: false,
          error: { message: 'Unsupported SMS provider', code: 'UNSUPPORTED_PROVIDER' }
        };
    }
  }
  
  /**
   * Send email via master account
   */
  private async sendEmailViaMaster(masterAccount: any, to: string, content: string): Promise<UnifiedMessageResult> {
    const { provider } = masterAccount;
    
    try {
      const { createMasterEmailProvider } = await import('@/lib/email-providers');
      
      const emailProvider = createMasterEmailProvider(provider, {
        apiKey: masterAccount.apiKey,
        domain: masterAccount.domain,
        fromEmail: masterAccount.fromEmail,
      });

      const result = await emailProvider.sendEmail({
        to,
        from: masterAccount.fromEmail || 'noreply@marketsage.africa',
        subject: 'MarketSage Notification',
        html: content,
        text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });

      return {
        success: result.success,
        messageId: result.messageId,
        provider,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Email send failed',
          code: 'EMAIL_SEND_ERROR',
        },
      };
    }
  }
  
  /**
   * Send WhatsApp via master account
   */
  private async sendWhatsAppViaMaster(masterAccount: any, to: string, content: string): Promise<UnifiedMessageResult> {
    const { provider } = masterAccount;
    
    try {
      switch (provider) {
        case 'twilio-whatsapp':
          // Use Twilio WhatsApp API
          const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${masterAccount.accountId}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${masterAccount.accountId}:${masterAccount.apiKey}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: `whatsapp:${masterAccount.fromNumber}`,
              To: `whatsapp:${to}`,
              Body: content,
            }),
          });

          if (twilioResponse.ok) {
            const data = await twilioResponse.json();
            return {
              success: true,
              messageId: data.sid,
              provider: 'twilio-whatsapp',
            };
          } else {
            const error = await twilioResponse.json();
            return {
              success: false,
              error: { message: error.message || 'Twilio WhatsApp send failed', code: 'TWILIO_ERROR' }
            };
          }

        case 'whatsapp-business':
          // Use WhatsApp Business API directly
          const cleanPhoneNumber = to.replace(/\D/g, '');
          const formattedPhoneNumber = cleanPhoneNumber.startsWith('234') 
            ? cleanPhoneNumber 
            : '234' + cleanPhoneNumber.replace(/^0/, '');

          const waResponse = await fetch(`https://graph.facebook.com/v21.0/${masterAccount.fromNumber}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${masterAccount.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: formattedPhoneNumber,
              type: 'text',
              text: {
                body: content
              }
            }),
          });

          if (waResponse.ok) {
            const data = await waResponse.json();
            return {
              success: true,
              messageId: data.messages[0]?.id,
              provider: 'whatsapp-business',
            };
          } else {
            const error = await waResponse.json();
            return {
              success: false,
              error: { message: error.error?.message || 'WhatsApp Business send failed', code: 'WHATSAPP_ERROR' }
            };
          }

        default:
          return {
            success: false,
            error: { message: 'Unsupported WhatsApp provider', code: 'UNSUPPORTED_PROVIDER' }
          };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp send failed',
          code: 'WHATSAPP_SEND_ERROR'
        }
      };
    }
  }
  
  /**
   * Get organization's messaging configuration
   */
  private async getOrganizationConfig(organizationId: string): Promise<OrganizationMessagingConfig> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        messagingModel: true,
        creditBalance: true,
        autoTopUp: true,
        autoTopUpAmount: true,
        autoTopUpThreshold: true,
        preferredProviders: true,
        region: true
      }
    });
    
    if (!org) {
      throw new Error('Organization not found');
    }
    
    return {
      messagingModel: org.messagingModel as 'customer_managed' | 'platform_managed' || 'customer_managed',
      creditBalance: org.creditBalance || 0,
      autoTopUp: org.autoTopUp || false,
      autoTopUpAmount: org.autoTopUpAmount || 100,
      autoTopUpThreshold: org.autoTopUpThreshold || 10,
      preferredProviders: org.preferredProviders ? JSON.parse(org.preferredProviders) : {},
      region: org.region || 'us'
    };
  }
  
  /**
   * Calculate credit cost for a message
   */
  private async calculateCreditCost(channel: 'sms' | 'email' | 'whatsapp', messageCount: number, region: string): Promise<number> {
    const { cost } = MasterAccountManager.calculateCost(channel, messageCount, region);
    
    // Apply markup for reselling
    const markup = channel === 'sms' ? 2.5 : channel === 'email' ? 3.0 : 2.0;
    
    return cost * markup;
  }
  
  /**
   * Deduct credits from organization
   */
  private async deductCredits(organizationId: string, credits: number): Promise<void> {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        creditBalance: {
          decrement: credits
        }
      }
    });
  }
  
  /**
   * Auto top-up credits for organization
   */
  private async autoTopUpCredits(organizationId: string, amount: number): Promise<boolean> {
    try {
      // Get organization with user email for payment
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          users: {
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
            take: 1
          }
        }
      });

      if (!org || !org.users.length) {
        logger.error('No admin user found for auto top-up');
        return false;
      }

      const adminUser = org.users[0];
      
      // For auto top-up, we'll create a transaction record for manual processing
      // In a production system, you'd want to use saved payment methods
      const reference = `auto_topup_${organizationId}_${Date.now()}`;
      
      await prisma.creditTransaction.create({
        data: {
          organizationId,
          type: 'purchase',
          amount,
          description: `Auto top-up - $${amount}`,
          paymentMethod: 'auto_topup',
          paymentId: reference,
          status: 'completed', // For now, auto-approve
          metadata: {
            autoTopUp: true,
            triggerDate: new Date().toISOString(),
            adminUserId: adminUser.id,
          },
        },
      });

      // Update organization credit balance
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          creditBalance: {
            increment: amount
          }
        }
      });
      
      logger.info(`Auto top-up successful for organization ${organizationId}: $${amount}`);
      return true;
    } catch (error) {
      logger.error('Auto top-up failed:', error);
      return false;
    }
  }
  
  /**
   * Log usage for analytics
   */
  private async logUsage(
    organizationId: string,
    channel: string,
    messageCount: number,
    credits: number,
    provider: string
  ): Promise<void> {
    try {
      await prisma.messagingUsage.create({
        data: {
          organizationId,
          channel,
          messageCount,
          credits,
          provider,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Usage logging failed:', error);
    }
  }
  
  /**
   * Get organization's credit balance
   */
  async getCreditBalance(organizationId: string): Promise<number> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { creditBalance: true }
    });
    
    return org?.creditBalance || 0;
  }
  
  /**
   * Get usage analytics for organization
   */
  async getUsageAnalytics(organizationId: string, startDate: Date, endDate: Date) {
    const usage = await prisma.messagingUsage.findMany({
      where: {
        organizationId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    const summary = usage.reduce((acc, item) => {
      const key = item.channel;
      if (!acc[key]) {
        acc[key] = { messages: 0, credits: 0 };
      }
      acc[key].messages += item.messageCount;
      acc[key].credits += item.credits;
      return acc;
    }, {} as Record<string, { messages: number; credits: number }>);
    
    return { usage, summary };
  }
  
  /**
   * Switch organization's messaging model
   */
  async switchMessagingModel(
    organizationId: string,
    newModel: 'customer_managed' | 'platform_managed'
  ): Promise<void> {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { messagingModel: newModel }
    });
  }
  
  /**
   * Bulk send messages
   */
  async bulkSendMessages(requests: MessageRequest[]): Promise<UnifiedMessageResult[]> {
    const results: UnifiedMessageResult[] = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(request => this.sendMessage(request))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
}

// Export singleton instance
export const unifiedMessagingService = new UnifiedMessagingService();