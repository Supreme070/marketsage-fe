import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Log current environment configuration
console.log('Email Configuration Environment:', {
  NODE_ENV: process.env.NODE_ENV || 'development',
  SMTP_HOST: process.env.NODE_ENV === 'production' ? 'live.smtp.mailtrap.io' : 'sandbox.smtp.mailtrap.io',
  IS_USING_API_AUTH: process.env.NODE_ENV === 'production'
});

// Create appropriate transporter based on environment
const transporter = nodemailer.createTransport(
  process.env.NODE_ENV === 'production'
    ? {
        // Production Live SMTP settings
        host: "live.smtp.mailtrap.io",
        port: 587,
        secure: false,
        auth: {
          user: "api",
          pass: process.env.MAILTRAP_API_TOKEN,
        },
      }
    : {
        // Development/Testing SMTP settings
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: process.env.MAILTRAP_TEST_USER,
          pass: process.env.MAILTRAP_TEST_PASS,
        },
      }
);

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    // In development, we can only send to ourselves
    const recipient = process.env.NODE_ENV === 'production' 
      ? to 
      : process.env.MAILTRAP_TEST_EMAIL || to;

    // Verify SMTP connection
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: process.env.NODE_ENV === 'production'
        ? `"${process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'MarketSage'}" <${process.env.NEXT_PUBLIC_EMAIL_FROM || 'test@example.com'}>`
        : `"${process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'MarketSage Dev'}" <${process.env.NEXT_PUBLIC_EMAIL_FROM || 'test@example.com'}>`,
      to: recipient,
      subject: process.env.NODE_ENV === 'production' 
        ? subject 
        : `[DEV] ${subject}`,
      text,
      html,
    });

    console.log(
      process.env.NODE_ENV === 'production'
        ? `Email sent to ${to}: ${info.messageId}`
        : `Test email sent to ${recipient}: ${info.messageId} (original recipient would be: ${to})`
    );

    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // In development, log the email content for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email that would have been sent:', {
        to,
        subject,
        text,
        html,
      });
    }
    throw error;
  }
} 