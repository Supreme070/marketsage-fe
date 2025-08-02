/**
 * WhatsApp Service
 * 
 * This module provides WhatsApp messaging functionality through the API client.
 * It supports text messages, templates, media, interactive messages, and location sharing.
 */

import { apiClient } from '@/lib/api-client';
import type {
  WhatsAppResult,
  WhatsAppTemplate,
  WhatsAppMediaMessage,
  WhatsAppInteractiveMessage,
} from '@/lib/api/types/communications';
import { logger } from '@/lib/logger';

// Re-export types from API client for backward compatibility
export type {
  WhatsAppResult,
  WhatsAppTemplate,
  WhatsAppMediaMessage,
  WhatsAppInteractiveMessage,
} from '@/lib/api/types/communications';

export class WhatsAppService {
  /**
   * Send a text message via WhatsApp Business API
   */
  async sendTextMessage(
    to: string,
    message: string,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await apiClient.communications.sendWhatsAppMessage(
        to,
        message,
        organizationId
      );
    } catch (error) {
      logger.error('WhatsApp sending error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp sending failed',
        },
      };
    }
  }

  /**
   * Send a template message via WhatsApp Business API
   */
  async sendTemplateMessage(
    to: string,
    template: WhatsAppTemplate,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await apiClient.communications.sendWhatsAppTemplate(
        to,
        template,
        organizationId
      );
    } catch (error) {
      logger.error('WhatsApp template sending error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp template sending failed',
        },
      };
    }
  }

  /**
   * Send a media message (image, document, audio, video)
   */
  async sendMediaMessage(
    to: string,
    media: WhatsAppMediaMessage,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await apiClient.communications.sendWhatsAppMedia(
        to,
        media,
        organizationId
      );
    } catch (error) {
      logger.error('WhatsApp media message error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp media message failed',
        },
      };
    }
  }

  /**
   * Send an interactive message (buttons or list)
   */
  async sendInteractiveMessage(
    to: string,
    interactive: WhatsAppInteractiveMessage,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await apiClient.communications.sendWhatsAppInteractive(
        to,
        interactive,
        organizationId
      );
    } catch (error) {
      logger.error('WhatsApp interactive message error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp interactive message failed',
        },
      };
    }
  }

  /**
   * Send a location message
   */
  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await apiClient.communications.sendWhatsAppLocation(
        to,
        latitude,
        longitude,
        name,
        address,
        organizationId
      );
    } catch (error) {
      logger.error('WhatsApp location message error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp location message failed',
        },
      };
    }
  }

  /**
   * Upload media to WhatsApp for use in messages
   */
  async uploadMedia(
    fileUrl: string,
    type: 'image' | 'document' | 'audio' | 'video',
    organizationId?: string
  ): Promise<{ success: boolean; mediaId?: string; error?: any }> {
    try {
      return await apiClient.communications.uploadWhatsAppMedia(
        fileUrl,
        type,
        organizationId
      );
    } catch (error) {
      logger.error('WhatsApp media upload error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Media upload failed',
        },
      };
    }
  }

  /**
   * Get media URL from media ID
   */
  async getMediaUrl(
    mediaId: string,
    organizationId?: string
  ): Promise<{ success: boolean; url?: string; error?: any }> {
    try {
      return await apiClient.communications.getWhatsAppMediaUrl(
        mediaId,
        organizationId
      );
    } catch (error) {
      logger.error('WhatsApp get media URL error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get media URL',
        },
      };
    }
  }

  /**
   * Enhanced phone number validation for WhatsApp Business API
   * Supports multiple African countries as per WhatsApp international format requirements
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    try {
      return apiClient.communications.validateWhatsAppNumber(phoneNumber);
    } catch (error) {
      logger.error('WhatsApp phone validation error:', error);
      return false;
    }
  }

  /**
   * Test organization WhatsApp configuration
   */
  async testOrganizationWhatsApp(
    organizationId: string,
    testPhoneNumber: string,
    testMessage?: string
  ): Promise<WhatsAppResult> {
    try {
      return await apiClient.communications.testWhatsAppConfiguration(
        organizationId,
        testPhoneNumber,
        testMessage
      );
    } catch (error) {
      logger.error('WhatsApp test configuration error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp test failed',
        },
      };
    }
  }

  /**
   * Check if WhatsApp Business API is properly configured
   * This now checks through the API client
   */
  async isConfigured(organizationId?: string): Promise<boolean> {
    try {
      if (organizationId) {
        // Test with a dummy message to see if provider is configured
        const testResult = await this.testOrganizationWhatsApp(
          organizationId,
          '+1234567890', // dummy number
          'test'
        );
        return testResult.success || testResult.error?.code !== 'PROVIDER_NOT_CONFIGURED';
      }
      
      // For global configuration, try a basic API call
      return true; // Assume API is available if we can make calls
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear organization provider cache (handled by API now)
   */
  clearOrganizationCache(organizationId: string): void {
    // Cache management is now handled by the API client
    logger.info(`WhatsApp cache cleared for organization ${organizationId}`);
  }
}

// Export a singleton instance
export const whatsappService = new WhatsAppService();

// Legacy function for backward compatibility
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  organizationId?: string
): Promise<WhatsAppResult> {
  return whatsappService.sendTextMessage(phoneNumber, message, organizationId);
}