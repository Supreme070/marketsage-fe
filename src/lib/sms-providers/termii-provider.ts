/**
 * Termii SMS Provider
 * Provides SMS sending capabilities using Termii API
 */

import type { SMSProvider, SMSResult, SMSConfig } from './base-provider';
import { logger } from '@/lib/logger';

export interface TermiiConfig extends SMSConfig {
  apiKey: string;
  senderId: string;
  channel?: 'generic' | 'dnd' | 'whatsapp';
  messageType?: 'plain' | 'unicode';
}

export class TermiiSMSProvider implements SMSProvider {
  public readonly name = 'Termii';
  private config: TermiiConfig;

  constructor(config?: TermiiConfig) {
    this.config = config || {
      apiKey: process.env.TERMII_API_KEY || '',
      senderId: process.env.TERMII_SENDER_ID || 'MarketSage',
      channel: 'generic',
      messageType: 'plain'
    };
  }

  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: {
            message: 'Termii provider not properly configured',
            code: 'PROVIDER_NOT_CONFIGURED'
          }
        };
      }

      // Clean and format phone number
      const cleanPhoneNumber = this.formatPhoneNumber(phoneNumber);
      
      if (!this.validatePhoneNumber(cleanPhoneNumber)) {
        return {
          success: false,
          error: {
            message: 'Invalid phone number format',
            code: 'INVALID_PHONE_NUMBER'
          }
        };
      }

      const payload = {
        to: cleanPhoneNumber,
        from: this.config.senderId,
        sms: message,
        type: this.config.messageType || 'plain',
        channel: this.config.channel || 'generic',
        api_key: this.config.apiKey,
        media: {
          url: null,
          caption: null
        }
      };

      const response = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        logger.error('Termii API error:', {
          status: response.status,
          error: responseData
        });

        return {
          success: false,
          error: {
            message: responseData.message || 'Termii API error',
            code: responseData.code || 'TERMII_ERROR'
          }
        };
      }

      // Check if the response indicates success
      if (responseData.code === 'ok' || responseData.message_id) {
        return {
          success: true,
          messageId: responseData.message_id,
          cost: responseData.balance ? Number.parseFloat(responseData.balance) : undefined,
          metadata: {
            provider: 'termii',
            channel: this.config.channel,
            messageType: this.config.messageType,
            balance: responseData.balance
          }
        };
      } else {
        return {
          success: false,
          error: {
            message: responseData.message || 'Failed to send SMS',
            code: responseData.code || 'TERMII_SEND_FAILED'
          }
        };
      }

    } catch (error) {
      logger.error('Termii send error:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown Termii error',
          code: 'TERMII_SEND_ERROR'
        }
      };
    }
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }
    
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Must be between 10-15 digits
    if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 15) {
      return false;
    }
    
    // Support for African countries (primary Termii markets)
    const supportedCountries = [
      { code: '234', length: 13, name: 'Nigeria' },
      { code: '254', length: 12, name: 'Kenya' },
      { code: '256', length: 12, name: 'Uganda' },
      { code: '255', length: 12, name: 'Tanzania' },
      { code: '233', length: 12, name: 'Ghana' },
      { code: '237', length: 12, name: 'Cameroon' },
      { code: '225', length: 12, name: 'Ivory Coast' },
      { code: '221', length: 12, name: 'Senegal' },
    ];
    
    // Check international format
    for (const country of supportedCountries) {
      if (cleanPhoneNumber.startsWith(country.code) && cleanPhoneNumber.length === country.length) {
        return true;
      }
    }
    
    // Special handling for Nigerian local numbers
    if (cleanPhoneNumber.startsWith('0') && cleanPhoneNumber.length === 11) {
      const validPrefixes = ['080', '081', '070', '090', '091', '071'];
      const prefix = cleanPhoneNumber.substring(1, 4);
      return validPrefixes.includes(prefix);
    }
    
    return false;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Convert Nigerian local format to international
    if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
      cleanNumber = '234' + cleanNumber.substring(1);
    }
    
    // Ensure it starts with country code
    if (!cleanNumber.startsWith('234') && cleanNumber.length === 10) {
      cleanNumber = '234' + cleanNumber;
    }
    
    return cleanNumber;
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.senderId);
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ success: boolean; balance?: number; currency?: string; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Provider not configured'
        };
      }

      const response = await fetch(`https://api.ng.termii.com/api/get-balance?api_key=${this.config.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.balance !== undefined) {
        return {
          success: true,
          balance: Number.parseFloat(data.balance),
          currency: data.currency || 'NGN'
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to get balance'
        };
      }

    } catch (error) {
      logger.error('Error getting Termii balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get delivery report for a message
   */
  async getDeliveryReport(messageId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Provider not configured'
        };
      }

      const response = await fetch(
        `https://api.ng.termii.com/api/sms/inbox?api_key=${this.config.apiKey}&message_id=${messageId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          status: data.status || 'unknown'
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to get delivery report'
        };
      }

    } catch (error) {
      logger.error('Error getting Termii delivery report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send OTP message
   */
  async sendOTP(phoneNumber: string, options: {
    pinAttempts?: number;
    pinTimeToLive?: number;
    pinLength?: number;
    pinPlaceholder?: string;
    messageText?: string;
  } = {}): Promise<{ success: boolean; pinId?: string; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Provider not configured'
        };
      }

      const cleanPhoneNumber = this.formatPhoneNumber(phoneNumber);

      const payload = {
        api_key: this.config.apiKey,
        message_type: 'NUMERIC',
        to: cleanPhoneNumber,
        from: this.config.senderId,
        channel: this.config.channel || 'generic',
        pin_attempts: options.pinAttempts || 3,
        pin_time_to_live: options.pinTimeToLive || 5,
        pin_length: options.pinLength || 6,
        pin_placeholder: options.pinPlaceholder || '< 1234 >',
        message_text: options.messageText || `Your MarketSage verification code is ${options.pinPlaceholder || '< 1234 >'}. Valid for ${options.pinTimeToLive || 5} minutes.`
      };

      const response = await fetch('https://api.ng.termii.com/api/sms/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.pinId) {
        return {
          success: true,
          pinId: data.pinId
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to send OTP'
        };
      }

    } catch (error) {
      logger.error('Error sending Termii OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(pinId: string, pin: string): Promise<{ success: boolean; verified?: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Provider not configured'
        };
      }

      const payload = {
        api_key: this.config.apiKey,
        pin_id: pinId,
        pin: pin
      };

      const response = await fetch('https://api.ng.termii.com/api/sms/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          verified: data.verified === true || data.verified === 'True'
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to verify OTP'
        };
      }

    } catch (error) {
      logger.error('Error verifying Termii OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get sender ID status
   */
  async getSenderIdStatus(): Promise<{ success: boolean; senderIds?: any[]; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Provider not configured'
        };
      }

      const response = await fetch(`https://api.ng.termii.com/api/sender-id?api_key=${this.config.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          senderIds: data.data || []
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to get sender ID status'
        };
      }

    } catch (error) {
      logger.error('Error getting Termii sender ID status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}