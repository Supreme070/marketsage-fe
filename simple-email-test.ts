#!/usr/bin/env tsx
/**
 * Simple Email Test - No Database Required
 * 
 * This script sends test emails using nodemailer directly without database dependencies.
 */

const nodemailer = require('nodemailer');
import { randomUUID } from 'crypto';

// Load environment variables
require('dotenv').config();

async function sendSimpleTestEmail(to: string) {
  console.log(`📧 Sending test email to: ${to}`);
  
  try {
    // Create transporter using the same config as the main service
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtppro.zoho.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || true,
      auth: {
        user: process.env.SMTP_USER || 'info@marketsage.africa',
        pass: process.env.SMTP_PASS || 'MTEYugJ7rpHC',
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV !== 'production'
      }
    });

    // Create email content
    const emailContent = {
      from: `"MarketSage" <${process.env.SMTP_USER || 'info@marketsage.africa'}>`,
      to: to,
      subject: `MarketSage Email Test - ${new Date().toLocaleString()}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MarketSage Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px;">
                <h2 style="color: #007bff; margin: 0;">🎉 MarketSage Email Test</h2>
                <p style="margin: 5px 0 0 0; color: #666;">Smart Marketing Solutions for African Businesses</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h3 style="color: #333;">Hello from MarketSage!</h3>
                <p>This is a test email to verify that your MarketSage email configuration is working correctly.</p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <h4 style="margin-top: 0; color: #007bff;">✨ Test Details:</h4>
                    <ul style="margin-bottom: 0;">
                        <li><strong>Recipient:</strong> ${to}</li>
                        <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
                        <li><strong>Test ID:</strong> ${randomUUID().slice(-8)}</li>
                        <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'smtppro.zoho.com'}</li>
                        <li><strong>From:</strong> ${process.env.SMTP_USER || 'info@marketsage.africa'}</li>
                    </ul>
                </div>
                
                <p><strong>🎉 Success!</strong> If you received this email, your MarketSage email configuration is working properly!</p>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #1565c0;">🚀 What's Next?</h4>
                    <ul style="margin-bottom: 0;">
                        <li>Your MarketSage email system is ready to use</li>
                        <li>You can now send marketing campaigns via email</li>
                        <li>Set up your email templates and contact lists</li>
                        <li>Start creating automated email workflows</li>
                    </ul>
                </div>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
                <p><strong>MarketSage</strong><br>
                Smart Marketing Solutions<br>
                📧 info@marketsage.africa | 🌐 www.marketsage.africa</p>
                
                <div style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
                    <p>This is a test email sent from MarketSage to verify email configuration.<br>
                    If you have any questions, please contact support at info@marketsage.africa</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
MarketSage Email Test

Hello from MarketSage!

This is a test email to verify that your MarketSage email configuration is working correctly.

Test Details:
- Recipient: ${to}
- Sent at: ${new Date().toLocaleString()}
- SMTP Host: ${process.env.SMTP_HOST || 'smtppro.zoho.com'}
- From: ${process.env.SMTP_USER || 'info@marketsage.africa'}

Success! If you received this email, your MarketSage email configuration is working properly!

What's Next?
- Your MarketSage email system is ready to use
- You can now send marketing campaigns via email
- Set up your email templates and contact lists
- Start creating automated email workflows

--
MarketSage
Smart Marketing Solutions
info@marketsage.africa | www.marketsage.africa

This is a test email sent from MarketSage to verify email configuration.
      `,
      headers: {
        'X-Mailer': 'MarketSage Email Platform v1.0',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'Message-ID': `<${randomUUID()}@marketsage.africa>`,
        'Return-Path': process.env.SMTP_USER || 'info@marketsage.africa',
        'Organization': 'MarketSage - Smart Marketing Solutions',
      },
    };

    // Send email
    const info = await transporter.sendMail(emailContent);
    
    console.log(`✅ Success! Email sent to ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}`);
    console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 MarketSage Simple Email Test');
  console.log('================================\n');
  
  // Configuration info
  console.log('⚙️  Email Configuration:');
  console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtppro.zoho.com'}`);
  console.log(`   SMTP Port: ${process.env.SMTP_PORT || '465'}`);
  console.log(`   SMTP User: ${process.env.SMTP_USER || 'info@marketsage.africa'}`);
  console.log(`   Secure: ${process.env.SMTP_SECURE || 'true'}`);
  console.log('');
  
  const testEmails = ['marketsageltd@gmail.com', 'kolajoseph87@gmail.com'];
  
  console.log(`📬 Sending test emails to ${testEmails.length} recipients:`);
  testEmails.forEach(email => console.log(`   - ${email}`));
  console.log('');
  
  const results = [];
  
  for (const email of testEmails) {
    const result = await sendSimpleTestEmail(email);
    results.push({ email, ...result });
    
    // Small delay between emails
    if (testEmails.indexOf(email) < testEmails.length - 1) {
      console.log('⏳ Waiting 2 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('============');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  if (successful.length > 0) {
    successful.forEach(r => console.log(`   - ${r.email}: ${r.messageId}`));
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => console.log(`   - ${r.email}: ${r.error}`));
  }
  
  console.log('\n✨ Test completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check recipient inboxes for the test emails');
  console.log('2. Check spam/junk folders if emails are not in inbox');
  console.log('3. If all tests passed, your MarketSage email system is ready!');
  console.log('4. You can now use the MarketSage dashboard to send campaigns');
}

main().catch(console.error);