import { BaseSMSProvider, type SMSResult } from './base-provider';

// Database-driven SMS provider - acts as a proxy to configured providers
export class DatabaseSMSProvider extends BaseSMSProvider {
  name = 'Database-Driven SMS';
  
  constructor() {
    super();
  }

  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    // This provider should not be used directly
    // It's a placeholder for database-driven provider selection
    return {
      success: false,
      error: {
        message: 'Database provider should not be used directly. Use organization-specific providers.',
        code: 'INVALID_PROVIDER_USAGE'
      }
    };
  }

  isConfigured(): boolean {
    // Database provider is always "configured" as it relies on database configs
    return true;
  }
}