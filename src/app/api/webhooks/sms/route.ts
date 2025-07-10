import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError,
  validationError 
} from "@/lib/errors";
import { z } from "zod";

// Schema for SMS delivery status webhook payload
const smsDeliveryStatusSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  status: z.enum(["DELIVERED", "FAILED", "PENDING", "SENT", "EXPIRED", "REJECTED"]),
  phoneNumber: z.string().min(1, "Phone number is required"),
  provider: z.string().optional(),
  timestamp: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  cost: z.number().optional(),
  segments: z.number().optional(),
});

// Schema for Africa's Talking webhook format
const africasTalkingWebhookSchema = z.object({
  id: z.string(),
  status: z.string(),
  phoneNumber: z.string(),
  networkCode: z.string().optional(),
  retryCount: z.number().optional(),
  failureReason: z.string().optional(),
  cost: z.string().optional(),
});

// Schema for Twilio webhook format
const twilioWebhookSchema = z.object({
  MessageSid: z.string(),
  MessageStatus: z.string(),
  To: z.string(),
  From: z.string().optional(),
  ErrorCode: z.string().optional(),
  ErrorMessage: z.string().optional(),
});

// POST endpoint to handle SMS delivery status webhooks
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "";
    const contentType = headersList.get("content-type") || "";

    // Basic security: Verify content type
    if (!contentType.includes("application/json") && !contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    let body;
    try {
      if (contentType.includes("application/x-www-form-urlencoded")) {
        // Handle form-encoded data (common for webhooks)
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      } else {
        body = await request.json();
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    console.log("SMS webhook received:", { body, userAgent });

    // Determine provider based on user agent or payload structure
    let provider = "unknown";
    let normalizedPayload;

    // Detect Africa's Talking webhook
    if (userAgent.toLowerCase().includes("africastalking") || body.id) {
      provider = "africastalking";
      const validation = africasTalkingWebhookSchema.safeParse(body);
      
      if (!validation.success) {
        console.error("Invalid Africa's Talking webhook payload:", validation.error);
        return validationError("Invalid Africa's Talking webhook payload", validation.error.format());
      }

      const atData = validation.data;
      normalizedPayload = {
        messageId: atData.id,
        status: mapAfricasTalkingStatus(atData.status),
        phoneNumber: atData.phoneNumber,
        provider: "africastalking",
        timestamp: new Date().toISOString(),
        errorCode: atData.failureReason ? "DELIVERY_FAILED" : undefined,
        errorMessage: atData.failureReason || undefined,
        cost: atData.cost ? Number.parseFloat(atData.cost) : undefined,
        segments: 1, // Default for now
      };
    }
    // Detect Twilio webhook
    else if (userAgent.toLowerCase().includes("twilio") || body.MessageSid) {
      provider = "twilio";
      const validation = twilioWebhookSchema.safeParse(body);
      
      if (!validation.success) {
        console.error("Invalid Twilio webhook payload:", validation.error);
        return validationError("Invalid Twilio webhook payload", validation.error.format());
      }

      const twilioData = validation.data;
      normalizedPayload = {
        messageId: twilioData.MessageSid,
        status: mapTwilioStatus(twilioData.MessageStatus),
        phoneNumber: twilioData.To,
        provider: "twilio",
        timestamp: new Date().toISOString(),
        errorCode: twilioData.ErrorCode || undefined,
        errorMessage: twilioData.ErrorMessage || undefined,
        segments: 1, // Default for now
      };
    }
    // Generic webhook format
    else {
      const validation = smsDeliveryStatusSchema.safeParse(body);
      
      if (!validation.success) {
        console.error("Invalid generic SMS webhook payload:", validation.error);
        return validationError("Invalid SMS webhook payload", validation.error.format());
      }

      normalizedPayload = validation.data;
      provider = normalizedPayload.provider || "generic";
    }

    // Update SMS history record if it exists
    const historyUpdate = await updateSMSHistory(normalizedPayload);
    
    // Update campaign activity if it exists
    const activityUpdate = await updateSMSActivity(normalizedPayload);

    // Log the webhook processing
    console.log("SMS webhook processed:", {
      provider,
      messageId: normalizedPayload.messageId,
      status: normalizedPayload.status,
      historyUpdated: historyUpdate,
      activityUpdated: activityUpdate
    });

    return NextResponse.json({
      success: true,
      message: "SMS delivery status updated",
      provider,
      messageId: normalizedPayload.messageId,
      status: normalizedPayload.status
    });

  } catch (error) {
    console.error("Error processing SMS webhook:", error);
    return handleApiError(error, "/api/webhooks/sms/route.ts");
  }
}

// Function to update SMS history record
async function updateSMSHistory(payload: any): Promise<boolean> {
  try {
    // Find SMS history record by messageId
    const updated = await prisma.sMSHistory.updateMany({
      where: {
        messageId: payload.messageId
      },
      data: {
        status: payload.status,
        error: payload.errorMessage ? JSON.stringify({
          code: payload.errorCode,
          message: payload.errorMessage
        }) : null,
        metadata: JSON.stringify({
          deliveryStatus: payload.status,
          deliveryTimestamp: payload.timestamp,
          cost: payload.cost,
          segments: payload.segments,
          provider: payload.provider
        })
      }
    });

    return updated.count > 0;
  } catch (error) {
    console.error("Error updating SMS history:", error);
    return false;
  }
}

// Function to update SMS campaign activity
async function updateSMSActivity(payload: any): Promise<boolean> {
  try {
    // Find SMS activity record by messageId in metadata
    const activities = await prisma.sMSActivity.findMany({
      where: {
        metadata: {
          path: ["messageId"],
          equals: payload.messageId
        }
      }
    });

    if (activities.length === 0) {
      return false;
    }

    // Update all matching activities
    for (const activity of activities) {
      let existingMetadata = {};
      try {
        existingMetadata = typeof activity.metadata === 'string' 
          ? JSON.parse(activity.metadata) 
          : activity.metadata || {};
      } catch (e) {
        console.warn("Failed to parse activity metadata:", e);
      }

      await prisma.sMSActivity.update({
        where: { id: activity.id },
        data: {
          type: payload.status === "DELIVERED" ? "DELIVERED" : 
                payload.status === "FAILED" ? "FAILED" : 
                activity.type, // Keep original type if status is intermediate
          metadata: JSON.stringify({
            ...existingMetadata,
            deliveryStatus: payload.status,
            deliveryTimestamp: payload.timestamp,
            cost: payload.cost,
            segments: payload.segments,
            errorCode: payload.errorCode,
            errorMessage: payload.errorMessage
          })
        }
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating SMS activity:", error);
    return false;
  }
}

// Map Africa's Talking status to standard status
function mapAfricasTalkingStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "success":
    case "delivered":
      return "DELIVERED";
    case "sent":
      return "SENT";
    case "queued":
    case "buffered":
      return "PENDING";
    case "failed":
    case "rejected":
    case "expired":
      return "FAILED";
    default:
      return "PENDING";
  }
}

// Map Twilio status to standard status
function mapTwilioStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "delivered":
      return "DELIVERED";
    case "sent":
      return "SENT";
    case "queued":
    case "accepted":
      return "PENDING";
    case "failed":
    case "undelivered":
      return "FAILED";
    case "unknown":
      return "PENDING";
    default:
      return "PENDING";
  }
}

// GET endpoint for webhook health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "SMS webhook endpoint is active",
    timestamp: new Date().toISOString()
  });
}