import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

//  Schema for WhatsApp campaign validation
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  from: z.string().min(1, "From number is required"),
  templateId: z.string().optional(),
  content: z.string().optional(),
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
});

// GET WhatsApp campaigns endpoint
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    // Different filters based on user role
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    
    // Parse query parameters
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const searchQuery = url.searchParams.get("search");
    
    // Convert status string to CampaignStatus enum if provided
    let status: CampaignStatus | undefined;
    if (statusParam) {
      try {
        status = statusParam.toUpperCase() as CampaignStatus;
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid status parameter" },
          { status: 400 }
        );
      }
    }
    
    const campaigns = await prisma.whatsAppCampaign.findMany({
      where: {
        ...(isAdmin ? {} : { createdById: session.user.id }),
        ...(status ? { status } : {}),
        ...(searchQuery ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ]
        } : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        WhatsAppTemplate: {
          select: {
            id: true,
            name: true,
          }
        },
        List: {
          select: {
            id: true,
            name: true,
          }
        },
        Segment: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { 
            WhatsAppActivity: true 
          }
        }
      },
    });

    // Transform the response
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      from: campaign.from,
      status: campaign.status,
      scheduledFor: campaign.scheduledFor,
      sentAt: campaign.sentAt,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      template: campaign.WhatsAppTemplate,
      lists: campaign.List,
      segments: campaign.Segment,
      statistics: {
        totalRecipients: campaign._count.WhatsAppActivity,
      }
    }));

    return NextResponse.json(formattedCampaigns);
  } catch (error) {
    return handleApiError(error, "/api/whatsapp/campaigns/route.ts");
  }
}

// POST endpoint to create a new WhatsApp campaign
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validation = campaignSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid campaign data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const campaignData = validation.data;
    const { listIds, segmentIds, ...mainData } = campaignData;
    const now = new Date();
    
    // If templateId is provided, check if it exists
    if (mainData.templateId) {
      const template = await prisma.whatsAppTemplate.findUnique({
        where: { id: mainData.templateId },
      });
      
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 400 }
        );
      }

      // Check if user has access to this template
      const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
      if (!isAdmin && template.createdById !== session.user.id) {
        return NextResponse.json({ error: "No access to the selected template" }, { status: 403 });
      }

      // Check if template is approved
      if (template.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Only approved templates can be used in campaigns" },
          { status: 400 }
        );
      }
    }
    
    // Either content or templateId must be provided
    if (!mainData.content && !mainData.templateId) {
      return NextResponse.json(
        { error: "Either content or template must be provided" },
        { status: 400 }
      );
    }
    
    // Transaction to create campaign with relationships
    const newCampaign = await prisma.$transaction(async (tx) => {
      // Create the WhatsApp campaign
      const campaign = await tx.whatsAppCampaign.create({
        data: {
          id: randomUUID(),
          ...mainData,
          createdById: session.user.id,
          status: CampaignStatus.DRAFT,
          createdAt: now,
          updatedAt: now,
          // Connect lists if provided
          ...(listIds && listIds.length > 0 ? {
            List: {
              connect: listIds.map(id => ({ id })),
            },
          } : {}),
          // Connect segments if provided
          ...(segmentIds && segmentIds.length > 0 ? {
            Segment: {
              connect: segmentIds.map(id => ({ id })),
            },
          } : {}),
        },
        include: {
          WhatsAppTemplate: true,
          List: true,
          Segment: true,
        },
      });
      
      return campaign;
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error: any) {
    console.error("Error creating WhatsApp campaign:", error);
    
    // Special error handling for foreign key constraints
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "One or more lists or segments not found" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create WhatsApp campaign" },
      { status: 500 }
    );
  }
} 