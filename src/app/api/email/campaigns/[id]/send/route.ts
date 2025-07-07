import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { sendCampaign } from "@/lib/email-service";
import { CampaignStatus } from "@prisma/client";

const sendOptionsSchema = z.object({
  useOptimalSendTime: z.boolean().optional().default(false),
});

// POST handler to send a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("=== SEND ENDPOINT ENTRY POINT ===");
  
  try {
    console.log("Send endpoint called");
    
    // Authentication check
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "exists" : "null");
    
    if (!session) {
      console.log("No session, returning 401");
      return NextResponse.json(
        { error: "You must be signed in to send campaigns" },
        { status: 401 }
      );
    }
    
    // Get campaign ID from params
    const { id: campaignId } = await params;
    console.log("Campaign ID:", campaignId);
    
    // Get request body for send options
    let body = {};
    try {
      const text = await request.text();
      if (text && text.trim() !== '') {
        body = JSON.parse(text);
      }
      console.log("Request body:", body);
    } catch (jsonError) {
      console.error("Failed to parse JSON body:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const validationResult = sendOptionsSchema.safeParse(body);
    console.log("Validation result:", validationResult);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid send options", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { useOptimalSendTime } = validationResult.data;
    
    // Check if campaign exists and can be sent
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });
    
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }
    
    // Check campaign status - only DRAFT or SCHEDULED can be sent
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      return NextResponse.json(
        { 
          error: "Campaign cannot be sent", 
          details: `Campaign is in ${campaign.status} status. Only DRAFT or SCHEDULED campaigns can be sent.` 
        },
        { status: 400 }
      );
    }
    
    // Update campaign status to SENDING
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.SENDING },
    });
    
    try {
      // Send the campaign
      console.log("Calling sendCampaign function...");
      const result = await sendCampaign(campaignId, useOptimalSendTime);
      console.log("Campaign send result:", result);
      
      return NextResponse.json(result);
    } catch (error) {
      // If sending fails, revert status to DRAFT
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.DRAFT },
      });
      
      logger.error("Error sending campaign", { error, campaignId });
      
      return NextResponse.json(
        { error: "Failed to send campaign", details: (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in campaign send endpoint:", error);
    logger.error("Error in campaign send endpoint", { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      campaignId: (await params).id
    });
    
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}