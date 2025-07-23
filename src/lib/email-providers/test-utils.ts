import { emailService } from './email-service';
import { logger } from '@/lib/logger';

/**
 * Test email provider configuration
 */
export async function testEmailProvider(
  organizationId: string,
  testEmail: string,
  customMessage?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const provider = await emailService.getOrganizationProvider(organizationId);
    
    if (!provider) {
      return {
        success: false,
        message: 'No email provider configured for this organization'
      };
    }

    if (!provider.validateConfig()) {
      return {
        success: false,
        message: 'Email provider configuration is incomplete'
      };
    }

    // Send test email
    const result = await provider.sendEmail({
      to: testEmail,
      from: 'test@marketsage.africa',
      fromName: 'MarketSage Test',
      subject: 'Email Provider Test - MarketSage',
      html: customMessage || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #007bff;">🎉 Email Provider Test Successful!</h2>
          <p>Congratulations! Your email provider is configured correctly and working perfectly.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Test Details:</h3>
            <p><strong>Provider:</strong> ${provider.name}</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Organization ID:</strong> ${organizationId}</p>
          </div>

          <p>✅ <strong>What this means:</strong></p>
          <ul>
            <li>Your email provider credentials are valid</li>
            <li>Your email configuration is working correctly</li>
            <li>You can now send campaigns and transactional emails</li>
            <li>Email tracking and analytics will work properly</li>
          </ul>

          <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;">
              <strong>Next Steps:</strong> You can now create email campaigns, set up automated sequences, and start engaging with your customers through email!
            </p>
          </div>

          <hr style="margin: 30px 0; border: 1px solid #eee;">
          <p style="font-size: 12px; color: #6c757d; text-align: center;">
            This test email was sent from your MarketSage platform<br>
            <a href="https://marketsage.africa" style="color: #007bff;">MarketSage - Smart Marketing Solutions for Africa</a>
          </p>
        </div>
      `,
      text: customMessage || `
        Email Provider Test Successful!
        
        Congratulations! Your email provider is configured correctly and working perfectly.
        
        Test Details:
        - Provider: ${provider.name}
        - Test Time: ${new Date().toLocaleString()}
        - Organization ID: ${organizationId}
        
        What this means:
        ✅ Your email provider credentials are valid
        ✅ Your email configuration is working correctly
        ✅ You can now send campaigns and transactional emails
        ✅ Email tracking and analytics will work properly
        
        Next Steps: You can now create email campaigns, set up automated sequences, and start engaging with your customers through email!
        
        This test email was sent from your MarketSage platform
        MarketSage - Smart Marketing Solutions for Africa
        https://marketsage.africa
      `,
      metadata: {
        test: true,
        organizationId,
        provider: provider.name
      }
    });

    if (result.success) {
      logger.info('Email provider test successful', {
        organizationId,
        provider: provider.name,
        messageId: result.messageId,
        testEmail
      });
      
      return {
        success: true,
        message: `Test email sent successfully via ${provider.name}`,
        messageId: result.messageId
      };
    } else {
      logger.warn('Email provider test failed', {
        organizationId,
        provider: provider.name,
        error: result.error,
        testEmail
      });
      
      return {
        success: false,
        message: result.error?.message || 'Email sending failed'
      };
    }

  } catch (error) {
    logger.error('Email provider test error', {
      error,
      organizationId,
      testEmail
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validate email provider configuration without sending
 */
export async function validateEmailProvider(organizationId: string): Promise<{
  isConfigured: boolean;
  provider?: string;
  issues: string[];
}> {
  try {
    const provider = await emailService.getOrganizationProvider(organizationId);
    
    if (!provider) {
      return {
        isConfigured: false,
        issues: ['No email provider configured for this organization']
      };
    }

    const issues: string[] = [];
    
    if (!provider.validateConfig()) {
      issues.push('Email provider configuration is incomplete');
    }

    return {
      isConfigured: issues.length === 0,
      provider: provider.name,
      issues
    };

  } catch (error) {
    logger.error('Email provider validation error', { error, organizationId });
    
    return {
      isConfigured: false,
      issues: ['Error validating email provider configuration']
    };
  }
}

/**
 * Get email provider statistics
 */
export async function getEmailProviderStats(
  organizationId: string,
  period?: { start: Date; end: Date }
) {
  try {
    return await emailService.getOrganizationStats(organizationId, period);
  } catch (error) {
    logger.error('Error getting email provider stats', { error, organizationId });
    return null;
  }
}