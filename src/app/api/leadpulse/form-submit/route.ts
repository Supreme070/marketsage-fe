import { type NextRequest, NextResponse } from 'next/server';
import { processFormSubmission } from '@/lib/leadpulse/formBuilder';
import { convertVisitorToContact, updateVisitorEngagement } from '@/lib/leadpulse/visitorTracking';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { createRateLimitMiddleware } from '@/lib/leadpulse/rate-limiter';
import { detectBotInRequest, BotConfidence } from '@/lib/leadpulse/bot-detector';
import { validateFormSubmission, createValidationErrorResponse, validateIpAddress } from '@/lib/leadpulse/validation';
import { createErrorHandledRequest, handleFormSubmissionError, withDatabaseErrorHandling } from '@/lib/leadpulse/error-middleware';
import { ErrorCategory } from '@/lib/leadpulse/error-boundary';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * Form submission endpoint for LeadPulse
 * Processes form submissions and creates contacts
 */
export async function POST(request: NextRequest) {
  const errorHandler = createErrorHandledRequest(request);
  
  try {
    // Apply stricter rate limiting for form submissions
    const rateLimitMiddleware = createRateLimitMiddleware('FORM_SUBMIT');
    const rateLimitResult = await rateLimitMiddleware(request);
    
    if (rateLimitResult.blocked || !rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for form submission', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        blocked: rateLimitResult.blocked,
      });
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitResult.blocked 
            ? 'Too many form submissions from this IP address. Please try again later.'
            : 'Form submission rate exceeded. Please wait before submitting again.',
        },
        {
          status: rateLimitResult.status,
          headers: rateLimitResult.headers,
        }
      );
    }
    
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in form submission request', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Comprehensive data validation
    const validation = validateFormSubmission(body);
    if (!validation.success) {
      logger.warn('Invalid form submission data', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        error: validation.error,
        field: validation.error?.field,
        formId: body.formId,
      });
      
      return NextResponse.json(
        createValidationErrorResponse(validation),
        { status: 400 }
      );
    }
    
    // Use validated and sanitized data
    body = validation.data;
    
    // Validate IP address
    let ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';
    
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    if (!validateIpAddress(ip)) {
      logger.warn('Invalid IP address in form submission', { ip });
      ip = '127.0.0.1';
    }
    
    // Check if form exists with error handling
    const form = await errorHandler.execute(
      () => prisma.leadPulseForm.findUnique({
        where: { id: body.formId }
      }),
      ErrorCategory.DATABASE,
      'findForm'
    );
    
    if (!form) {
      logger.warn('Form not found for submission', {
        formId: body.formId,
        ip,
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }
    
    // Check if pixel ID is valid if provided
    if (body.pixelId) {
      const pixelConfig = await errorHandler.execute(
        () => prisma.leadPulseConfig.findUnique({
          where: { pixelId: body.pixelId }
        }),
        ErrorCategory.DATABASE,
        'findPixelConfig'
      );
      
      if (!pixelConfig) {
        logger.warn('Invalid pixel ID in form submission', {
          pixelId: body.pixelId,
          formId: body.formId,
          ip,
        });
        
        return NextResponse.json(
          { error: 'Invalid pixel ID' },
          { status: 400 }
        );
      }
      
      // Update context
      errorHandler.context.pixelId = body.pixelId;
    }
    
    // Update context with form information
    errorHandler.context.metadata = {
      ...errorHandler.context.metadata,
      formId: body.formId,
      formData: body.formData,
    };

    // Bot detection - especially important for form submissions
    const botDetectionResult = await detectBotInRequest(request);
    
    // Block confirmed bots from form submissions (stricter than tracking)
    if (botDetectionResult.action === 'block' || botDetectionResult.confidence >= BotConfidence.LIKELY_BOT) {
      logger.warn('Blocked bot form submission', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        confidence: botDetectionResult.confidence,
        score: botDetectionResult.score,
        formId: body.formId,
        reasons: botDetectionResult.reasons,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Submission blocked',
          message: 'Automated form submission detected'
        },
        { status: 403 }
      );
    }
    
    // Process the form submission with error handling
    let result;
    
    if (body.visitorId) {
      // If we have a visitor ID, process form submission with that ID
      try {
        result = await errorHandler.execute(
          () => processFormSubmission(body.formId, body.visitorId, body.formData),
          ErrorCategory.PROCESSING,
          'processFormSubmission'
        );
      } catch (error) {
        // If visitor doesn't exist or there's another error with the visitor
        logger.error('Error processing form with visitor ID', { 
          error, 
          visitorId: body.visitorId,
          formId: body.formId,
        });
        
        // Create a contact directly if we have valid email or phone
        if (body.formData.email || body.formData.phone) {
          // Additional validation for contact creation
          const contactData: any = {
            id: String(Date.now()),
            source: 'LeadPulse Form',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdById: process.env.SYSTEM_USER_ID || 'default-user-id',
          };
          
          // Only add validated fields
          if (body.formData.email) contactData.email = body.formData.email;
          if (body.formData.phone) contactData.phone = body.formData.phone;
          if (body.formData.firstName || body.formData.first_name) {
            contactData.firstName = body.formData.firstName || body.formData.first_name;
          }
          if (body.formData.lastName || body.formData.last_name) {
            contactData.lastName = body.formData.lastName || body.formData.last_name;
          }
          if (body.formData.company) contactData.company = body.formData.company;
          
          const contact = await errorHandler.execute(
            () => prisma.contact.create({ data: contactData }),
            ErrorCategory.DATABASE,
            'createContact'
          );
          result = { success: true, contact };
        } else {
          result = { success: true };
        }
      }
    } else {
      // If no visitor ID, create a contact directly with validated data
      if (body.formData.email || body.formData.phone) {
        // Prepare contact data with only validated fields
        const contactData: any = {
          id: String(Date.now()),
          source: 'LeadPulse Form',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: process.env.SYSTEM_USER_ID || 'default-user-id',
        };
        
        // Only add validated fields
        if (body.formData.email) contactData.email = body.formData.email;
        if (body.formData.phone) contactData.phone = body.formData.phone;
        if (body.formData.firstName || body.formData.first_name) {
          contactData.firstName = body.formData.firstName || body.formData.first_name;
        }
        if (body.formData.lastName || body.formData.last_name) {
          contactData.lastName = body.formData.lastName || body.formData.last_name;
        }
        if (body.formData.company) contactData.company = body.formData.company;
        
        const contact = await errorHandler.execute(
          () => prisma.contact.create({ data: contactData }),
          ErrorCategory.DATABASE,
          'createContact'
        );
        result = { success: true, contact };
      } else {
        logger.warn('Form submission without email or phone', {
          formId: body.formId,
          ip,
          formData: Object.keys(body.formData),
        });
        result = { success: true };
      }
    }
    
    // Increment form submissions count with error handling
    await errorHandler.execute(
      () => prisma.leadPulseForm.update({
        where: { id: body.formId },
        data: {
          submissions: {
            increment: 1
          }
        }
      }),
      ErrorCategory.DATABASE,
      'updateFormStats'
    ).catch(error => {
      logger.warn('Failed to update form submission count', { error, formId: body.formId });
    });
    
    // Update conversion rate with error handling
    if (form.views > 0) {
      const conversionRate = (form.submissions + 1) / form.views;
      await errorHandler.execute(
        () => prisma.leadPulseForm.update({
          where: { id: body.formId },
          data: {
            conversionRate
          }
        }),
        ErrorCategory.DATABASE,
        'updateConversionRate'
      ).catch(error => {
        logger.warn('Failed to update form conversion rate', { error, formId: body.formId });
      });
    }
    
    logger.info('Processed form submission', {
      formId: body.formId,
      visitorId: body.visitorId,
      contactCreated: !!result.contact
    });
    
    // Return the result
    return NextResponse.json(
      {
        success: true,
        contactCreated: !!result.contact,
        contactId: result.contact?.id
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error processing form submission', error);
    
    // Use error boundary to handle the error gracefully
    return await handleFormSubmissionError(request, error as Error, {
      visitorId: body?.visitorId,
      metadata: {
        formId: body?.formId,
        formData: body?.formData,
      },
    });
  }
} 