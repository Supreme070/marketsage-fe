import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus, type ActivityType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { whatsappService } from "@/lib/whatsapp-service";
import { whatsappCompliance } from "@/lib/whatsapp-compliance";
import { whatsappLogger } from "@/lib/whatsapp-campaign-logger";
import { whatsappRetryService } from "@/lib/whatsapp-retry-service";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// POST endpoint to initiate sending of a WhatsApp campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    await whatsappLogger.logAuthorizationError('anonymous', 'send', `campaign/${campaignId}`);
    return unauthorized();
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // First check if campaign exists and user has access
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        lists: {
          include: {
            members: {
              include: {
                contact: true,
              }
            }
          }
        },
        segments: {
          include: {
            members: {
              include: {
                contact: true
              }
            }
          }
        },
      }
    });

    if (!campaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to send this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      await whatsappLogger.logAuthorizationError(session.user.id, 'send', `campaign/${campaignId}`, {
        campaignId,
        userId: session.user.id,
        userRole: session.user.role,
        campaignOwnerId: campaign.createdById
      });
      return forbidden("You don't have permission to send this campaign");
    }

    // Check if campaign is in a state that allows sending
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      await whatsappLogger.logValidationError(campaignId, 
        `Invalid campaign status for sending: ${campaign.status}`,
        { currentStatus: campaign.status, allowedStatuses: [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED] },
        { userId: session.user.id }
      );
      return NextResponse.json(
        { error: `Cannot send campaign with status: ${campaign.status}` },
        { status: 400 }
      );
    }

    // Ensure campaign has content or a template
    if (!campaign.content && !campaign.templateId) {
      return NextResponse.json(
        { error: "Campaign must have content or a template to send" },
        { status: 400 }
      );
    }

    // Get all contacts from lists and segments
    const allContacts = new Map();
    
    // Add contacts from lists
    for (const list of campaign.lists) {
      for (const member of list.members) {
        if (member.contact.phone && member.contact.status === "ACTIVE") {
          allContacts.set(member.contact.id, member.contact);
        }
      }
    }
    
    // Add contacts from segments
    for (const segment of campaign.segments) {
      for (const member of segment.members) {
        if (member.contact.phone && member.contact.status === "ACTIVE") {
          allContacts.set(member.contact.id, member.contact);
        }
      }
    }

    const uniqueContacts = Array.from(allContacts.values());

    if (uniqueContacts.length === 0) {
      return NextResponse.json(
        { error: "No valid contacts found to send WhatsApp messages to" },
        { status: 400 }
      );
    }

    // Check message content
    const messageContent = campaign.content || campaign.template?.content;
    if (!messageContent) {
      return NextResponse.json(
        { error: "Campaign must have content or a template" },
        { status: 400 }
      );
    }

    // Validate WhatsApp template approval status if using a template
    if (campaign.templateId && campaign.template) {
      if (campaign.template.status !== "APPROVED") {
        await whatsappLogger.logTemplateValidationFailed(
          campaign.template.id,
          `Template status is ${campaign.template.status}, required: APPROVED`,
          { 
            campaignId,
            userId: session.user.id,
            templateStatus: campaign.template.status
          }
        );
        return NextResponse.json(
          { 
            error: "WhatsApp template must be approved by Meta before sending",
            templateStatus: campaign.template.status,
            templateId: campaign.template.id
          },
          { status: 400 }
        );
      }
    }

    // WhatsApp Business API Compliance Validation
    const messageType = campaign.templateId ? 'template' : 'text';
    const complianceErrors: string[] = [];
    const complianceWarnings: string[] = [];
    const invalidContacts: any[] = [];

    // Validate campaign-level rate limits
    const rateLimitValidation = await whatsappCompliance.validateRateLimit(
      campaignId, 
      uniqueContacts.length
    );
    
    if (!rateLimitValidation.isCompliant) {
      complianceErrors.push(...rateLimitValidation.errors);
      await whatsappLogger.logRateLimitExceeded(campaignId, uniqueContacts.length, {
        userId: session.user.id,
        limit: rateLimitValidation.metadata?.limit || 0,
        currentRate: rateLimitValidation.metadata?.currentRate || 0
      });
    }
    complianceWarnings.push(...rateLimitValidation.warnings);

    // Validate each contact for compliance
    for (const contact of uniqueContacts) {
      const complianceResult = await whatsappCompliance.validateCompliance({
        messageType,
        templateId: campaign.templateId || undefined,
        templateStatus: campaign.template?.status || undefined,
        recipientPhone: contact.phone,
        messageContent: messageContent,
        campaignId,
        // Note: In production, these should come from actual user interaction data
        lastInteractionTime: messageType === 'text' ? new Date(Date.now() - 1000 * 60 * 60) : undefined, // Mock 1 hour ago
        userOptInStatus: undefined, // Will generate warning to check opt-in status
      });

      if (!complianceResult.isCompliant) {
        invalidContacts.push({
          contactId: contact.id,
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          phone: contact.phone,
          errors: complianceResult.errors
        });
      }

      complianceWarnings.push(...complianceResult.warnings);
    }

    // If there are compliance errors that affect the entire campaign
    if (complianceErrors.length > 0) {
      await whatsappLogger.logComplianceCheckFailed(campaignId, complianceErrors, complianceWarnings, {
        userId: session.user.id,
        invalidContactCount: invalidContacts.length,
        totalContactCount: uniqueContacts.length
      });
      return NextResponse.json(
        {
          error: "Campaign cannot be sent due to WhatsApp Business API compliance violations",
          complianceErrors,
          complianceWarnings: complianceWarnings.length > 0 ? complianceWarnings : undefined,
          invalidContacts: invalidContacts.length > 0 ? invalidContacts : undefined,
          rateLimitInfo: rateLimitValidation.metadata
        },
        { status: 400 }
      );
    }

    // Filter out non-compliant contacts but continue with compliant ones
    const compliantContacts = uniqueContacts.filter(contact => 
      !invalidContacts.find(invalid => invalid.contactId === contact.id)
    );

    if (compliantContacts.length === 0) {
      await whatsappLogger.logValidationError(campaignId, 
        "No compliant contacts found for WhatsApp campaign",
        { 
          complianceWarnings,
          invalidContacts,
          totalContacts: uniqueContacts.length,
          complianceHint: "Ensure recipients have valid phone numbers and have opted in to receive WhatsApp messages"
        },
        { userId: session.user.id }
      );
      return NextResponse.json(
        {
          error: "No compliant contacts found for WhatsApp campaign",
          complianceWarnings,
          invalidContacts,
          totalContacts: uniqueContacts.length,
          complianceHint: "Ensure recipients have valid phone numbers and have opted in to receive WhatsApp messages"
        },
        { status: 400 }
      );
    }

    // Update contact list to only include compliant contacts
    const finalContacts = compliantContacts;

    // Log send initiation with compliance warnings if any
    await whatsappLogger.logSendInitiated(campaignId, finalContacts.length, {
      userId: session.user.id,
      invalidContactCount: invalidContacts.length,
      totalOriginalContacts: uniqueContacts.length,
      messageType,
      templateId: campaign.templateId || undefined
    });

    // Log compliance warnings if any
    if (complianceWarnings.length > 0) {
      await whatsappLogger.logComplianceWarning(campaignId, complianceWarnings, {
        userId: session.user.id,
        invalidContactCount: invalidContacts.length
      });
    }

    // Update campaign status to SENDING and record sent time
    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENDING,
        sentAt: new Date(),
      }
    });

    // Send WhatsApp messages to all contacts and track activities
    const results = [];
    const activityRecords = [];
    let successCount = 0;
    let failureCount = 0;

    // Process compliant contacts in smaller batches to avoid overwhelming the system
    const batchSize = 50;
    let batchNumber = 0;
    
    for (let i = 0; i < finalContacts.length; i += batchSize) {
      const batch = finalContacts.slice(i, i + batchSize);
      batchNumber++;
      let batchSuccess = 0;
      let batchFailure = 0;
      
      for (const contact of batch) {
        try {
          // Phone number already validated in compliance check

          // Personalize message content
          const personalizedContent = personalizeMessage(messageContent, contact);
          
          // Send WhatsApp message
          const waResult = await whatsappService.sendTextMessage(contact.phone, personalizedContent);
          
          // Prepare activity record for batch insert
          const activityData = {
            campaignId,
            contactId: contact.id,
            type: waResult.success ? ("SENT" as ActivityType) : ("FAILED" as ActivityType),
            timestamp: new Date(),
            metadata: JSON.stringify({
              messageId: waResult.messageId,
              error: waResult.error?.message,
              phoneNumber: contact.phone,
              isConfigured: whatsappService.isConfigured()
            })
          };

          activityRecords.push(activityData);

          if (waResult.success) {
            successCount++;
            batchSuccess++;
            
            // Log successful send (only for debugging or if marked as important)
            if (process.env.NODE_ENV === 'development') {
              await whatsappLogger.logMessageSent(
                campaignId,
                contact.id,
                waResult.messageId || '',
                contact.phone,
                { userId: session.user.id, batchNumber, messageType }
              );
            }
          } else {
            failureCount++;
            batchFailure++;
            
            // Try to add to retry queue if retryable
            const addedToRetry = await whatsappRetryService.addToRetryQueue(
              campaignId,
              contact.id,
              contact.phone,
              personalizedContent,
              waResult.error,
              session.user.id
            );
            
            // Always log failures (retry service also logs)
            if (!addedToRetry) {
              await whatsappLogger.logMessageFailed(
                campaignId,
                contact.id,
                contact.phone,
                waResult.error,
                { userId: session.user.id, batchNumber, messageType, retryable: false }
              );
            }
          }

          results.push({
            contactId: contact.id,
            success: waResult.success,
            messageId: waResult.messageId,
            error: waResult.error
          });

        } catch (error) {
          console.error(`Error sending WhatsApp message to contact ${contact.id}:`, error);
          failureCount++;
          batchFailure++;
          
          // Try to add to retry queue if retryable
          const addedToRetry = await whatsappRetryService.addToRetryQueue(
            campaignId,
            contact.id,
            contact.phone,
            personalizedContent,
            error,
            session.user.id
          );
          
          // Log the error (retry service also logs)
          if (!addedToRetry) {
            await whatsappLogger.logMessageFailed(
              campaignId,
              contact.id,
              contact.phone,
              error,
              { userId: session.user.id, batchNumber, messageType, retryable: false }
            );
          }
          
          // Prepare failed activity record for batch insert
          const failedActivityData = {
            campaignId,
            contactId: contact.id,
            type: "FAILED" as ActivityType,
            timestamp: new Date(),
            metadata: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
              phoneNumber: contact.phone
            })
          };

          activityRecords.push(failedActivityData);

          results.push({
            contactId: contact.id,
            success: false,
            error: { message: error instanceof Error ? error.message : "Unknown error" }
          });
        }
      }

      // Log batch completion
      await whatsappLogger.logBatchCompleted(
        campaignId,
        batchNumber,
        batchSuccess,
        batchFailure,
        { 
          userId: session.user.id, 
          totalBatches: Math.ceil(finalContacts.length / batchSize),
          messageType
        }
      );

      // Batch insert activities for this batch to reduce database load
      if (activityRecords.length > 0) {
        try {
          await prisma.whatsAppActivity.createMany({
            data: activityRecords.splice(0, activityRecords.length)
          });
        } catch (dbError) {
          console.error("Error batch inserting WhatsApp activities:", dbError);
          await whatsappLogger.logDatabaseError("Batch insert activities", dbError, {
            campaignId,
            userId: session.user.id,
            batchNumber,
            recordCount: activityRecords.length
          });
          // Continue processing even if batch insert fails
        }
      }
    }

    // Update campaign status to SENT
    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENT,
      }
    });

    // Log campaign completion
    await whatsappLogger.logSendCompleted(campaignId, successCount, failureCount, {
      userId: session.user.id,
      totalRecipients: finalContacts.length,
      invalidContactCount: invalidContacts.length,
      originalContactCount: uniqueContacts.length,
      messageType,
      templateId: campaign.templateId || undefined,
      isConfigured: whatsappService.isConfigured()
    });

    return NextResponse.json({
      message: "WhatsApp campaign sent successfully",
      summary: {
        totalRecipients: finalContacts.length,
        originalContactCount: uniqueContacts.length,
        successCount,
        failureCount,
        invalidContactCount: invalidContacts.length,
        campaignId,
        isWhatsAppConfigured: whatsappService.isConfigured(),
        complianceStatus: "validated"
      },
      complianceInfo: {
        warnings: complianceWarnings.length > 0 ? complianceWarnings : undefined,
        invalidContacts: invalidContacts.length > 0 ? invalidContacts : undefined,
        rateLimitInfo: rateLimitValidation.metadata
      },
      results
    });
  } catch (error) {
    console.error("Error sending WhatsApp campaign:", error);
    
    // Log the campaign failure
    await whatsappLogger.logCampaignFailed(campaignId, session.user.id, {
      error: error instanceof Error ? error.message : "Unknown error",
      errorDetails: error,
      userId: session.user.id
    });
    
    // Try to update campaign status to FAILED if possible
    try {
      await prisma.whatsAppCampaign.update({
        where: { id: campaignId },
        data: { status: "CANCELLED" as CampaignStatus }
      });
    } catch (updateError) {
      console.error("Failed to update campaign status to FAILED:", updateError);
      await whatsappLogger.logDatabaseError("Update campaign status", updateError, {
        campaignId,
        userId: session.user.id
      });
    }
    
    return handleApiError(error, "/api/whatsapp/campaigns/[id]/send/route.ts");
  }
}

// Enhanced WhatsApp message personalization with comprehensive variable support
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