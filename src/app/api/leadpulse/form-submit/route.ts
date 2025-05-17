import { NextRequest, NextResponse } from 'next/server';
import { processFormSubmission } from '@/lib/leadpulse/formBuilder';
import { convertVisitorToContact, updateVisitorEngagement } from '@/lib/leadpulse/visitorTracking';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * Form submission endpoint for LeadPulse
 * Processes form submissions and creates contacts
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.formId || !body.formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if form exists
    const form = await prisma.leadPulseForm.findUnique({
      where: { id: body.formId }
    });
    
    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }
    
    // Check if pixel ID is valid if provided
    if (body.pixelId) {
      const pixelConfig = await prisma.leadPulseConfig.findUnique({
        where: { pixelId: body.pixelId }
      });
      
      if (!pixelConfig) {
        return NextResponse.json(
          { error: 'Invalid pixel ID' },
          { status: 400 }
        );
      }
    }
    
    // Process the form submission
    let result;
    
    if (body.visitorId) {
      // If we have a visitor ID, process form submission with that ID
      try {
        result = await processFormSubmission(body.formId, body.visitorId, body.formData);
      } catch (error) {
        // If visitor doesn't exist or there's another error with the visitor
        logger.error('Error processing form with visitor ID', { 
          error, 
          visitorId: body.visitorId 
        });
        
        // Create a contact directly if we have email or phone
        if (body.formData.email || body.formData.phone) {
          const contact = await prisma.contact.create({
            data: {
              id: String(Date.now()),
              email: body.formData.email,
              phone: body.formData.phone,
              firstName: body.formData.firstName || body.formData.first_name,
              lastName: body.formData.lastName || body.formData.last_name,
              company: body.formData.company,
              source: 'LeadPulse Form',
              createdAt: new Date(),
              updatedAt: new Date(),
              // This assumes a system user or requires a user ID to be provided
              createdById: process.env.SYSTEM_USER_ID || 'default-user-id',
            }
          });
          
          result = { success: true, contact };
        } else {
          result = { success: true };
        }
      }
    } else {
      // If no visitor ID, we'll just create a contact directly
      if (body.formData.email || body.formData.phone) {
        const contact = await prisma.contact.create({
          data: {
            id: String(Date.now()),
            email: body.formData.email,
            phone: body.formData.phone,
            firstName: body.formData.firstName || body.formData.first_name,
            lastName: body.formData.lastName || body.formData.last_name,
            company: body.formData.company,
            source: 'LeadPulse Form',
            createdAt: new Date(),
            updatedAt: new Date(),
            // This assumes a system user or requires a user ID to be provided
            createdById: process.env.SYSTEM_USER_ID || 'default-user-id',
          }
        });
        
        result = { success: true, contact };
      } else {
        result = { success: true };
      }
    }
    
    // Increment form submissions count
    await prisma.leadPulseForm.update({
      where: { id: body.formId },
      data: {
        submissions: {
          increment: 1
        }
      }
    });
    
    // Update conversion rate
    if (form.views > 0) {
      const conversionRate = (form.submissions + 1) / form.views;
      await prisma.leadPulseForm.update({
        where: { id: body.formId },
        data: {
          conversionRate
        }
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
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 