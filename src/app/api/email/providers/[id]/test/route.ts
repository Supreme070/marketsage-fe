import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Test message schema
const testEmailSchema = z.object({
  testEmail: z.string().email('Valid email is required'),
  subject: z.string().optional(),
  message: z.string().optional(),
});

// Encryption utilities
const decrypt = (encryptedText: string): string => {
  try {
    const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    return encryptedText;
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providerId = params.id;
    const body = await request.json();
    
    // Validate input
    const validationResult = testEmailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const { testEmail, subject, message } = validationResult.data;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get the email provider
    const emailProvider = await prisma.emailProvider.findFirst({
      where: {
        id: providerId,
        organizationId: user.organization.id
      }
    });

    if (!emailProvider) {
      return NextResponse.json({ error: 'Email provider not found' }, { status: 404 });
    }

    // Test the provider based on type
    let testResult;
    
    try {
      if (emailProvider.providerType === 'smtp') {
        testResult = await testSMTPProvider(emailProvider, testEmail, subject, message);
      } else {
        testResult = await testAPIProvider(emailProvider, testEmail, subject, message);
      }

      // Update provider test status
      await prisma.emailProvider.update({
        where: { id: providerId },
        data: {
          lastTested: new Date(),
          testStatus: testResult.success ? 'success' : 'failed',
          verificationStatus: testResult.success ? 'verified' : 'failed'
        }
      });

      logger.info('Email provider test completed', {
        providerId,
        organizationId: user.organization.id,
        success: testResult.success,
        providerType: emailProvider.providerType
      });

      return NextResponse.json({
        success: testResult.success,
        message: testResult.message,
        messageId: testResult.messageId
      });

    } catch (error) {
      // Update provider test status on error
      await prisma.emailProvider.update({
        where: { id: providerId },
        data: {
          lastTested: new Date(),
          testStatus: 'failed',
          verificationStatus: 'failed'
        }
      });

      logger.error('Email provider test failed', {
        error,
        providerId,
        organizationId: user.organization.id,
        providerType: emailProvider.providerType
      });

      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        error: 'Test failed'
      });
    }

  } catch (error) {
    logger.error('Error testing email provider:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function testSMTPProvider(
  provider: any,
  testEmail: string,
  subject?: string,
  message?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  
  if (!provider.smtpHost || !provider.smtpUsername || !provider.smtpPassword) {
    throw new Error('SMTP configuration incomplete');
  }

  const decryptedPassword = decrypt(provider.smtpPassword);
  
  // Create SMTP transporter
  const transporter = nodemailer.createTransporter({
    host: provider.smtpHost,
    port: provider.smtpPort || 587,
    secure: provider.smtpSecure || false,
    auth: {
      user: provider.smtpUsername,
      pass: decryptedPassword,
    },
    tls: {
      rejectUnauthorized: false // For development
    }
  });

  // Test connection
  await transporter.verify();

  // Send test email
  const info = await transporter.sendMail({
    from: `"${provider.fromName || 'MarketSage Test'}" <${provider.fromEmail}>`,
    to: testEmail,
    subject: subject || 'MarketSage Email Provider Test',
    html: message || `
      <h2>Email Provider Test Successful!</h2>
      <p>This is a test email from your MarketSage email provider configuration.</p>
      <p><strong>Provider:</strong> ${provider.name} (SMTP)</p>
      <p><strong>Type:</strong> ${provider.providerType}</p>
      <p><strong>From:</strong> ${provider.fromEmail}</p>
      <p>If you received this email, your email provider is configured correctly!</p>
      <hr>
      <p><small>This test was sent from MarketSage at ${new Date().toISOString()}</small></p>
    `,
    text: message || `
      Email Provider Test Successful!
      
      This is a test email from your MarketSage email provider configuration.
      Provider: ${provider.name} (SMTP)
      Type: ${provider.providerType}
      From: ${provider.fromEmail}
      
      If you received this email, your email provider is configured correctly!
    `
  });

  return {
    success: true,
    message: 'Test email sent successfully via SMTP',
    messageId: info.messageId
  };
}

async function testAPIProvider(
  provider: any,
  testEmail: string,
  subject?: string,
  message?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  
  switch (provider.providerType) {
    case 'mailgun':
      return testMailgunProvider(provider, testEmail, subject, message);
    case 'sendgrid':
      return testSendGridProvider(provider, testEmail, subject, message);
    default:
      throw new Error(`API testing not implemented for provider type: ${provider.providerType}`);
  }
}

async function testMailgunProvider(
  provider: any,
  testEmail: string,
  subject?: string,
  message?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  
  if (!provider.apiKey || !provider.domain) {
    throw new Error('Mailgun API key and domain are required');
  }

  const decryptedApiKey = decrypt(provider.apiKey);
  const domain = provider.domain;

  const formData = new FormData();
  formData.append('from', `${provider.fromName || 'MarketSage Test'} <${provider.fromEmail}>`);
  formData.append('to', testEmail);
  formData.append('subject', subject || 'MarketSage Email Provider Test');
  formData.append('html', message || `
    <h2>Email Provider Test Successful!</h2>
    <p>This is a test email from your MarketSage Mailgun configuration.</p>
    <p><strong>Provider:</strong> ${provider.name} (Mailgun)</p>
    <p><strong>Domain:</strong> ${domain}</p>
    <p><strong>From:</strong> ${provider.fromEmail}</p>
    <p>If you received this email, your Mailgun provider is configured correctly!</p>
    <hr>
    <p><small>This test was sent from MarketSage at ${new Date().toISOString()}</small></p>
  `);

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${decryptedApiKey}`).toString('base64')}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mailgun API error: ${error}`);
  }

  const result = await response.json();

  return {
    success: true,
    message: 'Test email sent successfully via Mailgun',
    messageId: result.id
  };
}

async function testSendGridProvider(
  provider: any,
  testEmail: string,
  subject?: string,
  message?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  
  if (!provider.apiKey) {
    throw new Error('SendGrid API key is required');
  }

  const decryptedApiKey = decrypt(provider.apiKey);

  const emailData = {
    personalizations: [{
      to: [{ email: testEmail }],
      subject: subject || 'MarketSage Email Provider Test'
    }],
    from: {
      email: provider.fromEmail,
      name: provider.fromName || 'MarketSage Test'
    },
    content: [{
      type: 'text/html',
      value: message || `
        <h2>Email Provider Test Successful!</h2>
        <p>This is a test email from your MarketSage SendGrid configuration.</p>
        <p><strong>Provider:</strong> ${provider.name} (SendGrid)</p>
        <p><strong>From:</strong> ${provider.fromEmail}</p>
        <p>If you received this email, your SendGrid provider is configured correctly!</p>
        <hr>
        <p><small>This test was sent from MarketSage at ${new Date().toISOString()}</small></p>
      `
    }]
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${decryptedApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }

  // SendGrid returns empty body on success, get message ID from headers
  const messageId = response.headers.get('x-message-id');

  return {
    success: true,
    message: 'Test email sent successfully via SendGrid',
    messageId: messageId || 'unknown'
  };
}