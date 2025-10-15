/**
 * LeadPulse Form Submission Processor
 * 
 * Handles form submissions, data validation, contact creation, and analytics
 */

// NOTE: Prisma removed - using backend API (LeadPulseForm, LeadPulseFormSubmission, Contact, etc. exist in backend)
import { logger } from '@/lib/logger';
import { leadPulseErrorHandler, withDatabaseFallback } from './error-handler';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

export interface FormSubmissionData {
  formId: string;
  visitorId?: string;
  submissionData: Record<string, any>;
  context: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    timestamp: Date;
  };
}

export interface ProcessedSubmission {
  id: string;
  formId: string;
  contactId?: string;
  visitorId?: string;
  status: 'PROCESSED' | 'FAILED' | 'SPAM' | 'DUPLICATE';
  score: number;
  quality: 'UNKNOWN' | 'COLD' | 'WARM' | 'HOT' | 'QUALIFIED';
  errors?: string[];
}

export class FormProcessor {
  private static instance: FormProcessor;

  static getInstance(): FormProcessor {
    if (!FormProcessor.instance) {
      FormProcessor.instance = new FormProcessor();
    }
    return FormProcessor.instance;
  }

  // Main form submission processing
  async processSubmission(data: FormSubmissionData): Promise<ProcessedSubmission> {
    try {
      logger.info('Processing form submission', { formId: data.formId });

      // 1. Get form configuration
      const form = await this.getForm(data.formId);
      if (!form) {
        throw new Error(`Form not found: ${data.formId}`);
      }

      // 2. Validate submission data
      const validationResult = await this.validateSubmission(form, data.submissionData);
      if (!validationResult.isValid) {
        return {
          id: '',
          formId: data.formId,
          status: 'FAILED',
          score: 0,
          quality: 'UNKNOWN',
          errors: validationResult.errors
        };
      }

      // 3. Check for spam/duplicates
      const spamCheck = await this.checkSpamAndDuplicates(data);
      if (spamCheck.isSpam) {
        return await this.createSubmissionRecord(data, 'SPAM', 0, 'UNKNOWN');
      }
      if (spamCheck.isDuplicate) {
        return await this.createSubmissionRecord(data, 'DUPLICATE', 0, 'UNKNOWN');
      }

      // 4. Score and qualify the lead
      const leadScore = await this.scoreSubmission(form, data.submissionData, data.context);
      const leadQuality = this.qualifyLead(leadScore.score);

      // 5. Create or update contact
      const contactId = await this.processContact(data.submissionData, data.context);

      // 6. Create submission record
      const submission = await this.createSubmissionRecord(
        data, 
        'PROCESSED', 
        leadScore.score, 
        leadQuality,
        contactId
      );

      // 7. Update analytics
      await this.updateFormAnalytics(data.formId, data.context);

      // 8. Trigger workflows/automations
      await this.triggerAutomations(form, submission, contactId);

      logger.info('Form submission processed successfully', {
        submissionId: submission.id,
        contactId,
        score: leadScore.score,
        quality: leadQuality
      });

      return submission;

    } catch (error) {
      await leadPulseErrorHandler.handleError(error, {
        additionalData: { formId: data.formId, visitorId: data.visitorId }
      });

      return {
        id: '',
        formId: data.formId,
        status: 'FAILED',
        score: 0,
        quality: 'UNKNOWN',
        errors: ['Processing failed']
      };
    }
  }

  // Get form configuration
  private async getForm(formId: string) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v2/leadpulse-forms/${formId}?include=fields&fieldsOrderBy=order:asc`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch form:', { formId, error });
      return null;
    }
  }

  // Validate submission data against form fields
  private async validateSubmission(form: any, submissionData: Record<string, any>) {
    const errors: string[] = [];

    for (const field of form.fields) {
      const value = submissionData[field.name];

      // Check required fields
      if (field.isRequired && (!value || value === '')) {
        errors.push(`Field '${field.label}' is required`);
        continue;
      }

      // Skip validation if field is empty and not required
      if (!value || value === '') continue;

      // Validate by field type
      switch (field.type) {
        case 'EMAIL':
          if (!this.isValidEmail(value)) {
            errors.push(`Field '${field.label}' must be a valid email address`);
          }
          break;

        case 'PHONE':
          if (!this.isValidPhone(value)) {
            errors.push(`Field '${field.label}' must be a valid phone number`);
          }
          break;

        case 'NUMBER':
          if (isNaN(Number(value))) {
            errors.push(`Field '${field.label}' must be a number`);
          }
          break;

        case 'FILE':
          if (field.fileTypes && field.fileTypes.length > 0) {
            // File validation would be handled in the upload process
          }
          break;
      }

      // Custom validation rules
      if (field.validation) {
        const customErrors = this.validateCustomRules(field, value);
        errors.push(...customErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check for spam and duplicates
  private async checkSpamAndDuplicates(data: FormSubmissionData) {
    const checks = await Promise.all([
      this.checkForSpam(data),
      this.checkForDuplicates(data)
    ]);

    return {
      isSpam: checks[0],
      isDuplicate: checks[1]
    };
  }

  // Basic spam detection
  private async checkForSpam(data: FormSubmissionData): Promise<boolean> {
    const suspiciousPatterns = [
      /viagra|cialis|casino|lottery|winner/i,
      /\b\d{4,}\b.*\b\d{4,}\b/, // Multiple long numbers
      /[A-Z]{10,}/, // Too many caps
    ];

    const submissionText = Object.values(data.submissionData).join(' ').toLowerCase();
    
    return suspiciousPatterns.some(pattern => pattern.test(submissionText));
  }

  // Check for duplicate submissions
  private async checkForDuplicates(data: FormSubmissionData): Promise<boolean> {
    const emailField = Object.entries(data.submissionData).find(
      ([key, value]) => key.toLowerCase().includes('email') && value
    );

    if (!emailField) return false;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const response = await fetch(
      `${BACKEND_URL}/api/v2/form-submissions?formId=${data.formId}&submittedAt[gte]=${twentyFourHoursAgo}&fieldName=${emailField[0]}&fieldValue=${encodeURIComponent(emailField[1])}&limit=1`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      return false;
    }

    const submissions = await response.json();
    return submissions.length > 0;
  }

  // Score the submission for lead quality
  private async scoreSubmission(form: any, submissionData: Record<string, any>, context: any) {
    let score = 0;
    const factors: string[] = [];

    // Base score for form completion
    score += 10;
    factors.push('Form completed');

    // Score based on field types and values
    for (const field of form.fields) {
      const value = submissionData[field.name];
      if (!value) continue;

      switch (field.type) {
        case 'EMAIL':
          score += 15;
          factors.push('Email provided');
          break;

        case 'PHONE':
          score += 20;
          factors.push('Phone provided');
          break;

        case 'TEXT':
          if (field.name.toLowerCase().includes('company')) {
            score += 25;
            factors.push('Company information');
          }
          if (field.name.toLowerCase().includes('title') || field.name.toLowerCase().includes('job')) {
            score += 15;
            factors.push('Job title provided');
          }
          break;

        case 'TEXTAREA':
          if (value.length > 50) {
            score += 10;
            factors.push('Detailed message');
          }
          break;

        case 'SELECT':
        case 'RADIO':
          score += 5;
          factors.push('Preference indicated');
          break;
      }
    }

    // Context-based scoring
    if (context.utmSource === 'google' || context.utmSource === 'linkedin') {
      score += 10;
      factors.push('High-quality traffic source');
    }

    if (context.referrer && !context.referrer.includes('google')) {
      score += 5;
      factors.push('Direct or referral traffic');
    }

    // Cap the score at 100
    score = Math.min(score, 100);

    return { score, factors };
  }

  // Qualify lead based on score
  private qualifyLead(score: number): 'UNKNOWN' | 'COLD' | 'WARM' | 'HOT' | 'QUALIFIED' {
    if (score >= 80) return 'QUALIFIED';
    if (score >= 60) return 'HOT';
    if (score >= 40) return 'WARM';
    if (score >= 20) return 'COLD';
    return 'UNKNOWN';
  }

  // Create or update contact record
  private async processContact(submissionData: Record<string, any>, context: any): Promise<string | undefined> {
    try {
      const emailField = Object.entries(submissionData).find(
        ([key]) => key.toLowerCase().includes('email')
      );

      if (!emailField || !emailField[1]) {
        return undefined;
      }

      const email = emailField[1] as string;

      // Extract common fields
      const firstName = this.extractFieldValue(submissionData, ['firstname', 'first_name', 'fname']);
      const lastName = this.extractFieldValue(submissionData, ['lastname', 'last_name', 'lname']);
      const phone = this.extractFieldValue(submissionData, ['phone', 'telephone', 'mobile']);
      const company = this.extractFieldValue(submissionData, ['company', 'organization', 'org']);
      const jobTitle = this.extractFieldValue(submissionData, ['title', 'job_title', 'position']);

      // Check if contact exists
      const findResponse = await fetch(`${BACKEND_URL}/api/v2/contacts?email=${encodeURIComponent(email)}&limit=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      let contact;
      const existingContacts = findResponse.ok ? await findResponse.json() : [];

      if (existingContacts.length > 0) {
        // Update existing contact
        const updateResponse = await fetch(`${BACKEND_URL}/api/v2/contacts/${existingContacts[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: firstName || existingContacts[0].firstName,
            lastName: lastName || existingContacts[0].lastName,
            phone: phone || existingContacts[0].phone,
            company: company || existingContacts[0].company,
            jobTitle: jobTitle || existingContacts[0].jobTitle,
            lastEngaged: new Date(),
            source: existingContacts[0].source || 'leadpulse_form'
          })
        });

        if (!updateResponse.ok) {
          throw new Error(`Failed to update contact: ${updateResponse.status}`);
        }

        contact = await updateResponse.json();
      } else {
        // Create new contact
        const createResponse = await fetch(`${BACKEND_URL}/api/v2/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            phone,
            company,
            jobTitle,
            source: 'leadpulse_form',
            lastEngaged: new Date(),
            createdById: 'system' // You might want to get this from form or user context
          })
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create contact: ${createResponse.status}`);
        }

        contact = await createResponse.json();
      }

      return contact.id;

    } catch (error) {
      logger.error('Error processing contact:', error);
      return undefined;
    }
  }

  // Create submission record in database
  private async createSubmissionRecord(
    data: FormSubmissionData,
    status: 'PROCESSED' | 'FAILED' | 'SPAM' | 'DUPLICATE',
    score: number,
    quality: 'UNKNOWN' | 'COLD' | 'WARM' | 'HOT' | 'QUALIFIED',
    contactId?: string
  ): Promise<ProcessedSubmission> {

    const submissionResponse = await fetch(`${BACKEND_URL}/api/v2/form-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formId: data.formId,
        visitorId: data.visitorId,
        contactId,
        submittedAt: data.context.timestamp,
        ipAddress: data.context.ipAddress,
        userAgent: data.context.userAgent,
        referrer: data.context.referrer,
        utmSource: data.context.utmSource,
        utmMedium: data.context.utmMedium,
        utmCampaign: data.context.utmCampaign,
        status,
        processedAt: new Date(),
        score,
        quality,
        metadata: data.context
      })
    });

    if (!submissionResponse.ok) {
      throw new Error(`Failed to create submission: ${submissionResponse.status}`);
    }

    const submission = await submissionResponse.json();

    // Create submission data records
    if (status === 'PROCESSED') {
      const form = await this.getForm(data.formId);
      if (form) {
        for (const [fieldName, value] of Object.entries(data.submissionData)) {
          const field = form.fields.find((f: any) => f.name === fieldName);
          if (field && value !== null && value !== undefined) {
            const dataResponse = await fetch(`${BACKEND_URL}/api/v2/submission-data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                submissionId: submission.id,
                fieldId: field.id,
                fieldName,
                fieldType: field.type,
                value: String(value)
              })
            });

            if (!dataResponse.ok) {
              logger.error('Failed to create submission data:', { fieldName, error: dataResponse.status });
            }
          }
        }
      }
    }

    return {
      id: submission.id,
      formId: data.formId,
      contactId,
      visitorId: data.visitorId,
      status,
      score,
      quality
    };
  }

  // Update form analytics
  private async updateFormAnalytics(formId: string, context: any): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch(`${BACKEND_URL}/api/v2/form-analytics/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            formId_date: {
              formId,
              date: new Date(today)
            }
          },
          update: {
            submissions: { increment: 1 },
            completions: { increment: 1 }
          },
          create: {
            formId,
            date: new Date(today),
            submissions: 1,
            completions: 1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update form analytics: ${response.status}`);
      }

      // Invalidate analytics cache
      await leadPulseCache.invalidateAnalyticsOverview();

    } catch (error) {
      logger.error('Error updating form analytics:', error);
    }
  }

  // Trigger automations and workflows
  private async triggerAutomations(form: any, submission: ProcessedSubmission, contactId?: string): Promise<void> {
    try {
      // Here you could trigger:
      // - Email notifications
      // - Workflow automations
      // - Webhook calls
      // - CRM integrations
      
      logger.info('Triggering automations for form submission', {
        formId: form.id,
        submissionId: submission.id,
        contactId
      });

      // Example: Create a notification for high-quality leads
      if (submission.quality === 'HOT' || submission.quality === 'QUALIFIED') {
        // TODO: Send notification to sales team
        logger.info('High-quality lead detected', { submissionId: submission.id });
      }

    } catch (error) {
      logger.error('Error triggering automations:', error);
    }
  }

  // Helper methods
  private extractFieldValue(data: Record<string, any>, fieldNames: string[]): string | undefined {
    for (const fieldName of fieldNames) {
      const value = data[fieldName] || data[fieldName.toLowerCase()];
      if (value) return String(value);
    }
    return undefined;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  private validateCustomRules(field: any, value: any): string[] {
    const errors: string[] = [];
    
    if (field.validation) {
      // Minimum length
      if (field.validation.minLength && String(value).length < field.validation.minLength) {
        errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
      }

      // Maximum length
      if (field.validation.maxLength && String(value).length > field.validation.maxLength) {
        errors.push(`${field.label} must be no more than ${field.validation.maxLength} characters`);
      }

      // Regular expression
      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(String(value))) {
          errors.push(`${field.label} format is invalid`);
        }
      }
    }

    return errors;
  }
}

// Export singleton instance
export const formProcessor = FormProcessor.getInstance();