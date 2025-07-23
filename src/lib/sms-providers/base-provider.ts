// Base SMS provider interface for extensibility
export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: {
    message: string;
    code?: string;
  };
}

export interface SMSProvider {
  name: string;
  sendSMS(phoneNumber: string, message: string): Promise<SMSResult>;
  validatePhoneNumber(phoneNumber: string): boolean;
  isConfigured(): boolean;
}

export abstract class BaseSMSProvider implements SMSProvider {
  abstract name: string;
  
  abstract sendSMS(phoneNumber: string, message: string): Promise<SMSResult>;
  
  // Enhanced phone number validation for African markets
  validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }
    
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid length (typically 10-15 digits)
    if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 15) {
      return false;
    }
    
    // Enhanced country codes with specific validations (African + US)
    const countryValidation = [
      { code: '234', minLength: 13, maxLength: 13 }, // Nigeria: +234XXXXXXXXXX
      { code: '254', minLength: 12, maxLength: 12 }, // Kenya: +254XXXXXXXXX
      { code: '27', minLength: 11, maxLength: 11 },   // South Africa: +27XXXXXXXXX
      { code: '233', minLength: 12, maxLength: 12 },  // Ghana: +233XXXXXXXXX
      { code: '256', minLength: 12, maxLength: 12 },  // Uganda: +256XXXXXXXXX
      { code: '255', minLength: 12, maxLength: 12 },  // Tanzania: +255XXXXXXXXX
      { code: '237', minLength: 12, maxLength: 12 },  // Cameroon: +237XXXXXXXXX
      { code: '225', minLength: 12, maxLength: 12 },  // Ivory Coast: +225XXXXXXXXX
      { code: '223', minLength: 11, maxLength: 11 },  // Mali: +223XXXXXXXX
      { code: '221', minLength: 12, maxLength: 12 },  // Senegal: +221XXXXXXXXX
      { code: '1', minLength: 11, maxLength: 11 },     // US/Canada: +1XXXXXXXXXX
    ];
    
    // Check for international format with country codes
    for (const country of countryValidation) {
      if (cleanPhoneNumber.startsWith(country.code)) {
        return cleanPhoneNumber.length >= country.minLength && 
               cleanPhoneNumber.length <= country.maxLength;
      }
    }
    
    // Check for local Nigerian numbers (most common market)
    if (cleanPhoneNumber.startsWith('0') && cleanPhoneNumber.length === 11) {
      // Validate Nigerian network prefixes (080, 081, 070, 090, 091, etc.)
      const nigerianPrefixes = ['080', '081', '070', '090', '091', '071', '082', '083', '084', '085', '086', '087', '088', '089'];
      const prefix = cleanPhoneNumber.substring(1, 4); // Get digits 1-3 (after removing 0)
      return nigerianPrefixes.includes(prefix);
    }
    
    // Check for Nigerian numbers without leading 0
    if (!cleanPhoneNumber.startsWith('0') && cleanPhoneNumber.length === 10) {
      const nigerianPrefixes = ['80', '81', '70', '90', '91', '71', '82', '83', '84', '85', '86', '87', '88', '89'];
      const prefix = cleanPhoneNumber.substring(0, 2);
      return nigerianPrefixes.includes(prefix);
    }
    
    return false;
  }
  
  abstract isConfigured(): boolean;
}