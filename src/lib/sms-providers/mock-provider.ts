import { BaseSMSProvider, type SMSResult } from './base-provider';

// Mock SMS provider for development and testing
export class MockSMSProvider extends BaseSMSProvider {
  name = 'Mock SMS Provider';

  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    try {
      // Validate phone number format
      if (!this.validatePhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: {
            message: `Invalid phone number format: ${phoneNumber}`,
            code: 'INVALID_PHONE_NUMBER'
          }
        };
      }

      console.log(`[MOCK SMS] Sending to ${phoneNumber}: ${message}`);
      
      // Simulate a small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate success with realistic message ID
      return {
        success: true,
        messageId: `mock_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Mock SMS sending failed',
          code: 'MOCK_ERROR'
        },
      };
    }
  }

  isConfigured(): boolean {
    // Mock provider is always "configured" for development
    return true;
  }
}