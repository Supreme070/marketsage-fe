import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

//  Schema for schedule validation
const scheduleSchema = z.object({
  scheduledFor: z.string().refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && date > new Date();
    },
    { message: "Scheduled date must be in the future" }
  ),
});

// POST endpoint to schedule a WhatsApp campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // First check if campaign exists and user has access
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to schedule this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if campaign is in a state that allows scheduling
    if (campaign.status !== CampaignStatus.DRAFT) {
      return NextResponse.json(
        { error: `Can only schedule campaigns in DRAFT status, current status: ${campaign.status}` },
        { status: 400 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validation = scheduleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid schedule data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { scheduledFor } = validation.data;
    
    // Convert string to Date object
    const scheduledDate = new Date(scheduledFor);
    
    // Update campaign status and scheduled time
    const updatedCampaign = await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SCHEDULED,
        scheduledFor: scheduledDate,
      }
    });

    // In a production environment, you would now:
    // 1. Set up a task in your queue system to trigger at the specified time
    // 2. Configure monitoring to ensure the task executes correctly
    // 3. Implement retry mechanisms for reliability

    return NextResponse.json({
      message: "Campaign scheduled successfully",
      scheduledFor: updatedCampaign.scheduledFor
    });
  } catch (error) {
    return handleApiError(error, "/api/whatsapp/campaigns/[id]/schedule/route.ts");
  }
}

// DELETE endpoint to cancel scheduling of a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // First check if campaign exists and user has access
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if campaign is actually scheduled
    if (campaign.status !== CampaignStatus.SCHEDULED) {
      return NextResponse.json(
        { error: "Campaign is not currently scheduled" },
        { status: 400 }
      );
    }

    // Update campaign back to DRAFT status and clear scheduled time
    const updatedCampaign = await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.DRAFT,
        scheduledFor: null,
      }
    });

    return NextResponse.json({
      message: "Campaign scheduling canceled",
      status: updatedCampaign.status
    });
  } catch (error) {
    return handleApiError(error, "/api/whatsapp/campaigns/[id]/schedule/route.ts");
  }
} 