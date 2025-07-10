import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { whatsappService } from "@/lib/whatsapp-service";
import { whatsappCompliance } from "@/lib/whatsapp-compliance";
import { 
  handleApiError, 
  unauthorized,
  validationError 
} from "@/lib/errors";

// Schema for individual WhatsApp message sending
const whatsappSchema = z.object({
  to: z.string().min(1, "Recipient phone number is required").refine(
    (phone) => whatsappService.validatePhoneNumber(phone),
    {
      message: "Invalid recipient phone number format. Must be a valid international format (e.g., +234XXXXXXXXXX)"
    }
  ),
  message: z.string().min(1, "Message content is required").max(4096, "Message too long (WhatsApp limit: 4096 characters)"),
  contactId: z.string().optional(),
  saveToHistory: z.boolean().optional().default(true),
  personalize: z.boolean().optional().default(false),
  templateId: z.string().optional(),
  skipComplianceCheck: z.boolean().optional().default(false), // For admin override
});

// POST endpoint to send individual WhatsApp message
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const validation = whatsappSchema.safeParse(body);
    
    if (!validation.success) {
      return validationError("Invalid WhatsApp message request", validation.error.format());
    }

    const { to, message, contactId, saveToHistory, personalize, templateId, skipComplianceCheck } = validation.data;

    let finalMessage = message;
    let contact = null;

    // If contactId is provided, fetch contact data for personalization
    if (contactId) {
      contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          jobTitle: true,
          address: true,
          city: true,
          state: true,
          country: true,
          customFields: true,
          createdById: true,
        }
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }

      // Check if user has access to this contact
      const isAdmin = session.user.role === "SUPER_ADMIN" || 
                     session.user.role === "ADMIN" || 
                     session.user.role === "IT_ADMIN";
      
      if (!isAdmin && contact.createdById !== session.user.id) {
        return NextResponse.json(
          { error: "Access denied to this contact" },
          { status: 403 }
        );
      }

      // Apply personalization if requested
      if (personalize) {
        finalMessage = personalizeMessage(message, contact);
      }
    }

    // Validate final message length after personalization
    if (finalMessage.length > 4096) {
      return NextResponse.json(
        { 
          error: "Message too long after personalization", 
          details: {
            originalLength: message.length,
            personalizedLength: finalMessage.length,
            maxLength: 4096
          }
        },
        { status: 400 }
      );
    }

    // WhatsApp Business API Compliance Validation (unless skipped by admin)
    const isAdmin = session.user.role === "SUPER_ADMIN" || 
                   session.user.role === "ADMIN" || 
                   session.user.role === "IT_ADMIN";
    
    if (!skipComplianceCheck || !isAdmin) {
      const messageType = templateId ? 'template' : 'text';
      
      const complianceResult = await whatsappCompliance.validateCompliance({
        messageType,
        templateId: templateId || undefined,
        recipientPhone: to,
        messageContent: finalMessage,
        // Note: In production, these should come from actual user interaction data
        lastInteractionTime: messageType === 'text' ? new Date(Date.now() - 1000 * 60 * 60) : undefined, // Mock 1 hour ago
        userOptInStatus: undefined, // Will generate warning to check opt-in status
      });

      if (!complianceResult.isCompliant) {
        return NextResponse.json(
          {
            error: "WhatsApp message cannot be sent due to compliance violations",
            complianceErrors: complianceResult.errors,
            complianceWarnings: complianceResult.warnings,
            complianceHint: "Ensure recipient has opted in and message complies with WhatsApp Business API policies"
          },
          { status: 400 }
        );
      }

      // Log compliance warnings if any
      if (complianceResult.warnings.length > 0) {
        console.warn("WhatsApp compliance warnings:", complianceResult.warnings);
      }
    }

    // If template is specified, validate it exists and is approved
    let template = null;
    if (templateId) {
      template = await prisma.whatsAppTemplate.findUnique({
        where: { id: templateId },
        select: {
          id: true,
          name: true,
          status: true,
          content: true,
          createdById: true,
        }
      });

      if (!template) {
        return NextResponse.json(
          { error: "WhatsApp template not found" },
          { status: 404 }
        );
      }

      // Check if user has access to this template
      if (!isAdmin && template.createdById !== session.user.id) {
        return NextResponse.json(
          { error: "Access denied to this template" },
          { status: 403 }
        );
      }

      // Check if template is approved
      if (template.status !== "APPROVED") {
        return NextResponse.json(
          { 
            error: "WhatsApp template must be approved by Meta before sending",
            templateStatus: template.status,
            templateId: template.id
          },
          { status: 400 }
        );
      }
    }

    // Send WhatsApp message
    const waResult = await whatsappService.sendTextMessage(to, finalMessage);

    // Save to history if requested
    let historyRecord = null;
    if (saveToHistory) {
      try {
        historyRecord = await prisma.whatsAppHistory.create({
          data: {
            to,
            message: finalMessage,
            originalMessage: personalize ? message : null,
            contactId: contactId || null,
            templateId: templateId || null,
            userId: session.user.id,
            status: waResult.success ? "SENT" : "FAILED",
            messageId: waResult.messageId || null,
            error: waResult.error ? JSON.stringify(waResult.error) : null,
            metadata: JSON.stringify({
              personalized: personalize,
              skippedCompliance: skipComplianceCheck && isAdmin,
              isConfigured: whatsappService.isConfigured(),
              timestamp: new Date().toISOString()
            })
          }
        });
      } catch (dbError) {
        console.error("Error saving WhatsApp message to history:", dbError);
        // Continue even if history save fails
      }
    }

    return NextResponse.json({
      success: waResult.success,
      messageId: waResult.messageId,
      error: waResult.error,
      details: {
        to,
        message: finalMessage,
        originalMessage: personalize ? message : finalMessage,
        personalized: personalize,
        contactId: contactId || null,
        templateId: templateId || null,
        templateName: template?.name || null,
        characterCount: finalMessage.length,
        withinWhatsAppLimit: finalMessage.length <= 4096,
        historyId: historyRecord?.id || null,
        isConfigured: whatsappService.isConfigured(),
        complianceChecked: !skipComplianceCheck || !isAdmin
      }
    });

  } catch (error) {
    return handleApiError(error, "/api/whatsapp/send/route.ts");
  }
}

// Enhanced WhatsApp message personalization (same as campaign sending)
function personalizeMessage(content: string, contact: any): string {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  let personalizedContent = content;
  
  // Comprehensive contact variable mapping
  const contactVariables = {
    // Basic contact information
    'firstName': contact.firstName || '',
    'lastName': contact.lastName || '',
    'fullName': `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Customer',
    'email': contact.email || '',
    'phone': contact.phone || '',
    'company': contact.company || '',
    'jobTitle': contact.jobTitle || '',
    
    // Additional contact fields
    'address': contact.address || '',
    'city': contact.city || '',
    'state': contact.state || '',
    'country': contact.country || '',
    'postalCode': contact.postalCode || '',
    
    // Dynamic variables
    'date': new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    'time': new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    'dayOfWeek': new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    'month': new Date().toLocaleDateString('en-US', { month: 'long' }),
    'year': new Date().getFullYear().toString(),
    
    // Greeting variables based on time
    'greeting': getTimeBasedGreeting(),
    'timeGreeting': getTimeSpecificGreeting(),
  };

  // Parse and extract custom fields if available
  if (contact.customFields) {
    try {
      const customFields = typeof contact.customFields === 'string' 
        ? JSON.parse(contact.customFields) 
        : contact.customFields;
      
      if (customFields && typeof customFields === 'object') {
        Object.entries(customFields).forEach(([key, value]) => {
          contactVariables[`custom_${key}`] = String(value || '');
        });
      }
    } catch (error) {
      console.warn('Failed to parse custom fields for personalization:', error);
    }
  }

  // Replace all variables using regex
  Object.entries(contactVariables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    personalizedContent = personalizedContent.replace(regex, String(value));
  });

  // Handle special formatting for names
  personalizedContent = personalizedContent.replace(/\{\{firstName\|title\}\}/gi, 
    contact.firstName ? toTitleCase(contact.firstName) : '');
  personalizedContent = personalizedContent.replace(/\{\{lastName\|title\}\}/gi, 
    contact.lastName ? toTitleCase(contact.lastName) : '');
  personalizedContent = personalizedContent.replace(/\{\{fullName\|title\}\}/gi, 
    `${toTitleCase(contact.firstName || '')} ${toTitleCase(contact.lastName || '')}`.trim() || 'Customer');

  // Handle conditional personalization
  personalizedContent = handleConditionalPersonalization(personalizedContent, contact);

  // Clean up any remaining empty placeholders
  personalizedContent = personalizedContent.replace(/\{\{[^}]*\}\}/g, '');
  
  // Clean up extra spaces and normalize whitespace
  personalizedContent = personalizedContent.replace(/\s+/g, ' ').trim();
  
  // Ensure message ends properly (no trailing punctuation issues)
  personalizedContent = normalizeMessageEnding(personalizedContent);
  
  return personalizedContent;
}

// Helper function for time-based greetings
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Helper function for specific time greetings
function getTimeSpecificGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Hope you\'re having a restful night';
  if (hour < 12) return 'Hope you\'re having a great morning';
  if (hour < 17) return 'Hope you\'re having a productive afternoon';
  if (hour < 21) return 'Hope you\'re having a lovely evening';
  return 'Hope you\'re having a peaceful night';
}

// Helper function to convert text to title case
function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Handle conditional personalization (e.g., {{if:company}}at {{company}}{{/if}})
function handleConditionalPersonalization(content: string, contact: any): string {
  // Simple conditional logic for company
  const companyConditionalRegex = /\{\{if:company\}\}(.*?)\{\{\/if\}\}/gi;
  content = content.replace(companyConditionalRegex, (match, innerContent) => {
    return contact.company ? innerContent.replace(/\{\{company\}\}/g, contact.company) : '';
  });

  // Simple conditional logic for job title
  const jobTitleConditionalRegex = /\{\{if:jobTitle\}\}(.*?)\{\{\/if\}\}/gi;
  content = content.replace(jobTitleConditionalRegex, (match, innerContent) => {
    return contact.jobTitle ? innerContent.replace(/\{\{jobTitle\}\}/g, contact.jobTitle) : '';
  });

  return content;
}

// Normalize message ending to avoid awkward punctuation
function normalizeMessageEnding(content: string): string {
  // Remove multiple punctuation marks at the end
  content = content.replace(/[.!?]+$/, '');
  
  // Add appropriate ending if message doesn't end with punctuation
  if (content && !content.match(/[.!?]$/)) {
    // If message seems like a question, add question mark
    if (content.toLowerCase().includes('how') || content.toLowerCase().includes('what') || 
        content.toLowerCase().includes('when') || content.toLowerCase().includes('where') ||
        content.toLowerCase().includes('why') || content.toLowerCase().includes('would you')) {
      content += '?';
    } else {
      content += '.';
    }
  }
  
  return content;
}