/**
 * External Services MCP Server for MarketSage
 * 
 * This server provides standardized access to external messaging services
 * including SMS, Email, and WhatsApp through the MCP protocol.
 */

import { z } from 'zod';
import { BaseMCPServer } from './base-mcp-server';
import { 
  type MCPAuthContext, 
  type MCPServerConfig,
  SendMessageSchema,
  SendMessageRequest,
  type MessageResult,
  MCPAuthorizationError,
  MCPValidationError
} from '../types/mcp-types';

import { defaultMCPConfig } from '../config/mcp-config';
import { logger } from '../../lib/logger';

// Import existing service implementations
import { sendTrackedEmail } from '../../lib/email-service';
import { sendSMS, smsService } from '../../lib/sms-service';
import { sendWhatsAppMessage } from '../../lib/whatsapp-service';
import { prisma } from '../../lib/db/prisma';

export class ExternalServicesMCPServer extends BaseMCPServer {
  constructor(config?: Partial<MCPServerConfig>) {
    super({
      ...defaultMCPConfig.servers.services,
      ...config
    });
  }

  /**
   * List available external service resources
   */
  protected async listResources(authContext: MCPAuthContext): Promise<any[]> {
    const resources = [
      {
        uri: "services://email",
        name: "Email Services",
        description: "Access to email sending and template management",
        mimeType: "application/json"
      },
      {
        uri: "services://sms",
        name: "SMS Services", 
        description: "Access to SMS sending and provider management",
        mimeType: "application/json"
      },
      {
        uri: "services://whatsapp",
        name: "WhatsApp Services",
        description: "Access to WhatsApp Business API messaging",
        mimeType: "application/json"
      },
      {
        uri: "services://templates",
        name: "Message Templates",
        description: "Access to message templates across all channels",
        mimeType: "application/json"
      },
      {
        uri: "services://providers",
        name: "Service Providers",
        description: "Access to external service provider configurations",
        mimeType: "application/json"
      }
    ];

    // Filter resources based on permissions
    if (!authContext.permissions.includes('*') && !authContext.permissions.includes('write:org')) {
      // Users with limited permissions can only view templates and provider status
      return resources.filter(r => r.uri.includes('templates') || r.uri.includes('providers'));
    }

    return resources;
  }

  /**
   * Read external service resource
   */
  protected async readResource(uri: string, authContext: MCPAuthContext): Promise<any> {
    const url = new URL(uri);
    const path = url.pathname;
    const searchParams = url.searchParams;

    // Parse query parameters
    const queryParams = Object.fromEntries(searchParams.entries());

    switch (path) {
      case '/email':
        return await this.getEmailServiceInfo(queryParams, authContext);
      case '/sms':
        return await this.getSMSServiceInfo(queryParams, authContext);
      case '/whatsapp':
        return await this.getWhatsAppServiceInfo(queryParams, authContext);
      case '/templates':
        return await this.getMessageTemplates(queryParams, authContext);
      case '/providers':
        return await this.getProviderStatus(queryParams, authContext);
      default:
        throw new MCPValidationError(`Unknown resource path: ${path}`);
    }
  }

  /**
   * List available external service tools
   */
  protected async listTools(authContext: MCPAuthContext): Promise<any[]> {
    const tools = [
      {
        name: "send_email",
        description: "Send an email message through configured email service",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              format: "email",
              description: "Recipient email address"
            },
            subject: {
              type: "string",
              description: "Email subject line"
            },
            content: {
              type: "string", 
              description: "Email content (HTML or text)"
            },
            templateId: {
              type: "string",
              description: "Optional template ID to use"
            },
            personalization: {
              type: "object",
              description: "Key-value pairs for template personalization"
            }
          },
          required: ["to", "subject", "content"]
        }
      },
      {
        name: "send_sms",
        description: "Send an SMS message through configured SMS provider",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              pattern: "^\\+[1-9]\\d{1,14}$",
              description: "Recipient phone number in international format"
            },
            content: {
              type: "string",
              maxLength: 160,
              description: "SMS message content (max 160 characters)"
            },
            templateId: {
              type: "string",
              description: "Optional SMS template ID"
            },
            provider: {
              type: "string",
              enum: ["africastalking", "twilio", "auto"],
              description: "SMS provider to use",
              default: "auto"
            }
          },
          required: ["to", "content"]
        }
      },
      {
        name: "send_whatsapp",
        description: "Send a WhatsApp message through WhatsApp Business API",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              pattern: "^\\+[1-9]\\d{1,14}$",
              description: "Recipient WhatsApp number in international format"
            },
            content: {
              type: "string",
              description: "WhatsApp message content"
            },
            templateId: {
              type: "string",
              description: "Approved WhatsApp template ID"
            },
            templateParams: {
              type: "array",
              items: { type: "string" },
              description: "Parameters for template placeholders"
            },
            mediaUrl: {
              type: "string",
              format: "uri",
              description: "Optional media attachment URL"
            }
          },
          required: ["to", "content"]
        }
      },
      {
        name: "get_delivery_status",
        description: "Get delivery status for sent messages",
        inputSchema: {
          type: "object",
          properties: {
            messageId: {
              type: "string",
              description: "Message ID to check status for"
            },
            channel: {
              type: "string",
              enum: ["email", "sms", "whatsapp"],
              description: "Message channel"
            }
          },
          required: ["messageId", "channel"]
        }
      },
      {
        name: "get_provider_balance",
        description: "Get remaining balance/credits for service providers",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              enum: ["africastalking", "twilio", "email", "whatsapp"],
              description: "Provider to check balance for"
            }
          },
          required: ["provider"]
        }
      },
      {
        name: "validate_message",
        description: "Validate message content and recipient before sending",
        inputSchema: {
          type: "object",
          properties: {
            channel: {
              type: "string",
              enum: ["email", "sms", "whatsapp"],
              description: "Message channel"
            },
            to: {
              type: "string",
              description: "Recipient address/number"
            },
            content: {
              type: "string",
              description: "Message content to validate"
            }
          },
          required: ["channel", "to", "content"]
        }
      }
    ];

    // Filter tools based on permissions
    if (!authContext.permissions.includes('*') && !authContext.permissions.includes('write:org')) {
      // Users with limited permissions can only validate and check status
      return tools.filter(t => ['get_delivery_status', 'get_provider_balance', 'validate_message'].includes(t.name));
    }

    return tools;
  }

  /**
   * Execute external service tools
   */
  protected async callTool(name: string, args: any, authContext: MCPAuthContext): Promise<any> {
    switch (name) {
      case 'send_email':
        return await this.sendEmailTool(args, authContext);
      case 'send_sms':
        return await this.sendSMSTool(args, authContext);
      case 'send_whatsapp':
        return await this.sendWhatsAppTool(args, authContext);
      case 'get_delivery_status':
        return await this.getDeliveryStatus(args, authContext);
      case 'get_provider_balance':
        return await this.getProviderBalance(args, authContext);
      case 'validate_message':
        return await this.validateMessage(args, authContext);
      default:
        throw new MCPValidationError(`Unknown tool: ${name}`);
    }
  }

  /**
   * Send email tool implementation
   */
  private async sendEmailTool(args: any, authContext: MCPAuthContext): Promise<any> {
    const { to, subject, content, templateId, personalization = {} } = args;

    try {
      logger.info('MCP External Services: Sending email', { 
        to, 
        subject: subject.substring(0, 50),
        templateId,
        userId: authContext.userId 
      });

      // Validate email address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Invalid email address format",
              to
            })
          }],
          isError: true
        };
      }

      // Prepare email data
      const emailData = {
        to,
        subject,
        content,
        templateId,
        personalization,
        organizationId: authContext.organizationId,
        userId: authContext.userId
      };

      // Send email through real email service
      const result = await this.sendEmailWithRealService(emailData);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            meta: {
              timestamp: new Date().toISOString(),
              channel: 'email',
              provider: result.provider || 'unknown'
            }
          })
        }]
      };

    } catch (error) {
      logger.error('MCP External Services: Email sending failed', error);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to send email",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Send SMS tool implementation
   */
  private async sendSMSTool(args: any, authContext: MCPAuthContext): Promise<any> {
    const { to, content, templateId, provider = 'auto' } = args;

    try {
      logger.info('MCP External Services: Sending SMS', { 
        to, 
        contentLength: content.length,
        provider,
        userId: authContext.userId 
      });

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to)) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Invalid phone number format. Use international format (+1234567890)",
              to
            })
          }],
          isError: true
        };
      }

      // Validate content length
      if (content.length > 160) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "SMS content exceeds 160 character limit",
              contentLength: content.length,
              maxLength: 160
            })
          }],
          isError: true
        };
      }

      // Prepare SMS data
      const smsData = {
        to,
        content,
        templateId,
        provider,
        organizationId: authContext.organizationId,
        userId: authContext.userId
      };

      // Send SMS through real SMS service
      const result = await this.sendSMSWithRealService(smsData);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            meta: {
              timestamp: new Date().toISOString(),
              channel: 'sms',
              provider: result.provider || provider,
              cost: result.cost || 0
            }
          })
        }]
      };

    } catch (error) {
      logger.error('MCP External Services: SMS sending failed', error);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to send SMS",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Send WhatsApp tool implementation
   */
  private async sendWhatsAppTool(args: any, authContext: MCPAuthContext): Promise<any> {
    const { to, content, templateId, templateParams = [], mediaUrl } = args;

    try {
      logger.info('MCP External Services: Sending WhatsApp', { 
        to, 
        contentLength: content.length,
        templateId,
        hasMedia: !!mediaUrl,
        userId: authContext.userId 
      });

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to)) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Invalid WhatsApp number format. Use international format (+1234567890)",
              to
            })
          }],
          isError: true
        };
      }

      // Prepare WhatsApp data
      const whatsappData = {
        to,
        content,
        templateId,
        templateParams,
        mediaUrl,
        organizationId: authContext.organizationId,
        userId: authContext.userId
      };

      // Send WhatsApp through real WhatsApp service
      const result = await this.sendWhatsAppWithRealService(whatsappData);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            meta: {
              timestamp: new Date().toISOString(),
              channel: 'whatsapp',
              provider: 'whatsapp_business',
              templateUsed: !!templateId
            }
          })
        }]
      };

    } catch (error) {
      logger.error('MCP External Services: WhatsApp sending failed', error);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to send WhatsApp message",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Get delivery status tool
   */
  private async getDeliveryStatus(args: any, authContext: MCPAuthContext): Promise<any> {
    const { messageId, channel } = args;

    try {
      // Placeholder implementation - would integrate with actual tracking
      const status = {
        messageId,
        channel,
        status: 'delivered',
        timestamp: new Date().toISOString(),
        deliveredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        attempts: 1,
        provider: channel === 'sms' ? 'africastalking' : channel === 'email' ? 'smtp' : 'whatsapp_business'
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: status,
            meta: {
              timestamp: new Date().toISOString(),
              fallbackUsed: true
            }
          })
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to get delivery status",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Get provider balance tool
   */
  private async getProviderBalance(args: any, authContext: MCPAuthContext): Promise<any> {
    const { provider } = args;

    try {
      // Placeholder implementation - would integrate with actual provider APIs
      const balances = {
        africastalking: { balance: 1250.50, currency: 'USD', credits: 2501 },
        twilio: { balance: 890.75, currency: 'USD', credits: 1781 },
        email: { balance: 'unlimited', currency: 'N/A', credits: 'unlimited' },
        whatsapp: { balance: 450.25, currency: 'USD', credits: 900 }
      };

      const balance = balances[provider as keyof typeof balances] || {
        balance: 0,
        currency: 'USD',
        credits: 0,
        error: 'Provider not found'
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              provider,
              ...balance,
              lastUpdated: new Date().toISOString()
            },
            meta: {
              timestamp: new Date().toISOString(),
              fallbackUsed: true
            }
          })
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to get provider balance",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Validate message tool
   */
  private async validateMessage(args: any, authContext: MCPAuthContext): Promise<any> {
    const { channel, to, content } = args;

    try {
      const validation = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[],
        recommendations: [] as string[]
      };

      // Validate based on channel
      switch (channel) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(to)) {
            validation.valid = false;
            validation.errors.push('Invalid email address format');
          }
          if (content.length > 100000) {
            validation.warnings.push('Email content is very large (>100KB)');
          }
          break;

        case 'sms':
          const phoneRegex = /^\+[1-9]\d{1,14}$/;
          if (!phoneRegex.test(to)) {
            validation.valid = false;
            validation.errors.push('Invalid phone number format. Use international format (+1234567890)');
          }
          if (content.length > 160) {
            validation.valid = false;
            validation.errors.push(`SMS content exceeds 160 characters (${content.length} characters)`);
          }
          if (content.length > 70) {
            validation.warnings.push('SMS content is approaching character limit');
          }
          break;

        case 'whatsapp':
          const whatsappRegex = /^\+[1-9]\d{1,14}$/;
          if (!whatsappRegex.test(to)) {
            validation.valid = false;
            validation.errors.push('Invalid WhatsApp number format. Use international format (+1234567890)');
          }
          if (content.length > 4096) {
            validation.warnings.push('WhatsApp message is very long (>4KB)');
          }
          break;

        default:
          validation.valid = false;
          validation.errors.push(`Unsupported channel: ${channel}`);
      }

      // General content validation
      if (content.trim().length === 0) {
        validation.valid = false;
        validation.errors.push('Message content cannot be empty');
      }

      // Add recommendations
      if (validation.valid) {
        validation.recommendations.push('Message is valid and ready to send');
        if (channel === 'sms' && content.length < 100) {
          validation.recommendations.push('Consider adding more context to your SMS message');
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              channel,
              to,
              contentLength: content.length,
              validation
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          })
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to validate message",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Real implementations for external services
   */
  private async sendEmailWithRealService(emailData: any): Promise<MessageResult> {
    try {
      const startTime = Date.now();
      
      // Prepare email options for the real service
      const emailOptions = {
        to: emailData.to,
        from: process.env.EMAIL_FROM || 'noreply@marketsage.ai',
        subject: emailData.subject,
        html: emailData.content,
        text: emailData.content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        metadata: {
          organizationId: emailData.organizationId,
          userId: emailData.userId,
          templateId: emailData.templateId,
          source: 'mcp-external-services'
        }
      };

      // Find or create contact for email tracking
      let contact = await prisma.contact.findFirst({
        where: {
          email: emailData.to,
          organizationId: emailData.organizationId
        }
      });

      if (!contact) {
        // Create a temporary contact for tracking
        contact = await prisma.contact.create({
          data: {
            email: emailData.to,
            organizationId: emailData.organizationId,
            source: 'MCP',
            firstName: '', // Will be extracted from email if possible
            lastName: ''
          }
        });
      }

      // Send through real email service with tracking
      const result = await sendTrackedEmail(
        contact,
        null, // No campaign ID for MCP-sent emails
        {
          subject: emailData.subject,
          html: emailData.content,
          text: emailData.content.replace(/<[^>]*>/g, ''), // Strip HTML
          templateId: emailData.templateId,
          personalization: emailData.personalization
        }
      );
      
      const duration = Date.now() - startTime;

      // Log the email send attempt
      try {
        await prisma.messagingUsage.create({
          data: {
            organizationId: emailData.organizationId,
            channel: 'EMAIL',
            recipient: emailData.to,
            status: result.success ? 'SENT' : 'FAILED',
            cost: 0.01, // Standard email cost
            metadata: {
              provider: result.provider,
              messageId: result.messageId,
              subject: emailData.subject,
              duration,
              source: 'MCP'
            },
            userId: emailData.userId
          }
        });
      } catch (dbError) {
        logger.warn('Failed to log email usage to database', { error: dbError });
      }

      return {
        id: result.messageId || `email_${Date.now()}`,
        status: result.success ? 'SENT' : 'FAILED',
        provider: result.provider,
        cost: 0.01,
        timestamp: new Date().toISOString(),
        error: result.error?.message
      };
    } catch (error) {
      logger.error('Failed to send email via MCP', { error, emailData });
      return {
        id: `email_error_${Date.now()}`,
        status: 'FAILED',
        provider: 'smtp',
        cost: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendSMSWithRealService(smsData: any): Promise<MessageResult> {
    try {
      const startTime = Date.now();
      
      // Send SMS through real SMS service
      const result = await sendSMS({
        to: smsData.to,
        message: smsData.content,
        provider: smsData.provider === 'auto' ? undefined : smsData.provider,
        organizationId: smsData.organizationId
      });
      
      const duration = Date.now() - startTime;

      // Log the SMS send attempt
      try {
        await prisma.messagingUsage.create({
          data: {
            organizationId: smsData.organizationId,
            channel: 'SMS',
            recipient: smsData.to,
            status: result.success ? 'SENT' : 'FAILED',
            cost: result.cost || 0.05, // Use actual cost from provider
            metadata: {
              provider: result.provider,
              messageId: result.id,
              message: smsData.content.substring(0, 50),
              duration,
              source: 'MCP'
            },
            userId: smsData.userId
          }
        });
      } catch (dbError) {
        logger.warn('Failed to log SMS usage to database', { error: dbError });
      }

      return {
        id: result.id || `sms_${Date.now()}`,
        status: result.success ? 'SENT' : 'FAILED',
        provider: result.provider || 'unknown',
        cost: result.cost || 0.05,
        timestamp: new Date().toISOString(),
        error: result.error?.message
      };
    } catch (error) {
      logger.error('Failed to send SMS via MCP', { error, smsData });
      return {
        id: `sms_error_${Date.now()}`,
        status: 'FAILED',
        provider: smsData.provider || 'unknown',
        cost: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendWhatsAppWithRealService(whatsappData: any): Promise<MessageResult> {
    try {
      const startTime = Date.now();
      
      // Prepare WhatsApp message data
      const messageData: any = {
        to: whatsappData.to,
        type: 'text',
        text: {
          body: whatsappData.content
        }
      };

      // If template is specified, use template format
      if (whatsappData.templateId) {
        messageData.type = 'template';
        messageData.template = {
          name: whatsappData.templateId,
          language: { code: 'en' },
          components: whatsappData.templateParams ? [
            {
              type: 'body',
              parameters: whatsappData.templateParams.map((param: string) => ({
                type: 'text',
                text: param
              }))
            }
          ] : []
        };
        delete messageData.text;
      }

      // Send through real WhatsApp service
      const result = await sendWhatsAppMessage(whatsappData.to, messageData);
      
      const duration = Date.now() - startTime;

      // Log the WhatsApp send attempt
      try {
        await prisma.messagingUsage.create({
          data: {
            organizationId: whatsappData.organizationId,
            channel: 'WHATSAPP',
            recipient: whatsappData.to,
            status: result.success ? 'SENT' : 'FAILED',
            cost: 0.02, // Standard WhatsApp cost
            metadata: {
              provider: 'whatsapp_business',
              messageId: result.messageId,
              templateId: whatsappData.templateId,
              message: whatsappData.content.substring(0, 50),
              duration,
              source: 'MCP'
            },
            userId: whatsappData.userId
          }
        });
      } catch (dbError) {
        logger.warn('Failed to log WhatsApp usage to database', { error: dbError });
      }

      return {
        id: result.messageId || `whatsapp_${Date.now()}`,
        status: result.success ? 'SENT' : 'FAILED',
        provider: 'whatsapp_business',
        cost: 0.02,
        timestamp: new Date().toISOString(),
        error: result.error?.message
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp message via MCP', { error, whatsappData });
      return {
        id: `whatsapp_error_${Date.now()}`,
        status: 'FAILED',
        provider: 'whatsapp_business',
        cost: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resource implementations
   */
  private async getEmailServiceInfo(params: any, authContext: MCPAuthContext): Promise<any> {
    try {
      const startTime = Date.now();

      // Get email usage statistics for the organization
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const emailUsage = await prisma.messagingUsage.aggregate({
        where: {
          organizationId: authContext.organizationId,
          channel: 'EMAIL',
          createdAt: { gte: last30Days }
        },
        _count: { id: true },
        _sum: { cost: true }
      });

      // Get email templates count
      const templatesCount = await prisma.emailTemplate.count({
        where: {
          organizationId: authContext.organizationId
        }
      });

      // Get today's email count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEmails = await prisma.messagingUsage.count({
        where: {
          organizationId: authContext.organizationId,
          channel: 'EMAIL',
          createdAt: { gte: today }
        }
      });

      // Check provider configuration
      const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
      const emailConfigured = !!(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY);

      const duration = Date.now() - startTime;

      // Log resource access
      await this.logMCPResourceAccess(
        authContext,
        'services://email',
        'READ',
        'success',
        { duration, dataSize: 1 }
      );

      return {
        uri: "services://email",
        mimeType: "application/json",
        text: JSON.stringify({
          service: 'email',
          status: emailConfigured ? 'active' : 'inactive',
          provider: emailProvider,
          configuration: {
            isConfigured: emailConfigured,
            fromAddress: process.env.EMAIL_FROM || 'noreply@marketsage.ai',
            replyToAddress: process.env.EMAIL_REPLY_TO
          },
          features: ['templates', 'personalization', 'tracking', 'attachments', 'delivery_reports'],
          limits: {
            dailyLimit: 10000,
            rateLimit: '100/minute',
            todayUsed: todayEmails,
            dailyRemaining: Math.max(0, 10000 - todayEmails)
          },
          statistics: {
            last30Days: {
              sent: emailUsage._count.id || 0,
              totalCost: emailUsage._sum.cost || 0,
              averageCost: emailUsage._count.id > 0 ? (emailUsage._sum.cost || 0) / emailUsage._count.id : 0
            },
            templatesAvailable: templatesCount
          },
          meta: {
            timestamp: new Date().toISOString(),
            duration,
            source: 'DATABASE'
          }
        })
      };
    } catch (error) {
      await this.logMCPResourceAccess(
        authContext,
        'services://email',
        'READ',
        'failure',
        { errorMessage: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        uri: "services://email",
        mimeType: "application/json",
        text: JSON.stringify({
          service: 'email',
          status: 'error',
          error: 'Failed to retrieve email service information',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  }

  private async getSMSServiceInfo(params: any, authContext: MCPAuthContext): Promise<any> {
    try {
      const startTime = Date.now();

      // Get SMS usage statistics for the organization
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const smsUsage = await prisma.messagingUsage.aggregate({
        where: {
          organizationId: authContext.organizationId,
          channel: 'SMS',
          createdAt: { gte: last30Days }
        },
        _count: { id: true },
        _sum: { cost: true }
      });

      // Get SMS providers configuration
      const smsProviders = await prisma.sMSProvider.findMany({
        where: {
          organizationId: authContext.organizationId,
          isActive: true
        },
        select: {
          name: true,
          providerType: true,
          isActive: true,
          balance: true,
          lastUsed: true
        }
      });

      // Get today's SMS count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySMS = await prisma.messagingUsage.count({
        where: {
          organizationId: authContext.organizationId,
          channel: 'SMS',
          createdAt: { gte: today }
        }
      });

      // Check which providers are configured
      const availableProviders = [];
      if (process.env.AFRICASTALKING_USERNAME && process.env.AFRICASTALKING_API_KEY) {
        availableProviders.push('africastalking');
      }
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        availableProviders.push('twilio');
      }

      const duration = Date.now() - startTime;

      // Log resource access
      await this.logMCPResourceAccess(
        authContext,
        'services://sms',
        'READ',
        'success',
        { duration, dataSize: smsProviders.length }
      );

      return {
        uri: "services://sms",
        mimeType: "application/json",
        text: JSON.stringify({
          service: 'sms',
          status: availableProviders.length > 0 ? 'active' : 'inactive',
          providers: availableProviders,
          configuration: {
            configuredProviders: smsProviders.map(p => ({
              name: p.name,
              type: p.providerType,
              isActive: p.isActive,
              balance: p.balance,
              lastUsed: p.lastUsed?.toISOString()
            })),
            defaultProvider: process.env.SMS_PROVIDER || 'auto'
          },
          features: ['delivery_reports', 'sender_id', 'scheduling', 'auto_failover'],
          limits: {
            dailyLimit: 5000,
            rateLimit: '50/minute',
            todayUsed: todaySMS,
            dailyRemaining: Math.max(0, 5000 - todaySMS)
          },
          statistics: {
            last30Days: {
              sent: smsUsage._count.id || 0,
              totalCost: smsUsage._sum.cost || 0,
              averageCost: smsUsage._count.id > 0 ? (smsUsage._sum.cost || 0) / smsUsage._count.id : 0
            }
          },
          meta: {
            timestamp: new Date().toISOString(),
            duration,
            source: 'DATABASE'
          }
        })
      };
    } catch (error) {
      await this.logMCPResourceAccess(
        authContext,
        'services://sms',
        'READ',
        'failure',
        { errorMessage: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        uri: "services://sms",
        mimeType: "application/json",
        text: JSON.stringify({
          service: 'sms',
          status: 'error',
          error: 'Failed to retrieve SMS service information',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  }

  private async getWhatsAppServiceInfo(params: any, authContext: MCPAuthContext): Promise<any> {
    try {
      const startTime = Date.now();

      // Get WhatsApp usage statistics for the organization
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const whatsappUsage = await prisma.messagingUsage.aggregate({
        where: {
          organizationId: authContext.organizationId,
          channel: 'WHATSAPP',
          createdAt: { gte: last30Days }
        },
        _count: { id: true },
        _sum: { cost: true }
      });

      // Get WhatsApp templates count
      const templatesCount = await prisma.whatsAppTemplate.count({
        where: {
          organizationId: authContext.organizationId
        }
      });

      // Get today's WhatsApp message count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayWhatsApp = await prisma.messagingUsage.count({
        where: {
          organizationId: authContext.organizationId,
          channel: 'WHATSAPP',
          createdAt: { gte: today }
        }
      });

      // Check WhatsApp Business API configuration
      const whatsappConfigured = !!(
        process.env.WHATSAPP_PHONE_NUMBER_ID && 
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      );

      // Get approved templates
      const approvedTemplates = await prisma.whatsAppTemplate.findMany({
        where: {
          organizationId: authContext.organizationId,
          status: 'APPROVED'
        },
        select: {
          name: true,
          category: true,
          language: true,
          status: true
        }
      });

      const duration = Date.now() - startTime;

      // Log resource access
      await this.logMCPResourceAccess(
        authContext,
        'services://whatsapp',
        'READ',
        'success',
        { duration, dataSize: templatesCount }
      );

      return {
        uri: "services://whatsapp",
        mimeType: "application/json",
        text: JSON.stringify({
          service: 'whatsapp',
          status: whatsappConfigured ? 'active' : 'inactive',
          provider: 'whatsapp_business',
          configuration: {
            isConfigured: whatsappConfigured,
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? '***masked***' : null,
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '***masked***' : null,
            webhookConfigured: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
          },
          features: ['templates', 'media', 'delivery_reports', 'read_receipts', 'interactive_messages'],
          limits: {
            dailyLimit: 1000,
            rateLimit: '20/minute',
            todayUsed: todayWhatsApp,
            dailyRemaining: Math.max(0, 1000 - todayWhatsApp)
          },
          templates: {
            total: templatesCount,
            approved: approvedTemplates.length,
            approved_templates: approvedTemplates.map(t => ({
              name: t.name,
              category: t.category,
              language: t.language,
              status: t.status
            }))
          },
          statistics: {
            last30Days: {
              sent: whatsappUsage._count.id || 0,
              totalCost: whatsappUsage._sum.cost || 0,
              averageCost: whatsappUsage._count.id > 0 ? (whatsappUsage._sum.cost || 0) / whatsappUsage._count.id : 0
            }
          },
          meta: {
            timestamp: new Date().toISOString(),
            duration,
            source: 'DATABASE'
          }
        })
      };
    } catch (error) {
      await this.logMCPResourceAccess(
        authContext,
        'services://whatsapp',
        'READ',
        'failure',
        { errorMessage: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        uri: "services://whatsapp",
        mimeType: "application/json",
        text: JSON.stringify({
          service: 'whatsapp',
          status: 'error',
          error: 'Failed to retrieve WhatsApp service information',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  }

  private async getMessageTemplates(params: any, authContext: MCPAuthContext): Promise<any> {
    return {
      uri: "services://templates",
      mimeType: "application/json",
      text: JSON.stringify({
        message: "Message templates functionality coming soon",
        fallbackUsed: true
      })
    };
  }

  private async getProviderStatus(params: any, authContext: MCPAuthContext): Promise<any> {
    return {
      uri: "services://providers",
      mimeType: "application/json",
      text: JSON.stringify({
        message: "Provider status functionality coming soon",
        fallbackUsed: true
      })
    };
  }
}