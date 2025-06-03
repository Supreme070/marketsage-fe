import { type NextRequest, NextResponse } from "next/server";
import { CampaignStatus } from "@prisma/client";
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

// Schema for campaign update validation
const campaignUpdateSchema = z.object({
  name: z.string().min(1, "Campaign name is required").optional(),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject line is required").optional(),
  from: z.string().min(1, "From address is required").optional(),
  replyTo: z.string().email().optional(),
  templateId: z.string().optional(),
  content: z.string().optional(),
  design: z.string().optional(), // JSON string
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
});

// GET email campaign by ID
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
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        lists: true,
        segments: true,
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
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Format the response to include activity counts
    const formattedCampaign = {
      ...campaign,
      statistics: {
        totalRecipients: campaign._count.activities,
      }
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    return handleApiError(error, "/api/email/campaigns/[id]/route.ts");
  }
}

// PATCH/Update email campaign by ID
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
    const existingCampaign = await prisma.emailCampaign.findUnique({
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
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingCampaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if campaign is in a state that allows updates
    if (existingCampaign.status !== CampaignStatus.DRAFT && existingCampaign.status !== CampaignStatus.PAUSED) {
      return NextResponse.json(
        { error: "Can only update campaigns in DRAFT or PAUSED status" },
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
    
    // If design is provided, validate that it's a valid JSON string
    if (mainData.design) {
      try {
        JSON.parse(mainData.design);
      } catch (e) {
        return NextResponse.json(
          { error: "Design must be a valid JSON string" },
          { status: 400 }
        );
      }
    }
    
    // If templateId is provided, check if it exists
    if (mainData.templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: mainData.templateId },
      });
      
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 400 }
        );
      }
    }
    
    // Transaction to update campaign with potential relationship changes
    const updatedCampaign = await prisma.$transaction(async (tx) => {
      const campaign = await tx.emailCampaign.update({
        where: { id: campaignId },
        data: mainData,
        include: {
          template: true,
          lists: true,
          segments: true,
        },
      });
      
      // Update list relationships if provided
      if (listIds) {
        // Disconnect all existing lists
        await tx.emailCampaign.update({
          where: { id: campaignId },
          data: {
            lists: {
              disconnect: existingCampaign.lists.map(list => ({ id: list.id })),
            },
          },
        });
        
        // Connect new lists
        if (listIds.length > 0) {
          await tx.emailCampaign.update({
            where: { id: campaignId },
            data: {
              lists: {
                connect: listIds.map(id => ({ id })),
              },
            },
          });
        }
      }
      
      // Update segment relationships if provided
      if (segmentIds) {
        // Disconnect all existing segments
        await tx.emailCampaign.update({
          where: { id: campaignId },
          data: {
            segments: {
              disconnect: existingCampaign.segments.map(segment => ({ id: segment.id })),
            },
          },
        });
        
        // Connect new segments
        if (segmentIds.length > 0) {
          await tx.emailCampaign.update({
            where: { id: campaignId },
            data: {
              segments: {
                connect: segmentIds.map(id => ({ id })),
              },
            },
          });
        }
      }
      
      // Reload the campaign with updated relationships
      const updatedCampaign = await tx.emailCampaign.findUniqueOrThrow({
        where: { id: campaignId },
        include: {
          template: true,
          lists: true,
          segments: true,
        },
      });
      
      return updatedCampaign;
    });

    return NextResponse.json(updatedCampaign);
  } catch (error: any) {
    console.error("Error updating email campaign:", error);
    
    // Special error handling for foreign key constraints
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "One or more lists or segments not found" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update email campaign" },
      { status: 500 }
    );
  }
}

// DELETE email campaign by ID
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
    const existingCampaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!existingCampaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to delete this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingCampaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if campaign has already been sent
    if (existingCampaign.status === CampaignStatus.SENT) {
      return NextResponse.json(
        { error: "Cannot delete a campaign that has been sent" },
        { status: 400 }
      );
    }
    
    // If campaign is currently sending, disallow deletion
    if (existingCampaign.status === CampaignStatus.SENDING) {
      return NextResponse.json(
        { error: "Cannot delete a campaign that is currently sending" },
        { status: 400 }
      );
    }

    // Delete the campaign and its associated activities
    await prisma.$transaction([
      // Delete any activities
      prisma.emailActivity.deleteMany({
        where: { campaignId },
      }),
      // Delete the campaign
      prisma.emailCampaign.delete({
        where: { id: campaignId },
      }),
    ]);

    return NextResponse.json({ message: "Email campaign deleted successfully" });
  } catch (error) {
    return handleApiError(error, "/api/email/campaigns/[id]/route.ts");
  }
} 