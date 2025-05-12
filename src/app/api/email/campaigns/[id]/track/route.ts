import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ActivityType, EntityType } from "@prisma/client";
import { trackConversion, ConversionTypes } from "@/lib/conversions";
import { randomUUID } from "crypto";

// Initialize Prisma client directly in this file to avoid import errors
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("cid");
    const actionType = searchParams.get("type") || "open"; // open or click
    const url = searchParams.get("url") || null;
    
    if (!contactId) {
      // If no contact ID, still send a 1x1 transparent pixel but don't track
      return new NextResponse(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        ),
        {
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }
    
    // Verify that the campaign and contact exist
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });
    
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    
    if (!campaign || !contact) {
      // Return a 1x1 transparent pixel even if invalid, but don't track
      return new NextResponse(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        ),
        {
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }
    
    // Determine the activity type based on the action
    const activityType = actionType === "click" 
      ? ActivityType.CLICKED 
      : ActivityType.OPENED;
    
    // Check if this activity already exists to prevent duplicates
    const existingActivity = await prisma.emailActivity.findFirst({
      where: {
        campaignId,
        contactId,
        type: activityType,
        // If it's a click, also check the URL to allow multiple different link clicks
        ...(actionType === "click" && url ? { metadata: { contains: url } } : {})
      },
    });
    
    if (!existingActivity) {
      // Record the activity with a generated ID
      await prisma.emailActivity.create({
        data: {
          id: randomUUID(),
          campaignId,
          contactId,
          type: activityType,
          metadata: url ? JSON.stringify({ url }) : null,
        },
      });
      
      // Track as a conversion
      await trackConversion({
        entityType: EntityType.EMAIL_CAMPAIGN,
        entityId: campaignId,
        conversionType: actionType === "click" 
          ? ConversionTypes.EMAIL_CLICK 
          : ConversionTypes.EMAIL_OPEN,
        metadata: {
          contactId,
          url: url || undefined,
        }
      });
    }
    
    // For click tracking, redirect to the target URL
    if (actionType === "click" && url) {
      return NextResponse.redirect(url);
    }
    
    // For open tracking, return a 1x1 transparent GIF
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error tracking email activity:", error);
    
    // Return a 1x1 transparent pixel even if error
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
} 