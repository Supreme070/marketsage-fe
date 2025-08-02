/**
 * SMS Service
 * 
 * This module provides SMS messaging functionality through the API client.
 * It supports multiple SMS providers and bulk messaging capabilities.
 */

import { apiClient } from '@/lib/api-client';
import type {
  SMSOptions,
  SMSResult,
} from '@/lib/api/types/communications';
import { logger } from '@/lib/logger';

// Re-export types from API client for backward compatibility
export type {
  SMSResult,
  SMSOptions,
  SMSProviderType,
} from '@/lib/api/types/communications';

/**
 * Send an SMS message
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  try {
    return await apiClient.communications.sendSMS(options);
  } catch (error) {
    logger.error('SMS sending error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'SMS sending failed',
      },
      provider: 'error',
    };
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(
  phoneNumbers: string[],
  message: string,
  organizationId?: string
): Promise<SMSResult[]> {
  try {
    return await apiClient.communications.sendBulkSMS(
      phoneNumbers,
      message,
      organizationId
    );
  } catch (error) {
    logger.error('Bulk SMS sending error:', error);
    // Return error result for each phone number
    return phoneNumbers.map(() => ({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Bulk SMS sending failed',
      },
      provider: 'error',
    }));
  }
}

/**
 * Get SMS balance for organization
 */
export async function getSMSBalance(organizationId?: string): Promise<{
  balance: number;
  currency: string;
  provider: string;
}> {
  try {
    return await apiClient.communications.getSMSBalance(organizationId);
  } catch (error) {
    logger.error('Error getting SMS balance:', error);
    return {
      balance: 0,
      currency: 'USD',
      provider: 'unknown',
    };
  }
}

/**
 * Validate SMS phone number
 */
export async function validateSMSNumber(phoneNumber: string): Promise<{
  valid: boolean;
  country?: string;
  carrier?: string;
}> {
  try {
    return await apiClient.communications.validateSMSNumber(phoneNumber);
  } catch (error) {
    logger.error('SMS number validation error:', error);
    return {
      valid: false,
    };
  }
}

// SMS Service class for backward compatibility
export class SMSService {
  async send(options: SMSOptions): Promise<SMSResult> {
    return sendSMS(options);
  }

  async sendBulk(
    phoneNumbers: string[],
    message: string,
    organizationId?: string
  ): Promise<SMSResult[]> {
    return sendBulkSMS(phoneNumbers, message, organizationId);
  }

  async getBalance(organizationId?: string): Promise<{
    balance: number;
    currency: string;
    provider: string;
  }> {
    return getSMSBalance(organizationId);
  }

  async validateNumber(phoneNumber: string): Promise<{
    valid: boolean;
    country?: string;
    carrier?: string;
  }> {
    return validateSMSNumber(phoneNumber);
  }
}

// Export singleton instance
export const smsService = new SMSService();