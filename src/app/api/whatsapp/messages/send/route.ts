/**
 * WhatsApp Individual Message Send API Endpoint
 * 
 * Sends various types of WhatsApp messages (text, media, interactive, location).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappService } from '@/lib/whatsapp-service';
import { whatsappCompliance } from '@/lib/whatsapp-compliance';
import { whatsappLogger } from '@/lib/whatsapp-campaign-logger';
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from '@/lib/errors';

// POST - Send a WhatsApp message
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { 
      to, 
      type, 
      content, 
      media, 
      interactive, 
      location,
      skipCompliance = false 
    } = body;

    // Validate required fields
    if (!to) {
      return validationError('to (phone number) is required');
    }

    if (!type) {
      return validationError('type is required');
    }

    // Validate message type
    const validTypes = ['text', 'media', 'interactive', 'location'];
    if (!validTypes.includes(type)) {
      return validationError(`Invalid message type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate phone number format
    if (!whatsappService.validatePhoneNumber(to)) {
      return validationError('Invalid phone number format. Must be a valid African phone number.');
    }

    // WhatsApp Business API Compliance Validation (unless skipped for testing)
    if (!skipCompliance) {
      const complianceResult = await whatsappCompliance.validateCompliance({
        messageType: type === 'text' ? 'text' : 'media',
        recipientPhone: to,
        messageContent: content || 'Media/Interactive message',
        lastInteractionTime: new Date(Date.now() - 1000 * 60 * 60), // Mock 1 hour ago
        userOptInStatus: undefined, // Will generate warning
      });

      if (!complianceResult.isCompliant) {
        await whatsappLogger.logComplianceCheckFailed('individual', complianceResult.errors, complianceResult.warnings, {
          userId: session.user.id,
          recipientPhone: to,
          messageType: type
        });

        return NextResponse.json({
          success: false,
          error: 'Message violates WhatsApp Business API compliance',
          complianceErrors: complianceResult.errors,
          complianceWarnings: complianceResult.warnings
        }, { status: 400 });
      }

      // Log compliance warnings if any
      if (complianceResult.warnings.length > 0) {
        await whatsappLogger.logComplianceWarning('individual', complianceResult.warnings, {
          userId: session.user.id,
          recipientPhone: to
        });
      }
    }

    let result;

    // Send message based on type
    switch (type) {
      case 'text':
        if (!content) {
          return validationError('content is required for text messages');
        }
        result = await whatsappService.sendTextMessage(to, content);
        break;

      case 'media':
        if (!media) {
          return validationError('media object is required for media messages');
        }
        
        // Validate media object
        if (!media.type || !validTypes.includes(media.type)) {
          const validMediaTypes = ['image', 'document', 'audio', 'video'];
          return validationError(`Invalid media type. Must be one of: ${validMediaTypes.join(', ')}`);
        }

        if (!media.id && !media.url) {
          return validationError('Media must have either id or url');
        }

        result = await whatsappService.sendMediaMessage(to, media);
        break;

      case 'interactive':
        if (!interactive) {
          return validationError('interactive object is required for interactive messages');
        }

        // Validate interactive object
        if (!interactive.type || !['button', 'list'].includes(interactive.type)) {
          return validationError('Interactive type must be either "button" or "list"');
        }

        if (!interactive.body || !interactive.body.text) {
          return validationError('Interactive message must have body text');
        }

        if (!interactive.action) {
          return validationError('Interactive message must have action');
        }

        result = await whatsappService.sendInteractiveMessage(to, interactive);
        break;

      case 'location':
        if (!location) {
          return validationError('location object is required for location messages');
        }

        if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
          return validationError('Location must have valid latitude and longitude numbers');
        }

        result = await whatsappService.sendLocationMessage(
          to, 
          location.latitude, 
          location.longitude, 
          location.name, 
          location.address
        );
        break;

      default:
        return validationError(`Unsupported message type: ${type}`);
    }

    // Handle send result
    if (!result.success) {
      await whatsappLogger.logMessageFailed(
        'individual',
        'individual',
        to,
        result.error,
        { 
          userId: session.user.id, 
          messageType: type,
          isIndividualMessage: true
        }
      );

      return NextResponse.json({
        success: false,
        error: result.error?.message || 'Message sending failed'
      }, { status: 400 });
    }

    // Log successful send
    await whatsappLogger.logMessageSent(
      'individual',
      'individual',
      result.messageId || '',
      to,
      { 
        userId: session.user.id, 
        messageType: type,
        isIndividualMessage: true
      }
    );

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipient: to,
      messageType: type,
      sentAt: new Date().toISOString(),
      sentBy: session.user.id,
      isWhatsAppConfigured: whatsappService.isConfigured()
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    await whatsappLogger.logMessageFailed(
      'individual',
      'individual',
      'unknown',
      error,
      { 
        userId: session.user.id,
        isIndividualMessage: true
      }
    );
    
    return handleApiError(error, '/api/whatsapp/messages/send/route.ts');
  }
}