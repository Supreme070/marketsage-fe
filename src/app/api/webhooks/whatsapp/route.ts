import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError,
  validationError 
} from "@/lib/errors";
import { z } from "zod";
import crypto from "crypto";

// Schema for WhatsApp webhook message status
const whatsAppStatusSchema = z.object({
  messaging_product: z.literal("whatsapp"),
  metadata: z.object({
    display_phone_number: z.string(),
    phone_number_id: z.string()
  }),
  statuses: z.array(z.object({
    id: z.string(),
    status: z.enum(["sent", "delivered", "read", "failed"]),
    timestamp: z.string(),
    recipient_id: z.string(),
    errors: z.array(z.object({
      code: z.number(),
      title: z.string(),
      message: z.string().optional(),
      error_data: z.object({
        details: z.string().optional()
      }).optional()
    })).optional()
  }))
});

// Schema for WhatsApp webhook verification
const verificationSchema = z.object({
  "hub.mode": z.literal("subscribe"),
  "hub.challenge": z.string(),
  "hub.verify_token": z.string()
});

// POST endpoint to handle WhatsApp delivery status webhooks
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const signature = headersList.get("x-hub-signature-256");
    const contentType = headersList.get("content-type") || "";

    // Basic security: Verify content type
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const bodyText = await request.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyText)
        .digest("hex");
      
      const actualSignature = signature.replace("sha256=", "");
      
      if (actualSignature !== expectedSignature) {
        console.error("WhatsApp webhook signature verification failed");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    console.log("WhatsApp webhook received:", body);

    // Handle different webhook entry types
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === "messages" && change.value) {
              // Handle message status updates
              if (change.value.statuses) {
                await handleStatusUpdates(change.value);
              }
              // Handle incoming messages (for future use)
              if (change.value.messages) {
                console.log("Incoming WhatsApp messages received:", change.value.messages);
                // TODO: Handle incoming messages when needed
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp webhook processed"
    });

  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return handleApiError(error, "/api/webhooks/whatsapp/route.ts");
  }
}

// GET endpoint for WhatsApp webhook verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      "hub.mode": searchParams.get("hub.mode"),
      "hub.challenge": searchParams.get("hub.challenge"),
      "hub.verify_token": searchParams.get("hub.verify_token")
    };

    console.log("WhatsApp webhook verification request:", params);

    // Validate the verification request
    const validation = verificationSchema.safeParse(params);
    
    if (!validation.success) {
      console.error("Invalid WhatsApp verification request:", validation.error);
      return new NextResponse("Invalid verification request", { status: 400 });
    }

    // Verify the token matches our configuration
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "marketsage_whatsapp_verify";
    
    if (validation.data["hub.verify_token"] !== expectedToken) {
      console.error("WhatsApp verify token mismatch");
      return new NextResponse("Verification token mismatch", { status: 403 });
    }

    // Return the challenge to verify the webhook
    console.log("WhatsApp webhook verified successfully");
    return new NextResponse(validation.data["hub.challenge"], {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      }
    });

  } catch (error) {
    console.error("Error during WhatsApp webhook verification:", error);
    return new NextResponse("Verification failed", { status: 500 });
  }
}

// Handle WhatsApp status updates
async function handleStatusUpdates(value: any) {
  try {
    const validation = whatsAppStatusSchema.safeParse(value);
    
    if (!validation.success) {
      console.error("Invalid WhatsApp status update:", validation.error);
      return;
    }

    const { statuses } = validation.data;

    for (const status of statuses) {
      const normalizedStatus = mapWhatsAppStatus(status.status);
      
      // Update WhatsApp history if exists
      await updateWhatsAppHistory({
        messageId: status.id,
        status: normalizedStatus,
        recipientPhone: status.recipient_id,
        timestamp: status.timestamp,
        errors: status.errors
      });

      // Update campaign activity if exists
      await updateWhatsAppActivity({
        messageId: status.id,
        status: normalizedStatus,
        recipientPhone: status.recipient_id,
        timestamp: status.timestamp,
        errors: status.errors
      });

      console.log("WhatsApp status processed:", {
        messageId: status.id,
        status: normalizedStatus,
        recipient: status.recipient_id
      });
    }
  } catch (error) {
    console.error("Error handling WhatsApp status updates:", error);
  }
}

// Update WhatsApp history record
async function updateWhatsAppHistory(payload: any): Promise<boolean> {
  try {
    const updated = await prisma.whatsAppHistory.updateMany({
      where: {
        messageId: payload.messageId
      },
      data: {
        status: payload.status,
        error: payload.errors ? JSON.stringify(payload.errors) : null,
        metadata: JSON.stringify({
          deliveryStatus: payload.status,
          deliveryTimestamp: payload.timestamp,
          recipientPhone: payload.recipientPhone,
          errors: payload.errors
        })
      }
    });

    return updated.count > 0;
  } catch (error) {
    console.error("Error updating WhatsApp history:", error);
    return false;
  }
}

// Update WhatsApp campaign activity
async function updateWhatsAppActivity(payload: any): Promise<boolean> {
  try {
    // Find WhatsApp activity records by messageId in metadata
    const activities = await prisma.whatsAppActivity.findMany({
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

      await prisma.whatsAppActivity.update({
        where: { id: activity.id },
        data: {
          type: payload.status === "DELIVERED" ? "DELIVERED" : 
                payload.status === "READ" ? "OPENED" :
                payload.status === "FAILED" ? "FAILED" : 
                activity.type,
          metadata: JSON.stringify({
            ...existingMetadata,
            deliveryStatus: payload.status,
            deliveryTimestamp: payload.timestamp,
            recipientPhone: payload.recipientPhone,
            errors: payload.errors
          })
        }
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating WhatsApp activity:", error);
    return false;
  }
}

// Map WhatsApp status to standard status
function mapWhatsAppStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "sent":
      return "SENT";
    case "delivered":
      return "DELIVERED";
    case "read":
      return "READ";
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}