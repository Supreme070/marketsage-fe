#!/usr/bin/env tsx
/**
 * Direct Email Service Test
 * 
 * This script tests the email service directly without requiring authentication.
 * It bypasses the API endpoint and uses the email service functions directly.
 */

import { sendTrackedEmail } from './src/lib/email-service';
import { logger } from './src/lib/logger';
import { randomUUID } from 'crypto';

async function testEmailService() {
  console.log('🚀 MarketSage Direct Email Service Test');
  console.log('=======================================\n');
  
  // Test email addresses
  const testEmails = ['marketsageltd@gmail.com', 'kolajoseph87@gmail.com'];
  
  console.log('📬 Testing email delivery to:');
  testEmails.forEach(email => console.log(`   - ${email}`));
  console.log('');
  
  // Configuration info
  console.log('⚙️  Email Configuration:');
  console.log(`   Provider: ${process.env.EMAIL_PROVIDER || 'development'}`);
  console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'Not configured'}`);
  console.log(`   SMTP Port: ${process.env.SMTP_PORT || 'Not configured'}`);
  console.log(`   SMTP User: ${process.env.SMTP_USER || 'Not configured'}`);
  console.log(`   From: ${process.env.NEXT_PUBLIC_EMAIL_FROM || 'info@marketsage.africa'}`);
  console.log('');
  
  for (const email of testEmails) {
    console.log(`📧 Sending test email to: ${email}`);
    
    try {
      // Create a test contact
      const testContact = {
        id: `test-${randomUUID()}`,
        email: email,
        firstName: email.split('@')[0],
        name: email.split('@')[0],
      };
      
      // Create a test campaign ID
      const testCampaignId = `test-campaign-${randomUUID()}`;
      
      // Email options
      const emailOptions = {
        from: process.env.NEXT_PUBLIC_EMAIL_FROM || "info@marketsage.africa",
        subject: `MarketSage Test Email - ${new Date().toLocaleString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #007bff; margin-bottom: 20px;">🎉 Test Email from MarketSage</h2>
            
            <p style="margin-bottom: 15px;">Hello <strong>${testContact.firstName}</strong>!</p>
            
            <p style="margin-bottom: 15px;">
              This is a test email to verify that your MarketSage email configuration is working correctly.
            </p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Test Details:</h3>
              <ul style="margin-bottom: 0;">
                <li>Sent to: ${email}</li>
                <li>Sent at: ${new Date().toLocaleString()}</li>
                <li>Provider: ${process.env.EMAIL_PROVIDER || 'development'}</li>
                <li>SMTP Host: ${process.env.SMTP_HOST || 'Not configured'}</li>
                <li>Test ID: ${testCampaignId.slice(-8)}</li>
              </ul>
            </div>
            
            <p style="margin-bottom: 15px;">
              If you received this email, your MarketSage email configuration is working properly! 🎉
            </p>
            
            <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 30px; font-size: 12px; color: #6c757d;">
              <p>This email was sent from MarketSage for testing purposes.</p>
              <p>If you have any questions, please contact support at info@marketsage.africa</p>
            </div>
          </div>
        `,
        metadata: {
          testEmail: true,
          testId: testCampaignId,
          sentAt: new Date().toISOString(),
        },
      };
      
      // Send the email
      const result = await sendTrackedEmail(testContact, testCampaignId, emailOptions);
      
      if (result.success) {
        console.log(`✅ Success! Email sent to ${email}`);
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Provider: ${result.provider}`);
      } else {
        console.error(`❌ Failed to send email to ${email}`);
        console.error(`   Error: ${result.error?.message || 'Unknown error'}`);
        console.error(`   Provider: ${result.provider}`);
      }
    } catch (error) {
      console.error(`❌ Exception sending email to ${email}:`, error);
    }
    
    console.log(''); // Empty line between tests
    
    // Small delay between emails
    if (testEmails.indexOf(email) < testEmails.length - 1) {
      console.log('⏳ Waiting 2 seconds before next email...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('✨ Email test completed!');
  console.log('\nNext steps:');
  console.log('1. Check the recipient inboxes for the test emails');
  console.log('2. If emails are not received, check spam/junk folders');
  console.log('3. If using development provider, emails are only logged (not actually sent)');
  console.log('4. For SMTP provider, verify credentials and network connectivity');
}

// Load environment variables
require('dotenv').config();

// Run the test
testEmailService().catch(error => {
  console.error('❌ Fatal error running email test:', error);
  process.exit(1);
});