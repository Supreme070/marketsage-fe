/**
 * WhatsApp Template Approval Workflow Integration with Meta
 * 
 * Handles template submission, approval tracking, and Meta Business API integration
 * for WhatsApp Business Account template management.
 */

import { logger } from '@/lib/logger';
import { whatsappLogger } from '@/lib/whatsapp-campaign-logger';
import prisma from '@/lib/db/prisma';

interface MetaTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
  buttons?: Array<{
    type: 'PHONE_NUMBER' | 'URL' | 'QUICK_REPLY';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

interface MetaTemplateRequest {
  name: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language: string;
  components: MetaTemplateComponent[];
}

interface MetaTemplateResponse {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  category: string;
  language: string;
  quality_score?: {
    score: 'GREEN' | 'YELLOW' | 'RED';
    reasons?: string[];
  };
  rejection_reason?: string;
  created_time: string;
  updated_time: string;
}

interface TemplateApprovalStatus {
  templateId: string;
  metaTemplateId?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED';
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  qualityScore?: 'GREEN' | 'YELLOW' | 'RED';
  reviewNotes?: string;
  retryCount: number;
  nextRetryAt?: Date;
}

export class WhatsAppTemplateApprovalService {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly businessAccountId: string;
  private readonly webhookVerifyToken: string;

  constructor() {
    this.baseUrl = process.env.META_GRAPH_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || '';
    this.businessAccountId = process.env.META_BUSINESS_ACCOUNT_ID || '';
    this.webhookVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || '';

    if (!this.accessToken || !this.businessAccountId) {
      logger.warn('WhatsApp Template Approval Service: Missing Meta API credentials');
    }
  }

  /**
   * Submit template for approval to Meta
   */
  async submitTemplateForApproval(
    templateId: string,
    userId: string
  ): Promise<{ success: boolean; metaTemplateId?: string; error?: string }> {
    try {
      const template = await prisma.whatsAppTemplate.findUnique({
        where: { id: templateId },
        include: { createdBy: true }
      });

      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      if (template.status === 'PENDING' || template.status === 'APPROVED') {
        return { success: false, error: `Template is already ${template.status.toLowerCase()}` };
      }

      // Convert template to Meta format
      const metaTemplate = this.convertToMetaFormat(template);

      // Validate template before submission
      const validationResult = this.validateTemplateForMeta(metaTemplate);
      if (!validationResult.isValid) {
        return { 
          success: false, 
          error: `Template validation failed: ${validationResult.errors.join(', ')}` 
        };
      }

      // Submit to Meta API
      const response = await this.submitToMetaAPI(metaTemplate);

      if (response.success && response.metaTemplateId) {
        // Update template status in database
        await prisma.whatsAppTemplate.update({
          where: { id: templateId },
          data: {
            status: 'PENDING',
            metaTemplateId: response.metaTemplateId,
            submittedAt: new Date(),
            updatedAt: new Date()
          }
        });

        await whatsappLogger.logTemplateSubmitted(templateId, response.metaTemplateId, {
          userId,
          templateName: template.name,
          category: template.category
        });

        return { 
          success: true, 
          metaTemplateId: response.metaTemplateId 
        };
      }

      return { 
        success: false, 
        error: response.error || 'Failed to submit template to Meta' 
      };

    } catch (error) {
      logger.error('Error submitting WhatsApp template for approval', { error, templateId });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get template approval status from Meta
   */
  async getTemplateApprovalStatus(templateId: string): Promise<TemplateApprovalStatus | null> {
    try {
      const template = await prisma.whatsAppTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template || !template.metaTemplateId) {
        return null;
      }

      // Get status from Meta API
      const metaStatus = await this.getMetaTemplateStatus(template.metaTemplateId);

      if (!metaStatus) {
        return null;
      }

      // Update local database with Meta status
      await this.updateTemplateStatus(templateId, metaStatus);

      return {
        templateId,
        metaTemplateId: template.metaTemplateId,
        status: this.mapMetaStatusToLocal(metaStatus.status),
        submittedAt: template.submittedAt,
        approvedAt: metaStatus.status === 'APPROVED' ? new Date(metaStatus.updated_time) : undefined,
        rejectedAt: metaStatus.status === 'REJECTED' ? new Date(metaStatus.updated_time) : undefined,
        rejectionReason: metaStatus.rejection_reason,
        qualityScore: metaStatus.quality_score?.score,
        retryCount: 0, // Would be stored in database
        nextRetryAt: undefined
      };

    } catch (error) {
      logger.error('Error getting template approval status', { error, templateId });
      return null;
    }
  }

  /**
   * Handle Meta webhook for template status updates
   */
  async handleTemplateStatusWebhook(webhookData: any): Promise<void> {
    try {
      const { entry } = webhookData;
      
      if (!entry || !Array.isArray(entry)) {
        return;
      }

      for (const entryItem of entry) {
        const { changes } = entryItem;
        
        if (!changes || !Array.isArray(changes)) {
          continue;
        }

        for (const change of changes) {
          if (change.field === 'message_template_status_update') {
            await this.processTemplateStatusUpdate(change.value);
          }
        }
      }

    } catch (error) {
      logger.error('Error handling template status webhook', { error, webhookData });
    }
  }

  /**
   * Retry failed template submissions
   */
  async retryFailedTemplates(): Promise<{ processed: number; succeeded: number; failed: number }> {
    try {
      const failedTemplates = await prisma.whatsAppTemplate.findMany({
        where: {
          status: 'REJECTED',
          retryCount: { lt: 3 }, // Max 3 retries
          nextRetryAt: { lte: new Date() }
        },
        include: { createdBy: true }
      });

      let succeeded = 0;
      let failed = 0;

      for (const template of failedTemplates) {
        const result = await this.submitTemplateForApproval(template.id, template.createdById);
        
        if (result.success) {
          succeeded++;
        } else {
          failed++;
          // Update retry count and next retry time
          await prisma.whatsAppTemplate.update({
            where: { id: template.id },
            data: {
              retryCount: { increment: 1 },
              nextRetryAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Retry in 24 hours
            }
          });
        }
      }

      logger.info('Completed template retry process', {
        processed: failedTemplates.length,
        succeeded,
        failed
      });

      return { processed: failedTemplates.length, succeeded, failed };

    } catch (error) {
      logger.error('Error retrying failed templates', { error });
      return { processed: 0, succeeded: 0, failed: 0 };
    }
  }

  /**
   * Get template approval insights and analytics
   */
  async getApprovalInsights(userId: string): Promise<{
    totalTemplates: number;
    approvalStats: {
      approved: number;
      pending: number;
      rejected: number;
      draft: number;
    };
    averageApprovalTime: number;
    commonRejectionReasons: Array<{ reason: string; count: number }>;
    qualityScoreDistribution: {
      green: number;
      yellow: number;
      red: number;
    };
  }> {
    try {
      const templates = await prisma.whatsAppTemplate.findMany({
        where: { createdById: userId },
        select: {
          status: true,
          submittedAt: true,
          approvedAt: true,
          rejectionReason: true,
          qualityScore: true
        }
      });

      const totalTemplates = templates.length;
      
      // Status distribution
      const approvalStats = templates.reduce((acc, template) => {
        acc[template.status.toLowerCase() as keyof typeof acc]++;
        return acc;
      }, { approved: 0, pending: 0, rejected: 0, draft: 0 });

      // Average approval time
      const approvedTemplates = templates.filter(t => t.status === 'APPROVED' && t.submittedAt && t.approvedAt);
      const averageApprovalTime = approvedTemplates.length > 0 ? 
        approvedTemplates.reduce((sum, template) => {
          const timeDiff = new Date(template.approvedAt!).getTime() - new Date(template.submittedAt!).getTime();
          return sum + timeDiff;
        }, 0) / approvedTemplates.length / (1000 * 60 * 60) : 0; // Convert to hours

      // Common rejection reasons
      const rejectionReasons = templates
        .filter(t => t.rejectionReason)
        .reduce((acc, template) => {
          const reason = template.rejectionReason!;
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const commonRejectionReasons = Object.entries(rejectionReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Quality score distribution
      const qualityScoreDistribution = templates.reduce((acc, template) => {
        if (template.qualityScore) {
          acc[template.qualityScore.toLowerCase() as keyof typeof acc]++;
        }
        return acc;
      }, { green: 0, yellow: 0, red: 0 });

      return {
        totalTemplates,
        approvalStats,
        averageApprovalTime: Math.round(averageApprovalTime * 10) / 10,
        commonRejectionReasons,
        qualityScoreDistribution
      };

    } catch (error) {
      logger.error('Error getting approval insights', { error, userId });
      throw error;
    }
  }

  /**
   * Convert internal template format to Meta format
   */
  private convertToMetaFormat(template: any): MetaTemplateRequest {
    const components: MetaTemplateComponent[] = [];

    try {
      const templateData = JSON.parse(template.variables || '{}');
      
      // Header component
      if (templateData.header && templateData.header.text) {
        components.push({
          type: 'HEADER',
          format: templateData.header.format || 'TEXT',
          text: templateData.header.text,
          example: templateData.header.example
        });
      }

      // Body component (required)
      components.push({
        type: 'BODY',
        text: template.content || 'Default message content',
        example: templateData.body?.example
      });

      // Footer component
      if (templateData.footer && templateData.footer.text) {
        components.push({
          type: 'FOOTER',
          text: templateData.footer.text
        });
      }

      // Buttons component
      if (templateData.buttons && Array.isArray(templateData.buttons)) {
        components.push({
          type: 'BUTTONS',
          buttons: templateData.buttons
        });
      }

    } catch (error) {
      logger.warn('Error parsing template variables, using defaults', { error, templateId: template.id });
      
      // Fallback to basic template
      components.push({
        type: 'BODY',
        text: template.content || 'Default message content'
      });
    }

    return {
      name: template.name,
      category: template.category || 'UTILITY',
      language: template.language || 'en',
      components
    };
  }

  /**
   * Validate template format for Meta submission
   */
  private validateTemplateForMeta(template: MetaTemplateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name || template.name.length < 1 || template.name.length > 512) {
      errors.push('Template name must be between 1 and 512 characters');
    }

    if (!template.name.match(/^[a-z0-9_]+$/)) {
      errors.push('Template name must contain only lowercase letters, numbers, and underscores');
    }

    if (!['AUTHENTICATION', 'MARKETING', 'UTILITY'].includes(template.category)) {
      errors.push('Template category must be AUTHENTICATION, MARKETING, or UTILITY');
    }

    if (!template.language || template.language.length !== 2) {
      errors.push('Template language must be a valid 2-letter language code');
    }

    if (!template.components || template.components.length === 0) {
      errors.push('Template must have at least one component');
    }

    const hasBodyComponent = template.components.some(c => c.type === 'BODY');
    if (!hasBodyComponent) {
      errors.push('Template must have a BODY component');
    }

    // Validate each component
    for (const component of template.components) {
      if (component.type === 'BODY' && (!component.text || component.text.length > 1024)) {
        errors.push('BODY component text must be between 1 and 1024 characters');
      }

      if (component.type === 'HEADER' && component.format === 'TEXT' && 
          (!component.text || component.text.length > 60)) {
        errors.push('HEADER component text must be between 1 and 60 characters');
      }

      if (component.type === 'FOOTER' && (!component.text || component.text.length > 60)) {
        errors.push('FOOTER component text must be between 1 and 60 characters');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Submit template to Meta API
   */
  private async submitToMetaAPI(template: MetaTemplateRequest): Promise<{
    success: boolean;
    metaTemplateId?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.businessAccountId}/message_templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });

      const data = await response.json();

      if (response.ok && data.id) {
        return { success: true, metaTemplateId: data.id };
      }

      return { 
        success: false, 
        error: data.error?.message || 'Failed to submit template to Meta' 
      };

    } catch (error) {
      logger.error('Error submitting to Meta API', { error, template });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Get template status from Meta API
   */
  private async getMetaTemplateStatus(metaTemplateId: string): Promise<MetaTemplateResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${metaTemplateId}?fields=id,name,status,category,language,quality_score,rejection_reason,created_time,updated_time`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (response.ok) {
        return await response.json();
      }

      return null;

    } catch (error) {
      logger.error('Error getting template status from Meta', { error, metaTemplateId });
      return null;
    }
  }

  /**
   * Update template status in database
   */
  private async updateTemplateStatus(templateId: string, metaStatus: MetaTemplateResponse): Promise<void> {
    try {
      const updateData: any = {
        status: this.mapMetaStatusToLocal(metaStatus.status),
        updatedAt: new Date()
      };

      if (metaStatus.status === 'APPROVED') {
        updateData.approvedAt = new Date(metaStatus.updated_time);
      } else if (metaStatus.status === 'REJECTED') {
        updateData.rejectedAt = new Date(metaStatus.updated_time);
        updateData.rejectionReason = metaStatus.rejection_reason;
      }

      if (metaStatus.quality_score) {
        updateData.qualityScore = metaStatus.quality_score.score;
      }

      await prisma.whatsAppTemplate.update({
        where: { id: templateId },
        data: updateData
      });

    } catch (error) {
      logger.error('Error updating template status', { error, templateId, metaStatus });
    }
  }

  /**
   * Process template status update from webhook
   */
  private async processTemplateStatusUpdate(webhookValue: any): Promise<void> {
    try {
      const { message_template_id, message_template_name, event } = webhookValue;

      if (!message_template_id || !event) {
        return;
      }

      // Find template by Meta ID
      const template = await prisma.whatsAppTemplate.findFirst({
        where: { metaTemplateId: message_template_id }
      });

      if (!template) {
        logger.warn('Template not found for webhook update', { message_template_id });
        return;
      }

      // Update template status based on webhook event
      const updateData: any = {
        updatedAt: new Date()
      };

      switch (event) {
        case 'APPROVED':
          updateData.status = 'APPROVED';
          updateData.approvedAt = new Date();
          break;
        case 'REJECTED':
          updateData.status = 'REJECTED';
          updateData.rejectedAt = new Date();
          updateData.rejectionReason = webhookValue.reason;
          break;
        case 'PENDING':
          updateData.status = 'PENDING';
          break;
        case 'PAUSED':
          updateData.status = 'PAUSED';
          break;
      }

      await prisma.whatsAppTemplate.update({
        where: { id: template.id },
        data: updateData
      });

      await whatsappLogger.logTemplateStatusChanged(template.id, event, {
        metaTemplateId: message_template_id,
        templateName: message_template_name,
        reason: webhookValue.reason
      });

    } catch (error) {
      logger.error('Error processing template status update', { error, webhookValue });
    }
  }

  /**
   * Map Meta status to local status
   */
  private mapMetaStatusToLocal(metaStatus: string): string {
    switch (metaStatus) {
      case 'PENDING':
        return 'PENDING';
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      case 'PAUSED':
        return 'PAUSED';
      case 'DISABLED':
        return 'REJECTED';
      default:
        return 'DRAFT';
    }
  }
}

// Export singleton instance
export const whatsappTemplateApproval = new WhatsAppTemplateApprovalService();