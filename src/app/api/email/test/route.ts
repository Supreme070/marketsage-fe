import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { sendTrackedEmail } from "@/lib/email-service";
import { randomUUID } from "crypto";

// Schema for test email request
const testEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").optional().default("Test Email from MarketSage"),
  content: z.string().min(1, "Content is required").optional().default("This is a test email from MarketSage to verify email configuration is working correctly."),
  from: z.string().optional(),
  replyTo: z.string().email().optional(),
});

// POST handler to send a test email
export async function POST(request: NextRequest) {
  try {
    console.log("=== TEST EMAIL ENDPOINT CALLED ===");
    
    // Authentication check
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "exists" : "null");
    
    if (!session) {
      console.log("No session, returning 401");
      return NextResponse.json(
        { error: "You must be signed in to send test emails" },
        { status: 401 }
      );
    }
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("Request body:", body);
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Validate request body
    const validationResult = testEmailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { to, subject, content, from, replyTo } = validationResult.data;
    
    // Create a test contact object
    const testContact = {
      id: `test-${randomUUID()}`,
      email: to,
      firstName: to.split('@')[0], // Use the part before @ as first name
      name: to.split('@')[0],
    };
    
    // Create a test campaign ID
    const testCampaignId = `test-campaign-${randomUUID()}`;
    
    // Prepare email options
    const emailOptions = {
      from: from || process.env.NEXT_PUBLIC_EMAIL_FROM || "info@marketsage.africa",
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Test Email from MarketSage</h2>
          <p>${content}</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            This is a test email sent from your MarketSage account to verify email configuration.
          </p>
          <p style="color: #666; font-size: 14px;">
            <strong>Configuration Details:</strong><br>
            Provider: ${process.env.EMAIL_PROVIDER || 'development'}<br>
            SMTP Host: ${process.env.SMTP_HOST || 'Not configured'}<br>
            SMTP Port: ${process.env.SMTP_PORT || 'Not configured'}<br>
            From: ${from || process.env.NEXT_PUBLIC_EMAIL_FROM || 'info@marketsage.africa'}
          </p>
        </div>
      `,
      replyTo: replyTo,
      metadata: {
        testEmail: true,
        sentBy: session.user?.email,
        sentAt: new Date().toISOString(),
      },
    };
    
    // Send the test email
    console.log("Sending test email to:", to);
    const result = await sendTrackedEmail(testContact, testCampaignId, emailOptions);
    console.log("Test email result:", result);
    
    if (result.success) {
      logger.info("Test email sent successfully", {
        to,
        messageId: result.messageId,
        provider: result.provider,
        sentBy: session.user?.email,
      });
      
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        details: {
          to,
          messageId: result.messageId,
          provider: result.provider,
          configuration: {
            emailProvider: process.env.EMAIL_PROVIDER || 'development',
            smtpHost: process.env.SMTP_HOST || 'Not configured',
            smtpPort: process.env.SMTP_PORT || 'Not configured',
            from: emailOptions.from,
          },
        },
      });
    } else {
      logger.error("Failed to send test email", {
        to,
        error: result.error?.message,
        provider: result.provider,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test email",
          details: result.error?.message || "Unknown error occurred",
          configuration: {
            emailProvider: process.env.EMAIL_PROVIDER || 'development',
            smtpHost: process.env.SMTP_HOST || 'Not configured',
            smtpPort: process.env.SMTP_PORT || 'Not configured',
            from: emailOptions.from,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in test email endpoint:", error);
    logger.error("Error in test email endpoint", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}