import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for campaign update validation
const campaignUpdateSchema = z.object({
  name: z.string().min(1, "Campaign name is required").optional(),
  description: z.string().optional(),
  from: z.string().min(1, "From number is required").optional(),
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      include: {
        SMSTemplate: true,
        List: true,
        Segment: true,
        SMSActivity: {
          take: 5,
          include: {
            Contact: {
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
            SMSActivity: true 
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check if user has access to this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transform the response
    const formattedCampaign = {
      ...campaign,
      template: campaign.SMSTemplate,
      lists: campaign.List,
      segments: campaign.Segment,
      activities: campaign.SMSActivity,
      statistics: {
        totalRecipients: campaign._count.SMSActivity,
        // Add more stats here if needed
      }
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error("Error fetching SMS campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS campaign" },
      { status: 500 }
    );
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // First check if campaign exists and user has access
    const existingCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      include: {
        List: true,
        Segment: true,
      }
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check if user has access to update this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
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
      updateObject.List = {
        disconnect: existingCampaign.List.map(list => ({ id: list.id })),
        connect: listIds.map(id => ({ id })),
      };
    }

    if (segmentIds) {
      updateObject.Segment = {
        disconnect: existingCampaign.Segment.map(segment => ({ id: segment.id })),
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
          SMSTemplate: true,
          List: true,
          Segment: true,
        },
      });
      
      return campaign;
    });

    // Transform the response to maintain backward compatibility
    const formattedCampaign = {
      ...updatedCampaign,
      template: updatedCampaign.SMSTemplate,
      lists: updatedCampaign.List,
      segments: updatedCampaign.Segment,
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // First check if campaign exists and user has access
    const existingCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check if user has access to delete this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
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
    console.error("Error deleting SMS campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete SMS campaign" },
      { status: 500 }
    );
  }
} 