#!/usr/bin/env tsx
/**
 * Test Email Script
 * 
 * This script sends test emails to verify the email configuration is working correctly.
 * 
 * Usage:
 * 1. Make sure you're logged into the MarketSage app
 * 2. Run: npx tsx test-email.ts
 * 
 * Or with custom recipients:
 * npx tsx test-email.ts email1@example.com email2@example.com
 */

async function sendTestEmail(to: string, authCookie?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  
  console.log(`\n📧 Sending test email to: ${to}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authCookie ? { 'Cookie': authCookie } : {}),
      },
      body: JSON.stringify({
        to,
        subject: `MarketSage Test Email - ${new Date().toLocaleString()}`,
        content: `
          <h3>Hello from MarketSage!</h3>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Sent to: ${to}</li>
            <li>Sent at: ${new Date().toLocaleString()}</li>
            <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
          </ul>
          <p>If you received this email, your MarketSage email configuration is working properly! 🎉</p>
        `,
      }),
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Success! Email sent to ${to}`);
      console.log(`   Message ID: ${result.details.messageId}`);
      console.log(`   Provider: ${result.details.provider}`);
      console.log(`   Configuration:`);
      console.log(`   - Email Provider: ${result.details.configuration.emailProvider}`);
      console.log(`   - SMTP Host: ${result.details.configuration.smtpHost}`);
      console.log(`   - SMTP Port: ${result.details.configuration.smtpPort}`);
      console.log(`   - From: ${result.details.configuration.from}`);
    } else {
      console.error(`❌ Failed to send email to ${to}`);
      console.error(`   Error: ${result.error || 'Unknown error'}`);
      if (result.details) {
        console.error(`   Details: ${result.details}`);
      }
      if (result.configuration) {
        console.error(`   Configuration:`);
        console.error(`   - Email Provider: ${result.configuration.emailProvider}`);
        console.error(`   - SMTP Host: ${result.configuration.smtpHost}`);
        console.error(`   - SMTP Port: ${result.configuration.smtpPort}`);
        console.error(`   - From: ${result.configuration.from}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 MarketSage Email Test Script');
  console.log('================================\n');
  
  // Get recipients from command line args or use defaults
  const recipients = process.argv.slice(2);
  if (recipients.length === 0) {
    recipients.push('marketsageltd@gmail.com', 'kolajoseph87@gmail.com');
  }
  
  console.log(`📬 Testing email delivery to ${recipients.length} recipient(s):`);
  recipients.forEach(email => console.log(`   - ${email}`));
  
  // Note: In a real scenario, you'd need to get the auth cookie from a logged-in session
  // For now, we'll try without authentication and see if it works
  console.log('\n⚠️  Note: This script requires authentication. Make sure you are logged into MarketSage.');
  console.log('   If you get a 401 error, you need to provide a valid session cookie.\n');
  
  // Send test emails
  for (const recipient of recipients) {
    await sendTestEmail(recipient);
    
    // Small delay between emails to avoid rate limiting
    if (recipients.indexOf(recipient) < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n✨ Email test completed!');
  console.log('\nNext steps:');
  console.log('1. Check the recipient inboxes for the test emails');
  console.log('2. If emails are not received, check spam/junk folders');
  console.log('3. Verify SMTP configuration in .env file');
  console.log('4. Check application logs for any errors');
}

// Run the script
main().catch(console.error);