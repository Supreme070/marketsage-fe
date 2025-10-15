/**
 * Email Service - Frontend Stub
 * ==============================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

export async function sendEmail(to: string | string[], subject: string, body: string, options?: any): Promise<any> {
  console.warn('⚠️  Using stub sendEmail. Migrate to backend API.');
  throw new Error('Method not implemented - use backend API at /api/v2/email/send');
}

class EmailService {
  constructor() {
    console.warn('⚠️  Using stub EmailService. Migrate to backend API.');
  }

  async send(to: string | string[], subject: string, body: string): Promise<any> {
    return sendEmail(to, subject, body);
  }
}

export const emailService = new EmailService();
export default emailService;
