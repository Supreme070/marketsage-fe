/**
 * SMS Service - Frontend Stub
 * ============================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

export async function sendSMS(to: string, message: string, options?: any): Promise<any> {
  console.warn('⚠️  Using stub sendSMS. Migrate to backend API.');
  throw new Error('Method not implemented - use backend API at /api/v2/sms/send');
}

class SmsService {
  constructor() {
    console.warn('⚠️  Using stub SmsService. Migrate to backend API.');
  }

  async send(to: string, message: string): Promise<any> {
    return sendSMS(to, message);
  }
}

export const smsService = new SmsService();
export default smsService;
