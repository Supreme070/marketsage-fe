import { BaseSMSProvider, type SMSResult } from './base-provider';

// Twilio SMS provider for global SMS delivery
export class TwilioSMSProvider extends BaseSMSProvider {
  name = 'Twilio';
  
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(config?: { accountSid?: string; authToken?: string; fromNumber?: string }) {
    super();
    // Use provided config or fall back to environment variables
    this.accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = config?.fromNumber || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || '';
  }

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

      // If not configured, fall back to mock behavior for development
      if (!this.isConfigured()) {
        console.log(`[MOCK Twilio] Would send to ${phoneNumber}: ${message}`);
        return {
          success: true,
          messageId: `mock_twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      // Format phone number for Twilio (ensure E.164 format)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const requestBody = new URLSearchParams({
        To: formattedPhone,
        From: this.fromNumber,
        Body: message
      });

      // Twilio uses Basic Auth with AccountSid as username and AuthToken as password
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Twilio API error: ${response.status}`);
      }

      // Twilio returns the message SID on success
      if (responseData.sid) {
        return {
          success: true,
          messageId: responseData.sid,
        };
      } else {
        return {
          success: false,
          error: {
            message: responseData.error_message || 'Unknown error from Twilio',
            code: responseData.error_code || 'TWILIO_ERROR'
          }
        };
      }

    } catch (error) {
      console.error('Twilio SMS error:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Twilio SMS sending failed',
          code: 'TWILIO_API_ERROR'
        },
      };
    }
  }

  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.fromNumber);
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // If already has country code, return with +
    if (cleanPhoneNumber.startsWith('234') || cleanPhoneNumber.startsWith('254') || 
        cleanPhoneNumber.startsWith('27') || cleanPhoneNumber.startsWith('233') ||
        cleanPhoneNumber.startsWith('1')) {
      return '+' + cleanPhoneNumber;
    }
    
    // Default to Nigerian country code for local numbers
    if (cleanPhoneNumber.startsWith('0')) {
      return '+234' + cleanPhoneNumber.substring(1);
    }
    
    if (cleanPhoneNumber.length === 10) {
      return '+234' + cleanPhoneNumber;
    }
    
    return '+' + cleanPhoneNumber;
  }
}