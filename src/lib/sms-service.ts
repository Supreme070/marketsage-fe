// Re-export types and functions from the new SMS provider structure
export type { SMSResult } from './sms-providers/base-provider';
export { sendSMS, smsService } from './sms-providers/sms-service';
export type { SMSProviderType } from './sms-providers/sms-service'; 