import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET() {
  try {
    // Send a test email
    await sendEmail({
      to: 'test@example.com',
      subject: 'Docker Test Email',
      text: 'This is a test email sent from Docker environment',
      html: `
        <h1>Docker Test Email</h1>
        <p>This email was sent from the Docker environment at ${new Date().toISOString()}</p>
        <p>If you receive this, the email configuration is working correctly!</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SMTP_HOST: process.env.NODE_ENV === 'production' ? 'live.smtp.mailtrap.io' : 'sandbox.smtp.mailtrap.io',
        EMAIL_FROM: process.env.NEXT_PUBLIC_EMAIL_FROM,
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SMTP_HOST: process.env.NODE_ENV === 'production' ? 'live.smtp.mailtrap.io' : 'sandbox.smtp.mailtrap.io',
        EMAIL_FROM: process.env.NEXT_PUBLIC_EMAIL_FROM,
      }
    }, { status: 500 });
  }
} 