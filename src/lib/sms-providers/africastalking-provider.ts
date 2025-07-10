import { BaseSMSProvider, type SMSResult } from './base-provider';

// Africa's Talking SMS provider for African markets
export class AfricasTalkingSMSProvider extends BaseSMSProvider {
  name = 'Africa\'s Talking';
  
  private apiKey: string;
  private username: string;
  private senderId: string;

  constructor(config?: { apiKey?: string; username?: string; fromNumber?: string }) {
    super();
    // Use provided config or fall back to environment variables
    this.apiKey = config?.apiKey || process.env.AFRICASTALKING_API_KEY || '';
    this.username = config?.username || process.env.AFRICASTALKING_USERNAME || '';
    this.senderId = config?.fromNumber || process.env.AFRICASTALKING_SENDER_ID || 'MarketSage';
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
        console.log(`[MOCK Africa's Talking] Would send to ${phoneNumber}: ${message}`);
        return {
          success: true,
          messageId: `mock_at_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      // Format phone number for Africa's Talking (ensure country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const requestBody = {
        username: this.username,
        to: formattedPhone,
        message: message,
        from: this.senderId
      };

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey
        },
        body: new URLSearchParams(requestBody)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Africa\'s Talking API request failed');
      }

      // Check if SMS was sent successfully
      const recipient = responseData.SMSMessageData?.Recipients?.[0];
      if (recipient && recipient.status === 'Success') {
        return {
          success: true,
          messageId: recipient.messageId || `at_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      } else {
        return {
          success: false,
          error: {
            message: recipient?.status || 'Unknown error from Africa\'s Talking',
            code: 'AFRICASTALKING_ERROR'
          }
        };
      }

    } catch (error) {
      console.error('Africa\'s Talking SMS error:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Africa\'s Talking SMS sending failed',
          code: 'AFRICASTALKING_API_ERROR'
        },
      };
    }
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.username);
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // If already has country code, return as is
    if (cleanPhoneNumber.startsWith('234') || cleanPhoneNumber.startsWith('254') || 
        cleanPhoneNumber.startsWith('27') || cleanPhoneNumber.startsWith('233')) {
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