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
import { smsService } from "@/lib/sms-providers/sms-service";

//  Schema for campaign update validation
const campaignUpdateSchema = z.object({
  name: z.string().min(1, "Campaign name is required").optional(),
  description: z.string().optional(),
  from: z.string().min(1, "From number is required").refine(
    (phone) => smsService.validatePhoneNumber(phone),
    {
      message: "Invalid sender phone number format. Must be a valid African phone number (e.g., +234XXXXXXXXX, 0XXXXXXXXXX)"
    }
  ).optional(),
  templateId: z.string().optional(),
  content: z.string().optional(),
  status: z.enum([
    "DRAFT", 
    "SCHEDULED", 
    "SENDING", 
    "SENT", 
    "CANCELLED", 
    "PAUSED", 
    "FAILED"
  ]).optional(),
  scheduledFor: z.string().optional().nullable(),
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
});

// GET SMS campaign by ID
export async function GET(
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
    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        lists: true,
        segments: true,
        activities: {
          take: 5,
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true
              }
            }
          },
          orderBy: {
            timestamp: "desc"
          }
        },
        _count: {
          select: { 
            activities: true 
          }
        }
      }
    });

    if (!campaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transform the response
    const formattedCampaign = {
      ...campaign,
      template: campaign.template,
      lists: campaign.lists,
      segments: campaign.segments,
      activities: campaign.activities,
      statistics: {
        totalRecipients: campaign._count.activities,
        // Add more stats here if needed
      }
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    return handleApiError(error, "/api/sms/campaigns/[id]/route.ts");
  }
}

// PATCH/Update SMS campaign by ID
export async function PATCH(
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
    const existingCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      include: {
        lists: true,
        segments: true,
      }
    });

    if (!existingCampaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to update this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && existingCampaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow updating sent campaigns
    if (existingCampaign.status === "SENT") {
      return NextResponse.json(
        { error: "Cannot update a campaign that has been sent" },
        { status: 400 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validation = campaignUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid campaign data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const updateData = validation.data;
    const { listIds, segmentIds, ...mainData } = updateData;
    
    // If templateId is provided, check if it exists
    if (mainData.templateId) {
      const template = await prisma.sMSTemplate.findUnique({
        where: { id: mainData.templateId },
      });
      
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 400 }
        );
      }

      // Check if user has access to this template
      if (!isAdmin && template.createdById !== session.user.id) {
        return NextResponse.json({ error: "No access to the selected template" }, { status: 403 });
      }
    }
    
    // Handle scheduledFor date if provided
    let scheduledFor = mainData.scheduledFor;
    if (scheduledFor) {
      try {
        // Validate date format
        scheduledFor = new Date(scheduledFor).toISOString();
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid date format for scheduledFor" },
          { status: 400 }
        );
      }
    }

    // Create a simplified update object to avoid Prisma type issues
    const updateObject: any = {
      ...(mainData.name && { name: mainData.name }),
      ...(mainData.description !== undefined && { description: mainData.description }),
      ...(mainData.from && { from: mainData.from }),
      ...(mainData.templateId !== undefined && { templateId: mainData.templateId }),
      ...(mainData.content !== undefined && { content: mainData.content }),
      ...(mainData.status && { status: mainData.status }),
      ...(scheduledFor !== undefined && { scheduledFor }),
    };

    // Handle list and segment relationships separately
    if (listIds) {
      updateObject.lists = {
        disconnect: existingCampaign.lists.map(list => ({ id: list.id })),
        connect: listIds.map(id => ({ id })),
      };
    }

    if (segmentIds) {
      updateObject.segments = {
        disconnect: existingCampaign.segments.map(segment => ({ id: segment.id })),
        connect: segmentIds.map(id => ({ id })),
      };
    }
    
    // Transaction to update campaign with relationships
    const updatedCampaign = await prisma.$transaction(async (tx) => {
      // Update the SMS campaign
      const campaign = await tx.sMSCampaign.update({
        where: { id: campaignId },
        data: updateObject,
        include: {
          template: true,
          lists: true,
          segments: true,
        },
      });
      
      return campaign;
    });

    // Transform the response to maintain backward compatibility
    const formattedCampaign = {
      ...updatedCampaign,
      template: updatedCampaign.template,
      lists: updatedCampaign.lists,
      segments: updatedCampaign.segments,
    };

    return NextResponse.json(formattedCampaign);
  } catch (error: any) {
    console.error("Error updating SMS campaign:", error);
    
    // Special error handling for foreign key constraints
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "One or more lists or segments not found" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update SMS campaign" },
      { status: 500 }
    );
  }
}

// DELETE SMS campaign by ID
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
    const existingCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!existingCampaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to delete this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && existingCampaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow deleting sent campaigns
    if (existingCampaign.status === "SENT") {
      return NextResponse.json(
        { error: "Cannot delete a campaign that has been sent" },
        { status: 400 }
      );
    }

    // Delete the campaign - use transaction to handle related records
    await prisma.$transaction(async (tx) => {
      // Delete campaign activities if any
      await tx.sMSActivity.deleteMany({
        where: { campaignId },
      });
      
      // Delete the campaign
      await tx.sMSCampaign.delete({
        where: { id: campaignId },
      });
    });

    return NextResponse.json({ message: "SMS campaign deleted successfully" });
  } catch (error) {
    return handleApiError(error, "/api/sms/campaigns/[id]/route.ts");
  }
} 