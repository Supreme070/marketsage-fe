/**
 * Master API Account Configuration for Unified Messaging Service
 * 
 * This configuration manages platform-owned API accounts for customers
 * who prefer the unified service model over managing their own APIs.
 */

export interface MasterAccountConfig {
  provider: string;
  accountId: string;
  apiKey: string;
  apiSecret?: string;
  fromNumber?: string;
  fromEmail?: string;
  isActive: boolean;
  region?: string;
  rateLimit?: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  costPerMessage?: {
    sms: number;
    email: number;
    whatsapp: number;
  };
}

export interface MasterAccountsConfig {
  sms: {
    twilio: MasterAccountConfig;
    africasTalking: MasterAccountConfig;
    termii: MasterAccountConfig;
  };
  email: {
    sendgrid: MasterAccountConfig;
    mailgun: MasterAccountConfig;
    postmark: MasterAccountConfig;
  };
  whatsapp: {
    twilioWhatsApp: MasterAccountConfig;
    whatsappBusiness: MasterAccountConfig;
  };
}

// Master accounts configuration
export const masterAccountsConfig: MasterAccountsConfig = {
  sms: {
    twilio: {
      provider: 'twilio',
      accountId: process.env.MASTER_TWILIO_ACCOUNT_SID || '',
      apiKey: process.env.MASTER_TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.MASTER_TWILIO_FROM_NUMBER || '',
      isActive: !!process.env.MASTER_TWILIO_ACCOUNT_SID,
      region: 'us-east-1',
      rateLimit: {
        perMinute: 60,
        perHour: 3600,
        perDay: 86400
      },
      costPerMessage: {
        sms: 0.0075, // $0.0075 per SMS
        email: 0,
        whatsapp: 0
      }
    },
    africasTalking: {
      provider: 'africas-talking',
      accountId: process.env.MASTER_AT_USERNAME || '',
      apiKey: process.env.MASTER_AT_API_KEY || '',
      fromNumber: process.env.MASTER_AT_FROM_NUMBER || '',
      isActive: !!process.env.MASTER_AT_API_KEY,
      region: 'africa',
      rateLimit: {
        perMinute: 100,
        perHour: 6000,
        perDay: 144000
      },
      costPerMessage: {
        sms: 0.05, // 5 cents per SMS in African markets
        email: 0,
        whatsapp: 0
      }
    },
    termii: {
      provider: 'termii',
      accountId: process.env.MASTER_TERMII_SENDER_ID || '',
      apiKey: process.env.MASTER_TERMII_API_KEY || '',
      fromNumber: process.env.MASTER_TERMII_FROM_NUMBER || '',
      isActive: !!process.env.MASTER_TERMII_API_KEY,
      region: 'nigeria',
      rateLimit: {
        perMinute: 120,
        perHour: 7200,
        perDay: 172800
      },
      costPerMessage: {
        sms: 0.04, // 4 cents per SMS in Nigeria
        email: 0,
        whatsapp: 0
      }
    }
  },
  email: {
    sendgrid: {
      provider: 'sendgrid',
      accountId: process.env.MASTER_SENDGRID_USERNAME || '',
      apiKey: process.env.MASTER_SENDGRID_API_KEY || '',
      fromEmail: process.env.MASTER_SENDGRID_FROM_EMAIL || '',
      isActive: !!process.env.MASTER_SENDGRID_API_KEY,
      region: 'global',
      rateLimit: {
        perMinute: 600,
        perHour: 36000,
        perDay: 864000
      },
      costPerMessage: {
        sms: 0,
        email: 0.0012, // $0.0012 per email
        whatsapp: 0
      }
    },
    mailgun: {
      provider: 'mailgun',
      accountId: process.env.MASTER_MAILGUN_DOMAIN || '',
      apiKey: process.env.MASTER_MAILGUN_API_KEY || '',
      fromEmail: process.env.MASTER_MAILGUN_FROM_EMAIL || '',
      isActive: !!process.env.MASTER_MAILGUN_API_KEY,
      region: 'us',
      rateLimit: {
        perMinute: 1000,
        perHour: 60000,
        perDay: 1440000
      },
      costPerMessage: {
        sms: 0,
        email: 0.001, // $0.001 per email
        whatsapp: 0
      }
    },
    postmark: {
      provider: 'postmark',
      accountId: process.env.MASTER_POSTMARK_ACCOUNT_ID || '',
      apiKey: process.env.MASTER_POSTMARK_API_KEY || '',
      fromEmail: process.env.MASTER_POSTMARK_FROM_EMAIL || '',
      isActive: !!process.env.MASTER_POSTMARK_API_KEY,
      region: 'us',
      rateLimit: {
        perMinute: 300,
        perHour: 18000,
        perDay: 432000
      },
      costPerMessage: {
        sms: 0,
        email: 0.0025, // $0.0025 per email
        whatsapp: 0
      }
    }
  },
  whatsapp: {
    twilioWhatsApp: {
      provider: 'twilio-whatsapp',
      accountId: process.env.MASTER_TWILIO_WHATSAPP_ACCOUNT_SID || '',
      apiKey: process.env.MASTER_TWILIO_WHATSAPP_AUTH_TOKEN || '',
      fromNumber: process.env.MASTER_TWILIO_WHATSAPP_FROM_NUMBER || '',
      isActive: !!process.env.MASTER_TWILIO_WHATSAPP_ACCOUNT_SID,
      region: 'global',
      rateLimit: {
        perMinute: 80,
        perHour: 4800,
        perDay: 115200
      },
      costPerMessage: {
        sms: 0,
        email: 0,
        whatsapp: 0.005 // $0.005 per WhatsApp message
      }
    },
    whatsappBusiness: {
      provider: 'whatsapp-business',
      accountId: process.env.MASTER_WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      apiKey: process.env.MASTER_WHATSAPP_BUSINESS_ACCESS_TOKEN || '',
      fromNumber: process.env.MASTER_WHATSAPP_BUSINESS_PHONE_NUMBER || '',
      isActive: !!process.env.MASTER_WHATSAPP_BUSINESS_ACCESS_TOKEN,
      region: 'global',
      rateLimit: {
        perMinute: 60,
        perHour: 3600,
        perDay: 86400
      },
      costPerMessage: {
        sms: 0,
        email: 0,
        whatsapp: 0.004 // $0.004 per WhatsApp message
      }
    }
  }
};

// Helper functions for master account management
export class MasterAccountManager {
  /**
   * Get the best available master account for a specific channel
   */
  static getBestMasterAccount(channel: 'sms' | 'email' | 'whatsapp', region?: string): MasterAccountConfig | null {
    const channelAccounts = masterAccountsConfig[channel];
    
    // Filter active accounts
    const activeAccounts = Object.values(channelAccounts).filter(account => account.isActive);
    
    if (activeAccounts.length === 0) {
      return null;
    }
    
    // Prioritize by region if specified
    if (region) {
      const regionMatch = activeAccounts.find(account => account.region === region);
      if (regionMatch) {
        return regionMatch;
      }
    }
    
    // For African markets, prioritize Africa's Talking for SMS
    if (channel === 'sms' && (region === 'africa' || region === 'nigeria' || region === 'kenya')) {
      const africasTalking = activeAccounts.find(account => account.provider === 'africas-talking');
      if (africasTalking) {
        return africasTalking;
      }
    }
    
    // Default to first active account
    return activeAccounts[0];
  }
  
  /**
   * Calculate cost for a message campaign
   */
  static calculateCost(
    channel: 'sms' | 'email' | 'whatsapp',
    messageCount: number,
    region?: string
  ): { cost: number; provider: string } {
    const account = this.getBestMasterAccount(channel, region);
    
    if (!account) {
      return { cost: 0, provider: 'none' };
    }
    
    const costPerMessage = account.costPerMessage?.[channel] || 0;
    const cost = messageCount * costPerMessage;
    
    return { cost, provider: account.provider };
  }
  
  /**
   * Check if we have capacity for a message campaign
   */
  static checkCapacity(
    channel: 'sms' | 'email' | 'whatsapp',
    messageCount: number,
    region?: string
  ): { canSend: boolean; provider: string; rateLimit: any } {
    const account = this.getBestMasterAccount(channel, region);
    
    if (!account) {
      return { canSend: false, provider: 'none', rateLimit: null };
    }
    
    const rateLimit = account.rateLimit;
    
    // For now, assume we can send if we have an active account
    // In production, this would check against usage tracking
    const canSend = rateLimit ? messageCount <= rateLimit.perDay : true;
    
    return { canSend, provider: account.provider, rateLimit };
  }
  
  /**
   * Get all active master accounts
   */
  static getAllActiveAccounts(): { channel: string; provider: string; config: MasterAccountConfig }[] {
    const accounts = [];
    
    for (const [channel, providers] of Object.entries(masterAccountsConfig)) {
      for (const [provider, config] of Object.entries(providers)) {
        if (config.isActive) {
          accounts.push({ channel, provider, config });
        }
      }
    }
    
    return accounts;
  }
  
  /**
   * Validate master account configuration
   */
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if we have at least one active account per channel
    const channels = ['sms', 'email', 'whatsapp'] as const;
    
    for (const channel of channels) {
      const channelAccounts = masterAccountsConfig[channel];
      const activeAccounts = Object.values(channelAccounts).filter(account => account.isActive);
      
      if (activeAccounts.length === 0) {
        errors.push(`No active master accounts configured for ${channel}`);
      }
    }
    
    // Check for missing environment variables
    const requiredEnvVars = [
      'MASTER_TWILIO_ACCOUNT_SID',
      'MASTER_TWILIO_AUTH_TOKEN',
      'MASTER_SENDGRID_API_KEY'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        errors.push(`Missing environment variable: ${envVar}`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
}

// Cost markup configuration for reselling
export const COST_MARKUP = {
  sms: 2.5, // 2.5x markup on SMS costs
  email: 3.0, // 3x markup on email costs
  whatsapp: 2.0 // 2x markup on WhatsApp costs
};

// Credit conversion rates (1 credit = base cost)
export const CREDIT_RATES = {
  sms: 0.1, // 10 cents per SMS credit
  email: 0.01, // 1 cent per email credit
  whatsapp: 0.08 // 8 cents per WhatsApp credit
};