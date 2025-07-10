/**
 * WhatsApp Business API Compliance Validation
 * 
 * This module ensures compliance with Meta's WhatsApp Business API policies
 * to prevent account suspension and maintain good standing.
 * 
 * Key compliance areas:
 * - Template approval requirements
 * - Rate limiting and spam prevention
 * - Content policy compliance
 * - Opt-in validation
 * - 24-hour messaging window
 * - Phone number validation
 */

interface ComplianceResult {
  isCompliant: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

interface ComplianceContext {
  messageType: 'text' | 'template' | 'media';
  templateId?: string;
  templateStatus?: string;
  recipientPhone: string;
  messageContent: string;
  lastInteractionTime?: Date;
  userOptInStatus?: boolean;
  campaignId?: string;
}

export class WhatsAppComplianceValidator {
  private readonly PROHIBITED_CONTENT_PATTERNS = [
    // Financial/crypto terms that may violate policies
    /\b(bitcoin|cryptocurrency|crypto|investment scheme|get rich quick)\b/i,
    
    // Spam indicators
    /\b(click here now|limited time offer|act now|urgent)\b/i,
    
    // Adult content indicators
    /\b(adult|xxx|sexual|porn)\b/i,
    
    // Phishing/scam indicators
    /\b(verify your account|click to verify|suspicious activity)\b/i,
    
    // Harassment indicators
    /\b(hate|threaten|harass|abuse)\b/i,
  ];

  private readonly RATE_LIMITS = {
    MESSAGES_PER_SECOND: 20,      // Meta's rate limit
    MESSAGES_PER_MINUTE: 1000,    // Conservative limit
    MESSAGES_PER_HOUR: 50000,     // Based on business tier
  };

  private readonly TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  /**
   * Comprehensive compliance validation for WhatsApp messages
   */
  async validateCompliance(context: ComplianceContext): Promise<ComplianceResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {};

    // 1. Phone number format validation
    const phoneValidation = this.validatePhoneNumber(context.recipientPhone);
    if (!phoneValidation.isValid) {
      errors.push(`Invalid recipient phone number: ${phoneValidation.error}`);
    }

    // 2. Template approval validation (for template messages)
    if (context.messageType === 'template') {
      const templateValidation = this.validateTemplateApproval(context);
      if (!templateValidation.isValid) {
        errors.push(templateValidation.error!);
      }
    }

    // 3. 24-hour messaging window validation (for non-template messages)
    if (context.messageType !== 'template') {
      const windowValidation = this.validate24HourWindow(context);
      if (!windowValidation.isValid) {
        if (windowValidation.isWarning) {
          warnings.push(windowValidation.error!);
        } else {
          errors.push(windowValidation.error!);
        }
      }
      metadata.messagingWindow = windowValidation.metadata;
    }

    // 4. Content policy validation
    const contentValidation = this.validateMessageContent(context.messageContent);
    if (!contentValidation.isValid) {
      errors.push(contentValidation.error!);
    }
    if (contentValidation.warnings) {
      warnings.push(...contentValidation.warnings);
    }

    // 5. Opt-in validation
    const optInValidation = this.validateOptInStatus(context);
    if (!optInValidation.isValid) {
      if (optInValidation.isWarning) {
        warnings.push(optInValidation.error!);
      } else {
        errors.push(optInValidation.error!);
      }
    }

    // 6. Message length validation
    const lengthValidation = this.validateMessageLength(context);
    if (!lengthValidation.isValid) {
      errors.push(lengthValidation.error!);
    }

    return {
      isCompliant: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  /**
   * Validate phone number format for WhatsApp Business API
   */
  private validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return { isValid: false, error: 'Phone number is required' };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Must be between 10-15 digits
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return { 
        isValid: false, 
        error: `Phone number must be 10-15 digits. Got ${cleanPhone.length} digits.` 
      };
    }

    // Must have country code (WhatsApp requires international format)
    if (!this.hasValidCountryCode(cleanPhone)) {
      return { 
        isValid: false, 
        error: 'Phone number must include valid country code (e.g., +234 for Nigeria)' 
      };
    }

    return { isValid: true };
  }

  /**
   * Check if phone number has a valid country code
   */
  private hasValidCountryCode(cleanPhone: string): boolean {
    // Major African country codes supported
    const africanCountryCodes = [
      '234', // Nigeria
      '254', // Kenya  
      '27',  // South Africa
      '233', // Ghana
      '256', // Uganda
      '255', // Tanzania
      '237', // Cameroon
      '225', // Ivory Coast
      '223', // Mali
      '221', // Senegal
    ];

    return africanCountryCodes.some(code => cleanPhone.startsWith(code));
  }

  /**
   * Validate template approval status
   */
  private validateTemplateApproval(context: ComplianceContext): { isValid: boolean; error?: string } {
    if (!context.templateId) {
      return { isValid: false, error: 'Template ID is required for template messages' };
    }

    if (!context.templateStatus) {
      return { isValid: false, error: 'Template status is required for validation' };
    }

    if (context.templateStatus !== 'APPROVED') {
      return { 
        isValid: false, 
        error: `Template must be APPROVED by Meta. Current status: ${context.templateStatus}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validate 24-hour messaging window for non-template messages
   */
  private validate24HourWindow(context: ComplianceContext): { 
    isValid: boolean; 
    error?: string; 
    isWarning?: boolean;
    metadata?: any;
  } {
    if (!context.lastInteractionTime) {
      return { 
        isValid: false, 
        error: 'Cannot send non-template message: No recent interaction found. Use approved template instead.',
        metadata: { windowStatus: 'no_interaction' }
      };
    }

    const timeSinceInteraction = Date.now() - context.lastInteractionTime.getTime();
    const hoursRemaining = Math.max(0, (this.TWENTY_FOUR_HOURS_MS - timeSinceInteraction) / (1000 * 60 * 60));

    if (timeSinceInteraction > this.TWENTY_FOUR_HOURS_MS) {
      return { 
        isValid: false, 
        error: `24-hour messaging window expired ${Math.round((timeSinceInteraction - this.TWENTY_FOUR_HOURS_MS) / (1000 * 60 * 60))} hours ago. Use approved template instead.`,
        metadata: { 
          windowStatus: 'expired',
          hoursExpired: Math.round((timeSinceInteraction - this.TWENTY_FOUR_HOURS_MS) / (1000 * 60 * 60))
        }
      };
    }

    // Warning if window expires soon (less than 2 hours remaining)
    if (hoursRemaining < 2) {
      return { 
        isValid: true, 
        error: `24-hour messaging window expires in ${Math.round(hoursRemaining * 60)} minutes. Consider using template for future messages.`,
        isWarning: true,
        metadata: { 
          windowStatus: 'expiring_soon',
          hoursRemaining: Math.round(hoursRemaining * 100) / 100
        }
      };
    }

    return { 
      isValid: true,
      metadata: { 
        windowStatus: 'valid',
        hoursRemaining: Math.round(hoursRemaining * 100) / 100
      }
    };
  }

  /**
   * Validate message content against WhatsApp policies
   */
  private validateMessageContent(content: string): { 
    isValid: boolean; 
    error?: string; 
    warnings?: string[];
  } {
    if (!content || typeof content !== 'string') {
      return { isValid: false, error: 'Message content is required' };
    }

    const warnings: string[] = [];

    // Check against prohibited content patterns
    for (const pattern of this.PROHIBITED_CONTENT_PATTERNS) {
      if (pattern.test(content)) {
        return { 
          isValid: false, 
          error: `Message content may violate WhatsApp policies. Detected potentially prohibited content.` 
        };
      }
    }

    // Check for excessive caps (spam indicator)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      warnings.push('Excessive capital letters may appear spammy to recipients');
    }

    // Check for excessive punctuation (spam indicator)
    const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 2) {
      warnings.push('Excessive punctuation may appear spammy to recipients');
    }

    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  /**
   * Validate user opt-in status
   */
  private validateOptInStatus(context: ComplianceContext): { 
    isValid: boolean; 
    error?: string; 
    isWarning?: boolean;
  } {
    // If opt-in status is explicitly provided
    if (context.userOptInStatus !== undefined) {
      if (!context.userOptInStatus) {
        return { 
          isValid: false, 
          error: 'User has not opted in to receive WhatsApp messages' 
        };
      }
      return { isValid: true };
    }

    // If opt-in status is unknown, provide warning
    return { 
      isValid: true, 
      error: 'User opt-in status unknown. Ensure users have consented to receive WhatsApp messages.',
      isWarning: true
    };
  }

  /**
   * Validate message length limits
   */
  private validateMessageLength(context: ComplianceContext): { isValid: boolean; error?: string } {
    const content = context.messageContent;
    
    // WhatsApp text message limit is 4096 characters
    const MAX_TEXT_LENGTH = 4096;
    
    if (content.length > MAX_TEXT_LENGTH) {
      return { 
        isValid: false, 
        error: `Message too long. Maximum ${MAX_TEXT_LENGTH} characters allowed. Current: ${content.length} characters.` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validate rate limiting compliance
   */
  async validateRateLimit(campaignId: string, contactCount: number): Promise<ComplianceResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if campaign would exceed rate limits
    if (contactCount > this.RATE_LIMITS.MESSAGES_PER_MINUTE) {
      warnings.push(`Campaign targets ${contactCount} contacts. Consider batching to avoid rate limits (max ${this.RATE_LIMITS.MESSAGES_PER_MINUTE}/minute).`);
    }

    if (contactCount > this.RATE_LIMITS.MESSAGES_PER_HOUR) {
      errors.push(`Campaign targets ${contactCount} contacts, exceeding hourly limit of ${this.RATE_LIMITS.MESSAGES_PER_HOUR}. Split into multiple campaigns.`);
    }

    return {
      isCompliant: errors.length === 0,
      errors,
      warnings,
      metadata: {
        contactCount,
        estimatedDuration: Math.ceil(contactCount / this.RATE_LIMITS.MESSAGES_PER_SECOND),
        rateLimits: this.RATE_LIMITS
      }
    };
  }
}

// Export singleton instance
export const whatsappCompliance = new WhatsAppComplianceValidator();