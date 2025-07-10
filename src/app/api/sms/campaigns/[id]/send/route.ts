import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { sendSMS, smsService } from "@/lib/sms-providers/sms-service";
import { smsRetryService } from "@/lib/sms-retry-service";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound 
} from "@/lib/errors";
import { smsLogger } from "@/lib/sms-campaign-logger";

// POST endpoint to send SMS campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  // Check if user is authenticated
  if (!session || !session.user) {
    await smsLogger.logAuthorizationError('anonymous', 'send', `campaign/${campaignId}`);
    return unauthorized();
  }

  try {
    // First check if campaign exists and user has access
    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        lists: {
          include: {
            members: {
              include: {
                contact: true
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
        }
      }
    });

    if (!campaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to send this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      await smsLogger.logAuthorizationError(session.user.id, 'send', `campaign/${campaignId}`, {
        campaignId,
        userId: session.user.id,
        userRole: session.user.role,
        campaignOwnerId: campaign.createdById
      });
      return forbidden("You don't have permission to send this campaign");
    }

    // Check if campaign is in the correct state to be sent
    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      await smsLogger.logValidationError(campaignId, 
        `Invalid campaign status for sending: ${campaign.status}`,
        { currentStatus: campaign.status, allowedStatuses: ["DRAFT", "SCHEDULED"] },
        { userId: session.user.id }
      );
      return NextResponse.json(
        { error: "Campaign can only be sent from DRAFT or SCHEDULED status" },
        { status: 400 }
      );
    }

    // Check if campaign has content
    const messageContent = campaign.content || campaign.template?.content;
    if (!messageContent) {
      return NextResponse.json(
        { error: "Campaign must have content or a template" },
        { status: 400 }
      );
    }

    // Validate sender phone number format
    if (campaign.from && !smsService.validatePhoneNumber(campaign.from)) {
      await smsLogger.logPhoneValidationFailed(campaign.from, 
        "Invalid sender phone number format",
        { campaignId, userId: session.user.id }
      );
      return NextResponse.json(
        { error: "Invalid sender phone number format. Must be a valid African phone number format (e.g., +234XXXXXXXXX, 0XXXXXXXXXX)" },
        { status: 400 }
      );
    }

    // Get all contacts from lists and segments with phone validation
    const allContacts = new Map();
    const invalidPhoneContacts = [];
    
    // Add contacts from lists
    for (const list of campaign.lists) {
      for (const member of list.members) {
        if (member.contact.phone && member.contact.status === "ACTIVE") {
          // Validate recipient phone number format
          if (smsService.validatePhoneNumber(member.contact.phone)) {
            allContacts.set(member.contact.id, member.contact);
          } else {
            invalidPhoneContacts.push({
              id: member.contact.id,
              name: `${member.contact.firstName || ''} ${member.contact.lastName || ''}`.trim(),
              phone: member.contact.phone
            });
          }
        }
      }
    }
    
    // Add contacts from segments
    for (const segment of campaign.segments) {
      for (const member of segment.members) {
        if (member.contact.phone && member.contact.status === "ACTIVE") {
          // Validate recipient phone number format
          if (smsService.validatePhoneNumber(member.contact.phone)) {
            allContacts.set(member.contact.id, member.contact);
          } else {
            // Only add to invalid list if not already added from lists
            if (!invalidPhoneContacts.find(c => c.id === member.contact.id)) {
              invalidPhoneContacts.push({
                id: member.contact.id,
                name: `${member.contact.firstName || ''} ${member.contact.lastName || ''}`.trim(),
                phone: member.contact.phone
              });
            }
          }
        }
      }
    }

    const contacts = Array.from(allContacts.values());

    if (contacts.length === 0) {
      let errorMessage = "No valid contacts found to send SMS to";
      
      if (invalidPhoneContacts.length > 0) {
        errorMessage += `. Found ${invalidPhoneContacts.length} contact(s) with invalid phone numbers`;
      }
      
      await smsLogger.logValidationError(campaignId,
        errorMessage,
        { 
          validContactCount: 0,
          invalidContactCount: invalidPhoneContacts.length,
          listCount: campaign.lists.length,
          segmentCount: campaign.segments.length
        },
        { userId: session.user.id }
      );
      
      return NextResponse.json(
        { 
          error: errorMessage,
          invalidPhoneNumbers: invalidPhoneContacts.length > 0 ? invalidPhoneContacts : undefined,
          validationHint: "Phone numbers must be in valid African format (e.g., +234XXXXXXXXX, 0XXXXXXXXXX)"
        },
        { status: 400 }
      );
    }

    // Log send initiation
    await smsLogger.logSendInitiated(campaignId, contacts.length, {
      userId: session.user.id,
      invalidContactCount: invalidPhoneContacts.length,
      provider: smsService.getProviderName()
    });

    // Update campaign status to SENDING
    await prisma.sMSCampaign.update({
      where: { id: campaignId },
      data: { 
        status: "SENDING",
        sentAt: new Date()
      }
    });

    // Send SMS to all contacts and track activities
    const results = [];
    const activityRecords = [];
    let successCount = 0;
    let failureCount = 0;

    // Process contacts in smaller batches to avoid overwhelming the system
    const batchSize = 50;
    let batchNumber = 0;
    
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      batchNumber++;
      let batchSuccess = 0;
      let batchFailure = 0;
      
      for (const contact of batch) {
        try {
          // Personalize message content
          const personalizedContent = personalizeMessage(messageContent, contact);
          
          // Send SMS
          const smsResult = await sendSMS(contact.phone, personalizedContent);
          
          // Prepare activity record for batch insert
          const activityData = {
            campaignId,
            contactId: contact.id,
            type: smsResult.success ? "SENT" : "FAILED",
            timestamp: new Date(),
            metadata: JSON.stringify({
              messageId: smsResult.messageId,
              error: smsResult.error?.message,
              phoneNumber: contact.phone
            })
          };

          activityRecords.push(activityData);

          if (smsResult.success) {
            successCount++;
            batchSuccess++;
            
            // Log successful send (only for debugging or if marked as important)
            if (process.env.NODE_ENV === 'development') {
              await smsLogger.logMessageSent(
                campaignId,
                contact.id,
                smsResult.messageId || '',
                contact.phone,
                { userId: session.user.id, batchNumber }
              );
            }
          } else {
            failureCount++;
            batchFailure++;
            
            // Try to add to retry queue if retryable
            const addedToRetry = await smsRetryService.addToRetryQueue(
              campaignId,
              contact.id,
              contact.phone,
              personalizedContent,
              smsResult.error,
              session.user.id
            );
            
            // Always log failures (retry service also logs)
            if (!addedToRetry) {
              await smsLogger.logMessageFailed(
                campaignId,
                contact.id,
                contact.phone,
                smsResult.error,
                { userId: session.user.id, batchNumber, retryable: false }
              );
            }
          }

          results.push({
            contactId: contact.id,
            success: smsResult.success,
            messageId: smsResult.messageId,
            error: smsResult.error
          });

        } catch (error) {
          console.error(`Error sending SMS to contact ${contact.id}:`, error);
          failureCount++;
          batchFailure++;
          
          // Try to add to retry queue if retryable
          const addedToRetry = await smsRetryService.addToRetryQueue(
            campaignId,
            contact.id,
            contact.phone,
            personalizedContent,
            error,
            session.user.id
          );
          
          // Log the error (retry service also logs)
          if (!addedToRetry) {
            await smsLogger.logMessageFailed(
              campaignId,
              contact.id,
              contact.phone,
              error,
              { userId: session.user.id, batchNumber, retryable: false }
            );
          }
          
          // Prepare failed activity record for batch insert
          const failedActivityData = {
            campaignId,
            contactId: contact.id,
            type: "FAILED",
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
      await smsLogger.logBatchCompleted(
        campaignId,
        batchNumber,
        batchSuccess,
        batchFailure,
        { userId: session.user.id, totalBatches: Math.ceil(contacts.length / batchSize) }
      );

      // Batch insert activities for this batch to reduce database load
      if (activityRecords.length > 0) {
        try {
          await prisma.sMSActivity.createMany({
            data: activityRecords.splice(0, activityRecords.length)
          });
        } catch (dbError) {
          console.error("Error batch inserting SMS activities:", dbError);
          // Continue processing even if batch insert fails
        }
      }
    }

    // Update campaign status to SENT
    await prisma.sMSCampaign.update({
      where: { id: campaignId },
      data: { 
        status: "SENT"
      }
    });

    // Log campaign completion
    await smsLogger.logSendCompleted(campaignId, successCount, failureCount, {
      userId: session.user.id,
      totalRecipients: contacts.length,
      invalidContactCount: invalidPhoneContacts.length,
      provider: smsService.getProviderName()
    });

    return NextResponse.json({
      message: "SMS campaign sent successfully",
      summary: {
        totalRecipients: contacts.length,
        successCount,
        failureCount,
        invalidPhoneCount: invalidPhoneContacts.length,
        campaignId
      },
      invalidPhoneNumbers: invalidPhoneContacts.length > 0 ? invalidPhoneContacts : undefined,
      warnings: invalidPhoneContacts.length > 0 ? [
        `${invalidPhoneContacts.length} contact(s) were skipped due to invalid phone number format`
      ] : undefined,
      results
    });

  } catch (error) {
    console.error("Error sending SMS campaign:", error);
    
    // Log the campaign failure
    await smsLogger.logCampaignFailed(campaignId, session.user.id, {
      error: error instanceof Error ? error.message : "Unknown error",
      errorDetails: error,
      userId: session.user.id
    });
    
    // Try to update campaign status to FAILED if possible
    try {
      await prisma.sMSCampaign.update({
        where: { id: campaignId },
        data: { status: "CANCELLED" }
      });
    } catch (updateError) {
      console.error("Failed to update campaign status to FAILED:", updateError);
      await smsLogger.logDatabaseError("Update campaign status", updateError, {
        campaignId,
        userId: session.user.id
      });
    }
    
    return handleApiError(error, "/api/sms/campaigns/[id]/send/route.ts");
  }
}

// Enhanced SMS message personalization with comprehensive variable support
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